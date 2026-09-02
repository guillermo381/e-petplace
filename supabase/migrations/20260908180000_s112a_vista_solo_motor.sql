/* ═══════════════════════════════════════════════════════════════════════════
   S112-A2h · LA VENTANA PUBLICA DEJA DE SER API, TAMBIEN PARA LOS LOGUEADOS
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Un REVOKE.

   A2b le saco el `SELECT` a `anon` con este argumento: *la vista no es una API
   publica, es el detalle de implementacion de los dos lectores.* E lo nombro
   sin empujar, y tenia razon: **el mismo argumento aplica igual a un usuario
   logueado**, que tambien saltea la paginacion, el tope de 50 y la lista blanca
   de filtros. Que exija cuenta lo hace menos grave, no distinto.

   Medido antes de revocar: **cero consumidores** de `v_adoptables_publicos` en
   `apps/` y `packages/` — las pantallas van por `obtener_adoptables` y
   `obtener_adoptable`, que son DEFINER y siguen leyendola.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
REVOKE SELECT ON public.v_adoptables_publicos FROM authenticated;

DO $cint$
BEGIN
  IF has_table_privilege('authenticated','public.v_adoptables_publicos','SELECT')
     OR has_table_privilege('anon','public.v_adoptables_publicos','SELECT') THEN
    RAISE EXCEPTION 'CINTURON ROJO: la vista sigue siendo alcanzable directo';
  END IF;
  /* CONTROL POSITIVO PRIMERO (enunciado de E): los lectores siguen leyendo. */
  PERFORM public.obtener_adoptables('{}'::jsonb, NULL, 3);
  IF NOT has_function_privilege('anon','public.obtener_adoptables(jsonb,text,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON ROJO: la vidriera quedo cerrada';
  END IF;
  RAISE NOTICE 'CINTURON A2h: 2 brazos verdes';
END $cint$;
COMMIT;
