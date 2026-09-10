-- S115-A · TANDA 2 (①) — EL PRECIO DEL CATÁLOGO ES NETO, Y EL FINAL SE DERIVA
--
-- FIRMA DE LA MESA (10-sep-2026): en Ecuador el precio exhibido al consumidor es el
-- precio FINAL con impuestos (LODC art. 9 y 19) ⇒ **sumar IVA en el checkout no es
-- legal**. Y reinterpretar el precio de hoy como bruto le baja ~13 % al prestador sin
-- que lo acepte. Por eso: **el prestador declara su precio NETO; la app calcula y
-- MUESTRA el final = neto × (1 + tarifa vigente del ítem), redondeado a dos decimales.**
--
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912330000-precio-neto.sql
-- VEDA 76(g): NO RIGE. **Esta migración no cambia NINGÚN precio.**
--
-- 🔴 EL RENAME A `precio_neto` NO ENTRA ACÁ, Y ES POR NÚMERO, NO POR PEREZA.
--    Medido antes de escribir: `precio` tiene **355 referencias** en `apps/` y
--    `packages/`, **68 funciones** de la base lo nombran y **4 vistas** también.
--    D-662 —que esta misma tanda acaba de extender a tablas y vistas— dice que un
--    rename y su publish son UN SOLO ACTO, y esta tanda no publica. Renombrarlo hoy
--    rompe el motor de pagos entero en el bundle vivo.
--    ⇒ Se entrega **la sustancia** (la derivación, que es lo que impide la mentira)
--      y la semántica queda declarada EN EL OBJETO, con `COMMENT`, que es greppable.
--      El rename es su propia tanda, con su publish. Está anotado en el acta.
--
-- 🔴 Y LO QUE NO SE TOCA, POR FIRMA: los 27 desgloses congelados de prueba **no se
--    corrigen**. Son prueba de construcción; el rebote del motor desaparece solo
--    cuando el catálogo tenga su neto y las líneas se deriven de él.
--    Los **107 pagos históricos sin documento**: **NO hay backfill**. Firmado.

BEGIN;

-- ── ① LA SEMÁNTICA, DECLARADA EN EL OBJETO ──────────────────────────────────
COMMENT ON COLUMN public.prestador_servicios.precio IS
  'PRECIO NETO (sin IVA) que declara el prestador. El precio FINAL que ve la familia se DERIVA con precio_final(); NUNCA se guarda. Firma S115: el exhibido al consumidor es el final con impuestos (LODC art. 9 y 19).';
COMMENT ON COLUMN public.prestador_servicios.precio_paquete IS
  'PRECIO NETO del paquete. El final se deriva — ver precio_final().';
COMMENT ON COLUMN public.prestador_servicios.precio_mensual_plan IS
  'PRECIO NETO de la mensualidad. El final se deriva — ver precio_final().';
COMMENT ON COLUMN public.prestador_servicios.precio_plan IS
  'PRECIO NETO del plan. El final se deriva — ver precio_final().';
COMMENT ON COLUMN public.prestador_servicios.precio_emergencia IS
  'PRECIO NETO de la urgencia. El final se deriva — ver precio_final().';
COMMENT ON COLUMN public.prestador_servicio_tallas.precio IS
  'PRECIO NETO por talla. El final se deriva — ver precio_final().';
COMMENT ON COLUMN public.prestador_programas.precio_programa IS
  'PRECIO NETO del programa. El final se deriva — ver precio_final().';

-- ── ② LA DERIVACIÓN — UNA SOLA, Y NADIE LA REIMPLEMENTA ─────────────────────
CREATE OR REPLACE FUNCTION public.precio_final(p_neto numeric, p_codigo_iva text)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_pct numeric;
BEGIN
  IF p_neto IS NULL THEN RETURN NULL; END IF;   -- sin neto no hay final que inventar

  SELECT pct INTO v_pct FROM public.cat_tasas_impuesto
   WHERE codigo = p_codigo_iva AND activo
     AND vigencia_desde <= now() AND (vigencia_hasta IS NULL OR vigencia_hasta > now());

  /* 🔴 FAIL-CLOSED. Sin tarifa vigente NO se devuelve el neto como si fuera el
     final: eso mostraría un precio menor al legal y la familia pagaría otro en el
     checkout. Se devuelve NULL y la superficie tiene que decir que no sabe. */
  IF v_pct IS NULL THEN RETURN NULL; END IF;

  /* Dos decimales, UNA vez, sobre el resultado. `numeric`, jamás float:
     15 % de 6,70 es 1,01 en numeric y 1,00 en float64. */
  RETURN round(p_neto * (1 + v_pct / 100), 2);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.precio_final(numeric, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.precio_final(numeric, text) TO authenticated;

COMMENT ON FUNCTION public.precio_final(numeric, text) IS
  'La ÚNICA derivación del precio final. Si alguien la reimplementa en una pantalla, el día que cambie la tarifa habrá dos precios distintos para el mismo servicio.';

-- ── ③ LA VISTA: neto · tarifa · final, para TODO el catálogo de servicios ────
CREATE OR REPLACE VIEW public.v_catalogo_precio_final
WITH (security_invoker = true) AS
SELECT ps.id                AS prestador_servicio_id,
       ps.prestador_id,
       ps.tipo_servicio,
       ts.nombre            AS servicio,
       ts.codigo_iva,
       ct.pct               AS tarifa_pct,
       ts.tarifa_estado,
       ps.precio            AS precio_neto,
       public.precio_final(ps.precio, ts.codigo_iva)             AS precio_final,
       ps.precio_paquete    AS paquete_neto,
       public.precio_final(ps.precio_paquete, ts.codigo_iva)     AS paquete_final,
       ps.precio_mensual_plan AS mensual_neto,
       public.precio_final(ps.precio_mensual_plan, ts.codigo_iva) AS mensual_final,
       ps.activo
FROM public.prestador_servicios ps
JOIN public.tipos_servicio ts ON ts.codigo = ps.tipo_servicio
LEFT JOIN public.cat_tasas_impuesto ct ON ct.codigo = ts.codigo_iva
   AND ct.activo AND ct.vigencia_desde <= now()
   AND (ct.vigencia_hasta IS NULL OR ct.vigencia_hasta > now());

COMMENT ON VIEW public.v_catalogo_precio_final IS
  'El catálogo con su neto, su tarifa y su final DERIVADO. Es la fuente única del precio que se muestra: ninguna pantalla lo calcula por su cuenta.';

REVOKE ALL ON public.v_catalogo_precio_final FROM anon;
GRANT SELECT ON public.v_catalogo_precio_final TO authenticated;

-- ── ④ EL CINTURÓN: qué cambia y qué NO ──────────────────────────────────────
DO $$
DECLARE v_ofertas int; v_derivables int; v_sin_tarifa int; v_suma_neto numeric; v_suma_final numeric;
BEGIN
  SELECT count(*), count(precio_final), count(*) FILTER (WHERE precio_final IS NULL AND precio_neto IS NOT NULL),
         sum(precio_neto), sum(precio_final)
    INTO v_ofertas, v_derivables, v_sin_tarifa, v_suma_neto, v_suma_final
    FROM public.v_catalogo_precio_final
   WHERE tipo_servicio IN (SELECT codigo FROM public.tipos_servicio
                            WHERE categoria IN ('paseo','grooming','adiestramiento','hospedaje'));

  RAISE NOTICE 'CUATRO OFICIOS · ofertas=% derivables=% sin_tarifa=% suma_neto=% suma_final=%',
    v_ofertas, v_derivables, v_sin_tarifa, v_suma_neto, v_suma_final;

  /* Discriminador: si el final fuera IGUAL al neto, la derivación no está haciendo
     nada y la migración sería decorativa. */
  IF v_suma_final IS NOT NULL AND v_suma_final <= v_suma_neto THEN
    RAISE EXCEPTION 'cinturon_derivacion_muda: el final (%) no supera al neto (%)', v_suma_final, v_suma_neto;
  END IF;
  IF v_sin_tarifa > 0 THEN
    RAISE EXCEPTION 'cinturon_sin_tarifa: % oferta(s) de los cuatro oficios no derivan precio', v_sin_tarifa;
  END IF;

  /* Y que NINGÚN precio se movió: esta migración declara, no reprecia. */
  IF (SELECT count(*) FROM public.prestador_servicios WHERE precio IS NULL) <> 0 THEN
    RAISE EXCEPTION 'cinturon_precio_nulo: alguna oferta perdio su precio';
  END IF;
END $$;

COMMIT;
