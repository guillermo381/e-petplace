-- ============================================================================
-- REVERSA de `20260823140000_s104a_consentimiento_no_falsificable.sql`
-- Escrita ANTES de aplicar. S104-A · 23-ago-2026
-- ============================================================================
--
-- 🔴 LEER ANTES DE CORRER: revertir esto **REABRE la falsificación de
-- consentimientos**. La policy original tenía `with_check = TRUE` y admitía a
-- `anon` ⇒ cualquiera, incluso sin sesión, podía insertar una fila con el
-- `user_id` de otra persona. **P23 promete poder demostrar qué aceptó cada
-- quien; con esa policy, la evidencia es fabricable por un extraño.**
--
-- Si el motivo para revertir es «se encendió la verificación de correo y el
-- registro ya no puede escribir el consentimiento», **ésta NO es la cura**: la
-- cura es una RPC `SECURITY DEFINER` que reciba el `user_id` recién creado y lo
-- valide contra `auth.users`. Aflojar la policy resuelve el síntoma creando el
-- agujero que la migración vino a cerrar.
--
-- Los datos NO se tocan: la migración no escribió ni borró ninguna fila real
-- (su fixture se limpió por marca dentro de la misma transacción).
-- ============================================================================

begin;

drop policy if exists consentimientos_insert on public.consentimientos;

create policy consentimientos_insert
  on public.consentimientos
  for insert
  to anon, authenticated
  with check (true);

commit;
