import { chromium } from 'playwright-core';

const targets = [
  { name: 'prestador', url: 'http://localhost:8081/gallery' },
  { name: 'cliente',   url: 'http://localhost:8082/gallery' },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 420, height: 1400 } });
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await page.goto(t.url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(3000);
  const texto = await page.evaluate(() => document.body.innerText);
  const busca = ['Design Tokens v4', 'Paleta', 'Tipografía', 'Dosificación asimétrica', 'tema activo: light', '#ff00af'];
  console.log(`\n== ${t.name} (${t.url}) ==`);
  for (const b of busca) console.log(`  ${texto.includes(b) ? '✓' : '✗ FALTA'} "${b}"`);
  // toggle de tema: click en Oscuro y verificar
  const oscuro = page.getByText('Oscuro', { exact: true }).first();
  await oscuro.click();
  await page.waitForTimeout(800);
  const texto2 = await page.evaluate(() => document.body.innerText);
  console.log(`  ${texto2.includes('tema activo: dark') ? '✓' : '✗ FALTA'} toggle → "tema activo: dark"`);
  const memorial = page.getByText('Memorial', { exact: true }).first();
  await memorial.click();
  await page.waitForTimeout(800);
  const texto3 = await page.evaluate(() => document.body.innerText);
  console.log(`  ${texto3.includes('tema activo: memorial') ? '✓' : '✗ FALTA'} toggle → "tema activo: memorial"`);
  console.log(`  errores JS: ${errores.length === 0 ? 'ninguno' : errores.slice(0, 3).join(' | ')}`);
  // capturas por tema
  await page.getByText('Claro', { exact: true }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `/tmp/b2-${t.name}-light.png`, fullPage: false });
  await oscuro.click(); await page.waitForTimeout(600);
  await page.screenshot({ path: `/tmp/b2-${t.name}-dark.png`, fullPage: false });
  await memorial.click(); await page.waitForTimeout(600);
  await page.screenshot({ path: `/tmp/b2-${t.name}-memorial.png`, fullPage: false });
  await page.close();
}
await browser.close();
console.log('\ncapturas en /tmp/b2-*.png');
