/**
 * B4 · RE-MEDICIÓN tras las perillas que movió el founder.
 *
 * Económico a propósito: cada request consume la misma cuota de
 * «sign-ups and sign-ins» que acabo de gastar midiendo el lockout, y un 429
 * mío se leería como «rechazó la clave» — otro verde falso. Se hacen los
 * intentos mínimos y se distingue 429 de rechazo real.
 */
import { guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const signup = async (pw, etiqueta) => {
  const r = await fetch(`${URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `seg2-rm-${etiqueta}-${Date.now()}@epetplace.dev`, password: pw }),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, code: j.error_code ?? '', msg: (j.msg ?? j.message ?? '').slice(0, 90), creada: !!(j.user || j.access_token) };
};

const filas = [];
linea('\n══ B4 · RE-MEDICIÓN (tras las perillas del founder) ══\n');

linea('① LARGO MÍNIMO\n');
for (const [largo, espera] of [[6, 'debe RECHAZAR'], [7, 'debe RECHAZAR'], [8, 'debe ACEPTAR']]) {
  const r = await signup('Ab1!'.repeat(4).slice(0, largo), `l${largo}`);
  const rate = r.status === 429;
  const rechazado = r.status >= 400 && !rate;
  filas.push({ eje: `largo ${largo}`, ...r });
  linea(
    `  ${rate ? '⚠️' : '  '} largo ${largo} (${espera}) → HTTP ${r.status} ${rate ? '429 — MI CUOTA, no mide' : rechazado ? `RECHAZADO · ${r.code} ${r.msg}` : r.creada ? 'ACEPTADO' : '?'}`,
  );
}

linea('\n② CONTRASEÑAS FILTRADAS (las que antes ACEPTABA)\n');
for (const pw of ['password123', 'qwerty12345']) {
  const r = await signup(pw, 'flt');
  const rate = r.status === 429;
  const rechazado = r.status >= 400 && !rate;
  filas.push({ eje: `filtrada ${pw.slice(0, 4)}…`, ...r });
  linea(
    `  ${rate ? '⚠️' : rechazado ? '✅' : '🔴'} «${pw.slice(0, 4)}…» (${pw.length} chars) → HTTP ${r.status} ${rate ? '429 — MI CUOTA, no mide' : rechazado ? `RECHAZADA · ${r.code} ${r.msg}` : '⚠️ ACEPTADA'}`,
  );
}

guardarSeg2('b4-remedicion.json', filas);
linea('');
