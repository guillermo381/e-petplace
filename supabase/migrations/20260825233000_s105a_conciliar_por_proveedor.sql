-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · LA CONCILIACIÓN APRENDE EL RIEL  (corte medido en la sesión con Carlos)
--
-- EL CORTE: el barrido de DeUna llama
--   `pagos_pendientes_de_conciliar({ p_minutos_de_gracia: 10, p_proveedor: 'deuna' })`
-- y **esa firma no existe** — la viva tiene un solo argumento. La dependencia
-- estaba escrita en la cabecera del barrido desde S103 y **la migración nunca
-- se aplicó**. *Una dependencia declarada en un comentario no es una
-- dependencia: es una nota que nadie ejecuta.*
--
-- 🔴 Y NO ALCANZABA CON EL PARÁMETRO — medido sobre el intento real de Carlos:
-- la función devolvía `transaction_id` y nada más. **Nuvei se consulta por su
-- `DF-…`; DeUna se consulta por la `referencia_corta`** (`EPyh9vgbab` en este
-- caso). Devolver una sola columna obligaba a quien llama a adivinar cuál de
-- las dos tiene en la mano — o a volver a la tabla a buscarla.
-- ⇒ la salida gana **`proveedor`** y **`referencia_corta`**: *el barrido tiene
-- que poder saber A QUIÉN le pregunta y CON QUÉ, sin una segunda consulta.*
--
-- 🔴 EL `DROP` NO ES OPCIONAL Y SE PAGÓ HACE MEDIA HORA: `CREATE OR REPLACE`
-- con un argumento más **crea una segunda función**, y con las dos vivas una
-- llamada ambigua devuelve `42725` — que acá tumbaría **también el barrido de
-- Nuvei**, que hoy funciona. Además el `RETURNS TABLE` cambia de forma, y eso
-- por sí solo exige DROP. (`L-119`)
--
-- RETROCOMPATIBLE: `p_proveedor DEFAULT NULL` ⇒ **NULL = todos los rieles**,
-- que es exactamente lo que hacía antes.
--
-- 76(g) — VEDA: **NO RIGE.** DDL puro, sin backfill. El cinturón sólo lee.
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260825233000.sql`
-- ══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.pagos_pendientes_de_conciliar(integer);

CREATE OR REPLACE FUNCTION public.pagos_pendientes_de_conciliar(
  p_minutos_de_gracia integer DEFAULT 10,
  p_proveedor text DEFAULT NULL
)
RETURNS TABLE(
  compra_id uuid,
  transaction_id text,
  monto numeric,
  creado_en timestamp with time zone,
  proveedor text,
  referencia_corta text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  -- Compras que intentaron pagar y no llegaron a `pagada`, con un intento que
  -- YA tiene id de transacción del proveedor: sin ese id no hay a quién
  -- preguntarle, y un intento recién nacido todavía puede estar en vuelo —
  -- de ahí los minutos de gracia.
  SELECT DISTINCT c.id, i.proveedor_transaction_id, c.total, i.creado_en,
         i.proveedor, i.referencia_corta
    FROM compras c
    JOIN pagos_intentos i ON i.compra_id = c.id
   WHERE c.estado IN ('creada','esperando_pago')
     AND i.proveedor_transaction_id IS NOT NULL
     AND i.creado_en < now() - make_interval(mins => p_minutos_de_gracia)
     /* 🔴 EL FILTRO POR RIEL — `NULL` significa TODOS, no «ninguno».
        Es lo que mantiene intacta a toda llamada previa: la de un argumento
        sigue devolviendo exactamente lo mismo que devolvía. */
     AND (p_proveedor IS NULL OR i.proveedor = p_proveedor)
     /* 🔴 Y LOS TERMINALES AFUERA (`D-916`): un intento reversado no es un
        pago pendiente de conciliar — es un pago que ya volvió. Preguntarle al
        proveedor por él sólo puede terminar en confirmarlo de nuevo. */
     AND i.estado NOT IN ('reversado','reverso_fallido')
   ORDER BY i.creado_en;
$function$;

REVOKE ALL ON FUNCTION public.pagos_pendientes_de_conciliar(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pagos_pendientes_de_conciliar(integer, text) TO service_role;


-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — sólo lee. Su brazo importante es el TERCERO: que el riel viejo
-- siga devolviendo exactamente lo que devolvía.
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_sobre int; v_deuna int; v_nuvei int; v_todos int; v_sin_filtro int;
BEGIN
  SELECT count(*) INTO v_sobre FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='pagos_pendientes_de_conciliar';
  IF v_sobre <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN: hay % sobrecargas — con más de una, una llamada ambigua da 42725 y tumba el barrido de Nuvei', v_sobre;
  END IF;

  -- gracia 0 para que el intento recién nacido entre: lo que se mide es el
  -- FILTRO POR RIEL, no el reloj.
  SELECT count(*) INTO v_deuna FROM pagos_pendientes_de_conciliar(0,'deuna');
  SELECT count(*) INTO v_nuvei FROM pagos_pendientes_de_conciliar(0,'nuvei');
  SELECT count(*) INTO v_todos FROM pagos_pendientes_de_conciliar(0, NULL);
  SELECT count(*) INTO v_sin_filtro FROM pagos_pendientes_de_conciliar(0);

  -- ① EL DISCRIMINADOR: el filtro parte de verdad, no devuelve todo siempre
  IF v_deuna + v_nuvei <> v_todos THEN
    RAISE EXCEPTION 'CINTURÓN: los rieles no particionan — deuna=% nuvei=% todos=%',
      v_deuna, v_nuvei, v_todos;
  END IF;

  -- ② DEUNA TIENE CANDIDATOS (era `sin_candidatos`)
  IF v_deuna = 0 THEN
    RAISE EXCEPTION 'CINTURÓN: DeUna sigue sin candidatos con el filtro puesto';
  END IF;

  -- ③ 🔴 EL RIEL VIEJO INTACTO: llamar con un solo argumento == NULL == todos
  IF v_sin_filtro <> v_todos THEN
    RAISE EXCEPTION 'CINTURÓN: la llamada de UN argumento cambió de resultado (% vs %) — la retrocompatibilidad se rompió',
      v_sin_filtro, v_todos;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · sobrecargas=1 · deuna=% · nuvei=% · todos=% · un_argumento=%',
    v_deuna, v_nuvei, v_todos, v_sin_filtro;
END $cint$;
