#!/usr/bin/env bash
# S114-A · CINTURÓN · la mensualidad de guardería devenga POR DÍA EJECUTADO (F10 · §8)
# Camino real: las puertas de guardería con el JWT del titular (magiclink, sin tocar clave).
# ROJO: con la reversa instalada, la estadía llega a entregada y NO produce evento (old code
#       detectaba por suscripcion_servicio_id, que es NULL en la mensualidad).
# VERDE: restaurada la cura, el mismo call que hace la puerta produce el evento con
#        via=guarderia_mensualidad_dia y monto = precio_mensual / días contratados del período.
# ⚠️ Ventana de swap declarada: entre instalar la reversa y restaurar la cura (~3s) una OTRA
#    estadía de MENSUALIDAD que llegara a entregada no devengaría. Día/paquete no se afectan.
set -uo pipefail
cd "$(dirname "$0")/../.."
S="$1"                 # scratchpad dir con cura_fn.sql y rev_fn.sql
SUSC="761ac1ce-3f72-4c19-a434-c04bdf70b853"
EST="1cc10c3c-fa32-4cea-a490-fe02e4c9f6a7"   # estadía de fecha 2026-09-07 (hoy, operable)
PREST="de680000-0000-4000-8000-0000000000e5"
URL=$(grep EXPO_PUBLIC_SUPABASE_URL apps/cliente/.env.local | cut -d= -f2)
ANON=$(grep EXPO_PUBLIC_SUPABASE_ANON_KEY apps/cliente/.env.local | cut -d= -f2)
SR=$(security find-generic-password -s epetplace-service-role -w 2>/dev/null)
FALLOS=0; NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

sql(){ npx supabase --experimental db query --linked --file "$1" 2>/dev/null; }
val(){ python3 -c 'import json,sys;d=json.load(sys.stdin);r=d if isinstance(d,list) else d.get("rows",[]);print(r[0][sys.argv[1]] if r else "NADA")' "$1"; }
rpc(){ curl -s -X POST "$URL/rest/v1/rpc/$1" -H "apikey: $ANON" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d "$2"; }
inst(){ npx supabase --experimental db query --linked --file "$1" >/dev/null 2>&1; }

echo "══ 0 · sesión real del titular (magiclink, sin tocar clave) ══"
HT=$(curl -s -X POST "$URL/auth/v1/admin/generate_link" -H "apikey: $SR" -H "Authorization: Bearer $SR" -H "Content-Type: application/json" \
  -d '{"type":"magiclink","email":"guillo381+demovet@gmail.com"}' | python3 -c "import json,sys;print(json.load(sys.stdin).get('hashed_token','NO'))")
JWT=$(curl -s -X POST "$URL/auth/v1/verify" -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"type\":\"magiclink\",\"token_hash\":\"$HT\"}" | python3 -c "import json,sys;print(json.load(sys.stdin).get('access_token',''))")
[ -n "$JWT" ] && echo "  JWT real: OK" || { echo "  JWT: FALLO"; exit 1; }

echo "══ 1 · baseline: estadía reservada, 0 eventos ══"
cat > "$S/b.sql" <<Q
select e.estado est, (select count(*) from eventos_economicos ee where ee.origen_tipo='estadia' and ee.origen_id='$EST') ev
from guarderia_estadias e where e.id='$EST';
Q
B=$(sql "$S/b.sql"); EST0=$(echo "$B"|val est); EV0=$(echo "$B"|val ev)
echo "  estado=$EST0 · eventos=$EV0"
[ "$EST0" = "reservada" ] && [ "$EV0" = "0" ] || { echo "  ⚠ baseline no limpio — aborto para no medir sucio"; exit 1; }

echo "══ 2 · ROJO: instalar reversa (detección por suscripcion_servicio_id) ══"
inst "$S/rev_fn.sql"

echo "══ 3 · CAMINO REAL con la reversa: puertas → entregada ══"
rpc abrir_tramo_guarderia "{\"p_prestador_id\":\"$PREST\",\"p_fecha\":\"2026-09-07\",\"p_direccion\":\"recogida\",\"p_estadias\":[\"$EST\"]}" >/dev/null
rpc marcar_a_bordo_guarderia "{\"p_estadia_id\":\"$EST\",\"p_carnet_verificado\":true,\"p_ocurrido_en\":\"$NOW\"}" >/dev/null
rpc marcar_llegada_guarderia "{\"p_estadias\":[\"$EST\"],\"p_ocurrido_en\":\"$NOW\"}" >/dev/null
rpc abrir_tramo_guarderia "{\"p_prestador_id\":\"$PREST\",\"p_fecha\":\"2026-09-07\",\"p_direccion\":\"devolucion\",\"p_estadias\":[\"$EST\"]}" >/dev/null
rpc marcar_retorno_guarderia "{\"p_estadias\":[\"$EST\"],\"p_ocurrido_en\":\"$NOW\"}" >/dev/null
ENTREGA=$(rpc marcar_entregada_guarderia "{\"p_estadia_id\":\"$EST\",\"p_ocurrido_en\":\"$NOW\"}")
echo "  entregada resp: $(echo "$ENTREGA" | head -c 120)"

echo "══ 4 · asserto ROJO: entregada, PERO 0 eventos (old code no detecta mensualidad) ══"
R=$(sql "$S/b.sql"); ESTR=$(echo "$R"|val est); EVR=$(echo "$R"|val ev)
echo "  estado=$ESTR · eventos=$EVR"
if [ "$ESTR" = "entregada" ] && [ "$EVR" = "0" ]; then echo "  🔴 ROJO correcto: camino real, old code, cero evento"; else echo "  ✗ ROJO no reproducido (estado=$ESTR ev=$EVR)"; FALLOS=$((FALLOS+1)); fi

echo "══ 5 · restaurar la CURA ══"
inst "$S/cura_fn.sql"

echo "══ 6 · VERDE: el mismo call que hace la puerta al entregar (idempotente) ══"
cat > "$S/dev.sql" <<Q
select _devengar_estadia('$EST') as ev;
Q
sql "$S/dev.sql" >/dev/null

echo "══ 7 · asserto VERDE: 1 evento, via=mensualidad_dia, monto=reparto por día ══"
cat > "$S/v.sql" <<Q
select ee.origen_tipo ot, ee.origen_id::text oid, ee.monto_bruto::text mb, ee.metadata->>'via' via,
  (select round(100.0/count(*),2)::text from guarderia_estadias e2
     join evento_cita_servicio c2 on c2.id=e2.cita_id
     where c2.metadata->>'suscripcion_id'='$SUSC'
       and c2.fecha>=(select periodo_desde from guarderia_suscripciones where id='$SUSC')
       and c2.fecha<=(select periodo_hasta from guarderia_suscripciones where id='$SUSC')) esperado
from eventos_economicos ee where ee.origen_tipo='estadia' and ee.origen_id='$EST';
Q
V=$(sql "$S/v.sql"); OT=$(echo "$V"|val ot); MB=$(echo "$V"|val mb); VIA=$(echo "$V"|val via); ESP=$(echo "$V"|val esperado)
echo "  origen=$OT · monto=$MB · via=$VIA · reparto esperado=$ESP"
[ "$OT" = "estadia" ] && echo "  ✓ ancla en la estadía" || { echo "  ✗ ancla mal ($OT)"; FALLOS=$((FALLOS+1)); }
[ "$VIA" = "guarderia_mensualidad_dia" ] && echo "  ✓ vía mensualidad por día" || { echo "  ✗ vía mal ($VIA)"; FALLOS=$((FALLOS+1)); }
[ "$MB" = "$ESP" ] && echo "  ✓ monto = reparto por día ($MB)" || { echo "  ✗ monto ($MB) ≠ esperado ($ESP)"; FALLOS=$((FALLOS+1)); }

echo "══════════════════════════════"
[ "$FALLOS" = "0" ] && echo "VERDE · cinturón mensualidad 0 fallos" || echo "ROJO · $FALLOS fallos"
exit $FALLOS
