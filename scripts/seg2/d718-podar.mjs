/**
 * 🔴 D-718 · LA PODA — paso 3, después de que la red de seguridad dio verde.
 *
 * **Freno 3: borrar es irreversible.** Por eso, árbol por árbol:
 *   ① se verifica que esté LIMPIO (`status --porcelain` en cero);
 *   ② si tiene cambios sin commitear **NO se borra** y se reporta — un archivo
 *     sin trackear puede ser lo único que quede de algo;
 *   ③ recién entonces `git worktree remove`.
 *
 * **Las RAMAS no se tocan**: `worktree remove` saca el árbol, no la rama.
 * Borrar ramas es otra decisión y **no hace falta** para cerrar el riesgo de
 * credenciales, que es lo que esta poda viene a cerrar (D-711).
 */
import { execFileSync } from 'node:child_process';
import { linea, guardarSeg2 } from './lib-seg2.mjs';

const g = (args, cwd) => execFileSync('git', args, { encoding: 'utf8', cwd }).trim();
const PRIMARIO = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';

const arboles = g(['worktree', 'list', '--porcelain'], PRIMARIO)
  .split('\n\n')
  .map((b) => b.split('\n').find((l) => l.startsWith('worktree '))?.slice(9))
  .filter((r) => r !== undefined && r !== PRIMARIO);

linea('\n══ D-718 · poda de worktrees ══\n');
const informe = [];

for (const ruta of arboles) {
  let sucio = '';
  try {
    sucio = g(['status', '--porcelain'], ruta);
  } catch (e) {
    linea(`  ⚠️  ${ruta} — no se pudo leer su estado: se SALTA (${e.message.slice(0, 60)})`);
    informe.push({ ruta, accion: 'saltado', motivo: 'ilegible' });
    continue;
  }

  if (sucio.length > 0) {
    const n = sucio.split('\n').length;
    linea(`  🛑 ${ruta.split('/').pop()} — ${n} archivo(s) SIN COMMITEAR: **no se borra**`);
    for (const l of sucio.split('\n').slice(0, 6)) linea(`        ${l}`);
    informe.push({ ruta, accion: 'FRENADO', archivos: n });
    continue;
  }

  try {
    g(['worktree', 'remove', ruta], PRIMARIO);
    linea(`  ✅ ${ruta.split('/').pop()} — podado (su rama SIGUE viva)`);
    informe.push({ ruta, accion: 'podado' });
  } catch (e) {
    linea(`  🔴 ${ruta.split('/').pop()} — falló: ${e.message.slice(0, 120)}`);
    informe.push({ ruta, accion: 'error' });
  }
}

const podados = informe.filter((i) => i.accion === 'podado').length;
const frenados = informe.filter((i) => i.accion === 'FRENADO');
linea(`\n  ─ podados: ${podados} · frenados por tener cambios: ${frenados.length}`);
if (frenados.length > 0) {
  linea('  ⚠️  Los frenados quedan INTACTOS y se reportan al founder antes de tocarlos.');
}
guardarSeg2('d718-poda.json', informe);
linea('');
