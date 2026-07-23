export function deriveRange(finalized = {}) {
  const eligible = (finalized.all || []).filter((record) => record.rangeEligible && Number.isFinite(record.price));
  const values = eligible.map((record) => record.price);
  return {
    eligibleCount: values.length,
    low: values.length ? Math.min(...values) : null,
    high: values.length ? Math.max(...values) : null,
    established: values.length > 0,
    priceTypes: [...new Set(eligible.map((record) => record.priceType))]
  };
}

export function deriveDecision(finalized = {}, { askingPrice = null, purpose = "personal" } = {}) {
  const range = deriveRange(finalized);
  const asking = Number(askingPrice);
  const transactionEvidence = (finalized.all || []).some((record) => record.decisionEligible
    && ["Verified sold", "Completed auction"].includes(record.priceType));
  const exactPriced = (finalized.all || []).filter((record) => record.exactIdentity && record.decisionEligible);
  let recommendation = "Need More Info";
  let confidence = "Low";
  if (Number.isFinite(asking) && asking > 0 && transactionEvidence && range.established) {
    recommendation = asking <= range.high ? "Buy" : "Pass";
    confidence = exactPriced.length >= 2 ? "High" : "Medium";
  } else if (Number.isFinite(asking) && asking > 0 && finalized.counts?.exact > 0) {
    recommendation = purpose === "personal" ? "Promising, value unconfirmed" : "Need More Info";
  }
  return {
    recommendation,
    confidence,
    range,
    maximumPrice: transactionEvidence && range.established && Number.isFinite(asking)
      ? Math.max(asking, range.high)
      : Number.isFinite(asking) ? asking : null,
    recoveryNeeded: (finalized.counts?.exact || 0) === 0,
    transactionEvidence
  };
}
