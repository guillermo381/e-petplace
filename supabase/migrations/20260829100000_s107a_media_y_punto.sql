-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — ⑤a · LA MEDIA DEL DURANTE Y EL PUNTO VIVO
--
-- Contrato: `docs/contratos/s107-contrato-media-durante.md` (publicado antes
-- de existir el motor, regla S106). **D lleva cinco tandas inerte esperando
-- esto, con cuatro puntos en null.**
--
-- ── ① UNA MEDIA = UN ARCHIVO; LAS ETIQUETAS SON MUCHAS ────────────────────
-- 🔴 **El binario JAMÁS se duplica por animal.** Una foto con cuatro perros es
-- **un archivo y cuatro etiquetas** — y cada animal etiquetado recibe **su**
-- evento de expediente **apuntando a la misma media**.
--
-- Medido por D y confirmado: **hoy la casa NO tiene esta forma y no puede
-- tenerla** — `evento_archivo_adjunto.mascota_id` y
-- `evento_adiestramiento_clips.mascota_id` son **singulares**. Es construcción
-- nueva, y `D-958` declara que el paseo migra acá cuando esto exista.
--
-- ── ② IDEMPOTENCIA EN EL TIPO, no en una nota (pedido de D, adoptado) ──────
-- La cola de D **reintenta por diseño**. Un **timeout ambiguo** —la subida
-- llegó, la respuesta no— registraría **la misma foto dos veces**, y eso no
-- aparece como un fallo: aparece como **eventos duplicados en el expediente de
-- un animal**, meses después, sin nada que los explique.
-- ⇒ `clave_idempotencia` **obligatoria**, `UNIQUE (prestador_id, clave)`, y el
-- segundo intento **es un ÉXITO que devuelve la media que ya existe**
-- (`ya_existia: true`). *Un rebote obligaría a la cola a distinguir «falló» de
-- «ya estaba» — que es justo lo que no puede hacer con un timeout ambiguo.*
--
-- ── ③ EL TOPE DE 30 s LO VERIFICA EL SERVIDOR ─────────────────────────────
-- Un archivo de 31 s **no entra**. La tolerancia de contenedor (**+0,9 s**) va
-- **en el CHECK, declarada** — no en un comentario: es la diferencia entre una
-- ley que frena y una promesa de diseño.
--
-- ── ④ EL PUNTO VIVO: UNA FILA POR TRAMO, `UPDATE` JAMÁS `INSERT` ──────────
-- 🔴 **Con `INSERT` la traza vuelve por la puerta de atrás** — y no es una
-- traza cualquiera: **las paradas de una recogida son las CASAS de las otras
-- familias.** Un histórico de puntos con timestamps es un mapa de dónde vive
-- cada cliente del prestador. **`tramo_id` es la PK: guardar sólo el último
-- punto vuelve INEXPRESABLE el dato que no queremos tener** (L-222).
--
-- ── EL BUCKET ─────────────────────────────────────────────────────────────
-- Nace `guarderia-media` (privado) en vez de reusar `cita-archivos` o
-- `adiestramiento-clips`: el primero **no admite video** (sin mimes y 10 MB) y
-- el segundo **lleva el nombre de otro oficio** — *un bucket cuyo nombre miente
-- es una trampa para el que audite dentro de un año.* Policies calcadas del
-- molde de clips: el primer segmento del path **es el prestador**.
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260829100000-media-y-punto.sql
-- 76(g): 🔴 RIGE — el cinturón publica media real y la deshace en
--        subtransacción. Residuo medido contra LÍNEA BASE.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

/* ⚠️ Las seis columnas obligatorias del catálogo se llenan TODAS y a
   propósito: `puede_ser_raiz = true` (una foto del día es un evento por
   derecho propio) y `puede_ser_subevento = false` (no cuelga de otro).
   *Medidas del objeto, no adivinadas: el INSERT rebotó dos veces y cada rebote
   nombró la columna que faltaba.* */
INSERT INTO public.cat_tipos_evento (codigo, nombre, descripcion, eje_jtbd,
                                     puede_ser_raiz, puede_ser_subevento, tabla_tipada, activo)
VALUES ('foto_guarderia', 'Foto de la guardería',
        'Una foto o un clip del día en la guardería. El binario es UNO y puede estar etiquetado con varios animales; este evento es el de ESTE animal, apuntando a esa misma media.',
        'cuidado_externo', true, false, NULL, true)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('guarderia-media', 'guarderia-media', false, 52428800,
        ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY guarderia_media_storage_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'guarderia-media'
              AND user_puede_acceder_prestador((split_part(name, '/', 1))::uuid));
CREATE POLICY guarderia_media_storage_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'guarderia-media'
         AND user_puede_acceder_prestador((split_part(name, '/', 1))::uuid));
CREATE POLICY guarderia_media_storage_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'guarderia-media'
         AND user_puede_acceder_prestador((split_part(name, '/', 1))::uuid));

-- ═══ LA MEDIA ══════════════════════════════════════════════════════════════
CREATE TABLE public.guarderia_media (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id       uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  fecha              date NOT NULL,                    -- el día local del lugar
  tipo               text NOT NULL CHECK (tipo IN ('foto','clip')),
  archivo_url        text NOT NULL,
  miniatura_url      text,                             -- dato del esquema, no promesa
  duracion_s         numeric,
  capturada_en       timestamptz NOT NULL,
  autor_user_id      uuid NOT NULL,
  clave_idempotencia text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  /* 🔴 El tope vive en la puerta del servidor, con su tolerancia DECLARADA:
     +0,9 s de contenedor. Un archivo de 31 s no entra. */
  CONSTRAINT chk_media_duracion CHECK (
    (tipo = 'foto' AND duracion_s IS NULL)
    OR (tipo = 'clip' AND duracion_s > 0 AND duracion_s <= 30.9)),
  CONSTRAINT uq_media_idempotencia UNIQUE (prestador_id, clave_idempotencia)
);
ALTER TABLE public.guarderia_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY guarderia_media_prestador ON public.guarderia_media FOR SELECT TO authenticated
  USING (public.user_gestiona_prestador(prestador_id) OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_media FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_media FROM anon;

CREATE TABLE public.guarderia_media_etiquetas (
  media_id   uuid NOT NULL REFERENCES public.guarderia_media(id) ON DELETE CASCADE,
  mascota_id uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
  estadia_id uuid NOT NULL REFERENCES public.guarderia_estadias(id) ON DELETE CASCADE,
  evento_id  uuid REFERENCES public.eventos_mascota(id) ON DELETE SET NULL,
  PRIMARY KEY (media_id, mascota_id)
);
CREATE INDEX idx_media_etiquetas_mascota ON public.guarderia_media_etiquetas (mascota_id);
ALTER TABLE public.guarderia_media_etiquetas ENABLE ROW LEVEL SECURITY;
/* 🔴 El dueño lee la media etiquetada con SU animal — y **los nombres de los
   otros animales de la foto NO VIAJAN**: eso se resuelve en el SELECT del
   lector, jamás filtrando en la pantalla. Lo que no viaja no se filtra mal. */
CREATE POLICY guarderia_etiquetas_select ON public.guarderia_media_etiquetas FOR SELECT TO authenticated
  USING (public.user_tiene_acceso_a_mascota(mascota_id)
         OR EXISTS (SELECT 1 FROM guarderia_media m
                     WHERE m.id = media_id AND public.user_gestiona_prestador(m.prestador_id))
         OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_media_etiquetas FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_media_etiquetas FROM anon;

-- ═══ EL PUNTO VIVO ═════════════════════════════════════════════════════════
CREATE TABLE public.guarderia_tramo_punto (
  -- 🔴 LA PK ES EL TRAMO: una fila, y sólo una. Ver el encabezado ④.
  tramo_id uuid PRIMARY KEY,
  lat      double precision NOT NULL,
  lon      double precision NOT NULL,
  visto_en timestamptz NOT NULL
);
ALTER TABLE public.guarderia_tramo_punto ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, SELECT ON public.guarderia_tramo_punto FROM anon, authenticated;

COMMENT ON TABLE public.guarderia_tramo_punto IS
  'S107 · UNA fila por tramo, UPDATE jamás INSERT. 🔴 Con INSERT la traza '
  'vuelve por la puerta de atrás — y las paradas de una recogida son las CASAS '
  'de las otras familias. Guardar sólo el último punto vuelve inexpresable el '
  'dato que no queremos tener.';


-- ═══ LAS PUERTAS ═══════════════════════════════════════════════════════════

CREATE FUNCTION public.publicar_media_guarderia(
  p_prestador_id       uuid,
  p_clave_idempotencia text,
  p_tipo               text,
  p_archivo_url        text,
  p_duracion_s         numeric,
  p_mascota_ids        uuid[],
  p_capturada_en       timestamptz
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_media uuid; v_fecha date; v_m uuid; v_estadia uuid; v_evento uuid; v_n int := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_clave_idempotencia IS NULL OR length(btrim(p_clave_idempotencia)) = 0 THEN
    RAISE EXCEPTION 'clave_idempotencia_requerida' USING ERRCODE = '22023';
  END IF;

  /* 🔴 EL SEGUNDO INTENTO ES UN ÉXITO, NO UN REBOTE. La cola reintenta por
     diseño; obligarla a distinguir «falló» de «ya estaba» ante un timeout
     ambiguo es pedirle lo único que no puede saber. */
  SELECT id INTO v_media FROM guarderia_media
   WHERE prestador_id = p_prestador_id AND clave_idempotencia = p_clave_idempotencia;
  IF v_media IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'media_id', v_media, 'ya_existia', true);
  END IF;

  /* 🔴 MÍNIMO UNA ETIQUETA: una media sin etiquetas es una foto que no llega a
     nadie. (Etiquetar de más rompe más que de menos — pero de cero no llega.) */
  IF p_mascota_ids IS NULL OR array_length(p_mascota_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'media_sin_etiquetas' USING ERRCODE = '22023';
  END IF;

  v_fecha := (p_capturada_en AT TIME ZONE 'America/Guayaquil')::date;

  INSERT INTO guarderia_media (prestador_id, fecha, tipo, archivo_url, duracion_s,
                               capturada_en, autor_user_id, clave_idempotencia)
       VALUES (p_prestador_id, v_fecha, p_tipo, p_archivo_url, p_duracion_s,
               p_capturada_en, v_user, p_clave_idempotencia)
    RETURNING id INTO v_media;

  FOREACH v_m IN ARRAY p_mascota_ids LOOP
    /* La etiqueta ancla a la estadía-día de ESE animal: sin estadía, ese animal
       no estaba — y etiquetarlo sería afirmar algo que el motor no sostiene. */
    SELECT g.id INTO v_estadia
      FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
     WHERE c.prestador_id = p_prestador_id AND c.mascota_id = v_m AND c.fecha = v_fecha
       AND g.estado <> 'cancelada'
     LIMIT 1;
    IF v_estadia IS NULL THEN
      RAISE EXCEPTION 'mascota_sin_estadia_ese_dia' USING ERRCODE = '22023';
    END IF;

    -- 🔴 UN EVENTO POR ANIMAL, APUNTANDO A LA MISMA MEDIA. Cero copias.
    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
                                 creado_por_user_id, datos, country_code)
         VALUES (v_m, 'foto_guarderia', 'cuidado_externo', p_capturada_en, p_prestador_id,
                 v_user, jsonb_build_object('media_id', v_media, 'tipo', p_tipo), 'EC')
      RETURNING id INTO v_evento;

    INSERT INTO guarderia_media_etiquetas (media_id, mascota_id, estadia_id, evento_id)
         VALUES (v_media, v_m, v_estadia, v_evento);
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'media_id', v_media, 'ya_existia', false, 'etiquetas', v_n);
END $$;

CREATE FUNCTION public.obtener_media_del_dia(p_prestador_id uuid, p_fecha date)
RETURNS TABLE(media_id uuid, tipo text, archivo_url text, duracion_s numeric,
              capturada_en timestamptz, mascota_ids uuid[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT m.id, m.tipo, m.archivo_url, m.duracion_s, m.capturada_en,
         array_agg(e.mascota_id ORDER BY e.mascota_id)
    FROM guarderia_media m
    JOIN guarderia_media_etiquetas e ON e.media_id = m.id
   WHERE m.prestador_id = p_prestador_id AND m.fecha = p_fecha
   GROUP BY m.id ORDER BY m.capturada_en DESC;
END $$;

/* 🔴 LA LECTURA DEL DUEÑO: **los otros animales de la foto NO VIAJAN.** Ni el
   id, ni el nombre, ni el conteo. Se resuelve acá, en el SELECT — jamás
   filtrando en la pantalla: lo que no viaja no se filtra mal. */
CREATE FUNCTION public.obtener_media_de_mi_mascota(p_mascota_id uuid, p_fecha date DEFAULT NULL)
RETURNS TABLE(media_id uuid, tipo text, archivo_url text, duracion_s numeric,
              capturada_en timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT m.id, m.tipo, m.archivo_url, m.duracion_s, m.capturada_en
    FROM guarderia_media m
    JOIN guarderia_media_etiquetas e ON e.media_id = m.id AND e.mascota_id = p_mascota_id
   WHERE (p_fecha IS NULL OR m.fecha = p_fecha)
   ORDER BY m.capturada_en DESC;
END $$;

-- ═══ EL PUNTO VIVO ═════════════════════════════════════════════════════════
CREATE FUNCTION public.registrar_punto_vivo(
  p_tramo_id uuid, p_lat double precision, p_lon double precision,
  p_visto_en timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  /* UPSERT por `tramo_id`: es un UPDATE con cara de INSERT la primera vez.
     **Nunca acumula.** */
  INSERT INTO guarderia_tramo_punto (tramo_id, lat, lon, visto_en)
       VALUES (p_tramo_id, p_lat, p_lon, p_visto_en)
  ON CONFLICT (tramo_id) DO UPDATE
     SET lat = EXCLUDED.lat, lon = EXCLUDED.lon, visto_en = EXCLUDED.visto_en;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE FUNCTION public.obtener_punto_vivo(p_tramo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  SELECT jsonb_build_object('lat', p.lat, 'lon', p.lon, 'vistoEn', p.visto_en)
    INTO v FROM guarderia_tramo_punto p WHERE p.tramo_id = p_tramo_id;
  -- Un punto o null. **Jamás una lista.**
  RETURN COALESCE(v, 'null'::jsonb);
END $$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.publicar_media_guarderia(uuid, text, text, text, numeric, uuid[], timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_media_del_dia(uuid, date)             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_media_de_mi_mascota(uuid, date)       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_punto_vivo(uuid, double precision, double precision, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_punto_vivo(uuid)                      FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.publicar_media_guarderia(uuid, text, text, text, numeric, uuid[], timestamptz) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_media_del_dia(uuid, date)             TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_media_de_mi_mascota(uuid, date)       TO authenticated;
GRANT  EXECUTE ON FUNCTION public.registrar_punto_vivo(uuid, double precision, double precision, timestamptz) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_punto_vivo(uuid)                      TO authenticated;

COMMIT;
