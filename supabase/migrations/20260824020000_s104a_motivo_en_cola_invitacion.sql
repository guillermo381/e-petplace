-- ============================================================================
-- S104-A · LA COLA DE INVITACIÓN GANA OJOS: `motivo`
-- ============================================================================
-- Reversa: docs/relevamientos/2026-08-24-s104a-REVERSA-motivo-en-cola.sql
-- 76(g): NO RIGE — columna nueva nullable. Cero backfill (la cola está en 0).
--
-- ── POR QUÉ, y lo trajo D con su propio argumento ────────────────────────
-- D iba a cortar el envío cuando el nombre de quien invita estuviera SEMBRADO
-- (el local-part del correo, que `handle_new_user` pone cuando no hay metadata).
-- Su frase: **«un corte que no se puede leer es peor que el correo feo que
-- evita»** — porque `invitacion_correo_pendiente` **no tenía columna de motivo**
-- y ese `fallido` era **indistinguible de un rebote de Resend**.
--
-- Degradó en vez de cortar, y quedó bien. **Pero su corte de SEGUNDO nivel
-- —nombre sembrado Y familia sin nombre— sigue existiendo, y NO es teórico:**
-- medido, **de 16 titulares activos, 2 tienen nombre sembrado, y de esos DOS,
-- UNO tiene su familia sin nombre.** *El caso que su corte describe ya está en
-- la base.*
--
-- ⇒ El argumento de D vale igual para su propio corte, así que la cola gana la
-- columna que lo vuelve legible. **La ceguera era mía: la tabla es de A.**
-- ============================================================================

begin;

alter table public.invitacion_correo_pendiente
  add column if not exists motivo text;

comment on column public.invitacion_correo_pendiente.motivo is
  'S104-A · Por que este envio quedo fallido. Sin esto, «no se pudo componer el '
  'correo» y «el proveedor rebotó» son la misma fila — y solo uno de los dos se '
  'cura escribiendo codigo.';

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='invitacion_correo_pendiente' and column_name='motivo'
  ) then
    raise exception 'CINTURON: la columna motivo no quedo';
  end if;
  raise notice 'CINTURON VERDE: la cola tiene motivo.';
end $$;

commit;
