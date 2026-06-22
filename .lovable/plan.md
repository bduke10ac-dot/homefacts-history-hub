# HomeFacts → Digital Property Operating System

This is a massive, multi-phase build (27 modules, dozens of pages, ~30 new data models). I'll deliver it in shippable phases so you can review and steer between each one. Below is the phased plan plus what I'd ship first.

---

## Positioning update (ship immediately, Phase 0)
- New tagline across Home, Why, Pricing, Realtor Success Center, Onboarding:
  > "HomeFacts is the digital identity and lifelong operating system for every property — ownership, maintenance, insurance, contractors, inspections, warranties, public records, and AI guidance in one trusted platform that follows the home from construction through every owner."
- Update hero copy on `Index.tsx` and `WhyHomeFacts.tsx`, plus dashboard intro banner.

---

## Phase 1 — Core homeowner OS (this PR, if you approve)
**Goal: every property gets a Confidence Score, Health dashboard, Timeline, AI Assistant, and Reports.**

New DB tables (one migration):
- `home_confidence_scores` (property_id, overall, category jsonb, updated_at)
- `home_health_sections` (property_id, section, install_date, lifespan_years, contractor, warranty_id, risk_level, notes, photos jsonb)
- `timeline_events` (property_id, occurred_at, category, title, description, cost, contractor, verified, attachments jsonb)
- `ai_assistant_queries` (property_id, user_id, question, answer, confidence, sources jsonb)
- `verification_badges` (property_id, badge_type, status, verified_at, verified_by)
- `report_exports` already exists — extend with `report_type` enum.

New pages/components:
- `HomeConfidenceScore.tsx` — 15-category radial + AI summary (uses existing `home-coach` edge fn)
- `HomeHealth.tsx` — 24 system cards (Roof, HVAC, …) reusing `MaintenanceCenter` patterns
- `PropertyTimeline.tsx` — visual chronological feed sourced from `property_records` + `timeline_events`
- `AskHomeFactsAI.tsx` — chat panel scoped to one property (new edge fn `ask-property-ai` grounded on that property's records)
- `ReportExports.tsx` — 13 report templates; reuse `generate-report` edge fn with a `template` param.

Integration:
- Add tabs to existing `PropertyView.tsx`: Confidence · Health · Timeline · Ask AI · Reports.
- Reminder system already exists in `maintenancePlan.ts`; wire it into Confidence Score's "Maintenance compliance" category.

---

## Phase 2 — Pro tools
- `ContractorScore.tsx` + `contractor_scores` table; add badge to existing `professionals` records.
- Extend `RealtorSuccessCenter` with listing-readiness checklist, buyer confidence report, anniversary reminders (reuse follow-up engine).
- `InsuranceReview.tsx` + `insurance_policies`, `insurance_reviews` tables; annual renewal reminders.
- `DeferredMaintenance.tsx` — projects 1/3/5/10-yr costs from `home_health_sections` lifespans.
- `DigitalTwin.tsx` — room-by-room CRUD with photo/video upload to existing `property-files` bucket.

## Phase 3 — Ecosystem
- `BuilderMode` (extend existing `BuilderTemplates`/`BuilderClones`) with full handoff manual.
- `GovernmentPortal.tsx` + new `government_reviews` table; new role `code_official`.
- `NeighborhoodIntelligence.tsx` — aggregate existing crime/school/tax/env data into one page.
- `Marketplace.tsx` — contextual recommendations driven by Confidence Score gaps.
- `InvestorDashboard.tsx` — portfolio rollup across user's properties.

## Phase 4 — Lifecycle & resilience
- `EmergencyMode.tsx` + `emergency_events` table, claim packet PDF.
- `DisasterVault.tsx` + `disaster_vault_documents` table (reuse `property-files` bucket, encrypted naming).
- `EstatePlanning.tsx` + `estate_contacts`, `property_access_grants` tables with tiered permissions.
- `NegotiationAssistant.tsx` — buyer-side AI tool that ingests inspection PDFs (uses `document--parse_document` pattern in edge fn).
- `OwnershipPassport.tsx` — transferable bundle + signed share links (extend `share_links`).

---

## Roles (added incrementally as phases land)
Extend `app_role` enum: add `buyer`, `seller`, `inspector`, `insurance_agent`, `lender`, `appraiser`, `code_official`, `investor`, `estate_contact`. Each phase adds only the roles it needs, with RLS policies via `has_role()`.

---

## Technical notes
- All AI calls go through existing `_shared/ai-gateway.ts` using `google/gemini-3-flash-preview`.
- All new public tables get GRANTs + RLS + `has_role`-based policies (no recursion).
- Reuse existing `homeScore.ts` math as the foundation for Confidence Score so we don't fork scoring logic.
- Reuse existing reminder engine in `maintenancePlan.ts` for the Notification Center; add a `notification_preferences` table for snooze/channel.

---

## What I need from you
1. **Approve the phasing** (or reorder — e.g. push Emergency Mode earlier).
2. **Confirm Phase 1 scope** is what you want shipped next (Confidence Score + Health + Timeline + Ask AI + Reports + positioning copy).
3. Anything you want **cut from MVP** (e.g. skip Investor/Builder if you're focused on homeowners first)?

Once you say go, I'll ship Phase 1 in one pass: migration → edge functions → pages → wired into `PropertyView`.
