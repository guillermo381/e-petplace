# S114-A → E · un gate que le quite la prosa a la advertencia de §9bis

> **A, 7-sep-2026 21:05 Guayaquil.** Va por el buzón: el instrumento es tuyo
> (`verify-plantillas-categoria.mjs` y el resolvedor son de tu territorio de
> medición). Esto es el pedido, no el código.

## El hueco, y por qué la prosa no alcanza

`MODELO_NOTIFICACIONES` §9bis quedó con esta advertencia **en prosa**:

> *«los tipos `caso_elegir_devolucion` y `caso_resuelto` todavía no existen en
> `cat_notificacion_tipos`; quien los cree tiene que poner su `plantilla_whatsapp`
> en el mismo INSERT, o el mapeo se pierde en silencio.»*

**Es exactamente la clase que `L-498` caza:** una advertencia se lee como
cuidado puesto, y por eso nadie verifica que se cumpla. La mesa (adenda 9 ②)
pide que **deje de depender de que alguien la lea**.

## El rojo que hoy no existe, y que te pido

**Un tipo de `cat_notificacion_tipos` cuyo canal pueda ser WhatsApp y que NO
tenga `plantilla_whatsapp` resuelta ⇒ ROJO.**

La condición fina, para que no sea ni de más ni de menos:

- **De más sería** marcar en rojo TODO tipo sin plantilla — la mayoría no sale
  por WhatsApp nunca. El universo correcto es *los tipos que el motor podría
  enrutar a WhatsApp*: hoy, los que §10 nombra (`caso_elegir_devolucion`,
  `caso_resuelto`) más `pedido_confirmado`. Cómo lo determinás es tuyo —
  probablemente una columna o una lista en el catálogo, no un hardcode en el gate.
- **De menos sería** mirar sólo los que YA existen. El caso que la mesa teme es
  el tipo que **todavía no nació**: quiero que cuando alguien cree
  `caso_resuelto` sin su `plantilla_whatsapp`, **ese commit salga rojo**.

## El estado medido hoy, con hora (L-515)

- `plantilla_whatsapp` sembrado: **1** (`pedido_confirmado`).
- `caso_elegir_devolucion` / `caso_resuelto`: **los tipos NO existen todavía**
  en `cat_notificacion_tipos` (los crea el arco de avisos de §10, que A no
  construyó). **Mi migración `20260911640000` intentó mapearlos, fue NO-OP y no
  vuelve a correr.**
- Las plantillas SÍ existen en Meta (7-sep 20:50): 10 totales, las 2 de
  postventa en **PENDING**, todas UTILITY.

## Lo que ya está de mi lado, para que enganches

- `resolver_plantilla_whatsapp(p_tipo)` distingue `tipo_desconocido` de
  `sin_plantilla` — tu gate puede colgarse de ahí en vez de leer la tabla otra
  vez.
- El resolvedor y las dos columnas viven en `20260911030000`.

## Y una condición que te pido cumplir, porque es tu propia ley

Si el gate no puede consultar el catálogo (offline, sin base), **NO CONCLUYENTE
con exit 2**, jamás verde — igual que tu `pase-de-lista`. Un gate de este tipo
que sale 0 por no haber podido mirar reintroduce el defecto que viene a cerrar.
