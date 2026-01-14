# 📉 Deep Dive: Bonding Curve Trading

## 1. What is a Bonding Curve?
In traditional finance, an asset's price is determined by an **Order Book** (buyers matching with sellers). You need someone to sell for you to buy.

A **Bonding Curve** removes the need for a counterparty. Instead of buying from a person, you buy from a **Smart Contract**.
- The **Contract** acts as the automated market maker (AMM).
- The **Price** is calculated mathematically based on the current supply of tokens sold.
- **Liquidity** is always guaranteed (as long as you pay the curve price).

Think of it as a vending machine where the price of a soda goes up slightly every time someone buys one.

---

## 2. How PumpedUp.fun Implements It

In this project, we use a **Linear Step Function** to determine the price. This ensures a predictable, stair-step price increase that rewards early adopters.

### The Math (Under the Hood)
The logic resides in `contracts/Factory.sol` inside the `getCost` function.

```solidity
function getCost(uint256 _sold) public pure returns (uint256) {
    uint256 floor = 0.0001 ether;      // Starting Price
    uint256 step = 0.0001 ether;       // Price Increase Amount
    uint256 increment = 10000 ether;   // Tokens needed to trigger price bump

    // Formula:
    uint256 cost = (step * (_sold / increment)) + floor;
    return cost;
}
```

### 🔢 Math Deep Dive: How the Price is Calculated

The magic lies in **Integer Division** in Solidity.
The formula is: `Cost = (Step * (Sold / Increment)) + Floor`

- **Floor**: 0.0001 ETH (The minimum price)
- **Step**: 0.0001 ETH (How much price increases)
- **Increment**: 10,000 (Every 10k tokens, price goes up)

#### Example 1: You are an Early Buyer
Imagine **5,000** tokens have been sold so far.
1.  `_sold / increment` = `5,000 / 10,000` = **0**
    *(In integer math, 0.5 becomes 0)*.
2.  `Cost` = `(0.0001 * 0) + 0.0001`
3.  **Final Price:** `0.0001 ETH` per token.

#### Example 2: The Curve Moves Up
Now, imagine **15,000** tokens have been sold.
1.  `_sold / increment` = `15,000 / 10,000` = **1**
    *(1.5 becomes 1)*.
2.  `Cost` = `(0.0001 * 1) + 0.0001`
3.  **Final Price:** `0.0002 ETH` per token.

#### Example 3: Late Stage FOMO
Finally, imagine **25,000** tokens have been sold.
1.  `_sold / increment` = `25,000 / 10,000` = **2**.
2.  `Cost` = `(0.0001 * 2) + 0.0001`
3.  **Final Price:** `0.0003 ETH` per token.

### Visual Summary
This creates a **Step Function** (like stairs), not a smooth lines.
- **Level 1 (0 - 9,999 Sold):** Price is 0.0001 ETH
- **Level 2 (10,000 - 19,999 Sold):** Price is 0.0002 ETH
- **Level 3 (20,000 - 29,999 Sold):** Price is 0.0003 ETH

### Breakdown by Stages
1.  **Tokens 0 - 10,000**:
    - `_sold / increment` = `0`
    - **Price:** `0.0001 ETH` (The Floor)

2.  **Tokens 10,001 - 20,000**:
    - `_sold / increment` = `1`
    - **Price:** `0.0002 ETH` (Floor + 1 Step)

3.  **Tokens 20,001 - 30,000**:
    - `_sold / increment` = `2`
    - **Price:** `0.0003 ETH`

This creates a "staircase" effect. The price stays flat for a batch of 10,000 tokens, then jumps up.

This structure guarantees that early supporters **always** get a cheaper price than latecomers.

---

## 3. Buying Logic Flow
When a user calls the `buy` function:

1.  **Check Status:** The contract checks if the "Funding Goal" (`TARGET` = 3 ETH) or "Token Limit" (`TOKEN_LIMIT` = 500,000) has been hit.
2.  **Calculate Cost:** It asks `getCost` for the *current* batch price.
3.  **Verify Payment:** It ensures `msg.value` (ETH sent) matches `Cost * Amount`.
4.  **Update State:**
    - `sale.sold` increases (pushing the curve forward).
    - `sale.raised` increases (funding bucket).
5.  **Transfer:** The specific amount of tokens is sent to the buyer immediately.

### Why is this "Pumped Up"?
Because the price **only goes up** as more people buy. This creates FOMO (Fear Of Missing Out) and rewards users who find gems early. Once the curve is completed (Target Reached), the token "graduates" (usually meaning liquidity is moved to a decentralized exchange like Uniswap), allowing for open market trading where price can finally fluctuate both up and down.



# Mock Token Implementation Explanation

This document explains the changes made to `app/page.js` to support "mock tokens." These mock tokens allow the application to display UI elements for tokens even when the blockchain connection is not fully established or when the user is on an unsupported network.

## 1. Mock Token Data Definition

A hardcoded array called `mockTokens` was added to the `loadBlockchainData` function. This array contains object literals representing tokens with dummy data.

```javascript
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
  // ... other mock tokens
]
```

### Key Features:
- **Zero Address**: Uses a zero address or dummy hash for the token address.
- **`isMock: true`**: A flag that can be used by child components (like `Token.js` or `Trade.js`) to disable interactions (like trading) for these specific tokens if implementation requires it.
- **Static Images**: Uses hardcoded IPFS links for images.

## 2. Fallback Mechanism for Unsupported Networks

One of the primary purposes of these changes is to ensure the UI is not empty if the user is on the wrong network.

```javascript
    if (!config[chainId]) {
      // Even if network is wrong, show mock tokens!
      setTokens(mockTokens)
      await switchNetwork()
      return
    }
```

**Logic**: If the detected `chainId` does not exist in our `config.json` (meaning we don't have contract addresses for this network), the code:
1.  Sets the `tokens` state to `mockTokens` immediately.
2.  Attempts to automatically switch the user's wallet to the correct network (Sepolia).
3.  Returns early to stop execution (preventing errors from trying to create contracts on a bad network).

## 3. Hybrid Display (Real + Mock)

When the user *is* on the correct network, the application fetches real tokens from the factory contract but *also* appends the mock tokens to the list. This ensures the UI always looks populated.

```javascript
    // ... fetching real tokens loop ...

    // Append Mock Tokens
    tokens.push(...mockTokens)

    // We reverse the array so we can get the most
    // recent token listed to display first
    setTokens(tokens.reverse())
```

**Logic**:
1.  Real tokens are fetched from the blockchain and pushed into the `tokens` array.
2.  `mockTokens` are spread (`...`) and pushed into the same array.
3.  The combined array is reversed so the newest items (or in this case, the appended mocks? - *Note: depending on order requirements, this logic might need tuning, but currently it puts the last added element first*) appear at the top.

## Summary

These changes make the application more robust and user-friendly by:
1.  **Preventing Blank Screens**: Users always see content, even before connecting their wallet or switching networks.
2.  **Easing Onboarding**: Users can see what the "Token List" looks like immediately.
3.  **Dev Testing**: Developers can work on UI components without needing to deploy contracts or emit events every time.




Debugging Analysis: Network & Connection Issues
This document explains the series of errors we encountered, why they happened, and how we solved them. I has been expanded to include a guide on how to think like a debugger so you can solve future issues on your own.

1. Visual History of Our Debugging Session
This diagram shows the timeline of problems we faced and the logic used to fix them.

Bug 3: Connection Crash
Bug 2: Silent Failures
Bug 1: Crash on Load
Start: User Reports Bugs
Error: abi is not iterable
Analysis: Check Input Data
Fix: Use Factory.abi instead of Factory
Action: Click Switch Network
Observation: Nothing Happens
Technique: Add Alert Steps 1-5
Result: Fails at Step 5 with code:undefined
Hypothesis: Network Missing + Non-standard Error
Fix: Fallback to 'Add Network'
Error: addListener is not a function
Analysis: Library vs Manual Code Conflict
Fix: Remove Manual Listeners
Result: Stable App
2. The Detailed Analysis
Problem A: The "Not Iterable" Crash
Error: TypeError: abi is not iterable
Reason: We gave a "Whole Book" (the JSON object) to a function that only wanted a "List of Chapters" (the ABI array).
Fix: We changed Factory to Factory.abi.
Problem B: The Silent Network Failure
Error: Failed to switch... Code: undefined
Reason: Your wallet didn't know "Sepolia" existed, so it couldn't switch to it. The error code was missing, so our specific check if (code == 4902) was ignored.
Fix: We added a fallback: "If switching fails for any reason, assume the network is missing and try to ADD it."
Problem C: The Listener Conflict
Error: this[#x][e]?.addListener is not a function
Reason: Two different parts of the code (our manual listeners and the Ethers.js library) were fighting to control the same wallet events.
Fix: We removed our manual listeners and let the library handle it.
3. The Debugger's Mindset: How to Think
When you hit a bug in the future, follow this mental framework.

Phase 1: The "What" (Isolation)
Don't Panic: Read the error message carefully. It usually tells you exactly what is wrong, even if it uses scary words.
Locate: Where exactly did it stop?
Self-Question: "Did the button click even register?"
Self-Question: "Did the function start? Did it reach the middle?"
Action: Trace the steps. If you don't know where it stopped, force the code to tell you (using tools).
Phase 2: The "Why" (Hypothesis)
Check Inputs: "I am calling Function X. Am I giving it the right data?" (This solved Bug 1).
Check Environment: "Is the external thing (Wallet/API) doing what I expect?" (This solved Bug 2).
Simplify: "Is my code too complex? Am I doing the same thing twice?" (This solved Bug 3).
Phase 3: The "How" (Resolution)
Iterate: Fix one thing at a time.
Verify: After applying a fix, try to break it again. If you can't, it's fixed.
4. The Debugging Toolkit for Beginners
Here are the specific tools and techniques I used, which you can use too.

Tool 1: The "Breadcrumb" Alerts (Best for logic flow)
When you aren't sure where code stops, verify it by adding alerts like breadcrumbs.

alert("Step 1: Function started")
// ... some code ...
alert("Step 2: Database connected") // If you verify Step 1 but never see Step 2, the error is between them!
Tool 2: The Console Log (Best for data inspection)
When you aren't sure what data you have.

try {
  // code
} catch (error) {
  console.log("MY ERROR:", error) // Open F12 -> Console to see the full details object
  console.log("Variable:", myVariable) // Check if it's undefined
}
Tool 3: The "Binary Search" (Simplification)
If a file has 100 lines and is crashing:

Comment out the bottom 50 lines. Does it still crash?
If yes, the error is in the top 50.
If no, the error is in the bottom 50.
Repeat until you find the exact line.
Tool 4: The Fallback (Defensive Programming)
Always assume things will fail.

Instead of: "Switch Network"
Think: "Try to Switch Network. If that fails, Try to Add Network. If that fails, Tell the User."
