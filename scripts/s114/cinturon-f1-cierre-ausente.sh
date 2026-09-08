#!/usr/bin/env bash
# S114-A · CINTURÓN F1 · la regla del cierre ausente
# Semillas controladas (NO toca el backlog): cita A pasada fin+48h (DEBE expirar),
# cita B dentro de ventana (NO debe expirar). Prueba el mecanismo por objeto sin
# correr el loop sobre los 125 reales. Control positivo + su rojo (un objeto que
# debía expirar y no expiró) + negativo (uno dentro de ventana no se toca).
set -uo pipefail
cd "$(dirname "$0")/../.."
S="$1"
A='aaaa1114-0000-4000-8000-00000000f1aa'   # debe expirar
B='bbbb1114-0000-4000-8000-00000000f1bb'   # NO debe expirar
MASC='79930830-1f09-4048-9b15-19dfd86bd31c'  # Thor (familia del founder)
PREST='de680000-0000-4000-8000-0000000000e5'
USER='c8429100-82a2-4430-ba4b-0e316e2b5374'
SERV='925cd8a8-9bc7-4e35-904a-3fa28d4ef027'  # vacunacion
FALLOS=0
sql(){ npx supabase --experimental db query --linked --file "$1" 2>/dev/null; }
val(){ python3 -c 'import json,sys;d=json.load(sys.stdin);r=d if isinstance(d,list) else d.get("rows",[]);print(r[0][sys.argv[1]] if r else "NADA")' "$1"; }

limpiar(){
  cat > "$S/f1_clean.sql" <<Q
delete from caso_mensajes where caso_id in (select id from casos_postventa where objeto_id in ('$A','$B'));
delete from casos_postventa where objeto_id in ('$A','$B');
delete from notificacion_intencion where datos->>'objeto_id' in ('$A','$B');
delete from evento_cita_servicio where id in ('$A','$B');
Q
  sql "$S/f1_clean.sql" >/dev/null 2>&1
}
trap limpiar EXIT

echo "══ 0 · sembrar dos citas controladas ══"
cat > "$S/f1_seed.sql" <<Q
delete from evento_cita_servicio where id in ('$A','$B');
insert into evento_cita_servicio (id, mascota_id, user_id, prestador_id, tipo_servicio,
   country_code, modalidad, fecha, hora, duracion_minutos, estado, estado_reserva, precio, metadata)
values
 ('$A','$MASC','$USER','$PREST','vacunacion','EC','presencial',
   (now() at time zone 'America/Guayaquil')::date - 3, '10:00', 30, 'confirmada','pagada', 25,
   '{"siembra":"s114a-f1"}'::jsonb),
 ('$B','$MASC','$USER','$PREST','vacunacion','EC','presencial',
   (now() at time zone 'America/Guayaquil')::date, ((now() at time zone 'America/Guayaquil') - interval '2 hours')::time, 30,
   'confirmada','pagada', 25, '{"siembra":"s114a-f1"}'::jsonb);
Q
sql "$S/f1_seed.sql" >/dev/null
cat > "$S/f1_chk.sql" <<Q
select (select count(*) from evento_cita_servicio where id in ('$A','$B'))::text as n;
Q
[ "$(sql "$S/f1_chk.sql" | val n)" = "2" ] && echo "  2 citas sembradas" || { echo "  ✗ no se sembraron"; exit 1; }

echo "══ 1 · el FILTRO del reloj: A califica para 48h, B no ══"
cat > "$S/f1_filt.sql" <<Q
with e as (
  select c.id,
    ((c.fecha::timestamp + c.hora) at time zone 'America/Guayaquil') + (coalesce(c.duracion_minutos,60)||' min')::interval as fin
  from evento_cita_servicio c where c.id in ('$A','$B')
    and c.estado in ('confirmada','en_curso') and c.estado_reserva='pagada')
select
  (select case when now() >= fin + interval '48 hours' then 'expira' else 'no' end from e where id='$A') as a,
  (select case when now() >= fin + interval '24 hours' then 'aviso_o_expira' else 'dentro' end from e where id='$B') as b;
Q
R=$(sql "$S/f1_filt.sql"); FA=$(echo "$R"|val a); FB=$(echo "$R"|val b)
echo "  A=$FA · B=$FB"
[ "$FA" = "expira" ] && echo "  ✓ control positivo: A debía expirar y el filtro la agarra" || { echo "  🔴 ROJO: A debía expirar y el filtro NO la agarra"; FALLOS=$((FALLOS+1)); }
[ "$FB" = "dentro" ] && echo "  ✓ control negativo: B dentro de ventana, el filtro no la toca" || { echo "  ✗ B se expiraría de más ($FB)"; FALLOS=$((FALLOS+1)); }

echo "══ 2 · el per-objeto sobre A (lo que hace el reloj a las 48h) ══"
cat > "$S/f1_proc.sql" <<Q
update evento_cita_servicio set estado='no_ejecutado' where id='$A';
select _abrir_caso_no_ejecutado('cita','$A') as caso;
Q
CASO=$(sql "$S/f1_proc.sql" | val caso)
echo "  caso abierto: $CASO"

echo "══ 3 · asserts VERDE ══"
cat > "$S/f1_ass.sql" <<Q
select
  (select estado from evento_cita_servicio where id='$A') as a_estado,
  (select estado from evento_cita_servicio where id='$B') as b_estado,
  (select clase::text from casos_postventa where objeto_id='$A') as clase,
  (select motivo_codigo from casos_postventa where objeto_id='$A') as motivo,
  (select monto_devuelto::text from casos_postventa where objeto_id='$A') as monto,
  (select camino from casos_postventa where objeto_id='$A') as camino,
  (select case when resuelto_en is not null then 'sí' else 'no' end from casos_postventa where objeto_id='$A') as resuelto,
  (select count(*)::text from casos_postventa where objeto_id='$B') as b_casos;
Q
R=$(sql "$S/f1_ass.sql")
AE=$(echo "$R"|val a_estado); BE=$(echo "$R"|val b_estado); CL=$(echo "$R"|val clase)
MO=$(echo "$R"|val motivo); MON=$(echo "$R"|val monto); CAM=$(echo "$R"|val camino)
RES=$(echo "$R"|val resuelto); BC=$(echo "$R"|val b_casos)
echo "  A: estado=$AE clase=$CL motivo=$MO monto=$MON camino=$CAM resuelto=$RES"
echo "  B: estado=$BE casos=$BC"
[ "$AE" = "no_ejecutado" ] && echo "  ✓ A quedó no_ejecutado" || { echo "  ✗ A estado=$AE"; FALLOS=$((FALLOS+1)); }
[ "$CL" = "1" ] && echo "  ✓ caso clase 1" || { echo "  ✗ clase=$CL"; FALLOS=$((FALLOS+1)); }
[ "$MON" = "25.00" ] && echo "  ✓ monto = lo pagado (25.00) → la carta aparecerá" || { echo "  ✗ monto=$MON"; FALLOS=$((FALLOS+1)); }
[ "$CAM" = "declarado_sobre_pago" ] && echo "  ✓ camino declarado (no devengó)" || { echo "  ✗ camino=$CAM"; FALLOS=$((FALLOS+1)); }
[ "$RES" = "sí" ] && echo "  ✓ resuelto a favor de la familia" || { echo "  ✗ no resuelto"; FALLOS=$((FALLOS+1)); }
[ "$BE" = "confirmada" ] && [ "$BC" = "0" ] && echo "  ✓ B intacta (dentro de ventana): sin expirar, sin caso" || { echo "  ✗ B tocada (estado=$BE casos=$BC)"; FALLOS=$((FALLOS+1)); }

echo "══════════════════════════════"
[ "$FALLOS" = "0" ] && echo "VERDE · cinturón F1 0 fallos" || echo "ROJO · $FALLOS fallos"
exit $FALLOS
