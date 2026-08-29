/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · EL ACTA SE PUEDE LEER · y los dos tramos, proyectados
   ═══════════════════════════════════════════════════════════════════════════

   ── 🔴 ① EL ACTA SE PODÍA CONFIRMAR Y NO SE PODÍA LEER ───────────────────
   Hallazgo de C: `confirmar_acta_guarderia` existe, los ids llegan en el lector
   de estadías, `ActaDeEntrega` tiene su `modo='leer'` — **y no había con qué
   llenarlo.**

   > ### Y C NO MONTÓ EL BOTÓN DE CONFORMAR A PROPÓSITO. Su razón es firma de
   > la mesa: **la conformidad existe porque el dueño VIO lo que firma.**
   >
   > *Un «conforme» sobre un acta ilegible es pedirle que firme a ciegas — y un
   > registro probatorio firmado a ciegas no prueba nada: prueba que alguien
   > tocó un botón.*

   **Lo correcto era exactamente lo que hizo:** dejar el motor sin puerta antes
   que poner una puerta que produce una firma vacía.

   ── ② LOS DOS TRAMOS: no faltaba entidad, faltaba PROYECCIÓN ─────────────
   `tramo_recogida_id` y `tramo_devolucion_id` **ya viven en la tabla** desde
   `20260829220000`, y el lector de estadías no los devolvía. *Dos campos en el
   `SELECT` y el mapa del punto vivo se enciende solo.*

   ── QUÉ DEVUELVE EL LECTOR DEL ACTA, y qué NO ───────────────────────────
   Devuelve **los hechos**: dirección, si se verificó el carnet, los objetos,
   las observaciones, la conformidad con su fecha, la reserva escrita, la hora
   de la puerta (`cerrada_en`) y la de recepción, y **las media de esa estadía**.

   🔴 **No compone `items` ni voces.** `ActaDeEntrega` arma su lista con la voz
   de la casa que la muestra — *el motor dice el hecho; la voz es de la
   superficie.* Mandar textos desde acá sería meter idioma en el motor.

   ⚠️ **Las media se traen por (estadía) y no «por día»**, que es más angosto y
   más honesto que lo que el contrato de media dejó anotado: el vínculo por
   `(estadía, día)` metía en la misma bolsa **la media del durante**. Con
   `estadia_id` en las etiquetas alcanza para acotar a ESE animal y ESA estadía.
   *La distinción fina entre «las fotos del acta» y «las fotos de ese día» sigue
   abierta y está fichada: acá se acota lo que se puede acotar hoy, sin fingir
   una precisión que la estructura no da.*

   **76(g): NO RIGE.** Lectores; no escriben.
   **Reversa:** `docs/relevamientos/S107-A-REVERSA-lector-acta.sql` — declara que
   **correrla deja el acta confirmable e ilegible**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① EL LECTOR DEL ACTA ═════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.obtener_acta_guarderia(p_acta_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v_mascota uuid; v_prest uuid; v_r jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT c.mascota_id, c.prestador_id INTO v_mascota, v_prest
    FROM guarderia_actas a
    JOIN guarderia_estadias e ON e.id = a.estadia_id
    JOIN evento_cita_servicio c ON c.id = e.cita_id
   WHERE a.id = p_acta_id;
  IF v_mascota IS NULL THEN RAISE EXCEPTION 'acta_no_existe' USING ERRCODE='22023'; END IF;

  /* Las DOS audiencias del acta: la familia del animal y quien gestiona el
     negocio que la levantó. Nadie más — ni con el id en la mano. */
  IF NOT user_tiene_acceso_a_mascota(v_mascota)
     AND NOT user_gestiona_prestador(v_prest)
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  SELECT jsonb_build_object(
    'actaId',           a.id,
    'estadiaId',        a.estadia_id,
    'direccion',        a.direccion,
    'carnetVerificado', a.carnet_verificado,
    'objetos',          a.objetos,
    'observaciones',    a.observaciones,
    'conformidad',      a.conformidad,
    'conformidadEn',    a.conformidad_en,
    'reservaTexto',     a.reserva_texto,
    /* 🔴 LA HORA DE LA PUERTA, no la de llegada del dato: `cerrada_en` la pone
       el cliente al cerrar el acta en la casa; `recibida_en` es cuándo el
       servidor la recibió. **Son dos hechos distintos y se muestran los dos.** */
    'cerradaEn',        a.cerrada_en,
    'recibidaEn',       a.recibida_en,
    'mascotaNombre',    m.nombre,
    'prestadorNombre',  pr.nombre_comercial,
    'media', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'mediaId', gm.id, 'tipo', gm.tipo,
               'archivoUrl', gm.archivo_url, 'miniaturaUrl', gm.miniatura_url,
               'capturadaEn', gm.capturada_en)
             ORDER BY gm.capturada_en)
        FROM guarderia_media_etiquetas et
        JOIN guarderia_media gm ON gm.id = et.media_id
       WHERE et.estadia_id = a.estadia_id
         AND et.mascota_id = c.mascota_id
    ), '[]'::jsonb)
  ) INTO v_r
    FROM guarderia_actas a
    JOIN guarderia_estadias e   ON e.id = a.estadia_id
    JOIN evento_cita_servicio c ON c.id = e.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    JOIN prestadores pr         ON pr.id = c.prestador_id
   WHERE a.id = p_acta_id;

  RETURN v_r;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.obtener_acta_guarderia(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_acta_guarderia(uuid) TO authenticated;

-- ══ ② LOS DOS TRAMOS, PROYECTADOS ════════════════════════════════════════
DROP FUNCTION IF EXISTS public.obtener_mis_estadias_guarderia(uuid);
CREATE FUNCTION public.obtener_mis_estadias_guarderia(p_mascota_id uuid DEFAULT NULL)
RETURNS TABLE(
  cita_id uuid, estadia_id uuid, mascota_id uuid, mascota_nombre text,
  prestador_id uuid, prestador_nombre text,
  fecha date, precio numeric,
  estado_cita text, estado_reserva text, estado_estadia text,
  a_bordo_en timestamptz, llegada_en timestamptz, entregada_en timestamptz,
  acta_recogida_id uuid, acta_devolucion_id uuid,
  tramo_recogida_id uuid, tramo_devolucion_id uuid,
  es_proxima boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_mascota_id IS NOT NULL AND NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT c.id, e.id, c.mascota_id, m.nombre,
         c.prestador_id, pr.nombre_comercial,
         c.fecha, c.precio,
         c.estado, c.estado_reserva, e.estado,
         e.a_bordo_en, e.llegada_en, e.entregada_en,
         ar.id, ad.id,
         /* ✏️ LOS DOS TRAMOS — no faltaba entidad, faltaba proyección. Con
            estos dos campos el mapa del punto vivo se enciende solo. */
         e.tramo_recogida_id, e.tramo_devolucion_id,
         (c.fecha >= public.hoy_local()
          AND c.estado IN ('pendiente','confirmada','en_curso')) AS es_proxima
    FROM evento_cita_servicio c
    JOIN mascotas m      ON m.id = c.mascota_id
    JOIN prestadores pr  ON pr.id = c.prestador_id
    LEFT JOIN guarderia_estadias e ON e.cita_id = c.id
    LEFT JOIN guarderia_actas ar ON ar.estadia_id = e.id AND ar.direccion = 'recogida'
    LEFT JOIN guarderia_actas ad ON ad.estadia_id = e.id AND ad.direccion = 'devolucion'
   WHERE c.tipo_servicio = 'guarderia_dia'
     AND (p_mascota_id IS NULL OR c.mascota_id = p_mascota_id)
     AND user_tiene_acceso_a_mascota(c.mascota_id)
     AND (c.estado_reserva = 'pagada'
          OR (c.estado_reserva = 'pendiente_pago' AND c.expira_en > now()))
   ORDER BY c.fecha DESC, c.id;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.obtener_mis_estadias_guarderia(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mis_estadias_guarderia(uuid) TO authenticated;

-- ══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $cint$
DECLARE v_cols int; v_acl text; v_sob int;
BEGIN
  -- ① los dos tramos EN LA PROYECCIÓN (el pedido de C, contra el objeto)
  SELECT count(*) INTO v_cols
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='obtener_mis_estadias_guarderia'
     AND column_name IN ('tramo_recogida_id','tramo_devolucion_id');
  IF v_cols <> 2 THEN
    -- las funciones TABLE no siempre exponen columnas en information_schema:
    -- se pregunta al tipo de retorno, que es el objeto autoritativo.
    SELECT count(*) INTO v_cols FROM unnest(string_to_array(
      pg_get_function_result('public.obtener_mis_estadias_guarderia(uuid)'::regprocedure), ','
    )) t WHERE t ILIKE '%tramo_recogida_id%' OR t ILIKE '%tramo_devolucion_id%';
  END IF;
  IF v_cols <> 2 THEN
    RAISE EXCEPTION 'CINTURON ①: los dos tramos NO estan en la proyeccion (n=%)', v_cols;
  END IF;

  -- ② L-119: DROP explícito ⇒ UNA sola firma viva, sin zombi
  SELECT count(*) INTO v_sob FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_estadias_guarderia';
  IF v_sob <> 1 THEN
    RAISE EXCEPTION 'CINTURON ②: quedaron % sobrecargas del lector (L-119)', v_sob;
  END IF;

  -- ③ el lector del acta existe y está cerrado a anon
  SELECT array_to_string(proacl,' ') INTO v_acl FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_acta_guarderia';
  IF v_acl IS NULL THEN RAISE EXCEPTION 'CINTURON ③: el lector del acta no existe'; END IF;
  IF v_acl ILIKE '%anon=%' THEN RAISE EXCEPTION 'CINTURON ③: anon con EXECUTE (%)', v_acl; END IF;
  IF v_acl NOT ILIKE '%authenticated=%' THEN RAISE EXCEPTION 'CINTURON ③: authenticated sin EXECUTE (%)', v_acl; END IF;

  RAISE NOTICE 'CINTURON VERDE · los dos tramos proyectados · una sola firma del lector · el acta se puede LEER y esta cerrada a anon';
END
$cint$;

COMMIT;
