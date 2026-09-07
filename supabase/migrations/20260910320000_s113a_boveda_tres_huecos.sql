/* ═══ S113-A · LA BÓVEDA CIERRA SUS TRES HUECOS (② ③ ④ del founder) ═══════
 *
 * Los tres son de la misma familia: **cosas que la bóveda no puede decir**.
 * Ninguno produce un error hoy; los tres producen una lectura tranquila de
 * algo que no está pasando.
 *
 * ── ② `tecleado` SE VUELVE INEXPRESABLE HASTA QUE TENGA PRODUCTOR ─────────
 * Medido antes de tocar: el CHECK admite `tecleado`, **cero funciones lo
 * escriben** (censo por `pg_get_functiondef` sobre las 12 que mencionan
 * `modo_captura`), y las dos filas vivas son `extraido_por_ia`.
 * *Un valor que el modelo declara legal y nadie produce se lee como una
 * capacidad que existe* — quien mire el CHECK va a creer que la familia puede
 * teclear un examen a mano, y esa pantalla no existe en ninguna rama.
 * Sale del CHECK. **La lápida dice cómo volver a abrirlo** cuando C construya
 * la captura manual: se agrega al CHECK Y a la puerta en el mismo acto, jamás
 * sólo al CHECK (que es como llegó a estar así).
 *
 * ── ③ GRANTS SIN POLICY QUE LOS CUBRA (misma clase que `familia_invitaciones`)
 * `authenticated` tenía INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER sobre
 * las dos tablas, y **la única policy de cada una es de SELECT**.
 * Hoy no hay agujero —sin policy la RLS deniega— pero *un grant sin policy es
 * una puerta con la cerradura puesta y la llave colgada al lado*: el día que
 * alguien agregue una policy de INSERT «para arreglar algo», el grant ya está
 * y nadie va a revisarlo.
 * ⚠️ **Verificado que no rompe las puertas**: `registrar_papel_extraido` y
 * `confirmar_papel` son SECURITY DEFINER — escriben como `postgres`, no como
 * `authenticated`, así que el REVOKE no las alcanza.
 *
 * ── ④ EL ESTADO DEL ADJUNTO ES PARTE DEL PAPEL ────────────────────────────
 * `archivo_path` es NOT NULL, así que la fila **siempre tiene un path**. Lo que
 * no se podía decir es si el **blob existe**: entre el acto 1 (nace la fila) y
 * la subida hay una ventana, y si la subida falla la fila queda apuntando a un
 * objeto que no está. *No es un dato faltante: es un dato que se lee como
 * presente.* Ya pasó en esta sesión — dos filas fantasma que ni la API ni el
 * SQL podían borrar.
 * Nace `archivo_estado`: `pendiente` (nació, todavía no se verificó) ·
 * `presente` · `ausente` (se verificó y no está).
 * 🔴 **Lo que esta migración NO trae, declarado y con ficha (`D-1048`): el
 * verificador que mueve a `ausente`.** Postgres no puede preguntarle a Storage.
 * *Se crea la columna igual, porque hoy el estado no tiene DÓNDE decirse — y
 * un barredor que no tiene dónde escribir su resultado no se puede escribir.*
 */

begin;

-- ═══ ② ═══════════════════════════════════════════════════════════════════
/* 🔴 SON **DOS** CHECKS, y el que importaba no era el que yo iba a dropear.
   El original lo nombró Postgres al crear la tabla —`papeles_familia_modo_
   captura_check`— y es el que admite `tecleado`. *Dropear «el mío» dejaba el
   de la casa vivo y la migración habría pasado.*
   Lo cazó el cinturón de abajo, que pregunta **si algún constraint menciona
   `tecleado`** en vez de si existe un nombre: un cinturón atado a un nombre
   mide la convención, no el hecho. */
alter table public.papeles_familia drop constraint if exists papeles_familia_modo_captura_check;
alter table public.papeles_familia drop constraint if exists chk_papeles_modo_captura;
alter table public.papeles_familia add constraint chk_papeles_modo_captura
  check (modo_captura = 'extraido_por_ia');

comment on constraint chk_papeles_modo_captura on public.papeles_familia is
  'S113: `tecleado` SALIÓ hasta tener productor. Para reabrirlo se agrega al '
  'CHECK **y** a la puerta en el MISMO acto — agregarlo sólo acá es como llegó '
  'a ser letra muerta.';

-- ═══ ③ ═══════════════════════════════════════════════════════════════════
revoke insert, update, delete, truncate, references, trigger
  on public.papeles_familia, public.papel_valor from authenticated;

-- ═══ ④ ═══════════════════════════════════════════════════════════════════
alter table public.papeles_familia
  add column if not exists archivo_estado text not null default 'pendiente';

alter table public.papeles_familia drop constraint if exists chk_papeles_archivo_estado;
alter table public.papeles_familia add constraint chk_papeles_archivo_estado
  check (archivo_estado in ('pendiente','presente','ausente'));

comment on column public.papeles_familia.archivo_estado is
  'Si el BLOB existe en Storage, no si hay path (`archivo_path` es NOT NULL). '
  '`pendiente` = nació y nadie verificó · `presente` · `ausente` = se verificó '
  'y no está. Quien lo mueve a `ausente` es un barredor que TODAVÍA NO EXISTE '
  '(D-1048): Postgres no puede preguntarle a Storage.';

/* Las dos filas vivas tienen su archivo —se subieron y se leyeron en esta
   misma sesión—, así que su estado se declara `presente` de entrada: dejarlas
   en `pendiente` sería decir «no sé» de algo que sí se sabe. */
update public.papeles_familia set archivo_estado = 'presente'
 where archivo_estado = 'pendiente';

commit;

/* ── CINTURÓN: mide el HECHO contra la base, no el texto de esta migración ── */
do $$
declare v_tecleado boolean; v_grants int; v_col int; v_pend int;
begin
  select not exists (
    select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid
     where t.relname='papeles_familia' and pg_get_constraintdef(c.oid) ilike '%tecleado%')
    into v_tecleado;
  select count(*) from information_schema.role_table_grants
   where table_name in ('papeles_familia','papel_valor') and grantee='authenticated'
     and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE') into v_grants;
  select count(*) from information_schema.columns
   where table_name='papeles_familia' and column_name='archivo_estado' into v_col;
  select count(*) from public.papeles_familia where archivo_estado='pendiente' into v_pend;

  if not v_tecleado then raise exception 'CINTURÓN ②: «tecleado» sigue en el CHECK'; end if;
  if v_grants <> 0 then raise exception 'CINTURÓN ③: quedan % grants de escritura', v_grants; end if;
  if v_col <> 1 then raise exception 'CINTURÓN ④: no existe archivo_estado'; end if;
  if v_pend <> 0 then raise exception 'CINTURÓN ④: % papel(es) quedaron en pendiente', v_pend; end if;

  raise notice 'CINTURÓN ✓ · tecleado fuera · 0 grants de escritura · archivo_estado viva · 0 pendientes';
end $$;
