-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260824100000_s104a_cierre_de_cuenta.sql
-- Escrita ANTES de aplicar (regla de la casa). S104-A · TANDA 3.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 LO QUE ESTA REVERSA **NO PUEDE** DESHACER, Y HAY QUE LEERLO ANTES DE CORRERLA
--
-- Esta tanda es distinta de todas las anteriores de la sesión: **su daño no se
-- corrige con una OTA, porque los datos ya no están.** La reversa devuelve el
-- ESQUEMA a su estado previo. NO devuelve:
--
--   ① Los `banned_until` ya aplicados. Quien perdió el acceso NO lo recupera
--      al correr esto — hay que levantarle el ban a mano, uno por uno, y para
--      eso primero hay que saber quiénes son. **Por eso el DROP de la tabla va
--      ÚLTIMO y esta reversa imprime la lista antes de tocar nada.**
--   ② Las sesiones revocadas. Son irrecuperables por diseño; la persona vuelve
--      a entrar, no se le "devuelve" la sesión.
--   ③ Nada de lo que el cron haya ejecutado al día 30 (identidades removidas,
--      correo a tombstone, perfil seudonimizado, objetos de Storage borrados).
--      **Eso es terminal y la letra lo dice: P15 y §19.5.**
--
-- ⇒ **La reversa es segura mientras el cron esté INERTE.** Con la llave
--   `cierre_cuenta_vivo` encendida y ticks ejecutados, revertir el esquema
--   deja huérfano el rastro de lo que ya pasó. *No es que la reversa rompa
--   algo: es que borra el único registro de a quién se le hizo qué.*
--
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── PASO 0 · LA LISTA, ANTES DE PERDERLA ──────────────────────────────────
-- Se imprime a propósito: es la única fuente de quién quedó baneado por este
-- mecanismo. Copiarla ANTES de seguir.
do $$
declare r record; n int := 0;
begin
  raise notice '── cierres registrados (copiar antes del DROP) ──';
  for r in
    select c.user_id, c.estado, c.solicitado_en, c.programado_para, c.ejecutado_en,
           u.banned_until
    from public.cierre_cuenta c
    left join auth.users u on u.id = c.user_id
    order by c.solicitado_en
  loop
    n := n + 1;
    raise notice '  % · % · solicitado % · programado % · ejecutado % · ban %',
      r.user_id, r.estado, r.solicitado_en, r.programado_para, r.ejecutado_en, r.banned_until;
  end loop;
  if n = 0 then
    raise notice '  (ninguno — reversa limpia)';
  else
    raise warning '⚠️  % cierre(s) registrados. Sus bans NO se levantan con esta reversa.', n;
  end if;
end $$;

-- ── PASO 1 · el cron ──────────────────────────────────────────────────────
select cron.unschedule('cierre-cuenta-tick')
where exists (select 1 from cron.job where jobname = 'cierre-cuenta-tick');

-- ── PASO 2 · las funciones ────────────────────────────────────────────────
drop function if exists public.ejecutar_cierres_vencidos();
drop function if exists public.revertir_cierre_cuenta(uuid, text);
drop function if exists public.solicitar_cierre_cuenta();
drop function if exists public.exportar_mis_datos();
drop function if exists public._cierre_requiere_camino_asistido(uuid);

-- ── PASO 3 · las tablas ───────────────────────────────────────────────────
drop table if exists public.exportacion_datos;
drop table if exists public.cierre_cuenta;

-- ── PASO 4 · la llave ─────────────────────────────────────────────────────
-- Se borra la clave, no el valor: si alguien la volvió a crear con otro valor,
-- esto lo saca igual y el mecanismo queda apagado por AUSENCIA, que es el
-- estado en que nació.
delete from public.app_config where clave in ('cierre_cuenta_vivo', 'exportacion_datos_viva');

commit;

-- ── VERIFICACIÓN DE LA REVERSA ────────────────────────────────────────────
-- Corre DESPUÉS del commit. Los cinco tienen que dar 0.
--
--   select
--     (select count(*) from pg_tables where tablename in ('cierre_cuenta','exportacion_datos'))          as tablas,
--     (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--       where n.nspname='public' and p.proname in
--         ('solicitar_cierre_cuenta','exportar_mis_datos','revertir_cierre_cuenta',
--          'ejecutar_cierres_vencidos','_cierre_requiere_camino_asistido'))                              as funciones,
--     (select count(*) from cron.job where jobname='cierre-cuenta-tick')                                 as cron,
--     (select count(*) from public.app_config where clave like 'cierre_cuenta%')                         as llaves,
--     (select count(*) from auth.users where banned_until is not null)                                   as bans_vivos;
--
-- ⚠️ `bans_vivos` NO tiene por qué dar 0 y por eso está en la lista: si da >0,
--    esta reversa dejó gente sin acceso y hay que levantarlos a mano con la
--    lista del PASO 0. **Un cero ahí es una verificación; un número es una
--    tarea pendiente, y es mejor verla que suponerla.**
