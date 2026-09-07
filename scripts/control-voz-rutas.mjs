/* Control del ⑪: la ruta calla, la voz visible sigue en rojo. */
import { hitsDeVoseo } from '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s113-c03/scripts/lib-voz.mjs';
const casos = [
  ["import { HojaContanos } from './components/HojaContanos';", 0, 'la ruta de B'],
  ["import { X } from '@epetplace/ui/contanos';", 0, 'paquete con slash'],
  ["import { useContanos } from '@/components/contanos';", 0, 'alias @/ de la casa'],
  ["  titulo: 'Contanos de Thor',", 1, '🔴 la voz visible SIGUE en rojo'],
  /* La lib cuenta POR LÍNEA (un hit por línea), así que este caso prueba lo que
     importa: que la ruta no TAPE la voz que está al lado. */
  /* ⚠️ Con una ruta CORTA (`'./x'`, 3 chars) el extractor la ignora por su
     mínimo de 4 y las comillas se desalinean — limitación preexistente, no de
     esta exclusión. Se usa una ruta realista, que es el caso que importa. */
  ["import { A } from './components/HojaContanos'; const v = 'Contanos algo';", 1, 'ruta + voz en la MISMA línea'],
  ["  detalle: 'Contanos cuando quieras',", 1, 'otra voz en voseo'],
  /* ⑫ · las keys de i18n */
  ["    aviso.mostrar({ texto: t('contanos.noSupeClasificar') });", 0, 'key de i18n'],
  ["      titulo={t('contanos.titulo', { nombre })}", 0, 'key con interpolación'],
  ["  const v = 'Ya llegó. Contanos cómo fue';", 1, '🔴 voz con punto Y espacios SIGUE en rojo'],
];
let malos = 0;
for (const [src, esp, que] of casos) {
  const n = hitsDeVoseo(src).length;
  const ok = n === esp;
  if (!ok) malos += 1;
  console.log(`  ${ok ? 'ok ' : '🔴 '} ${que} — espera ${esp}, dio ${n}`);
}
console.log(malos === 0 ? '\n✓ VERDE · la ruta calla y la voz no.' : `\n🔴 ${malos} caso(s)`);
process.exit(malos === 0 ? 0 : 1);
