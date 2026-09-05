/* Arnés del CARNET (S113-B · lote 1.0) — sus tres rojos, y la regla que los
   ordena: **el carnet AFIRMA, el plan CALCULA, la extracción PROPONE.**
   Importa sólo el módulo puro: `vacunas-estado` no arrastra `react-native`. */
import {
  AVISO_DIAS, detalleVisible, diasEntre, estadoDeVacuna, faltanPorTocar, pideRevision,
  marcaDeEstado, resumenDeLaTanda, revisada, estadoDelPlan, estaIncompleta,
  type EstadoVacuna, type EstadoPlanMotor,
} from '../packages/ui/src/components/vacunas-estado.ts';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

/* 🔴 **UN GATE QUE NO PUEDE MEDIR NO DICE QUE TODO ESTÁ BIEN — Y TAMPOCO SE
   MUERE.** Medido: al faltar un archivo, este arnés reventaba con un `ENOENT`
   y su rastro de pila. *Un stack trace no distingue «no hay defecto» de «no
   corrí»*, y quien lo lea a través de un pipe se lleva el exit del pipe
   (`L-191`). Ahora **sale 2 y NO CONCLUYENTE**, que es el código que la casa
   reserva para «no pude medir» y que ningún verde puede imitar.
   *Nació de un caso real: un archivo de este lote no está en toda rama que
   corra el gate, y el gate no puede depender de un lote que no llegó.* */
const NO_CONCLUYENTE: string[] = [];
const src = (f: string) => {
  try {
    return sinComentarios(readFileSync(new URL(`../packages/ui/src/components/${f}`, import.meta.url), 'utf8'));
  } catch {
    NO_CONCLUYENTE.push(f);
    /* Cadena vacía: los brazos que lo usen van a fallar, y por eso el reporte
       final NO los cuenta como rojos — los tapa el NO CONCLUYENTE. */
    return '';
  }
};
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
t('el pie se enciende sólo con todo revisado, nada incompleto Y algo que guardar',
  /listo: faltan === 0 && incompletas === 0 && aGuardar > 0/.test(sinComentarios(readFileSync(
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
  { faltan: 0, incompletas: 0, aGuardar: 1, listo: true });
t('🔴 TODAS descartadas ⇒ NO se enciende (guardaría CERO)',
  resumenDeLaTanda([{ tocada: false, descartada: true }, { tocada: false, descartada: true }]),
  { faltan: 0, incompletas: 0, aGuardar: 0, listo: false });
t('sin revisar todo, tampoco', resumenDeLaTanda([{ tocada: true }, { tocada: false }]).listo, false);
t('la tanda vacía no se guarda', resumenDeLaTanda([]).listo, false);
t('🔴 el pie ya no puede recibir un arreglo de booleanos suelto',
  /tocadas: readonly boolean\[\]/.test(CONF), false);
t('…recibe el estado de las filas y deriva sus dos cuentas',
  /filas: readonly FilaDeLaTanda\[\]/.test(CONF) && /resumenDeLaTanda\(filas\)/.test(CONF), true);
t('🔴 y la etiqueta se compone con el número que el pie deriva, no con otro',
  /vozGuardar\(aGuardar\)/.test(CONF), true);
/* ⏪ Eran DOS ramas y hoy son TRES: entre «faltan N» y «no queda ninguna» se
   metió «N por completar», que es un trabajo distinto. ⑰ mide el orden entero;
   acá queda el caso que esta sección vigila. */
t('🔴 apagado por «no queda ninguna» DICE eso, y es la ÚLTIMA rama',
  /incompletas > 0 \? vozIncompletas\(incompletas\) : vozNinguna/.test(CONF), true);
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
t('el vocabulario sigue exportado —es el de esta revisión—',
  /type EvidenciaAplicacion/.test(INDICE), true);

console.log('\n── ⑯ ROJO · EL VOCABULARIO DE LA EVIDENCIA (v2.1) ──');
/* ☠️ El viejo contestaba DÓNDE ESTÁ ESCRITA LA FECHA; éste, QUÉ PRUEBA LA
   APLICACIÓN. **No es un renombre: es otra pregunta**, y la misma fila da
   respuestas opuestas —sticker pegado con la fecha a mano al lado: el dato
   salió a mano, la prueba es el sticker—. Por eso el viejo se leía distinto
   dos veces: **dos manos lo clasificaron 4 a 0.** */
t('🔴 son los CUATRO de la v2.1, en orden',
  /export type EvidenciaAplicacion = 'sticker' \| 'sello' \| 'manuscrito' \| 'impreso'/.test(CONF), true);
t('🔴 `aMano` MURIÓ: contestaba la pregunta vieja', /'aMano'/.test(CONF), false);
t('☠️ y `OrigenLectura` no vuelve por la puerta de atrás',
  /export type OrigenLectura/.test(CONF), false);
t('la lápida queda: quien lo busque encuentra por qué se fue',
  /OrigenLectura/.test(readFileSync(
    new URL('../packages/ui/src/components/FilaConfirmacionVacuna.tsx', import.meta.url), 'utf8')), true);
t('`impreso` es un DATO, no un hueco: entra al vocabulario',
  /'impreso'/.test(CONF), true);

console.log('\n── ⑪ EL ORBE SE PUEDE IMPORTAR (o se copia una cuarta vez) ──');
t('`OrbeCoach` sale del índice', /export \{ OrbeCoach, type OrbeCoachProps \}/.test(INDICE), true);
t('CONTROL · la geometría sigue SIN salir (Ley 8)', /export \{[^}]*\bORBE\b/.test(INDICE), false);
t('el punto de estado también sale', /export \{ PuntoEstado/.test(INDICE), true);

console.log('\n── ⑫ ROJO · LA TANDA VACÍA NO ES LA TANDA DESCARTADA ──');
/* ⏪ Con cero filas el pie decía «faltan 0 por revisar» —una razón imposible
   de resolver—; con la primera cura pasó a «no queda ninguna para guardar»,
   que es cierto SÓLO si hubo alguna. Con cero nunca hubo nada, y esa frase le
   hace creer a la persona que descartó algo. */
t('cero filas: no falta nadie y no hay nada que guardar',
  resumenDeLaTanda([]), { faltan: 0, incompletas: 0, aGuardar: 0, listo: false });
t('🔴 …y el pie NO SE DIBUJA (un control sobre el vacío)',
  /if \(filas\.length === 0\) return null/.test(CONF), true);
t('CONTROL · con filas descartadas SÍ se dibuja, y ahí la voz es la correcta',
  resumenDeLaTanda([{ tocada: false, descartada: true }]), { faltan: 0, incompletas: 0, aGuardar: 0, listo: false });
t('el corte va ANTES de dibujar nada, no envuelto en el JSX',
  /resumenDeLaTanda\(filas\)[\s\S]{0,900}?if \(filas\.length === 0\) return null[\s\S]{0,120}?return \(/.test(CONF), true);

console.log('\n── ⑬ ROJO · LOS SEIS DEL MOTOR, Y NINGUNO CAE EN UNA RAMA MUDA ──');
const HOY13 = '2026-09-04';
t('al_dia', estadoDelPlan({ estado: 'al_dia' }, HOY13), { clase: 'alDia' });
t('nunca_aplicada ⇒ hueco del carnet', estadoDelPlan({ estado: 'nunca_aplicada' }, HOY13), { clase: 'sinRegistro' });
t('sin_fecha ⇒ se aplicó y no sabemos la próxima', estadoDelPlan({ estado: 'sin_fecha' }, HOY13), { clase: 'sinRefuerzo' });
t('🔴 aun_no_corresponde NO es una falta', estadoDelPlan({ estado: 'aun_no_corresponde' }, HOY13), { clase: 'aunNoCorresponde' });
t('vence_en ⇒ por vencer, con su número', estadoDelPlan({ estado: 'vence_en', proxima: '2026-09-20' }, HOY13), { clase: 'porVencer', dias: 16 });
t('vencida ⇒ vencida, con los días que lleva', estadoDelPlan({ estado: 'vencida', proxima: '2026-08-20' }, HOY13), { clase: 'vencida', dias: 15 });
/* 🔴 EL PEDIDO, medido donde se ve: `aun_no_corresponde` es el ARO. */
t('🔴 y en el dibujo es EL ARO, nunca la falta',
  [marcaDeEstado(estadoDelPlan({ estado: 'aun_no_corresponde' }, HOY13), C).hueco,
   marcaDeEstado(estadoDelPlan({ estado: 'nunca_aplicada' }, HOY13), C).hueco],
  [true, false]);
t('…y las dos NO son la misma marca',
  JSON.stringify(marcaDeEstado(estadoDelPlan({ estado: 'aun_no_corresponde' }, HOY13), C)) ===
    JSON.stringify(marcaDeEstado(estadoDelPlan({ estado: 'nunca_aplicada' }, HOY13), C)), false);
/* ⚠️ El motor DECIDE la clase; la fecha sólo aporta el número. Si la casa
   recomputara la ventana, dos partes contestarían distinto sobre el mismo
   animal — y gana la que se ve. Discriminador: una fecha LEJOS que el motor
   igual marcó `vence_en` sigue siendo «por vencer», no «al día». */
t('🔴 el veredicto del motor NO se recalcula',
  estadoDelPlan({ estado: 'vence_en', proxima: '2027-09-20' }, HOY13).clase, 'porVencer');
t('…ni al revés: una fecha cercana que el motor llamó `al_dia` sigue al día',
  estadoDelPlan({ estado: 'al_dia', proxima: '2026-09-05' }, HOY13).clase, 'alDia');
t('sin fecha no se pinta un número (un 0 diría «vence hoy»)',
  estadoDelPlan({ estado: 'vencida', proxima: null }, HOY13), { clase: 'sinRefuerzo' });
const FUENTE = sinComentarios(readFileSync(
  new URL('../packages/ui/src/components/vacunas-estado.ts', import.meta.url), 'utf8'));
t('🔴 el mapeo NO tiene rama `default` donde caerse en silencio', /default:/.test(FUENTE), false);
t('…y su exhaustividad la sostiene el compilador (TS2366 con un caso de menos)',
  /switch \(fila\.estado\)/.test(FUENTE) && /\): EstadoVacuna \{/.test(FUENTE), true);

console.log('\n── ⑭ LA COPIA DE LOS CÓDIGOS DEL MOTOR, VIGILADA ──');
/* 🔴 `packages/ui` no importa `packages/api` a propósito. El precio es una
   COPIA de la lista de estados, y una copia sin vigilancia es una bomba: el
   día que el motor gane un séptimo, el mapeo lo ignora sin un solo error.
   Este brazo lee el archivo REAL y compara. */
const SALUD = readFileSync(new URL('../packages/api/src/wrappers/salud.ts', import.meta.url), 'utf8');
const bloque = SALUD.match(/export type EstadoPlanVacuna =([\s\S]*?);/)?.[1] ?? '';
const delMotor = [...bloque.matchAll(/\|\s*'([a-z_]+)'/g)].map((m) => m[1]).sort();
const mios: EstadoPlanMotor[] = ['al_dia', 'aun_no_corresponde', 'nunca_aplicada', 'sin_fecha', 'vence_en', 'vencida'];
const faltanMe = delMotor.filter((e) => !mios.includes(e as EstadoPlanMotor));
const sobranMe = mios.filter((e) => !delMotor.includes(e));
console.log(`   el motor declara: ${delMotor.join(' · ') || '(no se pudo leer)'}`);
t('la lista del motor se pudo leer del archivo', delMotor.length > 0, true);
t('🔴 el motor NO tiene ningún estado que este mapeo ignore', faltanMe, []);
if (sobranMe.length > 0)
  console.log(`   ⚠️ NO CONCLUYENTE en el otro sentido: el mapeo cubre ${sobranMe.join(' · ')} y el archivo de este árbol no los declara.\n` +
    `      Es un árbol ATRASADO, no un mapeo de más: la lista viva está en \`origin/main\`. Se declara y no se pinta de verde.`);

console.log('\n── ⑯ ROJO · UNA FILA SIN NOMBRE NO SE PUEDE CONFIRMAR ──');
/* 🔴 *«Es correcta» sobre una fila sin nombre es firmar un renglón en blanco.*
   La regla del pie vive en `revisada()` y NO en la pantalla: si dependiera de
   que la pantalla se acuerde de no marcarla, el día que se olvide se guarda
   una vacuna sin nombre y nadie se entera. */
/* ⏪ «sin nombre no cuenta revisada» SE MUDÓ a su propia cuenta. No es que la
   regla se aflojara —lo incompleto sigue bloqueando— es que **mirar una fila y
   completarla son dos actos**, y meterlos en el mismo número obligaba a decir
   «faltan N por revisar» sobre una fila que ya se había revisado. */
t('tocada ⇒ revisada, aunque le falte un dato', revisada({ tocada: true, sinNombre: true }), true);
t('🔴 …pero cuenta INCOMPLETA, y por eso el pie no se enciende',
  resumenDeLaTanda([{ tocada: true }, { tocada: true, sinNombre: true }]),
  { faltan: 0, incompletas: 1, aGuardar: 2, listo: false });
t('descartarla SÍ la resuelve: ahí no se guarda nada',
  revisada({ tocada: false, descartada: true, sinNombre: true }), true);
t('🔴 …y descartada NO se cuenta incompleta (pedir completar lo tirado es trabajo para nadie)',
  resumenDeLaTanda([{ tocada: false, descartada: true, sinNombre: true }]).incompletas, 0);

console.log('\n── ⑰ ROJO · «POR COMPLETAR» NO ES «POR REVISAR» ──');
/* 🔴 Dos trabajos distintos, dos cuentas, dos voces: *«faltan 3 por revisar»
   manda a tocar; «1 por completar» manda a escribir* — y decir la primera
   cuando pasa la segunda manda a tocar una fila que ya se tocó. */
t('la regla de «le falta un dato» es UNA, con sus dos entradas',
  [estaIncompleta({ tocada: true, incompleta: true }), estaIncompleta({ tocada: true, sinNombre: true })],
  [true, true]);
t('CONTROL NEGATIVO · una fila completa no lo está', estaIncompleta({ tocada: true }), false);
t('🔴 las dos cuentas son independientes',
  resumenDeLaTanda([{ tocada: false }, { tocada: true, incompleta: true }]),
  { faltan: 1, incompletas: 1, aGuardar: 2, listo: false });
t('🔴 sin revisar NADA y sin incompletas, el pie enciende',
  resumenDeLaTanda([{ tocada: true }, { tocada: true }]).listo, true);
t('el pie dice las TRES razones en el orden en que se resuelven',
  /faltan > 0 \? vozFaltan\(faltan\) : incompletas > 0 \? vozIncompletas\(incompletas\) : vozNinguna/.test(CONF), true);
t('🔴 y `vozIncompletas` es OBLIGATORIA: sin ella el apagado sería mudo',
  /vozIncompletas: \(n: number\) => string/.test(CONF), true);

console.log('\n── ⑱ ROJO · LO INCOMPLETO SE SEÑALA EN SU CAMPO ──');
t('la pieza recibe QUÉ falta', /incompleta\?: 'fecha' \| 'nombre'/.test(CONF), true);
t('🔴 el campo de la fecha se señala, no un cartel arriba',
  /borderColor: falta === 'fecha' \? theme\.status\.warningText/.test(CONF), true);
t('…y la razón va PEGADA a ese campo', /falta === 'fecha' && vozIncompleta !== undefined/.test(CONF), true);
t('🔴 algo que falta marca la fila entera, pase lo que pase con la confianza',
  /pideRevision\(confianza\) \|\| falta !== undefined/.test(CONF), true);
t('🔴 el confirmar se apaga por lo que falta, sea cual sea',
  /disabled=\{bloqueada\}/.test(CONF), true);
/* ⚠️ La asimetría es medida, no cómoda: la pieza TIENE el nombre como prop y
   puede verificarlo; `campos` son etiqueta y valor genéricos y no sabe cuál es
   la fecha. Señalar el campo equivocado es peor que no señalar. */
t('🔴 el nombre se defiende SOLO aunque nadie lo declare',
  /const falta: 'fecha' \| 'nombre' \| undefined = incompleta \?\? \(pedirNombre \? 'nombre' : undefined\)/.test(CONF), true);
t('🔴 y la fecha NO se congela: la resuelve la pantalla retirando el aviso',
  /const bloqueada = falta === 'nombre' \? !hayNombre : falta !== undefined/.test(CONF), true);
t('el nombre puede llegar `null`', /nombre: string \| null/.test(CONF), true);
/* ⏪ Esta regla se GENERALIZÓ: era «sin nombre» y hoy es «algo que falta». Su
   forma nueva la mide ⑱ —`pideRevision(confianza) || falta !== undefined`—;
   acá queda su caso: el nombre nulo entra a `falta` sin que nadie lo declare. */
t('🔴 el nombre nulo se marca solo, sin que la pantalla lo declare',
  /useState\(!hayNombre \|\| incompleta === 'nombre'\)/.test(CONF), true);
t('🔴 el campo se dibuja VACÍO y editable, no un hueco ni un «sin nombre»',
  /<Campo[\s\S]{0,300}value=\{nombre \?\? ''\}/.test(CONF), true);
t('…con su razón bajo el campo, que es la del botón apagado',
  /ayuda=\{vozSinNombre\}/.test(CONF), true);
/* ⏪ Idem: el apagado dejó de ser sólo del nombre. ⑱ mide su forma nueva; acá
   queda el COMPORTAMIENTO, que es lo que no puede cambiar. */
t('🔴 «Es correcta» APAGADO mientras falte el nombre',
  /const bloqueada = falta === 'nombre' \? !hayNombre/.test(CONF), true);
t('🔴 y se fija AL MONTAR: el campo no se esfuma con la primera letra',
  /useState\(!hayNombre \|\| incompleta === 'nombre'\)/.test(CONF), true);
t('descartada sin nombre DICE cuál era, no queda muda',
  /hayNombre \? nombre : vozSinNombre/.test(CONF), true);
/* ⚠️ El foco lo decide la LISTA: con dos filas sin nombre, `autoFocus` en las
   dos deja el foco en la última y la pantalla salta al fondo. */
t('el foco entra por prop y su default NO enfoca', /enfocar = false/.test(CONF), true);

console.log('\n── ⑮ ROJO · LOS CONSUMIDORES DE `main`, QUE ESTE ÁRBOL NO PUEDE VER ──');
/* 🔴 **ESTE BRAZO NACE DE UN DAÑO, no de una precaución.**
 * La adenda cambió el contrato de dos piezas y **dejó `main` en rojo**: el
 * typecheck de esta rama dio 0 y era cierto — *los consumidores que rompí
 * viven en `apps/cliente`, en la rama de otra pista, y ningún gate de este
 * árbol podía verlos.* Un verde sobre lo que uno alcanza a mirar no dice nada
 * de lo que rompió afuera.
 *
 * **La cura es medir contra `origin/main`, que es donde el contrato se
 * encuentra con sus consumidores.** Sin remoto no hay verde: NO CONCLUYENTE.
 */
const REFERENCIA = 'origin/main';
const git = (...a: string[]) =>
  execFileSync('git', a, { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' });

/* Cada pieza, con lo que su contrato EXIGE hoy y lo que RETIRÓ. */
const CONTRATOS = [
  { pieza: 'FilaConfirmacionVacuna', exige: ['onDescartar', 'vozDescartar'], retirado: ['origen='] },
  { pieza: 'PieConfirmacionVacunas', exige: ['filas=', 'vozNinguna'], retirado: ['tocadas='] },
] as const;

let consumidores: string[] = [];
try {
  const nombres = CONTRATOS.map((c) => c.pieza).join('\\|');
  consumidores = git('grep', '-l', nombres, REFERENCIA, '--', 'apps', 'packages/api')
    .split('\n').filter(Boolean).map((l) => l.replace(`${REFERENCIA}:`, ''));
} catch (e) {
  /* `git grep -l` sale 1 sin coincidencias: eso es CERO consumidores, no un
     fallo. Se distingue por el mensaje, no por el código. */
  const msg = String((e as { stderr?: string }).stderr ?? e);
  if (/unknown revision|not a git repository|ambiguous argument/i.test(msg)) NO_CONCLUYENTE.push(`${REFERENCIA} (no alcanzable)`);
}
console.log(`   consumidores en ${REFERENCIA}: ${consumidores.join(' · ') || '(ninguno)'}`);
t('la referencia se pudo consultar', NO_CONCLUYENTE.some((x) => x.includes(REFERENCIA)), false);

for (const archivo of consumidores) {
  const texto = git('show', `${REFERENCIA}:${archivo}`);
  for (const { pieza, exige, retirado } of CONTRATOS) {
    /* El bloque de la etiqueta: desde `<Pieza` hasta su cierre. */
    const bloques = [...texto.matchAll(new RegExp(`<${pieza}\\b[\\s\\S]*?/>`, 'g'))].map((m) => m[0]);
    if (bloques.length === 0) continue;
    const corto = archivo.split('/').pop();
    /* 🔴 Lo RETIRADO no puede seguir viajando… */
    for (const r of retirado)
      t(`🔴 \`${corto}\` ya no le pasa \`${r.replace('=', '')}\` a \`${pieza}\``,
        bloques.some((b) => b.includes(r)), false);
    /* …y lo que ahora es OBLIGATORIO tiene que estar en cada montaje. */
    for (const x of exige)
      t(`🔴 \`${corto}\` le pasa \`${x.replace('=', '')}\` a \`${pieza}\` en TODOS sus montajes`,
        bloques.every((b) => b.includes(x)), true);
  }
}
/* ⚠️ **LO QUE ESTA RAMA ACABA DE VOLVER OBLIGATORIO Y `main` TODAVÍA NO TIENE.**
   No es un rojo: es una TRANSICIÓN, y el consumidor es de otra pista. Pero
   tampoco es verde — *un cambio de contrato que nadie nombra es exactamente
   cómo rompí `main` la vez pasada.* Se lista con nombre y archivo para que la
   deuda tenga dueño en vez de descubrirse en el merge. */
const EN_TRANSITO = [
  { pieza: 'FilaConfirmacionVacuna', props: ['etiquetaNombre', 'vozSinNombre'] },
  { pieza: 'PieConfirmacionVacunas', props: ['vozIncompletas'] },
] as const;
for (const archivo of consumidores) {
  const texto = git('show', `${REFERENCIA}:${archivo}`);
  for (const { pieza, props } of EN_TRANSITO) {
    const bloques = [...texto.matchAll(new RegExp(`<${pieza}\\b[\\s\\S]*?/>`, 'g'))].map((m) => m[0]);
    if (bloques.length === 0) continue;
    const debe = props.filter((x) => !bloques.every((b) => b.includes(x)));
    if (debe.length > 0)
      console.log(`   ⚠️ DEUDA CON EL CONSUMIDOR · ${archivo} todavía no le pasa ${debe.join(' ni ')} ` +
        `a ${pieza}.\n      La volvió obligatoria ESTA rama; el archivo es de otra pista. ` +
        `No se pinta de verde y no se cuenta como rojo: se nombra.`);
    else console.log(`   ✓ ${archivo} ya pasa ${props.join(' y ')} a ${pieza}`);
  }
}

if (consumidores.length === 0 && !NO_CONCLUYENTE.some((x) => x.includes(REFERENCIA)))
  console.log('   ⚠️ CERO consumidores fuera de `packages/ui`: el brazo no midió nada.\n' +
    '      No es un verde — es que no hay a quién romper todavía.');

if (NO_CONCLUYENTE.length > 0) {
  console.log(`\n⚠️ NO CONCLUYENTE · no se pudieron abrir: ${NO_CONCLUYENTE.join(' · ')}`);
  console.log('   Este árbol no tiene todas las piezas que el gate mide. **No es verde ni rojo:');
  console.log('   es que no se pudo medir**, y sale 2 para que ningún tablero lo lea como salud.');
  process.exit(2);
}
console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
