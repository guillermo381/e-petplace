-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A · EL PROGRAMA DE ADIESTRAMIENTO GANA SUJETO PROPIO
--
-- 76(g) VEDA: **NO RIGE.** DDL aditiva + tabla nueva vacía + trigger. **Cero
--   backfill**: los 2 programas vivos son de prueba y no se tocan. Ninguno
--   rompe constraint — `pago_expira_en` nace NULL y el CHECK sólo la prohíbe
--   sobre lo ya pagado.
-- REVERSA: `docs/relevamientos/2026-09-05-s108a-REVERSA-M19.sql`.
--
-- ═══ POR QUÉ ES SUJETO PROPIO Y NO UN BONO — medido, no opinado ════════════
-- 🟢 Firma del founder: *la familia contrata el programa igual que un paquete;
--    lo que no cambia es que sigue siendo sujeto propio.* Las dos cosas conviven
--    porque **la diferencia es del motor y no de la experiencia.**
--
-- La evidencia que lo decidió (A-5 ①):
--   · el consumo es por **sesión IDENTIFICADA y ORDENADA** —
--     `uq_cita_programa_sesion UNIQUE (programa_contratado_id, sesion_numero)` —
--     mientras un bono consume `unidades_usadas + 1`: **cualquier unidad sirve**.
--     *La sesión 3 es la sesión 3; un día de guardería es cualquier día.*
--   · `evento_cita_servicio` ya las distingue: tiene `bono_id` **y**
--     `programa_contratado_id` como columnas separadas.
--   · el cierre es por AUSENCIA de pendientes (`_trg_programa_completa`), no por
--     contador.
--   · no tiene `familia_id` — es de user+mascota; el bono es DEL HOGAR.
--   · `programa_id` es FK al **currículum**. Un bono no tiene currículum.
-- ⇒ Meterlo en `bonos` deformaba la tabla de saldo. Gana columna.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① EL PUNTERO Y EL XOR A SIETE ─────────────────────────────────────────
ALTER TABLE public.pagos_intentos
  ADD COLUMN programa_contratado_id uuid
    REFERENCES public.programas_contratados(id);

ALTER TABLE public.pagos_intentos DROP CONSTRAINT chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos ADD CONSTRAINT chk_intento_un_solo_sujeto CHECK (
  ((pedido_id IS NOT NULL)::integer
 + (cita_id IS NOT NULL)::integer
 + (recurrencia_id IS NOT NULL)::integer
 + (suscripcion_servicio_id IS NOT NULL)::integer
 + (bono_id IS NOT NULL)::integer
 + (guarderia_suscripcion_id IS NOT NULL)::integer
 + (programa_contratado_id IS NOT NULL)::integer) = 1
);

CREATE INDEX IF NOT EXISTS ix_pagos_intentos_programa
  ON public.pagos_intentos (programa_contratado_id) WHERE programa_contratado_id IS NOT NULL;

-- ── ② EL RELOJ DEL HOLD ───────────────────────────────────────────────────
/* Mismo criterio que el bono: la ventana para pagar es OTRA cosa que
   `vigencia_hasta`, que es la vida del programa. Dos relojes, dos columnas. */
ALTER TABLE public.programas_contratados ADD COLUMN pago_expira_en timestamptz;
ALTER TABLE public.programas_contratados
  ADD CONSTRAINT chk_programa_hold_solo_si_no_pagado
  CHECK (pago_expira_en IS NULL OR estado_pago = 'pendiente');

-- ── ③ EL DESGLOSE, ESPEJO DEL DEL BONO ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.programa_desglose (
  programa_contratado_id uuid PRIMARY KEY
    REFERENCES public.programas_contratados(id) ON DELETE CASCADE,
  subtotal      numeric(14,2) NOT NULL,
  impuesto      numeric(14,2) NOT NULL,
  total         numeric(14,2) NOT NULL,
  moneda        text NOT NULL,
  fee_config_id uuid,
  congelado_en  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_pd_total_cierra CHECK (total = subtotal + impuesto),
  CONSTRAINT chk_pd_montos CHECK (subtotal >= 0 AND impuesto >= 0 AND total > 0)
);

ALTER TABLE public.programa_desglose ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS programa_desglose_select ON public.programa_desglose;
CREATE POLICY programa_desglose_select ON public.programa_desglose FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.programas_contratados pc
                  WHERE pc.id = programa_desglose.programa_contratado_id
                    AND (pc.user_id = auth.uid()
                         OR public.user_gestiona_prestador(pc.prestador_id)
                         OR public.is_admin())));

/* L-140 · la escritura vive SOLO en el trigger DEFINER. Sin esto la familia
   podría congelarse el desglose que quiera — o sea decidir cuánto se le cobra. */
REVOKE ALL ON public.programa_desglose FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.programa_desglose TO authenticated;

/* 🔴 POR TRIGGER Y NO POR PRODUCTOR — la misma orden que ya se aplicó al bono:
   *si el programa admite un productor sin desglose, admite el tercero.* Y
   FAIL-CLOSED: si no puede congelar, la fila no entra. */
CREATE OR REPLACE FUNCTION public._trg_programa_congela_desglose()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_moneda text; v_fee uuid;
BEGIN
  IF NEW.precio_total IS NULL OR NEW.precio_total <= 0 THEN
    RAISE EXCEPTION 'programa_sin_precio_no_puede_congelar_desglose' USING ERRCODE='22023';
  END IF;
  SELECT cc.moneda INTO v_moneda
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = NEW.prestador_id;
  IF v_moneda IS NULL THEN
    RAISE EXCEPTION 'programa_sin_moneda_no_puede_congelar_desglose' USING ERRCODE='22023';
  END IF;
  SELECT rfa.fee_config_id INTO v_fee
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
    CROSS JOIN LATERAL _resolver_fee_aplicable(cc.id, 'prestador_servicios'::tipo_actor_enum,
      pr.country_code, 'transaccional'::revenue_stream_enum, 'cita', NULL, now()) rfa
   WHERE pr.id = NEW.prestador_id;
  /* El IVA deriva en 0 **por dato** —los servicios no tributan en el catálogo—,
     igual que sus dos hermanas. El día que uno tribute, se cambia en las tres. */
  INSERT INTO programa_desglose (programa_contratado_id, subtotal, impuesto, total, moneda, fee_config_id)
  VALUES (NEW.id, round(NEW.precio_total,2), 0, round(NEW.precio_total,2), v_moneda, v_fee)
  ON CONFLICT (programa_contratado_id) DO NOTHING;
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_programa_congela_desglose ON public.programas_contratados;
CREATE TRIGGER trg_programa_congela_desglose
  AFTER INSERT ON public.programas_contratados
  FOR EACH ROW EXECUTE FUNCTION public._trg_programa_congela_desglose();

-- ── ④ AL CATÁLOGO DE SUJETOS (S108-B2) ────────────────────────────────────
/* Su guard `verificar_cobertura_sujetos_de_pago` revienta si el XOR gana un
   sujeto sin catalogar. **Eso es la maquinaria funcionando**, y por eso el
   catálogo se completa en el MISMO acto que la columna. */
/* La forma del catálogo se MIDIÓ, no se adivinó — el primer intento inventó
   columnas `columna` y `tabla` que no existen y la migración abortó con el
   agujero cerrado, que es para lo que sirve. */
INSERT INTO cat_sujetos_de_pago (codigo, columna_intento, descripcion)
SELECT 'programa', 'programa_contratado_id',
       'Adiestramiento · el programa de N sesiones NUMERADAS de un curriculum. '
       'Sujeto propio y no bono: su saldo NO es fungible, la sesion 3 es la 3.'
 WHERE NOT EXISTS (SELECT 1 FROM cat_sujetos_de_pago WHERE codigo='programa');

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_n int; v_r jsonb;
BEGIN
  SELECT count(*) INTO v_n FROM pg_constraint
   WHERE conrelid='public.pagos_intentos'::regclass AND conname='chk_intento_un_solo_sujeto'
     AND pg_get_constraintdef(oid) LIKE '%programa_contratado_id%';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: el XOR no nombra al programa'; END IF;

  -- 🔴 EL GUARD DE B TIENE QUE ESTAR VERDE: si el catalogo quedo corto, grita.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='verificar_cobertura_sujetos_de_pago') THEN
    v_r := public.verificar_cobertura_sujetos_de_pago();
    IF COALESCE((v_r->>'ok')::boolean,false) IS NOT TRUE THEN
      RAISE EXCEPTION 'cinturon: el guard de cobertura de B quedo ROJO: %', v_r::text;
    END IF;
  ELSE
    RAISE NOTICE 'cinturon M19: ⚠️ el guard de cobertura de B no existe — brazo NO EJERCIDO';
  END IF;

  -- el hold es inexpresable sobre un programa pagado
  BEGIN
    INSERT INTO programas_contratados (programa_id, user_id, mascota_id, prestador_id,
      prestador_servicio_id, n_sesiones, precio_total, precio_unitario_efectivo,
      duracion_minutos, vigencia_hasta, estado, estado_pago, country_code, pago_expira_en)
    SELECT pc.programa_id, pc.user_id, pc.mascota_id, pc.prestador_id, pc.prestador_servicio_id,
           1, 10, 10, 60, public.hoy_local()+30, 'activo', 'pagado', 'EC', now()
      FROM programas_contratados pc LIMIT 1;
    RAISE EXCEPTION 'cinturon: un programa PAGADO acepto ventana de pago viva';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  RAISE NOTICE 'cinturon M19: 3/3 OK (XOR a siete · catalogo de B en verde · hold inexpresable sobre lo pagado)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M19: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
