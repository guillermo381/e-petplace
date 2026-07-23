-- ─────────────────────────────────────────────────────────────────────
-- S75-A0 (ejecución) · EL VALOR 'administrador' NACE APARTE (OK founder S75)
--
-- DECISIÓN DE MESA firmada con el censo a la vista
-- (docs/relevamientos/2026-07-23-s75a-censo-vocabulario-dueno-administrador.md):
-- 'administrador' nace como valor SEPARADO de empleado_roles.rol; 'dueño'
-- queda RESERVADO al titular — jamás asignable desde una pantalla, jamás en
-- el selector.
--
-- EL PORQUÉ (al canon): el censo probó que el motor YA cumple la separación
-- de la letra §4 (LETRA_ROLES_EQUIPO_S74) sin haber sido diseñado para eso —
-- quitar la fila 'dueño' al titular NO le quita el poder (el brazo 2 de
-- empleado_tiene_rol lo repone: 'dueño' = ANY(p_roles) AND
-- prestadores.user_id = auth.uid()), mientras que quitar una fila
-- 'administrador' a un empleado SÍ se lo quitaría — que es lo correcto.
-- Renombrar destruiría ese mapeo 1:1 letra↔motor; convivir (mismo valor,
-- voz distinta) haría dos palabras para el mismo poder (el error 'otro' de
-- S72, prohibido por la letra §3). Valor aparte = letra↔motor 1:1.
--
-- ADITIVA PURA: solo AMPLÍA el dominio permitido del CHECK. Cero fila
-- reescrita, cero backfill, cero policy tocada. Los gates de rol de hoy
-- (empleado_roles_{insert,delete,select}_duenio, ARRAY['dueño']) se quedan
-- TAL CUAL — es exactamente lo que la letra §10.2 firmó: solo el titular
-- nombra administradores. Esta migración habilita el valor; el gate de
-- gestión que lo usa (D-513) llega por separado con su propio censo y OK.
--
-- 76(g) — VEDA DE ESCRITURA: NO RIGE. DDL de un CHECK; cero cómputo de
-- anclas sobre datos vivos, cero UPDATE de filas.
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.empleado_roles
  DROP CONSTRAINT empleado_roles_rol_check;

ALTER TABLE public.empleado_roles
  ADD CONSTRAINT empleado_roles_rol_check
  CHECK (rol = ANY (ARRAY['dueño'::text, 'administrador'::text, 'profesional'::text, 'recepcion'::text]));

COMMENT ON CONSTRAINT empleado_roles_rol_check ON public.empleado_roles IS
  'S75 A0: administrador nace APARTE. dueño = titular (reservado, jamás '
  'asignable); administrador = rol removible del eje administrativo '
  '(LETRA_ROLES_EQUIPO_S74 §2). profesional/recepcion desde S73.';

-- Cinturón: el valor nuevo es aceptado y el viejo intacto.
DO $c$
DECLARE v_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_def
  FROM pg_constraint WHERE conname='empleado_roles_rol_check'
    AND conrelid='public.empleado_roles'::regclass;
  IF v_def NOT LIKE '%administrador%' THEN
    RAISE EXCEPTION 'CINTURON A0: el CHECK no admite administrador: %', v_def;
  END IF;
  IF v_def NOT LIKE '%dueño%' OR v_def NOT LIKE '%profesional%' OR v_def NOT LIKE '%recepcion%' THEN
    RAISE EXCEPTION 'CINTURON A0: el CHECK perdio un valor viejo: %', v_def;
  END IF;
  RAISE NOTICE 'CINTURON A0 OK: %', v_def;
END
$c$;

COMMIT;
