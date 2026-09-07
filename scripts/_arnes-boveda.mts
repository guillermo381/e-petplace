/* Arnés de LA BÓVEDA DE PAPELES (S113-B · fase 3). Sólo módulos puros.

   🔴 **La ley que atraviesa todo: SE TRANSCRIBE, NO SE INTERPRETA.** Un valor
   de laboratorio entra con su unidad y su referencia si estaban impresas, y
   nada más. *Y no alcanza con no dibujarlo: el tipo no lo deja entrar* — lo
   que un tipo permite alguien lo escribe el día que tiene apuro, y el que lee
   esto después es un veterinario decidiendo un tratamiento. */
import { readFileSync } from 'node:fs';
import { bovedaVacia, gruposConPapeles, hayQueCompletar, SEGUNDA_VOZ_MS } from '../packages/ui/src/components/papeles-boveda.ts';


let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const NO_CONCLUYENTE: string[] = [];
const src = (f: string) => {
  try { return sinComentarios(readFileSync(new URL(`../packages/ui/src/components/${f}`, import.meta.url), 'utf8')); }
  catch { NO_CONCLUYENTE.push(f); return ''; }
};
const DOCS = src('PantallaDocumentos.tsx');
const FICHA = src('FichaPapel.tsx');
const CONTRATO = src('papeles-boveda.ts');

console.log('\n── ① 🔴 UN EXAMEN NUNCA SALE INTERPRETADO ──');
/* El corazón del lote. Que no se dibuje no alcanza: **no se puede expresar.** */
t('🔴 el tipo NO tiene un estado alto/bajo/normal',
  /'alto'|'bajo'|'normal'|'anormal'|estado:/.test(CONTRATO), false);
t('🔴 …ni la ficha dibuja uno', /'alto'|'bajo'|semaforo|flecha/.test(FICHA), false);
t('lo único que viaja es la marca IMPRESA, como texto',
  /marcaImpresa\?: string/.test(CONTRATO), true);
/* 🔴 Y NINGÚN COLOR: teñir un valor es decir si está bien o mal. */
t('🔴 el valor NO se tiñe', /color="(danger|warning|success)"/.test(FICHA), false);
t('🔴 …y ninguna fila de la lista tampoco', /color="(danger|warning|success)"/.test(DOCS), false);
/* La unidad y la referencia son OPCIONALES y no se rellenan. */
for (const campo of ['unidad', 'referencia']) {
  t(`\`${campo}\` es opcional: sólo si estaba impresa`, new RegExp(`${campo}\\?: string`).test(CONTRATO), true);
}

console.log('\n── ② 🔴 SIN PAPELES NO SE DIBUJA LISTA ──');
const g = (n: number) => ({ papeles: Array.from({ length: n }, (_, i) => i) });
t('🔴 todo vacío ⇒ la bóveda está vacía', bovedaVacia([g(0), g(0)]), true);
t('CONTROL · con uno solo NO está vacía', bovedaVacia([g(0), g(1)]), false);
t('sin grupos, vacía', bovedaVacia([]), true);
/* 🔴 Y un grupo vacío NO se monta ni con su rótulo: *un rótulo sobre nada le
   dice a la familia que ahí debería haber algo y que se perdió.* */
t('🔴 los grupos vacíos se caen antes de dibujar', gruposConPapeles([g(0), g(2), g(0)]).length, 1);
t('…y la pieza usa ese filtro', /gruposConPapeles\(grupos\)/.test(DOCS), true);
t('con la bóveda vacía va la invitación y NADA de lista', /bovedaVacia\(grupos\) \?/.test(DOCS), true);

console.log('\n── ③ 🔴 NINGUNA FILA LLEVA COLOR DE ALARMA ──');
/* Ni una, en ningún estado. *Un papel no está «mal»: un papel dice algo.* */
t('🔴 el glifo de fila va en tinta, nunca en un registro de estado',
  /registro="tinta"/.test(DOCS) && !/registro="(peligro|alerta|estado)"/.test(DOCS), true);

console.log('\n── ④ 🔴 UN PAPEL ES UNA COSA O LA OTRA ──');
/* Con `valores?` y `medicacion?` opcionales se podía mandar un examen que
   además receta, y ahí alguien decide cuál gana — decisión que nadie firmó. */
t('🔴 el contenido es una unión, no campos opcionales',
  /tipo: 'examen'; valores/.test(FICHA) && /tipo: 'receta'; medicacion/.test(FICHA), true);
t('…y no quedan los opcionales viejos', /valores\?:|medicacion\?:/.test(FICHA), false);

console.log('\n── ⑤ 🔴 BORRAR AVISA LO QUE NO SE VA ──');
/* *Alguien que borra un papel creyendo que borra la vacuna que anotó lo
   descubre el día que la busque y la encuentre.* */
t('🔴 borrar exige su advertencia en el MISMO objeto', /vozAdvertencia: string/.test(FICHA), true);
t('…y la advertencia se dibuja ANTES del botón',
  /\{borrar\.vozAdvertencia\}<\/Texto>[\s\S]{0,200}etiqueta=\{borrar\.voz\}/.test(FICHA), true);
t('sin poder borrar, NO se dibuja un botón apagado', /disabled|deshabilitado/.test(FICHA), false);

console.log('\n── ⑥ ⛔ MEMORIAL: SE LEE ENTERA, NO SE PIDE NADA ──');
/* La lista NO se apaga —*es lo que queda, y es cuando más se consulta*— y lo
   que desaparece es traer papeles. */
t('🔴 la pantalla NO devuelve null en memorial', /mode === 'memorial'\) return null/.test(DOCS), false);
t('🔴 …y «traer papeles» no se ofrece', /esMemorial \? null :/.test(DOCS), true);

const TRAER = src('HojaTraerPapeles.tsx');
const PLACA = src('ActivarPlaca.tsx');

console.log('\n── ⑧ 🔴 NADA SE GUARDA SIN UN TOQUE (B2) ──');
/* *Un extractor que guarda solo convierte «la casa lee tus papeles» en «la casa
   escribe en el expediente de tu mascota lo que le pareció».* */
const fila = (falta?: string) => ({ id: 'x', confianza: 'alta' as const, falta });
t('🔴 con algo por completar, NO se puede guardar',
  hayQueCompletar({ tipo: 'examen', valores: [{ analito: 'a', valor: '1', ...fila('la fecha') }] }), true);
t('CONTROL · sin nada que completar, sí', 
  hayQueCompletar({ tipo: 'examen', valores: [{ analito: 'a', valor: '1', ...fila() }] }), false);
t('…y también mide una receta',
  hayQueCompletar({ tipo: 'receta', medicacion: [{ nombre: 'n', ...fila('la dosis') }] }), true);
t('🔴 y la pieza NO dibuja guardar cuando falta algo',
  /falta \?[\s\S]{0,120}vozIncompleto[\s\S]{0,200}etiqueta=\{vozGuardar\}/.test(TRAER), true);
/* La duda es la fila ENTERA — el mismo criterio del carnet. */
t('lo dudoso se marca con TINTE, no con relleno de alarma',
  /borderLeftWidth: revisar/.test(TRAER) && !/backgroundColor: theme\.status/.test(TRAER), true);
t('🔴 y lo que falta se PIDE con su nombre, no se rellena', /\{fila\.falta\}/.test(TRAER), true);
/* La ley de la bóveda rige también acá. */
t('🔴 el examen se confirma SIN color', /color="(danger|success)"/.test(TRAER), false);
/* La espera tiene dos voces, y la segunda a los 8 s. */
t('la segunda voz existe y llega a los 8 s', SEGUNDA_VOZ_MS, 8000);
t('…y las dos son obligatorias', /vozLeyendo: string/.test(TRAER) && /vozLeyendoLarga: string/.test(TRAER), true);
/* 🔴 Tres fases, una unión: *con banderas se puede escribir «leyendo y además
   listo», y ahí alguien decide cuál gana.* */
t('🔴 las fases son una UNIÓN, no banderas',
  /fase: 'elegir'/.test(TRAER) && /fase: 'leyendo'/.test(TRAER) && /fase: 'confirmar'/.test(TRAER), true);

console.log('\n── ⑨ 🔴 LA PLACA: TRES ESTADOS Y SÓLO UNO ES ERROR (B5) ──');
/* *«Ya estaba activada» NO es un error: la placa funciona, está puesta, y lo
   único que pasa es que la persona ya hizo esto. Una pantalla roja acá le dice
   que rompió algo.* */
t('🔴 `yaEstaba` NO tiene reintento', /fase: 'yaEstaba'[^}]*onReintentar/.test(PLACA), false);
t('…y su salida es OPCIONAL: si no hay a dónde ir, no hay botón',
  /onVerPlaca\?: \(\) => void/.test(PLACA), true);
/* 🔴 **Sólo `ajena` lleva el aviso; las otras dos llevan el CHECK.** Y «ya
   estaba» lo lleva con razón: *la placa está activa, que es exactamente lo que
   un check significa* — no es un consuelo.
   ⏪ Acá decía `'info' : 'pasaporte'`, y **el assert cazó mi propio cambio**
   cuando el emulador me obligó a sacar el `pasaporte`: a 44 px, solo y sin
   etiqueta, eran dos cuadraditos que no decían nada — la condición de uso que
   su propia firma dejó escrita, atravesada por mí con un ternario. */
t('🔴 sólo `ajena` lleva el glifo de aviso',
  /fase === 'ajena' \? 'info' : 'checkEnCirculo'/.test(PLACA), true);
t('…y el `pasaporte` NO se monta solo acá', /'pasaporte'/.test(PLACA), false);
/* 🔴 Un código sin activar no dice nada de nadie: el nombre SÓLO en `activada`. */
t('🔴 el nombre de la mascota vive SÓLO en `activada`',
  /fase: 'activada'; voz: string/.test(PLACA), true);
t('🔴 la pieza NO abre la cámara: el visor es un slot', /visor: ReactNode/.test(PLACA), true);
t('…y el visor se apaga cuando hay resultado',
  /estado\.fase === 'apuntando' \?/.test(PLACA), true);

console.log('\n── ⑦ NINGUNA COMPONE VOZ (Ley 3) ──');
for (const [n, s] of [['documentos', DOCS], ['ficha', FICHA], ['traer', TRAER], ['placa', PLACA]] as const) {
  /* Voz es un template HIJO de JSX (`>`); la geometría va como atributo (`=`).
     Es la regla que el arnés del tablero pagó cuatro veces. */
  const hijos = [...s.matchAll(/>\s*\{(`[^`]*\$\{[^`]*`)\}/g)].map((m) => m[1] ?? '');
  t(`${n}: sin plantillas de texto`, hijos.filter((x) => !/rotulo|etiqueta|titulo/.test(x)), []);
}

if (NO_CONCLUYENTE.length > 0) {
  console.log(`\n⚠️ NO CONCLUYENTE · no se pudieron abrir: ${NO_CONCLUYENTE.join(' · ')}`);
  process.exit(2);
}
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
