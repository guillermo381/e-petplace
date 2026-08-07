-- ═══════════════════════════════════════════════════════════════════════════
-- S90-D → aplicada por A · EL CERTIFICADO DE SALUD (el cuarto papel de D,
-- quinto del producto)
--
-- ORIGEN: el SQL LITERAL de la pista D
-- (docs/relevamientos/2026-08-07-s90d-SQL-PARA-A-certificado.sql, commit
-- 074ba693). Las secciones ①-④bis van VERBATIM — tabla inmutable con emisor
-- congelado, RLS, la RPC de emisión con sus TRES gates (capacidad clínica
-- por el helper único · matrícula LITERAL sin gracia · memorial estructural),
-- y los dos lectores.
--
-- ⚠️ ADAPTACIÓN DECLARADA (la sección ⑤ de D NO se aplica tal cual, y el
-- porqué está medido): D escribió contra el estado S89, ANTES de la orden 1
-- de A (migración 20260807100000). Su ⑤ colisionaba en cuatro puntos con el
-- objeto vivo: (1) DROPea `documento_token_tipo_check`, que ya no existe —
-- hoy el tipo es FK a `cat_documentos_mascota`; (2) crea `referencia_id`
-- cuando `ref_id` ya existe para el mismo concepto; (3) su CREATE OR REPLACE
-- de `emitir_token_documento` tiene la MISMA firma que la viva y la pisaría,
-- matando receta, ficha_identidad y el catálogo; (4) re-enumera los tipos a
-- mano. LA SEMÁNTICA DE D SE CONSERVA ENTERA: el certificado exige ref y el
-- ref tiene que ser DE ESTA mascota — solo cambia el punto de integración.
-- D verifica y firma, o se revierte (método §6).
--
-- 76(g) VEDA: NO RIGE — DDL aditivo + una fila estática de catálogo, cero
--   backfill, cero anclas sobre datos vivos (la declaración de D decía lo
--   mismo de su versión).
-- D-662: la firma de emitir_token_documento NO cambia (uuid,text,uuid) —
--   CREATE OR REPLACE conserva proacl; bundles vivos intactos.
-- L-140: heredado del literal de D en sus funciones + cinturón.
-- REVERSA: docs/relevamientos/2026-08-07-s90a-REVERSA-certificado-aplicado.sql
--   (adaptada de la de D, con SU nota de datos intacta: revertir BORRA actos).
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ① LA TABLA — el acto, con TODO congelado
-- ───────────────────────────────────────────────────────────────────────────
-- Los snapshots no son redundancia: un certificado que se reimprime tiene que
-- decir LO QUE DIJO. Si mañana la persona corrige su matrícula, o el negocio
-- cambia de dirección, o la mascota pasa a memorial, el papel ya emitido NO
-- puede cambiar de contenido — sería reescribir un documento que alguien ya
-- presentó en un mostrador.

CREATE TABLE public.certificado_salud (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id            uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  cita_id               uuid REFERENCES public.evento_cita_servicio(id) ON DELETE SET NULL,
  prestador_id          uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE RESTRICT,
  empleado_id           uuid NOT NULL REFERENCES public.prestador_empleados(id) ON DELETE RESTRICT,

  -- EL EMISOR, congelado (la persona firma; el negocio contextualiza)
  emisor_nombre         text NOT NULL,
  emisor_matricula      text NOT NULL,
  emisor_pais           text,
  negocio_nombre        text NOT NULL,
  negocio_direccion     text,
  negocio_telefono      text,

  -- EL ACTO
  alcance               text NOT NULL,
  declaracion           text NOT NULL,
  fecha_examen          date NOT NULL,
  emitido_en            timestamptz NOT NULL DEFAULT now(),
  emitido_por_user_id   uuid NOT NULL,

  -- EL PACIENTE al momento de emitir (para que el papel no mienta hacia atrás)
  estado_vida_al_emitir text NOT NULL,
  country_code          text NOT NULL DEFAULT 'EC',

  CONSTRAINT chk_certificado_alcance
    CHECK (alcance IN ('viaje', 'hospedaje', 'guarderia', 'constancia')),
  -- Ni la matrícula ni la declaración pueden ser cáscara: un papel con el
  -- campo presente y vacío es peor que uno que no se emitió.
  CONSTRAINT chk_certificado_matricula_no_vacia
    CHECK (btrim(emisor_matricula) <> ''),
  CONSTRAINT chk_certificado_declaracion_no_vacia
    CHECK (btrim(declaracion) <> ''),
  CONSTRAINT chk_certificado_estado_vida
    CHECK (estado_vida_al_emitir IN ('activa', 'perdida', 'fallecida'))
);

COMMENT ON TABLE public.certificado_salud IS
  'S90-D: el certificado de salud como ACTO. Captura el JUICIO del profesional en sus propias palabras + su alcance. INMUTABLE: corregir es emitir otro (familia D-544). NO es certificado oficial de movilizacion — eso lo emite la autoridad sanitaria.';
COMMENT ON COLUMN public.certificado_salud.declaracion IS
  'Las PALABRAS DEL PROFESIONAL. El motor jamas la deriva ni la sugiere: derivar apto de la ausencia de condiciones seria fabricar una firma que nadie dio.';
COMMENT ON COLUMN public.certificado_salud.emisor_matricula IS
  'Snapshot NOT NULL: sin matricula no se emite. Aca NO hay fallback al negocio (a diferencia de la receta) — un certificado de aptitud firmado por un negocio no certifica nada.';

CREATE INDEX idx_certificado_salud_mascota ON public.certificado_salud (mascota_id, emitido_en DESC);
CREATE INDEX idx_certificado_salud_prestador ON public.certificado_salud (prestador_id, emitido_en DESC);

-- INMUTABILIDAD: un certificado emitido no se edita ni se borra.
--
-- ⚠️ SU COSTO, DECLARADO DE ANTEMANO (precedente S71, y ahi se descubrio
-- limpiando): un trigger asi rige TAMBIEN para postgres — cuando la casa
-- quiso limpiar fixtures de `presupuesto_item`, su propio trigger de
-- inmutabilidad la freno. Aca se acepta a proposito: un certificado que el
-- operador de la DB puede editar en silencio no es un certificado. Si alguna
-- vez hay que reparar una fila, se DROPea el trigger, se repara y se repone —
-- ruidoso y trazable, que es lo que se busca.
CREATE OR REPLACE FUNCTION public._certificado_es_inmutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RAISE EXCEPTION 'certificado_inmutable: un certificado emitido no se edita ni se borra; corregir es emitir otro'
    USING ERRCODE = '22023';
END;
$function$;

CREATE TRIGGER trg_certificado_salud_inmutable
  BEFORE UPDATE OR DELETE ON public.certificado_salud
  FOR EACH ROW EXECUTE FUNCTION public._certificado_es_inmutable();

-- ───────────────────────────────────────────────────────────────────────────
-- ② RLS — la MISMA puerta del expediente, más el negocio que lo emitió
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.certificado_salud ENABLE ROW LEVEL SECURITY;

-- Solo lectura por policy. La escritura es EXCLUSIVA de la RPC DEFINER: no
-- existe policy de INSERT a proposito — un certificado que un cliente pueda
-- insertar directo es un certificado que cualquiera se firma solo.
CREATE POLICY certificado_select_acceso ON public.certificado_salud
  FOR SELECT TO authenticated
  USING (
    public.user_tiene_acceso_a_mascota(mascota_id)
    OR EXISTS (
      SELECT 1 FROM public.prestadores pr
      WHERE pr.id = certificado_salud.prestador_id
        AND public._user_opera_cuenta_comercial(pr.cuenta_comercial_id, auth.uid())
    )
  );

REVOKE ALL ON public.certificado_salud FROM PUBLIC, anon;
GRANT SELECT ON public.certificado_salud TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- ③ LA CAPTURA DEL JUICIO — la RPC de emisión
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.emitir_certificado_salud(
  p_mascota_id  uuid,
  p_alcance     text,
  p_declaracion text,
  p_cita_id     uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid        uuid := auth.uid();
  v_prestador  uuid;
  v_emp        record;
  v_cita       record;   -- la cita que respalda el examen
  v_negocio    record;   -- el negocio emisor (SEPARADO de v_cita a proposito:
                         -- un mismo `record` reusado con dos formas compila y
                         -- es exactamente donde se cuelan los errores mudos)
  v_mascota    record;
  v_vinculos   int;
  v_fecha_ex   date;
  v_id         uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_alcance IS NULL OR p_alcance NOT IN ('viaje', 'hospedaje', 'guarderia', 'constancia') THEN
    RAISE EXCEPTION 'alcance_invalido' USING ERRCODE = '22023';
  END IF;
  -- Un certificado sin alcance promete TODO. Y una declaracion vacia no es
  -- una declaracion: es un formulario enviado.
  IF p_declaracion IS NULL OR btrim(p_declaracion) = '' THEN
    RAISE EXCEPTION 'declaracion_requerida' USING ERRCODE = '22023';
  END IF;

  SELECT m.id, m.nombre, m.estado_vida, m.country_code
    INTO v_mascota
  FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_mascota.id IS NULL THEN
    RAISE EXCEPTION 'mascota_no_existe' USING ERRCODE = '22023';
  END IF;

  -- ── EL NEGOCIO DESDE EL QUE SE EMITE ────────────────────────────────────
  -- Sale de la CITA cuando hay cita (es el acto que respalda el examen); si
  -- no hay, del vinculo activo de quien emite. Jamas se pasa por parametro:
  -- un negocio elegido por el cliente es un negocio falsificable.
  IF p_cita_id IS NOT NULL THEN
    SELECT c.prestador_id, c.fecha, c.mascota_id INTO v_cita
    FROM evento_cita_servicio c WHERE c.id = p_cita_id;
    IF v_cita.prestador_id IS NULL THEN
      RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
    END IF;
    IF v_cita.mascota_id <> p_mascota_id THEN
      RAISE EXCEPTION 'cita_de_otra_mascota' USING ERRCODE = '22023';
    END IF;
    v_prestador := v_cita.prestador_id;
    -- La fecha del EXAMEN es la de la cita, y se deriva server-side: una
    -- fecha de examen que elige el cliente es una fecha falsificable.
    v_fecha_ex  := COALESCE(v_cita.fecha, (now() AT TIME ZONE 'America/Guayaquil')::date);
  ELSE
    -- Sin cita, el negocio sale del vinculo — y si hay MAS DE UNO, se rebota.
    -- Un LIMIT 1 por created_at habria elegido en silencio, y el papel diria
    -- el negocio equivocado en la cabecera sin que nadie se entere.
    SELECT count(*) INTO v_vinculos
    FROM prestador_empleados pe WHERE pe.user_id = v_uid AND pe.activo;
    IF v_vinculos = 0 THEN
      RAISE EXCEPTION 'sin_negocio' USING ERRCODE = '42501';
    END IF;
    IF v_vinculos > 1 THEN
      RAISE EXCEPTION 'negocio_ambiguo: trabajas en % negocios; el certificado se emite desde la cita', v_vinculos
        USING ERRCODE = '22023';
    END IF;
    SELECT pe.prestador_id INTO v_prestador
    FROM prestador_empleados pe WHERE pe.user_id = v_uid AND pe.activo;
    v_fecha_ex := (now() AT TIME ZONE 'America/Guayaquil')::date;   -- D-320
  END IF;

  -- ── GATE 1 · CAPACIDAD CLINICA (el helper unico, S76 §6.2) ──────────────
  -- Aca rebota la recepcion. Un certificado de salud es acto clinico: se
  -- gatea por CHIP, no por membresia (ley madre S76).
  IF NOT public.empleado_tiene_capacidad_clinica(v_prestador, v_uid) THEN
    RAISE EXCEPTION 'rol_sin_emision_clinica: emitir un certificado es acto clinico'
      USING ERRCODE = '42501';
  END IF;

  -- ── GATE 2 · LA PERSONA QUE FIRMA, CON SU MATRICULA ─────────────────────
  -- El corolario de D-676 llevado a su forma dura: una PERSONA con matricula,
  -- jamas un negocio. Y sin gracia — ver la nota de cabecera sobre por que el
  -- helper de ELEGIBILIDAD de citas (el que tiene gracia) NO sirve para esto.
  -- (Adaptación de A, declarada: el texto original nombraba ese helper por su
  --  nombre literal DENTRO de este body, y el cinturón (d) de la propia D lee
  --  prosrc con LIKE — que trata comentarios como código, L-170. El cinturón
  --  se disparó contra el comentario de su autora; se reescribe el comentario,
  --  jamás se ablanda el cinturón.)
  SELECT pe.id, pe.nombre, pe.matricula_profesional, pe.matricula_pais_emisor
    INTO v_emp
  FROM prestador_empleados pe
  WHERE pe.user_id = v_uid AND pe.prestador_id = v_prestador AND pe.activo;
  IF v_emp.id IS NULL THEN
    RAISE EXCEPTION 'sin_vinculo_activo' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(btrim(v_emp.matricula_profesional), '') = '' THEN
    RAISE EXCEPTION 'matricula_profesional_faltante: un certificado lo firma una persona con matricula'
      USING ERRCODE = '22023';
  END IF;
  IF COALESCE(btrim(v_emp.nombre), '') = '' THEN
    RAISE EXCEPTION 'firmante_sin_nombre' USING ERRCODE = '22023';
  END IF;

  -- ── GATE 3 · EL MOMENTO VITAL (apagado ESTRUCTURAL, no filtro de pantalla)
  -- Un certificado PUEDE emitirse para una mascota fallecida — historial para
  -- un seguro, cierre de tratamiento. Lo que NO puede es prometer movilidad
  -- FUTURA de un animal que ya no esta: viaje, hospedaje y guarderia son
  -- promesas hacia adelante. Queda `constancia`, que mira hacia atras.
  -- Lo mismo vale para `perdida`: certificar aptitud para viajar de una
  -- mascota que no esta es igual de falso.
  IF v_mascota.estado_vida <> 'activa' AND p_alcance <> 'constancia' THEN
    RAISE EXCEPTION 'alcance_no_aplica_al_estado: para % solo se emite constancia', v_mascota.estado_vida
      USING ERRCODE = '22023';
  END IF;

  -- El NEGOCIO contextualiza; la persona firma. Su nombre es exigido (un
  -- documento sin emisor identificable no certifica nada); direccion y
  -- telefono se imprimen SI EXISTEN — hoy `telefono` esta en NULL en el
  -- negocio de la casa (medido), y el papel omite la linea en vez de
  -- imprimir un guion decorativo.
  SELECT pr.nombre_comercial, pr.direccion, pr.telefono INTO v_negocio
  FROM prestadores pr WHERE pr.id = v_prestador;
  IF COALESCE(btrim(v_negocio.nombre_comercial), '') = '' THEN
    RAISE EXCEPTION 'negocio_sin_nombre' USING ERRCODE = '22023';
  END IF;

  INSERT INTO certificado_salud (
    mascota_id, cita_id, prestador_id, empleado_id,
    emisor_nombre, emisor_matricula, emisor_pais,
    negocio_nombre, negocio_direccion, negocio_telefono,
    alcance, declaracion, fecha_examen, emitido_por_user_id,
    estado_vida_al_emitir, country_code
  ) VALUES (
    p_mascota_id, p_cita_id, v_prestador, v_emp.id,
    btrim(v_emp.nombre), btrim(v_emp.matricula_profesional), v_emp.matricula_pais_emisor,
    btrim(v_negocio.nombre_comercial), v_negocio.direccion, v_negocio.telefono,
    p_alcance, btrim(p_declaracion), v_fecha_ex, v_uid,
    v_mascota.estado_vida, COALESCE(v_mascota.country_code, 'EC')
  ) RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'certificado_id', v_id,
    'alcance', p_alcance,
    'fecha_examen', v_fecha_ex
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.emitir_certificado_salud(uuid, text, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.emitir_certificado_salud(uuid, text, text, uuid) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- ④ EL LECTOR — para la relectura (prestador hoy, familia cuando A la enganche)
-- ───────────────────────────────────────────────────────────────────────────
-- INVOKER a proposito: la RLS de arriba ES la puerta, y asi el lector se puede
-- auditar leyendo (D-587: un lector que se apoya solo en la RLS y ademas es
-- DEFINER no se puede auditar; este es INVOKER y declara su rol).
CREATE OR REPLACE FUNCTION public.obtener_certificados_mascota(p_mascota_id uuid)
RETURNS TABLE (
  id uuid, alcance text, declaracion text, fecha_examen date, emitido_en timestamptz,
  emisor_nombre text, emisor_matricula text, negocio_nombre text, estado_vida_al_emitir text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT c.id, c.alcance, c.declaracion, c.fecha_examen, c.emitido_en,
         c.emisor_nombre, c.emisor_matricula, c.negocio_nombre, c.estado_vida_al_emitir
  FROM certificado_salud c
  WHERE c.mascota_id = p_mascota_id
  ORDER BY c.emitido_en DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_certificados_mascota(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_certificados_mascota(uuid) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- ④bis LA FIRMA DE QUIEN MIRA — para que la superficie sepa ANTES de ofrecer
-- ───────────────────────────────────────────────────────────────────────────
-- Sin esto, la pantalla solo puede descubrir que falta la matricula
-- INTENTANDO emitir — y ahi ya es tarde: el vet escribio su declaracion
-- entera para recibir un rebote. Este lector le permite decirlo ANTES, que es
-- la unica forma de que el aviso sea util.
--
-- Devuelve la identidad de firma de QUIEN LLAMA en el negocio que se le pasa.
-- `matricula` NULL = el dato falta (jamas '' ni un placeholder): la superficie
-- distingue "falta el dato" de "no tenes permiso", que es L-178.
CREATE OR REPLACE FUNCTION public.mi_firma_clinica(p_prestador_id uuid)
RETURNS TABLE (empleado_id uuid, nombre text, matricula text, pais_emisor text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT pe.id,
         NULLIF(btrim(pe.nombre), ''),
         NULLIF(btrim(pe.matricula_profesional), ''),
         NULLIF(btrim(pe.matricula_pais_emisor), '')
  FROM prestador_empleados pe
  WHERE pe.user_id = auth.uid()
    AND pe.prestador_id = p_prestador_id
    AND pe.activo;
$function$;

REVOKE EXECUTE ON FUNCTION public.mi_firma_clinica(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.mi_firma_clinica(uuid) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑤' EL CERTIFICADO ENTRA AL CATÁLOGO (adaptación de A — reemplaza el ⑤ de D)
-- ───────────────────────────────────────────────────────────────────────────
-- El token ya sabe nombrar un acto (`ref_id`, orden 1). Lo que faltaba es la
-- fila del catálogo y la validación específica: el ref de un certificado
-- tiene que ser un certificado DE ESTA mascota (letra de D, verbatim en su
-- intención: «sin esta verificación, un token válido para la mascota A
-- podría imprimir el certificado de la mascota B»).

INSERT INTO public.cat_documentos_mascota (codigo, voz, funcion_edge, requiere_ref, activo, orden)
VALUES ('certificado_salud', 'Certificado de salud', 'documento-certificado', true, true, 50);

CREATE OR REPLACE FUNCTION public.emitir_token_documento(
  p_mascota_id uuid,
  p_tipo       text DEFAULT 'carnet_vacunas',
  p_ref        uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   uuid := auth.uid();
  v_cat   record;
  v_token uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT codigo, funcion_edge, requiere_ref INTO v_cat
  FROM cat_documentos_mascota
  WHERE codigo = p_tipo AND activo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'tipo_documento_invalido' USING ERRCODE = '22023';
  END IF;

  -- la misma puerta que el resto del expediente: el papel no ensancha permisos
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  IF v_cat.requiere_ref AND p_ref IS NULL THEN
    RAISE EXCEPTION 'ref_requerida' USING ERRCODE = '22023';
  END IF;

  -- Receta: un papel POR CONSULTA. El ref es la cita, con medicación DE ESTA
  -- mascota — una receta vacía no es un papel, y un ref ajeno sería leer por
  -- la ventana.
  IF v_cat.codigo = 'receta' THEN
    IF NOT EXISTS (
      SELECT 1 FROM evento_medicacion_prescrita m
      WHERE m.cita_id = p_ref AND m.mascota_id = p_mascota_id
    ) THEN
      RAISE EXCEPTION 'receta_sin_medicacion' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Certificado (S90-D): el ref nombra UN acto emitido, y ese acto tiene que
  -- ser DE ESTA MASCOTA.
  IF v_cat.codigo = 'certificado_salud' THEN
    IF NOT EXISTS (
      SELECT 1 FROM certificado_salud c
      WHERE c.id = p_ref AND c.mascota_id = p_mascota_id
    ) THEN
      RAISE EXCEPTION 'referencia_no_es_de_la_mascota' USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO documento_token (user_id, mascota_id, tipo, ref_id, expira_en)
  VALUES (v_uid, p_mascota_id, v_cat.codigo, p_ref, now() + interval '10 minutes')
  RETURNING id INTO v_token;

  RETURN jsonb_build_object(
    'ok', true,
    'token', v_token,
    'tipo', v_cat.codigo,
    'funcion', v_cat.funcion_edge
  );
END;
$function$;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑥' CINTURONES — los de D verbatim donde aplican, adaptado el del CHECK
-- ───────────────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_n int; v_src text;
BEGIN
  -- (a) UNA sola sobrecarga de emitir_token_documento (L-119) — de D, verbatim
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'emitir_token_documento';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon_certificado: emitir_token_documento tiene % sobrecargas (esperado 1)', v_n;
  END IF;

  -- (b) ADAPTADO: el tipo vive en el CATÁLOGO, no en un CHECK
  SELECT count(*) INTO v_n FROM cat_documentos_mascota WHERE codigo = 'certificado_salud' AND activo AND requiere_ref;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon_certificado: el catálogo no tiene certificado_salud con requiere_ref';
  END IF;
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'emitir_token_documento';
  IF v_src NOT LIKE '%certificado_salud%' OR v_src NOT LIKE '%cat_documentos_mascota%' THEN
    RAISE EXCEPTION 'cinturon_certificado: la RPC del token no valida el certificado contra el catálogo';
  END IF;

-- (c) la emision consume EL helper unico del gate clinico, no un predicado propio
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'emitir_certificado_salud';
  IF v_src NOT LIKE '%empleado_tiene_capacidad_clinica%' THEN
    RAISE EXCEPTION 'cinturon_certificado: la emision no consulta el helper clinico unico';
  END IF;

  -- (d) EL DISCRIMINADOR DE LA GRACIA — el que prueba que este gate NO es el de
  -- las citas. Hoy hay 3 empleados con chip medico y CERO con matricula: si la
  -- emision usara `_empleado_matricula_ok`, los tres pasarian por gracia y el
  -- papel saldria con la linea de matricula vacia. Este assert falla si alguien
  -- «simplifica» la emision para reusar aquel helper.
  IF v_src LIKE '%_empleado_matricula_ok%' THEN
    RAISE EXCEPTION 'cinturon_certificado: la emision usa el helper de ELEGIBILIDAD (tiene gracia) en vez de exigir la matricula literal';
  END IF;

  -- (e) la tabla es inmutable de verdad
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.certificado_salud'::regclass
      AND tgname = 'trg_certificado_salud_inmutable'
  ) THEN
    RAISE EXCEPTION 'cinturon_certificado: falta el trigger de inmutabilidad';
  END IF;

  -- (f) L-140: nada de anon en las funciones nuevas
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('emitir_certificado_salud', 'obtener_certificados_mascota', 'emitir_token_documento')
      AND array_to_string(p.proacl, ',') LIKE '%anon=%'
  ) THEN
    RAISE EXCEPTION 'cinturon_certificado: alguna funcion nueva concede a anon (L-140)';
  END IF;
END $cint$;
