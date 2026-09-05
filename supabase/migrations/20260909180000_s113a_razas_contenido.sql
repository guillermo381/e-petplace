-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · A8 — LA FICHA DE LA RAZA: contenido con procedencia y con freno
--
-- Lo que la familia va a leer sobre la raza de su mascota lo escribe un modelo.
-- **Por eso esta tabla no guarda sólo el texto: guarda de dónde salió y si
-- alguien lo miró.** *Un párrafo sobre la salud de una raza que nadie revisó,
-- publicado con la voz de la app, no es contenido: es una opinión de una
-- máquina firmada por nosotros.*
--
-- ── LA FORMA NO SE ADIVINÓ ──────────────────────────────────────────────────
-- Sale LITERAL del esquema cerrado de `scripts/ia/contenido-razas.mjs` (D,
-- S113-D-1.2), que es quien la produce:
--   { conocida, origen, temperamento, talla_adulta, esperanza_vida,
--     predisposiciones: [], cuidados_por_etapa: {cachorro, adulto, senior} }
-- y su recolector agrega `modelo` y `generado_el` por fila. El propio script
-- lo dice: «A lo carga con activo=false. NADA de esto se publica sin revisión
-- humana.»
--
-- ── LOS TRES ESTADOS QUE SE VUELVEN INEXPRESABLES ───────────────────────────
-- No alcanza con documentarlos: se hacen imposibles (L-439 — *un atajo que
-- puede producir un valor equivocado no se declara, se hace inexpresable*).
--   ① `conocida=false` con textos ⇒ prohibido. El modelo tiene orden de
--      devolver todo en null cuando no conoce la raza; una fila que diga que
--      no la conoce Y traiga un párrafo es una contradicción, y el párrafo es
--      justo el inventado.
--   ② `activo=true` sobre `conocida=false` ⇒ prohibido. Publicar una ficha
--      vacía le muestra a la familia una pantalla que promete y no dice nada.
--   ③ `activo=true` sin revisor ⇒ prohibido. **El interruptor no se puede
--      prender sin firma humana.** *Un default de revisión es una revisión que
--      no ocurrió.*
--
-- 76(g) — VEDA: NO RIGE. DDL aditiva pura, tabla nueva, cero backfill, cero
-- anclas. Ninguna pista escribe acá porque hasta hoy no existía.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

create table if not exists public.razas_contenido (
  -- La llave es la de `cat_razas` — (especie, slug) — porque una raza sólo
  -- existe DENTRO de su especie: hay «bulldog» de perro y no de otra cosa.
  especie       text not null,
  raza_codigo   text not null,

  conocida      boolean not null,
  origen           text,
  temperamento     text,
  talla_adulta     text,
  esperanza_vida   text,
  predisposiciones text[] not null default '{}',
  cuidados_por_etapa jsonb not null default '{}'::jsonb,

  -- PROCEDENCIA. Sin esto, dentro de seis meses nadie puede decir con qué
  -- modelo se escribió un párrafo ni cuándo — y el día que un texto salga mal,
  -- la pregunta no va a ser «¿está mal?» sino «¿cuántos más como éste hay?».
  modelo        text not null,
  generado_el   timestamptz not null,

  -- EL FRENO. `activo` nace apagado y sólo lo prende una persona.
  activo        boolean not null default false,
  revisado_por  uuid references auth.users(id) on delete set null,
  revisado_en   timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  primary key (especie, raza_codigo),
  foreign key (especie, raza_codigo)
    references public.cat_razas (especie, slug) on delete cascade,

  -- ① lo no conocido no habla
  constraint chk_razas_contenido_vacia_si_no_conocida check (
    conocida or (
      origen is null and temperamento is null and talla_adulta is null
      and esperanza_vida is null
      and cardinality(predisposiciones) = 0
    )
  ),
  -- ② no se publica una ficha vacía · ③ no se publica sin firma
  constraint chk_razas_contenido_activo_exige_ficha_y_firma check (
    (not activo) or (conocida and revisado_por is not null and revisado_en is not null)
  ),
  -- El jsonb tiene forma: exactamente las tres etapas, y nada más.
  -- ⚠️ Se escribe con la RESTA de jsonb y no con un `select … from
  -- jsonb_object_keys(…)`: **un CHECK no admite subconsultas** (Postgres lo
  -- rebota con 0A000, y esta sesión ya se comió ese rebote una vez). Sacarle
  -- las tres claves permitidas y exigir que no quede nada dice lo mismo, en una
  -- expresión pura.
  constraint chk_razas_contenido_etapas check (
    jsonb_typeof(cuidados_por_etapa) = 'object'
    and (cuidados_por_etapa - array['cachorro','adulto','senior']) = '{}'::jsonb
  ),
  -- hasta cinco, como pide el prompt: el techo vive en la tabla, no en el texto
  constraint chk_razas_contenido_predisposiciones_techo
    check (cardinality(predisposiciones) <= 5)
);

comment on table public.razas_contenido is
  'S113-A · Ficha de raza escrita por modelo. Nace activo=false; sólo una '
  'persona la publica. La forma sale del esquema cerrado de contenido-razas.mjs.';
comment on column public.razas_contenido.activo is
  'EL FRENO. Falso por default; los CHECK impiden prenderlo sin ficha y sin firma.';

create index if not exists idx_razas_contenido_activo
  on public.razas_contenido (especie, raza_codigo) where activo;

drop trigger if exists trg_razas_contenido_updated_at on public.razas_contenido;
create trigger trg_razas_contenido_updated_at
  before update on public.razas_contenido
  for each row execute function public.update_updated_at_column();

-- ── LA PUERTA ES LA RLS ─────────────────────────────────────────────────────
-- No hace falta RPC: la pregunta es una lectura de catálogo. **Y la política
-- filtra por `activo`, así que ni siquiera existe la posibilidad de leer un
-- borrador desde la app** — el wrapper no puede equivocarse porque la fila no
-- le llega.
alter table public.razas_contenido enable row level security;

drop policy if exists razas_contenido_select_publicado on public.razas_contenido;
create policy razas_contenido_select_publicado on public.razas_contenido
  for select to anon, authenticated using (activo);

-- La escritura es de administración. Sin policy de INSERT/UPDATE/DELETE para
-- `authenticated`, nadie de la app puede publicarse una ficha a sí mismo.
drop policy if exists razas_contenido_admin_todo on public.razas_contenido;
create policy razas_contenido_admin_todo on public.razas_contenido
  for all to authenticated using (is_admin()) with check (is_admin());

revoke all on public.razas_contenido from anon, public;
grant select on public.razas_contenido to anon, authenticated;
grant insert, update, delete on public.razas_contenido to authenticated;

commit;
