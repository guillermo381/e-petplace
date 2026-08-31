-- ═══════════════════════════════════════════════════════════════════════════
-- S109-B · EL COMPROBANTE DEL PROGRAMA DICE QUÉ SE COMPRÓ
--
-- 🔴 Medido antes de ejercerlo: `_concepto_de_pago` no conoce `programa` y su
--    fail-closed devuelve **«Pago en e-PetPlace»**. Darle puerta de entrada al
--    programa sin esto habría producido un cobro real con un respaldo que no
--    dice qué se compró — **el defecto de `§10.1`, en el sujeto recién abierto.**
--    *La puerta y el respaldo se abren en el mismo acto, o el primer cobro real
--    es el que descubre que faltaba la mitad.*
--
-- 🔴 EL TEXTO SALE DEL OBJETO PERSISTIDO (`n_sesiones`), jamás de la puerta, y
--    en voz de familia: **«Programa de N sesiones»**. El nombre comercial del
--    programa se deja afuera a propósito — *el comprobante dice qué se compró,
--    no cómo lo llama el negocio.*
--
-- 🔴 VEDA 76(g): NO RIGE. `CREATE OR REPLACE` de una función STABLE de lectura.
-- REVERSA: docs/relevamientos/2026-09-07-s109b-REVERSA-M5.sql (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._concepto_de_pago(p_sujeto uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT COALESCE(
    -- ① CITA: el servicio con su nombre humano.
    (SELECT COALESCE(ts.nombre, c.tipo_servicio)
       FROM evento_cita_servicio c
       LEFT JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio
      WHERE c.id = p_sujeto),

    -- ② COMPRA: lo que se llevó. Con un ítem, su nombre; con varios, el conteo.
    /* 🔴 `NULLIF` sobre el conteo cero: **un agregado sin filas devuelve una
       FILA igual** —`count(*) = 0`— y el COALESCE la toma como respuesta.
       Medido: un id desconocido devolvía **«0 productos»**, que es
       exactamente el «específico falso» que el fail-closed venía a evitar.
       *Un agregado siempre contesta; que conteste no significa que sepa.* */
    (SELECT CASE WHEN count(*) = 0 THEN NULL
                 WHEN count(*) = 1 THEN max(pi.nombre_producto)
                 ELSE count(*)::text || ' productos' END
       FROM pedidos p JOIN pedido_items pi ON pi.pedido_id = p.id
      WHERE p.compra_id = p_sujeto),

    -- ③ PAQUETE (bono): el objeto, con su cantidad y su oficio.
    /* La unidad se dice en la voz del oficio: la guardería vende **estadías**
       —un día entero, no un turno—, y el resto de los oficios vende lo que su
       catálogo nombre. *Decirle «unidades» a lo que la familia compró como
       días es hablarle en el vocabulario del motor.*
       El singular se resuelve: «Paquete de 1 estadías» es la clase de detalle
       que hace parecer automático un documento que tiene que parecer serio. */
    (SELECT 'Paquete de ' || b.unidades_total || ' ' ||
            CASE
              WHEN b.tipo_servicio = 'guarderia_dia'
                THEN CASE WHEN b.unidades_total = 1 THEN 'estadía' ELSE 'estadías' END
                     || ' de guardería'
              WHEN b.tipo_servicio = 'paseo'
                THEN CASE WHEN b.unidades_total = 1 THEN 'salida' ELSE 'salidas' END
                     || ' de paseo'
              ELSE COALESCE(ts.nombre, b.tipo_servicio)
            END
       FROM bonos b
       LEFT JOIN tipos_servicio ts ON ts.codigo = b.tipo_servicio
      WHERE b.id = p_sujeto),

    -- ④ MENSUALIDAD de guardería: el mandato.
    (SELECT 'Plan mensual de guardería'
       FROM guarderia_suscripciones g WHERE g.id = p_sujeto),

    -- ⑤ PROGRAMA de adiestramiento: el objeto, en voz de familia.
    (SELECT 'Programa de ' || pc.n_sesiones || ' ' ||
            CASE WHEN pc.n_sesiones = 1 THEN 'sesión' ELSE 'sesiones' END
       FROM programas_contratados pc WHERE pc.id = p_sujeto),

    -- 🔴 Y si no sabemos: se dice genérico. JAMÁS el concepto del otro sujeto.
    'Pago en e-PetPlace');
$function$
;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $c$
DECLARE v_p uuid; v_txt text; v_n int;
BEGIN
  SELECT id, n_sesiones INTO v_p, v_n FROM programas_contratados LIMIT 1;
  IF v_p IS NULL THEN RAISE EXCEPTION 'CINTURON: sin programa con que DISCRIMINAR'; END IF;

  v_txt := _concepto_de_pago(v_p);
  IF v_txt <> ('Programa de ' || v_n || (CASE WHEN v_n = 1 THEN ' sesión' ELSE ' sesiones' END)) THEN
    RAISE EXCEPTION 'CINTURON: el programa dijo «%» (n_sesiones=%)', v_txt, v_n;
  END IF;

  /* 🔴 LOS CUATRO ANTERIORES NO SE ROMPIERON. *Agregar una rama a un COALESCE
     puede cambiar cuál gana; que la nueva ande no prueba que las viejas sigan.* */
  IF _concepto_de_pago((SELECT id FROM evento_cita_servicio LIMIT 1)) = 'Pago en e-PetPlace' THEN
    RAISE EXCEPTION 'CINTURON: la CITA cayó al genérico';
  END IF;
  IF _concepto_de_pago((SELECT id FROM bonos WHERE tipo_servicio='guarderia_dia' LIMIT 1))
     NOT LIKE 'Paquete de % de guardería' THEN
    RAISE EXCEPTION 'CINTURON: el PAQUETE de guardería se rompió';
  END IF;
  IF _concepto_de_pago((SELECT id FROM guarderia_suscripciones LIMIT 1))
     <> 'Plan mensual de guardería' THEN
    RAISE EXCEPTION 'CINTURON: el PLAN mensual se rompió';
  END IF;
  /* Y el fail-closed entero. */
  IF _concepto_de_pago(gen_random_uuid()) <> 'Pago en e-PetPlace' THEN
    RAISE EXCEPTION 'CINTURON: un id desconocido dejó de caer al genérico';
  END IF;

  RAISE NOTICE 'CINTURON S109B-M5 OK · programa con su objeto · los cuatro anteriores intactos · fail-closed entero';
END $c$;
