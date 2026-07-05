# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Çalışma Kuralları (ÖNCELİKLİ — her sohbette geçerli)

Bu kurallar diğer tüm varsayılan davranışların üzerindedir. Kullanıcı her sohbette tekrar etmek zorunda kalmasın diye buraya sabitlenmiştir.

1. **Her zaman Türkçe yaz.** Kullanıcıya verilen tüm cevaplar, açıklamalar, adım adım anlatımlar, plan ve özetler Türkçe olmalı. İngilizceye kayma — kod, komut, değişken/fonksiyon adları ve teknik terimler doğal olarak İngilizce kalabilir, ama anlatım dili Türkçedir.
2. **İşe başlamadan önce bu `CLAUDE.md` dosyasını oku.** Zaten her sohbet başında context'e yükleniyor; yine de göreve başlamadan önce ilgili bölümleri gözden geçir.
3. **İş bittikten sonra `CLAUDE.md`'yi güncelle.** Kod davranışını, mimariyi, DB şemasını/trigger'larını, bilinen sorunları veya iş akışını etkileyen bir değişiklik yaptıysan, ilgili bölümü (Türkçe olarak) bu dosyada güncelle. Kullanıcı ayrıca istemek zorunda kalmamalı — bu standart iş akışının bir parçası.

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
| `dashboard.js` | Ana Sayfa (`#dashboard`) modülü: AI Spor Gazetesi ticker, Sosyal Duvar feed, kullanıcı mini kartı + form şeridi, Bölge Sıralaması, feed realtime. IIFE; `window.initDashboard()` dışarı açık tek giriş noktası. `index.html`'de en son yüklenir. |

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
Full schema in `schema.sql`. Migration files: `master-migration.sql`, `sprint6-migration.sql`, `postmatch-rating-migration.sql`, `voting-window-migration.sql`, `profile-column-protection-migration.sql`, `match-stats-sync-migration.sql` (2026-07-05 — `profiles.total_matches/goals/assists`'i `match_players`'tan otomatik senkronlayan trigger + backfill, bkz. aşağıdaki "İkinci tur" notu), and an ad-hoc `match_proposal_votes` + `matches.required_players` sync — all applied directly to `rpwbmvpapfouhpyvoeol` on 2026-07-04/05; not yet folded into `schema.sql`.

**Key tables:**
- `profiles` — users + self-ratings (6 skills: teknik, sut, pas, hiz, fizik, kondisyon) + `gen_score`
- `community_ratings` — peer ratings; has `match_id` (nullable) and `fair_play` columns from post-match migration; unique per `(rated_player_id, rater_id, match_id)` when match_id is set
- `profiles_with_ratings` (view) — joins profiles + community_ratings averages; used by `DB.Profiles.getAll()`
- `teams` + `team_members` — team records and membership
- `matches` + `match_players` — match records and per-player stats
- `posts`, `post_comments`, `post_likes` — social feed
- `notifications`, `match_invitations`, `friendships`, `venues`, `venue_ratings`

**DB trigger:** `on_profile_rating_change` auto-recalculates `gen_score = (teknik+sut+pas+hiz+fizik+kondisyon)/6` whenever any rating column on `profiles` changes.

**DB trigger:** `trg_protect_profile_privileged_columns` (`protect_profile_privileged_columns()`, added 2026-07-04, see `profile-column-protection-migration.sql`) — `profiles` UPDATE RLS policy is `USING (auth.uid() = id)` **with no column restriction**, so without this trigger any authenticated user could write *any* column on their own row directly via `supabase.from('profiles').update(...)`, including `is_admin`, `gen_score`, and all 17 `honor_*` columns, completely bypassing the intended `match_honors` → trigger flow. The trigger resets these columns to their `OLD` value whenever `pg_trigger_depth() <= 1 AND auth.uid() IS NOT NULL` (i.e. a top-level request from an authenticated end-user session) — this still lets `increment_honor_count()`'s own nested `UPDATE profiles` through (`pg_trigger_depth() > 1`) and lets SQL-editor/service-role/migration writes through (`auth.uid() IS NULL`). **When adding any new privileged/derived column to `profiles` (another `honor_*`, a role/permission flag, a denormalized counter, etc.), add it to this trigger function too** — a bare RLS `USING` clause without `WITH CHECK` or a column-protecting trigger does not stop a user from writing arbitrary values to their own row.

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

**Sub-tab / section markup must default to hidden.** `index.html` and `team/index.html` define each tab panel (`.team-subtab`, e.g. `#ttab-genel`, `#ttab-kadro`, ...) with an explicit inline `style="display:none"`, except the "active-by-default" first tab. If a first tab is left as `display:block` in the static HTML, it renders with its skeleton/placeholder content *before* the JS init (`initTakimim()` etc.) has resolved its async calls and decided what to actually show — causing a visible flash of "fake" content (e.g. a team overview flashing before the "no team yet" onboarding screen replaces it, fixed 2026-07-04 by setting `#ttab-genel`'s default to `display:none` in both files). Any new default-visible tab/section must be paired with an early, synchronous-safe loading state, not just left visible while data loads.

## Admin Rolü (Tanrı Modu)

**Şu an tamamen devre dışı.** `script.js` başında `window.ADMIN_FEATURE_ENABLED = false;` — bu bayrak `false` olduğu sürece `profiles.is_admin` ne olursa olsun hiçbir hesap admin rolü alamaz, God Mode FAB (`#god-mode-fab`, şimşek ikonu) hiçbir kullanıcıda görünmez. Tüm admin yetki kontrolleri `window.isAdminUser()` üzerinden geçer (script.js, team-and-matches.js, social-features.js) — doğrudan `acc.role === 'admin'` karşılaştırması yapılmamalı, hepsi bu bayrağı kontrol eden `isAdminUser()`'a yönlendirildi (2026-07-04).

Tekrar açmak istendiğinde: `window.ADMIN_FEATURE_ENABLED = true` yap, sonra hangi hesapların gerçekten admin olacağını `profiles.is_admin` kolonundan yönet (Supabase'de `UPDATE profiles SET is_admin = true WHERE id = '...'`).

**Neden devre dışı bırakıldı:** `initSupabaseUser()` (script.js) eskiden gerçek kullanıcıları, localStorage'daki 11 kişilik sabit demo oyuncu listesiyle (Mikimon, Barış, Kerem, Tarık, Emre, Oğuz, Can, Serhat, Mert, Ali, Hasan) **kullanıcı adı metnini karşılaştırarak** eşleştiriyordu. "Mikimon" demo hesabının rolü koddaki `MOCK_ACCOUNTS` içinde sabit `'admin'` olduğundan, kullanıcı adı "Mikimon" olan gerçek bir kullanıcı — `profiles.is_admin = false` olsa bile — otomatik olarak admin/God Mode yetkisi kazanıyordu. Bu DB sorgusuyla doğrulandı (bkz. 2026-07-04 sohbeti). Eşleştirme artık isimle değil `supabase_id` ile yapılıyor (aşağıya bakın), ama admin özelliği ayrıca bir güvenlik önlemi olarak bayrakla tamamen kapatıldı.

**Önemli — bu client-side düzeltme DB tarafındaki asıl deliği kapatmaz.** `ADMIN_FEATURE_ENABLED = false` ve `isAdminUser()` sadece bu JS uygulamasının kendi arayüzünde admin/God Mode UI'ını ve yetki kontrollerini gizler. Gerçek kullanıcı "Mikimon" hesabının kaydında hem `is_admin` hem de sıfır maça rağmen dolu `honor_fuzeci`/`honor_saha_komiseri` gibi değerler bulundu — bunlar tarayıcı konsolundan `supabase.from('profiles').update({...})` çağrısıyla, **RLS politikasındaki sütun kısıtı eksikliği** yüzünden doğrudan yazılabiliyordu (bkz. `trg_protect_profile_privileged_columns`, yukarıdaki Database bölümü). Bu ikisi birbirinden bağımsız iki katman: client bayrağı UI/UX'i korur, DB trigger'ı ise veriyi (herhangi bir client koduna bakmaksızın) korur. Yeni bir "sadece adminin/sistemin yazması gereken" alan eklerken ikisini de güncelle.

## Supabase ↔ Mock Veri Köprüsü (initSupabaseUser)

`script.js` içindeki `initSupabaseUser()`, eski localStorage tabanlı mock oyuncu/hesap sistemini gerçek Supabase kullanıcılarıyla köprüler. 2026-07-04'te düzeltildi:

- **Eşleştirme artık `players.find(p => p.supabase_id === userId)` ile yapılıyor**, `p.name.toLowerCase() === profile.username` ile değil. İsimle eşleştirme, kullanıcı adı sabit demo oyuncu isimlerinden biriyle çakıştığında o demo kaydın (kurgusal `ekol`/`sakatlik`/`mizaç` gibi metinler dahil) gerçek kullanıcıya sızmasına yol açıyordu.
- Gerçek kullanıcı için `details` nesnesi her yüklemede `playerDetailsFromProfile` yardımcı objesiyle **tamamen** yeniden kuruluyor (kısmi/koşullu `if (profile.x) ...` ataması değil) — böylece hiçbir alanda eski/mock veri kalıntısı kalmıyor, boş alanlar hep aynı nötr varsayılana düşüyor.
- `MOCK_PLAYERS`/`MOCK_ACCOUNTS` (script.js, ~satır 280) hâlâ kodda duruyor — Supabase oturumu olmayan çevrimdışı/geliştirme modu için varsayılan veri olarak kullanılıyorlar. Gerçek Supabase kullanıcıları artık bu listelerle hiçbir şekilde eşleştirilmiyor veya bağlanmıyor.

## Profil Görüntüleme İzinleri (openUserProfile)

`window.openUserProfile` / `__openUserProfileCore` (social-features.js) eskiden `window.viewingAsFriend` bayrağını **her zaman `true`** olarak sabitliyordu — bu yüzden Keşfet'ten arkadaş olmayan biri açıldığında bile tam profil (arkadaş) yetkileriyle gösteriliyordu (bkz. `script.js`'deki `PROFILE_TAB_PERMISSIONS.nonFriend` — sadece `tab-genel`, `tab-maclar`, `tab-arkadaslarim` görünmeli). 2026-07-04'te düzeltildi: artık `DB.Friends.checkStatus(user.id, supabaseId)` ile gerçek arkadaşlık durumu (`status === 'accepted'`) kontrol edilip `viewingAsFriend` ona göre set ediliyor.

## Başkasının Profilini Görüntüleme — Karışan State Sorunları (2026-07-05)

Karakter sayfasında (`character/index.html`) başkasının profiline bakarken birkaç veri karışması bulundu ve düzeltildi — hepsinin ortak kökü aynıydı: `components.js`, karakter sayfasına geçerken `sessionStorage['ss_view_player_id']`'i **hemen siliyor** ve değeri `window.__PENDING_VIEW_PLAYER_ID__`'e taşıyor (bkz. `assets/js/components.js` satır ~226-234). Kodun bazı yerleri sadece `sessionStorage`'a bakıp bu fallback'i unutmuştu:

- **Maç Geçmişi karışması:** `switchProfileTab('tab-maclar')`, `loadMatchHistory()`'yi PARAMETRESİZ çağırıyordu; fonksiyon içindeki fallback sadece `sessionStorage`'a bakıyordu → sessionStorage zaten silindiği için **kendi** maçlarınız gösteriliyordu. Artık ortak `getViewedPlayerId()` yardımcı fonksiyonu (script.js) kullanılıyor — bu, ikisini de (`sessionStorage` + `window.__PENDING_VIEW_PLAYER_ID__`) kontrol ediyor. Aynı eksiklik realtime "profiles" UPDATE dinleyicisinde ve bazı rozet/kariyer hesaplama noktalarında da vardı, hepsi `getViewedPlayerId()`'e geçirildi.
- **Yanlış avatar (FUT kartı):** Sayfa ilk yüklenirken `updateUI()` iki kez tetikleniyor — ilki `__SUPABASE_PROFILE__` henüz SİZİN profiliniz iken (bakılan profil DB'den gelmeden önce). Header'daki küçük avatar bu durumu algılayıp dokunmuyordu ama `populateFutCard()`'daki büyük FUT kartı avatarı bu korumaya sahip değildi — bu yüzden kısa süreliğine (bazen network gecikirse daha uzun) KENDİ fotoğrafınızı gösteriyordu. `populateFutCard()`'a artık aynı "henüz yüklenmedi, dokunma" koruması eklendi.
- **Hakkımda sekmesi başkasının profilinde görünmesi:** `applyFriendshipTabRestriction()`/`isViewingOtherProfile()` mantığı doğru olsa da (Hakkımda/Kariyer zaten `PROFILE_TAB_PERMISSIONS.friend`/`nonFriend` listelerinde yok), ek bir güvenlik katmanı olarak `switchProfileTab()` artık `tab-hakkimda`/`tab-kariyer`'e geçişi, `isViewingOtherProfile()` true iken tamamen engelliyor (buton her nasılsa görünür kalsa bile).
- **GEN puanı senkron değil (FUT kartı / Keşfet boş görünüyor):** DB'de doğrulandı — `profiles.gen_score` SADECE `profiles.rating_*` (kendi self-rating) kolonları değişince `recalculate_gen_score()` trigger'ıyla hesaplanıyor; `community_ratings` INSERT'i bu trigger'ı hiç tetiklemiyor. Halbuki profil header'ındaki "GEN" rozeti topluluk ortalamasını JS'te canlı hesaplıyor (fallback var), FUT kartı ve Keşfet listesi ise ham `gen_score` kolonunu okuyordu (fallback yok) → self-rating yapmamış ama topluluk puanı almış kullanıcılarda boş görünüyordu. Çözüm: yeni bir DB trigger'ı YERİNE, zaten var olan `profiles_with_ratings` view'ı kullanıldı (`community_gen` = topluluk ortalaması varsa o, yoksa `gen_score`). `db.js`'teki `Profiles.get()` ve `Profiles.getAll()` artık `profiles` yerine `profiles_with_ratings`'ten okuyor; `populateFutCard()` ve `initSupabaseUser()` artık `community_gen`'i de taşıyıp kendi self-rating ortalaması yoksa ona düşüyor.
- **`sw.js` CACHE sürümü** `ss-v4` → `ss-v5` yapıldı — statik JS dosyaları stale-while-revalidate ile cache'leniyor (bkz. CSS bölümü altı), sürüm bump'lanmazsa deploy sonrası ilk yüklemede eski JS görünmeye devam edebiliyor. **Kural: `script.js`/`social-features.js`/`db.js`/`team-and-matches.js` gibi APP_SHELL'de listeli dosyalarda davranış değişikliği yapılan her deploy'da CACHE sürümünü bir artırın.**

### İkinci tur — Keşfet'ten profil görüntülemede mock/uydurma veri ve kirli gezinme (2026-07-05)

`nitemasyemur` profili Keşfet'ten görüntülenince çıkan bir grup hata (DB'den `962c4711…` = nitemasyemur, `793004f5…` = MikimonTheGray verisiyle doğrulandı). Ortak kök: **`openUserProfile()` / `__openUserProfileCore()` (social-features.js) aslında SPA (index.html) için tasarlanmış ama karakter (MPA) sayfasında da çalıştırılıyor** (components.js 900ms sonra çağırıyor) ve zararlı yan etkiler üretiyordu:

- **MOCK varsayılan enjeksiyonu (mevki "OS", yaş 24, boy 180, kilo 75, oyun tarzı "Box-to-Box", şehir "istanbul" vb.):** `openUserProfile`'daki `tempPlayer` her boş alana `|| <uydurma değer>` atıyordu — bakılan kişi hiç doldurmamış olsa bile Hakkımda/FUT kartı doluymuş gibi görünüyordu. **Düzeltme:** tüm mock varsayılanlar `null`'a çevrildi; boş alanlar arayüzde `—` gösteriliyor.
- **`position` kolonu ≠ gerçek mevki:** `profiles.position` herkeste kayıt-varsayılanı `"OS"`; kullanıcının seçtiği gerçek mevki `ana_mevki`'de (örn. MikimonTheGray `ana_mevki="Defans"`, `position="OS"`). Bu yüzden **mevkide ASLA `position`'a fallback yapma** — sadece `ana_mevki`. Düzeltilen yerler: `populateFutCard()` (script.js), arkadaş kartı render'ı ve `getMyFriends()` sorgusu (artık `ana_mevki` de çekiliyor). Yeni bir mevki gösterimi eklerken aynı kurala uy.
- **Denormalize maç sayaçları güncellenmiyordu (bug #11):** `profiles.total_matches/goals/assists` kolonları `match_players`'a maç işlendiğinde güncellenmiyordu → arkadaş/keşfet kartları bayat `0` gösteriyordu. **Düzeltme = DB tarafı** (`match-stats-sync-migration.sql`, 2026-07-05 `rpwbmvpapfouhpyvoeol`'e uygulandı): `sync_profile_match_stats(uuid)` fonksiyonu + `match_players` ve `matches` üzerinde trigger + tek seferlik backfill. Kolonlar artık **finished** maçlardan otomatik hesaplanıyor. **Uyarı:** Karakter sayfasındaki manuel "Kişisel İstatistikler" formu hâlâ bu kolonlara yazabiliyor, ama bir oyuncunun herhangi bir in-app finished maçı olduğu anda trigger kolonu gerçek veriyle ezer (in-app maçı olmayanlarda manuel değer korunur). Yeni bir maç-türevi sayaç eklenirse bu fonksiyona da ekle.
- **Arkadaş kartından "Profil & Puan Ver" → kirli/geri-dönülemez ekran (bug #12):** Karakter sayfasında friend-card SPA `openUserProfile`'ı yerinde çalıştırınca state bozuluyordu. Yeni `viewPlayerProfileSmart(id, username)` (social-features.js): MPA karakter sayfasındaysa `sessionStorage`'a ID yazıp `location.reload()` ile TEMİZ akışı baştan kuruyor; SPA'daysa normal `openUserProfile`. Friend-card butonları artık bunu çağırıyor. Buton etiketi "Profil & Puan Ver" → "Profili Gör"/"Profil" yapıldı.
- **Yanıltıcı toast (bug #13):** `openUserProfile` sonunda "…profili açıldı — puan verebilirsin!" ve başta "Profil yükleniyor…" toast'ları kaldırıldı (puanlama sadece maç-sonrası akışta anlamlı).
- **Radar grafiği "Henüz puan girilmedi" overlay'i (bug #4):** `updateChart()` içindeki `.chart-empty-overlay` tamamen kaldırıldı; puan yokken sadece boş hexagon görünüyor.
- **İsim tutarsızlığı (bug #5):** `tempPlayer`'da `full_name` set edilmediği için başlık username'e (`nitemasyemur`), FUT kartı `full_name`'e (`Burgu makarna`) düşüyordu. Artık `tempPlayer.full_name` set ediliyor → her yerde `full_name` (kayıtlı ad) + altında `@username`, kendi profildeki konvansiyonla aynı.
- **Avatar (bug #1):** nitemasyemur'un `avatar_url`'ü DB'de NULL; ekranda görülen "oyun kolu / Pixydse NPC" avatarı ne bakan ne bakılan kişinin güncel avatarıydı — **eski cache'lenmiş JS/state**. Güncel kodda null avatar dicebear'a düşer. `sw.js` `ss-v5`'e bump edildi; test için sert yenileme (Ctrl+Shift+R) veya SW güncellemesi gerekir.

### Üçüncü tur — Başka profildeyken kişisel kontrollerin kilitlenmesi (2026-07-05)

Başkasının profilini görüntülerken sekme izinleri (`PROFILE_TAB_PERMISSIONS` + `applyFriendshipTabRestriction` + `switchProfileTab` guard'ı) doğru çalışıyordu (Hakkımda/Kariyer görünür ama tıklanamaz), **ancak `tab-genel`'de ve header'da kalan bazı etkileşimli kontroller hâlâ profil sahibine aitmiş gibi davranıyordu.** Genel kural: **başkasının profilindeyken profil sahibine özgü hiçbir kişisel kontrol görünmemeli/çalışmamalı.** Merkezi engel `applyProfileViewMode()` (script.js) içinde; her kontrol ayrıca kendi fonksiyonunun başında savunma amaçlı ikinci bir `isViewingOtherProfile()` kontrolü taşır (belt-and-suspenders — buton gizlense bile handler tetiklenmesin).

- **FUT kartı ayar dişlisi (`.fut-settings-btn` → `toggleFutSettings`):** "Görünecek Alanlar (max 6)" paneli, `localStorage[FUT_LS_KEY]`'deki **kişisel** görünüm tercihini yazar — başkasının kartında hem anlamsız hem yanıltıcıydı (kullanıcı bunu bildirdi). `applyProfileViewMode()` artık `viewingOther` iken dişliyi ve açık paneli gizliyor; `toggleFutSettings()` başında da erken `return` var.
- **Header avatar kamera ikonu (`.camera-overlay`):** CSS'te `opacity:0` (sadece hover'da görünür) ama `display:flex` olduğu için avatarın üstünü **tıklanabilir** biçimde kaplıyordu → başkasının sayfasından kendi fotoğrafını yükleme akışı açılabiliyordu (upload yine `__AUTH_USER__.id`'ye yazdığı için veri bozulmuyordu, ama yanlış UX). `applyProfileViewMode()` artık `viewingOther` iken overlay'i `display:none` yapıyor (inline stil, `!important` olmayan stylesheet kuralını ezer); `handleAvatarUpload()` (social-features.js) başında da guard + uyarı toast'ı var.
- **Maç geçmişi "Onur Ver" butonu (`loadMatchHistory`):** Aksiyon rozeti `ratingStatuses`'i giriş yapan kullanıcının (`user.id`) puanlama durumundan hesapladığından, başkasının maç geçmişinde de "Onur Ver" çıkıp `mp.team_side` (bakılan oyuncunun tarafı) ile yanlış modal açabiliyordu. Rozet artık `m.status === 'finished' && isOwnProfile` koşuluna bağlı — sadece kendi maç geçmişinde görünür.

**Not:** Bu üç kontrol "profili düzenleme" değil profil sahibine özgü kişisel kontroller olduğu için engelde **admin istisnası yok** (`canEdit` yerine düz `viewingOther` kullanılıyor). Karakter (MPA) sayfasında `isViewingOtherProfile()`, components.js'in sildiği `sessionStorage` yerine `window.__PENDING_VIEW_PLAYER_ID__`'i de kontrol ettiğinden ilk `updateUI()` anından itibaren doğru çalışır (dişli/kamera hiç "flash" etmez). **Kural: `tab-genel`'e veya header'a yeni bir etkileşimli, profil-sahibine-özel kontrol eklerken onu da `applyProfileViewMode()`'daki bu bloğa ekle ve handler'ına `isViewingOtherProfile()` guard'ı koy.** `sw.js` cache sürümü bump edildi.

### Dördüncü tur — Başkasının FUT kartında KENDİ avatarının görünmesi (2026-07-05)

Kullanıcı: "Keşfet'ten bir kullanıcının profilini gör dedikten sonra o kişide kendi profil fotoğrafım gözüküyor." DB'den doğrulandı: bakılan kişi (`harputoglu` / Mustafa Akbulut, `e5b037f1…`) **kendi** avatarına sahip (header'da doğru görünüyor) ve giriş yapan kullanıcının (`MikimonTheGray`, `793004f5…`) da bir yüz fotoğrafı var. Şikâyette **header avatarı doğru (harputoglu), ama FUT kartı avatarı giriş yapanın fotoğrafı**, buna karşın FUT kartındaki **isim doğru** ("MUSTAFA AKBULUT / @harputoglu"). Bu "isim doğru + avatar yanlış" ayrışması, `getViewedPlayerId()` merkezli guard'lardaki iki boşluğa işaret ediyordu.

Ortak kök: **`getViewedPlayerId()` SPA (index.html) içi görüntüleme akışını görmüyordu.** SPA'da Keşfet'ten profile tıklayınca `openUserProfile` (social-features.js) `sessionStorage['ss_view_player_id']` veya `window.__PENDING_VIEW_PLAYER_ID__` set ETMEZ — sadece `window.activePlayerId`'yi geçici `'sb_view_<uuid>'` ID'sine çevirir. `getViewedPlayerId()` yalnız o iki kaynağa baktığı için SPA'da **null** dönüyordu → "başkasını görüntülüyoruz" mantığına dayanan tüm korumalar yanılıyordu. En zararlısı: `honor-profile-<userId>` realtime dinleyicisi (script.js ~satır 710) `_isViewingOther` false görüp giriş yapanın kendi `profiles` satırındaki herhangi bir UPDATE'te `__SUPABASE_PROFILE__`'ı **kendi** verisiyle ezip `updateUI()` çağırabiliyordu.

Yapılan düzeltmeler (hepsi savunma amaçlı, belt-and-suspenders):

- **`getViewedPlayerId()` (script.js) artık SPA `sb_view_` durumunu da yakalıyor:** `sessionStorage` + `__PENDING` boşsa `window.activePlayerId`'ye bakıp `'sb_view_'` ile başlıyorsa UUID'yi ondan çıkarıyor. Böylece bu helper'a dayanan TÜM guard'lar (FUT kartı, header avatarı, honor-realtime overwrite koruması, maç geçmişi, rozetler) SPA'da da doğru "başkasını görüntülüyoruz" kararı veriyor.
- **`populateFutCard()` (script.js) — yarış (race) durumunda FUT avatarını TEMİZLİYOR:** Guard "bakılan profil henüz yüklenmedi" deyip `return` ederken önce `#fut-avatar`'ın `src`'sini boşaltıyor (`opacity 0.25`). Eskiden sadece `return` ettiği için bir önceki render'dan (kendi profilin) kalan fotoğraf ekranda kalabiliyordu. Ayrıca else-fallback artık açıkça `window.activePlayerId || activePlayerId` kullanıyor (SPA'da `window.activePlayerId` = `sb_view_…`).
- **`updateUI()` header avatar guard'ı (script.js) artık inline `sessionStorage||__PENDING` yerine ortak `getViewedPlayerId()` kullanıyor** — böylece SPA `sb_view_` düzeltmesinden o da yararlanıyor ve `__SUPABASE_PROFILE__` yanlışlıkla ezilse bile bakılan profil ID'siyle uyuşmadığında avatara dokunmuyor.
- **`character/index.html` doğrudan avatar boyama bloğu (satır ~737) artık `sbp.id === viewedId` doğruluyor:** `DB.Profiles.get(viewedId)` başarısız/yavaşsa `__SUPABASE_PROFILE__` hâlâ GİRİŞ YAPANın profilidir; eski kod bu durumda header + FUT avatarına kendi fotoğrafımızı yazıyordu. Artık yalnız yüklenen profil gerçekten bakılan kişiyse boyuyor.

**GERÇEK KÖK NEDEN — `initAvatarUpload()` (social-features.js) header avatarını eziyordu:** Yukarıdaki 4 düzeltme FUT kartını (`#fut-avatar`) düzeltti ama kullanıcı ikinci turda net söyledi: **FUT kartı artık doğru (bakılan kişinin fotoğrafı), ama HEADER'daki büyük avatar (`#profile-avatar`) hâlâ GİRİŞ YAPANın fotoğrafı** — isim ve FUT kartı doğruyken. Bu "header yanlış / FUT + isim doğru" ayrışması tek bir yerden geliyordu: `initAvatarUpload()`, `DOMContentLoaded`'dan **~1200ms sonra** (setTimeout) çalışıp `DB.Profiles.get(window.__AUTH_USER__.id)` ile **giriş yapanın** profilini çekiyor ve **hiçbir "başkasını görüntülüyor muyum" guard'ı olmadan** `#profile-avatar.src`'yi ona yazıyordu. Karakter (MPA) sayfasında sıralama şöyle: components.js `openUserProfile` (900ms) header'ı doğru şekilde bakılan kişiye set eder → sonra `initAvatarUpload` (1200ms) header'ı giriş yapanın avatarıyla **ezer**. Sadece `#profile-avatar` + sidebar'a dokunduğu, `#fut-avatar`'a ve isme dokunmadığı için tam da gözlenen simetrik-olmayan tablo çıkıyordu. **Düzeltme:** `#profile-avatar` yazımı artık `getViewedPlayerId()` ile "başkasını görüntülemiyorsak" koşuluna bağlı; sidebar (`#current-account-avatar`) her zaman giriş yapan hesabı gösterdiği için guard'sız güncellenmeye devam ediyor. DB yolu kanıtı: `avatar_url`'ler `.../avatars/<owner_uuid>/avatar.webp` biçiminde — sahiplik kesin (harputoglu `e5b037f1…`, MikimonTheGray `793004f5…`).

**Kural:** "Başkasını görüntülüyor muyuz?" kararı her yerde `getViewedPlayerId()` (script.js) üzerinden verilmeli — asla ham `sessionStorage.getItem('ss_view_player_id')` veya sadece `__PENDING_VIEW_PLAYER_ID__` ile değil; bu helper artık üç kaynağı (sessionStorage MPA-öncesi, `__PENDING` MPA, `sb_view_` SPA) birleştirir. `#fut-avatar` gibi kalıcı `<img>` elementlerini "başkasını görüntülüyoruz ama profil henüz gelmedi" anında sadece dokunmadan bırakma — **temizle**, yoksa bir önceki render'ın görseli sızar. **Ayrıca: giriş yapan kullanıcının kendi verisini (avatar, isim, sayaç vb.) `#profile-avatar` / `#player-name` gibi BAKILAN profile ait elementlere yazan HER kod yoluna — özellikle gecikmeli/`setTimeout`'lu init'lere (`initAvatarUpload` gibi) — `getViewedPlayerId()` guard'ı koy; yoksa doğru render'ı sonradan ezip kendi verini sızdırır.** `sw.js` cache sürümü `ss-v6` → `ss-v7` → `ss-v8` bump edildi.

## Ana Sayfa (dashboard) İlk Açılış Flash'ı (2026-07-05)

Kullanıcı: "İlk login olduğumda ana sayfa açılırken bir saniyeliğine bozuk/boş bir ekran (iskelet + `—`/`?????` placeholder mini kart + boş gazete/sıralama) beni karşılıyor." **Fonksiyonel bir bug değil — bu, `dashboard.js`'in iskelet (skeleton) yükleme durumu; veri ~1sn içinde geliyor.** Ama flash gereğinden uzundu ve boş göründüğü için bozuk sanılıyordu. Kök neden: `initDashboard()` ilk açılışta yalnızca `dashboard.js`'in `DOMContentLoaded` içindeki **sabit 800ms `setTimeout` fallback'iyle** tetikleniyordu; `script.js` auth hazır olur olmaz onu çağırmıyordu. Yani 800ms + auth/DB bekleme + network = ~1-1.5sn iskelet.

Yapılan düzeltmeler (flash'ı auth hazır olur olmaza indirger):

- **`initSupabaseUser()` (script.js) artık `window.__AUTH_USER__ = session.user`'ı kendisi de set ediyor** (oturum doğrulandıktan hemen sonra). Önceden bunu yalnız `index.html`'deki `guardSession()` yapıyordu; iki async yarıştığından `initSupabaseUser` bittiğinde `__AUTH_USER__` bazen hâlâ boş olabiliyordu. İkisinin de set etmesi idempotent.
- **`script.js` `DOMContentLoaded` — `initSupabaseUser()` bittikten sonra**, `#dashboard` hâlâ `active` ise `window.initDashboard()`'ı **hemen** çağırıyor. Böylece 800ms'lik kör bekleme atlanıyor; dashboard, auth+DB hazır olduğu an yüklenmeye başlıyor.
- **`dashboard.js`'e `dashLoading` guard'ı eklendi:** `initDashboard()` artık yükleme sürerken tekrar çağrılırsa (script.js erken tetik + kendi 800ms fallback'i + `showSection('dashboard')` aynı anda) no-op döner (`try/finally` ile `dashLoading` sıfırlanır). Guard, DB/auth readiness `setTimeout` retry'larından SONRA konumlandırıldı ki polling bozulmasın. Bitince tekrar çağrılabilir (nav'da yenileme amaçlı). 800ms fallback timer offline/dev için safety-net olarak duruyor.
- **`sw.js`**: `dashboard.js` APP_SHELL listesine eklendi (diğer çekirdek betikler gibi precache/offline); cache sürümü `ss-v7` → `ss-v8` bump edildi.

**Not:** İskeletlerin kendisi `rgba(255,255,255,0.06)` ile çok soluk (bkz. `fixes.css` `.skeleton-*`), bu yüzden koyu arka planda "boş kutu" gibi görünüyor — istenirse kontrast artırılıp daha belirgin bir "yükleniyor" hissi verilebilir (henüz yapılmadı).

## Bilinen Açık Konular

- **Şifre sıfırlama e-postası:** Şu an Supabase'in varsayılan göndericisinden gidiyor, "Sosyal Sporcu" marka adıyla değil. Çözüm: Supabase Dashboard → Authentication → Emails → SMTP Settings → Custom SMTP açılıp gerçek bir SMTP sağlayıcı (Resend/SendGrid/Postmark vb.) ile `noreply@sosyalsporcu.com` gönderen adresi ayarlanmalı. Kurulum 2026-07-04 itibarıyla devam ediyor — bu repodaki koddan bağımsız, tamamen Supabase panel/DNS (SPF/DKIM) konfigürasyonu.

- **Google giriş ekranında ham Supabase domaini görünüyor (2026-07-05):** Google ile giriş yapınca çıkan hesap seçme / izin ekranında "**rpwbmvpapfouhpyvoeol.supabase.co uygulamasına devam edin**" yazıyor; bu kullanıcıya güvensiz/korkutucu geliyor. Kaynak **koddan bağımsız** — `auth.js`'teki `handleGoogleLogin()` (`signInWithOAuth({provider:'google'})` + `redirectTo: origin+'/auth.html'`) doğru. Görünen yazı iki panel ayarından besleniyor: (1) Google Cloud OAuth "App name" alanı, (2) Supabase'in varsayılan callback domaini (`https://rpwbmvpapfouhpyvoeol.supabase.co/auth/v1/callback`). **İki katmanlı çözüm:**
  - **ÖNEMLİ DÜZELTME (2026-07-05, web araştırmasıyla doğrulandı):** Sadece **App name = "Sosyal Sporcu"** yapmak bu ilk hesap-seçme ekranını DEĞİŞTİRMEZ (kullanıcı denedi, App name ayarlıyken bile ham domain çıkmaya devam etti). App name yalnızca hesap seçildikten *sonraki* izin ekranını etkiler. Bu ilk satırdaki domain, uygulama **"Testing" modunda ve markası doğrulanmamış** olduğu için Supabase callback host'unu gösteriyor. Google bu satırda uygulama adını göstermeye ancak uygulama **"In production" olarak Publish edilince + branding tamamlanınca** başlar. Kaynak: [supabase#33387](https://github.com/supabase/supabase/issues/33387), [supascale rehberi](https://www.supascale.app/blog/supabase-google-oauth-branding-without-custom-domain).
  - **Katman 1 (ücretsiz — custom domain GEREKMEZ, ama kendi domainin gerekir):** Kullanıcı `sosyalsporcu.com`'a sahip. Adımlar: (a) `sosyalsporcu.com`'u **Google Search Console**'da doğrula (DNS TXT). (b) **Doğru Google Cloud projesinde** (Supabase → Auth → Providers → Google'daki Client ID hangi projeye aitse O proje — yanlış projenin consent screen'ini düzenlemek hiçbir şeyi değiştirmez) OAuth consent screen'i doldur: App name, support email, **App home page** = `https://sosyalsporcu.com`, **Privacy policy** = `https://sosyalsporcu.com/gizlilik.html`, **Terms** = `https://sosyalsporcu.com/kosullar.html`, **Authorized domains** = `sosyalsporcu.com`, developer email. (c) Scope'lar yalnız non-sensitive (email/profile/openid). (d) **Publish App** (Audience sekmesi → "In production"). **Ön koşul: privacy/terms sayfalarının `https://sosyalsporcu.com`'da CANLI yayında olması** — repo'da oluşturuldular (`gizlilik.html`, `kosullar.html`, kök dizin, Outfit + neon tema, iletişim maili `mmikailyazar@gmail.com`), siteyi sosyalsporcu.com'a deploy etmek kullanıcının sorumluluğunda.
  - **İKİNCİ ÖNEMLİ DÜZELTME (2026-07-05, kullanıcı publish'i tamamladıktan SONRA doğrulandı):** Publish etmek de TEK BAŞINA yetmiyor. Kullanıcı tüm branding'i doldurup Publish etti; ekranda **privacy/terms linkleri artık görünüyor** (yani consent config okunuyor) AMA hesap-seçme ekranındaki isim HÂLÂ ham domain. Google'ın resmi dokümanına göre uygulama adının, projenin ham tanımlayıcısı (supabase domaini/proje ID) yerine görünmesi için ayrı bir **brand verification** (marka doğrulaması) gerekiyor: **logo yüklemek** bu süreci tetikler → Google **2–3 iş günü** inceler → onaylanınca durum "Ready to publish" olur → **"Publish branding"** düğmesine basılınca isim görünür. Yani doğru sıra: (1) branding doldur, (2) `icons/icon-512.png` logosunu yükle, (3) doğrulamaya gönder, (4) 2-3 iş günü bekle, (5) "Publish branding". Bu süreçte giriş çalışmaya devam eder (sadece domain + "unverified" notu görünür). **Custom domain (Katman 2) bu "isim" sorununu çözmez** — sadece fallback domaini `auth.sosyalsporcu.com` yapar, yine "Sosyal Sporcu" yazmaz; gerçek çözüm bu brand verification'dır. Kaynak: [Manage OAuth App Branding](https://support.google.com/cloud/answer/15549049), [Submit for brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification).
  - **ÜÇÜNCÜ DÜZELTME — brand verification "home page not registered to you" hatası (2026-07-05):** Doğrulamaya gönderince Google şu hatayı verdi: *"The website of your home page URL 'https://sosyalsporcu.com' is not registered to you."* Kök sebep **Google hesabı uyuşmazlığı**: domain sahipliği, **Cloud projesini yöneten hesapla AYNI** Google hesabı altında (o hesap projede Owner/Editor olmalı) **Google Search Console**'da doğrulanmış olmak zorunda. Kullanıcının birden çok Google hesabı var (`mmikailyazar@gmail.com`, `mikail.yazar95@gmail.com`, `mikimon1905@gmail.com`, `goodbugbadgame@gmail.com`) → domain muhtemelen farklı bir hesapla doğrulandı veya Search Console doğrulaması hiç bitmedi. **Çözüm:** (1) Cloud Console sağ üstten proje hesabını öğren, (2) AYNI hesapla Search Console'da `sosyalsporcu.com`'u **Domain** tipi + DNS TXT ile doğrula (veya Search Console → Users and permissions'dan o hesabı Owner ekle), (3) sonra "I have fixed the issues → Proceed". Ayrıca **home page (`https://sosyalsporcu.com`) herkese açık şekilde CANLI olmalı** — site o domaine deploy edilmemişse bu da ayrı engel; sosyalsporcu.com'un gerçekten yayında olup olmadığı 2026-07-05 itibarıyla kullanıcıya soruldu, teyit bekleniyor. Kaynak: [App Homepage ownership](https://support.google.com/cloud/answer/13807376).
  - **Katman 2 (ücretli ~$10/ay, isteğe bağlı — domaini tamamen temizler):** Supabase Dashboard → Project Settings → **Custom Domains** add-on'u aç → `auth.sosyalsporcu.com` gibi subdomain ekle, verdiği CNAME/TXT DNS kayıtlarını gir, doğrula/aktifleştir. Sonra Google Cloud OAuth client → Authorized redirect URIs'e `https://auth.sosyalsporcu.com/auth/v1/callback` ekle ve **`supabase.js`'teki `SUPABASE_URL`'i yeni custom domaine güncelle** (tek kod değişikliği burada). `sosyalsporcu.com`'a ve DNS'ine erişim şart. 2026-07-05 itibarıyla henüz yapılmadı; kullanıcıya iki seçenek de anlatıldı, önce Katman 1 önerildi.
