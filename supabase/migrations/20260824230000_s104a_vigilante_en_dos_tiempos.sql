-- ═══════════════════════════════════════════════════════════════════════════
-- S104-A · EL VIGILANTE, EN DOS TIEMPOS — `pg_net` responde DESPUÉS del commit
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 **DEFECTO DE MI PRIMERA VERSIÓN, y lo encontró su propia corrida.**
--
-- La escribí para **disparar y recolectar en la misma función**, con un
-- `pg_sleep(6)` en el medio. **Midió: `status_code = NULL` en las dos URLs.**
--
-- **Y la causa no es el timing, es estructural:** `pg_net` **encola** la
-- petición y un worker la ejecuta **después del COMMIT**. *Dentro de la misma
-- transacción `net._http_response` no puede tener la respuesta — esperar más no
-- lo arregla, y esperar dentro de la transacción ni siquiera deja al worker
-- avanzar.*
--
-- ✅ **Lo que SÍ funcionó, y es lo que conviene conservar del intento: el modo
-- de falla fue el correcto.** El vigilante **no dijo «todas vivas»**: dijo
-- **`no_concluyente`**, porque su control negativo no había respondido. *Un
-- instrumento que no puede medir y lo declara es un instrumento que sirve; el
-- que en ese caso dice «verde» es el que hace daño.* **El diseño fail-closed se
-- probó solo, y en su primera corrida.**
--
-- ── EL REPARTO ───────────────────────────────────────────────────────────
--   · **`verificar_urls_legales()`** dispara y **anota el `request_id`**.
--   · **`recolectar_urls_legales()`** corre después, completa los status y
--     **emite el veredicto**.
--   · Dos crones separados por minutos. *La asincronía deja de ser un problema
--     cuando se la modela en vez de pelearla.*
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.url_legal_chequeo
  add column if not exists request_id bigint,
  add column if not exists veredicto_en timestamptz;

create index if not exists ix_url_legal_chequeo_pendiente
  on public.url_legal_chequeo (corrida_en) where status_code is null;

-- limpio el intento fallido: sus filas tienen status NULL y no midieron nada.
delete from public.url_legal_chequeo where status_code is null and request_id is null;

-- ── TIEMPO 1 · DISPARAR ───────────────────────────────────────────────────
create or replace function public.verificar_urls_legales()
returns jsonb
language plpgsql
security definer
set search_path = public, net, pg_catalog
as $$
declare
  v_corrida timestamptz := now();
  v_control text;
  v_primera text;
  r         record;
  v_id      bigint;
  v_n       int := 0;
begin
  for r in
    select distinct metadata->>'url' as url
      from public.consentimientos
     where metadata->>'url' like 'https://%'
  loop
    v_id := net.http_get(r.url);
    insert into public.url_legal_chequeo (corrida_en, url, es_control, esperado, request_id)
    values (v_corrida, r.url, false, 200, v_id);
    v_n := v_n + 1;
    if v_primera is null then v_primera := r.url; end if;
  end loop;

  if v_n = 0 then
    return jsonb_build_object('ok', false, 'veredicto', 'no_concluyente',
      'motivo', 'ninguna URL en la evidencia — o no hay consentimientos, o la query dejó de encontrarlas');
  end if;

  -- EL CONTROL NEGATIVO, derivado de una URL real para que apunte al MISMO
  -- servidor y la misma familia de rutas. *Contra otro host no probaría nada.*
  v_control := regexp_replace(v_primera, '/[0-9]+-[0-9]+$', '/9-9');
  v_id := net.http_get(v_control);
  insert into public.url_legal_chequeo (corrida_en, url, es_control, esperado, request_id)
  values (v_corrida, v_control, true, 404, v_id);

  return jsonb_build_object('ok', true, 'veredicto', 'disparado',
    'urls', v_n, 'control', v_control,
    'nota', 'el veredicto lo emite recolectar_urls_legales() en el tick siguiente');
end;
$$;

revoke all on function public.verificar_urls_legales() from public, anon, authenticated;

-- ── TIEMPO 2 · RECOLECTAR Y JUZGAR ────────────────────────────────────────
create or replace function public.recolectar_urls_legales()
returns jsonb
language plpgsql
security definer
set search_path = public, net, pg_catalog
as $$
declare
  v_corrida    timestamptz;
  v_malas      int;
  v_sin_resp   int;
  v_control_ok boolean;
  v_total      int;
begin
  select max(corrida_en) into v_corrida
    from public.url_legal_chequeo where status_code is null and request_id is not null;

  if v_corrida is null then
    return jsonb_build_object('ok', true, 'veredicto', 'nada_pendiente');
  end if;

  update public.url_legal_chequeo c
     set status_code = rp.status_code, veredicto_en = now()
    from net._http_response rp
   where rp.id = c.request_id and c.corrida_en = v_corrida and c.status_code is null;

  select count(*),
         count(*) filter (where status_code is null),
         count(*) filter (where not ok and not es_control and status_code is not null),
         coalesce(bool_and(ok) filter (where es_control), false)
    into v_total, v_sin_resp, v_malas, v_control_ok
  from public.url_legal_chequeo where corrida_en = v_corrida;

  -- 🔴 Las tres salidas NO verdes, y cada una dice algo distinto.
  -- *Colapsarlas en «falló» perdería justo la información que sirve.*
  if v_sin_resp > 0 then
    return jsonb_build_object('ok', false, 'veredicto', 'no_concluyente',
      'motivo', 'quedaron peticiones sin respuesta — el vigilante no pudo medir, que NO es lo mismo que «todo bien»',
      'sin_respuesta', v_sin_resp, 'de', v_total);
  end if;

  if not v_control_ok then
    return jsonb_build_object('ok', false, 'veredicto', 'no_concluyente',
      'motivo', 'el control negativo NO dio 404 — puede haber catch-all y entonces los 200 no significan nada');
  end if;

  if v_malas > 0 then
    return jsonb_build_object('ok', false, 'veredicto', 'urls_caidas',
      'caidas', v_malas, 'de', v_total - 1,
      'detalle', (select jsonb_agg(jsonb_build_object('url', url, 'status', status_code))
                    from public.url_legal_chequeo
                   where corrida_en = v_corrida and not ok and not es_control));
  end if;

  return jsonb_build_object('ok', true, 'veredicto', 'todas_vivas', 'medidas', v_total - 1);
end;
$$;

revoke all on function public.recolectar_urls_legales() from public, anon, authenticated;

comment on function public.recolectar_urls_legales() is
  'Segundo tiempo del vigilante: completa los status que pg_net dejó tras el '
  'commit y emite el veredicto. Tiene TRES salidas no-verdes distintas y ninguna '
  'se colapsa: sin respuesta (no pudo medir) · control negativo caído (puede '
  'haber catch-all) · URLs caídas (el caso que vino a cazar).';
