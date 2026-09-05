/**
 * LO QUE HAY QUE SABER ANTES DE TOCAR AL ANIMAL — la lógica, aparte de la
 * pieza (S113-B · 1.1).
 *
 * Su gate la mide sin montar React, que es la única forma de probar que **la
 * franja no se dibuja cuando no hay nada** sin mirar una pantalla.
 */

export type ClaseSeguridad = 'alergia' | 'medicacion' | 'condicion' | 'restriccion'

/** De dónde viene el dato. **Se dice**, porque no es lo mismo que lo diga la
 *  familia a que lo haya registrado una clínica: *el primero es lo que el
 *  dueño cree, el segundo es lo que alguien midió.* */
export type ProcedenciaSeguridad = 'familia' | 'prestador'

export interface ItemSeguridad {
  id: string
  clase: ClaseSeguridad
  /** 🔴 **CON NOMBRE, jamás «tiene alergias».** *«Tiene alergias» no le sirve
   *  a nadie: el que va a bañarlo necesita saber a QUÉ.* La pantalla la
   *  compone; la pieza sólo la dibuja. */
  texto: string
  procedencia: ProcedenciaSeguridad
  /** *«lo registró Clínica Aurora»* — ya compuesta (Ley 3). */
  vozProcedencia: string
}

/** 🔴 **Sin nada que decir, la franja NO EXISTE.** *Una franja de seguridad
 *  vacía enseña a ignorar la franja de seguridad* — y el día que diga algo,
 *  ya nadie la mira. Misma ley que `D-1025`. */
export function haySeguridad(items: readonly ItemSeguridad[]): boolean {
  return items.length > 0
}

/** El orden: **lo que puede hacer daño primero.** Una alergia mal manejada
 *  manda a la clínica; una restricción de servicio, a reprogramar. */
const PESO: Record<ClaseSeguridad, number> = { alergia: 0, medicacion: 1, condicion: 2, restriccion: 3 }

export function ordenarSeguridad(items: readonly ItemSeguridad[]): ItemSeguridad[] {
  return [...items].sort((a, b) => PESO[a.clase] - PESO[b.clase])
}

/* ── EL HOY DEL PERFIL ─────────────────────────────────────────────────── */

/** Contra la medición anterior. `null` = **no hay con qué comparar**, que no
 *  es lo mismo que «igual». */
export type Tendencia = 'sube' | 'baja' | 'igual' | null

export function tendenciaPeso(actual: number, anterior?: number | null): Tendencia {
  if (anterior == null) return null
  /* 🔴 **50 g de umbral, y no es capricho:** una balanza doméstica varía por
     cómo se para el animal. Sin umbral, la tendencia parpadearía entre ↑ y ↓
     con el mismo peso — *una flecha que cambia sola enseña a no mirarla.* */
  const d = actual - anterior
  if (Math.abs(d) < 0.05) return 'igual'
  return d > 0 ? 'sube' : 'baja'
}

/** Las plagas que el antiparasitario cubre. **Cada una tiene su propio
 *  estado**: un producto puede cubrir pulgas y no internos. */
export type Plaga = 'pulgas' | 'garrapatas' | 'mosquitos' | 'internos'

export interface CoberturaPlaga {
  plaga: Plaga
  /** `null` = **no hay registro de esta plaga**, que no es «vencida». */
  alDia: boolean | null
}

/** ¿La celda tiene algo que mostrar? Sin ningún registro, **dice que no hay**
 *  en vez de dibujar cuatro chips grises. */
export function hayCobertura(c: readonly CoberturaPlaga[]): boolean {
  return c.some((x) => x.alDia !== null)
}
