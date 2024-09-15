export interface QuoteArgs {
    fromToken: string;
    toToken: string;
    inAmount: string;
    dexMinAmountOut?: string;
    account?: string;
    partner: string;
    slippage: number;
    signal?: AbortSignal;
    chainId: number;
    timeout?: number;
  }