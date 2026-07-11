-- S54 — cura de raíz L-140 (gate founder APROBADO): las funciones
-- futuras creadas por postgres en public ya NO nacen con EXECUTE para
-- anon. Cero efecto sobre funciones existentes (default privileges solo
-- rigen objetos futuros); una función legítimamente pública pre-login
-- exigirá su GRANT EXECUTE TO anon explícito y justificado (ley L-140).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon;
