import { devLog, getApiUrl } from "./util";
import { Analytics } from "./analytics";
import { Quote, QuoteArgs } from "./types";
const QUOTE_TIMEOUT = 10_000;

export async function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  let timer: any;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("quote timeout"));
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

const safeEncodeURIComponent = () => {
  try {
    return encodeURIComponent(window.location.hash || window.location.search);
  } catch (error) {
    return "";
  }
};

export const fetchQuote = async (
  args: QuoteArgs,
  partner: string,
  chainId?: number,
  analytics?: Analytics
) => {
  if (!chainId) {
    throw new Error("chainId is missing in constructSDK");
  }
  const apiUrl = getApiUrl(chainId);

  analytics?.onQuoteRequest(args);

  devLog("quote start", { args });

  try {
    const response = await promiseWithTimeout(
      fetch(`${apiUrl}/quote?chainId=${chainId}`, {
        method: "POST",
        body: JSON.stringify({
          inToken: args.fromToken,
          outToken: args.toToken,
          inAmount: args.inAmount,
          outAmount: !args.dexMinAmountOut ? "-1" : args.dexMinAmountOut,
          user: args.account,
          slippage: args.slippage,
          qs: safeEncodeURIComponent(),
          partner: partner.toLowerCase(),
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
    analytics?.onQuoteSuccess(quote);
    const typedQuote = quote as Quote;
    devLog("quote success", { quote });
    devLog('price compare', {lhPrice: typedQuote.userMinOutAmountWithGas, dexPrice: args.dexMinAmountOut})

    return typedQuote
  } catch (error: any) {
    devLog("quote error", { error });

    throw new Error(error.message);
  }
};
