export const IMPORTANT_EVIDENCE_FIELDS = Object.freeze([
  "title", "productIdentity", "brand", "model", "sku", "upc", "ean", "gtin",
  "quantity", "dimensions", "packageType", "designIdentity", "retailer", "marketplace",
  "acquisitionProvider", "sourceDomain", "originalUrl", "destinationUrl", "price",
  "shipping", "deliveredCost", "currency", "priceType", "listingStatus",
  "availability", "evidenceTimestamp"
]);

function clean(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value;
}

export function sourceRecordId(record = {}) {
  return clean(record.sourceRecordId || record.providerRecordId || record.resultId
    || record.originalUrl || record.url || record.destinationUrl || "");
}

export function provenanceField(value, record = {}, field = "") {
  if (value === undefined || value === null || value === "") return null;
  const recordId = sourceRecordId(record);
  if (!recordId) return null;
  return {
    value: clean(value),
    sourceRecordId: recordId,
    sourceUrl: clean(record.originalUrl || record.url || record.destinationUrl || ""),
    acquisitionProvider: clean(record.acquisitionProvider || record.searchProvider || record.provider || ""),
    evidencePath: clean(record.evidencePath || field || "")
  };
}

export function buildFieldProvenance(record = {}) {
  const supplied = record.fieldProvenance && typeof record.fieldProvenance === "object"
    ? record.fieldProvenance
    : {};
  const output = {};
  for (const field of IMPORTANT_EVIDENCE_FIELDS) {
    const suppliedField = supplied[field];
    if (suppliedField?.sourceRecordId && suppliedField.value !== undefined) {
      output[field] = { ...suppliedField, value: clean(suppliedField.value) };
      continue;
    }
    const generated = provenanceField(record[field], record, field);
    if (generated) output[field] = generated;
  }
  return output;
}

export function readProvenanceValue(provenance = {}, field, fallback = null) {
  const entry = provenance[field];
  return entry?.sourceRecordId ? entry.value : fallback;
}

export function hasCoherentFieldAssociation(provenance = {}, fields = []) {
  const ids = fields
    .map((field) => provenance[field]?.sourceRecordId)
    .filter(Boolean);
  return ids.length === fields.length && new Set(ids).size === 1;
}

export function omitUnsupportedAssociations(record = {}) {
  const provenance = buildFieldProvenance(record);
  const sanitized = { ...record, fieldProvenance: provenance };
  for (const field of IMPORTANT_EVIDENCE_FIELDS) {
    if (record[field] !== undefined && !provenance[field]) delete sanitized[field];
  }
  const priceFields = ["price", "originalUrl"];
  if (record.price !== undefined && record.originalUrl && !hasCoherentFieldAssociation(provenance, priceFields)) {
    delete sanitized.price;
    delete sanitized.parsedPrice;
    delete sanitized.displayedPrice;
    sanitized.priceAssociationStatus = "unsupported";
  }
  return sanitized;
}
