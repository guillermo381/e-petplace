-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DEL BLOQUE 5 · S95-D — el motor
--   supabase/migrations/20260812000000_s95_m13_motor.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ La deshace ENTERA sin pérdida de dato, y esto es cierto SIEMPRE, no
--      solo hoy: esta migración crea únicamente FUNCIONES. No tiene DDL de
--      estructura ni escribe una sola fila que sobreviva (el cinturón corre un
--      pedido completo y lo borra por id, con residuo 0 verificado).
--
--   ⚠️ **PERO REVERTIRLA DEJA EL ESQUEMA SIN PUERTA.** Las tablas quedan con
--      sus policies, que solo admiten escritura por admin o por el dueño —
--      o sea, **un pedido deja de poder crearse por ningún camino**. No es un
--      daño: es el esqueleto sin motor, que es el estado en que S95-C lo dejó.
--
--   🔴 Y si hay pedidos vivos, borrar `mover_estado_pedido` deja la máquina de
--      estados sin su ÚNICA puerta: nadie puede avanzar un pedido en curso.
--      Con pedidos en vuelo, esta reversa NO se ejecuta.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_senal_comercial(text, text, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.cancelar_pedido_despensa(uuid, text, text);
DROP FUNCTION IF EXISTS public.entregar_pedido(uuid, uuid);
DROP FUNCTION IF EXISTS public.empacar_pedido(uuid, jsonb, numeric);
DROP FUNCTION IF EXISTS public.confirmar_pago_pedido(uuid, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.reservar_stock_pedido(uuid, integer);
DROP FUNCTION IF EXISTS public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid);
-- `mover_estado_pedido` va última: las de arriba la llaman.
DROP FUNCTION IF EXISTS public.mover_estado_pedido(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.calcular_promesa_entrega(uuid, integer, timestamptz);
DROP FUNCTION IF EXISTS public.cotizar_envio_despensa(uuid, numeric, numeric, numeric, text);

COMMIT;
