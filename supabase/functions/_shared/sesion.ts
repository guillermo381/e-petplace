/**
 * EL GUARD DE SESIÓN REAL (S92-BIS · D-714) — una sola verdad para las
 * functions que GASTAN DINERO.
 *
 * ── EL AGUJERO, MEDIDO EL 9-AGO-2026 ────────────────────────────────────────
 * `verify_jwt: true` valida que el JWT sea **válido**… y **la anon key ES un
 * JWT válido**. Así que las cinco functions facturables rebotaban sin
 * credencial (401 ✅) pero **entraban al cuerpo con la anon key del bundle**:
 *
 *   extract-vacuna · estructurar-nota-clinica · escribir-presencia ·
 *   chat-ayuda · lugares
 *
 * Quien tenga la app instalada tiene esa clave. Mandando entradas válidas hacía
 * correr el modelo, y **la cuota de Anthropic y de Google Places la paga la
 * casa**. *No es una fuga de datos: es una fuga de plata.*
 *
 * ── LO QUE ESTE GUARD PIDE, Y LO QUE NO ─────────────────────────────────────
 * Pide que el token traiga **`role: authenticated`**, o sea una sesión de
 * persona. **No** pide permisos sobre ninguna fila: eso ya lo hace la RLS
 * adentro de cada function. *La puerta pregunta si hay alguien; el expediente
 * pregunta quién.*
 *
 * ── POR QUÉ NO ALCANZABA CAMBIAR UNA PERILLA ────────────────────────────────
 * No hay configuración de Supabase que distinga «JWT válido» de «sesión de
 * usuario»: `verify_jwt` acepta los dos. La distinción vive en el claim, y
 * leerlo es este archivo.
 */

export type RechazoSesion = { status: number; body: { codigo: string; mensaje: string } };

/**
 * Devuelve `null` si hay sesión de persona; si no, el rechazo listo para
 * responder. **No verifica la firma**: de eso ya se encargó `verify_jwt` en el
 * borde. Acá solo se lee QUÉ clase de token pasó.
 */
export function exigirSesion(req: Request): RechazoSesion | null {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { status: 401, body: { codigo: 'sesion_requerida', mensaje: 'Falta la sesión.' } };
  }
  let rol: string | undefined;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    rol = payload.role;
  } catch {
    return { status: 401, body: { codigo: 'sesion_invalida', mensaje: 'La sesión no es legible.' } };
  }
  // `service_role` pasa: es la llave del servidor, y alguna function la usa
  // para tareas internas. `anon` NO: es la clave pública del bundle.
  if (rol !== 'authenticated' && rol !== 'service_role') {
    return {
      status: 401,
      body: { codigo: 'sesion_requerida', mensaje: 'Esta operación necesita una sesión iniciada.' },
    };
  }
  return null;
}
