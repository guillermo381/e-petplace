-- ═══════════════════════════════════════════════════════════════════
-- LEADS DEL SITIO PÚBLICO — schema propio, puerta única
--
-- ⚠️ ESCRITA, NO APLICADA. Requiere ventana coordinada con la pista de la
-- app: el proyecto Supabase es COMPARTIDO (`zyltipqscdsdsxnjclhp`) y hay
-- trabajo de S92/S94 en vuelo sobre esa base.
--
-- Su reversa está escrita ANTES de aplicar, en el archivo hermano
-- `20260810_leads_REVERSA.sql`, como manda la casa.
--
-- POR QUÉ SCHEMA PROPIO (decisión de mesa S93): la tabla queda fuera del
-- radio de las policies de `public`. Un `GRANT` amplio sobre `public` —de
-- los que esta casa ya encontró— no la alcanza.
-- ═══════════════════════════════════════════════════════════════════

begin;

create schema if not exists marketing;
comment on schema marketing is
  'Sitio público www.epetplace.com. NO contiene datos de la app: un lead no es un usuario.';

create table marketing.leads (
  id          uuid primary key default gen_random_uuid(),
  tipo        text        not null,
  nombre      text        not null,
  negocio     text,
  whatsapp    text,        -- E.164 ENTERO, con su «+» (la regla 28 se derogó en S84 por guardarlo partido)
  email       text,
  oficio      text,
  ciudad      text        not null,
  especie     text,
  mensaje     text,
  origen      text        not null,   -- página + CTA + utm que lo produjo
  idioma      text        not null,
  created_at  timestamptz not null default now(),

  -- El dato malo se hace INEXPRESABLE, en vez de confiar en el formulario.
  constraint leads_tipo_valido
    check (tipo in ('prestador', 'pet_parent', 'contacto')),
  constraint leads_idioma_valido
    check (idioma in ('es', 'en')),
  constraint leads_oficio_valido
    check (oficio is null or oficio in ('veterinaria','grooming','paseos','adiestramiento','otro')),
  constraint leads_especie_valida
    check (especie is null or especie in ('perro','gato','conejo','ave','pez','roedor','otra')),

  -- Cada tipo exige lo suyo, y nada más.
  constraint leads_pet_parent_completo
    check (tipo <> 'pet_parent' or (email is not null and especie is not null)),
  constraint leads_prestador_completo
    check (tipo <> 'prestador'  or (whatsapp is not null and negocio is not null and oficio is not null)),
  constraint leads_contacto_completo
    check (tipo <> 'contacto'   or (email is not null and mensaje is not null)),

  -- El WhatsApp entra en E.164 o no entra.
  constraint leads_whatsapp_e164
    check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{7,14}$')
);

comment on table marketing.leads is
  'Alguien que levantó la mano en el sitio público. SIN FK a tablas de la app: un lead no es un usuario, y el día que se convierta su cuenta nace por el camino de la app.';

create index leads_created_at_idx on marketing.leads (created_at desc);
create index leads_tipo_idx       on marketing.leads (tipo);

-- ── LA PUERTA ÚNICA ──
-- El sitio es estático y anónimo: nadie escribe acá salvo la function con
-- `service_role`. Se revoca TODO y no se concede nada.
alter table marketing.leads enable row level security;

revoke all on schema marketing        from anon, authenticated, public;
revoke all on marketing.leads         from anon, authenticated, public;
alter default privileges in schema marketing revoke all on tables from anon, authenticated, public;

-- Sin una sola policy: con RLS encendida y cero policies, ningún rol de
-- usuario lee ni escribe. `service_role` la saltea por diseño.

commit;

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICACIÓN POR CAMINO REAL — se corre DESPUÉS de aplicar.
--
-- ⚠️ No alcanza con leer el GRANT: la lección de S92 es que un
-- `REVOKE … FROM anon` que deja `PUBLIC` intacto NO CIERRA NADA, porque
-- todo rol hereda de PUBLIC. Se mide con `has_table_privilege`, y el
-- rebote se prueba con un POST real desde fuera.
--
--   select has_table_privilege('anon','marketing.leads','INSERT')          as anon_insert,   -- false
--          has_table_privilege('anon','marketing.leads','SELECT')          as anon_select,   -- false
--          has_table_privilege('authenticated','marketing.leads','INSERT') as auth_insert,   -- false
--          has_schema_privilege('anon','marketing','USAGE')                as anon_usage;    -- false
--
--   -- Y el discriminador: un INSERT que DEBE rebotar.
--   set local role anon;
--   insert into marketing.leads (tipo,nombre,ciudad,origen,idioma,email,especie)
--   values ('pet_parent','sonda','quito','prueba','es','x@y.z','perro');  -- 42501 esperado
-- ═══════════════════════════════════════════════════════════════════
