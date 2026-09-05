/* Arnés del CARNET (S113-B · lote 1.0) — sus tres rojos, y la regla que los
   ordena: **el carnet AFIRMA, el plan CALCULA, la extracción PROPONE.**
   Importa sólo el módulo puro: `vacunas-estado` no arrastra `react-native`. */
import {
  AVISO_DIAS, detalleVisible, diasEntre, estadoDeVacuna, faltanPorTocar, pideRevision,
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
const HOY = '2026-09-04';

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
t('el pie se enciende sólo con todas', /faltan === 0 && tocadas\.length > 0/.test(CONF), true);
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

console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
