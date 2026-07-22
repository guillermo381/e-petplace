// S74-A T3 · D-497 — re-medición del arranque del Hogar (sesión demo, web)
// Réplica del método S73-A ítem 7: contar TODOS los requests al host de
// Supabase durante la carga fresca del Hogar, agrupados por endpoint.
// SOLO lectura de UI. Uso: node medir-hogar-s74.mjs
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const REPO = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const BASE = 'http://localhost:8081';
const env = Object.fromEntries(
  readFileSync(`${REPO}/apps/cliente/.env.local`, 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const SUPA = new URL(env.EXPO_PUBLIC_SUPABASE_URL).host;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

// 1) login demo (deja la sesión en storage)
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(env.EXPO_PUBLIC_DEMO_EMAIL);
await page.locator('input[type="password"]').fill(env.EXPO_PUBLIC_DEMO_PASSWORD);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000); // Hogar carga tras login

// 2) medición: recarga FRESCA del Hogar contando requests a Supabase
const hits = [];
page.on('request', (req) => {
  const u = new URL(req.url());
  if (u.host === SUPA) hits.push({ path: u.pathname, method: req.method() });
});
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(8000); // colas post-networkidle (polls iniciales, fotos)

// 3) agrupar por endpoint
const grupos = new Map();
for (const h of hits) {
  // /rest/v1/<tabla> · /rest/v1/rpc/<fn> · /auth/v1/<x> · /storage/v1/...
  const m = h.path.match(/^\/(rest\/v1\/rpc\/[^/]+|rest\/v1\/[^/]+|auth\/v1\/[^/]+|storage\/v1\/object\/[^/]+\/[^/]+|storage\/v1\/[^/]+)/);
  const key = `${h.method} ${m ? m[1] : h.path}`;
  grupos.set(key, (grupos.get(key) ?? 0) + 1);
}
console.log(`TOTAL requests a Supabase en el arranque del Hogar: ${hits.length}`);
for (const [k, n] of [...grupos.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)} × ${k}`);
}
await browser.close();
