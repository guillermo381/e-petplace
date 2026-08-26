-- ═══════════════════════════════════════════════════════════════════════
-- S106-A · 2e — SE JUBILA `prestadores.acepta_telemedicina`
-- ═══════════════════════════════════════════════════════════════════════
--
-- LO MEDIDO (S106-A turno ⓪, contra el objeto):
--   · **11 prestadores, 11 en `false`, CERO en `true`, cero NULL.**
--   · **CERO lectores.** Ninguna función SQL la lee; en el monorepo aparece
--     únicamente en `database.types.ts` (generado). Cero consumidores TS.
--   · **DOS escritores que la SIEMBRAN en cada alta**:
--     `crear_prestador_inicial` (INSERT) y `wizard_crear_cuenta_y_rol` (que
--     solo le pasa el parámetro).
--   · Viajaba además en `v_prestadores_publicos`, o sea que salía a la app.
--
-- 🔴 **Se escribe en cada alta y no la lee nadie.** Es exactamente *«un
-- interruptor que no está conectado a nada no falla: se siente encendido»*
-- (PLAN_MESA_106 §0) — y encima contradice el camino (c): la habilitación
-- de telemedicina la decide la aceptación de mínimos (§6/§8), que ya tiene
-- su propia tabla desde `20260826220000`.
--
-- ─── LA FORMA DEL RETIRO — decisión técnica con doble check ─────────────
--
-- **La COLUMNA se dropea. El PARÁMETRO sobrevive con lápida.** No es
-- inconsistencia: es que tienen radios distintos.
--
--   · La columna no la lee nadie ⇒ dropearla no puede romper nada, y
--     dejarla es el interruptor fantasma.
--   · La FIRMA es otra cosa: **el alta del prestador se corre POR SQL A
--     MANO** (canon S79: *«El portal admin NO nace — 3 RPCs por SQL»*), así
--     que su runbook **vive fuera del repo y esta migración no puede
--     verlo**. Cambiar la aridad rompería un procedimiento operativo a
--     ciegas — el mismo modo de falla que la lección S95-F, *lo que bloquea
--     vive afuera*.
--
--   ⇒ El parámetro queda **aceptado e IGNORADO, con lápida en el cuerpo**
--   diciendo por qué. Se retira con su ficha, cuando alguien toque el
--   wizard y pueda medir el runbook completo.
--
-- ⚠️ *Un parámetro que no hace nada es un olor* — por eso lleva lápida y
-- ficha, no silencio.
--
-- ─── VEDA 76(g): **NO RIGE.** ──────────────────────────────────────────
-- No hay backfill: se DROPEA una columna cuyos 11 valores son idénticos al
-- default. Sin anclas, sin ventana de escritura que proteger.
--
-- ⚠️ **D-662 declarado (qué bundles vivos la consultan): NINGUNO.** Medido
-- por grep en `packages/` y `apps/`: la única aparición fuera de los tipos
-- generados es cero. La vista se recrea sin ella en el mismo acto, así que
-- ningún `select` nombrado la pide.
--
-- ─── REVERSA ───────────────────────────────────────────────────────────
-- docs/relevamientos/2026-08-25-s106a-REVERSA-jubilar-acepta-telemedicina.sql
-- Declara que restaura la columna con su default, no los valores.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1 · Cortar la SIEMBRA (antes de dropear, o el INSERT rompe) ───────
CREATE OR REPLACE FUNCTION public.crear_prestador_inicial(p_cuenta_comercial_id uuid, p_tipo text, p_nombre_comercial text, p_ciudad text, p_descripcion text DEFAULT NULL::text, p_telefono text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text, p_email_contacto text DEFAULT NULL::text, p_sitio_web text DEFAULT NULL::text, p_direccion text DEFAULT NULL::text, p_sector text DEFAULT NULL::text, p_lat double precision DEFAULT NULL::double precision, p_lon double precision DEFAULT NULL::double precision, p_acepta_emergencias boolean DEFAULT NULL::boolean, p_acepta_telemedicina boolean DEFAULT NULL::boolean, p_radio_cobertura_km integer DEFAULT NULL::integer, p_matricula_profesional text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, prestador_id uuid, mensaje text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid              uuid := auth.uid();
  v_nombre_trim           text := trim(p_nombre_comercial);
  v_ciudad_trim           text := trim(p_ciudad);
  v_tipos_validos         text[] := ARRAY[
    'clinica_veterinaria','veterinario_independiente','grooming','paseador',
    'hotel_mascotas','adiestramiento','laboratorio','otro'
  ];
  v_country_code          text;
  v_validacion            record;
  v_existe_prestador      boolean;
  v_user_ya_dueno         boolean;
  v_nuevo_id              uuid;
  v_metadata_safe         jsonb := COALESCE(p_metadata, '{}'::jsonb);
  v_metadata_final        jsonb;
  v_descripcion_otro      text;
BEGIN
  IF v_nombre_trim IS NULL OR length(v_nombre_trim) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'El nombre comercial es obligatorio.';
    RETURN;
  END IF;

  IF v_ciudad_trim IS NULL OR length(v_ciudad_trim) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'La ciudad es obligatoria.';
    RETURN;
  END IF;

  IF p_tipo IS NULL OR NOT (p_tipo = ANY (v_tipos_validos)) THEN
    RETURN QUERY SELECT false, NULL::uuid, 'El tipo de prestador no es válido.';
    RETURN;
  END IF;

  IF p_tipo = 'otro' THEN
    v_descripcion_otro := NULLIF(trim(v_metadata_safe ->> 'tipo_otro_descripcion'), '');

    IF v_descripcion_otro IS NULL THEN
      RETURN QUERY SELECT false, NULL::uuid,
        'Cuando seleccionas el tipo "Otro", debes describir brevemente tu tipo de servicio.';
      RETURN;
    END IF;

    IF length(v_descripcion_otro) < 5 OR length(v_descripcion_otro) > 200 THEN
      RETURN QUERY SELECT false, NULL::uuid,
        'La descripción del tipo de servicio debe tener entre 5 y 200 caracteres.';
      RETURN;
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.prestadores
    WHERE user_id = v_auth_uid
  )
  INTO v_user_ya_dueno;

  IF v_user_ya_dueno THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'Ya eres dueño de un prestador. No puedes crear otro desde este flujo.';
    RETURN;
  END IF;

  SELECT * INTO v_validacion
  FROM public._validar_ownership_cuenta_comercial(p_cuenta_comercial_id);

  IF NOT v_validacion.valido THEN
    RETURN QUERY SELECT false, NULL::uuid, v_validacion.mensaje;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.prestadores p
    WHERE p.cuenta_comercial_id = p_cuenta_comercial_id
  )
  INTO v_existe_prestador;

  IF v_existe_prestador THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'Esta cuenta comercial ya tiene un prestador registrado. Para agregar sedes adicionales, hazlo desde el panel de gestión.';
    RETURN;
  END IF;

  SELECT cc.country_code INTO v_country_code
  FROM public.cuentas_comerciales cc
  WHERE cc.id = p_cuenta_comercial_id;

  v_metadata_final := jsonb_build_object('created_via', 'wizard') || v_metadata_safe;

  INSERT INTO public.prestadores (
    user_id, cuenta_comercial_id, country_code, tipo, nombre_comercial,
    ciudad, descripcion, telefono, whatsapp, email_contacto, sitio_web,
    direccion, sector, lat, lon, acepta_emergencias,
    radio_cobertura_km, matricula_profesional, estado, metadata
  ) VALUES (
    v_auth_uid, p_cuenta_comercial_id, v_country_code, p_tipo, v_nombre_trim,
    v_ciudad_trim, NULLIF(trim(p_descripcion), ''), NULLIF(trim(p_telefono), ''),
    NULLIF(trim(p_whatsapp), ''), NULLIF(trim(p_email_contacto), ''),
    NULLIF(trim(p_sitio_web), ''), NULLIF(trim(p_direccion), ''),
    NULLIF(trim(p_sector), ''), p_lat, p_lon,
    COALESCE(p_acepta_emergencias, false),
    -- ☠️ S106 · `acepta_telemedicina` MURIÓ. La columna se dropeó: tenía
    --    CERO lectores y contradecía el camino (c). El parámetro
    --    `p_acepta_telemedicina` SOBREVIVE Y SE IGNORA a propósito:
    --    el alta del prestador se corre POR SQL A MANO y su runbook
    --    vive fuera del repo — cambiar la firma rompería un
    --    procedimiento que esta migración no puede ver. Se retira con
    --    su ficha, cuando alguien toque el wizard.
    p_radio_cobertura_km,   -- §2.1 LETRA_PERFIL_S79: murió el COALESCE(…, 5) — NULL = no declaró
    NULLIF(trim(p_matricula_profesional), ''),
    'pendiente',
    v_metadata_final
  )
  RETURNING id INTO v_nuevo_id;

  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
  VALUES (p_cuenta_comercial_id, 'prestador_servicios', 'activo')
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;

  RETURN QUERY SELECT true, v_nuevo_id, NULL::text;
END;
$function$
;

REVOKE EXECUTE ON FUNCTION public.crear_prestador_inicial(uuid, text, text, text, text, text, text, text, text, text, text, double precision, double precision, boolean, boolean, integer, text, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_prestador_inicial(uuid, text, text, text, text, text, text, text, text, text, text, double precision, double precision, boolean, boolean, integer, text, jsonb) TO authenticated;

-- ─── 2 · La vista, sin la columna ──────────────────────────────────────
-- ⚠️ DROP + CREATE, no `CREATE OR REPLACE`: **Postgres no deja QUITAR una
-- columna de una vista con REPLACE** (`42P16`). Lo descubrió esta misma
-- migración abortando — y abortó ENTERA, con la columna todavía viva y sin
-- registrarse en el ledger. *Un cinturón no hizo falta acá porque la
-- transacción es el cinturón.*
--
-- Medido ANTES de dropear, porque un DROP de vista puede cascadear:
--   · dependientes de la vista: **NINGUNO**
--   · la lee `obtener_mi_prestador` — **el wrapper más invocado de la casa**
--     (28 efectos de foco) — y **NO pide `acepta_telemedicina`**: columnas
--     nombradas, cero `SELECT *`. *Ahí estaba el riesgo real, y por eso se
--     midió en vez de suponerse.*
DROP VIEW public.v_prestadores_publicos;
CREATE VIEW public.v_prestadores_publicos WITH (security_invoker = true) AS
 SELECT id,
    user_id,
    tipo,
    nombre_comercial,
    descripcion,
    foto_url,
    ciudad,
    sector,
        CASE
            WHEN lat IS NULL OR lon IS NULL THEN NULL::double precision
            ELSE lat + (500::numeric * (0.30 + (abs(hashtext(id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision * cos(((abs(hashtext(id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi()) / 111320::double precision
        END AS zona_lat,
        CASE
            WHEN lat IS NULL OR lon IS NULL THEN NULL::double precision
            ELSE lon + (500::numeric * (0.30 + (abs(hashtext(id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision * sin(((abs(hashtext(id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi()) / (111320::double precision * GREATEST(cos(radians(lat)), 0.01::double precision))
        END AS zona_lon,
        CASE
            WHEN lat IS NULL OR lon IS NULL THEN NULL::integer
            ELSE 500
        END AS zona_radio_m,
    calificacion_promedio,
    total_resenas,
    total_citas,
    acepta_emergencias,
    radio_cobertura_km,
    country_code,
    cohorte,
    cohorte_anio,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', ps.id, 'tipo', ps.tipo_servicio, 'nombre', COALESCE(ps.nombre_custom, ps.tipo_servicio), 'precio', ps.precio, 'duracion_minutos', ps.duracion_minutos, 'categoria', ts.categoria) ORDER BY ps.tipo_servicio) AS jsonb_agg
           FROM prestador_servicios ps
             LEFT JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
          WHERE ps.prestador_id = p.id AND ps.activo = true), '[]'::jsonb) AS servicios,
    COALESCE(( SELECT jsonb_agg(pf.url ORDER BY pf.orden, pf.creado_en) AS jsonb_agg
           FROM prestador_fotos pf
          WHERE pf.prestador_id = p.id), '[]'::jsonb) AS portadas,
    clip_url
   FROM prestadores p
  WHERE estado = 'activo'::text;

-- Los GRANTS mueren con la vista: se reponen explícitos.
GRANT SELECT ON public.v_prestadores_publicos TO authenticated, anon;

-- ─── 3 · La columna muere ──────────────────────────────────────────────
ALTER TABLE public.prestadores DROP COLUMN acepta_telemedicina;

-- ─── 4 · CINTURÓN ──────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM information_schema.columns
   WHERE table_schema='public' AND table_name='prestadores' AND column_name='acepta_telemedicina';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: la columna sigue viva'; END IF;

  SELECT count(*) INTO v_n FROM information_schema.columns
   WHERE table_schema='public' AND table_name='v_prestadores_publicos' AND column_name='acepta_telemedicina';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: la vista sigue exponiendola'; END IF;

  -- La vista SIGUE SIRVIENDO lo demas (no se rompio al recrearla).
  SELECT count(*) INTO v_n FROM v_prestadores_publicos;
  RAISE NOTICE 'CINTURON: la vista publica devuelve % prestador(es) activos', v_n;
  IF v_n < 1 THEN RAISE EXCEPTION 'CINTURON: la vista quedo vacia tras recrearla'; END IF;

  -- Y el alta ya no la nombra.
  --
  -- ⚠️ LA PRIMERA VERSION DE ESTE CHECK SE DISPARO CONTRA SU PROPIA LAPIDA:
  -- buscaba la cadena en `prosrc` entero y el comentario que dice
  -- «`acepta_telemedicina` MURIO» la contiene. **Es L-170 — un censo sobre
  -- pg_get_functiondef lee los comentarios como codigo** — y la cobro el
  -- cinturon de la migracion que la estaba escribiendo.
  --
  -- La cura: se QUITAN los comentarios antes de mirar, y se busca la columna
  -- SIN el prefijo `p_` (el parametro sobrevive a proposito).
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='crear_prestador_inicial'
       AND regexp_replace(p.prosrc, '--[^\n]*', '', 'g') ~ '(^|[^_[:alnum:]])acepta_telemedicina'
  ) THEN
    RAISE EXCEPTION 'CINTURON: crear_prestador_inicial todavia siembra la columna';
  END IF;

  -- Y el control POSITIVO: el parametro `p_acepta_telemedicina` TIENE que
  -- seguir en la FIRMA — si desaparecio, la aridad cambio y eso rompe el
  -- runbook del alta, que vive fuera del repo.
  --
  -- ⚠️ SEGUNDA CORRECCION DEL MISMO INSTRUMENTO, y la lección es la misma
  -- con otra cara: la primera version de este control miraba `prosrc` — que
  -- es **el CUERPO, no la firma**. Como esta migracion acaba de sacar la
  -- unica mencion del parametro del cuerpo, el control dio rojo diciendo
  -- «se perdio el parametro» cuando el parametro estaba intacto en la
  -- firma. **El instrumento respondio sobre otro objeto** (L-235). Se mide
  -- donde el dato vive: `pg_get_function_identity_arguments`.
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='crear_prestador_inicial'
       AND 'p_acepta_telemedicina' = ANY(p.proargnames)
  ) THEN
    RAISE EXCEPTION 'CINTURON: se perdio el parametro p_acepta_telemedicina (la firma cambio)';
  END IF;

  -- La lapida esta en el cuerpo vivo, no en un comentario de la migracion.
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='crear_prestador_inicial'
                    AND p.prosrc ILIKE '%MURIÓ%') THEN
    RAISE EXCEPTION 'CINTURON: la lapida no quedo en el cuerpo vivo';
  END IF;

  RAISE NOTICE 'CINTURON OK — columna muerta, vista limpia y sirviendo, siembra cortada, lapida viva';
END
$cinturon$;

COMMIT;
