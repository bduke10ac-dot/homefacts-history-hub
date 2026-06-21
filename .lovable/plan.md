
# New Build History Package — Full Scaffold

Builder-facing portal + homeowner Beginner Guide + transferable QR handoff. Template → Clone → Customize → Deliver.

Defaults baked in from section 11:
- Hierarchy: developer subdivision template → builder model template → property clone. `parent_template_id` self-FK supports both layers.
- Template edits after first clone restricted to template owner + admin (RLS).
- Post-closing: clones flip to `handed_off`, builder loses write, homeowner (claimed_by) gains append-only access to docs.

---

## 1. Auth / Roles

- Add `'builder'` to `app_role` enum.
- New `builder_companies` table (name, license #, insurance, logo, contact). Users join via `builder_company_members(user_id, company_id, role)` so multiple staff can share a builder account.

## 2. Tables (all `public`, prefix `nb_`)

| Table | Purpose |
|---|---|
| `builder_companies` | Builder/developer org record |
| `builder_company_members` | user ↔ company w/ owner/admin/staff |
| `nb_templates` | Master template. `kind` enum: `subdivision`, `model`, `series`, `custom`. `parent_template_id` self-FK. Versioned via `version` int + `is_locked`. |
| `nb_template_versions` | Snapshot per version for "future clones only" semantics |
| `nb_template_subcontractors` | Trades attached to a template (company, license, insurance, scope, warranty months) |
| `nb_template_documents` | Standard docs/manuals/spec sheets stored in `property-files` bucket |
| `nb_template_warranties` | Standard warranty terms (type enum, coverage, term_months, issuer, claim_instructions) |
| `nb_template_guide_items` | Beginner Guide content blocks (section, title, body, order) |
| `nb_property_clones` | Per-address clone. FK → `nb_templates`, FK → `properties` (nullable until address assigned), `lot_number`, `parcel_id`, `build_start_date`, `completion_date`, `co_date`, `status` enum (`draft`, `under_construction`, `ready_for_handoff`, `handed_off`, `transferred`), `handoff_token` UUID for QR |
| `nb_clone_subcontractors` | Overrides/additions per home |
| `nb_clone_documents` | Per-home docs (permits, inspection reports, walkthrough) |
| `nb_clone_warranties` | Per-home warranty instances w/ `start_date`, `expiration_date`, computed `status` (active/expiring/expired via view) |
| `nb_clone_inspections` | Foundation/framing/rough-in/final milestones |
| `nb_clone_guide_overrides` | Per-home tweaks to Beginner Guide |
| `nb_handoff_log` | Append-only: who generated QR, when, scanned-by |

All AI-touched tables get the standard `disclaimer NOT NULL` + `is_certified=false` guardrail (none in this module yet, but reserve pattern).

## 3. RLS (key rules)

- Builder company members: full RW on their `nb_templates` + clones.
- Template edit blocked when `is_locked = true` (set after first clone) except for company owner/admin role.
- Homeowner (auth.uid() = property.claimed_by) on a clone in status `handed_off`/`transferred`:
  - SELECT all clone rows
  - INSERT into `nb_clone_documents` only
- Public read of clone + Beginner Guide + warranty list via `handoff_token` (no auth) — mirrors existing `share_links` pattern.

GRANTs: `authenticated` + `service_role` on all; `anon` SELECT only on the handoff-token view.

## 4. Triggers / functions

- `lock_template_on_first_clone()` — sets `is_locked=true` after first row in `nb_property_clones`.
- `clone_template(template_id, lot_specs[])` SECURITY DEFINER fn — bulk-creates clones, copies subs/docs/warranties/guide items.
- `compute_warranty_status` view returning `active | expiring_soon | expired` per warranty (90/30/7 day buckets).
- Updated-at triggers everywhere.

## 5. Edge functions (stubs, real logic later)

- `nb-bulk-clone` — wraps `clone_template` with auth check.
- `nb-warranty-reminders` — cron-ready; computes expiring warranties and queues notifications (placeholder log table).
- `nb-generate-handoff` — mints/refreshes `handoff_token`, writes `nb_handoff_log`.

## 6. UI

Builder portal (new role-gated):
- `/builder` — dashboard: company, template count, clone count, expiring warranties across all homes.
- `/builder/templates` — list + create.
- `/builder/templates/:id` — tabs: Overview, Subcontractors, Standard Docs, Warranties, Beginner Guide. "Clone" button → bulk clone modal (paste addresses or count).
- `/builder/clones` — table of all clones across templates, filter by status/subdivision.
- `/builder/clones/:id` — per-home edit: address assignment, timeline, inspections, per-home docs, warranty instances, "Generate Handoff QR" button.

Homeowner / public:
- `/home/:handoffToken` — public Beginner Guide landing (no auth). Tabs: Move-In Checklist, Warranties (color-coded), Systems Guide, Documents, Emergency Info. "Claim this home" CTA → existing claim flow, then merges clone with `properties.claimed_by`.
- Adds a "New Build History" card to existing `PropertyView` when a clone is linked.

Components:
- `src/components/newbuild/TemplateForm.tsx`
- `src/components/newbuild/BulkCloneDialog.tsx`
- `src/components/newbuild/WarrantyCenter.tsx` (color-coded badges, claim instructions modal)
- `src/components/newbuild/BeginnerGuide.tsx`
- `src/components/newbuild/HandoffQRDialog.tsx` (uses `qrcode.react` — add dep)
- `src/components/newbuild/InspectionTimeline.tsx`

Navbar: add "Builder" link when `hasRole('builder')`.

## 7. Mock seed data

One demo builder company ("Lone Star Homes"), one subdivision template ("Westfield Meadows"), one model template ("The Hill Country") nested under it, 3 cloned properties (link to existing 3 Texas demo properties), full subcontractor list, 8 warranty instances per home with varied expirations (active / expiring / expired for testing color coding), beginner guide content.

## 8. Build order

1. Migration 1: `app_role` enum extension + `builder_companies` + members + RLS.
2. Migration 2: `nb_templates` + child template tables + RLS + GRANTs.
3. Migration 3: `nb_property_clones` + child clone tables + handoff token + RLS + GRANTs + triggers.
4. `clone_template` SECURITY DEFINER fn + warranty status view.
5. Edge functions stubs.
6. Mock seed inserts.
7. UI scaffold (parallel writes): pages, components, route additions in `App.tsx`, Navbar link.
8. Smoke test: load `/builder`, clone a template, generate QR, hit `/home/:token` unauthenticated.

## 9. Verification

- `supabase--linter` after each migration.
- `supabase--read_query` to confirm RLS blocks cross-company access and post-handoff lock.
- Manual load of `/builder` + `/home/<seeded-token>` with no console errors.
- Build green.

## 10. Out of scope (deferred)

- Real email/SMS warranty reminders (function logs only).
- Buyer e-sign of acknowledgments (table exists from Module B, reused later).
- Inspector portal — builders enter inspection results manually for now.
- Multi-builder developer subdivisions where builders are *separate companies under a developer-owned template* — schema supports it via `parent_template_id` + nullable `owning_company_id`, but UI surfaces only single-company case this pass.
