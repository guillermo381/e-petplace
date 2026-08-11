-- ═══════════════════════════════════════════════════════════════════
-- CURA: `service_role` recupera su llave.
--
-- La migración anterior hizo `revoke all … from public`, y `service_role`
-- HEREDA de PUBLIC — así que se quedó sin USAGE ni INSERT y la function
-- no podía guardar (`no_se_pudo_guardar`, medido con un POST real).
--
-- Es la lección de S92 mordiendo del otro lado: allá un revoke que dejaba
-- PUBLIC intacto no cerraba nada; acá uno que SÍ tocó PUBLIC cerró de más.
-- La conclusión es la misma en los dos casos: **el privilegio se declara
-- explícito por rol, y se verifica por camino real** — nunca se deduce de
-- lo que uno cree que heredó.
--
-- Los roles de usuario (`anon`, `authenticated`) siguen sin nada: la
-- puerta única no se toca.
-- ═══════════════════════════════════════════════════════════════════

begin;

grant usage on schema marketing to service_role;
grant insert, select on marketing.leads to service_role;

commit;
