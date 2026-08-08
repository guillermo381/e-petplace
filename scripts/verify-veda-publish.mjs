// LA VEDA DE PUBLICACIÓN, MECANIZADA — S91-A
//
// ═══ POR QUÉ EXISTE, con sus tres choques medidos ═══════════════════════════
// La candidata (e) de S75 ya lo nombraba —«la ventana de publish congela
// BILATERALMENTE»— y siguió siendo una INTENCIÓN. En S91 chocó tres veces en
// una sola sesión, y las tres son la misma causa con tres caras:
//
//   ① ancla con ASTERISCO: al bundlear, el árbol tenía el verify script de
//      otra pista modificado. El asterisco salió impreso y nadie frenó.
//   ② WIP AJENO DENTRO DEL BUNDLE: se publicó con `packages/api` sin
//      commitear — código que no vivía en NINGÚN commit viajó al teléfono.
//   ③ EL ANCLA ESCRITA A MANO MINTIÓ, y esto no lo nombraba nadie: un
//      publish declaró «ancla f4c9a134» y su `gitCommitHash` real fue
//      `5012db53` —un commit de OTRA pista— porque el árbol avanzó entre el
//      commit propio y el bundling. **El mensaje decía una cosa y el bundle
//      salió de otra.**
//
// LA LECCIÓN QUE ORDENA EL MECANISMO: anunciar la veda no alcanza, porque el
// daño no lo hace quien publica — lo hace quien ESCRIBE mientras el otro
// publica, y esa persona no está mirando. **Un aviso que no frena, no
// frena** (D-584). Lo único exigible es que la herramienta se niegue.
//
// ═══ QUÉ HACE ══════════════════════════════════════════════════════════════
//   ① ÁRBOL LIMPIO o ABORTA — y nombra los archivos CON SU TERRITORIO, así
//      quien publica sabe a quién pedirle que commitee en vez de adivinar.
//   ② HEAD PUSHEADO o ABORTA: un ancla que solo existe en un disco no la
//      puede reproducir nadie. (Regla 84 ②: la verificación es por
//      CONTENIDO, y no hay contenido si el commit no viajó.)
//   ③ IMPRIME EL ANCLA REAL y el mensaje ya armado. **El ancla no se
//      escribe a mano nunca más**: se copia de acá. Ese fue el choque ③.
//
// USO (desde la raíz, antes de `eas update`):
//   node scripts/verify-veda-publish.mjs --app cliente --mensaje "qué cambió"
//
// NO reemplaza al aviso a la mesa: lo vuelve innecesario para el modo de
// falla más caro, que es el silencioso.
import { execFileSync } from 'node:child_process';

const g = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();

function territorioDe(ruta) {
  if (ruta.startsWith('packages/ui/') || ruta.startsWith('scripts/verify-diseno')) return 'B';
  if (ruta.startsWith('apps/')) return 'C';
  if (
    ruta.startsWith('supabase/') ||
    ruta.startsWith('packages/api/') ||
    ruta.startsWith('packages/domain/') ||
    ruta.startsWith('docs/')
  ) return 'A';
  // `scripts/` es COMPARTIDO: los verify los escribe quien construye la
  // pieza que verifican. No se adivina el dueño — se pregunta al objeto.
  if (ruta.startsWith('scripts/')) return 'compartido';
  return '?';
}

/** Para `scripts/` y para todo lo ambiguo: el objeto sabe quién lo tocó. */
function ultimoAutor(ruta) {
  try {
    const a = execFileSync('git', ['log', '-1', '--format=%an', '--', ruta], { encoding: 'utf8' }).trim();
    return a.length > 0 ? a : null;
  } catch {
    return null;
  }
}

const args = process.argv.slice(2);
const app = args[args.indexOf('--app') + 1];
const iM = args.indexOf('--mensaje');
const mensaje = iM >= 0 ? args[iM + 1] : null;
if (app !== 'cliente' && app !== 'prestador') {
  console.log('uso: node scripts/verify-veda-publish.mjs --app <cliente|prestador> [--mensaje "…"]');
  process.exit(1);
}

let fallos = 0;
console.log(`── veda de publicación · ${app}\n`);

// ① EL ÁRBOL
const sucio = g('status', '--porcelain')
  .split('\n')
  .filter((l) => l.trim().length > 0);
if (sucio.length === 0) {
  console.log('✓ ① árbol limpio — el bundle va a salir de un commit y nada más');
} else {
  fallos += 1;
  console.log(`✗ ① ÁRBOL SUCIO: ${sucio.length} archivo(s) — EL PUBLISH NO OCURRE.`);
  const porT = new Map();
  for (const l of sucio) {
    const ruta = l.slice(3);
    const t = territorioDe(ruta);
    porT.set(t, [...(porT.get(t) ?? []), ruta]);
  }
  for (const [t, rutas] of [...porT].sort()) {
    console.log(`\n   territorio ${t}:`);
    for (const r of rutas) {
      const autor = t === 'compartido' || t === '?' ? ultimoAutor(r) : null;
      console.log(`     ${r}${autor !== null ? `   (último autor: ${autor})` : ''}`);
    }
  }
  console.log('\n   Esto NO se resuelve con --force ni ignorándolo: lo que está');
  console.log('   sin commitear VIAJA AL BUNDLE y no vive en ningún commit.');
  console.log('   Si el territorio no es tuyo, pedile a esa pista que commitee');
  console.log('   (o que guarde su WIP) — es literalmente la veda bilateral.');
}

// ② EL ANCLA TIENE QUE SER ALCANZABLE
try {
  execFileSync('git', ['fetch', 'origin', '--quiet'], { stdio: 'ignore' });
} catch {
  console.log('  ⚠ no se pudo hacer fetch — la comparación con origin usa lo que hay en disco');
}
const head = g('rev-parse', 'HEAD');
let enOrigin = false;
try {
  execFileSync('git', ['merge-base', '--is-ancestor', head, 'origin/main'], { stdio: 'ignore' });
  enOrigin = true;
} catch {
  enOrigin = false;
}
if (enOrigin) {
  console.log('✓ ② el ancla está en origin/main — cualquiera puede reproducirla');
} else {
  fallos += 1;
  console.log('✗ ② HEAD NO ESTÁ EN origin/main — EL PUBLISH NO OCURRE.');
  console.log('   Un ancla que solo existe en un disco no la puede verificar nadie:');
  console.log('   el gate del founder quedaría sobre un bundle irreproducible.');
}

// ③ EL ANCLA, PARA COPIAR (jamás escribirla a mano — choque ③)
const corto = head.slice(0, 8);
const asunto = g('log', '-1', '--format=%s').slice(0, 72);
console.log(`\n── EL ANCLA REAL: ${corto}`);
console.log(`   (su asunto: ${asunto})`);
if (mensaje !== null) {
  console.log('\n── EL COMANDO, con el ancla ya puesta:');
  console.log(`   cd apps/${app} && npx eas-cli update --channel preview \\`);
  console.log(`     --environment development --message "${mensaje} — ancla ${corto}"`);
}

console.log(
  fallos === 0
    ? '\n✅ VEDA VERDE — se puede publicar.'
    : `\n🚫 ${fallos} bloqueo(s). El publish NO ocurre hasta resolverlos.`,
);
process.exit(fallos === 0 ? 0 : 1);
