/**
 * S92-BIS · B2 — LLAVES Y SECRETOS.
 *
 * `service_role` saltea TODA la RLS que S92 acaba de arreglar. Si esa llave
 * está en un bundle, en el repo o en el historial, todo el loop de permisos es
 * decorativo.
 *
 * ── SE BUSCA POR FORMA, NO POR NOMBRE (orden del arranque) ───────────────────
 * Una llave renombrada sigue siendo la llave. Así que se buscan **JWTs** por su
 * forma (`eyJ….eyJ….firma`) y se **decodifica su claim `role`** — eso distingue
 * `anon` (pública por diseño) de `service_role` (la maestra) sin depender de
 * cómo se llame la variable que la guarda.
 *
 * ── R6 · NINGÚN SECRETO SE TRANSCRIBE ───────────────────────────────────────
 * Todo se reporta por identidad y estado: dónde vive, qué rol declara, largo y
 * últimos 4. Nunca el valor.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { guardarSeg2, RAIZ, huella, rolDeJwt, linea } from './lib-seg2.mjs';

const ejecutar = promisify(execFile);
const RE_JWT = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;

async function git(args, cwd = RAIZ) {
  try {
    const { stdout } = await ejecutar('git', args, { cwd, maxBuffer: 128 * 1024 * 1024 });
    return stdout;
  } catch (e) {
    return e.stdout ?? '';
  }
}

// ── ① JWTs EN EL ÁRBOL VERSIONADO ───────────────────────────────────────────
linea('\n══ B2 · ① JWTs EN EL ÁRBOL VERSIONADO ══\n');
const enArbol = (await git(['grep', '-I', '-o', '-E', 'eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+']))
  .split('\n')
  .filter(Boolean);

const porRol = {};
for (const l of enArbol) {
  const i = l.indexOf(':');
  const archivo = l.slice(0, i);
  const token = l.slice(i + 1);
  const { role } = rolDeJwt(token);
  (porRol[role] ??= []).push({ archivo, huella: huella(token) });
}
for (const [rol, lista] of Object.entries(porRol)) {
  const alarma = rol === 'service_role' ? '🔴🔴🔴' : rol === 'anon' ? '✅' : '⚠️';
  linea(`  ${alarma} claim role = «${rol}» — ${lista.length} ocurrencia(s)`);
  for (const x of [...new Map(lista.map((y) => [y.archivo, y])).values()]) {
    linea(`       ${x.archivo}`);
    linea(`          ${x.huella}`);
  }
}
if (enArbol.length === 0) linea('  (ningún JWT en el árbol versionado)');
linea(
  porRol.service_role
    ? '\n  🔴 HAY UNA LLAVE service_role EN EL REPO — todo el loop de permisos queda anulado.'
    : '\n  ✅ NINGÚN `service_role` en el árbol versionado. Los que hay declaran `anon`: pública por diseño.',
);

// ── ② JWTs EN ARCHIVOS NO VERSIONADOS (.env*) ───────────────────────────────
linea('\n══ ② JWTs EN LOS `.env*` (no versionados) ══\n');
const BASE = '/Users/guillo381gmail.com/proyectos/ePetPlace';
const envs = [];
function buscarEnv(dir, nivel) {
  if (nivel > 4) return;
  let e = [];
  try {
    e = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const x of e) {
    if (x.isDirectory()) {
      if (['node_modules', '.git', 'ios', 'android', '.expo', 'dist'].includes(x.name)) continue;
      buscarEnv(join(dir, x.name), nivel + 1);
    } else if (x.isFile() && x.name.startsWith('.env')) envs.push(join(dir, x.name));
  }
}
buscarEnv(BASE, 0);

const hallazgosEnv = [];
for (const p of envs) {
  const txt = readFileSync(p, 'utf8');
  for (const m of txt.match(RE_JWT) ?? []) {
    const { role } = rolDeJwt(m);
    hallazgosEnv.push({ archivo: p.replace(BASE + '/', ''), role, huella: huella(m) });
  }
}
const rolesEnv = {};
for (const h of hallazgosEnv) (rolesEnv[h.role] ??= []).push(h);
for (const [rol, lista] of Object.entries(rolesEnv)) {
  const alarma = rol === 'service_role' ? '🔴' : '✅';
  linea(`  ${alarma} «${rol}» en ${lista.length} archivo(s) .env:`);
  for (const x of lista) linea(`       ${x.archivo}  ·  ${x.huella}`);
}
if (hallazgosEnv.length === 0) linea('  (ningún JWT en los .env)');

// ── ③ ¿ALGÚN .env ESTÁ TRACKEADO POR GIT? ──────────────────────────────────
linea('\n══ ③ ¿ALGÚN `.env` ESTÁ VERSIONADO? ══\n');
const trackeados = (await git(['ls-files', '--', '*.env', '*.env.*', '.env*'])).split('\n').filter(Boolean);
linea(trackeados.length === 0 ? '  ✅ ninguno trackeado' : `  🔴 ${trackeados.length} trackeado(s):`);
for (const t of trackeados) linea(`       ${t}`);

// ── ④ EL HISTORIAL: ¿alguna vez se commiteó un secreto? ────────────────────
linea('\n══ ④ EL HISTORIAL DE GIT (un secreto commiteado sigue vivo) ══\n');
for (const [rotulo, aguja] of [
  ['JWT (header HS256 típico)', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'],
  ['la cadena `service_role`', 'service_role'],
  ['clave de Google (AIza)', 'AIzaSy'],
  ['token de Meta (EAA)', 'EAA'],
  ['clave de Resend (re_)', 're_'],
]) {
  const commits = (await git(['log', '--all', '--oneline', '-S', aguja])).split('\n').filter(Boolean);
  linea(`  ${commits.length === 0 ? '✅' : '⚠️'} ${rotulo}: ${commits.length} commit(s) donde aparece o desaparece`);
  for (const c of commits.slice(0, 6)) linea(`       ${c.slice(0, 116)}`);
  if (commits.length > 6) linea(`       … y ${commits.length - 6} más`);
}

// ── ⑤ OTROS SECRETOS EN EL ÁRBOL, por forma ────────────────────────────────
linea('\n══ ⑤ OTRAS FORMAS DE SECRETO EN EL ÁRBOL VERSIONADO ══\n');
for (const [rotulo, patron] of [
  ['Google API key', 'AIzaSy[A-Za-z0-9_-]{20,}'],
  ['Meta / WhatsApp', 'EAA[A-Za-z0-9]{20,}'],
  ['Resend', 're_[A-Za-z0-9_]{20,}'],
  ['Supabase secret (sb_)', 'sb_secret_[A-Za-z0-9_-]{10,}'],
  ['clave privada PEM', 'BEGIN [A-Z ]*PRIVATE KEY'],
]) {
  const hits = (await git(['grep', '-I', '-l', '-E', patron])).split('\n').filter(Boolean);
  linea(`  ${hits.length === 0 ? '✅' : '🔴'} ${rotulo}: ${hits.length} archivo(s)`);
  for (const h of hits.slice(0, 8)) linea(`       ${h}`);
}

guardarSeg2('b2-secretos.json', { enArbol: porRol, envs: hallazgosEnv, trackeados });
linea('');
