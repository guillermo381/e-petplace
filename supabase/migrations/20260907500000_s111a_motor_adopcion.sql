/* ═══════════════════════════════════════════════════════════════════════════
   S111-A · FRENTE 1 — EL MOTOR DE ADOPCIÓN: el adoptable, su publicación y
   el traspaso que deja rastro.
   ═══════════════════════════════════════════════════════════════════════════

   ── POR QUÉ ESTA ES LA PRIMERA ────────────────────────────────────────────
   Medido por C: **cero funciones `adopc*` / `adoptable*` / `padrinazgo*` /
   `refugio*` sobre 369 migraciones con `CREATE FUNCTION`, cero wrappers.**
   > ### TRES bloques de tres pistas distintas están parados por la misma pieza ausente.
   `Convivencia` de B y `packages/mensajeria` de D **existen y no tienen de qué
   hablar todavía**. *El motor es el único eslabón que falta para que tres
   frentes arranquen a la vez.*

   ── LO QUE EL CENSO ENCONTRÓ Y CAMBIÓ EL PLAN ────────────────────────────
   ✅ **`familia.tipo` YA admite `virtual_refugio`** — está en el CHECK vivo.
      *S110-D midió «0 ocurrencias en migraciones» y se corrigió a tiempo
      diciendo «sé dónde no está; por dónde entró, no». El valor es legal hoy:
      no hace falta migración para él, y no se toca.*
   ✅ **`cat_tipos_evento` ya tiene `transferencia_familia`** — el evento del
      traspaso **no se inventa**: ya existía y nunca tuvo productor.
   ✅ **`cuenta_roles.tipo_actor` ya tiene `refugio`** — la cuenta de publicador
      es un rol existente, no uno nuevo. Hoy hay **0 filas** de ese tipo: las
      crea el admin (firma ②) y **sin una de ellas nadie publica**.
   🔴 **`mascotas.refugio_id` tiene FK VIVA a la tabla legado `refugios`**
      (`ON DELETE SET NULL`). **NO se construye sobre ella** (`D-991`), y esta
      migración **no la usa ni la toca**. Medido: `refugio_id` no nulo en **0**
      de 83, y `refugios` en **0 filas** ⇒ hoy es inerte. *Se declara porque el
      próximo que busque «dónde vive el refugio» la va a encontrar primero.*

   ── EL VOCABULARIO VA COMO DATO, Y ESTA VEZ SIN CHECK GEMELO ─────────────
   `cat_estados_adopcion` es la **única** fuente del vocabulario, y
   `mascotas.estado_adopcion` la referencia **por FK**.
   *S110 puso el catálogo AL LADO de un CHECK que decía lo mismo, y hubo que
   escribir un verificador de coherencia para que la divergencia sonara. Con FK
   no hay dos lugares que puedan divergir: hay uno.* **Es la misma ley —el
   vocabulario es dato— con el mecanismo que no pide vigilancia.**

   ── LA PUBLICACIÓN NO DUPLICA AL ANIMAL: LO APUNTA ──────────────────────
   `adopcion_publicacion` **no tiene título, ni descripción, ni foto**. Todo lo
   que la vidriera muestra del animal sale de `mascotas` y de su expediente.
   > ### Es §0 hecho esquema: *el expediente empieza en el rescate y se hereda*. Una publicación con su propia copia de los datos sería un segundo expediente que muere el día de la adopción.

   ── 🔴 EL TRASPASO ES FAIL-CLOSED CONTRA EL ACTA, Y HOY NO ABRE ─────────
   `traspasar_mascota_a_familia` **exige un acta versionada aceptada**
   (`adopcion_documentos`, molde de `guarderia_documentos`). **Esa tabla nace
   VACÍA a propósito**: el texto es del paquete del abogado y está estacionado.
   ⇒ **Hoy la RPC rebota `acta_no_disponible` SIEMPRE**, y el día que la mesa
   cargue el texto **se abre sola, sin tocar código**.
   *Es la regla del loop al pie: sin documento cargado, la puerta no se abre.*
   **Ni una palabra de texto legal entra en esta migración** — sólo el casillero
   donde ese texto va a vivir.

   ── 76(g): NO RIGE ───────────────────────────────────────────────────────
   DDL aditiva + funciones nuevas. **CERO BACKFILL**: las 83 mascotas quedan en
   `no_aplica`, que es la verdad. Cinturón en subtransacción que se deshace sola.
   **Reversa:** `docs/relevamientos/S111-A-REVERSA-motor-adopcion.sql`, escrita
   ANTES; declara que **NO borra los eventos ni reabre los accesos cerrados**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① EL VOCABULARIO, COMO DATO Y CON FK ═════════════════════════════════
CREATE TABLE public.cat_estados_adopcion (
  estado      text PRIMARY KEY,
  es_terminal boolean NOT NULL,
  /* `visible_en_vidriera` es la única regla de negocio del catálogo, y va acá
     para que la vidriera NO tenga que enumerar estados: filtra por esta
     columna. *Una pantalla que enumera estados se olvida del sexto.* */
  visible_en_vidriera boolean NOT NULL,
  orden       int NOT NULL,
  descripcion text NOT NULL
);
INSERT INTO public.cat_estados_adopcion VALUES
  ('no_aplica',  false, false, 1, 'La mascota no está en adopción. Es el estado de toda mascota de familia.'),
  ('borrador',   false, false, 2, 'El publicador la cargó y todavía no la publicó.'),
  ('publicada',  false, true,  3, 'Visible en la vidriera y aceptando solicitudes.'),
  ('pausada',    false, false, 4, 'El publicador la retiró temporalmente. No es un rechazo.'),
  ('adoptada',   true,  false, 5, 'Encontró hogar. El traspaso ya ocurrió.');

ALTER TABLE public.mascotas
  ADD COLUMN IF NOT EXISTS estado_adopcion text NOT NULL DEFAULT 'no_aplica'
    REFERENCES public.cat_estados_adopcion(estado) ON DELETE RESTRICT;

COMMENT ON COLUMN public.mascotas.estado_adopcion IS
  'S111-A · el vocabulario vive en cat_estados_adopcion y esto lo referencia por FK. No hay CHECK gemelo: no hay dos lugares que puedan divergir.';

ALTER TABLE public.cat_estados_adopcion ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_estados_adopcion_lectura ON public.cat_estados_adopcion
  FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.cat_estados_adopcion TO authenticated;

-- ══ ② EL CASILLERO DEL ACTA — nace VACÍO, y por eso la puerta no abre ════
CREATE TABLE public.adopcion_documentos (
  codigo     text NOT NULL,
  version    int  NOT NULL,
  contenido  text NOT NULL,
  vigente_desde timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (codigo, version)
);
COMMENT ON TABLE public.adopcion_documentos IS
  'S111-A · el texto lo carga la mesa (paquete del abogado, estacionado). NACE VACÍA a propósito: sin documento cargado, el traspaso no ocurre.';
ALTER TABLE public.adopcion_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY adopcion_documentos_lectura ON public.adopcion_documentos
  FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.adopcion_documentos TO authenticated;

-- ══ ③ LA PUBLICACIÓN ═════════════════════════════════════════════════════
CREATE TABLE public.adopcion_publicacion (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id    uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  /* El PUBLICADOR es una cuenta comercial con rol `refugio` ACTIVO. */
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT,
  publicada_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  estado        text NOT NULL DEFAULT 'publicada'
                CHECK (estado IN ('publicada','retirada')),
  motivo_retiro text,
  creada_en     timestamptz NOT NULL DEFAULT now(),
  retirada_en   timestamptz,
  country_code  text NOT NULL,
  CONSTRAINT chk_retiro_coherente CHECK (
    (estado = 'publicada' AND retirada_en IS NULL)
 OR (estado = 'retirada'  AND retirada_en IS NOT NULL))
);
/* 🔴 UNA publicación viva por mascota. El piso es el índice; el guard tipado
   de la RPC es el que EXPLICA y devuelve el id de la que ya existe (`L-424`). */
CREATE UNIQUE INDEX uq_publicacion_viva_por_mascota
  ON public.adopcion_publicacion (mascota_id) WHERE estado = 'publicada';

ALTER TABLE public.adopcion_publicacion ENABLE ROW LEVEL SECURITY;
/* La vidriera es PÚBLICA para gente con sesión: quien busca adoptar tiene que
   poder ver lo publicado. Lo retirado, sólo su publicador. */
CREATE POLICY adopcion_publicacion_select ON public.adopcion_publicacion
  FOR SELECT TO authenticated USING (
    estado = 'publicada'
    OR public._user_opera_cuenta_comercial(cuenta_comercial_id, auth.uid())
    OR public.is_admin());
GRANT SELECT ON public.adopcion_publicacion TO authenticated;

-- ══ ④ LOS DOS HELPERS, cada uno con su predicado y una sola vez ══════════
/* ⚠️ El helper de la casa se llama `_user_opera_cuenta_comercial(cuenta, uid)`
   — lo medí contra `pg_proc` DESPUÉS de inventarme un nombre que no existía y
   ver rebotar la migración. *Regla 40 en su forma más barata: el nombre se mide,
   no se recuerda.* Su cuerpo incluye al owner Y a los empleados activos del
   prestador de esa cuenta; acá alcanza y no se ensancha. */
CREATE OR REPLACE FUNCTION public._user_gestiona_cuenta_refugio(p_cuenta_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
  SELECT public._user_opera_cuenta_comercial(p_cuenta_id, auth.uid())
     AND EXISTS (SELECT 1 FROM public.cuenta_roles r
                  WHERE r.cuenta_comercial_id = p_cuenta_id
                    AND r.tipo_actor = 'refugio' AND r.estado = 'activo');
$$;

/* 🔴 EL GATE DE PRIVACIDAD DE LA MENSAJERÍA ES LA PUBLICACIÓN, NO EL REFUGIO
   (pedido de D, y sale de la letra): §5 dice *«sólo lo ve el publicador del
   ANIMAL SOLICITADO»*. Gatear por organización haría que dos personas del mismo
   refugio vean solicitudes de animales que no publicaron — **ensanche por
   encima de la letra**. */
CREATE OR REPLACE FUNCTION public._user_publico_esta_publicacion(
  p_publicacion_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.adopcion_publicacion p
     WHERE p.id = p_publicacion_id
       AND (p.publicada_por = p_user_id
            OR EXISTS (SELECT 1 FROM public.cuentas_comerciales c
                        WHERE c.id = p.cuenta_comercial_id
                          AND c.owner_profile_id = p_user_id)));
$$;

-- ══ ⑤ PUBLICAR ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.publicar_adoptable(
  p_mascota_id uuid, p_cuenta_comercial_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_user uuid := auth.uid(); v_pub uuid; v_cc text; v_fam uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(p_cuenta_comercial_id) THEN
    /* Hoy hay CERO cuentas con rol `refugio` ⇒ esto rebota siempre, y está
       bien: la cuenta de publicador la crea el admin (firma ②). */
    RAISE EXCEPTION 'no_sos_cuenta_de_refugio' USING ERRCODE='42501';
  END IF;

  SELECT country_code, familia_id INTO v_cc, v_fam FROM mascotas WHERE id = p_mascota_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'mascota_no_existe' USING ERRCODE='22023'; END IF;
  IF v_fam IS NULL THEN
    /* Una mascota sin familia no puede publicarse: el traspaso mueve DE una
       familia A otra, y §0 dice que el refugio es la familia hasta la entrega. */
    RAISE EXCEPTION 'mascota_sin_familia' USING ERRCODE='22023';
  END IF;

  -- Idempotencia hablada: devuelve la que YA existe, con su id (`L-424`).
  SELECT id INTO v_pub FROM adopcion_publicacion
   WHERE mascota_id = p_mascota_id AND estado = 'publicada';
  IF v_pub IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'publicacion_id', v_pub, 'ya_existia', true);
  END IF;

  INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, publicada_por, country_code)
       VALUES (p_mascota_id, p_cuenta_comercial_id, v_user, v_cc)
    RETURNING id INTO v_pub;
  UPDATE mascotas SET estado_adopcion = 'publicada', updated_at = now() WHERE id = p_mascota_id;

  RETURN jsonb_build_object('ok', true, 'publicacion_id', v_pub, 'ya_existia', false);
END $$;

-- ══ ⑥ DESPUBLICAR — retirar NO es rechazar ═══════════════════════════════
CREATE OR REPLACE FUNCTION public.despublicar_adoptable(
  p_publicacion_id uuid, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_masc uuid; v_estado text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT mascota_id, estado INTO v_masc, v_estado
    FROM adopcion_publicacion WHERE id = p_publicacion_id;
  IF v_masc IS NULL THEN RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT public._user_publico_esta_publicacion(p_publicacion_id, auth.uid())
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  IF v_estado = 'retirada' THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true);
  END IF;

  UPDATE adopcion_publicacion
     SET estado='retirada', retirada_en = now(), motivo_retiro = p_motivo
   WHERE id = p_publicacion_id;
  /* `pausada`, no `no_aplica`: **retirar no es negar que estuvo en adopción**.
     El día que el refugio la vuelva a publicar, su historia sigue. */
  UPDATE mascotas SET estado_adopcion = 'pausada', updated_at = now() WHERE id = v_masc;
  RETURN jsonb_build_object('ok', true, 'ya_estaba', false);
END $$;

-- ══ ⑦ LA VIDRIERA ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.obtener_adoptables(
  p_especie text DEFAULT NULL, p_country_code text DEFAULT NULL, p_limite int DEFAULT 50)
RETURNS TABLE(publicacion_id uuid, mascota_id uuid, nombre text, especie text,
              raza text, sexo text, fecha_nacimiento date, foto_url text,
              publicador_nombre text, creada_en timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT p.id, m.id, m.nombre, m.especie, m.raza, m.sexo, m.fecha_nacimiento, m.foto_url,
         c.nombre_comercial, p.creada_en
    FROM adopcion_publicacion p
    JOIN mascotas m ON m.id = p.mascota_id
    JOIN cuentas_comerciales c ON c.id = p.cuenta_comercial_id
    /* El estado que decide la visibilidad sale del CATÁLOGO, no de un literal:
       la vidriera no enumera estados y no se olvida del sexto. */
    JOIN cat_estados_adopcion e ON e.estado = m.estado_adopcion AND e.visible_en_vidriera
   WHERE p.estado = 'publicada'
     AND (p_especie IS NULL OR m.especie = p_especie)
     AND (p_country_code IS NULL OR p.country_code = p_country_code)
   ORDER BY p.creada_en DESC
   LIMIT LEAST(COALESCE(p_limite, 50), 100);
END $$;

-- ══ ⑧ EL TRASPASO — el acto, no un UPDATE ════════════════════════════════
CREATE OR REPLACE FUNCTION public.traspasar_mascota_a_familia(
  p_mascota_id uuid, p_familia_destino_id uuid,
  p_acta_version int, p_acta_codigo text DEFAULT 'acta_adopcion')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE
  v_user uuid := auth.uid(); v_origen uuid; v_pub uuid; v_cc text;
  v_cuenta uuid; v_evento uuid; v_cerrados int := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT m.familia_id, m.country_code INTO v_origen, v_cc FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'mascota_no_existe' USING ERRCODE='22023'; END IF;
  IF v_origen = p_familia_destino_id THEN
    RAISE EXCEPTION 'familia_destino_igual_al_origen' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM familia WHERE id = p_familia_destino_id) THEN
    RAISE EXCEPTION 'familia_destino_no_existe' USING ERRCODE='22023';
  END IF;

  SELECT p.id, p.cuenta_comercial_id INTO v_pub, v_cuenta
    FROM adopcion_publicacion p WHERE p.mascota_id = p_mascota_id AND p.estado = 'publicada';
  IF v_pub IS NULL THEN RAISE EXCEPTION 'sin_publicacion_viva' USING ERRCODE='22023'; END IF;
  IF NOT public._user_publico_esta_publicacion(v_pub, v_user) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;

  /* 🔴 FAIL-CLOSED CONTRA EL ACTA VERSIONADA. `adopcion_documentos` nace VACÍA
     ⇒ hoy esto rebota SIEMPRE, y es lo correcto: el texto es del paquete del
     abogado y está estacionado. **El día que la mesa lo cargue, esta puerta se
     abre sola, sin tocar una línea de código.** */
  IF NOT EXISTS (SELECT 1 FROM adopcion_documentos
                  WHERE codigo = p_acta_codigo AND version = p_acta_version) THEN
    RAISE EXCEPTION 'acta_no_disponible: % v%', p_acta_codigo, p_acta_version USING ERRCODE='22023';
  END IF;

  -- ① la mascota cambia de familia (el trigger de D-989 deja pasar: somos DEFINER)
  UPDATE mascotas
     SET familia_id = p_familia_destino_id,
         estado_adopcion = 'adoptada',
         updated_at = now()
   WHERE id = p_mascota_id;

  -- ② el acceso viejo se CIERRA con `hasta` — no se borra
  /* *Borrar el vínculo dejaría la historia diciendo que esa familia nunca lo
     tuvo. Cerrarlo dice la verdad: lo tuvo, y hasta cuándo.* */
  UPDATE familia_miembro
     SET hasta = now(), motivo_baja = 'traspaso_por_adopcion', updated_at = now()
   WHERE familia_id = v_origen AND hasta IS NULL
     AND rol = 'cuidador_externo';
  GET DIAGNOSTICS v_cerrados = ROW_COUNT;

  -- ③ el evento, que es el rastro y el motivo de que esto sea una RPC
  /* 🔴 `eje_jtbd` SALE DEL CATÁLOGO, no de un literal. Es NOT NULL y la primera
     versión de esta migración lo omitió — el rebote lo dijo. *Escribirlo a mano
     habría funcionado igual y habría creado el segundo lugar donde el eje de un
     tipo de evento vive: el catálogo ya lo dice, y dice `identidad`.* */
  INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento, cuenta_comercial_id,
      creado_por_user_id, datos, country_code, procedencia)
    VALUES (
      p_mascota_id, 'transferencia_familia',
      (SELECT eje_jtbd FROM cat_tipos_evento WHERE codigo = 'transferencia_familia'),
      now(), v_cuenta, v_user,
      jsonb_build_object(
        'familia_origen', v_origen,
        'familia_destino', p_familia_destino_id,
        'publicacion_id', v_pub,
        /* 🔴 EL REFUGIO QUEDA COMO PROCEDENCIA PERMANENTE. No es metadata: es
           de dónde viene este animal, y viaja con él para siempre. */
        'refugio_cuenta_comercial_id', v_cuenta,
        'acta_codigo', p_acta_codigo,
        'acta_version', p_acta_version),
      v_cc, 'declarado_por_prestador')
    RETURNING id INTO v_evento;

  -- ④ la publicación se cierra
  UPDATE adopcion_publicacion
     SET estado='retirada', retirada_en = now(), motivo_retiro = 'adoptada'
   WHERE id = v_pub;

  RETURN jsonb_build_object('ok', true, 'mascota_id', p_mascota_id,
    'familia_origen', v_origen, 'familia_destino', p_familia_destino_id,
    'evento_id', v_evento, 'accesos_cerrados', v_cerrados, 'publicacion_id', v_pub);
END $$;

-- ══ ⑨ L-140 ══════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.publicar_adoptable(uuid,uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.despublicar_adoptable(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_adoptables(text,text,integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.traspasar_mascota_a_familia(uuid,uuid,integer,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._user_gestiona_cuenta_refugio(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._user_publico_esta_publicacion(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publicar_adoptable(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.despublicar_adoptable(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_adoptables(text,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.traspasar_mascota_a_familia(uuid,uuid,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public._user_publico_esta_publicacion(uuid,uuid) TO authenticated;

-- ══ ⑩ CINTURÓN — EL ROJO PRIMERO ═════════════════════════════════════════
DO $cint$
DECLARE
  v_rol text := current_user; v_masc uuid; v_fam uuid; v_dest uuid;
  v_cuenta uuid; v_owner uuid; v_r jsonb; v_pub uuid;
  v_rojo boolean; v_msg text; v_n int;
BEGIN
  SELECT m.id, m.familia_id INTO v_masc, v_fam
    FROM mascotas m WHERE m.familia_id IS NOT NULL LIMIT 1;
  SELECT f.id INTO v_dest FROM familia f WHERE f.id <> v_fam LIMIT 1;
  SELECT c.id, c.owner_profile_id INTO v_cuenta, v_owner FROM cuentas_comerciales c LIMIT 1;
  IF v_masc IS NULL OR v_dest IS NULL OR v_cuenta IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin sujetos reales';
  END IF;

  BEGIN
    -- ══ ROJO ① · SIN CUENTA DE REFUGIO NO SE PUBLICA ═══════════════════
    /* Medido: hoy hay CERO `cuenta_roles` con `tipo_actor='refugio'` ⇒ este
       rojo lo produce el estado del mundo, no un fixture. */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_rojo := false;
    BEGIN PERFORM public.publicar_adoptable(v_masc, v_cuenta);
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'no_sos_cuenta_de_refugio%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-1: publico sin ser refugio (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    -- ══ VERDE ① · CON EL ROL, PUBLICA ══════════════════════════════════
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en)
         VALUES (v_cuenta, 'refugio', 'activo', now());
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_r := public.publicar_adoptable(v_masc, v_cuenta);
    v_pub := (v_r->>'publicacion_id')::uuid;
    IF v_pub IS NULL THEN RAISE EXCEPTION 'CINTURON VERDE-1: no publico (%)', v_r; END IF;
    IF (SELECT estado_adopcion FROM mascotas WHERE id = v_masc) <> 'publicada' THEN
      RAISE EXCEPTION 'CINTURON VERDE-1: la mascota no quedo publicada';
    END IF;

    -- idempotencia hablada: el segundo intento ENCUENTRA
    v_r := public.publicar_adoptable(v_masc, v_cuenta);
    IF NOT (v_r->>'ya_existia')::boolean OR (v_r->>'publicacion_id')::uuid <> v_pub THEN
      RAISE EXCEPTION 'CINTURON: publicar no es idempotente (%)', v_r;
    END IF;

    -- ══ VERDE ② · LA VIDRIERA LA VE ════════════════════════════════════
    SELECT count(*) INTO v_n FROM public.obtener_adoptables(NULL, NULL, 100) x
     WHERE x.publicacion_id = v_pub;
    IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON VERDE-2: la vidriera no la ve (n=%)', v_n; END IF;

    -- ══ ROJO ② · EL TRASPASO ESTÁ FAIL-CLOSED SIN ACTA ═════════════════
    /* `adopcion_documentos` nace vacía. Éste es EL rojo que la regla del loop
       pide: sin documento cargado, la puerta no se abre. */
    v_rojo := false;
    BEGIN PERFORM public.traspasar_mascota_a_familia(v_masc, v_dest, 1);
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'acta_no_disponible%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: TRASPASO SIN ACTA (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;
    IF (SELECT familia_id FROM mascotas WHERE id = v_masc) <> v_fam THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: reboto y movio igual';
    END IF;

    -- ══ VERDE ③ · CON EL ACTA CARGADA, LA PUERTA SE ABRE SOLA ══════════
    /* Se carga un acta de ARNÉS, con texto que se declara como tal y muere con
       el ROLLBACK. **No es texto legal**: es la prueba de que el casillero es
       lo único que falta. */
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    INSERT INTO adopcion_documentos (codigo, version, contenido)
         VALUES ('acta_adopcion', 1, '__ARNES_S111A__ sin valor legal, muere con el rollback');
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_r := public.traspasar_mascota_a_familia(v_masc, v_dest, 1);
    IF (v_r->>'familia_destino')::uuid <> v_dest THEN
      RAISE EXCEPTION 'CINTURON VERDE-3: no traspaso (%)', v_r;
    END IF;
    IF (v_r->>'evento_id') IS NULL THEN
      RAISE EXCEPTION 'CINTURON VERDE-3: traspaso SIN EVENTO — es lo unico que justifica que sea RPC';
    END IF;
    IF (SELECT estado_adopcion FROM mascotas WHERE id = v_masc) <> 'adoptada' THEN
      RAISE EXCEPTION 'CINTURON VERDE-3: la mascota no quedo adoptada';
    END IF;
    /* El evento lleva la procedencia permanente del refugio.
       ⚠️ ESTA LECTURA VA CON EL ROL DE LA MIGRACIÓN, no como `authenticated`:
       la RLS de `eventos_mascota` tapa la fila para este actor y el arnés leía
       CERO. *Un arnés que se queda sin permisos a mitad reporta el problema del
       arnés como si fuera del sujeto* — es la segunda vez en esta sesión. */
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF NOT EXISTS (SELECT 1 FROM eventos_mascota e
                    WHERE e.id = (v_r->>'evento_id')::uuid
                      AND (e.datos->>'refugio_cuenta_comercial_id')::uuid = v_cuenta) THEN
      RAISE EXCEPTION 'CINTURON VERDE-3: el evento no dejo la procedencia del refugio';
    END IF;
    /* CONTROL del brazo de arriba: si el evento NO existiera, el EXISTS daría
       falso por la razón equivocada. Se confirma que la fila está. */
    IF NOT EXISTS (SELECT 1 FROM eventos_mascota e WHERE e.id = (v_r->>'evento_id')::uuid) THEN
      RAISE EXCEPTION 'CINTURON VERDE-3: el evento no existe — el brazo anterior no discrimina';
    END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE · ROJO-1 sin rol refugio NO publica (cero cuentas reales: el rojo lo produce el mundo) · ROJO-2 el traspaso es FAIL-CLOSED sin acta y no mueve nada · VERDE-1 publica e idempotente · VERDE-2 la vidriera la ve por CATALOGO · VERDE-3 con el acta cargada la puerta se abre SOLA, deja EVENTO y la procedencia del refugio';
END
$cint$;

COMMIT;
