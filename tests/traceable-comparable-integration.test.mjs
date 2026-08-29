import assert from "node:assert/strict";
import test from "node:test";

import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import {
  GOVERNED_RESEARCH_APPLICABILITY,
  classifyGovernedResearchOutcome
} from "../lib/cognitive-learning/adapter.js";
import { dedupeUnderlyingOffers } from "../lib/evidence/dedupe.js";
import {
  OBJECT_EVIDENCE_CLASSIFICATION,
  verifyObjectEvidenceCandidate
} from "../lib/object-intelligence/index.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

function marketContext(itemType, productTitle) {
  return {
    itemType,
    productTitle,
    subjectIdentity: itemType,
    exactProductIdentity: "",
    retailEvidenceMode: "general",
    unsupportedIdentityTerms: []
  };
}

function itemOffer({
  id,
  title,
  level = "CLOSE",
  match = "Partial",
  snippet = "",
  compatible = true,
  position = 1,
  url = `https://www.ebay.com/itm/${id}`
}) {
  return {
    sourceRecordId: `trace-${id}`,
    title,
    snippet,
    url,
    canonicalUrl: url,
    destinationUrl: url,
    domain: "ebay.com",
    sourceType: "organic",
    pageType: "product_or_listing",
    comparableLadderLevel: level,
    identityMatchStrength: match,
    itemTypeCompatible: compatible,
    itemTypeCompatibilityStatus: compatible ? "compatible" : "item_type_mismatch",
    displayedPriceText: "",
    parsedPrice: null,
    position
  };
}

function productPage(name, price) {
  return `<html><head>
    <meta property="product:price:amount" content="${price}">
    <script type="application/ld+json">${JSON.stringify({
      "@type": "Product",
      name,
      offers: { "@type": "Offer", price: String(price), priceCurrency: "USD" }
    })}</script>
  </head><body><h1>${name}</h1><p>Current price $${Number(price).toFixed(2)}. In stock.</p></body></html>`;
}

function researchOutcome(overrides = {}) {
  return {
    providerCallsAttempted: 3,
    providerCallsSucceeded: 3,
    transportFailureCount: 0,
    traceableSourceCount: 3,
    normalizedCandidateCount: 3,
    exactComparableCount: 0,
    closeComparableCount: 0,
    categoryComparableCount: 0,
    priceBearingComparableCount: 0,
    strategyDiscardedCandidateCount: 0,
    serializationLossCount: 0,
    unsupportedQueryTermCount: 0,
    weakPriceProvenanceCount: 0,
    valueJudgmentExceedsEvidenceCount: 0,
    groundedPlan: true,
    fullLadderExecuted: true,
    ...overrides
  };
}

test("query cleanup is bounded and category-agnostic", () => {
  const context = {
    retailEvidenceMode: "general",
    unsupportedIdentityTerms: ["ImaginaryCo", "UnverifiedMaker"]
  };
  const cases = [
    ["One desk lamp visible in the photo. Body appears to be brushed brass. ImaginaryCo", /desk lamp/i, /brushed brass/i],
    ["One oval serving bowl shown. Body has blue glaze and a scalloped rim. UnverifiedMaker", /serving bowl/i, /blue glaze|scalloped rim/i],
    ["The garment looks like a denim jacket in the image, maybe cotton. ImaginaryCo", /denim jacket/i, /denim jacket/i]
  ];

  for (const [narrative, category, supportedDetail] of cases) {
    const query = hooks.finalizeSearchQueryCandidate(narrative, context, 16);
    assert.match(query, category);
    assert.match(query, supportedDetail);
    assert.doesNotMatch(query, /\b(?:visible|shown|photo|image|appears|looks|maybe)\b/i);
    assert.doesNotMatch(query, /ImaginaryCo|UnverifiedMaker|[.!?;]/i);
    assert(hooks.splitQueryTermsPreservingQuotes(query).length <= 16);
  }
});

test("the two-attempt direct-offer ceiling hydrates one exact and one close URL and reports the rest", async () => {
  const network = installHardNetworkDenial();
  try {
    const context = marketContext("desk lamp", "brass desk lamp");
    const exact = itemOffer({ id: "710", title: "Brass desk lamp", level: "EXACT", match: "Exact", position: 1 });
    const sameExactUrl = { ...exact, sourceRecordId: "trace-710-second-query" };
    const secondExact = itemOffer({ id: "711", title: "Brass desk lamp", level: "EXACT", match: "Exact", position: 2 });
    const close = itemOffer({ id: "720", title: "Brass-tone adjustable desk lamp", level: "CLOSE", position: 1 });
    const secondClose = itemOffer({ id: "721", title: "Metal adjustable desk lamp", level: "CLOSE", position: 2 });
    const categoryOnly = itemOffer({ id: "730", title: "Desk lighting guide", level: "CATEGORY", match: "Reference Only" });
    const requestRecords = [];
    const visited = [];

    const records = await hooks.executeExactRetailPageDirectEnrichment({
      context,
      identity: { category: "desk lamp", subjectIdentity: "desk lamp" },
      providerRequestRecords: requestRecords,
      currentRecords: [exact, sameExactUrl, secondExact, close, secondClose, categoryOnly],
      directPageAttemptBudget: hooks.createPhysicalAttemptBudget(2, "focused_trace_test"),
      requestAdapter: async (url) => {
        visited.push(url);
        if (url === close.url) {
          return {
            statusCode: 200,
            finalUrl: url,
            elapsedMs: 1,
            html: "<html><body><h1>Unrelated page shell</h1></body></html>",
            sourceEvidenceText: ""
          };
        }
        return {
          statusCode: 200,
          finalUrl: url,
          elapsedMs: 1,
          html: productPage("Brass desk lamp", 68),
          sourceEvidenceText: "Brass desk lamp. Current price $68.00. In stock."
        };
      }
    });

    assert.deepEqual(visited, [exact.url, close.url]);
    assert.equal(new Set(visited).size, 2);
    assert.equal(requestRecords.length, 2);
    assert(requestRecords.every((record) => record.physicalAttemptCount === 1));
    assert.equal(new Set(records
      .filter((record) => record.enrichmentDisposition === "DIRECT_PAGE_HYDRATED")
      .map((record) => record.canonicalUrl)).size, 1);
    assert(records.some((record) => record.enrichmentDisposition === "DIRECT_PAGE_HYDRATION_NO_SUPPORTED_EVIDENCE"));
    assert(records.some((record) => record.enrichmentDisposition === "DIRECT_PAGE_HYDRATION_CEILING_EXCLUDED"));
    assert.equal(network.attempts.length, 0);

    const retained = records.find((record) => record.canonicalUrl === exact.url);
    const finalEvidenceResult = {
      acceptedRecords: [retained],
      customerEvidence: [retained],
      views: { displayedIds: [retained.sourceRecordId], priceBearingIds: [retained.sourceRecordId] }
    };
    const funnel = hooks.buildComparableFunnelDiagnostics({
      providerSourceRecords: records,
      sourceAcquisitionRecords: [exact, close, secondExact, secondClose],
      providerRequestRecords: [
        ...["EXACT", "CLOSE", "CATEGORY"].map((level) => ({
          comparableLadderLevel: level,
          query: `${level.toLowerCase()} desk lamp`,
          attempted: true,
          physicalAttemptCount: 1,
          succeeded: true,
          providerSourceCount: 1
        })),
        ...requestRecords
      ],
      finalEvidenceResult
    }, { finalEvidenceResult });
    assert.equal(funnel.stageCounts.directPageHydrationAttempted, 2);
    assert.equal(funnel.stageCounts.directPageHydrationSucceeded, 2);
    assert.equal(funnel.stageCounts.priceBearingRetention, 1);
    assert(funnel.rejectionReasons.directPageCeilingExcluded >= 1);
    assert.equal(funnel.rejectionReasons.directPageNoSupportedEvidence, 1);
    assert.equal(funnel.fullLadderExecuted, true);
  } finally {
    network.restore();
  }
});

test("authenticated prices survive across object classes while price noise and category prices fail closed", () => {
  const lampContext = marketContext("table lamp", "brass table lamp");
  const lampIdentity = { category: "table lamp", subjectIdentity: "table lamp" };
  const parsed = hooks.parseSerperResponse({
    organic: [{
      title: "Brass table lamp active listing",
      link: "https://www.ebay.com/itm/740",
      snippet: "Current price $48.00 for this item-specific offer."
    }],
    shopping: [{
      title: "Brass table lamp",
      link: "https://www.ebay.com/itm/741",
      source: "eBay",
      price: "$51.00"
    }]
  }, { query: "brass table lamp", comparableLadderLevel: "CLOSE" });
  const providerPrices = hooks.normalizeSerperCandidateRecords(parsed.records, lampIdentity, lampContext, null);
  assert.deepEqual(providerPrices.map((record) => record.parsedPrice), [48, 51]);
  assert.deepEqual(providerPrices.map((record) => record.priceProvenance), [
    "SERPER_SEARCH_RESULT_METADATA_PRICE",
    "SERPER_SHOPPING_STRUCTURED_PRICE"
  ]);
  assert(providerPrices.every((record) => record.priceAuthenticated === true));

  const supported = [
    ["power tool", "cordless drill", "18 volt cordless drill", 74],
    ["tableware", "serving bowl", "oval stoneware serving bowl", 29],
    ["lighting", "table lamp", "brass table lamp", 52]
  ];
  for (const [label, itemType, title, amount] of supported) {
    const context = marketContext(itemType, title);
    const [record] = hooks.normalizeSerperCandidateRecords([{
      ...itemOffer({ id: label.replace(/\W/g, "-"), title }),
      pageHtml: productPage(title, amount)
    }], { category: itemType, subjectIdentity: itemType }, context, null);
    assert.equal(record.priceAuthenticated, true, `${label} price should authenticate.`);
    assert.equal(record.priceProvenance, "DIRECT_PRODUCT_PAGE_STRUCTURED_PRICE");
    assert.equal(record.parsedPrice, amount);
    assert.equal(record.itemTypeCompatible, true);
    assert.match(record.identityMatchStrength, /Strong Similar|Partial/);
    assert.notEqual(record.identityMatchStrength, "Exact");
  }

  const noisy = [
    ["shipping", "Brass table lamp", "Shipping $15.00"],
    ["financing", "Brass table lamp", "Pay $12.00 per month with financing"],
    ["reference", "Brass table lamp", "List price $90.00"],
    ["accessory", "Replacement shade compatible with table lamp", "Current price $18.00"]
  ].map(([id, title, snippet]) => {
    const amount = Number(snippet.match(/\$(\d+(?:\.\d+)?)/)?.[1]);
    return {
      ...itemOffer({ id, title, snippet }),
      displayedPriceText: `$${amount.toFixed(2)}`,
      parsedPrice: amount
    };
  });
  const suppressed = hooks.normalizeSerperCandidateRecords(noisy, lampIdentity, lampContext, null);
  assert(suppressed.every((record) => record.priceAuthenticated === false && record.parsedPrice === null));
  assert.equal(hooks.extractDisplayedPrice("Shipping $15.00"), "");
  assert.equal(hooks.extractDisplayedPrice("List price $90.00"), "");

  const [categoryReference] = hooks.buildCanonicalEvidenceObservations([{
    ...itemOffer({ id: "broad-lamp", title: "Lamp category overview", level: "CATEGORY", match: "Reference Only" }),
    displayedPriceText: "$52.00",
    parsedPrice: 52,
    priceAuthenticated: true,
    priceProvenance: "SERPER_SEARCH_RESULT_METADATA_PRICE"
  }], { identity: lampIdentity, context: lampContext });
  assert.equal(categoryReference.parsedPrice, null);
  assert.equal(categoryReference.price, undefined);
  assert.equal(categoryReference.pricingAuthority, "CATEGORY_CONTEXT_ONLY");
});

test("close grading, deduplication, research status, and numeric projection share one evidence boundary", () => {
  const objectState = {
    canonicalResearchIdentity: { objectCategory: "serving bowl" },
    resolvedIdentity: { selectedCandidateId: "bowl-family", broaderFallbackIdentity: "oval serving bowl" },
    identityHypotheses: [{ candidateId: "bowl-family", broaderFamilyIdentity: "oval serving bowl" }],
    observedFacts: [
      { factType: "material", value: "stoneware" },
      { factType: "shape", value: "oval" }
    ]
  };
  const source = {
    title: "Oval stoneware serving bowl",
    url: "https://www.etsy.com/listing/800/oval-bowl",
    itemTypeCompatible: true,
    identityMatchStrength: "Strong Similar"
  };
  const offer = verifyObjectEvidenceCandidate(objectState, {
    ...source,
    snippet: "Active marketplace offer; maker and exact pattern are not stated."
  });
  const reference = verifyObjectEvidenceCandidate(objectState, {
    ...source,
    snippet: "Reference article; maker and exact pattern are not stated."
  });
  assert.equal(offer.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.COMPATIBLE_ALTERNATIVE);
  assert.equal(offer.verificationState, "COMPATIBLE");
  assert.equal(reference.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.INSUFFICIENT_EVIDENCE);
  assert.equal(reference.verificationState, "UNRESOLVED");

  const url = "https://www.etsy.com/listing/801/stoneware-bowl";
  const snippetObservation = {
    sourceRecordId: "snippet-bowl",
    offerId: "bowl-801",
    title: "Oval stoneware serving bowl",
    destinationUrl: `${url}?utm_source=search`,
    sourceQuality: "search_snippet",
    itemTypeCompatible: true,
    identityMatchStrength: "Partial",
    sourcePublishedAt: "2026-08-20",
    price: null
  };
  const pageObservation = {
    ...snippetObservation,
    sourceRecordId: "page-bowl",
    destinationUrl: url,
    sourceQuality: "direct_product_page",
    directProductPage: true,
    identityMatchStrength: "Strong Similar",
    sourcePublishedAt: "2026-08-25",
    price: 29,
    parsedPrice: 29,
    priceType: "Active Asking",
    fieldProvenance: { price: "DIRECT_PRODUCT_PAGE_STRUCTURED_PRICE" }
  };
  const [deduped] = dedupeUnderlyingOffers([snippetObservation, pageObservation]);
  assert.equal(deduped.sourceRecordId, "page-bowl");
  assert.equal(deduped.price, 29);
  assert.deepEqual(deduped.observationIds, ["page-bowl", "snippet-bowl"]);
  assert.equal(deduped.fieldProvenance.price, "DIRECT_PRODUCT_PAGE_STRUCTURED_PRICE");

  const unpricedOutcome = classifyGovernedResearchOutcome(researchOutcome({ closeComparableCount: 1 }));
  const pricedOutcome = classifyGovernedResearchOutcome(researchOutcome({
    closeComparableCount: 1,
    priceBearingComparableCount: 1
  }));
  assert.equal(unpricedOutcome.classification, GOVERNED_RESEARCH_APPLICABILITY.INSUFFICIENT);
  assert.equal(pricedOutcome.classification, GOVERNED_RESEARCH_APPLICABILITY.CLEAR);

  const response = hooks.reconcileCanonicalResponsePriceState({
    valuationEvidenceState: "supported",
    pricingEvidenceState: "supported",
    currentPriceAssessment: "A numeric range is available.",
    estimatedMarketValue: "$25-$35",
    recommendedListingPrice: "$32"
  }, {
    workflow: "listing",
    reliableResearchFound: true,
    finalEvidenceResult: {
      acceptedRecords: [{ evidenceId: "reference-only", price: null }],
      views: { acceptedIds: ["reference-only"], priceBearingIds: [] },
      rangeResult: { status: "insufficient", low: null, high: null }
    }
  });
  assert.equal(response.pricingEvidenceState, "insufficient");
  assert.equal(response.estimatedMarketValue, "");
  assert.equal(response.recommendedListingPrice, null);
  assert.match(response.currentPriceAssessment, /no retained priced canonical evidence is available/i);
});
