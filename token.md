# How to List Your Token on Assassin Assemble

Welcome to Assassin Assemble! Listing your own memecoin is simple and permissionless. Follow these steps to get your token live on the platform.

## Prerequisites

1.  **MetaMask Wallet**: Ensure you have the [MetaMask](https://metamask.io/) browser extension installed.
2.  **Sepolia ETH**: You need Sepolia Testnet ETH to pay for the listing fee and gas. You can get free Sepolia ETH from faucets like [Alchemy](https://sepoliafaucet.com/) or [Infura](https://www.infura.io/faucet/sepolia).

## Step-by-Step Guide

### 1. Connect Your Wallet
- Click the **[ connect ]** button in the top right corner of the page.
- Approve the connection request in your MetaMask wallet.
- If you are not on the Sepolia network, the site will prompt you to switch.

### 2. Initiate Listing
- Once connected, click the **[ start a new token ]** button on the homepage.
- This will open the listing form.

### 3. Enter Token Details
- **Name**: Enter the name of your token (e.g., "Assassin Doge").
- **Ticker**: Enter the ticker symbol (e.g., "ASD").

### 4. Pay the Fee
- The current listing fee is displayed on the form (e.g., 0.01 ETH).
- Click **[ list ]**.
- Confirm the transaction in your MetaMask wallet.

### 5. Launch!
- Once the transaction is confirmed on the blockchain, your token will automatically appear in the "new listings" section.
- You can now trade your token and share the link with others!

> [!NOTE]
> Listing is instantaneous once the transaction is mined. If you don't see your token immediately, try refreshing the page after a few seconds.



Debugging Network Switch Failure
Context
The user is experiencing a Failed to switch to Sepolia. Code: undefined error. This suggests the error object thrown by wallet_switchEthereumChain does not have a standard code property, or it is being swallowed/modified by the browser/wallet environment.

Goal
Reliably switch the user to the Sepolia network, handling edge cases where the network might not be added or the error code is non-standard.

Proposed Changes
app/page.js
Enhanced Error Logging:

Update the catch block in 
switchNetwork
 to alert the full stringified error object. This will reveal if the error information is nested (e.g., error.data.originalError).
Robust Fallback:

If the switch fails (regardless of the specific error code, unless it's a clear "User Rejected"), usually it implies the network might be missing or there's a connection issue.
I will add a prompt: "Switch failed. Attempt to add Sepolia network?"
If accepted, it will trigger wallet_addEthereumChain.
Verification Plan
Manual Verification
User clicks [ switch to sepolia ].
If the standard switch works -> Success.
If it fails with Code: undefined:
The new alert should show the full error details.
The code should automatically proceed (or prompt) to try adding the network.
User accepts the "Add Network" request in MetaMask.
Page auto-reloads and button updates to [ start a new token ].





Debugging Analysis: Network & Connection Issues
This document explains the series of errors we encountered, why they happened, and how we solved them. I've included my "thinking process" to help you understand how to approach similar problems in the future.

1. The ABI Error (abi is not iterable)
The Error
TypeError: abi is not iterable
Why it happened
When we tried to create the contract connection:

// OLD CODE
import Factory from "./abis/Factory.json"
const factory = new ethers.Contract(address, Factory, provider)
We were passing the entire JSON file object (which contains abi, bytecode, contractName, etc.) to ethers.Contract. However, ethers.Contract expects just the list of functions (the ABI array). Because the whole object isn't a list (iterable), it crashed.

The Fix
We accessed the specific .abi property:

// NEW CODE
const factory = new ethers.Contract(address, Factory.abi, provider)
Thinking Process
Read the error: "not iterable" usually means "I expected a list/array but got an object or null".
Check the inputs: I looked at the line new ethers.Contract(..., Factory, ...) and then checked 
Factory.json
.
Realization: 
Factory.json
 was a Hardhat artifact (big object), not just the ABI array.
2. Silent Network Switch Failure (Code: undefined)
The Error
Clicking [ switch to sepolia ] seemingly did nothing, or stopped at "Step 5" alerts without changing the network. The console showed an error with Code: undefined.

Why it happened
Missing Network: Your MetaMask likely didn't have "Sepolia" configured as a network it "knows" about yet.
Browser Behavior: When we tried to switch to a missing network (wallet_switchEthereumChain), it threw an error. Usually, this error has code 4902 ("Chain not found"). However, sometimes (depending on the wallet/browser version), the error code might be missing or different, so our specific check if (error.code === 4902) was failing to catch it.
No Feedback: Since we didn't catch the "undefined" error, the code just stopped, and we never reached the part where we ask to add the network.
The Fix
We made the error handling "smarter" and more robust:

// If code is 4902 OR if there IS no code (undefined)
if (switchError.code === 4902 || !switchError.code) {
    // Try to ADD the network
    await window.ethereum.request({ method: 'wallet_addEthereumChain', ... })
}
And we verified it by adding alert() popups to see exactly where the code stopped.

Thinking Process
Isolate: I added alerts ("Step 1", "Step 2"...) to find exactly which line failed.
Observe: It failed at the "Switch" request.
Hypothesis: If it fails to switch, it usually means the network acts like it doesn't exist.
Solution: Force the code to try "Adding" the network if "Switching" fails for any reason (except user rejection).
3. The Listener Conflict (this[#x][e]?.addListener is not a function)
The Error
TypeError: this[#x][e]?.addListener is not a function
Why it happened
This is a more complex "race condition" or conflict.

Ethers.js (the library we use) tries to manage the connection to MetaMask. It sets up its own listeners to watch for network changes.
Our Code manually added extra listeners: window.ethereum.on('chainChanged', ...) in 
app/page.js
.
Conflict: In React, components "mount" and "unmount" frequently (especially in development). If we don't clean up our manual listeners perfectly, or if Ethers tries to wrap window.ethereum while we are also using it directly, they can conflict. The error specifically looks like internal Ethers code trying to call a function on an object that wasn't what it expected.
The Fix
We simplified. We removed our manual event listeners from 
app/page.js
 and wrapped the 
Header.js
 connection logic in a try/catch block.

// Header.js
try {
  await window.ethereum.request(...)
} catch (error) {
  // Gracefully handle failure instead of crashing the app
  alert("Failed to connect")
}
Thinking Process
Analyze: The error was inside the library internals (minified code this[#x]...), which suggests we are using the library incorrectly or conflicting with it.
Simplify: Do we need those manual listeners in 
page.js
 right now? Not strictly. Ethers often handles state.
Test: Removing the conflicting code is often the best way to fix instability.
Summary for Beginners
Check your Data Types: Like the ABI error, always make sure you are passing the exact data format a function expects (Array vs Object).
Alerts are your Friend: When code fails silently, add alert("Step 1"), alert("Step 2") to trace the path.
Handle "Happy" and "Unhappy" Paths: Don't just program for when things work. Program for "What if the user doesn't have this network?" (The Fallback).
Simplicity is Key: If you have obscure errors, try removing complex "extra" features (like manual event listeners) to see if that stabilizes the core features.
