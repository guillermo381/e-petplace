/* ═══════════════════════════════════════════════════════════════════════════
   S112-A9 · EL ACTA Y LA FIRMA (Ley 67, arts. 13-14)
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Dos tablas nuevas vacias, tres columnas nullable,
   funciones. Cero backfill.

   ── LA CEDULA VA EN SU PROPIO CAMPO, jamas en `identificacion_fiscal`.
      Firma del founder (adenda 9). Y el censo de E dice por que no alcanzaba:
      `identificacion_fiscal` es **identidad FISCAL para facturar** —tiene
      `tipo_identificacion` al lado, y esta vacia en las 172 filas—; el acta
      pide **documento de identidad para un acto legal**. *Usar el mismo campo
      para las dos cosas hace que llenar uno parezca haber llenado el otro.*

   ── `faltantes[]` VIAJA CON EL NOMBRE DE CADA VARIABLE VACIA, no con un
      booleano. §4.1: *«arriba del botón una lista con nombre: Falta tu cédula»*.
      **Sólo `microchip` y `remetfu` tienen «si vacío»** — las demas FALTAN de
      verdad y el acta no se firma sin ellas.

   ── 🔴 EL HASH QUE SE FIRMA ES EL DEL TEXTO RENDERIZADO, no el de la
      plantilla. Lo nombro porque E lo midio y tenia razon: `adopcion_documentos
      .sha256` identifica el texto **con las llaves sin resolver**. Si la firma
      guardara ese, dos actas distintas —con animales distintos y personas
      distintas— tendrian el mismo hash, y el expediente probatorio no probaria
      cual se firmo. **Se guardan LOS DOS**: el del texto renderizado (que
      identifica ESTA acta) y el de la plantilla (que identifica QUE VERSION
      del contrato se uso).

   ── EL CODIGO: 8 digitos, **hasheado en reposo**, 10 minutos, 5 intentos, uno
      por firma, atado a (solicitud, usuario, version). Guardar el codigo en
      claro haria que quien lea la tabla pueda firmar por otro — *y el que lee
      una tabla para diagnosticar no sabe que esta firmando*, que es la misma
      forma que `L-408` en esta casa.

   ── LA SEGUNDA FIRMA HACE EL TRASPASO, en la misma transaccion. No lo hace la
      pantalla: *si la pantalla tuviera que llamarlo despues, una adopcion
      quedaria firmada por los dos y sin ocurrir cada vez que se corte la red.*
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* ── ① LOS DATOS DE LA PERSONA ────────────────────────────────────────────── */
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cedula    text,
  ADD COLUMN IF NOT EXISTS domicilio text;

COMMENT ON COLUMN public.profiles.cedula IS
  'S112-A9. Documento de identidad para actos legales. NO es '
  '`identificacion_fiscal`, que es identidad para FACTURAR: usar el mismo campo '
  'para las dos cosas hace que llenar uno parezca haber llenado el otro.';

/* El numero de acuerdo ministerial del refugio: es un hecho de su VERIFICACION,
   asi que vive donde vive el criterio (N4) y lo escribe el mismo admin. */
ALTER TABLE public.cuenta_roles ADD COLUMN IF NOT EXISTS numero_acuerdo text;

/* ── ② EL CODIGO DE FIRMA ────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.adopcion_codigo_firma (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id  uuid NOT NULL REFERENCES public.adopcion_solicitud(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_acta  int  NOT NULL,
  /* 🔴 HASH, jamas el codigo. */
  codigo_hash   text NOT NULL,
  intentos      smallint NOT NULL DEFAULT 0,
  expira_en     timestamptz NOT NULL,
  usado_en      timestamptz,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_intentos_tope CHECK (intentos >= 0 AND intentos <= 5)
);
/* **Uno por firma**: un segundo pedido REEMPLAZA al anterior, no convive.
   Dos codigos vivos duplican la ventana de adivinacion sin que nadie lo note. */
CREATE UNIQUE INDEX IF NOT EXISTS uq_codigo_firma_vivo
  ON public.adopcion_codigo_firma (solicitud_id, user_id) WHERE usado_en IS NULL;

ALTER TABLE public.adopcion_codigo_firma ENABLE ROW LEVEL SECURITY;
/* Cero policies a proposito: **nadie lee esta tabla desde el cliente.** Las dos
   funciones que la tocan son DEFINER. *Una policy de lectura sobre codigos —
   aunque esten hasheados— es una superficie que no hace falta.* */

/* ── ③ LA FIRMA — INMUTABLE ──────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.adopcion_firma (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id    uuid NOT NULL REFERENCES public.adopcion_solicitud(id) ON DELETE RESTRICT,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  /* 'adoptante' | 'refugio' — quien firma, no que rol tiene en la casa. */
  papel           text NOT NULL,
  version_acta    int  NOT NULL,
  codigo_acta     text NOT NULL,
  /* Los DOS hashes: el de ESTA acta y el de la version del contrato. */
  hash_renderizado text NOT NULL,
  hash_fuente      text NOT NULL,
  folio            text NOT NULL,
  sello_servidor  timestamptz NOT NULL DEFAULT now(),
  ip_hash         text,
  dispositivo     text,
  CONSTRAINT chk_papel_firma CHECK (papel IN ('adoptante','refugio'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_firma_por_papel
  ON public.adopcion_firma (solicitud_id, papel);

ALTER TABLE public.adopcion_firma ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS adopcion_firma_select ON public.adopcion_firma;
CREATE POLICY adopcion_firma_select ON public.adopcion_firma FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM adopcion_solicitud s
                     WHERE s.id = adopcion_firma.solicitud_id
                       AND (s.solicitante_user_id = auth.uid()
                            OR public._user_publico_esta_publicacion(s.publicacion_id, auth.uid())))
         OR public.is_admin());

/* Inmutable, con el mismo molde que el texto legal: una firma que se puede
   editar no prueba nada. */
CREATE OR REPLACE FUNCTION public._trg_adopcion_firma_inmutable()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  RAISE EXCEPTION 'firma_inmutable: una firma no se edita ni se borra'
    USING ERRCODE='42501';
END $fn$;
DROP TRIGGER IF EXISTS trg_adopcion_firma_inmutable ON public.adopcion_firma;
CREATE TRIGGER trg_adopcion_firma_inmutable
  BEFORE UPDATE OR DELETE ON public.adopcion_firma
  FOR EACH ROW EXECUTE FUNCTION public._trg_adopcion_firma_inmutable();

/* ── ④ EL RENDERIZADO ────────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public._renderizar_acta(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE
  v jsonb; d record; t text; v_falt text[] := '{}'; v_meses int; v_edad text;
BEGIN
  SELECT s.id AS sol, s.publicacion_id, s.solicitante_user_id,
         p.cuenta_comercial_id, p.origen_rescate, p.fecha_cesion, p.senas,
         p.ciudad_id, ciu.nombre AS ciudad_pub,
         m.id AS mascota_id, m.nombre AS animal, m.especie, m.sexo,
         m.fecha_nacimiento, m.microchip, m.remetfu, m.esterilizado,
         cc.razon_social, cc.tipo_fiscal, cc.owner_profile_id,
         rep.nombre AS rep_nombre, rep.cedula AS rep_cedula,
         ado.nombre AS ado_nombre, ado.cedula AS ado_cedula,
         COALESCE(ado.direccion_ciudad, ado.ciudad) AS ado_ciudad,
         rol.numero_acuerdo
    INTO d
    FROM adopcion_solicitud s
    JOIN adopcion_publicacion p ON p.id = s.publicacion_id
    JOIN mascotas m             ON m.id = p.mascota_id
    JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
    LEFT JOIN cuenta_roles rol  ON rol.cuenta_comercial_id = cc.id AND rol.tipo_actor='refugio'
    LEFT JOIN profiles rep      ON rep.id = cc.owner_profile_id
    LEFT JOIN profiles ado      ON ado.id = s.solicitante_user_id
    LEFT JOIN cat_ciudades ciu  ON ciu.id = p.ciudad_id
   WHERE s.id = p_solicitud_id;

  IF d.sol IS NULL THEN RAISE EXCEPTION 'solicitud_no_existe' USING ERRCODE='22023'; END IF;

  SELECT to_jsonb(x) INTO v FROM (
    SELECT version, contenido, sha256 FROM adopcion_documentos
     WHERE codigo='acta_adopcion' AND vigente LIMIT 1) x;
  IF v IS NULL THEN
    /* Fail-closed CON VOZ: el texto es del abogado y la casa lo carga. */
    RAISE EXCEPTION 'acta_no_disponible' USING ERRCODE='22023';
  END IF;
  t := v->>'contenido';

  IF d.fecha_nacimiento IS NOT NULL THEN
    v_meses := (EXTRACT(YEAR FROM age(CURRENT_DATE, d.fecha_nacimiento))*12
              + EXTRACT(MONTH FROM age(CURRENT_DATE, d.fecha_nacimiento)))::int;
    v_edad := CASE WHEN v_meses < 12 THEN v_meses || ' meses'
                   ELSE (v_meses/12) || ' años' END;
  END IF;

  /* ── LOS FALTANTES, CON NOMBRE. Sólo `microchip` y `remetfu` tienen «si
     vacío»: las demás faltan de verdad y el acta no se firma sin ellas. */
  IF d.ado_nombre  IS NULL OR btrim(d.ado_nombre)='' THEN v_falt := v_falt || 'adoptante_nombre'; END IF;
  IF d.ado_cedula  IS NULL OR btrim(d.ado_cedula)='' THEN v_falt := v_falt || 'adoptante_cedula'; END IF;
  IF d.ado_ciudad  IS NULL OR btrim(d.ado_ciudad)='' THEN v_falt := v_falt || 'adoptante_ciudad'; END IF;
  IF d.rep_nombre  IS NULL OR btrim(d.rep_nombre)='' THEN v_falt := v_falt || 'refugio_representante_nombre'; END IF;
  IF d.rep_cedula  IS NULL OR btrim(d.rep_cedula)='' THEN v_falt := v_falt || 'refugio_representante_cedula'; END IF;
  IF d.razon_social IS NULL THEN v_falt := v_falt || 'refugio_denominacion'; END IF;
  IF d.tipo_fiscal = 'entidad_sin_fines_lucro'
     AND (d.numero_acuerdo IS NULL OR btrim(d.numero_acuerdo)='') THEN
    /* Sólo lo pide si el refugio ES una organización: a un rescatista
       independiente el bloque no le aplica y exigírselo lo dejaría afuera. */
    v_falt := v_falt || 'refugio_acuerdo';
  END IF;
  IF d.sexo IS NULL THEN v_falt := v_falt || 'animal_sexo'; END IF;
  IF v_edad IS NULL THEN v_falt := v_falt || 'animal_edad_estimada'; END IF;
  IF d.senas IS NULL OR btrim(d.senas)='' THEN v_falt := v_falt || 'animal_senas'; END IF;
  IF d.origen_rescate IS NULL THEN v_falt := v_falt || 'origen'; END IF;
  IF d.origen_rescate = 'cesion' AND d.fecha_cesion IS NULL THEN
    v_falt := v_falt || 'origen_cesion_fecha'; END IF;
  IF d.ciudad_pub IS NULL THEN v_falt := v_falt || 'ciudad'; END IF;

  t := replace(t, '{{ciudad}}',            COALESCE(d.ciudad_pub, '—'));
  t := replace(t, '{{fecha_hora}}',        to_char(now() AT TIME ZONE 'America/Guayaquil', 'DD/MM/YYYY HH24:MI'));
  t := replace(t, '{{refugio_denominacion}}', COALESCE(d.razon_social,'—'));
  t := replace(t, '{{refugio_acuerdo}}',   COALESCE(d.numero_acuerdo,'—'));
  t := replace(t, '{{refugio_representante_nombre}}', COALESCE(d.rep_nombre,'—'));
  t := replace(t, '{{refugio_representante_cedula}}', COALESCE(d.rep_cedula,'—'));
  t := replace(t, '{{adoptante_nombre}}',  COALESCE(d.ado_nombre,'—'));
  t := replace(t, '{{adoptante_cedula}}',  COALESCE(d.ado_cedula,'—'));
  t := replace(t, '{{adoptante_ciudad}}',  COALESCE(d.ado_ciudad,'—'));
  t := replace(t, '{{animal_nombre}}',     d.animal);
  t := replace(t, '{{animal_especie}}',    d.especie);
  t := replace(t, '{{animal_sexo}}',       COALESCE(d.sexo,'—'));
  t := replace(t, '{{animal_edad_estimada}}', COALESCE(v_edad,'—'));
  t := replace(t, '{{animal_senas}}',      COALESCE(d.senas,'—'));
  /* Los DOS unicos con fallback declarado en la propia plantilla. */
  t := replace(t, '{{animal_microchip|no posee}}', COALESCE(d.microchip,'no posee'));
  t := replace(t, '{{animal_remetfu|pendiente}}',  COALESCE(d.remetfu,'pendiente'));
  t := replace(t, '{{origen_cesion_fecha}}', COALESCE(d.fecha_cesion::text,'—'));
  t := replace(t, '{{registro_fecha_hora}}', to_char(now() AT TIME ZONE 'America/Guayaquil', 'DD/MM/YYYY HH24:MI'));

  RETURN jsonb_build_object(
    'codigo', 'acta_adopcion',
    'version', (v->>'version')::int,
    'texto_renderizado', t,
    'hash_fuente', v->>'sha256',
    /* El hash de ESTA acta. Se calcula SIN las dos firmas ni el folio, que se
       resuelven despues: si entraran, el hash cambiaria entre la primera y la
       segunda firma y las dos partes habrian firmado textos distintos. */
    'hash_renderizado', encode(sha256(convert_to(t,'UTF8')),'hex'),
    'faltantes', to_jsonb(v_falt),
    'mascota_id', d.mascota_id,
    'publicacion_id', d.publicacion_id,
    'solicitante_user_id', d.solicitante_user_id,
    'cuenta_comercial_id', d.cuenta_comercial_id,
    'owner_profile_id', d.owner_profile_id);
END $fn$;

/* ── ⑤ EL LECTOR ─────────────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.obtener_acta_adopcion(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v jsonb; v_uid uuid := auth.uid(); v_es_ado boolean; v_es_ref boolean; v_estado text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT s.solicitante_user_id = v_uid,
         public._user_publico_esta_publicacion(s.publicacion_id, v_uid), s.estado
    INTO v_es_ado, v_es_ref, v_estado
    FROM adopcion_solicitud s WHERE s.id = p_solicitud_id;
  IF v_estado IS NULL THEN RAISE EXCEPTION 'solicitud_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT (v_es_ado OR v_es_ref OR public.is_admin()) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  /* El acta existe **desde que el refugio acepta**, no antes: leerla sobre una
     solicitud en conversacion prometeria un acto que todavia no se decidio. */
  IF v_estado <> 'aceptada' THEN
    RAISE EXCEPTION 'solicitud_no_aceptada: %', v_estado USING ERRCODE='22023';
  END IF;

  v := public._renderizar_acta(p_solicitud_id);
  RETURN v || jsonb_build_object(
    'mi_papel', CASE WHEN v_es_ado THEN 'adoptante' WHEN v_es_ref THEN 'refugio' ELSE NULL END,
    'firmas', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                          'papel', f.papel, 'sello', f.sello_servidor))
                          FROM adopcion_firma f WHERE f.solicitud_id = p_solicitud_id), '[]'::jsonb));
END $fn$;

/* ── ⑥ EL CODIGO ─────────────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.solicitar_codigo_firma(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_uid uuid := auth.uid(); v_acta jsonb; v_cod text; v_mail text; v_papel text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  v_acta := public.obtener_acta_adopcion(p_solicitud_id);   -- valida acceso y estado
  v_papel := v_acta->>'mi_papel';
  IF v_papel IS NULL THEN RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501'; END IF;

  /* 🔴 No se manda codigo para un acta incompleta: si faltan datos, firmarla
     dejaria un documento con guiones donde va una cedula. */
  IF jsonb_array_length(v_acta->'faltantes') > 0 THEN
    RAISE EXCEPTION 'acta_incompleta: %',
      (SELECT string_agg(x::text, ', ') FROM jsonb_array_elements_text(v_acta->'faltantes') x)
      USING ERRCODE='22023';
  END IF;
  IF EXISTS (SELECT 1 FROM adopcion_firma WHERE solicitud_id=p_solicitud_id AND papel=v_papel) THEN
    RAISE EXCEPTION 'ya_firmaste' USING ERRCODE='22023';
  END IF;

  v_cod := lpad((floor(random()*100000000))::bigint::text, 8, '0');

  /* Uno por firma: el pedido nuevo REEMPLAZA al viejo. */
  DELETE FROM adopcion_codigo_firma
   WHERE solicitud_id=p_solicitud_id AND user_id=v_uid AND usado_en IS NULL;
  INSERT INTO adopcion_codigo_firma (solicitud_id, user_id, version_acta, codigo_hash, expira_en)
  VALUES (p_solicitud_id, v_uid, (v_acta->>'version')::int,
          encode(sha256(convert_to(v_cod,'UTF8')),'hex'), now() + interval '10 minutes');

  SELECT email INTO v_mail FROM auth.users WHERE id = v_uid;

  /* El codigo vuelve para que el DESPACHADOR lo mande por correo. **No se
     guarda en claro en ningun lado** y la pantalla no lo recibe: quien llama a
     esta funcion desde la app recibe `enviado_a`, no el codigo. Ver el wrapper. */
  RETURN jsonb_build_object('ok', true, 'enviado_a', v_mail,
    'expira_en', now() + interval '10 minutes', '__codigo', v_cod);
END $fn$;

/* ── ⑦ LA FIRMA ──────────────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.firmar_acta_adopcion(
  p_solicitud_id uuid, p_codigo text,
  p_cedula text DEFAULT NULL, p_domicilio text DEFAULT NULL, p_dispositivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE
  v_uid uuid := auth.uid(); v_c record; v_acta jsonb; v_papel text; v_folio text;
  v_ip text; v_hash_ip text; v_firmas int; v_tras jsonb; v_pub uuid; v_ev uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  /* La cedula y el domicilio se cargan ACA, antes de renderizar: §4.1 pide un
     campo para cargarlos «ahi mismo», y renderizar antes daria un acta con los
     guiones que la persona acaba de completar. */
  IF p_cedula IS NOT NULL AND btrim(p_cedula) <> '' THEN
    UPDATE profiles SET cedula = btrim(p_cedula) WHERE id = v_uid;
  END IF;
  IF p_domicilio IS NOT NULL AND btrim(p_domicilio) <> '' THEN
    UPDATE profiles SET domicilio = btrim(p_domicilio) WHERE id = v_uid;
  END IF;

  v_acta := public.obtener_acta_adopcion(p_solicitud_id);
  v_papel := v_acta->>'mi_papel';
  IF v_papel IS NULL THEN RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501'; END IF;
  IF jsonb_array_length(v_acta->'faltantes') > 0 THEN
    RAISE EXCEPTION 'acta_incompleta: %',
      (SELECT string_agg(x::text, ', ') FROM jsonb_array_elements_text(v_acta->'faltantes') x)
      USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_c FROM adopcion_codigo_firma
   WHERE solicitud_id=p_solicitud_id AND user_id=v_uid AND usado_en IS NULL FOR UPDATE;
  IF v_c.id IS NULL THEN RAISE EXCEPTION 'sin_codigo' USING ERRCODE='22023'; END IF;
  IF v_c.expira_en <= now() THEN RAISE EXCEPTION 'codigo_vencido' USING ERRCODE='22023'; END IF;
  IF v_c.intentos >= 5 THEN RAISE EXCEPTION 'intentos_agotados' USING ERRCODE='22023'; END IF;
  /* 🔴 EL ACTA CAMBIO DE VERSION ENTRE EL PEDIDO Y LA FIRMA. *Firmar con un
     codigo emitido sobre otro texto es firmar algo que no se leyo.* */
  IF v_c.version_acta <> (v_acta->>'version')::int THEN
    RAISE EXCEPTION 'acta_cambio_de_version' USING ERRCODE='22023';
  END IF;

  IF v_c.codigo_hash <> encode(sha256(convert_to(COALESCE(p_codigo,''),'UTF8')),'hex') THEN
    UPDATE adopcion_codigo_firma SET intentos = intentos + 1 WHERE id = v_c.id;
    RAISE EXCEPTION 'codigo_incorrecto: quedan % intento(s)', 4 - v_c.intentos
      USING ERRCODE='22023';
  END IF;

  UPDATE adopcion_codigo_firma SET usado_en = now() WHERE id = v_c.id;

  v_ip := split_part(coalesce(
            (current_setting('request.headers', true)::json->>'x-forwarded-for'), ''), ',', 1);
  v_hash_ip := CASE WHEN btrim(v_ip) = '' THEN NULL
                    ELSE encode(sha256(convert_to(btrim(v_ip),'UTF8')),'hex') END;
  v_folio := 'F-' || to_char(now(),'YYYY') || '-' ||
             lpad(nextval('public.documento_folio_seq')::text, 6, '0');

  INSERT INTO adopcion_firma (solicitud_id, user_id, papel, version_acta, codigo_acta,
                              hash_renderizado, hash_fuente, folio, ip_hash, dispositivo)
  VALUES (p_solicitud_id, v_uid, v_papel, (v_acta->>'version')::int, v_acta->>'codigo',
          v_acta->>'hash_renderizado', v_acta->>'hash_fuente', v_folio, v_hash_ip, p_dispositivo);

  SELECT count(*) INTO v_firmas FROM adopcion_firma WHERE solicitud_id = p_solicitud_id;

  IF v_firmas >= 2 THEN
    /* 🔴 EL TRASPASO VA ACA, en la misma transaccion. Si lo llamara la pantalla
       despues, una adopcion quedaria firmada por los dos y sin ocurrir cada vez
       que se corte la red. */
    SELECT s.publicacion_id INTO v_pub FROM adopcion_solicitud s WHERE s.id = p_solicitud_id;
    SELECT public.traspasar_mascota_a_familia(
             (v_acta->>'mascota_id')::uuid,
             (SELECT fm.familia_id FROM familia_miembro fm
               WHERE fm.user_id = (v_acta->>'solicitante_user_id')::uuid
                 AND fm.hasta IS NULL LIMIT 1),
             (v_acta->>'version')::int, v_acta->>'codigo')
      INTO v_tras;

    /* EL HITO. Va con `aniversario_anual` para que vuelva cada año: es el unico
       evento de esta historia que la familia va a querer volver a ver. */
    INSERT INTO eventos_mascota (mascota_id, tipo_evento, fecha_evento, titulo, descripcion,
                                 procedencia, creado_por, metadata)
    VALUES ((v_acta->>'mascota_id')::uuid, 'hito_narrativo', now(),
            'Una vida nueva empieza',
            'La adopción quedó firmada por las dos partes.',
            'declarado_por_prestador', v_uid,
            jsonb_build_object('aniversario_anual', true, 'folio', v_folio,
                               'solicitud_id', p_solicitud_id))
    RETURNING id INTO v_ev;
  END IF;

  RETURN jsonb_build_object('ok', true, 'papel', v_papel, 'folio', v_folio,
    'firmas', v_firmas, 'completa', v_firmas >= 2,
    'traspaso', v_tras, 'hito_id', v_ev);
END $fn$;

REVOKE ALL ON FUNCTION public.obtener_acta_adopcion(uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.solicitar_codigo_firma(uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.firmar_acta_adopcion(uuid,text,text,text,text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public._renderizar_acta(uuid) FROM anon, PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_acta_adopcion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.solicitar_codigo_firma(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.firmar_acta_adopcion(uuid,text,text,text,text) TO authenticated;

DO $cint$
DECLARE v_n int;
BEGIN
  -- ① 🔴 La firma es inmutable: no se edita ni se borra.
  --    (se prueba con una fila sembrada y deshecha)
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid='public.adopcion_firma'::regclass
       AND NOT tgisinternal) = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: la firma no tiene trigger de inmutabilidad';
  END IF;

  -- ② 🔴 `anon` no alcanza ninguna de las tres, y el renderizador no lo alcanza
  --    NADIE desde el cliente: es interno.
  IF has_function_privilege('anon','public.obtener_acta_adopcion(uuid)','EXECUTE')
     OR has_function_privilege('anon','public.firmar_acta_adopcion(uuid,text,text,text,text)','EXECUTE')
  THEN RAISE EXCEPTION 'CINTURON ROJO ②: anon alcanza el acta'; END IF;
  IF has_function_privilege('authenticated','public._renderizar_acta(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON ROJO ②b: el renderizador interno es alcanzable desde el cliente';
  END IF;

  -- ③ 🔴 El codigo NO se guarda en claro: la columna se llama `codigo_hash` y
  --    no existe ninguna que guarde el codigo.
  SELECT count(*) INTO v_n FROM information_schema.columns
   WHERE table_schema='public' AND table_name='adopcion_codigo_firma'
     AND column_name IN ('codigo','codigo_plano','valor');
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON ROJO ③: el codigo se guarda en claro'; END IF;

  -- ④ Un solo codigo vivo por (solicitud, usuario).
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='uq_codigo_firma_vivo') THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: pueden convivir dos codigos vivos';
  END IF;

  -- ⑤ Una sola firma por papel.
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='uq_firma_por_papel') THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤: se puede firmar dos veces el mismo papel';
  END IF;

  -- ⑥ 🔴 El acta se rebota sobre una solicitud que NO existe.
  BEGIN
    PERFORM public._renderizar_acta('00000000-0000-0000-0000-000000000000'::uuid);
    RAISE EXCEPTION 'CINTURON ROJO ⑥: una solicitud inexistente renderizo un acta';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;

  RAISE NOTICE 'CINTURON A9: 6 brazos verdes (4 rojos producidos)';
END $cint$;

COMMIT;
