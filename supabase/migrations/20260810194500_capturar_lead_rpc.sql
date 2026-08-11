-- ═══════════════════════════════════════════════════════════════════
-- LA PUERTA: `public.capturar_lead(...)`
--
-- POR QUÉ UNA RPC Y NO EL INSERT DIRECTO — medido, no elegido:
-- la edge function escribía con `db: { schema: 'marketing' }`, y PostgREST
-- SOLO enruta a los schemas EXPUESTOS en la config del proyecto (`public`
-- y `graphql_public`). Un schema nuevo no está expuesto, así que el insert
-- rebotaba con `no_se_pudo_guardar` aunque `service_role` ya tuviera sus
-- privilegios — verificado con un POST real después del grant.
--
-- Las dos salidas eran exponer `marketing` en la API del proyecto
-- COMPARTIDO, o poner una puerta en `public`. Se elige la puerta:
--   · no toca la configuración de un proyecto que comparte con la app;
--   · el schema sigue SIN exponer, que era el punto de tenerlo aparte;
--   · y es el patrón de la casa — la RPC es la puerta, la tabla no se
--     toca desde afuera.
--
-- `SECURITY DEFINER` con `search_path` FIJO: sin fijarlo, un search_path
-- hostil puede hacer que el cuerpo resuelva otra tabla (D-708).
-- ═══════════════════════════════════════════════════════════════════

begin;

create or replace function public.capturar_lead(
  p_tipo     text,
  p_nombre   text,
  p_ciudad   text,
  p_origen   text,
  p_idioma   text,
  p_negocio  text default null,
  p_whatsapp text default null,
  p_email    text default null,
  p_oficio   text default null,
  p_especie  text default null,
  p_mensaje  text default null
) returns void
language plpgsql
security definer
set search_path = marketing, pg_temp
as $$
begin
  insert into marketing.leads
    (tipo, nombre, ciudad, origen, idioma, negocio, whatsapp, email, oficio, especie, mensaje)
  values
    (p_tipo, p_nombre, p_ciudad, p_origen, p_idioma, p_negocio, p_whatsapp, p_email, p_oficio, p_especie, p_mensaje);
end;
$$;

-- La puerta es de la function, de nadie más. `anon` y `authenticated`
-- quedan fuera: el sitio no la llama con la anon key — la llama la edge
-- function con `service_role`.
revoke all on function public.capturar_lead(text,text,text,text,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.capturar_lead(text,text,text,text,text,text,text,text,text,text,text) to service_role;

commit;
