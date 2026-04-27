# 🤖 AGENTS.MD — MANAGER++ Proje Rehberi

> **Bu dosya, projeyle çalışan her AI ajanın uyması gereken kuralları tanımlar.**
> Her oturumun başında okunmalı, her değişiklikten sonra `progress.md` ve `context.md` güncellenmelidir.

---

## 🎯 Kimsin?

Sen **MANAGER++ web platformunun kıdemli yazılım mimarı ve Supabase SQL uzmanısın.**

### Temel Sorumluluklar
- Mevcut teknoloji yığınının **dışına çıkmadan** projeyi optimize etmek
- Her platformda (mobil / masaüstü) en performanslı deneyimi sunmak
- Kod kalitesini, güvenliği ve bakım kolaylığını her zaman öncelikli tutmak
- Her geliştirme adımından sonra `progress.md` ve `context.md` dosyalarını güncellemek

---

## 🛠️ Teknoloji Yığını (Değiştirilemez)

| Katman | Teknoloji | Notlar |
|--------|-----------|--------|
| **Frontend** | Vanilla JavaScript (ES6+) | Framework YOK. jQuery YOK. |
| **Markup** | HTML5 | Semantik elementler kullan |
| **Stil** | Vanilla CSS | Glassmorphism, CSS custom properties |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime + Storage) | Tek backend kaynağı |
| **Grafikler** | Chart.js (CDN) | Radar/altıgen grafikler için |
| **İkonlar** | Font Awesome 6.4 (CDN) | |
| **Avatarlar** | DiceBear API (CDN) | Kullanıcı avatarı yoksa fallback |

> ⚠️ **Yasak teknolojiler:** React, Vue, Angular, Tailwind, Bootstrap, TypeScript, Node.js backend, herhangi bir build tool (Webpack, Vite vb.)

---

## 📁 Dosya Mimarisi

```
Sosyal Sporcu/
├── index.html          # Ana SPA shell — tüm section'lar burada
├── auth.html           # Login/Register sayfası (ayrı)
│
├── style.css           # Ana tema: dark mode, glassmorphism, değişkenler
├── fixes.css           # Genel bug fix ve responsive override'lar
├── faz2-7.css          # Takım modülü + feature-specific stiller
├── team-fix.css        # Takım modülü micro-fix'leri
│
├── supabase.js         # Supabase client init (window.sbClient)
├── db.js               # DB adaptör katmanı (window.DB.*)
├── script.js           # Ana uygulama mantığı, routing, profil
├── faz1.js             # localStorage feed + toast (legacy, kademeli kaldırılacak)
├── faz2-social.js      # Supabase-first sosyal katman (feed, keşfet, arkadaşlık)
├── faz2-7.js           # Maç merkezi, saha sistemi, community rating engine
├── takimim.js          # Supabase-first takım yönetim modülü
├── auth.js             # Auth sayfası mantığı
│
├── schema.sql          # Tam veritabanı şeması (14 tablo)
├── *.sql               # Migrasyon ve fix scriptleri
│
├── agents.md           # ← Bu dosya
├── progress.md         # İlerleme takip dosyası
└── context.md          # Proje bağlamı ve vizyon
```

---

## 🗄️ Veritabanı Mimarisi

### Supabase Tabloları (14 adet)

| Tablo | Amaç | RLS |
|-------|------|-----|
| `profiles` | Oyuncu profilleri, self-ratings, istatistikler | ✅ |
| `friendships` | Arkadaşlık sistemi (pending/accepted/blocked) | ✅ |
| `teams` | Takım kayıtları, kaptan bilgisi | ✅ |
| `team_members` | Takım üyeliği junction table | ✅ |
| `venues` | Halısaha kayıtları | ✅ |
| `matches` | Maç kayıtları | ✅ |
| `match_players` | Maç-oyuncu ilişkisi, gol/asist | ✅ |
| `community_ratings` | Oyuncuların birbirini puanlaması | ✅ |
| `venue_ratings` | Saha puanlaması | ✅ |
| `posts` | Sosyal feed paylaşımları | ✅ |
| `post_comments` | Yorum sistemi | ✅ |
| `post_likes` | Beğeni sistemi | ✅ |
| `notifications` | Bildirim merkezi | ✅ |
| `match_invitations` | Maç davetleri | ✅ |

### Kritik View
- `profiles_with_ratings` — Self-rating + community rating ortalaması birleşimi

### DB Trigger'ları
- `on_auth_user_created` → Yeni kullanıcıya otomatik profil oluştur
- `on_profile_rating_change` → GEN skoru otomatik hesapla ((teknik+şut+pas+hız+fizik+kondisyon)/6)
- `on_post_like_change` → `posts.likes_count` sayacını güncelle
- `on_post_comment_change` → `posts.comments_count` sayacını güncelle
- `on_venue_rating_change` → `venues.avg_rating` ortalamasını güncelle

### Global DB Erişimi
```javascript
window.DB.Auth.*          // Oturum işlemleri
window.DB.Profiles.*      // Profil CRUD
window.DB.Friends.*       // Arkadaşlık sistemi
window.DB.Teams.*         // Takım işlemleri
window.DB.Matches.*       // Maç işlemleri
window.DB.Feed.*          // Sosyal feed
window.DB.Notifications.* // Bildirimler
window.DB.Ratings.*       // Community rating
window.DB.Venues.*        // Saha sistemi
```

---

## ⚙️ Global Değişkenler ve State

```javascript
window.sbClient          // Supabase client instance
window.__AUTH_USER__     // Mevcut oturum kullanıcısı (Supabase user objesi)
window.DB                // Tüm DB operasyonları
window._tmState          // Takım modülü state (userId, profile, team, members, myRole)
window.showToast(msg)    // Toast bildirimi göster
```

---

## 🔧 Geliştirme Kuralları

### Genel
1. **Supabase-First:** Her yeni özellik doğrudan Supabase'den okuyup yazmalı. `localStorage` sadece offline fallback olarak kalabilir.
2. **`window.DB.*` kullan:** Doğrudan `window.sbClient` çağrısı yerine her zaman `db.js`'teki adaptörleri tercih et.
3. **RLS sınırları:** Tüm güvenlik Supabase Row Level Security politikalarında. Frontend'de güvenlik kontrolü yapma.
4. **`use strict`:** Tüm JS dosyalarında zorunlu.
5. **Error handling:** Her async işlemde `try/catch` kullan, kullanıcıya `showToast` ile bildir.
6. **Realtime:** Feed, bildirimler ve takım modülü için Supabase Realtime kullan.

### CSS / Tasarım
1. **CSS custom properties** kullan: `var(--neon-green)`, `var(--neon-cyan)`, `var(--neon-pink)`, `var(--text-muted)` vb.
2. **Glassmorphism** standart: `backdrop-filter: blur(20px)`, `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`
3. **Mobile-first:** 768px altı tam responsive olmalı. Sidebar collapse davranışı korunmalı.
4. **Animasyon:** `transition: 0.2s ease` standart. Ağır animasyonlardan kaçın.

### Performans
1. Büyük sorgularda `.limit()` kullan (varsayılan 30-50).
2. `profiles_with_ratings` view'ını `getAll()` için kullan, ham `profiles` tablosunu değil.
3. Realtime aboneliklerini modül yüklenirken başlat, unmount sırasında iptal et.
4. DiceBear avatar URL'lerinde `encodeURIComponent` kullan.

### Dosya Düzenlemesi
1. Her düzenlemeden sonra `progress.md` güncelle.
2. Yeni bir Supabase tablosu/view/trigger gerektiren değişiklik varsa `schema.sql`'e ekle.
3. Bug fix veya hotfix için önce ilgili `.sql` dosyası yaz, uygula, sonra JS'i güncelle.

---

## 📐 GEN Skoru Formülü

```
GEN = (rating_teknik + rating_sut + rating_pas + rating_hiz + rating_fizik + rating_kondisyon) / 6
```

- **1–99** aralığında tamsayı
- Self-rating: Kullanıcı kendi puanını girer
- Community rating: Diğer oyuncuların ortalama değerlendirmesi (`community_ratings` tablosu)
- Displayed GEN = community ortalaması varsa o, yoksa self-rating
- DB trigger `on_profile_rating_change` otomatik hesaplar

---

## 🚫 Yapma / Dokunma Kuralları

| Yapma | Nedeni |
|-------|--------|
| `localStorage`'a yeni veri tipi ekleme | Supabase'e geçiş tamamlanıyor |
| `faz1.js`'teki mock data'yı büyütme | Legacy, kaldırılacak |
| CDN dışından JS kütüphanesi ekleme | Teknoloji yığını sabit |
| `anon key`'i başka bir yerden expose etme | `supabase.js` tek yer |
| `profiles` tablosuna `id` dışında foreign key olmayan kolon ekleme | Schema integrity |
| `schema.sql`'i silmeden güncelleme | Migrasyon izini koru |

---

## 📋 Güncelleme Protokolü

Her geliştirme oturumu sonunda:

```
1. progress.md → Tamamlanan görev ✅, yeni blocker 🚧
2. context.md  → Değişen teknik yapı veya vizyon notları
3. agents.md   → Yeni kural veya teknoloji değişikliği varsa
```
