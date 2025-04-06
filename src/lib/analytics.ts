import { QuoteArgs, Quote } from "./types";

type analyticsActionState = "pending" | "success" | "failed" | "null" | "";
interface AnalyticsData {
  moduleLoaded: boolean;
  liquidityHubDisabled: boolean;

  _id: string;
  partner?: string;
  chainId?: number;
  isForceClob: boolean;
  firstFailureSessionId?: string;
  sessionId?: string;
  referencePrice?: string;
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
  approvalTxHash?: string;

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

  getDetailsState?: analyticsActionState;
  exactOutAmount?: string;
  gasCharges?: string;

  // init trade
  outAmountLH?: string;
  outAmountLhUI?: string;
  outAmountDex?: string;
  outAmountDexUI?: string;
  minAmountOutLH?: string;
  minAmountOutLhUI?: string;
  minAmountOutDex?: string;
  minAmountOutDexUI?: string;
  inAmountUsd?: number;
  outAmountUsd?: number;
  executor?: "lh" | "dex";
}

const ANALYTICS_VERSION = 0.9;
const BI_ENDPOINT = `https://bi.orbs.network/putes/liquidity-hub-ui-${ANALYTICS_VERSION}`;

const getDiff = (quoteAmountOut?: string, dexAmountOut?: string) => {
  if (
    !quoteAmountOut ||
    quoteAmountOut === "0" ||
    !dexAmountOut ||
    dexAmountOut === "0"
  ) {
    return "0";
  }
  return (
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
function generateId() {
  const part1 = Math.random().toString(36).substring(2, 16); // Generate 16 random characters
  const part2 = Math.random().toString(36).substring(2, 16); // Generate another 16 random characters
  const timestamp = Date.now().toString(36); // Generate a timestamp
  return `id_${part1 + part2 + timestamp}`; // Concatenate all parts
}

export class Analytics {
  private data = { _id: generateId() } as Partial<AnalyticsData>;
  private timeout: any = undefined;
  private signatureStart = 0;
  private wrapStart = 0;
  private approvalStart = 0;
  private swapStart = 0;
  private quoteStart = 0;

  constructor() {
    this.updateAndSend({
      moduleLoaded: true,
    }, true);
  }

  public updateAndSend(
    values = {} as Partial<AnalyticsData>,
    skipTimeout = false
  ) {
    this.data = {
      ...this.data,
      ...values,
    };
    if (!skipTimeout) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        sendBI(this.data);
      }, 1_000);
    } else {
      sendBI(this.data);
    }
  }

  onTradeSuccess(args: {
    outAmountLH?: string;
    outAmountDex?: string;
    minAmountOutLH?: string;
    minAmountOutDex?: string;
    outAmountLhUI?: string;
    outAmountDexUI?: string;
    minAmountOutLhUI?: string;
    minAmountOutDexUI?: string;
    inAmountUsd?: number;
    outAmountUsd?: number;
    executor?: "lh" | "dex";
  }) {
    this.updateAndSend(args, true);
    setTimeout(() => {
      this.data = {
        _id: generateId(),
        version: ANALYTICS_VERSION,
        chainId: this.data.chainId,
        partner: this.data.partner,
      };
    }, 500);
  }

  init(partner: string, chainId?: number) {
    if (this.data.chainId !== chainId || this.data.partner !== partner) {
      this.updateAndSend({ chainId, partner });
    }
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
      slippage: args.slippage,
      walletAddress: args.account,
      dexAmountOut: args.dexMinAmountOut,
      dexOutAmountWS: getDexOutAmountWS(),
      srcAmount: args.inAmount,
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
      referencePrice: quote.referencePrice,
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

  onDisabled() {
    this.updateAndSend({
      liquidityHubDisabled: true,
    });
  }

  onApprovalRequest() {
    this.approvalStart = Date.now();
    this.updateAndSend({ approvalState: "pending" });
  }

  onApprovalSuccess(approvalTxHash?: string) {
    this.updateAndSend({
      approvalMillis: Date.now() - this.approvalStart,
      approvalState: "success",
      approvalTxHash,
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
    });
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
