# Design Spec — Moto Companion App Roadmap (Stakeholder HTML Visualization)

**Pipeline stage:** product-owner (content brief) → **designer (this doc)** → frontend-developer (implementation)
**Source content:** content brief pasted into this task, extracted from `document/ROAD_MAP.md`. This spec adds no facts beyond that brief — see §9 for the handful of structural inferences that should get a quick nod before build.

---

## 0. Treatment call

This is a stakeholder-facing internal roadmap review, presented on a laptop in a meeting. It reads as a **polished utilitarian document with dashboard behavior** — real typographic hierarchy and generous spacing like a good memo, plus state-encoded scanning (pills, icons, expand/collapse) like a tool, because the content mixes prose (risk callouts), tabular governance data (decisions), and status-tracked items (milestones). No hero treatment, no illustration, no decorative flourish. The one point of character: the timeline is framed as a **route** — a thin track with milestone markers — because the product itself is about touring routes, and the four milestones are a real, literal sequence (not a decorative 01/02/03). Everywhere else stays quiet.

---

## 1. Design plan (tokens, at a glance)

**Color** — warm-neutral ink/surface pair, one steel-blue interactive accent, four reserved status hues, one separate alarm-red for risk callouts. Full values in §3.

**Type** — three roles:
- Display/heading: **Big Shoulders Display / Text** (condensed, signage-like — ties to the road/route subject without being literal) — used for H1/H2/H3 and eyebrows only, never body prose.
- Body: **Source Sans 3** — all prose, table cells, pill labels.
- Utility/mono: **IBM Plex Mono** — every reference code (`KI-16`, `OQ-T1`…), the version line, section citations.

**Layout** — one horizontal timeline row (4 milestone cards on a road-track), then a full-width tinted governance band (Decisions table), then a two-column risk-callout row — three stacked, visually separated zones, in that order, on a single scrolling page.

---

## 2. Page structure (laptop, ≥1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER                                                               │
│  STAKEHOLDER ROADMAP                                                  │
│  Moto Companion App — 4-MVP Roadmap                        (H1)       │
│  Milestones 4   ·   PO decisions pending 4   ·   Risks flagged 2      │
├──────────────────────────────────────────────────────────────────────┤
│  LEGEND (small, right-aligned strip)                                  │
│  ✓ Near-done   ▤ Needs sign-off   ▲ Dependency risk   ⏱ Later          │
├──────────────────────────────────────────────────────────────────────┤
│  ZONE A — TIMELINE                                                    │
│                                                                        │
│   ●━━━━━━━━━━━●━━━━━━━━━━━●━━━━━━━━━━━●   (route track, 2px)          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                         │
│  │ MVP1   │ │ MVP2   │ │ MVP3   │ │ MVP4   │                         │
│  │ HEALTH │ │TOURING │ │  MAP   │ │Platform│                         │
│  │ _CHECK │ │ _PLAN  │ │TRACKING│ │maturity│                         │
│  │[✓ Near-│ │[▤ Needs│ │[▲ Depen│ │[⏱ Later│                         │
│  │ done]  │ │sign-off│ │dency   │ │]       │                         │
│  │        │ │]       │ │risk]   │ │        │                         │
│  │ …body… │ │ …body… │ │ …body… │ │ …body… │                         │
│  │ ▸ 3 more│ │▸ 4 more│ │▸ 3 more│ │▸ 6 more│                         │
│  └────────┘ └────────┘ └────────┘ └────────┘                         │
├──────────────────────────────────────────────────────────────────────┤
│  ZONE B — DECISIONS NEEDED FROM PO  (4)          [tinted band, full   │
│  ┌────────────────────────────────────────────┐  bleed, top rule]    │
│  │ (a) │ Decision text │ §ref │ [pill] status  │                     │
│  │ (b) │ …             │ …    │ [pill] …       │                     │
│  │ (c) │ …             │ …    │ [pill] …       │                     │
│  │ (d) │ …             │ …    │ [pill] …       │                     │
│  └────────────────────────────────────────────┘                     │
├──────────────────────────────────────────────────────────────────────┤
│  ZONE C — RISK CALLOUTS                                               │
│  ┌───────────────────────────┐  ┌───────────────────────────┐        │
│  │▍⚠ RISK                    │  │▍⚠ RISK                    │        │
│  │ Sequencing risk (b)       │  │ Auth conflict (a)          │        │
│  │ …prose…  [OQ codes]       │  │ …prose…  [OQ-G1][KI-18]    │        │
│  └───────────────────────────┘  └───────────────────────────┘        │
├──────────────────────────────────────────────────────────────────────┤
│  FOOTER — version / last-updated line (mono, muted)                   │
└──────────────────────────────────────────────────────────────────────┘
```

Container: max-width `1200px`, centered, side padding `48px`. Vertical rhythm between the five stacked regions (header, legend, Zone A, Zone B, Zone C, footer): `64px`. This spacing gap — not color, not a card wrapper — is what tells the eye "these are three separate things," per the brief's requirement that the three zones not blend.

Zone A sits on the page background. Zone B breaks the container edge-to-edge (full-bleed tinted band) specifically so it reads as a *different kind of thing* (a governance panel, not a card row). Zone C returns to the page background, contained, like Zone A, but its cards use the alarm-red family, never the status family — so it can't be mistaken for a 5th/6th milestone.

---

## 3. Color system

Flat only: no gradients, no drop shadows anywhere in the page. Separation between elements comes from a `1px` border, a `4px` accent border, or background tint — never elevation.

### 3.1 Structural neutrals

| Token | Hex | Use |
|---|---|---|
| `ink` | `#1C1B19` | Primary text — warm-biased near-black, not pure #000 |
| `ink-muted` | `#55524C` | Secondary/meta text, captions |
| `surface` | `#FAF9F6` | Page background — warm off-white |
| `surface-card` | `#FFFFFF` | Milestone/risk card background |
| `surface-band` | `#EEF1F5` | Zone B (Decisions) band background — cool-tinted, deliberately *not* warm, so the governance zone reads distinct from the warm page/card surfaces |
| `border-neutral` | `#DCD8CF` | Default 1px card/table borders |

### 3.2 Interactive accent (never used for status)

| Token | Hex | Use |
|---|---|---|
| `accent` | `#2D5FA6` | Eyebrow labels, legend heading, hover states, focus ring, letter badges `(a)`–`(d)` |
| `accent-tint` | `#E3EBF5` | Hover background wash, focus ring halo |

### 3.3 Status palette (milestone pills — reserved, 4 states, matches the brief's 4 labels exactly)

| Status label | Token | Hex (text/icon) | Tint (pill/card-accent bg) | Icon (shape carries meaning, not fill alone) |
|---|---|---|---|---|
| Near-done | `status-green` | `#2E7D46` | `#E4F2E7` | check-circle |
| Needs sign-off | `status-amber` | `#8A5A05` (darkened for AA text contrast; swatch chip uses `#B8720A`) | `#FBEBD2` | document/clipboard |
| Dependency risk | `status-orange` | `#8F3208` (darkened for text; swatch chip uses `#C1440E`) | `#FBE3D5` | hazard triangle |
| Later | `status-gray` | `#6E6A5F` | `#EFEDE8` | clock outline |

**On sharing amber vs. distinct colors (required call):** Needs-sign-off (MVP2) and Dependency-risk (MVP3) get **distinct hues within the same warm "needs attention" family**, not one shared color — plus distinct icons (document vs. hazard triangle). Reasoning: they are different *kinds* of blocker with different owners and different unblock mechanics — MVP2 is waiting on business-analyst answers (OQ-T1–T4) and a PO scope sign-off; MVP3 is waiting on a PO navigation-placement call plus GPS/background-recording answers, and its brief explicitly frames it as a *dependency risk*, a stronger/structural label than "needs sign-off." Collapsing them into one color would make a stakeholder scanning the timeline unable to tell "waiting on an answer" from "structurally blocked and second-guessed on sequencing" without reading prose. Distinct hue + distinct icon solves this while keeping both visibly in the same "not green, not gray" attention family (both sit in the amber→orange range, unlike the unrelated green/gray endpoints).

### 3.4 Risk-callout semantic (Zone C only — deliberately not reused from §3.3)

| Token | Hex | Use |
|---|---|---|
| `risk-red` | `#B3261E` | Left accent bar (4px), warning icon, "RISK" eyebrow |
| `risk-red-tint` | `#FBEAE8` | Callout card background |

Kept separate from `status-amber`/`status-orange` on purpose: a risk callout is a cross-cutting governance flag *about* a milestone, not the milestone's own status. If it reused the milestone status color it would visually read as "just another MVP status chip" and blur Zone C into Zone A. A dedicated alarm-red, used nowhere else on the page, keeps the two zones legible as different categories of information.

### 3.5 Grayscale/CVD safety
Every status and risk signal ships as **icon + text label + color**, never color alone (per dataviz status-color convention). In grayscale or print, the shape of the icon (check / document / triangle / clock / warning-triangle) and the text label still fully carry meaning; color is a scan-speed layer on top, not the only channel.

---

## 4. Typography

Fallback stacks (in case the named webfonts fail to load): Display → `"Big Shoulders Display", "Archivo Narrow", "Arial Narrow", sans-serif`. Body → `"Source Sans 3", "Segoe UI", system-ui, sans-serif`. Mono → `"IBM Plex Mono", "Consolas", "SFMono-Regular", monospace`.

Base body size 15px; scale below is desktop (laptop-primary). Hierarchy is built from **size + weight + letter-spacing + rule/border**, so it survives with color removed.

| Role | Face | Size / line-height | Weight | Tracking | Case |
|---|---|---|---|---|---|
| Eyebrow ("STAKEHOLDER ROADMAP", "RISK") | Source Sans 3 | 12 / 16 | 700 | +1.5px | UPPERCASE |
| H1 (page title) | Big Shoulders Display | 34 / 38 | 600 | 0 | Normal case |
| Stat strip label ("Milestones") | Source Sans 3 | 12 / 16 | 600 | +0.4px | UPPERCASE |
| Stat strip value ("4") | IBM Plex Mono | 18 / 20 | 600 | 0 | tabular-nums |
| H2 (zone titles: "Decisions Needed from PO") | Big Shoulders Display | 22 / 26 | 600 | 0 | Normal case |
| H3 (milestone/risk card title) | Big Shoulders Text | 19 / 24 | 600 | 0 | Normal case |
| Card eyebrow ("MVP1") | IBM Plex Mono | 12 / 16 | 500 | +0.8px | UPPERCASE |
| Body (prose, table cells) | Source Sans 3 | 15 / 22 | 400 | 0 | Sentence case |
| Body small (meta, "3 more items") | Source Sans 3 | 13 / 18 | 400 | 0 | Sentence case |
| Pill/status label | Source Sans 3 | 11 / 12 | 600 | +0.5px | UPPERCASE |
| Reference-code pill (`KI-16`) | IBM Plex Mono | 12 / 12 | 500 | 0 | As written |
| Section citation (`§6`) | IBM Plex Mono | 12 / 16 | 400 (italic) | 0 | As written |
| Footer / version line | IBM Plex Mono | 12 / 18 | 400 | 0 | As written |

Headings get `text-wrap: balance`. Body prose columns cap at ~65 characters (constrains risk-callout card width even though the grid could allow wider — pad the card, don't stretch the text line).

---

## 5. Component specs

### 5.1 Header
Padding `48px 48px 32px`. Eyebrow → H1 → stat strip, stacked with `8px` / `16px` gaps respectively. Stat strip is three `label: value` pairs separated by a `·` (Plex Mono, `ink-muted`), laid out inline, values in tabular-nums mono for alignment. *(This strip is a computed count of what's already in the brief — 4 milestones, 4 decisions, 2 risks — not new content; flagged in §9.)*

### 5.2 Legend
A single row, right-aligned under the header (or left-aligned above the timeline — pick right-aligned to keep it visually secondary to H1). Four inline swatch groups, each: `10px` filled circle (status color) + icon glyph at `10px` inside/adjacent + label (pill-label type scale). Gap between groups `20px`. No border, no background — it's a key, not a card.

### 5.3 Milestone card (Zone A)
- Width: `(100% − 3×24px) / 4` in a 4-column grid, `gap: 24px`.
- Background `surface-card`, `1px solid border-neutral`, `border-radius: 6px`, no shadow.
- Top accent: `4px solid` in the card's status color — the one place color-fill is load-bearing for status, backed by the pill below it.
- Padding `20px`.
- A `16px`-diameter circle marker sits on the route track directly above each card, centered, filled with the card's status color, `2px solid surface` ring (so it reads as a "stop" on the track rather than merging into it).
- Internal stack, `12px` gaps: eyebrow (`MVP1`) → H3 title → status pill → `1px` divider → body summary → always-visible key line → expand trigger row.
- **Status pill**: inline, icon (14px) + label, `4px 10px` padding, `border-radius: 999px` (only pill-shaped element allowed radius >6px, to visually mark it as "state," distinct from cards/pills-as-tags elsewhere), background = status tint, text/icon = status text-hex from §3.3.
- **Body summary**: body-small text, default state shows a **fixed 2-line clamp** of the shipped/provisional scope description (`text-overflow: ellipsis` via line-clamp), never the full bullet list, in collapsed state.
- **Always-visible key line**: bold body-small, one line, never hidden by collapse — this is the single fact each card cannot lose even collapsed:
  - MVP1: "Sole blocker: `KI-16`"
  - MVP2: "Build blocked on: `OQ-T1` `OQ-T2` `OQ-T3` `OQ-T4`"
  - MVP3: "Blocked on nav-placement decision: `KI-9`"
  - MVP4: "No blockers — sequenced last by design"
- **Expand trigger**: bottom-right of card, `▸ N more items` in body-small + `accent` color chevron icon, full row is the click target (min height 32px for touch/click comfort).

### 5.4 Feature chips (inside MVP1's shipped-scope list, expanded state only)
Each shipped item from the brief (`Live Vitals`, `Service Reminders`, `spend-this-year summary`, …) renders as a small tag: `Source Sans 3` 13px, `4px 10px` padding, `1px solid border-neutral`, `border-radius: 4px`, `surface` background. Only items that have brief-given parenthetical detail (currently: `Service Reminders`) get a `dotted underline` under the label — that dotted underline **is** the hover affordance; plain chips have no underline and no hover state, because there is no extra detail to show and a dead hover state would be a lie.

### 5.5 Reference-code pill (used identically in Zones A, B, C)
- `IBM Plex Mono` 12px/500, `3px 8px` padding, `border-radius: 4px`.
- **Neutral variant** (default — e.g. a code cited in the Decisions table or a risk callout's supporting list): background `#EEF0F3`, border `1px solid #D7DAE0`, text `ink`.
- **Status-tied variant** (used only when the pill *is* a card's declared blocker/key-line code, e.g. `KI-16` inside the MVP1 key line): background = that status's tint, border `1px solid` status hex, text = status text hex. Same shape/size as neutral variant — only fill changes — so it's still instantly recognizable as "a code pill," just colored to its owning milestone.
- Section citations (`§6`, `§4.3`) are **not** pills: plain `IBM Plex Mono` 12px italic, `ink-muted`, no background/border — they're secondary citations, not primary tracked codes, and shouldn't compete visually with KI-/OQ- pills.
- Pills are not click targets (no navigation exists to point them at). They are hover-only (see §6).

### 5.6 Decisions band (Zone B)
- Full-bleed: background `surface-band`, `2px solid accent` top border only (bottom edge is a plain `64px` margin back to page background, no bottom rule — one rule is enough to mark entry into the zone).
- Inner content constrained to the same `1200px`/`48px` container as everything else.
- H2 "Decisions Needed from PO" + a count badge (`4`) in a small circle, `accent` background, white text, 20px diameter, immediately after the heading.
- Table, 4 rows, columns: `Letter (40px) | Decision (flex, ~45%) | Detailed at (~15%, mono-italic §refs) | Current status (~30%, status pill + one-line text)`.
- Letter badge: `28px` circle, `1px solid accent`, `accent` text, `IBM Plex Mono` 600, transparent fill (outline style — distinguishes it from the filled milestone status dots in Zone A, even though both are circles, so they aren't mistaken for the same kind of marker).
- Row divider: `1px solid border-neutral` between rows only (no outer table border box — let the band's own edge be the boundary).
- Row hover: background → `accent-tint`, no other change; **no click/expand** — table content is already complete, adding a fake affordance here would be noise.
- Status-pill color per row, tied to which status family the decision belongs to (documented mapping, not arbitrary — see §9 flag #2):
  - (a) OQ-G1 auth placement → `status-amber` (a scope/sign-off type call)
  - (b) MVP2→MVP3 sequencing → `status-orange` (a structural/dependency call, matches Risk Callout 1)
  - (c) MVP2 scope cut → `status-amber`
  - (d) MAP_TRACKING tab placement → `status-orange` (matches KI-9's dependency-risk framing)

### 5.7 Risk callout card (Zone C)
- Two-column grid, `gap: 24px`, each card `flex: 1`.
- Background `risk-red-tint`, left border `4px solid risk-red`, rest of border `1px solid` `risk-red` at 30% opacity, `border-radius: 6px`, padding `24px`, no shadow.
- Header row: warning-triangle icon (20px, `risk-red`) + eyebrow "RISK" (Source Sans 3, 12px, 700, uppercase, `risk-red`) + small `accent`-outline letter badge referencing the matching Decisions-band row (`(b)` for Callout 1, `(a)` for Callout 2) — this is the explicit cross-link between Zone C and Zone B without merging their layouts.
- H3 callout title, body prose max-width ~65ch, reference-code pills (neutral variant) inline at the end of the paragraph where the brief already cites them.
- Always fully expanded — no collapse control on risk callouts; per the brief's "visually highlight both," these must never be hidden behind an interaction.

### 5.8 Footer
`1px solid border-neutral` top rule, `24px` padding, `IBM Plex Mono` 12px, `ink-muted`. Content: version line verbatim from the brief's §5 ("Version 1.1 (2026-07-19) — …", truncate the long changelog sentence to the version/date/one-line-summary if it doesn't fit one line — see §9 flag #3). Left-aligned; no other footer content.

---

## 6. Interaction spec

Two distinct mechanisms — do not conflate them:

**A. Hover → feature/code detail (tooltip, no state change, information only)**
- Applies to: feature chips with extra brief detail (§5.4) and every reference-code pill (§5.5), in all three zones.
- Trigger: mouse hover (pointer devices) with 150ms delay before showing, to avoid flicker on cursor pass-through.
- Visual: dark tooltip bubble (`ink` background, `surface` text, 8px padding, 12px Source Sans, `border-radius: 4px`), small triangle pointer, positioned above the element with `4px` offset, fades in 120ms.
- Content: the pill's/chip's known one-line description **exactly as already stated in the brief** (e.g. `KI-16` → "Selecting a catalog bike sets brand/name only — doesn't wire interval overrides into shown service items"; `OQ-T1` → "Which HEALTH_CHECK status triggers the pre-departure warning"). No new facts invented — content is the brief's own reference-code descriptions and shipped-scope parentheticals.
- Touch/no-hover fallback: tap toggles the same tooltip open; tapping elsewhere on the page closes it.
- `prefers-reduced-motion`: skip the fade, show/hide instantly.

**B. Click → expand/collapse (structural, changes what's visible)**
- Applies to: milestone cards only (Zone A). Nothing in Zone B or Zone C is collapsible (see §5.6, §5.7 for why).
- Click target: the entire "N more items" row at the card's bottom edge (chevron + text), min-height 32px, `cursor: pointer`. Clicking elsewhere on the card (title, pill, body text) does nothing, to avoid accidental toggles while a presenter is pointing at content.
- **Default state on load: collapsed, for all four cards.** Stakeholder-presentation rationale: the presenter controls pacing and expands a card only when discussing it; an all-expanded initial view would be a wall of text before anyone starts talking.
- Collapsed → shows: eyebrow, title, status pill, 2-line-clamped body summary, always-visible key line, `▸ N more items`.
- Expanded → shows: same header block, then full unclamped bullet list of every remaining item named in that milestone's brief section (including feature chips per §5.4 for MVP1, all OQ/KI codes for MVP2–4), chevron rotates to `▾`, trailing control changes to `▾ Show less`.
- Transition: card height animates `200ms ease-out`; chevron rotates `150ms`. Under `prefers-reduced-motion`, both become instant (no animation, just state swap).
- Multiple cards can be expanded simultaneously (independent state, not an accordion) — a presenter may want MVP1 and MVP2 open side by side to explain the sequencing risk.

---

## 7. Responsive behavior

**Primary breakpoint: 1024px.**

- **≥1024px (laptop/presentation — primary target):** layout exactly as §2. Timeline 4-across with visible route track. Decisions table full 4-column-equivalent row layout. Risk callouts 2-across.
- **640–1023px (narrower window / tablet):**
  - Zone A: grid becomes 2×2. The connecting route track is dropped entirely (it can't read correctly broken across two rows) — each card instead keeps only its own `4px` top status-color accent as the state signal; the small circle marker moves to sit inline just left of the card eyebrow instead of on a track.
  - Zone B: table rows become stacked mini-cards — each decision renders as `(letter badge) + Decision title` on one line, then `Detailed at: §ref` and `Status: [pill]` as labeled key-value lines below it, `1px` divider between decision cards instead of table rows.
  - Zone C: grid naturally collapses to 1 column (already `flex: 1` items in a wrapping grid) — stack with `24px` gap.
  - Container padding drops to `24px`.
- **<640px (not a primary target, but must not break):** everything single-column; stat strip in the header wraps to one `label: value` per line; tooltips switch fully to tap-toggle (no hover capability assumed); feature-chip rows wrap normally.

---

## 8. Reference-code & version treatment — summary

One consistent rule used everywhere in the page: **any string matching `KI-#`, `OQ-#`, or a decision letter `(a)`–`(d)` is monospace, in a pill or badge, never inline in a prose sentence as plain text.** Section citations (`§4.2`) are the one exception — mono but unboxed, since they're secondary. The version/changelog line lives in the **footer**, not the header, treated as fine-print colophon (mono, muted, smallest static type size on the page) — kept out of the header so the header stays a clean title + stat summary, and out of Zones A–C so it doesn't compete with any of the three content zones for attention.

---

## 9. Flags for step 3 / stakeholder review (not content decisions I'm authorized to make silently)

1. **Header stat strip** ("Milestones 4 · PO decisions pending 4 · Risks flagged 2") is a count I derived directly from the brief's own section structure (4 MVPs, a 4-row decisions table, 2 named risk callouts) — not a new fact, but flagging it since it wasn't explicitly specified as a component in the brief. Drop it if product-owner would rather the header stay title-only.
2. **Decisions-table pill color mapping** (a)/(c) → amber, (b)/(d) → orange (§5.6) is a designer inference tying each decision to the status family of the milestone it primarily blocks. It's defensible from the brief's own framing (sequencing/placement = "dependency risk" language; scope/auth sign-off = "needs sign-off" language) but is a visual judgment call, not a stated rule — confirm before build.
3. **Footer version line length**: the brief's §5 "Version 1.1" entry is a multi-sentence changelog paragraph. The spec calls for a one-line footer treatment; frontend-developer should truncate to "Version 1.1 (2026-07-19) — see `document/ROAD_MAP.md` §5 for full changelog" rather than reflowing the entire paragraph into the footer. Confirm this truncation is acceptable, or specify a "view full changelog" affordance if not — none is designed here since the brief didn't ask for one.
4. **Dark mode** is intentionally out of scope for this spec — the brief's presentation context (laptop, stakeholder meeting) reads as a single-session, likely-projected, light-context use case, and no dark-mode requirement was stated. If frontend-developer's build pipeline auto-generates a dark variant, treat that as a follow-up design pass, not an extension of this spec.
