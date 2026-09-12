-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · `D-1068` ④ · LA REGLA DE LA FORMA DE PAGO ASUMIDA — SÓLO EN PRUEBAS
--
-- 🔴 FIRMA DEL FOUNDER, 12-sep-2026, y su razón es del AMBIENTE, no del dato:
--    *«en ambiente 1 los comprobantes no tienen efecto fiscal y se borran cada
--    hora. Asumir una forma de pago ahí no cuesta nada; lo que sí cuesta es
--    llegar al 1 de octubre sin haber visto nunca el circuito automático
--    funcionar de punta a punta. El riesgo mayor es no probarlo.»*
--
--    ⚠️ La medición NO cambió y se deja escrita para que nadie la relea al
--    revés: **101 de 101 pagos Nuvei siguen sin medio de pago**, y de los 12
--    documentos de hoy la regla destraba 2 — **los 2 asumidos, el 100 % de lo
--    que destraba**. Lo que cambió es el criterio de riesgo, y es del founder.
--
-- 🔴 LAS DOS GUARDAS, Y VAN EN ESTE MISMO ACTO (no después):
--
--    ① **CADA DOCUMENTO ASUMIDO QUEDA MARCADO.** `forma_pago_asumida` es una
--       columna, no una nota: *se puede listar, contar y agrupar.* Sin ella,
--       «cuáles se asumieron» se contestaría leyendo `motivo_rechazo` con un
--       LIKE, que es la clase de respuesta que nadie va a ir a buscar.
--
--    ② **EL ENCENDIDO DE HOY NO SE HEREDA A PRODUCCIÓN.** La regla mira
--       `fiscal_emisor.ambiente`:
--         · ambiente 1 (PRUEBAS)    → basta `fiscal_forma_pago_asumida`
--         · ambiente 2 (PRODUCCIÓN) → EXIGE ADEMÁS
--           `fiscal_forma_pago_asumida_en_produccion`, que nace en `false`
--       *El día que alguien mueva el emisor a producción, la regla se apaga
--       SOLA y los documentos vuelven a esperar.* Pedido del founder: «que no
--       quiero que el encendido de hoy se herede solo». **Es estructural, no
--       un recordatorio** — una llave que hay que acordarse de bajar es una
--       llave que va a quedar arriba.
--
-- 🔴 Y LA REGLA ESTÁ ACOTADA AL RIEL DE TARJETA POR EVIDENCIA, no por
--    proveedor: exige que el intento TENGA rastro de tarjeta (`card` en el
--    payload, o `bin`/`marca`). *Aplicarla «cuando no se pueda derivar» le
--    pondría «tarjeta de crédito» a un pago de DeUna, que es un dato falso
--    distinto del que la regla viene a evitar.*
--
-- VEDA 76(g): NO RIGE — columna nueva con default, dos claves, un lector.
-- Reversa: `docs/relevamientos/S115-A-REVERSA-20260912800000-regla-cuatro.sql`
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.documentos_fiscales
  ADD COLUMN IF NOT EXISTS forma_pago_asumida boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.documentos_fiscales.forma_pago_asumida IS
  'D-1068 ④ · true = el <formaPago> del XML NO salió de un dato: lo puso la '
  'regla de asunción (crédito, código 19) porque el riel no dijo si fue '
  'crédito o débito. Sólo puede ser true en ambiente de PRUEBAS.';

INSERT INTO public.app_config (clave, valor, descripcion, es_publico) VALUES
  ('fiscal_forma_pago_asumida', 'true',
   'D-1068 ④ · Si el riel de TARJETA no declara crédito/débito, se asume '
   'crédito (19) y el documento queda marcado forma_pago_asumida=true. '
   'FIRMADA POR EL FOUNDER 12-sep-2026 SÓLO PARA PRUEBAS. Regla con fecha de '
   'vencimiento: muere cuando Nuvei conteste (D-1082) o cuando derivemos del BIN.',
   false),
  ('fiscal_forma_pago_asumida_en_produccion', 'false',
   'D-1068 ④ · LA SEGUNDA LLAVE. En ambiente 2 la regla NO corre aunque la '
   'primera esté en true. Pasar a producción asumiendo formas de pago exige '
   'que el founder lo firme DE NUEVO. El encendido de pruebas no se hereda.',
   false)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor,
                                  descripcion = EXCLUDED.descripcion;

-- ── LA FUNCIÓN, CON LA RAMA NUEVA AL FINAL ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.fiscal_forma_pago_del_intento(p_intento_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_i public.pagos_intentos; v_medio text; v_cod text; v_como text;
        v_asumida boolean := false; v_amb int; v_regla bool; v_regla_prod bool;
        v_hay_tarjeta bool;
BEGIN
  SELECT * INTO v_i FROM public.pagos_intentos WHERE id = p_intento_id;
  IF v_i.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_existe');
  END IF;

  IF v_i.medio_pago IS NOT NULL THEN
    v_medio := v_i.medio_pago; v_como := 'declarado';
  ELSIF v_i.proveedor = 'deuna' THEN
    v_medio := 'deuna'; v_como := 'derivado_del_proveedor';
  ELSE
    /* ── LA REGLA ④, Y SUS TRES CONDICIONES CONJUNTAS ───────────────────── */
    SELECT ambiente INTO v_amb FROM public.fiscal_emisor LIMIT 1;
    SELECT (valor='true') INTO v_regla      FROM app_config WHERE clave='fiscal_forma_pago_asumida';
    SELECT (valor='true') INTO v_regla_prod FROM app_config WHERE clave='fiscal_forma_pago_asumida_en_produccion';

    /* Riel de TARJETA por evidencia. Sin rastro de tarjeta la regla no corre:
       no se le pone «crédito» a algo que no sabemos que fue una tarjeta. */
    v_hay_tarjeta := (v_i.payload_crudo ? 'card')
                     OR coalesce(v_i.bin,'') <> '' OR coalesce(v_i.marca,'') <> '';

    IF coalesce(v_regla,false) AND v_hay_tarjeta
       AND (v_amb = 1 OR coalesce(v_regla_prod,false))
    THEN
      v_medio := 'credito'; v_como := 'asumida_regla_D1068_cuatro'; v_asumida := true;
    ELSE
      RETURN jsonb_build_object('ok', false, 'codigo', 'medio_de_pago_no_declarado',
        'proveedor', v_i.proveedor, 'ambiente', v_amb,
        'regla_asuncion', coalesce(v_regla,false),
        'hay_rastro_de_tarjeta', v_hay_tarjeta,
        'detalle', CASE
          WHEN NOT coalesce(v_regla,false)
            THEN 'La fila no dice con que se pago y la regla de asuncion esta apagada.'
          WHEN NOT v_hay_tarjeta
            THEN 'Sin rastro de tarjeta: la regla no aplica a este riel.'
          ELSE 'AMBIENTE 2: la regla de asuncion NO corre en produccion sin '
               'fiscal_forma_pago_asumida_en_produccion. El encendido de pruebas no se hereda.'
        END);
    END IF;
  END IF;

  SELECT codigo_sri INTO v_cod FROM public.cat_forma_pago_sri
   WHERE country_code='EC' AND medio=v_medio AND activo;
  IF v_cod IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo','medio_sin_codigo_sri','medio',v_medio);
  END IF;

  RETURN jsonb_build_object('ok', true, 'medio', v_medio, 'codigo_sri', v_cod,
                            'como', v_como, 'asumida', v_asumida);
END $fn$;

REVOKE EXECUTE ON FUNCTION public.fiscal_forma_pago_del_intento(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_forma_pago_del_intento(uuid) TO authenticated, service_role;

-- ── EL LECTOR: «cuáles se asumieron», que es la pregunta del founder ────────
CREATE OR REPLACE FUNCTION public.fiscal_documentos_con_forma_asumida()
RETURNS TABLE (id uuid, numero text, total numeric, estado text, creado timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT d.id,
         nullif(concat_ws('-', d.establecimiento, d.punto_emision, d.secuencial),'--'),
         d.total, d.estado, d.created_at
    FROM public.documentos_fiscales d
   WHERE d.forma_pago_asumida
     AND (is_admin() OR auth.uid() IS NULL)
   ORDER BY d.created_at DESC;
$fn$;
REVOKE EXECUTE ON FUNCTION public.fiscal_documentos_con_forma_asumida() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_documentos_con_forma_asumida() TO authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_int uuid; v jsonb; v_amb int;
BEGIN
  SELECT ambiente INTO v_amb FROM fiscal_emisor LIMIT 1;
  IF v_amb <> 1 THEN
    RAISE EXCEPTION 'cinturon 🔴: el emisor NO esta en ambiente 1 (esta en %). '
                    'Esta migracion enciende una regla firmada SOLO para pruebas.', v_amb;
  END IF;

  SELECT id INTO v_int FROM pagos_intentos
   WHERE proveedor='nuvei' AND medio_pago IS NULL AND payload_crudo ? 'card' LIMIT 1;
  IF v_int IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay intento de tarjeta sin medio — sin caso no se discrimina';
  END IF;

  -- ① En PRUEBAS la regla resuelve, y SE DECLARA asumida.
  v := fiscal_forma_pago_del_intento(v_int);
  IF NOT coalesce((v->>'ok')::bool,false) OR (v->>'codigo_sri') <> '19'
     OR NOT coalesce((v->>'asumida')::bool,false) THEN
    RAISE EXCEPTION 'cinturon: la regla no resolvio o no se declaro asumida: %', v::text;
  END IF;

  -- ② 🔴 EL ROJO QUE IMPORTA: en PRODUCCIÓN la regla NO corre, aunque la
  --    primera llave esté encendida. Se simula moviendo el ambiente DENTRO de
  --    la transacción; el DO entero corre en la de la migración, así que esto
  --    no queda escrito si algo falla después.
  UPDATE fiscal_emisor SET ambiente = 2;
  v := fiscal_forma_pago_del_intento(v_int);
  IF coalesce((v->>'ok')::bool,false) THEN
    RAISE EXCEPTION 'cinturon 🔴 GRAVE: en AMBIENTE 2 la regla asumio igual. '
                    'El encendido de pruebas SE HEREDA a produccion: %', v::text;
  END IF;
  -- ③ Y con la segunda llave encendida sí corre — o sea que la guarda es una
  --    decisión, no un bloqueo permanente mal puesto.
  UPDATE app_config SET valor='true' WHERE clave='fiscal_forma_pago_asumida_en_produccion';
  v := fiscal_forma_pago_del_intento(v_int);
  IF NOT coalesce((v->>'ok')::bool,false) THEN
    RAISE EXCEPTION 'cinturon: con la segunda llave la regla deberia correr y no corrio: %', v::text;
  END IF;
  -- Restaurar el estado firmado: ambiente 1, segunda llave APAGADA.
  UPDATE app_config SET valor='false' WHERE clave='fiscal_forma_pago_asumida_en_produccion';
  UPDATE fiscal_emisor SET ambiente = 1;

  -- ④ Sin rastro de tarjeta la regla NO aplica (el borde de DeUna).
  SELECT id INTO v_int FROM pagos_intentos
   WHERE proveedor='deuna' LIMIT 1;
  IF v_int IS NOT NULL THEN
    v := fiscal_forma_pago_del_intento(v_int);
    IF (v->>'medio') = 'credito' THEN
      RAISE EXCEPTION 'cinturon 🔴: a un pago de DeUna se le puso tarjeta de credito';
    END IF;
  END IF;

  RAISE NOTICE 'cinturon OK · pruebas asume y marca · AMBIENTE 2 NO hereda (rojo probado) · segunda llave abre · DeUna intacto';
END $cint$;
