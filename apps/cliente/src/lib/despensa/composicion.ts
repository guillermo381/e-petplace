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

/**
 * ☠️ **ACÁ VIVÍA `alergenosQueCruzan`, Y SU MUERTE ES DE SALUD, NO DE ORDEN**
 * (S100-C · censo de alérgenos ordenado por la mesa).
 *
 * Hacía el cruce **LITERAL**: solo coincidencia exacta. Su comentario decía
 * *«lo usa la fila de búsqueda de Descubrir»* — y era cierto. **La
 * consecuencia, que nadie había medido: a alguien cuyo perro es alérgico al
 * pollo, la búsqueda NO le decía que un producto declara `ave_no_especificada`
 * y podría ser pollo.** Advertía de menos, sin error, sin traza y sin síntoma:
 * *el que falta no se ve.*
 *
 * Al migrar la búsqueda a la tarjeta pasó a `cruzarConVigilados` (el de abajo,
 * que ve las relaciones) y **esta función quedó con CERO consumidores en todo
 * el monorepo** — verificada por grep sobre `apps`, `packages` y `scripts`.
 *
 * 🔴 **Se borra en vez de dejarse «por si acaso», y ésa es la decisión:** una
 * función de salud que cruza de menos, exportada y sin consumidores, **es el
 * arma que agarra el próximo que necesite «cruzar alérgenos» y encuentre el
 * nombre más obvio.** *Un residuo inofensivo hoy es un default peligroso
 * mañana.* **El cruce de alérgenos de esta casa es UNO: `cruzarConVigilados`.**
 */

export interface CruceAlergia {
  coincidencia: 'ninguna' | 'exacta' | 'imprecisa';
  /** Los declarados del producto que cruzaron EXACTO («contiene X»).
   *  `codigo` para REGISTRAR (el entendimiento guarda vocabulario);
   *  `nombre` para DECIR (la voz del catálogo, jamás el código). */
  exactos: { codigo: string; nombre: string }[];
  /** Los cruces imprecisos: qué declara el producto y qué podría ser. */
  imprecisos: { codigo: string; nombre: string; origenNombre: string }[];
}

/**
 * El cruce EXPANDIDO: la lista de vigilados del motor contra lo que el
 * producto declara. Si hay exactos e imprecisos a la vez, la coincidencia
 * es `exacta` (la afirmación más directa preside) y los imprecisos viajan
 * igual para que la voz pueda nombrarlos en el detalle. Las VOCES vienen
 * del motor (`declarado_nombre`/`origen_nombre` — `cat_alergenos.nombre_es`;
 * el texto libre del vet conserva su texto, no se le inventa voz).
 */
export function cruzarConVigilados(
  productoAlergenos: string[],
  vigilados: AlergenoVigilado[],
): CruceAlergia {
  const declarados = new Set(productoAlergenos.map((a) => a.trim().toLowerCase()));
  const exactos: { codigo: string; nombre: string }[] = [];
  const imprecisos: { codigo: string; nombre: string; origenNombre: string }[] = [];
  for (const v of vigilados) {
    if (!declarados.has(v.declarado.trim().toLowerCase())) continue;
    if (v.exacta) {
      if (!exactos.some((e) => e.codigo === v.declarado)) {
        exactos.push({ codigo: v.declarado, nombre: v.declarado_nombre });
      }
    } else if (
      !imprecisos.some((i) => i.codigo === v.declarado && i.origenNombre === v.origen_nombre)
    ) {
      imprecisos.push({
        codigo: v.declarado,
        nombre: v.declarado_nombre,
        origenNombre: v.origen_nombre,
      });
    }
  }
  return {
    coincidencia: exactos.length > 0 ? 'exacta' : imprecisos.length > 0 ? 'imprecisa' : 'ninguna',
    exactos,
    imprecisos,
  };
}

/** La voz de un código del catálogo de alérgenos — LECTOR sobre el mapa
 *  de `listarAlergenos()` (`cat_alergenos.nombre_es`, sembrada con las
 *  23). El fallback guiones→espacios queda SOLO para el código que no
 *  esté en el catálogo (o el mapa sin cargar): mejor una degradación
 *  visible que un código con guiones bajos en la cara de la familia. */
export function vozAlergeno(codigo: string, voces?: ReadonlyMap<string, string>): string {
  return voces?.get(codigo) ?? codigo.replace(/_/g, ' ');
}
