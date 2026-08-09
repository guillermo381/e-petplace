/**
 * B4 (v2) · ¿HAY LOCKOUT POR CUENTA, O SOLO RATE LIMIT POR IP?
 *
 * ── EL ERROR DE LA v1, QUE EL FOUNDER CAZÓ ──────────────────────────────────
 * La v1 hizo 12 intentos fallidos, no vio ningún 429 y reportó «sin corte».
 * **Eso no probó ausencia de límite: probó que 12 < 30**, que es el tope de
 * «sign-ups and sign-ins» por IP en 5 minutos. *Un verde que responde otra
 * pregunta* — Regla 4, y van varias en estas dos sesiones.
 *
 * ── EL DISCRIMINADOR ────────────────────────────────────────────────────────
 * Los dos mecanismos se distinguen por **a quién frenan**:
 *   · **lockout por CUENTA** → tras N fallos contra la cuenta A, **A** queda
 *     bloqueada aunque la contraseña sea correcta; **otra cuenta desde la misma
 *     IP sigue entrando**.
 *   · **rate limit por IP** → tras N requests, **TODO** rebota desde esa IP,
 *     sin importar la cuenta.
 *
 * Así que se prueban **dos cuentas distintas desde la misma IP**, y después se
 * espera a que la ventana de IP se cierre para preguntar de nuevo. Sin esa
 * segunda pregunta no se puede separar «bloqueada» de «todavía rate-limiteada».
 *
 * ⚠️ Este script **gasta cuota de auth a propósito**: llega al 429 para medir
 * dónde está. Corre una sola vez.
 */
import { readFileSync } from 'node:fs';
import { guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const MAIL_A = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const PW_A = env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();
const MAIL_B = 'demo-vet@epetplace.dev'; // otra cuenta real, para separar IP de cuenta

const intentar = async (email, password) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, code: j.error_code ?? j.error ?? '', ok: !!j.access_token };
};

const registro = [];
linea('\n══ B4 (v2) · ¿LOCKOUT POR CUENTA O RATE LIMIT POR IP? ══\n');

// ── ① BASELINE: la clave correcta entra ───────────────────────────────────
{
  const r = await intentar(MAIL_A, PW_A);
  linea(`  ① baseline · clave CORRECTA en A → HTTP ${r.status} ${r.ok ? 'ENTRA ✅' : '⚠️ no entra'}`);
  registro.push({ fase: 'baseline', ...r });
  if (!r.ok) {
    linea('\n  ⚠️ La cuenta ya está frenada de una corrida previa. Esperá 5 minutos y repetí.\n');
    process.exit(0);
  }
}

// ── ② FALLOS SEGUIDOS hasta el 429, contando ──────────────────────────────
linea('\n  ② fallos seguidos contra A, hasta que algo corte…');
let corte = null;
let n = 0;
for (let i = 1; i <= 40; i++) {
  const r = await intentar(MAIL_A, `clave-mala-${i}`);
  n = i;
  registro.push({ fase: 'fallo', i, ...r });
  if (r.status === 429) {
    corte = i;
    break;
  }
}
linea(
  corte
    ? `     cortó con 429 en el intento ${corte}`
    : `     40 intentos SIN 429 (el tope por IP no se alcanzó o no existe)`,
);

// ── ③ EL DISCRIMINADOR: ¿qué pasa con la clave CORRECTA, y con OTRA cuenta?
linea('\n  ③ el discriminador — inmediatamente después del corte:');
{
  const rA = await intentar(MAIL_A, PW_A);
  linea(`     A con clave CORRECTA .... HTTP ${rA.status} ${rA.code} ${rA.ok ? 'ENTRA' : 'NO entra'}`);
  const rB = await intentar(MAIL_B, 'lo-que-sea');
  linea(`     B (otra cuenta) ......... HTTP ${rB.status} ${rB.code}`);
  registro.push({ fase: 'post-corte-A', ...rA }, { fase: 'post-corte-B', ...rB });

  if (rA.status === 429 && rB.status === 429) {
    linea('\n     ⇒ las DOS cuentas rebotan 429 ⇒ el freno es POR IP, no por cuenta.');
  } else if (rA.status !== 429 && rA.ok === false && rB.status !== 429) {
    linea('\n     ⇒ A no entra con clave correcta y B sí responde ⇒ HAY LOCKOUT POR CUENTA.');
  }
}

// ── ④ LA SEGUNDA PREGUNTA: cuando la ventana de IP se cierra, ¿A entra? ───
linea('\n  ④ esperando a que la ventana por IP se cierre (5 min)…');
linea('     (sin esta espera no se puede separar «cuenta bloqueada» de «IP frenada»)');
await new Promise((r) => setTimeout(r, 5 * 60 * 1000 + 15000));

{
  const rA = await intentar(MAIL_A, PW_A);
  linea(`\n     A con clave CORRECTA, pasada la ventana → HTTP ${rA.status} ${rA.ok ? 'ENTRA ✅' : '🔴 NO entra'}`);
  registro.push({ fase: 'post-ventana-A', ...rA });
  linea(
    rA.ok
      ? '\n  ⇒ **NO HAY LOCKOUT POR CUENTA.** El único freno es el rate limit por IP,\n     y se libera solo al pasar la ventana. Los fallos NO dejan marca en la cuenta.'
      : '\n  ⇒ la cuenta sigue sin entrar pasada la ventana ⇒ hay algo POR CUENTA.',
  );
}

guardarSeg2('b4-lockout.json', { corte, intentos: n, registro });
linea('');
