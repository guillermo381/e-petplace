/* Arnés del PERFIL (S113-B · lote 1.1). La regla que ordena las cuatro piezas:
   **lo que el dato no sabe, no se dibuja.** */
import { hayCobertura, haySeguridad, ordenarSeguridad, tendenciaPeso } from '../packages/ui/src/components/perfil-seguridad.ts';
import { readFileSync } from 'node:fs';
let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
const sin = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
/* 🔴 **UN GATE QUE NO PUEDE MEDIR NO SE MUERE: LO DICE.** Con un `readFileSync`
   pelado, un árbol sin alguna de estas piezas reventaba con `ENOENT` y su
   rastro de pila — *y un stack trace no distingue «no hay defecto» de «no
   corrí»*, menos aún leído a través de un pipe (`L-191`). Sale **2 y NO
   CONCLUYENTE**, el código que la casa reserva para «no pude medir».
   Misma cura que en `_arnes-carnet.mts`: **la clase se cura en los dos lados o
   no se cura.** */
const NO_CONCLUYENTE: string[] = [];
const src = (f: string) => {
  try {
    return sin(readFileSync(new URL(`../packages/ui/src/components/${f}`, import.meta.url), 'utf8'));
  } catch {
    NO_CONCLUYENTE.push(f);
    return '';
  }
};
const FRANJA = src('FranjaSeguridad.tsx'), CELDAS = src('CeldasHoy.tsx');
const MED = src('PiezaMedicacionActiva.tsx'), FIL = src('FiltrosLineaDeVida.tsx');
const FICHA = src('FichaRaza.tsx');
const HC = src('HojaContanos.tsx');
const BC = src('BotonContanos.tsx');
const PC = src('PastillaConociendolo.tsx');
const it = (id: string, clase: any) => ({ id, clase, texto: 'x', procedencia: 'familia' as const, vozProcedencia: 'v' });

console.log('\n── ① ROJO · SIN NADA, LA FRANJA NO EXISTE ──');
t('🔴 lista vacía ⇒ no se dibuja', haySeguridad([]), false);
t('CONTROL POSITIVO · con uno, sí', haySeguridad([it('a', 'alergia')]), true);
t('la pieza sale por null', /if \(!haySeguridad\(items\)\) return null/.test(FRANJA), true);
t('🔴 y ese guard va DESPUÉS de los hooks',
  (() => { const c = FRANJA.slice(FRANJA.indexOf('export function FranjaSeguridad'));
    return c.indexOf('useState') < c.indexOf('!haySeguridad'); })(), true);

console.log('\n── ② EL ORDEN: lo que puede hacer daño primero ──');
t('la alergia manda sobre todo',
  ordenarSeguridad([it('r', 'restriccion'), it('a', 'alergia')]).map((i) => i.clase), ['alergia', 'restriccion']);
t('y la medicación sobre la condición',
  ordenarSeguridad([it('c', 'condicion'), it('m', 'medicacion')]).map((i) => i.clase), ['medicacion', 'condicion']);
t('🔴 no muta el arreglo que recibe',
  (() => { const o = [it('r', 'restriccion'), it('a', 'alergia')]; ordenarSeguridad(o); return o[0].clase; })(), 'restriccion');
t('la franja dice el nombre, no la categoría',
  /tiene alergias|Tiene alergias/.test(FRANJA), false);
t('y la procedencia se ve al abrir', /vozProcedencia/.test(FRANJA), true);

console.log('\n── ③ ROJO · LA TENDENCIA NO PARPADEA ──');
t('sube', tendenciaPeso(12.5, 12.0), 'sube');
t('baja', tendenciaPeso(11.5, 12.0), 'baja');
t('🔴 40 g de diferencia ⇒ IGUAL (una balanza doméstica varía)', tendenciaPeso(12.04, 12.0), 'igual');
t('🔴 sin anterior ⇒ null, que NO es «igual»', tendenciaPeso(12.0, null), null);
t('CONTROL POSITIVO · 60 g sí se nota', tendenciaPeso(12.06, 12.0), 'sube');
t('las flechas son signos, no adjetivos', /subió|bajó|Subió|Bajó/.test(CELDAS), false);

console.log('\n── ④ ROJO · UNA CELDA SIN DATO DICE QUE NO HAY ──');
t('sin ninguna cobertura ⇒ la celda lo dice',
  hayCobertura([{ plaga: 'pulgas', alDia: null }, { plaga: 'internos', alDia: null }]), false);
t('CONTROL POSITIVO · con una sola, ya hay chips',
  hayCobertura([{ plaga: 'pulgas', alDia: false }, { plaga: 'internos', alDia: null }]), true);
t('🔴 una plaga sin registro NO dibuja chip', /c\.alDia === null \? null :/.test(CELDAS), true);
t('las cuatro celdas caen a `vozSinDato`', (CELDAS.match(/vozSinDato/g) ?? []).length >= 4, true);
t('🔴 y sin dato NO se dibuja el contexto (sería de un dato que no está)',
  (CELDAS.match(/=== null \? undefined :/g) ?? []).length >= 3, true);
/* ⚠️ Este assert decía DOS cosas y sólo una murió con el pedido de C. Medía
   «no trae acción» como «no hay Pressable» — hoy la celda SÍ puede llevar
   toque. Lo que sigue rigiendo es la otra mitad: **puede tocarse, y no puede
   decidir a dónde.** Un `router` acá volvería a atar la pieza a una ruta. */
t('🔴 la celda no compone su destino: lo recibe',
  /router|useRouter|navigate\(/.test(CELDAS), false);

console.log('\n── ⑤ MEDICACIÓN Y FILTROS ──');
t('lo que la receta no decía, no se dibuja', /f\.dosis != null \?/.test(MED), true);
t('sin filas, no hay pieza', /filas\.length === 0\) return null/.test(MED), true);
t('«activa» lo decide la pantalla: la pieza no mira el reloj', /new Date\(\)/.test(MED), false);
t('🔴 los filtros NO tienen scroll horizontal', /horizontal/.test(FIL), false);

console.log('\n── ROJO · LOS OCHO DEL VOCABULARIO, Y NINGUNO SE CUELA SIN CHIP ──');
const TIPOS = ['salud', 'vacunas', 'antiparasitario', 'peso', 'paseos', 'estetica', 'adiestramiento', 'guarderia', 'recuerdos'];
const declarados = [...(FIL.match(/export type TipoLineaDeVida =([\s\S]*?)\n\n/)?.[1] ?? '')
  .matchAll(/\|\s*'([a-z]+)'/g)].map((m) => m[1]);
t('🔴 son los NUEVE de la mesa', declarados, TIPOS);
/* ☠️ `cuidado` era un BALDE: adentro caían paseos, estética y adiestramiento
   —tres oficios con tres partes distintos— bajo una sola palabra. Un filtro
   que junta tres cosas que la familia vivió por separado no filtra: agrupa lo
   que ella quería separar. */
t('☠️ `cuidado` murió y no vuelve', declarados.includes('cuidado'), false);
t('los tres que lo reemplazan están',
  ['paseos', 'estetica', 'adiestramiento'].every((x) => declarados.includes(x)), true);
/* ⚠️ Guardería es el QUINTO OFICIO y entró por firma, no por deducción: se
   declaró como hueco y el founder lo cerró. *Un noveno que nadie firma es el
   balde otra vez; uno firmado es vocabulario.* */
t('el quinto oficio tiene su chip', declarados.includes('guarderia'), true);
/* 🔴 EL GUARD Y LA FORMA SON LO MISMO: el reparto en dos filas es lo que hace
   IMPOSIBLE que un tipo nuevo se dibuje sin que alguien le elija su lugar. */
const reparto = [...(FIL.match(/const FILA = \{([\s\S]*?)\} satisfies/)?.[1] ?? '')
  .matchAll(/([a-z]+):\s*([012])/g)].map((m) => [m[1], Number(m[2])] as const);
t('🔴 el reparto lo cierra el compilador (`satisfies Record<TipoLineaDeVida…>`)',
  /\} satisfies Record<TipoLineaDeVida, 0 \| 1 \| 2>/.test(FIL), true);
t('cada uno de los nueve tiene su fila', reparto.map(([t]) => t).sort(), [...TIPOS].sort());
/* 🔴 TRES filas, y el criterio es EL ORIGEN DEL DATO — no «quién lo mira».
   ⏪ Fueron dos de 4 y 5, y medidas en el aparato eran TRES dibujadas: a la
   segunda le faltaban 114 px. Las tres de hoy no son ese desborde acomodado:
   son un corte distinto, y el que sobraba resultó ser el que tenía su propia
   naturaleza. */
const fila = (n: number) => reparto.filter(([, f]) => f === n).map(([t]) => t);
t('🔴 son TRES filas y quedan 4 · 4 · 1', [fila(0).length, fila(1).length, fila(2).length], [4, 4, 1]);
t('① lo que produce un veterinario', fila(0), ['salud', 'vacunas', 'antiparasitario', 'peso']);
t('② lo que produce un prestador — los cuatro oficios de la casa',
  fila(1), ['paseos', 'estetica', 'adiestramiento', 'guarderia']);
/* 🔴 `recuerdos` va solo y NO es que sobre: es el ÚNICO que la familia
   produce. Los otros ocho entran por mano de alguien que cobra. */
t('③ lo que produce la familia, y es el único', fila(2), ['recuerdos']);
t('🔴 …y NO quedó pegado a los oficios, que es de donde vino',
  fila(1).includes('recuerdos'), false);
t('el render recorre las TRES', /\(\[0, 1, 2\] as const\)/.test(FIL), true);
t('una fila sin chips no se monta (no deja una línea de aire)',
  /fila\.length === 0 \? null/.test(FIL), true);
t('🔴 y el wrap se queda DENTRO de cada fila, para que nada se recorte',
  /flexDirection: 'row', flexWrap: 'wrap'/.test(FIL), true);
t('…van con `flexWrap`: todo lo que existe está a la vista', /flexWrap/.test(FIL), true);
t('multi-selección: alterna, no reemplaza', /onAlternar/.test(FIL), true);
t('el blanco del chip sale de `text.inverse`, no de `sobreVideo`',
  /theme\.text\.inverse/.test(FIL) && /sobreVideo/.test(FIL) === false, true);

console.log('\n── ROJO · UNA CELDA SIN DESTINO NO SE DIBUJA COMO BOTÓN ──');
/* 🔴 *Un chevron sobre algo que no lleva a ningún lado enseña a desconfiar de
   todos los chevrones de la app.* La misma pieza, dos naturalezas, decididas
   por el DATO y no por una prop de apariencia. */
t('🔴 sin `onPress` la celda es una `View`, no un `Pressable`',
  /if \(onPress === undefined\) return <View style=\{estilo\}>/.test(CELDAS), true);
/* ⚠️ Este assert medía el CARÁCTER «›». Se cambió cuando el emulador mostró
   que eso era un chevron distinto del de `CeldaNavegacion` y `PieRevelar` —
   *dos chevrones en la misma app son dos afordancias*— y hoy mide la
   primitiva, que es lo que la casa manda usar. */
t('🔴 …y el chevron sólo aparece con destino, y es LA PRIMITIVA',
  /onPress !== undefined \? <Chevron color=\{theme\.text\.tertiary\} direccion="derecha" \/> : null/.test(CELDAS), true);
t('con destino lleva su rol de botón', /accessibilityRole="button"/.test(CELDAS), true);
t('…y su etiqueta junta rótulo y dato: quien no la ve necesita los dos',
  /`\$\{rotulo\} · \$\{dato\}`/.test(CELDAS), true);
t('🔴 las CUATRO celdas pueden llevar destino',
  (CELDAS.match(/onPress=\{(vacuna|antiparasitario|peso|medicacion)\.onPress\}/g) ?? []).length, 4);

console.log('\n── ROJO · EL CIERRE DE LA FICHA DE RAZA ──');
/* Sin slot no se dibuja NADA: una ficha sin invitación está completa, no le
   falta algo. Y es un SLOT y no un texto porque lo que va ahí lleva a algún
   lado, y componerlo acá obligaría a la pieza a saber a dónde. */
t('el cierre es un slot, no una prop de texto', /cierre\?: React\.ReactNode/.test(FICHA), true);
t('🔴 y sin él NO se dibuja ni un separador',
  /\{cierre\}/.test(FICHA) && /cierre !== undefined \?/.test(FICHA) === false, true);

console.log('\n── ROJO · EL «CONTANOS» (2.1) ──');
/* 🔴 UNA SOLA HOJA, CUATRO ACCESOS. Por eso la Hoja NO trae su botón: una
   pieza que lo trae obliga a cada acceso a montarlo entero o a clonarla. */
t('🔴 la Hoja no trae su propio acceso', /BotonContanos|Pressable[\s\S]{0,80}abrir/.test(HC), false);
t('…y su apertura la manda quien la monta', /visible: boolean/.test(HC), true);
/* La caja va ARRIBA: las entradas son para quien ya sabe qué contar; la caja,
   para quien no sabe en cuál va — y ésa es la mayoría. */
t('🔴 la caja libre va ARRIBA de las cuatro',
  HC.indexOf('libre !== undefined') < HC.indexOf('entradas.map'), true);
/* La propuesta REEMPLAZA a la caja: pedir otra cosa antes de contestar la
   primera es perder las dos. */
t('🔴 la propuesta reemplaza a la caja, no se apila',
  /propuesta !== undefined \? \([\s\S]{0,900}?\) : libre !== undefined \?/.test(HC), true);
t('🔴 …y exige sus DOS salidas',
  /onGuardar: \(\) => void/.test(HC) && /onDescartar: \(\) => void/.test(HC), true);
/* La pieza entrega el texto y NO la clase: si la adivinara, el sí de la
   familia dejaría de ser una decisión. */
t('🔴 la Hoja no clasifica lo que le escriben',
  /ClaseContanos/.test(HC.slice(HC.indexOf('libre !== undefined'), HC.indexOf('entradas.map'))), false);
t('cada entrada exige su destino', /onPress: \(\) => void/.test(HC), true);
t('el glifo lo decide la PIEZA, exhaustivo',
  /satisfies Record<ClaseContanos, IconoNombre>/.test(HC), true);
/* ═══ 🔴 EL VOCABULARIO ES EL DEL MOTOR, MIEMBRO POR MIEMBRO ═══════════════
   `ClaseContanos` tiene que ser IDÉNTICO a `ClaseDeHecho` del contrato: así un
   valor que viene del motor entra en la pieza **sin un solo cast**.
   ⚠️ **No se importa** porque `packages/ui` no depende de `packages/api` y
   hacerlo invertiría la dirección de la casa — *el design system pasaría a
   depender de la capa de datos.* ⇒ la igualdad la sostiene ESTE gate, que lee
   los dos archivos y compara. *Dos listas que tienen que ser iguales y nadie
   compara son dos listas que van a divergir.* */
{
  /* ⚠️ **SE EXTRAE CON UN REGEX LITERAL Y NO CON `new RegExp` INTERPOLADO.**
     La primera versión armaba el patrón con un template y su control positivo
     salió ROJO: *el extractor no veía nada y el assert de arriba comparaba
     `null` con `null`, que pasa sin medir.* Por eso el control existe.
     ⚠️ Y la segunda cortaba en `;` — **la casa no usa punto y coma**, así que
     el patrón se comió el código de abajo y contó DOCE miembros. Lo dijo el
     control, no yo: `[12, 4]`. Corta por fin de línea. */
  const miembrosDe = (texto: string, re: RegExp) => {
    const m = texto.match(re);
    return m === null ? null : [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]).sort();
  };
  const CONTRATO = (() => {
    try {
      return readFileSync(new URL('../packages/api/src/wrappers/coach.ts', import.meta.url), 'utf8');
    } catch { NO_CONCLUYENTE.push('packages/api/src/wrappers/coach.ts'); return ''; }
  })();
  const deLaPieza = miembrosDe(HC, /export type ClaseContanos =(.*)/);
  const delMotor = miembrosDe(CONTRATO, /export type ClaseDeHecho =(.*)/);
  t('🔴 la clase de la pieza es la del motor, miembro por miembro', deLaPieza, delMotor);
  /* CONTROL POSITIVO: sin él, dos `null` compararían iguales y el assert de
     arriba sería verde sin haber leído una sola línea. */
  t('CONTROL POSITIVO · el extractor SÍ ve los cuatro de cada lado',
    [deLaPieza?.length ?? 0, delMotor?.length ?? 0], [4, 4]);
  t('…y `rasgo` es el nombre del motor, no `personalidad`',
    deLaPieza?.includes('rasgo') === true && deLaPieza?.includes('personalidad') === false, true);
}
t('🔴 las cuatro filas montan en CONTROL: parejas, sin huella',
  /montaje="control"/.test(HC), true);
/* 🔴 NINGUNA VOZ SE TRUNCA, y las tres llevan el nombre de la mascota adentro:
   «Contanos lo que hace único a Constan… ›» le dice a la familia que la app no
   supo con quién estaba hablando. */
for (const [n, x] of [['la Hoja', HC], ['el botón', BC], ['la pastilla', PC]] as const) {
  t(`🔴 ${n}: cero \`numberOfLines\``, /numberOfLines/.test(x), false);
}
/* La firma de la pastilla es su DESAPARICIÓN: «0 por resolver» ocupa lugar
   para decir que no hay nada que hacer. */
t('🔴 con cero pendientes la pastilla NO se dibuja', /n <= 0\) return null/.test(PC), true);
/* ⚠️ **ACÁ HABÍA UN ASSERT QUE NO PODÍA DAR VERDE NUNCA**, y su rojo era del
   instrumento: medía la frase «Lo que FALTA» de un JSDoc, y `src()` **borra
   los comentarios antes de leer**. Es el espejo de medir el nombre en vez del
   hecho: *ahí medía una convención; acá medía prosa que el lector no puede
   ver.* Lo que ese assert quería fijar —que el número sea lo que falta y no lo
   que se sabe— **ya lo fija el guard de arriba**: con `n <= 0` la pieza
   desaparece, y un contador de progreso jamás desaparecería al llegar a su
   tope. Se retira en vez de reescribirse: *dos asserts para el mismo hecho
   envejecen por separado.* */
/* En memorial no se pide terminar de contar nada. */
for (const [n, x] of [['la Hoja', HC], ['el botón', BC], ['la pastilla', PC]] as const) {
  t(`🔴 ${n} no se dibuja en memorial`, /theme\.mode === 'memorial'\) return null/.test(x), true);
}
/* Los chevrones son la PRIMITIVA, no caracteres: el censo por la clase
   encontró tres piezas con el carácter, y se curaron las tres. */
t('🔴 cero chevrones dibujados como carácter en el paquete',
  /['"]›['"]|['"]⌃['"]/.test(HC + BC + PC + FICHA + src('FilaConfirmacionVacuna.tsx') + CELDAS), false);

console.log('\n── ⑥ NINGUNA COMPONE VOZ (Ley 3) ──');
for (const [n, s] of [['franja', FRANJA], ['celdas', CELDAS], ['medicación', MED], ['filtros', FIL]] as const)
  t(`\`${n}\` no arma frases`, /`\$\{[a-z]+\} (de|en|para|hasta|hace)/i.test(s), false);

if (NO_CONCLUYENTE.length > 0) {
  console.log(`\n⚠️ NO CONCLUYENTE · no se pudieron abrir: ${NO_CONCLUYENTE.join(' · ')}`);
  console.log('   Este árbol no tiene todas las piezas que el gate mide. **No es verde ni rojo:');
  console.log('   es que no se pudo medir**, y sale 2 para que ningún tablero lo lea como salud.');
  process.exit(2);
}
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
