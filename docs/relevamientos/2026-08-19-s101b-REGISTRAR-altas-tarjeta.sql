-- S101-B · registro de la migración de altas de tarjeta, DESPUÉS de aplicarla
-- con éxito (nunca antes: si el apply falla no debe quedar registrada como
-- aplicada — precedente S89).
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20260821040000','s101b_altas_tarjeta',
        ARRAY['-- S101-B · altas_tarjeta: ver supabase/migrations/20260821040000_s101b_altas_tarjeta.sql'])
ON CONFLICT (version) DO NOTHING
RETURNING version;
