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

Cross-page navigation via `sessionStorage` (`ss_view_player_id`) and `components.js` wrappers. `window.__openUserProfileCore` is the unwrapped reference to `openUserProfile` that bypasses the MPA redirect logic — use this when calling from within the character page itself.

## JS Load Order & Responsibilities

Scripts load in this order (bottom of `index.html` body):

| File | Purpose |
|------|---------|
| `db.js` | Supabase abstraction — all DB ops go through `window.DB.*` |
| `assets/js/components.js` | MPA navigation wrappers, cross-page profile linking |
| `script.js` | Core app: `showSection()`, `updateUI()`, `updateChart()`, profile render |
| `faz1.js` | Legacy localStorage feed + `showToast()` — still active for toast |
| `takimim.js` | Team module (`_tmState`, squad, invites, realtime) |
| `faz2-7.js` | Match center UI + post-match rating modal (`openPostMatchRatingModal`) |
| `faz2-social.js` | Supabase feed, explore grid, friendships, `openUserProfile` |

**Key globals:**
- `window.sbClient` — Supabase client (from `supabase.js`)
- `window.__AUTH_USER__` — logged-in user object
- `window.DB.*` — all database operations
- `window._tmState` — team module state (userId, team, members, myRole)
- `window.showToast(msg)` — toast notification

`db.js` must always load first. `script.js` defines `showSection` and `updateUI` which most other files depend on.

## Database

**Supabase project:** `lgfhtzxmwrabrsqbccty.supabase.co`  
Full schema in `schema.sql`. Migration files: `master-migration.sql`, `sprint6-migration.sql`, `postmatch-rating-migration.sql`.

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

Four files load in order: `style.css` → `team-fix.css` → `faz2-7.css` → `fixes.css`.

- `style.css` — design system, layout, all CSS variables
- `faz2-7.css` — match center and post-match modal styles (`.pmr-*` classes)
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

**Post-match rating flow:** Match finishes → `loadMatchHistory()` shows "Puan Ver" badge → `openPostMatchRatingModal(matchId, teamSide)` (in `faz2-7.js`) → saves to `community_ratings` with `match_id` → calls `updateChart()`.

**Explore tab sections** use IDs `etab-players`, `etab-teams`, `etab-friends` in `explore/index.html`. The `switchExploreTab()` function in `faz2-social.js` must reference these exact IDs.

**No TypeScript, no build step, no test framework.** Syntax check: `node --check <file>.js`.
