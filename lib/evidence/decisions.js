import { deriveRange } from "./range.js";

export { deriveRange } from "./range.js";

export function deriveDecision(finalized = {}, { askingPrice = null, purpose = "personal", mode = "collectible", range: canonicalRange = null } = {}) {
  const range = canonicalRange || deriveRange(finalized, { analysisMode: mode });
  const asking = Number(askingPrice);
  const decisionEligible = finalized.decisionEligible || (finalized.all || []).filter((record) => record.decisionEligible);
  const soldRecords = decisionEligible.filter((record) => ["Verified sold", "Completed auction"].includes(record.priceType));
  const retailRecords = decisionEligible.filter((record) => record.priceType === "Current retail price");
  const exactPriced = decisionEligible.filter((record) => record.exactIdentity);
  const transactionEvidence = soldRecords.length > 0;
  let recommendation = "Need More Info";
  let confidence = "Low";
  let badge = "Market Evidence Insufficient";
  if (mode === "retail" && Number.isFinite(asking) && asking > 0 && retailRecords.length) {
    const lowest = Math.min(...retailRecords.map((record) => record.price));
    recommendation = asking <= lowest ? "Competitive with current alternatives" : "Higher than a qualified current alternative";
    confidence = retailRecords.length >= 2 ? "Medium" : "Low";
    badge = recommendation;
  } else if (Number.isFinite(asking) && asking > 0 && transactionEvidence && range.established) {
    recommendation = asking <= range.high ? "Buy" : "Pass";
    confidence = exactPriced.length >= 2 ? "High" : "Medium";
    badge = recommendation;
  }
  return {
    recommendation,
    confidence,
    pricingConfidence: confidence,
    identityConfidence: (finalized.counts?.exact || 0) > 0 ? "Supported" : "Limited",
    badge,
    range,
    maximumPrice: transactionEvidence && range.established && Number.isFinite(asking)
      ? Math.max(asking, range.high)
      : null,
    openingOffer: null,
    targetPrice: null,
    negotiationGuidance: transactionEvidence && range.established
      ? "Use the qualified sold range and condition differences when negotiating."
      : "Market-backed numerical negotiation guidance is unavailable.",
    userBudget: Number.isFinite(asking) && asking > 0 ? asking : null,
    recoveryNeeded: (finalized.counts?.exact || 0) === 0,
    transactionEvidence,
    soldRecordCount: soldRecords.length,
    exactProductFound: (finalized.counts?.exact || 0) > 0,
    finalizedCustomerRecordIds: finalized.finalizedCustomerRecordIds || []
  };
}
