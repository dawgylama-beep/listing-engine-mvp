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
- Collectible, collegiate, ceramic, cookie-jar, decor, and secondhand source routing now prioritizes resale, vintage, collector, exact-label, team/school, and reference-style searches
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

## Version 2.0
- User accounts
- Saved listings
- Favorites
- Subscription billing
- Admin dashboard

## Future Ideas
- Real sold-comps and source links
