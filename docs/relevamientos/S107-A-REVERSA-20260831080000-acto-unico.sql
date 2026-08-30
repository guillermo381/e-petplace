/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260831080000_s107a_acto_unico_aceptacion.sql` — escrita ANTES.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 QUÉ **NO** DESHACE:

   1. **Revertir devuelve a la pantalla la decisión de CUÁLES son los seis.**
      Con un solo acto, que el bundle mande cinco por error es un bug cuyo
      síntoma es una familia a la que le dijimos que sí y queda en `faltan`.

   2. **No borra las aceptaciones creadas por el camino nuevo.** Son válidas: se
      guardaron por `(codigo, version)` igual que las otras. Al aplicar había
      **6 aceptaciones de una familia real** (30-ago 16:34) — revertir no las
      toca, y no debe.

   ⚠️ El retorno vuelve a ser sólo un conteo: `aceptadas: 5` se lee como éxito.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
CREATE OR REPLACE FUNCTION public.aceptar_documentos_guarderia(p_familia_id uuid, p_aceptaciones jsonb, p_urgencia_tope_monto numeric, p_urgencia_tope_moneda text, p_contactos jsonb, p_contacto_alternativo jsonb DEFAULT NULL::jsonb, p_redes_autorizadas boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_user uuid := auth.uid(); v_n int := 0; v_it jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM familia_miembro fm
                  WHERE fm.familia_id = p_familia_id AND fm.user_id = v_user) THEN
    RAISE EXCEPTION 'no_sos_de_esta_familia' USING ERRCODE = '42501';
  END IF;
  IF p_urgencia_tope_monto IS NULL OR p_urgencia_tope_monto <= 0 THEN
    RAISE EXCEPTION 'tope_de_urgencia_invalido' USING ERRCODE = '22023';
  END IF;

  /* Todo en UNA transacción: aceptar seis documentos y no guardar el tope
     dejaría a la guardería sin saber hasta cuánto puede gastar en una
     urgencia — la mitad de una firma no es media firma, es ninguna. */
  INSERT INTO guarderia_autorizaciones_familia (
    familia_id, urgencia_tope_monto, urgencia_tope_moneda, contactos,
    contacto_alternativo, redes_autorizadas)
  VALUES (p_familia_id, p_urgencia_tope_monto, p_urgencia_tope_moneda,
          COALESCE(p_contactos, '[]'::jsonb), p_contacto_alternativo,
          COALESCE(p_redes_autorizadas, false))
  ON CONFLICT (familia_id) DO UPDATE
    SET urgencia_tope_monto  = EXCLUDED.urgencia_tope_monto,
        urgencia_tope_moneda = EXCLUDED.urgencia_tope_moneda,
        contactos            = EXCLUDED.contactos,
        contacto_alternativo = EXCLUDED.contacto_alternativo,
        redes_autorizadas    = EXCLUDED.redes_autorizadas,
        actualizado_en       = now();

  FOR v_it IN SELECT * FROM jsonb_array_elements(COALESCE(p_aceptaciones, '[]'::jsonb)) LOOP
    INSERT INTO guarderia_aceptaciones (familia_id, documento_codigo, documento_version, aceptado_por)
         VALUES (p_familia_id, v_it->>'codigo', (v_it->>'version')::int, v_user)
    ON CONFLICT DO NOTHING;   -- aceptar dos veces la misma versión es idempotente
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'aceptadas', v_n);
END $function$
;
COMMIT;
