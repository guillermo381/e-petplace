-- REVERSA de 20260826260000_s106a_puede_entrar_a_videollamada.sql — ANTES.
--
-- QUÉ DESHACE: borra la función. Es su único efecto.
--
-- QUÉ NO DESHACE: nada — la función es STABLE y no escribe una sola fila.
-- **Es la reversa más limpia de la tanda, y conviene decir por qué lo es:**
-- la RPC no guarda estado, no emite tokens y no registra asistencia. Todo
-- lo que sabe lo deriva de `evento_cita_servicio` en el momento de
-- preguntar. *Una función que no persiste nada se puede borrar sin
-- consecuencias — y eso no es casualidad, es el diseño que D pidió.*
--
-- ⚠️ LO QUE SÍ ROMPE: `video-token` deja de poder decidir quién entra. Si
-- esta reversa corre con la edge desplegada, **nadie puede entrar a ninguna
-- videollamada** — el fallo es total y ruidoso, no silencioso. Correr las
-- dos reversas juntas o ninguna.

BEGIN;

DROP FUNCTION IF EXISTS public.puede_entrar_a_videollamada(uuid, uuid);

COMMIT;
