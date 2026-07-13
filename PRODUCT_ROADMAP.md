# Marketplace Edge Roadmap

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

## Version 2.0
- User accounts
- Saved listings
- Favorites
- Subscription billing
- Admin dashboard

## Future Ideas
- Real sold-comps and source links
