-- ============================================================================
-- S104-A · EL CONSENTIMIENTO DEJA DE SER FALSIFICABLE
-- ============================================================================
-- Reversa: docs/relevamientos/2026-08-23-s104a-REVERSA-consentimiento.sql
-- 76(g): NO RIGE — solo cambia una policy. Cero backfill, cero dato tocado.
--
-- ── EL HALLAZGO, MEDIDO AL IR A ESCRIBIR EL PRIMER CONSENTIMIENTO ─────────
-- `consentimientos_insert` estaba así:
--     roles = {anon, authenticated}   ·   with_check = TRUE
-- ⇒ **cualquiera, incluso sin sesión, podía insertar una fila con el
--    `user_id` de otra persona.**
--
-- Lo que eso rompe no es un permiso: es el PROPÓSITO de la tabla. **P23
-- promete poder demostrar qué aceptó cada quien** — y un registro de
-- consentimiento que cualquiera puede fabricar a nombre de un tercero no
-- demuestra nada, ni a favor ni en contra. *La tabla existía para ser
-- evidencia y aceptaba evidencia falsa.*
--
-- No tenía síntoma porque **el monorepo nunca escribió ahí**: las 59 filas
-- vivas (`tipo='registro'`, `version='v1.0'`, 25-abr → 10-may-2026) son del
-- legado. La puerta estaba abierta y nadie la había cruzado.
--
-- ── LO QUE ESTA CURA **NO** RESUELVE, declarado ───────────────────────────
-- Con `auth.uid() = user_id`, registrar el consentimiento **exige sesión**.
-- Hoy eso alcanza: la verificación de correo está APAGADA (D-299) ⇒ `signUp`
-- devuelve sesión activa y el wrapper escribe en el mismo acto.
-- 🔴 **El día que se encienda la verificación (firma 5.5), `signUp` deja de
-- dar sesión y este INSERT deja de poder correr en el registro.** La cura de
-- ese día NO es reabrir la policy: es una RPC `SECURITY DEFINER` que reciba el
-- `user_id` recién creado y valide contra `auth.users`. Se deja escrito acá
-- para que nadie "arregle" el encendido aflojando la puerta.
-- ============================================================================

begin;

drop policy if exists consentimientos_insert on public.consentimientos;

create policy consentimientos_insert
  on public.consentimientos
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy consentimientos_insert on public.consentimientos is
  'S104-A · El consentimiento solo lo registra su propio sujeto. Antes: '
  'with_check=true para anon y authenticated ⇒ cualquiera podia fabricar '
  'evidencia a nombre de un tercero, y P23 promete lo contrario.';

-- ─────────────────────────────────────────────────────────────────────────
-- CINTURÓN — se prueba LA DEFENSA, no la lista (L-321)
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  v_yo uuid; v_otro uuid; v_ajeno_freno boolean := false; v_propio_pasa boolean := false; v_residuo int := -1;
begin
  select id into v_yo   from public.profiles limit 1;
  select id into v_otro from public.profiles where id <> v_yo limit 1;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_yo, 'role', 'authenticated')::text, true);

  -- ROJO: escribir un consentimiento A NOMBRE DE OTRO ⇒ tiene que rebotar
  begin
    set local role authenticated;
    insert into public.consentimientos (user_id, tipo, aceptado, version)
      values (v_otro, 'registro', true, 'fixture-s104a');
    reset role;
  exception when others then
    reset role; v_ajeno_freno := true;
  end;

  -- CONTRA-CASO: el propio ⇒ tiene que PASAR (si no, rompimos el registro).
  --
  -- 🔴 L-406 APLICADA: este brazo ESCRIBE de verdad sobre una tabla de
  -- evidencia legal, así que corre en **subtransacción que se deshace sola** —
  -- el `raise` de adentro revierte el INSERT y las variables (que son memoria,
  -- no datos) sobreviven para el veredicto. **Residuo 0 POR CONSTRUCCIÓN, no
  -- por limpieza**: `authenticated` no tiene DELETE sobre `consentimientos` —
  -- y está bien que no lo tenga, porque un consentimiento no se borra. *Un
  -- arnés que necesita permiso de borrado para probar algo está pidiendo que
  -- se afloje justo lo que vino a cuidar.*
  begin
    set local role authenticated;
    insert into public.consentimientos (user_id, tipo, aceptado, version)
      values (v_yo, 'registro', true, 'fixture-s104a');
    v_propio_pasa := true;
    raise exception 'FIXTURE_ROLLBACK';
  exception when others then
    reset role;
    if sqlerrm <> 'FIXTURE_ROLLBACK' then v_propio_pasa := false; end if;
  end;

  -- El conteo de residuo también corre como `authenticated`: el rol de sesión
  -- del CLI **no tiene SELECT sobre `consentimientos`** (medido: los grants son
  -- solo INSERT+SELECT para anon/authenticated). *Un instrumento que no puede
  -- leer la tabla que vigila no mide nada — se mide con el rol que puede.*
  begin
    set local role authenticated;
    select count(*) into v_residuo
      from public.consentimientos where version = 'fixture-s104a';
    reset role;
  exception when others then
    reset role; v_residuo := -1;
  end;

  if not v_ajeno_freno then
    raise exception 'CINTURON: se pudo escribir un consentimiento AJENO';
  end if;
  if not v_propio_pasa then
    raise exception 'CINTURON: la cura rompio el consentimiento propio';
  end if;
  if v_residuo <> 0 then
    raise exception 'CINTURON: residuo del fixture = % (0 esperado; -1 = no se pudo medir)', v_residuo;
  end if;

  raise notice 'CINTURON VERDE: ajeno REBOTA, propio PASA, residuo 0 por construccion.';
end $$;

commit;
