# Handoff: FirstCall Platform (Owner App · PM Portal · Restoration CRM)

> **Read this first.** This bundle augments the original `FirstCall-Build-Specification.md`. That spec is still the source of truth for the **data model, multi-tenant architecture, estimate engine pipeline, and build phases**. This document records **what was designed and decided in the prototype phase that is NOT in the original spec** — implement both together.

---

## Overview

FirstCall is a white-label **ERP + CRM for the disaster-restoration industry**. A property owner taps once to report damage, gets an instant AI ballpark, and is dispatched to a crew; the restoration company runs the whole job, splits **HO6-vs-master-policy** coverage, and feeds every signed job into a pricing model that improves over time.

The prototype realizes **three surfaces + a hub**:

| File | Surface | Form factor |
|---|---|---|
| `prototype/FirstCall Platform.html` | **Hub / launcher** | Full-screen landing → links to the three surfaces |
| `prototype/FirstCall Owner App.html` | **A · Owner App** | Mobile (iPhone frame), PWA-style |
| `prototype/FirstCall PM Portal.html` | **B · PM / HOA Portal** | Responsive desktop web app |
| `prototype/FirstCall Restoration CRM.html` | **C · Restoration CRM** | Desktop web app |

## About the design files

The files in `prototype/` are **design references built in HTML/React-via-Babel** — they show intended look, copy, and behavior. They are **not production code to copy verbatim**. The task is to **recreate these designs in the target stack** (the original spec recommends **Next.js App Router + TypeScript + Tailwind + shadcn/ui**, route groups per surface, Supabase). Reuse that stack's patterns; treat the HTML as the visual + interaction contract.

To run the references locally: serve the `prototype/` folder over any static server and open the HTML files (they load React/Babel from unpkg and reference sibling `app/`, `web/`, `frames/`, `tweaks-panel.jsx`).

## Fidelity

**High-fidelity.** Final palette, typography, spacing, component styling, copy, and interactions are intended as shown. Recreate pixel-close using the codebase's component library, then wire to real data/services.

---

## ⭐ What's new since the original spec (notify Claude Code of these)

These are the additions/decisions made during the prototype phase. They refine or extend §6–§9 of `FirstCall-Build-Specification.md`:

1. **Damage evidence is multi-modal — files AND links.** The Owner App intake (spec A3 "photos, max 10") is generalized to an **Evidence** step that accepts:
   - **Photos** (image file upload, multiple)
   - **Video** (video file upload, multiple)
   - **Matterport / 3D scan or any URL** (pasted link; `matterport.com` / `/show` / `3d` / `scan` patterns are tagged as a **3D scan**)
   - Each item is `{ id, kind: 'photo'|'video'|'scan'|'link', name, url }`.
   - **Evidence weighting drives confidence:** photo = 1, video = 2, scan = 5. The summed weight feeds the estimate engine's confidence band (≥5 High, ≥2 Medium, else Low). A single Matterport scan → High confidence. Implication for the real engine (spec §9): the vision/reasoning step should ingest video frames and Matterport scans, not just photos.

2. **Estimate generation is an explicit, surfaced action in the CRM.** Beyond the owner-side auto-ballpark, CRM staff **generate/regenerate** an estimate from inputs (cause of loss · affected areas · evidence count) with a short "drafting" state. Entry point: **any Dispatch-board job card is clickable → opens the Estimate Editor pre-filled to that job's cause.** (Spec §8 implied the editor; this defines how an estimate is *created* there.)

3. **Per-client (per-tenant) pricing footprint.** Decision: the **T&M / price-list item count is per tenant**, set by what that client imported during Onboarding — NOT a global constant. Do not hardcode a universal number (e.g. "21,408") anywhere shared; read it from the tenant's price-list import. The hub deliberately shows **no** global item count.

4. **White-label theming is a live, per-tenant setting.** Accent color, workspace/tenant name, vendor name, and marketing copy are tweakable (prototype exposes these via a "Tweaks" panel; in production they map to `Tenant.branding`). Accent is applied through CSS variables (`--accent` + derived alphas).

5. **Surface switching + hub.** A persistent switcher moves between Owner / PM / CRM; a hub landing introduces the three surfaces. In production this is one app with route groups (per spec §4).

6. **Coverage split is directly editable with a one-tap move.** PM Portal master-policy responsibilities use a **⇄ control** to move a line between Master and HO6; the CRM estimate editor uses the same ⇄ on individual line items (the "restoration company is the hero in a dispute" moment, spec §8).

7. **O&P guardrail + admin override is fully specified** (see Interactions below): standard tiers 10/10·15/15·20/20; anything above 20/20 flags; override requires an admin name + reason and **quarantines the job from the learning baseline** (spec §3 "outlier quarantine" — this defines the UI/flow).

---

## Surfaces & screens

### A · Owner App (mobile, `app/` modules)
Flow: **Home → Role gate → Guided intake → AI "thinking" → Ballpark → Dispatch & track.**
- **Home** — "Covered by [vendor]" MSA badge (teal) or "no vendor → top-rated local" (navy); large accent **Report damage** hero; Active claims / 24/7 line cards.
- **Role gate** — HOA / Unit owner / Tenant. Selecting **Unit owner** turns on HO6 separation (teal note).
- **Guided intake** — (1) Cause of loss tiles; (2) **Add evidence** (photos/video files + Matterport/link, see "What's new" #1); (3) Affected-area chips + free-text note. Stepper progress.
- **AI thinking** — navy full-screen, animated checklist (reading photos → classify → IICRC → price against price list → apply O&P). ~600 ms/step (130 ms if reduce-motion).
- **Ballpark** — navy total card with range + confidence pill + evidence summary; itemized list with Master/HO6 tags; raw subtotal, O&P line, total; **NTE toggle** ("approve as not-to-exceed" caps at the high end vs "accept as ballpark"); permanent disclaimer.
- **Dispatch & track** — "call being placed" ripple → vendor card (rating, MSA/ETA) → animated status timeline (Request received → Crew dispatched → On-site → Contract & start). No contract here — signed on-site in CRM. NTE approval is attached to the claim.

### B · PM / HOA Portal (`web/pm.jsx`)
- **Coverage Split** (default) — 4 stats (enrolled / HO6 verified / pending / none); **unit coverage map** (grid colored by HO6 status, filterable, click a unit → right detail panel with its split, coverage-gate warning, Verify HO6, Invite owner); **Master policy responsibility split** editor (parsed PDF state + re-parse + ⇄ move between Master/HO6).
- **Units & Owners** — searchable table (unit, owner, floor, HO6 badge, invite).
- **Active Claims** — claim cards with coverage badge + stage + coverage-gate note.
- **Vendors / MSA** — MSA summary card.
- **Invite owner** modal (unit + email).

### C · Restoration CRM (`web/crm.jsx`, `web/crm_estimate.jsx`)
- **Dispatch Board** (default) — **capture-ratio gauge** (SVG ring, target marker ≥85%), Calls captured, Pipeline value (computed), T&M items active (**per-tenant**); **kanban** New → Dispatched → On-site → Estimate → Signed with **HTML5 drag-to-advance** + cause-colored cards; **click a card → Estimate Editor**.
- **Estimate Editor** — **Generate panel** (cause · affected areas · evidence count · Generate/Regenerate w/ drafting state); two-column **Master | HO6** with per-line **⇄ move** + live bucket/total recalc; **ballpark total** card; **O&P guardrail** (tiers + overhead/profit steppers, flag >20, admin-override modal, adjust-to-20/20); **Learning baseline** card (raw→baseline; Included/normalized vs Excluded/quarantined when flagged).
- **Onboarding** — 4-step checklist (100 historicals, T&M import, O&P tiers, review sources) with progress + completable steps.
- **Owners & Insurance** table; **Capture Analytics** / **Pricing & Learning** summaries.

---

## Interactions & behavior

- **Evidence upload (A):** hidden `<input type=file accept=image/*|video/*>` triggered by buttons; images preview via `URL.createObjectURL`; link field tags Matterport vs generic. Remove per item.
- **Estimate engine (shared, `app/estimate.jsx`):** `buildEstimate({cause, areas, photoCount, opTier})` → assembles cause mitigation items (some scale by # affected areas) + per-area finish items, each tagged `master`/`ho6`; applies O&P (10/10=20%, 15/15=30%, 20/20=40% combined, split overhead/profit); returns line items, raw subtotal, markup, ballpark, low/high band (band tightens with confidence), master/ho6 shares.
- **⇄ move:** flips a line/responsibility's bucket; totals recompute instantly (animate the row).
- **Kanban drag:** native drag; drop on a column sets the job's `stage`; column shows count + value sum; drop target highlights.
- **O&P guardrail:** `flagged = overhead>20 || profit>20`. Flagged → red banner with **Admin override** (modal: admin name + reason, both required → logs override, job excluded from baseline) or **Adjust to 20/20**.
- **Tweaks panel:** host-protocol panel; persists to localStorage; live-updates accent (CSS vars) + copy.
- **Animations:** entrance/transition animations avoid `opacity:0` start states so static capture/SSR shows content; ~150–420 ms eased.

## State (prototype → production mapping)

- Owner App: `{ role, cause, areas[], media[], note, nte }` + derived `estimate`. → `Claim`, `Estimate`, `EstimateLineItem`, evidence assets (spec §5).
- PM Portal: `units[]` (mutable HO6 status), `coverage {master[], ho6[]}`, `selectedUnit`. → `Unit`, `MasterPolicy.parsed_coverage`.
- CRM: `jobs[]` (mutable stage), estimate `items[]` (mutable bucket), `oh/profit`, `override`. → `Job`, `Estimate`, `EstimateLineItem`, override audit log.
- Tenant theming → `Tenant.branding`.

## Design tokens

- **Colors:** navy `#0E2A47`, ink `#1B2733`, gray `#6E7A86`, faint `#9AA6B2`, teal `#1FA8A0` (success/HO6), teal-dark `#157E78`, **accent (white-label, default orange) `#E8703A`**, accent-dark `#CC5A28`, amber `#C98A2B` (pending/warn), red `#B5524B` (none/flag), paper `#F4F3EF`, card `#FFFFFF`, wash `#FBFAF7`. Cause tints: Water `#2A6FDB`, Fire `#CC5A28`, Mold `#1F8A5B`, Storm `#7A5AE0`.
- **Lines:** `rgba(14,42,71,0.10)` / `0.06`; hover `rgba(14,42,71,0.04)`.
- **Type:** **IBM Plex Sans** (UI) + **IBM Plex Mono** (numbers, labels, eyebrows). Mono labels: ~11px, uppercase, letter-spacing 0.12–0.14em.
- **Radius:** controls 9–12, cards 16–20, pills 99. **Shadows:** sm `0 1px 2px rgba(14,42,71,.05), 0 3px 10px rgba(14,42,71,.05)`; md adds `0 10px 30px rgba(14,42,71,.07)`.
- **Spacing:** 24px page padding; 12–18px gaps; 64px CRM/PM top bar; 248px sidebar.

## Assets

- **Fonts:** IBM Plex Sans + Mono (Google Fonts).
- **Icons:** inline stroke SVG set in `app/icons.jsx` (functional glyphs — no external icon lib). Swap for the codebase's icon system (e.g. lucide) on rebuild.
- **Device frame:** `frames/ios-frame.jsx` (prototype-only; not needed in production — owner app is a responsive/PWA layout).
- **No raster brand assets** — the "F" mark is a tinted rounded square; replace with real per-tenant logo.

## Files in this bundle

- `prototype/FirstCall Platform.html` + `web/platform.jsx`
- `prototype/FirstCall Owner App.html` + `app/` (`app.jsx`, `screens_a.jsx`, `screens_b.jsx`, `ui.jsx`, `estimate.jsx`, `icons.jsx`) + `frames/ios-frame.jsx` + `tweaks-panel.jsx`
- `prototype/FirstCall PM Portal.html` + `web/pm.jsx`, `web/ui.jsx`, `web/data.jsx`
- `prototype/FirstCall Restoration CRM.html` + `web/crm.jsx`, `web/crm_estimate.jsx`, `web/ui.jsx`, `web/data.jsx`, `app/estimate.jsx`, `app/icons.jsx`
- `web/data.jsx` holds the shared seed data (units, coverage defaults, jobs, cause tints).

> Original architecture/data-model/build-phases reference: **`FirstCall-Build-Specification.md`** (in the project's source materials). Implement that alongside this document.
