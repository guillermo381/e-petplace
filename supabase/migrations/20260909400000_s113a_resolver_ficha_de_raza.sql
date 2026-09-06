-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — LA FICHA SE RESUELVE EN EL SERVIDOR: sinónimo, caída a la especie,
--          y el descarte queda REGISTRADO
--
-- ── LO QUE LA MEDICIÓN OBLIGÓ A CAMBIAR DEL DISEÑO ──────────────────────────
-- 🔴 ① **La ficha por especie NO es `(especie, especie)`.** Medido: `perro` la
-- tiene en `criollo`, `gato` en `gato-comun`, `equino` en `criollo`, y las otras
-- ocho sí en `(especie, especie)`. *Una convención de nombre habría fallado en
-- tres de once y el fallo habría sido silencioso: la mascota ve una pantalla
-- vacía, no un error.* ⇒ se marca **en el dato** con `es_de_especie`, y un
-- índice único parcial hace **imposible** que una especie tenga dos.
--
-- 🔴 ② **«Mestizo» son CUATRO PERROS Y UN GATO.** Un sinónimo global habría
-- mandado al gato a la ficha del perro. *El sinónimo es POR ESPECIE, y eso no se
-- deduce del vocabulario: se descubre mirando quién lo usa.*
--
-- ── POR QUÉ TODO ESTO VIVE EN EL SERVIDOR Y NO EN EL WRAPPER ────────────────
-- Porque el casamiento tiene ahora TRES pasos —nombre, sinónimo, caída— y el
-- tercero **escribe**. *Una regla de resolución repartida entre cliente y
-- servidor es la segunda definición de «igual», que es exactamente el precio que
-- esta casa acaba de pagar con `nombre_norm`.* Un viaje, una verdad.
--
-- ── EL REGISTRO DEL DESCARTE, que es la mitad que D-1037 subraya ────────────
-- E lo dejó escrito: *casar por nombre y descartar en silencio significa que lo
-- que no casó desaparece sin dejar rastro, y la próxima vez que alguien mida no
-- va a poder saber si el modelo falló o si el casamiento se comió la respuesta.*
-- Acá el descarte **no se puede olvidar**: lo escribe la misma función que
-- resuelve. Y con eso **la app pasa a ser el instrumento que sigue midiendo
-- sinónimos** — los 58 de E salieron de un experimento que costó 146 llamadas;
-- los próximos van a salir gratis, de familias reales.
--
-- ⚠️ El registro es CUENTA, no bitácora: una fila por (especie, texto) con su
-- contador y sus dos fechas. *Guardar una fila por cada lectura convertiría una
-- pantalla en un log.*
--
-- 76(g) — VEDA: NO RIGE. Dos tablas nuevas, una columna, una función, y el
-- UPDATE de publicación de `perro/criollo`.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

-- ── ① la ficha de especie se marca en el DATO ───────────────────────────────
alter table public.razas_contenido
  add column if not exists es_de_especie boolean not null default false;

comment on column public.razas_contenido.es_de_especie is
  'La ficha que habla de la ESPECIE y no de una raza. No coincide con '
  '(especie, especie): perro la tiene en «criollo» y gato en «gato-comun». Por '
  'eso se marca acá y no se deduce del nombre.';

update public.razas_contenido set es_de_especie = true
 where (especie, raza_codigo) in (
   ('perro','criollo'), ('gato','gato-comun'), ('equino','criollo'),
   ('huron','huron'), ('otro','otro'), ('pez','pez'), ('ave','ave'),
   ('conejo','conejo'), ('reptil','reptil'), ('roedor','roedor'), ('cobaya','cobaya'));

-- Dos fichas de especie para la misma especie serían un empate silencioso:
-- la caída elegiría una al azar. Se hace imposible.
create unique index if not exists uq_razas_contenido_una_por_especie
  on public.razas_contenido (especie) where es_de_especie;

-- ── ② los sinónimos, POR ESPECIE ────────────────────────────────────────────
create table if not exists public.raza_sinonimo (
  especie   text not null,
  sinonimo  text not null,
  -- espejo EXACTO de `cat_razas.nombre_norm`: una sola definición de «igual».
  sinonimo_norm text generated always as (
    lower(translate(sinonimo,
      'ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòùÂÊÎÔÛâêîôûÄËÏÖäëïö',
      'AEIOUUNaeiouunAEIOUaeiouAEIOUaeiouAEIOaeio'))) stored,
  slug      text not null,
  nota      text,
  created_at timestamptz not null default now(),
  primary key (especie, sinonimo),
  foreign key (especie, slug) references public.cat_razas (especie, slug) on delete cascade
);
create unique index if not exists uq_raza_sinonimo_norm
  on public.raza_sinonimo (especie, sinonimo_norm);

comment on table public.raza_sinonimo is
  'En español una raza no tiene UN nombre (D-1037). Los sinónimos son POR '
  'ESPECIE: «Mestizo» lo usan cuatro perros y un gato, y mandan a fichas '
  'distintas.';

insert into public.raza_sinonimo (especie, sinonimo, slug, nota) values
  ('perro','Mestizo','criollo','Cinco mascotas reales lo declaran; cuatro son perros.')
on conflict do nothing;

alter table public.raza_sinonimo enable row level security;
drop policy if exists raza_sinonimo_select on public.raza_sinonimo;
create policy raza_sinonimo_select on public.raza_sinonimo
  for select to authenticated using (true);
drop policy if exists raza_sinonimo_admin on public.raza_sinonimo;
create policy raza_sinonimo_admin on public.raza_sinonimo
  for all to authenticated using (is_admin()) with check (is_admin());
revoke all on public.raza_sinonimo from anon, public;
grant select on public.raza_sinonimo to authenticated;
grant insert, update, delete on public.raza_sinonimo to authenticated;

-- ── el registro del descarte ────────────────────────────────────────────────
create table if not exists public.raza_sin_casar (
  especie   text not null,
  texto     text not null,
  veces     integer not null default 1,
  primera_vez timestamptz not null default now(),
  ultima_vez  timestamptz not null default now(),
  primary key (especie, texto)
);
comment on table public.raza_sin_casar is
  'Lo que las familias declararon y el catálogo no reconoció. Es CUENTA, no '
  'bitácora. Cada fila acá es un sinónimo candidato medido gratis, con familias '
  'reales (D-1037).';
alter table public.raza_sin_casar enable row level security;
-- Nadie de la app la LEE: la escribe la función DEFINER y la mira quien decide
-- el catálogo. *Una tabla de medición que la app puede leer invita a que alguna
-- pantalla la use como dato, y no lo es.*
revoke all on public.raza_sin_casar from anon, public, authenticated;

-- ── LA PUERTA ───────────────────────────────────────────────────────────────
create or replace function public.resolver_ficha_de_raza(
  p_especie text,
  p_raza_declarada text
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
DECLARE
  v_norm text;
  v_slug text;
  v_via  text;
  v_f    record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  v_norm := lower(translate(coalesce(btrim(p_raza_declarada), ''),
    'ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòùÂÊÎÔÛâêîôûÄËÏÖäëïö',
    'AEIOUUNaeiouunAEIOUaeiouAEIOUaeiouAEIOaeio'));

  IF v_norm <> '' THEN
    SELECT slug INTO v_slug FROM cat_razas
     WHERE especie = p_especie AND nombre_norm = v_norm;
    IF FOUND THEN v_via := 'nombre'; END IF;

    IF v_slug IS NULL THEN
      SELECT slug INTO v_slug FROM raza_sinonimo
       WHERE especie = p_especie AND sinonimo_norm = v_norm;
      IF FOUND THEN v_via := 'sinonimo'; END IF;
    END IF;

    /* 🔴 EL DESCARTE SE REGISTRA ACÁ, donde no se puede olvidar. Cada fila es un
       sinónimo candidato medido gratis con una familia real. */
    IF v_slug IS NULL THEN
      INSERT INTO raza_sin_casar (especie, texto)
      VALUES (p_especie, btrim(p_raza_declarada))
      ON CONFLICT (especie, texto) DO UPDATE
        SET veces = raza_sin_casar.veces + 1, ultima_vez = now();
    END IF;
  END IF;

  /* La caída: sin raza, o con una que no casó, se contesta con la ficha de la
     ESPECIE. *Que no sepamos su raza no significa que no tengamos nada que
     contarle sobre su animal.* */
  IF v_slug IS NULL THEN
    SELECT * INTO v_f FROM razas_contenido
     WHERE especie = p_especie AND es_de_especie AND activo;
    v_via := CASE WHEN v_norm = '' THEN 'especie_sin_raza' ELSE 'especie_por_descarte' END;
  ELSE
    SELECT * INTO v_f FROM razas_contenido
     WHERE especie = p_especie AND raza_codigo = v_slug AND activo;
    /* Si la raza casó pero su ficha no está publicada, **NO se cae a la especie**:
       decirle «el perro es un animal social» a quien tiene un Beagle sería peor
       que no decir nada. Se contesta null y la pantalla no dibuja la sección. */
  END IF;

  IF v_f IS NULL THEN
    RETURN jsonb_build_object('hay', false, 'via', v_via, 'raza_codigo', v_slug);
  END IF;

  RETURN jsonb_build_object(
    'hay', true, 'via', v_via,
    'especie', v_f.especie, 'raza_codigo', v_f.raza_codigo,
    'es_de_especie', v_f.es_de_especie,
    'origen', v_f.origen, 'temperamento', v_f.temperamento,
    'talla_adulta', v_f.talla_adulta, 'esperanza_vida', v_f.esperanza_vida,
    'predisposiciones', to_jsonb(v_f.predisposiciones),
    'cuidados_por_etapa', v_f.cuidados_por_etapa,
    'modelo', v_f.modelo, 'generado_el', v_f.generado_el);
END $function$;

revoke all on function public.resolver_ficha_de_raza(text, text) from public, anon;
grant execute on function public.resolver_ficha_de_raza(text, text) to authenticated;

-- ── ① `perro/criollo` publicada ─────────────────────────────────────────────
update public.razas_contenido
   set activo = true,
       revisado_por = '75d0798a-ea90-4a97-a2f2-74f3234d892a'::uuid,
       revisado_en = now()
 where especie = 'perro' and raza_codigo = 'criollo' and conocida;

commit;
