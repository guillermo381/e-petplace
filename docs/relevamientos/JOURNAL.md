# JOURNAL — el catálogo de actas, handoffs y volcados

**Para qué existe:** `docs/relevamientos/` tiene más de doscientos archivos y
`docs/actas/` una decena. **Hasta hoy, encontrar el cierre de ayer era un `ls`
ordenado por fecha** — que funciona mientras te acordás de la fecha, y deja de
funcionar justo cuando no.

> ***Un directorio no es un índice: es una pila.*** Este archivo es la entrada,
> y su regla es una sola: **la sesión que cierra escribe su fila ANTES del
> HANDOFF.**

---

## Cómo se lee

- **Acta de sesión** = el cierre de la MESA, transversal a las pistas. Es lo que
  se lee primero.
- **HANDOFF / volcado de pista** = el cierre de UNA pista, para su sucesora.
  Tiene el detalle que el acta apunta y no duplica.
- Cuando los dos existen, **el acta manda sobre lo transversal y el handoff
  sobre su territorio.** Si se contradicen, gana el más nuevo **y se enmienda
  el otro en su lugar** — *dos letras que se contradicen son peores que una
  equivocada.*

---

## S98 · 14-16 ago 2026 — LA CASA DEL PRESTADOR SE ORDENA, Y EL VENDEDOR ENTRA

**ACTA:** [`2026-08-16-s98-ACTA-CIERRE.md`](2026-08-16-s98-ACTA-CIERRE.md)

| pista | cierre |
|---|---|
| A (motor · docs · merges) | [`2026-08-16-s98a-HANDOFF-CIERRE.md`](2026-08-16-s98a-HANDOFF-CIERRE.md) |
| B (`packages/ui` · jueces) | [`2026-08-15-s98b-HANDOFF-CIERRE.md`](2026-08-15-s98b-HANDOFF-CIERRE.md) |
| C (prestador · ventas) | [`2026-08-16-s98c-HANDOFF-FINAL.md`](2026-08-16-s98c-HANDOFF-FINAL.md) — cierra por trabajo terminado, no por ventana |
| D (HOY · roles · guard) | [`2026-08-14-s98-d-HANDOFF-CIERRE.md`](2026-08-14-s98-d-HANDOFF-CIERRE.md) |

**En una línea:** la reorganización del prestador completa (ATENDER · wizard ·
«Llegó» muerto con motor) · el flujo del vendedor (corte con días · alta de
repartidor con identidad y visión IA) · **el pipeline de notificaciones
resucitado** (D-816) con el canal del negocio vivo (D-822) · y las curas de
instrumento de B (331 pares, R41, R30).

**Buscá acá si mañana necesitás:** el orden del tren de cuatro pasos · la
convención E.164 por tabla (D-823) · el mapa de D-824 · por qué
`recursos_reparto` no se toca · la regla 87 · **por qué el trigger de
`llegada_en` no se revierte sin re-cablear un escritor** · las seis trampas
del guard de colisión (handoff de D) · las trampas del aparato y de la consola
(handoff de A §3).

**Piezas sueltas de la sesión que el acta apunta:**
[el mapa de D-824](2026-08-16-s98a-D824-mapa-del-silencio.md) ·
[la entrega a C del repartidor](2026-08-16-s98a-entrega-a-C-repartidor.md) ·
[el contrato de C a A](2026-08-14-s98c-pedido-a-A-corte-y-repartidor.md)

---

## S97 · 13-15 ago 2026 — el mostrador sube a ATENDER

**ACTA:** [`../actas/2026-08-14-s97-ACTA.md`](../actas/2026-08-14-s97-ACTA.md)

| pista | cierre |
|---|---|
| A | [`2026-08-15-s97a-HANDOFF-CIERRE-2.md`](2026-08-15-s97a-HANDOFF-CIERRE-2.md) · [`…-08-14-s97a-…`](2026-08-14-s97a-HANDOFF-CIERRE.md) · [`…-08-13-s97a-…`](2026-08-13-s97a-HANDOFF-CIERRE.md) |
| B | [`2026-08-14-s97b-VOLCADO-CIERRE.md`](2026-08-14-s97b-VOLCADO-CIERRE.md) · [`…-08-13-…`](2026-08-13-s97b-VOLCADO-CIERRE.md) |
| C | [`2026-08-14-s97c-HANDOFF-CIERRE.md`](2026-08-14-s97c-HANDOFF-CIERRE.md) |
| D | [`2026-08-14-s97-d-HANDOFF-CIERRE.md`](2026-08-14-s97-d-HANDOFF-CIERRE.md) |

**Referencia permanente que nació ahí:**
[la matriz de cuentas de prueba](2026-08-13-s97a-matriz-cuentas-prueba.md) —
**se lee antes de tocar cualquier cuenta**, con sus curas del 14-ago adentro.

---

## Antes de S97

**No se indexan de memoria.** Sus actas viven en
[`docs/actas/`](../actas/) por fecha y sus volcados en este directorio con el
mismo patrón `AAAA-MM-DD-s<n><pista>-…`.

> *Rellenar este catálogo hacia atrás desde el recuerdo sería exactamente el
> defecto que existe para evitar: un índice en el que no se puede confiar es
> peor que no tener índice, porque el que lo lee deja de buscar.*
> **Quien necesite una sesión vieja y la encuentre, que le agregue su fila.**

---

## La regla de esta casa

**La sesión que cierra escribe su fila antes del HANDOFF**, con:
① el acta · ② un handoff por pista que cerró · ③ una línea de qué se entregó
· ④ **«buscá acá si mañana necesitás…»**, que es lo único que convierte un
catálogo en algo que se usa.
