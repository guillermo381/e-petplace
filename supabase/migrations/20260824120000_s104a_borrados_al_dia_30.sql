-- ═══════════════════════════════════════════════════════════════════════════
-- S104-A · LOS BORRADOS DEL DÍA 30 — los dos que bloquean publicar los legales
-- `POLITICA-PRIVACIDAD-APP §18` (publicada) · P15 cl.6(d) (firmada 24-ago)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── 🔴 LO QUE LA MEDICIÓN CORRIGIÓ DEL PLAN, Y ACHICA EL ALCANCE ──────────
-- El plan decía **«objetos del bucket `{uid}/` borrados de verdad»**. Medido,
-- eso es **más chico de lo que suena**, y confundirlo habría borrado cosas que
-- la letra manda conservar:
--
--   · `avatars` → path `{USER_ID}/…`  ⇒ **sí es del que se va.**
--   · `mascotas` → path `{MASCOTA_ID}/…` ⇒ **NO es suyo: es de la MASCOTA.**
--   · `cita-archivos`, `grooming-archivos`, `adiestramiento-clips` → se atan
--     por `evento_archivo_adjunto`, no por prefijo de uid.
--
-- ⚠️ **Y §18 no lista la foto de la mascota entre lo que se borra.** Lo que
-- lista es *«Fotografía de perfil y archivos personales»*, *«Imagen del carnet
-- de vacunas»* y *«Fotografías y videos de atenciones»*. La foto de la mascota
-- pertenece al **expediente**, que §18 conserva *«vida del animal más 5 años,
-- seudonimizado»* y que §19.4 defiende con su razón: **«la mascota puede
-- cambiar de familia y su historia le pertenece a ella»**.
--
-- ⇒ *Un barrido por `{uid}/` a secas habría sonado correcto, habría pasado
-- cualquier revisión de código, y habría borrado el expediente visual de una
-- mascota que sigue viva con otra familia.* **El prefijo del path no dice de
-- quién es el archivo: eso se lee de la tabla que lo ata.**
--
-- ── EL BORDE DE LAS FOTOS DE ATENCIÓN, DECLARADO ─────────────────────────
-- Las sube **el prestador**, no la familia. §18 dice *«hasta el cierre de la
-- cuenta más 30 días»* — la cuenta de quien lee, o sea la familia.
-- **Pero si la mascota tiene otra familia vigente, su expediente sigue vivo.**
-- ⇒ **solo se borran las de mascotas cuya ÚNICA familia era la que cierra.**
-- *Lo contrario le borraría a una familia las fotos de las atenciones de una
-- mascota que ahora es de otra.*
--
-- ── CÓMO SE BORRA: por la cola que ya existe, no por una nueva ────────────
-- `storage_borrado_pendiente` + la edge `barrer-storage` (D-731, S92) ya
-- corren por cron con reintento y vista de atascados. **Se reusa.** *Postgres
-- no puede borrar el blob —`storage.protect_delete` lo rebota—, así que el
-- encolado es el único camino, y es el mismo que ya se probó.*
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.ejecutar_cierres_vencidos()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_vivo     text;
  v_n        int := 0;
  v_encolados int := 0;
  r          record;
begin
  select valor into v_vivo from public.app_config where clave = 'cierre_cuenta_vivo';
  if coalesce(v_vivo, 'false') <> 'true' then
    return jsonb_build_object('ok', true, 'resultado', 'cierre_apagado');
  end if;

  for r in
    select user_id from public.cierre_cuenta
     where estado = 'programado' and programado_para <= now()
     for update skip locked
  loop
    -- ── ① lo terminal de auth (firma founder 24-ago: al día 30, NO al día 1) ──
    -- *Retirar las identidades el primer día dejaría a quien entra con Google
    --  sin ninguna forma de ejercer los 30 días que §19.2 le promete.*
    delete from auth.identities where user_id = r.user_id;
    delete from auth.sessions   where user_id = r.user_id;

    update auth.users
       set email = 'cerrada+' || r.user_id::text || '@epetplace.invalid',
           phone = null,
           raw_user_meta_data = '{}'::jsonb
     where id = r.user_id;

    -- ── ② el perfil, SEUDONIMIZADO (§19.5) ────────────────────────────────
    update public.profiles
       set nombre = null, telefono = null, avatar_url = null, email = null
     where id = r.user_id;

    -- ── ③ FOTO DE PERFIL Y ARCHIVOS PERSONALES (§18) ──────────────────────
    -- El único bucket donde el prefijo del path ES el uid. Medido.
    insert into public.storage_borrado_pendiente (bucket, objeto, origen)
    select 'avatars', o.name, 'cierre_cuenta'
      from storage.objects o
     where o.bucket_id = 'avatars'
       and o.name like r.user_id::text || '/%'
    on conflict (bucket, objeto) where estado = 'pendiente' do nothing;
    get diagnostics v_encolados = row_count;

    -- ── ④ LA IMAGEN DEL CARNET DE VACUNAS (§18: «se elimina al cerrarse») ─
    -- 🔴 Y la consecuencia que la pantalla DICE antes de confirmar: la imagen
    -- **se reproduce en las impresiones que la familia ya generó** ⇒ borrarla
    -- **deja esas impresiones sin ella**. *Es lo correcto, y quien cierra tiene
    -- que enterarse ANTES, no después.*
    -- Solo de mascotas cuya única familia era la que cierra — ver el borde.
    insert into public.storage_borrado_pendiente (bucket, objeto, origen)
    select 'mascotas', ev.archivo_url, 'cierre_cuenta_carnet'
      from public.evento_vacuna_aplicada ev
      join public.eventos e on e.id = ev.evento_id
      join public.mascotas m on m.id = e.mascota_id
     where ev.archivo_url is not null
       and btrim(ev.archivo_url) <> ''
       and exists (
         select 1 from public.familia_miembro fm
          where fm.familia_id = m.familia_id and fm.user_id = r.user_id and fm.hasta is null
       )
       and not exists (
         select 1 from public.familia_miembro otros
          where otros.familia_id = m.familia_id
            and otros.user_id is distinct from r.user_id
            and otros.hasta is null
       )
    on conflict (bucket, objeto) where estado = 'pendiente' do nothing;

    -- ── ⑤ FOTOS Y VIDEOS DE ATENCIONES (§18: cierre + 30 días) ────────────
    -- Se atan por `evento_archivo_adjunto`, que declara su propio bucket y su
    -- path. **No se adivina el bucket: lo dice la fila.**
    insert into public.storage_borrado_pendiente (bucket, objeto, origen)
    select a.bucket, a.storage_path, 'cierre_cuenta_atencion'
      from public.evento_archivo_adjunto a
      join public.mascotas m on m.id = a.mascota_id
     where a.storage_path is not null
       and btrim(a.storage_path) <> ''
       and exists (
         select 1 from public.familia_miembro fm
          where fm.familia_id = m.familia_id and fm.user_id = r.user_id and fm.hasta is null
       )
       and not exists (
         select 1 from public.familia_miembro otros
          where otros.familia_id = m.familia_id
            and otros.user_id is distinct from r.user_id
            and otros.hasta is null
       )
    on conflict (bucket, objeto) where estado = 'pendiente' do nothing;

    update public.cierre_cuenta
       set estado = 'ejecutado', ejecutado_en = now()
     where user_id = r.user_id;

    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('ok', true, 'ejecutados', v_n);
end;
$$;

revoke all on function public.ejecutar_cierres_vencidos() from public, anon, authenticated;

comment on function public.ejecutar_cierres_vencidos() is
  'El reloj del día 30. Nace INERTE (app_config.cierre_cuenta_vivo). Encola en '
  'storage_borrado_pendiente los TRES conjuntos que §18 manda borrar: foto de '
  'perfil, imagen del carnet y fotos/videos de atenciones. NO borra la foto de '
  'la mascota: pertenece al expediente, que §19.4 conserva porque «la mascota '
  'puede cambiar de familia y su historia le pertenece a ella».';
