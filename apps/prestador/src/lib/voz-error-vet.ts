/**
 * D-472 (S73-B, tajada 1: el MOSTRADOR) — la voz del camino triste del
 * path vet sale del riel, no del wrapper.
 *
 * Los wrappers de @epetplace/api devuelven `codigo` tipado + `mensaje`
 * crudo (es-only, la frontera no tiene i18n). Esta frontera única mapea
 * código → key del diccionario POR FAMILIA (el mismo código dice cosas
 * distintas según la acción: 'acceso_denegado' de buscar ≠ de cobrar).
 * Código sin key → FALLBACK al mensaje del wrapper (jamás un error mudo
 * ni una key inventada — Ley 13). Las keys son TIPADAS: una key
 * inexistente acá rompe el typecheck (satisfies).
 *
 * Familias de esta tajada (censo S73-B, 53 mensajes crudos totales):
 * busqueda · alta · atencion · cobro · vacuna · solicitud. Las familias
 * de consulta/presupuesto/oferta llegan en la tajada 2 del lote.
 */
import type { TraductorTipado } from '@epetplace/i18n';

import type { prestadorEs } from '@/i18n/es';

type Traductor = TraductorTipado<typeof prestadorEs>;
type Clave = Parameters<Traductor>[0];

export type FamiliaErrorVet = 'busqueda' | 'alta' | 'atencion' | 'cobro' | 'vacuna' | 'solicitud';

const MAPA = {
  busqueda: {
    email_invalido: 'erroresVet.busqueda.emailInvalido',
    telefono_invalido: 'erroresVet.busqueda.telefonoInvalido',
    acceso_denegado: 'erroresVet.busqueda.accesoDenegado',
    datos_inconsistentes: 'erroresVet.busqueda.datosInconsistentes',
    error_busqueda: 'erroresVet.busqueda.errorBusqueda',
  },
  alta: {
    acceso_denegado: 'erroresVet.alta.accesoDenegado',
    contacto_requerido: 'erroresVet.alta.contactoRequerido',
    nombre_cliente_requerido: 'erroresVet.alta.nombreClienteRequerido',
    nombre_mascota_requerido: 'erroresVet.alta.nombreMascotaRequerido',
    especie_invalida: 'erroresVet.alta.especieInvalida',
    country_invalido: 'erroresVet.alta.countryInvalido',
    cliente_ya_registrado: 'erroresVet.alta.clienteYaRegistrado',
    pendiente_ya_existe: 'erroresVet.alta.pendienteYaExiste',
    datos_inconsistentes: 'erroresVet.alta.datosInconsistentes',
  },
  atencion: {
    acceso_denegado: 'erroresVet.atencion.accesoDenegado',
    prestador_sin_cuenta: 'erroresVet.atencion.prestadorSinCuenta',
    sin_acceso_mascota: 'erroresVet.atencion.sinAccesoMascota',
    tipo_no_medico: 'erroresVet.atencion.tipoNoMedico',
    servicio_no_activo: 'erroresVet.atencion.servicioNoActivo',
    precio_invalido: 'erroresVet.atencion.precioInvalido',
    country_invalido: 'erroresVet.atencion.countryInvalido',
    datos_inconsistentes: 'erroresVet.atencion.datosInconsistentes',
  },
  cobro: {
    acceso_denegado: 'erroresVet.cobro.accesoDenegado',
    cita_no_existe: 'erroresVet.cobro.citaNoExiste',
    no_opera_cuenta: 'erroresVet.cobro.noOperaCuenta',
    monto_invalido: 'erroresVet.cobro.montoInvalido',
    medio_invalido: 'erroresVet.cobro.medioInvalido',
    cobro_ya_registrado: 'erroresVet.cobro.cobroYaRegistrado',
    datos_inconsistentes: 'erroresVet.cobro.datosInconsistentes',
  },
  vacuna: {
    acceso_denegado: 'erroresVet.vacuna.accesoDenegado',
    cita_no_existe: 'erroresVet.vacuna.citaNoExiste',
    sin_acceso_mascota: 'erroresVet.vacuna.sinAccesoMascota',
    vacuna_xor: 'erroresVet.vacuna.vacunaXor',
    vacuna_codigo_invalido: 'erroresVet.vacuna.vacunaCodigoInvalido',
    datos_inconsistentes: 'erroresVet.vacuna.datosInconsistentes',
  },
  solicitud: {
    acceso_denegado: 'erroresVet.solicitud.accesoDenegado',
    no_opera_cuenta: 'erroresVet.solicitud.noOperaCuenta',
    cuenta_no_activa: 'erroresVet.solicitud.cuentaNoActiva',
    mascota_requerida: 'erroresVet.solicitud.mascotaRequerida',
    mascota_no_existe: 'erroresVet.solicitud.mascotaNoExiste',
    destino_requerido: 'erroresVet.solicitud.destinoRequerido',
    payload_alta_invalido: 'erroresVet.solicitud.payloadAltaInvalido',
    solicitud_duplicada: 'erroresVet.solicitud.solicitudDuplicada',
    datos_invalidos: 'erroresVet.solicitud.datosInvalidos',
  },
} as const satisfies Record<FamiliaErrorVet, Record<string, Clave>>;

/** La voz del error de un wrapper vet: key del riel por código, o el
 *  mensaje del wrapper como fallback honesto (código sin key). */
export function vozErrorVet(
  t: Traductor,
  familia: FamiliaErrorVet,
  r: { codigo?: string; mensaje: string },
): string {
  const familia_ = MAPA[familia] as Partial<Record<string, Clave>>;
  const clave = r.codigo !== undefined ? familia_[r.codigo] : undefined;
  return clave !== undefined ? t(clave) : r.mensaje;
}
