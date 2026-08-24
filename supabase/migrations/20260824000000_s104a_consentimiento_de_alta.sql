-- ============================================================================
-- S104-A · D-893 ACTO ② — REGISTRAR EL CONSENTIMIENTO SIN SESIÓN
-- ============================================================================
-- Reversa: docs/relevamientos/2026-08-23-s104a-REVERSA-consentimiento-de-alta.sql
-- 76(g): NO RIGE — una función. Cero backfill.
--
-- ── POR QUÉ EXISTE (firma del founder, 23-ago) ───────────────────────────
-- D-893 pasó de DOS actos a TRES, y éste es el del medio:
--   ① plantilla con código de 8 dígitos   ← hecho y gateado
--   ② esta RPC                            ← acá
--   ③ recién ahí apagar `mailer_autoconfirm`
--
-- **La medición que lo convirtió en condición y no en mejora:** la cuenta
-- `guillo381+test1` (D-896), creada durante la ventana de 18 minutos con
-- `autoconfirm=false`, **quedó con `consentimientos = 0`**. Sin sesión,
-- `auth.uid()` es NULL y la policy `auth.uid() = user_id` no deja entrar el
-- INSERT ⇒ **con autoconfirm apagado, TODO registro nacería sin evidencia**, y
-- **P23 promete poder demostrar qué aceptó cada quien.**
--
-- ── 🔴 LO QUE ESTA RPC **NO** HACE: AFLOJAR LA POLICY ────────────────────
-- La policy de `consentimientos` se cerró HOY porque admitía escritura anónima
-- a nombre de terceros (D-891). **Abrirla para resolver esto sería pagar el
-- problema con el agujero que se acaba de tapar.** Esta función es DEFINER y
-- **agrega un camino angosto y gateado**, no ensancha el existente.
--
-- ── LOS CINCO GATES, y por qué cada uno ──────────────────────────────────
-- Sin `auth.uid()` no hay identidad que preguntar, así que el gate se arma con
-- lo que SOLO puede saber quien acaba de completar el formulario:
--   ① el usuario existe
--   ② **su email coincide** con el que se pasa — quien registró lo tipeó
--   ③ **la cuenta NO está confirmada** — o sea, está justo en el estado de alta
--   ④ **se creó hace menos de 15 minutos** — la ventana del alta, no más
--   ⑤ **todavía no tiene consentimientos** — se usa UNA vez y nunca más
-- *Un atacante necesitaría el uuid Y el correo Y la ventana Y que nadie haya
-- registrado nada. No es `auth.uid()`, y se dice: es lo más angosto que se
-- puede sin sesión.*
--
-- ── ⚠️ Y LA ALTERNATIVA QUE PODRÍA VOLVERLA INNECESARIA, declarada ───────
-- **`verifyOtp` DEVUELVE SESIÓN** — está escrito en la propia casa
-- (`seguridad.ts:312`, para `type:'recovery'`). Si el consentimiento se
-- registrara **justo después de confirmar el código**, habría sesión y bastaría
-- la policy normal, **sin ninguna RPC DEFINER y sin superficie nueva**. El costo
-- de esa vía: el consentimiento queda registrado unos minutos DESPUÉS del
-- momento en que la persona lo dio, y quien nunca confirma no deja rastro —
-- aunque tampoco deja cuenta usable. **Se construye lo firmado y se sirve la
-- alternativa; la mesa decide cuál queda.**
-- ============================================================================

begin;

create or replace function public.registrar_consentimiento_de_alta(
  p_user_id    uuid,
  p_email      text,
  p_documentos jsonb
)
returns int
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_u auth.users;
  v_doc jsonb;
  v_n int := 0;
begin
  select * into v_u from auth.users where id = p_user_id;
  if v_u.id is null then
    raise exception 'usuario_inexistente' using errcode = 'P0002';
  end if;
  if lower(btrim(coalesce(p_email,''))) is distinct from lower(v_u.email) then
    raise exception 'email_no_coincide' using errcode = '42501';
  end if;
  if v_u.email_confirmed_at is not null then
    raise exception 'cuenta_ya_confirmada' using errcode = '42501';
  end if;
  if v_u.created_at < now() - interval '15 minutes' then
    raise exception 'fuera_de_ventana_de_alta' using errcode = '42501';
  end if;
  if exists (select 1 from public.consentimientos c where c.user_id = p_user_id) then
    raise exception 'consentimiento_ya_registrado' using errcode = '23505';
  end if;
  if jsonb_typeof(p_documentos) <> 'array' or jsonb_array_length(p_documentos) = 0 then
    raise exception 'documentos_vacios' using errcode = '22023';
  end if;

  for v_doc in select * from jsonb_array_elements(p_documentos) loop
    insert into public.consentimientos (user_id, tipo, aceptado, version, metadata)
    values (
      p_user_id,
      v_doc->>'documento',
      true,
      v_doc->>'version',
      jsonb_build_object(
        'contexto', 'registro',
        'url', v_doc->>'url',
        'origen', 'app',
        -- Se deja dicho que entró por el camino sin sesión: quien audite tiene
        -- que poder distinguir esta vía de la normal sin adivinar.
        'via', 'alta_sin_sesion',
        'registrado_en', now()
      )
    );
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;

revoke all on function public.registrar_consentimiento_de_alta(uuid, text, jsonb) from public;
-- `anon` SÍ, y es el punto: sin sesión el rol es anon. El gate vive en el
-- CUERPO, no en el grant — que es la única forma cuando no hay `auth.uid()`.
grant execute on function public.registrar_consentimiento_de_alta(uuid, text, jsonb) to anon, authenticated;

do $$
declare v_err text;
begin
  -- Se EJERCE: un usuario inexistente tiene que rebotar HABLADO, no romper.
  begin
    perform public.registrar_consentimiento_de_alta(
      '00000000-0000-0000-0000-000000000000', 'x@y.com', '[]'::jsonb);
    raise exception 'CINTURON: acepto un usuario inexistente';
  exception when sqlstate 'P0002' then null;
            when others then
              get stacked diagnostics v_err = message_text;
              raise exception 'CINTURON: la RPC NO CORRE — %', v_err;
  end;
  raise notice 'CINTURON VERDE: la RPC CORRE y rebota hablado.';
end $$;

commit;
