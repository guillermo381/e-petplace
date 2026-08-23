-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260822250000_s103_el_actuador_deja_de_adivinar.sql`
-- Escrita ANTES de aplicar. S103-A · 22-ago-2026.
--
-- 🔴 QUÉ REPONE, dicho con todas las letras: **repone LAS DOS FALLAS.**
--
--   ① 🔴 EL MOTOR DE PAGOS QUEDA MUERTO. La migración curó `v_e record` →
--      `v_e webhook_events`; revertirlo devuelve el error
--      `cannot cast type record to webhook_events` en el PRIMER gate del
--      actuador ⇒ **ningún pago se confirma, de ningún proveedor.**
--      *Esta reversa sólo tiene sentido si la cura resultó PEOR que la falla,
--       y es difícil que algo sea peor que esto.*
--
--   ② repone la adivinanza del sujeto.
--
-- La migración cambió un `else` implícito —«si no es cita, ES una compra»— por
-- una verificación —«si no es cita, ¿es una compra? y si no, decilo»—.
-- Revertirla devuelve el actuador al estado en que un evento cuyo sujeto sea
-- una **recurrencia** o una **suscripción de servicio** entra a
-- `confirmar_pago_compra` con un id que no es de compra.
--
-- ⚠️ Eso NO es silencioso: `confirmar_pago_compra` lanza `compra_no_existe`.
--    **Pero el diagnóstico miente sobre el mecanismo** — dice que falta una
--    compra, y la verdad es que eso nunca fue una compra. *El que lo lea va a
--    buscar un pedido perdido.* Con el proveedor reintentando, el error se
--    repite y el sujeto no se mueve nunca.
--
-- ⇒ **Revertir esto solo tiene sentido si la cura resultó estar rota.** Si es
--   por otra razón, lo correcto es arreglar la cura, no reponer la adivinanza.
--
-- ⚠️ Y lo que esta reversa NO PUEDE deshacer: si entre la cura y la reversa
--   un evento fue rechazado con `sujeto_no_aplicable`, esa fila de
--   `webhook_events` queda con ese `resultado` y ese `detalle`. Reponer el
--   código viejo no la re-procesa. *Hay que volver a pedirle el evento al
--   proveedor o pasarlo por el barrido.*
--
-- MÉTODO: se parchea el objeto VIVO por texto y se aborta si el ancla no
-- aparece — jamás se pega un cuerpo reconstruido de memoria (L-141).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $rev$
DECLARE v_def text; v_nuevo text; v_ini int; v_fin int;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'aplicar_evento_de_pago';

  v_ini := position('  -- S103: EL SUJETO SE VERIFICA' in v_def);
  v_fin := position('  v_res := confirmar_pago_compra(' in v_def);
  IF v_ini = 0 OR v_fin = 0 OR v_fin <= v_ini THEN
    RAISE EXCEPTION 'ABORTA: no se hallo el bloque de la cura — ¿ya esta revertida, o el cuerpo cambio?';
  END IF;

  v_nuevo := substring(v_def for v_ini - 1) || substring(v_def from v_fin);
  v_nuevo := replace(v_nuevo, ' v_que_es text;', '');
  -- 🔴 Y la cura ① tambien se repone: el actuador vuelve a REVENTAR en su
  --    primer gate. Esto NO es una reversa cosmetica: deja el motor de pagos
  --    incapaz de confirmar un solo pago, de cualquier proveedor.
  v_nuevo := replace(v_nuevo, 'v_e webhook_events;', 'v_e record;');

  EXECUTE v_nuevo;

  -- El cinturón de la reversa: que el bloque REALMENTE no esté
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'aplicar_evento_de_pago';
  IF position('sujeto_no_aplicable' in v_def) > 0 THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: el guard sigue en el cuerpo';
  END IF;
  IF position('confirmar_pago_compra' in v_def) = 0 THEN
    RAISE EXCEPTION 'REVERSA ROTA: se llevo puesto el camino de la compra';
  END IF;

  RAISE NOTICE 'REVERSA VERDE — el actuador vuelve a asumir compra. La adivinanza esta repuesta.';
END $rev$;

COMMIT;
