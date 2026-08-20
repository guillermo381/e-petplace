-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-B · EL COMPROBANTE VA POR CORREO, Y NO LO DECIDE EL SELECTOR       ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101b-REVERSA-20260821130000.sql ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ 🔴 EL PORQUÉ — LITERAL DE ERICK (Nuvei, 20-ago) ════════════════════════
--
--   «El diseño queda a su criterio pero necesitamos que ese correo adjunte
--    esos 2 códigos.»
--
-- El id de transacción y el código de autorización, **en un CORREO**. Es
-- **requisito de certificación**, no preferencia de la persona.
--
-- **Medido en el primer circuito real:** el comprobante salió con
-- `canal_elegido = "push"`, porque el selector toma el primer canal habilitado
-- con transporte vivo por `orden`. **Nada falló** — *salió por un canal que no
-- cumple el requisito, y un verde que cumple otra cosa es peor que un rojo.*
--
-- ⇒ **Un requisito no se somete al selector de canal.** Se declara como DATO del
--   catálogo —no como excepción escondida en el código del elector— para que
--   cualquiera pueda ver cuáles tipos tienen canal obligatorio mirando una tabla.
--
-- 🔴 Y el límite, escrito: **push e in_app pueden ACOMPAÑAR, jamás sustituir.**
--   Esto fija el canal que TIENE que salir; no prohíbe los demás.

ALTER TABLE public.cat_notificacion_tipos
  ADD COLUMN IF NOT EXISTS canal_forzado text
  REFERENCES public.cat_notificacion_canales(codigo);

COMMENT ON COLUMN public.cat_notificacion_tipos.canal_forzado IS
  'S101-B: canal OBLIGATORIO para este tipo, por encima del selector. Se usa '
  'cuando el canal es un REQUISITO (certificación, legal), no una preferencia. '
  'push/in_app pueden acompañar; nunca sustituir.';

UPDATE public.cat_notificacion_tipos
   SET canal_forzado = 'email'
 WHERE codigo = 'pago_confirmado';
