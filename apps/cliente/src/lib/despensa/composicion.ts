/**
 * LA COMPOSICIÓN DEL PRODUCTO Y EL VEREDICTO DE ALERGIA (S96-D ·
 * LETRA_RECORRIDO_DESPENSA_S96 §5.4 · MODELO_DESPENSA §6 enmendado).
 *
 * 🔴 ESTE ARCHIVO ES EL ÚNICO LUGAR QUE DERIVA ESTADOS DE COMPOSICIÓN.
 * La ley: **exclusión dura en la RECOMENDACIÓN** (la hace Postgres en
 * `recomendarParaMascota`, jamás acá) · **advertencia dura en la
 * BÚSQUEDA** (la componen las pantallas con lo que este archivo decide).
 *
 * LOS TRES ESTADOS (vocabulario verbatim del motor —
 * `productos.composicion_estado`, tanda A de S96 — y del AvisoAlergia de
 * B): `verificada` · `declarada_sin_verificar` · `ausente`.
 *
 * ⚠️ HASTA QUE LA COLUMNA LLEGUE AL WRAPPER, este helper deriva de los
 * arrays (`alergenos` + `ingredientes_activos`): algo declarado es A LO
 * SUMO `declarada_sin_verificar`, nada declarado es `ausente`, y
 * **`verificada` NO SE FABRICA JAMÁS** (L-139: solo la verificada puede
 * callar, y fabricarla sería fabricar la confianza que calla). Cuando el
 * wrapper exponga `composicion_estado`, cambia UNA función acá y ninguna
 * pantalla.
 */

export type EstadoComposicion = 'verificada' | 'declarada_sin_verificar' | 'ausente';

export function estadoComposicion(producto: {
  alergenos: string[];
  ingredientes_activos?: string[];
}): EstadoComposicion {
  const declaraAlgo =
    producto.alergenos.length > 0 || (producto.ingredientes_activos ?? []).length > 0;
  return declaraAlgo ? 'declarada_sin_verificar' : 'ausente';
}

/** Los alérgenos del producto que cruzan con los documentados de la
 *  mascota (comparación case-insensitive, mismo criterio que la
 *  verificación fail-closed del wrapper de recomendación). */
export function alergenosQueCruzan(
  productoAlergenos: string[],
  mascotaAlergenos: string[],
): string[] {
  const prohibidos = new Set(mascotaAlergenos.map((a) => a.trim().toLowerCase()));
  return productoAlergenos.filter((a) => prohibidos.has(a.trim().toLowerCase()));
}

/**
 * Los alérgenos DOCUMENTADOS de la mascota, desde el jsonb del perfil
 * (`alergias_detalle` de `obtenerPerfilMascota`). La forma no se adivinó:
 * sale del cuerpo de `_trg_alergia_propagar_perfil` — `[{alergeno,
 * severidad, categoria, estado, …}]`. Una alergia DESCARTADA por el vet
 * dejó de advertir; `confirmada` o `sospechada` advierten — ante la duda
 * se dice (mismo criterio que la exclusión del wrapper).
 */
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

// NOTA DE CONSUMO (contrato AvisoAlergia v2 de B, S96): la pieza recibe
// los HECHOS — `composicion` (este helper) + `contieneAlergeno`
// (`alergenosQueCruzan`) — y decide sola qué decir y cuándo callar (solo
// `verificada` sin cruce calla). La pantalla la monta SIEMPRE que haya
// alérgeno documentado relevante, sin condicionarla. El veredicto
// intermedio que vivía acá murió con ese contrato (regla 37).
