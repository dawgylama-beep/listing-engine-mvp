const CATEGORY_PATTERNS = [
  /\/(?:search|category|categories|browse)(?:\/|[?#]|$)/i,
  /[?&](?:q|query|search)=/i,
  /\/collections?(?:\/|[?#]|$)/i
];
const NON_PRODUCT_TEXT = /\b(category|search results?|shop all|buying guide|brief history|history of|article|blog|ideas|social post|teaching supplies?|report covers?|whiteboards?|accessories?|stamps?)\b/i;

export const PRICE_TYPES = Object.freeze([
  "Verified sold", "Completed auction", "Active asking price", "Buy It Now",
  "Current bid", "Opening bid", "Auction estimate", "Closed unsold",
  "Current retail price", "Price unavailable", "Reference/archive"
]);

export function normalizePriceType(value, { hasPrice = false, reference = false } = {}) {
  const text = String(value || "").toLowerCase();
  if (/verified sold|sold price|completed sale/.test(text)) return "Verified sold";
  if (/completed auction|hammer price|price realized/.test(text)) return "Completed auction";
  if (/buy it now|\bbin\b/.test(text)) return "Buy It Now";
  if (/current bid/.test(text)) return "Current bid";
  if (/opening|starting bid/.test(text)) return "Opening bid";
  if (/estimate|estimated/.test(text)) return "Auction estimate";
  if (/closed unsold|unsold/.test(text)) return "Closed unsold";
  if (/current retail|retail price/.test(text)) return "Current retail price";
  if (/active|asking|listed/.test(text) && hasPrice) return "Active asking price";
  if (reference) return "Reference/archive";
  return hasPrice ? "Active asking price" : "Price unavailable";
}

export function qualifyPage(record = {}) {
  const url = String(record.destinationUrl || record.url || "");
  const sourceText = [record.title, record.snippet, record.pageType].filter(Boolean).join(" ");
  const categoryPage = CATEGORY_PATTERNS.some((pattern) => pattern.test(url))
    || /(?:facebook|instagram|pinterest)\.com/i.test(url)
    || /\bcategory|search|editorial|article\b/i.test(String(record.pageType || ""))
    || NON_PRODUCT_TEXT.test(sourceText);
  const productPage = !categoryPage && Boolean(url) && (
    /\/(?:p|product|products|item|itm|listing|lot)\//i.test(url)
    || /product|listing|auction|archive/i.test(String(record.pageType || ""))
    || record.exactIdentity === true
  );
  return {
    eligible: productPage,
    pageType: categoryPage ? "category_or_editorial" : productPage ? "product_or_listing" : "unknown",
    rejectionReason: categoryPage ? "Non-product category, search, or editorial page." : productPage ? "" : "Product-page identity was not established."
  };
}

function parseDimensions(value) {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)/i);
  return match ? [Number(match[1]), Number(match[2])].sort((a, b) => a - b) : [];
}

export function dimensionsCompatible(target, candidate, tolerance = 0.15) {
  const left = parseDimensions(target);
  const right = parseDimensions(candidate);
  if (!left.length || !right.length) return null;
  return left.every((dimension, index) => Math.abs(dimension - right[index]) <= tolerance);
}

export function quantityCompatible(target, candidate, allowedAlternatives = []) {
  if (target === null || target === undefined || target === ""
    || candidate === null || candidate === undefined || candidate === "") {
    return null;
  }
  const expected = Number(target);
  const actual = Number(candidate);
  if (!Number.isFinite(expected) || !Number.isFinite(actual)) return null;
  if (expected === actual || allowedAlternatives.map(Number).includes(actual)) return true;
  const ratio = Math.max(expected, actual) / Math.min(expected, actual);
  return ratio <= 1.25;
}

export function designIdentityMatch(target = {}, candidate = {}) {
  const required = [].concat(target.designAttributes || []).map((value) => String(value).toLowerCase()).filter(Boolean);
  if (!required.length) return { match: null, supported: [], missing: [] };
  const text = [candidate.title, candidate.designIdentity, candidate.snippet, candidate.rawText]
    .filter(Boolean).join(" ").toLowerCase();
  const supported = required.filter((attribute) => text.includes(attribute));
  const minimum = Math.max(2, Math.ceil(required.length * 0.6));
  return { match: supported.length >= minimum, supported, missing: required.filter((attribute) => !supported.includes(attribute)) };
}

export function qualifyEvidence(record = {}, target = {}) {
  const page = qualifyPage(record);
  const dimensions = dimensionsCompatible(target.dimensions, record.dimensions);
  const quantity = quantityCompatible(target.quantity, record.quantity, target.compatibleQuantities || []);
  const design = designIdentityMatch(target, record);
  const wrongPackage = target.packageType && record.packageType
    && String(target.packageType).toLowerCase() !== String(record.packageType).toLowerCase();
  const eligible = page.eligible && dimensions !== false && quantity !== false && design.match !== false && !wrongPackage;
  return {
    eligible,
    page,
    dimensionsCompatible: dimensions,
    quantityCompatible: quantity,
    designMatch: design,
    rejectionReason: !page.eligible ? page.rejectionReason
      : dimensions === false ? "Dimensions are incompatible."
      : quantity === false ? "Quantity is incompatible."
      : design.match === false ? "Design identity is not sufficiently supported."
      : wrongPackage ? "Package type is incompatible." : ""
  };
}
