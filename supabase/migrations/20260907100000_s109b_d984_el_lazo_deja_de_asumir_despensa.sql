-- ═══════════════════════════════════════════════════════════════════════════
-- S109-B · `D-984` CABLEADO — EL LAZO RECURRENTE DEJA DE ASUMIR DESPENSA
--
-- 🔴 POR QUÉ ESTO ES BLOQUEO DE LANZAMIENTO Y NO DEUDA (firma del founder):
--    su mitad sin curar produce **el peor modo de falla del sistema** — el cron
--    suena, la edge corre sus dos selectores, la mensualidad no se cobra, y el
--    timbre devuelve `ok:true`. *Nadie va a estar mirando.*
--
-- 🔴 LA CAUSA, medida: la edge itera `para_cobrar` y usa `it.recurrencia_id` y
--    `it.pedido_id` — **campos de despensa**. El selector de la mensualidad
--    devolvía una TABLA y no podía enchufarse. ⇒ La cura no es agregar una
--    tercera llamada: es que **el lazo deje de saber de qué sujeto habla**.
--
-- 🔴 LA NORMALIZACIÓN ES ADITIVA A PROPÓSITO. Los ítems de los dos selectores
--    vivos **conservan todos sus campos** y ganan `sujeto` y `sujeto_id`.
--    *Quitarles un campo para uniformar sería romper el cobro que hoy funciona
--    para arreglar el que todavía no cobra* — y este lazo mueve plata real.
--
-- 🔴 VEDA 76(g): NO RIGE. Dos funciones nuevas + `CREATE OR REPLACE` de cuatro.
--    Cero DDL de tablas, cero backfill.
--
-- REVERSA: docs/relevamientos/2026-09-07-s109b-REVERSA-M4.sql (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① EL DESGLOSE CONGELADO, PARA CUALQUIER SUJETO ─────────────────────────
/* Hermano de `_total_congelado_del_intento`, con las cuatro cifras que el lazo
   necesita para el guard del IVA. *El lazo leía `recurrencia_desglose` directo:
   una tabla por nombre es exactamente lo que lo ataba a despensa.* */
CREATE OR REPLACE FUNCTION public._desglose_congelado_del_intento(p_intento uuid)
RETURNS TABLE(subtotal numeric, impuesto numeric, envio numeric, total numeric, moneda text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT d.subtotal, d.impuesto, d.envio, d.total, d.moneda FROM pagos_intentos i
  CROSS JOIN LATERAL (
    SELECT CASE WHEN i.pedido_id IS NOT NULL THEN
             (SELECT jsonb_build_object('s',sum(x.subtotal),'i',sum(x.impuesto),
                                        'e',sum(x.envio),'t',sum(x.total),'m','USD')
                FROM compra_desglose x WHERE x.compra_id = i.compra_id)
           WHEN i.cita_id IS NOT NULL THEN
             (SELECT jsonb_build_object('s',x.subtotal,'i',x.impuesto,'e',0,'t',x.total,'m',x.moneda)
                FROM cita_desglose x WHERE x.cita_id = i.cita_id)
           WHEN i.bono_id IS NOT NULL THEN
             (SELECT jsonb_build_object('s',x.subtotal,'i',x.impuesto,'e',0,'t',x.total,'m',x.moneda)
                FROM bono_desglose x WHERE x.bono_id = i.bono_id)
           WHEN i.guarderia_suscripcion_id IS NOT NULL THEN
             (SELECT jsonb_build_object('s',x.subtotal,'i',x.impuesto,'e',0,'t',x.total,'m',x.moneda)
                FROM guarderia_suscripcion_desglose x
               WHERE x.guarderia_suscripcion_id = i.guarderia_suscripcion_id
                 AND x.periodo = i.guarderia_suscripcion_periodo)
           WHEN i.recurrencia_id IS NOT NULL THEN
             (SELECT jsonb_build_object('s',x.subtotal,'i',x.impuesto,'e',x.envio,'t',x.total,'m',x.moneda)
                FROM recurrencia_desglose x
               WHERE x.recurrencia_id = i.recurrencia_id AND x.periodo = i.recurrencia_periodo)
           WHEN i.suscripcion_servicio_id IS NOT NULL THEN
             (SELECT jsonb_build_object('s',x.subtotal,'i',x.impuesto,'e',0,'t',x.total,'m',x.moneda)
                FROM suscripcion_desglose x
               WHERE x.suscripcion_servicio_id = i.suscripcion_servicio_id
                 AND x.periodo = i.suscripcion_periodo)
           WHEN i.programa_contratado_id IS NOT NULL THEN
             (SELECT jsonb_build_object('s',x.subtotal,'i',x.impuesto,'e',0,'t',x.total,'m',x.moneda)
                FROM programa_desglose x WHERE x.programa_contratado_id = i.programa_contratado_id)
           ELSE NULL END AS j
  ) c
  CROSS JOIN LATERAL (
    SELECT (c.j->>'s')::numeric, (c.j->>'i')::numeric, COALESCE((c.j->>'e')::numeric,0),
           (c.j->>'t')::numeric, COALESCE(c.j->>'m','USD')
  ) d(subtotal, impuesto, envio, total, moneda)
  /* 🔴 Sin fila NO devuelve nada — y el lazo tiene que tratar «cero filas» como
     negativa. *Un desglose que se inventa es un cobro que nadie prometió.* */
  WHERE i.id = p_intento AND c.j IS NOT NULL;
$fn$;

-- ── ② LA COMPUERTA, POR SUJETO Y CON DESPACHADOR ───────────────────────────
CREATE OR REPLACE FUNCTION public.verificar_compuertas_del_intento(p_intento uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_i pagos_intentos;
BEGIN
  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo','intento_no_existe'); END IF;

  IF v_i.recurrencia_id IS NOT NULL THEN
    RETURN verificar_compuertas_recurrencia(v_i.recurrencia_id, v_i.recurrencia_periodo);
  END IF;
  IF v_i.guarderia_suscripcion_id IS NOT NULL THEN
    RETURN verificar_compuertas_mensualidad_guarderia(
             v_i.guarderia_suscripcion_id, v_i.guarderia_suscripcion_periodo);
  END IF;

  /* 🔴 FAIL-CLOSED CON NOMBRE. Un sujeto sin compuerta propia NO pasa «porque
     no había nada que verificar»: se niega diciendo cuál es. *Devolver `ok:true`
     por ausencia de reglas es cómo un sujeto nuevo entra al cobro sin que nadie
     haya decidido que podía.* */
  RETURN jsonb_build_object('ok', false, 'codigo', 'sin_compuerta_para_el_sujeto',
    'sujeto', (SELECT c.codigo FROM cat_sujetos_de_pago c
                WHERE to_jsonb(v_i) ->> c.columna_intento IS NOT NULL LIMIT 1));
END $fn$;

REVOKE ALL ON FUNCTION public._desglose_congelado_del_intento(uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.verificar_compuertas_del_intento(uuid) FROM anon, authenticated, PUBLIC;

-- ── ③ LOS DOS SELECTORES VIVOS GANAN `sujeto` Y `sujeto_id` — ADITIVO ──────
/* 🔴 NO SE LES QUITA NI SE LES RENOMBRA UN SOLO CAMPO. El lazo viejo sigue
   funcionando con ellos mientras migra; el nuevo usa los dos campos nuevos.
   *Uniformar rompiendo el cobro que hoy anda, para arreglar el que todavía no
   cobra, sería cambiar un hueco por un agujero.* */
CREATE OR REPLACE FUNCTION public.recurrencias_vencidas_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_r          record;
  v_hoy        date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_compuertas jsonb;
  v_total      numeric(12,2);
  v_subtotal   numeric(12,2);
  v_impuesto   numeric(12,2);
  v_envio      numeric(12,2);
  v_intento    uuid;
  v_listas     jsonb := '[]'::jsonb;
  v_frenadas   jsonb := '[]'::jsonb;
BEGIN
  /* 🔴 EL RELOJ ES DE GUAYAQUIL Y NO DE UTC. *Una serie que vence «el 13» vence
     el 13 donde vive la familia. Con UTC, un cobro de las 20:00 locales cae al
     día siguiente y el aviso de 48 h se corre solo.* */

  FOR v_r IN
    SELECT r.*
      FROM pedidos_recurrencias r
     WHERE r.estado = 'activa'
       AND r.proximo_pedido_fecha <= v_hoy
       /* 🔴 EL CANDADO CONTRA EL CRON QUE CORRE DOS VECES, en el SELECT y no
          solo en el índice: si ya hay un intento APROBADO de este período, la
          fila no vuelve a entrar. *El UNIQUE parcial es el piso; esto evita
          que siquiera se intente y se llene el buzón de rechazos por
          duplicado.* */
       AND NOT EXISTS (
             SELECT 1 FROM pagos_intentos i
              WHERE i.recurrencia_id = r.id
                AND i.recurrencia_periodo = r.proximo_pedido_fecha
                AND i.estado = 'aprobado')
     ORDER BY r.proximo_pedido_fecha, r.id
     FOR UPDATE OF r SKIP LOCKED
  LOOP
    /* ── ⓐ LA RAÍZ DE AUTORIZACIÓN, verificada fila por fila ───────────────
       §2: la autorización nombra QUIÉN, CUÁNDO y SOBRE QUÉ MEDIO. Las tres
       viven en la fila; si falta una, **no se cobra y se dice cuál falta**.
       🔴 *«Si ese medio muere, la serie no salta a otro por su cuenta: jamás
       se cobra a una tarjeta que el cliente no eligió para esto.»* Por eso se
       verifica que la tarjeta siga siendo SUYA y siga GUARDADA — no alcanza
       con que el id no sea nulo. */
    IF v_r.tarjeta_id IS NULL THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'sin_medio_autorizado');
      CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tarjetas_guardadas t
                    WHERE t.id = v_r.tarjeta_id
                      AND t.user_id = v_r.user_id
                      AND t.estado = 'guardada') THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'medio_no_disponible');
      CONTINUE;
    END IF;

    /* ── ⓑ↔ⓒ 🔴 EL ORDEN LO CORRIGIÓ EL ARNÉS, NO LA LECTURA ─────────────
       **Estaban al revés: la compuerta 2 verifica el monto CONTRA EL DESGLOSE
       CONGELADO, y el desglose se congelaba DESPUÉS.** ⇒ toda serie salía
       frenada con `desglose_incompleto`, **siempre**.
       *Leído, el cuerpo se ve correcto —«primero se verifica, después se
       congela» suena bien—; corrido, no cobra jamás.* **Y su modo de falla es
       de los que se archivan: un freno con nombre propio, prolijo, que parece
       una compuerta funcionando.** (`L-372`)
       ⇒ **CONGELAR y después VERIFICAR.** La compuerta necesita el número
       para poder compararlo. */

    /* ── ⓒ EL DESGLOSE DEL PERÍODO, CONGELADO AL PRECIO DE HOY ─────────────
       §5: **precio VIGENTE al momento del cobro**, no el del día en que el
       cliente se suscribió. Por eso la PK lleva el período adentro.
       ⚠️ El cálculo sale del catálogo VIVO, y si no da un total > 0 **no se
       inventa**: se frena. *Un total cero que se cobra es un cobro sin
       concepto; uno que se estima es un número que nosotros elegimos.* */
    SELECT
      COALESCE(SUM((it->>'cantidad')::int * o.precio), 0)
      INTO v_subtotal
      FROM jsonb_array_elements(v_r.items) it
      JOIN ofertas o ON o.id = (it->>'oferta_id')::uuid
     WHERE o.estado = 'publicada';

    v_impuesto := ROUND(v_subtotal * COALESCE(
                    /* 🔴 La columna es `pct`, NO `tasa` — medido. *Escribirla
                       de memoria habría hecho fallar el cálculo entero, y el
                       cuerpo se ve igual de correcto leyéndolo.* */
                    (SELECT pct FROM cat_tasas_impuesto
                      WHERE codigo = 'EC_IVA_0' AND activo
                        AND (vigencia_hasta IS NULL OR vigencia_hasta > now())
                      LIMIT 1), 0), 2);
    v_envio    := 0;   -- §7.2(4): hoy vale cero y lo paga el vendedor
    v_total    := v_subtotal + v_impuesto + v_envio;

    IF v_total IS NULL OR v_total <= 0 THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'sin_total_calculable');
      CONTINUE;
    END IF;

    /* 🔴 Y EL MONTO ESPERADO ES UN FRENO, NO UN ADORNO. §2: la autorización
       nombra un monto. Si el precio de hoy se fue muy por encima del que el
       cliente autorizó, **no se cobra: se avisa**. *Cobrar «lo que salga» es
       exactamente lo que una autorización recurrente no autoriza.* */
    IF v_r.monto_esperado IS NOT NULL AND v_total > v_r.monto_esperado THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'monto_supera_lo_autorizado',
        'autorizado', v_r.monto_esperado, 'calculado', v_total);
      CONTINUE;
    END IF;

    INSERT INTO recurrencia_desglose
      (recurrencia_id, periodo, subtotal, impuesto, envio, total, moneda)
    VALUES (v_r.id, v_r.proximo_pedido_fecha, v_subtotal, v_impuesto, v_envio, v_total, 'USD')
    ON CONFLICT (recurrencia_id, periodo) DO NOTHING;
    /* `DO NOTHING` y no `DO UPDATE`, a propósito: **el desglose de un período
       se congela UNA vez.** *Si un reintento lo recalculara, el segundo intento
       podría cobrar un monto distinto del que el primero rechazó — y el
       cliente vería dos números para el mismo mes.* */

    /* ── ⓑ LAS COMPUERTAS ───────────────────────────────────────────────────
       🔴 **ACÁ HAY UNA DECISIÓN DE MESA PENDIENTE, Y NO LA TOMO SOLO.**

       La mesa firmó *«compuertas E3 enteras»*. **Medido contra el objeto:
       `verificar_compuertas_pre_cobro(p_compra_id uuid, p_token text)` es
       COMPRA-ONLY** — lee `compras`, `pedidos` e `inventario_reservas`, y **una
       recurrencia no tiene ninguna de las tres.** *Llamarla pasando el
       `recurrencia_id` como `compra_id` habría devuelto `compra_no_existe` en
       el 100 % de los casos: un freno que se ve como una compuerta funcionando.*

       **Y no es que falte adaptarla: DOS DE SUS COMPUERTAS NO APLICAN, con su
       razón:**
         · **1 · reserva de stock** — no hay pedido todavía. **§6 firma que
           primero se cobra y DESPUÉS sale la entrega**; exigir reserva antes
           del cobro invertiría esa firma.
         · **compra sin pedidos** — por lo mismo: el pedido nace después.
       **Y DOS SÍ, con el mismo espíritu y otro sujeto:**
         · **0 · intento en vuelo** — íntegra. *Protege la tarjeta del cliente
           del segundo débito, que es lo caro.*
         · **monto contra desglose congelado** — construida arriba, en ⓒ.

       ⚖️ **LAS DOS SALIDAS, servidas para la mesa:**
       **(a) ensanchar `verificar_compuertas_pre_cobro` a tres sujetos** — es
       cirugía sobre la función que HOY cobra plata real de Nuvei, exactamente
       lo que S103-D se negó a hacer por el mismo motivo.
       **(b) `verificar_compuertas_recurrencia(uuid, date)` propia**, con cada
       predicado **extraído del cuerpo vivo** y con las dos que no aplican
       **declaradas por nombre**. ⚠️ Riesgo declarado: `L-375` — reimplementar
       es medir el propio eco; se mitiga extrayendo, no reescribiendo.
       **Voto de A: (b)**, porque la mitad que no aplica no se puede parametrizar
       sin volver la compuerta de compras más difícil de leer, *y porque una
       firma que no se puede cumplir literalmente se declara, no se fuerza.*

       ✅ **RESUELTO por (b), y el mapeo completo vive en ④ al pie de este
       archivo: CUATRO evaluadas + cobertura declarada no-evaluable + reserva
       declarada no-aplica.** *Mi propio conteo de arriba decía «dos» — estaba
       hecho sobre medio cuerpo leído.* */
    v_compuertas := verificar_compuertas_recurrencia(v_r.id, v_r.proximo_pedido_fecha);
    IF COALESCE((v_compuertas->>'ok')::boolean, false) IS NOT TRUE THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', COALESCE(v_compuertas->>'codigo', 'compuerta_sin_codigo'),
        'compuertas', v_compuertas);
      CONTINUE;
    END IF;

    /* ── ⓓ EL INTENTO, CON PAGADOR EXPLÍCITO ───────────────────────────────
       🔴 `pagador_user_id` NO se deriva: se escribe. *El defecto que S102 curó
       era exactamente éste en la cita — un intento sin pagador declarado
       obliga a adivinar de quién era la plata cuando hay que devolverla.*
       Y `pagador_origen = 'recurrencia'` distingue este cobro de uno que la
       persona hizo con el dedo: **no hubo nadie mirando la pantalla**, y eso
       cambia qué se le puede reclamar y cómo se le avisa. */
    INSERT INTO pagos_intentos (
      recurrencia_id, recurrencia_periodo, monto, moneda, estado, forma,
      proveedor, pagador_user_id, pagador_origen, clave_idempotencia
    ) VALUES (
      v_r.id, v_r.proximo_pedido_fecha, v_total, 'USD', 'iniciado', 'tokenizacion',
      'nuvei', v_r.user_id, 'recurrencia',
      'rec:' || v_r.id::text || ':' || v_r.proximo_pedido_fecha::text
    )
    ON CONFLICT (clave_idempotencia) DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'sujeto', 'recurrencia', 'sujeto_id', v_r.id,

      'recurrencia_id', v_r.id,
      'periodo',        v_r.proximo_pedido_fecha,
      'intento_id',     v_intento,
      'user_id',        v_r.user_id,
      'tarjeta_id',     v_r.tarjeta_id,
      'monto',          v_total,
      'moneda',         'USD',
      'autorizada_en',  v_r.autorizada_en,
      'reintentos',     v_r.reintentos);
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'fecha', v_hoy,
    'para_cobrar', v_listas,
    'frenadas', v_frenadas,
    /* 🔴 LOS DOS NÚMEROS VAN SIEMPRE, incluso en cero. *Un `para_cobrar` vacío
       sin su `frenadas` al lado es indistinguible de «no había nada que
       cobrar» — y son dos hechos muy distintos.* (`L-364`) */
    'cuantas_listas',   jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $function$;

CREATE OR REPLACE FUNCTION public.planes_vencidos_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_s record; v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_oferta record; v_n int; v_total numeric(12,2); v_credito numeric(12,2);
  v_intento uuid; v_listas jsonb := '[]'::jsonb; v_frenadas jsonb := '[]'::jsonb;
  v_masc boolean;
BEGIN
  FOR v_s IN
    SELECT * FROM suscripciones_servicio
     WHERE tipo_servicio = 'paseo_mensual' AND estado = 'activa'
       AND auto_renovar AND periodo_fin <= v_hoy
       AND NOT EXISTS (SELECT 1 FROM pagos_intentos i
                        WHERE i.suscripcion_servicio_id = suscripciones_servicio.id
                          AND i.suscripcion_periodo = suscripciones_servicio.periodo_fin
                          AND i.estado = 'aprobado')
     ORDER BY periodo_fin FOR UPDATE SKIP LOCKED
  LOOP
    /* El fusible del motor de D-657(b): sin mascota activa no se renueva.
       *Se conserva tal cual — no es de este arco y su razón sigue viva.* */
    /* 🔴 EL VALOR SE MIDIÓ, NO SE SUPUSO: `estado_vida` vale **`'activa'`**, no
       `'vivo'`. *Con el literal equivocado este fusible habría frenado TODOS
       los planes con `mascota_no_activa` — un motor apagado que se ve como un
       motor prudente.* Es `L-364` en su forma más cara: el rojo total y prolijo. */
    SELECT (m.estado_vida = 'activa') INTO v_masc FROM mascotas m WHERE m.id = v_s.mascota_id;
    IF NOT COALESCE(v_masc, false) THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'mascota_no_activa');
      CONTINUE;
    END IF;

    SELECT ps.id, ps.precio_mensual_plan INTO v_oferta
      FROM prestador_servicios ps WHERE ps.id = v_s.prestador_servicio_id AND ps.activo;
    IF v_oferta.id IS NULL OR v_oferta.precio_mensual_plan IS NULL THEN
      /* REFORMA S79 ①: sin mensual declarado NO se renueva. *Conservado: el
         plan vence honesto en vez de cobrar un precio inventado.* */
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'plan_no_ofrecido');
      CONTINUE;
    END IF;

    SELECT count(*) INTO v_n
      FROM _fechas_periodo_plan(v_s.periodo_fin, v_s.dias_semana, v_s.frecuencia);
    IF v_n = 0 THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'plan_sin_citas');
      CONTINUE;
    END IF;

    /* EL CRÉDITO POR SOBRANTES SE CALCULA FRESCO — y **NO se suma desde
       metadata**. *El par lo cazó: reembolso 12 donde correspondía 6.* Se
       conserva la nota original porque su razón no cambió. */
    SELECT COALESCE(count(*) * v_s.precio_unitario_efectivo, 0) INTO v_credito
      FROM evento_cita_servicio
     WHERE suscripcion_servicio_id = v_s.id AND estado = 'confirmada' AND fecha >= v_hoy;

    v_total := greatest(round(v_oferta.precio_mensual_plan, 2) - COALESCE(v_credito,0), 0);

    /* 🔴 SI EL CRÉDITO CUBRE EL MES ENTERO NO HAY NADA QUE COBRAR — y eso NO
       es un fallo: es una renovación que se paga sola. Se lista con monto 0
       marcada, para que el ACTO 2 la renueve sin pasar por el proveedor.
       *Mandar un cobro de 0 al proveedor es pedirle que rechace algo que
       nosotros ya sabíamos.* */
    INSERT INTO suscripcion_desglose (suscripcion_servicio_id, periodo, subtotal, impuesto, total, moneda)
    VALUES (v_s.id, v_s.periodo_fin, round(v_oferta.precio_mensual_plan,2), 0,
            greatest(v_total, 0.01), 'USD')
    ON CONFLICT (suscripcion_servicio_id, periodo) DO NOTHING;

    INSERT INTO pagos_intentos (
      suscripcion_servicio_id, suscripcion_periodo, monto, moneda, estado, forma,
      proveedor, pagador_user_id, pagador_origen, clave_idempotencia)
    VALUES (v_s.id, v_s.periodo_fin, greatest(v_total, 0.01), 'USD', 'iniciado',
            'tokenizacion', 'nuvei', v_s.user_id, 'recurrencia',
            'plan:' || v_s.id::text || ':' || v_s.periodo_fin::text)
    ON CONFLICT (clave_idempotencia) DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'sujeto', 'suscripcion_servicio', 'sujeto_id', v_s.id,

      'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'intento_id', v_intento,
      'user_id', v_s.user_id, 'monto', greatest(v_total, 0.01),
      'credito_aplicado', COALESCE(v_credito,0),
      'cubierto_por_credito', (v_total <= 0));
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'fecha', v_hoy,
    'para_cobrar', v_listas, 'frenadas', v_frenadas,
    'cuantas_listas', jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $function$;

-- ── ④ EL SELECTOR DE LA MENSUALIDAD — misma FORMA que sus dos hermanos ─────
/* 🔴 CAMBIA DE TABLA A OBJETO, y no es estética: el lazo itera `para_cobrar` y
   necesita `frenadas` para declarar uno por uno a quién no se le cobró.
   *Un total agregado esconde a quién le pasó.*
   🔴 Y AHORA **CREA EL INTENTO Y CONGELA** —«la base elige y congela»—, que es
   lo que hacen los otros dos. Sin eso el lazo tendría que crearlo, y el intento
   dejaría de ser lo que prueba que se disparó ANTES de disparar. */
/* Cambia de TABLE a jsonb ⇒ DROP antes del CREATE: `CREATE OR REPLACE` sobre
   otro tipo de retorno rebota. */
DROP FUNCTION IF EXISTS public.mensualidades_vencidas_pendientes();
CREATE OR REPLACE FUNCTION public.mensualidades_vencidas_pendientes()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_s record; v_hoy date := public.hoy_local(); v_periodo date;
  v_listas jsonb := '[]'::jsonb; v_frenadas jsonb := '[]'::jsonb;
  v_intento uuid; v_cong jsonb; v_total numeric;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;

  FOR v_s IN
    SELECT * FROM guarderia_suscripciones s
     WHERE s.estado = 'activa'
       /* Sólo RENUEVA: un mandato que nunca cobró arranca por el checkout
          —«pagar es arrancar»—, no por el reloj. */
       AND s.periodo_desde IS NOT NULL AND s.periodo_hasta IS NOT NULL
       AND s.dia_de_cobro IS NOT NULL
       AND s.periodo_hasta < v_hoy
     ORDER BY s.periodo_hasta
  LOOP
    v_periodo := public.proximo_cobro_mensual(v_s.dia_de_cobro, v_s.periodo_desde);

    /* 🔴 EL RIEL DECIDE QUIÉN PUEDE COBRAR POR ACÁ. Un mandato de DeUna se paga
       por LINK, no por token: este lazo no puede cobrarlo y **lo dice** en vez
       de intentarlo. *Frenar con nombre es lo que permite que alguien lo mire;
       frenar en silencio es lo que hizo falta curar acá.* */
    IF COALESCE(v_s.riel,'tarjeta') <> 'tarjeta' THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','riel_no_cobrable_por_token', 'riel', v_s.riel);
      CONTINUE;
    END IF;
    IF v_s.tarjeta_id IS NULL THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','sin_medio_autorizado');
      CONTINUE;
    END IF;

    /* Ya cobrado o en vuelo: no se propone dos veces el mismo período. */
    IF EXISTS (SELECT 1 FROM pagos_intentos i
                WHERE i.guarderia_suscripcion_id = v_s.id
                  AND i.guarderia_suscripcion_periodo = v_periodo
                  AND i.estado IN ('iniciado','pendiente','aprobado')) THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','periodo_ya_en_curso');
      CONTINUE;
    END IF;

    /* 🔴 SE CONGELA ANTES DE PROPONER, y se LEE el veredicto. *El `PERFORM` que
       descartaba este mismo retorno fue el único caso real del censo de
       llamadores de S109-B.* */
    v_cong := public.congelar_desglose_mensualidad_guarderia(v_s.id, v_periodo);
    IF COALESCE((v_cong->>'ok')::boolean, false) IS NOT TRUE THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','desglose_no_congelado', 'causa', v_cong->>'codigo');
      CONTINUE;
    END IF;
    SELECT d.total INTO v_total FROM guarderia_suscripcion_desglose d
     WHERE d.guarderia_suscripcion_id = v_s.id AND d.periodo = v_periodo;

    /* 🔴 EL TECHO DEL MANDATO, otra vez y acá. *Exceder la autorización con la
       plata ya movida obliga a reversar; descubrirlo antes es no cobrar de más.* */
    IF v_total > v_s.monto_esperado THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','monto_excede_mandato', 'total', v_total, 'techo', v_s.monto_esperado);
      CONTINUE;
    END IF;

    INSERT INTO pagos_intentos (
      guarderia_suscripcion_id, guarderia_suscripcion_periodo, monto, moneda,
      estado, forma, proveedor, pagador_user_id, pagador_origen, clave_idempotencia)
    VALUES (v_s.id, v_periodo, v_total, 'USD', 'iniciado', 'tokenizacion', 'nuvei',
            v_s.autorizada_por, 'recurrencia',
            'mensualidad:' || v_s.id::text || ':' || v_periodo::text)
    ON CONFLICT (clave_idempotencia) DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'sujeto','mensualidad_guarderia', 'sujeto_id', v_s.id,
      'periodo', v_periodo, 'intento_id', v_intento,
      'user_id', v_s.autorizada_por, 'tarjeta_id', v_s.tarjeta_id,
      'monto', v_total, 'moneda', 'USD',
      'autorizada_en', v_s.autorizada_en, 'reintentos', 0,
      /* La mensualidad no tiene pedido: su IVA sale del desglose, no de ítems. */
      'pedido_id', NULL);
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'fecha', v_hoy,
    'para_cobrar', v_listas, 'frenadas', v_frenadas,
    'cuantas_listas', jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $fn$;

REVOKE ALL ON FUNCTION public.mensualidades_vencidas_pendientes() FROM anon, authenticated, PUBLIC;

-- ── ⑤ EL TIMBRE DEJA DE NEGARSE — ya tiene consumidor ──────────────────────
/* ☠️ Muere el `selector_sin_consumidor` de `20260905240000`. Nació para que el
   cron no dijera «ejecuté» sobre un sujeto que nadie cobraba; **el cableado le
   sacó la razón de existir.** *Un freno que sobrevive a su propia razón es
   basura que nadie se anima a tocar.* */
CREATE OR REPLACE FUNCTION public.ejecutar_renovaciones_guarderia()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp','net'
AS $fn$
DECLARE v_url text; v_secreto text; v_req bigint; v_sel jsonb;
BEGIN
  IF NOT public.guarderia_recurrente_vivo() THEN
    RETURN jsonb_build_object('ok', true, 'ejecutado', false,
                              'motivo', 'guarderia_recurrente_apagado');
  END IF;

  v_sel := mensualidades_vencidas_pendientes();
  IF COALESCE((v_sel->>'cuantas_listas')::int, 0) = 0 THEN
    /* Se devuelven las frenadas igual: *un «no había nada» que esconde a quién
       se frenó es el mismo silencio, con mejor cara.* */
    RETURN jsonb_build_object('ok', true, 'ejecutado', false,
      'motivo', 'sin_mandatos_para_cobrar', 'frenadas', v_sel->'frenadas');
  END IF;

  SELECT valor INTO v_url FROM app_config WHERE clave = 'url_cobro_recurrente';
  SELECT decrypted_secret INTO v_secreto
    FROM vault.decrypted_secrets WHERE name = 'despacho_secret';
  IF v_url IS NULL OR v_secreto IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'ejecutado', false, 'motivo', 'sin_configurar',
      'falta', CASE WHEN v_url IS NULL THEN 'url_cobro_recurrente' ELSE 'secreto_despacho' END);
  END IF;

  SELECT net.http_post(
           url     := v_url,
           headers := jsonb_build_object('Content-Type','application/json',
                                         'x-despacho-secret', v_secreto),
           body    := '{}'::jsonb,
           timeout_milliseconds := 30000) INTO v_req;

  RETURN jsonb_build_object('ok', true, 'ejecutado', true,
    'mandatos', (v_sel->>'cuantas_listas')::int,
    'frenadas', v_sel->'frenadas', 'request_id', v_req);
END $fn$;

REVOKE ALL ON FUNCTION public.ejecutar_renovaciones_guarderia() FROM anon, authenticated, PUBLIC;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
/* 🔴 EL PELIGRO DE ESTE CINTURÓN, nombrado antes de escribirlo: hoy los tres
   selectores devuelven listas VACÍAS. Un assert sobre los ítems no mediría
   nada — pasaría por ausencia de datos. *Un arnés que se apoya en que no haya
   filas no está midiendo: está mirando.*
   ⇒ Para la mensualidad se FABRICA un mandato vencido y se exige el ítem
   completo. Para los otros dos —cuyo caso vivo cuesta sembrar una compra y un
   plan enteros— se exige la FORMA del objeto **y** que su cuerpo emita los dos
   campos, y **se declara** que su ítem no se ejerció. */
DO $cinturon$
DECLARE
  v_r jsonb; v_it jsonb; v_susc uuid; v_masc uuid; v_n int;
  v_falta text[] := '{}'; v_sel text; v_def text;
BEGIN
  -- ── (a) LOS TRES DEVUELVEN LA MISMA FORMA ────────────────────────────────
  FOREACH v_sel IN ARRAY ARRAY['recurrencias_vencidas_pendientes',
                               'planes_vencidos_pendientes',
                               'mensualidades_vencidas_pendientes'] LOOP
    EXECUTE format('SELECT public.%I()', v_sel) INTO v_r;
    IF v_r->'para_cobrar' IS NULL OR jsonb_typeof(v_r->'para_cobrar') <> 'array'
       OR v_r->'frenadas' IS NULL OR jsonb_typeof(v_r->'frenadas') <> 'array' THEN
      RAISE EXCEPTION 'CINTURON: % no devuelve la forma {para_cobrar, frenadas} · %', v_sel, v_r;
    END IF;
    /* Y su cuerpo tiene que EMITIR los dos campos nuevos. */
    EXECUTE format('SELECT pg_get_functiondef(''public.%I()''::regprocedure)', v_sel) INTO v_def;
    IF position('''sujeto''' IN v_def) = 0 OR position('''sujeto_id''' IN v_def) = 0 THEN
      v_falta := v_falta || v_sel;
    END IF;
  END LOOP;
  IF array_length(v_falta,1) IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON: % no emite sujeto/sujeto_id — el lazo no va a saber '
      'de qué sujeto habla y va a caer al de despensa', v_falta;
  END IF;

  -- ── (b) EL ÍTEM COMPLETO, SOBRE UN CASO FABRICADO ────────────────────────
  SELECT id, mascota_id INTO v_susc, v_masc FROM guarderia_suscripciones
   WHERE estado='activa' AND tarjeta_id IS NOT NULL LIMIT 1;
  IF v_susc IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin mandato con tarjeta con que DISCRIMINAR';
  END IF;

  BEGIN
    /* Se lo pone VENCIDO: un período que terminó ayer. Eso es lo que el
       selector busca, y sin fabricarlo la lista queda vacía y (b) no mide. */
    /* 🔴 EL PERÍODO DE PRUEBA VA LEJOS A PROPÓSITO. El primer intento usó
       `hoy - 40` y el selector lo frenó con `periodo_ya_en_curso` — **con
       razón**: ese mandato ya tiene un cobro aprobado de hoy. *Un arnés que
       elige un período ocupado no mide el camino feliz: mide el freno.*
       Con `hoy - 400` el próximo ancla cae donde no hay ningún intento. */
    UPDATE guarderia_suscripciones
       SET periodo_desde = public.hoy_local() - 400,
           periodo_hasta = public.hoy_local() - 1,
           dia_de_cobro  = 7,
           riel = 'tarjeta'
     WHERE id = v_susc;

    v_r := mensualidades_vencidas_pendientes();
    IF (v_r->>'cuantas_listas')::int < 1 THEN
      RAISE EXCEPTION 'CINTURON: el mandato vencido NO fue propuesto · %', v_r;
    END IF;
    v_it := v_r->'para_cobrar'->0;

    /* Los campos que el lazo usa, uno por uno — *«devolvió algo» no es
       «devolvió lo que el consumidor necesita»*. */
    FOREACH v_sel IN ARRAY ARRAY['sujeto','sujeto_id','periodo','intento_id',
                                 'user_id','tarjeta_id','monto','moneda','autorizada_en'] LOOP
      IF v_it->v_sel IS NULL OR v_it->>v_sel IS NULL THEN
        RAISE EXCEPTION 'CINTURON: el ítem no trae «%» · %', v_sel, v_it;
      END IF;
    END LOOP;
    IF v_it->>'sujeto' <> 'mensualidad_guarderia' THEN
      RAISE EXCEPTION 'CINTURON: el ítem se rotuló % ', v_it->>'sujeto';
    END IF;

    /* 🔴 Y CREÓ EL INTENTO — «la base elige y congela». Sin esto el lazo
       tendría que crearlo, y el intento dejaría de ser lo que prueba que se
       disparó ANTES de disparar. */
    IF NOT EXISTS (SELECT 1 FROM pagos_intentos
                    WHERE id = (v_it->>'intento_id')::uuid
                      AND guarderia_suscripcion_id = v_susc) THEN
      RAISE EXCEPTION 'CINTURON: el selector NO creó el intento';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM guarderia_suscripcion_desglose
                    WHERE guarderia_suscripcion_id = v_susc
                      AND periodo = (v_it->>'periodo')::date) THEN
      RAISE EXCEPTION 'CINTURON: el selector NO congeló el desglose del período';
    END IF;

    /* Y el desglose uniforme lo lee para ESE intento. */
    SELECT count(*) INTO v_n FROM _desglose_congelado_del_intento((v_it->>'intento_id')::uuid);
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'CINTURON: _desglose_congelado_del_intento no resolvió la mensualidad (%)', v_n;
    END IF;

    /* Y la compuerta despacha al de guardería, no cae al fail-closed. */
    v_r := verificar_compuertas_del_intento((v_it->>'intento_id')::uuid);
    IF v_r->>'codigo' = 'sin_compuerta_para_el_sujeto' THEN
      RAISE EXCEPTION 'CINTURON: el despachador NO conoce la mensualidad · %', v_r;
    END IF;

    RAISE EXCEPTION '__DESHACER__';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'CINTURON:%' THEN RAISE; END IF;
    IF SQLERRM <> '__DESHACER__' THEN RAISE; END IF;
  END;

  -- ── (c) EL ENSAYO NO DEJÓ NADA ───────────────────────────────────────────
  SELECT count(*) INTO v_n FROM pagos_intentos
   WHERE clave_idempotencia LIKE 'mensualidad:%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'CINTURON: quedaron % intentos del ensayo', v_n;
  END IF;

  -- ── (d) EL DESPACHADOR ES FAIL-CLOSED con un sujeto sin compuerta ────────
  SELECT id INTO v_susc FROM pagos_intentos WHERE bono_id IS NOT NULL LIMIT 1;
  IF v_susc IS NOT NULL THEN
    v_r := verificar_compuertas_del_intento(v_susc);
    IF (v_r->>'ok')::boolean IS NOT FALSE THEN
      RAISE EXCEPTION 'CINTURON: el despachador APROBÓ un sujeto sin compuerta propia · %', v_r;
    END IF;
  END IF;

  RAISE NOTICE 'CINTURON S109B-D984 OK · los 3 con la misma forma y emitiendo sujeto · ítem completo sobre caso FABRICADO · intento creado y desglose congelado · despachador con su rama y fail-closed · residuo 0';
END $cinturon$;
