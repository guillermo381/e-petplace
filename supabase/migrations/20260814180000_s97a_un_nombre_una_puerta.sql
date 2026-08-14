-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · UN NOMBRE, UNA PUERTA — D-802 cerrada (firma del founder, 14-ago)
--
-- LA FIRMA: *un negocio tiene UN nombre. La fuente conceptual es la CUENTA
-- COMERCIAL — la única fila que TODO negocio tiene, incluido el vendedor
-- puro, que jamás tendrá fila de prestador. El nombre del prestador queda
-- como ESPEJO DECLARADO, no como segunda verdad.*
--
-- 🔴 LO QUE MEDÍ ANTES DE CONSTRUIR, y achicó el trabajo a la mitad:
--    **la puerta atómica YA EXISTÍA** — `actualizar_nombre_comercial(text)`
--    escribe las DOS tablas en la misma transacción, con doble gate (gestión
--    + owner). *No hacía falta inventarla.*
--
--    **PERO tiene el hueco exacto que la firma expone:**
--        IF v_prestador IS NULL THEN RAISE EXCEPTION 'no_es_titular'; END IF;
--    ⇒ **el vendedor puro NO PUEDE renombrar su negocio por esa puerta**,
--    porque resuelve el sujeto por PRESTADOR. Y la firma dice justo lo
--    contrario: el sujeto es la CUENTA.
--
--    Y la otra mitad: `actualizar_nombre_cuenta_comercial` (A, S97) escribe
--    **solo la cuenta** — *una función que escribe la mitad del nombre es la
--    divergencia esperando su turno* (literal de la firma).
--
-- ⇒ NACE `renombrar_negocio(cuenta, nombre)` como PUERTA ÚNICA, y las dos
--   viejas pasan a DELEGAR en ella. **No se dropean: tienen consumidores
--   vivos** (L-119 + D-662) y una firma que desaparece rompe distinto que una
--   que redirige.
--
-- EL DATO, medido y declarado ANTES de tocarlo:
--   · 10 negocios con prestador · **1 DIVERGE** («Dueño todos los servicios
--     (borrable)» ≠ «Todo S97 (borrable)») · 0 cuentas sin nombre.
--   ⇒ la reconciliación toca **UNA fila**, y la fuente está completa: nadie
--     se queda sin nombre.
--
-- Y EL GUARD DESPUÉS, que es la doctrina de esta misma tanda (el paseo):
-- **la divergencia queda INEXPRESABLE, no curada-hasta-el-próximo-UPDATE.**
--
-- 76(g): 🔴 **RIGE** — reconcilia 1 fila de datos. Se declara.
-- REVERSA escrita ANTES, con su SELECT probatorio y su aviso.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① LA PUERTA ÚNICA ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.renombrar_negocio(
  p_cuenta_comercial_id uuid,
  p_nombre text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid    uuid := auth.uid();
  v_nombre text;
  v_owner  uuid;
  v_pres   uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  v_nombre := btrim(coalesce(p_nombre, ''));
  IF v_nombre = '' THEN
    -- Las dos columnas son NOT NULL: un nombre vacío no es «limpiar el
    -- campo», es un estado que la tabla no admite.
    RAISE EXCEPTION 'nombre_vacio' USING ERRCODE = '22023';
  END IF;

  SELECT cc.owner_profile_id INTO v_owner
    FROM cuentas_comerciales cc WHERE cc.id = p_cuenta_comercial_id;
  IF v_owner IS NULL AND NOT EXISTS (SELECT 1 FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id) THEN
    RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE = '22023';
  END IF;

  SELECT p.id INTO v_pres FROM prestadores p WHERE p.cuenta_comercial_id = p_cuenta_comercial_id;

  -- EL GATE, en tres patas y en este orden: el DUEÑO de la cuenta · quien
  -- GESTIONA su prestador (D-660: el sujeto se resuelve por gestión) · admin.
  -- La primera es la que hace posible al VENDEDOR PURO, que no tiene la
  -- segunda y jamás la va a tener.
  IF v_owner IS DISTINCT FROM v_uid
     AND (v_pres IS NULL OR public.prestador_que_gestiono() IS DISTINCT FROM v_pres)
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_podes_renombrar_este_negocio' USING ERRCODE = '42501';
  END IF;

  -- LAS DOS, en la MISMA transacción — o ninguna. El prestador solo si
  -- EXISTE: su ausencia no es un error, es el vendedor puro.
  UPDATE cuentas_comerciales SET nombre_comercial = v_nombre, updated_at = now()
   WHERE id = p_cuenta_comercial_id;
  IF v_pres IS NOT NULL THEN
    UPDATE prestadores SET nombre_comercial = v_nombre WHERE id = v_pres;
  END IF;

  RETURN jsonb_build_object('ok', true, 'nombre', v_nombre,
                            'espejo_actualizado', v_pres IS NOT NULL);
END $function$;

COMMENT ON FUNCTION public.renombrar_negocio(uuid, text) IS
  'PUERTA ÚNICA del nombre del negocio (firma founder 14-ago: UN NOMBRE, UNA '
  'PUERTA). Fuente conceptual: `cuentas_comerciales.nombre_comercial` — la '
  'única fila que TODO negocio tiene. `prestadores.nombre_comercial` es '
  'ESPEJO y se escribe en el mismo acto si existe. Su ausencia NO es error: '
  'es el vendedor puro.';

-- ── ② LAS DOS VIEJAS DELEGAN (jamás se dropean: tienen consumidores) ─────
CREATE OR REPLACE FUNCTION public.actualizar_nombre_comercial(p_nombre text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_pres uuid; v_cuenta uuid;
BEGIN
  -- ☠️ S97: DELEGA. Su cuerpo escribía las dos tablas por su cuenta y
  -- resolvía el sujeto por PRESTADOR — lo que dejaba al vendedor puro afuera.
  v_pres := public.prestador_que_gestiono();
  IF v_pres IS NULL THEN RAISE EXCEPTION 'no_es_titular' USING ERRCODE = '42501'; END IF;
  SELECT cuenta_comercial_id INTO v_cuenta FROM prestadores WHERE id = v_pres;
  IF v_cuenta IS NULL THEN RAISE EXCEPTION 'sin_cuenta_comercial' USING ERRCODE = '22023'; END IF;
  RETURN public.renombrar_negocio(v_cuenta, p_nombre);
END $function$;

CREATE OR REPLACE FUNCTION public.actualizar_nombre_cuenta_comercial(
  p_cuenta_comercial_id uuid, p_nombre_comercial text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  -- ☠️ S97: DELEGA. Escribía SOLO la cuenta — *media escritura del nombre es
  -- la divergencia esperando su turno* (firma del founder).
  RETURN public.renombrar_negocio(p_cuenta_comercial_id, p_nombre_comercial);
END $function$;

-- ── ③ LA RECONCILIACIÓN, UNA VEZ, CON LA CUENTA COMO FUENTE ─────────────
UPDATE prestadores p
   SET nombre_comercial = cc.nombre_comercial
  FROM cuentas_comerciales cc
 WHERE cc.id = p.cuenta_comercial_id
   AND coalesce(p.nombre_comercial,'') IS DISTINCT FROM coalesce(cc.nombre_comercial,'')
   AND cc.nombre_comercial IS NOT NULL AND btrim(cc.nombre_comercial) <> '';

-- ── ④ EL GUARD: la divergencia deja de ser EXPRESABLE (patrón D-526) ────
-- 🔴 SIN `SECURITY DEFINER`, Y ES LA MITAD QUE HACE QUE FUNCIONE.
-- La primera versión de este guard lo llevaba, y por eso NO HACÍA NADA:
-- adentro de un DEFINER `current_user` es el DUEÑO de la función, jamás el
-- rol de la sesión ⇒ la condición nunca era cierta. El guard estaba escrito,
-- compilaba, y era decorativo — la clase que esta sesión persiguió todo el
-- día. **Lo cazó el cinturón, no la revisión.** El precedente que sí funciona
-- (`_prestadores_protege_columnas`, D-389) es INVOKER por esta misma razón.
CREATE OR REPLACE FUNCTION public._trg_prestadores_nombre_por_la_puerta()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  IF NEW.nombre_comercial IS DISTINCT FROM OLD.nombre_comercial
     AND current_user = 'authenticated' THEN
    -- El patrón del gobierno del vínculo (D-526): los DEFINER pasan porque
    -- corren como el dueño; lo que se cierra es la escritura DIRECTA desde
    -- una sesión de persona. Sin esto, la RLS `prestador_gestiona_lo_suyo`
    -- deja renombrar el espejo sin tocar la fuente — y vuelve la divergencia.
    RAISE EXCEPTION 'nombre_por_la_puerta: el nombre del negocio se cambia con `renombrar_negocio` — `prestadores.nombre_comercial` es ESPEJO de la cuenta comercial, no una segunda verdad'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $function$;

CREATE TRIGGER trg_prestadores_nombre_por_la_puerta
  BEFORE UPDATE OF nombre_comercial ON public.prestadores
  FOR EACH ROW EXECUTE FUNCTION public._trg_prestadores_nombre_por_la_puerta();

REVOKE EXECUTE ON FUNCTION public.renombrar_negocio(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.renombrar_negocio(uuid, text) TO authenticated;

-- ── CINTURÓN CON DISCRIMINADOR ───────────────────────────────────────────
DO $$
DECLARE v_n int; v_cc uuid; v_owner uuid; v_pres uuid; v_r jsonb; v_puro uuid; v_puro_owner uuid;
BEGIN
  SET LOCAL ROLE postgres;

  -- ① cero divergencias vivas
  SELECT count(*) INTO v_n FROM cuentas_comerciales cc JOIN prestadores p ON p.cuenta_comercial_id=cc.id
   WHERE coalesce(cc.nombre_comercial,'') IS DISTINCT FROM coalesce(p.nombre_comercial,'');
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: quedan % negocios con dos nombres', v_n; END IF;

  IF has_function_privilege('anon','public.renombrar_negocio(uuid, text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: anon alcanza la puerta (L-140)';
  END IF;

  -- ② EL DISCRIMINADOR A: el dueño renombra y las DOS filas se mueven
  SELECT cc.id, cc.owner_profile_id, p.id INTO v_cc, v_owner, v_pres
    FROM cuentas_comerciales cc JOIN prestadores p ON p.cuenta_comercial_id=cc.id
   WHERE cc.owner_profile_id IS NOT NULL LIMIT 1;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'CINTURON ABORTA: sin negocio con prestador y dueño'; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_owner,'role','authenticated')::text, true);
  v_r := renombrar_negocio(v_cc, 'CINTURON-S97-NOMBRE');
  IF (v_r->>'espejo_actualizado') <> 'true' THEN RAISE EXCEPTION 'CINTURON: el espejo no se actualizo'; END IF;
  IF (SELECT nombre_comercial FROM prestadores WHERE id=v_pres) <> 'CINTURON-S97-NOMBRE'
     OR (SELECT nombre_comercial FROM cuentas_comerciales WHERE id=v_cc) <> 'CINTURON-S97-NOMBRE' THEN
    RAISE EXCEPTION 'CINTURON: las dos filas no quedaron iguales';
  END IF;

  -- ③ EL DISCRIMINADOR B: el VENDEDOR PURO puede renombrar (el caso que la
  --    puerta vieja NO cubría). Aborta si no hay uno vivo.
  SELECT cc.id, cc.owner_profile_id INTO v_puro, v_puro_owner
    FROM cuentas_comerciales cc
   WHERE NOT EXISTS (SELECT 1 FROM prestadores p WHERE p.cuenta_comercial_id=cc.id)
     AND cc.owner_profile_id IS NOT NULL LIMIT 1;
  IF v_puro IS NULL THEN RAISE EXCEPTION 'CINTURON ABORTA: no hay vendedor puro — el caso que la firma cubre no se puede discriminar'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_puro_owner,'role','authenticated')::text, true);
  v_r := renombrar_negocio(v_puro, 'CINTURON-S97-PURO');
  IF (v_r->>'espejo_actualizado') <> 'false' THEN RAISE EXCEPTION 'CINTURON: el puro reporto espejo'; END IF;

  -- ④ EL GUARD: la escritura DIRECTA al espejo rebota
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_owner,'role','authenticated')::text, true);
  -- 🔴 EL TEST SE MIDE POR EL VALOR, NO POR LA EXCEPCIÓN. Un `UPDATE` que la
  -- RLS filtra a 0 filas NO lanza y NO dispara el trigger — así que «no hubo
  -- excepción» es indistinguible de «escribió». La pregunta correcta es:
  -- ¿cambió el nombre? (La primera versión de este cinturón preguntaba lo
  -- otro y dio un ROJO FALSO — se corrigió el instrumento, no el test.)
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE prestadores SET nombre_comercial = 'POR-LA-VENTANA' WHERE id = v_pres;
  EXCEPTION WHEN insufficient_privilege THEN NULL;   -- rebote del guard: esperado
  END;
  SET LOCAL ROLE postgres;
  IF (SELECT nombre_comercial FROM prestadores WHERE id = v_pres) = 'POR-LA-VENTANA' THEN
    RAISE EXCEPTION 'CINTURON 🔴: el espejo SE ESCRIBIO por fuera de la puerta';
  END IF;

  -- ── el fixture se deshace ───────────────────────────────────────────────
  PERFORM set_config('request.jwt.claims', NULL, true);
  UPDATE cuentas_comerciales SET nombre_comercial='Dueño todos los servicios (borrable)' WHERE id=v_cc;
  UPDATE prestadores          SET nombre_comercial='Dueño todos los servicios (borrable)' WHERE id=v_pres;
  UPDATE cuentas_comerciales SET nombre_comercial='DESPENSA DE PRUEBAS S97 - NO REAL' WHERE id=v_puro AND nombre_comercial='CINTURON-S97-PURO';

  RAISE NOTICE 'CINTURON nombre: 0 divergencias · el dueño mueve LAS DOS · el VENDEDOR PURO puede (sin espejo) · la escritura directa REBOTA';
END $$;

COMMIT;
