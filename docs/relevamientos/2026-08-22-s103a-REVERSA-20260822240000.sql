-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260822240000_s103_el_reloj_del_recurrente.sql`
-- Escrita ANTES de aplicar (regla de la casa). S103-A · 22-ago-2026.
--
-- 🔴 LO QUE ESTA REVERSA **SÍ** DESHACE, y lo que NO — se lee antes de correrla:
--
--   ✅ DESHACE el reloj: el cron `cobrar-recurrencias` desaparece.
--   ✅ DESHACE el texto del aviso: vuelve a prometer «saltar, mover o cancelar».
--
--   ⚠️ NO deshace nada de plata, y no porque sea cuidadosa: **porque no hay
--      plata que deshacer.** El cron que se crea nace INERTE — el timbre
--      `ejecutar_recurrencias_vencidas()` arranca leyendo `recurrente_vivo` y
--      sin esa clave devuelve `recurrente_apagado` sin tocar nada. Al momento
--      de escribir esto la clave NO EXISTE (medido: `app_config` no tiene
--      ninguna de las tres del recurrente).
--
--   🔴 **PERO SI ALGUIEN YA PRENDIÓ LA LLAVE, esta reversa NO alcanza.** Con
--      `recurrente_vivo = true` el cron habrá estado cobrando de verdad, y
--      borrar el cron detiene los cobros FUTUROS sin tocar los ya hechos.
--      *Revertir el reloj no devuelve la plata que el reloj movió.*
--      ⇒ **Antes de correr esto, medir:**
--           SELECT valor FROM app_config WHERE clave='recurrente_vivo';
--           SELECT count(*) FROM recurrencia_desglose;
--        Si la primera dice `true` o la segunda es > 0, esto NO es una reversa
--        limpia: es un APAGADO, y hay que decirlo con esa palabra.
--
--   ⚠️ Y la consecuencia de revertir el TEXTO del aviso: se vuelve a prometer
--      saltar y mover, que **no existen** (medido: sólo hay
--      `alternar_recurrencia` y `configurar_recurrencia`). Revertirlo repone
--      una promesa falsa. Se documenta para que quien lo haga sepa que está
--      reintroduciendo un defecto conocido, y no lo descubra después.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ACTO 1 (inverso) · el reloj se retira ──────────────────────────────────
SELECT cron.unschedule('cobrar-recurrencias')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cobrar-recurrencias');

-- ── ACTO 2 (inverso) · el aviso vuelve a su texto anterior ─────────────────
-- Cuerpo VERBATIM del que estaba vivo antes de la migración, leído con
-- `pg_get_functiondef` el 22-ago-2026. Se pega entero y no se reconstruye de
-- memoria: una reversa que reescribe a ojo no es una reversa (L-141).
CREATE OR REPLACE FUNCTION public.avisar_recurrencias_proximas()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_r record; v_n int := 0;
BEGIN
  FOR v_r IN
    SELECT * FROM pedidos_recurrencias
    WHERE activo
      AND proximo_pedido_fecha - aviso_dias <= current_date
      AND proximo_pedido_fecha >= current_date
      AND (aviso_enviado_para IS DISTINCT FROM proximo_pedido_fecha)
  LOOP
    PERFORM registrar_intencion_notificacion(
      'pedido_recurrente', v_r.user_id, NULL, NULL,
      jsonb_build_object('recurrencia_id', v_r.id,
                         'proximo_pedido_fecha', v_r.proximo_pedido_fecha,
                         'puede', 'saltar, mover o cancelar'),
      'recurrencia:' || v_r.id || ':' || v_r.proximo_pedido_fecha);
    UPDATE pedidos_recurrencias SET aviso_enviado_para = proximo_pedido_fecha
     WHERE id = v_r.id;
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'avisadas', v_n);
END $function$;

-- ── CINTURÓN DE LA REVERSA — que la reversa se pruebe a sí misma ───────────
DO $rev$
DECLARE v_crones int; v_texto text;
BEGIN
  SELECT count(*) INTO v_crones FROM cron.job WHERE jobname = 'cobrar-recurrencias';
  IF v_crones <> 0 THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: el cron `cobrar-recurrencias` sigue vivo';
  END IF;

  SELECT pg_get_functiondef(p.oid) INTO v_texto
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'avisar_recurrencias_proximas';
  IF position('saltar, mover o cancelar' in v_texto) = 0 THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: el aviso no volvio a su texto anterior';
  END IF;

  RAISE NOTICE 'REVERSA VERDE — reloj retirado y aviso restaurado';
END $rev$;

COMMIT;
