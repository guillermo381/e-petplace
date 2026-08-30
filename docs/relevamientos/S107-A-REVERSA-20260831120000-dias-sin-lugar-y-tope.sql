/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260831120000_s107a_dias_sin_lugar_y_tope_del_texto.sql`
   Escrita ANTES de aplicar.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 QUÉ **NO** DESHACE:

   1. **Revertir vuelve a exigir el tope en el flujo** — y como la pantalla ya
      NO lo pide (firma del founder), el acto único **deja de funcionar**:
      `aceptar_documentos_guarderia` rebota `tope_de_urgencia_invalido` y
      **ninguna familia nueva puede aceptar**. *Revertir esto apaga la
      guardería, no «vuelve atrás un cambio».*

   2. **No borra los topes NULL** que hayan quedado. Un NULL significa «el del
      documento vigente»; con la columna NOT NULL de vuelta, esas filas
      quedarían fuera de la restricción (Postgres no revalida al re-poner
      NOT NULL si hay filas nulas: el ALTER falla). ⇒ **antes de revertir hay
      que decidir qué número se les escribe**, y ese número es una firma.

   3. La tira sin lugar vuelve a no existir: P2 vuelve a mostrar 14 días
      iguales y la familia a descubrir tocando cuáles sirven.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_dias_guarderia_disponibles(uuid, date, date, text, double precision, double precision);
DELETE FROM app_config WHERE clave = 'guarderia_tope_urgencia_usd';
-- ⚠️ Falla si hay topes NULL — ver nota 2.
ALTER TABLE public.guarderia_autorizaciones_familia ALTER COLUMN urgencia_tope_monto SET NOT NULL;
CREATE OR REPLACE FUNCTION public.aceptar_documentos_guarderia(p_familia_id uuid, p_aceptaciones jsonb, p_urgencia_tope_monto numeric, p_urgencia_tope_moneda text, p_contactos jsonb, p_contacto_alternativo jsonb DEFAULT NULL::jsonb, p_redes_autorizadas boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_user uuid := auth.uid(); v_n int := 0; v_it jsonb; v_faltan jsonb;
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

  /* ═══ EL ACTO UNICO: SI NO VIENE LA LISTA, LA RESUELVE EL SERVIDOR ═══════
     🟢 Firma del founder (30-ago): **un solo acto de la familia produce las
     seis aceptaciones.** Ocho casillas para agendar un servicio es lo que hace
     que la familia abandone.

     El motor **ya podia** recibir las seis en una llamada —`p_aceptaciones` es
     un array— asi que el acto unico no necesito migracion. Lo que se mueve
     aca es OTRA cosa, y es POR el acto unico:

     🔴 **quien decide CUALES son los seis deja de ser el bundle.** Con seis
     casillas, mandar cinco era una eleccion de la familia. Con UN acto, mandar
     cinco es un BUG — y su sintoma es una familia a la que le dijimos que si y
     queda en `faltan` sin entender por que. Pasando `p_aceptaciones => NULL`,
     el servidor toma **los vigentes AL MOMENTO DEL ACTO**, que ademas es lo
     que la prueba de aceptacion tiene que decir: *lo que estaba vigente en ese
     timestamp, no lo que el bundle creia.*

     ⚠️ Compatible hacia atras: con lista explicita se comporta igual que
     siempre. NULL antes no hacia nada util (COALESCE a `[]` = cero aceptadas). */
  IF p_aceptaciones IS NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo', v.codigo, 'version', v.version)), '[]'::jsonb)
      INTO p_aceptaciones FROM public.obtener_documentos_guarderia() v;
  END IF;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_aceptaciones) LOOP
    INSERT INTO guarderia_aceptaciones (familia_id, documento_codigo, documento_version, aceptado_por)
         VALUES (p_familia_id, v_it->>'codigo', (v_it->>'version')::int, v_user)
    ON CONFLICT DO NOTHING;   -- aceptar dos veces la misma versión es idempotente
    v_n := v_n + 1;
  END LOOP;

  /* 🔴 EL RETORNO DICE SI QUEDO ALGO AFUERA. Antes devolvia solo un conteo:
     «aceptadas: 5» se lee como exito, y la familia quedaba trabada en `faltan`
     con una pantalla que le habia dicho que si. *Un contador no es un
     veredicto.* */
  SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo', v.codigo, 'version', v.version)
                            ORDER BY v.codigo), '[]'::jsonb)
    INTO v_faltan
    FROM public.obtener_documentos_guarderia() v
   WHERE NOT EXISTS (SELECT 1 FROM guarderia_aceptaciones a
                      WHERE a.familia_id = p_familia_id
                        AND a.documento_codigo = v.codigo
                        AND a.documento_version = v.version);

  RETURN jsonb_build_object('ok', true, 'aceptadas', v_n,
                            'al_dia', jsonb_array_length(v_faltan) = 0,
                            'faltantes', v_faltan);
END $function$
;
COMMIT;
