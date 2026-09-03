-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · EL PRESTADOR LLEVA SU ZONA HORARIA
--
-- Pedido de C, con su límite ya medido y declarado por ellos: hoy usan el
-- default de la casa y **eso es igual de correcto para un negocio en Ecuador
-- e igual de equivocado para uno que no lo esté** — con la diferencia de que
-- ya no depende del teléfono, que era el defecto.
--
-- 🔴 **LO QUE ESTA COLUMNA NO HACE, Y ES LO MÁS IMPORTANTE:** `hoy_local()`
-- **sigue usando la constante**, y **58 funciones de la casa con ella**. Esta
-- columna le da a la APP una zona por prestador; **el MOTOR sigue calculando
-- con Guayaquil**. ⇒ el día que exista un prestador con otra zona, la app y
-- el motor van a discrepar — *y la app va a tener razón*.
--
-- **No se cura desde acá a propósito:** cambiar `hoy_local()` para que tome la
-- zona de un prestador exige decidir de QUIÉN es el día en funciones que hoy
-- no reciben prestador (barridos, crones, reportes). *Es decisión de
-- plataforma, y hacerla de refilón desde adopción movería 58 funciones sin
-- que nadie lo haya pedido.* Queda declarado acá, que es donde se va a leer.
--
-- 🔴 **76(g) RIGE** — toda fila gana un valor. **Anclas: las 12 filas de
-- `prestadores`, TODAS con `country_code = 'EC'`** (medido antes de escribir)
-- ⇒ el default es **exactamente la constante que ya las gobernaba**, así que
-- **ningún día cambia hoy**. *Un backfill que cambia el valor efectivo de algo
-- que ya estaba funcionando es una migración de datos disfrazada de columna.*
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.prestadores
  ADD COLUMN zona_horaria text NOT NULL DEFAULT 'America/Guayaquil';

/* La zona tiene que existir de verdad: un texto libre acepta 'Guayaquil' o
   'america/guayaquil' y **el día saldría mal sin que nada falle**. */
ALTER TABLE public.prestadores
  ADD CONSTRAINT chk_prestadores_zona_valida
  CHECK (now() AT TIME ZONE zona_horaria IS NOT NULL);

-- ═══ CINTURÓN ═══
DO $c$
DECLARE v_n int; v_raras int; v_err text;
BEGIN
  SELECT count(*) INTO v_n FROM prestadores WHERE zona_horaria = 'America/Guayaquil';
  SELECT count(*) INTO v_raras FROM prestadores WHERE zona_horaria <> 'America/Guayaquil';
  IF v_raras <> 0 THEN
    RAISE EXCEPTION 'CINTURON: % fila(s) con zona distinta al backfill declarado', v_raras;
  END IF;

  /* 🔴 EL CONTROL: el día que sale de la columna tiene que ser HOY el mismo
     que `hoy_local()`. Si difiriera, la columna estaría cambiando algo que ya
     funcionaba — y la migración dice explícitamente que no cambia ningún día. */
  IF EXISTS (SELECT 1 FROM prestadores
              WHERE (now() AT TIME ZONE zona_horaria)::date <> public.hoy_local()) THEN
    RAISE EXCEPTION 'CINTURON: la zona de alguna fila produce un dia distinto al del motor';
  END IF;

  /* Y el CHECK rechaza una zona inventada. Sin este brazo, un texto libre
     pasaría y el día saldría mal en silencio. */
  BEGIN
    UPDATE prestadores SET zona_horaria = 'America/Noexiste' WHERE id = (SELECT id FROM prestadores LIMIT 1);
    RAISE EXCEPTION 'CINTURON: el CHECK acepto una zona inventada';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err LIKE 'CINTURON:%' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE: % fila(s) con la zona de la casa y ninguna produce otro dia', v_n;
END $c$;
