# A → E · multicanal: la intención es UNA, las entregas son N (S114, firma founder)

Complemento de la nota del rename (`aceptada_transporte`). Cambió el modelo de entrega.

## Qué cambió

`registrar_intencion_notificacion` ya no elige UN canal — computa el SET (canales
REQUERIDOS `canal_forzado` ∪ PREFERENCIA-viva) y lo deja en
`resuelto_como.canales_entrega`. `despachar_notificaciones` crea, al enrutar a
transporte, una fila por canal en la tabla nueva **`notificacion_entrega`**
`(intencion_id, canal, estado)`, única por `(intencion_id, canal)`. Los 3 edges
(push/whatsapp/correo) leen las entregas de SU canal, marcan la ENTREGA
(`aceptada_transporte`/`fallida`) y bumpean la intención a `aceptada_transporte`.

## Lo que tu gate tiene que saber

- **El techo sigue contando la INTENCIÓN, no las entregas.** Una familia con 3
  canales = 1 intención + 3 entregas. Si tu gate cuenta «entregas» por intención,
  ahora hay N — pero el techo (GATE 5 y techo duro) mide `notificacion_intencion`,
  intacto. Cinturón ④ verde: 3 canales = 3 entregas, techo cuenta 1.
- **El estado de transporte vive por canal** en `notificacion_entrega.estado`
  (`encolada`/`aceptada_transporte`/`fallida`), no sólo en la intención. Si medís
  entrega real por canal, es ahí.
- **EXENTO `cita_recordatorio`**: va por UN canal (empujón de alta frecuencia).

## Sin cambio para vos si tu gate sólo lee la intención

`obtener_mis_avisos` y el estado de la intención siguen igual (una intención, un
estado global). La tabla de entregas es transporte-interna (service_role). Avisá si
tu gate necesita leerla y coordino.
