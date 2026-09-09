-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · `validar_origen_evento` apuntaba a una LÁPIDA — va antes de A6
--
-- 🔴 EL ROJO, PROBADO ESCRIBIENDO Y CON SU CONTROL POSITIVO (7-sep-2026):
--
--   | sonda                              | veredicto |
--   |------------------------------------|-----------|
--   | `estadia` con un id REAL           | 🔴 REBOTA — «no existe en la tabla correspondiente» |
--   | `estadia` con un uuid inventado    | rebota (correcto) |
--   | `cita` con un id REAL              | **ENTRA** ← control positivo |
--
--   El `cita` entrando es lo que prueba que el rebote de `estadia` **es del
--   apuntado y no de que la sonda no sepa insertar**. Sin ese tercer caso, los
--   dos rebotes se leerían como «el validador funciona».
--
-- LA CAUSA: el `WHEN 'estadia'` valida contra `estadias`, que es
--   ☠️ **LÁPIDA (S107-A, 28-ago-2026) · «tabla del legado, semántica de NOCHES» · 0 filas**
-- mientras la que la letra firma es
--   **`guarderia_estadias` · «una estadía = UN animal, UN día» · 96 filas · 0 ids en común.**
--
-- ⇒ **Ningún evento económico de guardería podía escribirse.** El productor de
--    A6 habría fallado en ejecución —no en gate, no en compilación— y su modo
--    de falla es exactamente el que §6 de `LETRA_POSTVENTA` existe para cerrar:
--    sin evento, la pregunta «¿este objeto tiene devengo?» contesta NO, y la
--    devolución se declara sobre el pago mientras el prestador conserva su
--    devengo. **Plata, en silencio.**
--
-- ⚠️ Y CÓMO CASI NO SE ENCUENTRA: el censo de adenda 3 preguntó por
--    `pg_constraint` con `contype='c'` y devolvió «NINGUNO», de donde salía
--    que `origen_tipo` estaba abierto. **Estaba cerrado** — la ley vivía en un
--    TRIGGER. *Un instrumento que pregunta por la FORMA en que la ley suele
--    escribirse no mide la ley* (`L-514`).
--
-- LO QUE **NO** HACE FALTA, y por eso no se construye: `cat_origen_evento`. El
-- vocabulario ya existe y es MÁS fuerte que un CHECK — valida existencia, no
-- sólo el string. Agregar un catálogo al lado sería una segunda fuente para la
-- misma ley.
--
-- LOS 36 EVENTOS VIVOS SON `cita` Y QUEDAN COMO ESTÁN. Migrar no aplica: no
-- hay una sola fila con `estadia`.
--
-- VEDA 76(g): NO RIGE — CREATE OR REPLACE de una función; cero datos tocados.
-- REVERSA: `docs/relevamientos/S114-A-REVERSA-20260911620000-origen-estadia.sql`
--          (escrita ANTES, y **declara que repone un defecto probado**).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.validar_origen_evento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'   -- D-708: no lo tenía
AS $function$
DECLARE v_existe boolean;
BEGIN
  CASE NEW.origen_tipo
    WHEN 'pedido' THEN
      SELECT EXISTS(SELECT 1 FROM pedidos WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'cita' THEN
      SELECT EXISTS(SELECT 1 FROM evento_cita_servicio WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'donacion' THEN
      v_existe := true;
    WHEN 'producto_comercial' THEN
      SELECT EXISTS(SELECT 1 FROM productos_comerciales WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'suscripcion' THEN
      SELECT EXISTS(SELECT 1 FROM suscripciones WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'bono' THEN
      SELECT EXISTS(SELECT 1 FROM bonos WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'estadia' THEN
      /* 🔴 `guarderia_estadias`, NO `estadias`.
         `estadias` es la LÁPIDA de S107 (0 filas, semántica de NOCHES); la
         estadía que la letra firma —«un animal, un día», 1:1 con su cita— vive
         en `guarderia_estadias`. **Y este es el ancla que §8 fija por firma del
         founder (enmienda ②): el evento de guardería cuelga de la ESTADÍA,
         jamás de su cita**, porque §6 le pregunta AL OBJETO si tiene devengo y
         con dos anclas esa pregunta tiene dos respuestas. */
      SELECT EXISTS(SELECT 1 FROM guarderia_estadias WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'ajuste_manual' THEN
      v_existe := true;
    WHEN 'evento_diferido' THEN
      SELECT EXISTS(SELECT 1 FROM eventos_economicos WHERE id = NEW.origen_id) INTO v_existe;
    ELSE
      RAISE EXCEPTION 'origen_tipo "%" no es un tipo válido. Valores aceptados: pedido, cita, donacion, producto_comercial, suscripcion, bono, estadia, ajuste_manual, evento_diferido', NEW.origen_tipo;
  END CASE;

  IF NOT v_existe THEN
    RAISE EXCEPTION 'origen_tipo=% con origen_id=% no existe en la tabla correspondiente',
      NEW.origen_tipo, NEW.origen_id;
  END IF;
  RETURN NEW;
END; $function$;

-- ── CINTURÓN · el mismo cuadro del rojo, ahora en verde ────────────────────
DO $cinturon$
DECLARE v_est uuid; v_cit uuid; v_ok boolean;
BEGIN
  SELECT id INTO v_est FROM guarderia_estadias LIMIT 1;
  SELECT id INTO v_cit FROM evento_cita_servicio LIMIT 1;
  IF v_est IS NULL OR v_cit IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: sin estadía o sin cita reales, el arnés no puede discriminar';
  END IF;

  -- ① una estadía REAL tiene que ENTRAR (era el rojo)
  BEGIN
    INSERT INTO eventos_economicos (tipo_evento, revenue_stream, country_code, moneda,
      monto_bruto, monto_kushki_fee, monto_plataforma, origen_tipo, origen_id, fecha_devengo, estado)
    VALUES ('cita_pagada','transaccional','EC','USD',1.00,0,0.10,'estadia',v_est,now(),'no_aplica');
    v_ok := true;
    RAISE EXCEPTION 'ROLLBACK_SONDA';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'ROLLBACK_SONDA' THEN
      RAISE EXCEPTION 'CINTURÓN: una estadía REAL sigue rebotando — %', SQLERRM;
    END IF;
  END;

  -- ② CONTRA-CASO: una estadía inventada tiene que SEGUIR rebotando. Sin esto,
  --    «sacar la validación» pasaría el arnés de arriba.
  BEGIN
    INSERT INTO eventos_economicos (tipo_evento, revenue_stream, country_code, moneda,
      monto_bruto, monto_kushki_fee, monto_plataforma, origen_tipo, origen_id, fecha_devengo, estado)
    VALUES ('cita_pagada','transaccional','EC','USD',1.00,0,0.10,'estadia',gen_random_uuid(),now(),'no_aplica');
    RAISE EXCEPTION 'CINTURÓN: una estadía INVENTADA entró — la validación se perdió';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'CINTURÓN%' THEN RAISE; END IF;
  END;

  -- ③ el vocabulario sigue cerrado
  BEGIN
    INSERT INTO eventos_economicos (tipo_evento, revenue_stream, country_code, moneda,
      monto_bruto, monto_kushki_fee, monto_plataforma, origen_tipo, origen_id, fecha_devengo, estado)
    VALUES ('cita_pagada','transaccional','EC','USD',1.00,0,0.10,'guarderia_estadia',v_est,now(),'no_aplica');
    RAISE EXCEPTION 'CINTURÓN: un origen_tipo inventado entró';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'CINTURÓN%' THEN RAISE; END IF;
  END;

  -- residuo 0
  IF EXISTS (SELECT 1 FROM eventos_economicos WHERE origen_tipo='estadia') THEN
    RAISE EXCEPTION 'CINTURÓN: la sonda dejó residuo';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · estadía REAL entra · inventada rebota · vocabulario cerrado · residuo 0';
END $cinturon$;
