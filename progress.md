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
- [x] Sidebar navigasyon sistemi (Karakterim, Takımım, Maç Merkezi, Keşfet)
- [x] Collapsible sidebar — desktop ve mobil responsive
- [x] Hamburger menü toggle butonu
- [x] localStorage tabanlı veri persistance
- [x] Dark theme + glassmorphism tasarım sistemi
- [x] Outfit Google Font entegrasyonu
- [x] Font Awesome 6.4 ikon seti
- [x] Chart.js radar grafik entegrasyonu

### 👤 Oyuncu Profili (Karakterim)
- [x] Profil header — avatar, isim, takım, şehir, yaş
- [x] Dinamik piyasa değeri hesaplama (rating ortalamasına göre)
- [x] **Genel Bakış** sekmesi — radar chart, kimlik kartı, istatistik kutuları
- [x] **Detaylı Veriler** sekmesi — yaş, boy, kilo, ekol, sakatlık riski, mizaç, lojistik
- [x] **Yetenekler** sekmesi — kilit/kilit açık skill kartları (Maestro, Tank, Makina, Fişek)
- [x] **Puanla** sekmesi — community rating formu (başkasına puan verme)
- [x] **Maç Geçmişi** sekmesi — "Ben de Vardım" doğrulama sistemi
- [x] GEN (genel yetenek) badge — radar chart üzerinde görünür
- [x] Radar chart real-time güncelleme (puan değişince yenilenir)
- [x] **Community rating overlay** — radar chart'ta ikinci dataset olarak mavi kesikli çizgi

### 👥 Çoklu Kullanıcı Sistemi (YENİ - Nisan 2026)
- [x] 1 Admin + 10 oyuncu hesabı — `MOCK_ACCOUNTS` ile initialize
- [x] **Hesap geçiş paneli** — sidebar'ın altında, yukarı açılan dropdown
- [x] Aktif hesap avatarı, ismi ve rolü sidebar'da görünür
- [x] Her hesap kendi `playerId`'sine bağlı
- [x] `switchAccount(id)` — hesap geçişinde profil, liste ve UI tam güncelleme
- [x] Admin rolü: tüm profilleri düzenleyebilir, oyuncu silebilir, yeni oyuncu ekleyebilir
- [x] Player rolü: yalnızca kendi profilini düzenleyebilir

### 👁️ Profil Görüntüleme Modu (YENİ - Nisan 2026)
- [x] Başkasının profiline girildiğinde **"salt okunur"** mod devreye girer
- [x] Mavi **View-Only Banner** — "X'in profilini görüntülüyorsunuz" mesajı
- [x] Detaylı Veriler input/select alanları disabled hale gelir
- [x] Kaydet butonu devre dışı kalır
- [x] Admin olarak başkasının profiline girildiğinde farklı banner mesajı

### ⭐ Community Puanlama Sistemi (YENİ - Nisan 2026)
- [x] `communityRatings[]` dizisi her player objesine eklendi
- [x] Kendi profilinde "Puanla" sekmesine girildiğinde "Kendinizi puanlayamazsınız" mesajı
- [x] Başkasının profilinde **6 kategori için slider**'lı puanlama formu (1-99)
- [x] Her hesap, bir oyuncuya en fazla 1 puan verebilir — güncelleme yapabilir
- [x] Verilen puanlar `communityRatings` dizisine eklenir ve localStorage'a kaydedilir
- [x] **ORT. PUAN** kutusu — Genel Bakış'ta, community puanlarının ortalamasını gösterir
- [x] Community radar chart overlay — kendi puanlarının üzerinde mavi kesikli çizgi
- [x] Puanlama geçmişi listesi — kim ne kadar puan verdi
- [x] "Puanla" sekme butonunda **verilen puan sayısı badge'i**

### 🏟️ Takım Yönetimi
- [x] Drag-and-drop taktik tahtası (pitch canvas)
- [x] Takım kadrosu tablosu — oyuncuya tıklayınca profil görüntüleme
- [x] Oyuncuları sahaya sürükleyerek mevki atama
- [x] Oyuncu token'larını sahanın dışına çekince silme
- [x] Saha konumları localStorage'a kaydedilir
- [x] Admin: Yeni oyuncu ekleme formu (isim, mevki, ekol)
- [x] Admin: Oyuncu silme (kırmızı X ikonu)
- [x] Roster tablosunda **community puan** badge'i (⭐ ORT.)

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
