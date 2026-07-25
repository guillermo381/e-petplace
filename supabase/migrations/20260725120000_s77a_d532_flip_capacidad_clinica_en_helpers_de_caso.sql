-- ─────────────────────────────────────────────────────────────────────────
-- S77-A · D-532 (+ D-494 como vehículo) — EL FLIP §6.2 LLEGA A LOS HELPERS
-- DE CASO: el acceso clínico al caso pasa a leer el CHIP, no el CARGO.
--
-- POR QUÉ (D-532, hallazgo S77-L7/L8 medido contra la DB viva):
--   `_user_clinica_tratante_del_caso` y `_user_clinica_consultor_del_caso`
--   gatean su brazo de empleado por `er.rol IN ('dueño','profesional')` — la
--   FILA DE ROL. NO estaban entre los 6 sitios que S76-A4b flipeó, y el censo
--   A4a no podía verlas: NO LLAMAN AL HELPER (re-implementan el chequeo por
--   join porque reciben el usuario por argumento — eso es literalmente D-494).
--   Una deuda archivada como prolijidad era la causa de un flip incompleto.
--
--   RADIO MEDIDO (L8): 6 policies + 2 RPC DEFINER sobre `caso_clinico` y
--   `caso_clinico_consultor` (SELECT · INSERT · UPDATE). El peor síntoma NO
--   es la fuga sino el FALSO NEGATIVO: `sedimentar_nota_clinica` corre los dos
--   ejes apilados — L55 `empleado_tiene_capacidad_clinica` (chip, S76) y L73
--   `_user_clinica_tratante_del_caso` (fila, sin flipear) —, así que el vet
--   con chip médico verdadero PASA L55 y REBOTA en L73. Con `profesional` en
--   0 filas en toda la DB, eso alcanza a TODO empleado no titular con chips:
--   el vet empleado abre un caso y no puede continuarlo. EL NORTE en su
--   propia cita: "El vet no atendió una consulta — adoptó un caso."
--
-- QUÉ HACE, en tres movimientos:
--   (1) NACE la sobrecarga `empleado_tiene_capacidad_clinica(uuid, uuid)` —
--       el vehículo que D-494 pedía: la misma regla, con el usuario por
--       argumento en vez de `auth.uid()`.
--   (2) La de UN argumento pasa a DELEGAR. Su comportamiento queda IDÉNTICO.
--   (3) EL FLIP: en los dos helpers, el `EXISTS` sobre `empleado_roles` se
--       reemplaza por la llamada a la sobrecarga. El brazo A
--       (`cco.owner_profile_id = p_user_id`) NO SE TOCA.
--
-- 76(g) — DECLARACIÓN: **NO RIGE** sobre esta migración. Cuatro CREATE OR
--   REPLACE FUNCTION, cero DDL sobre tablas, cero DML, cero backfill, cero
--   cómputo de anclas sobre datos vivos. El cinturón del final lee catálogo
--   (`pg_proc`/`pg_policies`), jamás filas de negocio. La veda SÍ se declara
--   —aparte de este archivo— para los fixtures de verificación posteriores,
--   que escriben filas temporales dentro de BEGIN/ROLLBACK.
--
-- L-140 — DECLARACIÓN DE PRIVILEGIOS: la función nueva nace con EXECUTE para
--   `anon` por los default privileges de Supabase, y `REVOKE FROM PUBLIC` no
--   lo quita. Se revoca explícito. **GRANT MÍNIMO REAL: ninguno.** Sus dos
--   únicos llamadores (`_user_clinica_tratante_del_caso` y
--   `_user_clinica_consultor_del_caso`) son SECURITY DEFINER y la ejecutan
--   como su owner, así que `authenticated` NO la necesita — y `service_role`
--   tampoco: ningún camino de servicio la llama. Se revoca de PUBLIC, anon Y
--   authenticated. (Sus tres hermanas vivas tienen
--   `postgres=X | authenticated=X | service_role=X`; ESTA NO LAS COPIA a
--   propósito: el grant se justifica por uso, jamás por simetría. Si mañana
--   una policy la cita directo, el GRANT entra en ESA migración, con su
--   consumidor a la vista.)
--
-- SEARCH_PATH — DECLARACIÓN (no se cambia un patrón de la casa en silencio):
--   la sobrecarga usa `'public', 'pg_temp'`, igual que la función de la que
--   es sobrecarga (`empleado_tiene_capacidad_clinica(uuid)`) y que el patrón
--   canónico de la skill `epetplace-db`. Los DOS helpers de caso usan
--   `'public'` a secas — divergencia PREEXISTENTE (S73) que esta migración
--   NO cura: se los reescribe con su `SET search_path TO 'public'` original
--   para que el diff sea el brazo B y nada más. Endurecerlos es cambio de
--   superficie propio y no viaja escondido en un flip de gate.
--
-- L-119 — DECLARACIÓN: (1) crea una SOBRECARGA a propósito (distinta aridad),
--   no reemplaza a la de un argumento. Ambas quedan vivas y sin ambigüedad
--   posible (1 arg vs 2 args). Ninguna firma se DROPea.
--
-- DELTAS QUE EL FOUNDER APRUEBA CON EL DIFF:
--   (a) CIERRA el falso positivo — la fila `profesional` concedida a mano por
--       el toggle de /negocio/equipo deja de dar acceso al caso. El toggle
--       queda INÚTIL, no peligroso; su muerte sigue siendo asunto de la letra.
--   (b) ABRE lo que hay que abrir — el empleado con chip médico pasa a poder
--       CONTINUAR un caso. Es el destrabe, y se verifica como tal.
--   (c) ENSANCHA en un borde, declarado: la sobrecarga trae brazo de
--       TITULARIDAD DEL PRESTADOR (`p.user_id = p_user_id`), que los helpers
--       hoy no tienen (solo tienen owner de la CUENTA). Hoy no cambia nada
--       —los 5 coinciden 5/5, medido en L10— y el día que diverjan es
--       exactamente el caso que L10 declaró sin candado de schema.
--   (d) D-529 se agranda: la de un argumento sigue citando `is_admin()` (no
--       se le quita), y ahora hay un consumidor más de esa cita a censar en
--       D-503. La sobrecarga NO llama `is_admin()` — a propósito: el admin
--       entra por la de un argumento, que es la puerta de sesión.
--   (e) DELTA NO PEDIDO, MEDIDO EN 0 Y DECLARADO IGUAL: quien tenga fila
--       `dueño` en `empleado_roles` SIN ser titular del prestador y SIN chip
--       médico, pierde el acceso al caso. Hoy las 5 filas `dueño` vivas son
--       de los 5 titulares (verificado L9: 5/5 `titular_es_owner_cuenta`),
--       así que entran por titularidad o por el brazo A. Afectados hoy: 0.
--
-- Deudas: D-532 (cierra al verificarse en las dos direcciones) · D-494 (su
--   sobrecarga nace acá — una migración, dos deudas).
-- Origen: S77-A, lecturas L7 · L8 · L9 · L10.
-- ─────────────────────────────────────────────────────────────────────────


-- ── (1) LA SOBRECARGA — el vehículo de D-494 ────────────────────────────
-- Misma regla que la de un argumento, con el usuario por parámetro.
-- SIN `is_admin()`: el admin entra por la de un argumento (la puerta de
--   sesión); un predicado que recibe un user_id ajeno no debe elevar.
-- SIN exigir `ps.activo`: se CONSERVA la decisión S76 — desactivar una oferta
--   es un acto de vitrina, y no le quita el expediente al vet que la atiende.
-- El brazo de titularidad NO es opcional: es el que salva a los 5 titulares
--   (misma cláusula que S76-A4b escribió en la de un argumento).
CREATE OR REPLACE FUNCTION public.empleado_tiene_capacidad_clinica(
  p_prestador_id uuid,
  p_user_id      uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    EXISTS (
      SELECT 1 FROM prestadores p
      WHERE p.id = p_prestador_id AND p.user_id = p_user_id
    )
    OR EXISTS (
      SELECT 1
      FROM prestador_empleados pe
      JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
      JOIN prestador_servicios ps            ON ps.id = pes.servicio_id
      JOIN tipos_servicio ts                 ON ts.codigo = ps.tipo_servicio
      WHERE pe.prestador_id = p_prestador_id
        AND pe.user_id = p_user_id
        AND pe.activo = true
        AND ts.es_medico = true
    );
$function$;

-- L-140: la función nace con EXECUTE para anon (default privileges de
-- Supabase) y REVOKE FROM PUBLIC no lo quita. Se revoca explícito — y de
-- `authenticated` también: sus dos únicos llamadores son SECURITY DEFINER y
-- la ejecutan como owner. GRANT mínimo = ninguno (ver cabecera).
REVOKE EXECUTE ON FUNCTION public.empleado_tiene_capacidad_clinica(uuid, uuid)
  FROM PUBLIC, anon, authenticated;


-- ── (2) LA DE UN ARGUMENTO DELEGA — comportamiento IDÉNTICO ──────────────
-- Literal anterior (S76-A4b, migración 20260724140000):
--   SELECT is_admin()
--     OR EXISTS (SELECT 1 FROM prestadores p
--                WHERE p.id = p_prestador_id AND p.user_id = auth.uid())
--     OR EXISTS (… pe.user_id = auth.uid() AND pe.activo AND ts.es_medico);
-- Equivalencia, verificada término a término: los dos EXISTS son exactamente
-- los dos brazos de la sobrecarga con p_user_id := auth.uid(); `is_admin()`
-- queda donde estaba. Con sesión anónima (`auth.uid()` NULL) los dos brazos
-- dan false por comparación con NULL, igual que hoy. No se "mejora" nada de
-- paso: el único cambio es de dónde sale el predicado.
CREATE OR REPLACE FUNCTION public.empleado_tiene_capacidad_clinica(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    is_admin()
    OR public.empleado_tiene_capacidad_clinica(p_prestador_id, auth.uid());
$function$;


-- ── (3) EL FLIP — los dos helpers de caso ───────────────────────────────
-- El brazo A (owner de la cuenta) queda BYTE-IDÉNTICO. En el brazo B, el
-- EXISTS sobre `empleado_roles` se reemplaza por la sobrecarga.
--
-- NOTA DE FORMA (el founder la ve en el diff): la sobrecarga YA contiene
-- `pe.activo = true` y la pertenencia de la persona al prestador, así que el
-- join a `prestador_empleados` sale del brazo B — si se conservara, el brazo
-- de TITULARIDAD de la sobrecarga quedaría inerte y el delta (c) no ocurriría.
-- Lo que queda es: "existe un prestador de esta cuenta donde esta persona
-- tiene capacidad clínica".

CREATE OR REPLACE FUNCTION public._user_clinica_tratante_del_caso(p_caso_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM caso_clinico cc
    JOIN cuentas_comerciales cco ON cco.id = cc.cuenta_comercial_tratante_id
    WHERE cc.id = p_caso_id
      AND (
        -- Caso A: user es owner de la cuenta tratante
        cco.owner_profile_id = p_user_id
        -- Caso B: capacidad clínica POR EL CHIP en algún prestador de la
        -- cuenta (S77-A / D-532). Antes gateaba por la FILA DE ROL — el
        -- literal viejo NO se transcribe acá: el cinturón censa por texto
        -- de cuerpo y un comentario que lo reproduzca lo hace abortar
        -- (pasó en el primer intento). Para verlo, la reversa de esta
        -- migración lo tiene entero.
        OR EXISTS (
          SELECT 1 FROM prestadores p
          WHERE p.cuenta_comercial_id = cc.cuenta_comercial_tratante_id
            AND public.empleado_tiene_capacidad_clinica(p.id, p_user_id)
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public._user_clinica_consultor_del_caso(p_caso_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM caso_clinico_consultor ccc
    JOIN cuentas_comerciales cco ON cco.id = ccc.cuenta_comercial_consultor_id
    WHERE ccc.caso_clinico_id = p_caso_id
      AND ccc.hasta IS NULL
      AND (
        cco.owner_profile_id = p_user_id
        -- S77-A / D-532: el chip, no el cargo (antes: la fila de rol)
        OR EXISTS (
          SELECT 1 FROM prestadores p
          WHERE p.cuenta_comercial_id = ccc.cuenta_comercial_consultor_id
            AND public.empleado_tiene_capacidad_clinica(p.id, p_user_id)
        )
      )
  );
$function$;


-- ── (4) EL PISO DEL FLIP — el prestador cuelga de la PROPIA cuenta ──────
-- POR QUÉ ACÁ: el brazo de titularidad que (1) trae (delta (c)) sería un
-- PUENTE si alguien pudiera colgarse un prestador de una cuenta ajena —
-- se haría "titular" sobre la cuenta de otro y entraría al caso por el
-- brazo B. L10 midió que NADA de schema lo impide: `uq_prestadores_user_id`
-- y `uq_cuentas_owner_profile` son dos 1:1 paralelos que no componen el
-- cruzado, y no hay CHECK/FK compuesta ni trigger que ate
-- `prestadores.user_id` con `cuentas_comerciales.owner_profile_id`.
--
-- HALLAZGO QUE CORRIGE LA PREMISA (S77-A, literal de pg_policies): NO son
-- "las dos policies INSERT". Son CUATRO permisivas las que habilitan INSERT
-- —`prestador_insert_self`, `prestadores_insert`, y las dos ALL
-- (`prestador_own_profile` con with_check `(user_id = auth.uid()) OR
-- is_admin()`, y `prestadores_admin`, cuyo with_check NULL hace que PG use
-- su qual `is_admin()`)—, y las permisivas se combinan en OR: endurecer solo
-- las dos INSERT deja `prestador_own_profile` abierta y el caso 6 daría rojo.
--
-- POR ESO ENTRA COMO **RESTRICTIVE**: las restrictivas se combinan con AND
-- sobre el OR de todas las permisivas, así que cierra las CUATRO puertas sin
-- modificar una sola policy existente. Se conserva la vía admin (`OR
-- is_admin()`) para no cambiar el poder que el admin ya tenía.
--
-- POR QUÉ NO ROMPE EL ALTA: `crear_prestador_inicial` es SECURITY DEFINER
-- owned by postgres (dueño de la tabla) ⇒ BYPASSA RLS; las policies no lo
-- tocan. Y es el ÚNICO escritor: censo DB (única función que inserta) +
-- censo TS (10 usos de `.from('prestadores')`, CERO `.insert(`).
--
-- REDUNDANCIA DECLARADA, NO CURADA ACÁ: `prestador_insert_self` y
-- `prestadores_insert` son byte-idénticas (mismo cmd, rol y with_check).
-- Dropear una es prolijidad con su propio gate — va como deuda aparte.
DROP POLICY IF EXISTS prestadores_insert_cuenta_propia ON public.prestadores;
CREATE POLICY prestadores_insert_cuenta_propia
  ON public.prestadores
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM cuentas_comerciales cc
      WHERE cc.id = cuenta_comercial_id
        AND cc.owner_profile_id = auth.uid()
    )
  );


-- ── EL CINTURÓN IN-MIGRACIÓN (precedente D-495: atrapó 10 policies que el
--    censo no vio). Si algo no cuadra, ABORTA la migración entera. ────────
DO $cinturon$
DECLARE
  v_rezagadas   int;
  v_lista       text;
  v_policies    int;
  v_rpcs        int;
  v_helpers     int;
  v_sobrecarga  int;
  v_piso        int;
BEGIN
  -- (1) CERO funciones que sigan gateando el eje clínico por la FILA DE ROL.
  --     Censo por pg_get_functiondef, jamás por memoria (hoy, antes del flip,
  --     son exactamente 2: los dos helpers de caso).
  SELECT count(*), coalesce(string_agg(p.oid::regprocedure::text, ', '), '')
    INTO v_rezagadas, v_lista
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND pg_get_functiondef(p.oid) ~ 'er\.rol\s+IN\s*\(\s*''dueño''\s*,\s*''profesional''\s*\)';
  IF v_rezagadas <> 0 THEN
    RAISE EXCEPTION 'cinturon: % funcion(es) siguen gateando el eje clinico por FILA DE ROL: %',
      v_rezagadas, v_lista;
  END IF;

  -- (2) LAS CONSUMIDORAS DE L8 SIGUEN EXISTIENDO CON SU FIRMA INTACTA.
  --     6 policies (nombradas una por una — un count suelto no prueba CUÁLES).
  SELECT count(*) INTO v_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (tablename, policyname) IN (
      ('caso_clinico',           'caso_clinico_select_clinica_tratante'),
      ('caso_clinico',           'caso_clinico_update_clinica_tratante'),
      ('caso_clinico',           'caso_clinico_select_clinica_consultor'),
      ('caso_clinico_consultor', 'consultor_select_clinica_tratante'),
      ('caso_clinico_consultor', 'consultor_insert_clinica_tratante'),
      ('caso_clinico_consultor', 'consultor_update_clinica_tratante')
    )
    AND (coalesce(qual,'') || coalesce(with_check,'')) LIKE '%_user_clinica_%_del_caso%';
  IF v_policies <> 6 THEN
    RAISE EXCEPTION 'cinturon: se esperaban 6 policies consumidoras intactas, hay %', v_policies;
  END IF;

  -- (3) Los 2 RPC DEFINER que gatean por el helper siguen citándolo.
  SELECT count(*) INTO v_rpcs
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('asociar_a_caso', 'sedimentar_nota_clinica')
    AND pg_get_functiondef(p.oid) LIKE '%_user_clinica_tratante_del_caso%';
  IF v_rpcs <> 2 THEN
    RAISE EXCEPTION 'cinturon: se esperaban 2 RPC consumidoras, hay %', v_rpcs;
  END IF;

  -- (4) Las firmas tocadas existen y son las de siempre (nada quedó zombi).
  SELECT count(*) INTO v_helpers
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.oid::regprocedure::text IN (
      '_user_clinica_tratante_del_caso(uuid,uuid)',
      '_user_clinica_consultor_del_caso(uuid,uuid)',
      'empleado_tiene_capacidad_clinica(uuid)'
    );
  IF v_helpers <> 3 THEN
    RAISE EXCEPTION 'cinturon: se esperaban 3 firmas preexistentes intactas, hay %', v_helpers;
  END IF;

  -- (5) La sobrecarga nació con el proacl que la cabecera declara: sin anon
  --     Y sin authenticated (L-140, grant mínimo por USO). Se lee el proacl
  --     literal, jamás la intención de la migración.
  SELECT count(*) INTO v_sobrecarga
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.oid::regprocedure::text = 'empleado_tiene_capacidad_clinica(uuid,uuid)'
    AND coalesce(array_to_string(p.proacl, ' '), '') NOT LIKE '%anon=%'
    AND coalesce(array_to_string(p.proacl, ' '), '') NOT LIKE '%authenticated=%';
  IF v_sobrecarga <> 1 THEN
    SELECT coalesce(array_to_string(p.proacl, ' | '), '(null)') INTO v_lista
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid::regprocedure::text = 'empleado_tiene_capacidad_clinica(uuid,uuid)';
    RAISE EXCEPTION 'cinturon: la sobrecarga no existe o su proacl conserva anon/authenticated (L-140). proacl = %',
      coalesce(v_lista, '(la funcion no existe)');
  END IF;

  -- (6) EL PISO DEL FLIP: la restrictive de INSERT existe y EXIGE la
  --     pertenencia de cuenta — por el LITERAL de su with_check, no por que
  --     la policy simplemente esté (una policy vacía también "está").
  SELECT count(*) INTO v_piso
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'prestadores'
    AND policyname = 'prestadores_insert_cuenta_propia'
    AND permissive = 'RESTRICTIVE'
    AND cmd = 'INSERT'
    AND coalesce(with_check, '') LIKE '%owner_profile_id%'
    AND coalesce(with_check, '') LIKE '%cuenta_comercial_id%';
  IF v_piso <> 1 THEN
    RAISE EXCEPTION 'cinturon: falta la RESTRICTIVE de INSERT que ata el prestador a la cuenta propia (o su with_check no cita la pertenencia)';
  END IF;

  RAISE NOTICE 'cinturon OK: 0 rezagadas por fila de rol · 6 policies · 2 RPC · 3 firmas intactas · sobrecarga sin anon/authenticated · piso RESTRICTIVE presente';
END;
$cinturon$;
