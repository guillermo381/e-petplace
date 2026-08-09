-- REVERSA de `20260808130000_s91a_regrant_cuenta_comercial_id.sql`
-- ESCRITA ANTES DE APLICAR.
--
-- ⚠️ LA NOTA QUE IMPORTA: revertir esto **VUELVE A ROMPER OCHO POLICIES** y deja
-- a todos los titulares sin poder abrir «Tu negocio», y al veterinario sin poder
-- abrir un caso clínico. No es una reversa neutra: restaura un estado MEDIDO
-- COMO ROTO (42501 «permission denied for table prestadores», reproducido por
-- camino real con la sesión de demo-prestador el 8-ago-2026).
--
-- Solo tiene sentido correrla acompañada de la cura alternativa: mover el
-- EXISTS de las ocho policies a helpers SECURITY DEFINER (propuesta de C). Sin
-- eso, revertir es re-introducir el incidente.

BEGIN;

REVOKE SELECT (cuenta_comercial_id) ON public.prestadores FROM authenticated;

COMMIT;
