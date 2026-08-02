-- REVERSA de `20260802200000_s84_promocion_e164.sql` (S84-A9 b)
-- Escrita ANTES de aplicar.
--
-- ⚠️ **ESTA REVERSA NO ES SIMÉTRICA, y hay que saberlo antes de correrla.**
--
-- La migración antepuso `+` a valores que YA traían su indicativo. Quitar
-- el `+` devuelve el string exacto de antes — eso sí es reversible. **Lo
-- que NO vuelve es el estado del CONSTRAINT**: si el `VALIDATE CONSTRAINT`
-- alcanzó a correr en verde, el constraint quedó VALIDADO, y revertir los
-- datos lo dejaría validado sobre filas que ya no cumplen. Por eso esta
-- reversa **lo devuelve a NOT VALID explícitamente**.
--
-- Los valores literales al momento de aplicar (medidos, no recordados):
--   2052f109 Satori Latam sas  whatsapp 573208408790  → +573208408790
--   d73347ba Carlos            whatsapp 593987654321  → +593987654321
--   de580000 Wizard            whatsapp 593999000558  → +593999000558
--   de680000 Clínica Aurora    whatsapp 593999000668  → +593999000668
--   de300000 Paseos Andres     whatsapp 3208408790    → **NO TOCADA**
--     (no empieza con ningún prefijo del catálogo: la regla la excluye por
--      su forma, no por una excepción escrita a mano)
--   `telefono` estaba NULL en las siete: no hubo nada que promover.

BEGIN;

-- ① volver el constraint a NOT VALID ANTES de tocar datos (si quedó
--    validado, un UPDATE que lo viole abortaría acá y no diría por qué)
ALTER TABLE public.prestadores DROP CONSTRAINT IF EXISTS chk_prestadores_whatsapp_e164;
ALTER TABLE public.prestadores DROP CONSTRAINT IF EXISTS chk_prestadores_telefono_e164;

ALTER TABLE public.prestadores
  ADD CONSTRAINT chk_prestadores_telefono_e164
  CHECK (telefono IS NULL OR telefono ~ '^\+[1-9][0-9]{6,14}$') NOT VALID;
ALTER TABLE public.prestadores
  ADD CONSTRAINT chk_prestadores_whatsapp_e164
  CHECK (whatsapp = '' OR whatsapp ~ '^\+[1-9][0-9]{6,14}$') NOT VALID;

-- ② quitar el '+' a lo que la migración promovió
UPDATE public.prestadores
   SET whatsapp = substring(whatsapp from 2)
 WHERE whatsapp IN ('+573208408790','+593987654321','+593999000558','+593999000668');

COMMIT;
