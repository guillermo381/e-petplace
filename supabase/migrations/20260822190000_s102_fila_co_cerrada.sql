-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · PASO 4 — LA FILA CO CERRADA CON SU MARCA
--
-- Autoría del cuerpo: **S102-B** (`…-s102b-CURA-1-fila-co-14pct.sql`).
-- **A numera y aplica** — `L-331`: el número se asigna al DEPOSITAR.
-- **La reversa está escrita ANTES y vive en el archivo de origen, bloque ①.**
--
-- Independiente de la cadena 1→2→3: puede ir en cualquier momento.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Guard de identidad: la fila tiene que ser LA que se midió ───────────────
-- Sin esto, un id que cambió de significado se edita en silencio.
DO $guard$
DECLARE v_pct numeric; v_pais text; v_origen text; v_activo boolean; v_hasta timestamptz;
BEGIN
  SELECT (parametros->>'pct')::numeric, country_code, tipo_origen, activo, vigencia_hasta
    INTO v_pct, v_pais, v_origen, v_activo, v_hasta
    FROM public.fee_configs
   WHERE id = '3b75b736-a0c1-4a4a-ba70-a749b08b1554';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ABORTA: la fila CO no existe. Nada que cerrar — releer antes de tocar.';
  END IF;
  IF v_pct IS DISTINCT FROM 14.00 OR v_pais <> 'CO' OR v_origen <> 'pedido'
     OR v_activo IS NOT TRUE OR v_hasta IS NOT NULL THEN
    RAISE EXCEPTION
      'ABORTA: la fila no es la medida el 21-ago (pct=% pais=% origen=% activo=% hasta=%). La firma se dio sobre OTRO estado.',
      v_pct, v_pais, v_origen, v_activo, v_hasta;
  END IF;
END $guard$;

-- ── El cierre: DESACTIVADA CON MARCA, JAMÁS BORRADA ────────────────────────
-- `activo=false` es lo que la saca del resolutor.
-- `vigencia_hasta` deja la historia coherente: rigió hasta hoy.
-- `notas` es la MARCA — el porqué viaja con el dato, no solo en un acta.
/* 🔴 S103-A — LA LÍNEA QUE EL FRENO OBLIGÓ A AGREGAR, con su firma.
   **El primer intento de esta migración ABORTÓ** (22-ago): `chk_fee_pedido_declara_base`
   rebotó el UPDATE con `23514`. La causa no era el CHECK: era una lectura mía de
   `NOT VALID`.

   > **`NOT VALID` no indulta a la FILA: indulta al PASADO.** Exime del escaneo
   > inicial, pero **toda escritura posterior sobre esa fila la vuelve a someter.**

   *Una fila «exenta» deja de estarlo en el momento en que la tocás — y tocarla es
   exactamente lo que esta migración viene a hacer.*

   **La salida, firmada por el founder el 22-ago con el voto de la pista:
   `base: null`.** Las otras dos se descartaron y su razón queda escrita:
     · inventar una base (`total_con_impuesto`) para una fila que estamos CERRANDO
       sería fabricar un dato de plata que nadie decidió;
     · validar el constraint primero es otra tanda y **merece su propia firma**
       (lo dice la propia tanda de S102 en su §⑦).

   **El porqué del founder, al pie de la letra:** *Ecuador es la única operación
   viva, la responsable es la sociedad ecuatoriana desde el 14-ago, y **un número
   colombiano inventado se lee como cierto la próxima vez que alguien lo mire**.*

   > ### **Hueco declarado antes que dato falso** — la misma ley que acaba de regir en las páginas legales.

   `?` mide EXISTENCIA de la clave, no su valor ⇒ `{"base": null}` **satisface el
   CHECK diciendo la verdad: esta fila nunca declaró una base.** */
UPDATE public.fee_configs
   SET activo         = false,
       vigencia_hasta = now(),
       parametros     = parametros || '{"base": null}'::jsonb,
       notas          = 'S102-B (21-ago-2026): CERRADA por firma del founder. '
                     || 'Llevaba el 14 % DEROGADO (S95 firmó 10 % para EC y cerró la fila EC, '
                     || 'y esta quedo abierta) y ademas NO declaraba `base`, exenta del CHECK '
                     || 'chk_fee_pedido_declara_base porque nacio NOT VALID. '
                     || 'Colombia no esta en v1 (MODELO_DESPENSA: USD/Ecuador). '
                     || 'El dia que CO abra, su fee NACE DE CERO con firma propia y base declarada '
                     || '— esta fila NO se reactiva. '
                     || 'S103-A (22-ago-2026): se le agrega `base: null` para poder CERRARLA. '
                     || 'NOT VALID exime al pasado, no a la fila: el UPDATE la vuelve a someter al CHECK. '
                     || 'El null es honesto — nunca declaro una base — y evita inventar un numero de plata. '
                     || 'Firma del founder: hueco declarado antes que dato falso.'
 WHERE id = '3b75b736-a0c1-4a4a-ba70-a749b08b1554';

-- ── CINTURÓN, con DISCRIMINADOR ────────────────────────────────────────────
-- No basta con que CO deje de resolver: hay que probar que EC NO se movió.
-- Un cinturón que solo mira lo que cambió no distingue "cerré CO" de "rompí todo".
DO $cinturon$
DECLARE v_co jsonb; v_ec jsonb; v_n int;
BEGIN
  v_co := public.resolver_comision_despensa('CO', now());
  v_ec := public.resolver_comision_despensa('EC', now());

  IF v_co IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: CO sigue resolviendo un fee: %', v_co::text;
  END IF;

  -- EL DISCRIMINADOR: si esto también fallara, el cinturón de arriba no probaría nada.
  IF (v_ec->>'pct')::numeric IS DISTINCT FROM 10
     OR v_ec->>'base' IS DISTINCT FROM 'total_con_impuesto' THEN
    RAISE EXCEPTION 'ABORTA: EC dejó de resolver 10 %% con base total_con_impuesto: %', v_ec::text;
  END IF;

  -- La marca quedó en el historial: "no borrada" se PRUEBA, no se declara.
  SELECT count(*) INTO v_n FROM public.fee_configs_historial
   WHERE fee_config_id = '3b75b736-a0c1-4a4a-ba70-a749b08b1554';
  IF v_n = 0 THEN
    RAISE EXCEPTION 'ABORTA: el cierre no dejó rastro en fee_configs_historial.';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — CO: NULL · EC: 10 %% base total_con_impuesto · historial: % filas', v_n;
END $cinturon$;

COMMIT;
