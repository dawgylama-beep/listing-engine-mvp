const RETAIL_BARCODE_LENGTHS = new Set([8, 12, 13, 14]);

export function normalizeIdentifier(value) {
  return String(value || "").replace(/\D/g, "");
}

export function computeCheckDigit(body) {
  const digits = normalizeIdentifier(body);
  if (!digits) return "";
  let sum = 0;
  for (let index = digits.length - 1, position = 0; index >= 0; index -= 1, position += 1) {
    sum += Number(digits[index]) * (position % 2 === 0 ? 3 : 1);
  }
  return String((10 - (sum % 10)) % 10);
}

export function isValidRetailIdentifier(value) {
  const digits = normalizeIdentifier(value);
  return RETAIL_BARCODE_LENGTHS.has(digits.length)
    && computeCheckDigit(digits.slice(0, -1)) === digits.slice(-1);
}

export function buildIdentifierEquivalenceSet(value) {
  const digits = normalizeIdentifier(value);
  if (!digits) return [];
  const candidates = new Set([digits]);
  const stripped = digits.replace(/^0+/, "");
  if (stripped) candidates.add(stripped);
  if (digits.length >= 12) {
    const body = digits.slice(0, -1).replace(/^0+/, "");
    if (body) candidates.add(`body:${body}`);
    if (/^00/.test(digits) && stripped) candidates.add(`body:${stripped}`);
  }
  if (digits.length === 12) candidates.add(`0${digits}`);
  if (digits.length === 13 && digits.startsWith("0")) candidates.add(digits.slice(1));
  if (digits.length < 14) candidates.add(digits.padStart(14, "0"));
  return [...candidates].filter((candidate) => candidate.length >= 8);
}

export function identifiersEquivalent(left, right) {
  const leftSet = new Set(buildIdentifierEquivalenceSet(left));
  return buildIdentifierEquivalenceSet(right).some((candidate) => leftSet.has(candidate));
}

export function extractIdentifiers(value) {
  const matches = String(value || "").match(/(?<!\d)\d{8,14}(?!\d)/g) || [];
  return [...new Set(matches.flatMap(buildIdentifierEquivalenceSet))];
}

export function matchEvidenceIdentity(record = {}, target = {}) {
  const recordIdentifiers = new Set([
    ...extractIdentifiers(record.originalUrl),
    ...extractIdentifiers(record.destinationUrl),
    ...extractIdentifiers(record.url),
    ...extractIdentifiers(record.title),
    ...extractIdentifiers(record.snippet),
    ...[].concat(record.identifiers || []).flatMap(buildIdentifierEquivalenceSet)
  ]);
  const targetIdentifiers = [
    target.upc,
    target.ean,
    target.gtin,
    target.barcode,
    ...[].concat(target.identifiers || [])
  ].flatMap(buildIdentifierEquivalenceSet);
  const exactIdentifier = targetIdentifiers.some((identifier) => recordIdentifiers.has(identifier));
  return {
    exactIdentifier,
    recordIdentifiers: [...recordIdentifiers],
    targetIdentifiers: [...new Set(targetIdentifiers)]
  };
}
