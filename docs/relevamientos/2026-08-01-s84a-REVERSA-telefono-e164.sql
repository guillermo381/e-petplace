-- REVERSA de `20260801120000_s84_telefono_e164.sql` (S84-A1)
-- Escrita ANTES de aplicar, como manda la casa.
--
-- ⚠️ LO QUE ESTA REVERSA **NO** DEVUELVE — se declara para que nadie la
-- corra creyendo que restaura el estado anterior:
--
--   Los VALORES borrados NO VUELVEN. La migración vacía `telefono` y
--   `whatsapp` por licencia explícita del founder (1-ago-2026: "es data
--   de prueba y legacy, DESCARTABLE"). Revertir el CÓDIGO no revierte
--   los DATOS — es el mismo caveat que la reversa de S77.
--
--   Los siete valores que había al momento de aplicar, POR SI ALGUIEN
--   los quiere de vuelta a mano (medidos, no recordados):
--     2052f109-143a-41d1-b338-de8973d8fb20  whatsapp = '573208408790'
--     5e53c898-2c6d-4061-a1a6-84b58dcdd524  whatsapp = ''
--     8026077e-f96f-4127-9597-8f4b2646a1b2  whatsapp = ''
--     d73347ba-bb89-40c9-b51e-90cd242bf802  whatsapp = '593987654321'
--     de300000-0000-4000-8000-0000000000e5  whatsapp = '3208408790'
--     de580000-0000-4000-8000-0000000000b1  whatsapp = '593999000558'
--     de680000-0000-4000-8000-0000000000e5  whatsapp = '593999000668'
--   `telefono` estaba en NULL en las SIETE filas — no hay nada que
--   restaurar de esa columna.
--
--   Nótese que NINGUNO de esos valores pasaría el CHECK que la migración
--   instala: los cinco con dato están en E.164 **sin '+'** (regla 28 del
--   CONTRATO, hoy enmendada) y uno de ellos (`3208408790`) ni siquiera
--   trae indicativo. Restaurarlos exige quitar el CHECK primero — que es
--   exactamente lo que hace este archivo.

-- ⚠️ ENMENDADA TRAS EL FRENO (mismo día): la migración NO se aplicó.
-- Su intento reveló que existen DOS guards previos que prohíben el '+'
-- (`prestadores_telefono_sin_plus` / `prestadores_whatsapp_sin_plus` —
-- la regla 28 cableada). La migración, cuando se firme D-613, va a tener
-- que DROPearlos; por lo tanto **esta reversa tiene que RESTITUIRLOS**, o
-- revertir dejaría la tabla sin ningún guard de formato en absoluto —
-- peor que el estado inicial y en silencio.
--
-- Sus definiciones, LITERALES (de `pg_get_constraintdef`, para que la
-- restitución no dependa de que alguien las recuerde):
--   telefono IS NULL OR telefono !~ '^\+'
--   whatsapp IS NULL OR whatsapp !~ '^\+'

BEGIN;

-- ① quitar los guards que la migración habría instalado
ALTER TABLE public.prestadores DROP CONSTRAINT IF EXISTS chk_prestadores_telefono_e164;
ALTER TABLE public.prestadores DROP CONSTRAINT IF EXISTS chk_prestadores_whatsapp_e164;

-- ② RESTITUIR los que la migración habría dropeado (regla 28)
--    Nótese: si algún dato con '+' quedó escrito, esto ABORTA — y está
--    bien que aborte: significa que hay datos que la regla 28 no admite
--    y que revertir a ciegas los habría dejado ilegales en silencio.
ALTER TABLE public.prestadores
  ADD CONSTRAINT prestadores_telefono_sin_plus
  CHECK ((telefono IS NULL) OR (telefono !~ '^\+'));

ALTER TABLE public.prestadores
  ADD CONSTRAINT prestadores_whatsapp_sin_plus
  CHECK ((whatsapp IS NULL) OR (whatsapp !~ '^\+'));

COMMIT;
