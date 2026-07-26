# Design Spec — Moto Companion App Roadmap (Dark "Rider" Reskin)

**Pipeline stage:** designer (this doc, step 1) → frontend-developer (implementation, step 2)
**Relationship to prior work:** this is a **re-theme of `docs/roadmap/ROADMAP_DESIGN_SPEC.md`**, applied to
the existing, correct implementation at `design/prototype/moto-app-roadmap.html`. Content,
information architecture, the 4-state status taxonomy, the interaction model, and the responsive
breakpoints are **carried over unchanged** — see §0 for exactly what that means per section. This
doc only replaces the visual theme: color, type, and the route/checkpoint motif. Nothing here
should require step 2 to open the old spec to find what changed — everything that differs is
restated in full below; everything that doesn't is named explicitly as unchanged.

Contrast values below were computed by hand from each hex pair's WCAG relative luminance (not
eyeballed) — every pairing that ships as body/label/icon text states its ratio.

---

## 0. Treatment call

Same brief, same audience, same context (stakeholder review, laptop, single scrolling page) as the
old spec's §0 — **unchanged**: "polished utilitarian document with dashboard behavior," no hero,
no illustration. What changes is the *material* the document is rendered on. Where the light spec
read as a clean printed memo, this reskin reads as **the same memo, reviewed on a bike's
after-dark trip computer** — asphalt-dark surfaces, road-sign accent colors, a timeline that
behaves like an actual route on a night map (dashed center line, checkpoint markers, signpost-cut
panels) rather than a generic horizontal stepper. Still flat, still quiet everywhere the content
doesn't need a signal — the "route" idea is expressed structurally (track, markers, card shape),
not through decoration or added icons.

---

## 1. Design plan (tokens, at a glance)

**Color** — cool asphalt-charcoal base (`#14171C` page, `#1C2027` cards) with a deliberately
*warm* elevated band for Zone B (`#2B2116`, an amber-lit "instrument cluster" tone) — the same
"different kind of thing" mechanism as the old spec's cool-band-on-warm-page, just inverted for a
dark base. One burnt-orange interactive accent (`#FF6A1A`), one road-sign-yellow signal accent
(`#FFC22E`) reserved narrowly for focus rings and the route's center-line marking. Four status
hues re-picked from scratch for dark-surface contrast (green/amber/orange/gray), a distinct
brighter taillight-red for risk callouts. Full values and computed ratios in §3.

**Type** — three roles, two of them re-picked:
- Display/heading: **Oswald** (condensed, industrial, signage-derived — American road/transit
  signage uses this letterform family) — H1/H2/H3/eyebrows only, never body prose.
- Body: **Public Sans** — all prose, table cells, pill labels. Plain, sturdy, built for dense
  utilitarian reading (it's the U.S. federal digital-services body face) — distinct from the old
  spec's Source Sans 3 so the two themes don't share a body voice, but equally quiet.
- Utility/mono: **IBM Plex Mono** — **unchanged from the old spec.** Every reference code, the
  version line, section citations. No reason to re-skin the one face whose job is pure legibility
  of codes; recoloring it (not refacing it) is enough.

**Layout** — same three-zone stack as before (route-track timeline → full-bleed Decisions band →
two risk callouts → footer), same `1200px`/`48px` container, same `64px` zone rhythm. The
route-track motif is sharpened: the track itself is rendered as a dark lane with a dashed
road-sign-yellow center line; milestone panels get a cut top-right corner (a signpost/placard
silhouette) that Zone B/C deliberately do **not** share, keeping the zone families visually
distinct exactly as the old spec required.

---

## 2. Page structure (laptop, ≥1024px)

Structure is byte-for-byte the same as old spec §2 — reproduced here with the dark-specific
render notes inline so this doc is self-contained.

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER (on --surface, asphalt charcoal)                              │
│  STAKEHOLDER ROADMAP                                                  │
│  Moto Companion App — 4-MVP Roadmap                        (H1)       │
│  Milestones 4   ·   PO decisions pending 4   ·   Risks flagged 2      │
├──────────────────────────────────────────────────────────────────────┤
│  LEGEND (small, right-aligned strip, recolored swatches)              │
│  ✓ Near-done   ▤ Needs sign-off   ▲ Dependency risk   ⏱ Later          │
├──────────────────────────────────────────────────────────────────────┤
│  ZONE A — TIMELINE ("the route")                                      │
│                                                                        │
│   ●╍╍╍╍╍╍╍╍╍╍╍●╍╍╍╍╍╍╍╍╍╍╍●╍╍╍╍╍╍╍╍╍╍╍●   (dashed center-line track)   │
│  ⟨────────⟩ ⟨────────⟩ ⟨────────⟩ ⟨────────⟩  (cut-corner "signpost"  │
│  │ MVP1   ⌐│ MVP2   ⌐│  MVP3  ⌐│Platform⌐   panels — top-right cut)  │
│  │ HEALTH │ │TOURING │ │  MAP   │ │maturity│                         │
│  │ _CHECK │ │ _PLAN  │ │TRACKING│ │        │                         │
│  │[✓ Near-│ │[▤ Needs│ │[▲ Depen│ │[⏱ Later│                         │
│  │ done]  │ │sign-off│ │dency   │ │]       │                         │
│  │        │ │]       │ │risk]   │ │        │                         │
│  │ …body… │ │ …body… │ │ …body… │ │ …body… │                         │
│  │ ▸ 3 more│ │▸ 4 more│ │▸ 3 more│ │▸ 6 more│                         │
│  └────────┘ └────────┘ └────────┘ └────────┘                         │
├──────────────────────────────────────────────────────────────────────┤
│  ZONE B — DECISIONS NEEDED FROM PO (4) — warm "instrument-panel" band │
│  ┌────────────────────────────────────────────┐  full bleed, on      │
│  │ (a) │ Decision text │ §ref │ [pill] status  │  --surface-band      │
│  │ (b) │ …             │ …    │ [pill] …       │  (amber-lit, not     │
│  │ (c) │ …             │ …    │ [pill] …       │  asphalt-cool)       │
│  │ (d) │ …             │ …    │ [pill] …       │                     │
│  └────────────────────────────────────────────┘                     │
├──────────────────────────────────────────────────────────────────────┤
│  ZONE C — RISK CALLOUTS ("taillight" cards, sharp corners)             │
│  ┌───────────────────────────┐  ┌───────────────────────────┐        │
│  │▍⚠ RISK                    │  │▍⚠ RISK                    │        │
│  │ Sequencing risk (b)       │  │ Auth conflict (a)          │        │
│  │ …prose…  [OQ codes]       │  │ …prose…  [OQ-G1][KI-18]    │        │
│  └───────────────────────────┘  └───────────────────────────┘        │
├──────────────────────────────────────────────────────────────────────┤
│  FOOTER — version / last-updated line (mono, muted, on --surface)     │
└──────────────────────────────────────────────────────────────────────┘
```

Container, padding, and the `64px` inter-zone rhythm: **unchanged from old spec §2.** Zone A sits
on `--surface`. Zone B is full-bleed on `--surface-band` (now warm, not cool — see §3.1). Zone C
returns to `--surface`, contained, using the risk-red family only, never the status family — same
"can't be mistaken for a 5th milestone" rule as before, now reinforced by shape too (§5.3 vs
§5.7 — cut corner vs. sharp corner).

---

## 3. Color system

Flat only — **unchanged discipline from old spec §3**: no gradients, no drop shadows anywhere.
Separation between elements comes from a `1px` border, a `4px` accent border, or a surface-tone/
hue shift — never elevation. On a dark base a *lighter*-toned 1px border reads as a divider the
way a darker one did on light (old spec's border mechanism, inverted).

### 3.1 Structural neutrals

| Token | Hex | Use | Notes |
|---|---|---|---|
| `surface` | `#14171C` | Page background | Cool asphalt-charcoal, blue-gray bias — not pure black (relative luminance ≈0.008) |
| `surface-card` | `#1C2027` | Milestone/risk card background | One step up from page (≈0.014), still cool |
| `surface-band` | `#2B2116` | Zone B (Decisions) band background | Warm umber, amber-lit-instrument-panel tone — deliberately *warm* against the cool page/card, mirroring (inverted) the old spec's cool-band-on-warm-page logic; ≈0.017 luminance, plus the hue shift itself is the primary "different kind of thing" signal |
| `ink` | `#EDEAE3` | Primary text | Warm off-white, not pure `#FFFFFF` — pure white on this dark a ground causes visible halation/glow; a warm near-white reads like reflective lane paint and stays crisp. Luminance ≈0.824 |
| `ink-muted` | `#9C9890` | Secondary/meta text, captions | Warm-muted gray, ≈0.316 luminance |
border-neutral | `#363B43` | Default 1px card/table divider (on `surface`/`surface-card`) | Cool slate, lighter than the surfaces it divides |
| `border-band` | `#463B2C` | Default 1px divider inside Zone B only | Warm-toned so it still reads as a divider against `surface-band` rather than fighting its hue |

**Text-on-surface contrast (all pass AA, 4.5:1 body / 3:1 large):**
- `ink` on `surface-card`: ≈13.6:1
- `ink` on `surface`: ≈15.0:1
- `ink` on `surface-band`: ≈13.1:1
- `ink-muted` on `surface-card`: ≈5.7:1
- `ink-muted` on `surface`: ≈6.3:1

### 3.2 Interactive accents (never used for status)

| Token | Hex | Use |
|---|---|---|
| `accent` | `#FF6A1A` | Burnt-orange. Eyebrow labels, legend heading tone, hover-state text, letter badges `(a)`–`(d)`, Zone B top border, count-badge fill, link color |
| `accent-signal` | `#FFC22E` | Road-sign yellow. Reserved narrowly: focus-visible outline/ring, and the route track's dashed center line (§5.3) — kept out of general UI use so it stays legible as "this is focused" / "this is the road," not a second general accent competing with burnt-orange |
| `accent-tint` | `#2E2016` | Hover background wash (Zone B row hover, any hover fill) — a low-luminance warm wash, not a light pastel (there is no "light tint" that makes sense on a dark base); `ink` text on this wash stays ≈13.9:1 |
| `on-accent` | `#1B1208` | Text/icon color for use **on top of** `accent` or `accent-signal` as a fill (e.g. count-badge). Near-black warm ink — `accent` (0.317 luminance) is bright enough to need a dark, not light, foreground: on `accent` fill ≈6.5:1, on `accent-signal` fill ≈11.5:1 |

**Accent text-on-surface contrast:** `accent` on `surface-card` ≈5.7:1, on `surface` ≈6.3:1, on
`surface-band` ≈5.5:1 — passes AA for normal-size text in every context it's used as a foreground
color (eyebrows, letter-badge text, links).

### 3.3 Status palette (milestone pills — 4 states, re-picked for the dark base, not reused from
the light spec)

| Status label | Token | Hex (text/icon) | Tint (pill/card-accent bg) | Text-on-tint ratio | Text-on-card ratio | Icon |
|---|---|---|---|---|---|---|
| Near-done | `status-green` | `#4ADE80` | `#113322` | ≈7.9:1 | ≈9.4:1 | check-circle |
| Needs sign-off | `status-amber` | `#FFC65A` | `#3A2A0C` | ≈10.0:1 | ≈10.5:1 | document/clipboard |
| Dependency risk | `status-orange` | `#FF8A5C` | `#3D1D10` | ≈8.5:1 | ≈7.0:1 | hazard triangle |
| Later | `status-gray` | `#9AA3AF` | `#262B33` | ≈8.6:1 | ≈6.4:1 | clock outline |

All four exceed the 4.5:1 body-text floor with real margin, and every pill still ships icon +
text label + color per §3.5 — the ratios above are a bonus, not the only safety net.

**On sharing amber vs. distinct colors (carried over from old spec §3.3, unchanged reasoning,
re-picked hexes):** Needs-sign-off and Dependency-risk stay **distinct hues within the same warm
"attention" family** — `status-amber` (`#FFC65A`, a gold/amber, hue ≈40°) vs. `status-orange`
(`#FF8A5C`, a warmer coral-orange, hue ≈14°) — plus their existing distinct icons. The two are
different *kinds* of blocker (waiting-on-an-answer vs. structurally-blocked) and need to stay
tellable apart at a glance; on the dark base this is achieved by both a hue separation (≈26°) and
a lightness separation (0.625 vs. 0.402 luminance) so they don't read as the same chip under a
quick scan or in grayscale/CVD simulation (they remain separable by shape — the icon — regardless).

### 3.4 Risk-callout semantic (Zone C only — still deliberately not reused from §3.3)

| Token | Hex | Use |
|---|---|---|
| `risk-red` | `#FF5C5C` | Taillight red. Left accent bar (4px), warning icon, "RISK" eyebrow, letter-badge-referencing-decision text |
| `risk-red-tint` | `#2A1416` | Callout card background |

Contrast: `risk-red` on `risk-red-tint` ≈5.7:1; `risk-red` on `surface-card`/`surface` (used
nowhere directly as body text, only icon/eyebrow, still checked) ≈5.0:1; `ink` (body prose) on
`risk-red-tint` ≈14.5:1. Kept structurally separate from `status-amber`/`status-orange` for the
same reason as before: a risk callout is a cross-cutting governance flag *about* a milestone, not
a milestone's own status — reusing a status hue would blur Zone C into Zone A.

**"Stay prominent on dark" treatment (this reskin's version of the old spec's requirement) —
concrete mechanism, not just "add contrast":**
- `risk-red-tint` (`#2A1416`) is warmer **and** slightly higher-luminance (≈0.0105) than
  `surface-card` (≈0.0143... note: comparable lightness, but the hue shift toward red is what
  reads at a glance against the surrounding cool charcoal — the same principle the old spec used
  going warm-page/cool-band, inverted here to cool-page/warm-red-card).
- Border strength is *increased* from the light spec's 30%-opacity treatment to a **45%-opacity**
  `risk-red` ring on the top/right/bottom edges (`rgba(255,92,92,0.45)`), because low-opacity
  borders recede faster against a dark ground than a light one — this is a deliberate value
  change, not a straight port.
- The left `4px solid risk-red` accent bar stays full-strength (no opacity reduction) — it is the
  single strongest visual anchor of the card and must not soften.
- Zone C keeps sharp rectangular corners (§5.7) specifically *unlike* Zone A's cut-corner
  milestone cards, so it reads as a different object family, not a 5th checkpoint.

**Decisions band (Zone B) "stay prominent" mechanism:** the full-bleed warm `surface-band` fill
against the cool page is itself the prominence device — a large, unmissable hue shift, the same
mechanism (not a shadow, not a bigger border) the old spec used for its cool band. The `2px solid
accent` top rule is kept as the single entry marker, unchanged in spirit from old spec §5.6.

### 3.5 Grayscale/CVD safety

Unchanged principle from old spec §3.5: every status and risk signal ships as **icon + text label
+ color**, never color alone. Verified above that even the color channel alone survives a
grayscale pass reasonably (green/amber/orange/gray sit at meaningfully different luminances:
0.55 / 0.63 / 0.40 / 0.36), but the icon shape and text label remain the primary channel — color
is the scan-speed layer on top, exactly as before.

---

## 4. Typography

Fallback stacks (self-contained — these are the stacks the HTML ships with if the named webfonts
fail to load, same mechanism as the old spec's §4):
- Display → `"Oswald", "Archivo Narrow", "Arial Narrow", sans-serif`
- Body → `"Public Sans", "Segoe UI", system-ui, sans-serif`
- Mono → `"IBM Plex Mono", "Consolas", "SFMono-Regular", monospace` (unchanged)

Base body size stays **15px** (unchanged from old spec — no reason to change the reading scale
just because the theme changed). Hierarchy is still built from **size + weight + letter-spacing +
rule/border**, so it survives with color removed — unchanged principle.

**Dark-background adjustment (new, not present in the old spec because it's dark-specific):** on
a dark ground, thin (400-weight) small type can look thin/fuzzy at sub-13px sizes where a light
ground would render the same weight crisply. Two mitigations, applied below: (1) `ink` is a warm
off-white rather than pure white, which reduces halation and keeps edges defined at small sizes;
(2) pill/label/eyebrow weights are held at 600–700 (unchanged from old spec, which already used
this range for scannable elements) rather than lightened, and body-small meta text stays at 400
but never below 13px — no size in the table drops under that floor.

| Role | Face | Size / line-height | Weight | Tracking | Case |
|---|---|---|---|---|---|
| Eyebrow ("STAKEHOLDER ROADMAP", "RISK") | Public Sans | 12 / 16 | 700 | +1.5px | UPPERCASE |
| H1 (page title) | Oswald | 34 / 38 | 600 | 0 | Normal case |
| Stat strip label ("Milestones") | Public Sans | 12 / 16 | 600 | +0.4px | UPPERCASE |
| Stat strip value ("4") | IBM Plex Mono | 18 / 20 | 600 | 0 | tabular-nums |
| H2 (zone titles: "Decisions Needed from PO") | Oswald | 22 / 26 | 600 | 0 | Normal case |
| H3 (milestone/risk card title) | Oswald | 19 / 24 | 500 | 0 | Normal case |
| Card eyebrow ("MVP1") | IBM Plex Mono | 12 / 16 | 500 | +0.8px | UPPERCASE |
| Body (prose, table cells) | Public Sans | 15 / 22 | 400 | 0 | Sentence case |
| Body small (meta, "3 more items") | Public Sans | 13 / 18 | 400 | 0 | Sentence case |
| Pill/status label | Public Sans | 11 / 12 | 600 | +0.5px | UPPERCASE |
| Reference-code pill (`KI-16`) | IBM Plex Mono | 12 / 12 | 500 | 0 | As written |
| Section citation (`§6`) | IBM Plex Mono | 12 / 16 | 400 (italic) | 0 | As written |
| Footer / version line | IBM Plex Mono | 12 / 18 | 400 | 0 | As written |

Notes vs. old spec's table: H3 drops from 600 to **500** weight — Oswald's 600 at 19px reads
heavier/blacker than Big Shoulders Text did at the same weight, so the step-down keeps card titles
from overpowering the pill/body content directly beneath them on the darker, higher-contrast
ground. Everything else in the scale is size/weight-identical to the old table; only the face
names and the H3 weight changed. Headings keep `text-wrap: balance`; body prose columns keep the
~65-character cap (unchanged).

---

## 5. Component specs

Section numbers below mirror the old spec's §5.x so step 2 can diff by number. Anything not
called out as changed uses the same structural values (padding, gaps, radii where still
applicable) as the corresponding old-spec subsection — only color/face tokens and the two
route-motif changes (§5.3, and the shared corner-shape rule referenced from §5.6/§5.7) are new.

### 5.1 Header
Structure unchanged from old spec §5.1 (padding, stacking, stat-strip layout, the `·` separator).
Colors: eyebrow uses `accent`, H1/body use `ink`, stat labels use `ink-muted`, stat values use
`ink` in mono tabular-nums. Background is `surface`.

### 5.2 Legend
Structure unchanged (right-aligned strip, 4 inline swatch groups, `20px` gap, no border/background
— still a key, not a card). Swatch dot and icon glyph recolor to each status's §3.3 hex directly
(no tint used in the legend — full-strength color reads better as a small key marker against dark).
Label text uses `ink-muted`.

### 5.3 Milestone card — "checkpoint" panel (Zone A)

This is the component where the route metaphor is sharpened, per the brief:

- **Shape:** background `surface-card`, `1px solid border-neutral`. **Top-right corner is cut at a
  45° diagonal, 14px inset** (a single clipped corner, not both) — reads as a roadside placard/
  signpost silhouette rather than a generic rounded rectangle. This shape is used **only** on
  Zone A milestone cards; Zone B rows and Zone C risk cards keep plain rectangular corners, so the
  cut corner itself functions as a "you are looking at a checkpoint on the route" signal, distinct
  from every other panel type on the page.
- No `border-radius` beyond a `2px` softening on the three uncut corners (kept minimal — this is
  still flat design, not a stylized card).
- Top accent: `4px solid` in the card's status color — same load-bearing role as the old spec's
  §5.3, now reading as a **lane stripe** across the top edge of the placard.
- Padding `20px`. Internal stack, gaps, and content order (eyebrow → H3 → status pill → divider →
  body summary → key line → expand trigger) are **unchanged from old spec §5.3.**
- **Route track & checkpoint marker (new detail):** the connecting track above the 4-card row is
  no longer a plain 2px solid line — it renders as a **4px-tall dark lane strip** (`background:
  #1A1D22`, slightly lighter than page `surface` so it reads as pavement, not void) with a
  **dashed center line in `accent-signal` (`#FFC22E`)** running its full length (short dash /
  short gap, evoking a painted road stripe — not a literal texture, still flat color). Each
  card's marker is a `16px` filled circle in the card's status color with a `2px solid surface`
  ring (unchanged mechanism from old spec, new colors), plus a short **`6px`-tall, `2px`-wide
  "post" stem** in the same status color running from the marker straight down to the card's top
  edge — reinforcing "this circle is a checkpoint post planted at this stop," not just a dot
  floating above a line.
- **Status pill:** unchanged shape/mechanism from old spec (icon + label, `4px 10px`, pill radius
  999px — the one intentionally-round element, still marking "this is state"). Colors from §3.3.
- **Body summary:** unchanged 2-line clamp behavior.
- **Always-visible key line:** unchanged content and behavior (MVP1–4 lines identical to old
  spec §5.3 — content doesn't change).
- **Expand trigger:** unchanged mechanics; chevron and label use `accent`.

### 5.4 Feature chips (MVP1 expanded state)
Unchanged structure. Recolor: `1px solid border-neutral`, `surface` background (reads as a subtle
notch darker than the card's `surface-card`, same relative relationship as the old spec's chip
sitting on a lighter page against a white card, inverted), text `ink`. Dotted-underline-as-hover-
affordance rule for detailed chips (e.g. `Service Reminders`) is unchanged.

### 5.5 Reference-code pill (Zones A, B, C — identical everywhere, unchanged mechanism)
- `IBM Plex Mono` 12px/500, `3px 8px` padding, `4px` border-radius (unchanged — pills stay
  rectangular-ish with a small radius; they are not the placard shape from §5.3).
- **Neutral variant:** background `#262B33`, border `1px solid #3A4048`, text `ink`.
- **Status-tied variant** (pill *is* a card's declared blocker code, e.g. `KI-16` in the MVP1 key
  line): background = that status's tint (§3.3), border `1px solid` status hex, text = status hex.
  Same shape/size as neutral — only fill changes.
- Section citations (`§6`, `§4.3`): unchanged — plain mono italic, `ink-muted`, no box.
- Pills remain hover-only, not click targets (unchanged — see §6).

### 5.6 Decisions band — "instrument panel" (Zone B)
- Full-bleed background `surface-band` (`#2B2116`), `2px solid accent` top border only (unchanged
  mechanism, new accent hex). No bottom rule (unchanged — the `64px` margin back to `surface` is
  the return signal).
- H2 + count badge: badge is a `20px` circle, `accent` fill, `on-accent` text (`#1B1208`) — **this
  differs from a naive port**, which would have kept the old spec's white-on-blue badge; on this
  accent hex, white text fails contrast (≈2.3:1), so the badge uses the dark `on-accent` token
  instead (≈6.5:1). This is the one place in the whole reskin where a straight "same as before,
  new hex" swap would have silently broken accessibility — flagged here explicitly so step 2
  doesn't reintroduce it.
- Table structure, columns, and row behavior: **unchanged from old spec §5.6** (same 4-column
  ratio, same letter-badge-as-outline-circle mechanism, now `accent`-colored transparent-fill
  circle). Row divider uses `border-band` (`#463B2C`), not the cooler `border-neutral`, so the
  divider reads correctly against the warm band. Row hover background → `accent-tint`; no other
  change; still no click/expand (unchanged reasoning).
- Status-pill mapping per row: **unchanged from old spec** — (a) amber, (b) orange, (c) amber,
  (d) orange — same designer inference, same flag for PO confirmation (carried into §9 below).

### 5.7 Risk callout card — "taillight" panel (Zone C)
- Two-column grid, `24px` gap (unchanged).
- Background `risk-red-tint`, left border `4px solid risk-red`, remaining three edges `1px solid
  rgba(255,92,92,0.45)` (opacity increased from the old spec's 30% — see §3.4 reasoning). **Sharp
  rectangular corners** — no cut corner, no radius beyond a `2px` softening to match the other
  panel types' minimal treatment — this is the deliberate shape contrast with §5.3's placard cards.
  Padding `24px`, no shadow.
- Header row: warning-triangle icon (`risk-red`, 20px), "RISK" eyebrow (`risk-red`), `accent`-
  outline letter badge cross-referencing the matching Decisions row — unchanged mechanism.
- H3 title, prose max ~65ch, neutral-variant code pills inline — unchanged.
- Always fully expanded, no collapse control — unchanged.

### 5.8 Footer
`1px solid border-neutral` top rule, `24px` padding, `IBM Plex Mono` 12px, `ink-muted`, on
`surface`. Content unchanged verbatim from old spec (version line, same truncation call, same
open flag — see §9).

---

## 6. Interaction spec

**Unchanged from old spec §6** — hover-for-tooltip on pills/chips (150ms delay, tap-toggle
fallback), click-to-expand milestone cards (independent per-card state, collapsed by default,
200ms height transition, `prefers-reduced-motion` fallback to instant). The only change is
**visual**, confined to two things:

- **Tooltip bubble:** inverted from the old spec's dark-bubble-on-light-page to a **light bubble on
  a dark page** — background `ink` (`#EDEAE3`), text `surface` (`#14171C`), same 8px padding,
  same triangle pointer, same 120ms fade. Contrast of this pairing ≈15:1. This keeps the tooltip
  reading as "a small bright sign popping up," consistent with the route/signage motif, and is the
  same inversion logic the old spec would need on any dark ground — not a new mechanism, just the
  correct polarity for this base.
- **Focus ring:** uses `accent-signal` (`#FFC22E`) rather than `accent`, `2px solid`, `2px` offset
  — unchanged mechanic (`:focus-visible`), different color so focus state is never confusable with
  a hovered/accent-colored element. (Old spec used its single accent for both; this reskin has two
  accents, so it can afford to split the roles — a genuine improvement enabled by the new palette,
  not a requirement of it.)

---

## 7. Responsive behavior

**Unchanged from old spec §7** — same breakpoints (1024px, 640px), same structural collapse
(timeline 4-across → 2×2 → 1-column; track dropped and replaced by inline marker at 2×2; Decisions
table rows → stacked mini-cards below 1024px; risk callouts 2-across → 1-column below 1024px).
Two dark-specific notes:

- At the 2×2 breakpoint, when the connecting route track is dropped (same rule as old spec — a
  track can't read correctly split across two rows), the inline marker that replaces it keeps its
  short "post" stem (§5.3) so the checkpoint motif survives in miniature rather than reverting to
  a plain dot.
- No other change — container padding, table-to-card collapse, and the `<640px` single-column
  fallback all carry over as specified in the old document.

---

## 8. Reference-code & version treatment — summary

**Unchanged rule from old spec §8:** any string matching `KI-#`, `OQ-#`, or a decision letter
`(a)`–`(d)` is monospace, in a pill or badge, never inline prose. Section citations are the one
exception (mono, unboxed). Version/changelog line stays in the footer, mono, muted, smallest
static type size on the page — same placement logic as before.

---

## 9. Flags for stakeholder review

Carried over from old spec §9 where still open, plus one new item specific to this reskin:

1. **Header stat strip** and **Decisions-table pill color mapping** ((a)/(c) amber, (b)/(d)
   orange): unresolved designer inferences, unchanged from old spec §9 items 1–2 — still pending
   PO confirmation, not affected by the theme change.
2. **Footer version line length**: unchanged from old spec §9 item 3 — same truncation call, same
   open question about a "view full changelog" affordance.
3. **Dark mode is no longer out of scope** — old spec §9 item 4 explicitly deferred dark mode as a
   future pass; this document *is* that pass. Once step 2 implements this spec, product-owner
   should confirm whether the **light** theme (old spec) or **dark** theme (this spec) is the
   default for the stakeholder-meeting context, or whether both ship with a toggle. This spec
   assumes single-theme delivery (a dark reskin of the same static page, not a light/dark toggle
   sharing one token set) per the task brief — if a runtime toggle between both themes is wanted
   instead of two static builds, that's a step 2/technical question, not a design one, but it
   changes how the tokens above should be wired (both palettes as swappable custom properties
   rather than one hard-coded set) — flagging so it isn't discovered mid-implementation.
