export function toCompactEvidenceRecord(record = {}, askingPrice = null) {
  const source = record.retailer || record.retailerDisplayName || record.marketplace || record.source || record.sourceDomain || "Source";
  const price = Number.isFinite(record.price) ? `$${record.price.toFixed(2)}` : "Price unavailable";
  const quantity = Number(record.quantity || record.packageQuantity);
  const matchLabel = record.canonicalMatchQuality === "Exact"
    ? "Exact item"
    : record.canonicalMatchQuality === "Strong compatible"
      ? "Strong compatible"
      : "Compatible alternative";
  const unitPriceAmount = Number.isFinite(record.price) && Number.isFinite(quantity) && quantity > 0 ? record.price / quantity : null;
  return {
    ...record,
    source,
    retailerDisplayName: source,
    displayedPrice: price,
    itemPrice: price,
    itemPriceAmount: record.price,
    parsedPrice: record.price,
    priceContextLabel: matchLabel,
    matchQuality: matchLabel,
    classification: record.canonicalMatchQuality,
    canonicalMatchQuality: record.canonicalMatchQuality,
    includedInPreliminaryAskingPriceRange: record.rangeEligible === true && /^(Active asking price|Buy It Now)$/i.test(record.priceType)
      ? "Yes - canonical active-asking support."
      : "No",
    influencedVerifiedMarketRange: record.rangeEligible === true && /^(Verified sold|Completed auction)$/i.test(record.priceType)
      ? "Yes - canonical verified-sold support."
      : "No",
    packageQuantity: Number.isFinite(quantity) ? quantity : record.packageQuantity,
    packageQuantityLabel: Number.isFinite(quantity) ? `${quantity} count` : record.packageQuantityLabel,
    unitPriceAmount,
    unitPrice: Number.isFinite(unitPriceAmount) ? `$${unitPriceAmount.toFixed(unitPriceAmount < 0.1 ? 3 : 2)} each` : "",
    url: record.destinationUrl || record.url || record.originalUrl,
    destinationUrl: record.destinationUrl || record.url || record.originalUrl,
    comparisonToYourPrice: record.comparisonToYourPrice || (Number.isFinite(Number(askingPrice)) && Number.isFinite(record.price)
      ? record.price < Number(askingPrice) ? "Lower than your entered price."
      : record.price > Number(askingPrice) ? "Higher than your entered price."
      : "Matches your entered price."
      : "")
  };
}

export function buildCompactEvidenceList(finalized = {}, askingPrice = null) {
  return (finalized.display || []).map((record) => toCompactEvidenceRecord(record, askingPrice));
}
