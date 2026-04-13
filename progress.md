# Sosyal Sporcu Manager — Project Progress

> **Proje:** Halısaha futbol yönetim platformu (web tabanlı, localStorage, vanilla JS)
> **Durum:** Aktif Geliştirme
> **Son Güncelleme:** 13 Nisan 2026

---

## 📌 Proje Özeti

Sosyal Sporcu Manager, halısaha futbolcularının kendi profil kartlarını oluşturup yönetebileceği, takım arkadaşlarını puanlayabileceği ve maç istatistiklerini takip edebileceği bir "Football Manager tarzı" sosyal platform demosudur. Tüm veriler tarayıcının `localStorage`'ında saklanmakta olup herhangi bir backend gerektirmemektedir.

---

## ✅ Tamamlanan Özellikler

### 🏗️ Temel Altyapı
- [x] Tek sayfalı uygulama (SPA) mimarisi — vanilla HTML/CSS/JS
- [x] Sidebar navigasyon sistemi (Karakterim, Takımım, Maç Merkezi, **Akış**, Keşfet)
- [x] Collapsible sidebar — desktop ve mobil responsive
- [x] Hamburger menü toggle butonu
- [x] localStorage tabanlı veri persistance
- [x] Dark theme + glassmorphism tasarım sistemi
- [x] Outfit Google Font entegrasyonu
- [x] Font Awesome 6.4 ikon seti
- [x] Chart.js radar grafik entegrasyonu

### 👤 Oyuncu Profili (Karakterim)
- [x] Profil header — avatar, isim, takım, şehir, yaş
- [x] Dinamik piyasa değeri hesaplama
- [x] **Genel Bakış** sekmesi — radar chart, kimlik kartı, istatistik kutuları
- [x] **Detaylı Veriler** sekmesi — 4 bölüm: Kimlik, Mevki & Oyun Tarzı, Saha İçi Karakter (7 trait segmented control), Karakteristik & Lojistik
- [x] **Yetenekler** sekmesi — kilit/kilit açık skill kartları
- [x] **Puanla** sekmesi — community rating formu + **yorum alanı (FAZ 1)**
- [x] **Maç Geçmişi** sekmesi — "Ben de Vardım" doğrulama sistemi
- [x] GEN badge — radar chart üzerinde görünür
- [x] Community rating overlay — mavi kesikli çizgi

### 👥 Çoklu Kullanıcı Sistemi
- [x] 1 Admin + 10 oyuncu hesabı
- [x] Hesap geçiş paneli (sidebar altı dropdown)
- [x] View-only profil modu + banner

### ⭐ Community Puanlama Sistemi
- [x] 6 kategoride slider puanlama
- [x] Kişi başı 1 puan (güncelleme yapılabilir)
- [x] ORT. PUAN kutusu (community ortalaması)
- [x] **Yorum alanı — puan verirken 120 karaktere kadar yorum (FAZ 1)**
- [x] **Yorumlar puanlama geçmişinde görünür (FAZ 1)**
- [x] **Puan verilince Feed'e otomatik event eklenir (FAZ 1)**
- [x] **Puan verilen oyuncuya bildirim gider (FAZ 1)**

### 🏟️ Takım Yönetimi
- [x] Drag-and-drop taktik tahtası (pitch canvas)
- [x] Takım kadrosu tablosu
- [x] Admin: oyuncu ekleme/silme

### 📡 FAZ 1 — Sosyal Akış (YENİ - Nisan 2026)
- [x] **Akış sekmesi** — sidebar'da RSS ikonlu "Akış" nav item
- [x] **Feed stream** — zaman damgalı etkinlik kartları (maç, puan, davet, katılım)
- [x] **Feed filtreleri** — Tümü / Maçlar / Puanlar / Davetler
- [x] **Davete yanıt** — feed'deki daveti Kabul/Reddet butonları
- [x] **Profil linki** — feed'den oyuncunun profiline tıklayarak erişim
- [x] **Mock seed data** — 7 gerçekçi örnek etkinlik

### 🔔 FAZ 1 — Bildirim Sistemi (YENİ - Nisan 2026)
- [x] **Bildirim zili** — sidebar'da animasyonlu 🔔 butonu
- [x] **Okunmamış badge** — kırmızı sayaç
- [x] **Bildirim paneli** — yukarı açılan panel
- [x] **Çarpraz bildirim** — puan, davet, kabul/ret bildirimleri
- [x] **"Tümünü Oku" butonu** — tek tıkla hepsini okundu yap
- [x] **Hesap bazlı bildirim** — her kullanıcının kendi bildirimleri

### 📩 FAZ 1 — Maç Daveti (YENİ - Nisan 2026)
- [x] **"Maça Davet Et" modal** — oyuncu seç, tarih, saat, saha, not
- [x] **Akış'a kaldır** — davet Feed'e event olarak eklenir
- [x] **Hedef oyuncuya bildirim** — davet alan kişi şeker bildirim alır
- [x] **Toast mesajı** — "✅ Oyuncu davet edildi" animasyonlu toast
- [x] **Davet durumu** — Bekliyor / Kabul / Reddedildi renk kodları

### 🎨 Tasarım & UX
- [x] Glassmorphism card sistemi
- [x] Neon renk paleti (yeşil, cyan, pembe)
- [x] Feed timeline — avatar + dikey çizgi + event card
- [x] Modal backdrop + animasyon
- [x] Toast bildirimi
- [x] Bildirim zili sallantı animasyonu

### 🎨 Tasarım & UX
- [x] Glassmorphism card sistemi
- [x] Neon renk paleti (yeşil #adff2f, cyan #00e5ff, pembe #ff007f)
- [x] Smooth CSS geçiş animasyonları
- [x] Hesap paneli açılış animasyonu (max-height transition)
- [x] View-only banner giriş animasyonu (slideDown)
- [x] Hover micro-animations (scale, glow)
- [x] Custom scrollbar tasarımı
- [x] Responsive mobile layout

---

## 🔄 Devam Eden / Kısmi

- [ ] **Puanla sekmesi — Kendi Puanım** (tab-self-rating) → HTML'de mevcut ama henüz tab navigation'a tam entegre değil; "Puanla" tab'ı community modundayken "Kendi Puanlarım" ayrı bir sekme olmayı bekliyor

---

## 📋 Planlanan / Yapılmadı

### 🔐 Gelişmiş Kimlik Doğrulama
- [ ] Hesap şifreleri / PIN koruması (şu an mock, şifresiz)
- [ ] Oturum süresi / otomatik çıkış

### 📊 İstatistik & Analitik
- [ ] Maç geçmişine gerçek veri girişi (gol, asist, puan)
- [ ] Sezon bazlı istatistik takibi
- [ ] Performans trend grafiği (haftalık/aylık)
- [ ] Karşılaştırma modu — iki oyuncuyu yan yana radar chart ile kıyasla

### 🏆 Maç Sistemi
- [ ] Maç raporu formu → veri tabanına kaydetme
- [ ] Takım vs takım skor girişi
- [ ] Maç davetiyesi gönderme / kabul etme mekanizması
- [ ] "Ben de Vardım" doğrulamasının gerçek veriyle entegrasyonu

### 🌐 Keşfet (Genişletme)
- [ ] Rakip takım listesi genişletme
- [ ] Saha rezervasyon sistemi
- [ ] Yakınımdaki maçlar (konum bazlı)

### 🔔 Bildirim Sistemi
- [ ] In-app bildirimler (puan aldın, maça davet edildin vb.)
- [ ] Bildirim badge'i (sidebar ikonu yanında)

### 🎮 Oyunlaştırma
- [ ] XP ve seviye sistemi
- [ ] Sezon başarım rozetleri
- [ ] Liderlik tablosu (en yüksek community puanlı oyuncular)

### ☁️ Backend & Çok Kullanıcılı
- [ ] Gerçek veritabanı entegrasyonu (Firebase / Supabase)
- [ ] Çok kullanıcılı gerçek zamanlı etkileşim
- [ ] Profil fotoğrafı yükleme (avatar-upload devre dışı — backend gerektirir)

---

## 🗂️ Dosya Yapısı

```
Sosyal Sporcu/
├── index.html          # Ana SPA şablonu
├── script.js           # Core uygulama mantığı (accounts, players, UI)
├── style.css           # Ana stil dosyası (glassmorphism + layout)
├── team-fix.css        # Takım görünümü düzeltme ekleri
├── sidebar-toggle.js   # (Artık script.js içine entegre)
├── progress.md         # Bu dosya — proje durum belgesi
└── README.md           # Kısa proje tanımı
```

---

## 🔧 Teknik Notlar

| Konu | Detay |
|------|-------|
| Veri depolama | `localStorage` (ss_players_v2, ss_accounts, ss_active_account) |
| Grafik kütüphanesi | Chart.js (CDN) |
| İkon seti | Font Awesome 6.4 (CDN) |
| Font | Outfit (Google Fonts) |
| Framework | Vanilla JS — framework yok |
| Responsive | CSS Grid + Flexbox, breakpoints: 768px, 900px |
| Tarayıcı desteği | Modern Chrome/Firefox/Edge |

---

> ℹ️ Bu dosya, her önemli özellik güncellemesinden sonra revize edilecektir.
