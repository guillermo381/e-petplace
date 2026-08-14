-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · EL PASEO ES SIEMPRE A DOMICILIO — no existe paseo en local
-- (firma del founder, 14-ago-2026)
--
-- CIERRA **D-792** con criterio, no con backfill a ciegas: *el toggle
-- «atiendo en mi local» se ofrece POR OFICIO, y el paseo NO lo ofrece.*
--
-- 🔴 POR QUÉ AHORA SÍ SE CURAN LOS DATOS, cuando D-792 decía expresamente que
--    NO se hiciera backfill: **la ficha frenaba por falta de CRITERIO**, no
--    por miedo al UPDATE. Su literal: *«qué significa «local» para un paseo es
--    decisión de producto, no de migración»* y *«apagarlo por prolijidad
--    dejaría sin recepción a quien sí recibe, sin que nadie lo descubra»*.
--    **La firma del founder da el criterio que faltaba** ⇒ ahora los 9
--    `atiende_local = true` de paseo **no son un default permisivo: son un
--    DATO FALSO**, y un dato falso se corrige.
--
-- LAS TRES CONSECUENCIAS, que van juntas o no van:
--   ① los 9 paseos pasan a `atiende_local = false` (esta migración);
--   ② un guard vuelve el estado **INEXPRESABLE** para ese oficio — *curar los
--      datos sin cerrar la puerta es curar hasta el próximo INSERT*;
--   ③ **el paseo NO cuenta para la capacidad presencial de `ATENDER`**
--      (superficie: pedido a C, declarado en el reporte).
--
-- ⚠️ EL CHECK `chk_ps_alguna_modalidad` EXIGE `local OR domicilio`, así que el
--    UPDATE **prende `atiende_domicilio` en el mismo acto**. No es un extra:
--    sin él la fila sería inexpresable y el UPDATE rebotaría. *Y es la firma
--    misma — el paseo es SIEMPRE a domicilio.*
--
-- 76(g): 🔴 **RIGE** — esta migración TOCA DATOS (9 filas). Se declara.
-- REVERSA escrita ANTES, con su SELECT probatorio y su aviso.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① EL DATO ────────────────────────────────────────────────────────────
UPDATE public.prestador_servicios
   SET atiende_local     = false,
       atiende_domicilio = true      -- la firma: el paseo es SIEMPRE a domicilio
 WHERE tipo_servicio = 'paseo'
   AND (atiende_local IS DISTINCT FROM false OR atiende_domicilio IS DISTINCT FROM true);

-- ── ② EL GUARD — el estado falso deja de ser expresable ─────────────────
CREATE OR REPLACE FUNCTION public._trg_ps_paseo_sin_local()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tipo_servicio = 'paseo' AND NEW.atiende_local THEN
    RAISE EXCEPTION 'paseo_no_atiende_en_local: el paseo es SIEMPRE a domicilio — no existe paseo en local (firma del founder, 14-ago-2026)'
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $function$;

CREATE TRIGGER trg_ps_paseo_sin_local
  BEFORE INSERT OR UPDATE OF tipo_servicio, atiende_local ON public.prestador_servicios
  FOR EACH ROW EXECUTE FUNCTION public._trg_ps_paseo_sin_local();

-- ── CINTURÓN CON DISCRIMINADOR ───────────────────────────────────────────
DO $$
DECLARE v_n int; v_pres uuid;
BEGIN
  SET LOCAL ROLE postgres;

  -- ① ningún paseo quedó afirmando que atiende en local
  SELECT count(*) INTO v_n FROM prestador_servicios WHERE tipo_servicio='paseo' AND atiende_local;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: quedan % paseos con atiende_local', v_n; END IF;

  -- ② y ninguno quedó sin modalidad (el CHECK se honró)
  SELECT count(*) INTO v_n FROM prestador_servicios WHERE tipo_servicio='paseo' AND NOT atiende_domicilio;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: % paseos sin domicilio', v_n; END IF;

  -- ③ EL DISCRIMINADOR: el estado falso ahora REBOTA (no solo está curado)
  SELECT id INTO v_pres FROM prestador_servicios WHERE tipo_servicio='paseo' LIMIT 1;
  IF v_pres IS NULL THEN RAISE EXCEPTION 'CINTURON ABORTA: no hay paseo vivo — la cura no se puede discriminar'; END IF;
  BEGIN
    UPDATE prestador_servicios SET atiende_local = true WHERE id = v_pres;
    RAISE EXCEPTION 'CINTURON 🔴: se pudo volver a poner atiende_local en un paseo — el guard no rige';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;   -- el rebote esperado
  END;

  -- ④ CONTRA-CASO: los otros oficios NO se tocan
  SELECT count(*) INTO v_n FROM prestador_servicios WHERE tipo_servicio <> 'paseo' AND atiende_local;
  IF v_n = 0 THEN RAISE EXCEPTION 'CINTURON: se apago atiende_local en oficios ajenos — el guard se paso de alcance'; END IF;

  RAISE NOTICE 'CINTURON paseo: 0 con local · todos a domicilio · el estado falso REBOTA · % filas de otros oficios intactas', v_n;
END $$;

COMMIT;
