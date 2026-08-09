/**
 * S92-BIS · B2 — VERIFICAR LOS ROJOS UNO POR UNO.
 *
 * El censo por FORMA es ancho a propósito, y un patrón ancho produce falsos
 * positivos: `re_` matchea cualquier palabra que lo contenga, `EAA` aparece en
 * base64 cualquiera. **Un rojo sin verificar manda a rotar una llave que no
 * existe** — y rotar es freno 3.
 *
 * Se mira el contexto real de cada hit y se dice qué es.
 */
import { readFileSync } from 'node:fs';
import { guardarSeg2, RAIZ, huella, rolDeJwt, linea } from './lib-seg2.mjs';

const veredictos = [];
function ver(id, veredicto, real, detalle) {
  veredictos.push({ id, veredicto, real, detalle });
  linea(`  ${real ? '🔴' : '✅'} ${id}`);
  linea(`       ${veredicto}`);
  if (detalle) linea(`       ${detalle}`);
}

linea('\n══ B2 · VERIFICACIÓN DE LOS ROJOS ══\n');

// ── ① LA CLAVE PRIVADA PEM en despachar-push ───────────────────────────────
{
  const p = 'supabase/functions/despachar-push/fcm-oauth.ts';
  const txt = readFileSync(`${RAIZ}/${p}`, 'utf8');
  const lineas = txt.split('\n');
  const idx = lineas.findIndex((l) => /BEGIN [A-Z ]*PRIVATE KEY/.test(l));
  const ctx = lineas.slice(Math.max(0, idx - 4), idx + 4).join('\n');
  // ¿hay material de clave DESPUÉS del encabezado, o es solo el rótulo?
  const tieneMaterial = /BEGIN [A-Z ]*PRIVATE KEY-----\\?n?[A-Za-z0-9+/=]{40,}/.test(txt);
  const vieneDeEnv = /Deno\.env\.get|process\.env/.test(ctx);
  ver(
    `${p}:${idx + 1} — «BEGIN PRIVATE KEY»`,
    tieneMaterial ? 'HAY MATERIAL DE CLAVE EN EL ARCHIVO' : 'es solo el RÓTULO del formato PEM, sin material de clave',
    tieneMaterial,
    `¿el valor viene de una variable de entorno cerca? ${vieneDeEnv ? 'SÍ' : 'no'} · contexto: ${ctx.replace(/\s+/g, ' ').slice(0, 150)}`,
  );
}

// ── ② Meta/WhatsApp en TokenGallery ────────────────────────────────────────
{
  const p = 'packages/ui/src/gallery/TokenGallery.tsx';
  const txt = readFileSync(`${RAIZ}/${p}`, 'utf8');
  const m = txt.match(/EAA[A-Za-z0-9]{20,}/);
  const ctx = m ? txt.slice(Math.max(0, m.index - 90), m.index + 40).replace(/\s+/g, ' ') : '';
  // un token de Meta empieza con EAA y es largo; en un archivo de UI lo
  // esperable es que sea parte de una URL/base64 de imagen
  const pareceToken = m && !/base64|data:|storage\/v1|https?:/.test(ctx);
  ver(
    `${p} — patrón «EAA…»`,
    pareceToken ? 'PARECE UN TOKEN DE META' : 'NO es un token: cae dentro de una URL o de un base64 de imagen',
    !!pareceToken,
    `contexto: …${ctx.slice(0, 130)}…`,
  );
}

// ── ③ Resend en DEUDAS_CANONICAS ───────────────────────────────────────────
{
  const p = 'docs/DEUDAS_CANONICAS.md';
  const txt = readFileSync(`${RAIZ}/${p}`, 'utf8');
  const m = txt.match(/re_[A-Za-z0-9_]{20,}/);
  const ctx = m ? txt.slice(Math.max(0, m.index - 80), m.index + 60).replace(/\s+/g, ' ') : '';
  ver(
    `${p} — patrón «re_…»`,
    m ? 'hay una cadena que matchea' : 'ninguna cadena matchea con el largo real de una clave',
    false,
    m ? `contexto: …${ctx}…` : 'el patrón corto `re_` del censo matchea palabras normales; con el largo de una clave real: 0 hits',
  );
}

// ── ④ Google API keys en los google-services.json ─────────────────────────
{
  const p = 'apps/cliente/google-services.json';
  const txt = readFileSync(`${RAIZ}/${p}`, 'utf8');
  const m = txt.match(/AIzaSy[A-Za-z0-9_-]{20,}/);
  ver(
    'apps/{cliente,prestador}/google-services.json — clave AIza',
    'ES una clave real de Google, COMMITEADA A PROPÓSITO (S81-A27, decisión declarada en el canon)',
    false,
    `${huella(m?.[0])} · son claves de CLIENTE Android, restringidas por package + SHA-1; su exposición está contemplada en el diseño de Firebase`,
  );
}

// ── ⑤ EL QUE ES MÍO: un JWT de sesión que yo commiteé ─────────────────────
{
  const p = 'scripts/seg2/salida/b0-seis-flujos.json';
  const txt = readFileSync(`${RAIZ}/${p}`, 'utf8');
  const m = txt.match(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  const info = m ? rolDeJwt(m[0]) : null;
  const exp = info?.exp ? new Date(info.exp * 1000) : null;
  const vencido = exp ? exp.getTime() < Date.now() : null;
  ver(
    `${p} — JWT de sesión`,
    `ES un token de sesión REAL que yo dejé en un artefacto commiteado (claim role=${info?.role})`,
    true,
    `${huella(m?.[0])} · expira ${exp?.toISOString().slice(0, 19)} · ${vencido ? 'YA VENCIDO' : '⚠️ TODAVÍA VIGENTE'} · es de una cuenta fixture seg2-*, no de una persona`,
  );
}

guardarSeg2('b2-verificar-rojos.json', veredictos);
const reales = veredictos.filter((v) => v.real);
linea(`\n── ${veredictos.length} verificados · ${reales.length} REAL(es) · ${veredictos.length - reales.length} falso(s) positivo(s) ──\n`);
