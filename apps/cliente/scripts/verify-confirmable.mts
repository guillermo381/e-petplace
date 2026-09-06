/**
 * ⭐ **UNA REGLA, UNA PANTALLA** — el gate de `faltaParaConfirmar`.
 *
 * ── POR QUÉ VIVE EN UN GATE Y NO EN UN RECORRIDO ──────────────────────────
 * El estado que el founder vio —filas que no se pueden guardar— **no se puede
 * producir desde la UI**: la Hoja de edición exige fecha, así que no hay forma
 * de vaciar una. *Una regla que no se puede ejercer desde la pantalla se prueba
 * donde sí se puede.*
 *
 * ── LOS CASOS SON LAS SIETE FILAS DEL CARNET DEL FOUNDER ──────────────────
 * No son inventados: salieron de la respuesta real de la edge (5-sep, medida
 * leyendo el tráfico en web). *Un fixture escrito por el mismo que escribió la
 * regla comparte sus supuestos; uno copiado del papel de alguien, no.*
 *
 * 🔴 **Y LA FILA 5 ES LA QUE CORRIGE A LA MESA.** La orden decía que el cliente
 * agrega «nada hoy» sobre la marca del servidor. **«Nobivac KC» prueba que no**:
 * la edge la leyó BIEN —`dudosa: null`, sin invento— y su fecha es `--06-14`,
 * un día y un mes sin año, que es todo lo que el carnet dice. Para la
 * extracción la fila es correcta, **y lo es**. Pero `fecha_aplicada` es `date`
 * y un `--MM-DD` no entra. *No es una duda de lectura: es un hecho de la
 * columna, y la edge no tiene por qué conocerlo.*
 */
import { faltaParaConfirmar, type FilaConfirmable } from '../src/lib/carnet/confirmable';

type Caso = { que: string; fila: FilaConfirmable; espera: 'nombre' | 'fecha' | null };

const F = (
  nombre: string | null,
  fecha_aplicada: string | null,
  fecha_precision: FilaConfirmable['fecha_precision'],
  dudosa: FilaConfirmable['dudosa'],
): FilaConfirmable => ({ nombre, fecha_aplicada, fecha_precision, dudosa });

const CASOS: Caso[] = [
  /* ── LAS SIETE DEL CARNET REAL ─────────────────────────────────────────── */
  { que: 'fila 0 · «Procyon Dog Pv», fecha completa, la edge no desconfía', fila: F('Procyon Dog Pv', '2023-04-02', 'dia', null), espera: null },
  { que: 'fila 1 · SIN NOMBRE (hay vacuna, el renglón no se lee)', fila: F(null, '2023-04-19', 'dia', null), espera: 'nombre' },
  { que: 'fila 2 · «Recombitek C7», completa', fila: F('Recombitek C7', '2023-05-10', 'dia', null), espera: null },
  { que: 'fila 3 · «Nobivac Lepto», la edge la marcó `incompleta`', fila: F('Nobivac Lepto', null, null, 'incompleta'), espera: 'fecha' },
  { que: 'fila 4 · «Nobivac DHPPi», idem', fila: F('Nobivac DHPPi', null, null, 'incompleta'), espera: 'fecha' },
  { que: '🔴 fila 5 · «Nobivac KC»: la edge NO desconfía y aun así no se puede guardar', fila: F('Nobivac KC', '--06-14', 'sin_anio', null), espera: 'fecha' },
  { que: 'fila 6 · «Canigen LR», completa', fila: F('Canigen LR', '2024-02-08', 'dia', null), espera: null },

  /* ── LOS BORDES QUE EL CARNET NO TRAJO ─────────────────────────────────── */
  { que: 'nombre en blancos: es no tener nombre', fila: F('   ', '2024-01-01', 'dia', null), espera: 'nombre' },
  { que: 'el nombre PRIMERO: sin nombre y sin fecha, se pide el nombre', fila: F(null, null, null, null), espera: 'nombre' },
  { que: '`dudosa: "fecha"` frena aunque la fecha esté completa', fila: F('X', '2024-01-01', 'dia', 'fecha'), espera: 'fecha' },
  { que: 'precisión de MES: el carnet dijo «FEB 2023» y nada más', fila: F('X', '2023-02', 'mes', null), espera: 'fecha' },
];

let malos = 0;
console.log('⭐ verify:confirmable · una regla, una pantalla');
console.log('   casos: las 7 filas del carnet REAL del founder + 4 bordes\n');
for (const c of CASOS) {
  const dio = faltaParaConfirmar(c.fila);
  const ok = dio === c.espera;
  if (!ok) malos += 1;
  console.log(`  ${ok ? 'ok ' : '🔴 '} ${c.que}\n      espera ${String(c.espera)} · dio ${String(dio)}`);
}

/* 🔴 **EL CONTROL QUE PRUEBA QUE EL GATE PUEDE DAR ROJO** (L-459): una regla
   que siempre dijera `null` pasaría los tres casos verdes y este gate lo
   cantaría igual. Si esto no falla, el instrumento no está midiendo. */
const siempreNull = () => null;
const cazaria = CASOS.filter((c) => c.espera !== null && siempreNull() !== c.espera).length;
console.log(`\n  control · una regla que dijera siempre «se puede» fallaría en ${cazaria} de ${CASOS.length} casos`);
if (cazaria === 0) {
  console.log('🔴 NO CONCLUYENTE · ningún caso exige un rechazo: este gate no puede dar rojo.');
  process.exit(2);
}

console.log(`\n${malos === 0 ? '✓ VERDE' : `🔴 ROJO · ${malos} caso(s)`} · ${CASOS.length} casos`);
process.exit(malos === 0 ? 0 : 1);
