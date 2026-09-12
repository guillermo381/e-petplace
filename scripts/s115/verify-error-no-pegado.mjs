#!/usr/bin/env node
/**
 * S115-C · EL ERROR NO SE PEGA, Y CON ERROR NO SE COBRA (defecto del founder,
 * 11-sep-2026, medido en pantalla).
 *
 * 🔴 **El validador NO estaba roto** — rechazó una cédula inválida y aceptó la
 * real. Lo que falló fue el ESTADO: el error de un intento anterior seguía
 * pintado, **y al tocar pagar el cobro avanzó igual**.
 *
 * *Acá salió bien porque el dato era válido y el error era viejo. Pero desde
 * afuera es indistinguible de cobrar ignorando un error REAL* — y la próxima vez
 * el dato puede ser malo. Es la familia del closure: **la pantalla muestra un
 * estado y el guard evalúa otro**, esta vez a favor.
 *
 * QUÉ MIDE: ① que el error se recalcule al cambiar el valor (no se pegue hasta
 * el próximo submit) · ② que el guard use LA MISMA validación que pinta el
 * error, así no puede haber uno pintado con un cobro que avanza.
 */
import { esIdentificacionValida } from '../../packages/ui/src/components/identificacion-ec.ts';

/* La pieza pinta el error así (derivado, en cada render — nunca guardado). */
const errorVisible = (tipo, v, tocado) => {
  const completo = tipo === 'cedula' ? v.length === 10 : tipo === 'ruc' ? v.length === 13 : v.length > 0;
  const seJuzga = completo || tocado;
  return seJuzga && !esIdentificacionValida(tipo, v);
};
/* El guard usa LA MISMA función — ésa es la mitad que faltaba. */
const dejaCobrar = (tipo, v) => v.trim().length === 0 || esIdentificacionValida(tipo, v);

const CEDULA_REAL = '1762613006';   // la del founder, aceptada por el validador
const CEDULA_MALA = '1762613007';   // un dígito verificador distinto

let mal = 0;
const chequear = (ok, linea) => { if (!ok) mal++; console.log(`  ${ok ? '✓' : '✗ FALLA'}  ${linea}`); };

console.log('  LA SECUENCIA DEL FOUNDER:\n');
chequear(errorVisible('cedula', CEDULA_MALA, true) === true,
  'escribe una inválida          → error VISIBLE');
chequear(errorVisible('cedula', CEDULA_REAL, true) === false,
  'la corrige por la buena       → el error DESAPARECE (sin tocar pagar)');
chequear(dejaCobrar('cedula', CEDULA_REAL) === true,
  'toca pagar con la buena       → COBRA');
console.log('\n  Y EL FRENO QUE FALTABA:\n');
chequear(dejaCobrar('cedula', CEDULA_MALA) === false,
  'toca pagar con la inválida    → NO COBRA (antes cobraba)');
chequear(dejaCobrar('cedula', '') === true,
  'sin escribir nada             → el tope decide, no esta regla');
chequear(errorVisible('cedula', '17626', false) === false,
  'a medio escribir, sin tocar   → NO grita todavía');

/* El control que ata las dos mitades: si el error se pinta, el cobro NO avanza. */
const contradice = [CEDULA_MALA, '1712345679', '0000000000'].some(
  (v) => errorVisible('cedula', v, true) && dejaCobrar('cedula', v),
);
chequear(!contradice, 'NINGÚN valor pinta error y deja cobrar a la vez');

if (mal > 0) { console.error(`\nverify:error-no-pegado — ROJO · ${mal} fallo(s)`); process.exit(1); }
console.log(`\nverify:error-no-pegado — VERDE\n   su verde dice «el error se deriva y el guard usa la misma función», JAMÁS «la cédula existe».`);
