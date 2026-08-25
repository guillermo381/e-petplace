-- ===========================================================================
-- S105-A . EL uid ESTABLE POR (USUARIO, PROVEEDOR) — MOTOR INERTE
-- D-921. Firma del founder, 25-ago-2026.
-- ===========================================================================
--
-- 76(g) VEDA DE ESCRITURA: **NO RIGE.** DDL pura: una tabla nueva y una funcion
-- nueva. Cero backfill, cero filas existentes tocadas, cero anclas que congelar.
--
-- REVERSA: escrita ANTES, en
--   docs/relevamientos/S105-A-REVERSA-20260825180000-uid-estable.sql
--   Su nota dice que hoy revertir es gratis y que DESPUES DEL FLIP es
--   destructivo: los uid ya entregados viven del lado del proveedor.
--
-- -- QUE CURA -----------------------------------------------------------------
-- Hoy el uid que viaja a Nuvei es `altas_tarjeta.id` => un uuid NUEVO por alta
-- => para el proveedor cada alta es una persona distinta. Medido: 8 tarjetas,
-- 8 uid, un solo usuario; y su `card/list` devuelve result_size 1.
--
-- -- LAS DOS FIRMAS QUE LE DAN FORMA ------------------------------------------
-- (1) ES UN IDENTIFICADOR PROPIO ANTE EL PROVEEDOR, JAMAS EL user_id NUESTRO.
--     Razon del founder: el user_id vive en nuestra base y en nuestros logs;
--     darselo a un tercero lo vuelve un dato compartido que NO SE PUEDE
--     DES-COMPARTIR, y si hay que rotarlo, no se puede. Mismo criterio por el
--     que el monto no viaja desde el cliente: al tercero se le da lo que
--     necesita y nada mas.
-- (2) ES POR PROVEEDOR. Si entra un segundo, NO se reusa el mismo uid: un
--     identificador compartido entre dos terceros los deja correlacionar a la
--     misma persona entre ellos.
--
-- -- 🔴 NACE INERTE, Y ESO ES EL DISEÑO ---------------------------------------
-- **Nadie llama a esta funcion todavia.** El circuito son CUATRO piezas y tres
-- no son de A:
--   (2) el parametro `uid` en la URL del WebView        -> C
--   (3) `Payment.addCard(uid || alta, ...)`             -> C
--   (4) 🔴 la formula del stoken en pagos-alta-tarjeta  -> D
-- La (4) usa `alta` PORQUE HOY alta ES el uid. Si no cambia con el uid nuevo,
-- `stokenValido` pasa a false en TODAS las altas, y su detalle acusaria a una
-- formula que esta bien. **(2)(3)(4) salen en el mismo acto, con veda.**
-- Contrato para C: docs/relevamientos/S105-A-PEDIDO-UID-ESTABLE-para-C.md
-- ===========================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.usuario_proveedor_uid (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proveedor  text        NOT NULL,
  uid        text        NOT NULL,
  creado_en  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, proveedor)
);

COMMENT ON TABLE public.usuario_proveedor_uid IS
  'D-921. La identidad de una persona ante un proveedor de pago. UNO por '
  '(usuario, proveedor) y estable de por vida. NO es el user_id: es un '
  'identificador propio, para no entregarle identidad interna a un tercero. '
  'Y es POR PROVEEDOR a proposito: dos terceros no comparten el mismo uid.';

-- El uid nunca se repite entre personas ni entre proveedores.
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_proveedor_uid_valor
  ON public.usuario_proveedor_uid (proveedor, uid);

ALTER TABLE public.usuario_proveedor_uid ENABLE ROW LEVEL SECURITY;
-- Sin policies a proposito: NADIE lo lee por RLS. El unico acceso es por la
-- funcion DEFINER de abajo, que es server-side. *Un identificador ante un
-- tercero no tiene por que viajar al telefono.*

REVOKE ALL ON public.usuario_proveedor_uid FROM anon, authenticated;

-- ── EL PRODUCTOR — idempotente por construccion ────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_uid_proveedor(
  p_user_id   uuid,
  p_proveedor text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE v_uid text;
BEGIN
  IF p_user_id IS NULL OR COALESCE(btrim(p_proveedor),'') = '' THEN
    RAISE EXCEPTION 'uid_argumentos_invalidos' USING ERRCODE = '22023';
  END IF;

  /* 🔴 IDEMPOTENTE POR CONSTRUCCION, NO POR CUIDADO.
     El INSERT ... ON CONFLICT DO NOTHING mas el SELECT posterior hacen que dos
     llamadas concurrentes del mismo usuario NO puedan producir dos uid: la
     segunda pierde el conflicto y lee el que gano. *Un "si no existe, insertalo"
     escrito como IF/THEN tiene una ventana entre la pregunta y la escritura.* */
  INSERT INTO public.usuario_proveedor_uid (user_id, proveedor, uid)
  VALUES (p_user_id, btrim(p_proveedor), gen_random_uuid()::text)
  ON CONFLICT (user_id, proveedor) DO NOTHING;

  SELECT u.uid INTO v_uid
    FROM public.usuario_proveedor_uid u
   WHERE u.user_id = p_user_id AND u.proveedor = btrim(p_proveedor);

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'uid_no_resuelto' USING ERRCODE = '22023';
  END IF;

  RETURN v_uid;
END $fn$;

-- L-140: nace sin alcance para anon ni PUBLIC. Server-side y nada mas.
REVOKE ALL ON FUNCTION public.obtener_uid_proveedor(uuid, text) FROM PUBLIC, anon, authenticated;

-- ── CINTURON, con el ROJO que importa ──────────────────────────────────────
DO $cint$
DECLARE
  v_u uuid; v_a text; v_b text; v_c text; v_n int;
BEGIN
  SELECT id INTO v_u FROM auth.users ORDER BY created_at LIMIT 1;
  IF v_u IS NULL THEN RAISE EXCEPTION 'cinturon: no hay usuario contra el cual medir'; END IF;

  /* 🔴 EL DISCRIMINADOR: no basta con que el uid nuevo funcione. El defecto que
     se cura es que se genere uno NUEVO en la segunda alta, asi que lo que hay
     que medir es SU AUSENCIA. */
  v_a := public.obtener_uid_proveedor(v_u, 'nuvei');
  v_b := public.obtener_uid_proveedor(v_u, 'nuvei');

  IF v_a IS DISTINCT FROM v_b THEN
    RAISE EXCEPTION 'cinturon: DOS llamadas del mismo usuario dieron uid distintos (% vs %) — es el defecto que se venia a curar', v_a, v_b;
  END IF;

  SELECT count(*) INTO v_n FROM public.usuario_proveedor_uid
   WHERE user_id = v_u AND proveedor = 'nuvei';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon: quedaron % filas para (usuario, nuvei), se esperaba 1', v_n;
  END IF;

  /* El uid NO es el user_id — es la firma (1) del founder, hecha assert. */
  IF v_a = v_u::text THEN
    RAISE EXCEPTION 'cinturon: el uid es el user_id, y la firma dice que jamas debe serlo';
  END IF;

  /* POR PROVEEDOR: otro proveedor NO reusa el mismo uid — firma (2). */
  v_c := public.obtener_uid_proveedor(v_u, 'deuna');
  IF v_c = v_a THEN
    RAISE EXCEPTION 'cinturon: nuvei y deuna comparten uid, y la firma dice que jamas deben compartirlo';
  END IF;

  /* Y se deshace solo: el cinturon NO deja residuo (L-406). */
  DELETE FROM public.usuario_proveedor_uid WHERE user_id = v_u AND proveedor IN ('nuvei','deuna');

  SELECT count(*) INTO v_n FROM public.usuario_proveedor_uid;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon: quedo residuo, % filas', v_n; END IF;

  RAISE NOTICE 'cinturon OK: idempotente, no es el user_id, no se comparte entre proveedores, residuo 0';
END $cint$;

COMMIT;
