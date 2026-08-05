-- ============================================================================
-- S88-A · LOTE D-660 · TANDA ④ter — ACOTAR lo que el gestor puede hacerle a
-- una invitación. **Cazado por el fixture de la propia tanda ④.**
--
-- EL HALLAZGO: `invitaciones_dueño_actualiza` nunca restringió A QUÉ ESTADO se
-- puede mover. Al migrarla al helper, el ADMINISTRADOR heredó la capacidad de
-- marcar una invitación ajena como **`aceptada`** — el par lo midió:
-- `ADMIN_ACEPTA_AJENA = 1`.
--
-- ⚠️ NO LO INTRODUJE YO: el TITULAR ya podía hacerlo. Lo que hizo esta tanda
-- fue **extender un defecto heredado a un actor más**, y eso lo vuelve mío.
-- *Migrar un gate sin mirar qué permite es mudar el agujero a una casa más
-- grande.*
--
-- ALCANCE HONESTO — qué tan grave es: marcar `aceptada` **NO crea el vínculo**.
-- La fila de `prestador_empleados` la crea `empleados_accept_invitation`, que
-- exige `user_id = auth.uid()` y sigue intacta. ⇒ es un ESTADO MENTIROSO, no
-- una suplantación efectiva. **Se cura igual**, porque la ley de la tanda dice
-- que aceptar es de la persona, y un estado que miente hoy es la evidencia
-- falsa de mañana.
--
-- LA CURA: el gestor mueve una invitación a los estados de GESTIÓN —
-- `cancelada` y `expirada`. `aceptada` y `rechazada` son de la PERSONA y
-- viajan solo por `invitaciones_aceptar_self`.
--
-- VEDA 76(g): NO RIGE.
-- ============================================================================

BEGIN;

DROP POLICY invitaciones_dueño_actualiza ON public.empleado_invitaciones;
CREATE POLICY invitaciones_dueño_actualiza ON public.empleado_invitaciones
  FOR UPDATE TO authenticated
  USING (public.user_gestiona_prestador(prestador_id))
  WITH CHECK (
    public.user_gestiona_prestador(prestador_id)
    -- los verbos del GESTOR sobre una invitación: cancelarla o dejarla vencer.
    -- ACEPTAR y RECHAZAR son de quien la recibió.
    AND estado IN ('pendiente','pendiente_aceptacion_login','cancelada','expirada')
  );

DO $$
DECLARE v_n int;
BEGIN
  -- el límite queda EN EL PREDICADO, y se verifica leyéndolo
  SELECT count(*) INTO v_n FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
   WHERE c.relname='empleado_invitaciones' AND p.polname='invitaciones_dueño_actualiza'
     AND pg_get_expr(p.polwithcheck,p.polrelid) ~* 'cancelada'
     AND pg_get_expr(p.polwithcheck,p.polrelid) !~* 'aceptada';
  IF v_n <> 1 THEN RAISE EXCEPTION 'la_policy_no_quedo_acotada'; END IF;
  RAISE NOTICE 'tanda ④ter OK · el gestor cancela; aceptar sigue siendo de la persona';
END $$;

COMMIT;
