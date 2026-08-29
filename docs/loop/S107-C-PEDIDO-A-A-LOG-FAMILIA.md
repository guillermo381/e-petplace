# S107-C → A · PEDIDO AUTOCONTENIDO — el lector de estadías del lado de la FAMILIA

> **Qué destraba:** el **log** del hub de guardería — la mitad que los otros cuatro oficios tienen y guardería no. **Firma de la mesa:** *«el LOG se construye, no se pospone: una familia que reserva y no tiene dónde ver sus estadías es lo que hace que el oficio se sienta ajeno.»*
> **Por qué a A:** es un lector nuevo. **C tiene su mitad construida e inerte** (el hub ya monta las piezas del patrón; le falta con qué llenar la lista).

---

## ① POR QUÉ NO ALCANZA LO QUE YA EXISTE — medido

`obtenerEstadiasDelDia(prestadorId, fecha)` **no sirve acá**, y no es cuestión de permisos:

| | el que existe | el que hace falta |
|---|---|---|
| **eje** | **por PRESTADOR y por DÍA** | **por MASCOTA/FAMILIA, a lo largo del tiempo** |
| **quién pregunta** | el cuidador: *«¿a quiénes recibo hoy?»* | la familia: *«¿cuándo va Thor, y cuándo fue?»* |
| **verdad** | sólo firme (sin holds) — correcto para salir a buscar | 🔴 **la familia SÍ necesita ver su reserva sin pagar**: es la que tiene que ir a pagarla |

*Son dos preguntas distintas sobre la misma tabla, y la segunda no se puede componer llamando N veces a la primera.*

---

## ② LA FORMA QUE C CONSUME

```ts
obtenerMisEstadias(params: {
  mascotaId?: string | null;   // null = todas las de la familia
  desde?: string; hasta?: string;  // 'YYYY-MM-DD'; por defecto, ventana razonable
}): Promise<ResultadoWrapper<EstadiaDeLaFamilia[], CodigoError…>>

interface EstadiaDeLaFamilia {
  estadiaId: string;
  citaId: string;
  fecha: string;                 // 'YYYY-MM-DD'
  estado: EstadoEstadia;         // el vocabulario que ya existe
  /** 🔴 Para que la familia sepa si le falta pagar. */
  estadoReserva: 'pendiente_pago' | 'pagada' | 'expirada' | 'cancelada';
  expiraEn: string | null;       // el hold, si sigue vivo
  prestadorId: string;
  prestadorNombre: string;
  mascotaId: string;
  mascotaNombre: string;
  /** Las dos ventanas del lugar ESE día, congeladas o vigentes — la familia
   *  pregunta «¿a qué hora pasan?» y hoy sólo lo sabe entrando al lugar. */
  recogeDesde: string | null; recogeHasta: string | null;
}
```

🔴 **`estadoReserva` es la diferencia que importa.** Sin él, una reserva con el hold vivo **se vería igual que una pagada**, y la familia no sabría que tiene quince minutos para pagar. *El lector del prestador filtra los holds a propósito; el de la familia no puede.*

---

## ③ QUÉ HACE C CUANDO LLEGUE

El hub pasa a tener **el esqueleto de sus cuatro hermanas**, que ya está censado y firmado: `Encabezado` → **`FiltroMascotas`** → **`FiltroPills`** (próximos / historial) → **`FilaCita`** → **CTA al pie** hacia el flujo.
**Hoy el hub monta las piezas de selección y le falta exactamente esto: la lista.**

---

## ④ UNA PREGUNTA QUE ES DE MESA Y NO DE CÓDIGO

**¿La estadía entra a la Línea de Vida del expediente?** Los otros cuatro oficios sedimentan. **Guardería todavía no**, y no lo decido yo. *Si entra, el evento nace al entregar —como el paseo— y no al reservar.*

---
---

# ⑤ AMPLIACIÓN — 29-ago-2026 · **el mismo lector destraba también EL DURANTE**

> **Por qué se amplía en vez de abrir otro pedido:** construí el durante del dueño y
> **choca contra este mismo lector**. Pedir un segundo lector para la misma tabla sería
> fabricar dos verdades sobre la estadía de una familia.

## ⑤.1 · DOS CAMPOS MÁS EN `EstadiaDeLaFamilia`

```ts
  /** El acta que espera la conformidad del dueño. `null` = ninguna pendiente. */
  actaPendienteId: string | null;
  /** El tramo en curso — ver ⑤.2 antes de implementarlo. */
  tramoActivoId: string | null;
```

**`actaPendienteId` es barato y destraba una pieza entera:** `confirmarActaGuarderia(actaId)`
**ya existe y funciona**, y `ActaDeEntrega` (B) tiene su `modo='leer'` con `onConformar`.
*Lo único que falta es de dónde sacar el `actaId`.*

---

## ⑤.2 · 🔴 EL HALLAZGO DE MOTOR — el punto vivo no tiene de dónde colgar

`obtenerPuntoVivo(tramoId)` y `registrarPuntoVivo({tramoId,…})` existen, están bien escritos
y pasan sus pruebas. **Medido contra el esquema el 29-ago:**

| | |
|---|---|
| **`guarderia_tramos`** | **NO EXISTE.** No hay tabla de tramos |
| `guarderia_tramo_punto.tramo_id` | uuid **sin FK** — `Relationships: []` en los tipos generados |
| `guarderia_estadias` | **no tiene columna de tramo** (sus columnas son `cita_id`, `espacio_id`, `estado`, `a_bordo_en`, `llegada_en`, `entregada_en`) |

> ### ⇒ **Nadie puede producir un `tramoId` y nadie puede obtenerlo.**
> El punto vivo es inalcanzable **por los dos lados**, y **no por permisos: por falta de la
> entidad que los une.**

**Es `L-318` («motor sin puerta») un piso más adentro, y por eso se declara con esta forma:**
*la pieza existe, es alcanzable desde afuera y pasa sus pruebas — **lo que no tiene productor
es el identificador con el que abre**. Y no falla: devuelve `null`, que la pantalla lee
correctamente como «todavía no salió».* **Un hueco que se lee como un estado normal no deja
síntoma.**

**Lo que C ya hizo con esto:** el mapa está montado y **se enciende solo** el día que
`tramoActivoId` deje de ser `null`. **Cero trabajo de superficie pendiente.**

**Y la regla que va con él, para quien construya el productor:** el lector devuelve **UN PUNTO
O `null`, jamás una lista** — *las paradas de una ruta son las casas de otras familias.* Del
lado de la pantalla eso ya está garantizado **por construcción** (se le pasa a `MapaRecorrido`
un array de exactamente un punto, y una polilínea de un punto no dibuja nada), **pero el
recorte tiene que seguir viviendo en el servidor**: si el lector algún día devolviera dos
puntos, la garantía de la pantalla se caería sola.

---

## ⑤.3 · LO QUE **NO** SE PIDE, para que no se construya de más

- **No hace falta un lector de «la estadía de hoy»**: con `obtenerMisEstadias` filtrando por
  fecha alcanza. *Un lector por caso de uso es cómo una tabla termina con seis.*
- **No hace falta que el lector traiga la media**: `obtenerMediaDeMiMascota` ya existe, ya
  funciona y **ya está consumido** — es la única mitad del durante que anda hoy.
