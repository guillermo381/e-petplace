// ═══════════════════════════════════════════════════════════════════════════
// S114-A · A10 · LA ÚNICA PUERTA a los motivos de postventa.
//
// 🔴 NADIE ESCRIBE SU PROPIO SELECT SOBRE `cat_motivos_postventa`.
//
// §4 de `LETRA_POSTVENTA` dice que estadía «hereda las de cita». Esa regla NO
// está duplicada como filas —duplicarlas habría inventado motivos que la letra
// no lista— así que vive en el conjunto resuelto (`v_motivos_resueltos`), y
// este wrapper es su única salida hacia las apps.
//
// LO QUE PASA SI ALGUIEN ESCRIBE EL SUYO, medido contra el catálogo vivo antes
// de construir esto — y los dos atajos que salen solos fallan al revés:
//
//   caso                  | debería | .eq('objeto', X) | sin filtrar objeto
//   ----------------------|---------|------------------|-------------------
//   estadia + calidad     | entra   | 🔴 NO aparece    | aparece
//   pedido  + calidad     | rebota  | no aparece       | 🔴 APARECE
//   estadia + otra_cosa   | entra   | 🔴 NO aparece    | aparece
//
// El filtro por objeto se come la herencia **y `otra_cosa`** —el «Es otra cosa
// · contame» que §4 pone al cierre de TODA lista—; el sin-filtro le ofrece a un
// pedido los motivos de una cita.
// ═══════════════════════════════════════════════════════════════════════════

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar los motivos. Prueba de nuevo.';

/** Los objetos sobre los que puede existir un caso (§1 de la letra). */
export type ObjetoPostventa = 'cita' | 'estadia' | 'pedido';

/** De dónde sale el motivo dentro del conjunto resuelto. La superficie puede
 *  querer separarlos; sin esta columna tendría que deducirlo comparando
 *  strings, que es cómo se reintroduce la regla en el lector. */
export type ProcedenciaMotivo = 'propio' | 'heredado' | 'universal';

export interface MotivoPostventa {
  codigo: string;
  /** 1 = falla del prestador · 2 = ejecutó y salió distinto · 3 = urgente.
   *  🔴 VIENE DE LA FILA. Ninguna pantalla y ningún modelo la eligen (§4). */
  clase: 1 | 2 | 3;
  /** clase === 3. Se expone además de `clase` porque la superficie pregunta
   *  «¿es urgente?» y no debería tener que saber que urgente ⟺ 3. */
  urgente: boolean;
  /** Tuteo neutro, verbatim de §4. */
  voz: string;
  pideFoto: boolean;
  procedencia: ProcedenciaMotivo;
}

/**
 * Los motivos que le corresponden a un objeto, con la herencia y los
 * universales YA RESUELTOS por el servidor.
 *
 * Es la lista que dibuja §2 de `DIRECCION_POSTVENTA` («una lista corta, en una
 * pantalla, sin scroll interno»). El orden es por clase y después alfabético
 * por código: **la letra no fija un orden de display**, y esto lo declara en
 * vez de inventarle una prioridad a los motivos.
 */
export async function obtenerMotivosDeObjeto(
  objeto: ObjetoPostventa,
): Promise<ResultadoWrapper<MotivoPostventa[], 'error_catalogo'>> {
  const { data, error } = await getClient()
    .from('v_motivos_resueltos')
    .select('codigo, clase, urgente, voz, pide_foto, procedencia')
    .eq('objeto_resuelto', objeto)
    .order('clase', { ascending: true })
    .order('codigo', { ascending: true });

  if (error) return { ok: false, codigo: 'error_catalogo', mensaje: MENSAJE_ERROR };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE_ERROR };
  }

  return {
    ok: true,
    data: data.map((m) => ({
      codigo: m.codigo as string,
      clase: m.clase as 1 | 2 | 3,
      urgente: m.urgente as boolean,
      voz: m.voz as string,
      pideFoto: m.pide_foto as boolean,
      procedencia: m.procedencia as ProcedenciaMotivo,
    })),
  };
}

/**
 * ¿Este motivo PERTENECE al conjunto resuelto de este objeto?
 *
 * 🔴 **Pertenencia, no coincidencia.** El guard del caso cuelga de la MISMA
 * definición que la lista de arriba, y por eso no pueden divergir: si mañana
 * cambia la herencia, cambia una fila de `cat_motivos_herencia` y las dos se
 * mueven juntas.
 *
 * Es un espejo del predicado del servidor y **no reemplaza al guard del
 * motor**: el motor rebota igual. Sirve para que la superficie no ofrezca lo
 * que va a rechazar (Ley 23, el principio de la puerta).
 */
export async function motivoPerteneceAlObjeto(
  codigo: string,
  objeto: ObjetoPostventa,
): Promise<ResultadoWrapper<boolean, 'error_catalogo'>> {
  const { data, error } = await getClient().rpc('_motivo_pertenece_al_objeto', {
    p_codigo: codigo,
    p_objeto: objeto,
  });

  if (error) return { ok: false, codigo: 'error_catalogo', mensaje: MENSAJE_ERROR };
  // Fail-closed: el predicado del servidor devuelve `false` ante NULL, y acá
  // se sostiene el mismo criterio en vez de dejar pasar un `undefined`.
  return { ok: true, data: data === true };
}
