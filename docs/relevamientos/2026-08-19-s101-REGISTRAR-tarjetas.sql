-- S101-A · registro de la migración de tarjetas guardadas, DESPUÉS de
-- aplicarla con éxito (nunca antes: si el apply falla no debe quedar
-- registrada como aplicada — precedente S89).
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20260821030000','s101_tarjetas_guardadas',
        ARRAY['-- S101 ⑥ · tarjetas_guardadas: ver supabase/migrations/20260821030000_s101_tarjetas_guardadas.sql'])
ON CONFLICT (version) DO NOTHING
RETURNING version;
