/**
 * ═══════════════════════════════════════════════════════════════════════════
 * lib-arbol · CONTRA QUÉ ÁRBOL SE MIDIÓ — S114-E
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Un número medido contra un árbol viejo es un número falso que se lee como
 * verdadero.** Le pasó a esta sesión: un gate corrido antes de traer `main`
 * publicó un urgente que ya estaba curado.
 *
 * El instrumento mide la BASE, que es compartida y está al día. Lo que envejece
 * es **el instrumento**: sus nombres de columna, sus supuestos y la letra contra
 * la que compara. *Medir bien con supuestos viejos da un número creíble y
 * equivocado — el peor tipo.*
 *
 * ⚠️ **Sin archivo de estado, a propósito.** Un archivo que recuerda la última
 * corrida se queda viejo, y ése es exactamente el defecto una capa más arriba.
 * Se le pregunta a git: `HEAD..main` son los commits ajenos sin mezclar.
 *
 * ⚠️ **Lo que NO ve, declarado:** commits que estén en `origin/main` y todavía
 * no en el `main` local. Quien quiera la foto exacta corre `git fetch` antes;
 * este helper **no hace red** para no colgar a un arnés.
 */
import { execFileSync } from 'node:child_process';

export function arbolAlDia() {
  try {
    const ajenos = Number(execFileSync('git', ['rev-list', '--count', 'HEAD..main'],
      { encoding: 'utf8' }).trim());
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    return { ok: ajenos === 0, ajenos, sha };
  } catch {
    return { ok: null, ajenos: null, sha: null };   // sin main local: NO se afirma
  }
}

/** Encabezado para todo lo que publique un número. */
export function lineaDeArbol(a = arbolAlDia()) {
  if (a.ok === null) return '⚠️ no se pudo comparar contra `main`: no sé si este árbol está al día.';
  return a.ok
    ? `✅ árbol al día · sha ${a.sha} (0 commits de \`main\` sin mezclar)`
    : `🔴 ÁRBOL VIEJO · sha ${a.sha} · \`main\` tiene ${a.ajenos} commit(s) que este árbol no tiene`;
}
