/**
 * D-717 · LA MEDICIÓN DEL BORRADO DE `chat-ayuda`, antes y después.
 *
 * Se corre DOS veces —`antes` y `despues`— con el mismo código, para que la
 * comparación no dependa de que yo escriba dos scripts parecidos.
 *
 *   node scripts/seg2/d717-borrar-medir.mjs antes
 *   node scripts/seg2/d717-borrar-medir.mjs despues
 *
 * ── QUÉ SE MIDE Y POR QUÉ ───────────────────────────────────────────────────
 * ① **`chat-ayuda` por camino real**, con la MISMA anon key del bundle que la
 *    hacía responder 200. *El verde no puede ser «el comando delete no dio
 *    error»*: eso mide que el CLI terminó, no que la puerta se cerró.
 * ② **Las otras functions siguen respondiendo** — un delete mal apuntado es la
 *    clase de error que se ve tarde. Se prueba cada una por HTTP y se anota su
 *    status; **lo que importa no es que den 200** (la mayoría rebota por falta
 *    de credencial, que es su cura de hoy), sino que **NO den 404**: un 404 es
 *    «no existe», y ése es el síntoma del borrado equivocado.
 */
import { execFileSync } from 'node:child_process';
import { guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const fase = process.argv[2] === 'despues' ? 'despues' : 'antes';

/**
 * ⚠️ LA LISTA SE LEE DEL PROYECTO, JAMÁS SE ESCRIBE A MANO.
 *
 * La v1 de este script traía las functions tipeadas por mí y **tres nombres
 * estaban mal** (`escriba` por `escribir-presencia`, `documento-historia` por
 * `documento-historia-clinica`, `documento-ficha` por
 * `documento-ficha-identidad`) — más dos que faltaban enteras. La corrida
 * «antes» las mostró como **404**, o sea *«esta function no existe»*.
 *
 * **Si el orden hubiera sido borrar-y-después-medir, ese 404 se habría leído
 * como «el delete se llevó tres functions por delante».** Un rojo inventado
 * sobre un acto irreversible. La lista viene del objeto y el defecto no puede
 * repetirse.
 */
const FUNCTIONS = await (async () => {
  const salida = execFileSync(
    'npx',
    ['supabase', 'functions', 'list', '--project-ref', 'zyltipqscdsdsxnjclhp'],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 8 },
  );
  const json = JSON.parse(salida.slice(salida.indexOf('{"functions"')));
  const slugs = json.functions.map((f) => f.slug);
  // `chat-ayuda` se golpea SIEMPRE, aunque ya no figure en la lista: después
  // del borrado desaparece de `functions list`, y justamente ahí es donde hay
  // que preguntarle a la PUERTA si sigue abierta. Confiar en la lista sería
  // medir el catálogo en vez del camino real.
  if (!slugs.includes('chat-ayuda')) slugs.push('chat-ayuda');
  return slugs.sort((a, b) => (a === 'chat-ayuda' ? -1 : b === 'chat-ayuda' ? 1 : a.localeCompare(b)));
})();

const golpear = async (nombre) => {
  try {
    const r = await fetch(`${URL}/functions/v1/${nombre}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ANON}`, apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true }),
    });
    const txt = (await r.text().catch(() => '')).slice(0, 120).replace(/\s+/g, ' ');
    return { status: r.status, cuerpo: txt };
  } catch (e) {
    return { status: 0, cuerpo: `error de red: ${e.message}` };
  }
};

linea(`\n══ D-717 · MEDICIÓN «${fase.toUpperCase()}» del borrado de chat-ayuda ══\n`);

const filas = [];
for (const nombre of FUNCTIONS) {
  const r = await golpear(nombre);
  const desaparecida = r.status === 404;
  const marca = nombre === 'chat-ayuda'
    ? (fase === 'antes' ? (r.status === 200 ? '🎯' : '  ') : (desaparecida ? '✅' : '🔴'))
    : (desaparecida ? '🔴' : '✅');
  filas.push({ nombre, ...r, desaparecida });
  linea(`  ${marca} ${nombre.padEnd(26)} HTTP ${String(r.status).padEnd(4)} ${r.cuerpo}`);
}

const vivas = filas.filter((f) => f.nombre !== 'chat-ayuda' && !f.desaparecida).length;
const caidas = filas.filter((f) => f.nombre !== 'chat-ayuda' && f.desaparecida);
linea(`\n  ─ otras functions: ${vivas}/${FUNCTIONS.length - 1} responden (ninguna 404)`);
if (caidas.length > 0) {
  linea(`  🔴 DESAPARECIERON: ${caidas.map((c) => c.nombre).join(', ')} — delete mal apuntado`);
}

guardarSeg2(`d717-${fase}.json`, filas);
linea('');
