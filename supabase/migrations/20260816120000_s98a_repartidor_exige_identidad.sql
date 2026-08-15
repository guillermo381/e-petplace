-- S98-A · PASO ④ DEL TREN — LA OBLIGATORIEDAD BAJA A LA PUERTA
--
-- ═══ LAS DOS PRECONDICIONES, VERIFICADAS ANTES DE APLICAR ══════════════════
-- El disparo de esta migración estaba escrito en
-- `scripts/s98/PENDIENTE-repartidor-exige-identidad.sql` con dos preguntas
-- medibles. **Las dos se midieron, no se supusieron:**
--
--   ① ¿`main` tiene la pantalla que exige? ✅ `aa9e46d0` mergeado en `584003ba`
--      — el CTA pide foto de la persona y WhatsApp, y **dice cuál falta**.
--   ② ¿el OTA está APLICADO en el aparato? ✅ **`update 01a00355` LEÍDO EN
--      PANTALLA** (Cuenta › pie), no en el reporte del publish.
--      *L-138: el gate empieza confirmando qué está corriendo, no qué se subió.*
--
-- Y el camino feliz se caminó con foto REAL antes de cerrar la puerta: cámara
-- del sistema → `cuenta-documentos/<cuenta>/repartidor-persona-….jpg`,
-- **220.942 bytes medidos en `storage.objects`** (el resize a 1600 hizo su
-- trabajo), con `tipo_documento=CEDULA` validado contra su máscara y el
-- `whatsapp` compuesto a `+593988777333` por la pantalla.
--
-- > ***Cerrar la puerta antes de caminar el camino habría dejado el único
-- > pedazo que ningún arnés puede medir sin medir nunca.***
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 76(g) — VEDA: **NO RIGE**. Reemplazo de una función, cero backfill.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ═══ 🔴 CÓDIGO NUEVO, NO REUSADO — Y LA RAZÓN IMPORTA ══════════════════════
-- `foto_requerida` **ya existe** en la unión, y su voz dice *«La entrega en
-- puerta se cierra con su foto»* — es de la ENTREGA. Reusarlo acá le daría al
-- vendedor un mensaje sobre entregas mientras da de alta a una persona.
--
-- > ***Un código con dos significados es peor que dos códigos:*** el primero
-- > que se escribe gana la voz, y el segundo hereda una frase que habla de
-- > otra cosa. (Precedente medido: el `'otro'` de S72.)
--
-- ⇒ nacen `foto_persona_requerida` y `whatsapp_requerido`.
--
-- ═══ ⚠️ EL GUARD **NO** VA EN `actualizar_repartidor`, Y ES DELIBERADO ══════
-- Los repartidores anteriores a S98 nacieron sin foto ni WhatsApp. Exigirlos
-- al ACTUALIZAR los volvería **incorregibles**: no se les podría ni cambiar el
-- nombre ni apagar el `activo` sin antes conseguir una foto que quizás nadie
-- tiene. *Un guard que impide arreglar lo que ya está mal no protege: atrapa.*

BEGIN;

CREATE OR REPLACE FUNCTION public.registrar_repartidor(
  p_cuenta_comercial_id uuid,
  p_nombre              text,
  p_documento           text,
  p_telefono            text DEFAULT NULL,
  p_user_id             uuid DEFAULT NULL,
  p_tipo_documento      text DEFAULT NULL,
  p_documento_foto_path text DEFAULT NULL,
  p_foto_path           text DEFAULT NULL,
  p_whatsapp            text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $function$
DECLARE v_id uuid; v_existente uuid; v_pais text; v_tel text; v_wa text;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_nombre IS NULL OR length(btrim(p_nombre)) = 0 THEN
    RAISE EXCEPTION 'nombre_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_documento IS NULL OR length(btrim(p_documento)) = 0 THEN
    RAISE EXCEPTION 'documento_requerido' USING ERRCODE = '22023';
  END IF;

  -- ── LOS DOS OBLIGATORIOS (firma del founder, leída igual por A y por C) ──
  -- «foto del repartidor, **obligatoria**» · «WhatsApp **no opcional**».
  -- Van ANTES del chequeo de idempotencia a propósito: un alta incompleta no
  -- debe poder «pasar» devolviendo el id de una fila que ya existía.
  IF p_foto_path IS NULL OR length(btrim(p_foto_path)) = 0 THEN
    RAISE EXCEPTION 'foto_persona_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_whatsapp IS NULL OR length(btrim(p_whatsapp)) = 0 THEN
    RAISE EXCEPTION 'whatsapp_requerido' USING ERRCODE = '22023';
  END IF;

  v_tel := NULLIF(btrim(COALESCE(p_telefono,'')),'');
  v_wa  := NULLIF(btrim(COALESCE(p_whatsapp,'')),'');
  IF v_tel IS NOT NULL AND v_tel !~ '^\+[1-9][0-9]{6,14}$' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;

  v_pais := 'EC';
  PERFORM _valida_identidad_repartidor(v_pais, p_tipo_documento, p_documento, v_wa);

  SELECT id INTO v_existente FROM repartidores
   WHERE cuenta_comercial_id = p_cuenta_comercial_id AND documento = btrim(p_documento);
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'repartidor_id', v_existente, 'ya_existia', true);
  END IF;

  INSERT INTO repartidores (
      cuenta_comercial_id, nombre, documento, telefono, user_id,
      tipo_documento, documento_foto_path, foto_path, whatsapp)
    VALUES (
      p_cuenta_comercial_id, btrim(p_nombre), btrim(p_documento), v_tel, p_user_id,
      NULLIF(btrim(COALESCE(p_tipo_documento,'')),''),
      NULLIF(btrim(COALESCE(p_documento_foto_path,'')),''),
      NULLIF(btrim(COALESCE(p_foto_path,'')),''),
      v_wa)
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', v_id, 'ya_existia', false);
END $function$;

REVOKE ALL ON FUNCTION public.registrar_repartidor(uuid,text,text,text,uuid,text,text,text,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_repartidor(uuid,text,text,text,uuid,text,text,text,text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN CON DISCRIMINADOR
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_cc uuid; v_admin uuid; v_rep uuid; v_viejo uuid; v_residuo int; v_sc int;
  v_r_foto boolean := false; v_r_wa boolean := false;
BEGIN
  SELECT count(*) INTO v_sc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='registrar_repartidor';
  IF v_sc <> 1 THEN
    RAISE EXCEPTION 'CINTURON ROJO: % sobrecargas de registrar_repartidor — el alta podria entrar por la puerta sin guard.', v_sc;
  END IF;

  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'CINTURON ABORTA: sin admin activo no se ejerce la puerta por su camino.'; END IF;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);

  SELECT cuenta_comercial_id INTO v_cc FROM repartidores ORDER BY created_at LIMIT 1;

  -- ── ROJO ①: sin foto ──
  BEGIN
    PERFORM registrar_repartidor(v_cc, 'Guard A', '1712345601', NULL, NULL, NULL, NULL, NULL, '+593999000111');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%foto_persona_requerida%' THEN v_r_foto := true;
    ELSE RAISE EXCEPTION 'CINTURON ABORTA: el brazo de la foto reboto por otra cosa: %', SQLERRM; END IF;
  END;
  IF NOT v_r_foto THEN RAISE EXCEPTION 'CINTURON ROJO: la puerta ACEPTO un alta SIN foto.'; END IF;

  -- ── ROJO ②: sin whatsapp ──
  BEGIN
    PERFORM registrar_repartidor(v_cc, 'Guard B', '1712345602', NULL, NULL, NULL, NULL, 'x/y.jpg', NULL);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%whatsapp_requerido%' THEN v_r_wa := true;
    ELSE RAISE EXCEPTION 'CINTURON ABORTA: el brazo del whatsapp reboto por otra cosa: %', SQLERRM; END IF;
  END;
  IF NOT v_r_wa THEN RAISE EXCEPTION 'CINTURON ROJO: la puerta ACEPTO un alta SIN whatsapp.'; END IF;

  -- ── VERDE ③: el alta COMPLETA sigue entrando ──
  --    Sin este brazo, un guard que rechazara TODO daria verde en los dos
  --    rojos de arriba y habria matado el alta entera.
  v_rep := (registrar_repartidor(v_cc, 'Guard OK', '1712345603', NULL, NULL,
                                 NULL, NULL, 'ruta/foto.jpg', '+593999000222')->>'repartidor_id')::uuid;
  IF v_rep IS NULL THEN RAISE EXCEPTION 'CINTURON ROJO: el alta COMPLETA dejo de entrar.'; END IF;

  -- ── 🔴 VERDE ④, EL QUE IMPORTA: un repartidor VIEJO (sin foto) SIGUE
  --    siendo corregible. Si este brazo se pone rojo, el guard se filtro a
  --    `actualizar` y hay repartidores atrapados que ni se pueden apagar.
  SELECT id INTO v_viejo FROM repartidores WHERE foto_path IS NULL LIMIT 1;
  IF v_viejo IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: no quedan repartidores SIN foto — el brazo que prueba que los viejos siguen corregibles no se puede ejercer.';
  END IF;
  PERFORM actualizar_repartidor(v_viejo, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

  -- ── TEARDOWN con residuo MEDIDO ──
  DELETE FROM repartidores WHERE id = v_rep;
  SELECT count(*) INTO v_residuo FROM repartidores WHERE nombre LIKE 'Guard %';
  IF v_residuo <> 0 THEN RAISE EXCEPTION 'CINTURON ABORTA: residuo (% filas)', v_residuo; END IF;

  RAISE NOTICE 'CINTURON OK · 1 sobrecarga · 2 rojos hablados · el alta completa entra · el viejo sin foto SIGUE corregible · residuo 0';
END;
$cinturon$;

COMMIT;
