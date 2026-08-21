# CENSO · FASE 5 — LA SUPERFICIE DEL MEDIO DE PAGO
> S101-B · 20-ago-2026 · **medición, cero código** · contrato contra `LETRA_PUERTA_DE_PAGO_S101B` v1.2

---

## ① QUÉ EXISTE HOY — la lista completa, sin adornos

| pieza | estado medido |
|---|---|
| **Motor** (`tarjetas_guardadas`, alta, alias, `proveedor_uid`) | ✅ **completo y probado** |
| **Wrapper** `listarTarjetasGuardadas()` | ✅ existe · **UN solo consumidor** |
| **Lista en Cuenta** | 🔴 **NO EXISTE.** `cuenta/pagos.tsx` es **historial de pagos**, y sus últimas dos líneas dicen `pagosMetodos` / **`pagosMetodosPronto`** — *«próximamente», escrito hace sesiones* |
| **Celda de alta en Cuenta** | ⚠️ **ANDAMIO**: `cuenta/index.tsx` llama `abrirAltaDeTarjeta` y **se dibuja solo si hay config** |
| **Selección en el checkout** | 🔴 **NO EXISTE.** `checkout.tsx` toma **la primera de la lista** (`tj.data[0]`) vía `cobro-andamio.ts` |
| **Agregar desde el checkout** | 🔴 no existe |
| **Borrar (P1)** | 🔴 no existe |
| **Voz del vencimiento** | 🔴 no observable — *no hay pantalla donde una tarjeta pueda decir que venció* |

**Los números vivos (medidos 20-ago):** **6 tarjetas guardadas · 1 sola persona ·
1 con alias · 0 rechazadas.**

🔴 *Seis tarjetas de la misma persona y un solo alias es exactamente el retrato
del problema: sin pantalla, las tarjetas se acumulan sin nombre y **nadie puede
distinguirlas ni borrarlas**. La que se cobra hoy es «la más reciente» — o sea,
la última que alguien probó.*

## ② 🔴 LOS DOS ANDAMIOS, CON SU MUERTE YA ESCRITA

**Los dos nacieron declarando que iban a morir en esta fase** —está en sus propios
comentarios— *y por eso esta fase no es «mejorar una pantalla»: es cobrar una
deuda que se tomó a propósito.*

1. **`cobro-andamio.ts`** — *«la tarjeta más reciente» es regla de ANDAMIO, jamás
   de producto*. **Elegir por la familia cuál de sus tarjetas se cobra es
   exactamente lo que una pantalla de medios de pago existe para no hacer.**
2. **La celda de alta en Cuenta** — existe para poder probar el alta, no para que
   una familia la use.

## ③ EL CONTRATO DE LA PANTALLA — con la precisión del founder

🔴 **Se diseña como SELECCIÓN DE MEDIO DE PAGO, no de tarjeta.** Las tarjetas van
**adentro** de un medio, con **alias + marca + últimos 4**.

> **El porqué, que es de arquitectura y no de estética:** **DeUna entra como
> segundo riel sobre el mismo contrato de compra** cuando llegue su ambiente
> (corte **11-sep**). *Si la pantalla se llama «tus tarjetas», el día que entre
> DeUna hay que rehacerla; si se llama «cómo querés pagar», DeUna es una fila
> más.* **El nombre de la pantalla es la decisión de arquitectura.**

**Alcance (plan §7 + letra v1.2):**
- **Lista en Cuenta** — reemplaza el «próximamente» que lleva sesiones ahí.
- **Elegir en el checkout** — ☠️ mata «la más reciente».
- **Agregar desde el checkout**, sin perder la compra en curso.
- **Borrar con P1.**
- 🔴 **El alta nace AL TOCAR «agregar», jamás al abrir la pantalla.** *La lección
  ya se pagó: un andamio que creaba el alta al abrir volvió `abandonada`
  inobservable — un estado que no se puede producir no se puede probar.*
- **La voz del vencimiento, por fin observable** — hoy no hay dónde decirlo.
- ☠️ **Mueren los dos andamios.**

## ④ LO QUE **NO** HAY QUE CONSTRUIR

Motor de tarjetas · alta con su WebView y sus tres desenlaces · alias · el cobro
con `proveedor_uid` · las compuertas · el actuador · el comprobante.
**Todo eso ya corre.** *Fase 5 es superficie sobre motor probado — que es la
posición más barata en la que se puede empezar una fase.*

## ⑤ EL GATE VISUAL

El **CÓMO** por `DIRECCION_ARTE` + la skill, **con su gate propio**: es la
pantalla donde la familia elige con qué plata paga, y **no hay ninguna medición
que reemplace un ojo mirándola**.
