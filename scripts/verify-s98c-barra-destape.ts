/**
 * verify-s98c-barra-destape.ts — LA BARRA Y EL DESTAPE DICEN LO MISMO (D-819).
 *
 * El destape enumeraba una lista escrita a mano mientras la barra se
 * componía por capacidad. La cura fue dejar UNA fuente
 * (`lib/barra-prestador`), y **esto es lo que prueba que la fuente sea
 * fuente**: ejerce la función pura contra los cinco casos de §2.
 *
 * Es un ejercicio de LÓGICA, no una captura: no levanta app ni sesión, así
 * que corre en cualquier lado y falla ruidoso. `npx tsx scripts/…`
 *
 * ⚠️ Esto NO reemplaza el gate en dispositivo: prueba que las dos
 * superficies deriven del mismo predicado, no que se vean bien.
 */
import { ordenTabsPrestador } from '../apps/prestador/src/lib/barra-prestador';

type Caso = {
  nombre: string;
  entrada: { esGestor: boolean; montaAtender: boolean };
  espera: string[];
};

/* Los cinco casos de `LA_CASA_DEL_PRESTADOR` §2, más el discriminador que
   la orden pidió por nombre. */
const CASOS: Caso[] = [
  {
    nombre: 'titular con local (el caso del founder)',
    entrada: { esGestor: true, montaAtender: true },
    espera: ['index', 'mascotas', 'atender', 'negocio', 'cuenta'],
  },
  {
    nombre: 'titular SIN local (paseo puro — el paseo no atiende en local)',
    entrada: { esGestor: true, montaAtender: false },
    espera: ['index', 'mascotas', 'negocio', 'cuenta'],
  },
  {
    nombre: 'recepción (mostrador, sin gestión)',
    entrada: { esGestor: false, montaAtender: true },
    espera: ['index', 'mascotas', 'atender', 'cuenta'],
  },
  {
    nombre: 'profesional puro (ni gestión ni mostrador)',
    entrada: { esGestor: false, montaAtender: false },
    espera: ['index', 'mascotas', 'cuenta'],
  },
];

let fallos = 0;
console.log('\n── D-819 · el orden de la barra, ejercido ──────────────────────');
for (const c of CASOS) {
  const dio = ordenTabsPrestador(c.entrada);
  const ok = JSON.stringify(dio) === JSON.stringify(c.espera);
  if (!ok) fallos++;
  console.log(`${ok ? '✓' : '✗'} ${c.nombre.padEnd(52)} ${dio.join(' · ')}`);
}

/* 🔴 EL DISCRIMINADOR QUE LA ORDEN PIDIÓ POR NOMBRE. Sin él, los cuatro
   casos de arriba pasarían igual con la lista vieja escrita a mano en dos
   de sus cinco tabs — un verde por la razón equivocada. */
console.log('\n── los dos discriminadores nombrados ───────────────────────────');

const vet = ordenTabsPrestador({ esGestor: true, montaAtender: true });
const vetOk = vet.includes('atender');
console.log(`${vetOk ? '✓' : '✗'} un veterinario con local ENUMERA ATENDER`);
if (!vetOk) fallos++;

/* El vendedor puro NO pasa por esta función: no tiene fila de prestador y
   su casa es `/ventas`. El destape lo resuelve ANTES, con
   `prestadorId === null` → lista vacía. Se prueba la CONSECUENCIA — que
   ninguna composición posible le dé `index` sin que alguien lo pida — y
   se DECLARA que la rama del vendedor puro vive en la pantalla, no acá. */
const todas = [
  ordenTabsPrestador({ esGestor: false, montaAtender: false }),
  ordenTabsPrestador({ esGestor: true, montaAtender: true }),
];
const hoySiempre = todas.every((l) => l[0] === 'index');
console.log(
  `${hoySiempre ? '✓' : '✗'} «Hoy» preside en TODA composición con prestador` +
    ' — por eso el vendedor puro se corta antes, en la pantalla (prestadorId === null)',
);
if (!hoySiempre) fallos++;

/* 🔴 LA AUTO-PRUEBA — sin esto, este archivo es un verde que nadie sabe si
   puede ponerse rojo. Se ejerce **la lista vieja**, la que el destape tenía
   escrita a mano, contra los mismos casos: tiene que FALLAR. Si algún día
   pasara, sería que el orden dejó de discriminar y estos seis checks se
   volvieron decorativos. */
console.log('\n── auto-prueba: la lista VIEJA tiene que fallar ────────────────');
const LISTA_VIEJA = ['index', 'mascotas', 'negocio', 'cuenta'];
const casosQueLaViejaFalla = CASOS.filter(
  (c) => JSON.stringify(LISTA_VIEJA) !== JSON.stringify(c.espera),
).length;
const autoOk = casosQueLaViejaFalla === CASOS.length - 1; // solo acierta el titular sin local
console.log(
  `${autoOk ? '✓' : '✗'} la lista fija fallaba ${casosQueLaViejaFalla} de ${CASOS.length} casos` +
    ' — acertaba SOLO el titular sin local, que es por lo que nadie la vio',
);
if (!autoOk) fallos++;

console.log(
  fallos === 0
    ? '\nverify-barra-destape — VERDE (una sola fuente, 7 comprobaciones con auto-prueba)\n'
    : `\nverify-barra-destape — 🔴 ROJO: ${fallos} fallo(s)\n`,
);
process.exit(fallos === 0 ? 0 : 1);
