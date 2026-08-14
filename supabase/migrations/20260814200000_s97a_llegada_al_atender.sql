-- S97-A · LA LLEGADA SE REGISTRA SOLA AL ATENDER (la mitad de motor del
--          dictado ①; hueco medido por D)
--
-- Origen: firma del founder en el gate de `ATENDER` (14-ago-2026), verbatim en
-- `LA_CASA_DEL_PRESTADOR` §6bis:
--   "si le doy atender es porque llegó"
--
-- 🔴 LA LECTURA CORRECTA DEL DICTADO, y es la que ordena esta migración:
--    el founder **NO dijo que la llegada no importe** — dijo que **atender la
--    IMPLICA**. Son cosas distintas y la diferencia es todo el dato: si se
--    apagara el botón sin esto, `llegada_en` se quedaría **sin un solo
--    escritor por el camino real** (medido por D: `registrar_llegada` es hoy
--    el ÚNICO) y las llegadas dejarían de existir **en silencio**.
--    *Un dato que deja de escribirse no da error: da un histórico que se
--    corta un martes y nadie sabe por qué.*
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE**.
--   DDL puro. Sin backfill: **las citas ya atendidas NO reciben una llegada
--   inventada.** Estampar `now()` sobre historia sería fabricar un dato que
--   nadie observó (L-139 en su forma más cara: verosímil y falso). El trigger
--   rige HACIA ADELANTE, que es lo único honesto.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ═══ POR QUÉ TRIGGER Y NO CUATRO PARCHES ═══
-- Medido: hay CUATRO puertas de iniciar (`iniciar_atencion_cita`,
-- `_adiestramiento`, `_grooming`, `_paseo`) y **las cuatro pasan la cita a
-- `en_curso`**. Poner la línea en cada una serían cuatro copias que hay que
-- acordarse de mantener — y **la quinta puerta, la del oficio que nazca
-- mañana, nacería sin ella y sin síntoma**.
--   ⇒ La regla vive en LA TRANSICIÓN, que es donde el hecho ocurre.
-- Precedente en esta misma tabla: `trg_otorgar_acceso_por_cita_confirmada`.
--
-- ═══ IDEMPOTENCIA: LA HORA DE LA PUERTA GANA ═══
-- `NEW.llegada_en IS NULL` en el WHEN. Si el mostrador ya la marcó, **no se
-- pisa**: quien vio entrar a la mascota sabe la hora mejor que el reloj del
-- momento en que el profesional apretó atender. *Sobrescribirla sería
-- reemplazar una observación por una inferencia.*
--
-- ═══ BEFORE, no AFTER ═══
-- BEFORE UPDATE permite asignar `NEW.llegada_en` directo: un solo write,
-- atómico con la transición, sin re-entrar a la tabla.

BEGIN;

CREATE OR REPLACE FUNCTION public._trg_cita_llegada_al_atender()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- La condición fina vive en el WHEN del trigger; acá solo el efecto.
  NEW.llegada_en := now();
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public._trg_cita_llegada_al_atender() IS
  'S97-A · Estampa llegada_en al pasar la cita a en_curso, si no estaba. '
  'Firma del founder: "si le doy atender es porque llego". '
  'IDEMPOTENTE: la hora que puso el mostrador GANA — no se pisa.';

DROP TRIGGER IF EXISTS trg_cita_llegada_al_atender ON public.evento_cita_servicio;

CREATE TRIGGER trg_cita_llegada_al_atender
  BEFORE UPDATE ON public.evento_cita_servicio
  FOR EACH ROW
  WHEN (
        NEW.estado = 'en_curso'
    AND OLD.estado IS DISTINCT FROM 'en_curso'
    AND NEW.llegada_en IS NULL
  )
  EXECUTE FUNCTION public._trg_cita_llegada_al_atender();

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN CON DISCRIMINADOR — los DOS brazos, porque la regla tiene dos
--
-- Un fixture que solo probara "estampa" daría verde con un trigger que pisa
-- siempre — y pisar siempre es exactamente el defecto que la idempotencia
-- existe para evitar. **Se prueba cada brazo por separado.**
-- Todo adentro de la transacción y se DESHACE a mano al final (un RAISE acá
-- abortaría la migración entera, que es lo que tiene que quedar).
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_cita_a uuid;          -- brazo A: sin llegada → tiene que estamparse
  v_cita_b uuid;          -- brazo B: con llegada → NO se pisa
  v_est_a  text;
  v_est_b  text;
  v_lleg_a timestamptz;
  v_lleg_b timestamptz;
  v_marca  timestamptz := '2020-01-01 08:00:00+00';
BEGIN
  SELECT id INTO v_cita_a
  FROM evento_cita_servicio
  WHERE estado = 'confirmada' AND llegada_en IS NULL
  LIMIT 1;

  SELECT id INTO v_cita_b
  FROM evento_cita_servicio
  WHERE estado = 'confirmada' AND id IS DISTINCT FROM v_cita_a
  LIMIT 1;

  IF v_cita_a IS NULL OR v_cita_b IS NULL THEN
    RAISE EXCEPTION
      'CINTURON ABORTA: no hay dos citas confirmadas para discriminar los dos brazos (a=%, b=%). Sin ellas el fixture no prueba nada.',
      v_cita_a, v_cita_b;
  END IF;

  -- Guardo estado original para restituir.
  SELECT estado, llegada_en INTO v_est_a, v_lleg_a FROM evento_cita_servicio WHERE id = v_cita_a;
  SELECT estado, llegada_en INTO v_est_b, v_lleg_b FROM evento_cita_servicio WHERE id = v_cita_b;

  -- ── BRAZO A: sin llegada previa → el trigger la estampa ──
  UPDATE evento_cita_servicio SET estado = 'en_curso' WHERE id = v_cita_a;
  IF (SELECT llegada_en FROM evento_cita_servicio WHERE id = v_cita_a) IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO (brazo A): la cita paso a en_curso y llegada_en sigue NULL. El trigger no disparo.';
  END IF;

  -- ── BRAZO B: con llegada previa → NO se pisa ──
  UPDATE evento_cita_servicio SET llegada_en = v_marca WHERE id = v_cita_b;
  UPDATE evento_cita_servicio SET estado = 'en_curso' WHERE id = v_cita_b;
  IF (SELECT llegada_en FROM evento_cita_servicio WHERE id = v_cita_b) <> v_marca THEN
    RAISE EXCEPTION
      'CINTURON ROJO (brazo B): la llegada del mostrador (%) fue PISADA por el trigger. La hora de la puerta tiene que ganar.',
      v_marca;
  END IF;

  -- ── TEARDOWN explícito, con residuo medido ──
  UPDATE evento_cita_servicio SET estado = v_est_a, llegada_en = v_lleg_a WHERE id = v_cita_a;
  UPDATE evento_cita_servicio SET estado = v_est_b, llegada_en = v_lleg_b WHERE id = v_cita_b;

  IF EXISTS (
    SELECT 1 FROM evento_cita_servicio
    WHERE (id = v_cita_a AND (estado <> v_est_a OR llegada_en IS DISTINCT FROM v_lleg_a))
       OR (id = v_cita_b AND (estado <> v_est_b OR llegada_en IS DISTINCT FROM v_lleg_b))
  ) THEN
    RAISE EXCEPTION 'CINTURON ABORTA: el teardown dejo residuo. No se cierra una migracion ensuciando datos.';
  END IF;

  RAISE NOTICE 'CINTURON OK · brazo A estampo · brazo B respeto la hora del mostrador · residuo 0';
END;
$cinturon$;

COMMIT;
