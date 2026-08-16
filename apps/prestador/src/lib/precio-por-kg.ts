/**
 * EL PRECIO POR KILO — «el escalón que nadie pone» (receta B §1③, N19).
 *
 * Vive aparte porque **es la única regla de la ficha que se puede probar sin
 * montar nada**, y porque su forma tipográfica depende de que sea un
 * CÁLCULO: la receta lo manda en mono `dato` justamente para que se lea como
 * derivado por una máquina (Ley 3). *Si la pantalla lo compusiera inline,
 * el número quedaría sin dueño y sin test.*
 *
 * ── 🔴 LO QUE ESTA FUNCIÓN NO HACE, declarado ────────────────────────────
 * **No inventa el peso.** `peso_kg` es `null` en la fuente para todo lo que
 * no se vende por peso (un collar, una lata contada por unidad) y para lo
 * que el catálogo canónico todavía no declaró. En los dos casos devuelve
 * `null` y **la ficha no pinta el escalón** — jamás un `$0,00 / kg` ni un
 * «—», que se leerían como un dato medido.
 *
 * **No redondea el precio, redondea la LECTURA.** Dos decimales, que es lo
 * que un vendedor compara de un vistazo; el cálculo interno no se trunca
 * antes de dividir.
 *
 * ── ⚠️ ACOPLAMIENTO DECLARADO CON LA FICHA DE LA FAMILIA (N17) ───────────
 * **Medido hoy: la ficha del cliente NO muestra `$/kg`** (`peso_kg` no
 * aparece en `apps/cliente/src` fuera del peso de la mascota). Entonces
 * este cálculo **es del modo Administrar hasta que D lo monte en la ficha
 * de la familia** — pintarlo en «Ver como cliente» haría que el vendedor
 * crea que la familia ve algo que no ve, que es **exactamente la falla que
 * N17 existe para evitar**, y en la dirección que nadie va a ir a revisar.
 *
 * **Y cuando D lo monte, esta función NO se copia: se promueve a
 * `packages/domain`.** Dos implementaciones del mismo cociente son dos
 * verdades que divergen en el primer redondeo — el mismo criterio con el
 * que `razonesDeAlcance` se negó a tener un cómputo paralelo.
 */

/** `null` = no se puede calcular, y la ficha OMITE el escalón. */
export function precioPorKg(precio: number | null, pesoKg: number | null): number | null {
  if (precio === null || pesoKg === null) return null;
  // El peso no positivo no es «cero por kilo»: es un dato roto. Dividir
  // daría Infinity o un negativo con cara de precio.
  if (!Number.isFinite(precio) || !Number.isFinite(pesoKg) || pesoKg <= 0) return null;
  if (precio < 0) return null;
  return Math.round((precio / pesoKg) * 100) / 100;
}
