-- S88-A · ⚖️ LA CAMPANA ES EL REGISTRO, NO EL CANAL (firma del founder)
--
-- 76(g) — VEDA: NO RIGE. `CREATE OR REPLACE` de tres funciones de lectura/marca.
--
-- LA LETRA, para que no se relea al revés:
--   > **EL CANAL ES CÓMO LE LLEGÓ; LA CAMPANA ES DÓNDE QUEDA.**
--
-- Y una consecuencia que cambia el significado de un dato, no solo su filtro:
--   **«no leído» pasa a significar «NO LO VISTE EN LA APP»** — que es lo único
--   que la app puede saber: **no sabe si abriste el correo.** *Nadie debe
--   leerlo como «no lo recibiste».*
--
-- ⚠️ SE CURAN LAS TRES A LA VEZ Y NO SOLO EL LECTOR: dejar el filtro en
--   `marcar_aviso_leido` habría creado avisos **VISIBLES E IMPOSIBLES DE MARCAR
--   LEÍDOS** — y el badge se habría quedado encendido para siempre sobre algo
--   que la persona ya miró. *Un verbo que no espeja a su lector es peor que
--   ninguno.*

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_mis_avisos(p_limite integer DEFAULT 50)
 RETURNS TABLE(id uuid, titulo text, mensaje text, tipo text, categoria text, mascota_id uuid, mascota_nombre text, evento_id uuid, tiene_destino boolean, creado_en timestamp with time zone, leida boolean, leida_en timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    /* ⚖️ S88 — LA CAMPANA ES EL REGISTRO, NO EL CANAL (firma del founder).
       Acá filtraba por `canal_elegido = 'in_app'`. **Se sacó**, con sus tres
       razones firmadas:
       ① EL CANAL ES CÓMO LE LLEGÓ; LA CAMPANA ES DÓNDE QUEDA. Quien recibe un
          correo y abre la app busca ahí lo que le avisaron — si no está, la
          campana MIENTE POR OMISIÓN.
       ② medido: 13 entregadas · 12 visibles · **1 invisible, y la brecha crece
          con cada correo**. Un aviso que salía por mail desaparecía del
          historial del producto.
       ③ el modelo llama a in_app **el piso que nunca se pierde** — y *un piso
          que solo guarda lo que nadie más entregó no es piso: es descarte.*
       Queda `para_transporte`, que es lo que significa ENTREGADO: sigue
       excluyendo lo descartado (memorial incluido), lo retenido y lo que está
       en sombra, sin nombrar ninguno. */
    AND i.resuelto_como->>'despacho' = 'para_transporte'
  ORDER BY i.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limite, 50), 200));
END;
$function$
;

-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.hay_avisos_sin_leer()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM notificacion_intencion i
    WHERE i.destinatario_user_id = auth.uid()
      -- S88: sin filtro de canal — la campana es el REGISTRO (ver el lector).
      AND i.resuelto_como->>'despacho' = 'para_transporte'
      AND i.estado <> 'leida'
  );
$function$
;

-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.marcar_aviso_leido(p_aviso_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_filas int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  /* ⚠️ NO EXISTE `marcar_todos_leidos`, Y ES LETRA FIRMADA, no una omisión:
     *borrar sin leer es perder*. Un botón que vacía la campana de un saque
     convierte «no lo leí» en «no existió» — y el aviso que se pierde así es
     justamente el que la persona no alcanzó a mirar. **Si algún día se pide,
     es enmienda de lámina.** */

  UPDATE notificacion_intencion i
     SET estado     = 'leida',
         leida_en   = coalesce(i.leida_en, now()),  -- el PRIMER leído manda
         updated_at = now()
   WHERE i.id = p_aviso_id
     AND i.destinatario_user_id = auth.uid()
     -- S88: el verbo ESPEJA al lector — si se ve, se puede marcar. Dejar el
     -- filtro acá habría creado avisos VISIBLES E IMPOSIBLES de marcar leídos.
     AND i.resuelto_como->>'despacho' = 'para_transporte';
  GET DIAGNOSTICS v_filas = ROW_COUNT;

  /* Se cuenta ROW_COUNT, jamás la ausencia de excepción: un UPDATE que no
     matchea NO FALLA — afecta cero (ley de esta sesión). Cero acá significa
     «no es tuyo, no existe, o no es un aviso de campana», y las tres se
     contestan igual porque distinguirlas le diría a un extraño si el id
     existe. */
  IF v_filas = 0 THEN
    RAISE EXCEPTION 'aviso_no_encontrado' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object('ok', true, 'aviso_id', p_aviso_id);
END;
$function$
;

DO $belt$
DECLARE v_l text; v_b text; v_v text; v_tot int; v_vis int;
BEGIN
  v_l := pg_get_functiondef('public.obtener_mis_avisos(integer)'::regprocedure);
  v_b := pg_get_functiondef('public.hay_avisos_sin_leer()'::regprocedure);
  v_v := pg_get_functiondef('public.marcar_aviso_leido(uuid)'::regprocedure);

  -- LAS TRES, o ninguna: un verbo que no espeja a su lector deja avisos
  -- visibles que nadie puede marcar.
  /* ⚠️ EL GUARD APUNTA AL OPERADOR `->>''canal_elegido''`, no al nombre suelto:
     la primera versión buscaba «canal_elegido» y **se disparó contra la CITA
     del filtro muerto en el comentario nuevo**. Es L-210 por SEGUNDA vez en el
     día — *un guard que caza código vencido no distingue la letra de su
     epitafio*, y la forma exigible es apuntar a lo que solo existe ejecutándose. */
  IF v_l LIKE '%->>''canal_elegido''%' OR v_b LIKE '%->>''canal_elegido''%'
     OR v_v LIKE '%->>''canal_elegido''%' THEN
    RAISE EXCEPTION 'CINTURON: alguna de las tres sigue filtrando por canal';
  END IF;
  -- Y lo que NO puede caerse con el filtro: la puerta de lo ENTREGADO.
  IF v_l NOT LIKE '%para_transporte%' OR v_v NOT LIKE '%para_transporte%' THEN
    RAISE EXCEPTION 'CINTURON: se perdió el filtro de ENTREGADO — entrarían descartadas y retenidas';
  END IF;

  SELECT count(*) FILTER (WHERE resuelto_como->>'despacho'='para_transporte'),
         count(*) FILTER (WHERE resuelto_como->>'despacho'='para_transporte')
    INTO v_tot, v_vis FROM notificacion_intencion;
  RAISE NOTICE 'CINTURON VERDE: las tres sin filtro de canal · entregadas=% = visibles=%', v_tot, v_vis;
END
$belt$;

COMMIT;
