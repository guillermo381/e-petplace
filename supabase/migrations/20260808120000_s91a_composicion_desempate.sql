-- ════════════════════════════════════════════════════════════════════════════
-- S91-A · EL DESEMPATE DEL CENSO — la cura de un bug que el fixture produjo
--
-- ── QUÉ ESTABA MAL, medido y no supuesto ───────────────────────────────────
-- `20260808110000` derivó el censo vigente con
--     DISTINCT ON (raza_slug, nombre_libre) … ORDER BY … declarado_en DESC, id DESC
-- y eso es NO DETERMINISTA por dos razones que se suman:
--
--   ① **`now()` es CONSTANTE dentro de una transacción** (L-122a, cobrada en
--      S55 para medir duraciones y acá otra vez para ORDENAR). Dos
--      declaraciones de la misma especie en la MISMA transacción nacen con el
--      mismo `declarado_en`, así que la fecha no desempata nada.
--   ② el desempate de respaldo era **`id DESC`, un uuid ALEATORIO** ⇒ con
--      fechas empatadas, «la última declaración» la elegía el azar.
--
-- **El fixture lo produjo en su primer intento:** declaró 5 neones, ajustó a 3
-- en la misma transacción, y el total salió **8 en vez de 6** — el censo leyó la
-- declaración VIEJA como vigente. *Un bug de este tipo no da síntoma en la
-- pantalla feliz (cada toque del dueño es su propia transacción y las fechas
-- difieren), y por eso habría vivido meses: aparece cuando una superficie
-- declara varias especies de una sola vez, que es exactamente lo que una
-- pantalla de censo hace.*
--
-- ── LA CURA: un orden que no puede empatar ─────────────────────────────────
-- `seq` como IDENTITY. Es monótono **incluso dentro de una transacción**, así
-- que el orden de declaración queda grabado en la fila y no depende del reloj.
-- `declarado_en` se queda: es el dato HUMANO (cuándo lo dijo el dueño); `seq` es
-- el dato de ORDEN. Confundirlos fue el error.
--
-- ── VEDA 76(g): NO RIGE ────────────────────────────────────────────────────
-- La tabla nació hace minutos en esta misma sesión y **tiene 0 filas** (medido
-- abajo con cinturón, no supuesto): el ADD COLUMN no puede reordenar nada
-- existente. Cero backfill. Ningún bundle vivo la consulta todavía.
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
-- La misma de `20260808110000` (drop de tabla y funciones) la cubre entera:
-- `docs/relevamientos/2026-08-08-s91a-REVERSA-composicion-acuario.sql`.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM public.acuario_composicion;
  IF n <> 0 THEN
    RAISE EXCEPTION 'CINTURON: la tabla tiene % fila(s) — esta migración se escribió para una tabla vacía; con datos vivos hay que decidir el seq de las filas existentes ANTES', n;
  END IF;
END $$;

ALTER TABLE public.acuario_composicion
  ADD COLUMN seq bigint GENERATED ALWAYS AS IDENTITY;

COMMENT ON COLUMN public.acuario_composicion.seq IS
  'EL ORDEN DE DECLARACIÓN, y existe porque `declarado_en` NO alcanza: now() es constante dentro de una transacción (L-122a), así que dos declaraciones de la misma especie en la misma txn empatan y el desempate caía en un uuid aleatorio — el censo se leía no determinista. `declarado_en` es el dato humano (cuándo lo dijo el dueño); `seq` es el dato de orden. El fixture del censo produjo el rojo: 5 neones ajustados a 3 daban total 8.';

DROP INDEX IF EXISTS acuario_composicion_vigente_idx;
CREATE INDEX acuario_composicion_vigente_idx
  ON public.acuario_composicion (mascota_id, raza_slug, nombre_libre, seq DESC);

-- ── la puerta: el mismo cuerpo, con el orden arreglado en sus DOS lugares ───
CREATE OR REPLACE FUNCTION public.declarar_composicion_acuario(
  p_mascota_id  uuid,
  p_cantidad    integer,
  p_raza_slug   text DEFAULT NULL,
  p_nombre_libre text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid    uuid := auth.uid();
  v_slug   text := nullif(btrim(coalesce(p_raza_slug, '')), '');
  v_libre  text := nullif(btrim(coalesce(p_nombre_libre, '')), '');
  v_suj    text;
  v_previa integer;
  v_id     uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_autenticado';
  END IF;

  SELECT m.sujeto INTO v_suj
    FROM mascotas m
    JOIN familia_miembro fm ON fm.familia_id = m.familia_id
   WHERE m.id = p_mascota_id
     AND fm.user_id = v_uid
     AND fm.hasta IS NULL
     AND fm.rol IN ('adulto_titular', 'adulto_autorizado')
   LIMIT 1;

  IF v_suj IS NULL THEN
    RAISE EXCEPTION 'sin_acceso';
  END IF;
  IF v_suj <> 'acuario' THEN
    RAISE EXCEPTION 'composicion_solo_acuario';
  END IF;

  IF p_cantidad IS NULL OR p_cantidad < 0 THEN
    RAISE EXCEPTION 'cantidad_invalida';
  END IF;

  IF v_slug IS NULL AND v_libre IS NULL THEN
    RAISE EXCEPTION 'especie_no_declarada';
  END IF;
  IF v_slug IS NOT NULL AND v_libre IS NOT NULL THEN
    RAISE EXCEPTION 'especie_ambigua';
  END IF;

  IF v_slug IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM cat_razas
     WHERE especie = 'pez' AND slug = v_slug AND activo
  ) THEN
    RAISE EXCEPTION 'especie_desconocida';
  END IF;

  SELECT cantidad INTO v_previa
    FROM acuario_composicion
   WHERE mascota_id = p_mascota_id
     AND raza_slug IS NOT DISTINCT FROM v_slug
     AND nombre_libre IS NOT DISTINCT FROM v_libre
   ORDER BY seq DESC
   LIMIT 1;

  IF v_previa IS NOT NULL AND v_previa = p_cantidad THEN
    RETURN jsonb_build_object('ok', true, 'sin_cambio', true, 'cantidad', p_cantidad);
  END IF;

  INSERT INTO acuario_composicion (mascota_id, raza_slug, nombre_libre, cantidad, declarado_por)
  VALUES (p_mascota_id, v_slug, v_libre, p_cantidad, v_uid)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'sin_cambio', false,
    'id', v_id,
    'cantidad', p_cantidad,
    'cantidad_previa', v_previa,
    'total_habitantes', (
      SELECT coalesce(sum(c.cantidad), 0)
        FROM (
          SELECT DISTINCT ON (raza_slug, nombre_libre) cantidad
            FROM acuario_composicion
           WHERE mascota_id = p_mascota_id
           ORDER BY raza_slug, nombre_libre, seq DESC
        ) c
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.obtener_composicion_acuario(p_mascota_id uuid)
 RETURNS TABLE (
   raza_slug    text,
   nombre       text,
   ruta_imagen  text,
   es_del_catalogo boolean,
   cantidad     integer,
   declarado_en timestamptz
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_autenticado';
  END IF;

  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'sin_acceso';
  END IF;

  RETURN QUERY
  WITH vigente AS (
    SELECT DISTINCT ON (ac.raza_slug, ac.nombre_libre)
           ac.raza_slug, ac.nombre_libre, ac.cantidad, ac.declarado_en
      FROM acuario_composicion ac
     WHERE ac.mascota_id = p_mascota_id
     ORDER BY ac.raza_slug, ac.nombre_libre, ac.seq DESC
  )
  SELECT v.raza_slug,
         coalesce(cr.nombre, v.nombre_libre)  AS nombre,
         cr.ruta_imagen,
         (v.raza_slug IS NOT NULL)            AS es_del_catalogo,
         v.cantidad,
         v.declarado_en
    FROM vigente v
    LEFT JOIN cat_razas cr ON cr.especie = 'pez' AND cr.slug = v.raza_slug
   WHERE v.cantidad > 0
   ORDER BY v.cantidad DESC, 2;
END;
$function$;

-- ── cinturón: el orden viejo NO puede sobrevivir en ninguna de las dos ──────
DO $$
DECLARE s text; n integer := 0;
BEGIN
  FOR s IN
    SELECT pg_get_functiondef(p.oid)
      FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
     WHERE ns.nspname = 'public'
       AND p.proname IN ('declarar_composicion_acuario','obtener_composicion_acuario')
  LOOP
    -- Se busca el desempate por id, que es el defecto. (No se busca
    -- «declarado_en» a secas: el lector lo DEVUELVE como dato y debe seguir ahí.)
    IF s LIKE '%declarado_en DESC%' OR s LIKE '%, id DESC%' THEN n := n + 1; END IF;
    IF s NOT LIKE '%seq DESC%' THEN
      RAISE EXCEPTION 'CINTURON: una de las dos funciones no ordena por seq';
    END IF;
  END LOOP;
  IF n <> 0 THEN
    RAISE EXCEPTION 'CINTURON: % función(es) siguen desempatando por fecha o por uuid', n;
  END IF;
END $$;

COMMIT;
