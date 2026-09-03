-- S112-A · A10 · EL CONTEXTO DICE EN QUÉ MUNDO ENTRA LA CUENTA
-- 76(g) — NO RIGE: lector, sin backfill y sin anclas.
CREATE OR REPLACE FUNCTION public.obtener_contexto_arranque()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid              uuid := auth.uid();
  v_prestador        jsonb;
  v_prestador_id     uuid;
  v_cta_id           uuid;
  v_cta_estado       text;
  v_cta_nombre       text;
  v_cta_pais         text;
  v_es_gestor        boolean := false;
  v_posicion         jsonb;
  v_oficios_locales  text[] := '{}';
  v_es_vendedora     boolean := false;
  v_moneda           jsonb;
  v_ha_vendido       boolean := false;
  v_repartidor_de    jsonb := '[]'::jsonb;
  v_mostrador        boolean := false;
  v_refugio jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;

  -- ① EL PRESTADOR — por la MISMA puerta de siempre (titularidad o vínculo).
  SELECT to_jsonb(t) INTO v_prestador
  FROM public.obtener_mi_prestador() t
  LIMIT 1;
  v_prestador_id := (v_prestador ->> 'id')::uuid;

  IF v_prestador_id IS NOT NULL THEN
    v_es_gestor := COALESCE(
      public.empleado_tiene_rol(v_prestador_id, ARRAY['dueño','administrador']),
      false
    );
    v_posicion := public.obtener_mi_posicion_en_prestador(v_prestador_id);
    -- LA LISTA de oficios con local (dictado ④): el MISMO cruce de siempre
    -- —oferta activa con atiende_local × modalidad que admite local—, ahora
    -- devolviendo QUÉ oficios (los tres escalones cuentan y nombran).
    SELECT COALESCE(array_agg(DISTINCT ps.tipo_servicio), '{}')
      INTO v_oficios_locales
    FROM public.prestador_servicios ps
    JOIN public.obtener_modalidades_por_oficio() m
      ON m.tipo_servicio = ps.tipo_servicio
    WHERE ps.prestador_id = v_prestador_id
      AND ps.activo
      AND ps.atiende_local
      AND m.admite_atencion_local;
  END IF;

  -- ② LA CUENTA — owner primero; si no, la del prestador que gestiono
  --    (el espejo D-660, con la misma semántica que el wrapper: el
  --    prestador YA vino filtrado por la puerta de ①).
  SELECT c.id, c.estado, c.nombre_comercial, c.country_code, c.venta_mostrador_activa
    INTO v_cta_id, v_cta_estado, v_cta_nombre, v_cta_pais, v_mostrador
  FROM public.cuentas_comerciales c
  WHERE c.owner_profile_id = v_uid
  LIMIT 1;

  IF v_cta_id IS NULL AND (v_prestador ->> 'cuenta_comercial_id') IS NOT NULL THEN
    SELECT c.id, c.estado, c.nombre_comercial, c.country_code, c.venta_mostrador_activa
      INTO v_cta_id, v_cta_estado, v_cta_nombre, v_cta_pais, v_mostrador
    FROM public.cuentas_comerciales c
    WHERE c.id = (v_prestador ->> 'cuenta_comercial_id')::uuid;
  END IF;

  IF v_cta_id IS NOT NULL THEN
    -- EL VEREDICTO, SIEMPRE FRESCO (D-821: lo que otorga un tercero no se
    -- cachea — acá ni siquiera se puede: se lee en el mismo viaje).
    v_es_vendedora := EXISTS (
      SELECT 1 FROM public.cuenta_roles r
      WHERE r.cuenta_comercial_id = v_cta_id
        AND r.tipo_actor::text = 'seller_productos'
        AND r.estado::text = 'activo'
    );
    -- EL DISCRIMINADOR DEL VACÍO (letra de mesa 15-ago): ¿alguna vez vendió?
    v_ha_vendido := EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.cuenta_comercial_id = v_cta_id
        AND p.estado::text = 'entregado'
    );
    -- La config de moneda ENTERA (D-448: `monto()` exige la config, no el código).
    SELECT to_jsonb(cc) INTO v_moneda
    FROM (
      SELECT currency_code, currency_symbol, currency_decimals
      FROM public.country_config
      WHERE country_code = v_cta_pais
    ) cc;
  END IF;

  -- ③ LA IDENTIDAD DE REPARTIDOR (S99 Gate 2 ④) — solo vínculos SELLADOS.
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'repartidor_id', r.id,
           'cuenta_comercial_id', r.cuenta_comercial_id,
           'negocio', cc2.nombre_comercial
         ) ORDER BY r.vinculo_aceptado_en), '[]'::jsonb)
    INTO v_repartidor_de
  FROM public.repartidores r
  JOIN public.cuentas_comerciales cc2 ON cc2.id = r.cuenta_comercial_id
  WHERE r.user_id = v_uid
    AND r.vinculo_aceptado_en IS NOT NULL
    AND r.activo;

  -- EL REFUGIO (S112-A4). Aditivo: dos claves, cero cambios en las otras.
  v_refugio := public.obtener_mi_cuenta_refugio();

  RETURN jsonb_build_object(
    'ok', true,
    /* ═══ EN QUÉ MUNDO ENTRA ESTA CUENTA — LA REGLA, COMO VALOR ═══════════
       🔴 **REGRESIÓN A10, y su causa la puso esta misma sesión.** La app
       decidía la barra por la PRESENCIA de una fila de `prestadores`. Cuando
       A6 hizo que un refugio tuviera esa fila —para reusar la vitrina del
       prestador en vez de duplicarla— **la cuenta de refugio empezó a entrar
       con la barra de un negocio de servicios**: Hoy · Datos · Atender ·
       Negocio. *Antes de A7 no cargaba nada; después cargaba por la rama
       equivocada, que es peor: un error que no se ve como error.*

       ⚠️ **La fila NO es el defecto y no se retira**: sin ella el refugio no
       tiene vitrina. Lo que estaba mal es leer su existencia como un oficio.

       **La regla (firma del founder, 2-sep):** *rol refugio activo ⇒ contexto
       refugio, aunque exista cuenta comercial; el prestador sólo si hay
       `prestador_servicios` ACTIVO.*

       🔴 **Va acá y no en la pantalla**, y por eso es un valor y no tres
       banderas: *una regla que cada superficie compone es una regla que cada
       superficie puede componer distinto* — y ya se compuso mal una vez. Con
       `mundo`, una barra nueva no puede equivocarse sin ignorar el campo.

       `sin_oficio` **no es un error**: es una cuenta comercial sin oficio
       activo todavía. Se dice en vez de mandarla a una de las dos casas. */
    'mundo', CASE
      WHEN v_refugio IS NOT NULL AND v_refugio <> 'null'::jsonb THEN 'refugio'
      WHEN cardinality(v_oficios_locales) > 0                   THEN 'prestador'
      ELSE 'sin_oficio'
    END,
    'es_refugio', v_refugio IS NOT NULL AND v_refugio <> 'null'::jsonb,
    'refugio', v_refugio,
    'prestador', v_prestador,
    'es_gestor', v_es_gestor,
    'posicion', v_posicion,
    'hay_oficio_local', cardinality(v_oficios_locales) > 0,  -- DERIVADO de la lista (una fuente)
    'oficios_locales', to_jsonb(v_oficios_locales),
    'cuenta_comercial', CASE WHEN v_cta_id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_cta_id,
      'estado', v_cta_estado,
      'nombre_comercial', v_cta_nombre,
      'country_code', v_cta_pais
    ) END,
    'es_vendedora', v_es_vendedora,
    'ha_vendido', v_ha_vendido,
    'venta_mostrador_activa', v_mostrador,
    'moneda', v_moneda,
    'repartidor_de', v_repartidor_de
  );
END $function$

;

-- ═══ CINTURÓN — el ROJO es el caso real de la regresión (L-459) ═══
DO $c$
DECLARE v_ref uuid; v_vet uuid; v_m text; v_ofi int;
BEGIN
  SELECT user_id INTO v_ref FROM prestadores WHERE tipo='refugio' LIMIT 1;
  IF v_ref IS NULL THEN
    RAISE NOTICE 'CINTURON: sin refugio con fila de prestador — el ROJO no se pudo ejercer';
  ELSE
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_ref, 'role','authenticated')::text, true);
    v_m := public.obtener_contexto_arranque() ->> 'mundo';
    SELECT count(*) INTO v_ofi FROM prestador_servicios ps
      JOIN prestadores p ON p.id = ps.prestador_id
     WHERE p.user_id = v_ref AND ps.activo;
    IF v_m <> 'refugio' THEN
      RAISE EXCEPTION 'CINTURON: el refugio entra como «%» (oficios activos: %)', v_m, v_ofi;
    END IF;
    RAISE NOTICE 'CINTURON ROJO CURADO: el refugio entra como «refugio» y TIENE fila de prestador';
  END IF;

  /* 🔴 EL CONTROL POSITIVO: un prestador REAL con oficios activos tiene que
     seguir entrando como prestador. Sin este brazo, un `mundo` que dijera
     siempre 'refugio' daría el mismo verde arriba y rompería la app entera. */
  SELECT p.user_id INTO v_vet
    FROM prestadores p JOIN prestador_servicios ps ON ps.prestador_id = p.id
   WHERE p.tipo <> 'refugio' AND ps.activo
   LIMIT 1;
  IF v_vet IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin prestador con oficio activo no hay control positivo';
  END IF;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vet, 'role','authenticated')::text, true);
  v_m := public.obtener_contexto_arranque() ->> 'mundo';
  IF v_m <> 'prestador' THEN
    RAISE EXCEPTION 'CINTURON: un prestador con oficio activo entra como «%»', v_m;
  END IF;
  RAISE NOTICE 'CINTURON VERDE: refugio→refugio · prestador con oficio→prestador';
END $c$;
