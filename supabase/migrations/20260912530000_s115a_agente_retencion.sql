-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · `agenteRetencion` — el campo que la 2.1.0 trae y la 1.0.0 no
--
-- El esquema 2.1.0 lleva `<agenteRetencion>` en `infoTributaria`, y **el campo
-- no es un booleano: es el NÚMERO DE RESOLUCIÓN** con el que el SRI designa al
-- contribuyente. `fiscal_emisor.agente_retencion` ya existía como boolean —
-- sirve para decidir SI va, no para decir QUÉ va.
--
-- 🔴 FAIL-CLOSED, y es la mitad que importa: si alguien marca el boolean y no
--    carga la resolución, **el documento no se emite**. *Un `<agenteRetencion>`
--    con un valor inventado es un XML plausible que el SRI rechaza semanas
--    después, en otro sistema, sin decir de dónde vino.*
--
-- 76(g) — VEDA: NO RIGE (una columna nullable sobre una tabla de 1 fila).
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.fiscal_emisor
  ADD COLUMN IF NOT EXISTS agente_retencion_resolucion text;

COMMENT ON COLUMN public.fiscal_emisor.agente_retencion_resolucion IS
  'Numero de resolucion con que el SRI designa agente de retencion. Va en '
  '<agenteRetencion> del esquema 2.1.0. Si agente_retencion es true y esto es '
  'NULL, el documento NO se emite: el campo no admite un valor inventado.';

DO $c$
DECLARE v_b boolean; v_r text; v_v text;
BEGIN
  SELECT agente_retencion, agente_retencion_resolucion, version_esquema
    INTO v_b, v_r, v_v FROM public.fiscal_emisor LIMIT 1;
  IF v_v IS DISTINCT FROM '2.1.0' THEN
    RAISE EXCEPTION 'cinturon: el emisor no declara esquema 2.1.0 sino %', coalesce(v_v,'(null)');
  END IF;
  /* Hoy Satori NO es agente de retención designado: el booleano está en false y
     la resolución en NULL. Es el estado coherente, y se declara para que el día
     que cambie se vea que cambió. */
  IF COALESCE(v_b, false) AND v_r IS NULL THEN
    RAISE EXCEPTION 'cinturon 🔴: el emisor dice ser agente de retencion y NO declara '
                    'su resolucion. Con eso el XML saldria con el campo vacio o inventado.';
  END IF;
  RAISE NOTICE 'cinturon VERDE: esquema % · agente_retencion=% · resolucion=%',
               v_v, COALESCE(v_b,false), COALESCE(v_r,'(ninguna, coherente)');
END $c$;
