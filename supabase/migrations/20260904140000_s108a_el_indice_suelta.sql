-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A-7 · ① LA SEGUNDA PUERTA DEL CUPO: EL ÍNDICE
--
-- 76(g) VEDA: **NO RIGE.** Reemplazo de un índice. **Cero backfill** — no se
--   toca una fila: al salir del índice, los 2 días bloqueados se liberan solos.
-- REVERSA: `docs/relevamientos/2026-09-04-s108a-REVERSA-M15.sql`.
--
-- ═══ EL DEFECTO, hallado por S108-B ════════════════════════════════════════
-- Curé el CONTADOR moviendo la verdad de la estadía a la reserva. El índice
-- quedó un nivel abajo, y **mira `estado` cuando el vencimiento se escribe en
-- `estado_reserva`**: una reserva `expirada` sigue con `estado='confirmada'` ⇒
-- **el día de esa mascota queda bloqueado para siempre.**
-- Medido: **2 días**, los dos a futuro. *La familia no puede volver a reservar
-- un día que nunca llegó a pagar, y el rebote es un `duplicate key` crudo —
-- `L-424` otra vez: un guard que vive en un índice sólo sabe negarse.*
--
-- ═══ EL CENSO DE LA CLASE, Y CORRIGE MI PROPIA ALARMA ══════════════════════
-- Un primer grep dio **cuatro lectores más** que miraban `estado` sin
-- `estado_reserva` (`cupo_guarderia_del_rango`, `obtener_dias_guarderia`,
-- `obtener_dias_guarderia_disponibles`, `obtener_guarderias_disponibles`) y
-- estuve a punto de curarlos.
-- 🔴 **Medido: los CUATRO DELEGAN en `cupo_guarderia_del_dia`** ⇒ heredaron la
--    cura y nunca estuvieron rotos. **Mi «cuatro lectores» era un falso positivo
--    de mi propio instrumento** — nombraban `estado` por otras razones.
-- ⇒ **La clase es exactamente UNA segunda puerta: este índice.** Se dice así en
--   vez de curar cuatro piezas sanas, que es su propia forma de daño.
--
-- ⚠️ LÍMITE DECLARADO, y no se disimula: **un predicado de índice no puede
--    hacer expiración perezosa** — `now()` no es inmutable. El índice sólo puede
--    excluir los estados TERMINALES. La ventana entre que un hold vence y el
--    cron lo marca `expirada` (≤60 s) la cierra la puerta de reserva, abajo.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP INDEX IF EXISTS public.uq_guarderia_una_por_mascota_dia;

CREATE UNIQUE INDEX uq_guarderia_una_por_mascota_dia
  ON public.evento_cita_servicio USING btree (mascota_id, fecha)
  WHERE (tipo_servicio = 'guarderia_dia'
         AND mascota_id IS NOT NULL
         AND fecha IS NOT NULL
         AND estado <> ALL (ARRAY['cancelada'::text, 'rechazada'::text, 'no_realizable'::text])
         /* ✏️ LA VERDAD DEL PAGO VIVE ACÁ, y el índice no la miraba. Una reserva
            expirada o cancelada **no ocupa el día**: nunca se pagó. */
         AND (estado_reserva IS NULL
              OR estado_reserva <> ALL (ARRAY['expirada'::text, 'cancelada'::text])));

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_masc uuid; v_fecha date; v_n int; v_bloq int;
BEGIN
  /* (a) los días que estaban bloqueados por una reserva muerta salieron del
     índice. Se cuenta contra el PREDICADO VIVO, no contra la teoría. */
  SELECT count(*) INTO v_bloq
    FROM evento_cita_servicio c
   WHERE c.tipo_servicio='guarderia_dia' AND c.mascota_id IS NOT NULL AND c.fecha IS NOT NULL
     AND c.estado <> ALL (ARRAY['cancelada','rechazada','no_realizable'])
     AND c.estado_reserva = 'expirada';
  IF v_bloq = 0 THEN
    RAISE EXCEPTION 'cinturon: no hay dia con reserva expirada — este arnes no puede DISCRIMINAR';
  END IF;
  RAISE NOTICE 'cinturon M15: % dia(s) con reserva expirada, ahora FUERA del indice', v_bloq;

  /* (b) 🔴 EL DISCRIMINADOR: se INSERTA de verdad una cita sobre uno de esos
     días. Antes rebotaba con `duplicate key`; ahora tiene que entrar.
     *«El índice ya no los incluye» es una lectura; «la fila entró» es un hecho.* */
  SELECT c.mascota_id, c.fecha INTO v_masc, v_fecha
    FROM evento_cita_servicio c
   WHERE c.tipo_servicio='guarderia_dia' AND c.estado_reserva='expirada'
     AND c.estado <> ALL (ARRAY['cancelada','rechazada','no_realizable']) LIMIT 1;

  INSERT INTO evento_cita_servicio (evento_id, user_id, mascota_id, prestador_id,
    tipo_servicio, fecha, precio, duracion_minutos, estado, estado_reserva, country_code)
  SELECT c.evento_id, c.user_id, v_masc, c.prestador_id, 'guarderia_dia', v_fecha,
         0, c.duracion_minutos, 'confirmada', 'pagada', c.country_code
    FROM evento_cita_servicio c WHERE c.mascota_id=v_masc AND c.fecha=v_fecha LIMIT 1;

  /* (c) CONTROL POSITIVO: el índice SIGUE frenando el doble día real. *Un
     índice que suelta de más deja al mismo perro dos veces el mismo día, que es
     el daño que este índice existe para impedir.* */
  BEGIN
    INSERT INTO evento_cita_servicio (evento_id, user_id, mascota_id, prestador_id,
      tipo_servicio, fecha, precio, duracion_minutos, estado, estado_reserva, country_code)
    SELECT c.evento_id, c.user_id, v_masc, c.prestador_id, 'guarderia_dia', v_fecha,
           0, c.duracion_minutos, 'confirmada', 'pagada', c.country_code
      FROM evento_cita_servicio c WHERE c.mascota_id=v_masc AND c.fecha=v_fecha LIMIT 1;
    RAISE EXCEPTION 'cinturon: el indice dejo pasar DOS reservas pagadas del mismo dia';
  EXCEPTION WHEN unique_violation THEN NULL;  -- ✅ lo que se espera
  END;

  RAISE NOTICE 'cinturon M15: 3/3 OK (dias liberados · la reserva nueva ENTRA de verdad · el doble dia real SIGUE frenado)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M15: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
