-- D-639 · EL FIXTURE QUE PRODUCE EL ROJO — corre ANTES de la cura
--
-- **Su razón de existir, y es la ficha entera:** el error de D-639 **se ve
-- idéntico al acierto**. Una pantalla que muestra de más *funciona perfecto*:
-- se ve completa, no rebota, no tiene estados vacíos. **El gate no puede ser
-- "se ve bien"** — tiene que ser este par, corrido por el camino real con JWT.
--
-- ⚠️ NO ES SINTÉTICO. El caso vive en producción (medido S85-A):
--   Thor tiene TRES prestadores con aportes propios —
--     Paseos Andres 85 · Clínica Aurora 16 · Clínica Los Shyris 1 —
--   y los tres con acceso vigente. **El fixture no simula el escenario: lo
--   mide.** *Un fixture sintético prueba la regla contra datos que uno mismo
--   eligió; éste la prueba contra los que existen.*
--
-- QUÉ TIENE QUE PASAR **HOY** (antes de la cura): el prestador B ve el
-- CONTENIDO (`datos`) de los aportes de A. **Ese es el rojo.**
-- QUÉ TIENE QUE PASAR **DESPUÉS**: B ve que EXISTEN y QUIÉN los hizo, y
-- **NO** su contenido (A3.5bis nivel ③).

BEGIN;

DO $$
DECLARE
  v_thor   uuid := (SELECT id FROM mascotas WHERE nombre='Thor' LIMIT 1);
  v_uid_a  uuid;  -- Paseos Andres (85 aportes)
  v_uid_b  uuid;  -- Clínica Aurora (16 aportes)
  v_pid_a  uuid;
  v_ve     integer;
  v_con_datos integer;
BEGIN
  SELECT p.id, p.user_id INTO v_pid_a, v_uid_a FROM prestadores p WHERE p.nombre_comercial='Paseos Andres';
  SELECT p.user_id INTO v_uid_b FROM prestadores p WHERE p.nombre_comercial='Clínica Aurora';

  IF v_thor IS NULL OR v_uid_a IS NULL OR v_uid_b IS NULL THEN
    RAISE EXCEPTION 'ANCLA ROTA: falta Thor o alguno de los dos prestadores. El fixture no puede significar nada (L-192).';
  END IF;

  -- ── EL PRESTADOR B MIRA LOS APORTES DE A, por el camino REAL (RLS) ──
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid_b::text, 'role','authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT count(*), count(*) FILTER (WHERE em.datos IS NOT NULL AND em.datos <> '{}'::jsonb)
    INTO v_ve, v_con_datos
  FROM eventos_mascota em
  WHERE em.mascota_id = v_thor AND em.prestador_id = v_pid_a;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);

  RAISE NOTICE 'B (Clínica Aurora) ve % aportes de A (Paseos Andres), % CON su contenido.', v_ve, v_con_datos;

  IF v_con_datos > 0 THEN
    RAISE NOTICE '🔴 ROJO PRODUCIDO — el nivel ③ de A3.5bis NO se cumple: B lee el CONTENIDO de los aportes de A.';
  ELSE
    RAISE NOTICE '✅ VERDE — B no lee contenido ajeno.';
  END IF;
END $$;

ROLLBACK;  -- solo lee; el ROLLBACK es disciplina, no necesidad
