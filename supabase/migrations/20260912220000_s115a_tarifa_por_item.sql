-- S115-A · TANDA 1 (d) — LA TARIFA ES DATO POR ÍTEM
-- Letra: MODELO_FISCAL v0.3 §4 (regla 1) · v0.4 E3 (vet en DISPUTA, no sólo pendiente).
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912220000-tarifa-por-item.sql
-- VEDA 76(g): NO RIGE.
--
-- 🔴 DOS COSAS QUE EL OBJETO DIJO DISTINTO A LA LETRA:
--
--   ① La letra pide crear `cat_tarifas_iva` (codigo, porcentaje, vigente_desde,
--      vigente_hasta). **Eso YA EXISTE y se llama `cat_tasas_impuesto`** — mismas
--      cuatro columnas con otros nombres, 4 filas vivas (EC_IVA_0/15, CO_IVA_0/19)
--      y **DOS FKs apuntándole** (`producto_variantes`, `pedido_items`). Crear la
--      tabla nueva al lado sería el drift exacto que esta tanda vino a cerrar ⇒ se
--      REUSA. Lo que le faltaba —el historial— se agrega acá.
--
--   ② La letra pide `codigo_iva` en cada tabla de ítem vendible. En productos la
--      columna existe y se llama `impuesto_codigo`. **NO se renombra**, y la razón
--      es medible, no estética: `packages/api/src/wrappers/despensa-seguimiento.ts`
--      la consulta ⇒ **hay bundle publicado que la pide**, y D-662 es explícita —
--      renombrar y publicar son UN SOLO ACTO. Esta tanda no publica.
--      El nombre único lo expone la tabla de LÍNEAS (`pagos_desglose_lineas.codigo_iva`),
--      que es lo que B y C consumen; la divergencia queda ADENTRO del motor.

BEGIN;

CREATE TYPE public.tarifa_estado_enum AS ENUM ('vigente', 'pendiente_ratificacion');

-- ── EL HISTORIAL QUE AL CATÁLOGO LE FALTABA ─────────────────────────────────
/* Medido en el relevamiento: `cat_tasas_impuesto` tiene columnas de vigencia y
   CERO filas cerradas — el salto 12 %→15 % de 2024 no está registrado en ninguna
   parte, y hoy no se puede representar por código una factura de esa era.
   El patrón es el de `fee_configs_historial`, con `motivo`: aquel registra el QUÉ
   y sus 22 filas tienen `motivo` NULL. Acá el motivo es NOT NULL a propósito —
   *un cambio de tarifa sin razón escrita es un número que nadie va a poder defender.* */
CREATE TABLE public.tarifas_iva_historial (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          text NOT NULL,
  operacion       text NOT NULL CHECK (operacion IN ('INSERT','UPDATE','DELETE')),
  valor_anterior  jsonb,
  valor_nuevo     jsonb,
  motivo          text,
  cambiado_por    uuid,
  cambiado_en     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tarifas_iva_historial ENABLE ROW LEVEL SECURITY;
CREATE POLICY tarifas_iva_historial_admin ON public.tarifas_iva_historial
  FOR SELECT TO authenticated USING (is_admin());

CREATE OR REPLACE FUNCTION public._trg_tarifa_iva_historial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
BEGIN
  INSERT INTO public.tarifas_iva_historial (codigo, operacion, valor_anterior, valor_nuevo, cambiado_por)
  VALUES (COALESCE(NEW.codigo, OLD.codigo), TG_OP,
          CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
          CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
          auth.uid());
  RETURN COALESCE(NEW, OLD);
END $fn$;
REVOKE EXECUTE ON FUNCTION public._trg_tarifa_iva_historial() FROM PUBLIC, anon;

CREATE TRIGGER trg_cat_tasas_impuesto_historial
  AFTER INSERT OR UPDATE OR DELETE ON public.cat_tasas_impuesto
  FOR EACH ROW EXECUTE FUNCTION public._trg_tarifa_iva_historial();

-- ── LA TARIFA EN EL ÍTEM DE SERVICIO ────────────────────────────────────────
ALTER TABLE public.tipos_servicio
  ADD COLUMN codigo_iva    text,
  ADD COLUMN tarifa_estado public.tarifa_estado_enum NOT NULL DEFAULT 'vigente';

/* SEMILLA POR CATEGORÍA — derivada de §4 de la letra, no elegida:
     · veterinario · telemedicina · emergencia  → EC_IVA_0 + PENDIENTE (F1, v0.4 E3:
       el 0 % está EN DISPUTA, no sólo pendiente; el SRI sostuvo públicamente la
       tarifa general y hubo reclasificación retroactiva).
     · paseo · grooming · adiestramiento · hospedaje → EC_IVA_15 vigente (§4: no son salud).
     · `otro`: la letra NO los nombra. Rige la regla taxativa de §4 —tarifa general
       15 %, el 0 % es lista cerrada— así que van a 15. `servicio_exequial` queda
       PENDIENTE igual: lo exequial tiene tratamiento propio para personas y nadie
       decidió el caso de una mascota. *Marcar «vigente» algo que nadie miró sería
       exactamente el default cómodo que esta tanda vino a matar.* */
UPDATE public.tipos_servicio SET
  codigo_iva = CASE WHEN categoria IN ('veterinario','telemedicina','emergencia')
                    THEN 'EC_IVA_0' ELSE 'EC_IVA_15' END,
  tarifa_estado = CASE WHEN categoria IN ('veterinario','telemedicina','emergencia')
                         OR codigo = 'servicio_exequial'
                       THEN 'pendiente_ratificacion'::public.tarifa_estado_enum
                       ELSE 'vigente'::public.tarifa_estado_enum END;

ALTER TABLE public.tipos_servicio
  ALTER COLUMN codigo_iva SET NOT NULL,
  ADD CONSTRAINT tipos_servicio_codigo_iva_fkey
    FOREIGN KEY (codigo_iva) REFERENCES public.cat_tasas_impuesto(codigo) ON DELETE RESTRICT;

COMMENT ON COLUMN public.tipos_servicio.codigo_iva IS
  'Tarifa del SERVICIO. La decide su naturaleza (salud vs no salud), jamás el prestador ni su oferta.';
COMMENT ON COLUMN public.tipos_servicio.tarifa_estado IS
  'pendiente_ratificacion = la tarifa está escrita pero NADIE la ratificó. No es «desconocida»: es «esto se cobra así hasta que el contador conteste».';

-- ── PRODUCTOS: la columna existe; se le exige lo que le faltaba ──────────────
ALTER TABLE public.producto_variantes
  ADD COLUMN tarifa_estado public.tarifa_estado_enum NOT NULL DEFAULT 'vigente';

DO $$
DECLARE v_sin int;
BEGIN
  SELECT count(*) INTO v_sin FROM public.producto_variantes WHERE impuesto_codigo IS NULL;
  IF v_sin > 0 THEN
    RAISE EXCEPTION 'cinturon_productos_sin_tarifa: % variantes sin codigo — no se rellena con un default, se declara', v_sin;
  END IF;
  SELECT count(*) INTO v_sin FROM public.pedido_items WHERE impuesto_codigo IS NULL;
  IF v_sin > 0 THEN
    RAISE EXCEPTION 'cinturon_lineas_sin_tarifa: % lineas de pedido sin codigo', v_sin;
  END IF;
END $$;

ALTER TABLE public.producto_variantes ALTER COLUMN impuesto_codigo SET NOT NULL;
ALTER TABLE public.pedido_items       ALTER COLUMN impuesto_codigo SET NOT NULL;

COMMIT;
