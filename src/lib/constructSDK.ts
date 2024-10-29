import { Analytics } from "./analytics";
import { fetchQuote } from "./quote";
import { swap, getTxDetails } from "./swap";
import { Quote, QuoteArgs } from "./types";

interface Args {
  chainId?: number;
  partner: string;
  blockAnalytics?: boolean;
}

const analytics = new Analytics();

const analyticsMethods = () => {
  return {
    onWrapRequest: analytics.onWrapRequest.bind(analytics),
    onWrapSuccess: analytics.onWrapSuccess.bind(analytics),
    onWrapFailure: analytics.onWrapFailed.bind(analytics),
    onApprovalRequest: analytics.onApprovalRequest.bind(analytics),
    onApprovalFailed: analytics.onApprovalFailed.bind(analytics),
    onApprovalSuccess: analytics.onApprovalSuccess.bind(analytics),
    onSignatureSuccess: analytics.onSignatureSuccess.bind(analytics),
    onSignatureRequest: analytics.onSignatureRequest.bind(analytics),
    onSignatureFailed: analytics.onSignatureFailed.bind(analytics),
  };
};

class LiquidityHubSDK {
  private chainId?: number;
  private partner: string;
  public analytics: ReturnType<typeof analyticsMethods> = analyticsMethods();
  private blockAnalytics: boolean;
  constructor(args: Args) {
    this.chainId = args.chainId;
    this.partner = args.partner;
    analytics.init(args.partner, args.chainId);
    this.blockAnalytics = args.blockAnalytics || false;
  }
  getQuote(args: QuoteArgs) {
    return fetchQuote(
      args,
      this.partner,
      this.chainId,
      this.blockAnalytics ? undefined : analytics
    );
  }

  swap(
    quote: Quote,
    signature: string,
    dexRouterData?: { data?: string; to?: string }
  ) {
    return swap(
      quote,
      signature,
      this.chainId,
      dexRouterData,
      this.blockAnalytics ? undefined : analytics
    );
  }

  getTransactionDetails(txHash: string, quote: Quote) {
    return getTxDetails(
      txHash,
      quote,
      this.chainId,
      this.blockAnalytics ? undefined : analytics
    );
  }
}


export {LiquidityHubSDK}
export const constructSDK = (args: Args): LiquidityHubSDK => {
  return new LiquidityHubSDK(args);
};
