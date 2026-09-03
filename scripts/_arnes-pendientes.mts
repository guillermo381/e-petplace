/* Arnés de `resumirPendientes` — sus BORDES, no su camino feliz. */
import { resumirPendientes, descontarHilo } from '../packages/domain/src/pendientesAdopcion.ts';
const f = (id, n) => ({ solicitudId: id, sinLeer: n });
let ok = 0, mal = 0;
const t = (nombre, real, esperado) => {
  const a = JSON.stringify(real), b = JSON.stringify(esperado);
  if (a === b) { ok++; console.log(`  ✓ ${nombre}`); }
  else { mal++; console.log(`  ✗ ${nombre}\n     esperado ${b}\n     real     ${a}`); }
};
t('vacío ⇒ 0 y sin destino', resumirPendientes([]), { total: 0, conversaciones: 0, unica: null });
t('todas leídas ⇒ 0', resumirPendientes([f('a',0), f('b',0)]), { total: 0, conversaciones: 0, unica: null });
t('UNA con 4 ⇒ total 4, 1 conversación, va al hilo', resumirPendientes([f('a',4), f('b',0)]), { total: 4, conversaciones: 1, unica: 'a' });
t('DOS ⇒ a la lista', resumirPendientes([f('a',1), f('b',2)]), { total: 3, conversaciones: 2, unica: null });
t('una + por revisar ⇒ a la LISTA aunque sea una', resumirPendientes([f('a',2)], 3), { total: 5, conversaciones: 1, unica: null });
t('sólo por revisar', resumirPendientes([], 2), { total: 2, conversaciones: 0, unica: null });
t('NaN no envenena el total', resumirPendientes([f('a', Number.NaN), f('b', 2)]), { total: 2, conversaciones: 1, unica: 'b' });
t('negativo no resta', resumirPendientes([f('a', -5), f('b', 1)]), { total: 1, conversaciones: 1, unica: 'b' });
t('decimal se trunca', resumirPendientes([f('a', 2.9)]), { total: 2, conversaciones: 1, unica: 'a' });
t('descontarHilo pone en 0 SÓLO el suyo', descontarHilo([f('a',4), f('b',2)], 'a'), [f('a',0), f('b',2)]);
t('descontar un id que no está no toca nada', descontarHilo([f('a',4)], 'zz'), [f('a',4)]);
t('descontar y resumir ⇒ el número baja al instante', resumirPendientes(descontarHilo([f('a',4), f('b',2)], 'a')), { total: 2, conversaciones: 1, unica: 'b' });
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
