/**
 * LA CAPACIDAD DECLARADA DE LA GUARDERÍA — **una sola lectura para las dos
 * superficies** (S107-C, 30-ago).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 EL DEFECTO QUE ESTO CURA, Y ERA EL PEOR DE LOS DOS POSIBLES
 * ═══════════════════════════════════════════════════════════════════════════
 * La portada decía **«0 animales por día»** y el taller **8**. No era que una
 * leyera otra fuente: **leían LA MISMA y la interpretaban distinto.**
 *
 * ```
 * portada: cupo.data[0]?.capacidad ?? 0          → 0
 * taller:  if (capacidad > 0) setCapacidad(...)  → se queda en useState(8)
 * ```
 *
 * `obtenerCupoGuarderia(hoy, hoy)` devuelve la capacidad **DE ESE DÍA**, y
 * medido el 30-ago —**domingo**, con Aurora abriendo L-V— ese día vale `0`.
 * ⇒ la portada mostraba el 0 fiel a hoy **rotulado como si fuera la capacidad
 * del negocio**, y el taller mostraba **su default**, un número que no leyó.
 * *El taller acertaba por casualidad: la capacidad real resulta ser 8.*
 *
 * ── ☠️ Y ADENTRO HABÍA UNA PÉRDIDA DE DATOS ──────────────────────────────
 * `guardar()` manda `capacidadPorDia: capacidad`. Un prestador con capacidad
 * **12** que abriera su taller **un sábado** habría visto 8 —el default— y al
 * guardar **se la habría bajado a 8 sin un solo error**. *Dos de cada siete
 * días, en la pantalla donde se configura el negocio.*
 *
 * ── POR QUÉ ES UNA VENTANA Y NO UN DÍA ───────────────────────────────────
 * La capacidad declarada vive en `guarderia_espacios.capacidad_por_dia` y es
 * **una sola para todos los días**; las excepciones abren o cierran fechas,
 * **no cambian el número**. ⇒ el **máximo** sobre una ventana de dos semanas
 * ES la capacidad declarada, y una ventana de 14 días contiene un día
 * operativo salvo que el lugar no abra nunca.
 *
 * ⚠️ **ES UN RODEO, NO EL MODELO.** Lo correcto es un lector de espacios, que
 * **no existe** (`definirEspacioGuarderia` es sólo escritura) ⇒
 * `S107-C-PEDIDO-A-A-LECTOR-DE-ESPACIOS.md`. *Ya declaré este rodeo una vez en
 * la cabecera del taller y lo dejé derivando de HOY; el rodeo estaba
 * declarado y aun así rompió — declarar un atajo no lo hace seguro.*
 *
 * 🔴 **`null` es «no sé», y NO «cero».** Quien lo consuma tiene que tratarlos
 * distinto: *un cero se escribe encima de la configuración; un «no sé» frena.*
 */

import { obtenerCupoGuarderia } from '@epetplace/api';

/** Fecha LOCAL. Jamás `toISOString()`: en Guayaquil, tras las 19:00, adelanta. */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type CapacidadDeclarada =
  /** Se pudo leer. `0` sólo si el lugar no abre ningún día de la ventana. */
  | { ok: true; capacidad: number }
  /** No se pudo preguntar. **No es cero.** */
  | { ok: false };

export async function leerCapacidadDeclarada(prestadorId: string): Promise<CapacidadDeclarada> {
  const hoy = new Date();
  const fin = new Date();
  fin.setDate(fin.getDate() + 13);
  const r = await obtenerCupoGuarderia(prestadorId, iso(hoy), iso(fin));
  if (!r.ok) return { ok: false };
  /* El máximo, no el primero: los días cerrados valen 0 y arrastrarían el
     número a cero según qué día de la semana sea hoy. */
  return { ok: true, capacidad: r.data.reduce((m, d) => Math.max(m, d.capacidad), 0) };
}
