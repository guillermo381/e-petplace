#!/usr/bin/env node
/**
 * S113-E · `tipos:rutas` — GENERA `.expo/types/router.d.ts` EN UN WORKTREE.
 *
 * ═══ EL PROBLEMA, MEDIDO ═══════════════════════════════════════════════════
 * `.expo/types/router.d.ts` **lo genera Metro y está en `.gitignore`**: no
 * viaja con el merge, así que **todo worktree nuevo nace sin él**. Y
 * `scripts/guard-rutas-tipadas.mjs` (S109-A, `L-450`) corre pegado al `tsc` y
 * sale ROJO cuando falta — a propósito: sin ese archivo `tsc` **deja de medir
 * las rutas** y sale verde por ausencia, que es peor que un rojo.
 *
 * El guard ya documenta dos curas manuales (`npx expo start` y cortar, o
 * copiar de otro worktree). Lo que faltaba es hacerlo **sin manos**. Esto.
 *
 * ═══ 🔴 UNA PRECISIÓN QUE CAMBIA EL DIAGNÓSTICO ════════════════════════════
 * «`turbo typecheck` falla 7/7 en los worktrees» tiene **DOS causas, no una**,
 * y conviene no confundirlas porque se curan distinto:
 *   ① **`node_modules` sin instalar** — un worktree nuevo no los hereda. Los
 *      5 paquetes fallan por eso, y `tsc` ni siquiera resuelve `@epetplace/*`.
 *      Se cura con `pnpm install`, no con este script.
 *   ② **`router.d.ts` ausente** — sólo las 2 apps, y es lo que esto cura.
 * **Medido en este worktree:** con `pnpm install` hecho y sin `router.d.ts`,
 * `npx tsc --noEmit` en `apps/cliente` da **0 errores** — el rojo lo pone el
 * guard, no TypeScript. *Los dos síntomas se ven igual desde afuera («falla el
 * typecheck») y sólo uno lo arregla este script.*
 *
 * ═══ CÓMO LO GENERA ════════════════════════════════════════════════════════
 * Arrancando **`npx expo start`**, que es el comando de Expo que lo escribe, y
 * cortándolo apenas el archivo aparece. **No se reimplementa el generador a
 * mano**: vive bundleado dentro de `@expo/cli` y su forma cambia entre
 * versiones de SDK. *Una copia del generador es una copia que se desincroniza
 * con el SDK sin avisar, y el archivo que produce compila igual.*
 *
 * Uso:
 *   node scripts/tipos-rutas.mjs            # las dos apps
 *   node scripts/tipos-rutas.mjs cliente    # una
 *   node scripts/tipos-rutas.mjs --control  # prueba que sabe dar rojo
 */
import { existsSync, statSync, rmSync, renameSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const di = (s) => process.stdout.write(s + '\n');
const RUTA = '.expo/types/router.d.ts';
const APPS = ['cliente', 'prestador'];
const ESPERA_MS = 180_000;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Arranca `expo start` y corta apenas el archivo existe. */
async function generar(app) {
  const dir = resolve('apps', app);
  const destino = join(dir, RUTA);
  if (!existsSync(dir)) return { app, ok: false, motivo: 'no existe apps/' + app };

  if (existsSync(destino)) {
    return { app, ok: true, motivo: 'ya existía', bytes: statSync(destino).size };
  }

  const hijo = spawn('npx', ['expo', 'start', '--no-dev', '--port', '0'], {
    cwd: dir,
    stdio: 'ignore',
    detached: true,
    env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' },
  });

  const t0 = Date.now();
  let aparecio = false;
  while (Date.now() - t0 < ESPERA_MS) {
    if (existsSync(destino) && statSync(destino).size > 0) { aparecio = true; break; }
    await dormir(500);
  }
  // El server queda con hijos (Metro): se mata el GRUPO, no sólo el padre.
  try { process.kill(-hijo.pid, 'SIGKILL'); } catch { try { hijo.kill('SIGKILL'); } catch { /* ya murió */ } }
  await dormir(300);

  if (!aparecio) {
    return { app, ok: false, motivo: `no apareció en ${ESPERA_MS / 1000} s` };
  }
  return { app, ok: true, motivo: 'generado', bytes: statSync(destino).size };
}

// ═══ CONTROL ══════════════════════════════════════════════════════════════
// Un script que "cura" algo tiene que poder mostrar el estado enfermo. Este
// control APARTA el archivo (no lo borra), mide el rojo del guard, lo genera
// de nuevo y mide el verde. Si algo sale mal, RESTAURA lo apartado.
if (process.argv.includes('--control')) {
  const app = 'cliente';
  const dir = resolve('apps', app);
  const destino = join(dir, RUTA);
  const guardado = destino + '.control-s113e';
  let rojo = false;

  const correGuard = () => spawnSync('node', [resolve('scripts/guard-rutas-tipadas.mjs')],
    { cwd: dir, encoding: 'utf8' });

  const habia = existsSync(destino);
  if (habia) renameSync(destino, guardado);

  try {
    // ① POSITIVO primero: sin el archivo, el guard TIENE que dar rojo.
    const sin = correGuard();
    const daRojo = sin.status !== 0 && /router\.d\.ts/.test(sin.stdout);
    di(`${daRojo ? '✅' : '🔴'} POSITIVO  sin router.d.ts ⇒ el guard sale ${sin.status} y nombra el archivo`);
    if (!daRojo) rojo = true;

    // ② Generarlo y exigir verde.
    di('   generando…');
    const r = await generar(app);
    di(`   ${r.ok ? '✅' : '🔴'} ${r.motivo}${r.bytes ? ` · ${(r.bytes / 1024).toFixed(0)} kB` : ''}`);
    if (!r.ok) rojo = true;

    const con = correGuard();
    const daVerde = con.status === 0;
    di(`${daVerde ? '✅' : '🔴'} NEGATIVO  con router.d.ts ⇒ el guard sale ${con.status}`);
    if (!daVerde) rojo = true;
  } finally {
    // Si el control no pudo generar, se devuelve el que había: un control
    // nunca deja el árbol peor de como lo encontró.
    if (habia && !existsSync(destino) && existsSync(guardado)) renameSync(guardado, destino);
    else if (existsSync(guardado)) rmSync(guardado, { force: true });
  }

  di(rojo ? '\n🔴 tipos:rutas NO cumple su control.' : '\n✅ el control cierra: sabe mostrar el rojo y sabe curarlo.');
  process.exit(rojo ? 1 : 0);
}

// ═══ CORRIDA NORMAL ═══════════════════════════════════════════════════════
const pedidas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const objetivo = pedidas.length ? pedidas : APPS;
let malo = 0;
for (const app of objetivo) {
  const r = await generar(app);
  di(`${r.ok ? '✅' : '🔴'} ${app.padEnd(11)} ${r.motivo}${r.bytes ? ` · ${(r.bytes / 1024).toFixed(0)} kB` : ''}`);
  if (!r.ok) malo += 1;
}
if (malo) {
  di('\n🔴 Alguna no se generó. La cura manual sigue disponible:');
  di('   cd apps/<app> && npx expo start   (cortá cuando el archivo aparezca)');
}
process.exit(malo ? 1 : 0);
