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

## Version 2.0
- User accounts
- Saved listings
- Favorites
- Subscription billing
- Admin dashboard

## Future Ideas
- Real sold-comps and source links
