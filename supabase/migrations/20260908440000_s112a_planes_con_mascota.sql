-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · G7 · EL PLAN DICE DE QUIÉN ES
--
-- 🔴 MEDIDO, no supuesto: `obtener_mis_planes_guarderia` devolvía `mascota_id`
-- **y nada más de la mascota**. La pantalla del cliente muestra un plan
-- mensual sin poder decir el nombre del animal — y **todo se contrata POR
-- MASCOTA** (firma del founder, S109). *Un plan que no dice de quién es
-- obliga a la familia con dos animales a adivinar cuál está pagando.*
--
-- ⚠️ SOBRE «LA FOTO COMO URL FIRMADA» — se entrega la RUTA, y es a propósito:
-- **Postgres no puede firmar una URL de Storage.** La firma es un acto de la
-- Storage API con su propia credencial y su TTL; una RPC que la devolviera
-- tendría que hablar HTTP desde la base. La casa ya resolvió esto y tiene su
-- molde: el lector devuelve la ruta y `apps/` la firma con
-- `resolverUrlFoto`/`resolverUrlsFotos` (precedente `D-308`, S47) — es lo
-- mismo que ya hace `obtener_estadias_del_dia` con `mascota_foto_url`.
-- *Prometer una URL firmada desde acá sería entregar una ruta cruda con
-- nombre de URL, que es exactamente el defecto que C midió esta semana en la
-- foto del durante: la pantalla la pinta como URI y no baja nada.*
--
-- 76(g) — **NO RIGE**: es un lector, sin backfill y sin anclas.
-- L-119 — se re-crea con DROP explícito porque cambia el TABLE de retorno.
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.obtener_mis_planes_guarderia();

CREATE OR REPLACE FUNCTION public.obtener_mis_planes_guarderia()
RETURNS TABLE(suscripcion_id uuid, prestador_id uuid, prestador_nombre text,
              mascota_id uuid, mascota_nombre text, mascota_especie text,
              mascota_foto_url text,
              precio_mensual numeric, estado text, periodo_desde date,
              periodo_hasta date, direccion_id uuid, proximo_cobro date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_fam uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id = auth.uid() AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT s.id, s.prestador_id, pr.nombre_comercial,
         s.mascota_id, m.nombre, m.especie, m.foto_url,
         s.precio_mensual, s.estado, s.periodo_desde, s.periodo_hasta, s.direccion_id,
         CASE WHEN s.estado = 'activa'
                   AND s.periodo_desde IS NOT NULL
                   AND s.dia_de_cobro IS NOT NULL
              THEN public.proximo_cobro_mensual(s.dia_de_cobro, s.periodo_desde)
              ELSE NULL END
    FROM guarderia_suscripciones s
    JOIN prestadores pr ON pr.id = s.prestador_id
    /* 🔴 LEFT, jamás JOIN. `guarderia_suscripciones.mascota_id` es NULLABLE
       — el plan `20d025ca` que el canon nombra existe y hay mandatos sin
       mascota. *Un INNER JOIN acá haría DESAPARECER de la pantalla el plan
       que la familia está pagando*, que es peor que no saber de quién es. */
    LEFT JOIN mascotas m ON m.id = s.mascota_id
   WHERE s.familia_id = v_fam
   ORDER BY (s.estado = 'activa') DESC, s.created_at DESC;
END $fn$;

REVOKE ALL ON FUNCTION public.obtener_mis_planes_guarderia() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mis_planes_guarderia() TO authenticated;

-- ═══ CINTURÓN ═══ el rojo primero, y con su control negativo (L-459).
DO $c$
DECLARE v_cols text[]; v_acl text;
BEGIN
  SELECT array_agg(a) INTO v_cols FROM unnest(
    string_to_array(pg_get_function_result(
      'public.obtener_mis_planes_guarderia()'::regprocedure), ', ')) a;

  IF NOT EXISTS (SELECT 1 FROM unnest(v_cols) c WHERE c LIKE 'mascota_nombre%') THEN
    RAISE EXCEPTION 'CINTURON: el lector no trae mascota_nombre';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM unnest(v_cols) c WHERE c LIKE 'mascota_foto_url%') THEN
    RAISE EXCEPTION 'CINTURON: el lector no trae mascota_foto_url';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM unnest(v_cols) c WHERE c LIKE 'proximo_cobro%') THEN
    RAISE EXCEPTION 'CINTURON: se perdio proximo_cobro al re-crear (L-119)';
  END IF;

  /* 🔴 EL CONTROL QUE HACE VÁLIDO AL POSITIVO: si el LEFT JOIN fuera INNER,
     un plan sin mascota desaparecería. Se prueba sobre el plan REAL sin
     mascota si existe; si no existe, se DICE que no se pudo probar en vez de
     dar un verde que no midió nada (L-437). */
  IF EXISTS (SELECT 1 FROM guarderia_suscripciones WHERE mascota_id IS NULL) THEN
    RAISE NOTICE 'CINTURON: hay % plan(es) sin mascota — el LEFT los conserva',
      (SELECT count(*) FROM guarderia_suscripciones WHERE mascota_id IS NULL);
  ELSE
    RAISE NOTICE 'CINTURON: ningun plan sin mascota hoy — el brazo del LEFT NO se pudo ejercer';
  END IF;

  SELECT array_to_string(proacl,',') INTO v_acl FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_planes_guarderia';
  IF v_acl ILIKE '%anon=%' THEN RAISE EXCEPTION 'CINTURON: anon en proacl (L-140)'; END IF;

  RAISE NOTICE 'CINTURON VERDE: el plan dice de quien es';
END $c$;
