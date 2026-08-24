-- REVERSA de `20260824000000_s104a_consentimiento_de_alta.sql` · S104-A
-- 🔴 Revertir NO reabre ningún agujero (la RPC solo AGREGA un camino gateado),
-- pero deja el acto ② de D-893 sin cumplir ⇒ apagar `mailer_autoconfirm`
-- volvería a producir registros SIN evidencia de consentimiento, y P23 promete
-- lo contrario. Las filas ya escritas por la RPC NO se tocan: son evidencia.
begin;
drop function if exists public.registrar_consentimiento_de_alta(uuid, text, jsonb);
commit;
