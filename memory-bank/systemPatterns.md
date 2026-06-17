# Sistem Mimarisi & Teknik Kararlar

## Dosya Yapısı
```
/
├── index.html              # SPA shell — 5 section içerir
├── auth.html               # Giriş/kayıt sayfası
├── character/index.html    # Standalone profil görünümü
├── explore/index.html      # Standalone keşfet sayfası
├── matches/index.html      # Standalone maç merkezi
│
├── script.js               # Core: showSection(), updateUI(), updateChart()
├── db.js                   # Supabase soyutlama — window.DB.*
├── faz1.js                 # Legacy feed + showToast()
├── takimim.js              # Takım modülü
├── faz2-7.js               # Maç merkezi + maç sonu puanlama modalı
├── faz2-social.js          # Feed, keşfet, arkadaşlık, openUserProfile
├── assets/js/components.js # MPA navigasyon wrappers
├── supabase.js             # window.sbClient tanımı
│
├── style.css               # Design system, CSS variables
├── team-fix.css            # Takım modülü düzeltmeleri
├── faz2-7.css              # Maç merkezi stilleri (.pmr-* classes)
├── fixes.css               # Responsive + z-index düzeltmeleri
│
└── memory-bank/            # Bu klasör — proje belleği
```

## JS Yüklenme Sırası (kritik)
db.js → components.js → script.js → faz1.js → takimim.js → faz2-7.js → faz2-social.js

**db.js her zaman ilk yüklenmeli.**

## Routing Mantığı
- SPA içi: `showSection(id)` → visibility toggle
- Sayfalar arası: `sessionStorage('ss_view_player_id')` + `components.js` wrappers
- `window.__openUserProfileCore` → MPA redirect bypass (character sayfası içinden çağrılır)

## Veritabanı Şeması (Key Tables)
| Tablo | Amaç |
|-------|------|
| `profiles` | Kullanıcılar + 6 yetenek puanı + gen_score |
| `community_ratings` | Topluluk puanlamaları (match_id nullable, fair_play kolonu var) |
| `profiles_with_ratings` | VIEW: profil + topluluk ortalamaları |
| `teams` + `team_members` | Takım yapısı |
| `matches` + `match_players` | Maç kayıtları |
| `posts`, `post_comments`, `post_likes` | Sosyal feed |
| `friendships` | Arkadaşlık sistemi |
| `notifications` | Bildirimler |
| `venues`, `venue_ratings` | Halı saha bilgileri |
| `match_invitations` | Maç davetleri |

## DB Trigger
`on_profile_rating_change` → gen_score = (teknik+sut+pas+hiz+fizik+kondisyon)/6 otomatik hesaplar

## GEN Renk Kodlaması
- ≥85 → `--neon-green` (#adff2f)
- ≥75 → `--neon-cyan` (#00e5ff)  
- <75 → orange

## CSS Design System
```css
--neon-green: #adff2f
--neon-cyan: #00e5ff
--neon-pink: #ff007f
--bg-dark: #121212
--glass-bg: rgba(255,255,255,0.05)
```

## Kritik Kalıplar
- Yeni DB operasyonu → `db.js`'e ekle, `window.DB.*` üzerinden çağır
- Profil güncelleme → `updateUI()` çağır
- Takım güncelleme → `renderTeamOverview()` çağır
- Feed güncelleme → `window.initRealFeed()` çağır
- Maç sonu puanlama akışı: `loadMatchHistory()` → "Puan Ver" badge → `openPostMatchRatingModal(matchId, teamSide)`
