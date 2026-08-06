-- S88-A · EL VERBO ASIGNAR NO TENÍA OJOS (hallazgo de C, medido en dispositivo)
--
-- 76(g) — VEDA: **NO RIGE.** Solo `CREATE OR REPLACE` de una función de
--   LECTURA. Cero datos tocados.
--
-- ─────────────────────────────────────────────────────────────────────────
-- EL DEFECTO, con su intersección medida:
--
--   `obtener_pizarra` filtraba por  `pe.rol = 'dueño'  OR  chips-del-tipo`
--   — el EJE LEGACY de D-486 —, mientras que el gate de
--   `asignar_cita_a_persona` es **mostrador-o-gestión**. Dos criterios
--   distintos para dos mitades del MISMO acto.
--
--   | quién        | VE la fila | puede ASIGNAR |
--   |--------------|-----------|---------------|
--   | titular      | sí        | sí            |
--   | administrador| **NO**    | sí            |
--   | recepción    | **NO**    | sí            |
--   | profesional  | sí        | **NO** (toma) |
--
--   **La intersección «ve» ∩ «puede asignar» era SOLO EL TITULAR.**
--
-- ⚠️ Y EL DAÑO NO ERA UNA LISTA CORTA: era una lista que MIENTE. El admin y
--   la recepción leían *«nada para tomar, todo tiene responsable»* **con la
--   cita huérfana viva delante**. Un vacío honesto dice «no hay»; éste
--   afirmaba un hecho FALSO sobre el negocio.
--
-- > **ES L-206 EN LA CAPA DE ARRIBA.** Ahí se curó la lista de DESTINOS
-- > (a quién se le puede dar) y quedó sin curar la lista de TRABAJOS (qué hay
-- > para dar). *Un lector de pre-filtro espeja su puerta — y esta puerta
-- > tenía DOS listas, no una.*
--
-- LA CURA ES UN BRAZO, y nada más:
--   se AGREGA `empleado_es_mostrador_o_gestion` al filtro. Es puramente
--   aditivo: nadie que veía deja de ver.
--
-- ⚠️ LO QUE **NO** SE TOCA, y es deliberado: **`tomar_cita`**. Su gate sigue
--   siendo `dueño OR chips`, así que **recepción y administrador siguen SIN
--   PODER TOMAR** — ver no es atender. Ensancharlo convertiría al mostrador
--   en tratante, que es exactamente «abrir de más». **Los dos verbos quedan
--   separados por construcción: la pizarra los muestra a los dos, y cada
--   puerta admite a quien le toca.**
-- ─────────────────────────────────────────────────────────────────────────

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_pizarra(p_prestador_id uuid)
RETURNS TABLE(
  cita_id uuid, fecha date, hora time without time zone, tipo_servicio text,
  servicio_voz text, mascota_id uuid, mascota_nombre text, mascota_especie text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_empleado   uuid;
  v_es_dueno   boolean;
  v_mostrador  boolean;
  v_hoy        date := (now() AT TIME ZONE 'America/Guayaquil')::date;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT pe.id, (pe.rol = 'dueño')
  INTO v_empleado, v_es_dueno
  FROM prestador_empleados pe
  WHERE pe.prestador_id = p_prestador_id
    AND pe.user_id = v_uid
    AND pe.activo
  LIMIT 1;

  IF v_empleado IS NULL THEN
    RAISE EXCEPTION 'no_sos_del_equipo' USING ERRCODE = '42501';
  END IF;

  -- ⭐ EL BRAZO QUE FALTABA: quien REPARTE tiene que VER lo que reparte.
  --    Se resuelve UNA vez, fuera del filtro por fila.
  v_mostrador := public.empleado_es_mostrador_o_gestion(p_prestador_id);

  RETURN QUERY
  SELECT
    c.id, c.fecha, c.hora, c.tipo_servicio, ts.nombre,
    m.id, m.nombre, m.especie
  FROM evento_cita_servicio c
  LEFT JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio
  LEFT JOIN mascotas m        ON m.id      = c.mascota_id
  WHERE c.prestador_id = p_prestador_id
    AND c.empleado_id IS NULL                    -- SIN TRATANTE: es la pizarra
    AND c.estado = ANY(public._estados_cita_contables())
    AND c.fecha >= v_hoy                         -- lo que ya pasó no se toma
    AND (
      v_es_dueno                                 -- ① el eje legacy, INTACTO
      OR v_mostrador                             -- ② quien reparte, VE
      OR EXISTS (                                -- ③ el profesional, por CHIP
        SELECT 1
        FROM prestador_servicios ps
        JOIN prestador_empleado_servicios pes
          ON pes.servicio_id = ps.id AND pes.empleado_id = v_empleado
        WHERE ps.prestador_id = c.prestador_id
          AND ps.tipo_servicio = c.tipo_servicio
      )
    )
  ORDER BY c.fecha ASC, c.hora ASC NULLS LAST, c.id ASC;
END;
$$;

COMMENT ON FUNCTION public.obtener_pizarra(uuid) IS
  'S88: las citas sin tratante. TRES brazos — el eje legacy (D-486, intacto), '
  'MOSTRADOR-O-GESTIÓN (quien reparte tiene que ver lo que reparte) y el chip '
  'del profesional (quien la toma). `tomar_cita` NO se ensanchó: ver no es '
  'atender, y los dos verbos quedan separados por construcción.';

REVOKE EXECUTE ON FUNCTION public.obtener_pizarra(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_pizarra(uuid) TO authenticated;

-- ── CINTURÓN: mide el OBJETO, sin efectos laterales ───────────────────────
DO $belt$
DECLARE v_def text;
BEGIN
  v_def := pg_get_functiondef('public.obtener_pizarra(uuid)'::regprocedure);
  IF v_def NOT LIKE '%empleado_es_mostrador_o_gestion%' THEN
    RAISE EXCEPTION 'CINTURON: el brazo del mostrador no quedó en la pizarra';
  END IF;
  IF v_def NOT LIKE '%prestador_empleado_servicios%' THEN
    RAISE EXCEPTION 'CINTURON: se cayó el brazo del CHIP — el profesional dejaría de ver';
  END IF;
  -- Y el que importa tanto como el otro: que `tomar_cita` NO se haya movido.
  IF pg_get_functiondef('public.tomar_cita(uuid)'::regprocedure)
     LIKE '%empleado_es_mostrador_o_gestion%' THEN
    RAISE EXCEPTION 'CINTURON: tomar_cita se ensanchó — el mostrador NO atiende';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: 3 brazos en la pizarra · tomar_cita intacta.';
END
$belt$;

COMMIT;
