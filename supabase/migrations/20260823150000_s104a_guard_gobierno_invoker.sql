-- ============================================================================
-- S104-A · D-890 — EL GUARD DE GOBIERNO DE EMPLEADOS VUELVE A FRENAR
-- ============================================================================
-- Reversa: docs/relevamientos/2026-08-23-s104a-REVERSA-guard-gobierno.sql
-- 76(g): NO RIGE — DDL puro. No toca una fila de `prestador_empleados`.
--
-- ── EL AGUJERO, MEDIDO CON DISCRIMINADOR ──────────────────────────────────
-- `_prestador_empleados_protege_gobierno` (D-526, S76) es el guard que impide
-- que un empleado se reactive solo, se escriba `rol='dueño'` o mueva su fila a
-- otro negocio. **Estaba vivo y no frenaba.**
--
-- Es `SECURITY DEFINER` y gatea por `current_user = 'authenticated'`. **En una
-- función DEFINER, `current_user` es el OWNER**, no el rol que la invocó ⇒ la
-- condición nunca se cumple ⇒ el `IF` interno jamás se evalúa.
--
-- **La primera medición no alcanzaba y se dice porque casi induce un error:**
-- un UPDATE que "pasa" prueba poco —la RLS puede cortarlo devolviendo 0 filas—
-- y además este guard tiene una segunda condición
-- (`AND NOT user_gestiona_prestador(...)`), así que probar sobre la fila de un
-- TITULAR habría dado "pasa" **legítimamente**. ⇒ El discriminador correcto es
-- **filas de NO-gestores + `row_count`**: sobre 8 empleados con
-- `user_gestiona_prestador = false`, **los 8 cambiaron su propio `activo` con
-- `row_count = 1`.** *Ocho de ocho, no una sospecha.*
--
-- ── POR QUÉ ESTO NO ES DEUDA (firma del founder, 23-ago) ──────────────────
-- Hay **27 empleados con acceso**. Un guard que no frena no es una deuda con
-- fecha: es un agujero vivo. Sube a la tanda 1.
--
-- ── ¿ES CLASE O ES CASO? — CENSADO, y la respuesta es CASO ────────────────
-- Censo por CUERPO y por NOMBRE de todas las funciones de trigger de `public`:
--   · funciones que gatean por `current_user`: **4** — y **solo ÉSTA es
--     DEFINER**. Las otras tres (`_prestadores_protege_columnas`,
--     `_trg_prestadores_nombre_por_la_puerta`, `_trg_profiles_protege_email`)
--     son INVOKER y frenan bien.
--   · triggers DEFINER que levantan excepción: **16** — los otros 15 **no
--     gatean por identidad de rol**: validan reglas de dominio (composición de
--     acuario, tallas de grooming, orden del programa, frontera de producto…).
--     **Para eso DEFINER es correcto y `current_user` es irrelevante.**
-- ⇒ **DEFINER no es el defecto. El defecto es DEFINER *combinado con* gatear
--    por `current_user`.** Y esa combinación existe en un solo lugar.
--
-- ── EL CENSO DE ESCRITORES, hecho ANTES de cerrar (L-215) ─────────────────
-- Cierra de paso **D-528**, abierto desde S76. Escriben `prestador_empleados`:
-- `aceptar_invitacion_pendiente_login` · `crear_empleado_directo` ·
-- `dar_de_baja_empleado` · `invitar_prestador` — **los cuatro DEFINER**, así
-- que su `current_user` no es 'authenticated' y siguen pasando.
-- Único escritor directo del repo: `empleado-matricula.ts`, que toca
-- `matricula_profesional` y `matricula_pais_emisor` — **columnas que este guard
-- no vigila**. ⇒ cerrar no rompe ningún camino vivo.
--
-- ── L-411 APLICADA: el cinturón de acá NO usa `SET LOCAL ROLE` ────────────
-- Medido dos veces hoy: un cinturón que cambia de rol deja la migración
-- **aplicada y sin registrar** (el CLI pierde permiso sobre
-- `supabase_migrations`). Acá se verifica lo que se puede verificar sin cambiar
-- de rol —**que la función quedó INVOKER**, que es la propiedad que la hace
-- funcionar— y **la prueba de que FRENA se corre aparte**, con no-gestores y
-- `row_count`, que es como se midió el agujero.
-- ============================================================================

begin;

create or replace function public._prestador_empleados_protege_gobierno()
returns trigger
language plpgsql
-- 🔴 INVOKER A PROPÓSITO — es la propiedad que hace que `current_user` sea el
-- rol real de PostgREST. Si alguien vuelve a poner DEFINER acá, el guard se
-- apaga entero y nada falla: ni el CREATE, ni un test, ni el apply. Ver L-410.
set search_path to 'public', 'pg_temp'
as $function$
BEGIN
  IF current_user = 'authenticated'
     -- D-660: la puerta única. El helper incluye titular, administrador y admin.
     AND NOT public.user_gestiona_prestador(OLD.prestador_id)
  THEN
    IF NEW.activo        IS DISTINCT FROM OLD.activo
       OR NEW.rol        IS DISTINCT FROM OLD.rol
       OR NEW.prestador_id IS DISTINCT FROM OLD.prestador_id
    THEN
      RAISE EXCEPTION 'gobierno_protegido' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $function$;

comment on function public._prestador_empleados_protege_gobierno() is
  'S104-A/D-890 · Protege activo, rol y prestador_id. INVOKER a proposito: en '
  'DEFINER, current_user es el owner y el guard NO frena — medido 8 de 8 '
  'no-gestores cambiando su propio activo. Molde: D-389.';

-- ─────────────────────────────────────────────────────────────────────────
-- CINTURÓN (sin cambio de rol — L-411)
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare v_secdef boolean; v_trg int;
begin
  select prosecdef into v_secdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='_prestador_empleados_protege_gobierno';
  if v_secdef is null then
    raise exception 'CINTURON: la funcion no existe';
  end if;
  if v_secdef then
    raise exception 'CINTURON: la funcion quedo DEFINER — el guard no frenaria';
  end if;

  select count(*) into v_trg from pg_trigger
   where not tgisinternal and tgrelid='public.prestador_empleados'::regclass
     and tgname = 'prestador_empleados_protege_gobierno';
  if v_trg <> 1 then
    raise exception 'CINTURON: el trigger no esta enganchado (encontrados %)', v_trg;
  end if;

  raise notice 'CINTURON VERDE: funcion INVOKER y trigger enganchado. La prueba de que FRENA se corre aparte.';
end $$;

commit;
