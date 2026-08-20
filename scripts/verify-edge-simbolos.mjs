/**
 * GATE · SÍMBOLOS DE MÓDULO USADOS Y NO IMPORTADOS EN LAS EDGE FUNCTIONS
 *
 * 🔴 EL CASO QUE LO PARIÓ: el 20-ago `pagos-webhook-stg` usaba `createHmac`
 * **sin importarlo**. En Deno eso no rompe ningún build — es un
 * **ReferenceError en runtime**, uncaught, que la plataforma devuelve como
 * **500**. Y un 500 **detiene los reintentos de Nuvei para siempre**: el
 * callback del primer débito real se perdió, y durante horas el hallazgo fue
 * «el proveedor no nos llama». *Era nuestro.*
 *
 * ⚠️ **ALCANCE DECLARADO — esto NO es un typechecker.**
 * `deno check` sí lo es, y **se midió: `deno` NO está instalado en esta
 * máquina.** Sumarlo es decisión de herramienta y no la toma un script.
 *
 * 🔴 **Y por qué este gate es ANGOSTO A PROPÓSITO.** La primera versión
 * intentaba detectar *cualquier* identificador llamado sin definir: dio
 * **20 rojos sobre 22 funciones y casi todos falsos** (`async`, y palabras
 * sueltas de comentarios en español seguidas de paréntesis).
 * *Un gate que grita siempre es un gate que nadie mira* — y eso es peor que no
 * tenerlo, porque además da la sensación de estar cubierto.
 * ⇒ Se cubre **una clase, con cero falsos positivos**: símbolos conocidos de
 *   módulos que la casa importa. Si mañana hace falta más, se agrega al mapa —
 *   **la lista se AMPLÍA, no se afloja el criterio.**
 */
import fs from 'node:fs';
import path from 'node:path';

/** Símbolos que SIEMPRE vienen de un import. Si aparecen llamados y no están
 *  importados, es un ReferenceError esperando un request real. */
const DE_MODULO = [
  'createHash', 'createHmac', 'randomUUID', 'timingSafeEqual', 'createCipheriv',
  'createDecipheriv', 'pbkdf2Sync', 'scryptSync', 'createClient', 'Buffer',
];

const DIR = 'supabase/functions';
let rojo = 0, vistas = 0;

for (const d of fs.readdirSync(DIR, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const f = path.join(DIR, d.name, 'index.ts');
  if (!fs.existsSync(f)) continue;
  vistas++;

  const src = fs.readFileSync(f, 'utf8');
  // Comentarios fuera: `pg_get_functiondef` nos enseñó que un censo que lee
  // comentarios como código confunde una advertencia con una infracción (L-170).
  const codigo = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

  const importados = new Set();
  for (const m of codigo.matchAll(/import\s*\{([^}]+)\}\s*from/g))
    m[1].split(',').forEach((x) => importados.add(x.trim().split(/\s+as\s+/).pop()));
  for (const m of codigo.matchAll(/import\s+(\w+)[\s,]/g)) importados.add(m[1]);

  const faltan = DE_MODULO.filter(
    (s) => new RegExp(`(^|[^.\\w$])${s}\\s*\\(`, 'm').test(codigo) && !importados.has(s),
  );
  if (faltan.length) { console.log(`🔴 ${d.name}: usa ${faltan.join(', ')} sin importar`); rojo++; }
}

console.log(rojo
  ? `\n🔴 ${rojo} de ${vistas} funciones con símbolos de módulo sin importar`
  : `\n✓ ${vistas} funciones · ningún símbolo de módulo usado sin importar`);
process.exit(rojo ? 1 : 0);
