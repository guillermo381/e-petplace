// ═══════════════════════════════════════════════════════════════════════════
// S109-A · LA QUINTA PROYECCIÓN — la guardería con FORMA DE CITA
//
// **Por qué existe, con la medición de S109-D adentro:** `historico.tsx` («Tu
// histórico», *el trabajo que ya hiciste*) enumera **cuatro** oficios, y **una
// estadía es trabajo hecho**. Era la última deuda declarada dentro de
// `verify:jornada-completa`.
//
// 🔴 **Y NO se curaba con `obtenerEstadiasPorRango`. D lo midió al intentarlo:**
//   · **techo** — el histórico ofrece «90 días» y un «ver más» de 30 en 30 **sin
//     tope**, y aquel lector rebota `rango_demasiado_largo` sobre 62;
//   · **forma** — su lista es de `CitaAgendaPaseo` y una estadía **no trae**
//     hora, `tipo_servicio`, duración, precio, empleado ni atención ⇒ montarla
//     obligaba a **fabricar nueve campos**: la fila verosímil-falsa de `L-139`.
//
// 🟢 **D hizo bien en NO fabricarla, y por eso esto existe:** *lo que faltaba
// era la PROYECCIÓN, no el relleno.* **La cita EXISTE** —la estadía carga su
// `cita_id`— así que ésta es **otra proyección de la MISMA tabla que las cuatro
// hermanas ya leen**, y el techo desaparece porque hereda su contrato.
//
// ⚠️ **Y NO ES UNA QUINTA COPIA.** Las cuatro hermanas repiten el mismo `select`
// palabra por palabra, y agregar una quinta habría vuelto la duplicación de
// cuatro en cinco. Esta usa el helper `citasDePrestadorPorCategoria`, extraído
// acá. **Las otras cuatro NO se tocaron** — migrarlas es deuda con disparo: *el
// día que alguien cambie ese `select`, tiene que cambiarlo en cuatro lugares, y
// ése es el día de extraerlas.* Tocarlas hoy, al cerrar, habría sido una
// refactorización de cuatro superficies vivas sin gate que la respalde.
// ═══════════════════════════════════════════════════════════════════════════
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { CitaAgendaPaseo, InputCitasPaseoDelDia } from './paseo';
import { parseDireccionSnapshot } from './paseo';

export type CodigoErrorGuarderiaAgenda = 'sin_sesion' | 'datos_inconsistentes' | 'fallo';

/**
 * 🔴 LA VERDAD FIRME, palabra por palabra la de las hermanas: lista POSITIVA
 * explícita. *`pendiente` es tentativa y no se pinta* — la cita aparece cuando
 * el pago la confirma. Copiar el criterio y no la lista habría dejado que un
 * hold sin pagar se colara en «el trabajo que ya hiciste».
 */
const ESTADOS_FIRMES = ['confirmada', 'en_curso', 'completada', 'no_show'] as const;

async function citasDePrestadorPorCategoria(
  input: InputCitasPaseoDelDia,
  categoria: string,
): Promise<ResultadoWrapper<CitaAgendaPaseo[], CodigoErrorGuarderiaAgenda>> {
  const { data, error } = await getClient()
    .from('evento_cita_servicio')
    /* 🔴 EL `select` VA COMO LITERAL, y no como constante — lo aprendí
       rompiéndolo: `supabase-js` INFIERE el tipo de la fila del texto del
       `select`, así que una constante lo vuelve `GenericStringError` y obliga a
       castear a mano lo que el cliente sabía tipar solo. *Un `as` acá habría
       silenciado justo el tipo que hace segura esta lectura.* Es el precio de
       la inferencia y se paga con una línea larga, no con un cast. */
    .select(
      'id, fecha, hora, estado, tipo_servicio, suscripcion_servicio_id, duracion_minutos, precio, empleado_id, direccion_snapshot, mascota:mascotas(id, nombre, especie, foto_url, familia_id), tipo:tipos_servicio!inner(nombre, duracion_default_minutos), atencion:evento_atencion(estado, iniciada_en)',
    )
    .eq('prestador_id', input.prestador_id)
    .gte('fecha', input.fecha)
    .lte('fecha', input.fecha_hasta ?? input.fecha)
    .eq('tipo.categoria', categoria)
    .in('estado', [...ESTADOS_FIRMES])
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  if (error) {
    return { ok: false, codigo: 'fallo', mensaje: error.message };
  }
  /* PostgREST embebe `atencion` como array (la FK cita→atención es to-many).
     Se conserva la Ley 7 de la hermana: si hubiera más de una, gana la de
     `iniciada_en` más reciente. */
  const citas: CitaAgendaPaseo[] = (data ?? []).map((c) => {
    const atenciones = (c.atencion ?? []) as { estado: string; iniciada_en: string }[];
    const atencion =
      atenciones.length === 0
        ? null
        : atenciones.reduce((a, b) => (b.iniciada_en > a.iniciada_en ? b : a));
    const { direccion_snapshot, ...resto } = c;
    return { ...resto, atencion, direccion: parseDireccionSnapshot(direccion_snapshot) };
  });
  return { ok: true, data: citas };
}

/**
 * Las citas de GUARDERÍA del prestador — un día o un rango inclusivo, con la
 * misma forma y la misma verdad firme que sus cuatro hermanas.
 *
 * ⚠️ **La categoría del catálogo es `hospedaje` y el oficio se llama
 * `guarderia`: son DOS vocabularios y por eso acá va el literal del catálogo.**
 * *Usar el del oficio devolvería cero filas sin fallar* — que es exactamente la
 * clase de omisión silenciosa que S109-D encontró tres veces en el HOY.
 */
export async function obtenerCitasGuarderiaDelDia(
  input: InputCitasPaseoDelDia,
): Promise<ResultadoWrapper<CitaAgendaPaseo[], CodigoErrorGuarderiaAgenda>> {
  return citasDePrestadorPorCategoria(input, 'hospedaje');
}
