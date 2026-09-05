/**
 * ⭐ **DE QUÉ HABLA CADA FILA DE LA VIDA** (S113-C · 1.1 cierre · ②).
 *
 * Traduce el código de evento al vocabulario de los nueve filtros de B. Vive
 * acá y no en la pantalla porque **es una clasificación, no un render**.
 *
 * ── DE DÓNDE SALIÓ, Y POR QUÉ NO HAY `default` ─────────────────────────────
 * El mapa se armó **midiendo**, no listando lo que parecía:
 *   · `cat_tipos_evento` tiene **64 códigos activos** (5-sep);
 *   · de ésos, `eventos_mascota` sólo tiene **20 con filas**;
 *   · y el timeline **descarta `cita_servicio`** en su propio lector
 *     (`timeline.ts:190`, `.neq('tipo','cita_servicio')` — 376 filas que nunca
 *     llegan) ⇒ **el universo real de la línea de vida son 19**.
 *
 * 🔴 **Sin `default`, y eso es una decisión con consecuencia.** Un `default`
 * mandaría lo desconocido a algún cajón —`salud` es el candidato tentador— y
 * *un evento que cae en la casilla equivocada no se ve como un error: se ve
 * como un dato*. Acá lo no clasificado devuelve `null`: **la fila se sigue
 * dibujando** (no se pierde nada) y simplemente no responde a ningún chip, que
 * es exactamente lo que hoy pasa con los tipos fuera del mapa viejo.
 *
 * ⚠️ Lo que este módulo NO garantiza: que el mapa siga completo mañana. Un
 * código nuevo en el motor entra sin avisar — por eso `CODIGOS_MEDIDOS` queda
 * escrito abajo, para que el día que alguien lo re-mida sepa contra qué se
 * comparó.
 */
import type { TipoLineaDeVida } from '@epetplace/ui';

/** Los 19 que el timeline puede traer hoy, medidos en `eventos_mascota`
 *  (5-sep, con su conteo al lado para que el próximo censo compare). */
export const CODIGOS_MEDIDOS = [
  'hito_narrativo', // 73
  'vacuna_aplicada', // 39
  'atencion_paseo_registrada', // 29
  'foto_guarderia', // 15
  'peso_medicion', // 9
  'atencion_grooming_registrada', // 7
  'historia_clinica_registrada', // 7
  'medicacion_prescrita', // 5
  'alta_asistida_pendiente_creada', // 4
  'bitacora_familia', // 4
  'atencion_adiestramiento_registrada', // 3
  'caso_clinico_abierto', // 3
  'fin_vida', // 2
  'producto_asignacion', // 2
  'examen_diagnostico', // 1
  'alta_asistida_completada_por_cliente', // 1
  'desparasitacion_aplicada', // 1
  'alergia_diagnosticada', // 1
  'transferencia_familia', // 1
] as const;

const MAPA: Readonly<Record<string, TipoLineaDeVida>> = {
  /* SALUD — lo clínico que no tiene chip propio. `medicacion_prescrita` va acá
     y no a un chip suyo: la medicación se lee en su sección del perfil, y un
     décimo filtro para cinco filas no ayuda a nadie. */
  historia_clinica_registrada: 'salud',
  caso_clinico_abierto: 'salud',
  examen_diagnostico: 'salud',
  medicacion_prescrita: 'salud',
  alergia_diagnosticada: 'salud',

  vacuna_aplicada: 'vacunas',
  desparasitacion_aplicada: 'antiparasitario',
  peso_medicion: 'peso',

  atencion_paseo_registrada: 'paseos',
  atencion_grooming_registrada: 'estetica',
  atencion_adiestramiento_registrada: 'adiestramiento',

  /* GUARDERÍA — hoy su única fuente en la línea de vida es la foto del día.
     ⚠️ **Las estadías no tienen código propio en `cat_tipos_evento`**: lo más
     cercano es `incidente_hotel`, que es un incidente y no una estadía. Se
     mapea igual porque **pasó en la guardería**, y mandarlo a «salud» sería
     esconderlo del único chip donde alguien lo buscaría. */
  foto_guarderia: 'guarderia',
  incidente_hotel: 'guarderia',
  incidente_paseo: 'paseos',

  /* RECUERDOS — lo que la familia cuenta y lo que la vida marca.
     `bitacora_familia` cae acá **por decisión de la mesa**: tenía chip propio
     («bitácora») y el vocabulario nuevo no lo tiene. `hito_narrativo` y
     `fin_vida` lo acompañan: son la historia, no un servicio. */
  bitacora_familia: 'recuerdos',
  hito_narrativo: 'recuerdos',
  fin_vida: 'recuerdos',
  inicio_vida: 'recuerdos',
  nota_dueno: 'recuerdos',
  cambio_nombre: 'recuerdos',
  chip_implantado: 'salud',
  esterilizacion: 'salud',
  cirugia_procedimiento: 'salud',
  medicacion_administrada: 'salud',
  condicion_cronica_diagnosticada: 'salud',
  observacion_comportamiento: 'recuerdos',
  cambio_comida: 'recuerdos',
};

/**
 * `null` = **no clasificado**, y la fila se dibuja igual. *Lo desconocido no se
 * esconde en una casilla ajena ni se descarta: se muestra sin chip.*
 */
export function tipoDeLineaDeVida(codigo: string): TipoLineaDeVida | null {
  return MAPA[codigo] ?? null;
}

/** Los que el mapa cubre — para el censo del gate y para poder comparar. */
export const CODIGOS_MAPEADOS = Object.keys(MAPA);
