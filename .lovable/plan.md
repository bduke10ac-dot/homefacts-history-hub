
## Scope review

Most of the 15 requested modules already exist in HomeFacts from prior phases. This plan **fills the real gaps** and **unifies everything** under one PropStream-style "Property Intelligence" experience, rather than re-creating pages that already work.

### Already built (will be wired into the new hub, not rebuilt)
- Property Health Score → `HomeHealth.tsx` (13 categories)
- Property Timeline → `PropertyTimeline.tsx` + `HomeTimeline.tsx`
- AI Advisor → `AskPropertyAI.tsx`, `PropertyAssistant.tsx`, `home-coach`
- Risk Analysis → `PropertyRiskScore.tsx` (7 sub-scores)
- Insurance Center → `InsuranceReview.tsx` + `InsuranceReadinessScore.tsx`
- Maintenance → `MaintenanceCenter.tsx` + `MaintenanceReminders.tsx`
- Future Cost Forecast → `FutureCostForecast.tsx`
- Home Passport → `OwnershipPassport.tsx`
- Contractor Scores → `ContractorScores.tsx`
- Buyer Decision Report → `BuyerDecisionReport.tsx`
- Neighborhood / Market → `NeighborhoodIntelligence.tsx`
- Hazards (cards) → `HazardMap.tsx`

### Real gaps to build

**1. Interactive Property Intelligence Map (Leaflet)** — new page `PropertyIntelMap.tsx`
- Leaflet map centered on property (already have `PropertyMap.tsx` infra)
- 17 toggleable overlay layers (hail, tornado, flood, wildfire, storm, roof age heatmap, home age, permits, taxes, appreciation, crime, schools, insurance risk, utilities, internet, FEMA, nearby developments)
- Each layer: toggle, short explanation, risk badge, data-source placeholder, "Why this matters" homeowner note
- Layers backed by `hazard_intelligence`, `crime_timeline`, `weather_environmental_events`, `permits`, `schools`, `amenities`, `regional_property_profile` + placeholder GeoJSON when no data

**2. Home Improvement ROI Calculator** — new page `ImprovementROI.tsx`
- 12 project types with cost ranges, value lift %, insurance savings, energy savings, warranty, resale, doc checklist
- Interactive sliders for home value / sq ft → personalized estimates
- "Save to projects" button writing to existing `platform_projects`

**3. Annual "What Changed?" Report** — new page `AnnualReport.tsx` + edge function `generate-annual-report`
- Pulls year-over-year deltas: value, insurance, tax, nearby permits, storms, maintenance done/missed, warranties, neighborhood
- AI summary + "Generate Annual HomeFacts Report" button → PDF via jsPDF

**4. Unified "Property Intelligence" hub** — refactor `PropertyView.tsx`
- Replace the current 35-button link grid with a **tabbed dashboard** (shadcn Tabs):
  `Dashboard | Map | Timeline | Health | AI Advisor | Risk | Insurance | Maintenance | Forecast | Market | Passport | Contractors | Reports`
- Each tab renders the existing page's component or links to it. Mobile-friendly horizontal-scroll tab bar.

**5. Role-based access surface** — small additions
- Show/hide tabs based on `useAuth().hasRole()` for buyer / realtor / contractor / inspector / insurance / municipality views (data layer already enforces RLS)

### Out of scope (already covered)
- Re-implementing the 11 modules from prior phases
- New database tables — existing schema covers all required data; placeholders fill gaps until real integrations land

### Technical notes
- Map: Leaflet (already installed) — no Mapbox token needed
- Layer data: query existing tables; fall back to inline mock GeoJSON with clear "Sample data" badge
- Annual report edge function: Lovable AI Gateway with `google/gemini-3-flash-preview`
- All new pages use existing `ScoreRing`, shadcn cards, semantic tokens — no hardcoded colors
- Routes added in `App.tsx`: `/property/:id/intel-map`, `/property/:id/roi`, `/property/:id/annual-report`

### Deliverables
- 3 new pages (`PropertyIntelMap.tsx`, `ImprovementROI.tsx`, `AnnualReport.tsx`)
- 1 new edge function (`generate-annual-report`)
- Refactored `PropertyView.tsx` with unified tab navigation
- Routes + nav wiring in `App.tsx`

Approve to build, or tell me to trim/expand.
