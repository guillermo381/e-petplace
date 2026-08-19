-- S101-A · registro de la migración 3 (compuertas pre-cobro), DESPUÉS de
-- aplicarla con éxito. Se registra después, no antes: si el apply falla, la
-- migración no debe quedar registrada como aplicada (precedente S89).
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20260821020000','s101_compuertas_pre_cobro',
        ARRAY['-- S101 E3 · verificar_compuertas_pre_cobro: ver supabase/migrations/20260821020000_s101_compuertas_pre_cobro.sql'])
ON CONFLICT (version) DO NOTHING
RETURNING version;
