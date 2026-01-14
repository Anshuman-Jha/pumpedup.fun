"use client"

import { useEffect, useState } from "react"
import { ethers } from 'ethers'

// Components
import Header from "./components/Header"
import List from "./components/List"
import Token from "./components/Token"
import Trade from "./components/Trade"

// ABIs & Config
import Factory from "./abis/Factory.json"
import config from "./config.json"
import images from "./images.json"

export default function Home() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [factory, setFactory] = useState(null)
  const [fee, setFee] = useState(0)
  const [tokens, setTokens] = useState([])
  const [token, setToken] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showTrade, setShowTrade] = useState(false)

  function toggleCreate() {
    showCreate ? setShowCreate(false) : setShowCreate(true)
    if (!showCreate) setShowTrade(false) // Close trade if opening create
  }

  function toggleTrade(token) {
    setToken(token)
    showTrade ? setShowTrade(false) : setShowTrade(true)
    if (!showTrade) setShowCreate(false) // Close create if opening trade
  }

  async function switchNetwork() {
    if (!window.ethereum) {
      alert("Error: No crypto wallet found!");
      return;
    }

    try {
      // Request account access if needed
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });

      // window.location.reload(); // Removed to prevent connection loss
      await loadBlockchainData(); // Refresh state directly
    } catch (switchError) {
      // 1. Log the full error for debugging
      console.error("Switch Network Error:", switchError);
      const errorMsg = switchError.message || JSON.stringify(switchError);

      // 2. Check for "User Rejected" specifically
      if (switchError.code === 4001) {
        alert("You rejected the network switch.");
        return;
      }

      // 3. Fallback: If code is 4902 (Chain not found) OR undefined/generic error
      //    we attempt to ADD the network.
      if (switchError.code === 4902 || !switchError.code) {
        try {
          alert("Switch failed (Network likely missing). Attempting to add Sepolia...");

          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia',
                rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/demo'],
                nativeCurrency: {
                  name: 'Sepolia Ether',
                  symbol: 'SEP',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });

          alert("Network added! Refreshing...");
          // window.location.reload(); // Removed
          await loadBlockchainData();
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
          alert("Failed to add network: " + (addError.message || JSON.stringify(addError)));
        }
      } else {
        alert("Failed to switch network. details: " + errorMsg);
      }
    }
  }

  async function connectHandler() {
    if (!window.ethereum) {
      alert("Please install MetaMask to connect.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.getAddress(accounts[0])
      setAccount(account);
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Failed to connect: " + error.message);
    }
  }

  async function loadBlockchainData() {
    // Use MetaMask for our connection
    if (!window.ethereum) {
      console.log("No wallet found")
      return
    }

    // Check for already connected accounts
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log("DEBUG: eth_accounts result:", accounts);
      if (accounts.length > 0) {
        const accountAddress = ethers.getAddress(accounts[0]);
        console.log("DEBUG: Found account:", accountAddress);
        setAccount(accountAddress);
      } else {
        console.log("DEBUG: No accounts found via eth_accounts");
      }
    } catch (err) {
      console.error("DEBUG: Error checking accounts:", err);
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    setProvider(provider)

    // Get the current network
    const network = await provider.getNetwork()
    console.log("DEBUG: Current network:", network);

    // Create reference to Factory contract
    const chainId = network.chainId.toString();
    console.log("Detected Chain ID:", chainId);
    console.log("Available Config Chains:", Object.keys(config));

    if (!config[chainId]) {
      setTokens([])

      // Do not auto-switch, let user click the button.
      // await switchNetwork() 
      return
    }

    let tokens = []
    try {
      const factory = new ethers.Contract(config[chainId].factory.address, Factory.abi, provider)
      setFactory(factory)

      // Fetch the fee
      const fee = await factory.fee()
      setFee(fee)

      // Prepare to fetch token details
      const totalTokens = await factory.totalTokens()

      // We'll get the first 6 tokens listed
      for (let i = 0; i < totalTokens; i++) {
        if (i == 6) {
          break
        }

        const tokenSale = await factory.getTokenSale(i)

        // We create our own object to store extra fields
        // like images
        const token = {
          token: tokenSale.token,
          name: tokenSale.name,
          creator: tokenSale.creator,
          sold: tokenSale.sold,
          raised: tokenSale.raised,
          isOpen: tokenSale.isOpen,
          image: images[i]
        }

        tokens.push(token)
      }
    } catch (error) {
      console.error("Error fetching blockchain data:", error)
      // Even if real data fails, we can continue to show mocks
    }

    // We reverse the array so we can get the most
    // recent token listed to display first
    setTokens(tokens.reverse())
  }

  useEffect(() => {
    loadBlockchainData()

    // Setup listeners
    if (window.ethereum) {
      try {
        // Some wallets/extensions might not implement the standard EventEmitter interface fully
        if (typeof window.ethereum.on === 'function') {
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
          window.ethereum.on('accountsChanged', () => {
            window.location.reload();
          });
        }
      } catch (err) {
        console.warn("Failed to setup ethereum listeners:", err);
      }
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        try {
          window.ethereum.removeAllListeners('chainChanged');
          window.ethereum.removeAllListeners('accountsChanged');
        } catch (e) {
          // ignore cleanup errors
        }
      }
    }
  }, [showCreate, showTrade])

  return (
    <div className="page">
      <Header account={account} setAccount={setAccount} />

      <main>
        <div className="create">
          <button onClick={!factory ? () => switchNetwork() : !account ? connectHandler : toggleCreate} className="btn--fancy">
            {!factory ? (
              "[ switch to sepolia ]"
            ) : !account ? (
              "[ please connect ]"
            ) : (
              "[ start a new token ]"
            )}
          </button>
        </div>

        <div className="listings">
          <h1>new listings</h1>

          <div className="tokens">
            {!account ? (
              <p>please connect wallet</p>
            ) : tokens.length === 0 ? (
              <p>No tokens listed</p>
            ) : (
              tokens.map((token, index) => (
                <Token
                  toggleTrade={toggleTrade}
                  token={token}
                  key={index}
                />
              ))
            )}
          </div>
        </div>

        {showCreate && (
          <List toggleCreate={toggleCreate} fee={fee} provider={provider} factory={factory} />
        )}

        {showTrade && (
          <Trade toggleTrade={toggleTrade} token={token} provider={provider} factory={factory} />
        )}
      </main>
    </div>
  );
}
