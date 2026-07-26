(function installCustomerEvidencePresentation(root) {
  "use strict";

  const unavailable = (reason) => ({
    status: "evidence_unavailable",
    evidenceUnavailable: true,
    message: "Finalized customer evidence is unavailable.",
    reason,
    cards: [],
    summary: null
  });

  const cleanText = (value) => typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";

  const sameOrder = (left, right) => (
    left.length === right.length
    && left.every((value, index) => value === right[index])
  );
  const countBy = (records, field) => records.reduce((counts, record) => {
    const key = cleanText(record?.[field]) || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const sameCounts = (left, right) => {
    if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length
      && keys.every((key) => left[key] === right[key]);
  };

  function formatCurrency(value) {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? `$${amount.toFixed(2)}` : "Price unavailable";
  }

  function formatQuantity(record) {
    const canonicalLabel = cleanText(record.quantityLabel);
    if (canonicalLabel) return canonicalLabel;
    const quantity = Number(record.quantity);
    return Number.isFinite(quantity) && quantity > 0 ? `${quantity} count` : "";
  }

  function formatAttributes(record) {
    return Array.isArray(record.importantAttributes)
      ? record.importantAttributes.map(cleanText).filter(Boolean)
      : [];
  }

  function buildCard(record) {
    const badgeCode = cleanText(record.cardBadgeCode);
    const badgeLabel = cleanText(record.cardBadgeLabel);
    const destinationUrl = cleanText(record.destinationUrl);
    const sourceLabel = cleanText(record.sourceLabel);
    const title = cleanText(record.title);
    const canonicalMatchLabel = cleanText(record.canonicalMatchLabel);
    const canonicalPriceType = cleanText(record.canonicalPriceType);
    const quantityLabel = formatQuantity(record);
    const importantAttributes = formatAttributes(record);
    const customerPriceLabel = cleanText(record.customerPriceLabel)
      || formatCurrency(record.canonicalPrice);
    const shippingLabel = cleanText(record.shippingLabel);
    const deliveredCostLabel = cleanText(record.deliveredCostLabel);
    const availabilityStatus = cleanText(record.availabilityStatus);

    return {
      evidenceId: cleanText(record.evidenceId),
      underlyingOfferId: cleanText(record.underlyingOfferId),
      destinationUrl,
      sourceLabel,
      title,
      canonicalMatchCode: cleanText(record.canonicalMatchCode),
      canonicalMatchLabel,
      canonicalPrice: Number.isFinite(record.canonicalPrice) ? record.canonicalPrice : null,
      canonicalPriceType,
      priceTypeCode: cleanText(record.priceTypeCode),
      customerPriceLabel,
      quantity: Number.isFinite(record.quantity) ? record.quantity : null,
      quantityLabel,
      importantAttributes,
      attributeText: importantAttributes.join(" · "),
      shippingStatus: cleanText(record.shippingStatus),
      shippingLabel,
      deliveredCostAmount: Number.isFinite(record.deliveredCostAmount)
        ? record.deliveredCostAmount
        : null,
      deliveredCostStatus: cleanText(record.deliveredCostStatus),
      deliveredCostLabel,
      availabilityStatus,
      customerEligible: record.customerEligible === true,
      displayEligible: record.displayEligible === true,
      rangeEligible: record.rangeEligible === true,
      decisionEligible: record.decisionEligible === true,
      cardBadge: badgeCode && badgeLabel ? { code: badgeCode, label: badgeLabel } : null,
      sourceObservationIds: Array.isArray(record.sourceObservationIds)
        ? [...record.sourceObservationIds]
        : [],
      provenance: record.provenance && typeof record.provenance === "object"
        ? record.provenance
        : {},
      retailerDomain: cleanText(record.retailerDomain),
      listingStatus: cleanText(record.listingStatus),
      sourceEvidenceType: cleanText(record.sourceEvidenceType),
      purchaseChannel: cleanText(record.purchaseChannel),
      retailOfferPlatform: cleanText(record.retailOfferPlatform),
      retailOfferSeller: cleanText(record.retailOfferSeller),
      retailOfferSellerType: cleanText(record.retailOfferSellerType),
      retailOfferConditionDisclosure: cleanText(record.retailOfferConditionDisclosure),
      nearbyAddress: cleanText(record.nearbyAddress),
      storeAddress: cleanText(record.storeAddress),
      locationAddress: cleanText(record.locationAddress),
      retailerAddress: cleanText(record.retailerAddress),
      pickupAddress: cleanText(record.pickupAddress),
      exactPageRecoveryStatus: cleanText(record.exactPageRecoveryStatus),
      exactPageRecoveryMode: cleanText(record.exactPageRecoveryMode),
      conciseLimitation: cleanText(record.conciseLimitation),
      knownDifferences: Array.isArray(record.knownDifferences)
        ? record.knownDifferences.map(cleanText).filter(Boolean).join(" Â· ")
        : cleanText(record.knownDifferences),
      retailerConfidenceLevel: cleanText(record.retailerConfidenceLevel),
      unitPrice: cleanText(record.unitPrice),
      comparisonToYourPrice: cleanText(record.comparisonToYourPrice)
    };
  }

  function buildCustomerEvidenceViewModel(customerEvidence, customerEvidenceSummary) {
    if (!Array.isArray(customerEvidence)) {
      return unavailable("customerEvidence is missing or is not an array.");
    }
    if (!customerEvidenceSummary || typeof customerEvidenceSummary !== "object") {
      return unavailable("customerEvidenceSummary is missing or invalid.");
    }
    if (!Array.isArray(customerEvidenceSummary.displayedIds)) {
      return unavailable("customerEvidenceSummary.displayedIds is missing or invalid.");
    }
    const ids = customerEvidence.map((record) => cleanText(record?.evidenceId));
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
      return unavailable("customerEvidence contains a missing or duplicate evidence ID.");
    }
    if (!sameOrder(ids, customerEvidenceSummary.displayedIds)) {
      return unavailable("customerEvidence IDs do not match the canonical displayed order.");
    }
    if (
      !customerEvidenceSummary.counts
      || customerEvidenceSummary.counts.displayed !== customerEvidence.length
    ) {
      return unavailable("customerEvidenceSummary displayed count does not match the canonical list.");
    }
    for (const [summaryField, recordField] of [
      ["displayedCountByRetailer", "sourceLabel"],
      ["displayedCountByPriceType", "canonicalPriceType"],
      ["displayedCountByMatchClass", "canonicalMatchLabel"]
    ]) {
      if (!sameCounts(customerEvidenceSummary[summaryField], countBy(customerEvidence, recordField))) {
        return unavailable(`customerEvidenceSummary.${summaryField} does not match the canonical list.`);
      }
    }
    for (const record of customerEvidence) {
      if (
        !record
        || typeof record !== "object"
        || !cleanText(record.underlyingOfferId)
        || !cleanText(record.destinationUrl)
        || !cleanText(record.sourceLabel)
        || !cleanText(record.title)
        || !cleanText(record.canonicalMatchLabel)
        || !cleanText(record.canonicalPriceType)
      ) {
        return unavailable(`customerEvidence record ${cleanText(record?.evidenceId) || "unknown"} is incomplete.`);
      }
    }

    return {
      status: "ready",
      evidenceUnavailable: false,
      message: customerEvidence.length
        ? ""
        : "No finalized customer evidence was available.",
      cards: customerEvidence.map(buildCard),
      summary: customerEvidenceSummary
    };
  }

  root.KatherinesEyeCustomerEvidence = Object.freeze({
    buildCustomerEvidenceViewModel
  });
})(globalThis);
