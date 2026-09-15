# ☠️ `AccionCarrito` — lápida (S116-C lote 3b)

☠️ **`AccionCarrito` MURIÓ — S116-C lote 3b.** El archivo queda sin cuerpo y
con su lápida: la pieza ya no existe y esto es lo único que queda de ella.

── POR QUÉ MUERE, Y ES EXACTAMENTE LO QUE ELLA MISMA PREDIJO ─────────────
Nació en el lote 8 declarando su propia orilla:

> *«Esto muere el día que `Encabezado` gane `carrito` (pedido a B en el
> buzón): ahí las cuatro colapsan en la prop y este archivo se borra. Se
> escribe sabiendo que es un puente, y con el nombre de su orilla.»*

**La orilla llegó por el otro lado:** no fue `Encabezado` el que ganó
`carrito` — fue `Cabecera`, y las cuatro raíces migraron a ella en este lote.
*El puente acertó en que era un puente y erró en cuál sería la orilla; lo que
lo hizo barato fue haber escrito que era uno.*

⚠️ **Medido antes de borrar: `<AccionCarrito` da CERO en `apps/cliente/src`.**
Las cuatro raíces que lo montaban —Explorar, Actividad, Cuenta y Despensa—
pasan a `Cabecera.carrito`, que es la prop que `DiscoVidrio` vino a habilitar.

🔴 **Y el archivo NO se deja vacío con un `export {}`:** `verify:piezas-locales`
cuenta los `.tsx` de `components/`, así que un archivo hueco **seguiría
contando como una pieza del catálogo sin serlo** — es la trampa que la lápida
de los tres pasos del alta ya documenta. Por eso esto es un `.md` al lado y el
`.tsx` se borra.

