
# Modules B + C + D — Full Scaffold with Mock Data

Build all three module backends + minimal UI surfaces now. Real seed data and master prompts swap in later without schema changes.

---

## Scope per module

### Module B — Platform (Vault / Projects / Government / AI)
- **Tables**: `platform_documents`, `platform_media_assets`, `platform_audit_log`, `platform_projects`, `platform_project_milestones`, `platform_customer_acknowledgments`, `platform_permit_submissions`, `platform_certificates`, `platform_ai_observations`, `platform_property_timeline_events`.
- **Storage**: reuse existing `property-files` bucket; documents/media reference storage paths.
- **Audit log**: append-only — RLS allows INSERT only via SECURITY DEFINER trigger from other tables; no UPDATE/DELETE policies.
- **AI guardrails**: `platform_ai_observations` has NOT NULL `disclaimer` + CHECK that `is_certified = false`.
- **UI**: new `/property/:id/vault` tab (list + upload), `/property/:id/projects` (homeowner+contractor view), read-only `platform_audit_log` viewer on PropertyView for owners.

### Module C — Environmental & Weather Intelligence
- **Tables**: `env_events`, `env_roof_stress_assessments`, `env_risk_scores`, `env_flood_intelligence`, `env_claim_predictions`, `env_grade`.
- **Views**: `v_env_hail_events`, `v_env_wind_events`, `v_env_tornado_events`, `v_env_winter_events` (filtered selects on `env_events`).
- **AI guardrails**: NOT NULL `disclaimer` + `is_certified = false` CHECK on `env_roof_stress_assessments` and `env_claim_predictions`.
- **Compat**: leave existing `weather_events` and `environmental_risks` untouched; add `v_property_environmental_summary` view that prefers `env_*` and falls back to legacy. Merge pass deletes legacy later.
- **UI**: new "Environmental" section on PropertyView with grade card, exposure timeline, risk grid.

### Module D — Regional Intelligence & Education
- **Tables**: `regional_property_profile`, `regional_home_system_topics`, `regional_property_systems`, `regional_solar_systems`, `regional_incentives`, `regional_insurance_guidance`, `regional_home_coach_query_log`.
- **FKs from day one**: `regional_property_systems.contractor_professional_id → professionals(id)`, `.permit_id → permits(id)`. `regional_solar_systems.property_system_id → regional_property_systems(id)` (1:1 unique).
- **AI guardrails**: NOT NULL `disclaimer` + `is_certified = false` on `regional_home_coach_query_log`.
- **Risk-level columns** on `regional_property_profile`: nullable, populated by trigger from Module C's `env_risk_scores` when present.
- **UI**: "Regional & Systems" tab on PropertyView with classification card, installed systems list, incentive matches.

---

## Cross-cutting decisions (locked)

1. **Naming**: `platform_*`, `env_*`, `regional_*` prefixes in `public` schema. No new schemas.
2. **`property_id`**: real FK to `properties(id)` on every new table, `ON DELETE CASCADE`.
3. **AI log consolidation prep**: B's `platform_ai_observations`, C's `env_claim_predictions`, D's `regional_home_coach_query_log` all share columns `(property_id, model, prompt, response_text, response_json, disclaimer, is_certified, created_by, created_at)` so a future `ai_interaction_log` merge is a rename + UNION, not a rewrite.
4. **RLS pattern**: owner of property OR users with read access via existing `share_links` / role checks. Contractors see only projects they're assigned to. Admin sees all.
5. **GRANTs**: `authenticated` + `service_role` on every new table. No `anon`.
6. **Mock seed data**: insert mocks for the 3 existing demo properties only, via the insert tool after migrations land.

---

## Build order

1. **Migration B** (10 tables, RLS, GRANTs, triggers, audit-log append-only enforcement).
2. **Migration C** (6 tables + 4 views, RLS, GRANTs, guardrail CHECKs).
3. **Migration D** (7 tables, RLS, GRANTs, FKs to professionals/permits, sync trigger from `env_risk_scores`).
4. **Mock seed inserts** for B/C/D against the 3 demo properties.
5. **UI surfaces** (parallel writes):
   - `src/pages/PropertyVault.tsx` + route
   - `src/pages/PropertyProjects.tsx` + route
   - `src/components/environmental/EnvironmentalSection.tsx` mounted in `PropertyView`
   - `src/components/regional/RegionalSection.tsx` mounted in `PropertyView`
6. **Edge functions** (stubs, real logic when prompts arrive):
   - `compute-env-grade` — recomputes `env_grade` from `env_events` + `env_risk_scores`.
   - `classify-region` — populates `regional_property_profile` from property lat/lon/state.
   - `home-coach` — wraps Lovable AI Gateway, logs to `regional_home_coach_query_log` with disclaimer.

---

## Verification per phase

- After each migration: `supabase--linter` + spot-check RLS with `supabase--read_query` as anon/authenticated.
- After UI: load `/property/<demo-id>` and confirm all three new sections render with mock data, no console errors.
- Build green at the end of each module.

---

## Out of scope (deferred until real specs arrive)

- Real connector logic for permit boards, NOAA/FEMA feeds, incentive APIs.
- Government portal (B) — table + RLS only, no UI this pass.
- Customer acknowledgment e-sign flow — table only.
- Solar financial transfer workflow — table only.

I'll pause after each module migration so you can review the SQL before the next one runs.
