-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL MAPEO DE RIELES, AHORA CON FUENTE · Y EL ESQUEMA A 1.1.0
--
-- 🔴 ESTA TABLA NACIÓ VACÍA A PROPÓSITO y se llena ahora por la única razón
--    que la justificaba: **apareció una fuente**. La orden del founder en la
--    tanda anterior fue literal — *«no lo completes por parecido con estas
--    facturas»*— porque lo que había era inferencia desde tres comprobantes
--    ajenos. Hoy la lista sale de la documentación del proveedor que va a
--    emitir (01/15/16/17/18/19/20/21, tabla 24 del SRI) y de su verificación
--    por el founder. *Una tabla de datos no se llena con lo plausible: se
--    llena cuando alguien puede decir de dónde salió cada fila.*
--
-- ⚠️ `saldo` NO ENTRA, y su ausencia es la decisión: el saldo e-PetPlace no es
--    un riel financiero — es un pasivo del ledger del hogar que se compensa.
--    Su código del SRI es entre `15` (compensación de deudas) y `01` (sin
--    utilización del sistema financiero), y eso es **criterio fiscal, no
--    lectura de catálogo**. Hasta que el contador lo diga, un pago con saldo
--    rebota `forma_pago_sin_codigo_sri` y no se emite. *Elegir uno de los dos
--    por parecido es exactamente lo que esta tabla existe para no volver a
--    hacer.*
--
-- EDGES A DESPLEGAR CON ESTA MIGRACIÓN (`L-536`): ninguna — es dato puro.
-- Veda 76(g): NO RIGE. Reversa: S115-A-REVERSA-20260912630000-*.sql
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.cat_forma_pago_sri (country_code, medio, codigo_sri, nombre, activo, fuente_codigo)
VALUES
  ('EC', 'credito', '19', 'Tarjeta de crédito',                         true,
   'doc Factuplan (app.factuplan.com.ec/docs/api) + tabla 24 SRI · verificado founder 10-sep-2026'),
  ('EC', 'debito',  '16', 'Tarjeta de débito',                          true,
   'doc Factuplan (app.factuplan.com.ec/docs/api) + tabla 24 SRI · verificado founder 10-sep-2026'),
  ('EC', 'deuna',   '20', 'Otros con utilización del sistema financiero', true,
   'doc Factuplan (app.factuplan.com.ec/docs/api) + tabla 24 SRI · verificado founder 10-sep-2026')
ON CONFLICT (country_code, medio) DO UPDATE
  SET codigo_sri = EXCLUDED.codigo_sri,
      nombre     = EXCLUDED.nombre,
      activo     = EXCLUDED.activo,
      fuente_codigo = EXCLUDED.fuente_codigo;

-- ── EL ESQUEMA, COMO DATO ───────────────────────────────────────────────────
-- 1.1.0 es la versión que el proveedor tiene habilitada hoy; la 2.1.0 la
-- habilitan a pedido. Es un dato de la fila, así que cambiarla mañana es un
-- UPDATE y no un despliegue.
--
-- ⚠️ Y EL ALCANCE, MEDIDO, PORQUE NO ES EL QUE PARECE: en el modo con el que
--    arrancamos (`POST /developer/invoices`) **el XML lo arma el proveedor y
--    este valor NO VIAJA** — no hay campo donde ponerlo. Sólo manda en
--    `sign-and-authorize`, donde el XML es nuestro. *Se deja correcto igual:
--    un dato que hoy no se lee y mañana decide el esquema de nuestro propio
--    XML es exactamente el que nadie va a acordarse de cambiar el día que
--    empiece a leerse.*
UPDATE public.fiscal_emisor SET version_esquema = '1.1.0';

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_n int; v_v text; v_saldo int;
BEGIN
  SELECT count(*) INTO v_n FROM public.cat_forma_pago_sri
   WHERE country_code='EC' AND activo AND fuente_codigo IS NOT NULL;
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'cinturon: se esperaban 3 rieles con fuente, hay %', v_n;
  END IF;

  /* 🔴 EL ROJO: `saldo` NO resuelve, y tiene que seguir sin resolver. */
  SELECT count(*) INTO v_saldo FROM public.cat_forma_pago_sri
   WHERE country_code='EC' AND medio='saldo' AND activo;
  IF v_saldo <> 0 THEN
    RAISE EXCEPTION 'cinturon: `saldo` tiene codigo y no debe tenerlo hasta que lo diga el contador';
  END IF;

  SELECT version_esquema INTO v_v FROM public.fiscal_emisor;
  IF v_v <> '1.1.0' THEN RAISE EXCEPTION 'cinturon: version_esquema quedo en %', v_v; END IF;

  RAISE NOTICE 'cinturon formapago: 3 rieles con fuente · saldo sin codigo · esquema 1.1.0';
END $cint$;
