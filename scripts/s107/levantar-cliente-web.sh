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
#   bundle— y este script la extrae **sin que la otra pase por pantalla**.
#
#   ⏪ **Y la elige por lo que ES, no por dónde sale.** Antes tomaba *«la
#   primera `api_key`, que es la `anon`»* — medido el 29-ago: es cierto HOY,
#   por el orden en que el CLI las devuelve. *Si ese orden cambiara, este
#   script levantaría la app con la `service_role` y no fallaría: andaría
#   mejor.* Ahora exige el claim `role="anon"` del propio JWT.
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
# El payload del JWT decide, no la posición. Nada se imprime.
ANON="$(npx supabase projects api-keys --project-ref "$PROYECTO" 2>/dev/null \
  | grep -o 'eyJ[A-Za-z0-9._-]*' \
  | while read -r j; do
      p="$(printf '%s' "$j" | cut -d. -f2)"
      p="$p$(printf '%*s' $(( (4 - ${#p} % 4) % 4 )) '' | tr ' ' '=')"
      if printf '%s' "$p" | base64 -d 2>/dev/null | grep -q '"role":"anon"'; then
        printf '%s' "$j"; break
      fi
    done)"

if [ "${#ANON}" -lt 100 ]; then
  echo "✗ no hay ninguna clave con el claim role=\"anon\" (¿sesión de supabase CLI vencida?)" >&2
  echo "  El script PARA: levantar con otra sería probar permisos que nadie tiene." >&2
  exit 1
fi
echo "✓ anon obtenida (largo ${#ANON}) — no se imprime"

cd apps/cliente
EXPO_PUBLIC_SUPABASE_URL="https://${PROYECTO}.supabase.co" \
EXPO_PUBLIC_SUPABASE_ANON_KEY="$ANON" \
  npx expo start --web --port "$PUERTO" --clear
