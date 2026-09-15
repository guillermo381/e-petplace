-- ═══════════════════════════════════════════════════════════════════════════
-- S116-A · `D-1120` — EL MOTOR GANA UNA FUNCIÓN QUE CUENTA
--
-- Hoy el número de la campana sale de `obtenerMisAvisos(100).filter(!leida)`:
-- **se traen hasta 100 avisos enteros para dibujar un número**, y con 101 sin
-- leer el número miente EN SILENCIO. C hizo lo correcto con lo que tenía y
-- declaró el techo en su propio código; lo que una pantalla no puede arreglar
-- es la CORRECTITUD del número (`L-223`: el peaje está en la petición, no en
-- los datos — traer 100 filas no cuesta mucho más que traer una).
--
-- ── 🔴 QUÉ CUENTA, y NO es lo que contaba la huella ────────────────────────
-- **NO LEÍDOS POR AVISO**, que es la semántica que `D-1119` fijó con la firma
-- del founder. `MODELO_NOTIFICACIONES` §② dice que la huella preguntaba otra
-- cosa: *«la campana registra la última visita y la huella pregunta si hay algo
-- posterior a ella… el estado leído POR AVISO no cambia — leído y visto son
-- cosas distintas»*. ⇒ **la huella se apagaba VISITANDO; el número sólo baja
-- LEYENDO.** Por eso esto NO reusa `hay_novedades(app)`: esa RPC seguiría en
-- `true` con todo leído, o en `false` con avisos sin leer si ya se visitó.
--
-- ── ⚠️ POR QUÉ **NO** LLEVA `p_app`, aunque la ficha lo proponía ───────────
-- Medido antes de escribir: **`notificacion_intencion` no tiene columna de
-- app** (sus 15 columnas están en `database.types.ts`; el eje `app` vive sólo
-- en `notificacion_campana_visita`, o sea en la VISITA). Y `obtener_mis_avisos`
-- —el lector que la pantalla ya usa— **tampoco filtra por app**.
-- ⇒ un `p_app` acá no cambiaría ninguna fila: sería **un parámetro inerte que
-- se lee como si filtrara**. *Peor que no estar: el próximo lo pasa y cree que
-- está separando las dos casas.*
-- ⇒ Y la razón fuerte, que es de producto y no de esquema: **el contador tiene
-- que contar EXACTAMENTE lo que la lista muestra.** Si divergen, el badge dice
-- 3 y la pantalla muestra 5 — una mentira nueva en lugar de la vieja. Por eso
-- el `WHERE` es **el mismo, verbatim**, que el de `obtener_mis_avisos`.
--
-- ── EL FILTRO, heredado y no re-decidido ──────────────────────────────────
-- `resuelto_como->>'despacho' = 'para_transporte'` — la firma S88 «la campana
-- es el registro, no el canal». Excluye lo descartado (memorial incluido), lo
-- retenido por el kill switch y lo que está en sombra, **sin nombrar ninguno**.
-- *Se copia tal cual: reescribirlo con otras palabras es cómo dos lectores de
-- la misma cosa empiezan a discrepar.*
--
-- 76(g): **NO RIGE** — DDL puro, cero backfill, cero anclas, cero filas tocadas.
-- L-140: REVOKE de anon/PUBLIC + GRANT explícito, verificado en el cinturón.
-- L-119: firma nueva y única — no hay versión vieja que dejar de sobrecarga.
-- REVERSA: docs/relevamientos/2026-09-15-s116a-REVERSA-contar-avisos-sin-leer.sql
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.contar_avisos_sin_leer()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_n integer;
BEGIN
  /* Se rebota igual que su hermana `obtener_mis_avisos`, y no se devuelve 0:
     **cero y «no puedo leer» son cosas distintas**, y quien las confunde deja
     un contador que dice «no hay nada» cuando lo que pasa es que no hay sesión.
     El wrapper lo traduce a `sin_sesion` y la pantalla decide caer a 0 — esa
     decisión es de la superficie, no del motor. */
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::integer INTO v_n
    FROM notificacion_intencion i
   WHERE i.destinatario_user_id = auth.uid()
     AND i.resuelto_como->>'despacho' = 'para_transporte'
     AND i.estado <> 'leida';

  RETURN v_n;
END
$function$;

REVOKE ALL ON FUNCTION public.contar_avisos_sin_leer() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.contar_avisos_sin_leer() TO authenticated;

-- ── CINTURÓN ──────────────────────────────────────────────────────────────
DO $cint$
DECLARE
  v_acl   aclitem[];
  v_uid   uuid;
  v_antes integer;
  v_despues integer;
  v_lista integer;
  v_id    uuid;
BEGIN
  -- ① L-140: ni anon ni PUBLIC.
  SELECT p.proacl INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'contar_avisos_sin_leer';
  IF EXISTS (SELECT 1 FROM unnest(coalesce(v_acl, '{}'::aclitem[])) a
             WHERE a::text LIKE 'anon=%' OR a::text LIKE '=%') THEN
    RAISE EXCEPTION 'cinturon ①: contar_avisos_sin_leer ejecutable por anon/PUBLIC (L-140)';
  END IF;

  -- ② UNA sola firma (L-119: cero sobrecargas zombis).
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'contar_avisos_sin_leer') <> 1 THEN
    RAISE EXCEPTION 'cinturon ②: hay más de una firma de contar_avisos_sin_leer';
  END IF;

  -- ③ EL DISCRIMINADOR, que es lo único que prueba que cuenta DE VERDAD.
  --    Se elige un destinatario que HOY tenga al menos un aviso sin leer, se
  --    cuenta, se marca uno como leído DENTRO de una subtransacción que se
  --    deshace sola, y se exige que el número BAJE EXACTAMENTE UNO.
  --    *«Devuelve un número» no es una medición: un `count` sobre un WHERE
  --    equivocado también devuelve un número.*
  SELECT i.destinatario_user_id INTO v_uid
    FROM notificacion_intencion i
   WHERE i.resuelto_como->>'despacho' = 'para_transporte'
     AND i.estado <> 'leida'
   GROUP BY i.destinatario_user_id
   ORDER BY count(*) DESC
   LIMIT 1;

  IF v_uid IS NULL THEN
    -- Se DICE, no se pasa por alto: un cinturón que no pudo discriminar no es
    -- un cinturón verde.
    RAISE NOTICE 'cinturon ③ NO CONCLUYENTE: no hay ningún destinatario con avisos sin leer';
  ELSE
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_uid::text, 'role', 'authenticated')::text, true);

    v_antes := public.contar_avisos_sin_leer();

    -- ④ Y que cuente LO MISMO que la lista muestra: si divergen, el badge
    --    miente distinto que antes, que es el defecto que esto vino a curar.
    --    ⚠️ Sólo comparable por debajo del techo del lector: `obtener_mis_avisos`
    --    corta en 200 por su propio `LIMIT`. Por encima, divergir es CORRECTO
    --    —es justo lo que esta función viene a arreglar— y exigir igualdad ahí
    --    sería un rojo falso. *Un brazo que no declara su alcance mide otra cosa.*
    IF v_antes < 200 THEN
      SELECT count(*) INTO v_lista FROM public.obtener_mis_avisos(200) WHERE NOT leida;
      IF v_antes <> v_lista THEN
        RAISE EXCEPTION 'cinturon ④: el contador dice % y la lista muestra % sin leer', v_antes, v_lista;
      END IF;
    ELSE
      v_lista := -1;  -- se dice que no se comparó, en vez de fingir que sí
      RAISE NOTICE 'cinturon ④ FUERA DE ALCANCE: % sin leer pasa el techo de 200 del lector', v_antes;
    END IF;

    SELECT i.id INTO v_id FROM notificacion_intencion i
     WHERE i.destinatario_user_id = v_uid
       AND i.resuelto_como->>'despacho' = 'para_transporte'
       AND i.estado <> 'leida'
     LIMIT 1;

    BEGIN
      UPDATE notificacion_intencion SET estado = 'leida' WHERE id = v_id;
      v_despues := public.contar_avisos_sin_leer();
      /* El sentinel deshace la subtransacción. Lleva un nombre propio y se
         atrapa SÓLO a él: un `RAISE` genérico usado como señal de éxito ya le
         costó a esta casa un borrado en producción (incidente S75). */
      RAISE EXCEPTION 'SONDA_S116A_DESHACER';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM <> 'SONDA_S116A_DESHACER' THEN RAISE; END IF;
    END;

    IF v_despues <> v_antes - 1 THEN
      RAISE EXCEPTION 'cinturon ③: antes=% después=% — marcar uno leído no bajó el contador en uno', v_antes, v_despues;
    END IF;

    -- ⑤ RESIDUO 0: la sonda se deshizo de verdad.
    IF (SELECT estado FROM notificacion_intencion WHERE id = v_id) = 'leida' THEN
      RAISE EXCEPTION 'cinturon ⑤: la sonda dejó residuo — el aviso quedó marcado leído';
    END IF;

    RAISE NOTICE 'cinturon: 5 brazos verdes · sin leer antes=% después=% · lista=%', v_antes, v_despues, v_lista;
  END IF;
END $cint$;

COMMIT;
