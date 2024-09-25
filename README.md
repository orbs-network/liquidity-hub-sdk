# **@orbs-network/liquidity-hub-sdk**

The `@orbs-network/liquidity-hub-sdk` empowers developers and integrators to seamlessly interact with the Orbs Network Liquidity Hub. With features for fetching token swap quotes and executing swaps, it’s ideal for dApp developers, exchanges, and anyone looking to integrate liquidity solutions.

---

## **Table of Contents**

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Creating SDK Instance](#creating-sdk-instance)
  - [Fetching a Quote](#fetching-a-quote)
  - [Comparing Minimum Output Amounts](#comparing-minimum-output-amounts)
  - [Performing a Swap](#performing-a-swap)
  - [Fetching Transaction Details](#fetching-transaction-details)
  - [Analytics](#analytics)

---

## **Features**

- **Real-Time Quotes**: Fetch real-time token swap quotes quickly and efficiently.
- **Token Swaps**: Execute secure token swaps through liquidity pools.
- **Error Handling**: Full error reporting and analytics for swap and quote requests.

---

## **Installation**

To install the SDK, use either `npm` or `yarn`.

### **Using NPM**

```bash
npm install @orbs-network/liquidity-hub-sdk

```

### Using Yarn

```bash
yarn add @orbs-network/liquidity-hub-sdk
```

---

## **Usage**

### **Creating SDK Instance**

To use the SDK, create an instance of the liquidity hub SDK. This instance provides the primary functionality to interact with the Orbs Network Liquidity Hub.

```typescript
import { constructSDK } from "@orbs-network/liquidity-hub-sdk";

const liquidityHubSDK = constructSDK({
  chainId: 1, // The connected chain ID (1 for mainnet)
  partner: "partnerName", // Your partner name
});
```

### Fetching a Quote

Use the getQuote function to retrieve a real-time token swap quote. For native tokens, use the wrapped token address in the fromToken field.

```typescript
const quoteArgs = {
  fromToken: "0xTokenA", // Address of the input token
  toToken: "0xTokenB", // Address of the output token
  inAmount: "1000000000000000000", // Input token amount in wei (1 token)
  account: "0xYourWalletAddress", // User's wallet address
  slippage: "0.5", // Slippage tolerance percentage
  dexMinAmountOut: "1000000000000000000", // Minimum output from DEX in wei
  signal, // Optional: Abort signal
  timeout, // Optional: Timeout in milliseconds, default is 10 seconds
};

const quote = await liquidityHubSDK.getQuote(quoteArgs);
```

### Comparing Minimum Output Amounts

After fetching a quote, you can compare the Liquidity Hub quote's minAmountOut with the DEX’s dexMinAmountOut to decide which is better for the swap.

```typescript
const isLiquidityHubBetter =
  BigInt(quote.minAmountOut) > BigInt(dexMinAmountOut);

const onSwap = () => {
  if (isLiquidityHubBetter) {
    // Swap using Liquidity Hub
  } else {
    // Swap using DEX
  }
};
```

### Performing a Swap

1. Approve allowance for the input token. Use the permit2 contract at 0x000000000022D473030F116dDEE9F6B43aC78BA3. (permit2 contract address)

2. Sign the permit data using the EIP-712 sign function.

3. Call the swap function with the quote and signature.

```typescript
const txHash = await liquidityHubSDK.swap(
  quote, // The quote obtained from `getQuote`
  "signature" // A valid EIP-712 signature for the quote's permitData
);
```

### Fetching Transaction Details

Once a swap is completed, you can fetch the transaction details using the getTransactionDetails function. This function checks the on-chain status of the transaction and returns details once it has been successfully mined.

```typescript
const txHash = "0xYourTransactionHash";  // Replace with your actual transaction hash you got from swap function

 const txDetails = await liquidityHubSDK.getTransactionDetails(txHash, quote);
---
```

### Analytics

The SDK provides built-in analytics to help track the performance of your swaps. When performing operations such as wrapping, approving, or signing, you can use the analytics callbacks.

```typescript
const analytics = await liquidityHubSDK.analytics;

try {
  analytics.onWrapRequest(); // Trigger when wrap is requested
  wrap(); // Perform the wrap operation
  analytics.onWrapSuccess(); // Trigger on successful wrap
} catch (error) {
  analytics.onWrapFailure(error.message); // Trigger on wrap failure
}
```
