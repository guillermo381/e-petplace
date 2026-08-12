-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · EL PASO DE ENTENDIMIENTO QUEDA REGISTRADO — el productor que faltaba.
--
-- `LETRA_RECORRIDO_DESPENSA_S96` §5.4 (y `MODELO_DESPENSA` §6, enmienda S96):
-- si el dueño busca un producto con el alérgeno de su mascota, la app
-- advierte y lo deja decidir, «con un paso explícito de entendimiento que
-- QUEDA REGISTRADO». La pista D midió el hueco (12-ago): ese paso no tenía
-- productor — vivía en estado del carrito y moría con la pantalla.
--
-- Forma (decisión pista A, regla 67): tabla APPEND-ONLY. El registro jamás se
-- edita ni se borra — es evidencia de una decisión informada, no preferencia.
-- La PANTALLA decide cuándo re-preguntar (puede leer los propios por RLS);
-- el motor solo garantiza que lo entendido quede escrito.
--
-- 76(g): NO RIGE — tabla nueva vacía + una función. Sin anclas, sin veda.
-- Reversa: scripts/s96/2026-08-12-s96-m13-REVERSA.sql (escrita ANTES; declara
-- que con entendimientos reales adentro NO se corre).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE public.alergia_entendimientos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id),
  mascota_id    uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
  producto_id   uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  alergenos     text[] NOT NULL CHECK (alergenos <> '{}'),
  registrado_en timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.alergia_entendimientos IS
  'S96 §5.4: el paso explícito de entendimiento ante la advertencia de '
  'alergia. APPEND-ONLY: jamás se edita ni se borra — es la evidencia de que '
  'la app advirtió y el dueño decidió informado. La pantalla decide cuándo '
  're-preguntar; acá solo se garantiza que quede escrito.';

ALTER TABLE public.alergia_entendimientos ENABLE ROW LEVEL SECURITY;

-- El dueño lee LO SUYO; el equipo lee (soporte). Nadie escribe por tabla
-- (la puerta es la función), nadie edita, nadie borra: esas policies NO
-- EXISTEN a propósito — append-only por estructura.
CREATE POLICY alergia_entendimientos_select ON public.alergia_entendimientos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

REVOKE ALL ON public.alergia_entendimientos FROM PUBLIC, anon;
GRANT SELECT ON public.alergia_entendimientos TO authenticated;

CREATE INDEX idx_alergia_entendimientos_user
  ON public.alergia_entendimientos (user_id, mascota_id, producto_id);

-- ── La puerta ────────────────────────────────────────────────────────────────
CREATE FUNCTION public.registrar_entendimiento_alergia(
  p_producto_id uuid,
  p_mascota_id  uuid,
  p_alergenos   text[]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id  uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'sin_sesion' USING ERRCODE = '42501';
  END IF;
  IF p_alergenos IS NULL OR p_alergenos = '{}' THEN
    RAISE EXCEPTION 'alergenos_requeridos: un entendimiento sin alérgeno no registra nada' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM productos WHERE id = p_producto_id) THEN
    RAISE EXCEPTION 'producto_no_existe' USING ERRCODE = '22023';
  END IF;
  -- El mismo predicado que el destino por ítem: LA FAMILIA, jamás el acceso
  -- de prestador (M2 de esta sesión).
  IF NOT _user_es_familia_de_mascota(p_mascota_id, v_uid) THEN
    RAISE EXCEPTION 'mascota_sin_acceso' USING ERRCODE = '42501';
  END IF;

  INSERT INTO alergia_entendimientos (user_id, mascota_id, producto_id, alergenos)
  VALUES (v_uid, p_mascota_id, p_producto_id, p_alergenos)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('entendimiento_id', v_id, 'registrado', true);
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_entendimiento_alergia(uuid, uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_entendimiento_alergia(uuid, uuid, text[]) TO authenticated;

-- ── CINTURÓN — camino real con la vuelta de rol contra current_user
--    capturado (hallazgo M2: db push corre como cli_login_postgres) ──────────
DO $$
DECLARE
  v_rol_original text := current_user;
  v_duenio    uuid;
  v_mascota   uuid;
  v_ajeno     uuid;
  v_producto  uuid;
  v_id        uuid;
  v_ok        boolean;
  v_n         int;
BEGIN
  -- Sujetos por el MISMO predicado que usa la función (lección M2: el sujeto
  -- del test se elige con el predicado del gate, no con el primer id que haya).
  SELECT fm.user_id, fm.mascota_id INTO v_duenio, v_mascota
    FROM (SELECT f.user_id, m.id AS mascota_id
            FROM familia_miembro f
            JOIN mascotas m ON m.familia_id = f.familia_id
           WHERE _user_es_familia_de_mascota(m.id, f.user_id)
           LIMIT 1) fm;
  SELECT p.id INTO v_ajeno FROM profiles p
   WHERE NOT _user_es_familia_de_mascota(v_mascota, p.id)
     AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id AND a.activo)
   LIMIT 1;
  SELECT id INTO v_producto FROM productos LIMIT 1;
  IF v_duenio IS NULL OR v_ajeno IS NULL OR v_producto IS NULL THEN
    RAISE EXCEPTION 'cinturón sin sujetos: duenio=%, ajeno=%, producto=%', v_duenio, v_ajeno, v_producto;
  END IF;

  -- (a) la familia registra.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_duenio, 'role', 'authenticated')::text, true);
  v_id := (registrar_entendimiento_alergia(v_producto, v_mascota, ARRAY['pollo']) ->> 'entendimiento_id')::uuid;
  IF v_id IS NULL THEN RAISE EXCEPTION 'cinturón (a): no registró'; END IF;

  -- (b) el ajeno REBOTA.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_ajeno, 'role', 'authenticated')::text, true);
  v_ok := false;
  BEGIN
    PERFORM registrar_entendimiento_alergia(v_producto, v_mascota, ARRAY['pollo']);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'mascota_sin_acceso%' THEN v_ok := true;
    ELSE RAISE EXCEPTION 'cinturón (b): rebotó con otro motivo: %', SQLERRM; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (b): un ajeno registró sobre mascota que no es suya'; END IF;

  -- (c) sin alérgeno no hay entendimiento.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_duenio, 'role', 'authenticated')::text, true);
  v_ok := false;
  BEGIN
    PERFORM registrar_entendimiento_alergia(v_producto, v_mascota, '{}');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'alergenos_requeridos%' THEN v_ok := true; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (c): entró un entendimiento vacío'; END IF;

  -- (d) RLS real: el dueño LO VE, el ajeno NO (SET ROLE de verdad).
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM alergia_entendimientos WHERE id = v_id;
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturón (d): el dueño no ve su propio entendimiento'; END IF;

  -- (e) APPEND-ONLY probado, no declarado: el dueño no puede editar ni borrar
  --     lo suyo (cero policies de UPDATE/DELETE + grants revocados).
  v_ok := false;
  BEGIN
    UPDATE alergia_entendimientos SET alergenos = ARRAY['res'] WHERE id = v_id;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n = 0 THEN v_ok := true; END IF;  -- RLS silenciosa: 0 filas también es rebote
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (e): el registro se EDITÓ — append-only roto'; END IF;
  v_ok := false;
  BEGIN
    DELETE FROM alergia_entendimientos WHERE id = v_id;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n = 0 THEN v_ok := true; END IF;
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (e): el registro se BORRÓ — append-only roto'; END IF;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_ajeno, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_n FROM alergia_entendimientos WHERE id = v_id;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (d2): el ajeno VE un entendimiento que no es suyo'; END IF;

  EXECUTE format('SET LOCAL ROLE %I', v_rol_original);
  PERFORM set_config('request.jwt.claims', NULL, true);

  -- (f) residuo 0 (borra el motor por dentro, que sí puede: es el dueño de la tabla).
  DELETE FROM alergia_entendimientos WHERE id = v_id;
  SELECT count(*) INTO v_n FROM alergia_entendimientos;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (f): residuo %', v_n; END IF;

  RAISE NOTICE 'CINTURÓN M13 VERDE: registra la familia, rebota el ajeno, append-only PROBADO, residuo 0';
END $$;

COMMIT;
