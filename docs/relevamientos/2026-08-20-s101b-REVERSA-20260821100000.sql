-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ REVERSA de 20260821100000 — la consulta activa y el barrido            ║
-- ║ ESCRITA ANTES DE APLICAR.                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- QUÉ DESHACE: borra el lector de candidatos y el resolvedor.
--
-- 🔴 QUÉ **NO** DESHACE:
-- ① Las compras que la consulta activa ya confirmó **siguen confirmadas**, y sus
--    comprobantes enviados no vuelven. *Revertir apaga el reconciliador; no
--    deshace las reconciliaciones.*
-- ② Los eventos `consulta_activa` en `pagos_eventos` **se conservan**: son la
--    traza de qué dijo el proveedor y cuándo. Borrarlos sería perder la única
--    prueba de por qué una compra se confirmó sin webhook.
-- ③ **Si el job llegó a agendarse, esta reversa NO lo quita** — se quita a mano,
--    y a propósito: *un barrido que se desagenda solo, en silencio, deja pagos
--    huérfanos sin que nadie se entere.*

DROP FUNCTION IF EXISTS public.resolver_consulta_activa(uuid, jsonb, text);
DROP FUNCTION IF EXISTS public.pagos_pendientes_de_conciliar(integer);
