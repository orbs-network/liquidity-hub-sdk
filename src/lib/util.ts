import { Quote } from "./types";

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getApiUrl = (chainId: number) => {
  switch (chainId) {
    case 137:
      return "https://polygon.hub.orbs.network";
    case 56:
      return "https://bsc.hub.orbs.network";
    case 250:
      return "https://ftm.hub.orbs.network";
    case 8453:
      return "https://base.hub.orbs.network";
    case 59144:
      return "https://linea.hub.orbs.network";
    case 81457:
      return "https://blast.hub.orbs.network";
    case 1101:
      return "https://zkevm.hub.orbs.network";

    default:
      return "https://hub.orbs.network";
  }
};

export const isLiquidityHubTrade = (
  quote?: Quote,
  dexMinAmountOut?: string
) => {
  if (!dexMinAmountOut || !quote?.referencePrice) return false;
  const safeDexMinAmountOut = BigInt(dexMinAmountOut.split(".")[0]);
  const safeReferencePrice = BigInt(quote.referencePrice?.split(".")[0]);
  const diff =
    (safeDexMinAmountOut / safeReferencePrice - BigInt(1)) * BigInt(100);
  return Number(diff) < 0.01;
};
