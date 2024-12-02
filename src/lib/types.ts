export interface QuoteArgs {
    fromToken: string;
    toToken: string;
    inAmount: string;
    dexMinAmountOut?: string;
    account?: string;
    slippage: number;
    signal?: AbortSignal;
    timeout?: number;
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
    referencePrice?: string;
    userMinOutAmountWithGas?: string;
  }
  