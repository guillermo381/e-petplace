-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260826170000_s105d_insertada_o_ya_estaba.sql`
-- ESCRITA ANTES DE APLICAR.
--
-- Restaura `resolver_alta_tarjeta` a su definición VIVA previa, capturada del
-- objeto con `pg_get_functiondef` — no reescrita de memoria.
--
-- 🔴 QUÉ DESHACE Y QUÉ NO:
--   · DESHACE el campo `insertada` del retorno. Nada más: la migración no toca
--     ninguna otra línea de la función, ni una tabla, ni un permiso.
--   · **NO DESHACE NADA DE PLATA.** Es un campo informativo.
--   · 🔴 **ROMPE A QUIEN YA LO CONSUMA.** Si la superficie ya ramifica la voz
--     «Esa tarjeta ya está agregada», al revertir el campo desaparece y esa
--     rama pasa a leer `undefined` — que en JS es *falsy* ⇒ **diría «nueva»
--     sobre una re-carga.** *Revertir esto no vuelve al silencio anterior:
--     vuelve a una afirmación equivocada.*
--     ⇒ ORDEN: **primero se retira el consumo en la app, después esta reversa.**
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.resolver_alta_tarjeta(p_alta_id uuid, p_desenlace text, p_token text DEFAULT NULL::text, p_bin text DEFAULT NULL::text, p_ultimos4 text DEFAULT NULL::text, p_marca text DEFAULT NULL::text, p_titular text DEFAULT NULL::text, p_motivo text DEFAULT NULL::text, p_alias text DEFAULT NULL::text, p_stoken_valido boolean DEFAULT NULL::boolean, p_stoken_detalle text DEFAULT NULL::text, p_expira_mes smallint DEFAULT NULL::smallint, p_expira_anio smallint DEFAULT NULL::smallint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_a public.altas_tarjeta%ROWTYPE; v_t uuid;
BEGIN
  IF p_desenlace NOT IN ('guardada','rechazada','abandonada') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'desenlace_invalido');
  END IF;

  SELECT * INTO v_a FROM public.altas_tarjeta WHERE id = p_alta_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo', 'alta_no_existe'); END IF;

  IF v_a.estado <> 'pendiente' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true,
      'estado', v_a.estado, 'tarjeta_id', v_a.tarjeta_id);
  END IF;

  IF now() > v_a.expira_en THEN
    UPDATE public.altas_tarjeta SET estado='abandonada', cerrada_en=now(), motivo='alta_vencida'
     WHERE id = p_alta_id;
    RETURN jsonb_build_object('ok', false, 'codigo', 'alta_vencida');
  END IF;

  IF p_desenlace = 'guardada' THEN
    IF p_token IS NULL OR btrim(p_token) = '' THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_ausente');
    END IF;

    INSERT INTO public.tarjetas_guardadas
      (user_id, proveedor, token, bin, ultimos4, marca, titular, estado, alias, proveedor_uid,
       -- 🔴 FASE 5: el proveedor manda el vencimiento en el alta y lo estábamos
       --    tirando. Se guarda ACÁ porque es el único momento en que llega.
       expira_mes, expira_anio)
    VALUES
      (v_a.user_id, v_a.proveedor, p_token, p_bin, p_ultimos4, p_marca, p_titular,
       'guardada', NULLIF(btrim(COALESCE(p_alias,'')),''),
       /* 🔴 `D-921`, LA MITAD QUE FALTABA. Acá decía `v_a.id::text` con el
          comentario *«el handle del alta ES el uid ante el proveedor»* — que
          era cierto **hasta esta jornada** y es exactamente el defecto: cada
          alta tokenizaba bajo un uid nuevo ⇒ **una persona, nueve uid**
          (medido en la tabla).

          `crear_alta_tarjeta` ya devuelve el uid ESTABLE desde `20260825190000`
          — pero **nadie lo guardaba acá**. *Curar la puerta de entrada y no
          seguir el camino hasta donde el dato se escribe deja la mitad de una
          cura mirando a la otra.*

          ⚠️ Y su consecuencia era diferida, que es lo que la volvía peligrosa:
          hoy la página manda `alta` (la pieza ② no existe), así que los dos
          coinciden por accidente. **El día que ② salga, el token nace bajo el
          uid estable y nosotros anotaríamos otro ⇒ `card/list` consultaría con
          el uid equivocado y no encontraría la tarjeta.** */
       public.obtener_uid_proveedor(v_a.user_id, v_a.proveedor),
       p_expira_mes, p_expira_anio)
    ON CONFLICT (proveedor, token) DO UPDATE
      SET actualizada_en = now(),
          /* 🔴 EL ESTADO QUE REVIVE **NO ES MUDO** — matiz firmado por el
             founder sobre el UPDATE mudo. El resto se calla a propósito
             *(quien intentó guardar queda con lo que quería, y decirle «ya la
             tenías» le informa de un error que no cometió)*, **pero un cambio
             de estado hacia arriba es información buena**: una tarjeta que
             estaba `rechazada` y ahora el proveedor tokeniza bien **está
             disponible otra vez**, y dejarla `rechazada` la esconde.
             ⚠️ Sólo HACIA ARRIBA: no se degrada una `guardada` — este camino
             sólo corre con `p_desenlace = 'guardada'`. */
          estado = 'guardada',
          motivo_rechazo = NULL,
          alias = COALESCE(NULLIF(btrim(COALESCE(EXCLUDED.alias,'')),''),
                           public.tarjetas_guardadas.alias),
          -- El uid NO se pisa: el token sigue atado al uid con el que nació.
          proveedor_uid = COALESCE(public.tarjetas_guardadas.proveedor_uid, EXCLUDED.proveedor_uid),
          -- El vencimiento se completa si faltaba; una re-presentación no lo borra.
          expira_mes  = COALESCE(EXCLUDED.expira_mes,  public.tarjetas_guardadas.expira_mes),
          expira_anio = COALESCE(EXCLUDED.expira_anio, public.tarjetas_guardadas.expira_anio)
      WHERE public.tarjetas_guardadas.user_id = v_a.user_id
    RETURNING id INTO v_t;

    IF v_t IS NULL THEN
      UPDATE public.altas_tarjeta
         SET estado='rechazada', cerrada_en=now(), motivo='token_de_otro_dueno',
             stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
       WHERE id = p_alta_id;
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_de_otro_dueno');
    END IF;

    UPDATE public.altas_tarjeta
       SET estado='guardada', tarjeta_id=v_t, cerrada_en=now(),
           stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
     WHERE id = p_alta_id;
    RETURN jsonb_build_object('ok', true, 'estado', 'guardada', 'tarjeta_id', v_t);
  END IF;

  UPDATE public.altas_tarjeta
     SET estado=p_desenlace, cerrada_en=now(),
         motivo=COALESCE(NULLIF(btrim(COALESCE(p_motivo,'')),''),
                         'sin_motivo_declarado:'||p_desenlace),
         stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
   WHERE id = p_alta_id;
  RETURN jsonb_build_object('ok', true, 'estado', p_desenlace);
END;
$function$
;

COMMIT;
