# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

No build tools. Pure vanilla HTML/CSS/JS — serve from project root:

```bash
python -m http.server 3000
# then open http://localhost:3000
```

Do **not** open via `file://` — Supabase auth and Dicebear avatar API will fail. VS Code Live Server also works.

## Architecture

**SPA shell:** `index.html` contains all five sections. `showSection(id)` in `script.js` handles routing by toggling visibility.

**Five sections:**
- `#profile` — Karakterim (profile, stats, match history, ratings)
- `#takimim` — Takımım (team management, squad, tactics)
- `#matches` — Maç Merkezi (match center)
- `#feed` — Akış (social feed)
- `#explore` — Keşfet (discover players, teams, friends)

**MPA pages** (separate HTML files with their own nav):
- `auth.html` — Login/register
- `character/index.html` — Standalone profile view (used when navigating from Explore)
- `explore/index.html` — Standalone explore page
- `matches/index.html` — Standalone match center page
- `team/index.html` — Standalone "Takımım" (own team) page
- `team-profile/index.html` — Standalone view of another team's profile
- `feed/index.html` — Standalone social feed page

Cross-page navigation via `sessionStorage` (`ss_view_player_id`) and `components.js` wrappers. `window.__openUserProfileCore` is the unwrapped reference to `openUserProfile` that bypasses the MPA redirect logic — use this when calling from within the character page itself.

## JS Load Order & Responsibilities

Scripts load in this order (bottom of `index.html` body):

| File | Purpose |
|------|---------|
| `db.js` | Supabase abstraction — all DB ops go through `window.DB.*` |
| `assets/js/components.js` | MPA navigation wrappers, cross-page profile linking |
| `script.js` | Core app: `showSection()`, `updateUI()`, `updateChart()`, profile render |
| `notifications-and-toast.js` | Bell-icon notifications (localStorage), match-invite modal, `showToast()` |
| `takimim.js` | Team module core (`_tmState`, squad, invites, realtime) |
| `team-and-matches.js` | Extended team features (squad/invites, drag-drop pitch, tactics board, balanced-team algorithm, synergy matrix, rivals, payments tracking) + post-match rating modal (`openPostMatchRatingModal`) + Match Center UI |
| `social-features.js` | Explore (search players/teams), real Supabase feed, post creation, comments/likes, Supabase-realtime notifications, profile editing, `openUserProfile`, friends list, invite links, avatar upload |

Historical naming note: these three files were originally named `faz1.js`, `faz2-7.js`, and `faz2-social.js` after their development phase ("faz" = phase). Renamed 2026-07-04 for clarity; content/behavior unchanged.

**Key globals:**
- `window.sbClient` — Supabase client (from `supabase.js`)
- `window.__AUTH_USER__` — logged-in user object
- `window.DB.*` — all database operations
- `window._tmState` — team module state (userId, team, members, myRole)
- `window.showToast(msg)` — toast notification

`db.js` must always load first. `script.js` defines `showSection` and `updateUI` which most other files depend on.

## Database

**Supabase project:** `rpwbmvpapfouhpyvoeol.supabase.co` ("Sosyal Sporcu Published") — this is the ONLY project the app connects to (see `SUPABASE_URL` in `supabase.js`). A second project in the same org, "Sosyal Sporcu Old" (`lgfhtzxmwrabrsqbccty`), was paused on 2026-07-04 after causing repeated confusion (migrations were mistakenly applied there instead of the real project). **It is intentionally paused — never resume it or run anything against it. Always confirm the project ref is `rpwbmvpapfouhpyvoeol` before any DB operation.**  
Full schema in `schema.sql`. Migration files: `master-migration.sql`, `sprint6-migration.sql`, `postmatch-rating-migration.sql`, `voting-window-migration.sql`, and an ad-hoc `match_proposal_votes` + `matches.required_players` sync — all applied directly to `rpwbmvpapfouhpyvoeol` on 2026-07-04; not yet folded into `schema.sql`.

**Key tables:**
- `profiles` — users + self-ratings (6 skills: teknik, sut, pas, hiz, fizik, kondisyon) + `gen_score`
- `community_ratings` — peer ratings; has `match_id` (nullable) and `fair_play` columns from post-match migration; unique per `(rated_player_id, rater_id, match_id)` when match_id is set
- `profiles_with_ratings` (view) — joins profiles + community_ratings averages; used by `DB.Profiles.getAll()`
- `teams` + `team_members` — team records and membership
- `matches` + `match_players` — match records and per-player stats
- `posts`, `post_comments`, `post_likes` — social feed
- `notifications`, `match_invitations`, `friendships`, `venues`, `venue_ratings`

**DB trigger:** `on_profile_rating_change` auto-recalculates `gen_score = (teknik+sut+pas+hiz+fizik+kondisyon)/6` whenever any rating column on `profiles` changes.

**GEN color coding:** ≥85 → neon-green, ≥75 → neon-cyan, <75 → orange.

## CSS

Four files load in order: `style.css` → `team-fix.css` → `team-and-matches.css` → `fixes.css`.

- `style.css` — design system, layout, all CSS variables
- `team-and-matches.css` — styles for `team-and-matches.js`: squad, pitch, tactics board, balanced-team, post-match modal (`.pmr-*` classes), Match Center
- `fixes.css` — responsive overrides and z-index fixes (edits here when layout breaks)

**CSS variables (defined in `style.css`):**
```
--neon-green: #adff2f   (primary accent)
--neon-cyan: #00e5ff    (secondary accent)
--neon-pink: #ff007f    (tertiary)
--bg-dark: #121212
--glass-bg: rgba(255,255,255,0.05)
```

## Key Patterns

**Adding a new DB operation:** Add it to the appropriate object in `db.js` (e.g., `const Ratings = { ... }`). All objects are assigned to `window.DB` at the bottom of `db.js`.

**Rendering to a section:** Call `updateUI()` to re-render the profile section. For team, call `renderTeamOverview()`. For feed, call `window.initRealFeed()`.

**Post-match rating flow:** Match finishes → `loadMatchHistory()` shows "Puan Ver" badge → `openPostMatchRatingModal(matchId, teamSide)` (in `team-and-matches.js`) → saves to `community_ratings` with `match_id` → calls `updateChart()`.

**Explore tab sections** use IDs `etab-players`, `etab-teams`, `etab-friends` in `explore/index.html`. The `switchExploreTab()` function in `social-features.js` must reference these exact IDs.

**No TypeScript, no build step, no test framework.** Syntax check: `node --check <file>.js`.
