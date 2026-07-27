-- ═════════════════════════════════════════════════════════════════════
-- S79-A · T6 — EL INVARIANTE "activo ⇒ ofertable" (hallazgo del gate en
-- dispositivo del founder + su voto (a)).
--
-- EL HALLAZGO: activar_prestador dejó a Paseos Shyris en 'activo' con
-- su cuenta comercial en 'pendiente_validacion' — y TODAS las lectoras
-- de oferta exigen LAS DOS (cc.estado='activa', Decisión Q). Un
-- prestador activo e invisible sin que nada lo diga.
-- MEDIDO ANTES DE DISEÑAR: NO existe ninguna RPC de activación de
-- cuentas_comerciales (el legado lo hacía a mano) — el voto (a) no
-- pisa ningún camino vivo.
--
-- EL VOTO (a) DEL FOUNDER: activar_prestador activa LAS DOS en la
-- misma transacción — la validación fiscal ya ocurrió cuando el admin
-- escribió el RUC al invitar (declarado en LETRA_ALTA §4bis: si algún
-- día hay registro self-service, la validación fiscal vuelve a ser
-- gate propio).
--
-- LA COLISIÓN QUE LA MEDICIÓN DESTAPÓ (declarada, no tragada):
-- chk_datos_bancarios_validos exigía las 7 claves bancarias para
-- cuenta 'activa' — ejecutar el voto (a) tal cual REBOTARÍA (Shyris
-- tiene bancarios {}). Ese CHECK nació con la premisa del wizard
-- legado (bancarios ANTES de la activación admin, Decisión M v2.3);
-- la premisa murió con el alta por invitación Y con la decisión
-- firmada de LETRA_ALTA §4 (bancarios = requisito de COBRO). Cura
-- coherente con LAS DOS decisiones del founder: el CHECK pasa a
-- VACÍO-O-COMPLETO — '{}' es legal en cualquier estado (todavía no
-- los dio), un bancarios MALFORMADO sigue rebotando (la validación
-- estructural de Decisión M queda entera). La exigencia de completitud
-- se muda a donde siempre perteneció: el arco de pagos/liquidación
-- (nota de enmienda en MODELO_FINANCIERO, Decisión M).
--
-- 76(g), DECLARADA: NO RIGE — DDL (CHECK re-creado, validación de las
-- 6 filas vivas que el CHECK nuevo, más laxo, pasa trivialmente) +
-- CREATE OR REPLACE de función (misma firma, L-119 no aplica). Cero
-- backfill, cero anclas.
-- REVERSA escrita ANTES de aplicar (con su nota: restaurar el CHECK
-- viejo exige decidir qué hacer con cuentas activadas-sin-bancarios):
--   docs/relevamientos/2026-07-27-s79a-REVERSA-invariante-cuenta.sql
-- ═════════════════════════════════════════════════════════════════════
begin;

-- ── 1) El CHECK: vacío-o-completo ────────────────────────────────────
ALTER TABLE public.cuentas_comerciales
  DROP CONSTRAINT chk_datos_bancarios_validos;
ALTER TABLE public.cuentas_comerciales
  ADD CONSTRAINT chk_datos_bancarios_validos CHECK (
    datos_bancarios IS NOT NULL
    AND (
      datos_bancarios = '{}'::jsonb   -- todavía no los dio (LETRA_ALTA §4: se piden con el primer cobro)
      OR (
        (datos_bancarios ? 'banco_codigo') AND (datos_bancarios ? 'banco_nombre') AND (datos_bancarios ? 'tipo_cuenta')
        AND (datos_bancarios ? 'numero_cuenta') AND (datos_bancarios ? 'titular_nombre')
        AND (datos_bancarios ? 'titular_tipo_documento') AND (datos_bancarios ? 'titular_documento')
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'banco_codigo'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'banco_nombre'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'numero_cuenta'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'titular_nombre'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'titular_tipo_documento'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'titular_documento'))) > 0)
        AND ((datos_bancarios ->> 'tipo_cuenta') = ANY (ARRAY['corriente'::text, 'ahorros'::text]))
      )
    )
  );

-- ── 2) activar_prestador v2: activa LAS DOS en la misma transacción ──
-- Misma firma ⇒ CREATE OR REPLACE legal. Cambios sobre v1: al veredicto
-- 'activo', la cuenta pendiente_validacion pasa a 'activa' (activado_en
-- = now(), chk_estado_consistente satisfecho); una cuenta 'suspendida'
-- o 'cerrada' NO se reactiva en silencio — rebote hablado (reactivar es
-- decisión admin aparte, §7.7 del financiero).
CREATE OR REPLACE FUNCTION public.activar_prestador(
  p_prestador_id uuid,
  p_veredicto text,
  p_motivo text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_fila record;
  v_cuenta_estado estado_cuenta_comercial_enum;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501';
  END IF;
  IF p_veredicto IS NULL OR p_veredicto NOT IN ('activo', 'rechazado') THEN
    RAISE EXCEPTION 'veredicto_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT pr.id, pr.tipo, pr.direccion, pr.lat, pr.lon, pr.radio_cobertura_km,
         pr.cuenta_comercial_id
  INTO v_fila
  FROM public.prestadores pr
  WHERE pr.id = p_prestador_id
  FOR UPDATE;
  IF v_fila.id IS NULL THEN
    RAISE EXCEPTION 'prestador_no_encontrado' USING ERRCODE = '22023';
  END IF;

  IF p_veredicto = 'rechazado' THEN
    IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
      RAISE EXCEPTION 'motivo_requerido' USING ERRCODE = '22023';
    END IF;
    UPDATE public.prestadores
       SET estado = 'rechazado',
           motivo_rechazo = trim(p_motivo)
     WHERE id = p_prestador_id;
    RETURN jsonb_build_object('ok', true, 'prestador_id', p_prestador_id,
                              'estado', 'rechazado');
  END IF;

  -- EL CHECKLIST §3 (LETRA_ALTA) — mecánico, tipado, en orden:
  IF v_fila.direccion IS NULL OR trim(v_fila.direccion) = ''
     OR v_fila.lat IS NULL OR v_fila.lon IS NULL THEN
    RAISE EXCEPTION 'direccion_sin_coordenadas' USING ERRCODE = '22023';
  END IF;
  IF v_fila.radio_cobertura_km IS NULL THEN
    RAISE EXCEPTION 'radio_no_declarado' USING ERRCODE = '22023';
  END IF;
  IF v_fila.tipo IN ('clinica_veterinaria', 'veterinario_independiente')
     AND NOT EXISTS (
       SELECT 1 FROM public.prestador_documentos d
       WHERE d.prestador_id = p_prestador_id
         AND d.tipo IN ('titulo_profesional', 'registro_senescyt')
         AND d.estado = 'aprobado'
     ) THEN
    RAISE EXCEPTION 'verificacion_profesional_pendiente' USING ERRCODE = '23514';
  END IF;

  -- §4bis (voto (a) del founder): el invariante "activo ⇒ ofertable" —
  -- las DOS activaciones en la MISMA transacción.
  SELECT cc.estado INTO v_cuenta_estado
  FROM public.cuentas_comerciales cc
  WHERE cc.id = v_fila.cuenta_comercial_id
  FOR UPDATE;

  IF v_cuenta_estado IN ('suspendida', 'cerrada') THEN
    -- Reactivar una cuenta suspendida/cerrada es OTRA decisión (§7.7),
    -- jamás un efecto colateral de activar un prestador.
    RAISE EXCEPTION 'cuenta_no_activable' USING ERRCODE = '22023';
  END IF;

  IF v_cuenta_estado = 'pendiente_validacion' THEN
    UPDATE public.cuentas_comerciales
       SET estado = 'activa',
           activado_en = now()
     WHERE id = v_fila.cuenta_comercial_id;
  END IF;
  -- 'activa' ya: no-op honesto.

  UPDATE public.prestadores
     SET estado = 'activo',
         aprobado_por = v_auth,
         aprobado_en = now(),
         motivo_rechazo = NULL
   WHERE id = p_prestador_id;

  RETURN jsonb_build_object('ok', true, 'prestador_id', p_prestador_id,
                            'estado', 'activo', 'cuenta_estado', 'activa');
END;
$function$;

-- ── Verificación imperativa ──────────────────────────────────────────
DO $$
DECLARE v_n int;
BEGIN
  -- el CHECK nuevo existe y las 6 filas vivas lo pasan (el ADD ya validó)
  SELECT count(*) INTO v_n FROM pg_constraint
  WHERE conrelid='public.cuentas_comerciales'::regclass
    AND conname='chk_datos_bancarios_validos';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'verificacion: chk_datos_bancarios_validos no quedo (n=%)', v_n;
  END IF;
  -- una sola activar_prestador (L-119)
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
  WHERE ns.nspname='public' AND p.proname='activar_prestador';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'verificacion L-119: % sobrecargas de activar_prestador', v_n;
  END IF;
END $$;

commit;
