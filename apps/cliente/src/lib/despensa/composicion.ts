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

/**
 * EL VEREDICTO — qué tiene que decir la pantalla sobre ESTE producto para
 * ESTA mascota. Discriminado para que la pantalla componga la voz (Ley 3:
 * la voz es del riel, este archivo decide, no redacta):
 *
 * · `contiene`         → el producto declara composición y CONTIENE un
 *                        alérgeno documentado. Advertencia dura + paso
 *                        explícito de entendimiento (§5.4).
 * · `sin_composicion`  → la mascota tiene alergias documentadas y el
 *                        producto NO declara composición. Candado ① de
 *                        §5.4: se dice, JAMÁS silencio — el silencio se
 *                        lee como "no tiene pollo" y esa lectura la haría
 *                        el dueño, no nosotros.
 * · `null`             → nada que advertir: la mascota no tiene alergias
 *                        documentadas, o la composición declarada no
 *                        cruza. (Con el AvisoAlergia de tres estados de
 *                        B, el caso "declarada sin verificar, sin cruce"
 *                        pasará a montarse igual y a hablar solo — este
 *                        veredicto ganará esa rama cuando el contrato
 *                        nuevo llegue a main.)
 */
export type VeredictoAlergia =
  | { tipo: 'contiene'; alergenos: string[] }
  | { tipo: 'sin_composicion' }
  | null;

export function veredictoAlergia(input: {
  productoAlergenos: string[];
  ingredientesActivos: string[];
  mascotaAlergenos: string[];
}): VeredictoAlergia {
  if (input.mascotaAlergenos.length === 0) return null;
  const estado = estadoComposicion({
    alergenos: input.productoAlergenos,
    ingredientes_activos: input.ingredientesActivos,
  });
  if (estado === 'ausente') return { tipo: 'sin_composicion' };
  const cruzan = alergenosQueCruzan(input.productoAlergenos, input.mascotaAlergenos);
  if (cruzan.length > 0) return { tipo: 'contiene', alergenos: cruzan };
  return null;
}
