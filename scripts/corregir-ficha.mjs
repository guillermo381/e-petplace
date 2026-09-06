/**
 * CORRECCIÓN DE FICHA DE RAZA — el procedimiento que el founder firmó (5-sep-2026).
 *
 * ── QUÉ HACE, Y QUÉ NO HACE ─────────────────────────────────────────────────
 * Aplica una corrección **sobre la ficha YA CARGADA**. 🔴 **No regenera nada:**
 * volver a llamar al modelo para arreglar una frase costaría plata y devolvería
 * un texto distinto en todo lo demás — *el founder corrigió UNA cosa, no pidió
 * otra ficha.*
 *
 * Deja `revisado_por` = founder con su fecha, y publica. **La firma y la
 * publicación son un solo acto** porque el CHECK de la tabla los ata: no existe
 * forma de encender `activo` sin revisor y sin fecha.
 *
 * ── EL CENSO, QUE ES LA MITAD QUE IMPORTA ───────────────────────────────────
 * Toda corrección de una PALABRA o un GIRO se censa sobre las 210 fichas antes
 * de tocar nada. *Una palabra que el founder corrigió en una ficha casi nunca
 * está en una sola:* «chicos» apareció en 28. Si el censo encuentra más de una,
 * el script lo dice y **la regla va al prompt de D**, porque corregir a mano lo
 * que el modelo va a volver a escribir es trabajo que se repite para siempre.
 *
 * ⚠️ Y el censo distingue: reporta las otras fichas, **no las cambia**. Cambiar
 * en bloque lo que se leyó en un caso es cómo se escribió «espacios niños».
 *
 * ── USO ─────────────────────────────────────────────────────────────────────
 *   node scripts/corregir-ficha.mjs --raza <código|nombre> --campo <campo> \
 *        --cambio "el texto nuevo"          # reemplaza el campo entero
 *   node scripts/corregir-ficha.mjs --raza <…> --campo <…> \
 *        --quitar "la frase exacta"          # la saca, deja el resto intacto
 *   … --seco     → muestra el antes/después y el censo, y NO escribe nada.
 *
 * campos: origen · temperamento · talla_adulta · esperanza_vida ·
 *         predisposiciones · cuidados.cachorro · cuidados.adulto · cuidados.senior
 */
import { execFileSync } from 'node:child_process';

/**
 * 🔴 SE HABLA CON LA BASE POR EL CLI, NO POR EL CLIENTE JS, y no es capricho:
 * medido hoy, **`anon` no tiene GRANT sobre `cat_razas`** —la policy se llama
 * `cat_razas_select_publica` y concede a `public`, pero sin grant no alcanza
 * nada (L-216)—, y escribir contenido publicado exige admin de todos modos.
 * *Pedir una llave de servicio para corregir una frase sería agrandar la
 * superficie por comodidad.* El CLI es el mismo camino por el que pasó todo lo
 * demás de esta sesión.
 */
function sql(texto) {
  const salida = execFileSync('npx',
    ['--yes', 'supabase', '--experimental', 'db', 'query', '--linked', '--file', '/dev/stdin'],
    { input: texto, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const m = /\{[\s\S]*\}/.exec(salida);
  if (!m) throw new Error('la base no devolvió JSON: ' + salida.slice(-300));
  const d = JSON.parse(m[0]);
  if (d._tag === 'Error') throw new Error(d.error?.message ?? 'error de la base');
  return d.rows ?? [];
}
const lit = (x) => "'" + String(x).replace(/'/g, "''") + "'";

const FOUNDER = '75d0798a-ea90-4a97-a2f2-74f3234d892a';
const PLANOS = ['origen', 'temperamento', 'talla_adulta', 'esperanza_vida'];
const ETAPAS = ['cachorro', 'adulto', 'senior'];

function arg(n) {
  const i = process.argv.indexOf('--' + n);
  return i === -1 ? null : process.argv[i + 1];
}
const seco = process.argv.includes('--seco');
const raza = arg('raza');
const campo = arg('campo');
const cambio = arg('cambio');
const quitar = arg('quitar');

if (!raza || !campo || (!cambio && !quitar)) {
  console.log('  uso: --raza <código|nombre> --campo <campo> (--cambio "texto" | --quitar "frase") [--seco]');
  console.log('  campos: ' + PLANOS.join(' · ') + ' · predisposiciones · ' + ETAPAS.map((e) => 'cuidados.' + e).join(' · '));
  process.exit(1);
}
const etapa = campo.startsWith('cuidados.') ? campo.slice(9) : null;
if (!PLANOS.includes(campo) && campo !== 'predisposiciones' && !ETAPAS.includes(etapa ?? '')) {
  console.log(`  🔴 campo desconocido: ${campo}`);
  process.exit(1);
}


// ── La ficha, por código o por nombre ───────────────────────────────────────
const cat = sql(`select especie, slug, nombre from cat_razas
  where slug = ${lit(raza)} or nombre = ${lit(raza)} limit 2;`);
if (cat.length === 0) { console.log(`  🔴 no hay ninguna raza «${raza}» en el catálogo`); process.exit(1); }
if (cat.length > 1) {
  console.log(`  🔴 «${raza}» coincide con ${cat.length}: ` + cat.map((c) => `${c.especie}/${c.slug}`).join(' · '));
  console.log('     usá el código, no el nombre.');
  process.exit(1);
}
const { especie, slug, nombre } = cat[0];

const [fila] = sql(`select * from razas_contenido
  where especie = ${lit(especie)} and raza_codigo = ${lit(slug)};`);
if (!fila) { console.log(`  🔴 ${especie}/${slug} («${nombre}») no tiene ficha cargada.`); process.exit(1); }
if (!fila.conocida) {
  console.log(`  🔴 la ficha de ${especie}/${slug} está VACÍA (el modelo no reconoció la raza).`);
  console.log('     No se puede publicar una ficha vacía, y corregir un campo no la llena.');
  process.exit(1);
}

// ── El cambio ───────────────────────────────────────────────────────────────
const antesTxt = etapa ? (fila.cuidados_por_etapa?.[etapa] ?? null)
  : campo === 'predisposiciones' ? (fila.predisposiciones ?? []).join('\n')
  : fila[campo];

if (quitar && (antesTxt === null || !antesTxt.includes(quitar))) {
  console.log(`  🔴 la frase no está en ${campo}. No se toca nada.`);
  console.log(`     buscada: «${quitar}»`);
  process.exit(1);
}
const despuesTxt = quitar
  ? antesTxt.replace(quitar, '').replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').trim()
  : cambio;

console.log(`  ficha: ${especie}/${slug} · «${nombre}»`);
console.log(`  campo: ${campo}`);
console.log(`  ANTES:   ${antesTxt === null ? '(vacío)' : antesTxt}`);
console.log(`  DESPUÉS: ${despuesTxt}`);

/* 🔴 EL MUÑÓN — lo encontró la primera prueba en seco de este mismo script.
   `--quitar "espacios chicos"` dejó «Se adapta bien a y disfruta del contacto
   humano»: **sacar un sintagma del medio de una oración no deja una oración más
   corta, deja una rota.** El modo `--quitar` sirve para frases COMPLETAS —una
   cláusula entre comas, una oración entera—, no para un par de palabras.
   *Un instrumento que produce texto roto sin decirlo es peor que uno que no
   existe: el texto roto se publica.* */
if (quitar) {
  const roto = / (a|de|en|con|para|por|y|o|del|al) (y|o|\.|,)/i.test(despuesTxt) ||
    /\s(a|de|en|con|para|por|del|al)\s*$/i.test(despuesTxt) ||
    /,\s*,|\.\s*\./.test(despuesTxt);
  if (roto) {
    console.log('\n  🔴 EL TEXTO QUEDA ROTO: sacar esas palabras dejó un muñón gramatical.');
    console.log('     `--quitar` es para una frase COMPLETA (una cláusula, una oración).');
    console.log('     Para cambiar un par de palabras, mandá el campo entero con `--cambio`.');
    console.log('     No se escribió nada.');
    process.exit(1);
  }
}

// ── EL CENSO, antes de escribir ─────────────────────────────────────────────
// Se censa el TEXTO QUITADO, o —si es un reemplazo— las palabras que salieron
// del texto viejo. Es lo que contesta «¿esto se repite?».
const salieron = quitar ? [quitar]
  : (antesTxt ?? '').split(/\s+/).filter((w) => w.length > 4 && !despuesTxt.includes(w));
const aguja = quitar ?? (salieron.length > 0 && salieron.length <= 3 ? salieron.join(' ') : null);

if (aguja) {
  const todas = sql(`select especie, raza_codigo, origen, temperamento, talla_adulta,
    esperanza_vida, predisposiciones, cuidados_por_etapa from razas_contenido;`);
  const otras = todas.filter((f) => {
    if (f.especie === especie && f.raza_codigo === slug) return false;
    return JSON.stringify(f).includes(aguja);
  });
  console.log(`\n  ── CENSO de «${aguja}» sobre las ${todas.length} fichas ──`);
  if (otras.length === 0) {
    console.log('     sólo en ésta. Es una corrección puntual, no una regla.');
  } else {
    console.log(`     🔴 está en ${otras.length} ficha(s) MÁS: ` +
      otras.slice(0, 12).map((f) => f.especie + '/' + f.raza_codigo).join(' · ') +
      (otras.length > 12 ? ` … y ${otras.length - 12} más` : ''));
    console.log('     ⚠️ NO se cambian acá: cambiar en bloque lo que se leyó en un caso');
    console.log('        es cómo se escribió «espacios niños». Va como REGLA al prompt de D.');
  }
}

if (seco) { console.log('\n  --seco: no se escribió nada.'); process.exit(0); }

// ── La escritura, la firma y la publicación: un solo acto ───────────────────
const parche = { revisado_por: FOUNDER, revisado_en: new Date().toISOString(), activo: true };
if (etapa) parche.cuidados_por_etapa = { ...fila.cuidados_por_etapa, [etapa]: despuesTxt };
else if (campo === 'predisposiciones') parche.predisposiciones = despuesTxt.split('\n').map((s) => s.trim()).filter(Boolean);
else parche[campo] = despuesTxt;

const sets = Object.entries(parche).map(([k, v]) =>
  `${k} = ` + (typeof v === 'boolean' ? String(v)
    : Array.isArray(v) ? `array[${v.map(lit).join(',')}]::text[]`
    : typeof v === 'object' ? `${lit(JSON.stringify(v))}::jsonb`
    : lit(v)));
try {
  sql(`update razas_contenido set ${sets.join(', ')}
       where especie = ${lit(especie)} and raza_codigo = ${lit(slug)};
       select count(*) filter (where activo) as publicadas from razas_contenido;`);
  const [{ publicadas }] = sql('select count(*) filter (where activo) as publicadas from razas_contenido;');
  console.log(`\n  ✅ corregida, firmada por el founder y PUBLICADA. Van ${publicadas} publicadas.`);
} catch (e) {
  console.log(`\n  🔴 no se pudo escribir: ${e.message}`);
  process.exit(1);
}
