#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# GUARD · **NINGUNA CORRIDA DE SONDA ESCRIBE SIN PODER DESHACERSE.**
#
# Nace de dos incidentes del mismo día: una sonda creó un bono real en Aurora,
# y otra escribió la config del prestador. Las dos veces la regla estaba escrita
# y la había leído. Firma del founder: **hacelo mecanismo, no recordatorio.**
#
# Rechaza todo `scripts/s107/corrida-*.sql` que escriba y no esté envuelto en
# `BEGIN … ROLLBACK`. Corre en el paso ⓪ y antes de cerrar.
#
# ⚠️ Mide la FORMA, no el efecto: un archivo con BEGIN/ROLLBACK puede igual
#    dejar residuo si algo adentro commitea. *El guard cierra el descuido, no
#    la malicia* — el residuo se sigue midiendo después, con su SELECT.
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
fallos=0
for f in corrida-*.sql; do
  [ -e "$f" ] || continue
  escribe=0
  grep -qiE '^[[:space:]]*(INSERT|UPDATE|DELETE)|PERFORM public\.|SELECT public\.(aceptar|comprar|reservar|definir|reemplazar|retirar|contratar)' "$f" && escribe=1
  if [ "$escribe" -eq 1 ]; then
    if grep -qi '^BEGIN;' "$f" && grep -qi '^ROLLBACK;' "$f"; then
      echo "  ✓ $f · escribe, y va entre BEGIN y ROLLBACK"
    else
      echo "  ✗ $f · 🔴 ESCRIBE Y NO SE DESHACE. Envolvelo en BEGIN … ROLLBACK."
      fallos=$((fallos+1))
    fi
  else
    echo "  · $f · sólo lectura"
  fi
done
if [ "$fallos" -gt 0 ]; then
  echo ""
  echo "🔴 $fallos corrida(s) escriben sin poder deshacerse."
  echo "   *Una sonda que deja residuo contamina la medición de la próxima* (L-234)."
  exit 1
fi
echo ""
echo "✓ toda corrida que escribe se deshace sola"
