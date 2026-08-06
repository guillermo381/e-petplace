-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · D-658 — MEMORIAL NO ES RESERVABLE, Y LO DICE EL MOTOR (cura firmada)
--
-- EL HUECO (medido, producido por camino real contra el body viejo, fixture
-- in-txn ROLLBACK): la frontera «memorial/perdida no reservan» vivía SOLO en
-- TS (`mascotasElegibles`, S73). Por RPC directa, `crear_bloqueo_agenda` con
-- Zeus FALLECIDA devolvió VERDE — el hold nació — y el helper daba elegible
-- en los cuatro oficios. Precisión medida al reproducir (L-109): el CHECK
-- vivo admite `activa · perdida · fallecida` — «memorial» es la VOZ de la
-- app para `fallecida`, no un valor de columna.
--
-- LA CURA (una línea, la firmada en el brief S89): `estado_vida = 'activa'`
-- entra al helper único `_mascota_elegible_servicio`, que las TRES puertas
-- (hold · paquete · plan) ya consultan — el rebote sale como
-- `mascota_no_elegible`, el código que las puertas ya hablan.
-- Medido antes de escribirla: `estado_vida` es NOT NULL DEFAULT 'activa'
-- (20/20 activas hoy) — la línea no puede apagar una viva.
--
-- 76(g): NO RIGE — un CREATE OR REPLACE, cero backfill.
-- D-662: cero cambio de contrato; los bundles solo pueden ganar un rebote
--   que la UI ya sabe decir.
-- L-140: no nace función; proacl intacto.
-- REVERSA: docs/relevamientos/2026-08-06-s89a-REVERSA-d658-memorial.sql
--   (escrita ANTES; revertir REABRE el hueco).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._mascota_elegible_servicio(p_mascota_id uuid, p_tipo_servicio text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT COALESCE(
    (SELECT m.estado_vida = 'activa'   -- D-658 (S89): memorial/perdida no reservan — la frontera vive en el MOTOR
        AND (ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie)
       FROM mascotas m
       LEFT JOIN tipos_servicio ts ON ts.codigo = p_tipo_servicio
      WHERE m.id = p_mascota_id),
    false  -- mascota inexistente: jamás elegible
  );
$function$;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_src text;
BEGIN
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = '_mascota_elegible_servicio';
  IF v_src NOT LIKE '%estado_vida%' THEN
    RAISE EXCEPTION 'cinturon_d658: el helper sigue sin mirar estado_vida';
  END IF;
  IF public._mascota_elegible_servicio(gen_random_uuid(), 'paseo') THEN
    RAISE EXCEPTION 'cinturon_d658: la mascota inexistente dejó de ser jamás-elegible';
  END IF;
END $cint$;
