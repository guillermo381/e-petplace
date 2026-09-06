-- ============================================================================
-- S113-A · 1.3 · A5 — EL QR DEL PASAPORTE PUEDE APAGARSE EN LOS PAPELES
--
-- Los PDF de la casa (ficha de identidad, carnet) se entregan EN MANO: su
-- propio encabezado lo dice —«la familia decide a quién»—. Poner el QR del
-- pasaporte convierte a ese papel en una puerta al teléfono de la familia,
-- y eso tiene que poder apagarse SIN revocar el pasaporte entero.
--
-- 🔴 EL DEFAULT ES `true`, y es una decisión, no comodidad: **el QR sólo
-- aparece si existe un pasaporte vivo, y un pasaporte vivo sólo existe si la
-- familia lo emitió**. Encenderlo por defecto no le abre nada a nadie que no
-- haya abierto ya — apagarlo es para el caso más fino: querés la chapita en
-- el collar y NO querés el mismo QR en un papel que va a una guardería.
--
-- ⚠️ NO es una copia de `mostrar_contacto`. Ése decide qué muestra la PÁGINA;
-- éste decide si el papel lleva la puerta a esa página. *Dos preguntas
-- distintas: qué se ve al llegar, y por dónde se llega.*
--
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE.** DDL aditiva sobre una tabla que
-- nació ayer, sin backfill y sin anclas; ninguna sesión escribe esa columna.
-- ============================================================================

alter table public.pasaporte_config
  add column if not exists qr_en_papeles boolean not null default true;

comment on column public.pasaporte_config.qr_en_papeles is
  'Si los PDF de la casa imprimen el QR del pasaporte. Apagarlo NO revoca el '
  'pasaporte: la chapita sigue funcionando, el papel deja de llevar la puerta.';

do $$
declare v_col int; v_default text;
begin
  select count(*) into v_col from information_schema.columns
   where table_schema='public' and table_name='pasaporte_config' and column_name='qr_en_papeles';
  if v_col <> 1 then raise exception 'CINTURON: la columna no quedó'; end if;

  select column_default into v_default from information_schema.columns
   where table_schema='public' and table_name='pasaporte_config' and column_name='qr_en_papeles';
  if v_default is distinct from 'true' then
    raise exception 'CINTURON: el default no es true, es %', v_default;
  end if;

  -- Control positivo del sentido: una config que YA existía tiene que haber
  -- quedado en `true`. *Si el ALTER hubiera dejado NULL, el papel decidiría
  -- por ausencia y no por regla.*
  if exists (select 1 from public.pasaporte_config where qr_en_papeles is null) then
    raise exception 'CINTURON: hay filas con qr_en_papeles NULL';
  end if;

  raise notice 'CINTURON OK · columna presente · default true · cero nulos';
end $$;
