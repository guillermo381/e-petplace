/* Arnés del CARNET (S113-B · lote 1.0) — sus tres rojos, y la regla que los
   ordena: **el carnet AFIRMA, el plan CALCULA, la extracción PROPONE.**
   Importa sólo el módulo puro: `vacunas-estado` no arrastra `react-native`. */
import {
  AVISO_DIAS, detalleVisible, diasEntre, estadoDeVacuna, faltanPorTocar, pideRevision,
  marcaDeEstado, resumenDeLaTanda, revisada, type EstadoVacuna,
} from '../packages/ui/src/components/vacunas-estado.ts';
import { readFileSync } from 'node:fs';

let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const src = (f: string) =>
  sinComentarios(readFileSync(new URL(`../packages/ui/src/components/${f}`, import.meta.url), 'utf8'));
const CARNET = src('FilaVacunaCarnet.tsx');
const CONF = src('FilaConfirmacionVacuna.tsx');
const PLAN = src('ListaPlanVacunal.tsx');
const PUNTO = src('PuntoEstado.tsx');
const INDICE = sinComentarios(readFileSync(new URL('../packages/ui/src/index.ts', import.meta.url), 'utf8'));
const HOY = '2026-09-04';
/* Colores de mentira a propósito: **lo que se mide es la CLASIFICACIÓN**, no
   el tema. Si el gate usara los del tema, un cambio de paleta lo pondría rojo
   sin que nada de la regla hubiera cambiado. */
const C = { exito: 'E', aviso: 'A', peligro: 'P', tinta: 'T' };

console.log('\n── ① ROJO · LO QUE ES `null` NO APARECE ──');
t('un campo null se va entero',
  detalleVisible([{ etiqueta: 'Lote', valor: 'A1' }, { etiqueta: 'Lab', valor: null }]),
  [{ etiqueta: 'Lote', valor: 'A1' }]);
t('🔴 y una cadena vacía TAMBIÉN (un espacio no es un dato)',
  detalleVisible([{ etiqueta: 'Lote', valor: '   ' }]), []);
t('todos null ⇒ no hay grilla', detalleVisible([{ etiqueta: 'a', valor: null }, { etiqueta: 'b', valor: null }]), []);
t('CONTROL POSITIVO · lo que sí vino, viaja',
  detalleVisible([{ etiqueta: 'a', valor: 'x' }]).length, 1);
t('🔴 la pieza NO dibuja guiones ni «sin dato»', /['"]—['"]|sin dato/i.test(CARNET), false);
t('…e itera lo filtrado, sin una rama por campo',
  /campos\.map\(/.test(CARNET) && /detalleVisible\(/.test(CARNET), true);

console.log('\n── ② ESTADO · y `sinRefuerzo` NO es «al día» ──');
t('refuerzo lejos ⇒ al día', estadoDeVacuna({ fechaAplicada: '2026-01-01', fechaProxima: '2027-01-01' }, HOY), { clase: 'alDia' });
t('refuerzo cerca ⇒ vence en N', estadoDeVacuna({ fechaAplicada: '2026-01-01', fechaProxima: '2026-09-20' }, HOY), { clase: 'porVencer', dias: 16 });
t('refuerzo pasado ⇒ vencida', estadoDeVacuna({ fechaAplicada: '2026-01-01', fechaProxima: '2026-08-20' }, HOY), { clase: 'vencida', dias: 15 });
t('🔴 aplicada SIN refuerzo ⇒ `sinRefuerzo`, que NO es al día',
  estadoDeVacuna({ fechaAplicada: '2026-01-01', fechaProxima: null }, HOY), { clase: 'sinRefuerzo' });
t('nada ⇒ sin registro', estadoDeVacuna({}, HOY), { clase: 'sinRegistro' });
t('el borde exacto del aviso cae en «por vencer»',
  estadoDeVacuna({ fechaAplicada: 'x', fechaProxima: '2026-10-04' }, HOY).clase, 'porVencer');
t('y un día después, al día',
  estadoDeVacuna({ fechaAplicada: 'x', fechaProxima: '2026-10-05' }, HOY).clase, 'alDia');
t(`el aviso son ${AVISO_DIAS} días`, AVISO_DIAS, 30);
/* 🔴 Las fechas son de CALENDARIO: restar con hora mete el huso del aparato. */
t('🔴 el cálculo no usa el huso del aparato', diasEntre('2026-01-01', '2026-01-02'), 1);
t('…ni cruzando un cambio de horario', diasEntre('2026-03-01', '2026-04-01'), 31);

console.log('\n── ③ ROJO · CONFIANZA BAJA (Y MEDIA) SE MARCAN ──');
t('baja pide revisión', pideRevision('baja'), true);
t('🔴 MEDIA también: una duda que no se muestra es una afirmación', pideRevision('media'), true);
t('CONTROL NEGATIVO · alta no', pideRevision('alta'), false);
t('la pieza la consume', /pideRevision\(/.test(CONF), true);
t('🔴 y lo que llegó null se dibuja VACÍO, nunca con un valor puesto',
  /vacios\.map\(/.test(CONF) && /valor=|defaultValue/.test(CONF) === false, true);

console.log('\n── ④ ROJO · NO SE CONFIRMA EN BLOQUE ──');
t('ninguna tocada ⇒ faltan todas', faltanPorTocar([false, false, false]), 3);
t('una sí ⇒ faltan dos', faltanPorTocar([true, false, false]), 2);
t('🔴 todas ⇒ cero', faltanPorTocar([true, true]), 0);
/* ⏪ La regla vivía tecleada en el pie (`faltan === 0 && tocadas.length > 0`).
   **Se mudó entera a `resumenDeLaTanda`** cuando el descarte probó que esa
   forma encendía el botón para guardar cero. Se mide donde vive ahora — y su
   comportamiento, en ⑨. */
t('el pie se enciende sólo con todas revisadas Y algo que guardar',
  /listo: faltan === 0 && aGuardar > 0/.test(sinComentarios(readFileSync(
    new URL('../packages/ui/src/components/vacunas-estado.ts', import.meta.url), 'utf8'))), true);
t('🔴 y apagado DICE cuántas faltan (un apagado mudo es el defecto)',
  /vozFaltan\(faltan\)/.test(CONF), true);
t('no existe un «confirmar todas» que saltee la revisión',
  /confirmarTodas|onConfirmarTodo/i.test(CONF), false);

console.log('\n── ⑤ ROJO · EL PLAN SE DICE COMO CÁLCULO, NO COMO DATO ──');
t('el plan tiene su propia voz, separada del estado', /vozPlan/.test(PLAN), true);
t('🔴 y se dibuja en OTRO registro que la línea del carnet',
  /vozEstado\}<\/Texto>[\s\S]{0,400}variante="apoyo">\{f\.vozPlan/.test(PLAN), true);
t('sin nada que calcular, no se dibuja', /f\.vozPlan !== undefined \?/.test(PLAN), true);
t('la lista NO trae acción: la pone la pantalla',
  /onPress|Pressable/.test(PLAN), false);
t('obligatoria u opcional se DICE', /vozObligatoria|vozOpcional/.test(PLAN), true);

console.log('\n── ⑥ LAS PIEZAS NO COMPONEN VOZ (Ley 3) ──');
for (const [n, s] of [['carnet', CARNET], ['confirmación', CONF], ['plan', PLAN]] as const)
  t(`\`${n}\` no arma frases con datos`, /`\$\{[a-z]+\} (de|en|para|hasta)/i.test(s), false);
t('la fila del carnet recibe `hoy` por prop, no lo lee del reloj',
  /new Date\(\)/.test(CARNET), false);

console.log('\n── ⑦ ROJO · «TODAVÍA NO LE TOCA» NO SE DIBUJA COMO «SIN REGISTRO» ──');
/* 🔴 El pedido entero se juega acá: las dos comparten tinta a propósito
   —ninguna es un problema— así que **si el color fuera lo único que las
   separa, serían el mismo punto.** */
t('las dos ausencias comparten tinta', 
  [marcaDeEstado({ clase: 'sinRegistro' }, C).color, marcaDeEstado({ clase: 'aunNoCorresponde' }, C).color],
  ['T', 'T']);
t('🔴 …y el RELLENO las distingue: hueco sólo «todavía no le toca»',
  [marcaDeEstado({ clase: 'sinRegistro' }, C).hueco, marcaDeEstado({ clase: 'aunNoCorresponde' }, C).hueco],
  [false, true]);
t('🔴 y NO son la misma marca (el rojo del pedido)',
  JSON.stringify(marcaDeEstado({ clase: 'sinRegistro' }, C)) ===
    JSON.stringify(marcaDeEstado({ clase: 'aunNoCorresponde' }, C)), false);
t('CONTROL · `sinRefuerzo` sigue llena y en tinta, sin cambiar',
  marcaDeEstado({ clase: 'sinRefuerzo' }, C), { color: 'T', hueco: false });
t('los tres estados con semáforo no cambiaron',
  (['alDia', 'porVencer', 'vencida'] as const).map((c) => marcaDeEstado({ clase: c, dias: 1 } as EstadoVacuna, C).color),
  ['E', 'A', 'P']);
t('🔴 ninguno de los seis se dibuja hueco por accidente',
  (['alDia', 'porVencer', 'vencida', 'sinRefuerzo', 'sinRegistro'] as const)
    .filter((c) => marcaDeEstado({ clase: c, dias: 1 } as EstadoVacuna, C).hueco).length, 0);
t('el punto dibuja las DOS formas, no una', /borderWidth: hueco \?/.test(PUNTO) && /hueco \? 'transparent'/.test(PUNTO), true);
t('🔴 y no se anuncia al lector: la palabra informa, la forma acompaña',
  /accessibilityRole|accessibilityLabel/.test(PUNTO), false);

console.log('\n── ⑧ ROJO · LA CLASIFICACIÓN ES UNA, Y SIN `default` ──');
/* ⏪ Vivía COPIADA en las dos piezas, las dos con `default`. Con ese `default`
   la clase nueva habría caído ahí **sin un solo error de tipos**, dibujándose
   idéntica a `sinRegistro`: exactamente lo que se pidió distinguir. */
t('🔴 la fila del carnet ya no tiene su propio switch de colores',
  /function colorDe/.test(CARNET), false);
t('🔴 …ni la lista del plan', /function colorDe/.test(PLAN), false);
t('las dos consumen la misma marca',
  /marcaDeEstado\(/.test(CARNET) && /marcaDeEstado\(/.test(PLAN), true);
t('🔴 y la clasificación NO tiene rama `default` donde caerse en silencio',
  /default:/.test(sinComentarios(readFileSync(
    new URL('../packages/ui/src/components/vacunas-estado.ts', import.meta.url), 'utf8'))), false);
t('🔴 `estadoDeVacuna` JAMÁS inventa «todavía no le toca»: sólo ve fechas',
  [estadoDeVacuna({}, HOY).clase, estadoDeVacuna({ fechaAplicada: '2020-01-01', fechaProxima: null }, HOY).clase]
    .includes('aunNoCorresponde' as never), false);

console.log('\n── ⑨ ROJO · «ESTA NO ES», Y EL BOTÓN QUE GUARDABA NADA ──');
t('descartar ES revisar', revisada({ tocada: false, descartada: true }), true);
t('CONTROL NEGATIVO · sin tocar ni descartar, no está revisada', revisada({ tocada: false }), false);
t('una descartada no bloquea la tanda',
  resumenDeLaTanda([{ tocada: true }, { tocada: false, descartada: true }]),
  { faltan: 0, aGuardar: 1, listo: true });
t('🔴 TODAS descartadas ⇒ NO se enciende (guardaría CERO)',
  resumenDeLaTanda([{ tocada: false, descartada: true }, { tocada: false, descartada: true }]),
  { faltan: 0, aGuardar: 0, listo: false });
t('sin revisar todo, tampoco', resumenDeLaTanda([{ tocada: true }, { tocada: false }]).listo, false);
t('la tanda vacía no se guarda', resumenDeLaTanda([]).listo, false);
t('🔴 el pie ya no puede recibir un arreglo de booleanos suelto',
  /tocadas: readonly boolean\[\]/.test(CONF), false);
t('…recibe el estado de las filas y deriva sus dos cuentas',
  /filas: readonly FilaDeLaTanda\[\]/.test(CONF) && /resumenDeLaTanda\(filas\)/.test(CONF), true);
t('🔴 y la etiqueta se compone con el número que el pie deriva, no con otro',
  /vozGuardar\(aGuardar\)/.test(CONF), true);
t('🔴 apagado por «no queda ninguna» DICE eso, no «faltan N»',
  /faltan > 0 \? vozFaltan\(faltan\) : vozNinguna/.test(CONF), true);
t('la salida existe y es obligatoria', /onDescartar: \(\) => void/.test(CONF), true);
t('🔴 …y NO es opcional (una casa que la omita se queda sin salida, sin error)',
  /onDescartar\?:/.test(CONF), false);
t('descartada no ofrece confirmar: no se pide contradecirse',
  /if \(descartada\) \{[\s\S]{0,1200}?vozConfirmar/.test(CONF), false);
t('…y la fila queda a la vista, no se esfuma', /if \(descartada\)[\s\S]{0,200}return \(/.test(CONF), true);
t('«Esta no es» no viste de peligro', /vozDescartar[\s\S]{0,600}color="danger"/.test(CONF), false);

console.log('\n── ⑩ ROJO · SIN PROCEDENCIA NO SE DIBUJA PROCEDENCIA ──');
t('🔴 la línea es condicional, no un valor por defecto',
  /vozOrigen !== undefined \? <Texto/.test(CONF), true);
t('la voz es opcional', /vozOrigen\?: string/.test(CONF), true);
t('🔴 y `origen` ya no viaja: el contrato lo exigía y el dibujo lo ignoraba',
  /^\s+origen: OrigenLectura/m.test(CONF), false);
t('el tipo sigue exportado —es el vocabulario de la revisión—',
  /type OrigenLectura/.test(INDICE), true);

console.log('\n── ⑪ EL ORBE SE PUEDE IMPORTAR (o se copia una cuarta vez) ──');
t('`OrbeCoach` sale del índice', /export \{ OrbeCoach, type OrbeCoachProps \}/.test(INDICE), true);
t('CONTROL · la geometría sigue SIN salir (Ley 8)', /export \{[^}]*\bORBE\b/.test(INDICE), false);
t('el punto de estado también sale', /export \{ PuntoEstado/.test(INDICE), true);

console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
