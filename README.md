# @orbs-network/liquidity-hub-sdk

The `@orbs-network/liquidity-hub-sdk` allows developers and integrators to interact with the Orbs Network Liquidity Hub seamlessly. This SDK provides functionality to fetch token swap quotes and execute swaps through liquidity pools. Perfect for dApp developers, exchanges, and any other users looking to integrate liquidity solutions.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
  - [Fetching a Quote](#fetching-a-quote)
  - [Performing a Swap](#performing-a-swap)

---

## Features

- **Quote Generation**: Get real-time token swap quotes.
- **Token Swapping**: Perform secure token swaps with built-in analytics.
- **Error Handling**: Full error reporting and analytics support for swap and quote requests.

---

## Installation

To install the SDK into your project, run the following command using NPM or Yarn:

### Using NPM

```bash
npm install @orbs-network/liquidity-hub-sdk
```

### Using Yarn

```bash
yarn add @orbs-network/liquidity-hub-sdk
```

---

## usage

### Fetching a Quote 

Use the `fetchQuote` function to retrieve a real-time token swap quote.

```typescript
import { fetchQuote } from "@orbs-network/liquidity-hub-sdk";

const quoteArgs = {
  fromToken: "0xTokenA", // Address of the input token
  toToken: "0xTokenB", // Address of the output token
  inAmount: "1000000000000000000", // Amount of input token in wei (e.g., 1 token)
  account: "0xYourWalletAddress", // Address of the user
  slippage: "0.5", // Slippage tolerance percentage
  chainId: 1, // network ID (mainnet in this case)
  partner: "partnerName", // Partner name for analytics and tracking
};

const quote = await fetchQuote(quoteArgs);
console.log("Fetched Quote:", quote);
```


### Performing a Swap

Once you’ve obtained a quote, you can execute the swap using the `swap` function.

```typescript
import { swap } from "@orbs-network/liquidity-hub-sdk";

const txHash = await swap(
  quote, // The quote obtained from `fetchQuote`
  "signature", // A valid EIP712 signature of the quote.permitData 
  1 // Chain ID (Ethereum mainnet)
);

console.log("Transaction successful:", tx);
```

---