/**
 * D-724 · ¿SE CURÓ EL CANAL ENTERO, O SOLO RECOVERY?
 *
 * El founder cambió el remitente del SMTP de auth de
 * `avisos@avisos.epetplace.com` (dominio **borrado** de Resend — medido:
 * NXDOMAIN) a `hola@epetplace.com` (verificado: tiene DKIM de Resend y su
 * `send.` con MX de bounces y SPF).
 *
 * ── ORDEN DELIBERADO ────────────────────────────────────────────────────────
 * **Recovery va PRIMERO** aunque no sea el más informativo: es el único cuyo
 * correo el founder necesita en la mano para cerrar D-719 (b), y cada envío
 * consume cuota del mismo pozo. Gastarla en las otras pruebas antes podría
 * dejar el código de recuperación sin salir.
 *
 * ── ⚠️ EL FALSO VERDE QUE YA ME COMÍ UNA VEZ ────────────────────────────────
 * `/auth/v1/recover` devuelve **200 aunque la cuenta no exista** (por diseño:
 * nunca declara si un correo está registrado). *Un 200 no prueba que se haya
 * enviado nada.* Por eso: (a) el fixture se crea ANTES y se verifica que la
 * cuenta exista, y (b) **el verde definitivo lo da el founder mirando su
 * bandeja** — acá solo se prueba que el servidor dejó de rechazar.
 */
import { guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';
import { randomBytes } from 'node:crypto';

const filas = [];
const anotar = (id, r, nota) => {
  filas.push({ id, ...r, nota });
  const marca = r.status === 500 ? '🔴' : r.status < 400 ? '✅' : '⚠️';
  linea(`  ${marca} ${id}`);
  linea(`      HTTP ${r.status} ${r.code ? `· ${r.code}` : ''} ${r.msg ? `· ${r.msg}` : ''}`);
  if (nota) linea(`      ⇒ ${nota}`);
};

const post = async (ruta, cuerpo, token) => {
  const r = await fetch(`${URL}/auth/v1/${ruta}`, {
    method: 'POST',
    headers: {
      apikey: ANON,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(cuerpo),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, code: j.error_code ?? '', msg: (j.msg ?? j.message ?? '').slice(0, 110) };
};

const MAIL_REC = 'guillo381+d719rec@gmail.com';
const PW = `${randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x').slice(0, 10)}7!Zq`;

linea('\n══ D-724 · ¿el canal de correo de auth revivió? ══\n');

// ── ① RECOVERY — primero, porque su correo lo necesita el founder ───────────
linea('① RECOVERY (el que estaba en 500)\n');
{
  const alta = await post('signup', { email: MAIL_REC, password: PW });
  linea(
    alta.status < 400
      ? `  · fixture ${MAIL_REC} creado`
      : `  · ${MAIL_REC} ya existía (${alta.code}) — sirve igual: lo que importa es que la cuenta EXISTA`,
  );
  const existe = alta.status < 400 || alta.code === 'user_already_exists';
  if (!existe) {
    linea('  ⚠️ no se pudo garantizar la cuenta — el 200 de recover no probaría nada');
  }

  const r = await post('recover', { email: MAIL_REC });
  anotar(
    'POST /recover sobre cuenta EXISTENTE',
    r,
    r.status === 500
      ? '🔴 SIGUE CAÍDO — mismo 500 que antes de la cura'
      : r.status < 400
        ? 'el servidor ACEPTÓ el envío. **Falta que el founder confirme que el correo LLEGÓ** — el 200 solo no alcanza.'
        : 'rebote distinto del 500: leer el código',
  );
}

// ── ② CONFIRMACIÓN DE CUENTA ────────────────────────────────────────────────
linea('\n② CONFIRMACIÓN DE CUENTA\n');
{
  // Se pide REENVÍO de la confirmación sobre la cuenta recién creada: si el
  // proyecto tiene «confirm email» apagado (D-299), GoTrue lo dice — y eso es
  // un dato, no un fallo del correo.
  const r = await post('resend', { type: 'signup', email: MAIL_REC });
  anotar(
    'POST /resend (type=signup)',
    r,
    r.status === 500
      ? '🔴 el envío falla'
      : r.code === 'validation_failed' || /already confirmed|not.*required/i.test(r.msg)
        ? 'no hay nada que reenviar — la confirmación de email está APAGADA en el proyecto (D-299). No es fallo del canal.'
        : r.status < 400
          ? 'el servidor aceptó el envío de confirmación'
          : 'rebote a leer',
  );
}

// ── ③ MAGIC LINK / OTP — el otro camino de correo de auth ───────────────────
linea('\n③ MAGIC LINK (otro correo de auth, para saber si el canal es el mismo)\n');
{
  const r = await post('otp', { email: 'guillo381+d724magic@gmail.com', create_user: false });
  anotar(
    'POST /otp (magic link, sin crear usuario)',
    r,
    r.status === 500
      ? '🔴 el envío falla también acá ⇒ el problema NO era solo de recovery'
      : r.status < 400
        ? 'aceptado — pero OJO: con `create_user:false` y cuenta inexistente puede no enviar nada (mismo diseño que /recover)'
        : 'rebote a leer',
  );
}

guardarSeg2('d724-verde-correo.json', filas);

const sigueCaido = filas.filter((f) => f.status === 500);
linea('');
linea(
  sigueCaido.length === 0
    ? '  ⇒ NINGÚN camino devuelve 500. El servidor dejó de rechazar los envíos.\n    **El verde real lo da la bandeja del founder, no este script.**'
    : `  🔴 ${sigueCaido.length} camino(s) siguen en 500: ${sigueCaido.map((f) => f.id).join(', ')}`,
);
linea('');
