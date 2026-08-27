-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260827060000_s106a_aviso_reasignacion.sql`
--
-- QUÉ DESHACE: borra `notificar_reasignacion_cita`, su tipo de vocabulario y
-- el brazo de voz, y devuelve `asignar_cita_a_persona` a rechazar la
-- reasignación con `cita_ya_asignada`.
--
-- 🔴 Y CIERRA EL GATE DE LA VITRINA DE VUELTA, sin que esta reversa lo diga en
--    su código: `trg_prestadores_gate_vitrina` (S78) verifica
--    `to_regprocedure('public.notificar_reasignacion_cita(uuid, uuid)')`.
--    Al borrar la función, **todo negocio que hubiera encendido
--    `expone_personas` no puede volver a tocar el toggle** — y los que ya lo
--    tengan en `true` quedan expuestos con el gate cerrado detrás.
--    ⇒ **Se mide antes:** `SELECT count(*) FROM prestadores WHERE
--    expone_personas;` Si da > 0, revertir es una decisión de producto, no de
--    esquema.
--
-- ⚠️ Y los avisos ya registrados NO se borran: son historia de lo que la
--    familia recibió.
-- ════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.notificar_reasignacion_cita(uuid, uuid);
DELETE FROM public.cat_notificacion_tipos WHERE codigo = 'cita_reasignada';
-- `asignar_cita_a_persona` y `_voz_notificacion` se recargan desde la
-- migración que las definió por última vez ANTES de ésta. No se transcriben:
-- *una copia diverge en silencio.*
