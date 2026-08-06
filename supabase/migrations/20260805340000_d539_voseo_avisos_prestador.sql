-- S88-A · D-539 — EL VOSEO DE LOS AVISOS DEL PRESTADOR
--
-- 76(g) — VEDA: NO RIGE. `CREATE OR REPLACE` de un trigger de notificación.
--
-- ⚠️ EL NÚMERO REAL ES CUATRO, NO SEIS. El reporte de A dijo «las seis inline
--    vosean» y la medición dice otra cosa: las dos de `documento_*` están bien
--    («Tu X fue aprobado» / «Tu X necesita revisión» no llevan verbo en 2ª
--    persona). *Se corrige acá porque un número inflado en un acta es la misma
--    clase de dato falso que este canon caza en el código.*
--
-- Las cuatro, a tuteo neutro (L-148 — la voz de producto no hereda el acento
-- de la mesa):
--    «Ya podés operar»           → «Ya puedes operar»
--    «Revisá el motivo»          → «Revisa el motivo»
--    «Revisalas en tu perfil»    → «Revísalas en tu perfil»   (+ la tilde que faltaba)
--    «Contactá soporte»          → «Contacta a soporte»
--
-- ⚠️ Y LO QUE ESTA MIGRACIÓN **NO** CURA, declarado para que no se lea como
--    cerrado: **estas seis voces viven INLINE y son SOLO ESPAÑOL.** Pasan por
--    `_notificar_dueño_prestador`, un mecanismo distinto de
--    `_voz_notificacion` —que sí resuelve idioma—. **Son DOS mecanismos de voz
--    conviviendo**, y esa es la divergencia que esta casa ya sabe que termina
--    mal. *No se unifica hoy porque cambiar el contrato del wrapper es un lote
--    aparte; se declara en D-539 con su condición.*

BEGIN;
CREATE OR REPLACE FUNCTION public.trg_prestadores_notif_cambio_estado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo actuar si cambió el estado
  IF NEW.estado IS NOT DISTINCT FROM OLD.estado THEN
    RETURN NEW;
  END IF;

  -- A1: cuenta aprobada (a activo desde pendiente o en_revision)
  IF NEW.estado = 'activo' 
     AND OLD.estado IN ('pendiente', 'en_revision') THEN
    PERFORM _notificar_dueño_prestador(
      NEW.id,
      'prestador_aprobado',
      '¡Tu cuenta fue aprobada!',
      'Ya puedes operar en e-PetPlace.',
      '/',
      jsonb_build_object('estado_anterior', OLD.estado)
    );

  -- A2: cuenta rechazada
  ELSIF NEW.estado = 'rechazado' THEN
    PERFORM _notificar_dueño_prestador(
      NEW.id,
      'prestador_rechazado',
      'Tu cuenta fue rechazada',
      'Revisa el motivo en tu perfil.',
      '/perfil',
      jsonb_build_object('estado_anterior', OLD.estado)
    );

  -- A3: cambios pedidos (a en_revision desde pendiente)
  -- D-103 ✅ PAGADA (S87): `prestador_en_revision` existe en
  -- `cat_notificacion_tipos` con su categoría (`operacion`). Se retira la nota
  -- del placeholder — un comentario que describe una deuda pagada miente.
  ELSIF NEW.estado = 'en_revision' 
        AND OLD.estado = 'pendiente' THEN
    PERFORM _notificar_dueño_prestador(
      NEW.id,
      'prestador_en_revision',
      'Necesitamos cambios',
      'Hay observaciones sobre tu cuenta. Revísalas en tu perfil.',
      '/perfil',
      jsonb_build_object('estado_anterior', OLD.estado, 'evento', 'prestador_en_revision')
    );

  -- A6: cuenta suspendida
  ELSIF NEW.estado = 'suspendido' THEN
    PERFORM _notificar_dueño_prestador(
      NEW.id,
      'prestador_suspendido',
      'Tu cuenta fue suspendida',
      'Contacta a soporte para más información.',
      '/perfil',
      jsonb_build_object('estado_anterior', OLD.estado)
    );
  END IF;

  RETURN NEW;
END;
$function$
;

DO $belt$
DECLARE v_def text := pg_get_functiondef('public.trg_prestadores_notif_cambio_estado()'::regprocedure);
BEGIN
  IF v_def ~ '(podés|Revisá|Revisalas|Contactá)' THEN
    RAISE EXCEPTION 'CINTURON: sigue habiendo voseo en los avisos del prestador';
  END IF;
  -- ⚠️ Y el corolario de L-208: verificar que lo NUEVO está no es verificar
  --    que lo VIEJO sigue. Las cuatro voces tienen que seguir existiendo.
  IF v_def NOT LIKE '%prestador_aprobado%' OR v_def NOT LIKE '%prestador_rechazado%'
     OR v_def NOT LIKE '%prestador_en_revision%' OR v_def NOT LIKE '%prestador_suspendido%' THEN
    RAISE EXCEPTION 'CINTURON: se cayó alguno de los cuatro avisos';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: sin voseo, y los cuatro avisos presentes.';
END
$belt$;

COMMIT;
