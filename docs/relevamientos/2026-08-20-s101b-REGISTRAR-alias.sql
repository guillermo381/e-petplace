-- S101-B · registro de la migración del alias, DESPUÉS de aplicarla con éxito.
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20260821050000','s101b_alias_tarjeta',
        ARRAY['-- S101-B · alias de tarjeta: ver supabase/migrations/20260821050000_s101b_alias_tarjeta.sql'])
ON CONFLICT (version) DO NOTHING
RETURNING version;
