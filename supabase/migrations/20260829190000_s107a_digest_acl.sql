/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA OTRA MITAD DE L-140 — defecto propio, encontrado al verificar
   ═══════════════════════════════════════════════════════════════════════════

   `20260829180000` cerró el barrido del digest con
   `REVOKE … FROM PUBLIC, anon` **y dejó `authenticated` con EXECUTE.**

   🔴 **Y MI PROPIO CINTURÓN LO CERTIFICÓ EN VERDE**, porque preguntaba
   `proacl ILIKE '%anon=%'` — o sea **verificaba UNA audiencia y yo leí su
   verde como «la función está cerrada».**

   > ### Un cinturón que mira una sola audiencia certifica una sola audiencia.
   > *Es L-216 con otra ropa —«un REVOKE que deja PUBLIC intacto no cierra
   > nada»— y la variante duele más: acá el REVOKE sí hizo algo, así que el
   > verde era **parcialmente** cierto. Un verde parcial se lee igual que uno
   > entero.*

   **La cura no salió de una preferencia: salió del MOLDE, medido.** Las
   cuatro barredoras hermanas —`notificar_recordatorios_cita`,
   `avisar_recurrencias_proximas`, `vigilar_consumo_video`,
   `encolar_fotos_entrega_vencidas`— tienen todas
   `postgres=X · service_role=X` **y ninguna tiene `authenticated`.**
   La mía era la única distinta.

   *Nadie logueado tiene por qué disparar un barrido de servidor: no filtra
   datos —encola avisos legítimos— pero es superficie que nadie decidió.*

   **76(g): NO RIGE.** Un GRANT, cero datos, cero anclas.
   **Reversa:** `docs/relevamientos/S107-A-REVERSA-digest-acl.sql`, que
   declara que correrla REABRE la superficie.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

REVOKE EXECUTE ON FUNCTION public.encolar_resumen_media_guarderia() FROM authenticated;

-- CINTURÓN: la vara es el MOLDE VIVO, no un literal que yo escriba. Si las
-- hermanas cambiaran, este gate cambia con ellas — y si mi función se aparta
-- del molde, aborta. *Comparar contra un valor tipeado a mano habría vuelto a
-- certificar mi propia idea en vez del estado de la casa.*
DO $cint$
DECLARE
  v_mia   text;
  v_molde text;
  v_n     int;
BEGIN
  SELECT array_to_string(proacl,' ') INTO v_mia FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='encolar_resumen_media_guarderia';

  -- el molde: el proacl que comparten las barredoras hermanas
  SELECT array_to_string(proacl,' '), count(*) OVER () INTO v_molde, v_n
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public'
     AND p.proname IN ('notificar_recordatorios_cita','avisar_recurrencias_proximas',
                       'vigilar_consumo_video','encolar_fotos_entrega_vencidas')
   LIMIT 1;

  IF v_n < 4 THEN
    RAISE EXCEPTION 'CINTURON: no encontre las 4 hermanas para sacar el molde (n=%)', v_n;
  END IF;
  IF v_mia ILIKE '%authenticated=%' OR v_mia ILIKE '%anon=%' THEN
    RAISE EXCEPTION 'CINTURON: la funcion sigue abierta a un rol de app (proacl=%)', v_mia;
  END IF;
  IF v_mia IS DISTINCT FROM v_molde THEN
    RAISE EXCEPTION 'CINTURON: mi proacl (%) no coincide con el molde de las hermanas (%)', v_mia, v_molde;
  END IF;

  RAISE NOTICE 'CINTURON VERDE · proacl == molde de las 4 hermanas: %', v_mia;
END
$cint$;

COMMIT;
