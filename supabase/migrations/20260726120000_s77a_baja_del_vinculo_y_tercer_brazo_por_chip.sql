-- ─────────────────────────────────────────────────────────────────────────
-- S77-A · §11.1 / §11.2 — LA BAJA DEL VÍNCULO Y EL TERCER BRAZO POR CHIP
-- (LETRA_EDICION_VINCULO_S77 v2.3, ✅ FIRMADA — §6, §11 y la forma del
-- tercer brazo, con su nota de precisión L15)
--
-- QUÉ RESUELVE, en una línea: hoy dar de baja a alguien deja sus citas
-- futuras colgadas de una persona que ya no trabaja acá. §11 firmada decidió
-- **(a): las citas pasan a ser de la clínica** — se DESPEGAN de la persona
-- (`empleado_id = NULL`) y quedan del negocio.
--
-- PERO (a) SOLA NO CAMBIA NADA, y por eso esta migración trae DOS piezas.
-- El predicado de las tres policies de agenda tiene un brazo de empleado
-- (`empleado_id IN (mis empleados activos)`), y con `empleado_id = NULL`
-- **ese brazo no da true para nadie** (`NULL IN (…)` es `NULL`, no `true`):
-- la cita despegada quedaría visible SOLO para el titular — donde ya estaba,
-- pero ahora además sin dueño. Despegar sin el tercer brazo es esconder.
--
-- ── LAS TRES PIEZAS ──────────────────────────────────────────────────────
--   (1) `_cita_despegable(...)` — EL PREDICADO, ESCRITO UNA SOLA VEZ.
--   (2) `contar_citas_despegables(empleado)` — el lector que la pantalla
--       lee ANTES (PEDIDO 1 del boceto M1 de B, hoy inexistente).
--   (3) `dar_de_baja_empleado(empleado)` — atómico: `activo=false` +
--       despegue, devolviendo el conteo REALMENTE despegado.
--   (4) EL TERCER BRAZO por chip en `cita_select_prestador` y
--       `cita_update_prestador`.
--
-- ── POR QUÉ EL PREDICADO VIVE EN UN SOLO LUGAR ───────────────────────────
-- Lo consumen el CONTADOR (antes) y el DESPEGUE (después). Si se escribe dos
-- veces, derivan — y ésa es exactamente la forma de D-494, que esta misma
-- sesión probó que no es prolijidad: fue la causa de que el flip §6.2 no
-- alcanzara a los helpers de caso (D-532). No se repite el error el mismo día.
--
-- ── SEMÁNTICA DE INSTANTE, NO DE DÍA (decisión de la directiva) ───────────
-- "Todavía no ocurrió" = `(fecha + hora) > now() AT TIME ZONE 'America/
-- Guayaquil'`. Una cita de HOY a las 09:00, a las 15:00 ya ocurrió: no se
-- despega, porque ahí hubo (o pudo haber) acto.
--
-- **NO SE EXTRAE `cita_aun_no_ocurre`** (verificado L14.3, y por eso no se
-- toca): sus 4 copias divergen en DOS semánticas — `iniciar_atencion_paseo`
-- /`_grooming`/`_adiestramiento` comparan **día** (`fecha > hoy`), y
-- `marcar_no_show_cita` compara **instante**. Unificarlas cambiaría el
-- comportamiento de las tres `iniciar_*`. Es su deuda, no la de esta
-- migración, y meterla acá sería una cura escondida en un gate ajeno.
--
-- ── LA LLAVE DEL TERCER BRAZO: EL TIPO, NO LA OFERTA (L15, §11.1 v2.3) ────
-- `evento_cita_servicio` **no guarda `prestador_servicio_id`** — guarda
-- `prestador_id` y `tipo_servicio` (slug). El chip apunta a la OFERTA, así
-- que el cruce se hace por **(prestador_id, tipo_servicio)**.
-- **Es EQUIVALENTE por construcción, no una aproximación:** los chips se dan
-- y se quitan SIEMPRE a oficio completo (`obtenerOficiosNegocio` devuelve
-- `{oficio, servicioIds[]}` y el INSERT hace `.flatMap(o => o.servicioIds)`),
-- así que la única puerta que escribe chips no puede producir el estado
-- "tengo una de las cinco ofertas de paseo y no las otras cuatro".
-- Salvedad declarada: un INSERT directo por PostgREST podría crear chips
-- parciales (policy titular-only, ninguna superficie lo hace); si nace una
-- puerta que dé chips por oferta suelta, el brazo se relee.
--
-- ── EL INSERT NO SE TOCA, con su literal (lectura 0.2) ────────────────────
-- `cita_insert_prestador_walkin` **no tiene consumidor**: los 7 escritores de
-- `evento_cita_servicio` son SECURITY DEFINER owned by postgres (bypassan
-- RLS) y desde TS hay CERO `.insert(` sobre esa tabla (16 usos, todos
-- `.select(`). El riesgo que §11.1 declaraba —acotar el INSERT dejaría a
-- recepción sin abrir cita de mostrador— **no se materializa**, porque el
-- mostrador entra por DEFINER. Se deja intacta: tocarla no cambiaría nada
-- hoy y ensancharía el diff sin ganancia.
--
-- ── 76(g) — DECLARACIÓN: **NO RIGE** sobre esta migración ─────────────────
-- Tres funciones + dos policies. **Cero DML, cero backfill, cero cómputo de
-- anclas sobre datos vivos.** El cinturón lee catálogo (`pg_proc`/
-- `pg_policies`), jamás filas de negocio. La veda SÍ se declara —aparte— para
-- los fixtures de verificación, que escriben filas temporales en
-- BEGIN/ROLLBACK. **El radio vivo es 0** (L14.4: 78 citas, ninguna con
-- `empleado_id` NULL), así que esto se prueba con FIXTURE y su discriminador,
-- como D-532 — no hay datos vivos que lo ejerciten.
--
-- ── L-140 — privilegios, decididos por USO ───────────────────────────────
-- `_cita_despegable` es helper interno ⇒ REVOKE de todos; sus dos llamadores
-- son DEFINER y la ejecutan como owner. `contar_citas_despegables` y
-- `dar_de_baja_empleado` los llama la PANTALLA ⇒ GRANT a `authenticated`.
--
-- ── LAS TRES CONSECUENCIAS DEL BRAZO, que la letra ya nombra ─────────────
--   (a) **El empleado con el chip VE las citas del negocio de su oficio**,
--       tenga o no `empleado_id` puesto — incluidas las despegadas. Es el
--       punto: la cita huérfana vuelve a tener quién la mire.
--   (b) **PUEDE TOMARLAS**: `cita_update_prestador` lleva el mismo predicado
--       en `qual` y `with_check`, así que el brazo habilita **poner su
--       `empleado_id`** en una cita despegada. La cita vuelve al pool y
--       alguien con el chip la recoge. Es efecto QUERIDO y declarado.
--   (c) **Y habilita DEVOLVERLA al pool** (poner `empleado_id = NULL` en una
--       cita propia), por la misma simetría del `with_check`. La letra lo
--       nombra; el gate del founder lo aprueba sabiéndolo.
--
-- ── LO QUE EL BRAZO NO LLEVA ─────────────────────────────────────────────
-- **NO** se copia la rama `pe.rol = 'dueño'` que viven las 8 lectoras de
-- disponibilidad: es el eje LEGACY de `prestador_empleados.rol` (D-486), hoy
-- código muerto en este camino, y copiarlo propagaría la deuda a dos policies
-- nuevas. El titular ya entra por el PRIMER brazo (`prestador_id IN (mis
-- prestadores)`), que queda byte-idéntico.
--
-- Deudas: paga §11.1/§11.2 de la letra firmada. Toca el mismo eje que D-522
-- (el motor de agenda ciego al rol) sin cerrarla.
-- Origen: S77-A, lecturas L11 · L12 · L14 · L15.
-- ─────────────────────────────────────────────────────────────────────────


-- ── (1) EL PREDICADO, UNA SOLA VEZ ──────────────────────────────────────
-- "Cita despegable" = de esta persona · en este negocio · todavía no
-- ocurrida (INSTANTE) · en un estado donde no hubo acto.
--
-- `pendiente` entra junto a `confirmada` porque una reserva sin pagar
-- tampoco tuvo acto. `en_curso`, `completada`, `no_show`, `cancelada` y
-- `rechazada` NO se tocan: ahí hubo acto (§1 — lo hecho queda con su autor).
CREATE OR REPLACE FUNCTION public._cita_despegable(
  p_cita_id     uuid,
  p_empleado_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM evento_cita_servicio c
    WHERE c.id = p_cita_id
      AND c.empleado_id = p_empleado_id
      AND c.estado IN ('pendiente', 'confirmada')
      AND (c.fecha + c.hora) > (now() AT TIME ZONE 'America/Guayaquil')
  );
$function$;

REVOKE EXECUTE ON FUNCTION public._cita_despegable(uuid, uuid)
  FROM PUBLIC, anon, authenticated;


-- ── (2) EL CONTADOR — lo que la pantalla lee ANTES ──────────────────────
-- PEDIDO 1 del boceto M1 (B): sin este lector, la Hoja tiene que decir la
-- consecuencia SIN número (L-139: jamás un número plausible). Con él, dice
-- "tiene N citas…".
--
-- Consume EL MISMO predicado que el despegue — ésa es toda la razón por la
-- que `_cita_despegable` existe como función y no como copia.
--
-- Gate: titular del negocio del empleado, o admin. Un empleado no cuenta las
-- citas de otro.
CREATE OR REPLACE FUNCTION public.contar_citas_despegables(p_empleado_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid        uuid := auth.uid();
  v_prestador  uuid;
  v_n          int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT pe.prestador_id INTO v_prestador
  FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'empleado_no_existe' USING ERRCODE = '22023';
  END IF;

  IF NOT (
    is_admin()
    OR EXISTS (SELECT 1 FROM prestadores p
               WHERE p.id = v_prestador AND p.user_id = v_uid)
  ) THEN
    RAISE EXCEPTION 'no_es_titular' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_n
  FROM evento_cita_servicio c
  WHERE c.empleado_id = p_empleado_id
    AND public._cita_despegable(c.id, p_empleado_id);

  RETURN v_n;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.contar_citas_despegables(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.contar_citas_despegables(uuid) TO authenticated;


-- ── (3) EL RPC DE BAJA — atómico ────────────────────────────────────────
-- `activo = false` + despegue, en UNA transacción. Si algo falla, no queda
-- ni la baja sin despegue ni el despegue sin baja.
--
-- DEVUELVE EL CONTEO REALMENTE DESPEGADO, no el de antes: entre que la
-- pantalla contó y el titular confirmó, el estado pudo cambiar (otra sesión,
-- una cita que arrancó). **Es el mismo patrón de los dos momentos que ya
-- rige para los chips** (`perdioCapacidadClinicaPorChip` re-leído): la
-- advertencia se computa antes, el dato autoritativo sale después.
--
-- REBOTA SI EL EMPLEADO ES EL TITULAR — el anti-lockout de §10, gratis acá:
-- los 5 titulares tienen fila propia en `prestador_empleados` (L6) y 3 de
-- ellos tienen franjas; darse de baja a sí mismos los sacaría de su propia
-- disponibilidad. La superficie ya no lo ofrece (la Hoja del titular no monta
-- el botón), pero el motor no puede depender de eso.
CREATE OR REPLACE FUNCTION public.dar_de_baja_empleado(p_empleado_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid        uuid := auth.uid();
  v_prestador  uuid;
  v_user_emp   uuid;
  v_despegadas int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT pe.prestador_id, pe.user_id INTO v_prestador, v_user_emp
  FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'empleado_no_existe' USING ERRCODE = '22023';
  END IF;

  -- Solo el titular (o admin) da de baja. Espeja la policy
  -- `empleados_dueño_actualiza` que hoy usa `desvincularEmpleado`.
  IF NOT (
    is_admin()
    OR EXISTS (SELECT 1 FROM prestadores p
               WHERE p.id = v_prestador AND p.user_id = v_uid)
  ) THEN
    RAISE EXCEPTION 'no_es_titular' USING ERRCODE = '42501';
  END IF;

  -- ANTI-LOCKOUT (§10): el titular no se da de baja a sí mismo.
  IF EXISTS (SELECT 1 FROM prestadores p
             WHERE p.id = v_prestador AND p.user_id = v_user_emp) THEN
    RAISE EXCEPTION 'no_se_puede_dar_de_baja_al_titular' USING ERRCODE = '22023';
  END IF;

  -- (a) EL DESPEGUE — antes de la baja, para que el predicado todavía
  --     encuentre la fila del vínculo si algún día mira `activo`.
  WITH despegadas AS (
    UPDATE evento_cita_servicio c
    SET    empleado_id = NULL,
           updated_at  = now()
    WHERE  c.empleado_id = p_empleado_id
      AND  public._cita_despegable(c.id, p_empleado_id)
    RETURNING 1
  )
  SELECT count(*) INTO v_despegadas FROM despegadas;

  -- (b) LA BAJA.
  UPDATE prestador_empleados
  SET    activo = false
  WHERE  id = p_empleado_id;

  RETURN jsonb_build_object(
    'ok', true,
    'empleado_id', p_empleado_id,
    'citas_despegadas', v_despegadas
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.dar_de_baja_empleado(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.dar_de_baja_empleado(uuid) TO authenticated;


-- ── (4) EL TERCER BRAZO, POR CHIP ───────────────────────────────────────
-- Los dos brazos viejos quedan BYTE-IDÉNTICOS; el tercero se suma con OR.
-- Solo SELECT y UPDATE (el INSERT no se toca — ver cabecera).
DROP POLICY IF EXISTS cita_select_prestador ON public.evento_cita_servicio;
CREATE POLICY cita_select_prestador
  ON public.evento_cita_servicio
  FOR SELECT
  TO authenticated
  USING (
    (prestador_id IN ( SELECT prestadores.id FROM prestadores
                       WHERE prestadores.user_id = auth.uid()))
    OR (empleado_id IN ( SELECT prestador_empleados.id FROM prestador_empleados
                         WHERE prestador_empleados.user_id = auth.uid()
                           AND prestador_empleados.activo = true))
    -- S77-A §11.1: el chip del oficio de esta cita, en este negocio.
    OR EXISTS (
      SELECT 1
      FROM prestador_empleados pe
      JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
      JOIN prestador_servicios ps           ON ps.id = pes.servicio_id
      WHERE pe.user_id = auth.uid()
        AND pe.activo = true
        AND pe.prestador_id = evento_cita_servicio.prestador_id
        AND ps.tipo_servicio = evento_cita_servicio.tipo_servicio
    )
  );

DROP POLICY IF EXISTS cita_update_prestador ON public.evento_cita_servicio;
CREATE POLICY cita_update_prestador
  ON public.evento_cita_servicio
  FOR UPDATE
  TO authenticated
  USING (
    (prestador_id IN ( SELECT prestadores.id FROM prestadores
                       WHERE prestadores.user_id = auth.uid()))
    OR (empleado_id IN ( SELECT prestador_empleados.id FROM prestador_empleados
                         WHERE prestador_empleados.user_id = auth.uid()
                           AND prestador_empleados.activo = true))
    OR EXISTS (
      SELECT 1
      FROM prestador_empleados pe
      JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
      JOIN prestador_servicios ps           ON ps.id = pes.servicio_id
      WHERE pe.user_id = auth.uid()
        AND pe.activo = true
        AND pe.prestador_id = evento_cita_servicio.prestador_id
        AND ps.tipo_servicio = evento_cita_servicio.tipo_servicio
    )
  )
  WITH CHECK (
    (prestador_id IN ( SELECT prestadores.id FROM prestadores
                       WHERE prestadores.user_id = auth.uid()))
    OR (empleado_id IN ( SELECT prestador_empleados.id FROM prestador_empleados
                         WHERE prestador_empleados.user_id = auth.uid()
                           AND prestador_empleados.activo = true))
    OR EXISTS (
      SELECT 1
      FROM prestador_empleados pe
      JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
      JOIN prestador_servicios ps           ON ps.id = pes.servicio_id
      WHERE pe.user_id = auth.uid()
        AND pe.activo = true
        AND pe.prestador_id = evento_cita_servicio.prestador_id
        AND ps.tipo_servicio = evento_cita_servicio.tipo_servicio
    )
  );


-- ── EL CINTURÓN IN-MIGRACIÓN (precedente D-495; y el de D-532, que abortó
--    contra su propio comentario — acá NINGÚN comentario reproduce un
--    literal que el censo persiga). ────────────────────────────────────────
DO $cinturon$
DECLARE
  v_pol      int;
  v_brazos   int;
  v_fns      int;
  v_insert   int;
  v_legacy   int;
  v_acl      text;
BEGIN
  -- (1) Las DOS policies existen, con su cmd y su rol.
  SELECT count(*) INTO v_pol
  FROM pg_policies
  WHERE schemaname='public' AND tablename='evento_cita_servicio'
    AND policyname IN ('cita_select_prestador','cita_update_prestador')
    AND permissive='PERMISSIVE' AND roles::text = '{authenticated}';
  IF v_pol <> 2 THEN
    RAISE EXCEPTION 'cinturon: se esperaban 2 policies de agenda intactas en forma, hay %', v_pol;
  END IF;

  -- (2) LAS TRES tienen el tercer brazo. `cita_update_prestador` lo lleva en
  --     qual Y with_check: si faltara en el with_check, el empleado VERÍA y
  --     no podría TOMAR — media cura, que es la peor.
  SELECT count(*) INTO v_brazos
  FROM pg_policies
  WHERE schemaname='public' AND tablename='evento_cita_servicio'
    AND ((policyname='cita_select_prestador'
          AND qual LIKE '%prestador_empleado_servicios%')
      OR (policyname='cita_update_prestador'
          AND qual LIKE '%prestador_empleado_servicios%'
          AND coalesce(with_check,'') LIKE '%prestador_empleado_servicios%'));
  IF v_brazos <> 2 THEN
    RAISE EXCEPTION 'cinturon: el tercer brazo no esta completo (qual y with_check), hay %', v_brazos;
  END IF;

  -- (3) El INSERT quedó INTACTO — se declara que no se tocó, no se supone.
  SELECT count(*) INTO v_insert
  FROM pg_policies
  WHERE schemaname='public' AND tablename='evento_cita_servicio'
    AND policyname='cita_insert_prestador_walkin'
    AND coalesce(with_check,'') NOT LIKE '%prestador_empleado_servicios%';
  IF v_insert <> 1 THEN
    RAISE EXCEPTION 'cinturon: la policy de INSERT no esta como se declaro (intacta)';
  END IF;

  -- (4) El brazo NO arrastró el eje legacy de rol (D-486).
  SELECT count(*) INTO v_legacy
  FROM pg_policies
  WHERE schemaname='public' AND tablename='evento_cita_servicio'
    AND (coalesce(qual,'')||coalesce(with_check,'')) LIKE '%pe.rol%';
  IF v_legacy <> 0 THEN
    RAISE EXCEPTION 'cinturon: una policy de agenda arrastro el eje legacy de rol (D-486)';
  END IF;

  -- (5) Las tres funciones nacieron con sus firmas.
  SELECT count(*) INTO v_fns
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public'
    AND p.oid::regprocedure::text IN (
      '_cita_despegable(uuid,uuid)',
      'contar_citas_despegables(uuid)',
      'dar_de_baja_empleado(uuid)');
  IF v_fns <> 3 THEN
    RAISE EXCEPTION 'cinturon: se esperaban 3 firmas nuevas, hay %', v_fns;
  END IF;

  -- (6) L-140 por USO: el helper interno sin nadie; los dos de pantalla con
  --     authenticated y sin anon. Se lee el proacl literal.
  SELECT coalesce(array_to_string(p.proacl,' '),'') INTO v_acl
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.oid::regprocedure::text='_cita_despegable(uuid,uuid)';
  IF v_acl LIKE '%anon=%' OR v_acl LIKE '%authenticated=%' THEN
    RAISE EXCEPTION 'cinturon: _cita_despegable conserva anon/authenticated (L-140). proacl = %', v_acl;
  END IF;

  SELECT count(*) INTO v_fns
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.oid::regprocedure::text IN ('contar_citas_despegables(uuid)','dar_de_baja_empleado(uuid)')
    AND coalesce(array_to_string(p.proacl,' '),'') LIKE '%authenticated=%'
    AND coalesce(array_to_string(p.proacl,' '),'') NOT LIKE '%anon=%';
  IF v_fns <> 2 THEN
    RAISE EXCEPTION 'cinturon: los RPC de pantalla no tienen el GRANT declarado (authenticated si, anon no)';
  END IF;

  RAISE NOTICE 'cinturon OK: 2 policies · tercer brazo en qual y with_check · INSERT intacto · 0 eje legacy · 3 firmas · L-140 por uso';
END;
$cinturon$;
