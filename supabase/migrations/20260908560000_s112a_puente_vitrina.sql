-- S112-A · EL PUENTE DEL ADOPTABLE A LA VITRINA DE SU REFUGIO + EL EDITOR
-- 76(g) — NO RIGE: vista y función, sin backfill y sin anclas.
CREATE OR REPLACE VIEW public.v_prestadores_publicos
WITH (security_invoker = true) AS
 SELECT p.id,
    p.user_id,
    p.tipo,
    p.nombre_comercial,
    p.descripcion,
    p.foto_url,
    p.ciudad,
    p.sector,
    z.zona_lat,
    z.zona_lon,
    z.zona_radio_m,
    p.calificacion_promedio,
    p.total_resenas,
    p.total_citas,
    p.acepta_emergencias,
    p.radio_cobertura_km,
    p.country_code,
    p.cohorte,
    p.cohorte_anio,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', ps.id, 'tipo', ps.tipo_servicio, 'nombre', COALESCE(ps.nombre_custom, ps.tipo_servicio), 'precio', ps.precio, 'duracion_minutos', ps.duracion_minutos, 'categoria', ts.categoria) ORDER BY ps.tipo_servicio) AS jsonb_agg
           FROM prestador_servicios ps
             LEFT JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
          WHERE ps.prestador_id = p.id AND ps.activo = true), '[]'::jsonb) AS servicios,
    COALESCE(( SELECT jsonb_agg(pf.url ORDER BY pf.orden, pf.creado_en) AS jsonb_agg
           FROM prestador_fotos pf
          WHERE pf.prestador_id = p.id), '[]'::jsonb) AS portadas,
    p.clip_url,
    /* S112-A · EL PUENTE, y va AL FINAL por una razón mecánica: `CREATE OR
       REPLACE VIEW` sólo puede AGREGAR columnas por la cola — insertarla en
       el medio renombra las siguientes y Postgres lo rebota (42P16). Medido
       al intentarlo.

       `v_adoptables_publicos` devuelve `publicador_id` = `cuentas_comerciales.id`
       y este lector se pide por `prestadores.id`: **la pantalla tenía un id y
       el lector quería el otro.** Sin esta columna, ir del animal a la vitrina
       de su refugio exigía *deducir la identidad de una casa a partir de uno
       de sus animales* — y eso se rompe justo cuando el refugio no tiene
       ninguno publicado, que es cuando su vitrina más importa (medición de C).

       ⚠️ **No abre nada nuevo**: este id ya viaja público en cada fila de
       `v_adoptables_publicos` como `publicador_id`. */
    p.cuenta_comercial_id
   FROM prestadores p
     LEFT JOIN LATERAL _zona_aproximada(p.id) z(zona_lat, zona_lon, zona_radio_m) ON true
  WHERE p.estado = 'activo'::text;
;

-- ═══════════════════════════════════════════════════════════════════════════
-- EL EDITOR DE LA VITRINA DEL REFUGIO
--
-- 🔴 **RPC y no INSERT desde la pantalla, por `L-424`.** Crear la fila choca
-- contra `uq_prestadores_user_id`, y ese índice rebota **por una razón
-- legítima**: *esta persona ya tiene un prestador* — la clínica que además
-- rescata. *Un guard que vive en un índice sólo sabe negarse*: la pantalla
-- recibiría un `23505` pelado y diría «probá de nuevo» sobre algo que va a
-- fallar siempre. Acá el rebote NOMBRA el oficio que ya tiene.
--
-- ⚠️ **Y los dos «no» son códigos DISTINTOS a propósito** (pedido de C):
-- `no_sos_refugio` lo resuelve pidiendo la verificación; `ya_tenes_prestador`
-- no lo resuelve nadie hoy. *Un solo código obligaría a la pantalla a
-- adivinar cuál de los dos caminos ofrecer.*
--
-- LISTA BLANCA DE §5.2: sólo historia, ciudad, zona y logo. **No hay
-- parámetro para teléfono, correo, dirección, cédula ni RUC** — no es que se
-- filtren: *no se pueden nombrar*, que es la única forma que no se afloja.
-- La PORTADA vive en `prestador_fotos` y tiene su propia puerta.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.poblar_vitrina_refugio(
  p_historia text DEFAULT NULL,
  p_ciudad   text DEFAULT NULL,
  p_zona     text DEFAULT NULL,
  p_logo_url text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_auth uuid := auth.uid(); v_ref jsonb; v_cc uuid; v_p record; v_creada boolean := false;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  v_ref := public.obtener_mi_cuenta_refugio();
  IF v_ref IS NULL OR v_ref->>'cuenta_comercial_id' IS NULL THEN
    RAISE EXCEPTION 'no_sos_refugio' USING ERRCODE='42501';
  END IF;
  v_cc := (v_ref->>'cuenta_comercial_id')::uuid;

  SELECT * INTO v_p FROM prestadores WHERE cuenta_comercial_id = v_cc FOR UPDATE;

  IF v_p.id IS NULL THEN
    /* 🔴 El rebote que la pantalla necesita PODER EXPLICAR: se pregunta ANTES
       de intentar, para nombrar el oficio que ya tiene en vez de traducir un
       `23505` después del hecho. */
    IF EXISTS (SELECT 1 FROM prestadores WHERE user_id = v_auth) THEN
      RAISE EXCEPTION 'ya_tenes_prestador: %',
        (SELECT tipo FROM prestadores WHERE user_id = v_auth LIMIT 1)
        USING ERRCODE='22023';
    END IF;

    INSERT INTO prestadores (user_id, cuenta_comercial_id, tipo, nombre_comercial,
                             whatsapp, estado, descripcion, ciudad, sector, foto_url)
    SELECT v_auth, v_cc, 'refugio', cc.nombre_comercial,
           /* `whatsapp` es NOT NULL en la tabla y **la vitrina no lo publica**
              (no está en las 22 columnas). Nace vacío: el CHECK admite `''`.
              *Inventarle un número sería fabricar un dato de contacto.* */
           '', 'activo', p_historia, p_ciudad, p_zona, p_logo_url
      FROM cuentas_comerciales cc WHERE cc.id = v_cc
    RETURNING * INTO v_p;
    v_creada := true;
  ELSE
    /* COALESCE: lo que no se manda **no se borra**. Un editor que pisa con
       NULL lo no enviado vacía la historia cada vez que alguien cambia la
       ciudad. */
    UPDATE prestadores
       SET descripcion = COALESCE(p_historia, descripcion),
           ciudad      = COALESCE(p_ciudad,   ciudad),
           sector      = COALESCE(p_zona,     sector),
           foto_url    = COALESCE(p_logo_url, foto_url),
           updated_at  = now()
     WHERE id = v_p.id
    RETURNING * INTO v_p;
  END IF;

  RETURN jsonb_build_object('ok', true, 'prestador_id', v_p.id, 'creada', v_creada,
    'cuenta_comercial_id', v_cc,
    /* Para que la pantalla sepa si YA hay algo que mostrar sin ir a buscarlo:
       el nombre y el logo los tiene por existir; **la vitrina es lo que el
       refugio ARMÓ**. Es el mismo criterio que B puso en la pieza. */
    'tiene_pagina', (v_p.descripcion IS NOT NULL AND btrim(v_p.descripcion) <> ''));
END $fn$;

REVOKE ALL ON FUNCTION public.poblar_vitrina_refugio(text,text,text,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.poblar_vitrina_refugio(text,text,text,text) TO authenticated;
