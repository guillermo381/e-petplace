-- ═══════════════════════════════════════════════════════════════════════════
-- S104-A · VIGILAR LAS URLs DE LA EVIDENCIA — que corra solo y avise
-- Pedido del founder (24-ago-2026), especificado con S104-C.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── QUÉ PROBLEMA RESUELVE, Y POR QUÉ ES SILENCIOSO ───────────────────────
-- `P23` promete demostrar **qué documento vio** cada persona, y la evidencia lo
-- guarda como **URL**. ⇒ **si esa URL deja de responder, la promesa se rompe —
-- y no hay ningún síntoma.** *Nadie lo nota hasta que alguien pide ver qué
-- aceptó, que es exactamente el peor momento para enterarse.*
--
-- **No es hipotético:** el T&C profesional vivía en `/legales/terminos-profesional/1-0`
-- y **pasó a dar 404** por una anomalía de ruteo que **sobrevivió a un rebuild
-- limpio**. *Esa vez salió gratis porque ninguna fila la tenía guardada. La
-- privacidad sí la tiene.*
--
-- ── 🔴 EL REFINAMIENTO DEL FOUNDER, QUE ES LO QUE LO HACE SERVIR ─────────
-- **Se miden las URLs REALES GUARDADAS EN `consentimientos`, no una lista a
-- mano.** *Una lista escrita a mano mide lo que alguien recordó poner; la
-- evidencia puede tener **versiones viejas que `URL_LEGAL` ya no lista** y que
-- siguen siendo la prueba de lo que esa persona vio.* **El versionado inmutable
-- garantiza justamente eso: que las URLs viejas sigan existiendo.**
--
-- ── 🔴 EL CONTROL NEGATIVO, Y POR QUÉ NO ES OPCIONAL ─────────────────────
-- Si el servidor tuviera un **catch-all**, TODAS las URLs responderían 200
-- —incluidas las rotas— **y el chequeo daría verde para siempre**. *Un vigilante
-- que no puede fallar no está vigilando.* ⇒ **cada corrida pide también una URL
-- deliberadamente falsa y EXIGE 404.** Si esa da 200, **el veredicto entero es
-- `no_concluyente`, jamás verde.**
--
-- ── POR QUÉ SIN EDGE FUNCTION ────────────────────────────────────────────
-- `pg_net` ya está instalado y los crones de la casa lo usan. ⇒ **cero
-- superficie desplegada nueva, cero secreto nuevo, y no depende del despachador
-- de correo** (que hoy está en sombra). *La pieza más confiable es la que no
-- agrega piezas.*
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.url_legal_chequeo (
  id             bigserial primary key,
  corrida_en     timestamptz not null default now(),
  url            text not null,
  es_control     boolean not null default false,
  status_code    int,
  esperado       int not null,
  ok             boolean generated always as (status_code is not distinct from esperado) stored
);

comment on table public.url_legal_chequeo is
  'Bitácora del vigilante de URLs de la evidencia legal. Cada corrida deja una '
  'fila por URL medida, incluido el CONTROL NEGATIVO. Es el registro auditable: '
  'un chequeo que no deja rastro no se puede mostrar.';

alter table public.url_legal_chequeo enable row level security;
revoke all on public.url_legal_chequeo from public, anon, authenticated;

create index if not exists ix_url_legal_chequeo_corrida
  on public.url_legal_chequeo (corrida_en desc);

-- ── LA VISTA DE LO CAÍDO ──────────────────────────────────────────────────
-- Patrón de `v_storage_borrado_atascado` (D-731): **el «avisa» en su forma
-- consultable.** *Una alerta que solo existe como correo se pierde con el
-- correo; una vista se puede mirar cuando uno quiere.*
create or replace view public.v_urls_legales_caidas as
  select url, es_control, status_code, esperado, corrida_en
  from public.url_legal_chequeo
  where corrida_en > now() - interval '2 days'
    and not ok
  order by corrida_en desc;

revoke all on public.v_urls_legales_caidas from public, anon, authenticated;

-- ── EL VIGILANTE ──────────────────────────────────────────────────────────
create or replace function public.verificar_urls_legales()
returns jsonb
language plpgsql
security definer
set search_path = public, net, pg_catalog
as $$
declare
  v_corrida  timestamptz := now();
  v_reqs     jsonb := '[]'::jsonb;
  v_control  text;
  r          record;
  v_id       bigint;
  v_malas    int;
  v_control_ok boolean;
  v_total    int;
begin
  -- ── ① las URLs REALES de la evidencia ───────────────────────────────────
  -- `LIKE 'https://%'` salta los marcadores históricos (`terminos-inline-v1`,
  -- 60 filas) y los null: **no son URLs y pedirlas sería medir ruido**.
  for r in
    select distinct metadata->>'url' as url
      from public.consentimientos
     where metadata->>'url' like 'https://%'
  loop
    v_id := net.http_get(r.url);
    v_reqs := v_reqs || jsonb_build_object('id', v_id, 'url', r.url, 'esperado', 200, 'control', false);
  end loop;

  select count(*) into v_total from jsonb_array_elements(v_reqs);

  -- ── ② EL CONTROL NEGATIVO, derivado de una URL REAL ─────────────────────
  -- Se deriva en vez de escribirse a mano **para que apunte al mismo servidor y
  -- la misma familia de rutas** que las que importan. *Un control negativo
  -- contra otro host no prueba nada sobre éste.*
  if v_total > 0 then
    select regexp_replace(v_reqs->0->>'url', '/[0-9]+-[0-9]+$', '/9-9') into v_control;
    v_id := net.http_get(v_control);
    v_reqs := v_reqs || jsonb_build_object('id', v_id, 'url', v_control, 'esperado', 404, 'control', true);
  end if;

  -- ── ③ recolectar (pg_net es asíncrono) ──────────────────────────────────
  perform pg_sleep(6);

  insert into public.url_legal_chequeo (corrida_en, url, es_control, status_code, esperado)
  select v_corrida,
         e->>'url',
         (e->>'control')::boolean,
         (select rp.status_code from net._http_response rp where rp.id = (e->>'id')::bigint),
         (e->>'esperado')::int
  from jsonb_array_elements(v_reqs) e;

  -- ── ④ EL VEREDICTO, con sus tres salidas ────────────────────────────────
  select count(*) filter (where not ok and not es_control),
         coalesce(bool_and(ok) filter (where es_control), false)
    into v_malas, v_control_ok
  from public.url_legal_chequeo where corrida_en = v_corrida;

  -- 🔴 Sin URLs no es verde: **es que no pudo medir**. *Una query vacía y «todo
  -- bien» se ven igual desde afuera, y son cosas opuestas.*
  if v_total = 0 then
    return jsonb_build_object('ok', false, 'veredicto', 'no_concluyente',
      'motivo', 'ninguna URL en la evidencia — o no hay consentimientos, o la query dejó de encontrarlas');
  end if;

  -- 🔴 Control negativo caído ⇒ **el chequeo entero deja de valer**, aunque
  -- todas las demás hayan dado 200. *Es justo el caso donde el verde miente.*
  if not v_control_ok then
    return jsonb_build_object('ok', false, 'veredicto', 'no_concluyente',
      'motivo', 'el control negativo NO dio 404 — puede haber catch-all y los 200 no significan nada',
      'control', v_control);
  end if;

  if v_malas > 0 then
    return jsonb_build_object('ok', false, 'veredicto', 'urls_caidas',
      'caidas', v_malas, 'de', v_total,
      'detalle', (select jsonb_agg(jsonb_build_object('url', url, 'status', status_code))
                    from public.url_legal_chequeo
                   where corrida_en = v_corrida and not ok and not es_control));
  end if;

  return jsonb_build_object('ok', true, 'veredicto', 'todas_vivas', 'medidas', v_total);
end;
$$;

revoke all on function public.verificar_urls_legales() from public, anon, authenticated;

comment on function public.verificar_urls_legales() is
  'Vigila que las URLs guardadas en consentimientos sigan respondiendo. Mide las '
  'REALES de la evidencia, no una lista a mano — la evidencia puede tener '
  'versiones viejas que URL_LEGAL ya no lista. Incluye CONTROL NEGATIVO: si una '
  'URL falsa responde 200, devuelve no_concluyente en vez de verde. Sin URLs '
  'tampoco es verde: es no_concluyente.';
