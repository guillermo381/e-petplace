/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260831040000_s107a_seis_documentos_v1.sql` — escrita ANTES.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 QUÉ **NO** DESHACE:

   1. **Revertir vuelve a bloquear el frente entero.** Sin documentos, las dos
      puertas de compra y las dos de reserva rebotan con
      `documentos_no_disponibles` — que es un estado NUESTRO y la familia no
      puede resolver. *No es «volver atrás un cambio»: es apagar la guardería.*

   2. **Si alguna familia ya aceptó, este DELETE REBOTA — y está bien.**
      `guarderia_aceptaciones` tiene FK a `(codigo, version)` **sin CASCADE**.
      La base defiende la prueba de aceptación: *un consentimiento cuyo texto
      se puede borrar no prueba nada* (P23). Para retirar un texto ya aceptado
      no se borra: se marca `activo=false` y se publica una v2.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DELETE FROM guarderia_documentos WHERE version = 1 AND codigo IN (
  'contrato_custodia','declaracion_sanitaria','declaracion_comportamiento',
  'autorizacion_urgencia_veterinaria','autorizacion_transporte','protocolo_no_retiro');
COMMIT;
