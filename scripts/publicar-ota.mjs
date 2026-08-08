// PUBLICAR UN OTA COMO UN SOLO ACTO — S91-A (decisión de mesa FIRMADA)
//
// ═══ POR QUÉ EXISTE, y por qué el guard anterior no alcanzó ════════════════
// `verify-veda-publish.mjs` verifica, imprime y SUELTA. Entre que suelta y
// que el bundle sale hay una ventana, y **el choque ③ volvió a pasar con el
// guard puesto**: la veda salió verde imprimiendo un ancla, otra pista
// commiteó en el hueco, y el bundle salió de un commit distinto del
// verificado. *Verificar-imprimir-y-soltar no cierra una ventana.*
//
// LA MESA OFRECIÓ DOS FORMAS Y ACÁ VAN LAS DOS, porque una sola no basta:
//   · **publica él mismo** (verifica y bundlea en el mismo acto), y
//   · **re-verifica DESPUÉS y GRITA si algo cambió**, registrando el ancla
//     REAL.
// La segunda no es redundante: **el bundling tarda ~60 segundos**, así que
// ni un acto atómico puede impedir que alguien commitee mientras corre. Lo
// único que se puede garantizar es que **sea imposible no enterarse**.
//
// ⚠️ Y LA RAZÓN POR LA QUE ESTO NO ES OPCIONAL (medido S91): el registro
// publicado **NO guarda el estado del árbol** — `eas update:view` expone
// `gitCommitHash` y nada con `dirty`. Un publish sucio **es inauditable
// después**. Este script es la única oportunidad de saberlo.
//
// USO:
//   node scripts/publicar-ota.mjs --app cliente --mensaje "qué cambió"
//   node scripts/publicar-ota.mjs --app prestador --mensaje "…" --dry-run
//
// El `--mensaje` NO lleva el ancla: la pone el script. Ese fue el choque ③.
import { execFileSync, spawnSync } from 'node:child_process';

const g = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();

const args = process.argv.slice(2);
const valor = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : null;
};
const app = valor('--app');
const mensaje = valor('--mensaje');
const dryRun = args.includes('--dry-run');

if ((app !== 'cliente' && app !== 'prestador') || mensaje === null) {
  console.log('uso: node scripts/publicar-ota.mjs --app <cliente|prestador> --mensaje "qué cambió" [--dry-run]');
  process.exit(1);
}

// ── ① LA VEDA, por el MISMO guard (una sola fuente de la verdad) ────────────
console.log('══ ① veda\n');
const veda = spawnSync('node', ['scripts/verify-veda-publish.mjs', '--app', app], {
  stdio: 'inherit',
});
if (veda.status !== 0) {
  console.log('\n🚫 la veda no pasó — el publish NO ocurre.');
  process.exit(1);
}

const antes = g('rev-parse', 'HEAD');
const cortoAntes = antes.slice(0, 8);

// ── ② EL PUBLISH, en el mismo acto ─────────────────────────────────────────
const mensajeFinal = `${mensaje} — ancla ${cortoAntes}`;
console.log(`\n══ ② publish · ancla verificada ${cortoAntes}\n`);
if (dryRun) {
  console.log('   (--dry-run: no se ejecuta el publish)');
  console.log(`   mensaje que usaría: "${mensajeFinal}"`);
  process.exit(0);
}

const pub = spawnSync(
  'npx',
  ['eas-cli', 'update', '--channel', 'preview', '--environment', 'development',
   '--message', mensajeFinal, '--non-interactive'],
  { cwd: `apps/${app}`, encoding: 'utf8' },
);
// ⚠️ EL CLI ENVUELVE SUS ETIQUETAS EN CÓDIGOS ANSI (`\x1b[2mCommit\x1b[22m`),
// así que un `/Commit\s+hash/` NO matchea: entre la palabra y el dato hay un
// escape. Se descubrió en el ESTRENO de este script — el publish salió limpio
// y el parser gritó «no pude leer el ancla». **Un guard que grita cuando no
// pasa nada se vuelve ruido y en dos sesiones nadie lo mira**, así que la
// cura es acá y no en la costumbre de ignorarlo.
const SIN_ANSI = /\x1b\[[0-9;]*m/g;
const salida = `${pub.stdout ?? ''}${pub.stderr ?? ''}`.replace(SIN_ANSI, '');
console.log(`${pub.stdout ?? ''}${pub.stderr ?? ''}`);
if (pub.status !== 0) {
  console.log('🚫 el publish FALLÓ — nada se subió.');
  process.exit(1);
}

// ── ③ LA RE-VERIFICACIÓN, que es lo que el guard viejo no hacía ────────────
console.log('══ ③ re-verificación POST-publish\n');
let gritos = 0;

const despues = g('rev-parse', 'HEAD');
if (despues !== antes) {
  gritos += 1;
  console.log('🔴 EL ÁRBOL SE MOVIÓ DURANTE EL BUNDLING.');
  console.log(`   HEAD verificado : ${cortoAntes}`);
  console.log(`   HEAD ahora      : ${despues.slice(0, 8)}`);
  console.log('   El mensaje del update dice el PRIMERO. El bundle puede haber');
  console.log('   salido del segundo — mirá la línea Commit de arriba.');
}

// El ancla REAL la dice el CLI, jamás el mensaje (choque ③).
const mCommit = /Commit\s+([0-9a-f]{7,40})(\*?)/.exec(salida);
if (mCommit === null) {
  gritos += 1;
  console.log('🔴 NO SE PUDO LEER EL ANCLA REAL de la salida del CLI.');
  console.log('   Sin ese dato el ancla del acta es una suposición: leela a mano');
  console.log('   de la línea «Commit» de arriba antes de escribir nada.');
} else {
  const real = mCommit[1];
  const sucio = mCommit[2] === '*';
  if (sucio) {
    gritos += 1;
    console.log('🔴 EL BUNDLE SALIÓ DE UN ÁRBOL SUCIO (asterisco en el ancla).');
    console.log('   Y esto NO queda registrado en ningún lado: el registro publicado');
    console.log('   no guarda el estado del árbol. Transcribilo AHORA o se pierde.');
  }
  if (!real.startsWith(antes.slice(0, real.length)) && !antes.startsWith(real)) {
    gritos += 1;
    console.log('🔴 EL ANCLA REAL NO ES LA VERIFICADA.');
    console.log(`   verificada : ${cortoAntes}`);
    console.log(`   real       : ${real.slice(0, 8)}`);
  }
  console.log(`\n── EL ANCLA REAL DEL BUNDLE: ${real.slice(0, 8)}${sucio ? ' * (ÁRBOL SUCIO)' : ''}`);
}

const grupo = /Update group ID\s+([0-9a-f-]{36})/.exec(salida);
const runtime = /Runtime version\s+([0-9.]+)/.exec(salida);
console.log(`── group   : ${grupo?.[1] ?? '(no se pudo leer — leelo de arriba)'}`);
console.log(`── runtime : ${runtime?.[1] ?? '(no se pudo leer)'}`);
console.log('\n── PARA EL ACTA, copiá estas tres líneas tal cual.');

if (gritos > 0) {
  console.log(`\n🔴 ${gritos} problema(s) DESPUÉS del publish. El OTA YA ESTÁ ARRIBA:`);
  console.log('   no se puede deshacer, así que lo único que queda es DECIRLO —');
  console.log('   en el reporte y en el acta, con los dos hashes.');
  process.exit(1);
}
console.log('\n✅ publish limpio: el ancla real es la verificada y el árbol no se movió.');
process.exit(0);
