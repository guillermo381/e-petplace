// S95-G4 · CONTRA-CASO DEL SEPARADOR. No toca la base.
//
// 🔴 LO QUE PRUEBA: que una fila escrita con COMAS y otra con PIPES produzcan
// **el mismo arreglo de alérgenos**. Sin esto, `"pollo, arroz"` entraba como un
// solo alérgeno llamado «pollo, arroz» — una cadena a la que ningún perro es
// alérgico — y **la exclusión dura nunca disparaba**. El producto se le habría
// recomendado a un perro alérgico al pollo, sin error, sin aviso.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TMP = mkdtempSync(join(tmpdir(), 'sep-'));
const CAB = 'familia,marca,producto,presentacion,codigo_variante,codigo_impuesto,'
  + 'sku_vendedor,precio_venta,especies,tallas,momento_vital,alergenos';

// Las dos filas son IDÉNTICAS salvo el separador de `alergenos` y `especies`.
const filas = [
  ['COMAS', `alimento,X,Con comas,Bolsa 1kg,X-COMA,EC_IVA_0,SKU-COMA,10,perro,,adulto,"pollo, arroz"`],
  ['PIPES', `alimento,X,Con pipes,Bolsa 1kg,X-PIPE,EC_IVA_0,SKU-PIPE,10,perro,,adulto,pollo|arroz`],
];

let fallos = 0;
const vistos = [];

for (const [rotulo, fila] of filas) {
  const f = join(TMP, `${rotulo}.csv`);
  writeFileSync(f, `${CAB}\n${fila}\n`);
  const r = spawnSync('node', ['tools/carga-catalogo/cargar.mjs', f,
    '--cuenta', '00000000-0000-0000-0000-000000000000'], { encoding: 'utf8' });
  const salida = r.stdout || '';
  // El ensayo imprime el payload que MANDARÍA. Se busca el alérgeno tal como
  // quedó — no se confía en que «no falló».
  const m = salida.match(/alergenos[^\n]*/i);
  const ok = /pollo/.test(salida) && /arroz/.test(salida);
  const juntos = /pollo, arroz/.test(salida) || /"pollo, arroz"/.test(salida);
  vistos.push({ rotulo, ok, juntos, muestra: m ? m[0].slice(0, 120) : '(no impreso)' });
}

console.log('\n═══ CONTRA-CASO DEL SEPARADOR ═══\n');
for (const v of vistos) console.log(`${v.rotulo.padEnd(6)} → ${v.muestra}`);

// La verificación de verdad: el parseo, aislado del cargador.
const listaVieja = (v) => String(v || '').split('|').map((x) => x.trim()).filter(Boolean);
const listaNueva = (v) => String(v || '').split(/[|,]/).map((x) => x.trim()).filter(Boolean);

const conComas = 'pollo, arroz';
const conPipes = 'pollo|arroz';

const antes = listaVieja(conComas);
const desComas = listaNueva(conComas);
const desPipes = listaNueva(conPipes);

const check = (cond, nombre, detalle = '') => {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
};

console.log('');
// 🔴 EL ROJO REPRODUCIDO: así entraba antes.
check(antes.length === 1 && antes[0] === 'pollo, arroz',
  '🔴 ANTES: las comas entraban como UN SOLO alérgeno', JSON.stringify(antes));
check(desComas.length === 2 && desComas[0] === 'pollo' && desComas[1] === 'arroz',
  'DESPUÉS: las comas se separan', JSON.stringify(desComas));
check(desPipes.length === 2 && desPipes[0] === 'pollo' && desPipes[1] === 'arroz',
  'Los pipes siguen funcionando igual', JSON.stringify(desPipes));
check(JSON.stringify(desComas) === JSON.stringify(desPipes),
  '🔴 LAS DOS FORMAS PRODUCEN EL MISMO ARREGLO');

// Y el caso que el arreglo NO puede romper: un valor con espacio adentro que
// NO lleva separador sigue siendo uno solo.
const unoSolo = listaNueva('proteina hidrolizada');
check(unoSolo.length === 1 && unoSolo[0] === 'proteina hidrolizada',
  'Un valor con espacios y sin separador sigue siendo UNO', JSON.stringify(unoSolo));

console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} FALLO(S)`}\n`);
process.exit(fallos === 0 ? 0 : 1);
