# FRENO S67/V0 — choque de letra firmada en la prueba reina (T6)

Fecha: 2026-07-17. Estado: **migración NO escrita, NO aplicada. DB intacta. Cero residuos.**
Protocolo invocado: "Todo choque contra letra firmada: FRENO y a la mesa — jamás resolver
en silencio."

## El choque

Dos cláusulas del contrato firmado son mutuamente imposibles **con los datos vivos**:

- T6 prueba reina: "assert de identidad" de los `obtener_*_disponibles` de los 3 oficios,
  ANTES vs DESPUÉS intra-transacción, con las entradas fijas del snapshot.
- T2/T6 regla de mezcla: "una persona a un instante: libre / UNA exclusiva / UN grupo del
  mismo servicio con cupo" + asserts nuevos "exclusiva bloquea todo · mezcla imposible".

Evidencia viva (verificada hoy contra la DB linked):

```
fecha       hora     dur  tipo_servicio   estado      franja        cupo franja
2026-07-23  08:00    60   adiestramiento  confirmada  08:00-12:00   3
2026-07-24  08:00    60   adiestramiento  confirmada  08:00-12:00   3
```

Dos citas FIRMES de adiestramiento (servicio exclusivo bajo el seed T3) viven ADENTRO de
franjas cupo 3 del titular de [DEMO S44] Paseos Andres. El motor de hoy (prosrc archivado,
`_agenda_ocupacion` global vs cupo de franja) OFERTA 08:00 y 08:30 para los 3 oficios en esas
fechas — el snapshot del 17-07 lo prueba (snap_01/02/05/08 incluyen 08:00 y 08:30 el 24/07,
con ocupación 1 < 3). El motor nuevo, aplicando la letra §3, los BLOQUEA: el titular está en
"UNA exclusiva" de 08:00 a 09:00. Hoy el sistema puede vender un paseo o un segundo
adiestramiento solapado con la sesión firme del titular — doble-booking físico del
negocio-de-1 que la letra existe para matar.

## El mapa exacto de la divergencia (entradas fijas del juez)

Idéntico byte a byte bajo el motor nuevo:
- Los QUIÉN a las 10:00 (paseadores 30/60, groomers, adiestradores) — sin ocupantes.
- TODO paseo: la decisión min(franja, techo 4) del founder colapsa exacto —
  min(3,4)=3, min(1,4)=1, min(4,4)=4 en las franjas 3/1/4 de Andres.
- Toda hora sin solape con las 2 citas exclusivas firmes.

Divergente (y no reconciliable con la letra):
1. `inicios_*` del 24/07: mueren 08:00 y 08:30 en los 3 oficios (solape con la exclusiva
   firme). Ídem 23/07 en cualquier corrida sobre esa fecha.
2. `obtener_slots_disponibles` para servicios EXCLUSIVOS (grooming, adiestramiento) en
   franjas cupo>1: la columna `cupos_restantes` pasa de 3 (cupo de franja) a 1 (capacidad
   de una exclusiva) en TODAS las franjas de mañana/sábado de Andres — incluso sin ocupantes.

## Omisión del contrato que necesita bendición (misma mesa)

La ocupación por `empleado_id` exige que las filas de ocupación TENGAN persona:
`evento_cita_servicio.empleado_id` está NULL en las 56 filas vivas (verificado hoy). El T1
ordena backfill de `evento_atencion` (13) y `prestador_horarios`, pero NO de
`evento_cita_servicio` — sin ese backfill las citas firmes no ocupan a nadie y la identidad
rompe al revés (el 17:30 del viernes aparecería libre). Camino (b) literal pide personificar
también la tabla de ocupación + que los generadores de citas firmes (`_generar_citas_programa`,
`_generar_citas_plan`, `reservar_salida_paquete`) escriban `empleado_id` al insertar.

## Opciones para la mesa

1. **(Recomendada) Identidad-modulo-ilegalidades, whitelist COMPUTADA.** El assert de
   identidad admite diferencia SOLO donde: (i) el slot solapa una cita firme de servicio
   exclusivo de la persona, o (ii) el delta es únicamente `cupos_restantes` de un servicio
   exclusivo en franja cupo>1, recortado a exactamente 1. Cualquier otro diff → ABORT.
   La whitelist se computa contra las citas vivas, no se hardcodea. + backfill de
   `evento_cita_servicio.empleado_id` (assert 56) dentro de T1.
2. **Sanear primero los datos demo** (mover/cancelar las 2 citas de adiestramiento del
   gate S63): cura (i) pero no (ii) — `cupos_restantes` diverge igual; y toca historia.
3. **Aflojar la regla de mezcla para convivir bajo cupo de franja**: contradice §3 firmado.
   Listada solo para descartarla explícitamente.

## Lo que quedó verificado y LISTO para ejecutar apenas la mesa firme

- T1: conteos exactos hoy — 5 franjas de empleado (todas Satori/"Test Empleado"),
  13 `evento_atencion` (todas sin persona), 0 `prestador_resenas`.
- T5 D-414: `caso_clinico_insert_vet.with_check` vigente valida cuenta↔user y NO
  cuenta↔mascota (pg_policy literal capturado) — la cura procede.
- T5 D-415: las tabla_tipada fantasma confirmadas — 8 códigos apuntando a 6 tablas
  inexistentes: `evento_certificado_revocado`, `evento_incidente` (×2), `evento_inicio_vida`,
  `evento_nota` (×2), `evento_producto_asignacion`, `evento_wearable_alerta`.
  `verificar_coherencia_tablas_tipadas()` nacería fallando: la cura debe declararse
  (¿NULL honesto en tabla_tipada hasta que la tabla exista, o nacen las tablas?) — media
  decisión de mesa también.
- T5 D-418/D-424: estado previo confirmado (11 médicos `requiere_resultado=true`,
  `especies_elegibles` NULL; único false previo: `registro_evento`).
