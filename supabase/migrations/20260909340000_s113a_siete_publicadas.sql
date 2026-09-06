-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — las siete que el founder leyó el 5-sep. Con éstas van DIEZ.
--
-- Se publican exactamente las siete que se le pegaron enteras y leyó:
-- labrador-retriever · loro-yaco-africano · beagle · californian · persa · pug ·
-- chinchilla.
--
-- ⚠️ NO entran las otras dos de esa tanda, y por razones distintas:
--   · `gato-comun` — su ficha del primer Batch estaba VACÍA, así que no se pegó
--     ni se leyó. **Hoy YA TIENE contenido**: el archivo por especie la llenó
--     con lo que un gato es, en vez de con lo que la «raza Gato Común» sería.
--     *Es contenido nuevo que nadie leyó todavía, y por eso no se publica.*
--   · `schnauzer-miniatura` — es de las 110 que se agregaron el mismo día y su
--     ficha llegó recién con el segundo Batch. Mismo motivo: sin leer.
--
-- 🔴 El CHECK sigue haciendo imposible publicar sin revisor y sin fecha. *La
-- firma no es un campo de auditoría que se completa después: es la condición
-- para que la fila pueda estar encendida.*
--
-- 76(g) — VEDA: NO RIGE. UPDATE sobre siete filas de contenido propio.
-- ═══════════════════════════════════════════════════════════════════════════
begin;
update public.razas_contenido
   set activo = true,
       revisado_por = '75d0798a-ea90-4a97-a2f2-74f3234d892a'::uuid,
       revisado_en = now()
 where raza_codigo in ('labrador-retriever','loro-yaco-africano','beagle',
                       'californian','persa','pug','chinchilla')
   and conocida;
commit;
