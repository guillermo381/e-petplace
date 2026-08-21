-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-B · EL COMPROBANTE DE PAGO NO SE DIFIERE POR TECHO                 ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101b-REVERSA-20260821150000.sql ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ 🔴 MEDIDO EN EL GATE DEL FOUNDER (20-ago) ═════════════════════════════
--
-- El pago cerró, la pantalla pasó sola, **y el correo no llegó.** Causa, con su
-- literal de la fila:
--
--     gate_que_corto: "diferida_techo"   ·   estado: diferida
--
-- Medido: categoría `operacion`, **techo 20 en 24 h**, y el founder tenía
-- **20 de 20** — mis compras de prueba del día lo agotaron.
--
-- ⇒ **El techo hizo exactamente su trabajo.** Lo que estaba mal es que el
--   comprobante estuviera sujeto a él.
--
-- ═══ LA DECISIÓN, y por qué no es un parche de gate ════════════════════════
--
-- **Un comprobante de pago no es una notificación: es el respaldo de una
-- transacción.** El techo existe para que la app no sature a una familia con
-- avisos —*avisar todo enseña a ignorar los avisos*, `MODELO_DESPENSA` §5— y esa
-- razón **no aplica a un comprobante**: nadie compra diez veces en un día por
-- error, y si lo hace, **cada compra necesita su respaldo**.
--
-- 🔴 Y hay una razón más dura que la de producto: **es requisito de
--    certificación de Nuvei** (literal de Erick). *Un requisito no se somete a
--    un techo de frecuencia, por la misma razón por la que no se somete al
--    selector de canal.*
--
-- ⇒ Se declara **como DATO del catálogo**, igual que `canal_forzado`: para que
--   se pueda ver qué tipos son inmunes al techo mirando una tabla, en vez de
--   descubrirlo leyendo una función.

ALTER TABLE public.cat_notificacion_tipos
  ADD COLUMN IF NOT EXISTS ignora_techo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cat_notificacion_tipos.ignora_techo IS
  'S101-B: el tipo NO se difiere por el techo de su categoría. Solo para lo que '
  'es RESPALDO de un hecho (comprobantes), jamás para avisos: el techo existe '
  'porque avisar todo enseña a ignorar los avisos.';

UPDATE public.cat_notificacion_tipos SET ignora_techo = true WHERE codigo = 'pago_confirmado';

DO $$
DECLARE v_n int;
BEGIN
  -- 🔴 EL DISCRIMINADOR: que sea la EXCEPCIÓN y no la regla. Si algún día la
  --    mitad del catálogo ignora el techo, el techo dejó de existir.
  SELECT count(*) INTO v_n FROM cat_notificacion_tipos WHERE ignora_techo;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURON: % tipos ignoran el techo (debe ser 1: el comprobante)', v_n;
  END IF;
  RAISE NOTICE 'cinturon verde: solo el comprobante es inmune al techo';
END $$;
