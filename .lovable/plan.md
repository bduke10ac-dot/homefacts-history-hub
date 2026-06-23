# HomeFacts Competitor-Inspired Upgrade — Build Plan

Most of the 27 requested sections already exist in the project (Home Health, Property Timeline, Ask AI, Contractor Scores, Insurance Review, Ownership Passport, Neighborhood Intelligence, Digital Twin, Deferred Maintenance, Negotiation Assistant, Emergency Mode, Disaster Vault, Estate Planning, Investor Dashboard, Government Portal, Marketplace, Report Exports, Home Confidence Score, Builder Portal). This plan **adds what's missing**, **upgrades existing modules to full spec depth**, and **unifies everything into a single dashboard + report generator**.

Ships in 4 batches so each is reviewable.

---

## Batch 1 — Data foundation + new score engines

**Migration:** new tables with full RLS + grants
- `property_risk_scores` (overall + 7 sub-scores: structural, weather, insurance, environmental, maintenance, neighborhood, appreciation; each with score/level/ai_explanation/recommended_action)
- `hazard_intelligence` (type, distance_m, risk_level, historical_events jsonb, insurance_impact, homeowner_explanation, recommended_action, lat/lng)
- `crime_timeline` (period, category, count, trend, ai_summary)
- `weather_environmental_events` (date, type, severity, distance_m, property_impact, insurance_impact, recommended_action)
- `home_value_protection_scores` (overall + 11 component scores)
- `insurance_readiness_scores` (18 sub-factors, premium_savings_estimate, checklist jsonb)
- `future_cost_forecasts` (item, category, horizon_years, low_cost, high_cost, urgency, recommended_timing, reminder_id)
- `maintenance_reminders` (title, category, cadence, next_due, region_specific, last_completed, recurrence_rule)
- `regional_education_topics` (region, topic, recommended_inspection, insurance_note, education_md)
- `buyer_decision_reports` (ai_recommendation, hidden_risks, expected_maintenance, negotiation_items, etc.)
- `certification_status` (level: none/bronze/silver/gold/platinum, criteria_met jsonb, issued_at)

**Edge functions** (Lovable AI Gateway, AI SDK pattern):
- `compute-risk-score` — generates 7-category risk score from property + records + hazards
- `compute-insurance-readiness` — scores 18 factors, returns savings estimate + checklist
- `compute-value-protection` — composite from maintenance, contractors, permits, insurance
- `compute-certification` — evaluates bronze→platinum criteria
- `generate-buyer-decision-report` — structured AI report
- `forecast-future-costs` — generates 1/3/5/10yr forecasts from systems data
- `summarize-crime-trend` — AI explanation per audience

---

## Batch 2 — New pages (full spec depth)

1. `PropertyRiskScore.tsx` — overall ring + 7 sub-category cards, each with score/level/AI explanation/recommended action/supporting docs
2. `HazardMap.tsx` — Mapbox interactive map with 17 hazard layer toggles, property pin, distance-ranked hazard cards, "How this affects me" panels
3. `CrimeTimeline.tsx` — 30d / 6mo / 12mo / 5yr tabs, 7 categories, trend chips, AI summaries per audience
4. `WeatherTimeline.tsx` — chronological event timeline, severity badges, property/insurance impact, inspection CTAs
5. `InsuranceReadinessScore.tsx` — 18-factor scorecard, premium savings estimate, claim readiness checklist, documentation checklist
6. `HomeValueProtectionScore.tsx` — composite ring + 11 components, trend over time
7. `FutureCostForecast.tsx` — 1/3/5/10yr horizon tabs, 15 item categories, cost ranges, "Create reminder" inline action
8. `MaintenanceReminders.tsx` — one-time / recurring / seasonal / region-specific tabs, 21 default reminders, completion tracking
9. `RegionalEducation.tsx` — auto-detected region (South/North/West/Midwest) → tailored inspections/reminders/insurance notes
10. `BuyerDecisionReport.tsx` — AI-generated buyer report with all 14 sections, shareable
11. `Certification.tsx` — HomeFacts Certified™ badge with 4 tiers, criteria checklist, "Apply for Certified" flow

Plus **enhancements** to existing pages:
- Home Health: add Age / Last Service / Warranty / Remaining Useful Life / Photos per category (13 categories)
- Property Timeline: add Permit#, Warranty link, Verification chip, Photo gallery per event
- Contractor Scores: surface all 16 fields from spec
- Realtor dashboard: add referral tracking, verified badge, invite-homeowner, prep-for-sale checklist

---

## Batch 3 — Unified Dashboard + Report Generator

**`HomeownerDashboard.tsx` rebuild:** 13 cards — Home Health, Property Risk, Insurance Readiness, Value Protection, Passport, Certification, Upcoming Maintenance, Recent Timeline, Weather Alerts, Open Documents Needed, Contractor Verification, Future Cost Forecast, Generate Report.

**Report Generator (`ReportExports.tsx` expansion):** 8 report types (Homeowner / Buyer / Seller / Realtor / Insurance / Contractor / Builder / Inspector), each PDF via jsPDF, pulling scores + timeline + photos + documents + AI recommendation.

---

## Batch 4 — Navigation + Positioning + Polish

- Add all new pages to `App.tsx` routes and `PropertyView.tsx` nav
- Update homepage messaging: "complete digital operating system" + Zillow/Carfax/HomeFacts comparison
- Empty states + CTAs everywhere (Upload Document, Add Timeline Event, Verify Contractor, Generate Report, Create Reminder, Apply for Certified, Transfer Passport)
- Score rings, badges, risk color tokens (low/medium/high) added to `index.css`
- Mobile responsive pass

---

## Prerequisites

- **Mapbox public token** — I will request this as a secret (`MAPBOX_PUBLIC_TOKEN`) when starting Batch 2. Get one free at mapbox.com → Account → Tokens.
- Lovable AI Gateway already configured (`LOVABLE_API_KEY` present).

## Approval needed

Confirm to start **Batch 1** (migration + 7 edge functions). I'll pause between batches so you can review before the next ships.