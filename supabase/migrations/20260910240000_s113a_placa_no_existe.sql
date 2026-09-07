-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · `estado_de_placa` gana `no_existe` — PARA QUIEN YA SE IDENTIFICÓ
--
-- Hallazgo de C: la app ofrece **activar cualquier cadena**, porque un token
-- inventado y uno libre se veían igual. Eso es cierto y es un defecto de
-- producto — pero la respuesta indistinguible **no era un error**: es lo que
-- evita que se enumeren tokens.
--
-- 🔴 LA DISTINCIÓN QUE RESUELVE LAS DOS: **quién pregunta.**
--   · **sin sesión** —la página pública, `leer_pasaporte`— sigue sin
--     distinguir. Ahí puede preguntar cualquiera, y un `no_existe` convertiría
--     la página en un oráculo de enumeración. **Eso no se toca.**
--   · **con sesión** —esta RPC, que ya exige `auth.uid()`— sí distingue: quien
--     se identificó tiene nombre, tiene límite por sesión, y **enumerar le
--     cuesta su propia cuenta**. *El anonimato es lo que hacía peligrosa la
--     respuesta honesta, no la respuesta.*
--
-- El límite por sesión (30/min) es lo que sostiene esto: sin él, `no_existe`
-- con sesión sería enumerable igual, sólo que con nombre.
--
-- ── ⚠️ Y AL MEDIRLO APARECIÓ QUE LA PÁGINA PÚBLICA **YA DISTINGUE** ────────
-- Medido contra producción: un token libre real devuelve **200** y uno
-- inventado **404**. O sea que el argumento de arriba —«sin sesión no debe
-- distinguir»— *ya no se cumple en la edge*, y lo escribí creyendo que sí.
--
-- **No es explotable, y el número lo dice**: el token tiene 22 caracteres
-- (~2^132). Recorrer el 1 % del espacio a 30 consultas por minuto llevaría
-- ~3·10³⁰ años. *La defensa real nunca fue la indistinguibilidad: es el tamaño
-- del token* — y conviene saberlo, porque una defensa que uno cree tener por
-- una razón equivocada se pierde el día que alguien cambia la razón verdadera.
--
-- 🔴 **DISPARO, escrito para que no se descubra tarde:** el día que el token se
-- acorte —para que entre en una placa más chica, para que se pueda dictar por
-- teléfono— esta asimetría pasa a importar y hay que igualar la página.
-- Ficha: se anota en el parte; no se cura hoy porque hoy no hay nada que curar.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.estado_de_placa(p_token text)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid    uuid := auth.uid();
  v_minuto timestamptz := date_trunc('minute', now());
  v_n      integer;
  v_estado text;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;

  insert into placa_consulta (user_id, minuto) values (v_uid, v_minuto)
  on conflict (user_id, minuto) do update set n = placa_consulta.n + 1
  returning n into v_n;

  if v_n > 30 then
    raise exception 'limite' using errcode = '53400';
  end if;

  select case when pp.mascota_id is null then 'libre' else 'activada' end
    into v_estado
    from pasaporte_placa pp where pp.token = p_token;

  -- 🔴 `no_existe` SÓLO acá. La página pública no lo dice y no debe decirlo.
  return coalesce(v_estado, 'no_existe');
end;
$$;

revoke all on function public.estado_de_placa(text) from public, anon;
grant execute on function public.estado_de_placa(text) to authenticated;

comment on function public.estado_de_placa(text) is
  'S113-A · libre | activada | no_existe, y NADA más — nunca de quién. '
  '`no_existe` sólo CON SESIÓN: sin ella la página pública sigue diciendo '
  'libre, porque ahí puede preguntar cualquiera. Lo que vuelve segura la '
  'respuesta honesta no es la respuesta: es que quien pregunta tiene nombre '
  'y un límite por sesión (30/min).';
