-- ══════════════════════════════════════════════════════════════════════════
-- S111-A · LA FRANJA COMO ORDEN BASE DEL DÍA
--
-- REVERSA: docs/relevamientos/2026-09-01-s111a-REVERSA-franja-orden.sql
-- 76(g): **NO RIGE** — no computa anclas sobre datos vivos. Cero backfill.
--
-- ══ EL DEFECTO, medido ════════════════════════════════════════════════════
-- El lector ordenaba `ORDER BY m.nombre` — **alfabético**. Un cuidador que
-- abre su día ve *Bobby, Jack, Thor, Zeus* cuando lo que necesita es *primero
-- los que hay que ir a buscar, después los que hay que devolver*.
-- Y **las franjas existían y estaban pobladas** (recogida 07:00–09:00,
-- devolución 16:30–18:30): el dato estaba y nadie lo leía.
--
-- ⚠️ **SÓLO EL ORDEN BASE ES DE ESTA MIGRACIÓN.** El reordenamiento manual del
-- cuidador ya lo construyó C y **persiste del lado de la app**: su
-- `aplicarOrden` dice *«lo guardado manda; lo nuevo cae al final por su ORDEN
-- NATURAL»*. **El orden natural es esto** — lo único que cambia es que deja de
-- ser alfabético.
--
-- ══ EL ORDEN SALE DEL DATO, NO DE UN `CASE` DE HORAS ══════════════════════
-- Se elige la franja **que le toca A CONTINUACIÓN** a cada estadía —
-- `recogida` mientras espera que la busquen, `devolucion` mientras espera
-- volver— y se ordena por **`desde` de esa franja**.
-- 🔴 Y los terminales caen al final SOLOS, sin una rama que lo diga: su estado
-- no mapea a ninguna franja ⇒ el LATERAL no encuentra fila ⇒ `desde` es NULL ⇒
-- `NULLS LAST`. *Un orden que se sostiene en la forma no se puede desincronizar
-- de las horas reales el día que el negocio cambie su franja.*
--
-- ══ EL DESEMPATE, declarado ═══════════════════════════════════════════════
-- Hoy hay UNA franja activa por tipo y por prestador (medido: las de
-- lunes-a-viernes están `activo = false`), así que no hay ambigüedad. Pero si
-- mañana dos activas cubren el mismo día, **gana la más específica** — la de
-- menos días de semana. *Sin criterio, `LIMIT 1` sobre dos filas elegiría una
-- distinta según el plan del optimizador, y el día se ordenaría distinto sin
-- que nadie hubiera cambiado nada.*
--
-- ⚠️ `dias_semana IS NULL` = **todos los días** (patrón de la casa).
-- ⚠️ `EXTRACT(dow)`: 0 = domingo, que es como están escritas las filas vivas.
-- ══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.obtener_estadias_del_dia(uuid, date);

CREATE OR REPLACE FUNCTION public.obtener_estadias_del_dia(p_prestador_id uuid, p_fecha date)
 RETURNS TABLE(
   estadia_id uuid, cita_id uuid, estado text, mascota_id uuid, mascota_nombre text,
   mascota_especie text, mascota_foto_url text, espacio_nombre text,
   direccion_snapshot jsonb, a_bordo_en timestamptz, llegada_en timestamptz,
   entregada_en timestamptz, retorno_en timestamptz, no_recogida_en timestamptz,
   no_recogida_motivo text, estado_reserva text, raza_ruta_imagen text,
   -- Las tres nuevas: la franja QUE LE TOCA A CONTINUACIÓN. NULL en terminales,
   -- y ese NULL es información: *ya no le toca nada*.
   franja_tipo text, franja_desde time, franja_hasta time)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT g.id, c.id, g.estado,
         m.id, m.nombre, m.especie, m.foto_url,
         e.nombre, c.direccion_snapshot,
         g.a_bordo_en, g.llegada_en, g.entregada_en,
         g.retorno_en, g.no_recogida_en, g.no_recogida_motivo,
         c.estado_reserva, rz.ruta_imagen,
         fr.tipo, fr.desde, fr.hasta
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    LEFT JOIN guarderia_espacios e ON e.id = g.espacio_id
    LEFT JOIN cat_razas rz ON rz.especie = m.especie AND lower(rz.nombre) = lower(m.raza)
    LEFT JOIN LATERAL (
      SELECT f.tipo, f.desde, f.hasta
        FROM guarderia_franjas f
       WHERE f.prestador_id = p_prestador_id
         AND f.activo
         AND f.tipo = CASE
               WHEN g.estado IN ('reservada','recogida_en_curso')   THEN 'recogida'
               WHEN g.estado IN ('en_guarderia','retorno_en_curso') THEN 'devolucion'
             END
         AND (f.dias_semana IS NULL
              OR EXTRACT(dow FROM p_fecha)::int = ANY (f.dias_semana))
       -- la MÁS ESPECÍFICA gana; el `desde` desempata para que el orden no
       -- dependa del plan del optimizador
       ORDER BY COALESCE(array_length(f.dias_semana, 1), 99), f.desde
       LIMIT 1
    ) fr ON true
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha = p_fecha
     AND c.estado_reserva = 'pagada'
     AND g.estado <> 'cancelada'
   -- EL ORDEN DEL DÍA. Los terminales caen al final por su NULL, no por rama.
   ORDER BY fr.desde NULLS LAST, m.nombre;
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid, date) TO authenticated;

-- ══ CINTURÓN — con su ROJO PRODUCIDO PRIMERO ═════════════════════════════
DO $cint$
DECLARE
  v_prest uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_def   text;
  v_n     int;
BEGIN
  -- ROJO PRODUCIDO: el instrumento tiene que VER el orden alfabético viejo.
  -- Si no puede distinguirlo del nuevo, su verde no vale.
  v_def := pg_get_functiondef('public.obtener_estadias_del_dia(uuid,date)'::regprocedure);
  IF v_def LIKE '%ORDER BY m.nombre;%' THEN
    RAISE EXCEPTION 'CINTURON: la funcion sigue ordenando ALFABETICO — el instrumento SI lo detecta, y el sujeto no cambio';
  END IF;
  RAISE NOTICE 'ROJO PRODUCIDO ✓ · el instrumento distingue el orden viejo del nuevo';

  IF v_def NOT LIKE '%fr.desde NULLS LAST%' THEN
    RAISE EXCEPTION 'CINTURON: el orden no sale de la franja';
  END IF;

  -- Las tres columnas nuevas existen en la firma
  IF v_def NOT LIKE '%franja_tipo%' OR v_def NOT LIKE '%franja_desde%' OR v_def NOT LIKE '%franja_hasta%' THEN
    RAISE EXCEPTION 'CINTURON: faltan columnas de franja en la firma';
  END IF;

  -- Hay franja activa para leer: si no, esto ordenaría todo por NULL y el
  -- verde seria vacio. *Un orden que no tiene de que salir no es un orden.*
  SELECT count(*) INTO v_n FROM guarderia_franjas WHERE prestador_id = v_prest AND activo;
  IF v_n = 0 THEN
    RAISE EXCEPTION 'CINTURON NO CONCLUYENTE: el prestador de prueba no tiene franja activa — no pude medir';
  END IF;

  -- L-140 por el instrumento correcto (no LIKE sobre proacl: ya me cobro un
  -- falso positivo en esta misma sesion)
  IF has_function_privilege('anon','public.obtener_estadias_del_dia(uuid,date)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: anon puede ejecutar el lector del dia';
  END IF;
  IF NOT has_function_privilege('authenticated','public.obtener_estadias_del_dia(uuid,date)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: authenticated NO puede ejecutar el lector — se rompio el camino real';
  END IF;

  RAISE NOTICE 'CINTURON VERDE · % franja(s) activa(s) · orden por franja · anon fuera, authenticated adentro', v_n;
END $cint$;

COMMIT;
