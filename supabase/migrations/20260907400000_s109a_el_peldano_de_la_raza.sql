-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL PELDAÑO DE LA RAZA — las 111 imágenes dejan de ser inalcanzables
--
-- 76(g) VEDA: **NO RIGE.** Cuatro reemplazos de función. **Cero backfill.**
-- REVERSA: `docs/relevamientos/2026-09-07-s109a-REVERSA-M37.sql`.
-- L-119: las cuatro conservan su firma ⇒ `CREATE OR REPLACE` sin sobrecarga.
--
-- ═══ LA ESCALERA EXISTÍA Y ESTAS PANTALLAS NO LA USABAN ════════════════════
-- **cara de su raza → genérico de su especie → la huella.** Pedido de S109-D,
-- que midió que los tres lectores **proyectan subconjuntos distintos**, así que
-- la misma escalera caía en peldaños distintos según por dónde se entrara.
--
-- 🔴 **Y EL NÚMERO QUE LO VUELVE URGENTE, medido acá antes de tocar:**
--    de **83 mascotas**, sólo **9 tienen foto**. **38 ganan la cara de su raza**
--    con este lookup, y 36 caen a la huella.
--    ⇒ *Las mascotas con cara pasan de 9 a 47 — más de cinco veces.* No es un
--      peldaño cosmético: es la mayoría de la base.
--
-- ═══ POR LOOKUP, JAMÁS POR SLUG ADIVINADO ═════════════════════════════════
-- `mascotas.raza` es **texto libre**. El match va contra `cat_razas` por
-- `(especie, lower(nombre))`, y **lo que no matchea cae a NULL** para que la
-- superficie baje al peldaño siguiente.
-- *Fabricar la ruta desde el texto libre daría un 404 con cara de foto* — y un
-- roto silencioso es peor que el genérico que ya funciona.
--
-- ═══ Y EL TERCERO NECESITABA OTRA COSA ════════════════════════════════════
-- 🔴 `buscar_cliente_por_email` / `_por_telefono` entregaban
--    `{mascota_id, nombre, foto_url}` — **sin `especie`**. Sin ella la
--    superficie **no podía bajar ni al peldaño ②**: caía directo a la huella.
--    ⇒ ganan `especie` **y** `raza_ruta_imagen`. *D lo declaró en vez de
--      adivinar un slug, y tenía razón: sin especie, cualquier ruta inventada
--      sería PEOR que lo que había.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

/* 🔴 `L-119`: las dos de estadías CAMBIAN su tipo de retorno (el `TABLE` gana
   una columna) y `CREATE OR REPLACE` no puede hacerlo — Postgres rebota
   `42P13`. Van con DROP explícito, en la MISMA transacción, así que ninguna
   ventana las deja ausentes.
   ⚠️ Los dos buscadores devuelven `jsonb` y NO cambian de tipo: ésos sí van
   por REPLACE. *Tratarlos igual «por prolijidad» habría borrado dos funciones
   sin necesidad.* */
DROP FUNCTION IF EXISTS public.obtener_estadias_del_dia(uuid, date);
DROP FUNCTION IF EXISTS public.obtener_estadias_por_rango(uuid, date, date);

CREATE OR REPLACE FUNCTION public.obtener_estadias_del_dia(p_prestador_id uuid, p_fecha date)
 RETURNS TABLE(estadia_id uuid, cita_id uuid, estado text, mascota_id uuid, mascota_nombre text, mascota_especie text, mascota_foto_url text, espacio_nombre text, direccion_snapshot jsonb, a_bordo_en timestamp with time zone, llegada_en timestamp with time zone, entregada_en timestamp with time zone, estado_reserva text, raza_ruta_imagen text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  /* La puerta del negocio, no una regla nueva: la misma que gobierna su
     configuración. */
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT g.id, c.id, g.estado,
         m.id, m.nombre, m.especie, m.foto_url,
         e.nombre, c.direccion_snapshot,
         g.a_bordo_en, g.llegada_en, g.entregada_en,
         c.estado_reserva, rz.ruta_imagen
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    LEFT JOIN guarderia_espacios e ON e.id = g.espacio_id
    /* 🔴 EL PELDAÑO DE LA RAZA — por LOOKUP, jamás por slug adivinado.
       `mascotas.raza` es TEXTO LIBRE, así que el match es contra el catálogo
       por (especie, nombre) y **lo que no matchea cae a NULL**, que la
       superficie resuelve al peldaño siguiente. *Fabricar la ruta desde el
       texto libre daría un 404 con cara de foto.* */
    LEFT JOIN cat_razas rz ON rz.especie = m.especie
                          AND lower(rz.nombre) = lower(m.raza)
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha = p_fecha
     /* 🔴 LA JORNADA SÓLO CONTIENE VERDAD FIRME. Un hold sin pagar NO es una
        estadía del día: es alguien mirando. *Una lista que incluye reservas
        que pueden evaporarse en quince minutos hace salir al cuidador a buscar
        un animal que nadie compró.* (Principio de S51: la agenda sólo contiene
        verdad firme.) */
     AND c.estado_reserva = 'pagada'
     AND g.estado <> 'cancelada'
   ORDER BY m.nombre;
END $function$;

CREATE OR REPLACE FUNCTION public.obtener_estadias_por_rango(p_prestador_id uuid, p_desde date, p_hasta date)
 RETURNS TABLE(fecha date, estadia_id uuid, cita_id uuid, estado text, mascota_id uuid, mascota_nombre text, mascota_especie text, mascota_foto_url text, espacio_nombre text, direccion_snapshot jsonb, a_bordo_en timestamp with time zone, llegada_en timestamp with time zone, entregada_en timestamp with time zone, estado_reserva text, raza_ruta_imagen text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  /* La MISMA puerta que la del día — no una nueva. */
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_desde IS NULL OR p_hasta IS NULL OR p_hasta < p_desde THEN
    RAISE EXCEPTION 'rango_invalido' USING ERRCODE = '22023';
  END IF;
  /* Sin techo, «por rango» es «por todo». */
  IF (p_hasta - p_desde) > 62 THEN
    RAISE EXCEPTION 'rango_demasiado_largo' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT c.fecha, g.id, c.id, g.estado,
         m.id, m.nombre, m.especie, m.foto_url,
         e.nombre, c.direccion_snapshot,
         g.a_bordo_en, g.llegada_en, g.entregada_en,
         c.estado_reserva, rz.ruta_imagen
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    LEFT JOIN guarderia_espacios e ON e.id = g.espacio_id
    /* 🔴 EL PELDAÑO DE LA RAZA — por LOOKUP, jamás por slug adivinado.
       `mascotas.raza` es TEXTO LIBRE, así que el match es contra el catálogo
       por (especie, nombre) y **lo que no matchea cae a NULL**, que la
       superficie resuelve al peldaño siguiente. *Fabricar la ruta desde el
       texto libre daría un 404 con cara de foto.* */
    LEFT JOIN cat_razas rz ON rz.especie = m.especie
                          AND lower(rz.nombre) = lower(m.raza)
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha BETWEEN p_desde AND p_hasta
     /* 🔴 LA JORNADA SÓLO CONTIENE VERDAD FIRME — palabra por palabra la misma
        que la del día. *Un hold sin pagar no es una estadía: es alguien
        mirando.* */
     AND c.estado_reserva = 'pagada'
     AND g.estado <> 'cancelada'
   ORDER BY c.fecha, m.nombre;
END $function$;

CREATE OR REPLACE FUNCTION public.buscar_cliente_por_email(p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_email_lower text := LOWER(trim(p_email));
  v_user_id uuid;
  v_nombre text;
  v_pendiente_id uuid;
  v_pendiente_prestador_id uuid;
  v_pendiente_expira timestamptz;
  v_mascotas jsonb;
BEGIN
  IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF v_email_lower IS NULL OR length(v_email_lower) = 0 THEN
    RAISE EXCEPTION 'email_required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM prestador_empleados pe WHERE pe.user_id = v_auth_uid AND pe.activo = true
    UNION SELECT 1 FROM prestadores p WHERE p.user_id = v_auth_uid
  ) THEN
    RAISE EXCEPTION 'invocador_no_es_prestador' USING ERRCODE = '42501';
  END IF;

  SELECT id, nombre INTO v_user_id, v_nombre
  FROM profiles WHERE LOWER(email) = v_email_lower LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'mascota_id', m.id, 'nombre', m.nombre, 'foto_url', m.foto_url,
      /* 🔴 SIN `especie` NO ALCANZA NI EL GENÉRICO. Este lector entregaba
         `{mascota_id, nombre, foto_url}` y la superficie no podía bajar ni
         al peldaño ② — caía directo a la huella. */
      'especie', m.especie,
      'raza_ruta_imagen', (SELECT rz.ruta_imagen FROM cat_razas rz
                            WHERE rz.especie = m.especie
                              AND lower(rz.nombre) = lower(m.raza) LIMIT 1)
    ) ORDER BY m.nombre), '[]'::jsonb) INTO v_mascotas
    FROM familia_miembro fm
    JOIN familia f ON f.id = fm.familia_id
    JOIN mascotas m ON m.familia_id = f.id AND m.estado_vida = 'activa'
    WHERE fm.user_id = v_user_id AND fm.rol = 'adulto_titular' AND fm.hasta IS NULL AND f.tipo = 'estandar';

    RETURN jsonb_build_object('existe', 'registrado', 'user_id', v_user_id, 'nombre', v_nombre, 'mascotas', v_mascotas);
  END IF;

  SELECT id, creado_por_prestador_id, expira_en
  INTO v_pendiente_id, v_pendiente_prestador_id, v_pendiente_expira
  FROM cliente_pendiente_registro
  WHERE LOWER(email) = v_email_lower AND completado_en IS NULL AND soporte_resuelto_en IS NULL
  LIMIT 1;

  IF v_pendiente_id IS NOT NULL THEN
    RETURN jsonb_build_object('existe', 'pendiente', 'pendiente_id', v_pendiente_id,
      'creado_por_prestador_id', v_pendiente_prestador_id, 'expira_en', v_pendiente_expira);
  END IF;

  RETURN jsonb_build_object('existe', 'no_registrado', 'email', p_email);
END;
$function$;

CREATE OR REPLACE FUNCTION public.buscar_cliente_por_telefono(p_telefono text, p_country_code text DEFAULT 'EC'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_norm text;
  v_user_id uuid;
  v_nombre text;
  v_pendiente_id uuid;
  v_pendiente_prestador_id uuid;
  v_pendiente_expira timestamptz;
  v_mascotas jsonb;
BEGIN
  IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM prestador_empleados pe WHERE pe.user_id = v_auth_uid AND pe.activo = true
    UNION SELECT 1 FROM prestadores p WHERE p.user_id = v_auth_uid
  ) THEN
    RAISE EXCEPTION 'invocador_no_es_prestador' USING ERRCODE = '42501';
  END IF;

  v_norm := public.normalizar_telefono(p_telefono, p_country_code);
  IF v_norm IS NULL THEN RAISE EXCEPTION 'telefono_required' USING ERRCODE = '22023'; END IF;

  SELECT id, nombre INTO v_user_id, v_nombre
  FROM profiles WHERE public.normalizar_telefono(telefono, p_country_code) = v_norm LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- ENMIENDA S70-A3: mascotas activas de las familias estandar donde el
    -- user es adulto_titular — nada más (ni especie, ni edad, ni counts).
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'mascota_id', m.id, 'nombre', m.nombre, 'foto_url', m.foto_url,
      /* 🔴 SIN `especie` NO ALCANZA NI EL GENÉRICO. Este lector entregaba
         `{mascota_id, nombre, foto_url}` y la superficie no podía bajar ni
         al peldaño ② — caía directo a la huella. */
      'especie', m.especie,
      'raza_ruta_imagen', (SELECT rz.ruta_imagen FROM cat_razas rz
                            WHERE rz.especie = m.especie
                              AND lower(rz.nombre) = lower(m.raza) LIMIT 1)
    ) ORDER BY m.nombre), '[]'::jsonb) INTO v_mascotas
    FROM familia_miembro fm
    JOIN familia f ON f.id = fm.familia_id
    JOIN mascotas m ON m.familia_id = f.id AND m.estado_vida = 'activa'
    WHERE fm.user_id = v_user_id AND fm.rol = 'adulto_titular' AND fm.hasta IS NULL AND f.tipo = 'estandar';

    RETURN jsonb_build_object('existe', 'registrado', 'user_id', v_user_id, 'nombre', v_nombre, 'mascotas', v_mascotas);
  END IF;

  SELECT id, creado_por_prestador_id, expira_en
  INTO v_pendiente_id, v_pendiente_prestador_id, v_pendiente_expira
  FROM cliente_pendiente_registro
  WHERE country_code = p_country_code AND telefono_normalizado = v_norm
    AND completado_en IS NULL AND soporte_resuelto_en IS NULL
  LIMIT 1;

  IF v_pendiente_id IS NOT NULL THEN
    RETURN jsonb_build_object('existe', 'pendiente', 'pendiente_id', v_pendiente_id,
      'creado_por_prestador_id', v_pendiente_prestador_id, 'expira_en', v_pendiente_expira);
  END IF;

  RETURN jsonb_build_object('existe', 'no_registrado', 'telefono', p_telefono);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid,date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid,date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.obtener_estadias_por_rango(uuid,date,date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_estadias_por_rango(uuid,date,date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.buscar_cliente_por_email(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.buscar_cliente_por_email(text) TO authenticated;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $cint$
DECLARE v_n int; v_p uuid; v_f date; v_rol text := current_user; v_tit uuid; v_con int;
BEGIN
  /* ① las cuatro proyectan la ruta */
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public'
     AND p.proname IN ('obtener_estadias_del_dia','obtener_estadias_por_rango',
                       'buscar_cliente_por_email','buscar_cliente_por_telefono')
     AND regexp_replace(regexp_replace(pg_get_functiondef(p.oid),'/\*.*?\*/','','gs'),'--[^\n]*','','g')
         ~ 'raza_ruta_imagen';
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'CINTURON ①: solo % de 4 lectores proyectan raza_ruta_imagen', v_n;
  END IF;
  RAISE NOTICE 'CINTURON ① OK - los cuatro proyectan la ruta';

  /* ② los dos buscadores llevan ADEMAS la especie: sin ella no se alcanza ni
     el generico, que es el defecto que D declaro y no adivino. */
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname LIKE 'buscar_cliente_por_%'
     AND regexp_replace(regexp_replace(pg_get_functiondef(p.oid),'/\*.*?\*/','','gs'),'--[^\n]*','','g')
         ~ '''especie'', m\.especie';
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'CINTURON ②: solo % de 2 buscadores llevan la especie', v_n;
  END IF;
  RAISE NOTICE 'CINTURON ② OK - los dos buscadores llevan la especie';

  /* ③ EL ACTO REAL, con sesion: el lector DEVUELVE una ruta de verdad.
     Sin este brazo, ① y ② solo dicen que el texto esta escrito. */
  SELECT c.prestador_id, c.fecha INTO v_p, v_f
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
    JOIN mascotas m ON m.id = c.mascota_id
    JOIN cat_razas rz ON rz.especie = m.especie AND lower(rz.nombre) = lower(m.raza)
   WHERE c.estado_reserva = 'pagada' AND g.estado <> 'cancelada'
   ORDER BY c.fecha DESC LIMIT 1;
  IF v_p IS NULL THEN
    RAISE NOTICE 'CINTURON ③ NO EJERCIDO - no hay estadia firme cuya mascota matchee el catalogo. Se DECLARA en vez de contarse verde.';
  ELSE
    SELECT pr.user_id INTO v_tit FROM prestadores pr WHERE pr.id = v_p;
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_tit, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_con FROM public.obtener_estadias_del_dia(v_p, v_f)
     WHERE raza_ruta_imagen IS NOT NULL;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF v_con = 0 THEN
      RAISE EXCEPTION 'CINTURON ③: el lector no devolvio NI UNA ruta sobre una mascota que SI matchea el catalogo — el join no resuelve';
    END IF;
    RAISE NOTICE 'CINTURON ③ OK - el lector devolvio % fila(s) con su ruta de raza', v_con;
  END IF;

  RAISE NOTICE 'CINTURON VERDE';
END $cint$;

COMMIT;
