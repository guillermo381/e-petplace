-- S85-A · ATENCIONES ABIERTAS FUERA DEL DÍA — la 4ª fuente de «Necesita tu atención»
--
-- QUÉ ES UNA ATENCIÓN "ABIERTA", medido y no supuesto: `evento_atencion.estado`
-- tiene **dos valores vivos** — `cerrada_con_calidad` y `terminada`.
-- ⇒ **abierta = `terminada`**: el trabajo se hizo y **nadie lo cerró con
-- calidad**. *No es una atención en curso: es una que quedó a mitad del último
-- paso.*
--
-- ⚠️ **Y ES PLATA QUE NO SE DEVENGÓ.** Por la Decisión R, el evento económico
-- nace **AL CERRAR CON CALIDAD**, no al pagar ni al terminar. Una atención
-- `terminada` es trabajo hecho **y no cobrado** — y el prestador **no tiene hoy
-- ninguna superficie que se lo diga**.
--
-- MEDIDO AL CONSTRUIR: hay **UNA sola**, del **15-jul**, de Paseos Andres.
-- **Diecinueve días.** *Ese es exactamente el caso que justifica la franja: no
-- es un borde teórico — es plata parada que nadie vio porque nada la mostraba.*
--
-- ── POR QUÉ NO SUMA AL `$ DEL DÍA` (regla firmada) ────────────────────────
-- `PORTAL_PRESTADOR` §2.4bis: **PLATA = el valor AGENDADO de HOY.** Una atención
-- abierta de hace 19 días **no es plata de hoy** — meterla ahí haría que el
-- número del día suba por trabajo viejo. **Son dos preguntas distintas y la
-- portada no las mezcla:** *«¿cuánto vale mi jornada?»* vs *«¿qué quedó sin
-- cerrar?»*.
--
-- ── EL GATE ────────────────────────────────────────────────────────────────
-- **Titular o empleado activo del negocio.** ⚠️ **NO se copia el gate de
-- `$ del día`** (titular-only): *ahí lo que se protege es la PLATA DEL NEGOCIO;
-- acá lo que se muestra es TRABAJO SIN CERRAR, y cerrarlo es la tarea del que
-- atendió.* **Ocultárselo al empleado sería esconderle su propio pendiente.**
-- *Se declara porque copiar el gate del vecino era lo cómodo y habría estado
-- mal — la regla no es "todo lo del negocio es del titular": es que la PLATA
-- lo es.*
--
-- 76(g) — DECLARADA: NO RIGE. Función de solo lectura.
-- REVERSA escrita ANTES.

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_atenciones_abiertas(
  p_prestador_id uuid,
  p_dias_atras   integer DEFAULT 90
)
RETURNS TABLE (
  atencion_id     uuid,
  cita_id         uuid,
  mascota_id      uuid,
  mascota_nombre  text,
  tipo_servicio   text,
  iniciada_en     timestamptz,
  dias_abierta    integer,
  precio          numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM prestadores p WHERE p.id = p_prestador_id AND p.user_id = v_uid
    UNION
    SELECT 1 FROM prestador_empleados pe
     WHERE pe.prestador_id = p_prestador_id AND pe.user_id = v_uid AND pe.activo
  ) AND NOT is_admin() THEN
    RAISE EXCEPTION 'sin_acceso';
  END IF;

  RETURN QUERY
  SELECT a.id, a.cita_id, a.mascota_id, m.nombre, c.tipo_servicio,
         a.iniciada_en,
         GREATEST(0, EXTRACT(DAY FROM (now() - a.iniciada_en))::integer) AS dias_abierta,
         c.precio
  FROM evento_atencion a
  LEFT JOIN mascotas m ON m.id = a.mascota_id
  LEFT JOIN evento_cita_servicio c ON c.id = a.cita_id
  WHERE a.prestador_id = p_prestador_id
    AND a.estado = 'terminada'                 -- el ÚNICO estado abierto vivo
    AND a.iniciada_en >= now() - make_interval(days => greatest(p_dias_atras, 1))
  ORDER BY a.iniciada_en ASC;                  -- lo MÁS viejo primero: es lo que más duele
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_atenciones_abiertas(uuid, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_atenciones_abiertas(uuid, integer) TO authenticated;

COMMIT;
