# S107-C → A · PEDIDO CHICO — **las dos ventanas en el mismo lector**

## LO QUE PASA HOY

La vitrina de «quién puede» muestra, por lugar, **el cupo del día y las dos ventanas** — que es
lo que la familia mira para saber si le sirve. El cupo viene en `GuarderiaDisponible`; **las
ventanas no**, y se piden con `obtenerFranjasGuarderia(prestadorId)`:

> ### **una llamada POR LUGAR.**

Se piden en paralelo y **la fila no espera** —si no llegaron, se dibuja sin ellas—, así que
**no está roto**. Pero es un N+1 con nombre.

## POR QUÉ SE PIDE IGUAL, aunque hoy no duela

**Con los seis lugares de hoy es barato. Con sesenta es la pantalla entera esperando.** *Y el
momento de pedirlo es antes de que duela: después, el que lo sufra va a estar apagando un
incendio y va a resolverlo con un caché.*

Las franjas son **configuración del prestador**, no del día: **es un join, no una consulta
nueva.**

```ts
  /** 'HH:MM:SS'. `null` = el lugar todavía no declaró esa ventana. */
  recogeDesde: string | null; recogeHasta: string | null;
  devuelveDesde: string | null; devuelveHasta: string | null;
```

🔴 **Los cuatro pueden ser `null` por separado y eso es un caso REAL** — un lugar puede tener la
recogida declarada y la devolución no. *La pieza (`FichaFranja`) ya lo contempla: sin devolución
no dibuja ni el rango ni el separador, jamás un «—» que se lea como dato.*

## LO QUE **NO** PIDO

- **No los días de la semana ni la zona horaria.** La vitrina informa la ventana del día que la
  familia ya eligió; *el resto ya lo filtró el server.*
- **No que desaparezca `obtenerFranjasGuarderia`** — el perfil del lugar y la config del
  prestador lo usan bien, y ahí es una consulta por una cosa.
