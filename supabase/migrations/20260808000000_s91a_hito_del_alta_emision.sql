-- ============================================================================
-- S91-A · EL HITO DEL ALTA SE ENCIENDE — firma del founder (8-ago-2026)
-- ============================================================================
-- LA REGLA, VERBATIM:
--   · Edad al alta ≤ 3 meses → clave `vida_nueva_empieza`, voz «Una vida
--     nueva empieza» (celebra nacimiento y llegada).
--   · Edad > 3 meses, o fecha de nacimiento desconocida/aproximada → voz
--     «[Nombre] llegó a la familia» (sin fecha cierta no se mide edad).
--   · Acuario → clave `mundo_nuevo_empieza`, voz «Un mundo nuevo empieza».
--   · La edad se calcula SERVER-SIDE, jamás en la pantalla.
--
-- ── LA PREGUNTA QUE LA FIRMA DEJÓ ABIERTA, RESUELTA: NACE UNA TERCERA CLAVE
-- «¿la clave existente sirve o nace una tercera?» → **nace**:
-- `llego_a_la_familia`. Reusar `vida_nueva_empieza` con otra voz haría MENTIR
-- a la clave: en la línea de vida, un cachorro nacido ayer y un rescatado de
-- nueve años tendrían el mismo hecho registrado. **La clave es el HECHO, la
-- voz es cómo lo contamos** — y son dos hechos distintos. La voz sí puede
-- cambiar sin tocar la clave; el hecho no.
--
-- ── EL UMBRAL SE LEE ESTRICTO, Y SE DICE POR QUÉ ───────────────────────────
-- `vida_nueva_empieza` exige las TRES cosas: hay fecha · la precisión es
-- **`exacta`** · y cae dentro de los 3 meses. Todo lo demás cae a
-- `llego_a_la_familia`. La firma dice «desconocida/aproximada → llegada»; se
-- extiende a `estimada` (que es MENOS certera que aproximada: es la
-- bifurcación de etapas del CampoFecha) y a `precision IS NULL` con fecha
-- presente, que el CHECK permite. *Ante la duda gana «llegó»: celebrar un
-- nacimiento que no ocurrió es peor que celebrar una llegada que sí.*
--
-- ── EL CONTRATO CON LA PANTALLA — y esto es lo que la hace pintable ────────
-- La clave viaja TAMBIÉN en `eventos_mascota.datos->>'clave_hito'`, no solo
-- en la tabla tipada. **Sin eso la voz sería imposible de resolver**: el
-- lector del timeline trae `tipo` (que es `hito_narrativo` para las TRES) y
-- nunca hace join con la hija. Es el patrón EXACTO de `datos->>'vacuna'`
-- (S48), que existe por la misma razón. Un dato duplicado a propósito, con
-- su porqué escrito.
--
-- ⚠️ VENTANA DECLARADA (D-662 en su forma de tiempo): entre esta migración y
-- el OTA que enseñe la voz, un alta nueva pinta el nodo genérico por eje —
-- «momento» sin nombre. Es el anti-patrón C8 de S72 y **se acepta a
-- propósito y por poco tiempo** porque la mesa ordenó coordinar con D en
-- esta misma sesión. Si el OTA no sale hoy, esta emisión se apaga: el
-- archivo de reversa está escrito.
--
-- Veda 76(g): NO RIGE — 1 fila de catálogo, cero backfill (los hitos son
-- del alta hacia adelante; las mascotas vivas NO reciben hito retroactivo:
-- inventarles un hecho pasado sería fabricar historia).
-- Reversa: docs/relevamientos/2026-08-08-s91a-REVERSA-hito-emision.sql
-- ============================================================================

BEGIN;

INSERT INTO public.cat_hitos_narrativos (clave, descripcion) VALUES
  ('llego_a_la_familia',
   'El alta de una mascota que NO nació recién: edad > 3 meses, o fecha desconocida/aproximada. Voz firmada 8-ago-2026: «[Nombre] llegó a la familia». Celebra la LLEGADA, no el nacimiento.')
ON CONFLICT (clave) DO NOTHING;

-- ── La regla, en UN solo lugar ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._clave_hito_alta(
  p_sujeto text,
  p_fecha_nacimiento date,
  p_precision text
) RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE
    WHEN p_sujeto = 'acuario' THEN 'mundo_nuevo_empieza'
    WHEN p_fecha_nacimiento IS NOT NULL
     AND p_precision = 'exacta'
     AND p_fecha_nacimiento > ((now() AT TIME ZONE 'America/Guayaquil')::date - INTERVAL '3 months')
      THEN 'vida_nueva_empieza'
    ELSE 'llego_a_la_familia'
  END;
$function$;

COMMENT ON FUNCTION public._clave_hito_alta(text, date, text) IS
  'S91 (firma founder 8-ago-2026): la clave del hito del alta. La edad se mide ACÁ, jamás en la pantalla. Umbral estricto: solo precision=exacta dentro de 3 meses cuenta como vida nueva — ante la duda gana «llegó».';

REVOKE EXECUTE ON FUNCTION public._clave_hito_alta(text, date, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public._clave_hito_alta(text, date, text) TO authenticated;

COMMIT;
