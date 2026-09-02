-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de LA PURGA QUE CLASIFICA EN VEZ DE ENUMERAR (S112-D)
--
-- ⚠️ ESCRITA ANTES QUE LA MIGRACIÓN. Se lee entera antes de correrla.
--
-- 🔴 LO QUE NO DESHACE: **las filas ya anonimizadas no vuelven.** La purga
--    escribe `solicitante_user_id = NULL` y eso es irreversible por diseño —
--    es un borrado de identidad, no un estado. Revertir esta migración
--    devuelve la FUNCIÓN vieja, jamás los datos que la nueva haya purgado.
--
-- ⚠️ Y LO QUE REVERTIR SIGNIFICA, dicho sin rodeos: **volver a la versión que
--    omite en silencio.** Si para entonces el estado `desistida` ya existe,
--    esta reversa deja corriendo un job que **no purga las postulaciones
--    desistidas y no lo dice** — que es exactamente el defecto que la
--    migración vino a matar. *Revertir acá no es volver a un estado neutro:
--    es volver a uno que incumple una firma del founder en silencio.*
--
-- Autor: pista D (S112) · para: pista A (e-petplace-78)
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public._adopcion_estados_declarados();

-- El cuerpo VIVO al 2-sep-2026, embebido porque esta reversa es su única
-- fuente una vez que la migración lo reemplace.
CREATE OR REPLACE FUNCTION public.purgar_postulaciones_vencidas()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $REVERSA$

DECLARE v_r record; v_n int := 0; v_msgs int := 0; v_k int;
BEGIN
  FOR v_r IN
    SELECT s.id, s.solicitante_user_id
      FROM public.adopcion_solicitud s
     /* 🔴 `declinada` Y NADA MÁS. **La concretada (`aceptada`) NUNCA se toca**:
        es el respaldo de una adopción que ocurrió. Y las vivas (`recibida`,
        `en_conversacion`) tampoco: no hay plazo que haya empezado a correr. */
     WHERE s.estado = 'declinada'
       AND s.cerrada_en IS NOT NULL
       AND s.cerrada_en <= now() - interval '90 days'
       /* 🔑 LA IDEMPOTENCIA. La segunda corrida no la ve. */
       AND s.anonimizada_en IS NULL
  LOOP
    /* 🔴 EL ORDEN NO ES ESTILO: primero los mensajes, después la solicitud.
       Al revés, `solicitante_user_id` ya sería NULL y **no habría con qué
       saber cuáles mensajes eran suyos** — los del refugio se anonimizarían
       también, o ninguno. */
    UPDATE public.adopcion_mensaje
       SET autor_user_id = NULL
     WHERE solicitud_id = v_r.id
       AND autor_user_id = v_r.solicitante_user_id;
    GET DIAGNOSTICS v_k = ROW_COUNT;
    v_msgs := v_msgs + v_k;

    /* El hilo NO se borra: queda entero y anónimo. Append-only intacto —
       ninguna fila de `adopcion_mensaje` desaparece acá. */
    UPDATE public.adopcion_solicitud
       SET solicitante_user_id = NULL, anonimizada_en = now()
     WHERE id = v_r.id;
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'anonimizadas', v_n, 'mensajes_anonimizados', v_msgs);
END 
$REVERSA$;

REVOKE ALL ON FUNCTION public.purgar_postulaciones_vencidas() FROM PUBLIC, anon, authenticated;

COMMIT;
