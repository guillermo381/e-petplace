/**
 * 🔴 CONTRADICCIÓN MEDIDA — el founder ve la línea VACÍA, yo reporté 32 chars.
 *
 * No se resuelve por argumento. Los cinco puntos que el founder pidió, en
 * orden, sobre el archivo REAL y con su ruta absoluta resuelta.
 *
 * R6 sigue rigiendo: el valor NO se transcribe. Se muestra su forma —largo y
 * los últimos 4— que alcanza para decir «existe» y no alcanza para usarlo.
 *
 * El punto ⑤ es el que cierra el caso: si con ese valor el login entra, el
 * valor existe. Si no entra, mi reporte anterior era falso y lo digo.
 */
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { linea, guardarSeg2 } from './lib-seg2.mjs';

const RUTA_REL = 'apps/cliente/.env.local';
const RUTA_ABS = resolve(process.cwd(), RUTA_REL);

linea('\n══ ① LA RUTA QUE LEÍ ══\n');
linea(`  process.cwd() ......... ${process.cwd()}`);
linea(`  ruta relativa usada ... ${RUTA_REL}`);
linea(`  RUTA ABSOLUTA ......... ${RUTA_ABS}`);
linea(`  ¿existe? .............. ${existsSync(RUTA_ABS)}`);
linea('');
linea('  ⚠️ Y la ruta que mis scripts usan de verdad está HARDCODEADA absoluta:');
linea('     /Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local');

// ── ② TODOS los .env* del árbol de proyectos ──────────────────────────────
linea('\n══ ② TODOS LOS .env* (monorepo y vecinos) ══\n');
const RAICES = [
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-B',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-C',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s91-B',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s91-D',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-v2',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-admin',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-prestadores',
];
const SUBS = ['', 'apps/cliente', 'apps/prestador', 'supabase', 'supabase/dev'];
const hallados = [];
for (const raiz of RAICES) {
  if (!existsSync(raiz)) continue;
  for (const sub of SUBS) {
    const dir = join(raiz, sub);
    if (!existsSync(dir)) continue;
    let entradas = [];
    try {
      entradas = readdirSync(dir);
    } catch {
      continue;
    }
    for (const e of entradas) {
      if (!e.startsWith('.env')) continue;
      const p = join(dir, e);
      try {
        const st = statSync(p);
        if (!st.isFile()) continue;
        const txt = readFileSync(p, 'utf8');
        const tieneDemo = /EXPO_PUBLIC_DEMO_PASSWORD/.test(txt);
        hallados.push({ path: p, bytes: st.size, mtime: st.mtime.toISOString(), tieneDemo });
      } catch {
        /* ignorar */
      }
    }
  }
}
for (const h of hallados) {
  linea(`  ${h.tieneDemo ? '🔶' : '  '} ${h.path}`);
  linea(`       ${String(h.bytes).padStart(6)} bytes · mtime ${h.mtime.slice(0, 19)}${h.tieneDemo ? '  ← tiene EXPO_PUBLIC_DEMO_PASSWORD' : ''}`);
}
linea(`\n  total: ${hallados.length} archivo(s) · con la variable del demo: ${hallados.filter((h) => h.tieneDemo).length}`);

// ── ③ md5 y líneas del archivo que leí ────────────────────────────────────
const bruto = readFileSync(RUTA_ABS);
const texto = bruto.toString('utf8');
const lineas = texto.split('\n');
linea('\n══ ③ EL ARCHIVO QUE LEÍ ══\n');
linea(`  md5 ........ ${createHash('md5').update(bruto).digest('hex')}`);
linea(`  bytes ...... ${bruto.length}`);
linea(`  líneas ..... ${lineas.length} (contando la última vacía si la hay)`);
linea(`  mtime ...... ${statSync(RUTA_ABS).mtime.toISOString()}`);

// ── ④ LA LÍNEA 6, EN FORMA SEGURA ─────────────────────────────────────────
linea('\n══ ④ LA LÍNEA 6, SIN TRANSCRIBIR EL SECRETO ══\n');
const l6 = lineas[5];
if (l6 === undefined) {
  linea('  🔴 NO EXISTE una línea 6 en este archivo.');
} else {
  const igual = l6.indexOf('=');
  const nombre = igual === -1 ? '(sin signo =)' : l6.slice(0, igual);
  const valor = igual === -1 ? '' : l6.slice(igual + 1);
  linea(`  contenido crudo de la línea 6, largo total: ${l6.length} caracteres`);
  linea(`  nombre de variable ..... «${nombre}»`);
  linea(`  ¿hay signo «=»? ........ ${igual !== -1 ? 'SÍ (en la posición ' + igual + ')' : 'NO'}`);
  linea(`  largo del valor ........ ${valor.length}`);
  if (valor.length === 0) {
    linea('  🔴 EL VALOR ESTÁ VACÍO.');
  } else {
    const enmascarado = 'x'.repeat(Math.max(0, valor.length - 4)) + valor.slice(-4);
    linea(`  valor enmascarado ...... ${enmascarado}`);
  }
}
linea('\n  (y las 7 líneas del archivo, por nombre de variable y largo de valor)');
lineas.forEach((l, i) => {
  const ig = l.indexOf('=');
  if (l.trim() === '') return linea(`     ${i + 1}: (vacía)`);
  if (ig === -1) return linea(`     ${i + 1}: [texto sin «=»] ${l.slice(0, 52)}`);
  linea(`     ${i + 1}: ${l.slice(0, ig)} = <valor de ${l.length - ig - 1} caracteres>`);
});

// ── ⑤ EL QUE CIERRA EL CASO: el login, en vivo, con ESE valor ─────────────
linea('\n══ ⑤ EL LOGIN, EN VIVO, CON LA CLAVE DE ESE ARCHIVO ══\n');
const url = texto.match(/^EXPO_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const anon = texto.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
const mail = texto.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)?.[1]?.trim();
const pw = texto.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)?.[1] ?? '';

linea(`  email leído ......... ${mail}`);
linea(`  clave leída ......... ${pw.length === 0 ? '(VACÍA)' : `${pw.length} caracteres, termina en …${pw.slice(-4)}`}`);

if (pw.trim().length === 0) {
  linea('\n  🔴 La clave está vacía ⇒ NO se intenta el login. Mi reporte anterior sería FALSO.');
} else {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: mail, password: pw.trim() }),
  });
  const j = await r.json().catch(() => ({}));
  linea(`\n  POST /auth/v1/token?grant_type=password`);
  linea(`  → HTTP ${r.status}`);
  if (j.access_token) {
    linea(`  → ENTRA. access_token de ${j.access_token.length} caracteres, user ${j.user?.id}`);
    linea('\n  ✅ EL VALOR EXISTE Y ES VÁLIDO: el login entra con la clave de ESTE archivo.');
  } else {
    linea(`  → NO entra: ${JSON.stringify(j).slice(0, 200)}`);
    linea('\n  🔴 NO ENTRA ⇒ mi reporte anterior era falso y queda declarado como error.');
  }
}

guardarSeg2('p0b-contradiccion.json', {
  rutaAbsoluta: RUTA_ABS,
  cwd: process.cwd(),
  md5: createHash('md5').update(bruto).digest('hex'),
  lineas: lineas.length,
  envs: hallados,
});
linea('');
