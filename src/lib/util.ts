export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getApiUrl = (chainId: number) => {
  const overrideUrl = localStorage.getItem('lhOverrideApiUrl')

  if (overrideUrl) return overrideUrl

  switch (chainId) {
    case 137:
      return 'https://polygon.hub.orbs.network'
    case 56:
      return 'https://bsc.hub.orbs.network'
    case 250:
      return 'https://ftm.hub.orbs.network'
    case 8453:
      return 'https://base.hub.orbs.network'
    case 59144:
      return 'https://linea.hub.orbs.network'
    case 81457:
      return 'https://blast.hub.orbs.network'
    case 1101:
      return 'https://zkevm.hub.orbs.network'

    default:
      return 'https://hub.orbs.network'
  }
}

// function parseToBigIntWithPrecision(value: string | number): {
//   bigIntValue: bigint;
//   factor: bigint;
// } {
//   const [integerPart, decimalPart = ""] = value.toString().split(".");

//   // Create a factor to scale the decimal part into an integer
//   const decimals = decimalPart.length;
//   const factor = BigInt(10 ** decimals);

//   // Combine the integer part and the decimal part (scaled as an integer)
//   const bigIntValue = BigInt(integerPart + decimalPart);

//   return { bigIntValue, factor };
// }

// export const isStaleQuote = (
//   quote?: Quote,
//   dexMinAmountOut?: string,
//   priceTollerancePercent = 0.1
// ) => {
//   if (!dexMinAmountOut || !quote?.referencePrice) return false;
//   // Parse dexMinAmountOut and referencePrice to BigInt, considering the decimal precision
//   const { bigIntValue: safeDexMinAmountOut, factor: dexFactor } =
//     parseToBigIntWithPrecision(dexMinAmountOut);
//   const { bigIntValue: safeReferencePrice, factor: referenceFactor } =
//     parseToBigIntWithPrecision(quote.referencePrice);

//   // Find the maximum scale factor between the two values
//   const maxFactor = BigInt(
//     Math.max(Number(dexFactor), Number(referenceFactor))
//   );

//   // Scale both values to the same precision
//   const scaledDexMinAmountOut = safeDexMinAmountOut * (maxFactor / dexFactor);
//   const scaledReferencePrice =
//     safeReferencePrice * (maxFactor / referenceFactor);

//   // Calculate the difference as a ratio, convert to regular number for precision
//   const diff = Number(scaledDexMinAmountOut) / Number(scaledReferencePrice);

//   // Calculate the percentage difference
//   const diffPercentage = (diff - 1) * 100;

//   // Compare the difference to the price tolerance percentage
//   return diffPercentage > priceTollerancePercent;
// };

// export const isLiquidityHubTrade = (
//   quote: Quote,
//   dexMinAmountOut: string,
//   priceTollerancePercent: number
// ) => {
//   if (!dexMinAmountOut || !quote?.referencePrice) return false;
//   const isStale = isStaleQuote(quote, dexMinAmountOut, priceTollerancePercent);
//   if (isStale) return false;
//   const { bigIntValue: safeDexMinAmountOut, factor: dexFactor } =
//     parseToBigIntWithPrecision(dexMinAmountOut);
//   const { bigIntValue: safeReferencePrice, factor: referenceFactor } =
//     parseToBigIntWithPrecision(quote.referencePrice);

//   // Adjust both values to the same scale by finding the maximum factor
//   const maxFactor = BigInt(
//     Math.max(Number(dexFactor), Number(referenceFactor))
//   );
//   const scaledDexMinAmountOut = safeDexMinAmountOut * (maxFactor / dexFactor);
//   const scaledReferencePrice =
//     safeReferencePrice * (maxFactor / referenceFactor);

//   // Calculate the percentage difference between dexMinAmountOut and referencePrice
//   const result = scaledReferencePrice > scaledDexMinAmountOut;
//   return result;
// };
