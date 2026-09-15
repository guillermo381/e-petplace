-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260915180000_s116a_vitrina_sin_pruebas.sql`
-- ESCRITA ANTES DE APLICAR, con su nota de qué NO deshace.
--
-- ⚠️ LO QUE SÍ DESHACE: las dos vistas vuelven a su filtro anterior y las dos
-- columnas se van con sus marcas.
--
-- 🔴 LO QUE **NO** DESHACE, y es el punto: **revertir esto vuelve a publicar
-- 7 prestadores y 545 ofertas de prueba en la vitrina que ve una familia.**
-- Si alguien revierte para destrabar otra cosa, que sepa que el efecto no es
-- «volver al estado anterior»: es volver a mostrarle a un invitado de F&F un
-- negocio que se llama «(borrable)».
-- ⇒ si hay que revertir, se revierte PRIMERO el motivo y se deja esto último.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE VIEW public.v_vitrina_publicada AS
 SELECT o.id AS oferta_id, o.cuenta_comercial_id, o.precio, o.moneda,
        o.country_code, o.hay_stock,
        pv.id AS variante_id, pv.presentacion, pv.contenido_valor,
        pv.contenido_unidad, pv.peso_kg,
        p.id AS producto_id, p.nombre, p.marca, p.familia_codigo,
        p.especies_aplicables, p.momentos_aplicables, p.alergenos,
        p.composicion_estado, p.es_dieta_prescripcion, p.imagen_url, p.imagenes
   FROM ofertas o
   JOIN producto_variantes pv ON pv.id = o.variante_id AND pv.activo
   JOIN productos p ON p.id = pv.producto_id AND p.estado = 'activo'
  WHERE o.estado = 'publicada';

-- `v_prestadores_publicos` se restaura desde su definición vigente quitando
-- la cláusula nueva: se regenera con el mismo cuerpo y `WHERE p.estado = 'activo'`
-- SIN el `AND p.creado_por_sistema IS NULL`. El cuerpo completo vive en la
-- migración que esta reversa deshace — se copia de ahí, no se re-deriva.

ALTER TABLE public.prestadores          DROP COLUMN IF EXISTS creado_por_sistema;
ALTER TABLE public.cuentas_comerciales  DROP COLUMN IF EXISTS creado_por_sistema;

DO $cint$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='prestadores'
                AND column_name='creado_por_sistema') THEN
    RAISE EXCEPTION 'reversa incompleta: la columna sigue en prestadores';
  END IF;
  RAISE NOTICE 'reversa verde — y la vitrina volvió a mostrar los datos de prueba';
END $cint$;

COMMIT;
