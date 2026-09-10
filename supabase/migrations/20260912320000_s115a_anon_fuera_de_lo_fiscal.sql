-- S115-A · TANDA 1 — `anon` FUERA DE TODO LO FISCAL
-- Reversa: no se escribe una que devuelva grants a `anon` sobre datos fiscales.
--          Revertir esto es reabrir una puerta que nadie pidió abrir.
-- VEDA 76(g): NO RIGE.
--
-- 🔴 DEFECTO PROPIO, MEDIDO DESPUÉS DE APLICAR — y es `L-140` un piso más abajo.
--    La ley de la casa dice que toda FUNCIÓN nueva nace con EXECUTE para `anon`
--    por los default privileges de Supabase. Lo mismo pasa con las TABLAS, y no
--    estaba escrito: censadas las seis que creó esta tanda,
--      facturas (vista) · fiscal_emisor · fiscal_sequences · pagos_desglose_lineas
--      · tarifas_iva_historial · tax_profiles
--    las SEIS daban `SELECT` **e `INSERT`** a `anon`. Ninguno lo decidí yo.
--    El contraste que lo prueba: `documentos_fiscales` está en false/false —
--    porque HEREDÓ los REVOKE de la `facturas` vieja, no porque yo la cerrara.
--
--    ⚠️ Hoy la RLS las tapa (todas la tienen encendida, y `fiscal_sequences` no
--    tiene NI UNA policy, que es la forma más cerrada). Así que esto **no era una
--    fuga**: era erosión de defensa en profundidad. *Pero el día que alguien
--    agregue una policy permisiva pensando en `authenticated`, el grant de `anon`
--    ya está puesto y nadie lo va a ir a mirar.*

BEGIN;

REVOKE ALL ON public.facturas               FROM anon;
REVOKE ALL ON public.fiscal_emisor          FROM anon;
REVOKE ALL ON public.fiscal_sequences       FROM anon, authenticated;
REVOKE ALL ON public.pagos_desglose_lineas  FROM anon;
REVOKE ALL ON public.tarifas_iva_historial  FROM anon;
REVOKE ALL ON public.tax_profiles           FROM anon;
REVOKE ALL ON public.documentos_fiscales    FROM anon;

/* 🔴 `fiscal_sequences` pierde a `authenticated` TAMBIÉN, y a propósito: el
   contador de la numeración fiscal sólo lo toca `tomar_secuencial_fiscal()`,
   que es DEFINER. *Un cliente que puede leer el último secuencial sabe cuántas
   facturas emitió la casa; uno que puede escribirlo puede agujerear la
   numeración ante el SRI.* */

DO $$
DECLARE r record; v_mal int := 0; v_lista text := '';
BEGIN
  FOR r IN
    SELECT c.relname,
           has_table_privilege('anon', c.oid, 'SELECT') AS s,
           has_table_privilege('anon', c.oid, 'INSERT') AS i
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname='public' AND c.relname IN
       ('facturas','documentos_fiscales','tax_profiles','fiscal_emisor',
        'fiscal_sequences','pagos_desglose_lineas','tarifas_iva_historial')
  LOOP
    IF r.s OR r.i THEN v_mal := v_mal + 1; v_lista := v_lista || ' ' || r.relname; END IF;
  END LOOP;
  IF v_mal > 0 THEN
    RAISE EXCEPTION 'cinturon_anon_fiscal: % objeto(s) siguen alcanzables por anon:%', v_mal, v_lista;
  END IF;

  /* Discriminador: que `authenticated` SIGA pudiendo leer lo suyo. Un REVOKE que
     cierra de más deja la app sin comprobantes y el cinturón no lo notaría. */
  IF NOT has_table_privilege('authenticated','public.tax_profiles','SELECT') THEN
    RAISE EXCEPTION 'cinturon_cerre_de_mas: authenticated perdio tax_profiles';
  END IF;
  IF NOT has_table_privilege('authenticated','public.facturas','SELECT') THEN
    RAISE EXCEPTION 'cinturon_cerre_de_mas: authenticated perdio la vista de compatibilidad';
  END IF;
END $$;

COMMIT;
