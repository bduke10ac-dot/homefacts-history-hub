# HomeFacts AI — Next Build Plan

You picked all four slices on real properties. That's a lot, so I'll ship in 4 reviewable phases against the existing `properties` / `property_records` / `record_attachments` tables. Each phase is independently shippable.

---

## Phase 1 — Home Health Score + Risk Scores

**Goal:** Every property page (and the demo) shows a 0–100 Home Health Score and a row of per-system risk badges.

- New pure module `src/lib/healthScore.ts`:
  - `computeHealthScore(property, records)` → `{ score, grade, factors[] }`
  - Factors: roof age (records in `category=roof`), HVAC age, deferred maintenance (gaps > 12 months), verified-record ratio, year_built decay, claim/damage records.
- New module `src/lib/riskScores.ts` → per-system risks (roof, flood, wind, fire, foundation, electrical, plumbing, insurance, maintenance) as 0–100 with `low|medium|high` band. Heuristics from records + `state`/`zip` (FEMA-style mock weights — clearly marked as estimated; real integrations later).
- New components:
  - `src/components/health/HealthScoreCard.tsx` — big circular score, grade, top contributing factors.
  - `src/components/health/RiskBadgeGrid.tsx` — 9 badges with tooltip explanations.
- Wire into `PropertyView.tsx` (top of report) and `DemoReport.tsx`.

No DB changes.

---

## Phase 2 — Digital Home Timeline

**Goal:** Vertical timeline replacing/augmenting the current records list.

- New component `src/components/timeline/HomeTimeline.tsx`:
  - Groups records by year, icon per `category`, verified badge, cost, attachments count.
  - Synthetic "milestone" entries derived from property fields (Built `year_built`, Last sold from a future `transactions` table — for now just Built).
- Add a `category` icon map in `src/lib/categoryMeta.ts` (roof, hvac, plumbing, electrical, foundation, roof, paint, landscaping, claim, permit, inspection, sale, construction).
- Used in `PropertyView.tsx` (new "Timeline" tab) and `DemoReport.tsx`.

No DB changes.

---

## Phase 3 — AI Assistant per property

**Goal:** Chat panel on a property page that answers from that home's records.

Following the chat-agent-ui-contract: **one conversation per property, persisted in the database** (so realtors/buyers see the same context).

- Migration:
  - `property_chat_messages(id, property_id fk, user_id, role, content, created_at)` + RLS: anyone with property read access (owner, share_links viewer, realtor/admin) can read; only authed users can insert their own messages.
  - GRANTs to authenticated + service_role.
- Edge function `supabase/functions/property-chat/index.ts`:
  - Validates JWT, checks user can access `property_id`.
  - Loads property + last 200 records + attachments metadata, builds a system prompt.
  - Streams via AI SDK + Lovable AI Gateway (`google/gemini-3-flash-preview`).
  - Persists user + assistant messages in `onFinish`.
- Client component `src/components/ai/PropertyAssistant.tsx` using `useChat` + `DefaultChatTransport` pointed at the edge function. Rendered as a side panel / tab in `PropertyView.tsx` (gated to authed users; teaser-only on `/r/:token` share view and demo).

---

## Phase 4 — AI Reports + PDF export

**Goal:** One-click Buyer / Seller / Insurance / Roof / Maintenance reports.

- Edge function `supabase/functions/generate-report/index.ts`:
  - Input: `{ property_id, report_type }`. Access-checks the user.
  - Uses Lovable AI w/ structured output (`Output.object`) to produce a typed report (executive summary, key findings, risks, recommendations, system breakdown).
  - Returns JSON; cached in new `property_reports(id, property_id, report_type, payload jsonb, created_by, created_at)` table (migration + RLS + GRANTs).
- New page `src/pages/PropertyReport.tsx` at `/property/:id/report/:type`:
  - Renders branded HTML report (uses realtor branding from `profiles` if `primaryRole=realtor`).
  - "Download PDF" button — client-side via `window.print()` with a print stylesheet (already partially set up via `no-print` class). Avoids extra deps; same approach the existing share/print flow uses.
- Buttons added to `PropertyView.tsx` and `RealtorDashboard.tsx`.

---

## Technical notes

- All AI calls server-side via Lovable AI Gateway; no new secrets.
- Health/risk scoring is heuristic and explicitly labeled "estimated" until real data sources (FEMA, NOAA, county GIS) are wired in — those are dedicated future projects, not part of this plan.
- Each phase ends with verification: build clean, manual smoke on `/demo` and `/property/:id`.
- I will pause after each phase so you can review before moving on.

---

**Confirm to start with Phase 1 (Health Score + Risk Scores).** If you'd rather reorder or drop a phase, tell me which.