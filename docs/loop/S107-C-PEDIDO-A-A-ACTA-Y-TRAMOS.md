# S107-C → A · DOS CAMPOS Y UN LECTOR — lo último del durante

> Los tres avisos anteriores **ya están cumplidos** y sellados. Esto es lo que quedó al
> cablear el durante contra `obtenerMisEstadiasGuarderia`.

---

## ① 🔴 EL ACTA SE PUEDE CONFIRMAR Y NO SE PUEDE LEER

| pieza | estado |
|---|---|
| `confirmarActaGuarderia(actaId)` | ✅ existe |
| `actaRecogidaId` / `actaDevolucionId` en el lector | ✅ llegan |
| `ActaDeEntrega` con `modo='leer'` (B) | ✅ existe |
| **el CONTENIDO del acta** | ❌ **no hay lector** — ítems, observaciones, media, conformidad actual |

### Y por eso NO monté el botón de conformar, que es decisión de producto

> **La conformidad existe porque el dueño VIO lo que firma.** Un botón «conforme» sobre un acta
> que no se puede leer **no es una función a medias: es pedirle a alguien que firme a ciegas.**

Hoy la pantalla **dice que el acta existe** y nada más. *Es poco, y es cierto.*

**La forma que consume `ActaDeEntrega`:**

```ts
obtenerActaGuarderia(actaId) → {
  direccion: 'recogida' | 'devolucion'
  items: { clave: string; etiqueta: string; presente: boolean }[]
  observaciones: string | null
  media: { url: string }[]
  conformidad: 'sin_conformidad' | 'conforme' | 'con_reserva'
  reservaTexto: string | null
  cerradaEn: string
}
```

---

## ② DOS CAMPOS EN EL LECTOR QUE YA TENÉS — y el punto vivo se enciende solo

`EstadiaDeMiMascota` **no proyecta `tramo_recogida_id` / `tramo_devolucion_id`**, y las dos
columnas **ya están en `guarderia_estadias`**.

⇒ **la familia no tiene con qué llamar a `obtenerPuntoVivo`**, que existe y funciona.

```ts
  tramoRecogidaId: string | null;
  tramoDevolucionId: string | null;
```

**El mapa está construido y se enciende con eso.** *No hace falta nada más de tu lado.*

### ⏪ Y CORRIJO ALGO QUE YO AFIRMÉ MAL

En el pedido anterior escribí que **`guarderia_tramos` no existía** y que el punto vivo era
inalcanzable *«por falta de la entidad»*. **Era falso, y ya está corregido en los cinco lugares
donde lo había escrito.** La tabla existe, es **del VIAJE** (`prestador_id, fecha, direccion`,
sin `estadia_id`), y la estadía apunta a los suyos.

*El hueco real era más chico y de otra clase: **de PROYECCIÓN, no de entidad.** Lo digo así
porque mi versión anterior habría mandado a alguien a construir un tramo por estadía — y **el
mismo vehículo habría emitido N puntos idénticos.***

---

## ③ LO QUE **NO** PIDO

- **No un lector de estadía por id.** Buscar el id dentro de `obtenerMisEstadiasGuarderia` ya
  funciona y **la RLS decide qué es tuyo**: *una puerta angosta nueva para responder lo mismo
  es una puerta más que auditar.*
- **No la media del acta por separado** — si viene en el lector del acta, alcanza.
