# S115-B → A · DOS LECCIONES PARA EL CANON (firmadas por el founder, 10-sep-2026)

**Por qué va por buzón y no lo escribo yo:** `docs/DEUDAS_CANONICAS.md` es
territorio de A. Las dos leyes **ya están asentadas donde se LEEN al
construir** (ver abajo); lo que falta es su asiento en el canon con número.

**Números pedidos al comando, no elegidos** (`pnpm proximo:ficha`): tope
`L-533` ⇒ **`L-534` y `L-535` libres**. **Cruzados contra las ramas vivas**:
`pista/s115-b-1.0` es la única `s115-*` en origin, así que nadie más los tomó.
*(Si al mergear hubiera otra rama con esos números, son míos los que se
corren — el texto va abajo completo para que se pueda renumerar sin perderlo.)*

---

## `L-534` — UNA REGLA ATADA AL VALOR MUERE CON LA FIRMA; UNA ATADA A LA FORMA SOBREVIVE

> Literal del founder: *«R87 se escribió con "punto" y sigue sirviendo con
> "coma" porque mide que haya una sola fuente, no cuál es el separador. Es el
> criterio para escribir las que vengan.»*

**El caso que la funda, con su arco completo:** `R87` nació con la firma *«el
formato de la plata es PUNTO»* y **el founder la enmendó el mismo día a COMA**
—con razón medida: el separador de miles y los RIDE del SRI—. **La regla no se
tocó en un byte**, porque lo que mide no es el separador: es **que haya UNA
sola fuente de formato**.

🔴 *Si hubiera medido «que diga punto», la enmienda la habría dejado midiendo
lo contrario de lo firmado — y en VERDE.*

**Cómo se aplica, antes de escribir una regla nueva:** *«¿esto sigue siendo
cierto si el founder cambia de opinión sobre el valor?»* Si la respuesta es no,
la regla está atada al valor y hay que subir un nivel hasta el invariante — que
casi siempre es *una sola fuente*, *una sola forma*, *nadie lo escribe a mano*.

**Ya asentada en:** la cabecera de `scripts/verify-diseno.mjs`, que es lo que
lee quien va a escribir una regla.

---

## `L-535` — UN PARSEO TOLERANTE ES EL QUE DEVUELVE EL NÚMERO PLAUSIBLE

> Literal del founder: *«Por eso NaN ante formato ajeno es la cura y no un
> helper permisivo al lado — es la misma forma que ya usaste para hacer
> inexpresable la promoción sin su precio tachado.»*

**El defecto que la funda, medido:** `'1.234,50'.replace(',', '.')` →
`'1.234.50'` → `parseFloat` → **1.234**. Plausible, equivocado **y FINITO** —
así que `Number.isFinite`, que era el guard, **no disparaba**. *El guard existía
y el defecto pasaba por debajo.*

**La cura no fue leer mejor: fue que el estado malo no se pueda producir.**
`parsearPrecio` valida la FORMA antes de parsear y devuelve `NaN` ante un
formato ajeno ⇒ el guard que ya existía vuelve a servir.

**Y es la misma forma, tres veces en la misma sesión:** la promoción sin precio
tachado (unión discriminada en `DesgloseCompra`), el motivo de rechazo del SRI
(`TarjetaFactura`: ni prop ni slot) y esto. *Cuando un estado no debe poder
existir, no se documenta que no debe existir — se hace que no se pueda
escribir.*

**Ya asentada en:** `packages/i18n/src/moneda.ts`, junto al parseo.

---

## Contexto operativo para A

Todo esto vive en **`pista/s115-b-1.0`** y **NO está publicado, por orden del
founder**: entra en el OTA que armes con el checkout cableado.

Lo que la rama trae para el checkout: las cinco piezas de la factura, la línea
de tarifa de servicio, y **la fuente única de plata** (`formatearPrecio` /
`parsearPrecio` en `packages/i18n`, con `monto()` delegando).

⚠️ **Dos cosas que te van a tocar al cablear:**
1. **`EstadoFactura` NO es `facturas.estado`** — traducir del vocabulario del
   SRI a lo que se le dice a una persona es decisión de producto, y se hace
   afuera de la pieza.
2. **`R89` vigila que ningún monto FORMATEADO viaje a un payload.** Al motor y
   al XML fiscal la plata va **numérica con punto decimal**; el formateador es
   sólo de presentación. Si la regla te sale roja al cablear, es eso.
