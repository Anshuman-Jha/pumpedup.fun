import { ethers } from "ethers"

function Header({ account, setAccount }) {
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

  return (
    <header>
      <p className="brand">pumpedup.fun</p>

      {account ? (
        <button onClick={connectHandler} className="btn--fancy">[ {account.slice(0, 6) + '...' + account.slice(38, 42)} ]</button>
      ) : (
        <button onClick={connectHandler} className="btn--fancy">[ connect ]</button>
      )}
    </header>
  );
}

export default Header;