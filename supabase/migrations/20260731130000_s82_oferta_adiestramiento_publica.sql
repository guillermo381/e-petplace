-- S82-A r18 · EL LECTOR PÚBLICO DE LA OFERTA DE ADIESTRAMIENTO
--
-- EL HUECO (medido, C lo halló): adiestramiento era el único de los
-- cuatro oficios SIN lector público de oferta. El único que existía
-- —`obtenerOfertaAdiestramientoPropia`— está keyed por `prestador_id`,
-- que es el dato que el DUEÑO justamente NO conoce en ese paso: la
-- gramática canónica (DISEÑO_EXPERIENCIA §11) manda MASCOTA → QUÉ → DÍA
-- → HORA → **QUIÉN** → PAGAR; el prestador aparece DESPUÉS. Sin lector
-- público, el pie de la pantalla salía con `total={null}` — honesto,
-- pero mudo.
--
-- POR QUÉ RPC Y NO LECTURA POR RLS (la decisión que este archivo toma):
-- hay DOS moldes vivos en la casa y **no coinciden**:
--   · `obtener_oferta_paseo` — RPC DEFINER, aplica el gate 7.13 ENTERO
--     ("no se oferta quien no puede cobrar": cuenta comercial ACTIVA).
--   · `obtenerOfertaGroomingPublica` — lectura por RLS, y **declara en su
--     propio comentario que NO replica ese gate**: un prestador activo
--     sin cuenta cobrable pintaría su "desde".
-- La RLS de `cuentas_comerciales` es solo-owner, así que el criterio SOLO
-- puede vivir server-side. **Se sigue el molde del paseo** — el que no
-- tiene el caveat. (El caveat del grooming queda vivo y sin tocar: es de
-- su territorio; acá se anota que existe, no se cura de prepo.)
--
-- LOS DOS COMPRABLES (vocabulario ya vivo, `COMPRABLES_ADIESTRAMIENTO`):
--   · 'sesion'   → mínimo de `prestador_servicios.precio`
--   · 'programa' → mínimo de `prestador_programas.precio_programa`
-- Un comprable SIN precio real NO EMITE FILA — jamás `desde_precio` NULL
-- ni 0. Un "desde $0" es el verosímil-falso exacto que L-139 prohíbe, y
-- la pantalla ya lo declara así en su propio comentario: prefiere no
-- decir nada antes que inventar un monto.
--
-- `varia` = hay más de un precio distinto ⇒ la voz dice "desde".
-- Con N=1 el precio es EXACTO y la superficie puede decirlo sin "desde"
-- (la escalera del precio honesto, DISEÑO_EXPERIENCIA §11).
--
-- 76(g): **NO RIGE** — DDL puro, sin backfill, sin anclas, cero escritura.
-- L-140: REVOKE + GRANT explícitos al pie, con su verificación.

CREATE OR REPLACE FUNCTION public.obtener_oferta_adiestramiento_publica()
RETURNS TABLE(comprable text, desde_precio numeric, varia boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  -- Las ofertas que REALMENTE se pueden comprar hoy (gate 7.13 entero,
  -- espejo literal de obtener_oferta_paseo).
  WITH ofertas AS (
    SELECT ps.id, ps.precio
    FROM prestador_servicios ps
    JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                               AND ts.categoria = 'adiestramiento'
                               AND ts.activo AND ts.reservable
    WHERE ps.activo AND ps.reservable
  )
  SELECT 'sesion'::text,
         MIN(o.precio),
         COUNT(DISTINCT o.precio) > 1
  FROM ofertas o
  WHERE o.precio IS NOT NULL          -- sin precio no hay "desde" (L-139)
  HAVING COUNT(o.precio) > 0

  UNION ALL

  SELECT 'programa'::text,
         MIN(pp.precio_programa),
         COUNT(DISTINCT pp.precio_programa) > 1
  FROM prestador_programas pp
  JOIN ofertas o ON o.id = pp.prestador_servicio_id
  WHERE pp.activo AND pp.precio_programa IS NOT NULL
  HAVING COUNT(pp.precio_programa) > 0;
END;
$$;

-- L-140: toda función nace con EXECUTE para anon por los default
-- privileges, y `REVOKE FROM PUBLIC` no lo quita — hay que nombrarlo.
-- Esta lectura exige sesión (el propio body lo levanta), así que anon
-- no tiene nada que hacer acá.
REVOKE EXECUTE ON FUNCTION public.obtener_oferta_adiestramiento_publica() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_oferta_adiestramiento_publica() TO authenticated;

DO $verificacion$
DECLARE
  v_acl text;
BEGIN
  SELECT array_to_string(proacl, ' ') INTO v_acl
  FROM pg_proc WHERE proname = 'obtener_oferta_adiestramiento_publica';
  IF v_acl LIKE '%anon=X%' THEN
    RAISE EXCEPTION 'L-140: anon conserva EXECUTE — proacl=%', v_acl;
  END IF;
  IF v_acl NOT LIKE '%authenticated=X%' THEN
    RAISE EXCEPTION 'authenticated NO tiene EXECUTE — proacl=%', v_acl;
  END IF;
  RAISE NOTICE 'L-140 OK · proacl=%', v_acl;
END;
$verificacion$;
