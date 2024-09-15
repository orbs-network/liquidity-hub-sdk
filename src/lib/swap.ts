import { swapAnalytics } from "./analytics";
import { Quote } from "./quote";
import { counter, getApiUrl, delay } from "./util";

interface Args {
  signature: string;
  inTokenAddress: string;
  outTokenAddress: string;
  fromAmount: string;
  quote?: Quote;
  account: string;
  chainId: number;
  apiUrl: string;
  dexTx?: any;
}

const swapX = async (args: Args) => {
  const { account, chainId, apiUrl } = args;

  const count = counter();
  swapAnalytics.onSwapRequest();
  try {
    if (!args.quote) {
      throw new Error("Missing quote");
    }
    const response = await fetch(`${apiUrl}/swap-async?chainId=${chainId}`, {
      method: "POST",
      body: JSON.stringify({
        ...args.quote,
        inToken: args.inTokenAddress,
        outToken: args.outTokenAddress,
        inAmount: args.fromAmount,
        user: account,
        signature: args.signature,
        dexTx: args.dexTx,
      }),
    });
    const swap = await response.json();
    if (!swap) {
      throw new Error("Missing swap response");
    }
    if (swap.error) {
      throw new Error(swap.error);
    }
    if (!swap.txHash) {
      throw new Error("missing txHash");
    }
    return swap.txHash;
  } catch (error: any) {
    const msg = error.message.error || error.message;
    swapAnalytics.onSwapFailed(msg, count());
    throw new Error(msg);
  }
};

export const swap = async (
  quote: Quote,
  signature: string,
  chainId: number,
  dexTx?: any
) => {
  const apiUrl = getApiUrl(chainId);
  const count = counter();
  swapX({
    signature,
    inTokenAddress: quote.inToken,
    outTokenAddress: quote.outToken,
    fromAmount: quote.inAmount,
    quote,
    account: quote.user,
    chainId,
    apiUrl,
    dexTx,
  })
    .then()
    .catch(() => {});
  try {
    const txHash = await waitForSwap({
      sessionId: quote.sessionId,
      apiUrl,
      user: quote.user,
      chainId,
    });

    if (!txHash) {
      throw new Error("swap failed");
    }
    swapAnalytics.onSwapSuccess(txHash, count());

    const txData = await getTxDetailsFromApi(txHash, chainId, quote);

    swapAnalytics.onClobOnChainSwapSuccess(
      txData?.exactOutAmount,
      txData?.gasCharges
    );
    return {
      txHash,
      ...txData,
    };
  } catch (error) {
    swapAnalytics.onSwapFailed((error as any).message, count());
    throw error;
  }
};

type TxDetailsFromApi = {
  status: string;
  exactOutAmount: string;
  gasCharges: string;
};

export const getTxDetailsFromApi = async (
  txHash: string,
  chainId: number,
  quote?: Quote
): Promise<TxDetailsFromApi> => {
  const apiUrl = getApiUrl(chainId);
  for (let i = 0; i < 10; ++i) {
    await delay(2_500);
    try {
      const response = await fetch(
        `${apiUrl}/tx/${txHash}?chainId=${chainId}`,
        {
          method: "POST",
          body: JSON.stringify({
            outToken: quote?.outToken,
            user: quote?.user,
            qs: quote?.qs,
            partner: quote?.partner,
            sessionId: quote?.sessionId,
          }),
        }
      );

      const result = await response?.json();

      if (result && result.status?.toLowerCase() === "mined") {
        return result;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  throw new Error("swap timeout");
};

async function waitForSwap({
  chainId,
  user,
  apiUrl,
  sessionId,
}: {
  chainId: number;
  user: string;
  apiUrl: string;
  sessionId: string;
}) {
  // wait for swap to be processed, check every 2 seconds, for 2 minutes
  for (let i = 0; i < 60; ++i) {
    await delay(2_000);
    try {
      const response = await fetch(
        `${apiUrl}/swap/status/${sessionId}?chainId=${chainId}`,
        {
          method: "POST",
          body: JSON.stringify({ user }),
        }
      );
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.txHash) {
        return result.txHash as string;
      }
    } catch (error: any) {
      return;
    }
  }
  throw new Error("swap timeout");
}
