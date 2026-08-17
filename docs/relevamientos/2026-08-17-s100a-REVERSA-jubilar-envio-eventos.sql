-- REVERSA de `20260820020000_s100a_jubilar_envio_eventos.sql`
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ── QUÉ DESHACE ──────────────────────────────────────────────────────────────
-- Recrea `envio_eventos` con su forma, su FK, su RLS y su policy de INSERT.
--
-- ── 🔴 QUÉ **NO** DESHACE ────────────────────────────────────────────────────
-- **No devuelve datos, porque no había ninguno.** Medido al jubilarla:
-- **0 filas** y **CERO funciones que insertaran en ella** en todas las
-- migraciones del repo. Revertir no recupera nada: vuelve a poner de pie la
-- misma trampa — una tabla con policy y grants, sin un solo escritor, que el
-- próximo lector va a tomar por una capacidad viva y cuyo instrumento va a dar
-- verde porque una lista vacía es un estado legal.
--
-- ⚠️ Si algún día se revierte, **no se revierte sola**: hay que construirle el
-- productor EN EL MISMO ACTO. Una tabla de eventos sin quien los escriba es lo
-- que esta migración vino a sacar.

BEGIN;

CREATE TABLE IF NOT EXISTS public.envio_eventos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_id    uuid NOT NULL REFERENCES public.envios(id) ON DELETE CASCADE,
  ocurrido_en timestamptz NOT NULL DEFAULT now(),
  descripcion text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.envio_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY envio_eventos_insert ON public.envio_eventos
  FOR INSERT TO authenticated WITH CHECK (true);

COMMIT;
