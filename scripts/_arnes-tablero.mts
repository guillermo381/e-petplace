/* Arnés del TABLERO del perfil (S113-B · 2.2). Importa sólo módulos puros:
   no levanta React ni toca red.

   🔴 **Un tablero es más peligroso que una lista**, y por eso este arnés existe
   aparte: *una lista que no sabe algo lo deja en blanco y se nota; un gráfico
   que no sabe algo dibuja una línea plana, y una línea plana se lee como una
   medición.* Casi todo lo de acá mide qué se puede AFIRMAR con un dibujo. */
import { readFileSync } from 'node:fs';
import {
  hayLineaQueDibujar, puntosDeLinea, fraccionDelAnillo, trazoDeProgreso, elDeHoy,
  margenDeTrazo, trazosFueraDeCaja, radioDeAnillo,
} from '../packages/ui/src/components/tablero-metrica.ts';
import { fechaCortaHumana } from '../packages/i18n/src/fechas.ts';

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
const MET = src('TarjetaMetrica.tsx');
const HOY = src('TarjetaHoy.tsx');
const ACC = src('FilaAcciones.tsx');
const CON = src('TarjetaConociendolo.tsx');
const PESO = src('DetallePeso.tsx');
const HERO = src('HeroMascota.tsx');
const FRANJA = src('FranjaSeguridad.tsx');
const HUE = src('HuellaDelVinculo.tsx');

console.log('\n── ① ROJO · SIN DATO NO HAY GRÁFICO ──');
/* Un sparkline de UN punto dibuja una recta horizontal, y esa recta dice
   «estuvo estable»: una afirmación que nadie hizo. */
t('🔴 una serie de un punto NO es una serie', hayLineaQueDibujar([70]), false);
t('🔴 …ni una vacía', hayLineaQueDibujar([]), false);
t('CONTROL · con dos ya hay línea', hayLineaQueDibujar([70, 71]), true);
t('🔴 y la pieza NO monta el dibujo sin línea',
  /if \(!hayLineaQueDibujar\(dibujo\.serie\)\) return null/.test(MET), true);

console.log('\n── ② ROJO · EL CASO DEGENERADO NO DIBUJA UNA CAÍDA ──');
/* Con todos los valores iguales el rango es CERO. Si eso cae a 0, la línea se
   pega al piso y dibuja un desplome que no existió. */
const planos = puntosDeLinea([24, 24, 24], 100, 40);
t('🔴 valores iguales ⇒ la línea va al MEDIO', planos.map((p) => p.y), [20, 20, 20]);
t('…y se reparte a lo ancho', planos.map((p) => p.x), [0, 50, 100]);
/* El máximo va ARRIBA: `y` crece hacia abajo en SVG, y equivocarse ahí dibuja
   la serie dada vuelta — sube cuando bajó. */
const sube = puntosDeLinea([1, 2], 10, 10);
t('🔴 el máximo va ARRIBA (y=0), no abajo', [sube[0]!.y, sube[1]!.y], [10, 0]);

console.log('\n── ③ ROJO · EL ANILLO NO SE COMPLETA SOBRE LA NADA ──');
/* Un NaN en un strokeDasharray no rompe: DIBUJA EL ANILLO ENTERO, o sea
   «completo» sobre un plan que no existe. El peor modo de falla de un gráfico
   es el que se ve bien. */
t('🔴 total 0 ⇒ 0, jamás NaN', fraccionDelAnillo(3, 0), 0);
t('🔴 …y no se pasa de 1 aunque sobren', fraccionDelAnillo(9, 4), 1);
t('CONTROL · la fracción normal sale bien', fraccionDelAnillo(3, 4), 0.75);
t('el anillo arranca ARRIBA, no a las 3', /rotate\(-90 /.test(MET), true);

console.log('\n── ④ ROJO · EL DATO AUSENTE NO SE AGRANDA (19.9) ──');
/* Salió de mirar el perfil real: «Sin fecha de refuerzo» presidía con el mismo
   peso que un «24 kg» medido, y la pantalla igualaba «lo medimos» con «no lo
   sabemos». */
t('🔴 `valor: null` dibuja la ausencia en APOYO, no en display',
  /valor === null \? \(\s*<Texto variante="apoyo">\{vozSinDato\}<\/Texto>/.test(MET), true);
t('…y la voz de ausencia es OBLIGATORIA', /vozSinDato: string/.test(MET), true);
t('🔴 cada tarjeta abre su detalle', /onPress: \(\) => void/.test(MET), true);

console.log('\n── ⑤ ROJO · EL «HOY» ES UNA COSA SOLA ──');
/* «Nunca dos» es literal del encargo, y la razón es de comportamiento: una
   lista de dos es la forma más rápida de que no se haga ninguna. */
t('🔴 la pieza recibe UN candidato, no una lista', /candidatos|\[\]/.test(HOY.replace(/import[^\n]*\n/g, '')), false);
const cands = [
  { clase: 'vence' as const, id: 'v' },
  { clase: 'anticipacion' as const, id: 'a' },
  { clase: 'cita' as const, id: 'c' },
];
t('🔴 elige lo que TODAVÍA se puede evitar', elDeHoy(cands)?.id, 'a');
t('…después lo agendado', elDeHoy(cands.filter((c) => c.clase !== 'anticipacion'))?.id, 'c');
t('…y al final lo que vence', elDeHoy([cands[0]!])?.id, 'v');
t('sin candidatos devuelve null, no una tarjeta vacía', elDeHoy([]), null);
t('🔴 el acto es obligatorio', /onActo: \(\) => void/.test(HOY) && /vozActo: string/.test(HOY), true);
t('🔴 y NUNCA en relleno de alarma (R20)', /status\.danger|dangerText/.test(HOY), false);

console.log('\n── ⑥ ROJO · EL PROGRESO NO TIENE NÚMERO EN PANTALLA ──');
/* `MODELO_LOYALTY` §3. Y no alcanza con no dibujarlo: la pieza no lo recibe
   como texto — *si recibiera el número Y la voz por separado, alguien lo va a
   imprimir al lado el día que quiera «ser más claro».* */
t('🔴 cero `%`, cero `toFixed`, cero `Math.round`',
  /%|toFixed|Math\.round/.test(CON), false);
/* ☠️ **LÁPIDA (S113-B · 2.2.2).** Acá vivían dos asserts sobre `fraccion`: que
   no tocara un `Texto` y que entrara «sólo como geometría, al trazo». **Eran
   verdaderos y hoy no tienen objeto**: el founder sacó el anillo y la fracción
   no entra a la tarjeta. *Un assert que se queda sin sujeto no se borra en
   silencio —el próximo lo escribe de nuevo creyendo que falta— y tampoco se
   deja: daría rojo sobre algo que se quitó a propósito.* Su trabajo lo hace
   hoy el ⑳, que mide algo más fuerte: **que no haya número que imprimir.** */
t('☠️ la fracción ya no existe en la tarjeta (la mide el ⑳)',
  /fraccion/.test(CON), false);
t('y la voz llega redactada', /voz: string/.test(CON), true);
t('CONTROL · el trazo acota igual que el anillo',
  [trazoDeProgreso(-1), trazoDeProgreso(2), trazoDeProgreso(0.4)], [0, 1, 0.4]);

console.log('\n── ⑦ ROJO · UNA ACCIÓN APAGADA Y MUDA ES INEXPRESABLE ──');
t('🔴 o `onPress`, o `razonApagado` — nunca las dos',
  /onPress: \(\) => void; razonApagado\?: never/.test(ACC) &&
  /onPress\?: never; razonApagado: string/.test(ACC), true);
t('…y el apagado DICE su razón al tocarlo', /onRazonApagado\?\.\(accion\.razonApagado\)/.test(ACC), true);
t('atenuado, no ausente', /opacity: apagado \? 0\.45 : 1/.test(ACC), true);
t('🔴 Nexo entra con el ORBE, no con un glifo', /<OrbeCoach/.test(ACC), true);

console.log('\n── ⑧ ROJO · MEMORIAL ──');
/* La tarjeta de dato QUEDA —el dato de una vida que terminó sigue siendo
   cierto— y lo que se apaga es la señal que empuja a actuar. */
t('🔴 la métrica conserva su dato y pierde el DIBUJO',
  /dibujo === undefined \|\| esMemorial \? null :/.test(MET), true);
t('…y NO devuelve null entera', /theme\.mode === 'memorial'\) return null/.test(MET), false);
for (const [n, s] of [['el hoy', HOY], ['conociéndolo', CON]] as const) {
  t(`🔴 ${n} no se dibuja en memorial`, /theme\.mode === 'memorial'\) return null/.test(s), true);
}
t('🔴 …y la fila queda con TRES: sin la acción de Nexo',
  /esMemorial \? null : <Accion accion=\{nexo\}/.test(ACC), true);

console.log('\n── ⑨ ROJO · LA VARIANTE v2 NO SE TOCA ──');
/* El punteado dice «esto todavía no es» sin escribir una fecha, y el tipo
   impide darle un destino — que es como se prometería sin querer. */
t('🔴 la v2 no admite `onPress`', /v2: true; onPress\?: never/.test(MET), true);
t('…ni dibujo: no hay serie que mostrar', /dibujo\?: never/.test(MET), true);
t('🔴 y NO es un `Pressable` apagado: no es tocable',
  /if \(esV2\) return <View style=\{piel\}>/.test(MET), true);
t('el punteado está', /borderStyle: 'dashed'/.test(MET), true);

console.log('\n── ⑩ ROJO · EL DETALLE DEL PESO ──');
/* «Lo pesó la clínica» y «lo pesaste vos» no son la misma medición: dibujarlos
   iguales convierte dos fuentes en una curva, y una caída entre un punto
   propio y uno clínico se lee como que adelgazó. */
t('🔴 el punto distingue el origen',
  /dato\.origen === 'clinica' \? theme\.accent\.control : theme\.bg\.base/.test(PESO), true);
t('…y la leyenda lo dice con PALABRAS', /vozClinica: string/.test(PESO) && /vozCasa: string/.test(PESO), true);
t('🔴 cero puntos: ni gráfico ni tabla, y se dice',
  /serie\.length === 0[\s\S]{0,120}vozSinDatos/.test(PESO), true);
t('🔴 un punto: tabla SÍ, gráfico NO', /hayLinea \?/.test(PESO), true);
t('el último se resalta', /esUltimo \? 5 : 3\.5/.test(PESO), true);
t('🔴 la pieza NO ordena la serie', /\.sort\(/.test(PESO), false);

console.log('\n── ⑫ ROJO · DOS QUE ENCONTRÓ EL APARATO ──');
/* `OrbeCoach` dibuja sus capas en `position:'absolute'`: sin una caja de
   tamaño fijo colapsa a 0 en el flujo y SE DIBUJA ENCIMA del texto de al lado.
   *Una pieza que no ocupa lugar propio no se nota rota hasta que tiene un
   vecino* — en `FilaAcciones` no pasaba porque vive dentro de un disco de 48. */
t('🔴 el orbe del «hoy» va en una caja de tamaño fijo',
  /<View style=\{\{ width: ORBE, height: ORBE \}\}>\s*<OrbeCoach/.test(HOY), true);
/* Los chips son texto y crecen a lo ancho: al lado del dato quedaban cortados
   («garrapat…») y encimados. Un gráfico ocupa lo que se le da; una tira de
   palabras ocupa lo que necesita. */
t('🔴 los chips van DEBAJO, no al lado del dato',
  /dibujo\?\.tipo === 'chips'\s*\? \{ gap: spacing\[1\] \}/.test(MET), true);

console.log('\n── ⑬ ROJO · EL HERO Y LA FRANJA, COMPACTOS (B6) ──');
/* La navegación no es identidad: meterla en el hero lo ataría a tener una
   flecha atrás, o sea a no poder usarse en otro lado. */
t('🔴 el hero NO se lleva la navegación', /volver|onAtras|compartir|onEditar/i.test(HERO), false);
t('…y el retrato entra como SLOT: la casa ya tiene su escalera de fallbacks',
  /retrato: ReactNode/.test(HERO) && /<AvatarMascota/.test(HERO) === false, true);
/* En memorial el hero SÍ se dibuja —es quién fue— y lo que se apaga es la
   pastilla: no hay un cuidado al día que reportar. */
t('🔴 en memorial el hero se dibuja igual', /theme\.mode === 'memorial'\) return null/.test(HERO), false);
t('…y la pastilla NO', /estado !== undefined && !esMemorial \?/.test(HERO), true);
t('la meta va en SANS, no en mono', /family\.mono/.test(HERO), false);
/* La franja pasa a UNA fila: antes eran dos líneas de resumen más el «ver N»
   en un renglón aparte — cuatro líneas para decir una cosa. */
t('🔴 la franja resume en UNA línea cuando está cerrada',
  /numberOfLines=\{abierta \? undefined : 1\}/.test(FRANJA), true);
t('…con su «ver N» y el chevron en la MISMA fila',
  /\{abierta \? vozCerrar : vozAbrir\}<\/Texto>\s*<Chevron/.test(FRANJA), true);
t('el chevron dice si va a abrir o a cerrar',
  /direccion=\{abierta \? 'arriba' : 'abajo'\}/.test(FRANJA), true);

console.log('\n── ⑭ ROJO · EL PAR CÁLIDO SE USA ENTERO, JAMÁS LA MITAD ──');
/* 🔴 **La clase, y no el caso.** `bg.warm` es un papel CLARO en los tres temas;
   `text.warm` es su tinta. En memorial la tinta del tema es CLARA (fondo
   oscuro), así que una pieza que pinta el fondo cálido y escribe con la tinta
   default queda en **1.25:1** — medido en el emulador, no estimado. Y no se ve
   en claro ni en oscuro: *en dos de los tres temas la mitad del par se ve
   perfecta, que es exactamente por qué ningún ojo lo caza.*

   ⚠️ Este assert mide **el archivo entero**, no mi pieza: el día que otra
   pinte `bg.warm` la va a medir sola. Su rojo se ejerció volviendo el
   `color="warm"` del resumen a la tinta default. */
for (const [n, s] of [['franja', FRANJA], ['métrica', MET], ['hoy', HOY], ['acciones', ACC], ['conociéndolo', CON], ['peso', PESO], ['hero', HERO]] as const) {
  if (!/bg\.warm/.test(s)) continue;
  const textos = s.match(/<Texto[^>]*>/g) ?? [];
  const sinPar = textos.filter((x) => !/color="warm"/.test(x));
  t(`${n}: pinta bg.warm ⇒ TODO su texto pide la tinta cálida`, sinPar, []);
  t(`${n}: …y el chevron y los glifos también`,
    !/theme\.text\.secondary|registro="tinta"/.test(s), true);
}

console.log('\n── ⑮ ROJO · NINGÚN TRAZO SE SALE DE SU CAJA (2.2.1 ①) ──');
/* 🔴 **El trazo se dibuja CENTRADO en su camino**: la mitad del grosor queda
   afuera, y `strokeLinecap="round"` estira otro medio grosor en cada punta.
   *Una caja calculada sobre la línea IDEAL siempre queda chica por el grosor
   entero, y el recorte no se ve como defecto: se ve como una línea que toca el
   borde — que es justo lo que uno esperaría de un mínimo.* */
t('el margen se DERIVA del grosor, no se elige', margenDeTrazo(2), 1);

const GROSOR = 2, AIRE = 2, M = margenDeTrazo(GROSOR) + AIRE;
/* Los TRES casos donde la línea se pega a un borde: la que sube, la plana y
   la de rango cero. */
for (const [nombre, serie] of [
  ['una que sube', [70, 72, 71, 75]],
  ['una plana', [24, 24, 24]],
  ['dos puntos, mínimo y máximo', [0, 100]],
] as const) {
  const pts = puntosDeLinea(serie, 96, 28, M);
  t(`🔴 ${nombre}: cero trazos fuera de la caja`, trazosFueraDeCaja(pts, 96, 28, GROSOR), []);
}
/* 🔴 EL CONTROL QUE PRUEBA QUE EL INSTRUMENTO VE: sin margen, la que toca el
   piso SÍ se sale. Sin esto, los tres verdes de arriba no dicen nada. */
t('CONTROL · sin margen, el mínimo SÍ se sale',
  trazosFueraDeCaja(puntosDeLinea([0, 100], 96, 28, 0), 96, 28, GROSOR).length > 0, true);

/* El anillo: `r = (lado - grosor)/2` deja el borde EXTERNO justo sobre el
   borde de la caja — no se sale, pero queda sin aire. */
t('🔴 el anillo deja aire: su borde externo NO toca la caja',
  radioDeAnillo(40, 4, AIRE) + 4 / 2 + AIRE <= 40 / 2, true);
t('CONTROL · sin aire, el borde externo cae EXACTO sobre la caja',
  radioDeAnillo(40, 4, 0) + 4 / 2, 40 / 2);

/* 🔴 Y LO QUE LO CAUSABA DE VERDAD ERA EL ANCHO FIJO: el SVG medía 96 px y en
   la columna angosta el número más el gráfico no entraban. Hoy es un viewBox
   dentro de una caja que ENCOGE. */
/* 🔴 **EL ESLABÓN QUE FALTABA, y lo destapó ejercer el rojo.** Los tres
   asserts de arriba calculan los puntos ELLOS MISMOS: prueban que la función
   sabe dejar margen, **no que la pieza se lo pida**. Bajar el margen de la
   pieza a `0` los dejaba a los tres en verde. *Un arnés que arma su propio
   caso mide la función y no el producto* — y el defecto que se vio en el
   aparato vivía justo en el eslabón que nadie medía. */
t('🔴 …y la PIEZA se lo pide: el margen derivado llega a `puntosDeLinea`',
  /const margen = margenDeTrazo\(LIENZO\.grosor\) \+ AIRE/.test(MET) &&
  /puntosDeLinea\(dibujo\.serie, LIENZO\.ancho, LIENZO\.alto, margen\)/.test(MET), true);
t('🔴 …y el anillo pide su radio con aire',
  /radioDeAnillo\(ANILLO\.lado, ANILLO\.grosor, AIRE\)/.test(MET), true);

t('🔴 el sparkline va por viewBox, no por ancho fijo', /viewBox=\{`0 0 \$\{LIENZO\.ancho\}/.test(MET), true);
t('…dentro de una caja que ENCOGE', /flexShrink: 1[^}]*maxWidth: LIENZO\.ancho/.test(MET), true);
t('🔴 …y el NÚMERO nunca cede: es el contenido', /flexShrink: 0/.test(MET), true);

console.log('\n── ⑯ ROJO · EL DATO A 18, EL CONTEXTO A 11, Y NADA CORTADO (2.2.1 ②) ──');
t('el dato grande usa el token de métrica (18), no `lg` (22)',
  /fontSize: typography\.size\.metrica/.test(MET) && !/typography\.size\.lg/.test(MET), true);
t('la línea de contexto va a 11 (`xs`)', /fontSize: typography\.size\.xs/.test(MET), true);
/* 🔴 Ninguna tarjeta trunca: el número no, el contexto tampoco. */
t('🔴 la tarjeta de métrica NO trunca en ningún lado', /numberOfLines/.test(MET), false);
/* La fecha corta: «lun 7 sept», no «7 de septiembre de 2026». */
t('🔴 la fecha de cita se escribe corta', fechaCortaHumana('2026-09-07', 'es'), 'lun 7 sept');
t('…y en inglés', fechaCortaHumana('2026-09-07', 'en'), 'Mon Sep 7');
/* Degrada al dato crudo, JAMÁS a una fecha inventada (L-197). */
t('🔴 una fecha rota NO se inventa', fechaCortaHumana('no-es-fecha', 'es'), 'no-es-fech');

console.log('\n── ⑰ ROJO · EL «HOY» NO PUEDE SER GENÉRICO (2.2.1 ③) ──');
/* *El «hoy» es el lugar más caro de la pantalla: una tarjeta genérica ahí
   enseña que ese lugar no vale la pena mirarlo.* */
t('🔴 sin título, la tarjeta NO se dibuja', /titulo\.trim\(\)\.length === 0/.test(HOY), true);
t('🔴 …ni sin voz del acto', /vozActo\.trim\(\)\.length === 0/.test(HOY), true);
t('se mide `.trim()`: un espacio no es un texto', /\.trim\(\)\.length === 0 \|\| /.test(HOY), true);
/* La pieza no tiene un texto de reserva: no puede inventar de qué habla. */
t('🔴 la pieza no trae ninguna voz propia de reserva',
  (HOY.match(/(titulo|vozActo)\s*(\?\?|\|\|)\s*'/g) ?? []), []);

console.log('\n── ⑱ ROJO · CONOCIÉNDOLO: DOS ESTADOS, UNA SOLA INVITACIÓN (2.2.1 ④) ──');
/* *Dos pedidos pegados no se leen como dos oportunidades: se leen como una
   lista de deberes* — y en una tarjeta que celebra, eso la vuelve un reclamo. */
t('🔴 el incompleto pide UNA invitación', /invitacion: ReactNode/.test(CON), true);
t('🔴 …y el tipo le prohíbe la otra vía', /vozFelicitacion\?: never/.test(CON), true);
t('🔴 el completo NO admite invitación', /invitacion\?: never/.test(CON), true);
t('el completo felicita en UNA línea', /vozFelicitacion: string/.test(CON), true);
t('…y su «más sobre» es opcional: sin urgencia', /masSobre\?: ReactNode/.test(CON), true);
/* 🔴 Y la prueba de que la unión es lo que lo impide, no la disciplina: los
   campos viejos, que se podían mandar juntos, ya no existen. */
t('🔴 murieron los dos opcionales que se podían mandar juntos',
  /contanos: ReactNode|raza\?: ReactNode/.test(CON), false);

console.log('\n── ⑲ ROJO · UNA FILA DE CHIPS ENVUELVE, NO CORTA (2.2.1 ⑤) ──');
const SEL = src('SelectorOpcion.tsx');
t("🔴 'fila' envuelve", /flexWrap:\s*\n?\s*entidad \|\| disposicion === 'fila'/.test(SEL), true);
t('🔴 sólo trunca el que tiene tope duro de ancho (`entidad`)',
  /numberOfLines=\{entidad \? 1 : undefined\}/.test(SEL), true);
/* La cura NO es scrollear: *una tira esconde la última opción detrás de un
   gesto que nadie sabe que existe, y en una escala de gravedad la última es
   justo la que más importa ver.* */
t("'tira' sigue siendo la ÚNICA con scroll horizontal",
  (SEL.match(/<ScrollView\s+horizontal/g) ?? []).length, 1);

console.log('\n── ⑳ ROJO · LA HUELLA DEL VÍNCULO: NINGÚN NÚMERO PUEDE LLEGAR (2.2.2) ──');
/* 🔴 **El anillo murió, y con él la última forma de contar.** Un arco que se
   llena ES un número con otra ropa: se lee «voy por la mitad», y el día que
   retroceda la familia siente que perdió algo. */
t('🔴 la tarjeta ya NO recibe una fracción', /fraccion/.test(CON), false);
t('🔴 …ni queda un anillo que la dibuje', /Circle|strokeDasharray/.test(CON), false);
t('🔴 la huella recibe CINCO booleanos con nombre',
  ['identidad', 'salud', 'cuerpo', 'caracter', 'diaADia'].every((d) => new RegExp(`${d}: boolean`).test(HUE)), true);
/* Y no hay forma de contarlos adentro de la pieza. */
t('🔴 la pieza no cuenta: sin `.length`, sin `filter`, sin sumas',
  /\.length|\.filter\(|\breduce\(|\+\s*1|Math\./.test(HUE), false);
t('🔴 …y no dibuja NINGÚN texto', /<Texto|<Text\b/.test(HUE), false);
/* 🔴 EL LABEL TAMBIÉN CUENTA COMO PANTALLA: *un «tres de cinco» en un
   accessibilityLabel es el número entrando por el único lugar donde nadie lo
   estaba mirando.* La voz de al lado es la que lee quien no ve. */
t('🔴 …ni lleva un label que cuente', /accessibilityLabel/.test(HUE), false);

/* Cada dimensión con SU almohadilla, siempre la misma: si las llenas se
   acomodaran desde la izquierda, la huella diría CUÁNTAS y no CUÁLES. */
t('cinco almohadillas, ni una más', (HUE.match(/<Ellipse/g) ?? []).length, 5);
t('🔴 cada una atada a su dimensión por NOMBRE',
  ['identidad', 'salud', 'cuerpo', 'caracter', 'diaADia'].every((d) => new RegExp(`pintado\\(dimensiones\\.${d}\\)`).test(HUE)), true);
/* Lleno = pleno · vacío = CONTORNO, no gris: *un contorno gris se lee como
   «no disponible», y esto no está apagado: está esperando.* */
t("🔴 lo que falta va en CONTORNO del mismo acento, no en gris",
  /fill: 'none'[^}]*stroke: theme\.accent\.control/.test(HUE), true);

console.log('\n── ⑪ NINGUNA COMPONE VOZ (Ley 3) ──');
for (const [n, s] of [['métrica', MET], ['hoy', HOY], ['acciones', ACC], ['conociéndolo', CON], ['peso', PESO], ['hero', HERO]] as const) {
  /* ⚠️ **ESTE ASSERT MEDÍA UN PROXY, y se cobró CUATRO veces por eso** — las
     cuatro marcando geometría: `${p.x},${p.y}` (un `points`), un `viewBox`, y
     dos `rotate(...)` de un `transform`. *Un template no es voz por ser un
     template.*

     🔴 **Y las curas fallidas enseñan más que el defecto.** Primero fue una
     LISTA DE PALABRAS (`p.x`, `lado`, `ANILLO`…) — *un filtro por nombres mide
     el vocabulario de ayer y crece con cada geometría nueva*. Después una
     lista de ATRIBUTOS — *no vio el `points` porque venía de un `.map().join()`
     y no de un atributo directo*. Después «tiene letras» — *y `rotate` tiene
     letras*. **Tres intentos, y los tres seguían midiendo la FORMA.**

     🔴 **EL HECHO ES OTRO, y se distingue por UN CARÁCTER:** componer voz es
     poner un template **como HIJO de JSX**; la geometría va como **VALOR DE UN
     ATRIBUTO**. Uno viene después de `>`, el otro después de `=`. *Eso no es
     un proxy del vocabulario: es literalmente la diferencia entre algo que un
     humano lee y algo que consume el motor de dibujo.* Y no crece: una
     geometría nueva entra por `=` como todas las demás. */
  const hijosDeJsx = [...s.matchAll(/>\s*\{(`[^`]*\$\{[^`]*`)\}/g)].map((m) => m[1] ?? '');
  const plantillas = hijosDeJsx.filter((x) => !/rotulo|etiqueta|titulo/.test(x));
  t(`${n}: sin plantillas de texto`, plantillas, []);
}

if (NO_CONCLUYENTE.length > 0) {
  console.log(`\n⚠️ NO CONCLUYENTE · no se pudieron abrir: ${NO_CONCLUYENTE.join(' · ')}`);
  console.log('   No es verde ni rojo: es que no se pudo medir. Sale 2.');
  process.exit(2);
}
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
