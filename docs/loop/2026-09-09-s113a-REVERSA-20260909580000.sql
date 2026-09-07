-- REVERSA de 20260909580000_s113a_puerta_medicacion_familia.sql
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: la puerta `registrar_medicacion_administrada` y la cura del
-- catálogo (`cat_tipos_evento.tabla_tipada` vuelve a NULL).
--
-- QUÉ **NO** DESHACE:
--   · Las dosis que la familia ya registró. Quedan como eventos vivos en el
--     expediente, con su modo de captura, y siguen apareciendo en la línea de
--     vida. *Un hecho que la familia anotó no se borra porque la puerta se
--     cierre: la puerta era para entrar, no para existir.*
--   · Dejar `tabla_tipada` en NULL otra vez REABRE el hueco que esta migración
--     cierra: el catálogo dice que el tipo está activo y no dice dónde vive su
--     detalle. `verificar_coherencia_tablas_tipadas()` no lo caza —mide el
--     sentido contrario, apuntar a una tabla que no existe—, así que el hueco
--     vuelve **en silencio**.
--
-- ANTES DE CORRER, cuántas dosis quedan huérfanas de puerta:
--   select count(*) from public.evento_medicacion_administrada
--    where prestador_id is null;

drop function if exists public.registrar_medicacion_administrada(uuid, text, text, text, timestamptz, text, text);
update public.cat_tipos_evento set tabla_tipada = null where codigo = 'medicacion_administrada';
