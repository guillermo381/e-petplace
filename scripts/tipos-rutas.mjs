#!/usr/bin/env node
/**
 * S113-E · `tipos:rutas` — GENERA Y VIGILA `.expo/types/router.d.ts`.
 *
 * ═══ EL PROBLEMA, MEDIDO ═══════════════════════════════════════════════════
 * `.expo/types/router.d.ts` **lo genera Metro y está en `.gitignore`**: no
 * viaja con el merge, así que todo worktree nuevo nace sin él. Y
 * `scripts/guard-rutas-tipadas.mjs` (S109-A, `L-450`) corre pegado al `tsc` y
 * sale ROJO cuando falta — a propósito: sin ese archivo `tsc` **deja de medir
 * las rutas** y sale verde por ausencia, que es peor que un rojo.
 *
 * ═══ 🔴 LA v1 DE ESTE SCRIPT MEDÍA PRESENCIA, NO VIGENCIA ══════════════════
 * Decía **«ya existía»** ante cualquier archivo y no regeneraba. **Se cobró:**
 * un worktree tenía un `router.d.ts` viejo, la ruta `/antiparasitario` no
 * figuraba en él, y el script informó verde — *`tsc` medía rutas, sí, pero
 * las de ayer.* Un archivo presente y vencido es **peor** que uno ausente: el
 * ausente lo caza el guard; el vencido pasa los dos.
 *
 * ⇒ **Ahora regenera SIEMPRE y compara antes/después.** El archivo no se
 * juzga por existir: se juzga por coincidir con las rutas de hoy.
 *
 * ═══ DOS MODOS, y la diferencia importa ════════════════════════════════════
 *   · **cura** (por defecto): regenera, dice si cambió, **sale 0**. Es lo que
 *     corrés al abrir un worktree.
 *   · **`--gate`**: regenera y **sale 1 si cambió** — porque «cambió» significa
 *     que el `tsc` que corriste antes midió contra rutas viejas. Es lo que
 *     corre el cierre.
 *
 * ⚠️ **En los dos casos el archivo queda al día.** El gate no deja el árbol
 * roto para probar su punto: informa que estaba vencido y lo cura.
 *
 * ═══ CÓMO LO GENERA ════════════════════════════════════════════════════════
 * Arrancando **`npx expo start`**, el comando de Expo que lo escribe, y
 * cortándolo apenas el archivo aparece. **No se reimplementa el generador:**
 * vive bundleado en `@expo/cli` y su forma cambia entre SDKs. *Una copia del
 * generador se desincroniza sin avisar, y lo que produce compila igual.*
 *
 * ═══ CONTROL (`--control`) ═════════════════════════════════════════════════
 *   POSITIVO  planta una ruta nueva en `src/app/` ⇒ `--gate` ROJO y nombra
 *             la ruta que entró
 *   NEGATIVO  con todo al día y sin plantar nada ⇒ `--gate` VERDE
 * Deja el árbol como lo encontró, pase lo que pase.
 *
 * Uso:
 *   node scripts/tipos-rutas.mjs                # cura las dos apps
 *   node scripts/tipos-rutas.mjs cliente        # una
 *   node scripts/tipos-rutas.mjs --gate         # cierre: rojo si estaba vencido
 *   node scripts/tipos-rutas.mjs --control
 */
import { existsSync, statSync, rmSync, renameSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const di = (s) => process.stdout.write(s + '\n');
const RUTA = '.expo/types/router.d.ts';
const APPS = ['cliente', 'prestador'];
const ESPERA_MS = 180_000;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Las rutas declaradas dentro del `router.d.ts`. Comparar el ARCHIVO entero
 * daría falsos positivos por reordenamientos; comparar el CONJUNTO de rutas
 * responde la pregunta que importa: *¿falta alguna ruta?*
 */
function rutasDe(texto) {
  const set = new Set();
  for (const m of texto.matchAll(/pathname: `([^`]+)`/g)) set.add(m[1]);
  return set;
}

/** Arranca `expo start` y corta apenas el archivo existe. */
async function invocarMetro(dir, destino) {
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
  // Metro deja hijos: se mata el GRUPO, no sólo el padre.
  try { process.kill(-hijo.pid, 'SIGKILL'); } catch { try { hijo.kill('SIGKILL'); } catch { /* ya murió */ } }
  await dormir(300);
  return aparecio;
}

/**
 * Regenera SIEMPRE y devuelve qué cambió. El archivo previo se aparta (no se
 * borra) para poder restaurarlo si la generación falla: un script que cura
 * nunca deja el árbol peor de como lo encontró.
 */
async function regenerar(app) {
  const dir = resolve('apps', app);
  const destino = join(dir, RUTA);
  if (!existsSync(dir)) return { app, ok: false, motivo: `no existe apps/${app}` };

  const habia = existsSync(destino);
  const previo = habia ? readFileSync(destino, 'utf8') : null;
  const apartado = `${destino}.previo-s113e`;
  if (habia) renameSync(destino, apartado);

  const aparecio = await invocarMetro(dir, destino);

  if (!aparecio) {
    if (habia && existsSync(apartado)) renameSync(apartado, destino);   // se restaura
    return { app, ok: false, motivo: `no se generó en ${ESPERA_MS / 1000} s (el previo quedó intacto)` };
  }
  if (existsSync(apartado)) rmSync(apartado, { force: true });

  const nuevo = readFileSync(destino, 'utf8');
  const antes = previo === null ? null : rutasDe(previo);
  const ahora = rutasDe(nuevo);
  const entraron = antes === null ? [] : [...ahora].filter((r) => !antes.has(r));
  const salieron = antes === null ? [] : [...antes].filter((r) => !ahora.has(r));

  return {
    app, ok: true,
    nacio: previo === null,
    cambio: previo === null || entraron.length > 0 || salieron.length > 0,
    entraron, salieron,
    rutas: ahora.size,
    bytes: statSync(destino).size,
  };
}

function contar(r) {
  if (!r.ok) return `🔴 ${r.app.padEnd(11)} ${r.motivo}`;
  const cab = `${r.app.padEnd(11)} ${String(r.rutas).padStart(3)} rutas · ${(r.bytes / 1024).toFixed(0)} kB`;
  if (r.nacio)  return `🟡 ${cab} · NO EXISTÍA — generado`;
  if (!r.cambio) return `✅ ${cab} · al día`;
  const d = [];
  if (r.entraron.length) d.push(`entraron ${r.entraron.length}: ${r.entraron.slice(0, 4).join(' ')}${r.entraron.length > 4 ? ' …' : ''}`);
  if (r.salieron.length) d.push(`salieron ${r.salieron.length}: ${r.salieron.slice(0, 4).join(' ')}${r.salieron.length > 4 ? ' …' : ''}`);
  return `🔴 ${cab} · ESTABA VENCIDO — ${d.join(' · ')}`;
}

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  const app = 'cliente';
  const sonda = resolve('apps', app, 'src/app/_control-s113e-ruta.tsx');
  let rojo = false;

  try {
    // Punto de partida: el archivo al día. Sin esto, el positivo podría salir
    // rojo por rutas viejas y no por la sonda — un rojo por la razón equivocada.
    di('   preparando: dejo router.d.ts al día…');
    const base = await regenerar(app);
    if (!base.ok) { di(`🔴 no pude preparar: ${base.motivo}`); process.exit(1); }

    // ① NEGATIVO: sin tocar nada, no cambia.
    const sinTocar = await regenerar(app);
    const estable = sinTocar.ok && !sinTocar.cambio;
    di(`${estable ? '✅' : '🔴'} NEGATIVO  sin plantar nada ⇒ ${estable ? 'sin cambios (verde)' : 'reporta cambios: ' + contar(sinTocar)}`);
    if (!estable) rojo = true;

    // ② POSITIVO: una ruta nueva ⇒ el archivo vigente queda vencido.
    writeFileSync(sonda, 'export default function ControlS113E() { return null; }\n');
    const conSonda = await regenerar(app);
    const laVio = conSonda.ok && conSonda.entraron.some((r) => r.includes('_control-s113e-ruta'));
    di(`${laVio ? '✅' : '🔴'} POSITIVO  ruta plantada ⇒ ${laVio ? `la nombra: ${conSonda.entraron.filter((r) => r.includes('_control-s113e-ruta')).join(' ')}` : 'NO LA VIO'}`);
    if (!laVio) rojo = true;
  } finally {
    // El árbol vuelve como estaba: se quita la sonda y se regenera sin ella.
    rmSync(sonda, { force: true });
    di('   limpiando: quito la sonda y regenero…');
    await regenerar(app);
  }

  di(rojo ? '\n🔴 tipos:rutas NO mide vigencia.' : '\n✅ mide vigencia: ve la ruta que entra y no inventa cambios cuando no los hay.');
  process.exit(rojo ? 1 : 0);
}

// ═══ CORRIDA NORMAL ═══════════════════════════════════════════════════════
const GATE = process.argv.includes('--gate');
const pedidas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const objetivo = pedidas.length ? pedidas : APPS;

// «no existía» y «existía vencido» se cuentan aparte: el primero es un
// worktree nuevo (esperable), el segundo es un tsc que YA midió mal.
let fallo = 0, vencido = 0, nacido = 0;
for (const app of objetivo) {
  const r = await regenerar(app);
  di(contar(r));
  if (!r.ok) fallo += 1;
  else if (r.nacio) nacido += 1;
  else if (r.cambio) vencido += 1;
}

if (fallo) {
  di('\n🔴 Alguna no se generó. La cura manual sigue disponible:');
  di('   cd apps/<app> && npx expo start   (cortá cuando el archivo aparezca)');
  process.exit(1);
}
if (vencido) {
  di(`\n${GATE ? '🔴' : '⚠️ '} ${vencido} app(s) tenían el router.d.ts VENCIDO — ya quedó al día.`);
  di('   Si corriste `tsc` antes de esto, midió contra rutas VIEJAS: corrélo de nuevo.');
  process.exit(GATE ? 1 : 0);
}
if (nacido) {
  // Nacer no es estar vencido: en un worktree recién creado el archivo NO
  // existe y eso es lo esperable. El guard ya lo cazaba; esto sólo lo cura.
  di(`\n✅ ${nacido} app(s) no tenían router.d.ts — generado. (Worktree nuevo: esperable.)`);
  process.exit(0);
}
di('\n✅ todo al día.');
process.exit(0);
