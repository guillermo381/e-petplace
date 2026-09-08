# S114-A → E · tres cosas que te tocan

> **A, 7-sep-2026.** Va por acá y no por mensaje: las pistas no se escriben entre sí.
> Punta al escribir esto: la del commit que lo trae.

---

## ① 🔴 TU PERMISIVIDAD DEL ANCLA DE GUARDERÍA QUEDÓ CERRADA

**Firma del founder, hoy.** `LETRA_POSTVENTA` §8 gana su enmienda ②: **el evento
económico de guardería ancla en la ESTADÍA, jamás en su cita.**

La razón no es de prolijidad y conviene que la tengas entera, porque cambia tu
rojo: **§6 manda que al resolver se le pregunte AL OBJETO si tiene devengo.**
Con el ancla ambigua esa pregunta tiene **dos respuestas** — sobre la cita dice
«no hay evento», sobre la estadía dice «sí» — y el camino de la plata se
bifurca **sin un solo síntoma**: la devolución se declara sobre el pago
mientras el prestador conserva su devengo, y la diferencia la paga la casa sin
que nadie lo vea.

⇒ **Tu rojo de §8 se mide contra `guarderia_estadias` y sólo contra ella.**

---

## ② EL GATE DEL CRUCE YA EXISTE — no lo dupliques, ensanchalo

`scripts/s114/verify-aviso-emitio-sin-productor.mjs`, corre en **4 s**.

**Lo que mide:** «tipo que emitió alguna vez» contra «tipo que tiene
productor». Un tipo que emitió y hoy no tiene quién lo produzca es una
**regresión**, no una deuda.

🔴 **Y conoce un ciego que tu versión ingenua no va a tener.** Hay tipos cuyo
productor es una **FILA y no una línea**: `_guarderia_aplicar_acto` lee
`cat_guarderia_transiciones.tipo_notificacion` y emite lo que el catálogo diga.
Buscarlos por literal en `pg_proc` **no los encuentra**, y un cruce que sólo
mire literales reporta **6 rojos de los cuales 5 son falsos**. Si escribís el
tuyo, ese es el primer caso que tenés que meter.

**Estado hoy:** 70 tipos · 49 por línea · 5 por fila · **16 sin productor que
nunca emitieron** (deuda `D-673`, NO rojo) · **0 rojos**.

**Sale `exit 2` / NO CONCLUYENTE** si no puede consultar la base **o si su
propio reconocedor no encuentra productores por las dos vías** — sin eso, un
reconocedor roto marcaría todo como sin productor y sus rojos serían ruido
indistinguible.

### Mi propuesta sobre el hook, y es que NO vaya

Tres razones, en orden de peso:

1. **Necesita la base.** El pre-commit corre offline y en avión; un gate que
   depende de la red falla por una razón que no es la que vino a medir.
2. **Su rojo no lo produce un commit.** Este defecto aparece cuando alguien
   redefine una función con `CREATE OR REPLACE` — el commit que lo causa se ve
   perfectamente sano, y el rojo llega después. Un gate de pre-commit que
   frena a quien no rompió nada se termina salteando.
3. **Precedente de la casa:** `verify:mis-hilos-realtime` y
   `verify:d485-familia-lee` quedaron fuera del hook por tocar la base.

**Dónde sí:** en el **paso ⓪ y en el cierre**, al lado de `verify:censo`.

---

## ③ UN CERO QUE TE VA A APARECER, para que no lo midas dos veces

`v_gmv_mensual` y `v_metricas_tiempo_real` (las del Dashboard y `/inversores`
del admin) **devuelven CERO, y no porque estén rotas.**

Medido: filtran por `pedidos.kushki_status = 'approved'` y `pedidos.pagado_en`,
y **las dos columnas están en 0 filas de 96** — `kushki_status` además **no
tiene una sola función que lo escriba**. Son columnas del motor muerto. El
motor vivo dice que **41 pedidos están pagados** (`pagos_intentos`).

⇒ **El tablero de inversores está ciego a 41 pedidos pagados.** Curé el
hardcode del 14 % que tenían adentro (`D-759`), pero **no reconecté las vistas
al motor vivo**: cambiar qué pedido cuenta en el tablero de inversores es
decisión de mesa, no de una pista.
