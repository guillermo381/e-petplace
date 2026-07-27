-- ═════════════════════════════════════════════════════════════════════
-- REVERSA de 20260727190000_s79_invariante_cuenta.sql (escrita ANTES
-- de aplicar).
--
-- NOTA DE DATOS: revertir el DDL NO desactiva las cuentas que
-- activar_prestador v2 haya activado (estado/activado_en son datos).
-- OJO ADICIONAL: si alguna cuenta fue activada CON bancarios vacíos
-- bajo el CHECK nuevo, RESTAURAR el CHECK viejo FALLARÁ en la
-- validación (esas filas lo violan) — la reversa del CHECK exige
-- primero decidir qué hacer con esas cuentas (volverlas a
-- pendiente_validacion o completar bancarios). Por eso el ALTER del
-- CHECK va al final y puede requerir intervención declarada.
-- ═════════════════════════════════════════════════════════════════════
begin;

-- 1) vuelve activar_prestador v1 (el body de 20260727180000, verbatim —
--    sin la activación de cuenta)
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

  SELECT pr.id, pr.tipo, pr.direccion, pr.lat, pr.lon, pr.radio_cobertura_km
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

  UPDATE public.prestadores
     SET estado = 'activo',
         aprobado_por = v_auth,
         aprobado_en = now(),
         motivo_rechazo = NULL
   WHERE id = p_prestador_id;

  RETURN jsonb_build_object('ok', true, 'prestador_id', p_prestador_id,
                            'estado', 'activo');
END;
$function$;

-- 2) vuelve el CHECK original (literal medido T4; ver la NOTA DE DATOS)
ALTER TABLE public.cuentas_comerciales
  DROP CONSTRAINT IF EXISTS chk_datos_bancarios_validos;
ALTER TABLE public.cuentas_comerciales
  ADD CONSTRAINT chk_datos_bancarios_validos CHECK (
    ((estado = ANY (ARRAY['pendiente_validacion'::estado_cuenta_comercial_enum, 'cerrada'::estado_cuenta_comercial_enum])) AND (datos_bancarios IS NOT NULL))
    OR ((estado = ANY (ARRAY['activa'::estado_cuenta_comercial_enum, 'suspendida'::estado_cuenta_comercial_enum]))
        AND (datos_bancarios ? 'banco_codigo') AND (datos_bancarios ? 'banco_nombre') AND (datos_bancarios ? 'tipo_cuenta')
        AND (datos_bancarios ? 'numero_cuenta') AND (datos_bancarios ? 'titular_nombre') AND (datos_bancarios ? 'titular_tipo_documento')
        AND (datos_bancarios ? 'titular_documento')
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'banco_codigo'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'banco_nombre'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'numero_cuenta'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'titular_nombre'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'titular_tipo_documento'))) > 0)
        AND (length(TRIM(BOTH FROM (datos_bancarios ->> 'titular_documento'))) > 0)
        AND ((datos_bancarios ->> 'tipo_cuenta') = ANY (ARRAY['corriente'::text, 'ahorros'::text])))
  );

commit;
