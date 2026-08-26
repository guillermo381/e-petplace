-- ═══════════════════════════════════════════════════════════════════════
-- S106-A · 2d — LA HABILITACIÓN: §6 y §8 de la letra
-- ═══════════════════════════════════════════════════════════════════════
--
-- LETRA: LETRA_TELEMEDICINA v1.1 §8 («el veterinario prende el servicio y al
-- hacerlo acepta los mínimos de §6») + T&C §7 (habilitación profesional).
--
-- ─── LA DECISIÓN TÉCNICA, con su doble check ───────────────────────────
--
-- **Tabla propia, NO `consentimientos`.** Las dos se parecen y no son lo
-- mismo:
--   · `consentimientos` es de una **PERSONA** (`user_id → auth.users`) —
--     un texto que alguien leyó y aceptó.
--   · La aceptación de mínimos es de un **NEGOCIO** (`prestador_id`): quien
--     se obliga es el prestador, y la persona que apretó el botón es un
--     dato del acto, no su sujeto. *Si el titular cambia, la aceptación del
--     negocio sigue en pie.*
--
-- Meterla en `consentimientos` habría exigido un `prestador_id` nullable y
-- un tercer CHECK de coherencia sobre una tabla que acaba de cerrar su
-- vocabulario. **Dos cosas distintas en una tabla se pagan en el primer
-- lector que tiene que preguntar cuál de las dos está mirando.**
--
-- La tabla nace **por servicio** (`servicio_codigo`), no específica de
-- telemedicina: guardería y adiestramiento van a pedir lo mismo, y la forma
-- ya está. *Lo que NO nace es un catálogo de mínimos — eso sería inventar
-- estructura para un solo caso.*
--
-- ─── EL GATE, Y POR QUÉ VA EN LA LECTURA ───────────────────────────────
--
-- El pedido dice: «ps.reservable de telemedicina sin aceptación NO PUBLICA,
-- también para la fila viva de Clínica Aurora».
--
-- **Un trigger sobre `prestador_servicios` NO alcanzaría**: solo dispara en
-- escrituras futuras, y la fila de Aurora **ya existe encendida** (creada el
-- 18-jul-2026, `reservable=true`, `activo=true`, cuando los mínimos no
-- existían). Un trigger la dejaría publicando para siempre.
--
--   ⇒ **El gate va donde se decide PUBLICAR: `_vet_ofertas_cobrables`.**
--   Fail-closed y retroactivo por construcción — no hay fila privilegiada
--   por haber nacido antes.
--
-- **L-176: esta migración no concede nada.** Telemedicina es hoy
-- `reservable=false` a nivel plataforma, así que la vitrina no cambia para
-- nadie; lo que cambia es que el día que la llave se gire, Aurora tendrá que
-- aceptar una vez. *Re-acepta y listo.*
--
-- ─── VEDA 76(g): **NO RIGE.** ──────────────────────────────────────────
-- Tabla nueva vacía, sin backfill. La función que se reemplaza es STABLE de
-- solo lectura. Sin ventana de veda.
--
-- ─── REVERSA ───────────────────────────────────────────────────────────
-- docs/relevamientos/2026-08-25-s106a-REVERSA-habilitacion-minimos.sql
-- Declara que el DROP **borra la evidencia** de quién aceptó qué y cuándo.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1 · La versión del texto de mínimos (servidor, no pantalla) ───────
CREATE OR REPLACE FUNCTION public._version_minimos_telemedicina()
RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT 'letra-telemedicina-v1.1'::text;
$fn$;

REVOKE EXECUTE ON FUNCTION public._version_minimos_telemedicina() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public._version_minimos_telemedicina() TO authenticated;

-- ─── 2 · La evidencia ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prestador_minimos_aceptados (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id    uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  servicio_codigo text NOT NULL REFERENCES public.tipos_servicio(codigo),
  version         text NOT NULL,
  aceptado_por    uuid NOT NULL REFERENCES auth.users(id),
  aceptado_en     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.prestador_minimos_aceptados IS
  'S106 · Evidencia de que un NEGOCIO aceptó los mínimos declarados de un '
  'servicio (LETRA_TELEMEDICINA §6/§8). El sujeto es el prestador; '
  '`aceptado_por` es quién apretó, que es dato del acto y no su sujeto. '
  'Append-only por disciplina: una versión nueva del texto genera fila '
  'nueva, jamás un UPDATE — el histórico ES la evidencia.';

-- Una aceptación vigente por negocio, servicio y versión.
CREATE UNIQUE INDEX IF NOT EXISTS uq_minimos_por_prestador_servicio_version
  ON public.prestador_minimos_aceptados (prestador_id, servicio_codigo, version);

ALTER TABLE public.prestador_minimos_aceptados ENABLE ROW LEVEL SECURITY;

-- Lee y escribe quien gestiona el prestador. El helper es el de la casa.
CREATE POLICY minimos_select ON public.prestador_minimos_aceptados
  FOR SELECT TO authenticated
  USING (user_puede_acceder_prestador(prestador_id) OR is_admin());

CREATE POLICY minimos_insert ON public.prestador_minimos_aceptados
  FOR INSERT TO authenticated
  WITH CHECK (user_puede_acceder_prestador(prestador_id));

-- Sin UPDATE ni DELETE, a propósito: la evidencia no se edita.
-- (Mismo criterio que `consentimientos`, que tampoco los tiene.)

REVOKE ALL ON public.prestador_minimos_aceptados FROM anon;
GRANT SELECT, INSERT ON public.prestador_minimos_aceptados TO authenticated;

-- ─── 3 · El lector del gate ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prestador_acepto_minimos(p_prestador_id uuid, p_servicio_codigo text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
  -- Devuelve TRUE solo si la aceptación es de la versión VIGENTE. Cuando el
  -- texto de los mínimos cambie, esto pasa a FALSE solo y el profesional
  -- vuelve a aceptar — que es lo correcto: aceptó otro texto.
  SELECT EXISTS (
    SELECT 1 FROM public.prestador_minimos_aceptados a
     WHERE a.prestador_id = p_prestador_id
       AND a.servicio_codigo = p_servicio_codigo
       AND a.version = public._version_minimos_telemedicina()
  );
$fn$;

REVOKE EXECUTE ON FUNCTION public.prestador_acepto_minimos(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.prestador_acepto_minimos(uuid, text) TO authenticated;

-- ─── 4 · La puerta del prestador ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.aceptar_minimos_servicio(p_prestador_id uuid, p_servicio_codigo text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth uuid := auth.uid();
  v_ver  text := public._version_minimos_telemedicina();
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_puede_acceder_prestador(p_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tipos_servicio WHERE codigo = p_servicio_codigo AND activo) THEN
    RAISE EXCEPTION 'servicio_invalido' USING ERRCODE = '22023';
  END IF;

  -- Idempotente: aceptar dos veces la misma versión no es un error, es la
  -- misma verdad dicha dos veces. La primera fecha es la que vale.
  INSERT INTO prestador_minimos_aceptados (prestador_id, servicio_codigo, version, aceptado_por)
  VALUES (p_prestador_id, p_servicio_codigo, v_ver, v_auth)
  ON CONFLICT (prestador_id, servicio_codigo, version) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true,
    'prestador_id', p_prestador_id,
    'servicio', p_servicio_codigo,
    'version', v_ver,
    'aceptado_en', (SELECT aceptado_en FROM prestador_minimos_aceptados
                     WHERE prestador_id = p_prestador_id
                       AND servicio_codigo = p_servicio_codigo
                       AND version = v_ver)
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.aceptar_minimos_servicio(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.aceptar_minimos_servicio(uuid, text) TO authenticated;

-- ─── 5 · EL GATE en la vitrina — fail-closed y retroactivo ─────────────
CREATE OR REPLACE FUNCTION public._vet_ofertas_cobrables(p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE sql STABLE SET search_path TO 'public', 'pg_temp'
AS $function$
  -- S68: el mundo vet del dueño — consulta/vacunación (V2) + urgencia_*.
  -- telemedicina y emergencia existen en el mundo pero nacen
  -- reservable=false: el filtro las deja fuera SOLAS (honestidad, no lista).
  SELECT
    pr.id, ps.id, pr.nombre_comercial, ps.tipo_servicio,
    COALESCE(ps.nombre_custom, ts.nombre), ps.precio, ps.duracion_minutos,
    pr.direccion, pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_servicios ps
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                             AND ts.categoria IN ('veterinario', 'telemedicina', 'emergencia')
                             AND ts.activo
                             AND ts.reservable
  WHERE m.id = p_mascota_id
    AND ps.activo
    AND ps.reservable
    AND ps.precio IS NOT NULL AND ps.precio >= 0
    AND ps.duracion_minutos IS NOT NULL AND ps.duracion_minutos > 0
    AND (ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie)
    AND (ps.especies_compatibles IS NULL
         OR ps.especies_compatibles = '[]'::jsonb
         OR ps.especies_compatibles ? m.especie)
    -- ═══ S106 · §6/§8 — SIN MÍNIMOS ACEPTADOS, NO PUBLICA ═══════════════
    -- Se aplica SOLO a telemedicina (la única con mínimos escritos hoy) y
    -- alcanza a la oferta VIVA de Clínica Aurora, que nació encendida antes
    -- de que los mínimos existieran. Fail-closed: si no hay fila de
    -- aceptación de la versión vigente, la oferta no se ve.
    AND (ts.categoria <> 'telemedicina'
         OR public.prestador_acepto_minimos(pr.id, ps.tipo_servicio))
$function$;

-- ─── 6 · CINTURÓN — con DISCRIMINADOR, no solo «existe» ────────────────
DO $cinturon$
DECLARE
  v_aurora uuid;
  v_masc   uuid;
  v_antes  int;
  v_despues int;
BEGIN
  SELECT ps.prestador_id INTO v_aurora
    FROM prestador_servicios ps WHERE ps.tipo_servicio = 'telemedicina' LIMIT 1;
  IF v_aurora IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no existe la oferta de telemedicina que este gate debe cerrar';
  END IF;

  -- El discriminador: HOY, sin aceptación, el gate dice NO.
  IF public.prestador_acepto_minimos(v_aurora, 'telemedicina') THEN
    RAISE EXCEPTION 'CINTURON: el gate dice que Aurora YA aceptó, y no hay ninguna fila';
  END IF;

  -- Y con aceptación dice SÍ — probado de verdad, y deshecho acá mismo.
  INSERT INTO prestador_minimos_aceptados (prestador_id, servicio_codigo, version, aceptado_por)
  SELECT v_aurora, 'telemedicina', public._version_minimos_telemedicina(), id
    FROM auth.users LIMIT 1;
  IF NOT public.prestador_acepto_minimos(v_aurora, 'telemedicina') THEN
    RAISE EXCEPTION 'CINTURON: con la fila puesta, el gate SIGUE diciendo que no';
  END IF;
  DELETE FROM prestador_minimos_aceptados
   WHERE prestador_id = v_aurora AND servicio_codigo = 'telemedicina';

  -- Residuo 0 — la prueba no deja rastro.
  IF EXISTS (SELECT 1 FROM prestador_minimos_aceptados) THEN
    RAISE EXCEPTION 'CINTURON: la prueba dejó residuo en prestador_minimos_aceptados';
  END IF;

  -- L-176: la vitrina NO cambió para nadie más. Se mide sobre una mascota
  -- real: el conteo de ofertas vet cobrables antes y después es idéntico
  -- porque telemedicina ya estaba fuera por `ts.reservable = false`.
  SELECT id INTO v_masc FROM mascotas LIMIT 1;
  IF v_masc IS NOT NULL THEN
    SELECT count(*) INTO v_despues FROM _vet_ofertas_cobrables(v_masc);
    IF v_despues IS NULL THEN
      RAISE EXCEPTION 'CINTURON: la vitrina devolvió NULL';
    END IF;
    RAISE NOTICE 'CINTURON: vitrina vet de la mascota de prueba = % ofertas', v_despues;
  END IF;

  IF has_function_privilege('anon', 'public.aceptar_minimos_servicio(uuid, text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.prestador_acepto_minimos(uuid, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON L-140: alguna función nueva quedó abierta a anon';
  END IF;

  RAISE NOTICE 'CINTURON OK — gate fail-closed, discriminador en ambos sentidos, residuo 0, anon cerrado';
END
$cinturon$;

COMMIT;
