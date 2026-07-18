# Global Requirements — Auth, Onboarding, Units & Language

> **Status**: Draft for reconciliation · **Owner**: product-owner · **Author of record**: business-analyst
> **Scope**: App-wide behavior that every feature depends on — authentication, first-launch
> onboarding, and localization. Feature-specific rules live in the per-feature docs
> (e.g., [HEALTH_REQ.md](HEALTH_REQ.md)).
> **Related**: [FRAMEWORK_RULES.md](FRAMEWORK_RULES.md) (Rule 4.3 Auth, Rule 3.x Expo).

---

## 1. Authentication

Sign-in is via **Google (Gmail)**, offered two ways:

- **Register a new account with Gmail** — the account is stored in our database (Supabase Auth) for
  future logins.
- **Sign in with Gmail directly** — Google OAuth, no separate password.
- **"Remember me"** — keep the session so the user is auto-logged-in on next launch. Session
  persistence uses secure device storage (FRAMEWORK_RULES Rule 4.3 — `expo-secure-store`).

**Acceptance criteria**

- Given a first-time user, when they register with Gmail, then a user record exists and they land in
  first-launch onboarding (§2).
- Given a returning user with "Remember me" on, when they reopen the app, then they are taken
  straight to the Health tab without re-authenticating.
- Given a returning user with "Remember me" off, when they reopen the app, then they must sign in
  again.

> **Open question (OQ-G1)**: Are email/password or other providers (Apple, phone) needed for MVP, or
> Gmail-only? Assumption: **Gmail-only** for MVP. Apple Sign-In may be required by App Store review
> if any third-party sign-in is offered — flag for product-owner.

---

## 2. First-launch onboarding

The first time a user signs in, walk them through:

1. **Choose language** (§3).
2. **Enter bike information**:
   - Bike **name** and **brand**.
   - **Current mileage** with unit (km / miles).
   - **Recently changed parts** — a checklist of the parts tracked in Service Reminders
     ([HEALTH_REQ.md](HEALTH_REQ.md) §6). For each part the user checks and confirms, that part's
     reminder in the Health tab is **reset to 0** (last service = the entered current mileage).

**Acceptance criteria**

- Given onboarding, when the user enters 12,000 km and checks "Engine oil" as recently changed, then
  the Engine oil reminder starts at 0% while other parts start from their default baseline
  (HEALTH_REQ OQ-H2).
- Given onboarding, when the user picks Miles as the unit, then all distances across the app display
  in miles (HEALTH_REQ §8) while stored canonically in km.

> **Open question (OQ-G2)**: Multi-vehicle at onboarding — one bike only for MVP, or add more later?
> Schema supports many per FRAMEWORK_RULES Rule 8.4; UI assumption: **one bike** at onboarding, with
> "add bike" deferred. Confirm with product-owner.

---

## 3. Language / localization

- MVP ships **English** and **Vietnamese**.
- Language is chosen at first launch (§2) and changeable later in settings.
- All user-facing strings are localized; no hardcoded display text in components.

> **Open question (OQ-G3)**: Default language — device locale, or always prompt at first launch?
> Assumption: **prompt at first launch**, defaulting the highlighted choice to device locale.

---

## 4. Open questions (consolidated — for product-owner)

| ID | Question | Current assumption |
|---|---|---|
| OQ-G1 | Auth providers for MVP (Gmail-only vs. also Apple/email) | Gmail-only (watch App Store Apple-Sign-In rule) |
| OQ-G2 | Multiple vehicles per user at onboarding | One bike for MVP; schema still multi-vehicle |
| OQ-G3 | Default language selection behavior | Prompt at first launch, highlight device locale |
