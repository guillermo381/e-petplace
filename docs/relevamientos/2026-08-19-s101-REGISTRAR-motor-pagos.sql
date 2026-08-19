-- S101-A · registro de la migración 2, DESPUÉS de aplicarla con éxito.
-- (Se registra después, no antes: si el apply falla, la migración no debe
--  quedar registrada como aplicada — precedente S89.)
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20260821010000','s101_motor_pagos',
        ARRAY['-- S101 · enmienda a pagos_intentos + confirmar_pago_compra: ver supabase/migrations/20260821010000_s101_motor_pagos.sql'])
ON CONFLICT (version) DO NOTHING
RETURNING version;
