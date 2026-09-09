-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · `otorgar_puntos` — D-314 estaba a MEDIAS, y la otra mitad estaba abierta
--
-- 🔴 EL ROJO, PRODUCIDO POR EL CAMINO REAL Y NO LEÍDO DE UN ACL (7-sep-2026):
--    una cuenta con sesión, `is_admin() = false`, llamó por PostgREST
--      POST /rest/v1/rpc/otorgar_puntos {p_user_id: <ella misma>, p_puntos: 999, p_tipo:'ajuste'}
--    ⇒ **HTTP 204** y `puntos_usuario.puntos_totales = 999`.
--    *No es un permiso de más: es la fábrica de la moneda con la puerta abierta.*
--
-- ⚠️ Y EL PRIMER INTENTO DE ESE ROJO CASI DA VERDE FALSO, así que queda escrito:
--    con `p_tipo='sonda_s114'` la llamada devolvió **HTTP 400**, y un arnés que
--    lea «≥400 ⇒ rebotó» lo habría archivado como cerrado. El 400 era `23514`
--    —un CHECK del vocabulario de `tipo`— que **rebota DESPUÉS de que la función
--    corrió**: el permiso ya había pasado. Sólo un `42501`/`403` prueba una
--    puerta cerrada. *Un rojo por la razón equivocada está tan roto como un
--    verde por la razón equivocada* (L-321).
--
-- LO QUE D-314 DEJÓ HECHO Y LO QUE DEJÓ ABIERTO, medido:
--    ✅ `anon`  → EXECUTE = false
--    🔴 `authenticated` → EXECUTE = **true**, y **cero gate en el cuerpo**
--    🔴 **sin `SET search_path`** — la otra mitad de la cura, que la ficha nombra
--       y que nadie revisó
--
-- POR QUÉ NO SE REVOCA A `authenticated`, que era la cura obvia:
--    **tiene un caller vivo**: `e-petplace-admin/src/pages/Gamificacion.tsx:89`,
--    y el admin entra con sesión de USUARIO (medido: `anon` + `signInWithPassword`,
--    no `service_role`) ⇒ para el motor ese admin **es** `authenticated`.
--    Revocar cerraría el agujero y rompería la pantalla en el mismo acto — el
--    precedente de `email_exists` en S92, que también tenía un consumidor real
--    en una web del legado. **El gate va ADENTRO** (molde D-490/D-713: el guard
--    se mete en el cuerpo justo cuando el perímetro no alcanza).
--
-- VEDA 76(g): **RIGE** — esta migración BORRA datos (el residuo de la sonda).
--    Ventana declarada y cerrada acá adentro; ids medidos, no adivinados.
-- REVERSA: `docs/relevamientos/S114-A-REVERSA-20260911040000-otorgar-puntos.sql`
--    (escrita ANTES, y **declara que reabre el agujero**).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.otorgar_puntos(
  p_user_id uuid, p_puntos integer, p_tipo text, p_descripcion text,
  p_logro_id uuid DEFAULT NULL::uuid, p_referencia text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'   -- ← la mitad que faltaba de D-314
AS $function$
DECLARE v_nuevo_total INT; v_nuevo_nivel UUID;
BEGIN
  -- ══ EL GATE, ANTES DEL PRIMER INSERT ═══════════════════════════════════
  -- Acuñar moneda es acto de la casa. `is_admin()` deja pasar al admin (que
  -- llega como `authenticated` con su rol) y al motor (que corre sin sesión).
  -- 🔴 `auth.uid() IS NULL` es el camino del SERVIDOR —crones y funciones
  --    DEFINER que llaman a ésta— y NO es una puerta abierta: por PostgREST
  --    nunca hay sesión nula (la anon key la crea, y `anon` ya no tiene
  --    EXECUTE). Medido antes de escribirlo, no supuesto.
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'otorgar_puntos_no_es_del_usuario: acuñar puntos es acto de la casa'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO transacciones_puntos (user_id, puntos, tipo, descripcion, logro_id, referencia_id)
  VALUES (p_user_id, p_puntos, p_tipo, p_descripcion, p_logro_id, p_referencia);

  INSERT INTO puntos_usuario (user_id, puntos_totales, puntos_mes, ultima_actividad)
  VALUES (p_user_id, p_puntos, p_puntos, public.hoy_local())
  ON CONFLICT (user_id) DO UPDATE
  SET puntos_totales = puntos_usuario.puntos_totales + p_puntos,
      puntos_mes = puntos_usuario.puntos_mes + p_puntos,
      ultima_actividad = public.hoy_local(), updated_at = NOW()
  RETURNING puntos_totales INTO v_nuevo_total;

  SELECT id INTO v_nuevo_nivel FROM niveles
  WHERE puntos_minimos <= v_nuevo_total AND (puntos_maximos IS NULL OR puntos_maximos >= v_nuevo_total)
  ORDER BY puntos_minimos DESC LIMIT 1;

  IF v_nuevo_nivel IS NOT NULL THEN
    UPDATE puntos_usuario SET nivel_id = v_nuevo_nivel WHERE user_id = p_user_id;
  END IF;
END; $function$;

REVOKE ALL ON FUNCTION public.otorgar_puntos(uuid,integer,text,text,uuid,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.otorgar_puntos(uuid,integer,text,text,uuid,text) TO authenticated;

-- ── LIMPIEZA DEL RESIDUO DE LA SONDA ───────────────────────────────────────
-- La sonda del rojo escribió de verdad. Se borra por su marca exacta, y el
-- guard aborta si el universo no es el esperado — *un DELETE que no encuentra
-- lo que busca no se ejecuta a ciegas.*
DO $limpieza$
DECLARE v_n int; v_user uuid;
BEGIN
  -- `min(uuid)` no existe en Postgres. Se cuenta y se toma el user por separado.
  SELECT count(*) INTO v_n FROM transacciones_puntos
   WHERE descripcion = 'ROJO S114-A · sonda de seguridad';
  SELECT user_id INTO v_user FROM transacciones_puntos
   WHERE descripcion = 'ROJO S114-A · sonda de seguridad' LIMIT 1;
  IF v_n = 0 THEN
    RAISE NOTICE 'LIMPIEZA: sin residuo de sonda (¿ya limpiado?)';
  ELSIF v_n <> 1 THEN
    RAISE EXCEPTION 'LIMPIEZA: se esperaba 1 fila de sonda, hay % — no se borra a ciegas', v_n;
  ELSE
    UPDATE puntos_usuario
       SET puntos_totales = puntos_totales - 999, puntos_mes = puntos_mes - 999
     WHERE user_id = v_user;
    DELETE FROM transacciones_puntos WHERE descripcion = 'ROJO S114-A · sonda de seguridad';
    DELETE FROM puntos_usuario WHERE user_id = v_user AND puntos_totales = 0 AND puntos_mes = 0;
    RAISE NOTICE 'LIMPIEZA: residuo de la sonda borrado (user %)', v_user;
  END IF;
END $limpieza$;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_cfg text;
BEGIN
  SELECT array_to_string(p.proconfig,',') INTO v_cfg FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='otorgar_puntos';
  IF v_cfg IS NULL OR v_cfg NOT LIKE '%search_path%' THEN
    RAISE EXCEPTION 'CINTURÓN: sigue sin search_path fijo';
  END IF;
  IF has_function_privilege('anon','public.otorgar_puntos(uuid,integer,text,text,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: anon recuperó EXECUTE';
  END IF;
  -- El admin TIENE que seguir pudiendo: la pantalla del legado lo llama.
  IF NOT has_function_privilege('authenticated','public.otorgar_puntos(uuid,integer,text,text,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: se cerró a authenticated y eso rompe Gamificacion.tsx del admin';
  END IF;
  IF EXISTS (SELECT 1 FROM transacciones_puntos WHERE descripcion='ROJO S114-A · sonda de seguridad') THEN
    RAISE EXCEPTION 'CINTURÓN: quedó residuo de la sonda';
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · search_path fijo · anon sin EXECUTE · authenticated conserva (el gate es interno) · residuo 0';
END $cinturon$;
