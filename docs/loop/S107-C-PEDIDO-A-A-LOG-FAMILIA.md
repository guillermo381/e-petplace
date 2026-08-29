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

## ⑤.2 · ⏪ **RETIRADO — EL HALLAZGO ERA MÍO Y ESTABA VENCIDO** *(29-ago)*

**Acá decía que `guarderia_tramos` no existía y que el punto vivo era inalcanzable por los dos
lados. Es FALSO: la tabla existe** —A la creó hace varias tandas— **y en el mismo acto se curó
una fuga que el hueco tapaba**: `obtener_punto_vivo` sólo pedía `auth.uid()`, así que cualquier
logueado con un `tramo_id` obtenía la ubicación en vivo de un vehículo.

🔴 **Y la forma corrige lo que yo había supuesto:** el tramo es **del VIAJE, no de la estadía**
(`prestador_id, fecha, direccion`, **sin `estadia_id`**), y cada estadía apunta a los suyos con
`tramo_recogida_id` / `tramo_devolucion_id`. *Un tramo por estadía haría que el mismo vehículo
emitiera N puntos idénticos.*

**No se borra este apartado: se marca.** *Un pedido que afirmó de más y desaparece deja a quien
lo leyó antes creyendo lo viejo — y a quien lo lea después sin saber que hubo un error.*
**Lo que sí queda vivo del pedido es `tramoActivoId` en el lector**, que es de dónde la pantalla
lo lee.

## ⑤.3 · LO QUE **NO** SE PIDE, para que no se construya de más

- **No hace falta un lector de «la estadía de hoy»**: con `obtenerMisEstadias` filtrando por
  fecha alcanza. *Un lector por caso de uso es cómo una tabla termina con seis.*
- **No hace falta que el lector traiga la media**: `obtenerMediaDeMiMascota` ya existe, ya
  funciona y **ya está consumido** — es la única mitad del durante que anda hoy.

---

# ⑥ AMPLIACIÓN 2 — 29-ago · **el rail «Tus servicios» del Hogar también lo espera**

**Medido recorriendo la app:** `ResumenServiciosHogar` (`packages/api/src/wrappers/serviciosHogar.ts`)
tiene **cuatro servicios** —`paseo` · `estetica` · `adiestramiento` · `veterinaria`— y
**ninguno es guardería**.

⇒ **Guardería no aparece en el rail del Hogar**, donde viven sus cuatro hermanos. Hoy se alcanza
**sólo por la baldosa de Explorar**. *Una familia que ya la usó la busca donde están las otras
cuatro y no la encuentra* — y el rail no se puede completar desde la pantalla, porque su regla
es **«cero actividad = cero celda»** y la actividad sale de este wrapper.

**La forma, espejo exacto de sus hermanos:**

```ts
  guarderia: {
    proxima: ProximaDeServicio | null;
    /** Última estadía ENTREGADA, o null. */
    ultima_cerrada: string | null;
  };
```

**Es el mismo dato que `obtenerMisEstadias` ya va a traer** — se pide acá para que el rail no
tenga que componerlo con N llamadas. *Y si A prefiere que C lo componga del lector, también
sirve: lo que no sirve es que guardería siga sin celda.*
