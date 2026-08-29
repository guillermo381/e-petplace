#!/usr/bin/env bash
# S107-C · LEVANTAR `apps/cliente` EN WEB, con la API viva.
#
# Para qué: correr `recorrido-guarderia.mjs` (o mirar la app a mano) contra un
# servidor que SÍ puede hablar con Supabase.
#
# ── ⚠️ POR QUÉ ESTE SCRIPT EXISTE, y no es comodidad ────────────────────────
# Sin `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` la app **no
# llama a `initApi()`**, toda pantalla queda en esqueleto y un recorrido
# automático reporta **seis rutas «rotas» que son el arnés, no el producto**.
# *Pasó el 29-ago y casi se reporta como hallazgo.*
#
# ═══════════════════════════════════════════════════════════════════════════
# 🔴 EL AVISO QUE HAY QUE LEER ANTES DE BUSCAR LA CLAVE EN OTRO LADO
#
#   **NO corras `npx supabase projects api-keys` a secas: imprime la
#   `service_role` EN CLARO**, junto a la `anon`, en la salida de tu terminal.
#
#   Para levantar la app **alcanza la `anon`** —que viaja pública en cada
#   bundle— y este script la extrae **sin que la otra pase por pantalla**
#   (`grep` de la primera `api_key`, que es la `anon`).
#
#   *Los artefactos de una verificación son un vector nuevo (`D-712`): esa
#   salida no puede terminar en un log de CI, en un pegado a un chat ni en un
#   reporte.* **Y la `service_role` no hace falta para NADA de esto.**
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

PROYECTO="zyltipqscdsdsxnjclhp"
PUERTO="${PUERTO:-8091}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$RAIZ"
ANON="$(npx supabase projects api-keys --project-ref "$PROYECTO" 2>/dev/null \
  | grep -o '"api_key":"eyJ[^"]*"' | head -1 | sed 's/"api_key":"//;s/"$//')"

if [ "${#ANON}" -lt 100 ]; then
  echo "✗ no se pudo obtener la anon (¿sesión de supabase CLI vencida?)" >&2
  exit 1
fi
echo "✓ anon obtenida (largo ${#ANON}) — no se imprime"

cd apps/cliente
EXPO_PUBLIC_SUPABASE_URL="https://${PROYECTO}.supabase.co" \
EXPO_PUBLIC_SUPABASE_ANON_KEY="$ANON" \
  npx expo start --web --port "$PUERTO" --clear
