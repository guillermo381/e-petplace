-- ============================================================================
-- S104-A · D-901 — LA RETENCIÓN DEL DOCUMENTO DE IDENTIDAD, EN DOS MECANISMOS
-- ============================================================================
-- Reversa: docs/relevamientos/2026-08-24-s104a-REVERSA-retencion-documentos.sql
-- 76(g): NO RIGE — DDL + funciones. La columna nueva nace NULL.
--
-- ── LA LECTURA DEL ABOGADO, QUE CAMBIA EL DISEÑO (24-ago-2026) ───────────
-- **Los 90 días son un TECHO, no un período de conservación.** La regla es
-- **borrar la imagen AL COMPLETAR la verificación**; los 90 días solo cubren
-- casos de borde (una verificación que quedó pendiente, un rechazo que el
-- solicitante discute). ⇒ **son DOS mecanismos y no uno**, y confundirlos
-- llevaría a conservar 90 días lo que debería durar minutos.
--
-- ✅ **Y el freno que A había levantado quedó disuelto por esa misma lectura:**
-- se temía que borrar la imagen destruyera la evidencia de idoneidad.
-- **Ninguna norma nos obliga a conservar el soporte** — no somos sujeto
-- obligado de prevención de lavado (bajo el mandato de recaudación, quienes
-- custodian dinero y tienen la obligación de diez años son las pasarelas), y
-- para el SRI el soporte de la relación es el RUC y el registro de aceptación
-- de términos, **no la imagen**.
--
-- ── 🔴 EL DEFECTO REAL, MEDIDO: FALTABA 1 DE LOS 5 DATOS DE §6.2 ────────
-- §6.2 obliga a conservar **tipo · últimos cuatro dígitos · fecha · resultado ·
-- quién verificó**. La tabla tenía cuatro: `tipo`, `revisado_en`, `estado`,
-- `revisado_por`. **Faltaba el identificador parcial** ⇒ *después de borrar la
-- imagen quedaba «se aprobó un título profesional» sin poder decir CUÁL.*
-- **Ése era el defecto, y no la conservación.**
-- ============================================================================

begin;

-- ① EL DATO QUE FALTABA — lo que sostiene la idoneidad cuando la imagen ya no está
alter table public.prestador_documentos
  add column if not exists documento_ultimos4 text
  check (documento_ultimos4 is null or documento_ultimos4 ~ '^[0-9]{4}$');

comment on column public.prestador_documentos.documento_ultimos4 is
  'S104-A/§6.2 · Los ultimos cuatro digitos del documento verificado. Es el '
  'unico de los cinco datos de §6.2 que faltaba, y es el que permite decir QUE '
  'documento se verifico una vez borrada la imagen.';

-- ② MECANISMO NORMAL — la imagen muere al concluir la verificación
create or replace function public._trg_documento_purga_al_verificar()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  -- Solo al CONCLUIR (aprobado o rechazado) y solo si todavía hay imagen.
  if new.estado in ('aprobado','rechazado')
     and new.estado is distinct from old.estado
     and new.archivo_url is not null then
    insert into public.storage_borrado_pendiente (bucket, objeto, origen)
    values ('prestador-documentos', new.archivo_url, 'verificacion_concluida');
    -- 🔴 Se limpia el puntero EN EL MISMO ACTO. Si el borrado del blob fallara
    -- y el puntero quedara, la fila diría que hay una imagen que ya nadie
    -- puede garantizar — y §6.2 promete que no la conservamos.
    new.archivo_url := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_documento_purga_al_verificar on public.prestador_documentos;
create trigger trg_documento_purga_al_verificar
  before update on public.prestador_documentos
  for each row
  execute function public._trg_documento_purga_al_verificar();

-- ③ LA RED — 90 días, para lo que quedó colgado sin resolver
-- **NACE INERTE**: sin la clave `retencion_documentos_viva` en `app_config` no
-- borra nada y lo dice. *El cable se tiende ahora; la llave es del founder.*
create or replace function public.purgar_documentos_vencidos()
returns table (encolados int, motivo text)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_viva boolean; v_n int := 0;
begin
  select coalesce((select valor::boolean from public.app_config where clave='retencion_documentos_viva'), false)
    into v_viva;
  if not v_viva then
    return query select 0, 'retencion_apagada'::text;
    return;
  end if;

  with vencidos as (
    select id, archivo_url from public.prestador_documentos
     where archivo_url is not null and created_at < now() - interval '90 days'
  ), encolar as (
    insert into public.storage_borrado_pendiente (bucket, objeto, origen)
    select 'prestador-documentos', archivo_url, 'techo_90_dias' from vencidos
    returning 1
  )
  select count(*) into v_n from encolar;

  update public.prestador_documentos
     set archivo_url = null
   where archivo_url is not null and created_at < now() - interval '90 days';

  return query select v_n, 'purgado'::text;
end;
$$;

comment on function public.purgar_documentos_vencidos() is
  'S104-A/D-901 · La RED de los 90 dias, no el periodo de conservacion: cubre '
  'lo que quedo colgado sin verificar. 🔴 SEÑAL A VIGILAR: si esta funcion '
  'empieza a borrar la MAYORIA, el flujo se desvio — la verificacion no se esta '
  'completando y el camino normal (②) dejo de correr. Por eso devuelve su '
  'conteo: para que esa señal se pueda leer.';

revoke all on function public.purgar_documentos_vencidos() from public, anon, authenticated;

do $$
declare v_n int;
begin
  select count(*) into v_n from information_schema.columns
   where table_schema='public' and table_name='prestador_documentos' and column_name='documento_ultimos4';
  if v_n <> 1 then raise exception 'CINTURON: falta documento_ultimos4'; end if;

  -- Se EJERCE la red: con la llave apagada tiene que decirlo, no romper.
  perform 1 from public.purgar_documentos_vencidos() where motivo = 'retencion_apagada';
  if not found then
    raise exception 'CINTURON: la red no nace inerte — deberia devolver retencion_apagada';
  end if;

  raise notice 'CINTURON VERDE: columna puesta, y la red CORRE y nace apagada.';
end $$;

commit;
