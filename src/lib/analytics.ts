import { Quote } from "./quote";
import { QuoteArgs } from "./types";

type analyticsActionState = "pending" | "success" | "failed" | "null" | "";

export interface AnalyticsData {
  moduleLoaded: boolean;
  liquidityHubDisabled: boolean;

  _id: string;
  partner?: string;
  chainId?: number;
  isForceClob: boolean;
  firstFailureSessionId?: string;
  sessionId?: string;
  walletAddress: string;

  dexAmountOut: string;

  dexOutAmountWS: string;

  isClobTrade: boolean;
  srcTokenAddress: string;
  dstTokenAddress: string;
  srcAmount: string;
  srcAmountUI: string;
  quoteIndex: number;
  slippage: number;
  quoteState: analyticsActionState;
  clobDexPriceDiffPercent: string;

  approvalState: analyticsActionState;
  approvalError: string;
  approvalMillis: number | null;

  signatureState: analyticsActionState;
  signatureMillis: number | null;
  signature: string;
  signatureError: string;

  swapState: analyticsActionState;
  txHash: string;
  swapMillis: number | null;
  swapError: string;

  wrapState: analyticsActionState;
  wrapMillis: number | null;
  wrapError: string;
  wrapTxHash: string;

  isNotClobTradeReason: string;
  onChainClobSwapState: analyticsActionState;
  version: number;
  isDexTrade: boolean;
  onChainDexSwapState: analyticsActionState;

  quoteAmountOut?: string;
  quoteMinAmountOut?: string;

  quoteSerializedOrder?: string;
  quoteMillis?: number;
  quoteError?: string;
  walletConnectName?: string;

  exactOutAmount?: string;
  gasCharges?: string;
}

const ANALYTICS_VERSION = 0.7;
const BI_ENDPOINT = `https://bi.orbs.network/putes/liquidity-hub-${ANALYTICS_VERSION}`;

const initialData: Partial<AnalyticsData> = {
  _id: crypto.randomUUID(),
  isClobTrade: false,
  quoteIndex: 0,
  isForceClob: false,
  isDexTrade: false,
  version: ANALYTICS_VERSION,
};

const onWallet = (provider: any) => {
  try {
    if (provider.isRabby) {
      return "rabby";
    }
    if (provider.isWalletConnect) {
      return "walletConnect";
    }
    if (provider.isCoinbaseWallet) {
      return "coinbaseWallet";
    }
    if (provider.isOkxWallet) {
      return "okxWallet";
    }
    if (provider.isTrustWallet) {
      return "trustWallet";
    }
    if (provider.isMetaMask) {
      return "metaMask";
    }
  } catch (error) {}
};

const getDiff = (quoteAmountOut?: string, dexAmountOut?: string) => {
  return !dexAmountOut
    ? "0"
    : (
        (Number(quoteAmountOut || "0") / Number(dexAmountOut) - 1) *
        100
      ).toFixed();
};

const sendBI = async (data: Partial<AnalyticsData>) => {
  try {
    await fetch(BI_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error) {}
};

export class Analytics {
  initialTimestamp = Date.now();
  data = {} as Partial<AnalyticsData>;
  firstFailureSessionId = "";
  timeout: any = undefined;

  constructor() {
    let liquidityHubDisabled = false;

    try {
      liquidityHubDisabled = JSON.parse(
        localStorage.redux_localstorage_simple_user
      ).userLiquidityHubDisabled;
    } catch (error) {}

    this.updateAndSend({
      moduleLoaded: true,
      liquidityHubDisabled: !!liquidityHubDisabled,
    });
  }

  public async updateAndSend(values = {} as Partial<AnalyticsData>) {
    this.data = {
      ...this.data,
      ...values,
    };
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      sendBI(this.data);
    }, 1_000);
  }

  onQuoteRequest(args: QuoteArgs) {
    const getDexOutAmountWS = () => {
      const dexMinAmountOut = Number(args.dexMinAmountOut || "0");
      const slippageAmount = !args.slippage
        ? 0
        : dexMinAmountOut * (args.slippage / 100);
      return (dexMinAmountOut + slippageAmount).toString();
    };

    this.data = {
      ...this.data,
      quoteState: "pending",
      quoteIndex: !this.data.quoteIndex ? 1 : this.data.quoteIndex + 1,
      srcTokenAddress: args.fromToken,
      dstTokenAddress: args.toToken,
      chainId: args.chainId,
      slippage: args.slippage,
      walletAddress: args.account,
      dexAmountOut: args.dexMinAmountOut,
      dexOutAmountWS: getDexOutAmountWS(),
      srcAmount: args.inAmount,
      partner: args.partner,
    };
  }

  onQuoteSuccess(quoteMillis: number, quote: Quote) {
    const clobDexPriceDiffPercent = getDiff(
      quote.minAmountOut,
      this.data.dexAmountOut
    );

    this.data = {
      ...this.data,
      quoteState: "success",
      quoteMillis,
      quoteError: undefined,
      isNotClobTradeReason: undefined,
      quoteAmountOut: quote?.outAmount,
      quoteSerializedOrder: quote?.serializedOrder,
      quoteMinAmountOut: quote?.minAmountOut,
      clobDexPriceDiffPercent,
      sessionId: quote.sessionId,
    };
  }

  onQuoteFailed(error: string, quoteMillis: number) {
    this.updateAndSend({
      quoteError: error,
      quoteState: "failed",
      isNotClobTradeReason: `quote-failed`,
      quoteMillis,
    });
  }

  onApprovalRequest() {
    this.updateAndSend({ approvalState: "pending" });
  }

  onApprovalSuccess(time: number) {
    this.updateAndSend({ approvalMillis: time, approvalState: "success" });
  }

  onApprovalFailed(error: string, time: number) {
    this.updateAndSend({
      approvalError: error,
      approvalState: "failed",
      approvalMillis: time,
      isNotClobTradeReason: "approval failed",
    });
  }

  onSignatureRequest() {
    this.updateAndSend({ signatureState: "pending" });
  }
  onWallet(provider: any) {
    this.updateAndSend({ walletConnectName: onWallet(provider) });
  }

  onWrapRequest() {
    this.updateAndSend({ wrapState: "pending" });
  }

  onWrapSuccess(time: number) {
    this.updateAndSend({
      wrapMillis: time,
      wrapState: "success",
    });
  }

  onWrapFailed(error: string, time: number) {
    this.updateAndSend({
      wrapError: error,
      wrapState: "failed",
      wrapMillis: time,
      isNotClobTradeReason: "wrap failed",
    });
  }

  onSignatureSuccess(signature: string, time: number) {
    this.updateAndSend({
      signature,
      signatureMillis: time,
      signatureState: "success",
    });
  }

  onSignatureFailed(error: string, time: number) {
    this.updateAndSend({
      signatureError: error,
      signatureState: "failed",
      signatureMillis: time,
      isNotClobTradeReason: "signature failed",
    });
  }

  onSwapRequest() {
    this.updateAndSend({ swapState: "pending" });
  }

  onSwapSuccess(txHash: string, time: number) {
    this.updateAndSend({
      txHash,
      swapMillis: time,
      swapState: "success",
      isClobTrade: true,
      onChainClobSwapState: "pending",
    });
  }

  onSwapFailed(error: string, time: number) {
    this.updateAndSend({
      swapError: error,
      swapState: "failed",
      swapMillis: time,
    });
  }

  clearState() {
    setTimeout(() => {
      this.data = {
        ...initialData,
        partner: this.data.partner,
        chainId: this.data.chainId,
        _id: crypto.randomUUID(),
        firstFailureSessionId: this.firstFailureSessionId,
      };
    }, 1_000);
  }

  async onClobOnChainSwapSuccess(exactOutAmount?: string, gasCharges?: string) {
    this.updateAndSend({
      onChainClobSwapState: "success",
      exactOutAmount,
      gasCharges,
    });
  }

  onNotClobTrade(message: string) {
    this.updateAndSend({ isNotClobTradeReason: message });
  }

  onClobFailure() {
    this.firstFailureSessionId =
      this.firstFailureSessionId || this.data.sessionId || "";
  }
}

export const swapAnalytics = new Analytics();
