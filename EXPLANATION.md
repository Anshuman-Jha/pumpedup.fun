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
