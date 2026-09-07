-- REVERSA de 20260910320000 — la bóveda cierra sus tres huecos
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:
--
-- ① `archivo_estado` se borra CON SUS DATOS. Si para entonces algún papel
--    está marcado `ausente`, esa verificación se pierde y el papel vuelve a
--    parecer completo. *Revertir no devuelve el archivo: borra la única
--    columna que decía que faltaba.*
-- ② Volver a abrir `tecleado` en el CHECK **no crea su productor**. La
--    reversa deja el valor expresable otra vez, que es exactamente el estado
--    que esta migración vino a cerrar.
-- ③ Los GRANTS se reponen tal cual estaban (INSERT/UPDATE/DELETE/TRUNCATE/
--    REFERENCES/TRIGGER a `authenticated`). **Eso REABRE la superficie**: hoy
--    la RLS los frena por ausencia de policy, pero un `CREATE POLICY` futuro
--    los volvería efectivos sin que nadie lo note.

begin;

-- ③ reponer los grants (reabre superficie — ver nota)
grant insert, update, delete, truncate, references, trigger
  on public.papeles_familia, public.papel_valor to authenticated;

-- ② volver a admitir 'tecleado' sin productor
-- (eran DOS: el original de la tabla lo dropeó la migración; se repone con SU
--  nombre, para que un futuro `drop ... papeles_familia_modo_captura_check`
--  siga encontrándolo donde lo dejó la casa)
alter table public.papeles_familia drop constraint if exists chk_papeles_modo_captura;
alter table public.papeles_familia add constraint papeles_familia_modo_captura_check
  check (modo_captura in ('tecleado','extraido_por_ia'));

-- ① borrar la columna del estado del adjunto (pierde los 'ausente')
alter table public.papeles_familia drop column if exists archivo_estado;

commit;
