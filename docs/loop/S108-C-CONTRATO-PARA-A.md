# S108 · C → A · EL CONTRATO QUE LA PANTALLA NECESITA PARA T3 y T4

> **Publicado el 30-ago-2026, ANTES de estar listo para `main`.** Orden del
> founder: *«Un artefacto que otra pista debe medir se publica aunque no esté
> listo para main.»* Vive en `pista/s108-c`.
>
> **Qué es:** lo que C necesita de A para que el paquete y la mensualidad
> **esperen la verdad del servidor** en vez de declarar éxito solos. **No es un
> diseño de motor** — es el contrato que la superficie consume. Cómo se cumple
> del lado de la base lo decide A.
>
> **Regla de la casa que rige acá (S54):** un pedido entre pistas viaja como
> **bloque literal autocontenido**, jamás por referencia a un reporte ajeno.
> Todo lo que sigue está medido contra `main` `15bbb5b4`, no recordado.

---

## ⓪ EL ESTADO MEDIDO — de dónde parte este pedido

| pieza | hoy | medido en |
|---|---|---|
| `SujetoDeCobro` | `{tipo:'compra'} \| {tipo:'cita'}` | `packages/api/src/wrappers/pagos-cobro.ts:41` |
| edge `pagos-cobro` | sólo lee `compra_id` y `cita_id` | `supabase/functions/pagos-cobro/index.ts:101-102` |
| lectores de espera | `leerEstadoCompra` · `leerEstadoCita` | `packages/api/src/wrappers/pagos-espera.ts:25,65` |
| lector de bonos | filtra `.eq('estado_pago','pagado')` | `guarderia-reserva.ts:1176` |
| `pagos_intentos` | tiene `bono_id` en el XOR; **no** tiene columna de mensualidad | `PLAN_S108…` §① |

⇒ **Son dos sujetos nuevos, y la mensualidad además no tiene columna.**

---

## ① `SujetoDeCobro` — los dos valores nuevos

La pantalla llama a `cobrar()` con un sujeto y **lee la respuesta como señal
optimista, jamás como confirmación** — igual que hoy con la cita. Necesita:

```ts
// packages/api/src/wrappers/pagos-cobro.ts
export type SujetoDeCobro =
  | { tipo: 'compra'; id: string }
  | { tipo: 'cita'; id: string }
  | { tipo: 'bono'; id: string }            // ← paquete de guardería
  | { tipo: 'suscripcion'; id: string };    // ← mensualidad de guardería
```

Con su pata en la edge (`bono_id`, `guarderia_suscripcion_id` en el cuerpo) y en
`pagos_intentos` (la columna de la mensualidad entra al XOR — Paso 1 del plan).

**Lo que C NO necesita que cambie:** `SenalDeCobro` y `CodigoCobro` sirven tal
cual. Si nacen códigos nuevos, **que sean tipados**: `cobro.ts` los traduce a voz
con un `switch` exhaustivo y el typecheck obliga a darles frase — *un código que
cae al cajón de «desconocido» sin que nadie se entere es la clase de cosa que
esta casa no deja pasar.*

---

## ② LOS LECTORES DE ESPERA — uno por sujeto, con la MISMA forma

`useEsperaDeConfirmacion` sondea con backoff y **corta cuando el sujeto se
resuelve**. Hoy hace `tipo === 'compra' ? leerEstadoCompra(id) : leerEstadoCita(id)`
(`espera-confirmacion.ts:174`). Para los dos sujetos nuevos necesita **la misma
firma exacta** — `{ estado, resuelta }` — porque la máquina compara `resuelta` y
la pantalla compara el estado en el vocabulario de su sujeto:

```ts
// packages/api/src/wrappers/pagos-espera.ts

export type EstadoBono = 'pendiente_pago' | 'pagado' | 'vencido' | 'cancelado';
export async function leerEstadoBono(bonoId: string):
  Promise<ResultadoWrapper<{ estado: EstadoBono; resuelta: boolean }, …>>;
// resuelta = estado === 'pagado' || estado === 'vencido' || estado === 'cancelado'

export type EstadoMensualidad = 'esperando_pago' | 'activa' | 'fallida' | 'cancelada';
export async function leerEstadoMensualidad(suscripcionId: string):
  Promise<ResultadoWrapper<{ estado: EstadoMensualidad; resuelta: boolean }, …>>;
// resuelta = estado !== 'esperando_pago'
```

### 🔴 Dos avisos sobre la mensualidad, y no son de forma

**(a) El estado que la pantalla necesita NO es el ciclo de vida de la
suscripción.** `guarderia_suscripciones.estado` es
`activa|pausada|cancelada|vencida` y **nace `'activa'` por default de tabla**
(`20260830200000:74-75`), o sea que **hoy ya está `activa` antes de que exista un
cobro**. *Si la pantalla sondeara esa columna, vería `activa` en el primer tick y
declararía éxito sin que la plata se haya movido — que es exactamente el defecto
que T3 viene a cerrar.* ⇒ el veredicto tiene que salir del **pago**, no del ciclo
de vida. La tabla ya tiene por dónde: `periodo_desde` es `NULL` mientras no haya
cobro, y su propio comentario lo dice.

**(b) Con la firma del founder del 31-ago —PAGAR ES ARRANCAR— el orden cambia.**
Hoy `contratar_mensualidad_guarderia` firma el mandato y devuelve
`'cobrada', false` hardcodeado. **C prefiere el patrón de la casa**, que es el de
la cita: *el sujeto nace primero, el motor lo cobra después.* O sea: contratar
devuelve `suscripcionId` → la pantalla llama `cobrar({tipo:'suscripcion', id})` →
espera. **Que el RPC cobre por dentro también funcionaría para la pantalla, pero
rompe la simetría con los otros tres sujetos** — y esa simetría es lo que hace
que la espera sea UNA pieza y no cuatro. **La decisión es de A; C se adapta.**

---

## ③ EL LECTOR DE BONOS — qué deja de filtrar (T4)

```ts
// packages/api/src/wrappers/guarderia-reserva.ts:1176
.eq('estado_pago', 'pagado')   // ← esto se cae
```

Con el Paso 0 del plan (el bono nace `pendiente_pago` y vence a los 15′), ese
filtro vuelve **invisible** todo bono que no se pagó. *Un bono que la familia
intentó comprar y no aparece en ninguna pantalla es plata que ella cree haber
gastado y nosotros no podemos ni nombrar.*

**Lo que la pantalla necesita:** que `PaqueteCompradoGuarderia` **exponga
`estadoPago`** y que el lector devuelva también los `pendiente_pago` y los
`vencido`. **El filtrado lo hace la pantalla**, que es quien sabe qué contar y
qué decir:

```ts
export interface PaqueteCompradoGuarderia {
  // … lo que ya tiene …
  estadoPago: 'pendiente_pago' | 'pagado' | 'vencido' | 'cancelado';
}
```

⚠️ **Sin esto T4 no se puede construir**, y su ausencia **no da error**: el hogar
sigue pintando la lista, sólo que sin una fila que debería estar. *Es la clase de
defecto que no tiene síntoma porque el que falta no se ve* (el cursor del
Bio-Expediente, S99).

---

## ④ LO QUE C HACE SIN ESPERAR A NADIE

Para que A no presupueste de más: **T1 (el total del paquete), T2 (la
mensualidad sin selector) y T5 (la cancelación gana puerta) no tocan motor.** T5
consume `cancelar_mensualidad_guarderia`, que **ya existe y ya está grantada a
`authenticated`** (`20260831000000:167,208`) — sólo le falta wrapper y pantalla.

**Lo único que C le pide a A es lo de arriba: ① ② ③.**
