-- REVERSA de `20260911680000_s114a_devengo_vet_telemedicina.sql`. Escrita ANTES.
-- 🔴 REPONE UN HUECO DE PLATA: sin el helper, veterinaria y telemedicina vuelven
--    a cobrar y NO devengar — y §6 de LETRA_POSTVENTA queda sin poder reversar
--    una devolución sobre esas citas (no hay evento). No borra eventos ya
--    creados. Para revertir hay que reponer las definiciones previas de
--    completar_cita_servicio y cerrar_teleconsulta SIN la línea del PERFORM
--    (viven en el historial de migraciones de sus sesiones).
DROP FUNCTION IF EXISTS public._devengar_cita(uuid, text);
-- ⚠️ completar_cita_servicio y cerrar_teleconsulta quedan llamando a una función
--    que ya no existe ⇒ hay que recrearlas sin la línea. No es un DROP simple.
