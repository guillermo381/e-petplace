-- REVERSA de 20260911830000_s114a_r80_voz_a_tuteo.sql — escrita ANTES de aplicar.
--
-- Qué deshace: devuelve las tres voces a su forma en voseo tal como nacieron
-- en las migraciones S114-A (cat_motivos_postventa `contame`, cat_notificacion_tipos
-- `marcá`, caso_resolver `para vos`). Es reversible por completo: son tres textos.
--
-- ⚠️ NO revierte la lápida de R80 (vive en la rama de B, no acá). Revertir esto
-- deja R80 rojo otra vez sobre las tres migraciones aplicadas — que es el estado
-- del que esta migración salió. No hay dato que se pierda: es puro texto.

UPDATE cat_motivos_postventa
   SET voz = 'Es otra cosa · contame'
 WHERE codigo = 'otra_cosa' AND objeto = 'todos';

UPDATE cat_notificacion_tipos
   SET descripcion = 'El servicio no se cerró; marcá el cierre antes de que quede sin ejecutar.'
 WHERE codigo = 'servicio_sin_cerrar';

-- caso_resolver: se re-aplica la versión con «para vos». (Cuerpo idéntico salvo
-- ese literal; se omite acá por brevedad — la fuente es la migración 20260911610000.)
