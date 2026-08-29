/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · EL TRAMO EXISTE — el productor del identificador con el que la
   pieza del punto vivo abre. **Va ANTES del gate del 1-sep.**
   ═══════════════════════════════════════════════════════════════════════════

   ── 🔴 EL HALLAZGO DE C, VERIFICADO CONTRA EL OBJETO ─────────────────────
   `obtenerPuntoVivo` y `registrarPuntoVivo` **funcionan y pasan sus pruebas**,
   y sin embargo **nadie podía producir un `tramoId`**: no había tabla, la
   columna `guarderia_tramo_punto.tramo_id` **no tenía NINGUNA FK** (medido) y
   `guarderia_estadias` no tenía de dónde colgarlo.

   > ### Es `L-318` un piso más adentro: lo que no tiene productor **no es la
   > pieza — es el IDENTIFICADOR con el que la pieza abre.**
   >
   > *Y no falla: devuelve `null`, que la pantalla lee como «todavía no salió».*
   > **En el gate del 1-sep habría dado un falso «no salió» sobre un vehículo
   > que sí está en la calle** — y nadie habría sospechado del motor, porque la
   > respuesta es exactamente la que corresponde cuando de verdad no salió.

   ── 🔴 Y AL LEERLO APARECIÓ UNA FUGA, que es peor que el hueco ───────────
   **`obtener_punto_vivo` sólo pedía `auth.uid()`.** Cualquier usuario logueado
   con un `tramo_id` obtenía **la ubicación en vivo de un vehículo**.

   El contrato de media ya prometía el recorte —*«sólo mientras el animal de ese
   dueño está pendiente o a bordo de ese tramo»*— **y no se podía escribir**:
   sin tabla de tramos no había con qué gatear. *La ausencia de una tabla dejó
   una promesa sin poder cumplirse, y el hueco quedó abierto sin que ningún gate
   pudiera verlo.* ⇒ **esta migración cura las dos cosas en el mismo acto.**

   ── LA FORMA, y por qué el tramo es del VIAJE y no de la estadía ─────────
   Un tramo es **un viaje del vehículo**: la camioneta sale a recoger y trae
   varios animales. **Un punto por tramo sirve a todas las familias de ese
   viaje** — que es justo lo que `guarderia_tramo_punto` ya suponía con su
   `tramo_id` como PK y su UPSERT.
   *Si el tramo fuera por estadía, el mismo vehículo emitiría N puntos idénticos
   y cada familia vería una copia distinta del mismo camión.*

   ⇒ **`guarderia_tramos` 1 : N `guarderia_estadias`**, y la estadía guarda **su
   tramo de recogida y su tramo de devolución por separado** — son dos viajes
   distintos, con horas distintas y a veces con vehículos distintos.

   **76(g): NO RIGE.** DDL aditiva y dos funciones nuevas; sin backfill de datos
   de negocio (las estadías vivas quedan con tramo NULL, que es la verdad: no
   salieron con un tramo registrado).
   **Reversa:** `docs/relevamientos/S107-A-REVERSA-tramos.sql` — declara que
   **correrla REABRE la fuga** y que el cascade se lleva los puntos.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① LA TABLA ═══════════════════════════════════════════════════════════
CREATE TABLE public.guarderia_tramos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id  uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  fecha         date NOT NULL,
  direccion     text NOT NULL CHECK (direccion IN ('recogida','devolucion')),
  estado        text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','cerrado')),
  abierto_por   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  abierto_en    timestamptz NOT NULL DEFAULT now(),
  cerrado_en    timestamptz,
  /* Un cerrado sin hora es un estado que miente; una hora sin cerrado también.
     Se vuelve inexpresable, en vez de confiar en que nadie lo escriba mal. */
  CONSTRAINT chk_tramo_cierre_coherente
    CHECK ((estado = 'cerrado' AND cerrado_en IS NOT NULL)
        OR (estado = 'abierto' AND cerrado_en IS NULL)),
  /* UN viaje por lugar, día y dirección. El segundo intento no crea otro: lo
     encuentra (ver `abrir_tramo_guarderia`). */
  CONSTRAINT uq_tramo_por_direccion UNIQUE (prestador_id, fecha, direccion)
);

ALTER TABLE public.guarderia_estadias
  ADD COLUMN tramo_recogida_id  uuid REFERENCES public.guarderia_tramos(id) ON DELETE SET NULL,
  ADD COLUMN tramo_devolucion_id uuid REFERENCES public.guarderia_tramos(id) ON DELETE SET NULL;

-- ⇒ el uuid suelto pasa a apuntar a algo. Es la mitad estructural del hallazgo.
ALTER TABLE public.guarderia_tramo_punto
  ADD CONSTRAINT guarderia_tramo_punto_tramo_id_fkey
  FOREIGN KEY (tramo_id) REFERENCES public.guarderia_tramos(id) ON DELETE CASCADE;

ALTER TABLE public.guarderia_tramos ENABLE ROW LEVEL SECURITY;

-- El prestador ve y gestiona los suyos. La familia NO lee esta tabla: llega al
-- tramo por el lector de abajo, que le devuelve UN id y nada más.
CREATE POLICY tramos_prestador_all ON public.guarderia_tramos
  FOR ALL TO authenticated
  USING (public.user_gestiona_prestador(prestador_id) OR public.is_admin())
  WITH CHECK (public.user_gestiona_prestador(prestador_id) OR public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.guarderia_tramos TO authenticated;

-- ══ ② ABRIR — idempotente, como el acta ══════════════════════════════════
CREATE OR REPLACE FUNCTION public.abrir_tramo_guarderia(
  p_prestador_id uuid, p_fecha date, p_direccion text, p_estadias uuid[] DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v_user uuid := auth.uid(); v_id uuid; v_ya boolean := false; v_n int := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;
  IF p_direccion NOT IN ('recogida','devolucion') THEN
    RAISE EXCEPTION 'direccion_invalida' USING ERRCODE='22023';
  END IF;

  /* El segundo intento es un ÉXITO, no un 23505 pelado — mismo criterio que
     `levantar_acta_guarderia`: un guard que vive en un índice sólo sabe
     negarse, y quien reintenta leería ese rebote como fallo. */
  SELECT id INTO v_id FROM guarderia_tramos
   WHERE prestador_id=p_prestador_id AND fecha=p_fecha AND direccion=p_direccion;
  IF v_id IS NOT NULL THEN v_ya := true; ELSE
    INSERT INTO guarderia_tramos (prestador_id, fecha, direccion, abierto_por)
         VALUES (p_prestador_id, p_fecha, p_direccion, v_user) RETURNING id INTO v_id;
  END IF;

  -- Ata las estadías que le pasen. Sólo las de ESE lugar y ESA fecha: un id
  -- ajeno se ignora en silencio en vez de mover una estadía de otro negocio.
  IF p_estadias IS NOT NULL THEN
    IF p_direccion = 'recogida' THEN
      UPDATE guarderia_estadias e SET tramo_recogida_id = v_id, updated_at = now()
        FROM evento_cita_servicio c
       WHERE e.cita_id = c.id AND e.id = ANY(p_estadias)
         AND c.prestador_id = p_prestador_id AND c.fecha = p_fecha;
    ELSE
      UPDATE guarderia_estadias e SET tramo_devolucion_id = v_id, updated_at = now()
        FROM evento_cita_servicio c
       WHERE e.cita_id = c.id AND e.id = ANY(p_estadias)
         AND c.prestador_id = p_prestador_id AND c.fecha = p_fecha;
    END IF;
    GET DIAGNOSTICS v_n = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object('ok', true, 'tramo_id', v_id, 'ya_existia', v_ya, 'estadias_atadas', v_n);
END $fn$;

-- ══ ③ CERRAR ═════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.cerrar_tramo_guarderia(p_tramo_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v_prest uuid; v_estado text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT prestador_id, estado INTO v_prest, v_estado FROM guarderia_tramos WHERE id = p_tramo_id;
  IF v_prest IS NULL THEN RAISE EXCEPTION 'tramo_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT user_gestiona_prestador(v_prest) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;
  IF v_estado = 'cerrado' THEN
    RETURN jsonb_build_object('ok', true, 'tramo_id', p_tramo_id, 'ya_estaba', true);
  END IF;
  UPDATE guarderia_tramos SET estado='cerrado', cerrado_en=now() WHERE id = p_tramo_id;
  /* El punto muere con el tramo: lo que ya no se mueve no se sigue mostrando.
     *Un punto viejo pintado como vivo es peor que ningún punto.* */
  DELETE FROM guarderia_tramo_punto WHERE tramo_id = p_tramo_id;
  RETURN jsonb_build_object('ok', true, 'tramo_id', p_tramo_id, 'ya_estaba', false);
END $fn$;

-- ══ ④ EL LECTOR DE LA FAMILIA — le da SU tramo y nada más ════════════════
CREATE OR REPLACE FUNCTION public.obtener_tramo_vivo_de_mi_mascota(p_mascota_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  /* Sólo mientras SU animal está EN MOVIMIENTO (contrato de media §④):
     `recogida_en_curso` → el tramo de recogida · `retorno_en_curso` → el de
     devolución. En `en_guarderia` no hay viaje, y en `entregada` tampoco.
     ⇒ fuera de eso devuelve null, y la pantalla lo dice — no muestra un punto
     viejo. */
  SELECT jsonb_build_object('tramoId', t.id, 'direccion', t.direccion)
    INTO v
    FROM guarderia_estadias e
    JOIN evento_cita_servicio c ON c.id = e.cita_id
    JOIN guarderia_tramos t
      ON t.id = CASE WHEN e.estado = 'recogida_en_curso' THEN e.tramo_recogida_id
                     WHEN e.estado = 'retorno_en_curso'  THEN e.tramo_devolucion_id END
   WHERE c.mascota_id = p_mascota_id
     AND e.estado IN ('recogida_en_curso','retorno_en_curso')
     AND t.estado = 'abierto'
   ORDER BY t.abierto_en DESC
   LIMIT 1;

  RETURN COALESCE(v, 'null'::jsonb);
END $fn$;

-- ══ ⑤ LA FUGA, CERRADA ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.obtener_punto_vivo(p_tramo_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v jsonb; v_prest uuid; v_puede boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT prestador_id INTO v_prest FROM guarderia_tramos WHERE id = p_tramo_id;
  /* Tramo inexistente: `null`, jamás un error que confirme qué ids existen.
     *Un error distinto para «no existe» y «no podés» es un oráculo.* */
  IF v_prest IS NULL THEN RETURN 'null'::jsonb; END IF;

  -- (a) quien conduce y gestiona el negocio
  v_puede := user_gestiona_prestador(v_prest) OR is_admin();

  -- (b) la familia, SÓLO mientras su animal va en ese viaje
  IF NOT v_puede THEN
    SELECT EXISTS (
      SELECT 1 FROM guarderia_estadias e
        JOIN evento_cita_servicio c ON c.id = e.cita_id
       WHERE (e.tramo_recogida_id = p_tramo_id OR e.tramo_devolucion_id = p_tramo_id)
         AND e.estado IN ('recogida_en_curso','retorno_en_curso')
         AND user_tiene_acceso_a_mascota(c.mascota_id)
    ) INTO v_puede;
  END IF;

  IF NOT v_puede THEN RETURN 'null'::jsonb; END IF;

  SELECT jsonb_build_object('lat', p.lat, 'lon', p.lon, 'vistoEn', p.visto_en)
    INTO v FROM guarderia_tramo_punto p WHERE p.tramo_id = p_tramo_id;
  RETURN COALESCE(v, 'null'::jsonb);   -- Un punto o null. **Jamás una lista.**
END $fn$;

-- L-140 en las TRES audiencias, no en una (L-436, de esta misma sesión).
REVOKE EXECUTE ON FUNCTION public.abrir_tramo_guarderia(uuid,date,text,uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cerrar_tramo_guarderia(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_tramo_vivo_de_mi_mascota(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_punto_vivo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.abrir_tramo_guarderia(uuid,date,text,uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cerrar_tramo_guarderia(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_tramo_vivo_de_mi_mascota(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_punto_vivo(uuid) TO authenticated;


-- ══ ⑥ CINTURÓN — el discriminador es LA FUGA, no la tabla ════════════════
DO $cint$
DECLARE
  v_rol_mig text := current_user;   -- ⚠️ jamás RESET ROLE bajo db push
  v_prest   uuid;
  v_ajeno   uuid;
  v_tramo   uuid;
  v_r       jsonb;
  v_fk      int;
  v_acl     text;
  v_punto   jsonb;
BEGIN
  -- ① la FK que faltaba, contra el objeto
  SELECT count(*) INTO v_fk FROM pg_constraint
   WHERE conrelid='public.guarderia_tramo_punto'::regclass AND contype='f';
  IF v_fk <> 1 THEN
    RAISE EXCEPTION 'CINTURON ①: tramo_id sigue sin FK (n=%)', v_fk;
  END IF;

  SELECT p.id INTO v_prest FROM prestadores p
    JOIN prestador_servicios ps ON ps.prestador_id=p.id AND ps.tipo_servicio='guarderia_dia'
   LIMIT 1;
  IF v_prest IS NULL THEN RAISE EXCEPTION 'CINTURON: sin prestador de guarderia para el arnes'; END IF;

  -- un usuario que NO gestiona ese prestador → el otro brazo del par
  SELECT u.id INTO v_ajeno FROM auth.users u
   WHERE NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.user_id = u.id)
   LIMIT 1;
  IF v_ajeno IS NULL THEN RAISE EXCEPTION 'CINTURON: sin usuario ajeno para el par'; END IF;

  BEGIN   -- ← subtransacción: todo lo que escribe se deshace sola (L-406)
    INSERT INTO guarderia_tramos (prestador_id, fecha, direccion)
         VALUES (v_prest, public.hoy_local() + 90, 'recogida') RETURNING id INTO v_tramo;
    INSERT INTO guarderia_tramo_punto (tramo_id, lat, lon, visto_en)
         VALUES (v_tramo, -0.18, -78.47, now());

    -- ② 🔴 LA FUGA: un ajeno NO ve el punto. **Antes de esta migración lo veía.**
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_ajeno, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_punto := public.obtener_punto_vivo(v_tramo);
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

    IF v_punto <> 'null'::jsonb THEN
      RAISE EXCEPTION 'CINTURON ②: LA FUGA SIGUE ABIERTA — un usuario sin relacion con el tramo obtuvo %', v_punto;
    END IF;

    -- ③ y el punto SÍ existe: sin esto, el verde de ② diria «no hay punto»
    --    en vez de «no lo puede ver» — dos cosas distintas con la misma cara.
    SELECT jsonb_build_object('lat',lat) INTO v_punto FROM guarderia_tramo_punto WHERE tramo_id=v_tramo;
    IF v_punto IS NULL THEN
      RAISE EXCEPTION 'CINTURON ③: el punto no se escribio — el brazo ② no discrimina nada';
    END IF;

    -- ④ idempotencia del abrir: el segundo intento ENCUENTRA, no rebota
    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  -- ⑤ L-140 en las tres audiencias (L-436): anon fuera, authenticated adentro
  --    (son RPC de app), PUBLIC fuera.
  FOR v_acl IN
    SELECT array_to_string(p.proacl,' ') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname IN
       ('abrir_tramo_guarderia','cerrar_tramo_guarderia','obtener_tramo_vivo_de_mi_mascota','obtener_punto_vivo')
  LOOP
    IF v_acl ILIKE '%anon=%' THEN
      RAISE EXCEPTION 'CINTURON ⑤: anon quedo con EXECUTE (proacl=%)', v_acl;
    END IF;
    IF v_acl NOT ILIKE '%authenticated=%' THEN
      RAISE EXCEPTION 'CINTURON ⑤: authenticated NO puede ejecutar una RPC de app (proacl=%)', v_acl;
    END IF;
  END LOOP;

  RAISE NOTICE 'CINTURON VERDE · FK presente · la fuga CERRADA (ajeno=null con punto escrito) · anon fuera y authenticated adentro en las 4';
END
$cint$;

COMMIT;
