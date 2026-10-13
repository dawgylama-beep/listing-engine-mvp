import { cleanObjectText } from "./stable.js";

// Apply to submitted identity only: source descriptions retain exclusion signals.
export function wholeObjectCategory(value) {
  const text = cleanObjectText(value, 240).replace(/^(?:a|an|the)\s+/i, "");
  const head = text.split(/\s+(?:with|holding|containing|filled\s+with|displaying|pictured\s+with)\b/i)[0].trim();
  return head || text;
}

export function literalVisibleIdentity(value) {
  const text = cleanObjectText(value, 2000);
  const prefix = text.split(/\s+(?:Visible\s+)?(?:brand|dial|label|maker)\s+(?:text|wording)\s*:/i)[0];
  const field = text.match(/^(?:Visible\s+)?(?:brand|dial|label|maker)\s+(?:text|wording)\s*:\s*([^,;]+)/i);
  const namedWord = text.match(/^(?:the\s+)?(?:dial|label|mark|logo|plate|tag)\s+includes\s+the\s+word\s+(.+?)(?:\s+and\b|$)/i);
  const mark = field?.[1] || namedWord?.[1] || prefix.replace(/\s+(?:name\s+)?(?:printed|marked|shown)\s+(?:(?:clearly|centrally|visibly)\s+)?on\s+(?:the\s+)?(?:dial|label|plate|tag).*$/i, "");
  return /^(?:the\s+)?(?:dial|label|plate|tag)\s+(?:includes|has|shows)\b/i.test(mark) ? "" : mark.trim();
}
