-- S87-A · LOTE 1 — EL CALLER QUE MANDABA EL PLACEHOLDER.
-- Dos ocurrencias de 'sistema': una en el COMENTARIO que describe D-103 y
-- otra en el ARGUMENTO. Un replace ciego habría tocado las dos; un assert
-- las distinguió. 76(g): NO RIGE.
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
      'Ya podés operar en e-PetPlace.',
      '/',
      jsonb_build_object('estado_anterior', OLD.estado)
    );

  -- A2: cuenta rechazada
  ELSIF NEW.estado = 'rechazado' THEN
    PERFORM _notificar_dueño_prestador(
      NEW.id,
      'prestador_rechazado',
      'Tu cuenta fue rechazada',
      'Revisá el motivo en tu perfil.',
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
      'Hay observaciones sobre tu cuenta. Revisalas en tu perfil.',
      '/perfil',
      jsonb_build_object('estado_anterior', OLD.estado, 'evento', 'prestador_en_revision')
    );

  -- A6: cuenta suspendida
  ELSIF NEW.estado = 'suspendido' THEN
    PERFORM _notificar_dueño_prestador(
      NEW.id,
      'prestador_suspendido',
      'Tu cuenta fue suspendida',
      'Contactá soporte para más información.',
      '/perfil',
      jsonb_build_object('estado_anterior', OLD.estado)
    );
  END IF;

  RETURN NEW;
END;
$function$

;
REVOKE EXECUTE ON FUNCTION public.trg_prestadores_notif_cambio_estado() FROM PUBLIC, anon;
