-- ============================================================================
-- S106-A tanda 3 · EL LECTOR DE LA VERIFICACIÓN PROFESIONAL
--
-- ── 🔴 LO QUE EL CENSO ENCONTRÓ, Y ES LO CONTRARIO DE LO QUE SE ESPERABA ───
-- El founder firmó *«solo veterinarios CERTIFICADOS pueden activar
-- telemedicina»* como si fuera trabajo nuevo. **Medido contra el objeto, el
-- gate YA ES LEY, y de punta a punta:**
--
--   · `trg_ps_verificacion_profesional` — trigger BEFORE INSERT OR UPDATE OF
--     `activo, tipo_servicio` sobre `prestador_servicios`, cableado desde S79.
--     Si el tipo `requiere_validacion_admin` y el negocio no tiene un
--     `titulo_profesional` o `registro_senescyt` **aprobado**, rebota
--     `verificacion_profesional_pendiente` (23514).
--   · `tipos_servicio.telemedicina.requiere_validacion_admin = true` — ya.
--   · `guardarServicioVeterinaria` **ya mapea el código tipado**.
--   · `voz-error-vet.ts:152` **ya tiene su voz**.
--
-- ⇒ *No hacía falta construir el gate: hacía falta MEDIR que existía.* Esta
-- migración **no lo toca**.
--
-- ── EL HUECO REAL, Y ES DE OTRA CLASE ──────────────────────────────────────
-- **No hay forma de PREGUNTAR.** El motor rechaza, pero nada deja que la
-- superficie sepa antes de dibujar. Hoy la única manera de averiguar si un vet
-- puede activar telemedicina **es intentarlo y fallar**.
--
-- > *Un toggle que se mueve y rebota no es honesto: promete una acción que el
-- > servidor va a negar. La Ley 23 —«la puerta no ofrece lo que va a
-- > rechazar»— pide justamente lo contrario.*
--
-- Esto lo cierra: un lector para que la pieza pueda decir **por qué** no se
-- puede, y qué hacer.
--
-- ── 🔴 ES EL ESPEJO EXACTO DEL PREDICADO DEL TRIGGER, Y ESO SE EJERCE ──────
-- Precedente de la casa: `puede_encender_vitrina` (S78), *«el espejo EXACTO
-- del predicado del trigger»*, con un discriminador de NO-divergencia.
-- **Un lector que se parece al guard pero no es él miente el día que uno de
-- los dos se corrija** — y miente en la dirección peligrosa: diciendo «podés»
-- a quien el motor va a rechazar. El cinturón de abajo los corre a los dos
-- contra el mismo prestador y **exige que coincidan**.
--
-- ── POR QUÉ NO SE PARAMETRIZA POR SERVICIO ─────────────────────────────────
-- El trigger gatea por `requiere_validacion_admin` del TIPO, pero el documento
-- que exige es del NEGOCIO y es el mismo para todos. ⇒ la pregunta honesta es
-- *«¿este negocio tiene su verificación profesional?»*, y se contesta una vez.
-- *Parametrizar por servicio sugeriría que la respuesta puede variar entre
-- oficios, y hoy no puede.*
--
-- ── VEDA 76(g): NO RIGE. Función nueva, cero DDL de tablas, cero backfill.
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-verificacion-profesional-lector.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prestador_verificacion_profesional(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  /* 🔴 EL PREDICADO, COPIADO DEL TRIGGER Y NO REESCRITO — los dos tipos de
     documento y el estado `aprobado`. Cambiar uno sin el otro es lo que el
     cinturón de esta migración existe para impedir. */
  SELECT EXISTS (
    SELECT 1 FROM prestador_documentos d
    WHERE d.prestador_id = p_prestador_id
      AND d.tipo IN ('titulo_profesional', 'registro_senescyt')
      AND d.estado = 'aprobado'
  );
$function$;

COMMENT ON FUNCTION public.prestador_verificacion_profesional(uuid) IS
  'S106 · ¿Este negocio tiene su verificacion profesional aprobada? Espejo EXACTO '
  'del predicado de trg_ps_verificacion_profesional. Existe para que la superficie '
  'pueda decir POR QUE no se puede activar, en vez de enterarse al fallar.';

REVOKE EXECUTE ON FUNCTION public.prestador_verificacion_profesional(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.prestador_verificacion_profesional(uuid) TO authenticated;

-- ── CINTURÓN: EL DISCRIMINADOR DE NO-DIVERGENCIA ───────────────────────────
-- No basta con que el lector devuelva algo: tiene que devolver **lo mismo que
-- decide el trigger**. Se prueban los DOS lados con dos prestadores reales de
-- veredicto opuesto, y el lado negativo se fabrica **dentro de la transacción**
-- porque hoy los 5 negocios médicos vivos están TODOS verificados —
-- *sin fabricarlo, el brazo que importa no se ejercería nunca.*
DO $cinturon$
DECLARE
  v_rol_mig text := current_user;    -- ⚠️ jamás RESET ROLE
  v_verificado uuid; v_sin uuid; v_ok boolean; v_rebote text := '(no rebotó)';
BEGIN
  IF has_function_privilege('anon', 'public.prestador_verificacion_profesional(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: el lector quedo alcanzable por anon';
  END IF;

  -- ① EL LADO POSITIVO — un negocio verificado de verdad.
  SELECT d.prestador_id INTO v_verificado
  FROM prestador_documentos d
  WHERE d.tipo IN ('titulo_profesional','registro_senescyt') AND d.estado='aprobado'
  LIMIT 1;
  IF v_verificado IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay ningun prestador verificado para ejercer el lado positivo';
  END IF;
  IF public.prestador_verificacion_profesional(v_verificado) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'cinturon: el lector dijo NO sobre un negocio con documento aprobado';
  END IF;

  -- ② EL LADO NEGATIVO — se fabrica: un prestador sin documento aprobado.
  SELECT pr.id INTO v_sin
  FROM prestadores pr
  WHERE NOT EXISTS (
    SELECT 1 FROM prestador_documentos d
    WHERE d.prestador_id = pr.id
      AND d.tipo IN ('titulo_profesional','registro_senescyt') AND d.estado='aprobado')
  LIMIT 1;
  IF v_sin IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay ningun prestador SIN verificacion; el lado negativo no se puede ejercer';
  END IF;
  IF public.prestador_verificacion_profesional(v_sin) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'cinturon: el lector dijo SI sobre un negocio sin documento aprobado';
  END IF;

  -- ③ 🔴 LA NO-DIVERGENCIA: el TRIGGER, ejercido de verdad sobre ese mismo
  --    prestador. El lector dijo `false`; el motor tiene que rebotar. Si el
  --    trigger dejara pasar, los dos habrían divergido y el lector estaría
  --    mintiendo en la dirección peligrosa.
  BEGIN
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, activo, precio, duracion_minutos)
    VALUES (v_sin, 'telemedicina', true, 30, 20);
    v_rebote := '(el trigger DEJO PASAR)';
  EXCEPTION WHEN check_violation THEN
    v_rebote := SQLERRM;
  END;

  IF v_rebote NOT LIKE '%verificacion_profesional_pendiente%' THEN
    RAISE EXCEPTION 'cinturon: DIVERGENCIA — el lector dice false y el trigger contesto: %', v_rebote;
  END IF;

  RAISE NOTICE 'cinturon verificacion: OK · positivo % · negativo % · el trigger rebota tipado', v_verificado, v_sin;

  -- El INSERT de prueba nunca llegó a existir (rebotó). Nada que limpiar.
END;
$cinturon$;
