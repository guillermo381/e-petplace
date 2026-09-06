/* Arnés del PASAPORTE (S113-B · 1.3) — y su lector es el que ordena todo: **un
   desconocido, en la calle, con el animal en brazos.** Importa sólo módulos
   puros: no levanta React ni toca red. */
import { readFileSync } from 'node:fs';
import {
  paginaPasaporte, telHref, type DatosPasaportePublico, type VozPasaportePublico,
} from '../supabase/functions/_shared/pasaporte-html.ts';
import { svgDeLaPlaca, ladoQrMm, LADO_MM, MARGEN_MM } from '../packages/ui/src/components/placa-qr.ts';
import { sePintaPasaporte, filtrarPorVisibilidad } from '../packages/ui/src/components/pasaporte-qr.ts';

let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const NO_CONCLUYENTE: string[] = [];
const src = (p: string) => {
  try { return sinComentarios(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')); }
  catch { NO_CONCLUYENTE.push(p); return ''; }
};
const TARJETA = src('packages/ui/src/components/TarjetaPasaporte.tsx');
const ACCIONES = src('packages/ui/src/components/AccionesPasaporte.tsx');
const CONFIG = src('packages/ui/src/components/ConfiguracionPasaporte.tsx');
const NFC = src('packages/ui/src/components/GrabarTagNfc.tsx');
const TAG = src('packages/ui/src/components/tag-nfc.ts');

const VOZ: VozPasaportePublico = {
  tituloPerdida: 'Thor está perdido', llamar: 'Llamar', whatsapp: 'WhatsApp',
  rotuloChip: 'Chip', rotuloSalud: 'Alergias y medicación',
  pie: 'Pasaporte de e-PetPlace · si esta mascota está perdida, avisá a su familia',
  revocado: 'Este pasaporte ya no está activo', altFoto: 'Foto de Thor',
};
const BASE: DatosPasaportePublico = {
  nombre: 'Thor', especieYRaza: 'Perro · Labrador', sexoYEdad: 'Macho · 4 años',
  chip: '985112004123456', contacto: { nombre: 'Guillermo', telefono: '+593 99 123 4567', mensaje: 'Si la encontrás, llamanos' },
  salud: ['Alérgico al pollo', 'Toma omeprazol'], voz: VOZ,
};

console.log('\n── ① ROJO · LA PÁGINA SE LEE SIN JAVASCRIPT ──');
/* 🔴 Una página de emergencia que depende de que algo cargue no es de
   emergencia: quien la abre puede tener el JS apagado, la red mala o un
   navegador viejo, y está parado en la calle con un animal ajeno. */
const html = paginaPasaporte({ ...BASE, fotoUrl: 'https://cdn.epetplace.com/thor.jpg', perdidaDesde: '5 de septiembre' });
t('🔴 CERO scripts', /<script/i.test(html), false);
t('🔴 y cero pedidos de fuente o CSS remoto',
  /@import|fonts\.googleapis|<link/i.test(html), false);
t('el CSS viaja embebido', /<style>/.test(html), true);
/* La foto es la ÚNICA petición de red, y se declara.
   ⚠️ Se miden URLS ENTERAS y no el protocolo: la primera versión filtraba
   sobre `https://` —que nunca contiene «wa.me»— así que **el filtro no podía
   funcionar y el assert daba rojo sobre una página sana.** */
const urls = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
t('la única petición de red es la foto',
  urls.filter((u) => !u.startsWith('https://wa.me/')), ['https://cdn.epetplace.com/thor.jpg']);
t('…y el enlace de WhatsApp no carga nada: es un destino, no un recurso',
  /<a class="wa" href="https:\/\/wa\.me/.test(html), true);

console.log('\n── ② ROJO · EL TELÉFONO SE TOCA, NO SE COPIA ──');
/* Pedirle a alguien que copie un número a mano es perder el llamado. */
t('🔴 el aviso lleva el teléfono como `tel:`', /<a href="tel:\+?\d+"/.test(html), true);
t('…y el número marcable no lleva espacios ni guiones', telHref('+593 99 123-4567'), '+593991234567');
t('WhatsApp va sin el `+`, como pide wa.me', /wa\.me\/593991234567/.test(html), true);
t('🔴 el aviso de perdida va PRIMERO, antes de la foto',
  html.indexOf('class="aviso"') < html.indexOf('class="foto"'), true);

console.log('\n── ③ ROJO · LO QUE SE APAGA NO VIAJA ──');
/* Esconderlo en la vista y mandarlo igual sería peor que no ofrecer el
   interruptor: la familia creería que lo apagó. */
const apagado = filtrarPorVisibilidad(
  { contacto: BASE.contacto, salud: BASE.salud, chip: BASE.chip },
  { contacto: false, salud: false, chip: false },
);
t('🔴 los tres apagados salen `undefined`',
  [apagado.contacto, apagado.salud, apagado.chip], [undefined, undefined, undefined]);
const sinNada = paginaPasaporte({ ...BASE, contacto: null, salud: null, chip: null });
t('🔴 sin contacto la página NO tiene `tel:`', /tel:/.test(sinNada), false);
t('sin chip no dibuja su línea', /Chip/.test(sinNada), false);
t('sin salud no dibuja su lista', /<li>/.test(sinNada), false);
t('CONTROL POSITIVO · con los tres, los tres están',
  [/tel:/.test(html), /Chip/.test(html), /<li>/.test(html)], [true, true, true]);

console.log('\n── ④ ROJO · REVOCADO NO MUESTRA EL TELÉFONO DE NADIE ──');
/* No se dibuja media página con los datos tachados. */
const revocado = paginaPasaporte({ ...BASE, revocado: true, perdidaDesde: '5 de septiembre' });
t('🔴 revocado no lleva `tel:`', /tel:/.test(revocado), false);
t('…ni el nombre de la mascota en el cuerpo', /<h2>Thor<\/h2>/.test(revocado), false);
t('…ni el aviso de perdida', /class="aviso"/.test(revocado), false);
t('dice que no está activo, y lleva el pie de la casa',
  /ya no está activo/.test(revocado) && /Pasaporte de e-PetPlace/.test(revocado), true);

console.log('\n── ⑤ ROJO · EL PESO, Y LO QUE LO METE EN RIESGO ──');
const kb = Buffer.byteLength(html, 'utf8') / 1024;
console.log(`   la página pesa ${kb.toFixed(1)} kB`);
t('🔴 por debajo de 60 kB', kb < 60, true);
/* ⚠️ El número de hoy no protege del de mañana: **lo que lo rompería es
   embeber una fuente**, y por eso el gate mide la CAUSA, no sólo el efecto. */
t('🔴 y ninguna fuente embebida en base64', /base64|@font-face/.test(html), false);

console.log('\n── ⑥ ROJO · LO QUE VIENE DE LA FAMILIA SE ESCAPA ──');
/* Los nombres de mascota y los mensajes los escribe gente. */
const raro = paginaPasaporte({ ...BASE, nombre: 'Thor <script>alert(1)</script>' });
t('🔴 un nombre con etiquetas no inyecta', /<script>alert/.test(raro), false);
t('…y se ve escapado', /&lt;script&gt;/.test(raro), true);

console.log('\n── ⑦ ROJO · LA PLACA: LA ZONA TRANQUILA ES PARTE DEL CÓDIGO ──');
/* Un QR sin margen alrededor lo lee mal cualquier cámara: no es aire de
   diseño. Por eso el nombre va FUERA de esa zona. */
t('la placa son 30 mm, no píxeles', LADO_MM, 30);
t('🔴 el SVG declara milímetros', /width="30mm" height="30mm"/.test(svgDeLaPlaca({ svgQr: '<svg><rect/></svg>', nombre: 'Thor', marca: 'e-PetPlace' })), true);
t('🔴 el QR entra con su margen', ladoQrMm(), LADO_MM - MARGEN_MM * 2 - 6);
const placa = svgDeLaPlaca({ svgQr: '<svg viewBox="0 0 100 100"><rect width="100" height="100"/></svg>', nombre: 'Thor & Zeus', marca: 'e-PetPlace' });
t('🔴 el QR se incrusta TAL CUAL, sin reescribir su geometría',
  /<rect width="100" height="100"\/>/.test(placa), true);
t('…y sin anidar dos `<svg>`', (placa.match(/<svg/g) ?? []).length, 1);
t('🔴 un nombre con `&` no rompe el archivo', /Thor &amp; Zeus/.test(placa), true);

console.log('\n── ⑧ ROJO · LAS REGLAS DE LAS PIEZAS ──');
/* Ofrecerle un pasaporte a una familia que ya despidió a su mascota es no
   haber leído la pantalla. */
t('🔴 en memoria el pasaporte NO EXISTE', sePintaPasaporte({ enMemoria: true }), false);
t('CONTROL · viva, sí', sePintaPasaporte({ enMemoria: false }), true);
t('la tarjeta lee esa regla, no un `if` propio', /sePintaPasaporte\(\{ enMemoria \}\)/.test(TARJETA), true);
/* Un botón apagado sin razón es el defecto, y «tu teléfono no tiene NFC» no es
   algo que la persona pueda resolver: ofrecerlo y negarlo es peor. */
t('🔴 NFC AUSENTE si no hay capacidad, jamás apagado',
  /puedeNfc && vozGrabarNfc !== undefined && onGrabarNfc !== undefined \?/.test(ACCIONES), true);
t('…y ningún `disabled` en las acciones', /disabled/.test(ACCIONES), false);
/* Publicar expone la cara y el teléfono; despublicar no expone nada. */
t('🔴 marcar perdida pide DOS toques', /if \(!confirmando\)/.test(ACCIONES), true);
t('🔴 …y desmarcarla NO', /if \(perdida\) \{[\s\S]{0,80}?onCambiarPerdida\(false\)/.test(ACCIONES), true);
t('el segundo toque nombra a la mascota (la voz la trae compuesta)',
  /vozConfirmarPerdida/.test(ACCIONES), true);
/* Un permiso sin consecuencia escrita se activa sin pensarlo. */
t('🔴 cada interruptor dibuja su CONSECUENCIA', /\{o\.consecuencia\}/.test(CONFIG), true);
t('sin «mostrar contacto» no se pide configurar un teléfono que no se verá',
  /visibilidad\.contacto && contacto !== undefined \?/.test(CONFIG), true);

console.log('\n── ⑨ ROJO · GRABAR LA PLACA (B6) ──');
/* 🔴 Escribir un tag exige módulo NATIVO y lo nativo no viaja por OTA: si esta
   pieza lo importara, `packages/ui` entero dejaría de poder publicarse sin una
   build. La escritura la hace quien tiene la capacidad; acá llega el estado. */
/* ⚠️ **ESTE ASSERT MEDÍA EL NOMBRE DEL ARCHIVO Y NO EL HECHO**, y dio rojo
   sobre una pieza sana: matcheaba `./tag-nfc`, que es MI módulo de estados y
   no una librería nativa. *Un gate atado a un nombre mide la convención, no
   la cosa* — es la tercera vez en la noche que me pasa. Lo que hay que medir
   es que no entre NADA de fuera del paquete que hable con el hardware. */
t('🔴 la pieza NO importa ninguna librería nativa de NFC',
  /react-native-nfc|NfcManager|expo-nfc|NdefRecord/i.test(NFC), false);
t('…y lo único que importa con «nfc» en el nombre es su propio módulo puro',
  [...new Set([...NFC.matchAll(/from '([^']*nfc[^']*)'/gi)].map((m) => m[1]))], ['./tag-nfc']);
/* Un fallo sin salida deja a la persona con una placa a medio escribir y sin
   saber si sirve. El tipo lo hace inexpresable. */
t('🔴 `fallo` exige su salida en el TIPO',
  /fase: 'fallo'; voz: string; onReintentar: \(\) => void/.test(TAG), true);
/* «Ya estaba activada» y «no es de e-PetPlace» son hechos del mundo, no
   fallas de quien acercó la placa. */
const { esAlarma, enCurso, termino } = await import('../packages/ui/src/components/tag-nfc.ts');
t('🔴 el ÚNICO rojo es el fallo',
  [esAlarma({ fase: 'fallo', voz: 'x', onReintentar: () => {} }),
   esAlarma({ fase: 'ya_estaba', voz: 'x' }),
   esAlarma({ fase: 'ajena', voz: 'x' }),
   esAlarma({ fase: 'lista', voz: 'x' })], [true, false, false, false]);
t('🔴 mientras escribe no hay cierre de un toque al costado',
  [enCurso({ fase: 'acercar' }), enCurso({ fase: 'escribiendo' }), enCurso({ fase: 'lista', voz: 'x' })],
  [true, true, false]);
t('…y la Hoja lo obedece: sin cierre en curso',
  /conCerrar=\{!vivo\}/.test(NFC), true);
/* «Ya estaba» cuenta como TERMINADO: la placa funciona, sólo que no es de esta
   mascota. Tratarla como error dejaría a la persona esperando que pase algo. */
t('🔴 `ya_estaba` cuenta como terminado, no como error',
  termino({ fase: 'ya_estaba', voz: 'x' }), true);
t('🔴 en memorial la placa no existe — y lee la regla del pasaporte',
  /sePintaPasaporte\(\{ enMemoria \}\)/.test(NFC), true);
t('la espera es la de la casa, no un spinner genérico',
  /<EsperaDeMarca \/>/.test(NFC) && /ActivityIndicator/.test(NFC) === false, true);

if (NO_CONCLUYENTE.length > 0) {
  console.log(`\n⚠️ NO CONCLUYENTE · no se pudieron abrir: ${NO_CONCLUYENTE.join(' · ')}`);
  console.log('   No es verde ni rojo: es que no se pudo medir. Sale 2.');
  process.exit(2);
}
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
