HOME page.

1. When user login into the application => Home page is displayed.
2. The UI of Home page is here: /workspaces/Project/design/images/Home.png
3. There are several information need to be focused in this page:
   1. /workspaces/Project/design/images/Home-1st-sesson.png:
      1. User can tap on this session to view a pop up, displays the details of this sesson.
      2. "Night Garage" is changed to Application's name.
      3. "Z8" is changed to Bike's name.
      4. "Z800 hero shot" word is removed. In this session, user can now upload the image from the phone.
4. /workspaces/Project/design/images/Home-2nd-sesson.png & /workspaces/Project/design/images/Home-3rd-sesson.png need to be merged into 1 sesson only in Home page. User is able to tap on this page to navigate to Health page.
   1.  /workspaces/Project/design/images/Home-2nd-sesson.png:
       1.  Total distance is the same with the total distance of the bike (user can view/edit on Health page).
       2.  This month is the total distance travelled in this month. This number can be tracked together with the Total Distance increasement via GPS.
   2.  /workspaces/Project/design/images/Home-3rd-sesson.png:
       1.  Displays the Average of the Bike's health.
       2.  The Status is the same with Part status on Health tab:
           1.  Green
           2.  Orang
           3.  Red
           4.  Deeper red
       3.  The content of each status I let you decide.

---

## Implementation status (updated per DEMO_FEEDBACK_004 / DEMO_FEEDBACK_005)

- **§1–§3 (landing, hero card, photo upload)**: Implemented. Post-login/onboarding routes to
  Home. Eyebrow → app name, badge/name → bike name, hero card tappable → details popup, photo
  upload via `expo-image-picker` + Supabase Storage (max 10 MB, enforced client-side). Bug fixed:
  the picked photo wasn't rendering after upload — the local-file read was switched from
  `fetch().blob()` to `expo-file-system`'s `File` class (see `DECISIONS.md` `D-DEMO5`).
- **§4 (merged distance/health card)**: Implemented, tappable → Health tab. The score renders as a
  true SVG progress ring (`react-native-svg`) — only the arc is status-colored, the center stays
  neutral. Formula/status-message wording: `D-HOME-HEALTH-SCORE`.
- **Profile, visible on every tab** (DEMO_FEEDBACK_005 #5): implemented as a header button shared
  across the whole Tabs navigator, opening a popup with the signed-in email + sign-out. Full
  profile *editing* needs a real user-data model; the Turso migration that would have bundled this
  is declined — see `D-DEMO5-TURSO` — so it would now be built against Supabase instead.
- **Overdue-parts warning** (DEMO_FEEDBACK_005 #7, Home-4th-session.png): implemented — every
  overdue part is listed (not just the worst one), worst-first, internally scrollable past 3 rows.
  Hidden entirely when nothing is overdue.
- **Touring / Lucky Draw nav cards** (DEMO_FEEDBACK_005 #8, Home-5th-session.png): implemented —
  both navigate to their respective tabs (currently "Feature coming soon" placeholders).
- **Not built** (shown in `Home.png` but not asked for in the numbered requirements above): none
  remaining — the overdue alert and nav cards from the full mockup are now both implemented per
  DEMO_FEEDBACK_005. See `KNOWN_ISSUES.md` for residual polish items (health-score formula/wording
  as a judgment call, VND rate placeholder, etc.).