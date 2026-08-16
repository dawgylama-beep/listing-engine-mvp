import {
  ROOT,
  compactJson,
  compareInventories,
  inventoryRoot,
  normalizePath,
  readJson,
  readUtf8,
  sealRecord,
  sha256,
  verifySeal,
  writeCreateOnly,
} from "./version-1.12.35-boolean-predicate-successor-v1-identity.mjs";

export {
  ROOT,
  compactJson,
  compareInventories,
  inventoryRoot,
  normalizePath,
  readJson,
  readUtf8,
  sealRecord,
  sha256,
  verifySeal,
  writeCreateOnly,
};

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function validateMember(member, label) {
  if (typeof member !== "object" || member === null || Array.isArray(member) === true) throw new Error(`${label}:EXPECTED_PLAIN_OBJECT`);
  const keys = Object.keys(member).sort();
  if (compactJson(keys) !== compactJson(["byteLength", "relativePath", "sha256"])) throw new Error(`${label}:EXACT_KEYS_REQUIRED`);
  if (typeof member.relativePath !== "string" || member.relativePath.length === 0 || member.relativePath !== normalizePath(member.relativePath)) throw new Error(`${label}.relativePath:EXPECTED_NORMALIZED_NONEMPTY_STRING`);
  if (typeof member.byteLength !== "number" || Number.isInteger(member.byteLength) !== true || member.byteLength < 0) throw new Error(`${label}.byteLength:EXPECTED_NONNEGATIVE_INTEGER`);
  if (typeof member.sha256 !== "string" || /^[0-9a-f]{64}$/.test(member.sha256) !== true) throw new Error(`${label}.sha256:EXPECTED_SHA256`);
  return member;
}

export function validateInventoryMembers(value, label) {
  if (Array.isArray(value) !== true) throw new Error(`${label}:EXPECTED_ARRAY`);
  value.forEach((member, index) => validateMember(member, `${label}[${index}]`));
  const paths = value.map((member) => member.relativePath);
  if (new Set(paths).size !== paths.length) throw new Error(`${label}:DUPLICATE_PATHS`);
  return value;
}

export function compareInventoryMemberSets(expectedMembers, actualMembers) {
  validateInventoryMembers(expectedMembers, "expectedMembers");
  validateInventoryMembers(actualMembers, "actualMembers");
  const expectedByPath = new Map(expectedMembers.map((member) => [member.relativePath, member]));
  const actualByPath = new Map(actualMembers.map((member) => [member.relativePath, member]));
  const missing = [...expectedByPath.keys()].filter((relativePath) => actualByPath.has(relativePath) !== true).sort();
  const unexpected = [...actualByPath.keys()].filter((relativePath) => expectedByPath.has(relativePath) !== true).sort();
  const changed = [...expectedByPath.keys()].filter((relativePath) => {
    if (actualByPath.has(relativePath) !== true) return false;
    const expected = expectedByPath.get(relativePath);
    const actual = actualByPath.get(relativePath);
    return expected.byteLength !== actual.byteLength || expected.sha256 !== actual.sha256;
  }).sort();
  const equal = missing.length === 0 && unexpected.length === 0 && changed.length === 0;
  const reboundFiles = equal === true ? expectedMembers.map((member) => actualByPath.get(member.relativePath)) : [];
  const reboundPaths = reboundFiles.map((member) => member.relativePath);
  return {
    equal,
    missing,
    unexpected,
    changed,
    expectedCount: expectedMembers.length,
    actualCount: actualMembers.length,
    reboundPathSetSha256: equal === true ? sha256(compactJson(reboundPaths)) : null,
    reboundAggregateSha256: equal === true ? sha256(compactJson(reboundFiles)) : null,
  };
}

export function adjudicationTuplesToMembers(value) {
  if (Array.isArray(value) !== true) throw new Error("adjudication.members:EXPECTED_ARRAY");
  const members = value.map((tuple, index) => {
    if (Array.isArray(tuple) !== true || tuple.length !== 3) throw new Error(`adjudication.members[${index}]:EXPECTED_THREE_ITEM_ARRAY`);
    const [relativePath, byteLength, fileSha256] = tuple;
    return validateMember({ relativePath, byteLength, sha256: fileSha256 }, `adjudication.members[${index}]`);
  });
  validateInventoryMembers(members, "adjudication.members");
  return members;
}

export function requireOwnAbsent(value, key, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value) === true) throw new Error(`${label}:EXPECTED_PLAIN_OBJECT`);
  if (own(value, key) === true) throw new Error(`${label}.${key}:EXPECTED_ABSENT_OWN_PROPERTY`);
  return true;
}
