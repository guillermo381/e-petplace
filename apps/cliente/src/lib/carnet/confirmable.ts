/**
 * ⭐ **¿ESTA FILA SE PUEDE DAR POR REVISADA?** — **UNA REGLA, UNA PANTALLA.**
 *
 * ── POR QUÉ EXISTE ESTE ARCHIVO Y POR QUÉ CASI NO DECIDE NADA ──────────────
 * La pregunta llegó a tener **TRES respuestas** al mismo tiempo: la de la edge
 * (`dudosa`), la de `esDudosa` en la pantalla, y la mía del 1.1.2. *Tres cuentas
 * sobre lo mismo terminan discrepando* — y ya discreparon una vez, con el botón
 * encendido que no hacía nada.
 *
 * Ahora **la fuente es el servidor**: `dudosa` la deriva la edge, que es la
 * única que vio el papel. Acá **no se recalcula**: se traduce a lo que la fila
 * necesita mostrar, y se agrega **sólo lo que el servidor no evalúa**.
 *
 * ── LO ÚNICO QUE SE AGREGA, Y NO ES «NADA» ────────────────────────────────
 * 🔴 **Una fecha sin día.** El carnet dice «FEB 2023» y la edge la lee bien:
 * `fecha_aplicada_precision = 'mes'`, sin invento, `dudosa: null`. *Para el
 * servidor la fila es correcta* — y lo es. Pero `eventos_vacuna.fecha_aplicada`
 * es `date` y **un mes suelto no entra**. Eso no es una duda de lectura: es un
 * hecho de la columna, y la extracción no tiene por qué conocerlo.
 *
 * *No es «lo que el servidor no puede saber»: es lo que no le toca decidir.*
 * Si algún día la columna admitiera precisión, esta línea se borra sola y la
 * regla queda entera en la edge, que es donde debería estar.
 */
import type { VacunaExtraida } from '@epetplace/api';

export interface FilaConfirmable {
  nombre: string | null;
  fecha_aplicada: string | null;
  fecha_precision: VacunaExtraida['fecha_aplicada_precision'];
  /** **Tal cual la manda la edge.** No se achata a booleano: `'fecha'` y
   *  `'incompleta'` son causas distintas y la fila las va a querer decir. */
  dudosa: 'fecha' | 'incompleta' | null;
}

/**
 * `null` = se puede confirmar. Si no, **el código del campo que falta** — la
 * pantalla pone la voz (Ley 3).
 *
 * 🔴 El orden importa: **primero el nombre**, que es lo que identifica la
 * vacuna. *Pedir la fecha de algo que todavía no sabemos qué es pone los pasos
 * al revés.*
 */
export function faltaParaConfirmar(f: FilaConfirmable): 'nombre' | 'fecha' | null {
  if (f.nombre === null || f.nombre.trim() === '') return 'nombre';
  /* La marca del servidor manda. `'incompleta'` con nombre y fecha presentes
     igual frena: la edge anuló algo, y confirmar a ciegas lo que ella misma
     desconfió sería darle por bueno un dato que nadie miró. */
  if (f.dudosa !== null) return 'fecha';
  if (f.fecha_aplicada === null || f.fecha_aplicada.trim() === '') return 'fecha';
  /* El hecho de la columna, arriba explicado. */
  if (f.fecha_precision !== 'dia') return 'fecha';
  return null;
}
