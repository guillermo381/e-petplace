-- S54 — segunda correctiva L-140 (hallazgo de la sonda de verificación):
-- la migración anterior quitó anon de la entrada POR-SCHEMA de default
-- privileges, pero el default HARD-WIRED de Postgres (toda función nace
-- con EXECUTE para PUBLIC, '=X') se UNE a la entrada por-schema y anon
-- seguía entrando por la puerta de PUBLIC — probado con sonda:
-- has_function_privilege('anon', ...) = true en una función recién nacida.
-- Esta entrada GLOBAL reemplaza el built-in y cierra PUBLIC de raíz:
-- funciones futuras de postgres nacen {postgres} ∪ entrada-por-schema
-- ({authenticated, service_role} en public) — sin PUBLIC, sin anon.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
