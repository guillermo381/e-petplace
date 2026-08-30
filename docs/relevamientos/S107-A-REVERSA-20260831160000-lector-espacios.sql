/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260831160000_s107a_lector_de_espacios.sql` — escrita ANTES.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 QUÉ NO DESHACE — y acá el «qué no deshace» ES el punto:

   Revertir devuelve la guardería al estado donde **se puede ESCRIBIR la
   capacidad y no se puede LEER**. Y ese estado no es una incomodidad: es el
   que produjo una **pérdida de datos silenciosa** — el taller derivaba la
   capacidad del cupo de HOY, así que un negocio con capacidad 12 que abriera
   su taller un sábado veía 8 y **al guardar se la bajaba a 8, sin error**.
   Dos de cada siete días.

   ⚠️ Si esta función se va, **la pantalla NO puede volver a derivar**: tiene
   que dejar de ofrecer editar la capacidad.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_espacios_guarderia(uuid);
COMMIT;
