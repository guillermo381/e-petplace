/* Arnés del silencio por clase — los casos del mandato, y su rojo. */
import { clasesVisibles as cli, silenciaMensajes as smC } from '../apps/cliente/src/lib/pendientes-adopcion.ts';
import { clasesVisibles as pre } from '../apps/prestador/src/lib/pendientes-adopcion.ts';
let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
t('cliente · hogar: las dos vivas', cli(['(tabs)', 'hogar']), { carrito: true, mensajes: true });
t('cliente · EN EL HILO: mensajes callado, carrito VIVO', cli(['adoptar', 'solicitud', '[solicitudId]']), { carrito: true, mensajes: false });
t('cliente · checkout despensa: carrito callado, MENSAJES VIVO', cli(['(tabs)', 'despensa', 'checkout']), { carrito: false, mensajes: true });
t('cliente · carrito: idem', cli(['(tabs)', 'despensa', 'carrito']), { carrito: false, mensajes: true });
t('cliente · checkout de RESERVA también', cli(['explorar', 'paseo', 'checkout']), { carrito: false, mensajes: true });
t('prestador · hoy: mensajes vivo', pre(['(tabs)', 'index']), { mensajes: true });
t('prestador · en el hilo: callado', pre(['(tabs)', 'adopcion', 'solicitud', '[solicitudId]']), { mensajes: false });
t('el nombre del TAB no alcanza para callar (el guard muerto)', smC(['despensa']), false);
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
