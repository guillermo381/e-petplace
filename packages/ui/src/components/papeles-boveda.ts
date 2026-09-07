/**
 * LA BÓVEDA DE PAPELES — el contrato, aparte de las piezas (S113-B · fase 3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **LA LEY QUE ATRAVIESA TODO ESTE ARCHIVO: SE TRANSCRIBE, NO SE INTERPRETA.**
 * ═══════════════════════════════════════════════════════════════════════════
 * Un valor de laboratorio entra **con su unidad y con su referencia si estaban
 * impresas**, y nada más. Ni «alto», ni «bajo», ni una flecha, ni un color, ni
 * el nombre de una enfermedad. **Jamás.**
 *
 * Y no alcanza con no dibujarlo: **el tipo no lo deja entrar.** Acá no existe
 * un `estado: 'alto' | 'bajo' | 'normal'` que alguien pueda mandar «para que se
 * entienda mejor». *Lo que un tipo permite, alguien lo escribe el día que tiene
 * apuro — y acá el que lo lee después es un veterinario que va a decidir con
 * eso.* Lo único que puede viajar es **la marca que el propio laboratorio
 * imprimió, como TEXTO**: no es nuestra lectura, es lo que el papel dice.
 *
 * ⚠️ **ESTE CONTRATO ES DE LAS PIEZAS, NO DE LA BASE.** La puerta de A
 * (`papeles_familia` · `papel_valor`) **no estaba en `origin/main` al
 * escribirlo** — medido, no supuesto. Las piezas reciben todo por props (Ley 3)
 * así que no dependen de ella; **el día que aterrice hay que cotejar los
 * nombres**, y eso se declara en vez de fingir que ya coinciden.
 */

/**
 * Los cuatro grupos. **`propios` son los que la casa emite** (carnet, historia
 * clínica, receta, ficha, certificado) y los otros tres son lo que la familia
 * TRAE.
 *
 * ⚠️ Los tres traídos comparten glifo (`papel`) a propósito: *el rótulo del
 * grupo ya dice cuál es, y tres dibujos para una distinción que la palabra de
 * al lado ya hace es un glifo que nadie necesita* (§6b, economía).
 */
export type GrupoPapel = 'examenes' | 'recetas' | 'informes' | 'propios'

/** Una fila de valor de un examen. Ver la ley de arriba. */
export interface ValorDePapel {
  id: string
  /** *«Hematocrito»* — como está impreso. */
  analito: string
  /** *«42»* — como está impreso, sin redondear ni convertir. */
  valor: string
  /** *«%»* — **sólo si estaba impresa**. Sin unidad, no se inventa una. */
  unidad?: string
  /** *«37–55»* — **sólo si estaba impreso**. Su ausencia se dice, no se rellena. */
  referencia?: string
  /**
   * 🔴 **LO QUE EL LABORATORIO MARCÓ, COMO TEXTO Y NADA MÁS** — *«H»*, *«*»*,
   * *«fuera de rango»*. **No es nuestra lectura: es lo que el papel dice.**
   *
   * Acá NO hay un `'alto' | 'bajo'`, y esa ausencia es la pieza central del
   * contrato: *un enum de interpretación es una invitación a interpretar, y el
   * que lo lee después es un veterinario decidiendo un tratamiento.*
   */
  marcaImpresa?: string
}

/** Una línea de medicación de una receta. */
export interface MedicacionDePapel {
  id: string
  /** *«Enrofloxacina 50 mg»* — como está impreso. */
  nombre: string
  /** *«1 comprimido cada 12 h»* — ya redactada; sin dosis, se calla. */
  dosis?: string
  /** *«7 días»* — ya redactada. */
  duracion?: string
}

/** Un papel de la bóveda, en su fila de lista. */
export interface PapelEnLista {
  id: string
  grupo: GrupoPapel
  /** *«Hemograma completo»* — ya redactado. */
  titulo: string
  /**
   * *«Clínica San Roque»* — **de dónde vino**. Ausente cuando el papel no lo
   * dice: *poner «origen desconocido» es escribir algo que el papel no dice;
   * no poner nada es exacto.*
   */
  origen?: string
  /** *«12 mar 2025»* — ya redactada por el riel. */
  fecha?: string
  /** 🔴 Obligatorio: una fila que no abre nada no es una fila, es un texto. */
  onPress: () => void
}

/**
 * 🔴 **SIN PAPELES NO SE DIBUJA LISTA**, y por eso esto existe aparte: un
 * grupo vacío **no se monta** —ni con su rótulo—, porque *un rótulo sobre nada
 * le dice a la familia que ahí debería haber algo y que se perdió.*
 */
export function gruposConPapeles<T extends { papeles: readonly unknown[] }>(
  grupos: readonly T[],
): readonly T[] {
  return grupos.filter((g) => g.papeles.length > 0)
}

/** ¿La bóveda está vacía del todo? Entonces va la invitación y NADA de lista. */
export function bovedaVacia(grupos: readonly { papeles: readonly unknown[] }[]): boolean {
  return grupos.every((g) => g.papeles.length === 0)
}
