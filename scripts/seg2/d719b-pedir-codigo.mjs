/**
 * D-719 (b) · PREPARAR LA MEDICIÓN DE `establecerContrasenaNueva`.
 *
 * ── POR QUÉ UN FIXTURE Y NO LA CUENTA DEL FOUNDER ───────────────────────────
 * Para medir el paso 2 de *recuperar* hace falta una **sesión de recovery
 * real**, y ésa solo la deja un código que llega por correo. Medirlo sobre una
 * cuenta real **le cambiaría la contraseña al founder** — justo lo que ordenó
 * no hacer.
 *
 * La salida: una cuenta **fixture** con `guillo381+…@gmail.com`. Gmail entrega
 * el `+algo` al mismo buzón, así que **el código llega a su bandeja** y la
 * cuenta que se toca es descartable. Cero `service_role` (R6), cero cuenta real.
 */
import { randomBytes } from 'node:crypto';
import { guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const EMAIL = 'guillo381+d719rec@gmail.com';
const PW = `${randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x').slice(0, 10)}7!Zq`;

linea('\n══ D-719 (b) · preparando la medición de recuperar ══\n');

// ① la cuenta fixture (si ya existe de una corrida previa, se reusa)
const alta = await fetch(`${URL}/auth/v1/signup`, {
  method: 'POST',
  headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PW }),
});
const ja = await alta.json().catch(() => ({}));
linea(
  alta.status < 400
    ? `  ✓ fixture ${EMAIL} creado`
    : `  · ${EMAIL} ya existía (${ja.error_code ?? alta.status}) — se reusa, da igual: la clave se va a reemplazar por el flujo`,
);

// ② disparar el correo de recuperación
const reset = await fetch(`${URL}/auth/v1/recover`, {
  method: 'POST',
  headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL }),
});
const jr = await reset.json().catch(() => ({}));
linea(
  reset.status < 400
    ? `  ✓ correo de recuperación DISPARADO a ${EMAIL}`
    : `  🔴 no salió: HTTP ${reset.status} ${jr.error_code ?? ''} ${(jr.msg ?? '').slice(0, 80)}`,
);

guardarSeg2('d719b-preparacion.json', { email: EMAIL, altaStatus: alta.status, resetStatus: reset.status });

linea(`
  ── LO QUE HACE FALTA DEL FOUNDER ─────────────────────────────────────────
  En tu bandeja (o en spam — las plantillas siguen siendo las de Supabase,
  en inglés: D-628) llegó un correo para ${EMAIL}.
  Pasame **los 6 dígitos**. Con eso corro:

      pnpm tsx scripts/verify-recuperar-s92bis.mts <codigo>

  y queda medido si el paso 2 de recuperar tiene el mismo defecto que ya
  curamos en el cambio de clave.
`);
