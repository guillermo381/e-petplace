/**
 * EL CRUCE DE ALERGIA (S96-D · LETRA_RECORRIDO_DESPENSA_S96 §5.4 ·
 * MODELO_DESPENSA §6 enmendado).
 *
 * 🔴 ESTE ARCHIVO ES EL ÚNICO LUGAR QUE CRUZA ALÉRGENOS. La ley:
 * **exclusión dura en la RECOMENDACIÓN** (la hace Postgres en
 * `recomendarParaMascota`, jamás acá) · **advertencia dura en la
 * BÚSQUEDA** (las pantallas componen la voz con lo que este archivo
 * decide).
 *
 * LO QUE YA NO VIVE ACÁ (regla 37, cableo del merge de A 12-ago): el
 * estado de composición dejó de derivarse — `productos.composicion_estado`
 * es columna del motor con CUATRO literales y el wrapper la expone
 * tipada (`ComposicionEstado`). Solo `verificada` y `no_aplica` callan,
 * y son DOS silencios distintos: una porque se cotejó, la otra porque no
 * hay nada que cotejar (jamás mapear `no_aplica` a `ausente`: la app le
 * pediría ingredientes a una bolsa de arena).
 *
 * LA COINCIDENCIA TIENE TRES VALORES (firma founder S96, vocabulario de
 * alérgenos con RELACIONES como dato): `exacta` («contiene pollo») ·
 * `imprecisa` («contiene proteína de ave sin especificar, y podría ser
 * pollo») · `ninguna`. La expansión la hace el MOTOR
 * (`expandirAlergenosAVigilar` → `{declarado, origen, exacta}`); este
 * archivo solo cruza la lista expandida contra lo que el producto
 * declara. **El tono de la imprecisa NO baja**: si esa proteína es
 * pollo, le hace igual de mal — cambia la palabra, no el matiz.
 */

import type { AlergenoVigilado } from '@epetplace/api';

/** Los alérgenos DOCUMENTADOS de la mascota, desde el jsonb del perfil
 *  (`alergias_detalle` de `obtenerPerfilMascota`). La forma no se adivinó:
 *  sale del cuerpo de `_trg_alergia_propagar_perfil` — `[{alergeno,
 *  severidad, categoria, estado, …}]`. Una alergia DESCARTADA por el vet
 *  dejó de advertir; `confirmada` o `sospechada` advierten — ante la duda
 *  se dice (mismo criterio que la exclusión del wrapper). */
export function alergenosDeMascota(detalle: unknown[]): string[] {
  const salida: string[] = [];
  for (const a of detalle) {
    if (typeof a !== 'object' || a === null) continue;
    const o = a as Record<string, unknown>;
    if (o.estado === 'descartada') continue;
    if (typeof o.alergeno === 'string' && o.alergeno.trim().length > 0) {
      salida.push(o.alergeno.trim());
    }
  }
  return salida;
}

/** Cruce LITERAL (case-insensitive) — lo usa la fila de búsqueda de
 *  Descubrir, que solo tiene los nombres del criterio de la
 *  recomendación a mano. La ficha usa el cruce EXPANDIDO de abajo, que
 *  es el que ve las relaciones (ave ⊃ pollo). */
export function alergenosQueCruzan(
  productoAlergenos: string[],
  mascotaAlergenos: string[],
): string[] {
  const prohibidos = new Set(mascotaAlergenos.map((a) => a.trim().toLowerCase()));
  return productoAlergenos.filter((a) => prohibidos.has(a.trim().toLowerCase()));
}

export interface CruceAlergia {
  coincidencia: 'ninguna' | 'exacta' | 'imprecisa';
  /** Los declarados del producto que cruzaron EXACTO («contiene X»). */
  exactos: string[];
  /** Los cruces imprecisos: qué declara el producto y qué podría ser. */
  imprecisos: { declarado: string; origen: string }[];
}

/**
 * El cruce EXPANDIDO: la lista de vigilados del motor contra lo que el
 * producto declara. Si hay exactos e imprecisos a la vez, la coincidencia
 * es `exacta` (la afirmación más directa preside) y los imprecisos viajan
 * igual para que la voz pueda nombrarlos en el detalle.
 */
export function cruzarConVigilados(
  productoAlergenos: string[],
  vigilados: AlergenoVigilado[],
): CruceAlergia {
  const declarados = new Set(productoAlergenos.map((a) => a.trim().toLowerCase()));
  const exactos: string[] = [];
  const imprecisos: { declarado: string; origen: string }[] = [];
  for (const v of vigilados) {
    if (!declarados.has(v.declarado.trim().toLowerCase())) continue;
    if (v.exacta) {
      if (!exactos.includes(v.declarado)) exactos.push(v.declarado);
    } else if (!imprecisos.some((i) => i.declarado === v.declarado && i.origen === v.origen)) {
      imprecisos.push({ declarado: v.declarado, origen: v.origen });
    }
  }
  return {
    coincidencia: exactos.length > 0 ? 'exacta' : imprecisos.length > 0 ? 'imprecisa' : 'ninguna',
    exactos,
    imprecisos,
  };
}

/** El vocabulario de alérgenos es CATÁLOGO con códigos (`ave_no_especificada`)
 *  y todavía no tiene diccionario en el riel — un código con guiones bajos
 *  en la cara de la familia rompe la Ley 3. Degradación mínima declarada
 *  (guiones → espacios) HASTA que el catálogo gane su voz; anotado para el
 *  gate de strings. */
export function vozAlergeno(codigo: string): string {
  return codigo.replace(/_/g, ' ');
}
