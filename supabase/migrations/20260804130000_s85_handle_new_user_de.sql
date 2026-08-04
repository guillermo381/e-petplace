-- ============================================================================
-- S85-A · LA SALIDA (d+e) — FIRMA DEL FOUNDER (3-ago-2026)
--
-- > "handle_new_user lee full_name → name → nombre, y si ninguno existe deja el
-- >  nombre en NULL — jamás el local-part del correo."
--
-- ① (e) LEER LAS CLAVES QUE LOS PROVEEDORES SÍ MANDAN.
--    El cuerpo anterior buscaba `raw_user_meta_data->>'nombre'` — UNA CLAVE QUE
--    NADIE MANDA. Google manda `full_name` y `name`. Medido: Satori tenía
--    `full_name = 'Satori Latam'` EN LA MISMA FILA que el trigger estaba
--    leyendo, y aun así cayó al local-part.
--    ⇒ el `coalesce` no era un fallback: era el único camino (forma de L-197).
--
-- ② (d) SIN DATO, `NULL` — JAMÁS EL LOCAL-PART.
--    El argumento de la firma, con su evidencia: *un vacío se nota en la
--    primera pantalla; un slug SE OBEDECE*. El slug sobrevivió en 7 de 7
--    titulares sin que ningún typecheck, lint ni gate lo viera — un `NULL`
--    habría aparecido en la primera superficie que lo pinta.
--    `profiles.nombre` es NULLABLE (medido en `information_schema`), así que
--    esto no necesita DDL.
--
-- ③ BACKFILL DE UNA (1) FILA — Satori, que resuelve SIN PREGUNTAR por el
--    criterio de S81 (su `full_name` de Google).
--
-- ⚠️ LOS OTROS SEIS TITULARES SE DEJAN COMO ESTÁN, **POR DECISIÓN DEL FOUNDER**
--    (literal: "dejalos como están") — son cuentas de prueba suyas.
--    ESTO SE ESCRIBE PARA QUE NADIE LO "ARREGLE" DESPUÉS creyendo que cierra un
--    hueco: `carlosprueba1` · `demo-prestador` · `demo-vet` · `guillo381+vet1` ·
--    `guillo381+vet2` · `guillo381+wizard` quedan con username-como-nombre
--    A PROPÓSITO. No es olvido, no es deuda, no se barre.
--    Y no se podían resolver de otro modo: derivar el nombre de la persona
--    desde `nombre_comercial` sería la salida (a) que la mesa descartó —
--    "Clínica Aurora" no es una persona.
--
-- REGLA 76(g): **RIGE** — hay backfill.
--    ANCLA ÚNICA: profiles.id = '97d163e1-4b08-43cf-8c07-883799d9fdb1'
--    valor previo medido: 'satorilatam' → valor nuevo: 'Satori Latam'
--    El UPDATE lleva su guarda de valor previo: si alguien ya lo cambió, NO
--    pisa (cero filas, y eso es correcto).
--
-- REVERSA: `docs/relevamientos/2026-08-04-s85a-REVERSA-handle-new-user-de.sql`
--    (escrita ANTES de aplicar, con su aviso: revertir REPONE el defecto).
--
-- LO QUE ESTA MIGRACIÓN **NO** RESUELVE, declarado:
--    las 5 superficies que pintan `profiles.nombre` ahora pueden recibir `null`.
--    Los 2 wrappers ya devuelven `?? null` (medido: `familia.ts:87`,
--    `miPerfil.ts:36`), así que el motor está cubierto — LO QUE FALTA ES VOZ, y
--    es de C: *un ausente no se rellena; la superficie dice lo que sabe*.
--    Se cruza con D-637 (la app del prestador no tiene superficie de edición
--    del nombre personal): con `NULL` posible, esa ausencia deja de ser
--    consecuencia aceptada y pasa a ser callejón. Las dos se miran en S86.
-- ============================================================================

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_nombre text;
begin
  -- (e) las claves REALES, en el orden firmado. `nullif(trim(...), '')` para que
  -- una metadata presente pero vacía no gane sobre la siguiente ni se guarde
  -- como cadena vacía — un '' sería el mismo defecto con otra ropa: un valor
  -- que existe, no dice nada, y el consumidor lo trata como nombre.
  v_nombre := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'nombre'), '')
  );

  -- (d) sin dato, NULL. El local-part del correo NO es un nombre.
  insert into public.profiles (id, email, nombre)
  values (new.id, new.email, v_nombre)
  on conflict (id) do nothing;

  return new;
end;
$function$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

-- ③ el backfill de UNA fila, con guarda de valor previo
update public.profiles
   set nombre = 'Satori Latam'
 where id = '97d163e1-4b08-43cf-8c07-883799d9fdb1'
   and nombre = 'satorilatam';
