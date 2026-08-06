-- S88-A · LOS DOS HUECOS DEL CONTRATO DE LA CAMPANA, hallados auditándolo
-- contra la lámina ANTES de que C y D construyan.
--
-- 76(g) — VEDA: **NO RIGE.** Funciones de lectura.
--
-- ① EL BADGE NO PUEDE COSTAR LA LISTA
--    La lámina pide una HUELLA cuando hay avisos sin leer, **jamás un número**
--    («el número invita a vaciarlo»). Con el contrato de ayer, la superficie
--    tenía que traer la lista entera para saber si dibuja un punto — y el
--    valor que naturalmente computaría (`filter(!leida).length`) **es
--    exactamente el número que la lámina prohíbe**.
--    ⇒ Nace un lector que devuelve **booleano**. *La forma del dato hace
--      imposible el defecto: no se puede pintar un número que no existe.*
--
-- ② «DE QUÉ MASCOTA HABLA» — la lámina lo pide y el contrato no lo daba
--    Se devolvía `mascota_id` y nada más: la pantalla tendría que resolver el
--    nombre aparte, una consulta por fila. Se agrega el nombre al mismo viaje.
--    (El NEGOCIO no se puede: la intención no guarda `prestador_id` — declarado
--     en la ficha, no fingido acá.)

BEGIN;

-- ① EL BADGE, en booleano por diseño
CREATE OR REPLACE FUNCTION public.hay_avisos_sin_leer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM notificacion_intencion i
    WHERE i.destinatario_user_id = auth.uid()
      AND i.resuelto_como->>'canal_elegido' = 'in_app'
      AND i.resuelto_como->>'despacho' = 'para_transporte'
      AND i.estado <> 'leida'
  );
$$;

COMMENT ON FUNCTION public.hay_avisos_sin_leer() IS
  'S88/lámina de la campana: ¿hay algo sin leer? BOOLEANO A PROPÓSITO — la '
  'huella marca PRESENCIA y la lámina prohíbe el número. Devolver un conteo '
  'sería ofrecerle a la pantalla justo el dato que no debe pintar.';


-- ② EL LECTOR gana el nombre de la mascota.
--    DROP explícito: cambia el RETURNS TABLE y `CREATE OR REPLACE` no puede
--    (L-119 aplicada a funciones de tabla).
DROP FUNCTION IF EXISTS public.obtener_mis_avisos(integer);

CREATE FUNCTION public.obtener_mis_avisos(p_limite integer DEFAULT 50)
RETURNS TABLE(
  id             uuid,
  titulo         text,
  mensaje        text,
  tipo           text,
  categoria      text,
  mascota_id     uuid,
  mascota_nombre text,
  evento_id      uuid,
  tiene_destino  boolean,
  creado_en      timestamptz,
  leida          boolean,
  leida_en       timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.datos->>'titulo'  AS titulo,
    i.datos->>'mensaje' AS mensaje,
    i.tipo,
    i.categoria,
    i.mascota_id,
    -- «de qué mascota habla» (lámina §2). El JOIN no filtra: un aviso de una
    -- mascota borrada conserva su fila con el nombre en NULL — el aviso no
    -- desaparece porque su referente sí.
    m.nombre AS mascota_nombre,
    i.evento_id,
    (i.mascota_id IS NOT NULL OR i.evento_id IS NOT NULL) AS tiene_destino,
    i.created_at,
    (i.estado = 'leida') AS leida,
    i.leida_en
  FROM notificacion_intencion i
  LEFT JOIN mascotas m ON m.id = i.mascota_id
  WHERE i.destinatario_user_id = auth.uid()
    AND i.resuelto_como->>'canal_elegido' = 'in_app'
    AND i.resuelto_como->>'despacho' = 'para_transporte'
  ORDER BY i.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limite, 50), 200));
END;
$$;

COMMENT ON FUNCTION public.obtener_mis_avisos(integer) IS
  'S88/lámina de la campana: los avisos in_app de quien llama, más nuevo '
  'arriba, con el nombre de la mascota. Techo 200 DECLARADO: no hay cursor '
  'porque la lámina no pide «ver más» — si algún día lo pide, es enmienda.';

REVOKE EXECUTE ON FUNCTION public.hay_avisos_sin_leer()          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_mis_avisos(integer)    FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.hay_avisos_sin_leer()          TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_mis_avisos(integer)    TO authenticated;

DO $belt$
DECLARE v_anon int;
BEGIN
  IF to_regprocedure('public.hay_avisos_sin_leer()') IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta el lector del badge';
  END IF;
  -- ⚠️ que NO exista una variante que devuelva CONTEO: la lámina lo prohíbe.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname ILIKE '%contar_avisos%') THEN
    RAISE EXCEPTION 'CINTURON: apareció un contador de avisos; la lámina prohíbe el número';
  END IF;
  IF pg_get_functiondef('public.obtener_mis_avisos(integer)'::regprocedure)
     NOT LIKE '%mascota_nombre%' THEN
    RAISE EXCEPTION 'CINTURON: el lector no quedó con el nombre de la mascota';
  END IF;
  SELECT count(*) INTO v_anon FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('hay_avisos_sin_leer','obtener_mis_avisos')
     AND array_to_string(COALESCE(p.proacl,'{}'), ',') LIKE '%anon=%';
  IF v_anon <> 0 THEN RAISE EXCEPTION 'CINTURON (L-140): % con anon', v_anon; END IF;
  RAISE NOTICE 'CINTURON VERDE: badge booleano · sin contador · nombre de mascota · 0 anon.';
END
$belt$;

COMMIT;
