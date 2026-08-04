-- S85-A · D-639 · EL EXPEDIENTE MODULADO — cura de privacidad, no feature
--
-- LEY: `BIO_EXPEDIENTE` A3.5bis (firmada 3-ago-2026), tres niveles:
--   ① EL PISO      — todos: identidad y alertas de seguridad
--   ② EL DETALLE   — quien lo hizo · quien lo necesita para atender
--   ③ LA EXISTENCIA— los demás: **que existe y QUIÉN lo hizo, NO el contenido**
--
-- ⚠️ NO ES UNA PIEZA DE LA PANTALLA DATOS: ES UN ESTRECHAMIENTO. Corresponde
-- igual aunque DATOS no se construyera (D-639).
--
-- ── EL ROJO, PRODUCIDO ANTES DE CURAR (no supuesto) ─────────────────────────
-- Por el camino real, con JWT de Clínica Aurora y `SET ROLE authenticated`,
-- mirando los aportes de Paseos Andres sobre Thor:
--     filas que VE 85 · con su CONTENIDO **84** · con su AUTOR 85
-- **Un prestador leía el contenido de 84 aportes de otro.** La causa: la única
-- policy de SELECT de `eventos_mascota` es `user_acceso_clinico_a_mascota()`,
-- que es BINARIA y concede **la fila entera**. *"Esta fila sí, pero sin su
-- contenido" no es algo que un `USING` sepa decir.*
--
-- ── POR QUÉ RPC Y NO UNA VISTA (α, adjudicada) ─────────────────────────────
-- Una vista con columnas nulificadas exige que **cada lector nuevo se acuerde
-- de usarla**. *El modo de falla es olvidarse, y olvidarse se ve exactamente
-- igual que estar bien.* La RPC pone la decisión **en un solo lugar**.
--
-- ── LO QUE **NO** MODULA, y es firma ───────────────────────────────────────
-- **Los aportes de la FAMILIA quedan AFUERA** (A3.5bis, su frontera): 32
-- eventos con `procedencia='declarado_por_familia'` y **cero `prestador_id``.
-- *No son "de otro prestador": son del dueño.* Modularlos le escondería al
-- prestador lo que la familia declaró de su propia mascota —peso, alergias, el
-- carnet que ella cargó— **en silencio y con apariencia de cumplir la ley**.
-- **La prueba, en una línea: ¿el aporte tiene otro prestador del otro lado?**
--
-- ── EL AUTOR SALE DE `prestador_id`, NO DE `cuenta_comercial_id` ───────────
-- Medido (L-195): `prestador_id` poblado **131/177**, `cuenta_comercial_id`
-- **3/177**. El acceso se concede por CUENTA y el aporte está atribuido por
-- PRESTADOR — **dos ejes que no coinciden en los datos**. Resolver el "quién"
-- por el eje del permiso dejaría **174 de 177 sin autor**, y el nivel ③
-- degradaría a *"existe algo, de alguien"*: **la mitad inútil**, porque lo que
-- lo vuelve suficiente es que diga A QUIÉN preguntarle.
--
-- ── ALCANCE v1, DECLARADO Y NO INVENTADO ───────────────────────────────────
-- El nivel ② dice *"quien lo hizo **o quien lo necesita para atender**"*. Esta
-- v1 implementa **solo la primera mitad**: el detalle es de QUIEN LO HIZO.
-- **La segunda mitad la gobierna la matriz `oficio × eje` de A3.3**, y
-- construirla sin leerla sería inventar quién necesita qué. *Se declara acá en
-- vez de aproximarla — una modulación aproximada es una fuga con forma de ley.*
--
-- 76(g) — DECLARADA: NO RIGE. Función de solo lectura.
-- REVERSA escrita ANTES (con su aviso: revertir REABRE el agujero).

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_expediente_modulado(p_mascota_id uuid)
RETURNS TABLE (
  id             uuid,
  tipo           text,
  eje_jtbd       text,
  fecha_evento   timestamptz,
  prestador_id   uuid,
  autor          text,
  procedencia    text,
  datos          jsonb,      -- NULL en el nivel ③
  nivel          text        -- 'detalle' | 'existencia' | 'familia'
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_mis_prestadores uuid[];
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  /* EL PISO: el mismo gate que la policy. Sin acceso, ni la existencia —
     A3.5bis empieza en "todo prestador CON ACCESO". */
  IF NOT user_acceso_clinico_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'sin_acceso';
  END IF;

  /* Los prestadores del caller: titular o empleado activo. Es el mismo eje con
     el que se ATRIBUYE el aporte (`eventos_mascota.prestador_id`). */
  SELECT coalesce(array_agg(x.pid), '{}') INTO v_mis_prestadores FROM (
    SELECT p.id AS pid FROM prestadores p WHERE p.user_id = v_uid
    UNION
    SELECT pe.prestador_id FROM prestador_empleados pe WHERE pe.user_id = v_uid AND pe.activo
  ) x;

  RETURN QUERY
  SELECT em.id, em.tipo, em.eje_jtbd, em.fecha_evento, em.prestador_id,
         pr.nombre_comercial AS autor,
         em.procedencia,
         CASE
           -- la familia queda AFUERA de la modulación (A3.5bis, su frontera)
           WHEN em.prestador_id IS NULL THEN em.datos
           -- nivel ②: es mío
           WHEN em.prestador_id = ANY(v_mis_prestadores) THEN em.datos
           -- nivel ③: existe y quién, SIN contenido
           ELSE NULL::jsonb
         END AS datos,
         CASE
           WHEN em.prestador_id IS NULL THEN 'familia'
           WHEN em.prestador_id = ANY(v_mis_prestadores) THEN 'detalle'
           ELSE 'existencia'
         END AS nivel
  FROM eventos_mascota em
  LEFT JOIN prestadores pr ON pr.id = em.prestador_id
  WHERE em.mascota_id = p_mascota_id
    AND NOT coalesce(em.soft_delete, false)
  ORDER BY em.fecha_evento DESC;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_expediente_modulado(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_expediente_modulado(uuid) TO authenticated;

COMMIT;
