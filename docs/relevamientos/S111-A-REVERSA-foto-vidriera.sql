/* REVERSA de `20260907560000_s111a_foto_vidriera_anon.sql` — ESCRITA ANTES.
   🔴 QUÉ HACE AL CORRERLA: **apaga las caras de la vidriera anónima.** La
   pantalla no falla — cae al fallback y muestra siluetas grises con nombres, que
   es exactamente lo que §4 llama «inventario» y no «vidas».
   *No deja error, no deja log: deja una pantalla peor.*
   NO toca ninguna otra policy del bucket ni ningún objeto. */
BEGIN;
DROP POLICY IF EXISTS mascotas_select_vidriera_anon ON storage.objects;
COMMIT;
