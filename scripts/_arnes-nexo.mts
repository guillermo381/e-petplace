/* Arnés de NEXO (S113-B · lote 2.0) — la Hoja, la búsqueda y la memoria.
   Importa sólo módulos puros: no levanta React ni toca red. */
import { readFileSync } from 'node:fs';
import {
  tramosResaltados, gruposConAlgo, sinResultados,
  type GrupoResultados,
} from '../packages/ui/src/components/nexo-busqueda.ts';
import { memoriaVacia, saneadoParaGuardar } from '../packages/ui/src/components/nexo-memoria.ts';

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
const RESP = src('packages/ui/src/components/RespuestaNexo.tsx');
const PANEL = src('packages/ui/src/components/PanelMemoria.tsx');
const CHIPS = src('packages/ui/src/components/ChipsSugerencia.tsx');
const RES = src('packages/ui/src/components/ResultadosBusqueda.tsx');
const MEM = src('packages/ui/src/components/nexo-memoria.ts');
const PRES = src('packages/ui/src/components/PresentacionNexo.tsx');
const AVISO = src('packages/ui/src/components/AvisoAnticipacion.tsx');

console.log('\n── ① ROJO · EL RESALTADO NO PIERDE NI AGREGA UNA LETRA ──');
/* 🔴 Un resaltado que se come un carácter cambia el dato JUSTO en el lugar
   donde alguien fue a verificar algo. El invariante se mide concatenando. */
const entero = (titulo: string, termino: string) =>
  tramosResaltados(titulo, termino).map((x) => x.texto).join('');
for (const [titulo, termino] of [
  ['Pipeta antipulgas', 'pipeta'],
  ['PIPETA para Thor, pipeta chica', 'pipeta'],
  ['Consulta con la Dra. Salas', 'zzz'],
  ['Vacuna antirrábica', ''],
  ['Bañó a Thor', 'baño'],
  ['', 'pipeta'],
] as const) {
  t(`🔴 «${titulo}» + «${termino}» sale entero`, entero(titulo, termino), titulo);
}
/* ⚠️ EL CASO QUE TUMBÓ LA PRIMERA VERSIÓN: un título ya DESCOMPUESTO. Cortar
   el original con índices del plano se corría una letra y resaltaba la de al
   lado — y con datos precompuestos (los de un fixture) NO SE VEÍA. */
const descompuesto = 'Baño de Thor'; // «Baño» con tilde combinante
t('🔴 título descompuesto: sale entero', entero(descompuesto, 'bano'), descompuesto);
/* ⚠️ **EL ASSERT DE ARRIBA NO PUEDE CAZAR UN CORRIMIENTO, y conviene saberlo
   antes de confiar en él.** Los tramos son CONTIGUOS ⇒ su concatenación es el
   original SIEMPRE, aunque el corte esté corrido una letra. Medido: con la
   versión ingenua ese assert quedó VERDE y el que dio rojo fue el de abajo.
   *Un invariante que no puede fallar sobre el defecto que se busca es un
   verde por la razón equivocada* — el de abajo es el que discrimina. */
t('🔴 …y marca el tramo correcto (ÉSTE caza el corrimiento)',
  tramosResaltados(descompuesto, 'bano').filter((x) => x.marcado).map((x) => x.texto), ['Baño']);
t('CONTROL · sin acentos ni mayúsculas encuentra igual',
  tramosResaltados('Bañó a Thor', 'baño').some((x) => x.marcado), true);
t('🔴 término vacío NO resalta todo',
  tramosResaltados('Vacuna', '').every((x) => !x.marcado), true);

console.log('\n── ② ROJO · UN GRUPO VACÍO NO EXISTE ──');
/* Un rótulo «Pedidos» con nada debajo se lee como algo que falló al cargar. */
const g = (tipo: GrupoResultados['tipo'], n: number): GrupoResultados => ({
  tipo, rotulo: tipo, resultados: Array.from({ length: n }, (_, i) => ({
    id: `${tipo}-${i}`, tipo, titulo: 'x', onPress: () => {},
  })),
});
t('🔴 el vacío se cae del listado', gruposConAlgo([g('citas', 2), g('pedidos', 0)]).map((x) => x.tipo), ['citas']);
t('🔴 todos vacíos ⇒ «no encontré nada»', sinResultados([g('citas', 0), g('pedidos', 0)]), true);
t('CONTROL · con uno solo NO es vacío', sinResultados([g('citas', 0), g('pedidos', 1)]), false);
t('sin grupos tampoco encontró nada', sinResultados([]), true);

console.log('\n── ③ ROJO · NUNCA INVENTA UN RESULTADO ──');
/* La pieza dibuja lo que le pasan y cada fila EXIGE su destino. */
t('🔴 `onPress` es obligatorio en el tipo', /onPress: \(\) => void/.test(src('packages/ui/src/components/nexo-busqueda.ts')), true);
t('🔴 el glifo por tipo lo decide la PIEZA, exhaustivo',
  /satisfies Record<TipoResultado, IconoNombre>/.test(RES), true);
t('🔴 sin resultados exige VOZ y SALIDA (las dos)',
  /vozChip: string/.test(RES) && /onPreguntar: \(\) => void/.test(RES), true);
t('el label de a11y lleva el título ENTERO, sin resaltar',
  /accessibilityLabel=\{r\.subtitulo === undefined \? r\.titulo/.test(RES), true);

console.log('\n── ④ ROJO · LA PRIMERA RESPUESTA DICE QUE ES IA ──');
/* No es un chequeo que alguien corre: es una unión discriminada. */
t('🔴 con `primera: true` la nota es OBLIGATORIA',
  /\{ primera: true; notaIA: string \}/.test(RESP), true);
t('🔴 …y sin `primera` es INEXPRESABLE',
  /\{ primera\?: false; notaIA\?: never \}/.test(RESP), true);
t('la nota va DEBAJO de la primera frase', /props\.primera === true \?/.test(RESP), true);

console.log('\n── ⑤ ROJO · LA FUENTE SE TOCA, Y NO SE INVENTA ──');
t('🔴 la voz y el destino viajan juntos',
  /voz: string\n\s+\/\*\*[\s\S]{0,200}?onPress: \(\) => void/.test(RESP.replace(/ +/g, ' ')) || /interface FuenteDeRespuesta \{[\s\S]*?onPress: \(\) => void[\s\S]*?\}/.test(RESP), true);
t('🔴 sin fuente NO se dibuja ninguna', /fuente !== undefined \?/.test(RESP), true);
/* ⚠️ **ACÁ MEDÍA `accessibilityRole="link"` Y ESTUVO VERDE TODO EL TIEMPO EN
   QUE LA FUENTE PARECÍA UNA ETIQUETA.** Ése es el punto ciego: *un rol de
   accesibilidad es una promesa para quien NO ve la pantalla, y no dice nada
   sobre lo que ve quien sí la ve.* El emulador mostró dos líneas grises
   seguidas —la nota de IA y la fuente— con la misma talla, color y peso, y
   una de las dos llevaba a algún lado. Hoy mide que monte la pieza de la casa
   para una acción suelta que navega, que TRAE la forma visible (Ley 19.7:
   texto + chevron + target 44). */
t('🔴 …y lleva la forma VISIBLE de una acción, no sólo el rol',
  /<AccionQueLleva etiqueta=\{fuente\.voz\}/.test(RESP), true);
t('el mismo chip en las dos superficies: borde, no sólo relleno',
  /borderColor: theme\.border\.subtle/.test(RES) && /borderColor: theme\.border\.subtle/.test(CHIPS), true);

console.log('\n── ⑥ ROJO · SIN «ESTÁ ESCRIBIENDO» (N13) ──');
/* La pieza no tiene con qué saberlo, y una actividad inventada es una promesa
   sobre algo que no está pasando. */
t('🔴 cero puntitos, cero «escribiendo», cero «pensando»',
  /escribiendo|pensando|typing|\.\.\.<\/Texto>/i.test(RESP), false);
t('🔴 y con texto vacío la burbuja NO se monta',
  /texto\.trim\(\)\.length === 0\) return null/.test(RESP), true);

console.log('\n── ⑦ ROJO · NADA ENTRA A LA MEMORIA SIN CONFIRMAR ──');
/* Lo propuesto vive en el hilo y muere ahí: el panel no puede expresarlo. */
/* ⚠️ ESTE ASSERT MEDÍA LA PALABRA Y NO EL HECHO, y su primer rojo fue suyo:
   buscaba «confirmado», que existe LEGÍTIMAMENTE como valor de
   `OrigenMemoria` («lo confirmaste»). *Un gate atado a un nombre mide la
   convención, no la cosa* (`L-441`). Lo que hay que medir es que el hecho no
   tenga las salidas de una propuesta ni sea una unión con rama sin confirmar. */
t('🔴 `HechoDeMemoria` NO tiene las salidas de una propuesta',
  /onConfirmar|onDescartar/.test(MEM), false);
t('🔴 …y es UNA interfaz, no una unión con rama sin confirmar',
  /export interface HechoDeMemoria \{/.test(MEM) && /export type HechoDeMemoria/.test(MEM) === false, true);
t('🔴 la propuesta vive en la respuesta, con sus DOS salidas',
  /onGuardar: \(\) => void/.test(RESP) && /onDescartar: \(\) => void/.test(RESP), true);
t('🔴 y editar Y borrar son OBLIGATORIOS: «editable» es la promesa',
  /onEditar: \(texto: string\) => void/.test(MEM) && /onBorrar: \(\) => void/.test(MEM), true);
t('🔴 guardar vacío NO borra', saneadoParaGuardar('   '), null);
t('CONTROL · guardar con texto recorta y guarda', saneadoParaGuardar('  truenos  '), 'truenos');
t('la procedencia es obligatoria en cada hecho', /vozOrigen: string/.test(MEM), true);

console.log('\n── ⑧ ROJO · VACÍA SE DIBUJA, Y ES LA EXCEPCIÓN DECLARADA ──');
/* Este panel lo ABRE la familia: no encontrar nada es la respuesta a lo que
   fue a preguntar. `haySeguridad` hace lo contrario y también tiene razón. */
t('🔴 la memoria vacía se detecta', memoriaVacia([]), true);
t('🔴 …y la pieza EXIGE su voz en vez de devolver null', /vozVacia: string/.test(PANEL), true);
t('el panel no compone el nombre de la mascota', /\{\{mascota\}\}|`Lo que sé/.test(PANEL), false);

console.log('\n── ⑨ ROJO · MEMORIAL: EL COACH NO EXISTE ──');
/* El guard vive en cada pieza y no en la pantalla: si cada consumidor tuviera
   que acordarse, alcanza con uno que se olvide. */
for (const [n, s] of [['la respuesta', RESP], ['el panel', PANEL], ['los chips', CHIPS]] as const) {
  t(`🔴 ${n} no se dibuja en memorial`, /theme\.mode === 'memorial'\) return null/.test(s), true);
}
t('⚠️ y el guard del panel va DESPUÉS del hook (orden de hooks)',
  PANEL.indexOf('useState') < PANEL.indexOf("theme.mode === 'memorial'"), true);

console.log('\n── ⑩ ROJO · LOS CHIPS SON ACTOS, NO UNA SELECCIÓN ──');
/* Ley 22c: un comando con consecuencias no se viste de control de selección.
   Si quedara pintado después de tocarlo diría que la pregunta sigue activa. */
t('🔴 no existe estado de elegido', /elegid|selected|seleccionad/i.test(CHIPS), false);
t('🔴 …ni se montó `FiltroPills`', /FiltroPills|MarcaEleccion/.test(CHIPS), false);
t('cada chip exige su `onPress`', /onPress: \(\) => void/.test(CHIPS), true);
t('🔴 sin sugerencias no hay riel vacío', /sugerencias\.length === 0\) return null/.test(CHIPS), true);

console.log('\n── ⑪ NINGUNA COMPONE VOZ (Ley 3) ──');
for (const [n, s] of [['respuesta', RESP], ['panel', PANEL], ['chips', CHIPS], ['resultados', RES]] as const) {
  /* Una plantilla con `${` sobre texto visible es la pieza escribiendo.
     Se exceptúa el `accessibilityLabel` de resultados, que UNE dos datos ya
     redactados y está declarado en su cuerpo. */
  const plantillas = (s.match(/`[^`]*\$\{[^`]*`/g) ?? []).filter((x) => !x.includes('r.titulo'));
  t(`${n}: sin plantillas de texto`, plantillas, []);
}

console.log('\n── ⑫ ROJO · LA PRESENTACIÓN (2.1 · B4) ──');
/* 🔴 Tres frases se leen; cinco se saltean, y la que se saltea es siempre la
   última — que acá es la que dice que puede equivocarse. */
t('🔴 son EXACTAMENTE tres, por tupla',
  /readonly \[string, string, string\]/.test(PRES), true);
/* Reusa la pieza del chat en vez de una «burbuja de presentación» propia:
   dos dibujos iguales con nombres distintos divergen al primer cambio. */
t('🔴 monta `BurbujaMensaje`, no una burbuja propia',
  /<BurbujaMensaje/.test(PRES) && /borderRadius/.test(PRES) === false, true);
t('…y agrupa: nombre en la primera, hora en la última',
  /posicion=\{i === 0 \? 'primero'/.test(PRES), true);
/* Sin temporizador y sin «está escribiendo»: simular que las escribe es actuar
   una conversación que no está pasando. */
t('🔴 llegan juntas: cero temporizador, cero «escribiendo»',
  /setTimeout|setInterval|escribiendo|typing/i.test(PRES), false);
/* 🔴 EL «MISMO RITMO» ES MEDIBLE: la burbuja trae su `marginTop` propio
   —spacing[3] al abrir grupo, spacing[0.5] adentro— y un `gap` en el
   contenedor SE SUMA. *Cuando la pieza ya porta su espaciado, el contenedor
   que agrega el suyo no lo ajusta: lo rompe.* */
t('🔴 el contenedor NO agrega aire: el ritmo lo manda la burbuja',
  /gap: spacing/.test(PRES), false);
t('🔴 en memorial no se presenta', /theme\.mode === 'memorial'\) return null/.test(PRES), true);

console.log('\n── ⑬ ROJO · EL AVISO QUE SE ADELANTA (2.1 · B5) ──');
/* 🔴 No pasó nada malo: todavía no pasó nada. Y el costo de gritar no es el
   susto — es que la próxima alarma ya no se distinga. */
t('🔴 NUNCA en color de alarma', /status\.danger|dangerText|color="danger"/.test(AVISO), false);
t('…vive como TINTE, no como relleno (R20)',
  /borderColor: theme\.status\.warningText/.test(AVISO) &&
  /backgroundColor: theme\.status\.warning\b/.test(AVISO) === false, true);
/* Un aviso que nombra una predisposición y no ofrece a quién preguntarle deja
   a la familia con una palabra médica y sin nadie. */
t('🔴 la tarjeta EXIGE el acto y su palabra',
  /forma: 'tarjeta'; onVerVet: \(\) => void; vozVerVet: string/.test(AVISO), true);
t('🔴 …y la fila EXIGE su destino',
  /forma: 'fila'; onAbrir: \(\) => void/.test(AVISO), true);
/* La pieza no compone: si supiera de razas, sería donde nace el diagnóstico
   accidental. */
t('🔴 no compone la voz: la recibe hecha',
  /predisposici|displasia|senior/i.test(AVISO.replace(/\/\*[\s\S]*?\*\//g, '')), false);
t('🔴 en memorial no se adelanta nada',
  /theme\.mode === 'memorial'\) return null/.test(AVISO), true);

if (NO_CONCLUYENTE.length > 0) {
  console.log(`\n⚠️ NO CONCLUYENTE · no se pudieron abrir: ${NO_CONCLUYENTE.join(' · ')}`);
  console.log('   No es verde ni rojo: es que no se pudo medir. Sale 2.');
  process.exit(2);
}
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
