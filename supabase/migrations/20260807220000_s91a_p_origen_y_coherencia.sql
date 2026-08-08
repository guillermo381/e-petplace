-- ============================================================================
-- S91-A · `p_origen` EN LAS DOS RPCs DEL DUEÑO — el 🔴 de D, con su colisión
-- ============================================================================
-- EL PEDIDO, y D tiene razón: `grep -c p_origen` sobre `20260807183000` da
-- **0**. La migración de la raza no llevó el origen, así que el paso 3 del
-- alta lo pregunta y **el dato se pierde en el viaje** — la fila nace con el
-- `'desconocido'` HARDCODEADO que las dos RPCs traen desde S45. *Un alta que
-- pregunta algo y lo tira es peor que una que no lo pregunta.*
-- Literal del pedido: `docs/relevamientos/2026-08-07-s91d-SQL-PARA-A-alta.sql`
-- bloque ②, aplicado con las dos adaptaciones que se declaran abajo.
--
-- ── ADAPTACIÓN 1 (de forma): `p_origen` va AL FINAL de la firma ─────────────
-- D lo escribió después de `p_raza` porque su archivo se redactó ANTES de que
-- se firmara la cláusula del pez, cuando `p_tipo_agua` no existía. Va al
-- final: PostgREST resuelve por NOMBRE, así que la posición no cambia nada
-- para ningún caller, y reordenar solo agregaría ruido al diff.
--
-- ── ADAPTACIÓN 2 (de fondo, y es la que importa) ────────────────────────────
-- 🔴 **EL PEDIDO DE D HABRÍA CRASHEADO EN DOS DE SUS CINCO OPCIONES.**
-- Medido contra la fuente antes de aplicar: `mascotas_origen_coherencia_check`
-- exige que `origen='refugio'` traiga `refugio_id NOT NULL` y que
-- `origen='criadero'` traiga `criadero_id NOT NULL`. La pantalla de D
-- (`PasoHistoria.tsx:134-138`) ofrece las cinco de la lámina —adoptado ·
-- refugio · nacido en casa · encontrado · criadero— y **no captura ninguna
-- entidad**. Elegir «Refugio» habría dado un 23514 CRUDO, no un error tipado.
-- Y no hay salida por el lado del dato: **0 refugios y 0 criaderos en la DB**
-- (medido) — no existe id que poner.
--
-- LA CURA ES AFLOJAR EL CHECK, y por qué esa y no otra:
--   · Rechazar tipado sería la puerta que ofrece lo que va a rechazar
--     (Ley 23) — y la lámina firmada ofrece esas dos opciones.
--   · Guardar 'desconocido' cuando la familia dijo «refugio» sería TIRAR un
--     hecho declarado: exactamente lo que este pedido vino a impedir.
--   · «Lo adopté de un refugio» es un hecho VERDADERO y valioso para el
--     Bio-Expediente aunque la plataforma no tenga ese refugio registrado.
--     El CHECK viejo venía del portal legado, donde el refugio se elegía de
--     una LISTA; en el camino del dueño esa lista no existe.
--
-- Lo que el CHECK SIGUE garantizando (la implicación que importa se conserva
-- ENTERA): un id nunca puede colgar del origen equivocado, y nunca pueden
-- venir los dos. Lo único que se suelta es la obligación de tener id.
-- Filas vivas: 5 con origen ≠ desconocido, ninguna refugio/criadero (medido:
-- alta_asistida · comprado_particular · nacido_en_casa) ⇒ cero backfill y
-- ninguna fila viola la forma nueva.
--
-- ⚠️ PARA LA MESA, porque es decisión de producto y no de motor: el día que
-- exista el directorio de refugios, la pregunta «¿de cuál?» es un paso más y
-- estas filas quedan con el hecho pero sin la entidad. Eso es un enriquecer
-- después, no un dato perdido.
--
-- Veda 76(g): NO RIGE — cero backfill.
-- D-662: los bundles vivos llaman por nombre y no mandan `p_origen`; con
-- DEFAULT NULL siguen resolviendo (el fixture lo prueba con el set viejo).
-- Reversa escrita ANTES (con sus DOS notas de datos — una dice que el CHECK
-- estricto puede NO poder reponerse):
--   docs/relevamientos/2026-08-07-s91a-REVERSA-p-origen-y-coherencia.sql
-- ============================================================================

BEGIN;

ALTER TABLE public.mascotas DROP CONSTRAINT mascotas_origen_coherencia_check;
ALTER TABLE public.mascotas
  ADD CONSTRAINT mascotas_origen_coherencia_check CHECK (
        (criadero_id IS NULL OR origen = 'criadero')
    AND (refugio_id  IS NULL OR origen = 'refugio')
    AND NOT (criadero_id IS NOT NULL AND refugio_id IS NOT NULL)
  );

COMMENT ON CONSTRAINT mascotas_origen_coherencia_check ON public.mascotas IS
  'S91: un id no puede colgar del origen equivocado y no pueden venir los dos. YA NO exige id para origen refugio/criadero: el dueño puede declarar «lo adopté de un refugio» sin que la plataforma tenga ese refugio registrado (0 refugios y 0 criaderos al aflojarlo). El CHECK estricto venía del portal legado, donde el refugio se elegía de una lista.';

DROP FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text);
DROP FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text);

CREATE FUNCTION public.crear_familia_con_primera_mascota(
  p_nombre_familia text,
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_precision_fecha text DEFAULT NULL::text,
  p_sexo text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text,
  p_raza text DEFAULT NULL::text,
  p_tipo_agua text DEFAULT NULL::text,
  p_origen text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid        uuid := auth.uid();
  v_familia_id uuid;
  v_miembro_id uuid;
  v_mascota_id uuid;
  v_pet_hash   text;
  v_raza       text := nullif(btrim(coalesce(p_raza, '')), '');
  v_tipo_agua  text := nullif(btrim(coalesce(p_tipo_agua, '')), '');
  v_origen     text := coalesce(nullif(btrim(coalesce(p_origen, '')), ''), 'desconocido');
  v_sujeto     text;
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  if btrim(coalesce(p_nombre_familia, '')) = '' then
    raise exception 'nombre_familia_requerido';
  end if;

  if btrim(coalesce(p_nombre_mascota, '')) = '' then
    raise exception 'nombre_mascota_requerido';
  end if;

  -- Un onboarding por user: si ya es miembro vigente de una familia
  -- estandar, el front debe mandarlo al home, no acá.
  if exists (
    select 1
    from familia_miembro fm
    join familia f on f.id = fm.familia_id
    where fm.user_id = v_uid
      and fm.hasta is null
      and f.tipo = 'estandar'
  ) then
    raise exception 'familia_ya_existe';
  end if;

  -- Mismo guard y código que crear_alta_asistida_* (vocabulario de la casa)
  if not exists (
    select 1 from cat_especies
    where codigo = p_especie and acepta_nuevos_registros = true
  ) then
    raise exception 'especie_invalida_o_inactiva';
  end if;

  -- Guards tipados espejo de los CHECKs (el error de constraint no es tipado)
  if p_sexo is not null and p_sexo not in ('macho', 'hembra', 'desconocido') then
    raise exception 'sexo_invalido';
  end if;

  if p_precision_fecha is not null
     and p_precision_fecha not in ('exacta', 'aproximada', 'estimada') then
    raise exception 'precision_fecha_invalida';
  end if;

  if p_precision_fecha is not null and p_fecha_nacimiento is null then
    raise exception 'precision_sin_fecha';
  end if;

  -- Espejo tipado del CHECK de `mascotas.origen` (9 valores, medido).
  if v_origen not in (
    'criadero', 'refugio', 'adoptado', 'comprado_particular', 'nacido_en_casa',
    'encontrado', 'transferido', 'desconocido', 'alta_asistida'
  ) then
    raise exception 'origen_invalido';
  end if;

  -- Cláusula del pez (S91, firma founder): pez ⟹ el sujeto es el ACUARIO.
  if p_especie = 'pez' then
    v_sujeto := 'acuario';
    if v_raza is not null then
      raise exception 'raza_no_aplica_acuario';
    end if;
    if v_tipo_agua is not null and v_tipo_agua not in ('dulce', 'marino') then
      raise exception 'tipo_agua_invalida';
    end if;
  else
    v_sujeto := 'individuo';
    if v_tipo_agua is not null then
      raise exception 'tipo_agua_solo_pez';
    end if;
  end if;

  insert into familia (nombre, tipo, created_by_user_id)
  values (btrim(p_nombre_familia), 'estandar', v_uid)
  returning id into v_familia_id;

  insert into familia_miembro (familia_id, user_id, rol, motivo_alta)
  values (v_familia_id, v_uid, 'adulto_titular', 'onboarding_dueno')
  returning id into v_miembro_id;

  -- pet_hash es GENERATED ALWAYS (L-080): no se inserta, se devuelve.
  insert into mascotas (
    nombre, especie, raza, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url,
    sujeto, tipo_agua
  )
  values (
    btrim(p_nombre_mascota), p_especie, v_raza, v_origen, v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    v_sujeto, v_tipo_agua
  )
  returning id, pet_hash into v_mascota_id, v_pet_hash;

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'familia_miembro_id', v_miembro_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$function$;

CREATE FUNCTION public.agregar_mascota_a_familia(
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_precision_fecha text DEFAULT NULL::text,
  p_sexo text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text,
  p_raza text DEFAULT NULL::text,
  p_tipo_agua text DEFAULT NULL::text,
  p_origen text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid        uuid := auth.uid();
  v_familia_id uuid;
  v_mascota_id uuid;
  v_pet_hash   text;
  v_raza       text := nullif(btrim(coalesce(p_raza, '')), '');
  v_tipo_agua  text := nullif(btrim(coalesce(p_tipo_agua, '')), '');
  v_origen     text := coalesce(nullif(btrim(coalesce(p_origen, '')), ''), 'desconocido');
  v_sujeto     text;
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  if btrim(coalesce(p_nombre_mascota, '')) = '' then
    raise exception 'nombre_mascota_requerido';
  end if;

  select fm.familia_id
    into v_familia_id
    from familia_miembro fm
    join familia f on f.id = fm.familia_id
   where fm.user_id = v_uid
     and fm.hasta is null
     and f.tipo = 'estandar'
     and fm.rol in ('adulto_titular', 'adulto_autorizado')
   limit 1;

  if v_familia_id is null then
    raise exception 'sin_familia_activa';
  end if;

  if not exists (
    select 1 from cat_especies
    where codigo = p_especie and acepta_nuevos_registros = true
  ) then
    raise exception 'especie_invalida_o_inactiva';
  end if;

  if p_sexo is not null and p_sexo not in ('macho', 'hembra', 'desconocido') then
    raise exception 'sexo_invalido';
  end if;

  if p_precision_fecha is not null
     and p_precision_fecha not in ('exacta', 'aproximada', 'estimada') then
    raise exception 'precision_fecha_invalida';
  end if;

  if p_precision_fecha is not null and p_fecha_nacimiento is null then
    raise exception 'precision_sin_fecha';
  end if;

  if v_origen not in (
    'criadero', 'refugio', 'adoptado', 'comprado_particular', 'nacido_en_casa',
    'encontrado', 'transferido', 'desconocido', 'alta_asistida'
  ) then
    raise exception 'origen_invalido';
  end if;

  if p_especie = 'pez' then
    v_sujeto := 'acuario';
    if v_raza is not null then
      raise exception 'raza_no_aplica_acuario';
    end if;
    if v_tipo_agua is not null and v_tipo_agua not in ('dulce', 'marino') then
      raise exception 'tipo_agua_invalida';
    end if;
  else
    v_sujeto := 'individuo';
    if v_tipo_agua is not null then
      raise exception 'tipo_agua_solo_pez';
    end if;
  end if;

  insert into mascotas (
    nombre, especie, raza, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url,
    sujeto, tipo_agua
  )
  values (
    btrim(p_nombre_mascota), p_especie, v_raza, v_origen, v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    v_sujeto, v_tipo_agua
  )
  returning id, pet_hash into v_mascota_id, v_pet_hash;

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text, text) TO authenticated;

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE v_n int; v_acl text;
BEGIN
  FOR v_acl IN SELECT unnest(ARRAY['crear_familia_con_primera_mascota','agregar_mascota_a_familia'])
  LOOP
    SELECT count(*) INTO v_n FROM pg_proc p
     JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public' AND p.proname = v_acl;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'cinturon_origen: % tiene % sobrecargas (esperaba 1)', v_acl, v_n;
    END IF;
  END LOOP;

  FOR v_acl IN
    SELECT p.proacl::text FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public'
      AND p.proname IN ('crear_familia_con_primera_mascota','agregar_mascota_a_familia')
  LOOP
    IF v_acl LIKE '%anon=%' THEN
      RAISE EXCEPTION 'cinturon_origen: anon en proacl: %', v_acl;
    END IF;
  END LOOP;

  -- El parámetro EXISTE de verdad (el 🔴 de D se mide igual que él lo midió).
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
      WHERE ns.nspname='public'
        AND p.proname IN ('crear_familia_con_primera_mascota','agregar_mascota_a_familia')
        AND pg_get_function_arguments(p.oid) LIKE '%p_origen%') <> 2 THEN
    RAISE EXCEPTION 'cinturon_origen: p_origen no aparece en las DOS firmas';
  END IF;

  -- EL CHECK AFLOJADO RIGE: refugio sin id ENTRA, pero un id colgado del
  -- origen equivocado NO. Los dos brazos, rojo producido.
  BEGIN
    INSERT INTO mascotas (nombre, especie, origen, familia_id, refugio_id)
    VALUES ('zz-sonda', 'perro', 'adoptado',
            (SELECT id FROM familia LIMIT 1), gen_random_uuid());
    RAISE EXCEPTION 'cinturon_origen: un refugio_id colgo de origen=adoptado';
  EXCEPTION
    WHEN check_violation THEN NULL;
    WHEN foreign_key_violation THEN NULL;  -- el FK pega antes: igual no entró
  END;
END $$;

COMMIT;
