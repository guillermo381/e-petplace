#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# S103-D · CORRE LOS TESTS DE DEUNA **FUERA DEL REPO**, SIEMPRE
#
# 🔴 POR QUÉ EXISTE ESTE SCRIPT, y no es comodidad: `deno` no solo lee — ESCRIBE.
#    Corrido dentro del monorepo le metió a `package.json` una clave
#    `workspaces` estilo npm («Migrated its workspace configuration into…»),
#    **que es una segunda declaración de algo que esta casa ya declara en
#    `pnpm-workspace.yaml`**, y le comió el salto de línea final.
#
#    Lo cazó la pista B con el árbol sucio; el único worktree tocado era el mío.
#    Curado con `git checkout -- package.json`.
#
#    ⇒ **Ley de B, y vale más que el caso: un gate que corrompe el repo cada vez
#      que corre es peor que no tener gate.**
#
#    `{"nodeModulesDir":"auto"}` en directorio aislado era **la mitad** de la
#    cura. La otra mitad es que ese directorio **no puede estar dentro de un
#    worktree del monorepo**. Este script hace esa mitad ejecutable en vez de
#    dejarla en la disciplina de quien corra los tests.
#
#    uso:  bash scripts/deuna/correr-tests.sh
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

command -v deno >/dev/null 2>&1 || {
  # 🔴 NO CONCLUYENTE, jamás verde. *Un gate que no pudo correr y dice «ok» es
  #    peor que uno que falla.*
  echo "⚠️  NO CONCLUYENTE: deno no está instalado (brew install deno)"; exit 2; }

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/deuna-tests-XXXXXX")"   # fuera del repo, siempre
trap 'rm -rf "$TMP"' EXIT

echo '{"nodeModulesDir":"auto"}' > "$TMP/deno.json"
mkdir -p "$TMP/f"
cp -R "$REPO/supabase/functions/pagos-deuna-solicitud" \
      "$REPO/supabase/functions/pagos-deuna-webhook" \
      "$REPO/supabase/functions/pagos-deuna-barrido" "$TMP/f/"

echo "── tests (copia en $TMP) ──"
cd "$TMP"
deno test --allow-read f/ 2>&1 | grep -vE "^Download|^Initialize" || true

echo
echo "── check de globales no declaradas (la clase TS2304, que es la de KEY_CLIENT) ──"
if deno check f/pagos-deuna-*/index.ts f/pagos-deuna-*/_*.ts 2>&1 \
     | grep -vE "^Download|^Initialize|^Check" | grep -E "TS2304|TS2552"; then
  echo "🔴 hay símbolos usados y no declarados"; exit 1
fi
echo "✓ ningún símbolo usado sin declarar"

# 🔴 EL CONTROL DE QUE ESTE SCRIPT NO ENSUCIÓ NADA. *La ley se verifica, no se
#    promete: es exactamente el error que este archivo viene a impedir.*
cd "$REPO"
if ! git diff --quiet -- package.json pnpm-workspace.yaml 2>/dev/null; then
  echo "🔴 el repo quedó modificado — deno volvió a escribir donde no debía"; exit 1
fi
echo "✓ el repo quedó intacto"
