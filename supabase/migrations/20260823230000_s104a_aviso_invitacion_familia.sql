-- ============================================================================
-- S104-A · EL AVISO DE LA INVITACIÓN — la puerta que le faltaba al token
-- ============================================================================
-- Reversa: docs/relevamientos/2026-08-23-s104a-REVERSA-aviso-invitacion.sql
-- 76(g): NO RIGE — una fila de catálogo y una función. Cero backfill.
--
-- ── POR QUÉ EXISTE, y lo pidió D ─────────────────────────────────────────
-- La tanda 2 dejó `invitar_a_familia` devolviendo un token **y nada que lo
-- entregue**: la función no llamaba a `registrar_intencion_notificacion`, no
-- había tipo en `cat_notificacion_tipos`, y el token no tenía consumidor.
-- **Motor sin puerta, la lección madre de S101** — en su forma más silenciosa,
-- porque `invitar_a_familia` devolvía `ok` igual.
--
-- ── 🔴 EL LÍMITE QUE NO SE PUEDE SALTAR, MEDIDO ─────────────────────────
-- `registrar_intencion_notificacion(p_tipo, p_destinatario_user_id uuid, …)`
-- **exige un `user_id`**, y `notificacion_intencion.destinatario_user_id`
-- también. **Pero a una invitación se la manda a un CORREO, y el invitado
-- puede no tener cuenta todavía** — que es justamente el caso que la
-- invitación existe para resolver.
--
-- **Se buscó precedente antes de inventar uno, y NO HAY:**
-- `alta_asistida_pendiente_enviar_email` está en el catálogo con `activo=true`
-- **y CERO funciones lo producen.** *El catálogo ya tenía un tipo para «mandarle
-- correo a alguien que quizá no tiene cuenta», y nadie lo disparó nunca.*
--
-- ⇒ **ESTA MIGRACIÓN CIERRA LA MITAD QUE ES INEQUÍVOCA Y DECLARA LA OTRA:**
--   · **Invitado CON cuenta** → intención registrada por el motor, con sus
--     gates, su consentimiento y su techo. Es el camino de la casa.
--   · **Invitado SIN cuenta** → **el motor no puede, y no se lo fuerza.** Queda
--     el **enlace copiable**, que es una de las dos vías que el founder firmó
--     (*«la casa no manda el WhatsApp: da el enlace y la persona lo comparte»*).
--     **Mandarle correo a alguien que nunca dio consentimiento es decisión de
--     mesa con costado legal, no un hueco técnico que A pueda tapar solo.**
--
-- ── NACE EN SOMBRA, POR LA LEY DE SECUENCIA (§0ter) ──────────────────────
-- `en_sombra = true`: la intención se registra y **no se entrega**. El flip es
-- el ÚLTIMO acto, con la plantilla de D escrita y gateada — *y la plantilla va
-- DESPUÉS a propósito: escribirla antes la dejaría inerte y sin poder
-- gatearse.* Push se abrió así y fue el primer canal que la casa abrió entero.
-- ============================================================================

begin;

insert into public.cat_notificacion_tipos
  (codigo, categoria, descripcion, en_sombra, activo, audiencia, canal_forzado, ignora_techo)
values
  ('invitacion_familia', 'operacion',
   'Alguien te invitó a acompañar el cuidado de las mascotas de su familia.',
   true,   -- SOMBRA: nace sin entregar. El flip es del founder, con la plantilla lista.
   true,
   'cliente',
   null,
   -- No ignora el techo: una invitación no es urgente ni transaccional crítica.
   false)
on conflict (codigo) do nothing;

create or replace function public.avisar_invitacion_familia(p_invitacion_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_inv   public.familia_invitaciones;
  v_dest  uuid;
  v_quien text;
begin
  select * into v_inv from public.familia_invitaciones where id = p_invitacion_id;
  if v_inv.id is null then
    raise exception 'invitacion_inexistente' using errcode = 'P0002';
  end if;

  -- ¿El invitado ya tiene cuenta? Es lo único que decide si el motor puede.
  select u.id into v_dest from auth.users u where lower(u.email) = lower(v_inv.email);

  if v_dest is null then
    -- 🔴 NO ES UN FALLO: es el límite declarado. Se devuelve HABLADO para que
    -- el llamador pueda decir la verdad («compartí el enlace») en vez de
    -- prometer un correo que nadie va a mandar.
    return 'sin_cuenta_usar_enlace';
  end if;

  select coalesce(p.nombre, '') into v_quien from public.profiles p where p.id = v_inv.invitado_por;

  perform public.registrar_intencion_notificacion(
    'invitacion_familia',
    v_dest,
    null,
    null,
    jsonb_build_object(
      'familia_id',  v_inv.familia_id,
      'invitado_por_nombre', nullif(v_quien, ''),
      -- El token viaja en los datos porque el enlace lo necesita. Vive en una
      -- fila que solo el motor de despacho lee.
      'token', v_inv.token,
      'expira_en', v_inv.expira_en
    ),
    -- Dedup por invitación: reinvitar no duplica el aviso.
    'invitacion_familia:' || v_inv.id::text
  );

  return 'intencion_registrada';
end;
$$;

revoke all on function public.avisar_invitacion_familia(uuid) from public, anon;
grant execute on function public.avisar_invitacion_familia(uuid) to authenticated;

comment on function public.avisar_invitacion_familia(uuid) is
  'S104-A · La puerta que le faltaba al token de invitar_a_familia. Devuelve '
  'sin_cuenta_usar_enlace cuando el invitado no tiene cuenta: el motor de '
  'notificaciones exige user_id y no se lo fuerza. Nace en SOMBRA (§0ter).';

-- ─────────────────────────────────────────────────────────────────────────
-- CINTURÓN — ejerce la función de verdad (sin SET LOCAL ROLE, L-411)
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare v_fila int; v_res text;
begin
  select count(*) into v_fila from public.cat_notificacion_tipos
   where codigo = 'invitacion_familia' and en_sombra = true;
  if v_fila <> 1 then
    raise exception 'CINTURON: la fila del catalogo no esta en sombra (%)', v_fila;
  end if;

  -- Se EJERCE con un id inexistente: tiene que rebotar HABLADO, no romper.
  -- (El defecto de la tanda 2 fue una RPC que existía y no podía correr.)
  begin
    perform public.avisar_invitacion_familia('00000000-0000-0000-0000-000000000000');
    raise exception 'CINTURON: acepto una invitacion inexistente';
  exception when sqlstate 'P0002' then null;
            when others then
              raise exception 'CINTURON: la funcion NO CORRE — %', sqlerrm;
  end;

  raise notice 'CINTURON VERDE: fila en sombra y la funcion CORRE (rebota hablado).';
end $$;

commit;
