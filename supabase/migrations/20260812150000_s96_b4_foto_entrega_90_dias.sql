-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · A-B4 — LA FOTO DE ENTREGA: BUCKET PRIVADO, QUIÉN LA VE, Y EL BORRADO
--               A 90 DÍAS CON MECANISMO
--
-- Fuente de letra: `LETRA_RECORRIDO_DESPENSA_S96` §9.4, la letra de
-- privacidad de la foto, firmada: **es la puerta de la casa de una familia.**
--   · La ven el vendedor y el equipo de e-PetPlace. Jamás otro cliente.
--   · Vive 90 días y se borra (D-776) — *no alcanza con escribirlo: necesita
--     mecanismo.*
--   · El expediente jamás la toca.
--
-- ── QUÉ CONSTRUYE ──────────────────────────────────────────────────────────
-- ① El bucket `entregas`, PRIVADO, 5 MB, solo imágenes. Path:
--    `{envio_id}/entrega-{ts}.jpg` — la primera carpeta es el envío.
-- ② Las policies que son la letra: SUBE el repartidor asignado (o el
--    vendedor, que responde cuando su repartidor no tiene cuenta); VEN el
--    vendedor del envío y el equipo (is_admin) — y el asignado que la acaba
--    de subir, declarado: sacar la foto y no poder confirmarla es una
--    pantalla rota. **La familia NO está en la lista — es la letra literal
--    de §9.4 — y "otro cliente" no tiene ningún brazo.** El expediente jamás
--    la toca: `evento_producto_asignacion` no tiene columna de foto, y el
--    juez lo vigila.
-- ③ El borrado a 90 días HEREDA la maquinaria de D-731 (la cola
--    `storage_borrado_pendiente` + `barrer-storage` + su cron cada 5'):
--    `encolar_fotos_entrega_vencidas()` corre a diario, encola lo vencido y
--    deja el envío diciendo que su foto ya no existe — el path se vacía y
--    `foto_entrega_borrada_en` queda como acta (P23: el borrado se declara,
--    jamás se finge que nunca hubo foto).
--
-- D-776 muere cuando esto esté MEDIDO corriendo solo — el cron queda
-- programado y el cinturón prueba el encolado; la medición del primer barrido
-- real es del cierre de sesión.
--
-- Reversa: scripts/s96/2026-08-12-s96-m4-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- La veda rige SOLO en el cinturón (crea y borra un envío sintético por id,
-- residuo 0). El DDL es aditivo puro.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① EL BUCKET
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('entregas', 'entregas', false, 5 * 1024 * 1024,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ═══════════════════════════════════════════════════════════════════════════
-- ② LAS POLICIES — la letra de §9.4 en el servidor
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "Foto entrega sube el asignado" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'entregas'
    AND EXISTS (
      SELECT 1 FROM public.envios e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND (
          EXISTS (SELECT 1 FROM public.repartidores r
                  WHERE r.id = e.repartidor_id AND r.user_id = auth.uid() AND r.activo)
          OR public.es_vendedor_de(e.cuenta_comercial_id)
          OR public.is_admin()
        )
    )
  );

CREATE POLICY "Foto entrega ve el vendedor" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'entregas'
    AND EXISTS (
      SELECT 1 FROM public.envios e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND (
          public.es_vendedor_de(e.cuenta_comercial_id)
          OR public.is_admin()
          -- El asignado ve lo que acaba de subir (confirmación de subida).
          -- La FAMILIA no tiene brazo: §9.4 lista vendedor y equipo, y punto.
          OR EXISTS (SELECT 1 FROM public.repartidores r
                     WHERE r.id = e.repartidor_id AND r.user_id = auth.uid() AND r.activo)
        )
    )
  );

-- Borrar es del equipo (y del barredor, que entra por la Storage API con la
-- service key — no pasa por esta policy).
CREATE POLICY "Foto entrega borra el admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'entregas' AND public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ EL BORRADO A 90 DÍAS — mecanismo, no promesa
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.envios ADD COLUMN foto_entrega_borrada_en timestamptz;

CREATE FUNCTION public.encolar_fotos_entrega_vencidas()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_e record; v_n int := 0;
BEGIN
  FOR v_e IN
    SELECT id, foto_entrega_path FROM envios
    WHERE foto_entrega_path IS NOT NULL
      AND entregado_en IS NOT NULL
      AND entregado_en < now() - interval '90 days'
  LOOP
    -- La cola es la de D-731: el barredor (cron cada 5') hace el DELETE real
    -- contra Storage. El índice único de fila viva vuelve esto idempotente.
    INSERT INTO storage_borrado_pendiente (bucket, objeto, origen)
      VALUES ('entregas', v_e.foto_entrega_path, 'foto_entrega_90d')
      ON CONFLICT (bucket, objeto) WHERE estado = 'pendiente' DO NOTHING;

    -- El envío dice la verdad: la foto ya no es alcanzable, y QUEDA ESCRITO
    -- cuándo se purgó (P23 — se declara, no se finge que nunca existió).
    UPDATE envios SET foto_entrega_path = NULL,
                      foto_entrega_borrada_en = now(),
                      updated_at = now()
     WHERE id = v_e.id;
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'encoladas', v_n);
END $$;
REVOKE ALL ON FUNCTION public.encolar_fotos_entrega_vencidas() FROM PUBLIC, anon, authenticated;

-- A diario, antes del amanecer de Quito. El barredor de D-731 hace el resto.
SELECT cron.schedule('purgar-fotos-entrega', '30 8 * * *',
  $$SELECT public.encolar_fotos_entrega_vencidas()$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_env uuid; v_ped uuid; v_user uuid;
  v_env_antes int; v_cola_antes int; v_n int; v_res jsonb;
BEGIN
  SELECT count(*) INTO v_env_antes FROM envios;
  SELECT count(*) INTO v_cola_antes FROM storage_borrado_pendiente;

  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_user
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;

  -- Un pedido y un envío sintéticos con entrega VENCIDA (91 días).
  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, clave_idempotencia,
                       numero_orden, metodo_entrega, entrega_direccion)
    VALUES (v_user, v_cc, 0,0,0,0,0, '__cint_s96m4', 'P-CINT-M4', 'despacho', 'x')
    RETURNING id INTO v_ped;
  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES (v_ped, 'creado', v_user, 'cliente');
  INSERT INTO envios (pedido_id, cuenta_comercial_id, country_code, transportista,
                      metodo, estado, destino_direccion, intentos_entrega,
                      costo_envio, moneda, pagado_por,
                      foto_entrega_path, entregado_en)
    VALUES (v_ped, v_cc, 'EC', 'propio', 'despacho', 'entregado', 'x', 1, 0, 'USD',
            'seller', v_ped || '/entrega-cint.jpg', now() - interval '91 days')
    RETURNING id INTO v_env;

  -- El encolador: encola, vacía el path y estampa la purga.
  v_res := encolar_fotos_entrega_vencidas();
  IF (v_res->>'encoladas')::int < 1 THEN
    RAISE EXCEPTION 'ABORTA: la foto vencida no se encoló.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage_borrado_pendiente
                 WHERE bucket='entregas' AND origen='foto_entrega_90d'
                   AND objeto = v_ped || '/entrega-cint.jpg') THEN
    RAISE EXCEPTION 'ABORTA: la cola no tiene la foto.';
  END IF;
  IF (SELECT foto_entrega_path FROM envios WHERE id = v_env) IS NOT NULL
     OR (SELECT foto_entrega_borrada_en FROM envios WHERE id = v_env) IS NULL THEN
    RAISE EXCEPTION 'ABORTA: el envío no declaró la purga.';
  END IF;

  -- Idempotente: la segunda corrida no encola nada nuevo.
  v_res := encolar_fotos_entrega_vencidas();
  IF (v_res->>'encoladas')::int <> 0 THEN
    RAISE EXCEPTION 'ABORTA: el encolador re-encoló lo ya purgado (%).', v_res->>'encoladas';
  END IF;

  -- El bucket quedó privado y con techo.
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id='entregas'
             AND (public OR file_size_limit IS NULL OR allowed_mime_types IS NULL)) THEN
    RAISE EXCEPTION 'ABORTA: el bucket entregas quedó público o sin límites.';
  END IF;
  -- Y el cron quedó programado.
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='purgar-fotos-entrega') THEN
    RAISE EXCEPTION 'ABORTA: el cron de la purga no quedó programado.';
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  DELETE FROM storage_borrado_pendiente WHERE objeto = v_ped || '/entrega-cint.jpg';
  DELETE FROM envios WHERE id = v_env;
  DELETE FROM pedido_estados WHERE pedido_id = v_ped;
  DELETE FROM pedidos WHERE id = v_ped;

  SELECT count(*) INTO v_n FROM envios;
  IF v_n <> v_env_antes THEN RAISE EXCEPTION 'ABORTA 76(g): envios % vs %', v_n, v_env_antes; END IF;
  SELECT count(*) INTO v_n FROM storage_borrado_pendiente;
  IF v_n <> v_cola_antes THEN RAISE EXCEPTION 'ABORTA 76(g): cola % vs %', v_n, v_cola_antes; END IF;

  RAISE NOTICE 'CINTURÓN S96-M4: el bucket nació privado con techo, la foto vencida se encola una sola vez, el envío declara su purga, y el cron quedó programado. Residuo 0.';
END $$;

COMMIT;
