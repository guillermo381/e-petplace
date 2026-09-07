-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — LAS INVITACIONES DEJAN DE SER PÚBLICAS
--
-- 🔴 EL ROJO, medido como `anon`: **5 filas, con los cinco emails y los cinco
-- tokens, incluidas las REVOCADAS.**
--     guillo381+101@… · guillo381+87@… · karina charry@… · karina.charry@… ·
--     kcharry1990@…
--
-- La causa tiene nombre y el nombre miente: la policy se llama
-- **`familia_inv_publica_por_token`** y su `USING` es literalmente **`true`**.
-- *Prometía filtrar por token y no filtraba nada* — es la misma clase que
-- `cat_razas_select_publica`, que concede a `public` sin que `anon` tenga el
-- grant. **Un nombre de policy es documentación, y la documentación miente
-- cuando nadie la contrasta con su cuerpo.**
--
-- ⚠️ Y `anon` tenía **INSERT, UPDATE, DELETE y TRUNCATE** además del SELECT. Sin
-- policies para esos comandos la RLS los frenaba, así que la fuga real era de
-- lectura — *pero el día que alguien agregue una policy de INSERT «para el flujo
-- de aceptar», el grant ya está puesto y nadie lo va a mirar.*
--
-- ── LA CURA: UNA PUERTA QUE DEVUELVE LO JUSTO ───────────────────────────────
-- `mirar_invitacion(token)` — DEFINER, `search_path` fijo, con su propio límite
-- de intentos. Devuelve **el nombre de la familia y el rol ofrecido, y nada
-- más**: sin email, sin token, sin id de familia. *La pantalla de aceptar
-- necesita saber a qué casa la invitan, no la lista de a quién más invitaron.*
--
-- 🟢 Cero riesgo de rotura, medido: el wrapper `familia-invitacion.ts` declara y
-- cumple que **no toca la tabla** —sus cuatro funciones pasan por RPC— y las seis
-- funciones de la base son DEFINER. *La policy que se va no la usaba nadie.*
--
-- ⚠️ **Una revocada o vencida contesta lo mismo que una inexistente: `null`.**
-- Distinguirlas le diría a quien prueba tokens cuáles fueron reales.
--
-- 76(g) — VEDA: NO RIGE. Una policy que se va, grants que se revocan, y una
-- función nueva.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

drop policy if exists familia_inv_publica_por_token on public.familia_invitaciones;

/* El grant se saca ENTERO para anon: no hay ninguna operación que anon tenga que
   hacer sobre esta tabla — todo pasa por funciones DEFINER. */
revoke all on public.familia_invitaciones from anon;

/* El límite de intentos vive donde el de los pasaportes: por token y minuto.
   *Un token de invitación es adivinable en la misma medida que uno de pasaporte,
   y la defensa es la misma.* */
create table if not exists public.invitacion_acceso (
  token_hash text not null,
  minuto     timestamptz not null,
  n          integer not null default 1,
  primary key (token_hash, minuto)
);
alter table public.invitacion_acceso enable row level security;
revoke all on public.invitacion_acceso from anon, public, authenticated;

comment on table public.invitacion_acceso is
  'Intentos de mirar una invitación, por token y minuto. Guarda el HASH del '
  'token y no el token: si esta tabla se filtrara, no entregaría ninguna llave.';

create or replace function public.mirar_invitacion(p_token text)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
DECLARE v_i record; v_fam text; v_n int; v_hash text;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 THEN RETURN NULL; END IF;

  /* Se guarda el hash, no el token: *una tabla de límite que guarda las llaves
     que está protegiendo es una copia del problema.* */
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');
  INSERT INTO invitacion_acceso (token_hash, minuto)
  VALUES (v_hash, date_trunc('minute', now()))
  ON CONFLICT (token_hash, minuto) DO UPDATE SET n = invitacion_acceso.n + 1
  RETURNING n INTO v_n;
  IF v_n > 20 THEN RETURN jsonb_build_object('limite', true); END IF;

  SELECT i.familia_id, i.rol_invitado, i.estado, i.expira_en INTO v_i
    FROM familia_invitaciones i WHERE i.token = p_token;

  -- inexistente, revocada, aceptada o vencida: todas contestan igual
  IF NOT FOUND OR v_i.estado <> 'pendiente'
     OR (v_i.expira_en IS NOT NULL AND v_i.expira_en < now()) THEN
    RETURN NULL;
  END IF;

  SELECT nombre INTO v_fam FROM familia WHERE id = v_i.familia_id;

  /* Lo JUSTO: a qué casa te invitan y con qué rol. Ni el email al que se mandó,
     ni el token, ni el id de la familia. */
  RETURN jsonb_build_object('familia', v_fam, 'rol', v_i.rol_invitado);
END $function$;

revoke all on function public.mirar_invitacion(text) from public;
grant execute on function public.mirar_invitacion(text) to anon, authenticated;

commit;
