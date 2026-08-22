-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL CAMINO VIEJO DEJA DE RENOVAR SIN COBRAR
--
-- 🔴 **LO ENCONTRÓ `P-CIRCUITO` A LOS DIEZ MINUTOS DE NACER**, sobre el frente
--    que se acababa de aplicar. El motor nuevo entero —dos selectores, el
--    renovador, las compuertas, los dos desgloses— quedó vivo **con CERO
--    llamadores**, y `cerrar_y_renovar_planes` **siguió renovando sin cobrar**,
--    con su cron ACTIVO a las 08:00 todos los días.
--
--    *Los cuatro cinturones dieron verde. Los 17 asserts del arnés dieron
--    verde. Y el defecto más grave de la sesión seguía disparando cada mañana.*
--    **Los gates miden la pieza; ninguno puede notar que falta el cable.**
--
-- ── QUÉ HACE ESTA MIGRACIÓN, y qué NO ─────────────────────────────────────
-- **Corta la rama que renueva sin cobrar.** El resto de la función se conserva
-- ENTERO: el aviso de 72 h, la gracia, el crédito por sobrantes, el
-- vencimiento honesto. *Sólo deja de otorgar el mes.*
--
-- ⚠️ **NO enchufa el motor nuevo** — eso pide el cron apuntando al selector y
--    las tres claves de `app_config`, y es tanda propia con su autorización.
--    **Mientras tanto los planes NO se renuevan solos: vencen.** *Es peor
--    servicio y es honesto; lo otro era regalar un mes de paseos.*
--
-- 📌 76(g) — VEDA: **NO RIGE.** `CREATE OR REPLACE` de un cuerpo, cero backfill.
-- ── REVERSA ────────────────────────────────────────────────────────────────
-- Volver el cuerpo anterior. ⚠️ QUÉ NO DESHACE: **reabre el regalo del mes.**
-- ═══════════════════════════════════════════════════════════════════════════

DO $corte$
DECLARE v_def text; v_nuevo text;
BEGIN
  SELECT pg_get_functiondef(to_regprocedure('public.cerrar_y_renovar_planes()')) INTO v_def;

  /* 🔴 SE PARCHEA EL OBJETO VIVO, no se retipea: la función tiene 264 líneas
     con comentarios que valen (la nota del crédito que el par cazó, la de la
     gracia, la de la reforma S79). *Reescribirla de memoria es cómo se perdió
     la voz de `plan_renovado` en S88.* */
  v_nuevo := replace(v_def,
    'IF v_susc.auto_renovar AND v_mascota_activa AND NOT v_gracia_vencida THEN',
    'IF FALSE THEN   -- ☠️ S103: renovar es ahora acto del COBRO, no del reloj'
  );

  IF v_nuevo = v_def THEN
    RAISE EXCEPTION 'ABORTA: no se hallo la condicion de renovacion — el cuerpo cambio';
  END IF;

  EXECUTE v_nuevo;
END $corte$;

DO $cinturon$
DECLARE v_def text; v_limpio text;
BEGIN
  SELECT pg_get_functiondef(to_regprocedure('public.cerrar_y_renovar_planes()')) INTO v_def;
  v_limpio := regexp_replace(regexp_replace(v_def, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g');

  -- (a) La rama que otorgaba el mes está cortada.
  IF position('IF FALSE THEN' IN v_limpio) = 0 THEN
    RAISE EXCEPTION 'ABORTA: la rama sigue viva — el cron seguiria regalando el mes';
  END IF;

  -- (b) 🔴 LO QUE SE CONSERVA, verificado por nombre. *Cortar de más acá
  --     apagaría el aviso de 72 h y la gracia, que son lo bueno de la función.*
  IF position('plan_renovacion_proxima' IN v_limpio) = 0
     OR position('gracia' IN v_limpio) = 0 THEN
    RAISE EXCEPTION 'ABORTA: se corto de mas — se perdio el aviso de 72h o la gracia';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — la rama que regalaba el mes esta cortada · el aviso de 72h y la gracia siguen vivos';
END $cinturon$;
