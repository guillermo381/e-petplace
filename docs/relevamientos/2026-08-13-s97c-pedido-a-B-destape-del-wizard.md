# PEDIDO DE C → B · EL DESTAPE DEL WIZARD DE ALTA (S97-C)

**Fecha:** 13-ago-2026 · **Pide:** pista C (wizard de alta + tab ATENDER) ·
**Construye:** pista B (`packages/ui`) · **Contrato:** firmado de mesa, servido
verbatim en sus cinco puntos.

> **Por qué se pide y no se clona:** es una pieza de celebración con rampa de
> marca. La regla de la casa es que las primitivas las autora B con contrato
> exacto; C consume. Este documento ES el contrato — si algo acá está
> incompleto, es un hueco de C y se enmienda acá, no se improvisa en la
> pantalla.

---

## 1 · QUÉ ES

La pieza que corre **una sola vez**, al cerrar el wizard de alta del
prestador: el momento en que el negocio termina de nacer y la casa se le
abre. No es un toast ni una pantalla de éxito — es **el destape**.

## 2 · ENTRADAS (contrato exacto)

| entrada | tipo | notas |
|---|---|---|
| `nombreNegocio` | `string` | el nombre tal como quedó en el alta |
| `logo` | `{ uri: string } \| null` | si es `null`, la pieza cae al **monograma** (pieza `LogoNegocio` ya existe en la casa — S74) |
| `tabsHabilitadas` | `Array<{ key: string; etiqueta: string }>` | las tabs que quedaron habilitadas para ESTE negocio, en orden de barra |

**Nada más entra.** La pieza no lee motor, no navega, no decide qué tabs
existen: recibe la lista ya resuelta.

## 3 · DISPARO

**El cierre del wizard**, y solo eso. No se monta en reposo, no se re-dispara
al volver, no tiene modo demo en producción (sí en `/gallery`).

## 4 · LA SECUENCIA FIRMADA (en orden, sin pasos de más)

1. **Isotipo.**
2. **La rampa de 6 stops se enciende** — **solo-marca**, legal por
   `DIRECCION_ARTE §9bis.3`. *(Es el único lugar del prestador donde la rampa
   es legal: fuera del destape sigue prohibida.)*
3. **La tarjeta del negocio** — nombre + logo/monograma.
4. **Las tabs se materializan escalonadas**, 45/300 (la entrada de la casa).
5. **La luz de la esquina.**

## 5 · LEYES QUE LA PIEZA CUMPLE (y C va a auditar contra ellas)

- **Duración total: banda de 520** — `N10`, la duración *grande*, reservada a
  la celebración. Es el techo, no un objetivo: si sale en menos y se lee
  mejor, mejor.
- **Bezier único de la casa** `(.32,.72,0,1)`. Cero curvas nuevas.
- **Reanimated, por los rieles de la casa** (Software Mansion pone el código;
  nada de `Animated` de RN a mano).
- **N5 — un acento**: la rampa es la excepción declarada de este momento; el
  resto de la pieza no suma acentos.
- **Memorial**: si el tema memorial pudiera alcanzarla, la pieza queda
  **quieta** (precedente `EsperaDeMarca`, S59). *C declara que no debería ser
  alcanzable — el alta no ocurre en memorial —, pero la pieza no debe
  romperse si lo es.*
- **Reducción de movimiento**: si el sistema la pide, la pieza degrada a
  crossfade; jamás se salta el contenido.

## 6 · LO QUE C NECESITA DE VUELTA

- El **nombre exacto del export** y su ruta en `@epetplace/ui`.
- La **firma de props** final (si B la ajusta, manda; C consume lo que B
  autora).
- Si la pieza expone un **callback de fin** (`alTerminar`) — C lo necesita
  para navegar a la casa recién abierta cuando el destape termina. **Si B
  prefiere no exponerlo, decilo y C resuelve con temporizador contra la banda
  de 520.**

## 7 · LO QUE ESTE PEDIDO NO DECIDE

La **forma** — proporciones, color exacto de la luz, cómo se materializa una
tab. Eso es de B. El gate es del founder por LOTE, no por pieza.
