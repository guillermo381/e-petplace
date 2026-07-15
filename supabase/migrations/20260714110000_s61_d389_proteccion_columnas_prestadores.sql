-- S61-A9 — D-389 (🔴) + D-390 (⚪): la protección de columnas de
-- `prestadores` — disparo SONADO (las migraciones de domicilio tocaron
-- la tabla). prestador_own_profile [ALL] dejaba al prestador con
-- sesión propia escribirse TODA la fila: auto-aprobación (bypass 7.13)
-- y métricas falsificadas.
--
-- MECANISMO (decisión técnica declarada, regla 3): trigger BEFORE
-- UPDATE que compara OLD/NEW de las PROTEGIDAS y rebota tipado
-- `columna_protegida` cuando el editor es "de a pie" — la condición es
-- current_user = 'authenticated' AND NOT is_admin():
--   · UPDATE directo por RLS (PostgREST/wrappers) corre como
--     authenticated → un no-admin NO toca veredicto/métrica/estructura;
--   · las funciones SECURITY DEFINER corren como su dueño (postgres) →
--     current_user <> 'authenticated' → PASAN (incluye la cadena del
--     trigger de reseñas si corre dentro de una RPC DEFINER);
--   · service_role y el admin por sesión (is_admin()) PASAN.
--
-- PROTEGIDAS (letra del pedido + estructurales por decisión declarada):
--   veredicto: estado, aprobado_por, aprobado_en, motivo_rechazo
--   métricas:  calificacion_promedio, total_citas, total_resenas
--   estructura/plata: id, user_id, cuenta_comercial_id, country_code,
--                     created_at (cuenta_comercial_id ES el camino de
--                     la plata — re-apuntarla sería robar payouts)
-- NOTA contra la letra: `es_seed_preliminar` NO existe en prestadores
-- (vive en los catálogos) — declarado, no inventado.
-- EDITABLES (quedan libres; la capa de producto B2 whitelistea encima):
--   tipo, nombre_comercial (D-370 la gobierna en producto), descripcion,
--   foto_url, fotos_galeria, telefono, whatsapp, email_contacto,
--   sitio_web, direccion, ciudad, sector, lat, lon, acepta_*,
--   radio_cobertura_km, matricula_profesional, metadata, updated_at,
--   grooming_extra_pelaje_largo, grooming_recargo_domicilio.

CREATE FUNCTION public._prestadores_protege_columnas()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF current_user = 'authenticated' AND NOT is_admin() THEN
    IF NEW.id                    IS DISTINCT FROM OLD.id
       OR NEW.user_id            IS DISTINCT FROM OLD.user_id
       OR NEW.cuenta_comercial_id IS DISTINCT FROM OLD.cuenta_comercial_id
       OR NEW.country_code       IS DISTINCT FROM OLD.country_code
       OR NEW.estado             IS DISTINCT FROM OLD.estado
       OR NEW.aprobado_por       IS DISTINCT FROM OLD.aprobado_por
       OR NEW.aprobado_en        IS DISTINCT FROM OLD.aprobado_en
       OR NEW.motivo_rechazo     IS DISTINCT FROM OLD.motivo_rechazo
       OR NEW.calificacion_promedio IS DISTINCT FROM OLD.calificacion_promedio
       OR NEW.total_citas        IS DISTINCT FROM OLD.total_citas
       OR NEW.total_resenas      IS DISTINCT FROM OLD.total_resenas
       OR NEW.created_at         IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'columna_protegida' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- L-140: la función del trigger no necesita EXECUTE de nadie (la
-- ejecuta el sistema al disparar) — se cierra entera.
REVOKE ALL ON FUNCTION public._prestadores_protege_columnas() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER prestadores_protege_columnas
  BEFORE UPDATE ON public.prestadores
  FOR EACH ROW
  EXECUTE FUNCTION public._prestadores_protege_columnas();

-- D-390: muere la policy redundante de escritura propia (la letra
-- exacta de la deuda: prestadores_own [UPDATE] se superpone con
-- prestador_own_profile [ALL] — misma qual, mismo with_check).
-- Hallazgo extra DECLARADO al registro (no se toca, fuera de letra):
-- prestadores_insert [INSERT] duplica a prestador_insert_self.
DROP POLICY prestadores_own ON public.prestadores;

COMMENT ON FUNCTION public._prestadores_protege_columnas() IS
  'D-389 (S61): el prestador de a pie no se escribe veredicto/métrica/estructura — la verdad firme de 7.13 la gobierna el admin/motor. DEFINER y service_role pasan (current_user <> authenticated).';
