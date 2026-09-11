-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL REGISTRO DE QUÉ SE DESPLEGÓ — para que la pregunta tenga
--          respuesta EXACTA y no un proxy
--
-- 🔴 LA PREGUNTA QUE TIENE QUE RESPONDER (`L-536`): ¿la edge que está corriendo
--    es la del repo? Sin esto sólo se puede comparar FECHAS —despliegue contra
--    último commit— y eso tiene un falso positivo estructural: **el orden normal
--    de la casa es desplegar, verificar y recién commitear**, así que un commit
--    posterior al despliegue es lo NORMAL, no un atraso.
--    Medido sobre las 47 desplegadas: 18 con menos de una hora de «atraso» (el
--    commit de después) y 22 con más de siete horas. *El hueco entre 0,7 h y
--    7,6 h separa dos cosas distintas, y un umbral de tiempo las adivina.*
--
-- LO QUE ESTO GUARDA es la FIRMA del contenido que se desplegó: el sha256 del
-- conjunto de archivos que componen la función (su `index.ts` más los `_shared`
-- que importa, transitivamente). Comparar esa firma contra la de hoy no es un
-- proxy: es la misma pregunta, respondida.
--
-- ⚠️ Y su límite, declarado: esto registra lo que el DESPLEGADOR dice haber
--    subido. No es el hash del bundle de la plataforma —ése no se puede
--    reproducir acá— así que un despliegue hecho por fuera del script no queda
--    registrado y el gate cae, para esa función, al heurístico de tiempos y lo
--    DICE. *Un gate que no distingue lo que midió exacto de lo que estimó
--    convierte las dos cosas en la peor de las dos.*
--
-- 76(g) — VEDA: NO RIGE (tabla nueva vacía).
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.edge_despliegues (
  slug           text PRIMARY KEY,
  firma          text NOT NULL,      -- sha256 del conjunto de archivos desplegado
  archivos       integer NOT NULL,   -- cuántos entraron en la firma
  git_head       text,               -- el HEAD del árbol que desplegó
  arbol_limpio   boolean,            -- 🔴 si era false, la firma NO representa un commit
  desplegado_por text,
  desplegado_en  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.edge_despliegues IS
  'Que contenido se desplego de cada edge function. Existe para que '
  '«¿la que corre es la del repo?» tenga respuesta EXACTA y no un proxy de fechas. '
  'Lo escribe scripts/edge-desplegar.mjs; un deploy por fuera no queda registrado.';
COMMENT ON COLUMN public.edge_despliegues.arbol_limpio IS
  'Si es false, se desplego codigo sin commitear: la firma es real pero NO '
  'corresponde a ningun commit, y eso hay que poder verlo despues.';

ALTER TABLE public.edge_despliegues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS edge_despliegues_lectura ON public.edge_despliegues;
CREATE POLICY edge_despliegues_lectura ON public.edge_despliegues
  FOR SELECT TO authenticated USING (public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.edge_despliegues FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.edge_despliegues TO authenticated, service_role;
GRANT INSERT, UPDATE ON public.edge_despliegues TO service_role;
