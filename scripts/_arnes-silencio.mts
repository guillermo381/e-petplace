/* Arnés del silencio por clase — los casos del mandato, y su rojo. */
import { clasesVisibles as cli, silenciaMensajes as smC } from '../apps/cliente/src/lib/pendientes-adopcion.ts';
import { clasesVisibles as pre } from '../apps/prestador/src/lib/pendientes-adopcion.ts';
let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
t('cliente · hogar: las dos vivas', cli(['(tabs)', 'hogar']), { carrito: true, mensajes: true });
/* 🔴 EL ROJO QUE SE ME ESCAPÓ EN `8c2d87b6` y vivió una hora: apagaba SÓLO la
   clase `mensajes` en el hilo ⇒ **con el carrito lleno, el disco seguía
   dibujándose sobre el campo de texto**. La razón del hilo no es «es el
   destino»: es que la pieza TAPA la barra de escribir. */
t('cliente · EN EL HILO: la PIEZA ENTERA callada (el rojo del founder)', cli(['adoptar', 'solicitud', '[solicitudId]']), { carrito: false, mensajes: false });
t('cliente · checkout despensa: carrito callado, MENSAJES VIVO', cli(['(tabs)', 'despensa', 'checkout']), { carrito: false, mensajes: true });
t('cliente · carrito: idem', cli(['(tabs)', 'despensa', 'carrito']), { carrito: false, mensajes: true });
t('cliente · checkout de RESERVA también', cli(['explorar', 'paseo', 'checkout']), { carrito: false, mensajes: true });
t('prestador · hoy: las dos vivas', pre(['(tabs)', 'index']), { mensajes: true, solicitudes: true });
t('prestador · en el hilo: TODO callado', pre(['(tabs)', 'adopcion', 'solicitud', '[solicitudId]']), { mensajes: false, solicitudes: false });
t('prestador · en la portada de Refugio: solicitudes callada, mensajes VIVO', pre(['(tabs)', 'adopcion']), { mensajes: true, solicitudes: false });
t('prestador · en el ACTA: las dos vivas (no es la lista ni el hilo)', pre(['(tabs)', 'adopcion', 'acta', '[solicitudId]']), { mensajes: true, solicitudes: true });
t('el nombre del TAB no alcanza para callar (el guard muerto)', smC(['despensa']), false);
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
