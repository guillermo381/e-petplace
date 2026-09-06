-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · 1.3 — EL PASAPORTE: la página que ve quien encuentra a tu mascota
--
-- Una URL que la familia imprime en una chapita. Quien la abre **no tiene la
-- app, no tiene cuenta y no va a crear una** — está en la calle con un perro
-- que no conoce. *Todo lo que esta página no diga en tres segundos, no se dice.*
--
-- ── LO QUE SE MIDIÓ ANTES DE ESCRIBIR (M1/M2/M3) ────────────────────────────
-- 🟢 **`emitir_token_documento` NO se reusa, y la razón es de VIDA, no de
-- forma.** Su token es un `uuid` de **un solo uso y diez minutos**
-- (`documento_token.usado_en`, `expira_en`) porque un papel se descarga una vez.
-- Un pasaporte vive impreso en un collar **hasta que la familia lo revoque**.
-- *Reusar la tabla habría hecho que la chapita dejara de funcionar a los diez
-- minutos de imprimirla.* Se copia su FORMA —el gate, el DEFINER, el
-- `search_path` fijo— y no su vida.
--
-- 🟢 **`extravio_reportado` y `extravio_resuelto` YA EXISTEN** en
-- `cat_tipos_evento`, y `_trg_propagar_estado_vida_desde_evento` ya los traduce
-- a `perdida` ↔ `activa`. **No hace falta crear `reporte_perdida`**, que es lo
-- que el encargo dejaba abierto. Y como en el fin de vida: *el motor estaba
-- entero y no tenía puerta* — la única función que nombra el tipo es el trigger
-- que reacciona.
--
-- 🔴 **NO EXISTE contacto de emergencia por mascota.** Censado: lo que hay es
-- `mascota_perfil_vigente.tiene_emergencia_activa` (un booleano de estado, no un
-- contacto) y `guarderia_autorizaciones_familia.contactos` (atado a una
-- autorización de guardería, no a la mascota). ⇒ `pasaporte_config` lo crea, y
-- **está bien que no derive del titular**: *quien encuentra un perro no
-- necesita el nombre completo del dueño — necesita un número que atienda.*
--
-- 🟢 Precedente de servir a `anon`: `obtener_adoptables` ya lo hace (medido con
-- `has_function_privilege`). No se inventa un patrón nuevo.
--
-- 🟢 El bucket `mascotas` es PRIVADO (medido) ⇒ la foto **no puede viajar como
-- URL directa**. La RPC devuelve el PATH y **la edge firma**, con TTL corto.
-- *Firmar en SQL sería imposible y devolver el path público sería abrir el
-- bucket por la ventana.*
--
-- ── EL TOKEN ────────────────────────────────────────────────────────────────
-- 128 bits de `gen_random_bytes` en base64url: 22 caracteres, sin relleno.
-- **No es un uuid a propósito**: un uuid en una URL son 36 caracteres y una
-- chapita tiene el tamaño que tiene. Y el espacio es el mismo — 2^128.
--
-- ── EL LÍMITE DE LECTURAS ───────────────────────────────────────────────────
-- Por TOKEN y por MINUTO, en una tabla propia. **No es contra el que encontró
-- al perro** —ése abre la página una vez— *es contra el que consigue un token y
-- prueba variantes, o contra un bot que sigue el QR de una foto en redes.*
-- 30 por minuto: un humano no llega, un raspador sí.
--
-- 76(g) — VEDA: NO RIGE. Tres tablas nuevas y cinco funciones. Cero backfill,
-- cero anclas, cero reescritura de datos de familias.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

-- ── A1 · LAS TABLAS ─────────────────────────────────────────────────────────

create table if not exists public.pasaporte (
  id            uuid primary key default gen_random_uuid(),
  mascota_id    uuid not null references public.mascotas(id) on delete cascade,
  /* 22 caracteres base64url = 128 bits. El CHECK lo hace inexpresable de otro
     largo: *un token corto no se ve distinto, se adivina más rápido.* */
  token         text not null unique,
  creado_en     timestamptz not null default now(),
  revocado_en   timestamptz,
  emitido_por   uuid references auth.users(id) on delete set null,
  vistas        integer not null default 0,
  ultima_vista_en timestamptz,
  constraint chk_pasaporte_token_forma check (token ~ '^[A-Za-z0-9_-]{22}$')
);

/* UNA VIVA POR MASCOTA, y en un índice para que no dependa de que la función se
   acuerde. *Dos pasaportes vivos serían dos chapitas válidas y ninguna forma de
   saber cuál revocar.* */
create unique index if not exists uq_pasaporte_una_viva_por_mascota
  on public.pasaporte (mascota_id) where revocado_en is null;
create index if not exists idx_pasaporte_token on public.pasaporte (token);

comment on table public.pasaporte is
  'La URL pública de una mascota, para quien la encuentre. Vive hasta que la '
  'familia la revoque — al revés que documento_token, que es de un solo uso y '
  'diez minutos.';

create table if not exists public.pasaporte_config (
  mascota_id       uuid primary key references public.mascotas(id) on delete cascade,
  /* Los tres nacen ENCENDIDOS: una familia que imprime un pasaporte quiere que
     sirva. Apagar es la decisión, no encender. */
  mostrar_contacto boolean not null default true,
  mostrar_salud    boolean not null default true,
  mostrar_chip     boolean not null default true,
  contacto_nombre   text,
  contacto_telefono text,
  contacto_mensaje  text,
  updated_at       timestamptz not null default now()
);

comment on column public.pasaporte_config.contacto_telefono is
  'El número que atiende. NO se deriva del titular a propósito: quien encuentra '
  'un perro no necesita el nombre completo del dueño, y el dueño puede querer '
  'poner el del veterinario o el de un vecino.';

/* El límite de lecturas. Fila por token y minuto; se limpia sola con la ventana
   (nadie consulta el minuto de ayer). */
create table if not exists public.pasaporte_acceso (
  pasaporte_id uuid not null references public.pasaporte(id) on delete cascade,
  minuto       timestamptz not null,
  n            integer not null default 1,
  primary key (pasaporte_id, minuto)
);

-- ── RLS · anon NO LEE NINGUNA DE LAS DOS ────────────────────────────────────
-- 🔴 El único camino de `anon` a un pasaporte es `leer_pasaporte(token)`, que
-- filtra por config. *Si `anon` pudiera leer la tabla, tendría los tokens de
-- todas las mascotas — y el token ES la autorización.*
alter table public.pasaporte enable row level security;
alter table public.pasaporte_config enable row level security;
alter table public.pasaporte_acceso enable row level security;

drop policy if exists pasaporte_familia on public.pasaporte;
create policy pasaporte_familia on public.pasaporte
  for select to authenticated using (user_es_familiar_adulto_de_mascota(mascota_id));

drop policy if exists pasaporte_config_familia on public.pasaporte_config;
create policy pasaporte_config_familia on public.pasaporte_config
  for select to authenticated using (user_es_familiar_adulto_de_mascota(mascota_id));

revoke all on public.pasaporte from anon, public;
revoke all on public.pasaporte_config from anon, public;
revoke all on public.pasaporte_acceso from anon, public, authenticated;
grant select on public.pasaporte to authenticated;
grant select on public.pasaporte_config to authenticated;

-- ── A2 · LAS PUERTAS DE LA FAMILIA ──────────────────────────────────────────

create or replace function public.emitir_pasaporte(p_mascota_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
DECLARE v_uid uuid := auth.uid(); v_token text; v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  /* EMITIR DE NUEVO REVOCA EL ANTERIOR, y es lo que la familia espera: si
     reimprime la chapita es porque la vieja se perdió o se la llevó alguien.
     *Dejar dos vivas sería dejar viva justamente la que se quiso reemplazar.* */
  UPDATE pasaporte SET revocado_en = now()
   WHERE mascota_id = p_mascota_id AND revocado_en IS NULL;

  /* 128 bits a base64url: 22 caracteres. `translate` cambia el alfabeto y
     `rtrim` saca el relleno — base64 de 16 bytes siempre termina en '=='. */
  v_token := rtrim(translate(encode(gen_random_bytes(16), 'base64'), '+/', '-_'), '=');

  INSERT INTO pasaporte (mascota_id, token, emitido_por)
  VALUES (p_mascota_id, v_token, v_uid) RETURNING id INTO v_id;

  -- la config nace si no estaba: los tres campos encendidos
  INSERT INTO pasaporte_config (mascota_id) VALUES (p_mascota_id)
  ON CONFLICT (mascota_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'token', v_token);
END $function$;

create or replace function public.revocar_pasaporte(p_mascota_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
DECLARE v_n int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;
  UPDATE pasaporte SET revocado_en = now()
   WHERE mascota_id = p_mascota_id AND revocado_en IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  /* Revocar lo ya revocado NO es un error: la familia tocó dos veces, o dos
     adultos tocaron a la vez. Se contesta cuántas se apagaron. */
  RETURN jsonb_build_object('ok', true, 'revocados', v_n);
END $function$;

create or replace function public.configurar_pasaporte(
  p_mascota_id uuid,
  p_mostrar_contacto boolean,
  p_mostrar_salud boolean,
  p_mostrar_chip boolean,
  p_contacto_nombre text DEFAULT NULL,
  p_contacto_telefono text DEFAULT NULL,
  p_contacto_mensaje text DEFAULT NULL
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  INSERT INTO pasaporte_config AS c (mascota_id, mostrar_contacto, mostrar_salud,
    mostrar_chip, contacto_nombre, contacto_telefono, contacto_mensaje)
  VALUES (p_mascota_id, p_mostrar_contacto, p_mostrar_salud, p_mostrar_chip,
    nullif(btrim(p_contacto_nombre),''), nullif(btrim(p_contacto_telefono),''),
    nullif(btrim(p_contacto_mensaje),''))
  ON CONFLICT (mascota_id) DO UPDATE SET
    mostrar_contacto = excluded.mostrar_contacto,
    mostrar_salud    = excluded.mostrar_salud,
    mostrar_chip     = excluded.mostrar_chip,
    contacto_nombre   = excluded.contacto_nombre,
    contacto_telefono = excluded.contacto_telefono,
    contacto_mensaje  = excluded.contacto_mensaje,
    updated_at = now();

  RETURN jsonb_build_object('ok', true);
END $function$;

/* MARCAR PERDIDA — no crea tipo de evento ni escribe `estado_vida`: inserta el
   evento que YA EXISTE y deja que el trigger propague, exactamente como
   `registrar_fin_de_vida`. **Una sola mano mueve `estado_vida`.** */
create or replace function public.marcar_perdida(p_mascota_id uuid, p_perdida boolean)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
DECLARE
  v_uid uuid := auth.uid(); v_estado text; v_country text; v_eje text;
  v_tipo text; v_evento uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  SELECT estado_vida, country_code INTO v_estado, v_country
    FROM mascotas WHERE id = p_mascota_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'mascota_inexistente' USING ERRCODE='22023'; END IF;

  /* 🔴 UNA MEMORIAL NO SE REPORTA PERDIDA. El trigger la devolvería a 'perdida'
     y con eso el expediente diría que un animal que murió está extraviado. */
  IF v_estado = 'fallecida' THEN
    RAISE EXCEPTION 'mascota_en_memorial' USING ERRCODE='42501';
  END IF;

  v_tipo := CASE WHEN p_perdida THEN 'extravio_reportado' ELSE 'extravio_resuelto' END;

  -- idempotente: pedir lo que ya está no es un error
  IF (p_perdida AND v_estado = 'perdida') OR (NOT p_perdida AND v_estado = 'activa') THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'estado_vida', v_estado);
  END IF;

  SELECT eje_jtbd INTO v_eje FROM cat_tipos_evento WHERE codigo = v_tipo;

  INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento,
    creado_por_user_id, procedencia, country_code)
  VALUES (p_mascota_id, v_tipo, v_eje, now(), v_uid, 'declarado_por_familia', v_country)
  RETURNING id INTO v_evento;

  SELECT estado_vida INTO v_estado FROM mascotas WHERE id = p_mascota_id;
  RETURN jsonb_build_object('ok', true, 'ya_estaba', false,
    'evento_id', v_evento, 'estado_vida', v_estado);
END $function$;

revoke all on function public.emitir_pasaporte(uuid) from public, anon;
revoke all on function public.revocar_pasaporte(uuid) from public, anon;
revoke all on function public.configurar_pasaporte(uuid,boolean,boolean,boolean,text,text,text) from public, anon;
revoke all on function public.marcar_perdida(uuid, boolean) from public, anon;
grant execute on function public.emitir_pasaporte(uuid) to authenticated;
grant execute on function public.revocar_pasaporte(uuid) to authenticated;
grant execute on function public.configurar_pasaporte(uuid,boolean,boolean,boolean,text,text,text) to authenticated;
grant execute on function public.marcar_perdida(uuid, boolean) to authenticated;

-- ── A3 · LA LECTURA PÚBLICA ─────────────────────────────────────────────────
-- 🔴 LO QUE JAMÁS SALE DE ACÁ, y está escrito en el SELECT y no en un comentario:
-- apellido del titular, su dirección, sus otras mascotas, sus prestadores, y
-- una sola línea de historia clínica. *Lo que se muestra es lo que hace falta
-- para devolver un animal a su casa — nada más entra en esa frase.*
create or replace function public.leer_pasaporte(p_token text)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
DECLARE
  v_p record; v_m record; v_c record; v_n int; v_minuto timestamptz;
  v_alergias jsonb; v_medicacion jsonb; v_edad text;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[A-Za-z0-9_-]{22}$' THEN RETURN NULL; END IF;

  SELECT * INTO v_p FROM pasaporte WHERE token = p_token AND revocado_en IS NULL;
  /* Revocado e inexistente contestan LO MISMO, y es a propósito: distinguirlos
     le diría a quien prueba tokens cuáles existieron. */
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- ── el límite, por token y por minuto ──
  v_minuto := date_trunc('minute', now());
  INSERT INTO pasaporte_acceso (pasaporte_id, minuto) VALUES (v_p.id, v_minuto)
  ON CONFLICT (pasaporte_id, minuto) DO UPDATE SET n = pasaporte_acceso.n + 1
  RETURNING n INTO v_n;
  IF v_n > 30 THEN
    RETURN jsonb_build_object('limite', true);
  END IF;

  SELECT * INTO v_m FROM mascotas WHERE id = v_p.mascota_id;
  SELECT * INTO v_c FROM pasaporte_config WHERE mascota_id = v_p.mascota_id;

  UPDATE pasaporte SET vistas = vistas + 1, ultima_vista_en = now() WHERE id = v_p.id;

  /* La edad se calcula acá y viaja como TEXTO ya redondeado: la página no hace
     cuentas, y una fecha de nacimiento es un dato del expediente que no hace
     falta para devolver un animal. */
  v_edad := CASE
    WHEN v_m.fecha_nacimiento IS NULL THEN NULL
    WHEN age(v_m.fecha_nacimiento) < interval '1 year'
      THEN extract(month from age(v_m.fecha_nacimiento))::int::text || ' meses'
    ELSE extract(year from age(v_m.fecha_nacimiento))::int::text || ' años'
  END;

  IF coalesce(v_c.mostrar_salud, true) THEN
    SELECT jsonb_agg(DISTINCT a->>'alergeno') INTO v_alergias
      FROM mascota_perfil_vigente p, jsonb_array_elements(coalesce(p.alergias,'[]'::jsonb)) a
     WHERE p.mascota_id = v_p.mascota_id;
    SELECT jsonb_agg(DISTINCT m->>'nombre') INTO v_medicacion
      FROM mascota_perfil_vigente p, jsonb_array_elements(coalesce(p.medicacion_actual,'[]'::jsonb)) m
     WHERE p.mascota_id = v_p.mascota_id;
  END IF;

  RETURN jsonb_build_object(
    'nombre', v_m.nombre,
    'especie', v_m.especie,
    'raza', v_m.raza,
    'sexo', v_m.sexo,
    'edad', v_edad,
    'foto_path', v_m.foto_url,     -- la EDGE firma; acá no se puede y no se finge
    'perdida', (v_m.estado_vida = 'perdida'),
    'chip', CASE WHEN coalesce(v_c.mostrar_chip, true)
                 THEN (SELECT microchip_activo FROM mascota_perfil_vigente
                        WHERE mascota_id = v_p.mascota_id) END,
    'contacto', CASE WHEN coalesce(v_c.mostrar_contacto, true) THEN jsonb_build_object(
        'nombre', v_c.contacto_nombre, 'telefono', v_c.contacto_telefono,
        'mensaje', v_c.contacto_mensaje) END,
    'alergias', v_alergias,
    'medicacion', v_medicacion
  );
END $function$;

-- 🔴 EXECUTE para `anon`: **el token ES la autorización**, igual que en los
-- papeles. Es la única función de este lote que anon alcanza.
revoke all on function public.leer_pasaporte(text) from public;
grant execute on function public.leer_pasaporte(text) to anon, authenticated;

commit;
