-- S78-A8 — LOS DOS PEDIDOS DE B (cortos, y los dos con su porque)
-- ==================================================================
-- 1 · `puede_encender_vitrina()` — EL LECTOR DEL GATE. B construyo el
--     toggle de vitrina y lo dejo SIN DIBUJAR detras de una constante
--     (VITRINA_GATE_ABIERTO=false) porque ofrecer un toggle que rebota
--     al guardar es Ley 23 rota. Este lector es el ESPEJO EXACTO del
--     predicado del trigger trg_prestadores_gate_vitrina — la MISMA
--     expresion to_regprocedure sobre la MISMA firma — para que
--     superficie y motor JAMAS diverjan: el dia que el aviso exista,
--     el trigger deja pasar Y este lector devuelve true, en el mismo
--     instante, sin que nadie toque nada.
-- 2 · `obtener_jornada_recepcion` gana `mascota_especie` y
--     `mascota_etapa` — el ensanche que la propia migracion A6 reservo
--     ("cuando haga falta, esta funcion se ensancha; no nace un lector
--     paralelo"). La etapa NO se inventa: la dice calcular_etapa_vida,
--     que ya existia (IMMUTABLE, cachorro/joven/adulto/senior/
--     desconocida — codigos de motor; la voz es de la pantalla, Ley 3).
--
-- L-119: el RETURNS TABLE cambia ⇒ DROP explicito de la firma vieja.
-- Los argumentos no cambian (uuid, date): los callers no se tocan.
--
-- 76(g) — DECLARACION OBLIGATORIA: **NO RIGE**. Cero DDL de tablas,
-- cero backfill, cero anclas sobre datos vivos: dos funciones.
--
-- REVERSA: docs/relevamientos/2026-07-26-s78a-REVERSA-pedidos-de-b.sql
-- ==================================================================

CREATE OR REPLACE FUNCTION public.puede_encender_vitrina()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  -- EL MISMO predicado del trigger trg_prestadores_gate_vitrina
  -- (20260726220000). Si esta expresion y la del trigger divergen algun
  -- dia, ese es el bug — no este lector.
  SELECT to_regprocedure('public.notificar_reasignacion_cita(uuid, uuid)') IS NOT NULL;
$function$;

REVOKE EXECUTE ON FUNCTION public.puede_encender_vitrina() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.puede_encender_vitrina() TO authenticated;


DROP FUNCTION IF EXISTS public.obtener_jornada_recepcion(uuid, date);
CREATE OR REPLACE FUNCTION public.obtener_jornada_recepcion(
  p_prestador_id uuid,
  p_fecha        date
)
RETURNS TABLE(
  cita_id          uuid,
  hora             time without time zone,
  duracion_minutos integer,
  estado           text,
  tipo_servicio    text,
  mascota_id       uuid,
  mascota_nombre   text,
  empleado_id      uuid,
  empleado_nombre  text,
  llegada_en       timestamptz,
  mascota_especie  text,
  mascota_etapa    text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid        uuid := auth.uid();
  v_mi_fila    uuid;
  v_es_titular boolean;
  v_tiene_chip boolean;
  v_ve_todo    boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  IF NOT public.empleado_tiene_rol(p_prestador_id, ARRAY['dueño', 'profesional', 'recepcion']) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  SELECT pe.id INTO v_mi_fila
  FROM prestador_empleados pe
  WHERE pe.prestador_id = p_prestador_id AND pe.user_id = v_uid AND pe.activo;

  SELECT EXISTS (
    SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.user_id = v_uid
  ) INTO v_es_titular;

  SELECT EXISTS (
    SELECT 1 FROM prestador_empleado_servicios pes WHERE pes.empleado_id = v_mi_fila
  ) INTO v_tiene_chip;

  -- titular o recepcion (definida por AUSENCIA de chip) ven el negocio;
  -- el profesional ve lo suyo — §4 consecuencia 1, intacta.
  v_ve_todo := v_es_titular OR NOT COALESCE(v_tiene_chip, false);

  RETURN QUERY
  SELECT
    c.id,
    c.hora,
    c.duracion_minutos,
    c.estado,
    c.tipo_servicio,
    c.mascota_id,
    m.nombre,
    c.empleado_id,
    p.nombre,           -- (b): el id resuelto a NOMBRE
    c.llegada_en,
    -- S78-A8 (pedido de B): identidad DESTILADA para la celda de la
    -- agenda — especie + etapa, que es lo que §4/A3.4 le da a recepcion
    -- (identidad completa + etapa destilada; lo clinico JAMAS por aca).
    -- La etapa la dice el MOTOR que ya existia (calcular_etapa_vida,
    -- IMMUTABLE, leida literal: cachorro/joven/adulto/senior/desconocida)
    -- — es un CODIGO: la voz humana la pone la pantalla (Ley 3).
    m.especie,
    CASE WHEN m.id IS NULL THEN NULL
         ELSE calcular_etapa_vida(m.fecha_nacimiento, m.especie) END
  FROM evento_cita_servicio c
  LEFT JOIN mascotas m            ON m.id = c.mascota_id
  LEFT JOIN prestador_empleados e ON e.id = c.empleado_id
  LEFT JOIN profiles p            ON p.id = e.user_id
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    -- la agenda solo contiene verdad firme (§13): el hold invisible
    AND c.estado IN ('confirmada', 'en_curso', 'completada', 'no_show')
    -- "DEL NEGOCIO": la cita con `empleado_id IS NULL` VIAJA SIEMPRE, para
    -- todos. Es el estado que S77 §11(a) hizo legal —`dar_de_baja_empleado`
    -- estampa `SET empleado_id = NULL`— y la sección que B compuso en su M1
    -- lo consume. **Nótese que NO alcanzaba con dejarla en la rama
    -- `v_ve_todo`:** `c.empleado_id = v_mi_fila` con NULL a la izquierda da
    -- NULL, o sea FALSO, así que sin esta cláusula la despegada quedaba
    -- INVISIBLE para el profesional — y en un negocio donde el único que
    -- queda tiene chips, invisible para TODOS. Se la muestra a cualquier
    -- miembro y no rompe "el profesional ve solo lo suyo" (§4): una cita sin
    -- persona no es de otro profesional — no es de NADIE, y esconderla al
    -- único que puede actuar sobre ella es el bug de invisibilidad otra vez.
    AND (v_ve_todo OR c.empleado_id = v_mi_fila OR c.empleado_id IS NULL)
  ORDER BY c.hora ASC, c.id ASC;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_jornada_recepcion(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_jornada_recepcion(uuid, date) TO authenticated;
