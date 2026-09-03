-- REVERSA de 20260908720000 · `adopcion_mensaje` sale de la publicación de
-- realtime. El chat vuelve al sondeo de 5 s en foco (la alternativa que la
-- dirección §2.4 ya declara). Sin datos que perder.
ALTER PUBLICATION supabase_realtime DROP TABLE public.adopcion_mensaje;
