-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260806240000_s89a_visita_por_app.sql
-- Escrita ANTES de aplicar. Restaura el asiento y las RPCs a la forma
-- solo-por-usuario de 20260806220000 (la que el contrato v1 describía).
-- Nota de datos: colapsa visitas por app a una sola por usuario (se queda la
-- más reciente); revertir DESHACE el contrato v2 que C y D consumen.
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.hay_novedades(text);
DROP FUNCTION IF EXISTS public.registrar_visita_campana(text);

CREATE TABLE public._visita_v1 AS
  SELECT DISTINCT ON (user_id) user_id, visitada_en
  FROM public.notificacion_campana_visita ORDER BY user_id, visitada_en DESC;
DROP TABLE public.notificacion_campana_visita;
ALTER TABLE public._visita_v1 RENAME TO notificacion_campana_visita;
ALTER TABLE public.notificacion_campana_visita
  ADD PRIMARY KEY (user_id),
  ALTER COLUMN visitada_en SET NOT NULL,
  ALTER COLUMN visitada_en SET DEFAULT now(),
  ADD CONSTRAINT notificacion_campana_visita_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notificacion_campana_visita ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notificacion_campana_visita FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.registrar_visita_campana()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_en  timestamptz := now();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  INSERT INTO notificacion_campana_visita (user_id, visitada_en)
  VALUES (v_uid, v_en)
  ON CONFLICT (user_id) DO UPDATE SET visitada_en = EXCLUDED.visitada_en;
  RETURN jsonb_build_object('ok', true, 'visitada_en', v_en);
END;
$function$;

CREATE FUNCTION public.hay_novedades()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM notificacion_intencion i
    WHERE i.destinatario_user_id = auth.uid()
      AND i.resuelto_como->>'despacho' = 'para_transporte'
      AND i.created_at > COALESCE(
        (SELECT v.visitada_en FROM notificacion_campana_visita v
          WHERE v.user_id = auth.uid()),
        '-infinity'::timestamptz)
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_visita_campana() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.hay_novedades() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_visita_campana() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hay_novedades() TO authenticated;
