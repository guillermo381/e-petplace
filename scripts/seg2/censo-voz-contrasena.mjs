/**
 * CENSO DE VOZ · qué VE el usuario ante los tres rebotes de contraseña.
 *
 * Solo mide. No cura nada — el arreglo es de la sesión de login.
 *
 * ── LO QUE HAY QUE SEPARAR ──────────────────────────────────────────────────
 * El servidor distingue (a) corta de (b) filtrada **solo por el texto**: las dos
 * viajan con el MISMO `error_code = weak_password`. Así que una app que mapee
 * por código —que es lo correcto según D-659— **no puede distinguirlas ni
 * queriendo**. Eso se mide acá para que la deuda diga la verdad: no es que la
 * app haya elegido mal, es que el eje que necesita no viene.
 *
 * ── Y EL CAMINO QUE PUEDE ESTAR CAÍDO ───────────────────────────────────────
 * `cambiarContrasena` (packages/api) re-autentica con `signInWithPassword` y
 * después llama `updateUser({ password })` **sin `current_password`**. Con la
 * perilla «require current password» encendida hoy, eso podría rebotar. Se
 * reproduce el camino LITERAL del wrapper, no uno parecido.
 */
import { randomBytes } from 'node:crypto';
import { guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const clave = () => `${randomBytes(6).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x').slice(0, 8)}7!Zq`;
const filas = [];
const anotar = (id, code, msg, nota) => {
  filas.push({ id, code, msg, nota });
  linea(`  · ${id}`);
  linea(`      error_code : ${code || '—'}`);
  linea(`      msg        : ${msg || '—'}`);
  if (nota) linea(`      ⇒ ${nota}`);
};

const signup = async (pw) => {
  const r = await fetch(`${URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `seg2-voz-${randomBytes(4).toString('hex')}@epetplace.dev`, password: pw }),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, code: j.error_code ?? '', msg: j.msg ?? j.message ?? '' };
};

linea('\n══ ① ¿EL SERVIDOR DISTINGUE CORTA DE FILTRADA? ══\n');
{
  const corta = await signup('Ab1!Ab');
  anotar('(a) clave CORTA (6 chars)', corta.code, corta.msg);
  const filtrada = await signup('password123');
  anotar('(b) clave FILTRADA (11 chars, no es corta)', filtrada.code, filtrada.msg);

  const mismoCodigo = corta.code === filtrada.code && corta.code !== '';
  linea(
    `\n  ${mismoCodigo ? '🔴' : '✅'} códigos ${mismoCodigo ? 'IDÉNTICOS' : 'distintos'} · textos ${corta.msg === filtrada.msg ? 'idénticos' : 'DISTINTOS'}`,
  );
  if (mismoCodigo) {
    linea('     ⇒ la única señal que separa (a) de (b) es el TEXTO EN INGLÉS del proveedor.');
    linea('       Una app que mapea por `code` (lo correcto, D-659) NO puede distinguirlas.');
  }
}

linea('\n══ ② EL CAMINO LITERAL DE `cambiarContrasena` ══\n');
{
  const correo = `seg2-voz-cambio-${Date.now()}@epetplace.dev`;
  const PW = clave();
  const alta = await fetch(`${URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: PW }),
  });
  const ja = await alta.json().catch(() => ({}));
  if (alta.status >= 400) {
    linea(`  ⚠️ no se pudo crear el fixture (HTTP ${alta.status} ${ja.error_code ?? ''}) — no mide`);
  } else {
    // PASO 1 del wrapper: re-autenticación (signInWithPassword con la actual)
    const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: correo, password: PW }),
    });
    const js = await login.json().catch(() => ({}));
    linea(`  paso 1 · re-autenticación (lo que el wrapper hace) → HTTP ${login.status} ${js.access_token ? 'sesión FRESCA ✅' : '🔴'}`);

    if (js.access_token) {
      // PASO 2 del wrapper: updateUser({password}) SIN current_password
      const r = await fetch(`${URL}/auth/v1/user`, {
        method: 'PUT',
        headers: { apikey: ANON, Authorization: `Bearer ${js.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: clave() }),
      });
      const j = await r.json().catch(() => ({}));
      const roto = r.status >= 400;
      anotar(
        'paso 2 · updateUser({password}) SIN current_password',
        j.error_code ?? '',
        j.msg ?? j.message ?? `HTTP ${r.status} OK`,
        roto
          ? '🔴 EL CAMINO DE LA APP REBOTA. El wrapper mapea esto a `error_desconocido` ⇒ el usuario ve «Ocurrió un error inesperado».'
          : '✅ el camino de la app sigue pasando (la re-autenticación alcanza).',
      );
      filas.push({ id: 'VEREDICTO_CAMBIO', roto });
    }
  }
  linea(`\n  (fixture ${correo.split('@')[0]} — se limpia al cerrar)`);
}

guardarSeg2('censo-voz-contrasena.json', filas);
linea('');
