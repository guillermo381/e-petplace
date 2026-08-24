-- ============================================================================
-- S104-A · CURA: el trigger de purga habría fallado en la PRIMERA verificación
-- ============================================================================
-- Reversa: la de `20260824030000` + `alter ... set not null` (solo si no hay
-- filas ya purgadas, que es justamente lo que revertir no puede garantizar).
-- 76(g): NO RIGE.
--
-- ── EL DEFECTO, Y ES LA MISMA CLASE QUE ESTA SESIÓN VIENE COBRANDO ──────
-- `20260824030000` puso un trigger que hace `new.archivo_url := null` al
-- concluir la verificación. **`archivo_url` es NOT NULL** ⇒ el UPDATE habría
-- rebotado con `23502` **en la primera aprobación real**, y el documento no se
-- habría podido aprobar.
--
-- **Su cinturón salió VERDE** porque verificó que la columna nueva existiera y
-- que la red naciera apagada — **pero NO ejerció el trigger**. *Es la sexta vez
-- en esta sesión que un cinturón mide lo que está y no lo que corre.* Lo cazó
-- intentar el `update` de verdad, no leer el código.
--
-- ── LA CURA ES LA COLUMNA, NO EL TRIGGER ────────────────────────────────
-- El diseño nuevo dice que **después de verificar NO hay imagen** (§6.2: *«la
-- Compañía no conserva la imagen»*). ⇒ **un `archivo_url` obligatorio expresa
-- una regla que el contrato derogó**: la fila tiene que poder existir sin
-- puntero, porque ése es su estado normal después de la verificación.
-- ============================================================================

begin;

alter table public.prestador_documentos alter column archivo_url drop not null;

comment on column public.prestador_documentos.archivo_url is
  'S104-A · NULLABLE a proposito: tras concluir la verificacion la imagen se '
  'borra (§6.2) y la fila queda SIN puntero. NULL aqui no es un dato faltante: '
  'es el estado correcto de un documento ya verificado.';

do $$
declare v_id uuid; v_estado text; v_ok boolean := false;
begin
  -- 🔴 ESTA VEZ SE EJERCE EL TRIGGER DE VERDAD, en subtransacción que se
  -- deshace sola (L-406): se toma un documento con imagen, se lo mueve a
  -- 'aprobado' y se verifica que (a) no reviente y (b) el puntero quede en NULL
  -- y (c) el objeto quede encolado para borrado.
  select id into v_id from public.prestador_documentos
   where archivo_url is not null and estado is distinct from 'aprobado' limit 1;

  if v_id is null then
    raise notice 'CINTURON: sin fila con imagen para ejercer — se declara NO CONCLUYENTE, jamas verde.';
  else
    begin
      update public.prestador_documentos set estado = 'aprobado' where id = v_id;
      select archivo_url is null into v_ok from public.prestador_documentos where id = v_id;
      if not v_ok then raise exception 'CINTURON: el trigger no limpio el puntero'; end if;
      if not exists (select 1 from public.storage_borrado_pendiente where origen='verificacion_concluida') then
        raise exception 'CINTURON: el trigger no encolo el objeto';
      end if;
      raise exception 'FIXTURE_ROLLBACK';
    exception when others then
      if sqlerrm <> 'FIXTURE_ROLLBACK' then
        raise exception 'CINTURON: el trigger NO CORRE — %', sqlerrm;
      end if;
    end;
    raise notice 'CINTURON VERDE: el trigger CORRIO, limpio el puntero y encolo. Residuo 0 por subtransaccion.';
  end if;
end $$;

commit;
