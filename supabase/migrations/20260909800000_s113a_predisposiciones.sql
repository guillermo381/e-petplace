-- ============================================================================
-- S113-A · 2.1 · A1 — LAS PREDISPOSICIONES, ESTRUCTURADAS
--
-- ── EL CENSO ────────────────────────────────────────────────────────────────
-- `pg_proc` por nombre y por cuerpo (`predisp`): **ninguna función**.
-- Tablas `%predisp%`: **ninguna**. Frente virgen.
--
-- 🔴 **LO QUE HAY HOY NO SIRVE PARA DISPARAR, y por eso esto existe.**
-- `razas_contenido.predisposiciones` es un `text[]` de frases largas escritas
-- para leerse: *«Problemas dentales por crecimiento continuo de los dientes,
-- algo para chequear con el veterinario de forma periódica»*. Eso es **la
-- voz** —y se queda donde está, porque es la que va en la ficha—; lo que falta
-- es **el dato**: qué sistema, en qué etapa, qué chequeo. *Un motor no puede
-- decidir sobre una frase; una familia no quiere leer un código.*
--
-- ⚠️ **NINGUNA DE ESTAS FILAS DIAGNOSTICA.** Cada una dice, como mucho, «esta
-- raza suele…» y **siempre termina en el veterinario**. La `descripcion_familia`
-- está escrita para que Nexo la use tal cual sin agregarle certeza, y el
-- `chequeo_sugerido` es una CONVERSACIÓN a tener, no un estudio indicado.
-- *Quien escribe esto no es veterinario, y por eso ninguna fila afirma nada
-- sobre un animal concreto — sólo sobre lo que conviene preguntar.*
--
-- 76(g): **NO RIGE.** Tablas nuevas + seed de catálogo, sin backfill.
-- ============================================================================

create table if not exists public.cat_predisposiciones (
  codigo              text primary key,
  nombre              text not null,
  /** La frase que Nexo puede decir tal cual. Sin certeza, sin diagnóstico. */
  descripcion_familia text not null,
  /** Lo que vale la pena CONVERSAR con el vet. No es una indicación. */
  chequeo_sugerido    text not null,
  oficio              text not null default 'veterinaria',
  /** En qué etapas vale avisar. Fuera de ellas, el aviso no nace. */
  etapas              text[] not null,
  activo              boolean not null default true,
  constraint chk_predisp_etapas check (
    etapas <@ array['cachorro','joven','adulto','senior']::text[]
    and array_length(etapas, 1) >= 1)
);

comment on table public.cat_predisposiciones is
  'Los sistemas que una raza puede tener predispuestos, con su voz y el '
  'chequeo que vale conversar. Ninguna fila diagnostica: siempre termina en '
  'el veterinario.';

create table if not exists public.raza_predisposicion (
  raza_codigo           text not null,
  predisposicion_codigo text not null references public.cat_predisposiciones(codigo),
  /** `ficha` = salió de la ficha publicada de la raza (extracción de D).
   *  `revisado` = alguien la miró y la confirmó a mano.
   *  *La marca importa: una regla que dispara un aviso a una familia no
   *  debería no saber de dónde salió.* */
  fuente                text not null check (fuente in ('ficha', 'revisado')),
  creado_en             timestamptz not null default now(),
  primary key (raza_codigo, predisposicion_codigo)
);

create index if not exists idx_raza_predisp on public.raza_predisposicion (raza_codigo);

alter table public.cat_predisposiciones enable row level security;
alter table public.raza_predisposicion enable row level security;

/* El catálogo es público de LECTURA: la ficha de raza lo muestra y Nexo lo
   usa. Escribir es de admin (por migración o por la puerta de carga). */
grant select on public.cat_predisposiciones, public.raza_predisposicion to anon, authenticated;
create policy cat_predisp_lectura on public.cat_predisposiciones for select using (activo);
create policy raza_predisp_lectura on public.raza_predisposicion for select using (true);

-- ── LOS DIEZ CÓDIGOS ────────────────────────────────────────────────────────
-- Cada `descripcion_familia` es la mitad de una frase que Nexo completa con el
-- nombre y la etapa. Ninguna afirma que la mascota LO TENGA.
insert into public.cat_predisposiciones
  (codigo, nombre, descripcion_familia, chequeo_sugerido, oficio, etapas) values
  ('cadera', 'Cadera',
   'suelen tener problemas de cadera',
   'vale la pena hablar con tu vet de un estudio de cadera en su próximo chequeo',
   'veterinaria', array['adulto','senior']),

  ('corazon', 'Corazón',
   'suelen tener temas de corazón',
   'conviene que tu vet le escuche el corazón con calma en el próximo control',
   'veterinaria', array['adulto','senior']),

  ('rinon', 'Riñón',
   'suelen tener temas de riñón',
   'preguntale a tu vet si conviene un análisis de sangre y orina de control',
   'veterinaria', array['senior']),

  ('dientes', 'Dientes',
   'suelen tener problemas dentales',
   'preguntale a tu vet cómo está su boca y cada cuánto conviene una limpieza',
   'veterinaria', array['joven','adulto','senior']),

  ('peso', 'Peso',
   'tienden a subir de peso con facilidad',
   'vale la pena revisar con tu vet la porción y el tipo de alimento',
   'veterinaria', array['joven','adulto','senior']),

  ('respiracion', 'Respiración',
   'suelen tener dificultades para respirar, sobre todo con calor o ejercicio',
   'hablá con tu vet sobre cómo cuidarlo en días calurosos y cuánto ejercicio le conviene',
   'veterinaria', array['cachorro','joven','adulto','senior']),

  ('ojos', 'Ojos',
   'suelen tener problemas en los ojos',
   'pedile a tu vet que le revise los ojos en el próximo control',
   'veterinaria', array['joven','adulto','senior']),

  ('piel', 'Piel',
   'suelen tener la piel sensible',
   'consultá con tu vet si conviene un plan de baños o un cambio de alimento',
   'veterinaria', array['cachorro','joven','adulto','senior']),

  ('columna', 'Columna',
   'suelen tener problemas de columna',
   'preguntale a tu vet cómo cuidarle la espalda: saltos, escaleras y cómo alzarlo',
   'veterinaria', array['adulto','senior']),

  ('tiroides', 'Tiroides',
   'suelen tener temas de tiroides',
   'preguntale a tu vet si conviene un análisis de tiroides en el próximo control',
   'veterinaria', array['adulto','senior'])
on conflict (codigo) do nothing;

do $$
declare v_n int; v_mal int;
begin
  select count(*) into v_n from cat_predisposiciones where activo;
  if v_n < 10 then raise exception 'CINTURON: se esperaban 10 códigos y hay %', v_n; end if;

  /* Control de la LEY: ninguna descripción puede afirmar sobre el animal.
     Se busca la forma que lo haría —«tiene», «padece», «sufre»— porque el
     texto se le va a mostrar a una familia con su mascota en la cabeza. */
  select count(*) into v_mal from cat_predisposiciones
   where descripcion_familia ~* '\m(tiene|padece|sufre|presenta)\M';
  if v_mal > 0 then
    raise exception 'CINTURON: % descripción(es) afirman sobre el animal en vez de la raza', v_mal;
  end if;

  -- y todas terminan llevando al veterinario
  select count(*) into v_mal from cat_predisposiciones
   where chequeo_sugerido !~* 'vet';
  if v_mal > 0 then
    raise exception 'CINTURON: % chequeo(s) no mandan al veterinario', v_mal;
  end if;

  raise notice 'CINTURON OK · % códigos · ninguno afirma sobre el animal · todos llevan al vet', v_n;
end $$;
