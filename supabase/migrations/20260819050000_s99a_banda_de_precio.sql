-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · LA BANDA DE PRECIO — el vendedor mueve su precio, con techo
--
-- DECISIÓN DE MESA (delegada por el founder: *«lo que vos consideres que es
-- lo mejor para el sistema, apliquémoslo»*), REVERSIBLE por su palabra:
-- **e-PetPlace fija un precio de REFERENCIA por variante; el vendedor se
-- mueve LIBRE dentro de ±15 % sin pedir permiso; fuera de la banda, propone
-- y e-PetPlace aprueba.**
--
-- POR QUÉ NO ES LA OPCIÓN (a) PURA: la firma ⑩ de S95 protege **la
-- CURADURÍA** —qué productos entran a la vitrina— no el precio de lo que ya
-- fue curado. **Pero un precio sin ningún límite deja de proteger que la
-- familia no pague de más, y eso TAMBIÉN es curaduría.**
--
-- Y EL ARGUMENTO DE NEGOCIO QUE LA FUNDA: **un vendedor que no puede bajar el
-- precio de su propia mercadería no puede liquidar lo que se le está por
-- vencer** — con 84 SKU sembrados con 2-3 unidades el caso ya es real. *El
-- vendedor sabe cosas que la curaduría no: que le quedan tres bolsas
-- venciendo, que el de la otra cuadra bajó.*
--
-- ESCALA SOLA: el 95 % de los movimientos son chicos y no llegan al founder.
-- **Lo que llega es LO RARO** —muy por encima o muy por debajo—, que es
-- exactamente lo que vale la pena mirar: un error de tipeo o un producto
-- vencido.
--
-- 🔴 LAS DOS FIRMAS QUE ORDENAN EL RESTO:
--   ① **La referencia NACE NULL y la carga el equipo, producto por
--      producto.** *Sembrarla del precio actual sería CIRCULAR: la banda
--      quedaría centrada en el número que ESE vendedor eligió, no en un
--      criterio de e-PetPlace — y la banda existe justamente para que haya un
--      criterio nuestro.*
--   ② **Mientras sea NULL: FAIL-CLOSED — todo cambio va a aprobación.**
--      *Dejarlo pasar libre convierte «todavía no calibramos» en «no hay
--      límite», que es la lectura OPUESTA.* Y la superficie **DICE** que la
--      referencia no está cargada — *es la trampa exacta de `AvisoAlergia`:
--      el silencio se lee como permiso.*
--
-- ⚠️ EL 15 % ES PARÁMETRO, JAMÁS CONSTANTE EN CÓDIGO (misma disciplina que la
-- comisión): vive en `app_config.precio_banda_pct`. **Su condición de muerte
-- está escrita en la decisión: es un número de mesa SIN DATO DETRÁS —hoy no
-- hay dispersión medible porque hasta ahora había un vendedor por producto—
-- y se re-calibra cuando existan datos reales. Disparo: más de una aprobación
-- por semana ⇒ la banda es angosta; ninguna en un mes ⇒ es ancha.**
--
-- 76(g): NO RIGE (columna nueva NULL, tabla nueva vacía; cero backfill —
-- **por firma**, no por comodidad).
-- REVERSA al pie.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① EL PRECIO DE REFERENCIA — en la VARIANTE, no en el producto ──────────
-- Medido: 470 productos · 538 variantes · **59 productos con MÁS DE UNA**
-- (hasta 4). Un número en el producto tendría que servir a la vez a una bolsa
-- de 15 kg y a una de 3 kg de lo mismo.
ALTER TABLE public.producto_variantes
  ADD COLUMN IF NOT EXISTS precio_referencia numeric
    CHECK (precio_referencia IS NULL OR precio_referencia > 0);

COMMENT ON COLUMN public.producto_variantes.precio_referencia IS
  'Precio de referencia de e-PetPlace para esta presentación. NULL = todavía '
  'no lo cargó el equipo ⇒ FAIL-CLOSED: todo cambio de precio va a aprobación. '
  'NO se siembra del precio de una oferta: eso centraría la banda en el número '
  'que eligió un vendedor, que es lo contrario de un criterio nuestro.';

INSERT INTO public.app_config (clave, valor)
VALUES ('precio_banda_pct', '15')
ON CONFLICT (clave) DO NOTHING;

-- ── ② EL REGISTRO — el precio no puede ser menos trazable que una bolsa ────
-- Misma doctrina que el ledger de stock: el stock entra con motivo, y el
-- precio es lo que una familia VIO cuando compró. *El día que alguien reclame
-- hay que poder decir qué decía la vitrina.*
CREATE TABLE IF NOT EXISTS public.oferta_precio_historial (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id       uuid NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
  precio_anterior numeric NOT NULL,
  precio_nuevo    numeric NOT NULL,
  referencia      numeric,          -- la que regía al momento (NULL = no había)
  dentro_de_banda boolean NOT NULL,
  cambiado_por    uuid,
  creado_en       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oferta_precio_historial_oferta
  ON public.oferta_precio_historial(oferta_id, creado_en DESC);
ALTER TABLE public.oferta_precio_historial ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.oferta_precio_historial FROM PUBLIC, anon;
-- El vendedor lee la historia de SUS ofertas; escribir es solo por la puerta.
GRANT SELECT ON public.oferta_precio_historial TO authenticated;
DROP POLICY IF EXISTS oferta_precio_historial_select_vendedor ON public.oferta_precio_historial;
CREATE POLICY oferta_precio_historial_select_vendedor
  ON public.oferta_precio_historial FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ofertas o
                  WHERE o.id = oferta_id
                    AND (public.es_vendedor_de(o.cuenta_comercial_id) OR public.is_admin())));

-- ── ③ LA PUERTA DEL VENDEDOR ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.actualizar_precio_oferta(
  p_oferta_id uuid,
  p_precio numeric
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_of   record;
  v_ref  numeric;
  v_pct  numeric;
  v_min  numeric;
  v_max  numeric;
BEGIN
  SELECT o.id, o.cuenta_comercial_id, o.precio, o.sku_id, o.variante_id, o.estado
    INTO v_of FROM ofertas o WHERE o.id = p_oferta_id FOR UPDATE;
  IF v_of.id IS NULL THEN
    RAISE EXCEPTION 'oferta_no_existe' USING ERRCODE = '22023';
  END IF;
  IF NOT es_vendedor_de(v_of.cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  -- Solo sobre lo YA CURADO: publicar sigue siendo de e-PetPlace (firma ⑩).
  IF v_of.estado <> 'publicada' THEN
    RAISE EXCEPTION 'oferta_no_publicada: el precio se mueve sobre lo que ya está en la vitrina'
      USING ERRCODE = '22023';
  END IF;
  IF p_precio IS NULL OR p_precio <= 0 THEN
    RAISE EXCEPTION 'precio_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT pv.precio_referencia INTO v_ref
    FROM producto_variantes pv WHERE pv.id = v_of.variante_id;
  SELECT COALESCE((SELECT valor::numeric FROM app_config WHERE clave='precio_banda_pct'), 15)
    INTO v_pct;

  -- ① SIN REFERENCIA ⇒ FAIL-CLOSED. La propuesta se GUARDA (el trabajo del
  --    vendedor no se pierde) y se le dice por qué no se aplicó.
  IF v_ref IS NULL THEN
    UPDATE vendedor_skus SET precio_propuesto = p_precio, updated_at = now()
     WHERE id = v_of.sku_id;
    RAISE EXCEPTION 'sin_referencia_de_precio: e-PetPlace todavía no cargó el precio de referencia de esta presentación, así que el cambio va a aprobación. Tu propuesta de %s quedó guardada.', p_precio
      USING ERRCODE = '22023';
  END IF;

  v_min := round(v_ref * (1 - v_pct/100), 2);
  v_max := round(v_ref * (1 + v_pct/100), 2);

  -- ② FUERA DE BANDA ⇒ propuesta + rebote QUE DICE LA BANDA. *Un rechazo que
  --    no dice la banda obliga a adivinar por tanteo.*
  IF p_precio < v_min OR p_precio > v_max THEN
    UPDATE vendedor_skus SET precio_propuesto = p_precio, updated_at = now()
     WHERE id = v_of.sku_id;
    RAISE EXCEPTION 'fuera_de_banda: la referencia es %s y podés moverte entre %s y %s. Tu propuesta de %s quedó guardada para aprobación.',
      v_ref, v_min, v_max, p_precio USING ERRCODE = '22023';
  END IF;

  -- ③ DENTRO DE BANDA ⇒ se aplica, Y QUEDA REGISTRADO.
  INSERT INTO oferta_precio_historial
    (oferta_id, precio_anterior, precio_nuevo, referencia, dentro_de_banda, cambiado_por)
  VALUES (p_oferta_id, v_of.precio, p_precio, v_ref, true, auth.uid());

  UPDATE ofertas SET precio = p_precio, updated_at = now() WHERE id = p_oferta_id;
  UPDATE vendedor_skus SET precio_propuesto = p_precio, updated_at = now()
   WHERE id = v_of.sku_id;

  RETURN jsonb_build_object('ok', true, 'precio', p_precio,
                            'referencia', v_ref, 'banda_min', v_min, 'banda_max', v_max);
END $$;

REVOKE EXECUTE ON FUNCTION public.actualizar_precio_oferta(uuid, numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.actualizar_precio_oferta(uuid, numeric) TO authenticated;

-- ── ④ LA VISTA DEL VENDEDOR DICE LA BANDA Y LO PENDIENTE ───────────────────
-- *La superficie tiene que poder mostrar la banda ANTES de que el vendedor
-- tipee — ahí el rechazo deja de existir— y decir que la referencia no está
-- cargada, porque el silencio se lee como permiso.*
DROP VIEW IF EXISTS public.v_skus_vendedor;
CREATE VIEW public.v_skus_vendedor
WITH (security_invoker = true) AS
SELECT
  vs.id, vs.cuenta_comercial_id, vs.sku_vendedor, vs.variante_id,
  vs.stock_disponible, vs.stock_reservado, vs.estado, vs.motivo_rechazo,
  vs.precio_propuesto, vs.created_at,
  pv.presentacion,
  pv.precio_referencia,
  round(pv.precio_referencia * (1 - COALESCE((SELECT valor::numeric FROM app_config WHERE clave='precio_banda_pct'), 15)/100), 2) AS banda_min,
  round(pv.precio_referencia * (1 + COALESCE((SELECT valor::numeric FROM app_config WHERE clave='precio_banda_pct'), 15)/100), 2) AS banda_max,
  p.id AS producto_id, p.nombre AS producto_nombre, p.marca AS producto_marca,
  p.composicion_estado, p.momentos_aplicables, p.especies_aplicables,
  p.imagen_url, p.imagenes,
  o.id AS oferta_id, o.precio AS oferta_precio, o.estado AS oferta_estado, o.hay_stock,
  (
    CASE
      WHEN vs.estado = 'rechazado'                     THEN ARRAY['sku_rechazado']
      WHEN vs.estado IN ('propuesto', 'en_revision')   THEN ARRAY['sku_en_revision']
      WHEN o.id IS NULL                                THEN ARRAY['sin_precio_propuesto']
      WHEN o.estado <> 'publicada'                     THEN ARRAY['oferta_no_publicada']
      ELSE ARRAY[]::text[]
    END
    || CASE WHEN vs.stock_disponible <= 0 THEN ARRAY['sin_stock'] ELSE ARRAY[]::text[] END
    || CASE WHEN p.composicion_estado IS NULL OR p.composicion_estado = 'ausente'
            THEN ARRAY['composicion_ausente'] ELSE ARRAY[]::text[] END
    || CASE WHEN p.momentos_aplicables IS NULL OR cardinality(p.momentos_aplicables) = 0
            THEN ARRAY['sin_momento_etario'] ELSE ARRAY[]::text[] END
    || CASE WHEN p.imagen_url IS NULL
                 AND (p.imagenes IS NULL OR jsonb_array_length(
                        CASE WHEN jsonb_typeof(p.imagenes) = 'array' THEN p.imagenes ELSE '[]'::jsonb END) = 0)
            THEN ARRAY['sin_foto'] ELSE ARRAY[]::text[] END
  ) AS razones
FROM public.vendedor_skus vs
JOIN public.producto_variantes pv ON pv.id = vs.variante_id
JOIN public.productos p           ON p.id = pv.producto_id
LEFT JOIN public.ofertas o        ON o.sku_id = vs.id AND o.estado = 'publicada'
WHERE vs.activo;

REVOKE ALL ON public.v_skus_vendedor FROM PUBLIC, anon;
GRANT SELECT ON public.v_skus_vendedor TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — el brazo ① es el fail-closed, que es la firma entera.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_of uuid; v_var uuid; v_precio numeric; v_uid uuid;
  v_cod text; v_r jsonb; v_n int;
BEGIN
  SELECT o.id, o.variante_id, o.precio, cc.owner_profile_id
    INTO v_of, v_var, v_precio, v_uid
  FROM ofertas o JOIN cuentas_comerciales cc ON cc.id = o.cuenta_comercial_id
  WHERE o.estado='publicada' LIMIT 1;
  IF v_of IS NULL THEN RAISE EXCEPTION 'CINTURÓN: no hay oferta publicada'; END IF;

  PERFORM set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', v_uid), true);
  SET LOCAL ROLE authenticated;

  -- ① SIN REFERENCIA (que es el estado de HOY en las 538): REBOTA, y no
  --    calladamente: con un código que la pantalla puede decir.
  BEGIN
    v_r := public.actualizar_precio_oferta(v_of, v_precio);
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ①: aplicó un cambio SIN referencia — el fail-closed no rige';
  EXCEPTION WHEN OTHERS THEN
    v_cod := split_part(SQLERRM, ':', 1);
    IF v_cod <> 'sin_referencia_de_precio' THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      RAISE EXCEPTION 'CINTURÓN ①: rebotó por otra razón — «%»', SQLERRM;
    END IF;
  END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  -- ② CON REFERENCIA: dentro de banda APLICA y deja rastro; fuera REBOTA.
  UPDATE producto_variantes SET precio_referencia = v_precio WHERE id = v_var;
  PERFORM set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', v_uid), true);
  SET LOCAL ROLE authenticated;

  v_r := public.actualizar_precio_oferta(v_of, round(v_precio * 1.10, 2));
  IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ②: +10 %% (dentro de banda) NO se aplicó — %', v_r;
  END IF;

  BEGIN
    v_r := public.actualizar_precio_oferta(v_of, round(v_precio * 1.50, 2));
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ③: +50 %% pasó la banda';
  EXCEPTION WHEN OTHERS THEN
    v_cod := split_part(SQLERRM, ':', 1);
    IF v_cod <> 'fuera_de_banda' THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      RAISE EXCEPTION 'CINTURÓN ③: rebotó por otra razón — «%»', SQLERRM;
    END IF;
  END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  -- ④ EL RASTRO EXISTE: un cambio aplicado dejó su fila.
  SELECT count(*) INTO v_n FROM oferta_precio_historial WHERE oferta_id = v_of;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN ④: el historial tiene % filas, esperaba 1', v_n;
  END IF;

  -- SE DESHACE TODO: el cinturón no deja residuo (L-234/L-267 — y hoy ya me
  -- cobré una por dejar una oferta publicada viva).
  DELETE FROM oferta_precio_historial WHERE oferta_id = v_of;
  UPDATE ofertas SET precio = v_precio WHERE id = v_of;
  UPDATE producto_variantes SET precio_referencia = NULL WHERE id = v_var;
  UPDATE vendedor_skus vs SET precio_propuesto = NULL
    FROM ofertas o WHERE o.id = v_of AND vs.id = o.sku_id;

  IF (SELECT count(*) FROM oferta_precio_historial) <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN: quedó residuo en el historial';
  END IF;
  RAISE NOTICE 'CINTURÓN banda: ①②③④ verdes — fail-closed rige, la banda deja pasar +10%% y rebota +50%%, y el residuo quedó en 0';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA (escrita ANTES):
--   DROP FUNCTION IF EXISTS public.actualizar_precio_oferta(uuid, numeric);
--   DROP TABLE IF EXISTS public.oferta_precio_historial;
--   ALTER TABLE public.producto_variantes DROP COLUMN IF EXISTS precio_referencia;
--   DELETE FROM public.app_config WHERE clave='precio_banda_pct';
--   -- y restaurar `v_skus_vendedor` a su forma de `20260819040000`.
-- ⚠️ QUÉ NO DESHACE: los precios YA cambiados por la puerta quedan como
--    están —son el precio real de una vitrina viva— y el historial se pierde
--    con la tabla, o sea que **revertir borra la única traza de por qué un
--    precio cambió.** Es exactamente lo que la firma ③ vino a impedir.
-- ═══════════════════════════════════════════════════════════════════════════
