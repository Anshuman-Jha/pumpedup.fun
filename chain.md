# ⛓️ How to Connect to Sepolia Testnet

Your browser console shows you are currently connected to **Avalanche (Chain ID 43114)**.
You need to switch to **Ethereum Sepolia (Chain ID 11155111)** to use this app.

Here is how to set it up in the most popular wallets.

---

## 🦊 1. MetaMask (Recommended)

MetaMask hides test networks by default. You need to enable them.

### Step-by-Step:
1.  Open MetaMask.
2.  Click the **Network Dropdown** (top-left corner, usually says "Ethereum Mainnet").
3.  Look for a toggle switch named **"Show test networks"**. Turn it **ON**.
    -   *If you don't see it:* Go to **Settings** -> **Advanced** -> Toggle **"Show test networks"** to ON.
4.  Now, open the Network Dropdown again.
5.  Select **Sepolia** (or "Sepolia Test Network").

### Video Tutorial:
[How to Add Sepolia to MetaMask (YouTube)](https://www.youtube.com/watch?v=sEaPrvDqSxc)

---

## 👻 2. Phantom Wallet

Phantom recently added support for Ethereum and Polygon, but testnet settings can be tricky.

### Step-by-Step:
1.  Open Phantom.
2.  Go to **Settings** (Gear Icon).
3.  Click **"Developer Settings"**.
4.  Toggle **"Testnet Mode"** to **ON**.
5.  Go back to the main wallet screen.
6.  Click the network icon (top) or the globe icon and switch from "Ethereum Mainnet" to **Sepolia**.

---

## 🔺 3. Core Wallet (Avalanche)

Core is built for Avalanche but supports all EVM chains.

### Step-by-Step:
1.  Open Core.
2.  Click the **Network Name** at the top.
3.  Typically, Core filters for "Mainnets" only.
4.  You usually need to **Manually Add** Sepolia if it doesn't appear in the "Testnet" tab.
    -   **Network Name:** Sepolia
    -   **RPC URL:** `https://rpc.sepolia.org` (or `https://eth-sepolia.g.alchemy.com/v2/demo`)
    -   **Chain ID:** `11155111`
    -   **Currency Symbol:** `ETH`
    -   **Explorer:** `https://sepolia.etherscan.io`

---

## ⚡ Troubleshooting
If you are still stuck on **Avalanche (43114)**:
1.  **Disconnect:** Click "Disconnect" in your wallet for the site `pumpedup-fun.vercel.app`.
2.  **Reload:** Refresh the page.
3.  **Connect:** Click "Connect Wallet" on the site.
4.  **Auto-Switch:** The site should pop up a request to "Allow this site to switch the network?". **Click Approve.**
