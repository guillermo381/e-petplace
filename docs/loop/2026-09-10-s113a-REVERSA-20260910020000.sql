-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260910020000_s113a_citas_y_hoy.sql        (ESCRITA ANTES)
--
-- ── QUÉ DESHACE ────────────────────────────────────────────────────────────
-- Borra `obtener_citas_de_mascota` y `obtener_hoy_mascota`, y devuelve el
-- CHECK de `avisos_coach.tipo` a sus cuatro valores.
--
-- 🔴 QUÉ **NO** DESHACE, y por eso el orden importa:
-- ① Las filas `tipo='tip_del_dia'` que ya nacieron **NO se borran acá**: son
--    registro de lo que se le mostró a una familia. *Un aviso es una foto de lo
--    que se dijo; borrarlo no lo des-dice, sólo borra la prueba.* Pero el CHECK
--    nuevo las RECHAZA ⇒ si quedan filas de ese tipo, el `alter` falla y la
--    reversa aborta ENTERA. Es a propósito: obliga a decidir a mano qué se hace
--    con ellas en vez de perderlas en silencio.
--    Para revertir de verdad, primero:
--        delete from avisos_coach where tipo = 'tip_del_dia';   -- decisión humana
-- ② El wrapper de `packages/api` sigue nombrando las dos funciones: revertir la
--    base sin revertir el bundle deja la sección rota hasta el próximo OTA.
-- ═══════════════════════════════════════════════════════════════════════════

drop function if exists public.obtener_hoy_mascota(uuid);
drop function if exists public.obtener_citas_de_mascota(uuid);

alter table public.avisos_coach drop constraint if exists avisos_coach_tipo_check;
alter table public.avisos_coach add constraint avisos_coach_tipo_check
  check (tipo = any (array['vacuna_vence','antiparasitario_vence','cita_manana','anticipacion']));

select 'reversa 20260910020000 · las filas tip_del_dia se deciden a mano' as nota;
