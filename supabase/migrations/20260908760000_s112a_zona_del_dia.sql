-- S112-A · EL CONTEXTO DICE CON QUÉ ZONA LA BASE DEFINE «HOY»
-- 76(g) — NO RIGE: lector, sin backfill.
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
    /* ═══ CON QUÉ ZONA ESTA BASE DEFINE «HOY» ═════════════════════════════
       🔴 **La app NO puede calcular el día con el reloj del teléfono.** A las
       23:01 de Guayaquil el UTC ya es el día siguiente: `hoy_local()` dice
       `2026-09-02` y `new Date()` en UTC dice `03`. Pedirle al lector el día
       equivocado **no falla** — devuelve las filas del otro día, en otro
       estado, y eso se lee como defecto de la pantalla. *Cinco horas de cada
       veinticuatro la app y la base hablan de días distintos.*

       Se devuelve **la ZONA y no sólo el día**: un día viaja bien y **se
       vence a la medianoche siguiente**, así que una app abierta desde la
       tarde lo tendría viejo. Con la zona, la app lo recalcula cuando quiera.
       `hoy` va al lado sólo para que pueda **comprobar su cuenta**.

       ⚠️ **DECLARADO: la zona es CONSTANTE, no por prestador.** `hoy_local()`
       la tiene fija y **58 funciones de la casa hacen lo mismo**. Existen
       columnas `zona_horaria` por entidad —`guarderia_franjas`, `eventos`,
       `vendedor_bodegas`, `entrega_turnos`— **y ninguna la lee**. *Un dato
       que existe y nadie consulta se lee como si estuviera rigiendo.* El día
       que haya un prestador fuera de Ecuador, esto es lo primero que miente;
       no se cura desde acá porque son 58 funciones y es decisión de
       plataforma. */
    'zona_horaria', 'America/Guayaquil',
    'hoy', public.hoy_local(),
    
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

-- ═══ CINTURÓN ═══
DO $c$
DECLARE v jsonb; v_u uuid;
BEGIN
  SELECT id INTO v_u FROM auth.users LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_u, 'role','authenticated')::text, true);
  v := public.obtener_contexto_arranque();
  IF v->>'zona_horaria' IS NULL THEN RAISE EXCEPTION 'CINTURON: no devuelve la zona'; END IF;
  IF (v->>'hoy')::date <> public.hoy_local() THEN
    RAISE EXCEPTION 'CINTURON: el hoy del contexto no coincide con hoy_local()';
  END IF;
  /* 🔴 EL CONTROL: la zona tiene que ser la MISMA que usa `hoy_local()`, no
     una escrita al lado. Si divergieran, la app calcularía un día que la base
     no usa — y las dos se verían correctas por separado. */
  IF (now() AT TIME ZONE (v->>'zona_horaria'))::date <> public.hoy_local() THEN
    RAISE EXCEPTION 'CINTURON: la zona declarada NO produce el mismo dia que hoy_local()';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: zona=% · hoy=% · coincide con hoy_local()', v->>'zona_horaria', v->>'hoy';
END $c$;
