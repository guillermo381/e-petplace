# S114-A · CIERRE · la mensualidad devenga + los cierres cortos

> **A, 7-sep-2026.** Los cinco ítems de la adenda urgente, cerrados y medidos.

## ① EL CABLE — curado con dato, no por comodidad

El aplicador de guardería **no puede** escribir `suscripcion_servicio_id`: es FK
a `suscripciones_servicio` (planes de PASEO), y el id de la mensualidad
(`761ac1ce`) **no existe** en esa tabla — escribirlo violaría el FK. *Imposible
por construcción.* El cable medido vive en `cita.metadata`:
`origen='mensualidad'` + `suscripcion_id`, y la suscripción en
`guarderia_suscripciones`. `_devengar_estadia` lo detecta por ahí.

Migración `20260911720000` · reversa `docs/relevamientos/2026-09-07-s114a-REVERSA-mensualidad.sql`.

## ② EL CINTURÓN — NO CONCLUYENTE → VERDE por camino real

`scripts/s114/cinturon-mensualidad-devenga.sh`. Sesión real del titular por
**magiclink** (sin tocar la contraseña). Camino real completo: abrir tramo
recogida → a_bordo → llegada → abrir tramo devolución → retorno → **entregada**.

- **ROJO:** con la reversa instalada, la estadía llega a entregada y **NO
  produce evento** (old code detectaba por `suscripcion_servicio_id`, que es NULL).
- **VERDE:** restaurada la cura, el mismo call que hace la puerta produce el
  evento — `origen_tipo=estadia`, `via=guarderia_mensualidad_dia`, **monto 4.55 =
  100 / 22 días contratados del período**.

**F10 cumplido:** devenga POR DÍA EJECUTADO. El denominador se tomó **de la
fuente** (los días contratados = las estadías generadas = días hábiles), no de
días calendario, que fabricaría breakage fantasma por los fines de semana.
⚠️ La letra fija el principio, no el denominador — esta es la derivación de A del
dato, declarada para ratificación.

## ③ COLUMNA DE SIEMBRA PARA E

`guarderia_estadias.nota_siembra text` (aditiva, nullable, sin default). Ningún
camino de producto la lee como dato. E puede marcar sus siembras y no se leen
mañana como tráfico. La estadía que operó el cinturón ya quedó marcada.

## ④ EL CENSO DUPLICADO — uno solo (adenda 14③)

Había dos midiendo «emitió vs productor». El instrumento COMPLETO de E (literal
+ barrido general por dato + discriminador causal) se mudó a
`scripts/s114/verify-aviso-emitio-sin-productor.mjs`, a cargo de la conducción.
`scripts/censo-productores-de-aviso.mjs` quedó de **lápida** (su razonamiento
como registro). `pnpm censo:productores-de-aviso` repuntado.
- Medido al consolidar: **exit 0 honesto** — `pedido_nuevo_vendedor`, la
  regresión que E marcó el 7-sep, ya tiene productor por literal
  (`_trg_pedido_avisa_vendedor`); la repuso otra pista. No es falso verde.

## ⑤ CIERRES CORTOS

- **13② · arco entero con el asiento de casa** → `verify-arco-caso-completo.mjs`
  **7/7 por PostgREST real** (familia abre → la casa resuelve con `is_admin` sin
  bypass → familia elige saldo → acredita 4 → un tercero no ve el caso).
  Re-confirmado verde hoy.
- **14② · WABA↔número + `secrets list`** → medido en el relevamiento (adenda 8):
  token válido con los dos permisos, WABA_ID confirmado por digest, número
  consistente (los tres 200), **8 plantillas UTILITY aprobadas, 0 en MARKETING**.
  El único abierto es `code_verification_status: EXPIRED` — **acción del founder
  en la consola de Meta**, no la cubre plantilla ni permiso. El censo del digest
  de secrets (adenda 9/11) queda **esperando firma** del founder para rotación:
  es medición, no cura. `docs/loop/S114-A-CENSO-DIGEST-SECRETS.md`.
