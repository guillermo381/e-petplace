/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260901020000_s107a_protocolo_v3.sql` — escrita ANTES.
   🔴 QUÉ NO DESHACE: revertir devuelve al texto que **promete custodia sin
   fecha de cierre sin decir quién la paga**. Y si alguna familia aceptó la v3,
   sus aceptaciones quedan (son prueba de un acto real, P23) — ahí la salida no
   es revertir: es publicar una v4.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DELETE FROM guarderia_documentos WHERE codigo='protocolo_no_retiro' AND version=3;
UPDATE guarderia_documentos SET activo = true
 WHERE codigo='protocolo_no_retiro' AND version=2;
COMMIT;
