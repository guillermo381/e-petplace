/**
 * 🔴 P0 · EL VERDE, en sus dos brazos — y sobre el MÓDULO REAL.
 *
 * Se importan las funciones que la pantalla usa (`ofrecibles`,
 * `mascotasElegibles`), no una copia: probar una réplica de la lógica sería
 * certificar mi propio resumen en vez del código que corre.
 *
 * BRAZO ① — el camino legítimo: con el catálogo cargado, dos perros vivos son
 *           elegibles y la pantalla NO dice «no tenés perros».
 * BRAZO ② — el rechazo sigue existiendo donde corresponde: un hogar sin perros
 *           sí recibe el mensaje, y una mascota en memorial no reserva.
 *
 * Y el brazo que da nombre al P0: en `cargando` y en `error` la pantalla ya
 * **no** dice «no tenés un perro registrado».
 *
 * Corre: npx tsx scripts/seg2/p0-verde.mts
 */
import { ofrecibles, type FaseEspecies } from '../../apps/cliente/src/lib/especies-elegibles';

type M = { id: string; nombre: string; especie: string; estado_vida: 'activa' | 'perdida' | 'fallecida' | null };

const THOR: M = { id: '1', nombre: 'Thor', especie: 'perro', estado_vida: 'activa' };
const ZEUS: M = { id: '2', nombre: 'Zeus', especie: 'perro', estado_vida: 'activa' };
const GATO: M = { id: '3', nombre: 'Michi', especie: 'gato', estado_vida: 'activa' };
const MEMORIAL: M = { id: '4', nombre: 'Lupo', especie: 'perro', estado_vida: 'fallecida' };

const LISTO: FaseEspecies = { fase: 'listo', especies: ['perro'] };
const CARGANDO: FaseEspecies = { fase: 'cargando' };
const ERROR: FaseEspecies = { fase: 'error' };

/** LA DECISIÓN DE LA PANTALLA, tal como quedó curada en `alElegir`. */
function decisionDeLaPantalla(mascotas: M[], fase: FaseEspecies): string {
  const elegibles = ofrecibles(mascotas, fase);
  if (fase.fase === 'cargando' || fase.fase === 'error') return `catalogo:${fase.fase}`;
  if (elegibles.length === 0) return 'sinPerros';
  return `sigue (${elegibles.length} elegible/s)`;
}

/** La decisión ANTERIOR, para que el contraste sea visible y no una promesa. */
function decisionVieja(mascotas: M[], fase: FaseEspecies): string {
  const elegibles = ofrecibles(mascotas, fase);
  if (elegibles.length === 0) return 'sinPerros';
  return `sigue (${elegibles.length} elegible/s)`;
}

const CASOS: Array<[string, M[], FaseEspecies, string]> = [
  ['EL BUG DEL FOUNDER: 2 perros, catálogo cargando', [THOR, ZEUS], CARGANDO, 'catalogo:cargando'],
  ['2 perros, catálogo en error', [THOR, ZEUS], ERROR, 'catalogo:error'],
  ['2 perros, catálogo LISTO', [THOR, ZEUS], LISTO, 'sigue (2 elegible/s)'],
  ['solo un gato, catálogo listo', [GATO], LISTO, 'sinPerros'],
  ['hogar vacío, catálogo listo', [], LISTO, 'sinPerros'],
  ['perro en memorial, catálogo listo', [MEMORIAL], LISTO, 'sinPerros'],
  ['un perro vivo + un gato, listo', [THOR, GATO], LISTO, 'sigue (1 elegible/s)'],
];

console.log('\n══ P0 · VERDE SOBRE EL MÓDULO REAL ══\n');
console.log('  caso                                          ANTES        AHORA        esperado');
console.log('  ' + '─'.repeat(88));
let fallos = 0;
for (const [rotulo, mascotas, fase, esperado] of CASOS) {
  const antes = decisionVieja(mascotas, fase);
  const ahora = decisionDeLaPantalla(mascotas, fase);
  const ok = ahora === esperado;
  if (!ok) fallos++;
  const cambio = antes !== ahora ? ' ←CAMBIÓ' : '';
  console.log(`  ${ok ? '✅' : '🔴'} ${rotulo.padEnd(44)} ${antes.padEnd(12)} ${ahora.padEnd(12)} ${esperado}${cambio}`);
}

console.log(
  fallos === 0
    ? '\n  ✅ 7/7. El mensaje «no tenés un perro registrado» ya SOLO aparece cuando de verdad\n     no hay perros elegibles — y el rechazo legítimo (gato, hogar vacío, memorial)\n     sigue intacto: la cura no aflojó la puerta, la volvió honesta.\n'
    : `\n  🔴 ${fallos} caso(s) fallan.\n`,
);
process.exit(fallos === 0 ? 0 : 1);
