/**
 * S107-C · **EL RECORRIDO CON SESIÓN REAL DE AURORA** — el gate que le ahorro
 * al founder.
 *
 * ═══ 🔴 QUÉ MIDE Y QUÉ NO — se lee ANTES que cualquier número ═════════════
 *
 * **SÍ mide:** que cada ruta monte con datos REALES · qué texto pinta en el
 * estado en que la familia la va a encontrar · qué llega y qué falta · errores
 * de consola que no sean ruido conocido.
 *
 * **NO mide, y por eso su verde NO es un gate:**
 * · **Nada visual.** No mide color, alineación, tamaño, contraste ni ritmo.
 *   *Lee `innerText`: una pantalla puede decir todo lo correcto y verse mal.*
 * · **Ninguna interacción que escriba.** No reserva, no paga, no carga carnet.
 * · **Ningún camino nativo.** Corre en RN-web: mapas, cámara y la física de la
 *   Hoja **no existen acá**.
 * · **Un solo aparato y un solo tamaño** (430×932). No prueba dispositivos.
 *
 * ── 🔴 NO TOCA DATOS DE AURORA ───────────────────────────────────────────
 * **Es de SOLO LECTURA por construcción:** navega por URL y lee texto.
 * **Jamás presiona un control que escriba** — no hay `click` en este archivo.
 * *Por eso no hace falta subtransacción: no hay nada que deshacer.* Si algún
 * día necesitara escribir, va en subtransacción que se deshace sola y con el
 * residuo medido, como hace A.
 *
 * ── LOS SECRETOS ─────────────────────────────────────────────────────────
 * La clave compartida de las cuentas de prueba **se lee del keychain al
 * momento** (convención de `unificar-claves-prueba.mjs`) y **no se imprime ni
 * se escribe en ningún lado**. La `anon` sale del arranque. **`service_role`
 * no se usa ni se pide.**
 */
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';

const REF = 'zyltipqscdsdsxnjclhp';
const URL_SB = `https://${REF}.supabase.co`;
const BASE = process.env.BASE ?? 'http://localhost:8091';
const EMAIL = process.env.CUENTA ?? 'guillo381+8@gmail.com';

const CLAVE = execFileSync(
  'security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' },
).trim();
const ANON = execFileSync('npx', ['supabase', 'projects', 'api-keys', '--project-ref', REF], {
  encoding: 'utf8',
}).match(/"api_key":"(eyJ[^"]*)"/)?.[1];

if (!CLAVE || !ANON) { console.error('🔴 falta un secreto — se aborta sin tocar nada'); process.exit(1); }

const sb = createClient(URL_SB, ANON);
const { data: sesion, error } = await sb.auth.signInWithPassword({ email: EMAIL, password: CLAVE });
if (error || sesion.session === null) { console.error(`🔴 sin sesión para ${EMAIL}: ${error?.message}`); process.exit(1); }
console.log(`✓ sesión real de ${EMAIL} (el token no se imprime)\n`);


/* Una mascota real de la familia — el lector la exige y sin ella la etapa 3 no
   puede pedir nada. */
const { data: mm } = await sb.from('mascotas').select('id').eq('nombre', 'Thor').limit(1);
const MASCOTA = mm?.[0]?.id ?? '';

/* La fecha se calcula: **jamás una constante**, que envejece y un día cae en el
   pasado — y entonces el recorrido mide el rebote de la víspera creyendo que
   mide la lista. */
const d = new Date(); d.setDate(d.getDate() + 3);
const FECHA = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const RUTAS = [
  ['/hogar', 'EL HOGAR · ¿aparece guardería en el rail?'],
  ['/hogar/guarderia', 'EL LOG · chips, pestañas y lista'],
  ['/explorar/guarderia', 'ETAPA 1 · elegir cómo y cuándo'],
  [`/explorar/guarderia/disponibles?modalidad=dia&fecha=${FECHA}&mascotaId=${MASCOTA}`,
   'ETAPA 3 · QUIÉN PUEDE · ¿la vitrina presenta al prestador?'],
  ['/guarderia/documentos', 'LOS DOCUMENTOS · donde la familia resuelve el rebote'],
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

/* La sesión se inyecta donde supabase-js la busca: su clave de localStorage. */
await page.goto(BASE + '/bienvenida', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(
  ([k, v]) => window.localStorage.setItem(k, v),
  [`sb-${REF}-auth-token`, JSON.stringify(sesion.session)],
);

let fallos = 0;
for (const [ruta, nombre] of RUTAS) {
  const errores = [];
  const anota = (e) => errores.push(String(e).slice(0, 180));
  page.on('pageerror', anota);
  page.on('console', (m) => { if (m.type() === 'error') anota(m.text()); });

  await page.goto(BASE + ruta, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => anota('NAV: ' + e.message));
  await page.waitForTimeout(2500);

  const texto = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').trim();
  /* Ruido conocido y MEDIDO (ver `recorrido-guarderia.mjs`): el aviso `%s` de
     RN-web está en `/hogar`, que no se tocó en esta sesión. */
  const duros = errores.filter((e) => !/Require cycle|useNativeDriver|deprecated|shadow\*|pointerEvents|does not recognize the/i.test(e));
  const marca = duros.length > 0 || texto.length === 0 ? '✗' : '✓';
  if (marca === '✗') fallos++;

  console.log(`${marca} ${nombre}\n   ${texto.slice(0, 700)}`);
  if (duros.length > 0) console.log(`   🔴 ${duros.slice(0, 2).join(' | ')}`);
  console.log('');
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
}

await browser.close();
await sb.auth.signOut();
console.log(fallos === 0 ? '✓ sin pantallas rotas' : `✗ ${fallos} con problema`);
console.log('⚠️ NO mide nada visual, ninguna escritura y ningún camino nativo. Su verde NO es un gate.');
