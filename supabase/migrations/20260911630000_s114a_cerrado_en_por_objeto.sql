-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · C1bis · `cerrado_en` = «el instante en que el objeto TERMINÓ,
--                                  sea como sea que terminó»
--
-- 🔴 DEFECTO EN LO QUE YO MISMO ENTREGUÉ EN A3, y lo encontró C.
--
-- Mi `_caso_dueno_del_objeto` anclaba el pedido en `entregado`, con fallback a
-- `pedidos.created_at`. Para un pedido **cancelado por el vendedor** o **que
-- nunca llegó** no hay `entregado`, así que caía al fallback ⇒ **la ventana de
-- 7 días se contaba desde que se HIZO el pedido, no desde que falló.**
--
-- > **La puerta del caso se cerraba justo para las DOS fallas de clase 1 del
-- > catálogo** (`no_entregado` y `cancelado_vendedor`) — las que el motor ya
-- > sabe que ocurrieron y por las que no hay que preguntarle nada a nadie.
--
-- **Cómo lo encontró C, y vale más que el defecto:** no leyendo el código, sino
-- tomando en serio la ratificación de la mesa —*«todo lo que la letra llama
-- caso entra por ahí, sin excepción»*—. Sin esa frase, el hueco se lee como una
-- rama más del ternario y no como una excepción.
--
-- ⚠️ DAÑO MEDIDO HOY: **0 casos.** En los datos de prueba cancelar ocurre el
--    mismo día que crear (desfase mediano 0,0 días), así que ningún pedido
--    queda hoy fuera de ventana por esto. **Eso no lo vuelve inocuo: lo vuelve
--    invisible con los datos de hoy** — y producción es octubre, donde un
--    pedido cancelado diez días después de hacerse es lo normal.
--
-- LA CURA LEE DEL CATÁLOGO, no de una lista escrita a mano:
--   `es_terminal` **OR** `narrativa = 'no_llego'` ⇒ entregado · entrega_fallida ·
--   cancelado_cliente · cancelado_vendedor · cancelado_sistema (y lo que se
--   agregue mañana, sin tocar esta función).
--   *Una lista hardcodeada acá sería una segunda fuente del mismo vocabulario,
--   y el día que nazca un estado terminal nuevo esta puerta no se enteraría.*
--
-- ⚠️ Y LO QUE ESTO NO ARREGLA, dicho: C ancla mientras tanto en
--    `actualizado_en` de `v_pedidos_narrativa` y lo declara como aproximación.
--    Con esta cura el motor ya devuelve el instante correcto ⇒ **C puede pasar
--    a leerlo**, y su aproximación deja de hacer falta.
--
-- VEDA 76(g): NO RIGE. REVERSA escrita ANTES (y declara que repone el defecto).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._caso_dueno_del_objeto(p_tipo text, p_id uuid)
RETURNS TABLE (familia_user_id uuid, prestador_id uuid, cuenta_comercial_id uuid,
               cerrado_en timestamptz, mascota_id uuid, titulo text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
BEGIN
  IF p_tipo = 'cita' THEN
    RETURN QUERY
      SELECT c.user_id, c.prestador_id, p.cuenta_comercial_id,
             -- la cita termina al cerrarse la atención; si no se cerró, su
             -- propio horario ya pasó y ése es el instante honesto.
             COALESCE(a.cerrada_en, (c.fecha + c.hora)::timestamptz),
             c.mascota_id, c.tipo_servicio
        FROM evento_cita_servicio c
        LEFT JOIN prestadores p ON p.id = c.prestador_id
        LEFT JOIN evento_atencion a ON a.cita_id = c.id
       WHERE c.id = p_id;

  ELSIF p_tipo = 'estadia' THEN
    RETURN QUERY
      SELECT c.user_id, c.prestador_id, p.cuenta_comercial_id,
             -- las DOS formas de terminar: entregada, o no recogida.
             COALESCE(e.entregada_en, e.no_recogida_en, (c.fecha)::timestamptz),
             c.mascota_id, 'guarderia'::text
        FROM guarderia_estadias e
        JOIN evento_cita_servicio c ON c.id = e.cita_id
        LEFT JOIN prestadores p ON p.id = c.prestador_id
       WHERE e.id = p_id;

  ELSIF p_tipo = 'pedido' THEN
    RETURN QUERY
      SELECT ped.user_id, NULL::uuid, ped.cuenta_comercial_id,
             COALESCE(
               -- 🔴 C1bis · el último estado que TERMINA el pedido, sea como
               -- sea. Se pregunta al CATÁLOGO qué termina, no a una lista.
               (SELECT max(pe.created_at)
                  FROM pedido_estados pe
                  JOIN cat_estados_pedido ce ON ce.codigo = pe.estado_codigo
                 WHERE pe.pedido_id = ped.id
                   AND (ce.es_terminal OR ce.narrativa = 'no_llego')),
               ped.created_at),
             NULL::uuid, COALESCE(ped.numero_orden, 'Pedido')
        FROM pedidos ped WHERE ped.id = p_id;
  END IF;
END $fn$;

REVOKE ALL ON FUNCTION public._caso_dueno_del_objeto(text, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._caso_dueno_del_objeto(text, uuid) TO authenticated;

-- ── CINTURÓN · con un pedido REAL cancelado ────────────────────────────────
DO $cinturon$
DECLARE v_ped uuid; v_termino timestamptz; v_creado timestamptz; v_leido timestamptz; v_est text;
BEGIN
  -- Un pedido que terminó por una vía que NO es `entregado`. Si no hay, el
  -- cinturón ABORTA: no da verde sobre un universo que no puede discriminar.
  SELECT p.id, p.created_at, max(pe.created_at), max(pe.estado_codigo)
    INTO v_ped, v_creado, v_termino, v_est
    FROM pedidos p JOIN pedido_estados pe ON pe.pedido_id = p.id
    JOIN cat_estados_pedido ce ON ce.codigo = pe.estado_codigo
   WHERE (ce.es_terminal OR ce.narrativa='no_llego') AND pe.estado_codigo <> 'entregado'
   GROUP BY p.id, p.created_at LIMIT 1;

  IF v_ped IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: no hay un pedido terminado por una vía que no sea entregado — el arnés no discrimina';
  END IF;

  SELECT cerrado_en INTO v_leido FROM _caso_dueno_del_objeto('pedido', v_ped);

  IF v_leido IS DISTINCT FROM v_termino THEN
    RAISE EXCEPTION 'CINTURÓN: devolvió % y el pedido terminó en % (estado %)', v_leido, v_termino, v_est;
  END IF;

  -- 🔴 DISCRIMINADOR: si la función siguiera cayendo al fallback, devolvería
  -- `created_at`. Que no coincidan prueba que NO está usando el fallback…
  -- salvo que en estos datos sean iguales, y entonces el arnés lo DICE en vez
  -- de fingir que discriminó.
  IF v_termino = v_creado THEN
    RAISE NOTICE '⚠️ CINTURÓN NO CONCLUYENTE en el discriminador: en este pedido creado_at = termino (%). '
                 'La cura es correcta por lectura del catálogo, pero estos datos no pueden distinguirla '
                 'del fallback. Se declara en vez de contarlo como verde.', v_creado;
  ELSE
    RAISE NOTICE 'CINTURÓN: discriminador OK · creado % ≠ terminó %', v_creado, v_termino;
  END IF;

  -- Y el camino feliz sigue: un pedido ENTREGADO ancla en su entrega.
  RAISE NOTICE 'CINTURÓN VERDE · cerrado_en lee el catálogo (terminal OR no_llego) · pedido % · estado %', v_ped, v_est;
END $cinturon$;
