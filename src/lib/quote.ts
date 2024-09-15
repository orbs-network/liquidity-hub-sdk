import { counter, getApiUrl } from "./util";
import { swapAnalytics } from "./analytics";
import { QuoteArgs } from "./types";
const QUOTE_TIMEOUT = 10_000

export async function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  let timer: any;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('quote timeout'));
    }, timeout);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}


export interface Quote {
  inToken: string;
  outToken: string;
  inAmount: string;
  outAmount: string;
  user: string;
  slippage: number;
  qs: string;
  partner: string;
  exchange: string;
  sessionId: string;
  serializedOrder: string;
  permitData: any;
  minAmountOut: string;
  error?: string;
  gasAmountOut?: string;
}

const safeEncodeURIComponent = () => {
  try {
    return encodeURIComponent(window.location.hash || window.location.search);
  } catch (error) {
    return "";
  }
}

export const fetchQuote = async (args: QuoteArgs) => {
  const apiUrl = getApiUrl(args.chainId);
  swapAnalytics.onQuoteRequest(args);
  const count = counter();

  try {
    const response = await promiseWithTimeout(
      fetch(`${apiUrl}/quote?chainId=${args.chainId}`, {
        method: "POST",
        body: JSON.stringify({
          inToken: args.fromToken,
          outToken: args.toToken,
          inAmount: args.inAmount,
          outAmount: !args.dexMinAmountOut ? "-1" : args.dexMinAmountOut,
          user: args.account,
          slippage: args.slippage,
          qs: safeEncodeURIComponent(),
          partner: args.partner.toLowerCase(),
        }),
        signal: args.signal,
      }),
      args.timeout || QUOTE_TIMEOUT
    );
    const quote = await response.json();

    if (!quote) {
      throw new Error("No result");
    }

    if (quote.error) {
      throw new Error(quote.error);
    }
    swapAnalytics.onQuoteSuccess(count(), quote);
    return quote as Quote;
  } catch (error: any) {
    swapAnalytics.onQuoteFailed(error.message, count());
    throw new Error(error.message);
  }
};
