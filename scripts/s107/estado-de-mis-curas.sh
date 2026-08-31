#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# S107-C · **¿EN QUÉ ESTADO ESTÁ LO QUE ESTOY POR REPORTAR COMO CURADO?**
#
# ✅ FIRMA DE LA CASA (founder, 29-ago-2026, para las CUATRO pistas):
#
#   > ### Toda cura viaja con su estado real —«en mi rama, esperando merge»—
#   > ### **nunca «curado» a secas.**
#
# ── POR QUÉ ES UN SCRIPT Y NO UNA NOTA ─────────────────────────────────────
# La ambigüedad de esa palabra **costó cuatro gates del founder**: tres curas
# vivían en mi rama y él caminaba un bundle sin ellas, así que las volvió a
# reportar idénticas.
#
# *Un recordatorio no sobrevive a la sexta tanda apurada; un comando que dice
# el número sí.* **Se corre ANTES de escribir un reporte, no después.**
#
# 🔴 Y su respuesta NO es «está bien / está mal»: es **en qué estado está**.
#    Los tres son legítimos — lo que no es legítimo es no nombrarlo.
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
git fetch -q origin 2>/dev/null || true

RAMA="$(git rev-parse --abbrev-ref HEAD)"
FUERA="$(git rev-list --count origin/main..HEAD)"

echo "rama: $RAMA"
if [ "$FUERA" -eq 0 ]; then
  echo "✅ EN MAIN — todo lo tuyo está mergeado."
  echo "   ⚠️ «en main» todavía NO es «en el teléfono»: falta el publish de A."
else
  echo "🔴 $FUERA commit(s) EN TU RAMA Y NO EN MAIN."
  echo "   Lo de abajo NO está en el bundle del founder. Si lo reportás como"
  echo "   curado, decí «en mi rama, esperando merge de A»:"
  git log --oneline "origin/main..HEAD" | sed 's/^/     /'
fi
