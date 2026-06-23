## Builder Program + Creekside Homes founding partner

Most of the Builder Program already exists (BuilderDashboard, BuilderTemplates, BuilderClones, BuilderProfile, BuilderMarketing, `nb_templates`/`nb_property_clones`, HandoffQRDialog, WarrantyCenter). This plan **fills gaps and seeds Creekside Homes as Founding Builder #001** rather than rebuilding.

### Schema gaps (1 migration)
Add to `builder_companies`:
- `founding_builder_number int` (e.g. 1)
- `is_founding_builder bool`
- `description text`
- `badges text[]` (e.g. `{Founding Builder #001, Certified Builder, Digital Home Record Included, Warranty Packet Included, Construction Timeline Included}`)

Add to `nb_property_clones`:
- `construction_stage text` (current stage)
- `construction_stages jsonb` (array of 18 stages with photos/notes/contractor/date/status — driven from the UI, no extra tables needed)
- `handoff_packet_url text` (generated PDF link, optional)

Add storage bucket `builder-logos` (public) for logo uploads.

### New pages (5)
1. **`BuilderProgram.tsx`** — public landing at `/builders` (What/Why/Benefits/Founding spotlight/CTA).
2. **`AdminBuilders.tsx`** — admin-only at `/admin/builders` (add/edit builder, upload logo, toggle Founding/Certified, manage badges, generate QR).
3. **`ConstructionTimeline.tsx`** — clone-scoped at `/builder/clones/:id/timeline` (18-stage visual timeline with photos/notes/contractor/inspection/date editor — writes to `construction_stages` jsonb).
4. **`HomeownerHandoff.tsx`** — at `/builder/clones/:id/handoff` (one-click generates Welcome packet, Warranty packet, Maintenance checklist, Emergency sheet, Contractor list, Utility setup, **QR code** — uses existing `HandoffQRDialog` for the QR, jsPDF for packets).
5. Enhance existing **`BuilderProfile.tsx`** with: logo upload, Founding Builder badge row, Communities/Floor plans/Standard features/Warranties/HOA docs/Lot maps/School zones/Construction photo history/Final walkthrough/Contact sections.

### New components (3)
- **`BuilderLogoUpload.tsx`** — drag/drop uploader to `builder-logos` bucket, writes `logo_url` to `builder_companies`. Placeholder shown until upload.
- **`BuilderBadgeRow.tsx`** — renders badges array with semantic-token chips.
- **`CreeksideMarketingBlock.tsx`** — reusable callout (the exact marketing text + 3 buttons), embeddable on profile and home pages.

### Existing pages — light additions
- **`BuilderDashboard.tsx`** — add the requested stat cards (Total homes, Active communities, Under construction, Ready for handoff, Warranty requests, Documents, Activations) by aggregating existing tables; add tabs row (Homes/Communities/Documents/Warranties/Contractors/Handoff/Marketing/Settings) linking to existing screens + new ones.
- **`Navbar.tsx`** — add public "Builders" link to `/builders`.

### Seed data (one insert via supabase--insert after migration)
- Builder: **Creekside Homes**, website `creeksidenewhomes.com`, `founding_builder_number=1`, `is_founding_builder=true`, `certification_level='certified'`, `certified_since=today`, full description, badges array, slug `creekside-homes`, public profile enabled.
- Community: **Bellsford Landing** (added via `nb_templates` as a community template, or a simple community row if needed — using template name).
- Clone: **Creekside Demo Home** with seeded `construction_stages` and a sample address.
- Logo: NOT seeded — uses placeholder until user uploads via admin.

### Tech notes
- All public — no AI key, no external integrations.
- QR codes via existing `HandoffQRDialog` (already in `src/components/newbuild/`).
- Packet PDFs via `jsPDF` (already installed).
- Logo storage: Supabase Storage bucket `builder-logos` (public), no external URLs hardcoded.
- Routes added in `App.tsx`: `/builders`, `/admin/builders`, `/builder/clones/:id/timeline`, `/builder/clones/:id/handoff`.

### Deliverables checklist
- 1 migration (column additions + storage bucket)
- 1 seed insert (Creekside Homes + Bellsford Landing + demo home)
- 5 new pages + 3 new components
- Edits to `BuilderDashboard`, `BuilderProfile`, `Navbar`, `App.tsx`

Approve to build.