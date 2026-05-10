// mobile-test.js — Sosyal Sporcu mobil uyumluluk testi
// node mobile-test.js
'use strict';

const { chromium, webkit } = require('playwright');

const BASE_URL = 'https://mmikail95.github.io/Sosyal-Sporcu';

// ── Cihaz profilleri ────────────────────────────────────────
const DEVICES = [
  {
    name: 'iPhone 14 Pro',
    browser: 'webkit',
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    deviceScaleFactor: 3,
  },
  {
    name: 'Samsung Galaxy S22',
    browser: 'chromium',
    viewport: { width: 360, height: 780 },
    userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-S906B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    deviceScaleFactor: 3,
  },
  {
    name: 'Safari Desktop (1024×768)',
    browser: 'webkit',
    viewport: { width: 1024, height: 768 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    isMobile: false,
    deviceScaleFactor: 2,
  },
];

// ── Test sayfaları ──────────────────────────────────────────
const PAGES = [
  { path: '/',         label: 'Ana Sayfa (index.html)'  },
  { path: '/explore/', label: 'Keşfet sayfası'           },
];

// ── Minimum tıklanabilir alan (px) ─────────────────────────
const MIN_TAP_SIZE = 44;

// ── Sonuç renklendirme ─────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

function pass(msg)  { console.log(`  ${GREEN}✅ ${msg}${RESET}`); }
function fail(msg)  { console.log(`  ${RED}❌ ${msg}${RESET}`); }
function warn(msg)  { console.log(`  ${YELLOW}⚠️  ${msg}${RESET}`); }
function info(msg)  { console.log(`  ${CYAN}ℹ  ${msg}${RESET}`); }

// ── Ana test fonksiyonu ─────────────────────────────────────
async function runTests() {
  const results = { pass: 0, fail: 0, warn: 0 };

  for (const device of DEVICES) {
    console.log(`\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}${CYAN}📱 ${device.name} (${device.viewport.width}×${device.viewport.height})${RESET}`);
    console.log(`${'━'.repeat(42)}`);

    const browserType = device.browser === 'webkit' ? webkit : chromium;
    const browser = await browserType.launch({ headless: true });
    const context = await browser.newContext({
      viewport: device.viewport,
      userAgent: device.userAgent,
      isMobile: device.isMobile,
      deviceScaleFactor: device.deviceScaleFactor,
      hasTouch: device.isMobile,
    });
    const page = await context.newPage();

    // Konsol hatalarını topla
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    for (const { path, label } of PAGES) {
      const url = BASE_URL + path;
      console.log(`\n  ${BOLD}📄 ${label}${RESET}`);

      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

        // ── T1: HTTP durum kodu ───────────────────────────────
        if (resp && resp.status() === 200) {
          pass(`HTTP 200 — Sayfa yüklendi`);
          results.pass++;
        } else {
          fail(`HTTP ${resp?.status()} — Sayfa yüklenemedi`);
          results.fail++;
          continue;
        }

        // JS yüklenmesi için kısa bekle
        await page.waitForTimeout(2500);

        // ── T2: Sayfa genişlik taşması ────────────────────────
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth   = device.viewport.width;
        if (bodyScrollWidth <= viewportWidth + 5) {
          pass(`Yatay kaydırma yok (scrollWidth: ${bodyScrollWidth}px)`);
          results.pass++;
        } else {
          fail(`Yatay taşma! scrollWidth=${bodyScrollWidth}px > viewport=${viewportWidth}px`);
          results.fail++;
        }

        // ── T3: Altıgen radar grafiği (canvas) ───────────────
        const chartInfo = await page.evaluate(() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          return { w: Math.round(rect.width), h: Math.round(rect.height), visible: rect.width > 0 && rect.height > 0 };
        });
        if (path === '/') {
          if (!chartInfo) {
            warn(`Radar grafiği (canvas) DOM'da bulunamadı — profil sekmesi açık olmayabilir`);
            results.warn++;
          } else if (chartInfo.visible && chartInfo.w >= 150) {
            pass(`Radar grafiği görünür: ${chartInfo.w}×${chartInfo.h}px`);
            results.pass++;
          } else if (chartInfo.visible) {
            warn(`Radar grafiği çok küçük: ${chartInfo.w}×${chartInfo.h}px (min 150px bekleniyor)`);
            results.warn++;
          } else {
            fail(`Radar grafiği gizli veya boyutu 0`);
            results.fail++;
          }
        }

        // ── T4: Tıklanabilir buton boyutları ─────────────────
        const smallButtons = await page.evaluate((minSize) => {
          const btns = Array.from(document.querySelectorAll('button, a, [role="button"], .nav-item, .feed-filter'));
          return btns
            .map(el => {
              const r = el.getBoundingClientRect();
              const text = (el.textContent || '').trim().slice(0, 40);
              return { w: Math.round(r.width), h: Math.round(r.height), text, visible: r.width > 0 && r.height > 0 };
            })
            .filter(b => b.visible && (b.w < minSize || b.h < minSize))
            .slice(0, 5);
        }, MIN_TAP_SIZE);

        if (smallButtons.length === 0) {
          pass(`Tüm butonlar tıklanabilir boyutta (≥${MIN_TAP_SIZE}px)`);
          results.pass++;
        } else {
          fail(`${smallButtons.length} buton çok küçük (<${MIN_TAP_SIZE}px):`);
          results.fail++;
          smallButtons.forEach(b => {
            console.log(`     ${RED}• "${b.text}" → ${b.w}×${b.h}px${RESET}`);
          });
        }

        // ── T5: Nav öğeleri çakışma testi ────────────────────
        const navItems = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('.nav-item, [data-target]'));
          return items.map(el => {
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
          }).filter(r => r.w > 0 && r.h > 0);
        });

        let overlapping = 0;
        for (let i = 0; i < navItems.length; i++) {
          for (let j = i + 1; j < navItems.length; j++) {
            const a = navItems[i], b = navItems[j];
            if (a.x < b.x + b.w && a.x + a.w > b.x &&
                a.y < b.y + b.h && a.y + a.h > b.y) {
              overlapping++;
            }
          }
        }
        if (overlapping === 0) {
          pass(`Nav öğeleri çakışmıyor (${navItems.length} öğe)`);
          results.pass++;
        } else {
          fail(`${overlapping} nav öğesi çakışıyor!`);
          results.fail++;
        }

        // ── T6: Font boyutu okunabilirlik ─────────────────────
        const tinyText = await page.evaluate(() => {
          const all = Array.from(document.querySelectorAll('p, span, label, h1, h2, h3, h4, button, a, td, th'));
          return all.filter(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0) return false;
            const fs = parseFloat(window.getComputedStyle(el).fontSize);
            return fs > 0 && fs < 11;
          }).map(el => ({
            tag: el.tagName,
            text: (el.textContent || '').trim().slice(0, 30),
            fs: parseFloat(window.getComputedStyle(el).fontSize)
          })).slice(0, 5);
        });

        if (tinyText.length === 0) {
          pass(`Font boyutları okunabilir (≥11px)`);
          results.pass++;
        } else {
          warn(`${tinyText.length} element çok küçük font kullanıyor:`);
          results.warn++;
          tinyText.forEach(t => {
            console.log(`     ${YELLOW}• <${t.tag}> "${t.text}" → ${t.fs}px${RESET}`);
          });
        }

        // ── T7: Medya sorguları yüklenmiş mi ─────────────────
        const hasResponsiveCSS = await page.evaluate(() => {
          return Array.from(document.styleSheets).some(ss => {
            try {
              return Array.from(ss.cssRules || []).some(r => r.media);
            } catch { return false; }
          });
        });
        if (hasResponsiveCSS) {
          pass(`Responsive CSS (media queries) aktif`);
          results.pass++;
        } else {
          warn(`Responsive CSS bulunamadı`);
          results.warn++;
        }

        // ── T8: JavaScript konsol hataları ───────────────────
        const pageErrors = consoleErrors.filter(e =>
          !e.includes('favicon') &&
          !e.includes('net::ERR_ABORTED') &&
          !e.includes('Supabase') &&  // auth hatası normal
          !e.includes('realtime')
        );
        if (pageErrors.length === 0) {
          pass(`JS konsol hatası yok`);
          results.pass++;
        } else {
          warn(`${pageErrors.length} JS konsol hatası:`);
          results.warn++;
          pageErrors.slice(0, 3).forEach(e => {
            console.log(`     ${YELLOW}• ${e.slice(0, 100)}${RESET}`);
          });
        }

        // ── T9: Explore sayfası sekme butonları ──────────────
        if (path === '/explore/') {
          const tabBtns = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.explore-tab-btn, [id^="etab-btn-"]'));
            return tabs.map(el => {
              const r = el.getBoundingClientRect();
              return { id: el.id, w: Math.round(r.width), h: Math.round(r.height) };
            });
          });
          if (tabBtns.length > 0) {
            const allOk = tabBtns.every(b => b.w >= MIN_TAP_SIZE && b.h >= MIN_TAP_SIZE);
            if (allOk) {
              pass(`Explore sekme butonları uygun boyutta`);
              results.pass++;
            } else {
              fail(`Explore sekme butonları çok küçük: ${JSON.stringify(tabBtns)}`);
              results.fail++;
            }
          } else {
            warn(`Explore sekme butonları DOM'da bulunamadı`);
            results.warn++;
          }

          // District filtre dropdown var mı?
          const districtFilter = await page.locator('#explore-district-filter').count();
          if (districtFilter > 0) {
            pass(`Bölge filtresi (#explore-district-filter) mevcut`);
            results.pass++;
          } else {
            fail(`Bölge filtresi bulunamadı`);
            results.fail++;
          }
        }

      } catch (err) {
        fail(`Sayfa yüklenirken hata: ${err.message}`);
        results.fail++;
      }
    }

    await browser.close();
  }

  // ── Özet ────────────────────────────────────────────────
  console.log(`\n${BOLD}${'═'.repeat(42)}${RESET}`);
  console.log(`${BOLD}TEST ÖZETI${RESET}`);
  console.log(`${'─'.repeat(42)}`);
  console.log(`  ${GREEN}✅ BAŞARILI : ${results.pass}${RESET}`);
  console.log(`  ${YELLOW}⚠️  UYARI    : ${results.warn}${RESET}`);
  console.log(`  ${RED}❌ HATA     : ${results.fail}${RESET}`);
  console.log(`${'═'.repeat(42)}\n`);

  process.exit(results.fail > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner hatası:', err);
  process.exit(1);
});
