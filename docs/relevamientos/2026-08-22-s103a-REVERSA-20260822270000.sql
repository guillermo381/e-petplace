-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260822270000_s103_el_actuador_aprende_los_cuatro_sujetos.sql`
-- Escrita ANTES de aplicar. S103-A · 22-ago-2026.
--
-- 🔴 QUÉ REPONE: **que el cobro recurrente corra y no se aplique.**
--
-- Revertir devuelve el actuador al estado en que un intento con
-- `recurrencia_id` o `suscripcion_servicio_id` rebota en `sujeto_no_aplicable`
-- — ruidoso, correcto, **y sin cobrar**. El reloj sigue tocando el timbre y
-- nadie atiende del otro lado.
--
-- ⚠️ **NO revierte plata.** Lo que ya se haya renovado o pedido queda como
--    está: `renovar_plan_cobrado` y `crear_pedido_de_recurrencia_cobrada`
--    escriben estado de negocio, y esta reversa sólo saca el disparador.
--    *Revertir el gatillo no des-dispara lo disparado.*
--
-- ⇒ **antes de correr esto, medir qué ya se aplicó:**
--      SELECT count(*) FROM pagos_intentos
--       WHERE estado='aprobado' AND (recurrencia_id IS NOT NULL
--                                 OR suscripcion_servicio_id IS NOT NULL);
--    Si es > 0, esto NO es una reversa limpia: hay negocio que siguió su curso.
--
-- ── SOBRE `crear_pedido_despensa` ──────────────────────────────────────────
-- Su parámetro `p_user_id` **NO se retira**, y es deliberado:
--   · es **aditivo con default NULL** ⇒ con él puesto, el camino del cliente se
--     comporta EXACTAMENTE igual (lo prueba el brazo ⑤ del arnés);
--   · retirarlo exigiría DROP + CREATE de una función de 171 líneas que está
--     en el camino de compra vivo, **para sacar algo que no molesta**;
--   · y su guard —un cliente no puede pedir a nombre de otro— es una defensa
--     que no conviene desmontar por prolijidad.
-- *Se declara acá para que quien busque «revertir todo» sepa que esto queda,
--  y por qué, en vez de descubrirlo por su cuenta.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.crear_pedido_de_recurrencia_cobrada(uuid, date);

DO $rev$
DECLARE v_def text; v_ini int; v_fin int; v_nuevo text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'aplicar_evento_de_pago';

  v_ini := position('  -- S103: LOS OTROS DOS SUJETOS' in v_def);
  v_fin := position('  -- S103: EL SUJETO SE VERIFICA' in v_def);
  IF v_ini = 0 OR v_fin = 0 OR v_fin <= v_ini THEN
    RAISE EXCEPTION 'ABORTA: no se hallaron las dos ramas — ¿ya revertida, o el cuerpo cambio?';
  END IF;

  v_nuevo := substring(v_def for v_ini - 1) || substring(v_def from v_fin);
  v_nuevo := replace(v_nuevo, ' v_acto jsonb;', '');
  EXECUTE v_nuevo;

  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'aplicar_evento_de_pago';
  IF position('renovar_plan_cobrado' in v_def) > 0 THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: la rama de suscripcion sigue viva';
  END IF;
  IF position('sujeto_no_aplicable' in v_def) = 0 THEN
    RAISE EXCEPTION 'REVERSA ROTA: se llevo puesto el guard del sujeto';
  END IF;

  RAISE NOTICE 'REVERSA VERDE — el actuador vuelve a rebotar recurrencia y suscripcion. El cobro corre y no se aplica.';
END $rev$;

COMMIT;
