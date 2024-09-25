# @orbs-network/liquidity-hub-sdk

The `@orbs-network/liquidity-hub-sdk` allows developers and integrators to interact with the Orbs Network Liquidity Hub seamlessly. This SDK provides functionality to fetch token swap quotes and execute swaps through liquidity pools. Perfect for dApp developers, exchanges, and any other users looking to integrate liquidity solutions.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Fetching a Quote](#fetching-a-quote)
  - [Using analytics](#useing-analytics)
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
If the input token is native, use the wrapped token address for the `fromToken` field.

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
  dexMinAmountOut: "1000000000000000000", // The minimum amount of output token that the dex router can guarantee
};

const quote = await fetchQuote(quoteArgs);
console.log("Fetched Quote:", quote);
```


### Performing a Swap

Once you’ve obtained a quote, you can execute the swap using the `swap` function.
Make sure to provide a valid EIP712 signature of the quote.permitData as the second argument.
Make sure to approve allowance for the input token before calling the `swap` function, spender contract is 
0x000000000022D473030F116dDEE9F6B43aC78BA3 (permit2 contract address)

we suggest to use our analytics callbacks, to get more insights about the swap.

```typescript
import { swap } from "@orbs-network/liquidity-hub-sdk";

const txHash = await swap(
  quote, // The quote obtained from `fetchQuote`
  "signature", // A valid EIP712 signature of the quote.permitData 
  1 // Chain ID (Ethereum mainnet)
);

console.log("Transaction successful:", tx);
```



### Fetching Transaction Details After a Swap

Once a swap is completed, you can fetch the transaction details using the `getTxDetails` function. This will check the transaction status on-chain and return the details if the transaction has been successfully mined.

```typescript
import { getTxDetails } from "@orbs-network/liquidity-hub-sdk";

// Example usage
const txHash = "0xYourTransactionHash";  // Replace with your actual transaction hash
const chainId = 1;  

try {
  const txDetails = await getTxDetails(txHash, chainId, quote);
  
  // Destructure the response to extract the fields
  const { status, exactOutAmount, gasCharges } = txDetails;

  if (status.toLowerCase() === "mined") {
    console.log("Transaction mined successfully!");
    console.log("Exact Output Amount:", exactOutAmount);
    console.log("Gas Charges:", gasCharges);
  } else {
    console.log("Transaction status:", status);
  }
} catch (error) {
  console.error("Error fetching transaction details:", error.message);
}

---