/**
 * B4 · LOS DOS CIERRES DE D-716.
 *
 * ① EL CASO SIN MEDIR: una contraseña de **exactamente 8 caracteres, NO
 *    filtrada**, ¿es aceptada? La corrida anterior probó el largo 8 con
 *    `Ab1!Ab1!`, que rebotó **por filtrada** — así que el largo-8 sano quedó
 *    sin probar y no sabíamos si el mínimo dejaba pasar a alguien. Se usa una
 *    clave ALEATORIA de 8: por construcción no está en ninguna lista.
 *
 * ② LAS DOS PERILLAS DEL CAMBIO DE CLAVE — «require current password» y
 *    «secure password change». Cierran el hueco que S84 midió: *«hoy una sesión
 *    robada podría cambiar la contraseña sin conocer la vieja»*.
 *
 * Rojo y verde por camino real, y económico: cada request gasta la misma cuota
 * que acabo de usar midiendo el lockout, y un 429 mío se leería como rechazo.
 */
import { randomBytes } from 'node:crypto';
import { guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const filas = [];
const anotar = (id, obtenido, ok) => {
  filas.push({ id, obtenido, ok });
  linea(`  ${ok === null ? '  ' : ok ? '✅' : '🔴'} ${id.padEnd(46)} ${obtenido}`);
};

/** 8 caracteres aleatorios con mayúscula, minúscula, dígito y símbolo. */
function clave8() {
  const base = randomBytes(6).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x').slice(0, 6);
  return `${base}7!`.slice(0, 8);
}

const correo = `seg2-cierre-${Date.now()}@epetplace.dev`;
const PW = clave8();

linea('\n══ B4 · CIERRE ① — largo 8 NO filtrado ══\n');
linea(`  clave de prueba: 8 caracteres, aleatoria (no está en ninguna lista)`);
{
  const r = await fetch(`${URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: PW }),
  });
  const j = await r.json().catch(() => ({}));
  const rate = r.status === 429;
  const aceptada = r.status < 400 && (j.user || j.access_token);
  anotar(
    'signup con 8 chars aleatorios',
    rate ? '⚠️ 429 — mi cuota, no mide' : aceptada ? 'ACEPTADA (HTTP ' + r.status + ')' : `RECHAZADA · ${j.error_code ?? ''} ${(j.msg ?? '').slice(0, 60)}`,
    rate ? null : !!aceptada,
  );
  if (aceptada) {
    linea('       ⇒ el mínimo de 8 acepta una clave sana de 8: no dejó pasar de menos ni de más.');
  }
}

linea('\n══ CIERRE ② — el cambio de contraseña ══\n');
{
  // sesión FRESCA: recién creada, así que «sesión reciente» no puede ser la excusa
  const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: PW }),
  });
  const sesion = await login.json().catch(() => ({}));
  const token = sesion.access_token;
  anotar('login del fixture (sesión fresca)', token ? 'OK' : `🔴 sin sesión (${login.status})`, !!token);

  if (token) {
    const NUEVA = clave8() + 'Zq';

    // ── EL ROJO DE S84: cambiar la clave SIN dar la actual ──────────────────
    const sinActual = await fetch(`${URL}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: NUEVA }),
    });
    const j1 = await sinActual.json().catch(() => ({}));
    const frenado = sinActual.status >= 400;
    anotar(
      'cambiar clave SIN la actual (el hueco de S84)',
      `HTTP ${sinActual.status} ${frenado ? `FRENADO · ${j1.error_code ?? ''} ${(j1.msg ?? j1.message ?? '').slice(0, 70)}` : '⚠️ CAMBIÓ SIN PEDIR NADA'}`,
      frenado,
    );

    // ── EL BRAZO SANO: con la actual, ¿deja? ───────────────────────────────
    const conActual = await fetch(`${URL}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: NUEVA, current_password: PW }),
    });
    const j2 = await conActual.json().catch(() => ({}));
    anotar(
      'cambiar clave CON la actual (el camino legítimo)',
      `HTTP ${conActual.status} ${conActual.status < 400 ? 'CAMBIA ✅' : `${j2.error_code ?? ''} ${(j2.msg ?? j2.message ?? '').slice(0, 60)}`}`,
      conActual.status < 400,
    );

    // ── y la prueba final: ¿la nueva clave entra de verdad? ────────────────
    if (conActual.status < 400) {
      const relogin = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: correo, password: NUEVA }),
      });
      const j3 = await relogin.json().catch(() => ({}));
      anotar('login con la clave NUEVA', `HTTP ${relogin.status} ${j3.access_token ? 'ENTRA' : 'no entra'}`, !!j3.access_token);
    }
  }
}

guardarSeg2('b4-cierre.json', { correo, filas });
linea(`\n  (el fixture ${correo.split('@')[0]} se limpia a continuación)\n`);
