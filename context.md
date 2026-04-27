# 🌍 CONTEXT.MD — MANAGER++ Proje Bağlamı

> **Son güncelleme:** 2026-04-27
> Bu dosya projenin "neden" ve "ne" sorularını cevaplar. Vizyon değişince güncelle.

---

## 🎯 Proje Vizyonu

**MANAGER++**, halısaha futbol oyuncularının **Facebook/Instagram benzeri** sosyal medya platformudur.

### Hedef Kitle
- Düzenli halısaha oynayan amatör futbolcular (çoğunlukla 18–40 yaş)
- Kendi takımını kurmak veya mevcut bir takıma katılmak isteyen oyuncular
- İstatistiklerini takip etmek, kendini geliştirmek isteyen futbol severler

### Temel Değer Önerisi
1. **"PES/FIFA içinde oynadığım oyuncu ben olsam"** — Kişisel oyuncu kartı, altıgen radar grafiği, GEN puanı
2. **Gerçek veri, gerçek arkadaşlar** — Sadece seni tanıyan oyuncular puanlayabilir
3. **Takım yönetimi** — Kaptan sistemi, kadro, davet kodu, maç istatistikleri
4. **Sosyal akış** — Maç sonuçları, puanlamalar, davetler — hepsi tek feed'de

---

## 🏗️ Teknik Yapı Analizi (Mevcut Durum)

### Mimari Özet

```
[Browser]
   │
   ├── index.html (SPA shell — 1294 satır)
   │     ├── Section: #profile   (Karakterim)
   │     ├── Section: #takimim   (Takımım)
   │     ├── Section: #matches   (Maç Merkezi)
   │     ├── Section: #feed      (Akış)
   │     └── Section: #explore   (Keşfet)
   │
   ├── CSS katmanı (4 dosya)
   │     style.css (82KB) → faz2-7.css (47KB) → fixes.css (42KB) → team-fix.css
   │
   └── JS katmanı (yükleme sırası)
         supabase.js      → window.sbClient
         db.js            → window.DB.*
         faz1.js          → Legacy feed + toast (localStorage)
         script.js        → Ana routing, profil render, GEN grafik (101KB)
         faz2-social.js   → Supabase feed, keşfet, arkadaşlık (88KB)
         faz2-7.js        → Maç merkezi, saha, community rating (76KB)
         takimim.js       → Supabase-first takım modülü (49KB)
         auth.js          → Sadece auth.html'de kullanılır

[Supabase Cloud]
   ├── PostgreSQL (14 tablo, 1 view, 5 trigger)
   ├── Auth (email/password)
   ├── Realtime (posts, notifications, friendships, match_invitations)
   └── Storage (avatars bucket — schema'da tanımlanmış)
```

### Routing Sistemi
- **SPA (Single Page App)** — Sayfa yenilemesi olmadan section geçişi
- `showSection(name)` fonksiyonu ile bölüm değişimi
- URL yönetimi yok (hash routing entegre edilmemiş — planlananlar listesinde)
- Auth koruma: `index.html`'in `<head>`'inde session guard scripti (`guardSession()`)

### Oturum Yönetimi
- Giriş → `auth.html` (ayrı sayfa)
- `window.__AUTH_USER__` global değişkeni aktif kullanıcıyı tutar
- `supabase.js` → `window.sbClient` — Tüm modüller bu client'ı kullanır
- `auth.onAuthStateChange` ile session değişimlerini izle

---

## ✅ Tamamlananlar (Gerçekten Çalışan Özellikler)

### 🔐 Auth Sistemi
- [x] Email/password kayıt ve giriş (`auth.html`)
- [x] Supabase trigger ile yeni kullanıcıya otomatik profil oluşturma
- [x] Session guard — giriş yoksa `auth.html`'e yönlendirme
- [x] `onAuthStateChange` ile session senkronizasyonu

### 👤 Profil (Karakterim)
- [x] Supabase'den profil yükleme (`DB.Profiles.get`)
- [x] Profil düzenleme ve kaydetme (kullanıcı adı, şehir, mevki, ayak, yaş)
- [x] Self-rating sliderları (Teknik/Şut/Pas/Hız/Fizik/Kondisyon)
- [x] GEN skoru otomatik hesaplama (DB trigger + frontend senkronizasyonu)
- [x] Chart.js radar grafiği (altıgen) — 6 özellik görselleştirmesi
- [x] Karakter özellikleri (Segmented Controls: Dakiklik, Saha İletişimi, Markaj vb.)
- [x] Kariyer istatistikleri giriş alanları (Maç/Gol/Asist)
- [x] Avatar yükleme alanı (UI hazır, Storage bağlantısı test bekliyor)
- [x] View-only mod (başka kullanıcı profili görüntüleme banner'ı)
- [x] Başarım sistemi tab'ı (Yetenekler — istatistik bazlı rozet unlock)
- [x] Community rating tab'ı (Puanla — başka kullanıcılara puan verme)
- [x] Maç Geçmişi tab'ı (UI mevcut, "Ben de Vardım" butonu — mock data)

### 🏆 Takım (Takımım) — Supabase-First
- [x] Takımsız kullanıcı için onboarding ekranı (Kur / Katıl)
- [x] Takım oluşturma: ad, şehir, açıklama, renk seçimi, otomatik slug/davet kodu
- [x] Davet koduyla takıma katılma (slug sorgulama + preview)
- [x] Takım genel bakış: kaptan, GEN, üye sayısı, sezon sayaçları
- [x] Takım radar grafiği (Chart.js — üyeler ortalaması)
- [x] Takım özellik profili (güç barları — en güçlü/geliştir etiketleri)
- [x] Anahtar Kadro (ilk 7 — GEN sıralamasına göre)
- [x] Üye grid'i (tüm oyuncular, kaptan badge, mevki, GEN)
- [x] Oyuncu davet modalı: Davet Kodu tab'ı + Oyuncu Arama tab'ı
- [x] Takıma bildirim gönderme (`DB.Notifications.send`)
- [x] Takımdan ayrılma (player) / Takımı dağıtma (kaptan) — confirm dialog
- [x] Realtime aboneliği (`DB.Teams.subscribeToTeam`)
- [x] Kaptan: takım düzenleme modalı (isim, açıklama, şehir güncelleme)
- [x] Kaptan: üye çıkarma
- [x] Supabase'de `current_team_id` ile profil senkronizasyonu

### 📡 Sosyal Feed (Akış)
- [x] Supabase `posts` tablosundan gerçek feed çekme
- [x] Paylaşım tipi filtreleme (Durum / Maç / Takım / Saha)
- [x] Post oluşturma modalı (500 karakter, tip seçimi)
- [x] Beğeni sistemi — optimistic update + Supabase sync
- [x] Yorum sistemi — gerçek zamanlı ekleme ve görüntüleme
- [x] Realtime feed aboneliği (yeni post gelince otomatik güncelleme)
- [x] Loading skeleton animasyonu

### 🔔 Bildirim Sistemi
- [x] Supabase `notifications` tablosundan gerçek bildirimler
- [x] Realtime bildirim aboneliği (yeni bildirim gelince badge güncelleme)
- [x] "Tümünü Oku" işlevi
- [x] Bildirim panel UI (sidebar içinde)
- [x] Friend request, team invite, match invite bildirimleri gönderme

### 🔍 Keşfet
- [x] `profiles_with_ratings` view'ından oyuncu listesi
- [x] Arama (username) ve mevki filtresi
- [x] Oyuncu kartları: avatar, GEN badge, pozisyon, şehir, istatistikler
- [x] Arkadaş ekleme butonu (pending/accepted durumu)
- [x] Profil modalı (oyuncu detayı, arkadaşlık durumu yönetimi)
- [x] Loading skeleton animasyonu

### 🏟️ Maç Merkezi
- [x] Temel UI section hazır (`faz2-7.js` içinde)
- [x] Maç oluşturma formu (UI mevcut)

### 🤝 Arkadaşlık Sistemi
- [x] `DB.Friends.sendRequest` — arkadaşlık isteği gönderme
- [x] `DB.Friends.acceptRequest` — isteği kabul etme
- [x] `DB.Friends.checkStatus` — iki kullanıcı arası durum sorgulama
- [x] Pending isteği gönderildi durumu UI'ı

---

## 🚧 Planananlar (Sıradaki Adımlar)

### Öncelik 1 — Kritik Eksikler
- [ ] **Maç Geçmişi gerçek veriye bağlansın** — `match_players` tablosundan kullanıcı maçları çekilmeli
- [ ] **Avatar upload Supabase Storage'a bağlansın** — `avatars-bucket.sql` uygulandı, JS entegrasyonu eksik
- [ ] **Community Rating engine tam çalışsın** — Başka kullanıcının profiline girince rating tab'ı ve kaydetme
- [ ] **`faz1.js` legacy kodu kaldırılsın** — `renderFeed()` ve localStorage notifler `faz2-social.js`'e tamamen devredilmeli
- [ ] **Maç Merkezi Supabase entegrasyonu** — Maç oluşturma, katılım, sonuç girme gerçek DB'ye bağlansın

### Öncelik 2 — Yeni Özellikler
- [ ] **Takip sistemi (Follow/Unfollow)** — `followers` tablosu eklenmeli, feed filtreleme
- [ ] **Saha (Venue) Keşfet** — `venues` tablosundan saha listesi, harita entegrasyonu
- [ ] **URL/Hash routing** — Deep link desteği (`#profil`, `#takim` vb.)
- [ ] **Profil paylaşım URL'i** — `?user=username` ile başkasının profiline direkt gidiş
- [ ] **Maç davetleri Supabase-first** — `match_invitations` tablosundan gerçek davet akışı
- [ ] **Sezon istatistikleri** — Aylık/sezonluk gol, asist, maç grafiği
- [ ] **Takım maç geçmişi** — Takımın tüm maçları, skor tablosu

### Öncelik 3 — UX İyileştirmeleri
- [ ] **PWA desteği** — Service worker + manifest → mobil kurulum
- [ ] **Dark/Light mod persistence** — Şu an localStorage'da ama profil yüklenince sıfırlanıyor
- [ ] **Infinite scroll** — Feed'de sayfalama
- [ ] **Arama genişletme** — Keşfet'te takım araması da eklenmeli (şu an sadece oyuncu)
- [ ] **Bildirim tıklama aksiyonu** — Bildirime tıklayınca ilgili sayfaya git

---

## 🚫 Mevcut Blockerlar

### 🔴 Kritik

| Blocker | Açıklama | Çözüm Yolu |
|---------|----------|------------|
| **localhost CORS / file:// protokolü** | `index.html` direkt `file://` açıldığında Supabase CDN ve bazı özellikler çalışmayabilir | Yerel HTTP server kullan: `python -m http.server 3000` veya VS Code Live Server |
| **`faz2-7.js` syntax error riski** | 76K satırlık dosya; index.html'de `<head>`'e hata yakalayıcı eklendi ama her editten sonra syntax doğrulaması gerekiyor | Her düzenlemeden sonra browser console kontrol |
| **Mock data / gerçek data karışımı** | Maç Geçmişi tab'ında sabit mock veriler var (Hafta 41, Hafta 42), gerçek kayıt yok | `match_players` + `matches` tablosunu UI'a bağla |

### 🟡 Orta Öncelik

| Blocker | Açıklama | Çözüm Yolu |
|---------|----------|------------|
| **`faz1.js` + `faz2-social.js` çift bildirim sistemi** | localStorage notif sistemi (faz1.js) ile Supabase realtime sistemi (faz2-social.js) paralel çalışıyor, çakışma riski | faz1.js'ten bildirim kodlarını kaldır, tamamen `DB.Notifications.*`'a geç |
| **Avatar Storage entegrasyonu** | `avatar-upload` input mevcut ama Supabase Storage'a yükleme JS kodu yazılmamış | `avatars-bucket.sql` çalıştırıldıysa Storage bucket hazır, sadece upload fonksiyonu eksik |
| **`inp-total-matches` çift ID** | `index.html`'de aynı ID iki yerde: Kariyer İstatistikleri bölümünde duplicate `inp-total-matches` ve `inp-total-goals` ID'leri var | ID'leri benzersiz hale getir (`inp-career-matches`, `inp-career-goals`) |
| **Team edit modalı kaptan dışına açık** | `openTeamEditModal()` fonksiyonu mevcut ama bazı durumlarda kaptan kontrolü bypass olabiliyor | `_tmIsCapOrAdmin()` kontolünü modal açılışında zorla |

### 🟢 Düşük Öncelik

| Blocker | Açıklama |
|---------|----------|
| **`sidebar-toggle.js`** | 64 byte, boş/stub dosya — işlevi `script.js` üstleniyor |
| **`check.js` ve `check_syntax.js`** | Geçici debug araçları, temizlenmeli |
| **CSS çakışmaları** | 4 CSS dosyası arasında bazı selector priority çakışmaları olabilir, `fixes.css` bunları geçici patch ediyor |

---

## 📊 GEN Puanı Sistemi Detayı

```
Özellik         Açıklama                    Ağırlık
──────────────────────────────────────────────────
Teknik          Top kontrolü, dribling      1/6
Şut             Şut gücü ve isabeti         1/6
Pas             Kısa/uzun pas isabeti       1/6
Hız             Sprint ve ivme              1/6
Fizik           Güç, denge, mücadele        1/6
Kondisyon       Dayanıklılık, enerji        1/6
──────────────────────────────────────────────────
GEN TOPLAM      Ortalama (1-99 arası)       = tümü/6
```

**GEN Renk Skalası:**
- 🟢 ≥ 85 → `var(--neon-green)` — Elite
- 🔵 ≥ 75 → `var(--neon-cyan)` — İyi
- 🟠 < 75 → `orange` — Gelişiyor

**Community GEN vs Self GEN:**
- Community rating 0 ise → self-rating gösterilir
- Community rating ≥ 1 ise → community ortalaması gösterilir (`profiles_with_ratings.community_gen`)

---

## 🎮 Kullanıcı Deneyimi Akışı

```
Yeni Kullanıcı:
  auth.html (kayıt) → Supabase trigger → profile oluşur → index.html yönlendirme
    → "Karakterim" (profil doldur)
    → "Takımım" (Takım Kur / Katıl seçimi)
    → "Akış" (community ile etkileşim)

Mevcut Kullanıcı:
  auth.html (giriş) → session → index.html
    → guardSession() profil çek
    → Sidebar → istediği section

Başka Oyuncuyu Görüntüleme:
  Keşfet → Profil kartı → "Profil" butonu → showProfileModal()
    → Arkadaş Ekle / İstek Gönderildi / Arkadaş / İsteği Kabul Et
    → Maça Davet Et
```

---

## 🗺️ Uzun Vadeli Yol Haritası

```
Faz 0 (✅ Tamamlandı): Temel altyapı, Supabase setup, schema
Faz 1 (✅ Tamamlandı): Auth, Profil, Feed, Bildirimler, Toast
Faz 2 (✅ Tamamlandı): Sosyal katman, Keşfet, Arkadaşlık, Takım
Faz 3 (🔄 Devam Ediyor): Maç sistemi, Avatar upload, Mock data temizleme
Faz 4 (📅 Planlanan): Takip sistemi, Saha Keşfet, Sezon istatistikleri
Faz 5 (📅 Planlanan): PWA, Mobil optimizasyon, Hash routing
Faz 6 (💭 Vizyon): Gerçek zamanlı maç girişi, Lig tabloları
```

---

## 📝 Önemli Teknik Notlar

1. **`window.__AUTH_USER__`** her zaman kontrol et — null olabilir (offline / session süresi dolmuş)
2. **`window.DB`** null olabilir — Supabase yüklü değilse fallback gracefully
3. **Dicebear URL'i** `encodeURIComponent` olmadan çalışmaz (Türkçe karakter içeren kullanıcı adları)
4. **`faz2-7.js` ve `faz2-social.js`** arasında `window.initRealFeed` ve `window.initExplore` global fonksiyonlar — script.js bu fonksiyonları section değişiminde çağırır
5. **Takımım modülü** `_tmState` global state'ini kullanır — `initTakimim()` her "Takımım" section geçişinde yeniden çağrılmamalı, sadece ilk açılışta ve takım değişiminde
6. **CSS `fixes.css`** her bug fix için kullanılan override dosyasıdır — idealde ileride ana CSS'e merge edilmeli
