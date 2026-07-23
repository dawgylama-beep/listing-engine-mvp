function normalizedUrl(value) {
  try {
    const url = new URL(String(value || ""));
    ["utm_source", "utm_medium", "utm_campaign", "gclid"].forEach((key) => url.searchParams.delete(key));
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return "";
  }
}

export function underlyingOfferKey(record = {}) {
  const marketplaceId = String(record.marketplaceItemId || record.offerId || record.lotId || "").trim().toLowerCase();
  if (marketplaceId) return `offer:${String(record.marketplace || record.sourceDomain || "").toLowerCase()}:${marketplaceId}`;
  const original = normalizedUrl(record.originalUrl);
  if (original) return `url:${original}`;
  const destination = normalizedUrl(record.destinationUrl || record.url);
  if (destination) return `url:${destination}`;
  return [
    record.marketplace || record.retailer || record.sourceDomain,
    record.seller,
    record.title,
    record.price,
    record.imageUrl
  ].map((value) => String(value || "").trim().toLowerCase()).join("|");
}

function completeness(record = {}) {
  return ["title", "destinationUrl", "retailer", "marketplace", "price", "priceType", "listingStatus", "quantity"]
    .reduce((score, key) => score + (record[key] !== undefined && record[key] !== "" ? 1 : 0), 0);
}

export function dedupeUnderlyingOffers(records = []) {
  const selected = new Map();
  for (const record of records) {
    const key = underlyingOfferKey(record);
    if (!key) continue;
    const current = selected.get(key);
    if (!current || completeness(record) > completeness(current)) selected.set(key, record);
  }
  return [...selected.values()];
}
