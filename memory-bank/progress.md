# İlerleme Durumu

_Son güncelleme: 2026-06-17 (telefon düzeltmeleri sprinti)_
_Detaylı sprint geçmişi için: [progress.md (kök)](../progress.md)_

---

## Genel Durum: ~%85 tamamlandı

```
Faz 0 ✅  Altyapı, Supabase setup, schema
Faz 1 ✅  Auth, Profil, Feed, Bildirimler
Faz 2 ✅  Sosyal katman, Keşfet, Arkadaşlık, Takım
Faz 3 ✅  Maç sistemi, Avatar upload, Post-match rating, MPA geçişi
Faz 4 ✅  Sprint 6: Karakterim optimizasyonu (15 görev)
Faz 5 ✅  Sprint 7: Keşfet modülü, GEN sıfırlama
Faz 6 ✅  Sprint 8: MPA mimari geçişi, cross-page profil
Faz 7 🔄  Sprint 9+: Mobil düzeltmeler (devam ediyor)
Faz 8 📅  Takip sistemi, Saha Keşfet, Hash routing
```

---

## Tamamlananlar ✅

### Auth & Altyapı
- [x] Supabase Auth (email/password), session guard, otomatik profil oluşturma
- [x] `db.js` adaptör katmanı (`window.DB.*`) — 14 tablo
- [x] RLS tüm tablolarda, realtime (feed, notif, takım)
- [x] Avatar upload Storage entegrasyonu (BUG-03 ✅)

### Karakterim (Profil)
- [x] FIFA tarzı karakter kartı, 6 yetenek + GEN skoru
- [x] Self-rating sliderları → DB kayıt
- [x] Community rating tab (Puanla)
- [x] Maç sonu puanlama modalı (`openPostMatchRatingModal`)
- [x] Maç Geçmişi Supabase JOIN (match_players + matches)
- [x] Rozet şeridi (renderBadgeStrip)
- [x] Boy/Kilo/Takım, Form durumu alanları
- [x] View-only mod banner

### Takımım
- [x] Supabase-first tam yeniden yazım
- [x] Takım kur / davet koduyla katıl
- [x] Kadro, güç barları, radar grafiği
- [x] Kaptan: düzenle, üye çıkar
- [x] Realtime abonelik

### Maç Merkezi
- [x] Maç oluşturma, takvim, davet sistemi
- [x] Maç sonuçları, "Puan Ver" badge
- [x] `DB.Matches.create()` Supabase bağlantısı

### Sosyal Feed & Keşfet
- [x] Gerçek zamanlı feed (Supabase Realtime)
- [x] Post oluşturma, beğeni, yorum
- [x] Keşfet: oyuncu / takım / arkadaş sekmeleri
- [x] Arkadaşlık sistemi (pending/accepted/blocked)
- [x] `openUserProfile` → character sayfasına yönlendirme

### Mimari
- [x] SPA → MPA geçişi (character, explore, matches ayrı HTML)
- [x] `components.js` sidebar inject, cross-page profil
- [x] Mobil responsive düzeltmeleri (son sprint)

---

## Devam Eden / Yarım Kalanlar ⏳

| Görev | Tamamlanma | Not |
|-------|------------|-----|
| `faz1.js` legacy temizleme | %5 | localStorage notif hâlâ paralel çalışıyor |
| Community Rating tam entegrasyon | %70 | Maç bazlı kayıt çalışıyor, edge case'ler kaldı |
| Mobil ince ayarlar | %80 | Son sprint sonrası devam ediyor |

---

## Bilinen Açık Hatalar 🐛

### 🔴 Kritik
| # | Hata | Çözüm |
|---|------|-------|
| B-02 | ~~Maç Geçmişi mock data~~ → ✅ DÜZELTİLDİ | — |

### 🟡 Orta
| # | Hata | Çözüm |
|---|------|-------|
| B-04 | Çift bildirim sistemi (faz1.js + faz2-social.js) | faz1.js notif kodunu kaldır |
| B-07 | Dark/light mod sıfırlanması | localStorage persist düzelt |

### 🟢 Düşük
| # | Hata | Çözüm |
|---|------|-------|
| B-08 | `sidebar-toggle.js` boş dosya | Silebilir |
| B-09 | `check.js`, `check_syntax.js` debug dosyaları | Temizlenmeli |
| B-10 | 4 CSS dosyası arası selector çakışması | Uzun vadede merge |

---

## Sıradaki Öncelikler 📋

### Kısa Vadeli
- [ ] `faz1.js` legacy bildirim kodu → `DB.Notifications.*`'a devret
- [ ] Takip sistemi (Follow/Unfollow) — yeni `followers` tablosu gerekiyor
- [ ] Hash/URL routing (#profil, #takim)

### Orta Vadeli
- [ ] Saha (Venue) Keşfet → `venues` tablosu UI
- [ ] Sezon istatistikleri (aylık/sezonluk grafik)
- [ ] Takım maç geçmişi (skor tablosu)

### Uzun Vadeli
- [ ] PWA (service worker + manifest)
- [ ] Infinite scroll (feed sayfalama)
- [ ] Bildirim tıklama aksiyonu (ilgili sayfaya git)
