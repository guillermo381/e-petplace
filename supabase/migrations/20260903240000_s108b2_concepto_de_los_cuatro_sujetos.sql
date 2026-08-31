-- ═══════════════════════════════════════════════════════════════════════════
-- S108-B2 · EL COMPROBANTE DICE QUÉ SE COMPRÓ — LOS CUATRO SUJETOS
--
-- 🔴 Firma del founder (31-ago), y viene PARTIDA EN DOS a propósito:
--    ① **decir qué se compró NO es una decisión fiscal** ⇒ el comprobante dice
--       el objeto, y eso se construye ahora;
--    ② **cómo TRIBUTA un paquete de días sigue esperando al contador** ⇒ no se
--       inventa tratamiento y **no se toca el IVA derivado del desglose**.
--    *Las dos preguntas venían pegadas y por eso el concepto quedó neutro. Son
--    separables: «Paquete de 5 estadías» es una descripción del objeto, y sigue
--    siendo verdadera cualquiera sea el criterio tributario que el contador
--    firme.*
--
-- 🔴 EL ARTEFACTO QUE LO ORDENÓ, medido el 31-ago con un cobro real: el
--    comprobante del paquete `0095f8cf` salió diciendo
--    **«Clínica Aurora · Pago en e-PetPlace · $40.00»**. Una familia que compró
--    un paquete de guardería recibía un respaldo que no dice que fue un
--    paquete — el defecto exacto de `§10.1`, otra vez, sobre los sujetos nuevos.
--
-- 🔴 EL TEXTO SALE DEL OBJETO PERSISTIDO, jamás de la puerta. `unidades_total`
--    y `tipo_servicio` los escribió la compra; el monto sigue saliendo del
--    desglose congelado. *Un concepto tecleado por quien llama es un concepto
--    que el llamador puede equivocar, y el comprobante es la prueba que le
--    queda a la familia.*
--
-- 🔴 EL FAIL-CLOSED SE CONSERVA ENTERO: el último `COALESCE` sigue siendo el
--    genérico honesto. *Un sujeto que no sabemos nombrar se dice genérico —
--    JAMÁS con el concepto del otro sujeto* (`§10.1`, su primera versión ya
--    había caído en el «específico falso» con un `COUNT` que siempre contesta).
--
-- 🔴 VEDA 76(g): NO RIGE. `CREATE OR REPLACE` de una función STABLE de lectura.
--    Cero DDL, cero backfill. Los comprobantes ya emitidos NO cambian: sus
--    datos son un snapshot.
--
-- REVERSA: docs/relevamientos/2026-09-03-s108b2-REVERSA-M4.sql (escrita ANTES).
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

    -- 🔴 Y si no sabemos: se dice genérico. JAMÁS el concepto del otro sujeto.
    'Pago en e-PetPlace');
$function$;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE v_bono uuid; v_susc uuid; v_cita uuid; v_txt text;
BEGIN
  SELECT id INTO v_bono FROM bonos WHERE tipo_servicio='guarderia_dia' LIMIT 1;
  SELECT id INTO v_susc FROM guarderia_suscripciones LIMIT 1;
  SELECT id INTO v_cita FROM evento_cita_servicio LIMIT 1;
  IF v_bono IS NULL OR v_susc IS NULL OR v_cita IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta un sujeto vivo con que DISCRIMINAR';
  END IF;

  -- (a) el paquete dice el objeto, y NO el genérico
  v_txt := _concepto_de_pago(v_bono);
  IF v_txt NOT LIKE 'Paquete de % de guardería' THEN
    RAISE EXCEPTION 'CINTURON: el paquete dijo «%»', v_txt;
  END IF;

  -- (b) la mensualidad idem
  v_txt := _concepto_de_pago(v_susc);
  IF v_txt <> 'Plan mensual de guardería' THEN
    RAISE EXCEPTION 'CINTURON: la mensualidad dijo «%»', v_txt;
  END IF;

  -- (c) 🔴 LOS DOS VIEJOS NO SE ROMPIERON. *Agregar ramas a un COALESCE puede
  --     cambiar cuál gana; que los nuevos anden no prueba que los viejos sigan.*
  v_txt := _concepto_de_pago(v_cita);
  IF v_txt IS NULL OR v_txt = 'Pago en e-PetPlace' THEN
    RAISE EXCEPTION 'CINTURON: la CITA cayó al genérico — «%»', v_txt;
  END IF;

  -- (d) 🔴 EL FAIL-CLOSED SIGUE ENTERO: un id desconocido dice genérico, jamás
  --     el concepto de otro sujeto ni un «0 productos».
  v_txt := _concepto_de_pago(gen_random_uuid());
  IF v_txt <> 'Pago en e-PetPlace' THEN
    RAISE EXCEPTION 'CINTURON: un id desconocido dijo «%» en vez del genérico', v_txt;
  END IF;

  RAISE NOTICE 'CINTURON S108B2-M4 OK · paquete y plan con su objeto · cita intacta · fail-closed entero';
END $cinturon$;
