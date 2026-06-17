# Aktif Bağlam

_Son güncelleme: 2026-06-17_

## Şu An Neredeyiz?

**Son tamamlanan sprint:** Mobil/telefon uyumluluk düzeltmeleri (2026-06-17)
- `character/index.html` + `index.html` telefon layout düzeltmeleri
- `fixes.css` yeni responsive kurallar
- `faz2-7.js`, `script.js` küçük düzeltmeler

**Öncesinde:** Keşfet modülü hata ayıklama (birkaç sprint)

**Mevcut faz:** Faz 7 / Sprint 9+ — Stabilizasyon

---

## Güncel Odak

> **Mikail buraya yazacak:** Şu an hangi özellik üzerinde çalışılıyor? Varsa aktif bug nedir?

---

## Kritik Teknik Notlar (Sık Unutulanlar)

- `window.__AUTH_USER__` her zaman null kontrolü yap
- `db.js` her zaman FIRST yüklenmeli (bağımlılık zinciri başı)
- `window.__openUserProfileCore` → MPA redirect bypass (character sayfası içinden)
- `faz2-7.js` büyük dosya (76K satır civarı) — her editten sonra browser console kontrol
- Dicebear URL: Türkçe karakter için `encodeURIComponent` zorunlu
- `file://` ile açma — her zaman `python -m http.server 3000`

---

## Son Commit Özeti

| Tarih | Commit | Konu |
|-------|--------|------|
| 2026-06-17 | Telefon Hataları | Mobil responsive (character, index, fixes.css) |
| 2026-06-17 | Update script.js | Script güncelleme |
| 2026-06-17 | keşfet | Keşfet güncellemesi |
| 2026-06-17 | Update fixes.css | CSS düzeltme |
| 2026-06-17 | Keşfet hataları | Keşfet hata ayıklama |
| 2026-06-12~ | Takvim Güncellemesi | Maç takvimi |
| öncesi | takım oluşturma | Takım modülü |

---

## Aktif Kararlar / Kısıtlar

- Vanilla JS kalacak — framework yok, build tool yok
- MPA + SPA hibrit yapı korunacak
- Supabase tek backend
- `faz1.js` kademeli kaldırılacak ama henüz aktif (toast için hâlâ gerekli)
