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
  }

  function toggleTrade(token) {
    setToken(token)
    showTrade ? setShowTrade(false) : setShowTrade(true)
  }

  async function switchNetwork() {
    alert("Step 1: Function started");
    console.log("Switching network...");

    if (!window.ethereum) {
      alert("Error: No crypto wallet found!");
      return;
    }

    alert("Step 2: Wallet found. Requesting access...");

    try {
      // Request account access if needed (prevents 4100 error)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      alert("Step 3: Access granted to: " + accounts[0]);

      alert("Step 4: Requesting switch to Sepolia (ID: 0xaa36a7)...");
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });

      alert("Step 5: Switch request sent! Check your wallet popup.");
      window.location.reload();
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

          alert("Network added! Reloading page...");
          window.location.reload();
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
          alert("Failed to add network: " + (addError.message || JSON.stringify(addError)));
        }
      } else {
        alert("Failed to switch network. details: " + errorMsg);
      }
    }
  }

  async function loadBlockchainData() {
    // Use MetaMask for our connection
    if (!window.ethereum) {
      console.log("No wallet found")
      return
    }

    // Mock Tokens Definition
    const mockTokens = [
      {
        token: "0x0000000000000000000000000000000000000000",
        name: "Assassin Doge",
        creator: account || "0x1234567890123456789012345678901234567890",
        sold: 50n,
        raised: ethers.parseUnits("5", 18),
        isOpen: true,
        image: "https://pump.mypinata.cloud/ipfs/QmPPhPbe9t5AKkBgBP4uon7aBdwLzukdS5PJoujC4YjJBj",
        isMock: true
      },
      {
        token: "0x0000000000000000000000000000000000000001",
        name: "Cyber Cat",
        creator: "0xMockUser1",
        sold: 80n,
        raised: ethers.parseUnits("20", 18),
        isOpen: true,
        image: "https://pump.mypinata.cloud/ipfs/QmZ4ea3wmwzwYwyWnhzs35hyxw4YryWB82TknGY3L5Wbxn",
        isMock: true
      },
      {
        token: "0x0000000000000000000000000000000000000002",
        name: "Moon Rocket",
        creator: "0xMockUser2",
        sold: 95n,
        raised: ethers.parseUnits("90", 18),
        isOpen: true,
        image: "https://pump.mypinata.cloud/ipfs/QmfFEKp9zFzTmcDjHLXi5H6E5dnKn8NjeaT5ZN2yenFfUR",
        isMock: true
      },
      {
        token: "0x0000000000000000000000000000000000000003",
        name: "Golden Pepe",
        creator: "0xMockUser3",
        sold: 10n,
        raised: ethers.parseUnits("1", 18),
        isOpen: true,
        image: "https://pump.mypinata.cloud/ipfs/QmdwMz7LDs42JoUxz1E9fyWjRwi9dLE1R8HEGDc4EdTvty",
        isMock: true
      }
    ]

    const provider = new ethers.BrowserProvider(window.ethereum)
    setProvider(provider)

    // Get the current network
    const network = await provider.getNetwork()

    // Create reference to Factory contract
    const chainId = network.chainId.toString();
    console.log("Detected Chain ID:", chainId);
    console.log("Available Config Chains:", Object.keys(config));

    if (!config[chainId]) {
      // Even if network is wrong, show mock tokens!
      setTokens(mockTokens)
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

    // Append Mock Tokens
    tokens.push(...mockTokens)

    // We reverse the array so we can get the most
    // recent token listed to display first
    setTokens(tokens.reverse())
  }

  useEffect(() => {
    loadBlockchainData()
  }, [showCreate, showTrade])

  return (
    <div className="page">
      <Header account={account} setAccount={setAccount} />

      <main>
        <div className="create">
          <button onClick={!factory ? () => switchNetwork() : !account ? null : toggleCreate} className="btn--fancy">
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
