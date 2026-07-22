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
 * Tajada 1 (censo S73-B, 53 mensajes crudos totales): busqueda · alta ·
 * atencion · cobro · vacuna · solicitud (el mostrador). Tajada 2:
 * estructurar · sedimento · presupuesto · citaVet · oferta (el Durante
 * clínico, el presupuesto y el taller). Fuera del lote B:
 * veterinaria-reserva (cliente, territorio A).
 */
import type { TraductorTipado } from '@epetplace/i18n';

import type { prestadorEs } from '@/i18n/es';

type Traductor = TraductorTipado<typeof prestadorEs>;
type Clave = Parameters<Traductor>[0];

export type FamiliaErrorVet =
  | 'busqueda'
  | 'alta'
  | 'atencion'
  | 'cobro'
  | 'vacuna'
  | 'solicitud'
  | 'estructurar'
  | 'sedimento'
  | 'presupuesto'
  | 'citaVet'
  | 'oferta';

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
  estructurar: {
    entrada_invalida: 'erroresVet.estructurar.entradaInvalida',
    configuracion_faltante: 'erroresVet.estructurar.configuracionFaltante',
    error_modelo: 'erroresVet.estructurar.errorModelo',
    estructuracion_fallida: 'erroresVet.estructurar.estructuracionFallida',
    datos_inconsistentes: 'erroresVet.estructurar.datosInconsistentes',
  },
  sedimento: {
    acceso_denegado: 'erroresVet.sedimento.accesoDenegado',
    no_opera_cuenta: 'erroresVet.sedimento.noOperaCuenta',
    sin_acceso_mascota: 'erroresVet.sedimento.sinAccesoMascota',
    cita_requerida: 'erroresVet.sedimento.citaRequerida',
    hc_ya_existe: 'erroresVet.sedimento.hcYaExiste',
    nota_sin_motivo: 'erroresVet.sedimento.notaSinMotivo',
    nota_sin_diagnostico: 'erroresVet.sedimento.notaSinDiagnostico',
    cuenta_sin_prestador: 'erroresVet.sedimento.cuentaSinPrestador',
    posologia_incompleta: 'erroresVet.sedimento.posologiaIncompleta',
    medicamento_sin_nombre: 'erroresVet.sedimento.medicamentoSinNombre',
    condicion_sin_nombre: 'erroresVet.sedimento.condicionSinNombre',
    alergia_sin_alergeno: 'erroresVet.sedimento.alergiaSinAlergeno',
    alergia_sin_severidad: 'erroresVet.sedimento.alergiaSinSeveridad',
    condicion_requerida: 'erroresVet.sedimento.condicionRequerida',
    no_es_tratante: 'erroresVet.sedimento.noEsTratante',
    datos_invalidos: 'erroresVet.sedimento.datosInvalidos',
  },
  presupuesto: {
    acceso_denegado: 'erroresVet.presupuesto.accesoDenegado',
    no_opera_cuenta: 'erroresVet.presupuesto.noOperaCuenta',
    sin_acceso_mascota: 'erroresVet.presupuesto.sinAccesoMascota',
    country_invalido: 'erroresVet.presupuesto.countryInvalido',
    presupuesto_no_existe: 'erroresVet.presupuesto.presupuestoNoExiste',
    presupuesto_no_es_borrador: 'erroresVet.presupuesto.presupuestoNoEsBorrador',
    vence_en_requerido: 'erroresVet.presupuesto.venceEnRequerido',
    vence_en_pasada: 'erroresVet.presupuesto.venceEnPasada',
    presupuesto_sin_items: 'erroresVet.presupuesto.presupuestoSinItems',
    no_es_familia: 'erroresVet.presupuesto.noEsFamilia',
    presupuesto_no_enviado: 'erroresVet.presupuesto.presupuestoNoEnviado',
    presupuesto_vencido: 'erroresVet.presupuesto.presupuestoVencido',
    presupuesto_no_editable: 'erroresVet.presupuesto.presupuestoNoEditable',
    cita_no_encontrada: 'erroresVet.presupuesto.citaNoEncontrada',
    cita_no_es_de_presupuesto: 'erroresVet.presupuesto.citaNoEsDePresupuesto',
    cita_ya_fijada: 'erroresVet.presupuesto.citaYaFijada',
    presupuesto_no_aprobado: 'erroresVet.presupuesto.presupuestoNoAprobado',
    empleado_no_es_de_cuenta: 'erroresVet.presupuesto.empleadoNoEsDeCuenta',
    slot_invalido: 'erroresVet.presupuesto.slotInvalido',
    slot_en_pasado: 'erroresVet.presupuesto.slotEnPasado',
    slot_ocupado: 'erroresVet.presupuesto.slotOcupado',
    datos_invalidos: 'erroresVet.presupuesto.datosInvalidos',
  },
  citaVet: {
    cita_no_encontrada: 'erroresVet.citaVet.citaNoEncontrada',
    datos_inconsistentes: 'erroresVet.citaVet.datosInconsistentes',
  },
  oferta: {
    sin_datos: 'erroresVet.oferta.sinDatos',
    no_encontrada: 'erroresVet.oferta.noEncontrada',
    verificacion_profesional_pendiente: 'erroresVet.oferta.verificacionProfesionalPendiente',
    especialidad_invalida: 'erroresVet.oferta.especialidadInvalida',
    duracion_invalida: 'erroresVet.oferta.duracionInvalida',
    datos_inconsistentes: 'erroresVet.oferta.datosInconsistentes',
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
