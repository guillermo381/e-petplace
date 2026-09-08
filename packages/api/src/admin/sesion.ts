/**
 * EL GATE DE ADMIN — la puerta del portal, y NO la reinventa.
 *
 * S114-F, tanda 1. El relevamiento (`docs/loop/S114-F-RELEVAMIENTO.md`) midió
 * que el gate del admin legado **no es decorativo**: `is_admin()` es
 * `SECURITY DEFINER` y lee **la misma tabla `admin_users`** que consulta el
 * front, y las policies `admin_all_*` de las tablas financieras la invocan.
 * Así que acá no se construye un gate nuevo: se lee el que ya rige.
 *
 * ── POR QUÉ SE PREGUNTA POR CAMINO REAL Y NO POR UNA COLUMNA ──────────────
 * `esAdmin()` **no** consulta `admin_users` para después decidir en el front.
 * Un guard de front es una opinión del cliente sobre sí mismo. Lo que hace es
 * pedirle a la BASE que resuelva `is_admin()` — la misma función que gatea las
 * policies — y devolver ese veredicto. *Si alguien parchea el front, la RLS
 * sigue negando; y si la RLS negara, el front no puede fabricarse permiso.*
 *
 * ⚠️ **Y el borde que lo hace honesto (L-178): un fallo de lectura JAMÁS se
 * degrada a `false`.** «No sos admin» y «no pude preguntarlo» son dos hechos
 * distintos, y confundirlos manda a la pantalla de login a alguien que sí
 * tiene permiso, sin decirle por qué. Por eso el resultado tiene tres formas y
 * no dos.
 */

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS = ['sin_sesion', 'error_desconocido'] as const;
export type CodigoErrorAdmin = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorAdmin, string> = {
  sin_sesion: 'No hay una sesión abierta.',
  error_desconocido: 'No pudimos verificar tu acceso.',
};

/**
 * ¿La sesión actual es admin de plataforma?
 *
 * `ok:true  + data:true`  → es admin (lo dijo la base)
 * `ok:true  + data:false` → NO es admin (lo dijo la base)
 * `ok:false`              → no se pudo preguntar — la pantalla lo dice, y no
 *                           lo confunde con «no sos admin».
 */
export async function esAdmin(): Promise<ResultadoWrapper<boolean, CodigoErrorAdmin>> {
  const uid = await uidActual();
  if (uid === null) {
    return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  }

  /* La pregunta va a `admin_users` con el uid de la sesión. La policy
     `admins_select` es `auth.uid() = id`, así que esta consulta **sólo puede
     devolver la propia fila**: no es un oráculo de quién más es admin.
     Medido en el relevamiento: con la anon key sin sesión devuelve 0 filas. */
  const { data, error } = await getClient()
    .from('admin_users')
    .select('id, activo')
    .eq('id', uid)
    .maybeSingle();

  if (error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: data?.activo === true };
}
