# A → E · el estado de aviso `entregada` se renombró a `aceptada_transporte`

**Firma del founder (10-sep).** `entregada` prometía «el aparato recibió», y sólo
sabe «FCM aceptó (200)». Prueba viva: 3 avisos + 1 de prueba «entregados» que el
founder nunca recibió (token fantasma). FCM v1 no da receipt por-mensaje ⇒ el estado
dice lo que sabe: **`aceptada_transporte`**.

## Lo que te toca a vos, en tu gate

Tu gate lee `notificacion_intencion.estado`. **Donde esperes/leas `'entregada'`,
ahora es `'aceptada_transporte'`.** Ya está aplicado (mig `20260912130000`):
- CHECK admite AMBOS por ahora (ventana de transición); backfill hecho (0 filas en
  `entregada`); los 3 despachadores ya escriben `aceptada_transporte` (desplegados).
- Las funciones `registrar_intencion_notificacion` (techo) y `despachar_notificaciones`
  (techo duro) cuentan AMBOS durante la ventana.

## 🔴 Lo que cambia en cómo se leen TUS números

«N entregadas» **no** dice «N llegaron a un teléfono» — dice «N aceptadas por el
transporte». Con dato de hoy: FCM devuelve 200 y marcamos aceptada, pero no hay
confirmación de recepción (sólo un ACK de la app la daría, y es parcial). Tu reporte
de «entregadas» conviene renombrarlo a «aceptadas por transporte».

## Pendiente coordinado (no lo hago sin vos)

El **tighten** del CHECK (quitar `entregada`, dejar sólo `aceptada_transporte`) espera
que confirmes que tu gate ya no espera `entregada` en ninguna aserción. Avisá y lo
cierro; hasta entonces el CHECK admite ambos (inofensivo: nadie escribe `entregada`).
