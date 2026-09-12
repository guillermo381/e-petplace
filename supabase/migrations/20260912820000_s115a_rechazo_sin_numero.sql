-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · `D-1083` · UN DOCUMENTO RECHAZADO ANTES DE NUMERAR NO TIENE NÚMERO
--
-- 🔴 EL DEFECTO, Y ES DE UN CHECK QUE FIRMÉ YO ESTA MISMA SESIÓN.
--    `chk_documento_fiscal_emitido_declara_secuencial` admitía un documento
--    `emitido` SIN número sólo en cuatro estados —`borrador`,
--    `esperando_receptor`, `pendiente_manual`, `anulada`— y **`no_autorizada`
--    no estaba**. ⇒ cuando el proveedor RECHAZA antes de asignar número, el
--    estado honesto es **inexpresable**: la escritura rebota, el documento
--    queda atrapado en `emitiendo`, y el reloj lo reintenta cada cinco
--    minutos para siempre.
--
-- 🔴 Y LA SEGUNDA VUELTA ES LA QUE LO VUELVE URGENTE, con su caso vivo:
--    **el motivo del rechazo se perdió porque escribirlo violaba el CHECK.**
--    El documento `0ed6c97c` ($70,90, a nombre del RUC `1793240435001`) fue
--    rechazado por Factuplan y **no sabemos por qué**: el intento de registrar
--    la razón es exactamente lo que falló.
--
--    ⇒ *un guard que impide anotar por qué algo falló destruye la evidencia
--    del fallo que está previniendo.* Es `L-541` un piso más abajo: allá la
--    explicación escrita al curar era una hipótesis; acá el guard directamente
--    borra el hecho.
--
-- 🔴 POR QUÉ ESTA LÍNEA Y NO AFLOJAR EL CHECK ENTERO: la regla que el CHECK
--    defiende sigue intacta — **una factura AUTORIZADA no puede existir sin
--    número**. Lo que se agrega es el caso contrario y honesto: *un documento
--    que el proveedor rechazó antes de numerar NO TIENE número, y decir que
--    lo tiene sería el dato falso.* No se ensancha la excepción: se nombra un
--    hecho que faltaba.
--
-- VEDA 76(g): NO RIGE — un CHECK, cero datos. Y se declara lo que SÍ toca:
-- después de esto, el barrido puede mover a `no_autorizada` los documentos
-- hoy atrapados en `emitiendo`, que es el objetivo.
-- Reversa: `docs/relevamientos/S115-A-REVERSA-20260912820000-no-autorizada.sql`
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.documentos_fiscales
  DROP CONSTRAINT IF EXISTS chk_documento_fiscal_emitido_declara_secuencial;

ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_emitido_declara_secuencial
  CHECK (
    sentido <> 'emitido'
    OR estado = ANY (ARRAY['borrador','esperando_receptor','pendiente_manual',
                           'anulada',
                           /* 🔴 EL AGREGADO: rechazado ANTES de numerar. */
                           'no_autorizada']::fiscal_estado_enum[])
    OR (numeracion_origen = 'proveedor' AND estado = 'emitiendo')
    OR (establecimiento IS NOT NULL AND punto_emision IS NOT NULL AND secuencial IS NOT NULL)
  );

-- ── CINTURÓN — los DOS lados, porque aflojar de más sería el defecto nuevo ──
DO $cint$
DECLARE v_id uuid; v_ok bool;
BEGIN
  SELECT id INTO v_id FROM documentos_fiscales
   WHERE sentido='emitido' AND estado='emitiendo' LIMIT 1;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay documento atrapado en emitiendo — sin caso no se discrimina (L-437)';
  END IF;

  -- ① AHORA SÍ: rechazado sin número, CON su motivo, se puede escribir.
  UPDATE documentos_fiscales
     SET estado='no_autorizada',
         motivo_rechazo='cinturon: ensayo de rechazo sin numero'
   WHERE id = v_id;
  RAISE NOTICE 'cinturon ① OK · no_autorizada sin número se pudo escribir';

  -- ② 🔴 EL ROJO QUE NO SE DEBE PERDER: una AUTORIZADA sin número sigue siendo
  --    imposible. Si esto pasara, el CHECK se aflojó de más.
  BEGIN
    UPDATE documentos_fiscales SET estado='autorizada' WHERE id = v_id;
    v_ok := true;
  EXCEPTION WHEN check_violation THEN v_ok := false;
  END;
  IF v_ok THEN
    RAISE EXCEPTION 'cinturon 🔴: una AUTORIZADA sin número pasó. El CHECK se aflojó de más.';
  END IF;
  RAISE NOTICE 'cinturon ② OK · autorizada sin número SIGUE rebotando (rojo probado)';

  -- Se deshace el ensayo: el documento vuelve a emitiendo para que el barrido
  -- lo tome y escriba el motivo REAL de Factuplan, que es lo que hace falta.
  UPDATE documentos_fiscales SET estado='emitiendo', motivo_rechazo=NULL WHERE id = v_id;
END $cint$;
