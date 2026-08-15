-- S97-A · D-822 · LOS TRES TIPOS FIRMADOS SALEN DE SOMBRA
--
-- 🔴 LA SEGUNDA CAPA DEL SILENCIO, encontrada corriendo el discriminador:
-- el productor ④ encoló bien, con su voz correcta, **y la intención quedó en
-- `encolada` con `despacho: "sombra_habria_salido"`.**
--
-- **Medido: 16 de los 22 tipos con audiencia prestador están `en_sombra`.**
-- ⇒ *Aunque los 15 tipos mudos del censo de D-822 hubieran tenido productor,
--    la mayoría no habría salido igual.* La ficha decía «faltan motivos» y le
--    faltaba esto: **hay motivos que existen, tienen voz, y están apagados.**
--
-- ═══ 🔴 SE SACAN EXACTAMENTE LOS TRES QUE EL FOUNDER FIRMÓ. NI UNO MÁS ═══
-- Los otros 13 **NO se tocan**, y no es prudencia genérica: **la sombra es un
-- mecanismo de seguridad deliberado** (S90) — el tipo se ejercita sin enviar.
-- Sacar uno de sombra es DECIDIR que ese aviso ya puede llegarle a una
-- persona.
--   · `liquidacion_disponible` es de la SEGUNDA ola por firma explícita.
--   · `mensaje_nuevo` espera que exista mensajería.
--   · `cita_completada` está declarado FUERA («quien atendió ya lo sabe»).
--   · `vacuna_vencida`, `wearable_alerta` y los `prestador_*` son de otros
--     arcos, con sus propios dueños.
--
-- > ***Sacar los 16 «ya que estamos» sería encender trece avisos que nadie
-- > pidió, sobre teléfonos reales, en el mismo commit.*** El canal nace útil,
-- > no ruidoso — que es literalmente la firma.
--
-- 76(g) — VEDA: **NO RIGE.** Tres filas de CATÁLOGO.

BEGIN;

UPDATE cat_notificacion_tipos
   SET en_sombra = false
 WHERE codigo IN ('documento_aprobado', 'documento_rechazado', 'cita_cancelada_cliente');

DO $cinturon$
DECLARE v_fuera int; v_quedan int;
BEGIN
  SELECT count(*) INTO v_fuera FROM cat_notificacion_tipos
   WHERE codigo IN ('documento_aprobado','documento_rechazado','cita_cancelada_cliente')
     AND en_sombra = false;
  IF v_fuera <> 3 THEN
    RAISE EXCEPTION 'CINTURON ROJO: salieron % de 3.', v_fuera;
  END IF;

  -- El brazo que importa: que NO se hayan encendido de más.
  SELECT count(*) INTO v_quedan FROM cat_notificacion_tipos
   WHERE audiencia IN ('prestador','ambas') AND en_sombra = true;
  IF v_quedan <> 13 THEN
    RAISE EXCEPTION
      'CINTURON ROJO: quedaban 16 en sombra y ahora hay % — se esperaban 13. Encender de mas es enviarle avisos a personas reales sin firma.', v_quedan;
  END IF;

  RAISE NOTICE 'CINTURON OK · 3 fuera de sombra · 13 intactos';
END;
$cinturon$;

COMMIT;
