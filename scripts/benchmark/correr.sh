#!/usr/bin/env bash
# correr.sh — corre el harness sobre objetivos.json
# uso:  ./correr.sh                    → todo lo que no requiere pausa (desatendido)
#       ./correr.sh --con-pausa        → todo, parando para que acomodes cada pantalla
#       ./correr.sh --solo chewy       → solo un referente
set -uo pipefail
cd "$(dirname "$0")"

PERFIL="./perfil-navegador"   # la sesión (login, dirección) sobrevive entre corridas
SALIDA="./salida"
SOLO=""; CON_PAUSA=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --con-pausa) CON_PAUSA=1; shift ;;
    --solo) SOLO="$2"; shift 2 ;;
    *) echo "opción desconocida: $1"; exit 1 ;;
  esac
done

command -v node >/dev/null || { echo "✗ falta node"; exit 1; }
node -e "require.resolve('playwright')" 2>/dev/null || { echo "→ instalando playwright..."; npm i playwright && npx playwright install chromium; }

mkdir -p "$SALIDA"
echo "════════════════════════════════════════════════════"
echo " harness de medición — e-PetPlace"
echo " salida: $SALIDA/capturas (png) y $SALIDA/datos (json)"
echo "════════════════════════════════════════════════════"

node -e '
const o=require("./objetivos.json").objetivos;
const solo=process.argv[1]||""; const conPausa=process.argv[2]==="1";
o.filter(t=>(!solo||t.nombre===solo)).filter(t=>conPausa||!t.pausa)
 .forEach(t=>console.log([t.nombre,t.superficie,t.url,t.pausa?1:0].join("\t")));
' "$SOLO" "$CON_PAUSA" | while IFS=$'\t' read -r nombre superficie url pausa; do
  args=(--nombre "$nombre" --superficie "$superficie" --url "$url" --salida "$SALIDA" --perfil "$PERFIL")
  [[ "$pausa" == "1" ]] && args+=(--headed --pausa)
  [[ "$CON_PAUSA" == "1" && "$pausa" != "1" ]] && args+=(--headed)
  node medir.mjs "${args[@]}" || echo "  ✗ falló $nombre/$superficie — seguimos"
done

echo
echo "── consolidando ──"
node consolidar.mjs "$SALIDA"
echo "✓ listo. Tabla en $SALIDA/tabla-proporciones.md"
