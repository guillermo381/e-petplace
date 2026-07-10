// @epetplace/domain — helpers puros (sin dependencias de UI ni de Supabase).
// Los helpers heredables (periodo.ts, validaciones, paises/servicios)
// migran acá cuando el flujo que los usa se construya (ESTRATEGIA_2026H2.md Sección 10).

export {
  calcularVozHogar,
  DIAS_AVISO_VACUNA,
  VENTANA_RECENCIA_MESES,
  type SenalesMascota,
  type VozEstadoHogar,
} from './vozHogar';

export {
  calcularMomentoVital,
  edadEnMeses,
  type MomentoVital,
  type UmbralesMomentoVital,
} from './momentoVital';
