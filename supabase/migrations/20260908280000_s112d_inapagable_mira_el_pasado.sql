-- ═══════════════════════════════════════════════════════════════════════════
-- EL INAPAGABLE MIRA TAMBIÉN EL PASADO (S112-D)
--
-- Autor: pista D · para: pista A (e-petplace-78) — SIN NÚMERO.
-- Reversa: `…-REVERSA-inapagable-mira-el-pasado.sql`, ESCRITA ANTES.
-- Arnés:   `…-ARNES-inapagable-mira-el-pasado.sql`.
-- 76(g): **NO RIGE** — cero backfill (medido: 0 filas violan hoy).
--
-- ╔═════════════════════════════════════════════════════════════════════════╗
-- ║ POR QUÉ: EL `CHECK` DE A ES CORRECTO Y ES CIEGO AL PASADO.              ║
-- ╚═════════════════════════════════════════════════════════════════════════╝
--
-- `chk_no_apagar_lo_inapagable` es `CHECK (habilitada OR _categoria_es_apagable(
-- categoria))`. Un `CHECK` que llama a una función **se evalúa cuando se escribe
-- LA FILA**, jamás cuando cambia la tabla que la función consulta. Postgres no
-- re-valida filas existentes al cambiar otra tabla, y no hay revalidación
-- automática.
--
-- **Medido, no razonado** (2-sep, arnés adjunto, dentro de un ROLLBACK):
--
--   VERDE A · el CHECK frena apagar `seguridad_cuenta` hoy
--   VERDE B · apagar una categoría apagable entra
--   🔴 ROJO C · la fila vieja SOBREVIVE apagada sobre una categoría que ACABA de
--               pasar a inapagable  (n=1)
--   VERDE D · una fila NUEVA sí la frena ⇒ el CHECK mira el catálogo AL ESCRIBIR
--
-- ⇒ la mitad que falta **no es la del `CHECK`: es la del CATÁLOGO.** El día que
--    una categoría pase a inapagable, las filas que ya la tenían apagada quedan
--    ahí, **y son personas que dejan de recibir un aviso que la casa declaró
--    obligatorio.** Mismo modo de falla que el `CHECK` vino a cerrar, un piso
--    más arriba: *silencioso.*
--
-- ── POR QUÉ FRENA Y NO CORRIGE SOLO ──────────────────────────────────────
-- Podría poner esas filas en `habilitada = true` y seguir. **No lo hace a
-- propósito:** encender una preferencia que una persona apagó es un acto de
-- consentimiento, no una limpieza. *Un trigger que decide por alguien sobre lo
-- que esa persona eligió no está curando un dato: está tomando una decisión que
-- no le toca.* ⇒ **rebota, nombra cuántas filas y dice el `DELETE` exacto** —
-- borrar la fila devuelve a la persona al default de la categoría, que para las
-- tres inapagables de hoy es `true`, y eso es un acto explícito de quien escribe
-- la migración, con su nombre en el commit.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE OR REPLACE FUNCTION public._categorias_inapagable_mira_el_pasado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_n int;
BEGIN
  /* Sólo el cruce que importa: de apagable a INAPAGABLE. El camino inverso
     no puede dejar nada inconsistente. */
  IF COALESCE(NEW.apagable_existencia, true) = false
     AND COALESCE(OLD.apagable_existencia, true) = true THEN

    SELECT count(*) INTO v_n
      FROM public.user_notificacion_prefs p
     WHERE p.categoria = NEW.codigo AND p.habilitada = false;

    IF v_n > 0 THEN
      RAISE EXCEPTION 'inapagable_con_pasado_apagado' USING ERRCODE = '22023',
        DETAIL = format('%s persona(s) tienen "%s" APAGADA y el CHECK no las ve: '
                        'se evalua al escribir la fila, no al cambiar el catalogo.',
                        v_n, NEW.codigo),
        HINT   = format('Decidilo explicito en la misma migracion. Si corresponde '
                        'devolverlas al default de la categoria: '
                        'DELETE FROM public.user_notificacion_prefs WHERE categoria = %L '
                        'AND habilitada = false;  -- y despues volve a correr este UPDATE.',
                        NEW.codigo);
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_categorias_inapagable_mira_el_pasado
  BEFORE UPDATE ON public.cat_notificacion_categorias
  FOR EACH ROW EXECUTE FUNCTION public._categorias_inapagable_mira_el_pasado();

REVOKE ALL ON FUNCTION public._categorias_inapagable_mira_el_pasado() FROM PUBLIC, anon, authenticated;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $$
DECLARE v_n int;
BEGIN
  IF to_regclass('public.user_notificacion_prefs') IS NULL THEN
    RAISE EXCEPTION 'cinturon: no existe la tabla que este trigger protege';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger
                  WHERE tgname = 'trg_categorias_inapagable_mira_el_pasado' AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'cinturon: el trigger no quedo creado';
  END IF;
  /* Control positivo del terreno: hoy no hay nada que curar, así que esta
     migración es aditiva pura. Si alguna vez hay filas, se dice acá. */
  SELECT count(*) INTO v_n
    FROM public.user_notificacion_prefs p
    JOIN public.cat_notificacion_categorias c ON c.codigo = p.categoria
   WHERE p.habilitada = false AND c.apagable_existencia = false;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'cinturon: YA hay % filas apagadas sobre categorias inapagables', v_n;
  END IF;
  RAISE NOTICE 'cinturon inapagable-mira-el-pasado: VERDE (trigger creado, 0 filas violando)';
END $$;

COMMIT;
