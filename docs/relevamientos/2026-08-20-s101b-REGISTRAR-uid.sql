-- S101-B · registro de la migración del uid del proveedor, DESPUÉS de aplicarla.
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20260821060000','s101b_uid_proveedor',
        ARRAY['-- S101-B · proveedor_uid: ver supabase/migrations/20260821060000_s101b_uid_proveedor.sql'])
ON CONFLICT (version) DO NOTHING RETURNING version;
