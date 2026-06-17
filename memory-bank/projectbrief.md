# Proje Özeti — Sosyal Sporcu

## Ne Bu?
Futbol oyuncuları için sosyal bir platform. Oyuncular profil oluşturur, takıma katılır, maç organize eder, birbirini puanlar ve sosyal akışta paylaşım yapar. FIFA Ultimate Team mantığında bir "karakter kartı" sistemi var.

## Temel Hedef
Amatör futbolcuların dijital kimliğini oluşturduğu, maç bulup organize ettiği, takım kurduğu ve topluluk içinde değerlendirdiği bir uygulama.

## Kapsam
- Tek geliştirici projesi (Mikail)
- Vanilla HTML/CSS/JS — build tool yok
- Backend: Supabase (PostgreSQL + Auth + Realtime)
- Mobil uyumlu (son sprint telefon hatalarını düzeltti)

## Beş Ana Bölüm
1. **Karakterim** — profil kartı, 6 yetenek puanı (teknik/şut/pas/hız/fizik/kondisyon), GEN skoru, maç geçmişi, topluluk puanlamaları
2. **Takımım** — takım kurma/yönetme, kadro, taktik tahtası
3. **Maç Merkezi** — maç oluşturma, takvim, maç sonuçları
4. **Akış** — sosyal feed, paylaşımlar, yorumlar, beğeniler
5. **Keşfet** — oyuncu/takım/arkadaş arama ve filtreleme

## Teknik Kısıtlar
- `file://` protokolü çalışmaz → HTTP server gerekli (python -m http.server 3000)
- TypeScript yok, test framework yok
- Supabase RLS aktif
