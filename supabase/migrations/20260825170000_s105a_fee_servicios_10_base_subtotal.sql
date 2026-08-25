-- ===========================================================================
-- S105-A . LA COMISION DE SERVICIOS: 15 % -> 10 %, CON BASE DECLARADA
-- Firma del founder, 25-ago-2026.
-- ===========================================================================
--
-- 76(g) VEDA DE ESCRITURA: **NO RIGE, y se declara por que.** No hay backfill
-- ni anclas que congelar: los desgloses ya congelados NO se tocan (ver abajo).
-- Lo unico que cambia es cual es la configuracion VIGENTE de aca en adelante.
--   ⚠️ Riesgo residual declarado: una cita que se congelara EXACTAMENTE durante
--   esta transaccion tomaria una u otra fila. Medido: cero trafico real de
--   terceros -- todas las citas vivas son de la cuenta de prueba del founder.
--
-- REVERSA: escrita ANTES, en
--   docs/relevamientos/S105-A-REVERSA-20260825170000-fee-servicios.sql
--   Su nota dice que la reversa NO borra la fila nueva (puntero colgado) y que
--   no devuelve ninguna comision ya devengada.
--
-- -- POR QUE, y las dos firmas ------------------------------------------------
--
-- El founder firmo 10 % para todos los oficios del lanzamiento. Medido, la
-- configuracion viva decia 15 % para servicios en EC y CO -- las dos filas del
-- seed original, con su historia escrita adentro ("S25 D-211: ajuste 18->15").
--
-- (1) LA BASE ES EL SUBTOTAL, SIN IMPUESTO. Firma del founder:
--     **comisionar sobre el impuesto es cobrarle al prestador un porcentaje de
--     plata que es del Estado.**
--
--     🔴 Y DIVERGE DE PRODUCTOS A PROPOSITO, NO POR INCONSISTENCIA: la despensa
--     cobra 10 % sobre `total_con_impuesto` (MODELO_DESPENSA §2.3bis, que midio
--     que asi el impuesto encarece la comision). Aca se decide lo contrario y se
--     declara como DECISION, no como olvido.
--
--     ⚠️ Hoy NO SE NOTA: el IVA de servicios esta en 0 en las 13 citas
--     congeladas, asi que subtotal y total coinciden. **Por eso es el momento de
--     decidirlo** -- un porcentaje sin base no es un precio, y el dia que un
--     servicio tribute ya nadie va a poder decir que decian las filas viejas.
--
-- (2) COLOMBIA SE CIERRA. CO no esta en v1 (mismo argumento con el que se cerro
--     la fila CO de productos). Tenia CERO citas congeladas: no rompe nada.
--
-- -- LO QUE NO SE TOCA, y es la razon de existir del congelado ---------------
-- Las 13 citas ya congeladas apuntan a `11a53cf8` y siguen diciendo 15 %.
-- **No se reescriben.** Por eso la fila vieja se CIERRA y no se actualiza: un
-- UPDATE del pct cambiaria retroactivamente lo que esas citas dicen haber
-- cobrado, y el desglose quedaria diciendo un numero y su configuracion otro.
-- Molde ya usado en la casa, con su razon en la propia fila de productos:
-- "vigencia cerrada... No se borra: eventos viejos apuntan aca".
--
-- ⚠️ NOTA MEDIDA, sin curar: el CHECK `chk_fee_pedido_declara_base` exige `base`
-- SOLO para tipo_origen='pedido' y nacio NOT VALID. **A una fila de `cita` no la
-- alcanza** => la fila nueva podria nacer sin base sin que nada la frene.
-- Se declara `base` igual, por firma. Extender el CHECK a 'cita' es otra tanda.
-- ===========================================================================

BEGIN;

-- ── (1) cerrar EC 15 % ─────────────────────────────────────────────────────
UPDATE public.fee_configs
   SET vigencia_hasta = now(),
       notas = COALESCE(notas,'')
         || ' | S105-A (25-ago-2026): CERRADA por firma del founder. El lanzamiento'
         || ' va a 10 % con base `subtotal`. No se borra: 13 citas congeladas'
         || ' apuntan aca y siguen diciendo 15 %.'
 WHERE id = '11a53cf8-629c-47b3-b7ad-854eeb78b034';

-- ── (2) cerrar CO ──────────────────────────────────────────────────────────
UPDATE public.fee_configs
   SET activo = false,
       vigencia_hasta = now(),
       notas = COALESCE(notas,'')
         || ' | S105-A (25-ago-2026): CERRADA. CO no esta en v1 -- mismo criterio'
         || ' con el que se cerro la fila CO de productos. Cero citas congeladas.'
         || ' El dia que CO abra, su fee NACE DE CERO con firma propia y base'
         || ' declarada: esta fila NO se reactiva.'
 WHERE id = '5a5e2381-1011-4cc9-9e68-e5e8d56bfc70';

-- ── (3) la fila nueva de EC ────────────────────────────────────────────────
INSERT INTO public.fee_configs
  (tipo_actor, tipo_origen, country_code, revenue_stream, tipo_calculo,
   parametros, activo, prioridad, vigencia_desde, vigencia_hasta,
   absorbe_descuento_default, notas)
VALUES
  ('prestador_servicios', 'cita', 'EC', 'transaccional', 'porcentual',
   jsonb_build_object('pct', 10, 'base', 'subtotal'),
   true, 0, now(), NULL, 'plataforma',
   'S105-A (25-ago-2026): comision de servicios firmada por el founder. 10 % sobre'
   || ' el SUBTOTAL, sin impuesto -- comisionar sobre el impuesto es cobrarle al'
   || ' prestador un porcentaje de plata que es del Estado. DIVERGE de productos'
   || ' (que va sobre total_con_impuesto) A PROPOSITO y como decision declarada.');

-- ── CINTURON ───────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_pct text; v_base text; v_n int; v_co int; BEGIN
  -- (a) EC resuelve 10 con base subtotal
  SELECT f.parametros->>'pct', f.parametros->>'base'
    INTO v_pct, v_base
    FROM public.fee_configs f
   WHERE f.tipo_actor='prestador_servicios' AND f.country_code='EC'
     AND f.activo AND (f.vigencia_hasta IS NULL OR f.vigencia_hasta > now())
   ORDER BY f.vigencia_desde DESC LIMIT 1;

  IF v_pct IS DISTINCT FROM '10' THEN
    RAISE EXCEPTION 'cinturon: EC no quedo en 10, quedo en %', COALESCE(v_pct,'(ninguna vigente)');
  END IF;
  IF v_base IS DISTINCT FROM 'subtotal' THEN
    RAISE EXCEPTION 'cinturon: EC no declara base=subtotal, declara %', COALESCE(v_base,'(ninguna)');
  END IF;

  -- (b) EXACTAMENTE UNA vigente para EC. Dos vigentes es peor que ninguna:
  --     el resolvedor tomaria una sin avisar.
  SELECT count(*) INTO v_n FROM public.fee_configs f
   WHERE f.tipo_actor='prestador_servicios' AND f.country_code='EC'
     AND f.activo AND (f.vigencia_hasta IS NULL OR f.vigencia_hasta > now());
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon: EC tiene % filas vigentes, se esperaba 1', v_n;
  END IF;

  -- (c) CO no tiene ninguna vigente
  SELECT count(*) INTO v_co FROM public.fee_configs f
   WHERE f.tipo_actor='prestador_servicios' AND f.country_code='CO'
     AND f.activo AND (f.vigencia_hasta IS NULL OR f.vigencia_hasta > now());
  IF v_co <> 0 THEN
    RAISE EXCEPTION 'cinturon: CO quedo con % filas vigentes, se esperaba 0', v_co;
  END IF;

  -- (d) 🔴 EL DISCRIMINADOR QUE IMPORTA: las 13 citas viejas NO se movieron.
  --     Sin esto, el verde solo diria "la config nueva esta", que no es
  --     "el pasado quedo intacto".
  SELECT count(*) INTO v_n FROM public.cita_desglose
   WHERE fee_config_id = '11a53cf8-629c-47b3-b7ad-854eeb78b034';
  IF v_n <> 13 THEN
    RAISE EXCEPTION 'cinturon: las citas congeladas contra la fila vieja son %, se esperaban 13', v_n;
  END IF;

  RAISE NOTICE 'cinturon OK: EC 10/subtotal, una sola vigente, CO cerrada, 13 congeladas intactas';
END $cint$;

COMMIT;
