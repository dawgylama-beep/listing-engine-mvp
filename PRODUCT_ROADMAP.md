# Katherine’s Eye Roadmap

## Version 1.0 (Completed)
- Web MVP
- Photo upload
- Platform selection
- AI listing generation
- Copy-ready output
- Individual copy buttons
- Copy All
- Responsive design
- OpenAI API integration

## Version 1.1 (Completed)
- Check Market Value
- Prompt refinement from beta feedback
- Platform-specific optimization
- Improved pricing intelligence
- Collector psychology improvements
- Listing history
- Better image handling
- UI polish

## Version 1.2 (Completed)
- Worth Buying can run without a selected marketplace platform
- General resale market logic when no platform is selected
- Platform-specific observations when a platform is selected

## Version 1.3 (Completed)
- Price Confidence added to Market Intelligence
- Price Basis added to Market Intelligence
- Clear disclosure that live marketplace sold-comps are not searched yet

## Version 1.4 (Completed)
- Buyer-first Market Intelligence
- Purchaser decision guidance
- Item clarity scoring
- Current price assessment
- Better-price check guidance
- Suggested manual search terms
- Live source-backed search remains future/not implemented

## Version 1.4.1 (Completed)
- Marketplace Sweep / Where To Check added to Worth Buying
- Broader cross-marketplace manual-check guidance
- Category-specific marketplace priorities for decor, fashion, electronics, furniture, and collectibles
- Clear disclosure that live marketplace search is not performed yet

## Version 1.5 (Completed)
- Source-routed live comparable search for Worth Buying
- Live Comparable Search Status added
- Comparable Items Found shown only for source-backed results
- Source routing avoids defaulting to eBay
- AI-only fallback preserved when live search is unavailable or unreliable

## Version 1.5.1 (Completed)
- User-facing live comps wording clarified
- Exact and similar comparable items separated
- No Reliable Comparable Items Found added
- Marketplace Sweep replaced with Search Coverage
- Suggested Search Terms replaced with Search Queries Used

## Version 1.5.2 (Completed)
- Live comparable search query quality improved
- Product-focused query types added
- Visible text, box wording, visual description, and price context emphasized
- No Reliable Comparable Items Found transparency improved

## Version 1.5.3 (Completed)
- Live-search diagnostics added
- Clearer live-search status states
- Edge-style confidence layers added
- AI-only rough value labeling added
- Valuation reality guardrails added

## Version 1.5.4 (Completed)
- Photo text identity extraction improved
- Box and back-label wording preserved for live comps
- Holiday decor / collectible source routing improved
- Santa's Workshop / Hubbard Ohio / SKU-style query quality improved
- Search Coverage source summaries cleaned up

## Version 1.6.0 (Completed)
- Guided Buyer Intake added for Worth Buying
- Structured purchase context captured
- Asking-price awareness added with raw and parsed values
- Purchase intent captured for personal use, resale, or both
- Condition concerns captured as structured inputs
- Optional known identity details added for item name, brand, manufacturer, model, SKU, UPC, and age/era
- Mode-specific notes validation added
- Buyer-context source routing improved
- Confidence inputs improved for identification, live comps, valuation, and buyer decision

## Version 1.6.1 (Completed)
- Worth Buying resale reports now include explicit suggested listing price, expected sale price, minimum acceptable price, recommended selling platform, expected selling time, and platform-specific selling guidance
- Selected marketplace platform is treated as the intended resale platform when purchase intent is resale or both
- Personal-use Worth Buying reports do not force resale pricing
- Collectible, organization, logo, mascot, ceramic, cookie-jar, decor, and secondhand source routing now prioritizes resale, vintage, collector, exact-label, brand/organization, and reference-style searches
- Weak wholesale, restaurant-supply, bulk import/manufacturing, unrelated current-retail, and generic lookalike sources are rejected as meaningful comps
- Visible app branding updated to Marketplace Edge

## Version 1.6.2 (Completed)
- Known Item Details now appears as a clear native collapsible dropdown with helper text, visible chevron state, hover feedback, focus feedback, and mobile-friendly tap target
- Existing known-detail field IDs, names, buyerIntake payload behavior, Worth Buying behavior, and Generate Listing behavior preserved

## Version 1.6.3 (Completed)
- Condition Concerns now appears as a clear native collapsible dropdown matching the Known Item Details card, chevron, hover, focus, and mobile tap-target treatment
- Existing condition concern checkbox names, values, multi-select behavior, buyerIntake payload behavior, Worth Buying behavior, and Generate Listing behavior preserved

## Version 1.6.4 (Completed)
- Built-in How to Use Marketplace Edge guide added near the top of the form as a native collapsed-by-default dropdown matching the existing collapsible card style
- Quick Start, Worth Buying, photo guidance, Known Item Details, Condition Concerns, result interpretation, confidence, Need More Info, Generate Listing, and reminder sections added without changing buyerIntake, Worth Buying, Generate Listing, photo upload, API, prompt, or routing behavior

## Version 1.6.5 (Completed)
- Low-confidence Worth Buying guardrails now force weak-evidence resale cases toward Pass, Need More Info, or a substantially discounted speculative ceiling instead of optimistic Buy/Negotiate guidance
- AI-only resale ranges are labeled as uncertain advertised guidance, expected sale price is conservative, unsupported resale floors are blocked, and Generate Listing behavior remains unchanged

## Version 1.7.0 (Completed)
- Buyer Risk Score added to Worth Buying with a 0-100 risk score, risk level, plain-language summary, primary risk factors, and risk-reduction actions
- Worth Buying results now display a dedicated risk card near the top, align high-risk scores with conservative recommendations, and preserve Generate Listing behavior

## Version 1.7.1 (Completed)
- Buyer Risk Score now separates evidence uncertainty from purchase downside so weak evidence alone does not force maximum risk when dollar exposure is minimal
- Low-dollar speculative purchases now remain clearly labeled as uncertain, while added costs, safety, authenticity, repair, storage, disposal, and fraud exposure can keep risk High or Very High
- Recommendation alignment now blocks unexplained Very High Risk / Buy combinations and clarifies low-confidence speculative buys without changing Generate Listing behavior

## Version 1.7.2 (Completed)
- Generate Listing now reuses the shared item identity, source routing, query generation, live research, comparable filtering, and confidence foundation used by Worth Buying
- Listing output now displays identified item, photo evidence, search queries, sources searched, research results, comparable quality, recommended listing price, offer range, pricing confidence, and pricing rationale
- Listing prices are labeled as low confidence when live research is unavailable or no source-backed exact or strong similar comps pass filtering
- Active asking prices are not treated as sold evidence, and unsupported comps are not allowed to drive recommended listing price
- Local Windows server parity updated for evidence-backed listing research

## Version 1.8.0 (Completed)
- Everyday-consumer decision layer added for Buying for Myself
- Buying for Myself now produces value rating, personal-use recommendation, fair price range, recommended offer, walk-away guidance, condition risks, better-value considerations, research results, comparable quality, and pricing confidence
- Buying to Resell remains separated from consumer logic and continues to use resale profit, fees, shipping, risk, margin, and platform guidance
- Consumer decisions now use centralized price-to-value thresholds plus condition, identity, comparable quality, confidence, and risk flags
- Personal-use reports display a prominent summary card with value rating, recommendation, asking price, estimated fair value, recommended offer, and pricing confidence
- Market Edge now supports personal-use buying, resale buying, and selling from the same shared research foundation

## Version 1.8.1 (Completed)
- Dynamic workflow state repaired for Buying for Myself, Buying to Resell, Check Market Value, and Generate Listing
- Workflow changes now immediately update visible controls, helper text, required fields, output headings, submit labels, and empty states
- Previous workflow results, copy-button state, validation messages, and loading state are cleared when switching modes
- In-flight requests are cancelled or ignored if the user switches workflows before the response returns
- Generate Listing platform validation now becomes required immediately when that workflow is selected and optional again when leaving it

## Version 1.8.2 (Completed)
- Ask Market Edge added as a context-aware current-item follow-up feature for all four workflows
- Current item sessions now preserve structured report context, buyer intent, selected workflow, source coverage, pricing evidence, listing fields, and short conversation history
- Follow-up answers distinguish current report evidence, user-provided scenario details, assumptions, and unavailable information without claiming a new live search
- New Item clears the report, stale research context, Ask conversation, calculated values, and old in-flight responses
- Mobile-first beta readiness pass added for workflow controls, Ask Market Edge, result cards, touch targets, copy buttons, and long-text wrapping
- Major feature development should freeze after Version 1.8.2 except for visual repair, mobile polish, reliability fixes, wording improvements, and beta-discovered defects

## Version 1.8.3 (Completed)
- Identity Evidence Reconciliation separates broad subject recognition from exact product verification
- User-provided identity is preserved as evidence when photos are consistent, without inventing exact maker, date, licensing, authenticity, or comparable matches
- Exact comparable failure now lowers exact-product, pricing, and comparable confidence without erasing a supported subject identity
- Reports now show Subject Identity, Subject Confidence, Exact Product Identity, Exact Product Confidence, Maker / Date / Licensing Status, What Is Known, and What Is Still Unknown
- Broad subject identity now drives useful fallback queries when exact product identifiers are missing
- Ask Market Edge can explain subject identity versus exact product, maker, licensing, authenticity, and comparable certainty

## Version 1.8.4 (Completed)
- Visual Intelligence Engine added as a universal first-stage analysis layer before exact product identification, live research, comparable analysis, valuation, or listing generation
- Reports now show a concise Visual Recognition summary with visual subject, subject category, visual confidence, recognized clues, supporting evidence, and still-unknown items
- Visual subject recognition remains independent from exact product, maker, era, licensing, authenticity, comparable, and pricing confidence
- Search generation now starts from the broad visual subject and then narrows toward organization, brand, character, visible words/letters, maker, model, SKU, UPC, or other identifiers
- Artwork, logos, mascots, advertising, historical graphics, signs, plaques, prints, political memorabilia, military insignia, vintage packaging, and similar subjects now route toward reference-style searches before marketplace-only analysis
- Ask Market Edge now answers visual identity questions from the Visual Recognition layer first

## Version 1.8.4.1 (Completed)
- Ask Market Edge instructions aligned with current-item session context, active report authority, workflow-specific reasoning, visual intelligence, scenario recalculation, and research-honesty rules
- Follow-up question routing now explicitly distinguishes explanation, price scenario, condition update, research clarification, evidence request, listing revision, platform guidance, new live search request, and unsupported/unrelated questions
- New-search follow-ups are labeled truthfully: Ask Market Edge must not claim a new search occurred unless source-backed new results are available
- Ask Market Edge now emphasizes one-best-next-evidence guidance instead of long generic checklists when more proof is needed
- This is an instruction-alignment patch, not a new feature release
- No additional major engine features should be added after Version 1.8.4.1; beta work should focus on visual polish, mobile polish, wording improvements, reliability, bug fixes, and beta feedback

## Version 1.9.0 (Completed)
- Beta polish and user experience pass completed without changing the core Market Edge engine
- Every workflow now starts completed results with an Executive Summary card before detailed research
- Reports are organized into Executive Summary, Why, Research Details, and Ask Market Edge conversation flow
- Confidence explanations, Why expansion, final appraiser-style summary, staged loading, clearer photo intake, removable thumbnails, improved copy confirmation, and lightweight beta feedback were added
- Mobile spacing, wrapping, touch targets, focus states, and report scanning were tightened for beta readiness

## Version 1.9.1 (Completed)
- Valuation evidence labels now use one centralized state: supported, preliminary, or insufficient
- Weak active-listing or partial evidence is labeled as a Preliminary Reference Range, not Estimated Fair Value
- Insufficient evidence reports now show Fair Value: Not established instead of a false-precision value range
- Executive Summary, detailed report cards, copy output, and Ask Market Edge context now use the same valuation evidence labels
- Active asking prices remain reference evidence only and are not described as confirmed sold evidence or verified fair market value

## Version 1.9.2 (Completed)
- Buying for Myself now exposes visible research evidence buckets instead of hiding weak, partial, reference, or rejected results
- Research Details now shows Search Queries, Sources Searched, Strong Comparables, Partial Comparables, Reference Results, Weak or Rejected Matches, and Search Limitations
- Preliminary Reference Range is blocked unless visible strong, partial, or reference records are returned and displayed
- Source records render as mobile-friendly cards with source, URL, displayed price, price type, classification, evidence role, and rejection reason when available
- Ask Market Edge context now includes the visible research records needed to answer questions about found listings, rejected comps, and asking-versus-sold evidence

## Version 1.9.3 (Completed)
- Buying for Myself now prioritizes exact visible wording, brand/event/date/team/item-type combinations, and multi-photo text clues before broad fallback searches
- Branded sports, advertising, promotional, commemorative, and collectible items route toward resale, auction/archive, collector/reference, and exact web sources before generic retail
- Exact active listings can be retained as exact identity matches while still labeled honestly as active asking-price evidence, not confirmed sold evidence
- Consumer decisions now use centralized low-dollar downside logic so low confidence no longer automatically forces Need More Information when exact visible evidence supports a cautious Buy
- Research limitations now distinguish acquisition failure, filtering failure, missing URL citations, weak matches, and price-evidence limitations

## Version 1.9.4 (Completed)
- Search pipeline diagnostics now record generated queries, queries sent, provider call counts, raw/parsed/normalized/retained result counts, rejection reasons, and acquisition failure stage
- Research Details now includes Technical Search Details so beta users can see where search results disappeared without exposing secrets
- Zero visible retained comparable evidence now forces Fair Value: Not established and prevents unsupported market ranges, reference centers, ratios, or inferred fair-market-value claims
- Model-generated unsupported market-value wording is sanitized after the report is produced, including copied text and Ask Market Edge context
- Low-dollar personal-use Buy/Cautious Buy can still appear only as limited-downside reasoning, not as a market-value comparison

## Version 1.9.5 (Completed)
- Live-search diagnostics now separate internal research prompts, generated queries, prioritized queries, actually attempted query strings, provider request records, and provider response summaries
- Worth Buying live comps now send prioritized query-bound OpenAI web_search requests and record per-query attempted/succeeded/result-count/failure-stage details
- Client-visible API, local server, Ask Market Edge context, copied output, and mobile diagnostics now filter internal prompt fragments and literal prompt templates
- New analysis/session identifiers isolate each Generate Listing, Worth Buying, Buying for Myself, and Buying to Resell run from prior item state
- Exact-query generation now prioritizes visible text, brand/team/object, named-person, event/year, marketplace, and fallback diversity while deduplicating clipped repeats
- Technical Search Details now render as readable stacked query cards on mobile without literal \n leakage
- Vintage collectible risk cleanup suppresses unsupported Older Model, No Warranty, and No Return Protection-style conclusions unless the transaction context supports them

## Version 1.9.6 (Completed)
- Live comparable search now runs bounded open-web exact, marketplace-domain, and broader fallback passes using OpenAI web_search where supported
- Marketplace-domain requests preserve allowed domains separately from domains actually returned, so the app does not claim eBay, Etsy, Mercari, or other marketplace results without provider-level evidence
- Technical Search Details now separate provider sources returned, structured candidates created, normalized candidates, visible comparable/reference records retained, rejected candidates, and acquisition failure stage
- Exact-query cleanup removes unsupported verbose wording such as limited-edition or visual-layout filler unless supported by visible/user evidence
- Worth Buying and Buying for Myself reports now avoid unsupported wait-for-another-item guidance when the decision is a low-dollar Buy without a concrete condition, authenticity, compatibility, safety, price, or return-policy issue
- Completed reports now render under one current report root and end with a single visible End of Report marker for mobile beta readability

## Version 1.9.7 (Completed)
- Serper Google Search is now the primary server-side live comparable acquisition provider when SERPER_API_KEY is configured
- OpenAI web_search remains an honestly labeled fallback when Serper is missing, unavailable, or fails with a controlled provider state
- Serper organic, shopping, and knowledge graph references are parsed into source-backed records while related searches are not treated as evidence
- Comparable diagnostics now separate provider results, organic results, shopping results, unique candidates, retained visible records, rejected candidates, fallback use, and acquisition failure stage
- Visible source cards now show provider, source type, query, search pass, active/sold/reference status, identity match strength, and price evidence type
- Zero-evidence guard still prevents unsupported market values when no visible source-backed evidence is retained

## Version 1.9.8 (Completed)
- Photo-library multi-upload behavior restored for mobile and desktop browsers
- Reopening the photo library now appends newly selected photos instead of replacing prior selections
- Take Photo and Upload Photos now share one ordered 6-photo state so camera captures can be added after library photos
- Removing one thumbnail no longer depends on rewriting the browser-native FileList and does not remove other photos
- Duplicate event processing is guarded by file name, size, last-modified time, and MIME type while allowing removed photos to be selected again

## Version 1.9.9 (Completed)
- Serper query pipeline now validates every candidate before spending a provider call
- Short fragments such as one-token partial words or year-plus-fragment searches are rejected locally with `invalid_query_preflight`
- Marketplace site restrictions are appended to complete identity queries instead of shortening the item identity to make room for domains
- Query cleanup now preserves quoted exact phrases and avoids raw mid-word truncation
- Search diagnostics now show raw candidate, candidate origin, normalized candidate, final query, validation status, and failure reason
- Serper requests continue to use United States English localization with `gl: "us"` and `hl: "en"`

## Version 1.10.0 (Completed)
- Mobile report length repaired by collapsing Technical Search Details by default
- Query diagnostics now render as compact one-line disclosures instead of fully expanded cards
- Invalid/rejected query candidates are summarized by count and reason, with deliberate expansion required to inspect them
- Final report rendering now replaces the current report root instead of appending report content
- Loading progress content is replaced and progress timers are stopped before final report rendering
- End of Report marker remains the final element inside the current report root

## Version 1.10.1 (Completed)
- Search query construction now parses serialized/list-like visible phrases into clean individual phrases before quoting
- Malformed quote/list artifacts, brand-only, person-only, year-only, category-only, generic-only, and fragment-only queries are rejected before provider execution
- Broader fallback queries must retain a concrete product noun and meaningful distinguishing item identity
- Equivalent cleaned queries are deduplicated before provider calls
- Zero-evidence reports can no longer claim comparable evidence supports a decision or preserve unsupported market-value numbers

## Version 1.10.2 (Completed)
- Safari/browser-native `Load failed` errors are normalized into clear user-facing messages
- Submission stage tracking now distinguishes photo read, image processing, API upload, response parsing, and report rendering failures
- Photo read and image conversion failures are caught before the API request begins
- Failed submissions preserve selected photos when safe and do not show a completed report state

## Version 1.10.3 (Completed)
- Comparable matching now enforces a strict submitted-item-type versus source-result-item-type compatibility check
- Different physical product forms can no longer be promoted to Exact or Strong Similar matches by shared brand, event, year, team, or theme wording alone
- Mismatched or unknown item types may remain visible only as reference/transparency evidence and cannot influence verified or preliminary price ranges
- Valuation and buyer decision price evidence now excludes mismatched product forms, unknown candidate types, and complete-set versus replacement-piece mismatches

## Version 1.10.4 (Completed)
- Personal Buy reports now include a prominent `Prices Found` section with compatible source-backed visible prices
- Price cards show item price, shipping, delivered cost when known, price type, match quality, listing status, limitations, and source links
- Active asking prices, auction bids, reference prices, and verified sold prices are labeled separately so active listings are not treated as sold comps
- Shipping is never assumed free; delivered cost is calculated only when item price and shipping evidence are both available
- Preliminary Reference Range now uses compatible priced records only and distinguishes verified market influence from preliminary asking-price inclusion

## Version 1.10.5 (Completed)
- Personal Buy reports now end with a concise customer summary, Prices Found/no-compatible-prices status, next best action, Copy Summary, and a collapsed Technical Search Details disclosure
- Full query diagnostics, provider metadata, raw fields, rejected queries, source coverage, and raw source records now stay inside collapsed technical details by default
- Exact no-price WorthPoint/reference matches are treated as `Item Identification Evidence`, not Strong Comparables or price/range evidence
- Recovery search planning now includes exact, reduced, price-oriented, shopping/general, and separate marketplace-domain searches when compatible priced evidence is scarce

## Version 1.10.6 (Completed)
- Personal Buy pricing now separates `Verified Market Range`, `Current Asking-Price Range`, and `Preliminary Reference Range`
- Outlier/reference prices are excluded from the primary customer-facing range while remaining visible in Technical Search Details
- Buyer badges are calibrated so weak, partial, guide, or reference evidence cannot produce `Exceptional Value`
- Opening offers now stay below the target/asking price when cautious negotiation is appropriate

## Version 1.10.7 (Completed)
- Personal Buy price cards now show explicit shipping states and delivered cost only when supported by visible source evidence
- `Best Compatible Price Found`, `Other Compatible Prices Found`, and `Price Spectrum Summary` now give buyers clearer price context before Copy Summary
- Unknown shipping is never treated as free, and known delivered cost can outrank a lower item price with unknown shipping
- `Verified Market Range` now requires qualified sold exact/strong source-backed evidence; active asking and reference prices stay in their own buckets
- Buy recommendations become conditional when the maximum recommended price is below the current asking price

## Version 1.10.8 (Completed)
- Maximum Recommended Price now requires verified sold, active exact/strong, or otherwise qualified exact/strong market support before it can materially exceed the target or asking price
- Weak, partial, guide, auction, estimated, reference, and excluded outlier evidence can provide context but cannot independently establish a high buyer ceiling
- Low-dollar Personal Buy recommendations cap the maximum near the target when pricing evidence is weak
- Reports now include a `Maximum Price Guard` explanation when the maximum is capped or not established
- Regression tests cover the `$10 asking / $135 maximum` failure mode and preserve Version 1.10.7 delivered-cost behavior

## Version 1.10.9 (Completed)
- Verified Sold now requires explicit completed-transaction proof, visible transaction price, compatible item identity, and compatible quantity/format
- Social posts, thrift-haul content, blogs, collector discussions, price guides, and bulk/lot references without unit pricing are blocked from customer pricing ranges and buyer targets
- `Best Compatible Price Found` now prioritizes current purchasable active listings with confirmed delivered cost, not historical sold/reference evidence
- Low-dollar Personal Buy decisions stay calibrated when the asking price falls inside a weak preliminary range but no verified sold or active exact-match prices were found
- Regression tests cover the Facebook/thrift-haul bulk-tray failure, current-purchase labeling, and weak-evidence $10 personal-use decision behavior

## Version 1.10.10 (Completed)
- Personal Buy now requires purchase context before research, with Retail store follow-up fields for store name and ZIP/location flow
- Retail-store and online-retailer purchases now route through barcode-first current-retail replacement-cost searches before resale/collectible logic
- Barcode failure is shown directly to the customer, and manual Barcode or UPC entry is supported
- Local Store Context, Retail Price Context, and Package / Unit Price Context explain store, ZIP, current-price, availability, and pack/unit limitations without claiming unsupported inventory
- Retail Personal Buy decisions now avoid unconditional Buy when price is not verified, using conditional labels such as Price Not Verified and Low-Risk Purchase - Limited Evidence
- Regression tests cover purchase-context UI, privacy-safe location behavior, UPC/store queries, pack-count mismatch, retail decision calibration, and preserved 1.10.7-1.10.9 safeguards

## Version 1.10.11 (Completed)
- Canonical Product Identity now reconciles barcode/UPC, visible package/OCR wording, brand, SKU/item number, package count, user notes, purchase context, and store name before live query generation
- Strong barcode, OCR, SKU, and package evidence now outrank weaker visual inference, with unsupported terms such as poster print rejected before search, matching, pricing, and customer-facing report wording
- Retail-store query priority now keeps exact UPC, store + UPC, retailer-domain + UPC, brand + SKU, brand + pack count, store + product, and local competitor queries separate and deduplicated
- Current retail routes suppress resale-oriented sold/auction/historical terms unless the item is explicitly collectible, vintage, discontinued, or in a resale/secondhand context
- Use My Location now invokes browser geolocation on tap, reverse-geocodes to ZIP or general area when possible, and falls back to manual ZIP without storing or displaying precise coordinates
- Technical Search Details now include Canonical Product Identity, Retail Query Integrity, rejected unsupported terms, named-store query status, location outcome, and pack-size mismatch details while remaining collapsed
- Regression tests cover Office Works security-envelope identity reconciliation, poster-print rejection, retail query priority, geolocation flow, location privacy, and preserved 1.10.7-1.10.10 safeguards

## Version 1.10.12 (Completed)
- Ordinary current retail products now use a strict `current-retail-only` evidence mode
- Customer-facing retail decisions exclude auction, historical sold, guide, reference, resale, collector, and secondary-market evidence from current retail value
- Fixed-price retail-store reports now use Retail Purchase Decision, Current Retail Price Assessment, Named Store Result, Retail Price Limit, package/unit comparison, and local availability context instead of offer ladders or Maximum Price Guard language
- Retail reports show `Current Retail Price: Not verified` when no qualified source-backed current retail price is found, without fabricating a range or named-store price
- Package matching now separates exact retail matches, compatible alternatives, unit-price-only comparisons, package-size differences, and rejected retail mismatches
- Technical Search Details now show retail evidence mode, route classification, suppressed query terms, accepted/rejected retail candidates, manual ZIP status, and excluded secondary evidence counts
- Regression tests cover the Office Works/Kroger fixed-price retail path, secondary evidence isolation, query suppression, package mismatch rules, location-denied/manual-ZIP copy, and preserved 1.10.9-1.10.11 safeguards

## Version 1.11.0 (Completed)
- Katherine’s Eye is now the canonical current product identity across active UI, metadata, prompts, local server text, docs, and current tests
- Page title, description, Open Graph/Twitter metadata, Apple title, and PWA manifest now identify the product as Katherine’s Eye
- Ask Katherine’s Eye replaces the former Ask Market Edge customer-facing label while preserving stable internal action identifiers
- Browser location flow now calls `navigator.geolocation.getCurrentPosition()` directly from the Use My Location tap and does not treat permission state `prompt` as denial
- Location failures now distinguish permission denied, position unavailable, timeout, unsupported browser, insecure context, reverse-geocoding failure, ZIP-not-confirmed fallback, manual ZIP, and skipped local pricing
- Vercel response headers allow first-party geolocation with `Permissions-Policy: geolocation=(self)`
- Coordinates are used only ephemerally for reverse geocoding, rounded before lookup, discarded after ZIP/general area resolution, and never shown in reports or diagnostics
- Regression tests cover brand consistency, legacy-storage/no-storage behavior, geolocation error mapping, permission prompt guardrails, privacy safeguards, and preserved 1.10.12 retail behavior

## Version 1.11.1 (Completed)
- Buyer workflow polish now presents the visible path as photos, buying purpose, purchase location, price, condition, optional details, and analyze
- Left-panel wording now uses plain customer language such as Product Details, Condition Notes, Buying Details, and Personal-Use Decision
- Report-only actions now stay hidden until a completed report exists, with empty, loading, failed, and identity-confirmation states kept cleaner
- Empty report placeholders now give concise first-run guidance without forcing a large blank report area
- Report headings and summary copy were tightened for consistency while Technical Search Details remain collapsed
- Mobile spacing, note-field height, card spacing, and first-run report spacing were tightened without changing pricing, search, evidence, shipping, barcode, identity, retail, or location logic
- Regression tests cover buyer workflow order, report-action visibility, customer-facing terminology, empty-state guidance, mobile spacing, and preserved 1.11.0 safeguards

## Version 1.11.2 (Completed)
- Purpose selection now exposes four clear customer workflows: Buying for Myself, Buying to Resell, Value Something I Own, and Sell Something I Own
- Owner-value and seller workflows use ownership/selling details without requiring purchase location, asking price, marketplace platform, or seller notes
- Currency parsing and report formatting now preserve cents across frontend intake, API normalization, local server output, Ask scenario handling, and unsupported-evidence guards
- Retail evidence recovery now distinguishes Exact Retail Match, Strong Retail Alternative, Unit-Price Comparable, Retail Category Context, and Rejected Retail Mismatch while keeping package price and unit price separate
- Photo controls are compacted into camera and library actions, and the initial report state is shorter while report-only actions remain hidden until a completed report exists
- Regression tests cover purpose-specific forms, cents preservation, retail compatible-alternative recovery, compact mobile photo UI, and preserved 1.11.1 safeguards

## Version 1.11.3 (Completed)
- Retail search execution now uses a bounded staged Serper plan for current-retail products, with exact identity, reduced exact-product, compatible-alternative, retailer-specific, and shopping/general recovery allocations
- Compatible current retail alternatives are executed as provider queries instead of only being planned, and exact UPC/store/site searches can no longer consume the entire recovery budget
- Organic and shopping retail result parsing preserves visible package prices while avoiding shipping-only, review-count, and other non-item-price amounts
- Same-family retail pack-count differences now reach retail compatibility review so compatible 40-, 50-, 80-, and 100-count alternatives can be compared by package and unit price without being treated as exact matches
- Customer retail reports now surface accepted compatible alternatives, package price, unit price, unknown shipping, delivered-cost status, and an evidence-based retail purchase decision when current alternatives exist
- Technical Search Details now audit retail stages planned/executed, provider calls used, organic/shopping counts, priced candidates, compatibility counts, rejection reasons, remaining budget, and recovery stop reason
- Regression tests cover retail staged execution, provider budget allocation, organic/shopping price parsing, cents preservation, different-brand alternatives, pack-count tolerance, current-retail evidence isolation, customer-facing alternatives, and preserved 1.11.2 safeguards

## Version 1.11.4 (Completed)
- Barcode integrity now validates UPC-A, EAN-13, EAN-8, and GTIN-14 check digits before exact retail barcode searches can execute
- Invalid barcode candidates are retained in Technical Search Details, suppressed from exact-provider queries, and can be replaced by alternate valid visible/manual candidates only when supported
- Current-retail fallback now builds a reusable package-attribute identity from product type, use, size, quantity, closure, material feature, brand, SKU, and validated barcode evidence
- Exact private-label, SKU, or UPC misses continue into bounded cross-brand recovery without requiring brand equality for functionally compatible current retail alternatives
- Candidate filtering now rejects barcode mismatches, unrelated product categories, incompatible explicit sizes, missing material security/privacy features, secondary-market evidence, and nontransactional pages before customer pricing
- Customer retail reports separate exact-product misses from compatible alternatives, preserve package price and unit price, show entered-price unit math, and keep unknown shipping as Not shown / Not established
- Technical Search Details now show Barcode Integrity, Canonical Retail Identity, cross-brand recovery state, invalid-barcode suppression, zero-result recovery diagnostics, and top retail rejection reasons
- Regression tests cover barcode validation, invalid UPC suppression, alternate candidate selection, package-attribute recovery, cross-brand alternatives, unit-price precision, unknown shipping acceptance, category firewalling, and preserved 1.11.3 safeguards

## Version 1.11.5 (Completed)
- Package-count canonicalization now keeps dimensions separate from quantity, blocks decimal measurements such as 4.12 x 9.5 inches from becoming counts, and marks suspicious unsupported low security-envelope quantities such as 4-count as uncertain
- Retail fixed-count recovery now uses only explicit quantity wording, keeps unknown counts unknown, and allows compatible 40-, 45-, 50-, and 100-count alternatives without treating them as the exact product
- Retail package comparison keeps package price separate from unit price; unit math appears only when both submitted and candidate package counts are supported, while missing candidate counts remain package-price-only compatible alternatives
- Retailer recovery now uses domain-constrained queries for mapped retailers including Kroger, Walmart, Target, Staples, and Office Depot, reducing irrelevant Office Works business, social, map, and non-envelope references
- Serper execution metadata now records endpoint/search type, generated/planned/attempted/succeeded states, returned-result counts, and qualified-result counts; Shopping is labeled only when the dedicated Shopping endpoint is attempted
- If the configured Serper Shopping endpoint is unavailable, reports label Shopping unavailable instead of saying Shopping was searched with zero results
- Manual ZIP and browser-detected ZIP now converge on the same bounded local-retail stage, and at least one ZIP-aware query is reserved when usable location context exists
- Customer-facing location language no longer treats ZIP presence as proof of local search; if no local query was attempted, the report says, "Location was provided, but no location-aware retail search was executed."
- Browser location denial copy is browser-neutral for iPhone Safari and other browsers while preserving explicit-tap geolocation, denied/unavailable/timeout states, and privacy-safe coordinate discard after ZIP/general-area derivation
- Remaining limitation: local validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding, deployment, or paid-provider acceptance call was run for this release
- Regression tests cover the Office Works/Kroger/30188 case, 4.12-inch dimension firewall, unsupported 4-count uncertainty, unknown-count behavior, domain-constrained retailer recovery, Shopping endpoint truth, ZIP-aware local execution, location failure copy, execution-state accounting, barcode safeguards, and $5.50 precision

## Version 1.11.6 (Completed)
- Current-retail evidence now flows through a shared source-screening assessment before customer price promotion, covering exact products, compatible alternatives, Shopping-stage records, and local-retail-stage records without product-specific exceptions
- Eligible ordinary retail alternatives with visible current prices now reach customer-facing Current Retail Price cards, while broader category, secondary-market, wrong-product, unavailable, and nontransactional records remain blocked or diagnostic-only
- Missing package count now downgrades compatible alternatives to package-price-only evidence instead of hard rejection, and package-count compatibility uses the general ratio rule rather than hardcoded count pairs
- Serper record deduplication now prefers richer price-bearing, better-matched records so no-price duplicates cannot hide useful retail prices
- Uncertain OCR SKU/item-number candidates now remain diagnostic-only and do not populate exact searchable identity unless typed by the user or clearly supported by a single labeled visual item-number candidate
- Browser location lookup now uses a same-origin `/api/reverse-geocode` endpoint, keeps rounded coordinates out of reports and search payloads, caps repeated retry prompts, and preserves manual ZIP as the same local-retail search path
- Technical Search Details now separate source-screened retail candidates from customer-price-eligible candidates and avoid ambiguous "qualified result" wording for retail promotion
- Regression tests cover global retail assessment/promotion, Shopping and local-stage price cards, package-price-only downgrades, richer duplicate survival, uncertain SKU exclusion, same-origin reverse geocoding, capped retry behavior, and preserved 1.11.5 retail/location safeguards
- Remaining limitation: validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding service, deployment, or paid-provider acceptance call was run for this release

## Version 1.11.7 (Completed)
- Customer-visible current retail cards now show "Where to buy" with the derived retailer name near the top, preserve the destination product URL, and keep search-provider/source diagnostics in expandable details
- Retailer attribution now distinguishes structured Shopping merchant evidence, destination retailer domains, supported merchant/source fields, search providers, and explicit unknown-retailer cases without treating Google or Serper as the seller
- Search-provider redirect URLs are unwrapped when a true retail destination is available, while provider-only URLs remain visible as "Retailer not identified" and cannot set Best Current Retail Alternative or Retail Price Limit
- Current retail price guidance now uses only decision-eligible records with supported price, identifiable transactional retailer evidence, valid destination domain, same product-family compatibility, and no hard rejection
- A reusable product-family firewall records target family, candidate family, positive evidence, contradictory evidence, final outcome, and rejection reason; negative candidate-title evidence hard rejects incompatible accessories, components, tools, appliance parts, groceries, toiletries, and unrelated household products across product types
- Customer cards are compressed to product, retailer, price, quantity/unit price, match type, availability, key difference/limit, and a primary action, with shipping, delivered cost, confidence downgrades, and technical attribution moved into per-card Details
- Regression tests cover retailer attribution, provider-versus-seller separation, redirect unwrapping, explicit unknown retailer display, unknown-retailer price-guidance exclusion, product-family mismatch rejection, negative-title evidence, recalculated best/limit guidance, readable source contrast, compressed cards, and preserved 1.11.6 retail/location safeguards
- Remaining limitation: validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding service, deployment, or paid-provider acceptance call was run for this release

## Version 1.11.8 (Completed)
- Customer-visible retail result cards now lead with a plain "Found at [Retailer] - [Price]" buying line, followed immediately by quantity, optional unit price, one short match label, product title, optional nearby address, and a clear check-with-location availability note
- Unknown package quantity now displays as "Quantity: Not shown" in the default customer card and copied report text, while supported numeric quantities display as count wording
- Nearby address and directions support are presentation-only: addresses appear lower in the card when already supported by the record, and the default copy avoids claiming that the nearby location has the item in stock
- Extended compatibility, evidence-tier, shipping, confidence, limitation, and difference details remain inside each card's collapsed Details section
- Card actions remain a single final action: "View at [Retailer]", "Get Directions" when an explicit directions target is supported, or "View Listing" when the retailer is unknown
- Regression tests cover compact where-to-buy ordering, explicit unknown quantity, address placement, safe availability copy, Details-only extended explanations, final action placement, readable retailer contrast, preserved 1.11.7 retailer attribution behavior, and $5.50 precision
- Remaining limitation: validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding service, deployment, or paid-provider acceptance call was run for this release

## Version 1.11.9 (Completed)
- Ordinary current-retail searches now include one bounded online-retail coverage stage driven by a reusable retailer registry, covering Amazon, Walmart, Target, Staples, Office Depot, manufacturer/direct stores, and category-relevant transactional retailers without product-, UPC-, SKU-, ZIP-, or retailer-specific decision exceptions
- The retail provider-call budget remains bounded and execution-truth diagnostics now separately report online-retail queries planned/attempted, online provider calls used, returned source counts, Shopping endpoint execution, local-retail execution, and customer-price eligibility
- Where to Buy now renders as one compact true list for supported nearby and online current-retail options, with each row limited to retailer, price, quantity, supported unit price, purchase channel, supported address, compact action, and collapsed Details
- Intake now starts with one compact three-step instruction box, followed by purpose choices and one live-updated purpose-specific guidance line, with the old buried walkthrough removed to avoid repeated instructions
- Amazon and other marketplace-style offers now preserve platform/retailer, actual seller when visible, first-party versus third-party seller status, package quantity/variant, conditional coupon/subscription/membership pricing, shipping support, delivered-cost support, and availability limitations inside Details
- Unknown shipping remains Not shown / delivered cost not established, and lower online item prices cannot be presented as the best delivered deal unless shipping is explicitly supported
- Row-level availability claims were removed; the list now uses one shared "Prices were found online. Check the retailer for current availability." disclaimer, and online prices are not implied to apply at a nearby physical store
- Regression tests cover Amazon entry without guarantees, other online retailers through the same architecture, unified online/nearby Where to Buy display, true compact mobile rows, purchase-channel labels, seller/platform separation, conditional pricing disclosure, unknown-shipping handling, delivered-cost ranking, search-provider exclusion, bounded online queries, and preserved current-retail/secondary-market safeguards
- Provider-call impact: current-retail Serper budget increases from 19 to 23 maximum planned provider calls, adding up to 4 online-retail registry queries while preserving exact, compatible, retailer-specific, Shopping, and local-retail stage caps
- Remaining limitation: validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding service, deployment, or paid-provider acceptance call was run for this release

## Version 1.11.10 (Completed)
- The permanent Version 1.11.9 Start Here instruction box was removed from the intake flow and replaced with a compact upper-right Help & Instructions menu button in the Katherine's Eye page header
- Help & Instructions now opens a mobile-friendly drawer/full-screen panel with a clean category list for Buying for Myself, Buying to Resell, Value Something I Own, Sell Something I Own, Taking Good Photos, Using Location, and Understanding Your Results
- Each help category opens independently into detailed numbered task instructions or plain result definitions, while the full instruction content is no longer rendered openly on the intake page
- The purpose-specific one-sentence guidance remains under the Purpose selector, and its How to do this control opens Help & Instructions directly to the selected workflow's task instructions
- The help panel supports close, back navigation, focus trapping, Escape-key close, body scroll locking, and focus restoration to the Help & Instructions menu button
- The four workflow submit labels now match the help instructions: Analyze Purchase, Analyze Resale, Estimate Value, and Prepare to Sell, without changing workflow routing, provider execution, pricing, evidence qualification, location behavior, online-retail coverage, or the compact Where to Buy list
- Regression tests cover removal of the permanent Start Here box, header help menu placement, all seven categories, independent category opening, workflow-specific numbered instructions, How to do this routing, keyboard/focus/body-scroll behavior, hidden-by-default detailed instructions, and preserved compact Where to Buy presentation
- Remaining limitation: validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding service, deployment, or paid-provider acceptance call was run for this release

## Version 1.11.11 (Completed)
- Current-retail barcode handling now builds a validated UPC-A/EAN-13/GTIN equivalence set, so zero-padded identities can support exact product matching without accepting invalid barcode candidates or raw-string-only URL matches
- Retail staged search now keeps the submitted UPC first, adds bounded equivalent barcode and retailer-domain exact queries, preserves Shopping endpoint metadata, and reserves a small limited-result recovery bucket inside the current-retail provider-call budget
- Exact retailer product pages returned by the provider are enriched from source-backed title, snippet, URL, and structured fields, preserving destination URL, retailer, visible price, package quantity, barcode/GTIN evidence, availability wording, shipping limitations, and a clear metadata-only enrichment limitation when no page fetch is performed
- Where to Buy ordering now promotes exact current product pages above compatible alternatives while keeping delivered-cost best-deal logic separate and requiring supported shipping before claiming a delivered-cost advantage
- The final Where to Buy list selects for retailer diversity before filling extra rows, so supported multi-retailer evidence is not crowded out by repeated offers from the same retailer
- Technical Search Details now expose normalized barcode identities, exact pages found, returned retailer domains, customer-visible counts by retailer, limited-result recovery execution, and exact-page accepted/rejected reasons
- Regression tests cover UPC/GTIN equivalence, exact retailer page promotion, exact price outranking compatible prices, one-result recovery triggering, multi-retailer display, no fabricated retailer coverage, equivalent-URL dedupe, wrong-product rejection, package-difference disclosure, availability limits, preserved $5.50 precision, compact Where to Buy preservation, Help & Instructions preservation, and no new regression-fixture production special-casing
- Provider-call impact: current-retail Serper budget increases from 23 to 28 maximum planned provider calls, adding up to 2 equivalent-barcode exact identity calls and up to 3 limited-result retailer-recovery calls while preserving data-driven retailer selection and all hard rejection safeguards
- Remaining limitation: validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding service, deployment, or paid-provider acceptance call was run for this release

## Version 1.11.13 (Completed)
- Current-retail limited-result recovery now evaluates the finalized customer-visible Where to Buy list before deciding whether a retailer-diversity recovery pass is still needed, so raw candidate volume cannot mask a one-row or zero-exact customer result
- Zero-exact final retail lists now remain eligible for bounded limited-result recovery even when multiple compatible alternatives are already visible, preventing compatible-only rows from suppressing exact-page recovery
- Explicit current retail price text is normalized as supported current-retail evidence, while Shopping-result offers preserve the existing active-asking contract
- Exact UPC/GTIN-backed direct retailer offers and aggregator-presented offers are deduped by equivalent retailer, barcode identity, package quantity, and price, with direct retailer pages preferred over aggregator duplicates when both represent the same source-backed offer
- Safe source-result evidence excerpts are retained through retail assessment sanitization so equivalent barcode-backed direct/aggregator offers can dedupe without relying on exact-page-only metadata
- Aggregator attribution now separates platform from source-backed merchant evidence when available, while refusing to invent a physical retailer when the aggregator result does not identify one
- Mailing-size dimensions such as approximate 4.12 x 9.5 inches and #10 notation are treated as compatible size evidence and are kept separate from package-count extraction
- Completed auction transaction evidence is preserved as its own price type and may support verified-market evidence only when explicit transaction proof is present; active bids, opening bids, estimates, unsold lots, and Buy It Now listings remain distinct
- Collectible recovery terms now explicitly cover completed auctions, Buy It Now, active listings, bids, estimates, sold evidence, and archive/reference evidence inside the unchanged non-retail call ceiling
- Buyer negotiation output now caps unsupported maximums and rewritten negotiation guidance at or below the entered asking price unless verified sold evidence or multiple active exact/strong current listings justify a higher ceiling
- Customer compact price rows keep one source/price lead line, immediate quantity and match metadata, stock-safe list-level availability copy, and generic View source fallback action while extended seller, shipping, evidence, and limitation details stay collapsed
- Search diagnostics now explicitly distinguish Serper Google Search as the actual acquisition provider from source-category query strategies, expose final customer-visible retail evidence counts by retailer, and report provider calls used plus remaining bounded call budget
- Regression tests cover final-list-triggered recovery, zero-exact compatible-only recovery, equivalent direct-vs-aggregator dedupe, aggregator merchant/platform attribution, 4.12-inch mailing-size compatibility, completed auction qualification and ordering, collectible recovery term coverage, buyer asking-price ceiling, compact-list copy, diagnostic truth, exact $5.50 precision, and fixture-specific production literal absence
- Provider-call impact: no retail or collectible call ceiling was raised for this release; the existing current-retail 28-call ceiling and non-retail 12-call ceiling remain unchanged
- Remaining limitation: validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding service, deployment, or paid-provider acceptance call was run for this release

## Version 1.11.14 (Completed)
- Retail qualification now uses a source-backed candidate-object firewall, separating same-object exact products and compatible alternatives from accessories, associated consumables, category/search pages, articles, retailer home pages, and wrong products before customer pricing, retail limits, recommendations, or best-price logic can use them
- Current-retail identity checks no longer treat query wording, submitted-item wording appended to raw text, AI compatibility commentary, or retailer category labels as proof of candidate identity; source-backed titles, snippets, structured data, URLs, and safely extracted page evidence are required
- Exact retailer product pages with supported identity but no initial price can trigger bounded direct product-page enrichment inside the existing Stage 7 retail budget, with public-domain allowlisting, SSRF protection, redirect validation, timeout, response-size, and content-type limits
- Named-store reporting now distinguishes an exact product page found without usable price from an exact product not found, and exact diagnostics require real source-backed exact identity evidence
- Package-count extraction ignores identifier artifacts such as product IDs so unrelated numeric IDs cannot become package quantities
- Collectible qualification now rejects generic marketplace/classified category pages, articles, different designs, mirrors, and related-only references from pricing while preserving exact sold, completed-auction, active asking, and non-pricing archive/reference evidence in their proper lanes
- Collectible source allocation now reserves bounded non-retail search capacity for exact identity, sold/completed, completed-auction, active/BIN, specialty-dealer, and archive/reference routes while keeping recovery execution truth within the unchanged 12-call ceiling
- Cross-source dedupe now collapses mirrored/syndicated marketplace offers by supported item IDs, original URLs, lot IDs, seller/title/price/image signatures, and mirror references so one underlying offer cannot count twice
- Pricing safety now requires qualified verified sold or completed-sale support before active asking evidence can justify Exceptional Value, market-value language, or maximum/walk-away prices above the entered asking price
- Regression tests add executable generic retail and collectible live-evidence qualification fixtures that pass provider-shaped records through production normalization, qualification, dedupe, pricing, diagnostics, and output preparation paths
- Provider-call impact: the current-retail ceiling remains 28 external requests, including bounded direct exact-page enrichment; the non-retail collectible ceiling remains 12 executable Serper calls with source allocation and recovery diversity reserved inside that cap
- Remaining limitation: validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding service, deployment, or paid-provider acceptance call was run for this release

## Version 1.11.12 (Completed)
- Design-driven collectible searches now build a bounded exact-attribute ladder from visible wording, slogans, brand/licensed marks, object type, artwork/design clues, color/material/shape features, production marks, dimensions, item codes, dates, and strongest supported attribute combinations
- Secondary-market and auction recovery now uses a data-driven registry for marketplace, auction, archive, and specialty-dealer domains, including eBay, Mercari, Etsy, LiveAuctioneers, HiBid, Invaluable, AuctionZip, WorthPoint, PicClick, Ruby Lane, and Chairish without product-, brand-, SKU-, UPC-, ZIP-, or fixture-specific production exceptions
- Exact source-constrained collectible recovery queries are inserted into the existing bounded non-retail Serper plan and execution-truth diagnostics now report requested secondary/auction domains, the collectible search ladder, exact recovery passes attempted, whether exact recovery is still needed, and exact secondary-market candidate/visible counts
- Exact same-design marketplace or auction evidence can reach the primary compact evidence list even when the source is eBay, Mercari, Etsy, HiBid, LiveAuctioneers, Invaluable, AuctionZip, an auction house, or another registry-backed secondary source
- Price evidence now preserves verified sold, Buy It Now, active asking, active listing without visible price, current auction bid, opening bid, auction estimate, closed unsold, price unavailable, reference/archive, and unavailable-price distinctions without converting bids, estimates, Buy It Now listings, or unsold lots into confirmed value
- Exact active listings, Buy It Now listings, and auction bids can be shown when no verified sale exists, with customer copy stating that the found price or bid is an active asking price, Buy It Now listing, or auction bid, not a confirmed market value
- Different designs, artwork, slogans, editions, years, object forms, and related-only records are kept out of the primary pricing list and cannot create a customer-facing range when the only exact evidence lacks sold-price support
- The compact Where to Buy/Prices Found presentation now displays secondary-market source names, exact/related labels, price-type labels, and actions such as View at Retailer, View auction, or View result while keeping extended limitations in Details
- Buying for Myself, Buying to Resell, Value Something I Own, and Sell Something I Own now route price evidence through the shared compact Prices Found renderer, with duplicate best/other/source records deduped before customer display and Best price badges limited to meaningful decision-eligible comparable rows
- Brand handling for current-retail identity remains evidence-derived from typed, package/OCR, barcode, SKU/model, manufacturer, and provider-supported identity signals; no old regression-product brand literal is used in production routing
- Regression tests cover exact auction evidence reaching the list, Buy It Now staying distinct end to end, auction origin not rejecting exact evidence, price-type preservation, exact active listing visibility without market-value confirmation, all-four-workflow compact evidence presentation, neutral-brand retail routing, different-design exclusion, related-only range prevention, recovery triggering, bounded query counts, unchanged 28-call retail ceiling, and no fixture-specific production hardcoding
- Provider-call impact: the current-retail 28-call ceiling remains unchanged; collectible recovery is bounded inside the existing non-retail Serper plan, which remains capped at 12 planned executable calls with up to 2 exact source-recovery records inside that cap
- Remaining limitation: validation uses mocked/static provider coverage only; no live Serper, OpenAI, browser geolocation, reverse-geocoding service, deployment, or paid-provider acceptance call was run for this release

## Version 1.12.0 (Completed)
- Introduced reusable evidence modules for normalized identifier identity, field-level provenance, normalization/final assembly, product and design matching, page eligibility, dimension/package/quantity compatibility, price-type and range eligibility, source identity, underlying-offer deduplication, decision/recovery consistency, final-list diagnostics, and compact evidence presentation
- Removed authoritative customer-list assembly, final range derivation, final evidence counts, recovery state, diagnostic sampling, and compact record shaping from the monolithic API path; `api/generate-listing.js` now adapts already-qualified provider records into the shared finalizer instead of independently assembling customer evidence
- Every finalized record carries field provenance tied to its source record and URL; unsupported cross-record title/price/URL associations are omitted, acquisition provider remains separate from retailer/marketplace/domain identity, and cross-retailer offers are not merged merely because they identify the same product
- Exact product or same-design pages remain eligible identity evidence when price is unavailable, while exact priced evidence remains a separate count and range lane
- UPC/EAN/GTIN normalization covers valid check-digit forms and zero-padded retailer URL identifiers, including retailer catalog identifiers whose normalized body corresponds to the submitted UPC
- Exact pages acquired during later stages are eligible for the same bounded enrichment path as other computed-exact pages; provider/direct-page accounting remains derived from attempted and successful request records
- Current-retail evidence is finalized without generic valuation-outlier removal; only source, object, product, dimensions, package, page type, availability, association, and underlying-offer rules can remove an offer
- Customer evidence, exact/compatible/source counts, price ranges, decision eligibility, recommendation inputs, recovery state, and diagnostics now share one authoritative finalized evidence list; debug sampling occurs only after full-list decisions and counts
- Deterministic Office Works envelope coverage verifies exact Kroger no-price preservation, normalized barcode URL matching, truthful Kroger attribution, compatible 40/45-count alternatives, Target low-price preservation, #10 dimension compatibility, wrong-size/object rejection, provenance isolation, diagnostic parity, and compact one-list output
- Deterministic licensed championship collectible-tray coverage verifies combined design identity, exact marketplace/auction no-price preservation, category-page rejection, unrelated-design exclusion, price-type preservation, range suppression without qualified exact/same-design pricing, cautious personal-use guidance, and maximum-price protection
- The four existing purposes remain supported: Buying for Myself, Buying to Resell, Value Something I Own, and Sell Something I Own; shopping evaluation and the original listing-generation behavior needed by the later Sell It experience are preserved
- Remaining migration work: move provider acquisition adapters and more legacy qualification helpers into the shared modules, retire redundant legacy comparable/report fields after compatibility consumers migrate, and make the PowerShell local server consume the shared serialized contract without adding a second evidence engine
- Later interface plan: simplify the customer experience around Buy It, Value It, and Sell It while preserving shopping evaluation; define a universal `ListingDraft`, then add a marketplace connector layer with eBay-first draft creation and final customer review before any publishing action
- Marketplace authorization and publishing are explicitly not implemented in Version 1.12.0
- Provider-call impact: the current-retail ceiling remains 28 calls and the non-retail/collectible ceiling remains 12 calls; no live or paid provider search was used for acceptance

## Version 1.12.1 (Completed)
- Final evidence assembly now runs after recovery and enrichment and exposes one authoritative accepted list plus pure customer, display, price-bearing, range, and decision views
- Customer output and diagnostics share finalized record IDs and canonical match classifications, with separate accepted, eligible, displayed, range, decision, priced, and diagnostic-only rejected counts
- Same-offer deduplication now preserves field provenance, prefers uniquely higher-quality direct-page prices over search snippets, and retains unresolved exact pages as Price unavailable with conflict diagnostics
- Exact and strong item-specific no-price pages remain customer eligible, while category, history, generic social, unrelated-form, bulk, and non-transactional records stay diagnostic-only
- Numerical market ranges require at least two independent eligible offers; one asking record is reported as one observation and cannot create a bargain badge or market-backed negotiation figures
- Retail decisions consume the finalized evidence views, preserve exact no-price identity pages, retain qualified current-retail prices, and cannot call an entered price competitive when a lower qualified offer exists
- Deterministic fixtures cover post-recovery ID parity, normalized retailer identifiers, same-offer price conflicts, exact collectible pages, count semantics, display truncation, and underlying-offer deduplication
- Buying for Myself, Buying to Resell, Value Something I Own, Sell Something I Own, and future Sell It listing-generation foundations remain intact
- Provider-call impact: the current-retail ceiling remains 28 calls and the non-retail/collectible ceiling remains 12 calls; validation used no live or paid provider searches

## Version 1.12.2 (Completed)
- Added one canonical per-evaluation Cognitive Governor execution ledger with real Governor-construction, authoritative-state, decision-invocation, controlled-execution, unauthorized-attempt, and provider-request ownership records
- Enforced fail-closed action authorization before initial acquisition, refinement, direct-page verification, customer-input transition, canonical finalization, purpose judgment, and terminal stopping; provider fallback and limited-result recovery execute only as bounded child operations of eligible selected actions
- Preserved provider physical attempts and retries beneath stable logical provider-request identities and their parent Governor action signatures without increasing provider, refinement, retry, or direct-page ceilings
- Added a deterministic durable Governor proof with independently verifiable Cognitive Episode, Experience link, inert Lesson Candidate, capacity, terminal, unauthorized-action, and proof-hash integrity fields
- Repaired the frozen executor to bind a future expressly authorized run to an explicit exact full clean HEAD, atomically register STARTED before request preparation, reject prior partial/complete commit bindings, and preserve historical result readability
- Added a separate offline Cognitive Governor validator/report while preserving the frozen product grader, corpus, expected answers, controls, metrics, weights, thresholds, and safety rules unchanged
- Provider-call impact: the current-retail ceiling remains 28 calls, the non-retail/collectible ceiling remains 12 calls, direct-page enrichment remains capped at 2 attempts, and validation used no live or paid provider searches

## Version 1.12.3 (Completed)
- Made Governor construction and authoritative Cognitive State initialization durable lifecycle events with evaluation ownership, canonical sequences, independently recalculable identities, and scalar counts derived from the stored event ledger
- Bound selected decisions and controlled parent/child executions to proof schema 1.1 with independently recalculable identities, contiguous sequence validation, unique selected signatures, and offline rejection of foreign ownership or duplicate parent signature use
- Preserved phase-scoped parent and child executions that may own multiple logical provider requests while supporting request-specific child identity when applicable, with non-circular logical request hashing and separate proof of the provider-to-execution link
- Strengthened offline provider validation for evaluation, action, signature, execution, phase, logical request, physical-attempt, retry, fallback, and limited-result-recovery ownership without changing queries, providers, ceilings, evidence, exactness, valuation, confidence, or customer output
- Added deterministic lifecycle, decision, execution, signature-reuse, child-parent, provider-ownership, matching-hash semantic mutation, runtime authorization, production call-site, and mocked handler integration coverage
- Preserved the 29 frozen images, 14 cases, 26-analysis plan, frozen descriptions, expected answers, purposes, lanes, controls, product metrics, scoring weights, thresholds, safety rules, and historical product grader behavior
- Provider-call impact: the current-retail ceiling remains 28 calls, the non-retail/collectible ceiling remains 12 calls, direct-page enrichment remains capped at 2 attempts, and validation used no live or paid provider searches

## Version 1.12.4 (Completed)
- Exposed authoritative Cognitive Episode, Experience Record, Lesson Candidate, ceiling, and terminal-agreement validation as five structured per-analysis integrity families without changing production proof schema 1.1 or runtime telemetry
- Added explicit PASS, FAIL, and allowed Lesson-absence NOT_APPLICABLE dispositions with deterministic hash, linkage, byte-size, inertness, consumption, maximum, and terminal evidence
- Added fail-closed aggregate Governor report sections with per-category totals, failed analysis identifiers, and structured failure reasons while preserving every existing Phase 6B integrity field
- Kept the offline Governor validator as the single semantic authority; the report grader validates result shape and aggregates returned dispositions without reinterpreting raw proof data or parsing failure text
- Preserved the frozen product grader, 29 images, 14 cases, 26-analysis plan, expected answers, controls, metrics, weights, thresholds, safety rules, customer behavior, production Governor authorization, and provider ceilings unchanged
- Provider-call impact: validation remains deterministic and network-denied; no live handler, OpenAI, web-search, Serper, provider, benchmark, Preview, or Production request was made

## Version 1.12.5 (Completed)
- Added one bounded per-evaluation terminal context with deterministic ordered stage events from request acceptance through response emission
- Replaced evidence-destroying handler failures with independently verifiable, size-bounded, secret-safe terminal envelopes that retain observable stage, partial Governor, and provider-attempt evidence
- Preserved failed provider attempts and retry telemetry under their existing logical request, controlled execution, action signature, and unchanged provider ceilings
- Added one immutable authoritative Experience Record seal and independently revalidated the exact response-bound record against its canonical hash-empty preimage, full emitted byte size, Cognitive Episode link, Governor proof, and 65,536-byte ceiling
- Routed any stale hash, post-seal content change, link mismatch, proof-size mismatch, or proof-hash mismatch through `EXPERIENCE_ATTESTATION_MISMATCH` instead of emitting a false successful attestation
- Preserved production retrieval, Cognitive Governor policy, customer-input and stop semantics, purpose judgment, safety, evidence qualification, valuation, confidence, scoring, and customer recommendations unchanged
- Provider-call impact: validation remains deterministic and network-denied; no live handler, OpenAI, web-search, Serper, direct-page, provider, benchmark, Preview, or Production request was made

## Version 1.12.6 (Completed)
- Added one deterministic Governor executive-readiness projection covering useful knowledge actions, actual requested-field availability, evidence sufficiency, safety blockers, purpose legality, and substantive terminal eligibility with stable reason codes
- Changed `REQUEST_CUSTOMER_INPUT` into an honest suspended outcome: one bounded structured request is recorded as pending, finalization and purpose judgment do not run, and the terminal decision becomes `STOP_INSUFFICIENT_EVIDENCE` with `AWAITING_CUSTOMER_INPUT`
- Made `STOP_INSUFFICIENT_EVIDENCE` reachable before purpose judgment for pending input, insufficient identity or evidence, exhausted useful actions, and unresolved critical safety; controlled insufficiency remains a non-5xx customer outcome
- Restricted `STOP_COMPLETE` to substantively ready purpose outcomes or completed safety-only outcomes, while retaining cautious non-exact completion when the supported advice and limitations are honest
- Added one shared deterministic safety projection for no blocker, caution, remove-from-service, and unresolved-critical states; critical safety suppresses ordinary commercial guidance and preserves mandatory customer disposition
- Preserved requested-field, sufficiency, safety, readiness, terminal-reason, suspension, and purpose-execution evidence through the Cognitive Episode, Governor proof integrity, terminal envelope, and handler response
- Preserved retrieval, queries, providers, ceilings, exactness, evidence qualification, valuation, scoring, public UI, customer memory, personality, and learning behavior unchanged
- Provider-call impact: validation remains deterministic and network-denied; no live handler, OpenAI, web-search, Serper, direct-page, provider, benchmark, Preview, or Production request was made

## Version 1.12.7 (Completed)
- Reconciled weak, missing, or stale submitted item types against stronger purpose-neutral normalized identity before source enrichability and exactness qualification
- Required candidate type coherence plus source-backed exact evidence from a validated barcode, exact maker/model, exact maker/product ID, or exact name/maker/package combination before a stale type can support exact evidence
- Kept compatible but non-exact sources explicitly below exact qualification and preserved rejection for genuine cross-product conflicts, brand-adjacent sources, model-like distractors, and exact-looking identifiers attached to the wrong product type
- Routed the reconciled decision through the existing item-type firewall, Object Mind verification, evidence qualification, retail assessment, and single canonical finalizer without adding another evidence authority
- Added generic deterministic coverage for stale and unresolved types, genuine conflicts, distractors, exact-source coherence, purpose neutrality, firewall regression, and canonical-finalizer authority
- Preserved Phase 6D terminal evidence, Phase 6E Governor stopping and safety policy, retrieval strategy, providers, ceilings, valuation, scoring, public UI, customer memory, personality, and learning behavior unchanged
- Provider-call impact: validation remains deterministic and network-denied; no live handler, OpenAI, web-search, Serper, direct-page, provider, benchmark, Preview, or Production request was made

## Version 1.12.8 (Completed)
- Added a deterministic, read-only post-episode reflection layer that classifies sealed authoritative Experiences, frozen verified diagnostics, and unverified legacy material without rewriting or upgrading historical evidence
- Added canonical Reflection Observations and purpose-neutral Causal Signatures that preserve the earliest supported loss boundary, distinguish terminal symptoms from causes, and exclude unnecessary customer, object-answer, provider-payload, and source-URL content
- Added hash-addressed retrospective Lesson Candidates with independent-object support, duplicate and retry suppression, counterevidence, proposed invariants, regression obligations, explicit scope and non-scope, and the only permitted `PROPOSED_ONLY` non-operative status
- Kept provider, network, customer-input, safety, expected evidence-insufficiency, unresolved, and single-anomaly patterns from becoming internal product-rule lessons without independent authoritative support
- Added one bounded local historical reflection runner whose output is restricted to ignored `test-results`, verifies frozen aggregate integrity before inspection, and proves every historical source byte remains unchanged
- Preserved the live Experience producer, Cognitive Episode, existing inert single-episode Lesson Candidate, Governor, evidence authority, finalizer, Phase 6D terminal evidence, Phase 6E executive policy, Phase 6F type coherence, public UI, customer memory, personality, and runtime behavior unchanged
- Provider-call impact: validation and historical reflection remain deterministic and network-denied; no frozen request, benchmark execution, OpenAI, web-search, Serper, direct-page, live-provider, paid-provider, Preview, or Production request was made

## Version 1.12.9 (Completed)
- Added canonical Regression Charters, Regression Evidence Bundles, Lesson Proofs, explicit Approval Receipts, and Approved Lesson Records while preserving immutable Phase 6G Lesson Candidates as the exact source boundary
- Restricted every proof obligation to a fixed repository-owned regression manifest; candidate and report content cannot select commands, arguments, executables, module paths, dynamic imports, fixture paths, provider identifiers, or network locations
- Made proof fail closed for unmapped obligations, unresolved counterevidence, incomplete safety or purpose-neutrality coverage, failed or skipped required regressions, source mutation, network-denial failure, and candidate, Charter, fixture, manifest, code, or tree drift
- Required one exact structured operator authorization after a passing proof, rejected scope or binding mismatch and consumed-receipt replay, and limited approved output to hash-addressed `APPROVED_NON_OPERATIVE` records with runtime, behavioral, code, and deployment installation disabled
- Added one fixed-path offline historical gate proof that verified the existing Phase 6G report and 513-file historical tree, returned `NO_ELIGIBLE_CANDIDATE`, and created zero real Charters, Evidence Bundles, Proofs, Approval Receipts, or Approved Lesson Records
- Preserved the live handler, Governor, evidence pipeline, purpose judgment, finalizer, terminal response, Phases 6D through 6G, public UI, customer memory, personality, frozen evidence, and runtime behavior unchanged
- Provider-call impact: validation and the historical gate remained deterministic and network-denied; no Phase 6G reflection, frozen request, benchmark, OpenAI, web-search, Serper, direct-page, live-provider, paid-provider, Preview, or Production request was made

## Version 1.12.10 (Completed)
- Prevented exact uncertainty sentinels such as `not verified` and `unverified` from becoming quoted identity terms in the shared Object Mind initial and refinement search plans
- Preserved useful broader identity searches when uncertain maker, model, or hypothesis fields are suppressed, without changing normalized observations, evidence authority, exactness, type coherence, canonical finalization, Governor policy, or Experience sealing
- Added generic synthetic coverage across unrelated object classes and customer purposes, including valid exact evidence, adjacent-model and accessory distractor rejection, external provider failure preservation, bounded Experience integrity, reflection/lesson isolation, and hard network denial
- Provider-call impact: the current-retail 28-call ceiling, non-retail/collectible 12-call ceiling, and direct-page 2-attempt ceiling remain unchanged; validation used no benchmark, frozen request, OpenAI, web-search, Serper, direct-page, live-provider, paid-provider, Preview, or Production request

## Version 1.12.11 (Completed)
- Added a preparation-only Blind Object Benchmark V2 protocol for 14 entirely new real-world objects and 26 analyses, with fixed lane, purpose, object-class, ambiguity, customer-input, safety, and purpose-invariance coverage
- Added hash-only V1 rejection indexing for exact photographs, exact and normalized descriptions, object records, identities, request-input fingerprints, and historical request hashes, while requiring human attestation because perceptual uniqueness is not claimed
- Added evaluator-only private-control, frozen-request, frozen-package, consent, exactly-once authorization, and invocation-registry contracts with immutable input, control, coverage, scoring, source-commit, Version, provider-ceiling, cost, output, network-policy, and stop-condition bindings
- Added a 16-capability, 100-weight scoring contract whose zero-applicable denominator is `NOT_APPLICABLE`, never a success, and whose definitions, weights, applicability, thresholds, and critical failures are freeze-hash bound before execution
- Added deterministic synthetic coverage for legacy rejection, valid intake, duplicates, coverage, control isolation, freeze mutation, no implied consent, replay resistance, arbitrary-execution denial, scoring immutability, runtime isolation, network denial, preserved historical evidence, and the honest no-input state
- No new authorized holdout photographs or descriptions existed, so preparation remains `AWAITING_NEW_HOLDOUT_INPUTS` with zero frozen requests, consent receipts, invocation reservations, provider calls, network calls, or benchmark executions
- Provider-call impact: the current-retail 28-call ceiling, non-retail/collectible 12-call ceiling, and direct-page 2-attempt ceiling remain unchanged; no benchmark, frozen request, OpenAI, web-search, Serper, direct-page, live-provider, paid-provider, Preview, or Production request was made

## Version 1.12.12 (Completed)
- Revised the Blind Object V2 frozen-request and frozen-package contracts to bind the candidate set, complete source-package boundary, repository HEAD and Version, multiview sanitized inputs, source originals, evaluator-only controls and provenance, the exact 26-analysis plan, all request hashes, and unchanged specification, coverage, and scoring contracts
- Added one canonical non-authorizing Freeze Receipt whose durable state is `FROZEN_AWAITING_CONSENT` and whose consent, reservation, provider, network, scoring, and deployment authority fields are all false
- Added deterministic hash-addressed persistence under the ignored prepared tree with fixed repository-owned paths, receipt-last atomic publication, full disk readback, failed-pending cleanup, corruption rejection, mismatched-tree no-overwrite behavior, and byte-identical idempotent readback
- Added generic full-scale synthetic regression coverage for release, package, multiview, input, private-control, provenance, analysis-plan, request, aggregate, receipt, path, persistence, runtime-isolation, arbitrary-execution, dry-run, network-denial, and immutable-contract boundaries
- Kept all V2 code benchmark-local and preserved the Blind Object V2 specification, coverage, scoring, 2-4-photo, private-control, and exactly-once execution contracts without creating a real freeze, consent receipt, invocation reservation, benchmark response, or score
- Provider-call impact: no executor or provider adapter was added; validation remained hard-network-denied and made no OpenAI, web-search, Serper, direct-page, live-provider, paid-provider, Preview, Production, or external-network request

## Version 1.12.13 (Completed)
- Aligned the customer-visible release badge with the authoritative repository Version and added deterministic build-time validation across package, lockfile, server, HTML, and hosted-build configuration surfaces
- Added Version-bound public asset identities so a previously cached static asset cannot silently masquerade as the current release on a moving Preview alias
- Added focused regression coverage for exact alignment, full multi-digit patch preservation, future release advancement, route consistency, stale-literal rejection, cache identity, and unchanged static layout behavior
- Preserved all object-analysis, evidence, Governor, Experience, reflection, lesson, benchmark, customer-memory, and personality behavior unchanged
- Provider-call impact: validation is deterministic and network-denied; no object submission, benchmark, OpenAI, web-search, Serper, direct-page, live-provider, paid-provider, or Production request is performed

## Version 1.12.14 (Completed)
- Added the benchmark-local Blind Object V2 exactly-once execution spine with separate product and executor release identities, strict consent and reservation binding, durable request-state transitions, bounded cost accounting, terminal result sealing, and unscored result manifests
- Kept the frozen product under test permanently bound to commit `7056eb0601dc69c5985703fea6fe665e82c6bed8`, Version `1.12.13`, while advancing only the executor and customer-visible release to Version `1.12.14`
- Added a strict direct-caller-only repository-state fixture for the no-input preparation regression while preserving the operational Git inspector for CLI and default module use; dirty, staged, conflicted, wrong-root, HEAD-mismatched, Version-mismatched, and failed probes remain fail-closed
- Added deterministic coverage for exactly-once replay denial, attempt and cost ceilings, provider/model binding, structural result-tree classification, secret scanning, runtime isolation, hard network denial, private-control exclusion, scoring isolation, and immutable Phase 7C freeze readback
- Preserved the benchmark specification, coverage, scoring, frozen requests, Phase 7C freeze, and all product analysis, Object Mind, evidence, Governor, Experience, reflection, and lesson behavior unchanged
- Provider-call impact: the complete physical-attempt ceiling is 832, but release validation used only synthetic handlers and hard-network-denied tests; no frozen request reached the real handler and no OpenAI, web-search, Serper, direct-page, live-provider, paid-provider, scoring, Preview analysis, or Production request was performed

## Version 1.12.15 (Completed)
- Added canonical Launch Scope schema 1.0 with stable execution-profile and pricing-profile identity hashes that exclude timestamps, local worktree paths, process/host values, credentials, and operator text
- Added domain-separated repository-owned consent, invocation, reservation, result, and result-root identities with caller-ID rejection, collision denial, and fixed safe result-history paths
- Replaced the generic 360,000-input/6,000-output reservation with a source-grounded complete-run envelope covering the exact frozen requests, all 28 sanitized images and 52 image usages, explicit output ceilings, the fixed 8,000-token web-search block, tool fees, retries, fallbacks, and direct-page carry-forward content while retaining the 832-attempt ceiling
- Added the fixed `PREFLIGHT`, `CREATE_CONSENT`, `EXECUTE`, and `READBACK` command grammar; consent creation and execution remain disabled until a later separate authorization station
- Kept the frozen product under test bound to commit `7056eb0601dc69c5985703fea6fe665e82c6bed8`, Version `1.12.13`, and preserved Phase 7A and Phases 6D-6H behavior unchanged
- Provider-call impact: deterministic validation and the one permitted real-freeze preflight perform no handler, OpenAI, web-search, Serper, direct-page, paid-provider, scoring, Preview analysis, or Production request

## Version 1.12.16 (Completed)
- Replaced reuse of one fixed detached-product directory with a fresh repository-derived worktree beneath the canonical operating-system temporary root for each real launch preflight
- Added fail-closed path and Git-linkage verification before any command runs inside the detached runtime, including direct-child, ADS, traversal, symlink/reparse, expected-repository, reverse-link, common-directory, detached-HEAD, cleanliness, Version, and full tracked-tree checks
- Preserved Git ownership protection without adding wildcard, global, system, local, persistent, or command-local `safe.directory` configuration
- Kept the product under test fixed at commit `7056eb0601dc69c5985703fea6fe665e82c6bed8`, Version `1.12.13`, with its 666-entry runtime-manifest hash unchanged
- Added focused ownership regressions for the reproduced dubious-ownership boundary, fresh equivalent runtimes, stale or foreign linkage, release drift, dirtiness, tracked-file mutation, path attacks, and persistent Git-config immutability
- Provider-call impact: runtime preparation and validation are local Git/filesystem operations only; no frozen request, handler, OpenAI, web-search, Serper, direct-page, paid-provider, scoring, Preview analysis, or Production request is performed

## Version 1.12.17 (Completed)
- Separated the immutable executor runtime commit from the Git-derived qualification head so a test or release seal cannot self-invalidate by moving the current repository HEAD
- Added a strict pending/qualified/invalid execution-release record with a sealed record hash, complete runtime Git-tree identity, direct-parent relationship, and exactly one permitted `execution-release.json` qualification overlay
- Bound the executor runtime head, qualification head, runtime tree, release-record hash, and qualification-policy Version into the stable Launch Scope and every derived consent, invocation, reservation, result, and result-root identity
- Rejected wrong parents, second descendants, merge commits, extra-file overlays, runtime or Version drift, dirty/staged/conflicted/wrong-repository state, record drift, and caller-controlled release-head selection
- Kept the product under test fixed at commit `7056eb0601dc69c5985703fea6fe665e82c6bed8`, Version `1.12.13`, and preserved the Phase 7C freeze, scoring isolation, and all product behavior unchanged
- Provider-call impact: qualification and validation are deterministic local Git/filesystem operations; no frozen request, handler, OpenAI, web-search, Serper, direct-page, paid-provider, scoring, Preview analysis, or Production request is performed

## Version 1.12.18 (Completed)
- Replaced the checkout-byte cost-source literal with a repository-owned Product Cost-Source Manifest bound to binary-safe canonical Git-object bytes from the exact pinned Version 1.12.13 product commit
- Inventoried the fixed handler bridge and its complete 31-file source-reachable runtime closure, with exact path, role, canonical SHA-256, byte count, UTF-8/LF expectation, extraction policy, call category, and output-ceiling bindings
- Bound the Product Cost-Source Manifest hash, complete source-inventory hash, extraction-policy Version, and canonical source slices into the cost envelope, qualified release, Launch Scope, and every domain-separated proposed execution identity
- Added fail-closed regression coverage for the exact Version 1.12.17 mismatch, Git-blob determinism, checkout line-ending invariance, BOM/encoding, commit/path/content/inventory drift, caller overrides, runtime pinning, stable cost, identity binding, product/freeze isolation, real-run absence, and hard network denial
- Kept the product under test fixed at commit `7056eb0601dc69c5985703fea6fe665e82c6bed8`, Version `1.12.13`; the 832-attempt ceiling and conservative maximum cost of US$39.17741232 are unchanged
- Provider-call impact: source audit and validation are deterministic local Git/filesystem operations; no frozen request, handler, OpenAI, web-search, Serper, direct-page, paid-provider, scoring, Production request, or Production deployment is performed

## Version 1.12.19 (Completed)
- Enabled only the existing bounded `CREATE_CONSENT` and `EXECUTE` operations in the strict executor-release authority record; repository metadata still cannot imply external real-run authorization
- Kept private-control loading, scoring, reflection, lesson extraction or promotion, repair, product mutation, merge, and deployment authority disabled
- Preserved the Version 1.12.13 product commit and runtime manifest, the complete Phase 7C freeze, the Product Cost-Source Manifest and inventory hashes, the 832 physical-attempt ceiling, and the US$40.00 absolute cost ceiling
- Retained the direct-child exact one-file qualification seal, fixed CLI grammar, repository-derived identities, exactly-once reservation and journal guards, cost-ledger stop-before-next-request behavior, deterministic result readback, and hard private-control isolation
- Provider-call impact: deterministic release qualification is network-denied; the separately approved one-run station may execute only the 26 immutable public requests under the sealed attempt and cost ceilings

## Version 1.12.23 (Completed)
- Replaced terminal public-identifier root/collection cross-product authority with one closed registry of 213 complete normalized product-contract paths and schema-constrained, traversal-derived provenance
- Preserved credential-first rejection and required deterministic repository-owned `underlyingOfferKey` recomputation or a hash-bound reference to a recomputed public source at every authorized path
- Repaired the continuation chain so Version 1.12.21 reconciliation, Version 1.12.22 failure and unused-consent evidence, and Version 1.12.23 artifacts validate against their own immutable release authorities
- Added an append-only, exactly-once revocation receipt for the unused Version 1.12.22 consent without consuming it or creating its proposed invocation, reservation, result, or result root
- Added actual production-CLI offline qualification with hard network denial, durable reservations and `HANDLER_RETURNED` receipts, valid public-identifier sanitization, intentional post-handler sanitizer failure sealing, rollback evidence, and release-chain negative cases
- Kept the product under test fixed at commit `7056eb0601dc69c5985703fea6fe665e82c6bed8`, Version `1.12.13`; private controls, scoring, reflection, lesson work, product mutation, merge, Preview, and Production remain unauthorized
- Provider-call impact: release qualification is deterministic and hard-network-denied; only the separately authorized one 25-request continuation may perform live provider activity after seal readback

## Version 1.12.24 (Completed)
- Installed a versioned, forward-only Cognitive Lifecycle Governor whose canonical manifest owns every release, preflight, consent, reservation, per-request handler, quarantine, sanitizer, terminal, readback, composite, ready, and terminal-stop transition
- Added exact canonical handler-return quarantine before sanitization using AES-256-GCM with a random per-artifact key protected by Windows DPAPI CurrentUser, exclusive append-only writes, full identity substitution protection, and independent decrypt/hash/length readback
- Added safe sanitizer decision receipts for every request, including all traversal-derived rejected locations, normalized contract paths, schema nodes, value digests and lengths, classifier/rule inventories, credential and entropy classifications, and public-preimage verification without raw rejected values
- Replaced independent public-identifier path authorities with one 213-contract manifest that generates runtime matching, provenance schema restrictions, positive and negative fixtures, contract IDs, and qualification/documentation inventory
- Added a durable 12-class lifecycle invariant catalog, known downstream-only deterministic recovery from the same quarantined bytes, novel-condition stop receipts, and bounded non-replay repair dossiers
- Carried forward two permanent infrastructure failures, 16 physical attempts, and US$3.01364710 conservative cost; the only executable continuation is the 24-request set V2-RUN-003 through V2-RUN-026
- Replaced count-specific completion authority with a 26-disposition unscored composite whose only complete state is 24 cognitive results, 2 infrastructure failures, and 0 not submitted
- Added actual production CLI/executor/governor/persistence/sanitizer/readback/composite offline qualification with restart-prefix reconstruction, substitution and transition mutation, credential mutation, deterministic downstream recovery, rollback, exact quarantine readback, and hard network denial
- Kept the product under test fixed at commit `7056eb0601dc69c5985703fea6fe665e82c6bed8`, Version `1.12.13`; evaluator controls, scoring, reflection, diagnosis, lesson promotion, product mutation, merge, Preview, and Production remain unauthorized
- Provider-call impact: qualification remains deterministic and network-denied; only the separately authorized exactly-once 24-request continuation may perform live provider activity after the qualified one-file release seal

## Version 1.12.25 (Completed)
- Formally reclassified the deterministic safety component as the Lifecycle Integrity Controller and installed a canonical role registry while preserving the former name only as an explicitly scoped historical compatibility alias
- Added the separate, unqualified Synthetic Executive Agent architecture behind an external deterministic Qualification Governor and Typed Executive Action Broker; direct repository, shell, credential, provider, product-handler, evaluator-control, consent, reservation, merge, and deployment access is prohibited
- Added twelve content-addressed blind episode roots: six chronological historical episodes bound to exact Git cutoffs, three differently surfaced analogous episodes, and three genuinely novel episodes; later code and evaluator controls remain outside every agent-visible root
- Added append-only executive-memory records with auditable structured and token-overlap retrieval receipts, candidate-only initial lesson status, and transfer-only validation rules
- Added closed typed executive actions, bounded engineering-task and regression-proof contracts, pre-sealed worker dossiers, four-way returned-evidence evaluation, and closed next-action selection
- Added an external append-only qualification ledger with reservation-before-dispatch accounting, conservative missing-usage and crash treatment, per-case and total ceilings, no-progress termination, retry controls, concurrency denial, tamper detection, and child-process termination receipts
- Proved every required budget boundary and tamper case with fake providers and nine scripted fake-agent behaviors, including a complete deterministic twelve-case sequence that makes no claim about the unqualified agent’s capability
- Preserved the unused Version 1.12.24 consent byte-for-byte and bound it and all proposed identities into an external prohibition because the fixed existing revocation mechanism applies only to the historical Version 1.12.22 consent
- Disabled benchmark consent creation, benchmark execution, provider activity, product-handler invocation, repair, merge, Preview, and Production authority in the readiness-only release
- Kept the product under test fixed at commit `7056eb0601dc69c5985703fea6fe665e82c6bed8`, Version `1.12.13`, with 666 tracked entries and the Phase 7C frozen aggregate unchanged
- Provider-call impact: readiness qualification uses only local deterministic fake providers and network denial; no AI qualification, model call, provider call, Katherine’s Eye handler invocation, benchmark request, Preview action, or Production action is performed

## Version 1.12.26 (Completed)
- Added one isolated OpenAI Responses API route pinned to `gpt-5.6-sol`, medium reasoning, strict structured output, `store: false`, no tools, no background execution, and no streaming
- Added a canonical calibration-only provider profile, synthetic `KE-CAL-001` fixture, external single-use authority schema and sealer, credential boundary, metadata model-access check, automatic redaction, and safe result sealing
- Composed the existing External Qualification Governor and Typed Executive Action Broker with a stricter one-request calibration governor; the full US$0.25 reservation remains charged whenever provider usage is missing or incomplete
- Kept the twelve-case qualification, Phase 7 benchmark, product handler, workers, lessons, product mutation, merge, Preview, and Production routes disabled
- Preserved the Version 1.12.25 readiness record, prior calibration failure seal, immutable Version 1.12.13 product identity, Phase 7C freeze, and Phase 6A evidence baseline
- Provider-call impact: deterministic qualification remains network-denied; the separately sealed external authority permits exactly one metadata access check followed by at most one calibration inference with zero retries

## Version 2.0
- User accounts
- Saved listings
- Favorites
- Subscription billing
- Admin dashboard

## Future Ideas
- Real sold-comps and source links
