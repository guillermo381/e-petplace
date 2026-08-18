-- ═══════════════════════════════════════════════════════════════════════════
-- S100d-A · `v_dashboard_logistico` DEJA DE SALTAR LA RLS
-- Firma del founder, 18-ago-2026, sobre el censo `2026-08-18-s100d-CENSO-RLS.md`
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── EL DEFECTO, MEDIDO POR CAMINO REAL (no inferido de los grants) ─────────
-- La vista no declara `security_invoker` ⇒ se ejecuta con los privilegios de su
-- DUEÑO (`postgres`) y **la RLS de las tablas de abajo no se evalúa**. Y `anon`
-- tiene `SELECT` sobre ella.
--
-- Rojo producido el 18-ago-2026 con la anon key —que **viaja pública en cada
-- bundle, por diseño**—:
--
--     GET /rest/v1/v_dashboard_logistico?select=*&limit=1   →  HTTP 200 · 1 fila
--
-- La vista une `envios` + `pedidos` + `profiles` y devuelve **`cliente_nombre`
-- y `cliente_email`**. ⇒ cualquiera con la llave pública leía nombres y correos
-- de clientes reales.
--
-- EL CONTRA-CASO que lo vuelve sólido (misma llave, mismas condiciones):
--     pedidos  → HTTP 401      familias → HTTP 404      mascotas → 200 · 0 filas
-- ⇒ la llave se comporta bien contra TABLAS y no contra esta vista. La
-- diferencia no está en la llave: está en el `security_invoker` que falta.
--
-- ── POR QUÉ ÉSTA SOLA Y HOY ───────────────────────────────────────────────
-- El censo halló **once** vistas con la misma forma. Diez van por lote, después
-- de censar sus consumidores (el admin y `/inversores` viven FUERA de este
-- monorepo y varias las alimentan). **Ésta se adelanta porque es la única con
-- datos personales**, y la firma lo dice con todas las letras: *«un tablero
-- externo en blanco se arregla en horas; emails de clientes expuestos no se
-- des-exponen»*.
--
-- ⚠️ CONSECUENCIA ACEPTADA Y DECLARADA, no un efecto no previsto: S95 midió que
-- **el portal admin usa la credencial `anon` sobre esta MISMA base**. Si ese
-- tablero consume esta vista, **se va a quedar en blanco**. Está firmado.
--
-- ── VEDA 76(g): NO RIGE ───────────────────────────────────────────────────
-- Es DDL sobre una vista. Cero backfill, cero filas tocadas, cero anclas.
--
-- ── REVERSA ───────────────────────────────────────────────────────────────
-- Escrita ANTES de aplicar, en
-- `docs/relevamientos/2026-08-18-s100d-REVERSA-vista-logistica.sql`, y declara
-- que **revertirla REABRE la exposición de nombres y correos**.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER VIEW public.v_dashboard_logistico SET (security_invoker = true);

-- ═══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN — la migración se aborta a sí misma si no logró lo que dice
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_invoker text;
BEGIN
  SELECT option_value INTO v_invoker
    FROM pg_class c, pg_options_to_table(c.reloptions)
   WHERE c.oid = 'public.v_dashboard_logistico'::regclass
     AND option_name = 'security_invoker';

  IF v_invoker IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION
      'CINTURÓN: v_dashboard_logistico sigue sin security_invoker (valor: %) — la vista seguiría saltando la RLS',
      coalesce(v_invoker, 'ausente');
  END IF;

  -- El discriminador: que la opción esté puesta no prueba que la vista siga
  -- existiendo y siendo consultable. Si el ALTER hubiera roto la vista, esto
  -- lanza acá adentro y no en la cara del primer usuario.
  PERFORM 1 FROM public.v_dashboard_logistico LIMIT 1;
END
$cinturon$;
