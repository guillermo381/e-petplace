-- S115-A · ② y ④ — LO QUE SE PIERDE SI NO SE CAPTURA EL 1-OCT
-- Letra: MODELO_ECONOMICO v1.1 · criterio ③ de LETRA_PORTAL_ADMIN §2 (firma founder).
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912390000-captura.sql
-- VEDA 76(g): NO RIGE.
--
-- 🔴 ESTO NO SON TABLEROS: ES CAPTURA. Un tablero se construye cuando se quiera; un
--    dato que no se capturó el día de la transacción **no existe nunca más**. La mezcla
--    de octubre es la variable que mueve el break-even entero (cada punto que sale de
--    crédito vale ~4 % del ticket) y hoy no se puede reconstruir: F midió que no hay
--    camino de `eventos_economicos` a `pagos_intentos` — `kushki_charge_id` en 0 de 61.

BEGIN;

-- ══ ②a · EL MEDIO DE PAGO, ATADO AL EVENTO ═══════════════════════════════════
/* 🔴 FK, NO SNAPSHOT — y la razón es que el snapshot sería la copia que diverge.
   `pagos_intentos` ya guarda `proveedor`, `forma`, `marca`, `bin`, `ultimos4`,
   `authorization_code` y el id del proveedor. Copiar dos de esos campos al evento
   crea dos verdades del mismo hecho, y el día que una se corrija la otra no.
   El JOIN cuesta un índice; la divergencia cuesta una reconciliación.
   Las filas de `pagos_intentos` no se borran (todas sus FKs son RESTRICT), así que
   la referencia no se puede quedar huérfana. */
ALTER TABLE public.eventos_economicos
  ADD COLUMN pago_intento_id uuid REFERENCES public.pagos_intentos(id) ON DELETE RESTRICT;

CREATE INDEX idx_eventos_economicos_pago ON public.eventos_economicos (pago_intento_id)
  WHERE pago_intento_id IS NOT NULL;

COMMENT ON COLUMN public.eventos_economicos.pago_intento_id IS
  'CON QUÉ se pagó lo que este evento devenga. Es la única forma de reconstruir la mezcla de medios (DeUna/débito/crédito), que es la variable que mueve el break-even. Se RESUELVE sola en crear_evento_economico: ningún caller tiene que acordarse.';

/* La resolución: el evento sabe su sujeto, y el intento aprobado de ese sujeto es el
   pago. NO se le pide al caller que lo pase — *un dato que depende de que alguien se
   acuerde de pasarlo es un dato que se va a perder en la puerta que nadie miró.* */
CREATE OR REPLACE FUNCTION public.resolver_pago_del_origen(p_origen_tipo text, p_origen_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT pi.id FROM public.pagos_intentos pi
   WHERE pi.estado = 'aprobado'
     AND ( (p_origen_tipo = 'cita'    AND pi.cita_id  = p_origen_id)
        OR (p_origen_tipo = 'bono'    AND pi.bono_id  = p_origen_id)
        OR (p_origen_tipo = 'estadia' AND pi.bono_id  = p_origen_id)
        OR (p_origen_tipo = 'programa' AND pi.programa_contratado_id = p_origen_id)
        OR (p_origen_tipo = 'pedido'  AND (pi.pedido_id = p_origen_id
             OR pi.compra_id = (SELECT compra_id FROM pedidos WHERE id = p_origen_id))) )
   ORDER BY pi.creado_en DESC LIMIT 1;
$fn$;
REVOKE EXECUTE ON FUNCTION public.resolver_pago_del_origen(text, uuid) FROM PUBLIC, anon;

-- ══ ②b · EL COSTO DEL RIEL, COMO DATO POR RIEL ═══════════════════════════════
/* 🔴 JAMÁS CONSTANTE (D-759). Estos números son del founder de HOY (calculadora Nuvei
   y Carlos Ochoa de DeUna) y **van a cambiar**: el día que cambien, cambia una fila.
   Mismo patrón que `fee_configs`: parámetros en jsonb + vigencia + historial. */
CREATE TABLE public.cat_costos_riel (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor       text NOT NULL,
  forma           text NOT NULL,
  parametros      jsonb NOT NULL,
  vigencia_desde  timestamptz NOT NULL DEFAULT now(),
  vigencia_hasta  timestamptz,
  activo          boolean NOT NULL DEFAULT true,
  fuente          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cat_costos_riel ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_costos_riel_admin ON public.cat_costos_riel
  FOR SELECT TO authenticated USING (is_admin());
REVOKE ALL ON public.cat_costos_riel FROM anon;

COMMENT ON TABLE public.cat_costos_riel IS
  'Lo que CUESTA cobrar por cada riel. Dato del founder (10-sep-2026): calculadora de Nuvei y Carlos Ochoa por DeUna. Es DATO con vigencia: el dia que el banco cambie su tarifa, cambia una fila y los eventos viejos siguen diciendo lo que costaron.';

INSERT INTO public.cat_costos_riel (proveedor, forma, parametros, fuente) VALUES
  ('nuvei','credito',
   '{"pct_banco": 4.62, "pct_procesador": 1.5, "fijo": 0.05, "iva_sobre_procesador": 15, "nota": "banco ya incluye IVA; 3DS incluido en el fijo"}'::jsonb,
   'Calculadora Nuvei (founder, 10-sep-2026)'),
  ('nuvei','debito',
   '{"pct_banco": 2.3, "pct_procesador": 0.5, "fijo": 0.05, "iva_sobre_procesador": 15}'::jsonb,
   'Calculadora Nuvei (founder, 10-sep-2026)'),
  ('deuna','codigo_push',
   '{"pct_banco": 0, "pct_procesador": 2.0, "fijo": 0, "iva_sobre_procesador": 15}'::jsonb,
   'Carlos Ochoa / DeUna (founder, 10-sep-2026)'),
  ('nuvei','diferido',
   '{"pct_banco": 7.7, "pct_procesador": 1.5, "fijo": 0.05, "iva_sobre_procesador": 15, "nota": "PISO del rango 7,7%-15% segun plazo. APAGADO por app_config.pago_diferido_vivo."}'::jsonb,
   'Calculadora Nuvei (founder, 10-sep-2026)');

CREATE OR REPLACE FUNCTION public.costo_riel(
  p_proveedor text, p_forma text, p_monto numeric, p_fecha timestamptz DEFAULT now())
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE p jsonb; v_banco numeric; v_proc numeric; v_iva numeric;
BEGIN
  SELECT parametros INTO p FROM public.cat_costos_riel
   WHERE proveedor = p_proveedor AND forma = p_forma AND activo
     AND vigencia_desde <= p_fecha AND (vigencia_hasta IS NULL OR vigencia_hasta > p_fecha)
   ORDER BY vigencia_desde DESC LIMIT 1;

  /* Fail-closed: sin tarifa configurada NO se devuelve cero. *Un costo de riel en cero
     hace que el margen se vea sano justo en el riel que nadie configuro.* */
  IF p IS NULL THEN
    RETURN jsonb_build_object('conocido', false, 'motivo', 'sin_tarifa_de_riel',
                              'proveedor', p_proveedor, 'forma', p_forma);
  END IF;

  v_banco := round(p_monto * COALESCE((p->>'pct_banco')::numeric,0) / 100, 2);
  v_proc  := round(p_monto * COALESCE((p->>'pct_procesador')::numeric,0) / 100
                   + COALESCE((p->>'fijo')::numeric,0), 2);
  v_iva   := round(v_proc * COALESCE((p->>'iva_sobre_procesador')::numeric,0) / 100, 2);

  RETURN jsonb_build_object(
    'conocido', true, 'banco', v_banco, 'procesador', v_proc, 'iva_procesador', v_iva,
    'total', v_banco + v_proc + v_iva, 'parametros', p);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.costo_riel(text, text, numeric, timestamptz) FROM PUBLIC, anon;

ALTER TABLE public.pagos_intentos ADD COLUMN costo_riel numeric(12,2);
COMMENT ON COLUMN public.pagos_intentos.costo_riel IS
  'Lo que costo cobrar ESTE pago, congelado al aprobarse. Se calcula con costo_riel() y NO se recalcula: el dia que el banco cambie su tarifa, este pago sigue diciendo lo que costo.';

-- ══ ②c · LAS RETENCIONES QUE LE PRACTICAN A SATORI ═══════════════════════════
/* 🔴 SON LO CONTRARIO DE `liquidaciones.retenciones_fiscales` (F lo midió): aquella es
   lo que Satori RETIENE a terceros; esto es lo que a Satori LE RETIENEN las emisoras.
   Van en el arco de PAGOS porque ahí ocurren: 2 % de renta sobre la base y
   30 % (bienes) / 70 % (servicios) del IVA de cada cobro con tarjeta.
   ⚠️ NO SON COSTO: es caja que sale hoy y vuelve en meses. Por eso viven aparte de
   `costo_riel` — sumarlas al costo diria que el margen es peor de lo que es. */
ALTER TABLE public.pagos_intentos
  ADD COLUMN retencion_renta numeric(12,2),
  ADD COLUMN retencion_iva   numeric(12,2),
  ADD COLUMN retenido_en     timestamptz,
  ADD CONSTRAINT chk_retencion_viaja_con_su_fecha CHECK (
    (retencion_renta IS NULL AND retencion_iva IS NULL) = (retenido_en IS NULL));

COMMENT ON COLUMN public.pagos_intentos.retencion_renta IS
  'Lo que la EMISORA le retuvo a Satori por renta (2 %). Caja que vuelve, no costo.';
COMMENT ON COLUMN public.pagos_intentos.retencion_iva IS
  'Lo que la EMISORA le retuvo a Satori del IVA (30 % bienes / 70 % servicios). Caja que vuelve, no costo.';

-- ══ ②d · EL VENCIMIENTO DEL CERTIFICADO ══════════════════════════════════════
/* El ítem más barato de todos, y sin él la alerta de §7 no tiene dato:
   *un certificado vencido detiene el 100 % de la facturación.* */
ALTER TABLE public.fiscal_emisor
  ADD COLUMN certificado_vence_en date,
  ADD COLUMN certificado_alias    text;
COMMENT ON COLUMN public.fiscal_emisor.certificado_vence_en IS
  'Vencimiento del .p12 de firma electronica. NULL = todavia no hay certificado. La alerta de §7 (30 y 7 dias) lee de aca; sin este dato la alerta no existe.';

COMMIT;
