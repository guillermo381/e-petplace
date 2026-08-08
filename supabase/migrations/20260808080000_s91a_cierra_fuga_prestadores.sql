-- ============================================================================
-- 🔴 S91-A · LA FUGA DE `prestadores` — cerrada en la fuente
-- ============================================================================
-- HALLAZGO DE C, con ROJO REPRODUCIDO POR A antes de tocar nada (JWT de un
-- cliente sin relación con ningún negocio):
--   lat/lon EXACTA .... 4 filas
--   direccion ......... 5 filas
--   email_contacto .... 1 fila
--   metadata .......... 6 filas
--   (y cuenta_comercial_id · motivo_rechazo · aprobado_por · aprobado_en,
--    que son VEREDICTOS INTERNOS)
--
-- **Es una regresión de la letra de S84**, que firmó que la coordenada exacta
-- NO viaja al teléfono y construyó el ofuscado estable de
-- `v_prestadores_publicos`. El ofuscado se hizo bien; lo que quedó abierto
-- fue **la puerta de al lado**: la TABLA seguía legible.
--
-- ── POR QUÉ NO ALCANZA CON ANGOSTAR LA POLICY, medido ──────────────────────
-- `prestadores_public` (`estado='activo' OR user_id=auth.uid() OR is_admin()`)
-- da acceso de FILA a cualquier autenticado. Angostarla cerraría todo de un
-- golpe **y rompería lectores legítimos**: tres wrappers del DUEÑO DE MASCOTA
-- leen `nombre_comercial` del prestador de SU cita
-- (`veterinaria-reserva.ts`, `citaSuelta.ts`, `grooming.ts`). *Que una
-- familia sepa cómo se llama la clínica donde tiene turno no es una fuga.*
--
-- ── LA CURA ES EL PATRÓN QUE S79 YA ESTABLECIÓ EN ESTA MISMA TABLA ─────────
-- «columna sensible → SIN GRANT → su dueño la lee por RPC DEFINER». Es
-- exactamente cómo viven `proposito` y `direccion_envio` desde S79. **No se
-- inventa un mecanismo: se aplica el que la casa ya eligió** (y que la skill
-- `epetplace-db` documenta como ley de esta tabla).
--
-- LOS TRES MOVIMIENTOS, y cada uno cubre a un actor:
--   ① **REVOKE por columna** de las nueve sensibles → el AJENO deja de verlas
--      (y sigue viendo `nombre_comercial`, que es lo que necesita).
--   ② **La vista pasa a `security_invoker = false`** → como el ajeno ya no
--      puede leer `lat`/`lon`, una vista INVOKER se habría roto con él
--      adentro. En DEFINER la vista lee con derechos de `postgres` y **queda
--      como LA ÚNICA puerta de lectura pública**, que es la letra de S84.
--      ⚠️ Esto REVIERTE una decisión de implementación de S79
--      (`security_invoker=true`) **conservando su intención entera**: `anon`
--      sigue afuera (cinturón) y la coordenada sigue ofuscada. Se declara
--      porque revertir una decisión firmada en silencio es peor que la fuga.
--   ③ **`obtener_mi_prestador()` DEFINER** → el DUEÑO recupera su fila
--      COMPLETA por una puerta propia. Sin esto, el REVOKE del ① lo habría
--      dejado sin poder leer su propia dirección: **un grant por columna no
--      distingue dueño de ajeno, porque los dos son `authenticated`.** Ese es
--      el detalle que hace que esta cura tenga tres partes y no una.
--
-- Veda 76(g): NO RIGE — privilegios, una opción de vista y una función; cero
-- datos tocados.
-- D-662: `obtenerMiPrestador` del bundle vivo hace `.from('prestadores')` con
-- columnas nombradas que incluyen `lat`/`direccion` ⇒ **ese bundle se va a
-- quedar sin esas columnas hasta que su OTA viaje.** Se declara y se acepta:
-- la alternativa era dejar la fuga abierta. El wrapper nuevo va en el mismo
-- commit y el prestador ya tiene publish pendiente de su próxima tanda.
-- Reversa (con su nota de que reabre la fuga):
--   docs/relevamientos/2026-08-08-s91a-REVERSA-fuga-prestadores.sql
-- ============================================================================

BEGIN;

-- ── ① el ajeno deja de ver lo que no es suyo ────────────────────────────────
REVOKE SELECT (lat, lon, direccion, email_contacto, metadata, motivo_rechazo,
               aprobado_por, aprobado_en, cuenta_comercial_id)
  ON public.prestadores FROM authenticated;

-- ── ② la vista pública pasa a ser LA puerta ─────────────────────────────────
ALTER VIEW public.v_prestadores_publicos SET (security_invoker = false);

COMMENT ON VIEW public.v_prestadores_publicos IS
  'LA única puerta de lectura PÚBLICA de prestadores (letra S84: la coordenada exacta no viaja al teléfono; acá va la zona ofuscada, estable por id). S91: pasa a security_invoker=false porque la tabla dejó de ser legible por clientes — una vista invoker se habría roto con ellos adentro. Revierte la implementación de S79 conservando su intención: anon sigue afuera y la coordenada sigue ofuscada.';

-- ── ③ el dueño recupera su fila completa por su propia puerta ───────────────
CREATE OR REPLACE FUNCTION public.obtener_mi_prestador()
 RETURNS TABLE(
   id uuid, nombre_comercial text, tipo text, country_code text,
   cuenta_comercial_id uuid, direccion text, ciudad text, sector text,
   lat numeric, lon numeric, radio_cobertura_km integer,
   grooming_extra_pelaje_largo numeric, grooming_recargo_domicilio numeric,
   descripcion text, telefono text, whatsapp text, email_contacto text,
   sitio_web text, estado text, foto_url text, clip_url text,
   expone_personas boolean, cohorte text, cohorte_anio integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- El gate es el MISMO predicado que la policy del dueño usa
  -- (`user_gestiona_prestador`), así que titular Y equipo activo entran —
  -- la puerta del arco de equipo de S75 no se cierra por esta cura.
  RETURN QUERY
  SELECT p.id, p.nombre_comercial, p.tipo, p.country_code,
         p.cuenta_comercial_id, p.direccion, p.ciudad, p.sector,
         p.lat, p.lon, p.radio_cobertura_km,
         p.grooming_extra_pelaje_largo, p.grooming_recargo_domicilio,
         p.descripcion, p.telefono, p.whatsapp, p.email_contacto,
         p.sitio_web, p.estado, p.foto_url, p.clip_url,
         p.expone_personas, p.cohorte, p.cohorte_anio
    FROM prestadores p
   WHERE public.user_gestiona_prestador(p.id)
   LIMIT 1;
END;
$function$;

COMMENT ON FUNCTION public.obtener_mi_prestador() IS
  'S91: la puerta del DUEÑO a su fila completa. Existe porque el REVOKE por columna que cerró la fuga no distingue dueño de ajeno —los dos son authenticated—, así que el dueño necesitaba una puerta propia. Gate = user_gestiona_prestador (titular Y equipo activo: no cierra el arco de equipo de S75).';

REVOKE EXECUTE ON FUNCTION public.obtener_mi_prestador() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mi_prestador() TO authenticated;

-- ── Cinturones: el rojo se reproduce y se apaga EN LA MISMA MIGRACIÓN ───────
DO $$
DECLARE v_n int; v_acl text;
BEGIN
  -- ① las nueve dejaron de estar concedidas a authenticated
  SELECT count(*) INTO v_n FROM information_schema.column_privileges
   WHERE table_schema='public' AND table_name='prestadores' AND grantee='authenticated'
     AND privilege_type='SELECT'
     AND column_name IN ('lat','lon','direccion','email_contacto','metadata',
                         'motivo_rechazo','aprobado_por','aprobado_en','cuenta_comercial_id');
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'cinturon_fuga: quedan % columnas sensibles concedidas a authenticated', v_n;
  END IF;

  -- Y `nombre_comercial` SIGUE concedida: la familia tiene que poder leer
  -- cómo se llama la clínica donde tiene turno. Cerrar de más también rompe.
  IF NOT EXISTS (SELECT 1 FROM information_schema.column_privileges
                  WHERE table_schema='public' AND table_name='prestadores'
                    AND grantee='authenticated' AND privilege_type='SELECT'
                    AND column_name='nombre_comercial') THEN
    RAISE EXCEPTION 'cinturon_fuga: se cerro nombre_comercial — eso rompe tres lectores del dueño de mascota';
  END IF;

  -- ② la vista quedó DEFINER y `anon` sigue AFUERA (intención de S79 intacta)
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE n.nspname='public' AND c.relname='v_prestadores_publicos'
                AND 'security_invoker=true' = ANY(c.reloptions)) THEN
    RAISE EXCEPTION 'cinturon_fuga: la vista sigue en security_invoker';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.role_table_grants
              WHERE table_schema='public' AND table_name='v_prestadores_publicos'
                AND grantee='anon') THEN
    RAISE EXCEPTION 'cinturon_fuga: anon gano acceso a la vista publica — la intencion de S79 se rompio';
  END IF;

  -- ③ la puerta del dueño existe y no la puede ejecutar anon
  SELECT p.proacl::text INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mi_prestador';
  IF v_acl IS NULL OR v_acl LIKE '%anon=%' THEN
    RAISE EXCEPTION 'cinturon_fuga: la puerta del dueno no esta bien cerrada (%)', coalesce(v_acl,'sin acl');
  END IF;
END $$;

COMMIT;
