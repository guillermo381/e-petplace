-- ============================================================================
-- S113-A · DOS UNICIDADES SOBRE LA MISMA TABLA, Y EL `ON CONFLICT` DECLARABA UNA
--
-- 🔴 EL ROJO, con datos reales: al firmarse las 22 reglas, Thor quedó con DOS
-- anticipaciones válidas el mismo día (cadera y respiración). La segunda chocó
-- con `uq_avisos_coach_uno_por_tipo_por_dia` —el índice de los avisos
-- DIARIOS— y el `on conflict (mascota_id, clave)` no lo cubría:
--   `duplicate key value violates unique constraint`
-- ⚠️ Y no falló ese aviso: **falló el generador entero**, así que también se
-- perdían las vacunas y las citas de mañana de todas las familias.
--
-- **La causa es de diseño mío**: agregué una segunda unicidad
-- —`(mascota_id, clave)`, para lo que se dice una vez en la vida— sin acotar
-- la primera, que sigue midiendo `(mascota, tipo, fecha)`. *Dos índices únicos
-- sobre la misma fila y un `ON CONFLICT` que sólo puede nombrar uno: el otro
-- no se reintenta, explota.* Es `L-492` en mi propio código, dos días después
-- de escribirla.
--
-- La cura: el índice diario pasa a ser **parcial** sobre los avisos que no
-- tienen `clave`. Cada aviso queda bajo **exactamente una** unicidad — la que
-- corresponde a su naturaleza — y ninguna fila cae bajo las dos.
--
-- 76(g): **NO RIGE.** Reemplazo de un índice; los avisos vivos no se tocan.
-- ============================================================================

drop index if exists public.uq_avisos_coach_uno_por_tipo_por_dia;

/* Los avisos DIARIOS (vacuna, antiparasitario, cita de mañana): uno por tipo
   por día. Llevan `clave` NULL. */
create unique index uq_avisos_coach_uno_por_tipo_por_dia
  on public.avisos_coach (mascota_id, tipo, fecha) where clave is null;

do $$
declare v_dia int; v_clave int;
begin
  select count(*) into v_dia from pg_indexes
   where indexname='uq_avisos_coach_uno_por_tipo_por_dia' and indexdef ilike '%clave IS NULL%';
  if v_dia <> 1 then raise exception 'CINTURON: el índice diario no quedó parcial'; end if;

  select count(*) into v_clave from pg_indexes
   where indexname='uq_avisos_coach_por_clave' and indexdef ilike '%clave IS NOT NULL%';
  if v_clave <> 1 then raise exception 'CINTURON: falta el índice por clave'; end if;

  /* El control que importa: **ninguna fila cae bajo las dos**. Los predicados
     son complementarios por construcción, y se verifica en vez de suponerse. */
  raise notice 'CINTURON OK · índices complementarios: `clave IS NULL` y `clave IS NOT NULL`';
end $$;
