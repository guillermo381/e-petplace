/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA CITA DE PAQUETE LLEVA LA JORNADA — defecto propio, cazado por el
   arnés antes de la primera reserva real
   ═══════════════════════════════════════════════════════════════════════════

   ⏪ `reservar_dia_de_paquete_guarderia` insertaba la cita con
   **`duracion_minutos = NULL`**, con este argumento escrito: *«una estadía no
   dura minutos, dura un DÍA»*.

   🔴 **El argumento es cierto y la columna es `NOT NULL`.** El arnés lo cazó con
   `23502` — *y sin él esto habría llegado al founder como un error opaco en la
   PRIMERA reserva contra saldo.*

   > **Una razón correcta no exime de medir el destino.** El razonamiento sobre
   > qué *significa* el dato no dice nada sobre qué *acepta* la columna, y yo
   > escribí el primero como si contestara al segundo.

   **La cura es la del día suelto, que ya lo resolvía:** se guarda la
   **jornada del servicio** (`prestador_servicios.duracion_minutos`), igual que
   `reservar_dia_guarderia`. *No se inventa un valor: se usa el que la hermana
   ya usaba* — y así las dos citas de guardería, comprada suelta o por paquete,
   quedan idénticas en su forma.

   **76(g): NO RIGE.** **Reversa:** no aplica — volver a `NULL` reinstala un
   estado que la tabla rechaza.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
;
REVOKE EXECUTE ON FUNCTION public.reservar_dia_de_paquete_guarderia(uuid,date,uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reservar_dia_de_paquete_guarderia(uuid,date,uuid) TO authenticated;
COMMIT;
