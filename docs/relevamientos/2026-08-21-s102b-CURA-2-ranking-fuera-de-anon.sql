-- ═══════════════════════════════════════════════════════════════════════════
-- S102-B · CURA 2 — `v_ranking_usuarios` FUERA DEL ALCANCE ANÓNIMO
--
-- 🔴 ESTADO: **PREPARADA Y NO APLICADA.** (Mismo criterio de ubicación que la
--    CURA 1: en docs/relevamientos/ no la puede barrer un `db push` sin firma.)
--
-- ORIGEN: relevo 2, punto 4(a) — 🔴 pre-lanzamiento.
-- TERRITORIO: la DB es de A. B redacta, A aplica.
--
-- ── QUÉ SE MIDIÓ (21-ago), y por qué esto es 🔴 y no 🟡 ─────────────────────
--    · `reloptions` = NULL ⇒ SIN security_invoker ⇒ corre como su dueño y
--      **bypassea la RLS de `profiles`**.
--    · `has_table_privilege('anon', …, 'SELECT')` = **true**.
--    · Rojo producido (`SET LOCAL ROLE anon`): **1 fila, con `nombre` poblado.**
--    · Columnas: `user_id, nombre, avatar_url, puntos_*, racha_dias, nivel, …`
--    · **57 de 165 perfiles tienen `profiles.nombre` == el local-part de su
--      correo** (cola del sembrador `handle_new_user`, S81) ⇒ publicar ese campo
--      **no publica un apodo: publica una dirección de correo sin su dominio.**
--    · Hoy expone 1 fila porque `puntos_usuario` casi no tiene filas — el motor
--      de lealtad está muerto (D-314). **El alcance de este defecto es
--      proporcional al éxito del producto.**
--
-- ── DECLARACIÓN 76(g) — VEDA: **NO RIGE.** Es un REVOKE. Cero DDL sobre datos,
--    cero backfill, cero snapshot anclado.
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ⓪ 🔴 EL FRENO QUE ESTA CURA TIENE QUE RESPETAR — L-215                    ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- **Censo de consumidores hecho: en ESTE monorepo son CERO** (grep sobre
-- apps/, packages/, supabase/functions/).
--
-- ⚠️ **NO se censaron los otros cinco repos** (e-petplace-admin, e-petplace-v2,
-- epetplace-web, e-petplace-prestadores, e-petplace-sistema-pruebas).
-- **Ese censo es PARTE de la cura, no de esta migración**, y le toca a quien la
-- aplique. Precedente exacto: D-759/D-760 aparecieron mirando AFUERA del
-- monorepo, y `v_pitch_metrics` sostiene un tablero que nadie de acá lee.
--
-- *Un REVOKE es barato de aplicar y caro de descubrir: rompe en otra pantalla,
--  otro día, sin decir por qué* (L-215).


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ① LA REVERSA — ESCRITA ANTES                                              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- QUÉ DESHACE: devuelve a `anon` el SELECT sobre la vista.
--
-- ⚠️ QUÉ **NO** DESHACE: **revertir REABRE la exposición.** Si alguien la corre,
--    el nombre y el avatar vuelven a ser legibles por cualquiera con la anon key
--    —que viaja en el bundle—. *Se escribe entera igual: una reversa que no
--    existe obliga a improvisar bajo presión.*

/*  ── REVERSA (no ejecutar salvo que rompa un consumidor legítimo) ──
GRANT SELECT ON public.v_ranking_usuarios TO anon;

DO $rev$
BEGIN
  IF NOT has_table_privilege('anon','public.v_ranking_usuarios','SELECT') THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: anon sigue sin SELECT';
  END IF;
  RAISE NOTICE 'REVERSA APLICADA — ⚠️ la exposición está REABIERTA.';
END $rev$;
*/


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ② LA MIGRACIÓN                                                            ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

BEGIN;

-- ── Guard de estado: se firmó sobre lo que se midió ────────────────────────
DO $guard$
BEGIN
  IF to_regclass('public.v_ranking_usuarios') IS NULL THEN
    RAISE EXCEPTION 'ABORTA: la vista no existe. Releer antes de tocar.';
  END IF;
  IF NOT has_table_privilege('anon','public.v_ranking_usuarios','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: anon YA no tiene SELECT. Alguien lo curó antes — no re-aplicar a ciegas.';
  END IF;
END $guard$;

-- ── El REVOKE ──────────────────────────────────────────────────────────────
-- Se revoca TODO, no solo SELECT: la ACL medida daba `arwdDxtm` a anon.
-- (Los de escritura son inertes —la vista no es actualizable— pero un grant
--  inerte que nadie decidió es exactamente lo que S92 vino a barrer.)
REVOKE ALL ON public.v_ranking_usuarios FROM anon;

-- 🔴 L-216 — LA MITAD QUE SE OLVIDA: un REVOKE a `anon` que deja `PUBLIC`
--    intacto NO CIERRA NADA, porque todo rol hereda de PUBLIC.
--    **Medido acá: la ACL de esta vista NO tiene entrada PUBLIC** ⇒ la trampa
--    no aplica en este caso. Se revoca igual por si el default privilege la
--    repone, y el cinturón lo verifica por `has_table_privilege`, JAMÁS
--    parseando `relacl` (el error ② de S91 abortó una migración de seguridad
--    por leer la ACL con LIKE).
REVOKE ALL ON public.v_ranking_usuarios FROM PUBLIC;

-- ── CINTURÓN, con DISCRIMINADOR ────────────────────────────────────────────
DO $cinturon$
BEGIN
  IF has_table_privilege('anon','public.v_ranking_usuarios','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: anon TODAVÍA puede leer la vista.';
  END IF;

  -- EL DISCRIMINADOR: probar que no rompimos a quien SÍ debe leerla.
  -- Sin este brazo, un `REVOKE ... FROM authenticated` accidental daría verde.
  IF NOT has_table_privilege('authenticated','public.v_ranking_usuarios','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: se cerró de más — authenticated perdió el SELECT.';
  END IF;
  IF NOT has_table_privilege('service_role','public.v_ranking_usuarios','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: se cerró de más — service_role perdió el SELECT.';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — anon: SIN acceso · authenticated y service_role: INTACTOS';
END $cinturon$;

COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- ③ 🔴 LA OPCIÓN QUE **NO** SE TOMÓ, Y POR QUÉ — medido, no argumentado
-- ═══════════════════════════════════════════════════════════════════════════
--
-- La cura "obvia" —y la que la casa ya aplicó en S54 a cuatro vistas del
-- motor— sería `ALTER VIEW ... SET (security_invoker = true)`.
--
-- **ACÁ MATARÍA LA VISTA, y se midió antes de descartarla:**
--
--     profiles_select  →  USING (auth.uid() = id)        ← SOLO UNO MISMO
--     pu_own           →  USING (user_id = auth.uid() OR is_admin())
--
-- ⇒ Con `security_invoker = true`, **cada usuario vería exactamente su propia
--    fila.** *Un ranking que solo te muestra a vos no es un ranking: es un
--    espejo.* La vista quedaría técnicamente segura y funcionalmente muerta.
--
-- > **La lección que deja, y vale más que el caso: el patrón correcto para una
-- > clase de defecto puede ser la cura equivocada para un miembro de esa clase.
-- > `security_invoker` cura vistas que NO deberían agregar datos ajenos. Una
-- > vista de RANKING agrega datos ajenos POR DEFINICIÓN — su problema no es de
-- > RLS: es de QUÉ PUBLICA.**
--
-- ── LO QUE QUEDA ABIERTO, con dueño (NO es de esta cura) ────────────────────
--
-- **El ranking, si algún día se muestra, no puede publicar `profiles.nombre`**
-- — porque para 57 de 165 usuarios ese campo ES su correo. Necesita un campo
-- de exhibición propio (apodo, elegido por la persona) y una decisión de
-- producto sobre qué se ve de un tercero.
--   **Dueño: founder** (es producto, no permisos).
--   **Disparo: antes de encender cualquier motor de puntos** (D-314).
