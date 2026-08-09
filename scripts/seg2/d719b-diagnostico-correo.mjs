/**
 * D-719 (b) · ¿POR QUÉ NO SALE EL CORREO DE RECUPERACIÓN?
 *
 * El primer intento dio `500 unexpected_failure · Error sending recovery
 * email`. **Un 500 no dice de quién es la culpa**, así que se discrimina:
 *
 *  ① otra dirección DISTINTA → si también falla, no es de esa cuenta.
 *  ② una dirección que NO EXISTE → GoTrue responde ok igual (por diseño: no
 *    declara si un correo existe). **Si ésta pasa y las reales fallan, el fallo
 *    está en el ENVÍO, no en la API** — porque para la inexistente no hay nada
 *    que enviar.
 *  ③ ¿es rate limit disfrazado? El techo de correos por hora es bajísimo y
 *    GoTrue a veces lo devuelve como 429 y a veces el proveedor revienta con
 *    500. Se mira el `retry-after` y el cuerpo.
 *
 * Económico: tres requests, no más. Cada uno consume cupo del mismo pozo.
 */
import { guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const recover = async (email) => {
  const r = await fetch(`${URL}/auth/v1/recover`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const txt = await r.text().catch(() => '');
  return {
    email,
    status: r.status,
    retryAfter: r.headers.get('retry-after'),
    cuerpo: txt.slice(0, 160).replace(/\s+/g, ' '),
  };
};

const filas = [];
linea('\n══ D-719 (b) · diagnóstico del envío de recuperación ══\n');

for (const [email, que] of [
  ['guillo381+d719rec2@gmail.com', 'otra dirección REAL (existe la cuenta? no — se creará nada, solo prueba envío)'],
  ['no-existe-jamas-8471@epetplace.dev', 'dirección INEXISTENTE (no hay nada que enviar)'],
]) {
  const r = await recover(email);
  filas.push({ ...r, que });
  linea(`  ${r.status < 400 ? '✅' : '🔴'} ${que}`);
  linea(`     HTTP ${r.status}${r.retryAfter ? ` · retry-after: ${r.retryAfter}` : ''} · ${r.cuerpo}`);
}

linea('');
const real = filas[0];
const inexistente = filas[1];
if (real.status >= 400 && inexistente.status < 400) {
  linea('  ⇒ la API responde OK cuando NO tiene que enviar nada, y FALLA cuando sí.');
  linea('    **El problema está en el ENVÍO del correo**, no en la API de recuperación.');
} else if (real.status >= 400 && inexistente.status >= 400) {
  linea('  ⇒ falla también sin destinatario ⇒ el freno es anterior al envío (rate limit o config).');
} else {
  linea('  ⇒ salió: el fallo anterior era de esa dirección o del cupo del momento.');
}

guardarSeg2('d719b-diagnostico-correo.json', filas);
linea('');
