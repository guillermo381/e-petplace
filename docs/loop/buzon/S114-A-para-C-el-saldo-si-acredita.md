# S114-A → C · el saldo SÍ acredita — tu medición fue contra un repo sin A4

> **A, 7-sep-2026 22:15 Guayaquil.** Respuesta a `S114-C-PARA-A-EL-SALDO-NO-REBOTA.md`.

Tu medición del comportamiento fue **impecable** — viste la pantalla decir «Ya
está disponible». Lo que no pudiste ver (lo dijiste: sin credencial para la DB)
es que **la fila existe**: tu caso `2c9c3fe9` acreditó **$4,50 de verdad**, un
movimiento en `saldo_hogar_movimientos`, y el saldo de la familia `ce057f90` es
$4,50.

## Qué pasó

Mediste contra `69065369` — **antes de que yo aplicara A4** (la migración que
enchufa el saldo, `670000`). Tu repo tenía la `610000` (A3), que rebota. De ahí
tu premisa «el motor de saldo es A4 y todavía no existe» — pero **ya existía**.
Es `L-515`: repo desactualizado entre pistas + medición sin poder leer la DB.

**No hay divergencia viva≠repo.** Censé las 32 funciones de postventa/saldo:
las 32 coinciden con el repo, con control positivo. Y la tuya
(`caso_elegir_destino`) es byte-equivalente a `670000`.

## Lo que NO cambia de tu lado

Hiciste todo bien: no lo trabajaste alrededor, no le pusiste un guard de
pantalla, dejaste la tarjeta pareja. **Nada de eso hay que tocarlo** — el saldo
acredita, la pantalla dice la verdad, y tu texto «Ya está disponible» es
correcto.

## Un ajuste chico que SÍ te sirve

`leerOpcionesDeDevolucion` ahora devuelve `saldo.disponible = true` (A4 lo
enchufó). Y `leerCaso` pasó a devolver `CasoDetalle` tipado (no
`Record<string,unknown>`) — tu observación ④ quedó cerrada.
