-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · LA NATURALEZA SE SOLICITA — el paso ② del wizard PROPONE, jamás
-- otorga (14-ago-2026)
--
-- ORIGEN: hallazgo de C, verificado por A contra la base viva. `otorgar_rol_
-- vendedor` es ADMIN-ONLY con el foso escrito en su propio cuerpo:
--   «Si el titular pudiera dárselo, cualquiera con una cuenta comercial se
--    auto-habilitaría a vender sin que nadie revise — y §4.2 dice lo
--    contrario: el vendedor PROPONE, e-PetPlace PUBLICA.»
-- ⇒ El dueño NO puede prender «Tu tienda». Eso NO es un grant faltante: es
--   el foso de la vitrina curada, firmado. La firma de mesa (14-ago): **el
--   paso ② PROPONE**.
--
-- 🔴 LO QUE LA MESA MANDÓ MEDIR ANTES DE CONSTRUIR, y la medición contesta
--    MITAD Y MITAD — por eso esta migración es UNA COLUMNA y no una tabla:
--
--   ✅ LA SOSPECHA SE CONFIRMA en el CANAL: la cuenta comercial ya nace
--      `pendiente_validacion` (default medido), ya tiene chip que lo dice
--      (§8.6bis ⑥, construido por C), y la aprobación del admin YA es el acto
--      que llama a `otorgar_rol_vendedor`. **El canal de revisión existe y no
--      se duplica.**
--
--   ❌ NO SE CONFIRMA en la DECLARACIÓN: `crear_cuenta_comercial_inicial(
--      country, tipo_fiscal, identificacion, razon_social, nombre_comercial)`
--      **no tiene un solo parámetro de naturaleza**. Un admin mirando una
--      cuenta `pendiente_validacion` NO PUEDE SABER si esa persona quiere
--      vender productos, prestar servicios o las dos. Hoy sólo se infiere por
--      efecto lateral —*si hay fila en `prestadores` ⇒ servicios*— y **para
--      productos no hay ninguna señal.**
--
--   ❌ Y EL CASO QUE LA MESA MISMA NOMBRÓ COMO PRUEBA —«un prestador con
--      cuenta ya activa que quiere sumar la naturaleza»— **NO ES
--      HIPOTÉTICO: SON 6 CUENTAS VIVAS** (medidas: 6 `activa` con sólo
--      `prestador_servicios`, 1 con las dos, 3 vendedores puros). Para esas
--      6 el camino del alta está CERRADO: su cuenta ya es `activa`, el alta
--      crearía una SEGUNDA cuenta, y `otorgar_rol_vendedor` es admin-only.
--      **Hoy no tienen puerta ninguna.**
--
-- ⇒ POR ESO: una COLUMNA en el objeto que YA ES la unidad de revisión, y
--   ninguna tabla nueva. **La cuenta ES la propuesta; la columna dice de QUÉ
--   es propuesta.** El array guarda SOLO lo pendiente — lo otorgado vive en
--   `cuenta_roles` y no se copia acá. Así el contador de la ley S91 llega a
--   cero solo: al otorgar, la solicitud se retira.
--
-- 76(g): NO RIGE — columna aditiva con DEFAULT '{}', sin backfill, sin anclas.
-- L-140 en las tres puertas nuevas.
-- REVERSA escrita ANTES: scripts/s97/2026-08-14-s97a-naturaleza-solicitada-REVERSA.sql
--   (declara que revertir PIERDE las solicitudes vivas, con su SELECT probatorio)
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

ALTER TABLE public.cuentas_comerciales
  ADD COLUMN IF NOT EXISTS naturalezas_solicitadas tipo_actor_enum[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.cuentas_comerciales.naturalezas_solicitadas IS
  'Naturalezas que el DUEÑO pidió y e-PetPlace todavía NO otorgó. Guarda solo lo '
  'PENDIENTE: lo otorgado vive en `cuenta_roles` (estado=activo) y jamás se copia '
  'acá. Se vacía sola al otorgar — por eso el contador de la ley S91 puede llegar '
  'a cero. Proponer NO habilita nada: ningún lector de permisos mira esta columna.';

-- Nadie escribe la columna a mano: la puerta es única.
REVOKE UPDATE (naturalezas_solicitadas) ON public.cuentas_comerciales FROM authenticated, anon, PUBLIC;

-- ── ① LA PUERTA DE PROPUESTA ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.solicitar_naturaleza_comercial(
  p_cuenta_comercial_id uuid,
  p_tipo_actor text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_tipo tipo_actor_enum;
  v_estado_cuenta text;
  v_ya_activa boolean;
  v_ya_pedida boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  -- El DUEÑO de la cuenta, o admin. Un empleado no decide qué vende la casa.
  IF NOT EXISTS (SELECT 1 FROM cuentas_comerciales
                  WHERE id = p_cuenta_comercial_id AND owner_profile_id = v_uid)
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_dueno_de_la_cuenta' USING ERRCODE = '42501';
  END IF;

  -- Vocabulario cerrado: el mismo enum de `cuenta_roles`. Un tipo inventado
  -- rebota acá y no queda escrito.
  BEGIN
    v_tipo := p_tipo_actor::tipo_actor_enum;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'naturaleza_invalida: «%» no es una naturaleza del catálogo', p_tipo_actor
      USING ERRCODE = '22023';
  END;

  SELECT estado::text INTO v_estado_cuenta
    FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id FOR UPDATE;
  IF v_estado_cuenta IS NULL THEN
    RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE = '22023';
  END IF;
  -- Espejo del guard de `otorgar_rol_vendedor`: una cuenta suspendida o
  -- cerrada no vuelve por acá. Pedir una naturaleza no es reabrir un negocio.
  IF v_estado_cuenta IN ('suspendida', 'cerrada') THEN
    RAISE EXCEPTION 'cuenta_no_operativa: la cuenta está «%»', v_estado_cuenta
      USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (SELECT 1 FROM cuenta_roles
                  WHERE cuenta_comercial_id = p_cuenta_comercial_id
                    AND tipo_actor = v_tipo AND estado = 'activo')
    INTO v_ya_activa;

  -- Pedir lo que ya se tiene NO es un error: es un no-op que lo DICE. Si
  -- rebotara, la pantalla tendría que saber el estado antes de preguntar.
  IF v_ya_activa THEN
    RETURN jsonb_build_object('ok', true, 'estado', 'activa', 'ya_la_tiene', true);
  END IF;

  SELECT v_tipo = ANY(naturalezas_solicitadas) INTO v_ya_pedida
    FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id;

  IF NOT v_ya_pedida THEN
    UPDATE cuentas_comerciales
       SET naturalezas_solicitadas = naturalezas_solicitadas || v_tipo,
           updated_at = now()
     WHERE id = p_cuenta_comercial_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'estado', 'solicitada',
                            'ya_la_tiene', false, 'ya_estaba_pedida', v_ya_pedida,
                            'estado_cuenta', v_estado_cuenta);
END $function$;

-- ── ② EL CAMINO DE CORRECCIÓN (D-791: la configuración jamás solo agrega) ──
CREATE OR REPLACE FUNCTION public.retirar_naturaleza_solicitada(
  p_cuenta_comercial_id uuid,
  p_tipo_actor text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_tipo tipo_actor_enum; v_estaba boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cuentas_comerciales
                  WHERE id = p_cuenta_comercial_id AND owner_profile_id = v_uid)
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_dueno_de_la_cuenta' USING ERRCODE = '42501';
  END IF;
  BEGIN
    v_tipo := p_tipo_actor::tipo_actor_enum;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'naturaleza_invalida' USING ERRCODE = '22023';
  END;

  SELECT v_tipo = ANY(naturalezas_solicitadas) INTO v_estaba
    FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id FOR UPDATE;
  IF v_estaba IS NULL THEN RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE = '22023'; END IF;

  UPDATE cuentas_comerciales
     SET naturalezas_solicitadas = array_remove(naturalezas_solicitadas, v_tipo),
         updated_at = now()
   WHERE id = p_cuenta_comercial_id;

  -- Retirar la solicitud NO quita un rol ya otorgado: son dos hechos y el
  -- segundo no vive acá. Se dice en la respuesta para que la pantalla no
  -- prometa una baja que no ocurrió.
  RETURN jsonb_build_object('ok', true, 'estaba_solicitada', COALESCE(v_estaba,false),
                            'nota', 'retirar la solicitud no revoca un rol ya otorgado');
END $function$;

-- ── ③ EL LECTOR que compone el paso ② y el contador ───────────────────────
CREATE OR REPLACE FUNCTION public.obtener_naturalezas_de_cuenta(
  p_cuenta_comercial_id uuid
)
RETURNS TABLE(tipo_actor text, estado text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  -- Tres estados y sólo tres: `activa` (rol vivo) · `solicitada` (el dueño la
  -- pidió, esperamos nosotros) · `ninguna`. El orden del CASE importa: un rol
  -- activo GANA sobre una solicitud vieja que nadie retiró.
  SELECT t::text,
         CASE
           WHEN EXISTS (SELECT 1 FROM cuenta_roles cr
                         WHERE cr.cuenta_comercial_id = p_cuenta_comercial_id
                           AND cr.tipo_actor = t AND cr.estado = 'activo') THEN 'activa'
           WHEN t = ANY(cc.naturalezas_solicitadas) THEN 'solicitada'
           ELSE 'ninguna'
         END
  FROM cuentas_comerciales cc
  CROSS JOIN unnest(ARRAY['prestador_servicios','seller_productos']::tipo_actor_enum[]) AS t
  WHERE cc.id = p_cuenta_comercial_id
    AND (cc.owner_profile_id = auth.uid()
         OR public._user_opera_cuenta_comercial(p_cuenta_comercial_id, auth.uid())
         OR is_admin());
$function$;

-- ── ④ EL BRAZO QUE CIERRA LA SOLICITUD AL OTORGAR ─────────────────────────
-- CREATE OR REPLACE con la MISMA firma (uuid, text) — jamás DROP: es
-- admin-only y viva. Cambia sólo el final: la solicitud se retira. Sin este
-- brazo el contador NUNCA llega a cero, que es exactamente lo que la ley S91
-- exige que pueda pasar.
CREATE OR REPLACE FUNCTION public.otorgar_rol_vendedor(p_cuenta_comercial_id uuid, p_motivo text DEFAULT NULL::text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_cc   record;
  v_ya   boolean;
  v_activada boolean := false;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Sigue siendo acto de ADMIN. Si el titular pudiera dárselo, cualquiera con
  -- una cuenta comercial se auto-habilitaría a vender sin que nadie revise —
  -- y §4.2 dice lo contrario: el vendedor PROPONE, e-PetPlace PUBLICA.
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin_otorga_rol_vendedor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cc FROM cuentas_comerciales
   WHERE id = p_cuenta_comercial_id FOR UPDATE;
  IF v_cc.id IS NULL THEN
    RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE = '22023';
  END IF;

  -- 🔴 SOLO SE ACTIVA DESDE `pendiente_validacion`, igual que
  --    `activar_prestador`. Una cuenta SUSPENDIDA o CERRADA no se reactiva por
  --    acá: es otra decisión, con otro dueño y otras razones.
  IF v_cc.estado IN ('suspendida', 'cerrada') THEN
    RAISE EXCEPTION 'cuenta_no_activable: la cuenta está «%» y reactivarla no es parte del alta de un vendedor', v_cc.estado
      USING ERRCODE = '22023';
  END IF;

  IF v_cc.estado = 'pendiente_validacion' THEN
    UPDATE cuentas_comerciales
       SET estado = 'activa',
           activado_en = COALESCE(activado_en, now()),
           activado_por = v_auth,
           updated_at = now()
     WHERE id = p_cuenta_comercial_id;
    v_activada := true;
  END IF;

  SELECT EXISTS (SELECT 1 FROM cuenta_roles
                  WHERE cuenta_comercial_id = p_cuenta_comercial_id
                    AND tipo_actor = 'seller_productos' AND estado = 'activo')
    INTO v_ya;

  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
  VALUES (p_cuenta_comercial_id, 'seller_productos', 'activo', now(),
          jsonb_build_object('otorgado_por', v_auth, 'motivo', p_motivo))
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO UPDATE
    SET estado = 'activo', activado_en = COALESCE(cuenta_roles.activado_en, now());

  -- S97: la solicitud queda RESUELTA por el mismo acto que la concede. El
  -- array guarda sólo lo pendiente, así que otorgar es vaciar.
  UPDATE cuentas_comerciales
     SET naturalezas_solicitadas = array_remove(naturalezas_solicitadas, 'seller_productos'::tipo_actor_enum),
         updated_at = now()
   WHERE id = p_cuenta_comercial_id;

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
                            'ya_lo_tenia', v_ya,
                            'cuenta_activada_ahora', v_activada,
                            'estado_cuenta', 'activa');
END $function$;

-- L-140: las tres puertas nuevas cierran anon/PUBLIC explícito.
REVOKE EXECUTE ON FUNCTION public.solicitar_naturaleza_comercial(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.solicitar_naturaleza_comercial(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.retirar_naturaleza_solicitada(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.retirar_naturaleza_solicitada(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.obtener_naturalezas_de_cuenta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_naturalezas_de_cuenta(uuid) TO authenticated;

-- ── CINTURÓN CON DISCRIMINADOR (in-txn; el fixture se deshace solo) ───────
DO $$
DECLARE
  v_cc uuid; v_owner uuid; v_admin uuid; v_tercero uuid;
  v_r jsonb; v_estado text; v_n int;
BEGIN
  SET LOCAL ROLE postgres;

  -- L-140 en las tres
  IF has_function_privilege('anon','public.solicitar_naturaleza_comercial(uuid, text)','EXECUTE')
     OR has_function_privilege('anon','public.retirar_naturaleza_solicitada(uuid, text)','EXECUTE')
     OR has_function_privilege('anon','public.obtener_naturalezas_de_cuenta(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: anon alcanza alguna puerta nueva (L-140)';
  END IF;

  -- EL DISCRIMINADOR: una cuenta ACTIVA que hoy tiene SOLO servicios — el caso
  -- que la medición encontró vivo 6 veces y que NO tenía puerta ninguna.
  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_owner
    FROM cuentas_comerciales cc
   WHERE cc.estado = 'activa'
     AND EXISTS (SELECT 1 FROM cuenta_roles r WHERE r.cuenta_comercial_id=cc.id
                  AND r.tipo_actor='prestador_servicios' AND r.estado='activo')
     AND NOT EXISTS (SELECT 1 FROM cuenta_roles r WHERE r.cuenta_comercial_id=cc.id
                  AND r.tipo_actor='seller_productos' AND r.estado='activo')
     AND cc.owner_profile_id IS NOT NULL
   LIMIT 1;
  IF v_cc IS NULL THEN
    RAISE EXCEPTION 'CINTURON: el caso que esta migracion cura NO EXISTE en la base — el fixture no discriminaria nada';
  END IF;

  -- ① el DUEÑO propone y queda SOLICITADA (antes: no tenía cómo)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role','authenticated')::text, true);
  v_r := solicitar_naturaleza_comercial(v_cc, 'seller_productos');
  IF v_r->>'estado' <> 'solicitada' THEN
    RAISE EXCEPTION 'CINTURON: el dueno no pudo proponer (%)', v_r;
  END IF;

  -- ② PROPONER NO HABILITA — es la mitad que sostiene el foso de §4.2
  IF es_vendedor_de(v_cc) THEN
    RAISE EXCEPTION 'CINTURON 🔴: proponer OTORGO la naturaleza — el foso se rompio';
  END IF;

  -- ③ el lector dice los tres estados bien
  SELECT estado INTO v_estado FROM obtener_naturalezas_de_cuenta(v_cc) WHERE tipo_actor='seller_productos';
  IF v_estado <> 'solicitada' THEN RAISE EXCEPTION 'CINTURON: lector dijo % (esperaba solicitada)', v_estado; END IF;
  SELECT estado INTO v_estado FROM obtener_naturalezas_de_cuenta(v_cc) WHERE tipo_actor='prestador_servicios';
  IF v_estado <> 'activa' THEN RAISE EXCEPTION 'CINTURON: lector dijo % para servicios (esperaba activa)', v_estado; END IF;

  -- ④ idempotente: pedir dos veces no apila
  PERFORM solicitar_naturaleza_comercial(v_cc, 'seller_productos');
  SELECT cardinality(naturalezas_solicitadas) INTO v_n FROM cuentas_comerciales WHERE id=v_cc;
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: la solicitud se apilo (n=%)', v_n; END IF;

  -- ⑤ un TERCERO rebota (no es dueño ni admin)
  SELECT id INTO v_tercero FROM profiles WHERE id <> v_owner
    AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.id = profiles.id) LIMIT 1;
  IF v_tercero IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_tercero, 'role','authenticated')::text, true);
    BEGIN
      PERFORM solicitar_naturaleza_comercial(v_cc, 'seller_productos');
      RAISE EXCEPTION 'CINTURON 🔴: un tercero pudo proponer sobre cuenta ajena';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
  END IF;

  -- ⑥ vocabulario cerrado: un tipo inventado rebota
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role','authenticated')::text, true);
  BEGIN
    PERFORM solicitar_naturaleza_comercial(v_cc, 'vendedor');   -- el label NO existe (regla 22)
    RAISE EXCEPTION 'CINTURON: un tipo inventado NO rebato';
  EXCEPTION WHEN invalid_parameter_value OR sqlstate '22023' THEN NULL;
  END;

  -- ⑦ el ADMIN otorga y la solicitud SE CIERRA SOLA (el contador llega a cero)
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'CINTURON: no hay admin para el brazo del otorgamiento'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role','authenticated')::text, true);
  PERFORM otorgar_rol_vendedor(v_cc, 'cinturon S97-A');
  SELECT cardinality(naturalezas_solicitadas) INTO v_n FROM cuentas_comerciales WHERE id=v_cc;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: otorgar NO cerro la solicitud (n=%) — el contador nunca llegaria a cero', v_n; END IF;
  SELECT estado INTO v_estado FROM obtener_naturalezas_de_cuenta(v_cc) WHERE tipo_actor='seller_productos';
  IF v_estado <> 'activa' THEN RAISE EXCEPTION 'CINTURON: tras otorgar el lector dijo %', v_estado; END IF;

  -- ── el fixture se deshace: la cuenta vuelve EXACTA a como estaba ─────────
  SET LOCAL ROLE postgres;
  DELETE FROM cuenta_roles WHERE cuenta_comercial_id = v_cc AND tipo_actor='seller_productos';
  UPDATE cuentas_comerciales SET naturalezas_solicitadas = '{}' WHERE id = v_cc;
  PERFORM set_config('request.jwt.claims', NULL, true);

  SELECT count(*) INTO v_n FROM cuentas_comerciales WHERE cardinality(naturalezas_solicitadas) > 0;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % solicitudes', v_n; END IF;

  RAISE NOTICE 'CINTURON naturaleza: dueno propone OK · proponer NO habilita · tercero rebota · tipo invalido rebota · otorgar cierra la solicitud · residuo 0';
END $$;

COMMIT;
