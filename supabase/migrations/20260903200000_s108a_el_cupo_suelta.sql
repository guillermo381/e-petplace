-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A-4 · ② EL CUPO SUELTA LO QUE NO SE PAGÓ
--
-- 76(g) VEDA: **NO RIGE.** Reemplazo de un lector. **Cero backfill** — no se
--   toca ninguna estadía: el contador deja de sumarlas y los dos lugares vuelven
--   solos. *Curar el contador devuelve los lugares sin reescribir una historia
--   que ocurrió.*
-- REVERSA: `docs/relevamientos/2026-09-03-s108a-REVERSA-M12.sql`.
--
-- MEDIDO ANTES DE CURAR — la pregunta era «¿hay lugares comidos hoy?»:
--   **SÍ, DOS.** `2026-09-02` y `2026-09-03`, los dos con la estadía en
--   `reservada` sobre citas ya `expirada` (vencieron el 30 y el 31 de agosto).
--   Sobre 1 solo mandato vivo y 4 estadías pagadas, dos lugares perdidos no es
--   ruido: es la mitad de la evidencia disponible.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
CREATE OR REPLACE FUNCTION public.cupo_guarderia_del_dia(p_prestador_id uuid, p_fecha date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_capacidad int;
  v_consumido int;
  v_dow int := EXTRACT(dow FROM p_fecha)::int;
BEGIN
  /* 🔴 `p_fecha` es FECHA LOCAL DEL LUGAR (public.hoy_local() la resuelve para
     «hoy»). Contar por timestamp UTC parte el día a medianoche y sobrevende el
     borde. */

  -- Confirmado para el día = activo Y (su patrón lo incluye O una excepción lo
  -- trae) Y ninguna excepción lo saca. LA EXCEPCIÓN GANA. (Molde despensa.)
  SELECT COALESCE(SUM(e.capacidad_por_dia), 0) INTO v_capacidad
    FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo
     AND (
       (v_dow = ANY(e.dias_operacion)
         AND NOT EXISTS (SELECT 1 FROM guarderia_espacio_excepciones x
                          WHERE x.espacio_id = e.id AND x.fecha = p_fecha AND NOT x.disponible))
       OR EXISTS (SELECT 1 FROM guarderia_espacio_excepciones x
                   WHERE x.espacio_id = e.id AND x.fecha = p_fecha AND x.disponible)
     );

  /* ═══ LO QUE YA SE PROMETIÓ CONTRA ESE DÍA ══════════════════════════════
     🔴 EL CUPO RETENÍA Y NUNCA SOLTABA. Esto miraba **sólo**
     `guarderia_estadias.estado`, y ninguna función mueve una estadía a
     `cancelada` cuando su cita expira o se cancela ⇒ **un checkout abandonado
     se comía un lugar para siempre**, en el único servicio cuyo cupo se cuenta
     POR LUGAR FÍSICO.
     *No dejaba síntoma: el día se veía lleno, y «lleno» es un estado
     perfectamente normal.* Medido al curar: **2 lugares comidos** (2026-09-02 y
     2026-09-03), los dos por reservas que expiraron hace días.

     ⇒ SE ADOPTA EL MOLDE QUE YA RIGE EN LA CITA: **la verdad del cupo la dice
     la RESERVA, no la estadía.** Un lugar está tomado si su cita está pagada, o
     si su hold sigue vivo. Nada más.

     🔴 Y la EXPIRACIÓN PEREZOSA va acá y no se delega al cron: `expirar_citas_
     pendientes` corre cada minuto, pero **entre el vencimiento y el tick hay una
     ventana** en la que el lugar seguiría retenido. *Un contador que depende de
     que un reloj haya pasado da una respuesta distinta según el segundo en que
     se pregunta.* El lector no espera a nadie — mismo criterio que el hold de la
     cita (S54). */
  SELECT count(*) INTO v_consumido
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha = p_fecha
     AND g.estado NOT IN ('cancelada')
     AND (
       c.estado_reserva = 'pagada'
       OR (c.estado_reserva = 'pendiente_pago'
           /* Sin `expira_en` el hold no tiene fin declarado ⇒ se cuenta. *Soltar
              un lugar porque a la fila le falta un dato sería sobrevender.* */
           AND (c.expira_en IS NULL OR c.expira_en > now()))
     );

  RETURN jsonb_build_object(
    'fecha',        p_fecha,
    'capacidad',    v_capacidad,
    'consumido',    v_consumido,
    'disponible',   GREATEST(v_capacidad - v_consumido, 0),
    /* 🔴 Bajar la capacidad con reservas tomadas RIGE HACIA ADELANTE Y JAMÁS
       CANCELA. El día queda sobrevendido DECLARADO y visible al prestador —
       nunca se resuelve solo. */
    'sobrevendido', (v_consumido > v_capacidad)
  );
END $function$

;

-- ═══ CINTURÓN — se EJERCE, con antes y después sobre el mismo día ═════════
DO $c$
DECLARE v_prest uuid; v_fecha date; v_antes int; v_despues int; v_libre_antes int;
        v_libre_despues int; v_cita uuid;
BEGIN
  /* 🔴 EL DISCRIMINADOR SE BUSCA EN LOS DATOS: un día que TENGA una estadía
     retenida por una reserva muerta. Si no lo hay, se ABORTA — *un cinturón que
     no encuentra su caso no está pasando: no midió nada.* */
  SELECT c.prestador_id, c.fecha INTO v_prest, v_fecha
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.estado NOT IN ('cancelada')
     AND c.estado_reserva IN ('expirada','cancelada')
   LIMIT 1;
  IF v_prest IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay dia con lugar comido — este arnes no puede DISCRIMINAR';
  END IF;

  -- el contador VIEJO, reproducido: lo que daba antes de esta migracion
  SELECT count(*) INTO v_antes
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE c.prestador_id = v_prest AND c.fecha = v_fecha AND g.estado NOT IN ('cancelada');

  SELECT (public.cupo_guarderia_del_dia(v_prest, v_fecha)->>'consumido')::int INTO v_despues;

  IF v_despues >= v_antes THEN
    RAISE EXCEPTION 'cinturon: el cupo NO solto nada (antes=% despues=%)', v_antes, v_despues;
  END IF;
  RAISE NOTICE 'cinturon M12: el dia % solto % lugar(es): consumido % -> %',
               v_fecha, v_antes - v_despues, v_antes, v_despues;

  /* 🔴 CONTROL POSITIVO: una reserva PAGADA sigue ocupando. *Un contador que
     suelta de más sobrevende, que es el daño opuesto y peor.* */
  SELECT c.prestador_id, c.fecha INTO v_prest, v_fecha
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.estado NOT IN ('cancelada') AND c.estado_reserva = 'pagada' LIMIT 1;
  IF v_prest IS NULL THEN RAISE EXCEPTION 'cinturon: sin caso PAGADO para el control positivo'; END IF;
  SELECT (public.cupo_guarderia_del_dia(v_prest, v_fecha)->>'consumido')::int INTO v_despues;
  IF v_despues < 1 THEN
    RAISE EXCEPTION 'cinturon: el cupo solto una reserva PAGADA — sobrevende';
  END IF;

  /* 🔴 Y EL HOLD VIVO TAMBIÉN OCUPA: se siembra uno que vence en 15 minutos y
     se exige que cuente; después se lo vence y se exige que suelte. Sin este
     brazo, «soltar lo expirado» y «soltar todo lo no pagado» darían igual. */
  SELECT c.id INTO v_cita FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id=g.cita_id
   WHERE c.estado_reserva='pagada' LIMIT 1;
  SELECT c.prestador_id, c.fecha INTO v_prest, v_fecha FROM evento_cita_servicio c WHERE c.id=v_cita;

  UPDATE evento_cita_servicio SET estado_reserva='pendiente_pago', expira_en = now() + interval '15 minutes'
   WHERE id = v_cita;
  SELECT (public.cupo_guarderia_del_dia(v_prest, v_fecha)->>'consumido')::int INTO v_libre_antes;

  UPDATE evento_cita_servicio SET expira_en = now() - interval '1 minute' WHERE id = v_cita;
  SELECT (public.cupo_guarderia_del_dia(v_prest, v_fecha)->>'consumido')::int INTO v_libre_despues;

  IF v_libre_despues >= v_libre_antes THEN
    RAISE EXCEPTION 'cinturon: la expiracion PEREZOSA no solto (vivo=% vencido=%)', v_libre_antes, v_libre_despues;
  END IF;

  RAISE NOTICE 'cinturon M12: 4/4 OK (suelta lo expirado · la pagada SIGUE ocupando · el hold vivo ocupa · el hold vencido suelta sin esperar al cron)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M12: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
