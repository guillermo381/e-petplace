// Asserts imperativos del criterio de las tres voces (S51-B2.2,
// criterio v1 gateado por founder). Corre el .ts real vía tsx.
import { calcularVozHogar } from '../packages/domain/src/vozHogar.ts';

const hoy = new Date('2026-07-10T12:00:00');
const base = {
  tieneEmergenciaActiva: false,
  vacunasTotal: 0,
  ultimaVacunaAplicada: null,
  proximaVacuna: null,
  ultimaAtencionCerrada: null,
};

const casos = [
  ['emergencia gana a todo', { ...base, tieneEmergenciaActiva: true, vacunasTotal: 5, ultimaVacunaAplicada: '2026-07-01' }, { voz: 'pideAtencion', causa: 'emergencia' }],
  ['vacuna por vencer (≤14d)', { ...base, vacunasTotal: 3, proximaVacuna: { nombre: 'antirrábica', fecha: '2026-07-20' } }, { voz: 'pideAtencion', causa: 'vacunaVence', dias: 10 }],
  ['vacuna vencida', { ...base, vacunasTotal: 3, proximaVacuna: { nombre: 'séxtuple', fecha: '2026-07-01' } }, { voz: 'pideAtencion', causa: 'vacunaVencida', dias: 9 }],
  ['vacuna lejana NO dispara', { ...base, vacunasTotal: 3, ultimaVacunaAplicada: '2026-07-01', proximaVacuna: { nombre: 'x', fecha: '2027-07-01' } }, { voz: 'alDia' }],
  ['expediente ralo (0 vacunas)', base, { voz: 'conociendolo', causa: 'expedienteRalo' }],
  ['al día por vacuna reciente', { ...base, vacunasTotal: 8, ultimaVacunaAplicada: '2025-09-01' }, { voz: 'alDia' }],
  ['al día por atención cerrada reciente (el caso Zeus demo)', { ...base, vacunasTotal: 7, ultimaVacunaAplicada: '2024-07-06', ultimaAtencionCerrada: '2026-07-07T04:14:13Z' }, { voz: 'alDia' }],
  ['expediente quieto (el caso Thor real: carnet 2024, nada más)', { ...base, vacunasTotal: 8, ultimaVacunaAplicada: '2024-07-06' }, { voz: 'conociendolo', causa: 'expedienteQuieto' }],
  ['borde ventana: 12 meses justos cuenta', { ...base, vacunasTotal: 1, ultimaVacunaAplicada: '2025-07-10' }, { voz: 'alDia' }],
];

let fallos = 0;
for (const [nombre, senales, esperado] of casos) {
  const r = calcularVozHogar(senales, hoy);
  const ok = Object.entries(esperado).every(([k, v]) => r[k] === v);
  console.log(`${ok ? '✓' : '✗ FALLO'} ${nombre} → ${JSON.stringify(r)}`);
  if (!ok) fallos++;
}
console.log(fallos === 0 ? '\nVOZ HOGAR: 9/9' : `\nFALLOS: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
