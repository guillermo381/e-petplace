-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · LA CAPACIDAD PRESENCIAL SE MUDA AL CATÁLOGO — muere el `'paseo'`
-- hardcodeado (14-ago-2026)
--
-- ORIGEN: **hallazgo de C**, y lo verifiqué antes de aceptarlo. C midió que
-- `puede_ofrecer_rol_recepcion` y la composición de `ATENDER` **estaban
-- divergiendo sobre la misma columna**: un negocio de SOLO paseos contestaba
-- `true` al gate de recepción —ofreciendo el rol para un mostrador que no
-- existe— mientras `ATENDER` decía que no.
--
-- **La cura de datos del paseo los hizo coincidir POR DATO** (los 9 en
-- `false`), y C lo dijo con precisión: *«si alguien vuelve a mover esa
-- columna, vuelven a ser dos»*. **Tenía razón, y el problema es más viejo que
-- su caso.**
--
-- 🔴 LO QUE MEDÍ AL VERIFICARLO, y es un defecto MÍO de hace dos horas:
--    **mi propio trigger `_trg_ps_paseo_sin_local` LLEVA EL LITERAL `'paseo'`
--    EN SU CUERPO.** Es letra en el código — la misma clase que la sesión
--    persiguió todo el día. *Un oficio hardcodeado en un trigger es una regla
--    de producto escondida donde nadie la busca.*
--
--    Y medido: **`tipos_servicio` NO tenía ninguna columna de modalidad** ⇒
--    la capacidad presencial **no vivía en ningún lado**: vivía repetida en
--    el trigger (server) y en una tabla de la pantalla (cliente).
--
-- ⇒ **SE MUDA AL CATÁLOGO.** `tipos_servicio.admite_atencion_local` es UNA
--   verdad que los dos leen. El trigger deja de nombrar oficios; la pantalla
--   deja de mantener su lista. *No es refactor: es que la regla pase a vivir
--   donde se puede consultar.*
--
-- **Y el día que un oficio nuevo entre, su modalidad viene con él** — hoy
-- había que acordarse de tocar un trigger y una constante de UI.
--
-- 76(g): 🔴 **RIGE** — la columna nace con DEFAULT y se corrige el paseo (1
-- fila de catálogo). Se declara.
-- REVERSA escrita ANTES, y avisa que revertir REINSTALA la divergencia.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

ALTER TABLE public.tipos_servicio
  ADD COLUMN IF NOT EXISTS admite_atencion_local boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.tipos_servicio.admite_atencion_local IS
  '¿Este OFICIO puede atenderse en el local del negocio? Es capacidad del '
  'oficio, no elección del prestador — la elección es `prestador_servicios.'
  'atiende_local`, y solo existe donde ésta es true. FUENTE ÚNICA: la lee el '
  'trigger que la hace cumplir Y la pantalla que decide si DIBUJA el toggle. '
  'Antes vivía repetida en los dos y podían divergir (hallazgo de C, S97).';

-- La firma del founder del 14-ago, ahora como DATO y no como literal.
UPDATE public.tipos_servicio SET admite_atencion_local = false WHERE codigo = 'paseo';

-- ── EL TRIGGER DEJA DE NOMBRAR OFICIOS ───────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_ps_paseo_sin_local()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_admite boolean;
BEGIN
  IF NOT NEW.atiende_local THEN RETURN NEW; END IF;   -- nada que vigilar

  SELECT admite_atencion_local INTO v_admite
    FROM tipos_servicio WHERE codigo = NEW.tipo_servicio;

  -- Un tipo que no está en el catálogo NO se bloquea acá: esa es otra
  -- validación y tiene su propia FK. Bloquearlo desde este guard sería
  -- hacerle decir a un guard algo que no vino a decir.
  IF v_admite IS NOT NULL AND v_admite = false THEN
    RAISE EXCEPTION 'oficio_no_atiende_en_local: «%» no se atiende en el local del negocio — su modalidad la fija el catálogo (tipos_servicio.admite_atencion_local)', NEW.tipo_servicio
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $function$;

-- ── EL LECTOR PARA LA PANTALLA (pedido implícito de C) ───────────────────
CREATE OR REPLACE FUNCTION public.obtener_modalidades_por_oficio()
RETURNS TABLE(tipo_servicio text, admite_atencion_local boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
  -- Catálogo puro: sin sesión no hay nada privado que proteger, pero igual
  -- se cierra a `authenticated` (L-140) porque no tiene consumidor anónimo.
  SELECT codigo, admite_atencion_local FROM tipos_servicio WHERE activo;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_modalidades_por_oficio() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_modalidades_por_oficio() TO authenticated;

-- ── CINTURÓN CON DISCRIMINADOR ───────────────────────────────────────────
DO $$
DECLARE v_id uuid; v_n int; v_def text;
BEGIN
  SET LOCAL ROLE postgres;

  -- ① el literal murió del cuerpo del trigger
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='_trg_ps_paseo_sin_local';
  IF v_def LIKE '%= ''paseo''%' THEN
    RAISE EXCEPTION 'CINTURON: el literal paseo SIGUE en el cuerpo del trigger';
  END IF;

  -- ② el catálogo lo dice
  IF (SELECT admite_atencion_local FROM tipos_servicio WHERE codigo='paseo') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'CINTURON: el catalogo no marca el paseo';
  END IF;

  -- ③ EL DISCRIMINADOR: sigue rebotando, ahora POR CATÁLOGO
  SELECT id INTO v_id FROM prestador_servicios WHERE tipo_servicio='paseo' LIMIT 1;
  IF v_id IS NULL THEN RAISE EXCEPTION 'CINTURON ABORTA: sin paseo vivo, la cura no discrimina'; END IF;
  BEGIN
    UPDATE prestador_servicios SET atiende_local = true WHERE id = v_id;
    RAISE EXCEPTION 'CINTURON 🔴: el paseo acepto atiende_local — el guard por catalogo no rige';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  -- ④ CONTRA-CASO: un oficio que SÍ admite local sigue pudiendo
  SELECT id INTO v_id FROM prestador_servicios ps
   WHERE EXISTS (SELECT 1 FROM tipos_servicio t WHERE t.codigo=ps.tipo_servicio AND t.admite_atencion_local)
   LIMIT 1;
  IF v_id IS NULL THEN RAISE EXCEPTION 'CINTURON ABORTA: sin oficio que admita local — el contra-caso no existe'; END IF;
  UPDATE prestador_servicios SET atiende_local = true WHERE id = v_id;   -- no debe rebotar

  -- ⑤ el lector devuelve el catálogo entero y marca al paseo
  SELECT count(*) INTO v_n FROM obtener_modalidades_por_oficio();
  IF v_n = 0 THEN RAISE EXCEPTION 'CINTURON: el lector devolvio 0 oficios'; END IF;
  IF (SELECT admite_atencion_local FROM obtener_modalidades_por_oficio() WHERE tipo_servicio='paseo') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'CINTURON: el lector no marca el paseo';
  END IF;

  RAISE NOTICE 'CINTURON catalogo: el literal murio · el paseo REBOTA por catalogo · un oficio que admite local PASA · el lector devuelve % oficios', v_n;
END $$;

COMMIT;
