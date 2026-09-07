-- REVERSA de 20260909520000_s113a_vistas_security_invoker.sql (S113-A)
-- 🔴 REVERTIR REABRE LA FUGA: `anon` vuelve a leer el tablero de inversores
-- (`v_pitch_metrics`), el MRR y el costo de IA con la llave que viaja en el
-- bundle de las apps. No hay caso en que convenga.
begin;
alter view public.v_crecimiento_usuarios set (security_invoker = off);
alter view public.v_gmv_mensual set (security_invoker = off);
alter view public.v_ia_costo_por_pieza_dia set (security_invoker = off);
alter view public.v_metricas_tiempo_real set (security_invoker = off);
alter view public.v_mrr set (security_invoker = off);
alter view public.v_pitch_metrics set (security_invoker = off);
alter view public.v_adoptables_publicos set (security_invoker = off);
alter view public.v_inventario_reservas_vigentes set (security_invoker = off);
alter view public.v_ranking_usuarios set (security_invoker = off);
alter view public.v_storage_borrado_atascado set (security_invoker = off);
alter view public.v_urls_legales_caidas set (security_invoker = off);
commit;
