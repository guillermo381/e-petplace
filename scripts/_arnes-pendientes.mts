/* Arnés de `resumirPendientes` — sus BORDES, no su camino feliz.
   El número cuenta CONVERSACIONES (firma del founder): cada unidad es una cosa
   que atender, y el descuento al instante sale exacto sin datos extra. */
import { resumirPendientes, descontarHilo } from '../packages/domain/src/pendientesAdopcion.ts';
const c = (hilos: string[], revisar = 0) => ({ hilosConSinLeer: hilos, solicitudesPorRevisar: revisar });
let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
t('vacío ⇒ 0 y sin destino', resumirPendientes(c([])), { total: 0, conversaciones: 0, unica: null });
t('UNA ⇒ va al hilo', resumirPendientes(c(['a'])), { total: 1, conversaciones: 1, unica: 'a' });
t('DOS ⇒ a la lista', resumirPendientes(c(['a', 'b'])), { total: 2, conversaciones: 2, unica: null });
t('una + por revisar ⇒ a la LISTA aunque sea una', resumirPendientes(c(['a'], 3)), { total: 4, conversaciones: 1, unica: null });
t('sólo por revisar', resumirPendientes(c([], 2)), { total: 2, conversaciones: 0, unica: null });
t('id repetido NO cuenta dos veces', resumirPendientes(c(['a', 'a'])), { total: 1, conversaciones: 1, unica: 'a' });
t('cadena vacía se descarta', resumirPendientes(c(['', 'a'])), { total: 1, conversaciones: 1, unica: 'a' });
t('NaN en por-revisar no envenena', resumirPendientes(c(['a'], Number.NaN)), { total: 1, conversaciones: 1, unica: 'a' });
t('por-revisar negativo no resta', resumirPendientes(c(['a'], -5)), { total: 1, conversaciones: 1, unica: 'a' });
t('descontar saca SÓLO su hilo', descontarHilo(c(['a', 'b'], 2), 'a'), c(['b'], 2));
t('descontar CONSERVA el por-revisar', descontarHilo(c(['a'], 3), 'a'), c([], 3));
t('descontar un id que no está no toca nada', descontarHilo(c(['a']), 'zz'), c(['a']));
t('descontar y resumir ⇒ baja EXACTAMENTE uno', resumirPendientes(descontarHilo(c(['a', 'b']), 'a')), { total: 1, conversaciones: 1, unica: 'b' });
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
