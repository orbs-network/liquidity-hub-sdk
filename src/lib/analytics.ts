import { QuoteArgs, Quote } from "./types";

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

const getWalletName = (provider: any) => {
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
  signatureStart = 0;
  wrapStart = 0;
  approvalStart = 0;
  swapStart = 0;
  quoteStart = 0;

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
    this.quoteStart = Date.now();
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

  onQuoteSuccess(quote: Quote) {
    const clobDexPriceDiffPercent = getDiff(
      quote.minAmountOut,
      this.data.dexAmountOut
    );

    this.data = {
      ...this.data,
      quoteState: "success",
      quoteMillis: Date.now() - this.quoteStart,
      quoteError: undefined,
      isNotClobTradeReason: undefined,
      quoteAmountOut: quote?.outAmount,
      quoteSerializedOrder: quote?.serializedOrder,
      quoteMinAmountOut: quote?.minAmountOut,
      clobDexPriceDiffPercent,
      sessionId: quote.sessionId,
    };
  }

  onQuoteFailed(error: string) {
    this.updateAndSend({
      quoteError: error,
      quoteState: "failed",
      isNotClobTradeReason: `quote-failed`,
      quoteMillis: Date.now() - this.quoteStart,
    });
  }

  onApprovalRequest() {
    this.approvalStart = Date.now();
    this.updateAndSend({ approvalState: "pending" });
  }

  onApprovalSuccess() {
    this.updateAndSend({
      approvalMillis: Date.now() - this.approvalStart,
      approvalState: "success",
    });
  }

  onApprovalFailed(error: string) {
    this.updateAndSend({
      approvalError: error,
      approvalState: "failed",
      approvalMillis: Date.now() - this.approvalStart,
      isNotClobTradeReason: "approval failed",
    });
  }

  onWallet(provider: any) {
    this.updateAndSend({ walletConnectName: getWalletName(provider) });
  }

  onWrapRequest() {
    this.wrapStart = Date.now();
    this.updateAndSend({ wrapState: "pending" });
  }

  onWrapSuccess() {
    this.updateAndSend({
      wrapMillis: Date.now() - this.wrapStart,
      wrapState: "success",
    });
  }

  onWrapFailed(error: string) {
    this.updateAndSend({
      wrapError: error,
      wrapState: "failed",
      wrapMillis: Date.now() - this.wrapStart,
      isNotClobTradeReason: "wrap failed",
    });
  }

  onSignatureRequest() {
    this.signatureStart = Date.now();
    this.updateAndSend({ signatureState: "pending" });
  }

  onSignatureSuccess(signature: string) {
    this.updateAndSend({
      signature,
      signatureMillis: Date.now() - this.signatureStart,
      signatureState: "success",
    });
  }

  onSignatureFailed(error: string) {
    this.updateAndSend({
      signatureError: error,
      signatureState: "failed",
      signatureMillis: Date.now() - this.signatureStart,
      isNotClobTradeReason: "signature failed",
    });
  }

  onSwapRequest() {
    this.swapStart = Date.now();
    this.updateAndSend({ swapState: "pending" });
  }

  onSwapSuccess(txHash: string) {
    this.updateAndSend({
      txHash,
      swapMillis: Date.now() - this.swapStart,
      swapState: "success",
      isClobTrade: true,
      onChainClobSwapState: "pending",
    });
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

  onSwapFailed(error: string) {
    this.updateAndSend({
      swapError: error,
      swapState: "failed",
      swapMillis: Date.now() - this.swapStart,
      firstFailureSessionId: this.data.sessionId,
    });
  }
}

const swapAnalytics = new Analytics();

export { swapAnalytics };

export const onApprovalRequest =
  swapAnalytics.onApprovalRequest.bind(swapAnalytics);
export const onApprovalSuccess =
  swapAnalytics.onApprovalSuccess.bind(swapAnalytics);
export const onApprovalFailed =
  swapAnalytics.onApprovalFailed.bind(swapAnalytics);

export const onWrapRequest = swapAnalytics.onWrapRequest.bind(swapAnalytics);
export const onWrapSuccess = swapAnalytics.onWrapSuccess.bind(swapAnalytics);
export const onWrapFailed = swapAnalytics.onWrapFailed.bind(swapAnalytics);

export const onSignatureRequest =
  swapAnalytics.onSignatureRequest.bind(swapAnalytics);
export const onSignatureSuccess =
  swapAnalytics.onSignatureSuccess.bind(swapAnalytics);
export const onSignatureFailed =
  swapAnalytics.onSignatureFailed.bind(swapAnalytics);

export const onWallet = swapAnalytics.onWallet.bind(swapAnalytics);
