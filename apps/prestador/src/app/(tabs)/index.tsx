// ─────────────────────────────────────────────────────────────────────
// HOY — la jornada (S51-B3.2, DISEÑO_EXPERIENCIA §13, sobre la Agenda
// E2E de S44 que se RECOLOCA sin reescribirse). Dosis BAJA (Ley 4/test
// 7): un acento de capa, CTA en tinta, cero gradiente.
//
// Las 4 zonas:
//   Zona 1 — ahora / lo siguiente: la atención en_curso (CitaEnVivo,
//     Ley 7) o la PRÓXIMA cita, presidiendo, con su "Antes" a un tap
//     (Conocer a {mascota} → vista prestador del expediente) y la
//     señal "Primera vez" cuando es real.
//   Zona 2 — el día: el resto de la agenda compacta. Desde S57-B1 el
//     lugar hecho D-317 está OCUPADO: segmento Hoy/Semana — la semana
//     son los próximos 7 días con citas FIRMES (mismo filtro positivo),
//     las del plan marcadas, y los días de vacaciones visibles como
//     bloqueados (prestador_bloqueos, solo lectura honesta).
//   Zona 3 — novedades que piden algo: cancelaciones/reagendas del
//     dueño son B5 y los mensajes bidireccionales no existen → HUECO
//     estructural (tipo + comentario), null honesto, cero card.
//   Zona 4 — tu trabajo con dignidad: liquidaciones son B2 y el motor
//     de hitos de trayectoria no existe (nace con el motor B4) → la
//     zona NO existe. JAMÁS métricas en cero (§2.6 del alma).
//
// VERDAD FIRME (test 8): el filtro positivo vive en la puerta única
// (obtenerCitasPaseoDelDia — solo confirmada/en_curso/completada/
// no_show; 'pendiente' y el futuro bloqueo temporal jamás se pintan).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  FilaCita as FilaCitaUi,
  CeldaNavegacion,
  CitaEnVivo,
  SelectorDia,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Insignia,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  TresNumeros,
  spacing,
  typography,
  useTheme,
  type AvatarMascotaEspecie,
  type ColumnaTecho,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  obtenerBloqueosPrestador,
  obtenerCitasAdiestramientoDelDia,
  obtenerDiasCerrados,
  obtenerCitasGroomingDelDia,
  obtenerCitasPaseoDelDia,
  obtenerCitasVetDelDia,
  obtenerCitasPorCoordinar,
  empleadoTieneRol,
  obtenerEquipoNegocio,
  obtenerFranjasHorario,
  obtenerMascotasAtendidas,
  obtenerMiCuentaComercial,
  obtenerMiPerfil,
  obtenerChipsEmpleado,
  obtenerMiEmpleadoId,
  obtenerMiPrestador,
  obtenerTitularId,
  obtenerMundoVeterinariaPropio,
  obtenerAtencionesAbiertas,
  obtenerPlataDelDia,
  obtenerPresupuestosPrestador,
  obtenerSolicitudesMostrador,
  type PlataDelDia,
  obtenerOfertaAdiestramientoPropia,
  obtenerOfertasGroomingPropias,
  obtenerOfertasPaseoPropias,
  resolverUrlLogoNegocio,
  resolverUrlsFotos,
  type BloqueoPrestador,
  type CitaAgendaPaseo,
  type CitaPorCoordinar,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { vozCitaVet } from '@/lib/voz-cita-vet';
import { vozOficio } from '@/lib/voz-oficio';
import { duracionCorta, montoCorto } from '@/lib/formato-techo';
import { TechoOficio, VeloBarraEstadoOficio } from '@/components/techo-oficio';
import { AgendaRecepcion } from '@/components/agenda-recepcion';
import { FiltroOficio, type FiltroOficioValor } from '@/components/filtro-oficio';
import { FirmaPrestador } from '@/components/firma-prestador';
import { PreparaEspacio, type EstadoTareas } from '@/components/prepara-espacio';
import { SeccionDesplegable } from '@/components/perfil-piezas';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  // S78-B — LA PRIMERA COMPOSICIÓN POR ROL (D-521): el HOY de quien es
  // RECEPCIÓN (miembro activo, no titular, CERO chips — la definición
  // por AUSENCIA de la letra §1) es LA PUERTA, no la jornada de oficio.
  | { estado: 'recepcion'; prestadorId: string; cuentaComercialId: string | null; titularId: string | null }
  | {
      estado: 'listo';
      /* ⭐ S86-C · `desde` y `hoy` SE SEPARAN, y es la cura que habilita el
         resto. Hasta acá `desde` hacía DOS trabajos —el inicio del rango del
         fetch **y** "hoy"— y mientras los dos coincidían nadie lo notaba.
         Con la rueda llegando a hoy-3 dejan de coincidir, y `vistaEsHoy` se
         habría roto EN SILENCIO: el hero del vivo montándose tres días atrás.
         *No es un rename: es que dos conceptos distintos compartían nombre.* */
      /** Inicio del rango del fetch = hoy − 3. NO es "hoy". */
      desde: string;
      /** HOY, fecha local del dispositivo. La única verdad de "ahora". */
      hoy: string;
      /** S86-C: para releer la plata cuando cambia el día en vista. */
      prestadorId: string;
      /** El rango completo hoy−3..hoy+6 (la vista filtra por el día elegido). */
      citas: CitaAgendaPaseo[];
      /** ids de las citas de GROOMING (S60-B1) — deciden la RUTA del tap. */
      groomingIds: Set<string>;
      /** S63-B: ids de las citas de ADIESTRAMIENTO — misma mecánica. */
      adiestramientoIds: Set<string>;
      /** S69-B (M0): ids de las citas de VETERINARIA — cuarto oficio. */
      vetIds: Set<string>;
      bloqueos: BloqueoPrestador[];
      atendidas: Set<string>;
      /** S61-B5: oficios con oferta ACTIVA — con ≥2 nace el filtro del
       *  día. Si el fetch de ofertas falla, el control no existe: es
       *  azúcar de vista, jamás esconde citas (las citas tienen su
       *  propio camino de error, Ley 13 intacta). */
      oficios: { paseo: boolean; grooming: boolean; adiestramiento: boolean; vet: boolean };
      /** S70-B2-v2: la bandeja "Por coordinar" — citas de presupuesto
       *  aprobado sin fecha (D-439). Vacía para negocios no-vet. */
      porCoordinar: CitaPorCoordinar[];
      /** S71-B1: la persona y el negocio del techo. `nombre` es null
       *  honesto si el perfil no lo trae — el saludo va SOLO, jamás
       *  inventado (E5). */
      nombre: string | null;
      nombreComercial: string;
      /** S79-B (T2-B1/B3): la identidad de la firma del modo preparación. */
      ciudad: string | null;
      logoPath: string | null;
      /** S79-B (T2-B1): el estado de las tareas del modo preparación.
       *  null = el espacio YA está preparado (servicios+horarios) — el
       *  módulo entero NO existe (regla de existencia del boceto M1). */
      preparacion: EstadoTareas | null;
      /* ⏪ S86-C · `plata` SALIÓ DE ACÁ y vive en su propio estado, con el DÍA
         que le corresponde. Vivía en `pantalla` porque se leía UNA vez, con el
         fetch; ahora se relee cada vez que cambia el día en vista, y guardarla
         acá obligaría a re-armar el estado entero por un solo campo — y, peor,
         dejaría el valor viejo visible con el día nuevo durante la relectura.
         Su nota de L-197 (fallo ≠ permiso negado) viaja con ella. */
      /* S85-C30 · «Necesita tu atención». Cada fuente trae su CONTEO, y
         `null` = no se pudo leer — distinto de 0, que es "no hay nada que
         atender". Colapsarlos diría "estás al día" por un fallo de red
         (L-197, y sobre trabajo pendiente eso cuesta plata). */
      atencion: { coordinar: number; presupuestos: number | null; handshakes: number | null; abiertas: number | null; abiertaCitaId: string | null };
      /** S85-C23: la cohorte del negocio, en CÓDIGO. La voz la arma la
       *  PIEZA (`Insignia`, contrato de B en vuelo) — la casa NO compone
       *  la frase. Viajan crudos y esperan su línea. */
      /* La UNIÓN, no `string`: la escribí como `string` en C23 —cuando el
         wrapper todavía era ancho— y quedó vieja el día que A la estrechó
         (A38). Un tipo más ancho que su fuente no falla: solo deja de
         avisar. */
      cohorte: 'fundador' | 'pionero' | null;
      cohorteAnio: number | null;
    };

/**
 * ⭐ S85-C23 — LOS TRES NÚMEROS DEL TECHO (`PORTAL_PRESTADOR` §2.4bis).
 *
 * **CARGA · PLATA · VIDAS**, siempre los tres, siempre en ese orden. El
 * esqueleto no cambia entre oficios; **la UNIDAD sí**, y habla el idioma
 * del oficio en vez del idioma del motor.
 *
 * ── LA REGLA DE LA UNIDAD (firmada por la mesa, 3-ago) ───────────────
 * **UN oficio** → la unidad de su fila en la tabla de §2.4bis.
 * **DOS O MÁS** → unidad genérica: `citas` y `mascotas`.
 * **EXCEPCIÓN — si PASEO está entre los activos, CARGA sigue siendo
 * TIEMPO.** No por deferencia al paseo: porque **el tiempo es la única
 * unidad que SUMA BIEN al mezclar**. Un paseo de 3 h y una consulta de
 * 20 min son 3 h 20 m de jornada, y eso es cierto en cualquier
 * combinación; *"4 citas" con un paseo de tres horas adentro* es
 * exactamente el error que §2.4bis argumenta (*dos salidas de tres horas
 * y seis de veinte minutos dan el mismo 6 y son jornadas distintas*).
 * **El conteo es la simplificación aceptable; el tiempo es la unidad
 * honesta — donde el tiempo está disponible, gana.**
 *
 * VIDAS no lleva excepción: multi-oficio cuenta **mascotas**. *Perder la
 * distinción de familias es barato; perder la jornada real no.*
 *
 * ── POR QUÉ SE COMPUTA DEL DÍA SIN FILTRAR ───────────────────────────
 * De `citasHoySin`, nunca de la lista filtrada: **el filtro por oficio
 * JAMÁS miente el conteo del techo** (guard estructural S61-B12, la
 * misma regla que ya protege a la forma del día).
 *
 * ── VIDAS: DISTINTAS, NO FILAS ───────────────────────────────────────
 * Tres perros de la misma casa son **UN tutor**; dos citas de la misma
 * mascota son **UNA mascota**. Contar filas daría un número más alto,
 * plausible y falso — la clase de defecto que no rompe nada.
 * Una cita sin mascota legible **no suma y no inventa**: no hay un
 * "desconocido" que contar.
 */
type UnidadCarga = 'tiempo' | 'citas' | 'turnos' | 'consultas' | 'sesiones';
type UnidadVidas = 'tutores' | 'pacientes' | 'mascotas' | 'alumnos';

function unidadesDelTecho(oficios: {
  paseo: boolean;
  grooming: boolean;
  adiestramiento: boolean;
  vet: boolean;
}): { carga: UnidadCarga; vidas: UnidadVidas } {
  const activos = [oficios.paseo, oficios.grooming, oficios.adiestramiento, oficios.vet].filter(Boolean).length;
  // LA EXCEPCIÓN va PRIMERO: con paseo entre los activos el tiempo gana,
  // haya uno o cuatro oficios. Ponerla después del conteo la volvería
  // inalcanzable para el caso que existe para cubrir.
  if (oficios.paseo) return { carga: 'tiempo', vidas: activos > 1 ? 'mascotas' : 'tutores' };
  if (activos > 1) return { carga: 'citas', vidas: 'mascotas' };
  if (oficios.vet) return { carga: 'consultas', vidas: 'pacientes' };
  if (oficios.adiestramiento) return { carga: 'sesiones', vidas: 'alumnos' };
  // grooming, o CERO oficios activos: el bloque no se monta sin citas, y
  // sin oficios tampoco hay citas. 'turnos' es el único resto posible.
  return { carga: 'turnos', vidas: 'mascotas' };
}

/** Minutos de la jornada. El snapshot de la cita manda (`duracion_minutos`
 *  es la duración REAL vendida); el default del catálogo es el respaldo
 *  para filas viejas. Cero honesto si ninguno de los dos existe — jamás
 *  un promedio inventado. */
function minutosDeJornada(citas: CitaAgendaPaseo[]): number {
  return citas.reduce((m, c) => m + (c.duracion_minutos ?? c.tipo.duracion_default_minutos ?? 0), 0);
}

/** El oficio de una fila — decide ruta, ícono y filtro. */
type OficioCita = 'paseo' | 'grooming' | 'adiestramiento' | 'vet';

// ═══════════ ZONA 3 — NOVEDADES (hueco estructural) ═══════════
// Cancelaciones/reagendas del dueño llegan con B5; los mensajes de
// familia, con el canal interno. Cuando existan, esta pantalla recibe
// valores de este tipo y la zona se renderiza entre Zona 2 y el pie.
// Hasta entonces: null honesto — cero card, cero relleno.
type NovedadZona3 = { tipo: 'cancelacion' | 'reagenda' | 'mensaje'; citaId: string } | null;
const novedadesZona3: NovedadZona3 = null;
// ═══════════════════════════════════════════════════════════════

/* ⭐ S86-C · EL RANGO DE LA RUEDA (firma ① del founder: «hasta 3 días hacia
   atrás»). Los DOS lados en constantes y no en literales sueltos: el rango
   se usa en el fetch, en la rueda y en el cómputo de `dias`, y tres números
   sueltos se desincronizan en cuanto uno cambie.
   ⚠️ Medido antes de construir: los CUATRO lectores de citas usan rango
   inclusivo puro (`.gte(fecha).lte(fecha_hasta)`) **sin clamp a hoy**, y
   `obtener_plata_del_dia` filtra por `c.fecha = p_fecha` sin tope superior
   ni inferior. El pasado no necesitó nada del motor. */
const DIAS_ATRAS = 3;
const DIAS_ADELANTE = 6;

// Fecha local del dispositivo, YYYY-MM-DD (en-CA da ese formato).
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

// Suma días en fecha LOCAL por partes literales (jamás Date(iso) directo
// ni toISOString — D-312 / hallazgo S55: corren el día en UTC-5).
function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-CA').format(new Date(a ?? 0, (m ?? 1) - 1, (d ?? 1) + dias));
}

// ¿El día cae dentro de algún bloqueo? (rango INCLUSIVE ambos extremos,
// granularidad día — la semántica de prestador_bloqueos, S56 D-341).
function diaBloqueado(iso: string, bloqueos: BloqueoPrestador[]): boolean {
  return bloqueos.some((b) => b.fechaInicio <= iso && iso <= b.fechaFin);
}

// El "estado efectivo" de la fila: prioridad a la atención (en_curso lo
// maneja aparte con CitaEnVivo; el resto va a Insignia).
function estadoEfectivo(cita: CitaAgendaPaseo): string | null {
  return cita.atencion?.estado ?? cita.estado;
}

// ═══════════ S71-B1 — LA FORMA DEL DÍA (la firma del techo) ═══════════
// El dato que CUENTA HACIA ATRÁS: se descuenta solo a medida que la
// jornada avanza. Firma de COMPORTAMIENTO (Ley 15, lado prestador):
// cero acento nuevo, cero componente nuevo, cero color.
//
// Se computa de `citasHoySin` — el día SIN filtrar (guard estructural
// S61-B12): el filtro por oficio JAMÁS miente el conteo del techo.
//
// Descriptor puro → la pantalla lo traduce. Así los 10 estados se leen
// de un vistazo y el copy vive entero en el riel i18n.
type FormaDelDia =
  | { clave: 'omitida' }
  | { clave: 'quedan'; n: number; hora: string }
  | { clave: 'queda1'; hora: string }
  | { clave: 'quedanSinHora'; n: number }
  | { clave: 'queda1SinHora' }
  | { clave: 'completa' }
  | { clave: 'porCoordinar'; n: number }
  | { clave: 'libreConSemana'; n: number }
  /* ⭐ S86-C · LAS DOS VOCES DEL PASADO (cruce 2). Un día vencido no promete:
     lo que quedó sin cerrar **es plata sin devengar** (el devengo nace al
     cerrar con calidad), y cada una es puerta a su cita — las filas de la
     Zona 2 ya navegan ahí, así que la voz nombra y la lista lleva. */
  | { clave: 'pasadoPendientes'; n: number }
  | { clave: 'pasadoCerrado'; n: number }


/**
 * La hora de cierre — E1/E2/E3 de la vara cruzada.
 *
 * E1: sale de la última cita PENDIENTE (jamás la última del día: el
 *     prestador que termina 16:00 no puede leer "terminas 18:30" — L-139),
 *     por MÁXIMO EXPLÍCITO sobre `hora` (jamás `.at(-1)`: el orden de la
 *     lista no está garantizado por contrato). Las citas con `hora` null
 *     se excluyen de ESTE cómputo (siguen contando en la cantidad).
 * E3: la duración es LA DE ESA última pendiente — si esa no la trae, se
 *     omite la hora aunque las demás sí la tengan (no all-or-nothing).
 * E2: si hora+duración cruza las 24:00, se omite — jamás una hora que miente.
 */
function horaDeCierre(pendientes: CitaAgendaPaseo[]): string | null {
  const conHora = pendientes.filter((c) => c.hora !== null && c.hora !== '');
  if (conHora.length === 0) return null;
  const ultima = conHora.reduce((a, b) => ((b.hora ?? '') > (a.hora ?? '') ? b : a));
  const dur = ultima.duracion_minutos;
  if (!dur) return null;
  const [h, m] = ultima.hora!.slice(0, 5).split(':').map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + dur;
  if (total >= 24 * 60) return null;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formaDelDia(args: {
  /** El día SIN filtrar (guard S61-B12). */
  citasHoySin: CitaAgendaPaseo[];
  /** Todo el rango hoy..hoy+6, sin filtrar. */
  citasRango: CitaAgendaPaseo[];
  esAtendida: (c: CitaAgendaPaseo) => boolean;
  /** D-439 — ya en memoria; "Jornada completa." lo exige en cero (E4). */
  porCoordinar: number;
  /** S86-C: ¿el día en vista ya pasó? Decide TIEMPO VERBAL, nada más. */
  esPasado: boolean;
}): FormaDelDia {
  /* ⚠️ `citasRango` SOBREVIVE a la muerte de la vista Semana, y por poco
     no lo hace: alimenta la voz `libreConSemana` del TECHO ("hoy libre,
     pero la semana tiene N"), que es OTRA cosa que la vista. Retirarlo
     con ella habría matado una voz viva por asociación de nombre. */
  const { citasHoySin, citasRango, esAtendida, porCoordinar, esPasado } = args;

  // E6(b), declarado: `en_curso` NO está en `esAtendida` — la cita que
  // corre SUMA a "Te quedan". No terminó.
  const pendientes = citasHoySin.filter((c) => !esAtendida(c));

  /* ⭐ S86-C · EL PASADO SE RESUELVE PRIMERO Y SALE. Va antes que todo lo
     demás porque las ramas de abajo están escritas en futuro ("Te quedan",
     "terminas", "Hoy libre") y sobre un día vencido **todas mienten**.
     ⚠️ Y el día pasado SIN citas no dice nada: `omitida`. La rama
     `libreConSemana` diría *"Hoy libre"* sobre un día que no es hoy, y la
     regla de siempre —jamás una métrica en cero— también aplica al ayer. */
  if (esPasado) {
    if (pendientes.length > 0) return { clave: 'pasadoPendientes', n: pendientes.length };
    if (citasHoySin.length > 0) return { clave: 'pasadoCerrado', n: citasHoySin.length };
    return { clave: 'omitida' };
  }

  if (pendientes.length > 0) {
    const hora = horaDeCierre(pendientes);
    if (hora === null) {
      return pendientes.length === 1 ? { clave: 'queda1SinHora' } : { clave: 'quedanSinHora', n: pendientes.length };
    }
    return pendientes.length === 1 ? { clave: 'queda1', hora } : { clave: 'quedan', n: pendientes.length, hora };
  }

  // Sin pendientes, pero HUBO jornada: el día se cerró.
  if (citasHoySin.length > 0) {
    // E4: "Jornada completa." solo si NO queda nada por coordinar.
    return porCoordinar > 0 ? { clave: 'porCoordinar', n: porCoordinar } : { clave: 'completa' };
  }

  // Día sin citas: vacío ≠ negocio muerto (§15b) — si la semana tiene, se dice.
  const semana = citasRango.length;
  if (semana > 0) return { clave: 'libreConSemana', n: semana };

  // 0 en todo el rango → la línea se omite. JAMÁS "0 citas" (métrica en cero).
  return { clave: 'omitida' };
}
// ═══════════════════════════════════════════════════════════════════════

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

// Estado de cita → Insignia (compartido por FilaCita y FilaSalida —
// en_curso viste 'info'; CitaEnVivo porta el canal del vivo destacado;
// verdad firme: solo estados que la puerta única deja pasar).
function useInsigniasEstado(): Record<string, { estado: InsigniaEstado; etiqueta: string }> {
  const { t } = useTraduccion();
  return {
    en_curso: { estado: 'info', etiqueta: t('agenda.enCurso') },
    terminada: { estado: 'proximo', etiqueta: t('agenda.estadoPorCerrar') },
    cerrada_con_calidad: { estado: 'alDia', etiqueta: t('agenda.estadoCerrado') },
    confirmada: { estado: 'info', etiqueta: t('agenda.estadoConfirmada') },
    completada: { estado: 'alDia', etiqueta: t('agenda.estadoCompletada') },
    no_show: { estado: 'atencion', etiqueta: t('agenda.estadoNoShow') },
  };
}

// ═══════════ D-385 — LA SALIDA GRUPAL (S62) ═══════════
// La unidad de trabajo del paseador es la SALIDA, no la cita: N citas
// de paseo del MISMO bloque (fecha + hora + duración) se pintan como
// UNA fila con N mascotas, expandible a sus citas (acordeón inline,
// precedente Hogar S61-A11). El grooming JAMÁS agrupa (una silla, una
// mascota) y el EN VIVO del dueño no se toca — la agrupación es del
// lado oficio, solo vista.
type ItemJornada =
  | { tipo: 'cita'; cita: CitaAgendaPaseo }
  | { tipo: 'salida'; clave: string; citas: CitaAgendaPaseo[] };

function claveBloque(c: CitaAgendaPaseo): string | null {
  if (!c.fecha || !c.hora) return null;
  return `${c.fecha}|${c.hora}|${c.duracion_minutos ?? ''}`;
}

// S63-B: reciben el set de citas que JAMÁS agrupan (grooming = una
// silla · adiestramiento = una sesión); solo el paseo hace salidas.
function agruparSalidas(citas: CitaAgendaPaseo[], sinAgrupar: Set<string>): ItemJornada[] {
  const items: ItemJornada[] = [];
  const porClave = new Map<string, { tipo: 'salida'; clave: string; citas: CitaAgendaPaseo[] }>();
  for (const c of citas) {
    const clave = sinAgrupar.has(c.id) ? null : claveBloque(c);
    if (clave === null) {
      items.push({ tipo: 'cita', cita: c });
      continue;
    }
    const grupo = porClave.get(clave);
    if (grupo) {
      grupo.citas.push(c);
    } else {
      const nuevo = { tipo: 'salida' as const, clave, citas: [c] };
      porClave.set(clave, nuevo);
      items.push(nuevo);
    }
  }
  // Un bloque de UNA cita no es salida: vuelve a fila simple.
  return items.map((i) => (i.tipo === 'salida' && i.citas.length === 1 ? { tipo: 'cita', cita: i.citas[0]! } : i));
}

function FilaCita({
  cita,
  enVivo,
  fotoUrl,
  oficio = 'paseo',
  acciones,
}: {
  cita: CitaAgendaPaseo;
  enVivo: boolean;
  fotoUrl?: string;
  /** S60-B1/S63-B: cada oficio navega a SU flujo (Antes/Durante/Cierre). */
  oficio?: OficioCita;
  /** B14 ①: las acciones de ESTA cita — viven adentro de SU tarjeta. */
  acciones?: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useTraduccion();
  const insignias = useInsigniasEstado();
  const hora = cita.hora ? cita.hora.slice(0, 5) : '—';
  // S57-B1: la duración REAL de la cita (snapshot S55-B2), no el default
  // del catálogo — una de 120' se pintaba como 30'.
  const dur = cita.duracion_minutos;

  const ef = estadoEfectivo(cita);
  const insignia = enVivo ? undefined : ef ? insignias[ef] : undefined;
  // S72-B pieza 3: un procedimiento coordinado dice su descripción
  // («Ecografía +1»), no el genérico "Procedimiento" de su tipo. null en
  // los otros oficios → la etiqueta del tipo, como siempre.
  const voz = vozCitaVet(cita.descripcionPresupuesto, cita.tipo.nombre, t);

  // S80-B12 Parte 3: la fila ES el componente de DOMINIO de packages/ui
  // — el canto (§9.1/§9.2, piso 33%, mapa oficio→capa) vive ADENTRO y
  // esta pantalla no puede elegir color, posición ni alfa. El 4º tono
  // del adiestramiento lo firma el founder (censo E de la auditoría);
  // cuando firme, cambia en el componente y acá no se toca nada. La
  // historia del canto y el retiro del elemento compartido (B10/B11):
  // M2 s80-b8 + auditoría s80-b12. La fila EN VIVO lleva canto como
  // todas (§9.2: el glow cuenta VIVOS; la tinta es estática).
  const nombre = cita.mascota?.nombre ?? t('agenda.mascotaFallback');
  return (
    <FilaCitaUi
      // S82-B r38: la dirección se DECLARA (sin default). Acá el onPress
      // hace router.push a la pantalla de la cita: NAVEGA ⇒ '›'.
      direccion="derecha"
      oficio={
        oficio === 'vet' ? 'veterinaria' : oficio === 'grooming' ? 'grooming' : oficio === 'adiestramiento' ? 'adiestramiento' : 'paseo'
      }
      titulo={nombre}
      // La marca "parte del plan" (D-338, S56-B T7) — escalera intacta.
      subtitulo={
        cita.suscripcion_servicio_id !== null
          ? `${voz} · ${t('agenda.parteDelPlan')}`
          : voz
      }
      metadataMono={`${hora}${dur ? ` · ${dur} min` : ''}`}
      mascota={{
        nombre,
        fotoUrl,
        especie: cita.mascota && esEspecie(cita.mascota.especie) ? cita.mascota.especie : undefined,
      }}
      acciones={acciones}
      onPress={() =>
        router.push(
          oficio === 'grooming'
            ? { pathname: '/grooming/cita/[citaId]', params: { citaId: cita.id } }
            : oficio === 'adiestramiento'
              ? { pathname: '/adiestramiento/cita/[citaId]', params: { citaId: cita.id } }
              : oficio === 'vet'
                ? { pathname: '/veterinaria/cita/[citaId]', params: { citaId: cita.id } }
                : { pathname: '/cita/[citaId]', params: { citaId: cita.id } },
        )
      }
      // fin = slot de DATOS (Ley 3: la voz es de la pantalla):
      // S61-B12 la marca de oficio b′ + S70-B1 el chip de origen + estado.
      fin={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}>
          <Icono
            nombre={
              oficio === 'grooming'
                ? 'grooming'
                : oficio === 'adiestramiento'
                  ? 'training'
                  : oficio === 'vet'
                    ? 'veterinaria'
                    : 'paseo'
            }
            registro="aa"
            tamano={21}
          />
          {cita.origen === 'mostrador' && (
            <Insignia estado="info" etiqueta={t('agenda.origenMostrador')} tamaño="sm" />
          )}
          {insignia && <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" />}
        </View>
      }
    />
  );
}

// D-385: la fila de UNA salida — pila de caras + nombres + estado
// agregado; tap = expandir a sus citas (la pantalla es dueña del set
// de abiertas). Composición local con la casa: Celda + AvatarMascota.
function FilaSalida({
  citas,
  abierta,
  onToggle,
  urlsFotos,
}: {
  citas: CitaAgendaPaseo[];
  abierta: boolean;
  onToggle: () => void;
  urlsFotos: Map<string, string>;
}) {
  const { t } = useTraduccion();
  const insignias = useInsigniasEstado();
  const primera = citas[0]!;
  const hora = primera.hora ? primera.hora.slice(0, 5) : '—';
  const dur = primera.duracion_minutos;

  const nombres = citas.map((c) => c.mascota?.nombre ?? t('agenda.mascotaFallback'));
  const titulo =
    citas.length === 2
      ? t('agenda.salidaNombresDos', { a: nombres[0], b: nombres[1] })
      : t('agenda.salidaNombresVarios', { a: nombres[0], b: nombres[1], n: citas.length - 2 });

  // Estado agregado: si TODAS las citas coinciden, la salida lo dice;
  // estados mixtos se leen expandiendo (la fila no promedia — Ley 13).
  const efs = new Set(citas.map((c) => estadoEfectivo(c) ?? ''));
  const efComun = efs.size === 1 ? [...efs][0]! : null;
  const insignia = efComun ? insignias[efComun] : undefined;

  // B14 ① / B15: la salida es SU tarjeta (unidad D-385) y sus miembros
  // expandidos son TARJETAS HERMANAS — dos citas jamás comparten tarjeta.
  return (
    <View style={{ gap: spacing[3] }}>
      <Tarjeta elevacion="reposo" relleno="ninguno">
      <Celda
        interactiva
        onPress={onToggle}
        accessibilityRole="button"
        titulo={titulo}
        subtitulo={`${primera.tipo.nombre} · ${t('agenda.salidaDe', { n: citas.length })}`}
        inicio={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {citas.slice(0, 3).map((c, i) => (
              <View key={c.id} style={{ marginLeft: i === 0 ? 0 : -spacing[2] }}>
                <AvatarMascota
                  nombre={c.mascota?.nombre ?? t('agenda.mascotaFallback')}
                  fotoUrl={c.mascota?.foto_url ? urlsFotos.get(c.mascota.foto_url) : undefined}
                  especie={c.mascota && esEspecie(c.mascota.especie) ? c.mascota.especie : undefined}
                  tamano="xs"
                />
              </View>
            ))}
          </View>
        }
        metadataMono={`${hora}${dur ? ` · ${dur} min` : ''}`}
        fin={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}>
            <Icono nombre="paseo" registro="aa" tamano={21} />
            {insignia && <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" />}
          </View>
        }
      />
      </Tarjeta>
      {abierta &&
        citas.map((c) => (
          <FilaCita
            key={c.id}
            cita={c}
            enVivo={false}
            oficio="paseo"
            fotoUrl={c.mascota?.foto_url ? urlsFotos.get(c.mascota.foto_url) : undefined}
          />
        ))}
    </View>
  );
}

export default function Hoy() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  /* ⭐ S85-C7 — EL DÍA ELEGIDO (la rueda D3 de B, `0b229a6`).
     `null` = todavía no se eligió ⇒ manda el día base. Se resuelve a
     `desde` abajo; no se inicializa con `useState(desde)` porque `desde`
     llega DESPUÉS del fetch y el estado nacería con un valor viejo. */
  const [diaElegido, setDiaElegido] = useState<string | null>(null);
  /** Los días que el negocio declaró cerrados — la rueda los apaga y la
   *  pantalla los CONTESTA (el día cerrado se toca, no se deshabilita:
   *  decisión firmada dentro de la pieza). */
  /** ⚠️ SON DÍAS DE LA **SEMANA** (0..6), no fechas — `DiaCerrado` es
   *  `{dia_semana, motivo}` y el cierre es RECURRENTE, no puntual. La
   *  rueda pide fechas ISO, así que la conversión se hace al pintar
   *  (abajo). Guardar el 0..6 y convertir al final es lo correcto: si
   *  guardara fechas, el lunes que viene estarían viejas.
   *  Convención `0=Domingo..6=Sábado` — regla 32 del contrato, la misma
   *  que `prestador_horarios.dia_semana`. */
  const [cerrados, setCerrados] = useState<Set<number>>(new Set());
  /* ⭐ S86-C · LA PLATA DEL DÍA EN VISTA (cruce 1, firma de mesa).
     **Guarda SU día adentro, y ésa es la pieza que hace que esto funcione:**
     sin el día, el consumidor no puede distinguir *"la plata del día que
     estoy mirando"* de *"la plata de un día que ya dejé atrás"* — y esa
     confusión ES el defecto que este cruce vino a curar. Con el día
     adentro, mostrar un total viejo bajo un rótulo nuevo se vuelve
     inexpresable: el techo compara y dice «Calculando».
     · `null` = nunca se leyó · `{dia, valor:null}` = la lectura de ESE día
     FALLÓ (L-197: el fallo no degrada a permiso negado ni a cero). */
  const [plata, setPlata] = useState<{ dia: string; valor: PlataDelDia | null } | null>(null);
  // S61-B5: el filtro por oficio — vista del día, JAMÁS persiste.
  const [filtroOficio, setFiltroOficio] = useState<FiltroOficioValor>('todos');
  // D-385: salidas expandidas (por clave de bloque) — vista, jamás persiste.
  const [salidasAbiertas, setSalidasAbiertas] = useState<Set<string>>(new Set());
  // S70-B2-v2: el acordeón "Ya atendidas" — plegado por default (lo pasado
  // se pliega; lo que sigue vive arriba).
  const [atendidasAbierto, setAtendidasAbierto] = useState(false);
  // S70-B2-v2: "Por coordinar" con techo visual 3 + "Ver todas".
  const [verTodasCoord, setVerTodasCoord] = useState(false);
  const toggleSalida = (clave: string) =>
    setSalidasAbiertas((s) => {
      const n = new Set(s);
      if (n.has(clave)) n.delete(clave);
      else n.add(clave);
      return n;
    });
  // foto_url guarda PATH (S47-B0.2): firma en batch (1 round-trip);
  // un path no firmable cae a la huella digna.
  const [urlsFotos, setUrlsFotos] = useState<Map<string, string>>(new Map());

  const cargar = useCallback(async (esRefresh = false) => {
    if (!esRefresh) setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const prestador = await obtenerMiPrestador();
    if (!prestador.ok) {
      setPantalla({ estado: 'error', mensaje: prestador.mensaje });
      return;
    }
    // ── S78-B · D-521, la primera composición por rol ──
    // recepción ⟺ miembro activo, NO titular, CERO chips (§1: definida
    // por AUSENCIA). Costo declarado: +3 viajes en todo arranque del HOY
    // (D-497); la cura de raíz es un resolvedor de rol cacheado — pedido
    // a A, no deducido acá. Ante CUALQUIER fallo de lectura se cae a la
    // jornada normal: la RLS ya restringe lo que recepción puede ver, y
    // un falso-recepción escondería la jornada del titular (peor).
    const miFila = await obtenerMiEmpleadoId(prestador.data.id);
    // S80-B3: esTitular sale del gate de recepción y también gatea el
    // módulo de preparación (abajo) — el titular lee su propia fila
    // dueño, así que para él la resolución no cuesta ningún viaje nuevo.
    let esTitular = false;
    if (miFila !== null) {
      const [titularFila, chipsR] = await Promise.all([
        obtenerTitularId(prestador.data.id),
        obtenerChipsEmpleado(miFila),
      ]);
      esTitular = titularFila !== null && titularFila === miFila;
      if (!esTitular && chipsR.ok && chipsR.data.length === 0) {
        setPantalla({
          estado: 'recepcion',
          prestadorId: prestador.data.id,
          cuentaComercialId: prestador.data.cuenta_comercial_id,
          titularId: titularFila,
        });
        return;
      }
    }
    /* UN fetch cubre el rango entero (S57-B1). ⭐ S86-C: el rango pasa a
       hoy−3..hoy+6 — DIEZ días en el MISMO viaje, no diez viajes. Elegir un
       día sigue siendo un filtro sobre memoria, y la rueda sigue sin pedir
       nada. Lo único que cambió es dónde EMPIEZA. */
    const hoy = hoyLocal();
    const desde = sumarDias(hoy, -DIAS_ATRAS);
    const hasta = sumarDias(hoy, DIAS_ADELANTE);
    /* S85-C7: `rCerrados` entra AL FINAL del arreglo y del destructuring —
       insertarlo en el medio corre todas las posiciones y el typecheck lo
       cazó en el acto (once tuplas desalineadas). Al final, nada se mueve. */
    const [r, rg, ra, rv, bloqueos, atendidas, ofPaseo, ofGrooming, ofAdiestramiento, ofVet, cuentaR, perfilR, rCerrados, rPresup, rSolic, rAbiertas] = await Promise.all([
      obtenerCitasPaseoDelDia({ prestador_id: prestador.data.id, fecha: desde, fecha_hasta: hasta }),
      // S60-B1: la jornada es UNA — las citas de grooming entran a la
      // misma lista con su tipo (el subtítulo ya lo dice) y su ruta.
      obtenerCitasGroomingDelDia({ prestador_id: prestador.data.id, fecha: desde, fecha_hasta: hasta }),
      // S63-B: las sesiones de adiestramiento — tercera pata de la MISMA jornada.
      obtenerCitasAdiestramientoDelDia({ prestador_id: prestador.data.id, fecha: desde, fecha_hasta: hasta }),
      // S69-B (M0): las citas de veterinaria — CUARTA pata de la MISMA
      // jornada (mostrador + reserva). El discriminador es es_medico.
      obtenerCitasVetDelDia({ prestador_id: prestador.data.id, fecha: desde, fecha_hasta: hasta }),
      // vacaciones (solo lectura): los días bloqueados se pintan como tales
      obtenerBloqueosPrestador(prestador.data.id),
      // la señal "Primera vez" de la Zona 1 (solo lo REAL): mascota
      // sin ninguna atención cerrada con este prestador
      obtenerMascotasAtendidas(prestador.data.id),
      // S61-B5: la condición del filtro por oficio — los wrappers de
      // ofertas EXISTENTES (cero query nueva)
      obtenerOfertasPaseoPropias(prestador.data.id),
      obtenerOfertasGroomingPropias(prestador.data.id),
      obtenerOfertaAdiestramientoPropia(prestador.data.id),
      // S69-B: el cuarto oficio para el filtro — vet activo = ≥1 servicio prendido.
      obtenerMundoVeterinariaPropio(prestador.data.id),
      // S70-B2-v2: la cuenta — para la bandeja "Por coordinar" (D-439).
      obtenerMiCuentaComercial(),
      // S71-B1: la persona del techo. ÚNICA query nueva del piloto — y
      // es un wrapper existente. Su error NO rompe la jornada: el saludo
      // degrada a ir solo (el techo orienta, no bloquea — Ley 13 aplica
      // al CUERPO, que tiene su propio camino de error).
      obtenerMiPerfil(),
      // S85-C7: los días cerrados para la rueda. Su fallo NO tumba la
      // jornada — sin el dato la rueda no apaga NINGUNO, que es la verdad
      // honesta ("no sabemos") y no una promesa de apertura.
      obtenerDiasCerrados(prestador.data.id),
      /* ⏪ S86-C · ACÁ VIVÍA `obtenerPlataDelDia(prestador.data.id, desde)`, y
         se va del fetch único con su razón: **el techo mezclaba dos días.**
         CARGA y VIDAS se computan del día EN VISTA, y la plata se leía UNA
         vez con `desde`. Mientras la rueda solo iba hacia adelante el defecto
         ya existía —parado en el jueves, plata de hoy— y era invisible porque
         nadie compara tres números entre sí.
         Ahora la plata se relee POR DÍA en su propio efecto (ver `plata`).
         ⚠️ Y `desde` ya ni siquiera es hoy: dejarla acá habría convertido un
         número equivocado en uno equivocado Y viejo. */
      /* ⚠️ AL FINAL, Y ESTA VEZ ME LO COBRÓ A MÍ: los inserté en el medio
         y desalineé el destructuring — el `tsc` cazó `rPlata is possibly
         null`, que no nombra la causa. El comentario de C23 tres líneas
         arriba ADVERTÍA exactamente esto. Una regla escrita no es una regla
         seguida; lo que la hace barata es que el compilador la vigile. */
      /* S85-C30 · presupuestos del negocio. Se filtra 'enviado' ACÁ y no en
         el wrapper: el lector es de propósito general (lo consume el mundo
         vet entero) y angostarlo por un consumidor rompería a los otros. */
      prestador.data.cuenta_comercial_id !== null
        ? obtenerPresupuestosPrestador(prestador.data.cuenta_comercial_id)
        : Promise.resolve(null),
      /* ⚠️ EL PARÁMETRO ES `cuenta_comercial_id`, NO `prestador_id` (aviso
         de A): con el id equivocado el lector devuelve VACÍO SIN ERROR —
         un cero plausible que diría "no hay autorizaciones esperando"
         cuando las hay. Familia de L-197: el fallo que no falla. */
      prestador.data.cuenta_comercial_id !== null
        ? obtenerSolicitudesMostrador(prestador.data.cuenta_comercial_id)
        : Promise.resolve(null),
      /* ⚠️ LA CUARTA FUENTE, y la que hacía al bloque incompleto: atenciones
         SIN CERRAR. Una atención abierta de un día anterior no aparece en la
         jornada de hoy —hoy solo trae el día— así que sin esta fila el
         prestador no tenía dónde verla, y una atención sin cerrar es PLATA
         SIN DEVENGAR (el devengo nace al cerrar con calidad).
         ⚠️ Y NO es titular-only, a diferencia de la plata: un empleado ve
         SUS pendientes. La regla no es "todo lo del negocio es del titular"
         — es que la PLATA lo es. */
      obtenerAtencionesAbiertas(prestador.data.id, 90),
    ]);
    /* S85-C7 · los cerrados se guardan APARTE del estado de pantalla, y
       ANTES del rebote de las citas: su fallo no cambia la jornada — solo
       deja la rueda sin días apagados, que es el nulo honesto ("no
       sabemos") y no una promesa de apertura. */
    setCerrados(rCerrados.ok ? new Set(rCerrados.data.map((d) => d.dia_semana)) : new Set());
    if (!r.ok) {
      setPantalla({ estado: 'error', mensaje: r.mensaje });
      return;
    }
    // El grooming es promesa de la MISMA jornada — su error tampoco se
    // disfraza de "sin citas" (Ley 13).
    if (!rg.ok) {
      setPantalla({ estado: 'error', mensaje: rg.mensaje });
      return;
    }
    // El adiestramiento también es la MISMA jornada (Ley 13).
    if (!ra.ok) {
      setPantalla({ estado: 'error', mensaje: ra.mensaje });
      return;
    }
    // La veterinaria es la MISMA jornada — su error tampoco se disfraza
    // de "sin citas" (Ley 13).
    if (!rv.ok) {
      setPantalla({ estado: 'error', mensaje: rv.mensaje });
      return;
    }
    // La marca de bloqueo es PROMESA de la vista semana (jamás se cae en
    // silencio — Ley 13: un error no se disfraza de "sin vacaciones").
    if (!bloqueos.ok) {
      setPantalla({ estado: 'error', mensaje: bloqueos.mensaje });
      return;
    }
    // Merge por fecha+hora: una sola línea de tiempo de trabajo.
    const citas = [...r.data, ...rg.data, ...ra.data, ...rv.data].sort((a, b) => {
      const fa = a.fecha ?? '';
      const fb = b.fecha ?? '';
      return fa === fb ? (a.hora ?? '').localeCompare(b.hora ?? '') : fa.localeCompare(fb);
    });
    const paths = citas
      .map((c) => c.mascota?.foto_url)
      .filter((p): p is string => typeof p === 'string' && p.length > 0);
    if (paths.length > 0) setUrlsFotos(await resolverUrlsFotos(paths));
    // S70-B2-v2: la bandeja "Por coordinar" (D-439) — solo con cuenta; vacía si no.
    let porCoordinar: CitaPorCoordinar[] = [];
    if (cuentaR.ok && cuentaR.data) {
      const pc = await obtenerCitasPorCoordinar(cuentaR.data.id);
      if (pc.ok) porCoordinar = pc.data;
    }
    // ── S79-B (T2-B1) · EL MODO PREPARACIÓN ──
    // serviciosOk/preciosOk salen de las ofertas YA fetcheadas (cero query
    // nueva); horariosOk cuesta +1 viaje (declarado, familia D-555/D-497);
    // equipoOk +1 SOLO si el módulo va a renderizar. Checks = señal positiva
    // VERIFICADA (patrón D-521): fallo de lectura → null, sin check, jamás
    // un falso estado.
    const serviciosOk =
      (ofPaseo.ok && ofPaseo.data.some((o) => o.activo)) ||
      (ofGrooming.ok && ofGrooming.data.some((o) => o.activo)) ||
      (ofAdiestramiento.ok && (ofAdiestramiento.data.oferta?.activo ?? false)) ||
      (ofVet.ok && ofVet.data.servicios.some((s) => s.activo));
    const preciosOk =
      (ofPaseo.ok && ofPaseo.data.some((o) => o.activo && o.precio > 0)) ||
      (ofGrooming.ok &&
        ofGrooming.data.some(
          (o) =>
            o.activo &&
            (['S', 'M', 'L'] as const).some((tl) => (o.tallas[tl]?.precio ?? 0) > 0),
        )) ||
      (ofAdiestramiento.ok &&
        (ofAdiestramiento.data.oferta?.activo ?? false) &&
        (ofAdiestramiento.data.oferta?.precio ?? 0) > 0) ||
      (ofVet.ok && ofVet.data.servicios.some((s) => s.activo && s.precio > 0));
    // ── S80-B3 · EL GATE DEL MÓDULO (D-521, disparo de campo: el founder
    // como empleado con chip vio "Prepara tu espacio" con Los Shyris YA
    // configurada) ── El módulo es del GESTOR (PORTAL §2.4). La verdad de
    // rol es del motor: `empleado_tiene_rol` §14.4 — JAMÁS la fila
    // `recepcion` (membresía, no identidad, S76-A2bis). El titular ya se
    // resolvió arriba sin viaje; no-titular paga +1 RPC (familia D-555).
    // Sin gate, `obtenerFranjasHorario` resuelve por TITULAR y la fila
    // dueño es INVISIBLE para un empleado (empleados_self) → horariosOk
    // null → falso "falta configurar" con cara de dato (medido S80-B3,
    // JWT vet3: titular_visible=0 con 5 franjas activas en la tabla).
    // Lectura de rol caída → sin módulo (Ley 23: la ayuda de preparación
    // no se monta ante la duda; la escritura la protege el server).
    // NOTA para el ADMINISTRADOR futuro (D-513 v2): serviciosOk lee por
    // los wrappers _own del titular — a un gestor no-titular le va a
    // mentir igual; se cura cuando ese rol gane motor.
    let esGestor = esTitular;
    if (!esGestor) {
      const rolR = await empleadoTieneRol(prestador.data.id, ['dueño', 'administrador']);
      esGestor = rolR.ok && rolR.data;
    }
    let preparacion: EstadoTareas | null = null;
    if (esGestor) {
      const franjasR = await obtenerFranjasHorario(prestador.data.id);
      const horariosOk: boolean | null = franjasR.ok
        ? franjasR.data.some((f) => f.activo)
        : null;
      if (!(serviciosOk && horariosOk === true)) {
        let equipoOk: boolean | null = null;
        if (prestador.data.cuenta_comercial_id !== null) {
          const equipoR = await obtenerEquipoNegocio(prestador.data.cuenta_comercial_id);
          if (equipoR.ok) equipoOk = equipoR.data.miembros.filter((m) => m.activo).length >= 2;
        }
        preparacion = { serviciosOk, preciosOk, horariosOk, equipoOk };
      }
    }
    setPantalla({
      estado: 'listo',
      desde,
      hoy,
      prestadorId: prestador.data.id,
      citas,
      porCoordinar,
      nombre: perfilR.ok ? perfilR.data.nombre : null,
      nombreComercial: prestador.data.nombre_comercial,
      ciudad: prestador.data.ciudad,
      logoPath: prestador.data.foto_url,
      preparacion,
      atencion: {
        coordinar: porCoordinar.length,
        /* ⚠️ SOLO 'enviado' — y el 'vencido' YA viene resuelto perezoso por
           el propio wrapper sobre `vence_en`, así que un presupuesto muerto
           no infla el contador. Aprobado y rechazado tampoco: ya tuvieron
           su respuesta y no necesitan NADA de mí. */
        presupuestos: rPresup === null ? null : rPresup.ok ? rPresup.data.filter((p) => p.estado === 'enviado').length : null,
        /* ⚠️ SOLO 'pendiente' (aviso de A): el lector trae también
           'autorizada' —y 'expirada', que el server deriva perezoso—. Una
           solicitud RESPONDIDA no necesita atención, y contarla infla el
           bloque con trabajo ya hecho: el prestador iría a mirar algo que
           ya está resuelto y dejaría de confiar en el número. */
        handshakes: rSolic === null ? null : rSolic.ok ? rSolic.data.filter((s) => s.estado === 'pendiente').length : null,
        abiertas: rAbiertas.ok ? rAbiertas.data.length : null,
        /* La MÁS VIEJA — el lector ya ordena por antigüedad, así que es la
           [0]. La fila lleva ahí y no a un listado: *el prestador no quiere
           ver sus pendientes, quiere cerrar el que más duele.* */
        abiertaCitaId: rAbiertas.ok ? (rAbiertas.data[0]?.citaId ?? null) : null,
      },
      cohorte: prestador.data.cohorte,
      cohorteAnio: prestador.data.cohorte_anio,
      groomingIds: new Set(rg.data.map((c) => c.id)),
      adiestramientoIds: new Set(ra.data.map((c) => c.id)),
      vetIds: new Set(rv.data.map((c) => c.id)),
      bloqueos: bloqueos.data,
      atendidas: new Set(atendidas.ok ? atendidas.data.map((m) => m.mascota_id) : []),
      oficios: {
        paseo: ofPaseo.ok && ofPaseo.data.some((o) => o.activo),
        grooming: ofGrooming.ok && ofGrooming.data.some((o) => o.activo),
        adiestramiento:
          ofAdiestramiento.ok && (ofAdiestramiento.data.oferta?.activo ?? false),
        vet: ofVet.ok && ofVet.data.servicios.some((s) => s.activo),
      },
    });
  }, []);

  // Refetch en focus (fix gate B4.4): al volver del Cierre la lista se
  // actualiza sola. Silencioso = reemplazo directo (Ley 13).
  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  async function refrescar() {
    setRefrescando(true);
    await cargar(true);
    setRefrescando(false);
  }

  // El fetch trae el rango hoy..hoy+6; la vista Hoy opera sobre el día base.
  const citas = pantalla.estado === 'listo' ? pantalla.citas : [];
  const desde = pantalla.estado === 'listo' ? pantalla.desde : null;
  /* ⭐ S86-C · HOY, aparte del inicio del rango. Todo lo que pregunta
     "¿esto es ahora?" lee ACÁ; `desde` quedó solo para armar el rango. */
  const hoy = pantalla.estado === 'listo' ? pantalla.hoy : null;
  const groomingIds = pantalla.estado === 'listo' ? pantalla.groomingIds : new Set<string>();
  const adiestramientoIds = pantalla.estado === 'listo' ? pantalla.adiestramientoIds : new Set<string>();
  const vetIds = pantalla.estado === 'listo' ? pantalla.vetIds : new Set<string>();
  /** Las citas que jamás agrupan en salida (grooming + adiestramiento +
   *  veterinaria — solo el paseo hace salidas). */
  const sinAgruparIds = new Set([...groomingIds, ...adiestramientoIds, ...vetIds]);
  const oficioDe = (c: CitaAgendaPaseo): OficioCita =>
    groomingIds.has(c.id)
      ? 'grooming'
      : adiestramientoIds.has(c.id)
        ? 'adiestramiento'
        : vetIds.has(c.id)
          ? 'vet'
          : 'paseo';
  // S61-B5 (S63-B: tercer oficio): con ≥2 oficios activos nace el
  // filtro; con uno, el control no existe (cero UI muerta).
  const oficiosActivos = pantalla.estado === 'listo' ? pantalla.oficios : null;
  const conFiltro =
    oficiosActivos !== null &&
    [oficiosActivos.paseo, oficiosActivos.grooming, oficiosActivos.adiestramiento, oficiosActivos.vet].filter(Boolean)
      .length >= 2;
  const citasVisibles =
    !conFiltro || filtroOficio === 'todos' ? citas : citas.filter((c) => oficioDe(c) === filtroOficio);
  /* S85-C7: la vista opera sobre EL DÍA ELEGIDO, no sobre el día base.
     El fetch ya trae el rango entero, así que elegir otro día es un FILTRO —
     cero viaje nuevo (la plata es la única excepción, y por gate de servidor).
     ⭐ S86-C: el default es **HOY**, jamás `desde`. Con el rango arrancando
     tres días atrás, caer en `desde` abriría la portada parada en el pasado. */
  const diaVista = diaElegido ?? hoy;
  const citasHoy = diaVista === null ? [] : citasVisibles.filter((c) => c.fecha === diaVista);
  // S61-B12: el día SIN filtrar — la Zona 1 es INMUNE al filtro por
  // GUARD ESTRUCTURAL (se computa de acá, jamás de la lista filtrada)
  const citasHoySin = diaVista === null ? [] : citas.filter((c) => c.fecha === diaVista);
  /* ⭐ S86-C · EL FUTURO NO APAGA LO VIVO (firma ② del founder).
   *
   *  ⏪ ACÁ DECÍA, y se conserva porque su argumento sigue siendo cierto:
   *  *"EL VIVO ES DE HOY, Y SOLO DE HOY. La Zona 1 dice «ahora» — y «ahora»
   *  no existe en el jueves. Si la rueda está parada en otro día, el hero no
   *  se monta: mostrarlo ahí afirmaría que algo está corriendo en un día que
   *  todavía no llegó."* (S85-C7.)
   *
   *  **LO QUE CAMBIA, y por qué no es una contradicción:** S85 tenía razón en
   *  el RIESGO y se equivocó en la CURA. El riesgo era *afirmar que algo corre
   *  en el jueves*; la cura fue **esconder lo vivo**, y eso resuelve el riesgo
   *  destruyendo el dato — un paseo en curso desaparecía de la pantalla porque
   *  el prestador miró la agenda de mañana.
   *  **La firma nueva pide que lo vivo se VEA; el argumento viejo se honra con
   *  RÓTULO** (`agenda.ahoraHoy` → «Ahora · hoy»): la pantalla dice de qué día
   *  es en vez de callarse. *Un rótulo cuesta cuatro palabras; esconder algo
   *  que está pasando cuesta un paseo sin vigilar.*
   *
   *  ⚠️ Y lo que la firma NO toca: «Lo siguiente» **queda exclusivo de hoy**.
   *  En otro día la primera cita YA está en la lista de abajo — subirla al
   *  hero no diría nada nuevo (L-c), y "lo siguiente" de un jueves no es lo
   *  siguiente de nadie.
   *  ⚠️ Nada de esto toca la inmunidad al filtro por OFICIO (guard estructural
   *  S61-B12): son ejes distintos y el de oficio sigue intacto. */
  const vistaEsHoy = diaVista !== null && diaVista === hoy;
  /** ¿El día en vista ya pasó? Comparación de ISO YYYY-MM-DD, que ordena
   *  lexicográficamente — cero Date, cero huso (D-312). */
  const vistaEsPasado = diaVista !== null && hoy !== null && diaVista < hoy;
  /** Los DIEZ del rango que el fetch ya trajo (hoy−3..hoy+6) — la rueda no
   *  inventa días que no estén cargados. */
  const dias = desde === null
    ? []
    : Array.from({ length: DIAS_ATRAS + DIAS_ADELANTE + 1 }, (_, i) => sumarDias(desde, i));

  /* ⭐ S86-C · LA RELECTURA DE LA PLATA (cruce 1). Un efecto propio y no
     parte de `cargar`: cambiar de día NO recarga la jornada —los diez días
     ya están en memoria— y lo ÚNICO que hay que volver a preguntarle al
     servidor es el total.
     ⚠️ **Y hay que preguntárselo, aunque el dato para sumarlo esté acá.**
     Cada cita trae su `precio`: sumar `citasHoySin` sería una línea. Sería
     también entregarle el ingreso del negocio a cualquiera que pueda ver la
     lista — el gate de §2.4bis vive en el SERVIDOR justamente porque *una
     autorización que decide el cliente es decorativa*, y `precio` sigue
     siendo legible por RLS para quien ve la cita (D-641: ésta es la puerta
     del TOTAL, no la del dato). **La línea barata rompe el gate entero.** */
  useEffect(() => {
    if (pantalla.estado !== 'listo' || diaVista === null) return;
    const prestadorId = pantalla.prestadorId;
    const dia = diaVista;
    let vigente = true;
    void obtenerPlataDelDia(prestadorId, dia).then((r) => {
      /* El dedo pasa tres días mientras una respuesta viaja. Sin este guard
         una lectura vieja pisa a la nueva, y el techo mostraría el total de
         un día que el usuario ya dejó atrás **con el rótulo del día actual**
         — el mismo error que este cruce cura, entrando por atrás. */
      if (!vigente) return;
      setPlata({ dia, valor: r.ok ? r.data : null });
    });
    return () => {
      vigente = false;
    };
    /* `pantalla` entero en deps a propósito: su identidad cambia con cada
       `cargar`, así que el refresco en foco vuelve a leer la plata como lo
       hacía cuando viajaba en el fetch único. `plata` NO va en deps — sería
       un lazo. */
  }, [pantalla, diaVista]);
  /** De días de la semana a FECHAS, que es lo que la rueda entiende. Se
   *  computa acá y no se guarda: el cierre es recurrente y una fecha
   *  guardada envejece sola. */
  const isoCerrados = new Set(
    dias.filter((iso) => {
      const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
      const cierreSemanal = a && m && d ? cerrados.has(new Date(a, m - 1, d).getDay()) : false;
      /* ⭐ S85-C8 — LAS VACACIONES ENTRAN ACÁ, y es lo que se CONSERVA de
         la vista Semana al retirarla: ella marcaba los días bloqueados con
         su insignia, y ése era el único lugar donde el bloqueo se veía.
         Son DOS ejes distintos con dos fuentes distintas —el cierre
         semanal es recurrente (`dia_semana`), las vacaciones son un RANGO
         DE FECHAS (`prestador_bloqueos`)— y para el dedo significan lo
         mismo: ese día no trabajo. Se unen para apagar; la DISTINCIÓN se
         dice abajo, en el día elegido. */
      return cierreSemanal || (pantalla.estado === 'listo' && diaBloqueado(iso, pantalla.bloqueos));
    }),
  );
  /** ¿El día que estoy mirando está bloqueado por vacaciones? La rueda lo
   *  apaga; ACÁ se dice POR QUÉ — que es la mitad que la unión de arriba
   *  no puede decir con una sola etiqueta. */
  const diaVistaBloqueado =
    diaVista !== null && pantalla.estado === 'listo' && diaBloqueado(diaVista, pantalla.bloqueos);
  /** El día corto por idioma. **Copiado del cliente**, que ya lo hace en
   *  sus dos pantallas de reserva (`explorar/paseo` y `explorar/grooming`)
   *  con esta misma receta — el riel no tiene helper de día CORTO y
   *  duplicar la forma del vecino es más honesto que inventar una tercera
   *  (L-175: se lee lo que hay antes de crear).
   *  ☠️ Su día en `packages/i18n` llega con el TERCER consumidor. */
  const diaCorto = (iso: string): string => {
    const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
    if (!a || !m || !d) return iso.slice(8, 10);
    return new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', { weekday: 'short' })
      .format(new Date(a, m - 1, d))
      .replace('.', '');
  };
  // el vacío FILTRADO se dice distinto: hay jornada, no de este servicio
  const hoyVacioPorFiltro =
    citasHoy.length === 0 && conFiltro && filtroOficio !== 'todos' && citasHoySin.length > 0;

  // ── Zona 1: la destacada — en_curso (Ley 7: UNA con CitaEnVivo) o,
  // si no hay nada corriendo, la PRÓXIMA cita aún no cerrada del día.
  // S61-B12: sobre el día SIN FILTRAR — el vivo preside SIEMPRE.
  /* ⭐ S86-C · LO VIVO SE COMPUTA DE **HOY**, no del día en vista — y ése es
     el cambio que hace verdadera a la firma ②. Antes salía de `citasHoySin`
     (el día elegido), así que mover la rueda al jueves no "apagaba" el hero:
     lo dejaba **buscando citas en curso el jueves**, donde por definición no
     hay ninguna. "Ahora" es una propiedad del reloj, no del día que mira el
     dedo.
     ⚠️ Una atención en curso de un día ANTERIOR (alguien no cerró) NO entra
     acá a propósito: no está corriendo, está sin cerrar — y tiene su lugar en
     «Necesita tu atención» (`abiertas`) y su voz en la forma del día. */
  const citasDeHoySin = hoy === null ? [] : citas.filter((c) => c.fecha === hoy);
  /* ⭐ S86-C · TODAS LAS VIVAS, no una (firma ③ · §7.5 del diccionario).
     ⏪ Acá había un `reduce` por `iniciada_en` máximo que dejaba UNA. Y el
     detalle que la medición corrigió: la que sobrevivía no era "la primera"
     sino **la última en arrancar** — las otras caían a la Zona 2 con su
     insignia «En vivo» pero sin anillo ni pill.
     §7.5 ya lo permitía desde S81 (*N citas vivas REALES simultáneas = N
     celdas*) y el Hogar del cliente ya lo hace así. No es enmienda de la
     Ley 7: es aplicar su cláusula donde el caso existe. */
  const enCurso = citasDeHoySin.filter((c) => c.atencion?.estado === 'en_curso');
  const hayVivo = enCurso.length > 0;
  /* «Lo siguiente» SOLO en hoy (firma ②): en otro día la primera cita ya
     está en la lista de abajo y subirla no diría nada nuevo (L-c). */
  const proxima =
    vistaEsHoy && !hayVivo
      ? citasDeHoySin.find((c) => {
          const ef = estadoEfectivo(c);
          return ef === 'confirmada' || ef === 'terminada';
        })
      : undefined;
  const nucleo: CitaAgendaPaseo[] = hayVivo ? enCurso : proxima ? [proxima] : [];
  /* D-385: la SALIDA del núcleo preside ENTERA — las compañeras de bloque
     (paseo, misma fecha+hora+duración) suben con él.
     ⚠️ SOLO EN HOY: una compañera NO viva es una cita de hoy como cualquier
     otra, y subirla mientras se mira el jueves rompería «solo lo vivo
     sobrevive». Fuera de hoy la Zona 1 es exactamente `enCurso`. */
  const clavesNucleo = new Set(
    nucleo
      .filter((c) => !sinAgruparIds.has(c.id))
      .map((c) => claveBloque(c))
      .filter((k): k is string => k !== null),
  );
  const idsNucleo = new Set(nucleo.map((c) => c.id));
  const companeras = vistaEsHoy
    ? citasDeHoySin.filter(
        (c) =>
          !idsNucleo.has(c.id) &&
          !sinAgruparIds.has(c.id) &&
          clavesNucleo.has(claveBloque(c) ?? ' '),
      )
    : [];
  /* Orden cronológico: con N vivas simultáneas, el orden de `filter` es el de
     la lista y no dice nada. La hora sí. */
  const zona1 = [...nucleo, ...companeras].sort((a, b) =>
    (a.hora ?? '').localeCompare(b.hora ?? ''),
  );
  const idsZona1 = new Set(zona1.map((c) => c.id));
  const esViva = (c: CitaAgendaPaseo) => idsNucleo.has(c.id) && hayVivo;
  /* `resto` sale del día EN VISTA. Fuera de hoy, `idsZona1` son citas de hoy
     que no están en esta lista — el filtro no saca nada, que es lo correcto. */
  const resto = citasHoy.filter((c) => !idsZona1.has(c.id));
  // S70-B2-v2: lo pasado se pliega — "Ya atendidas" son las cerradas del día
  // (completada / no_show / cerrada). Lo que sigue vive arriba.
  const esAtendida = (c: CitaAgendaPaseo): boolean => {
    const ef = estadoEfectivo(c);
    return ef === 'completada' || ef === 'no_show' || ef === 'cerrada_con_calidad';
  };
  // D-385: el resto se agrupa por salida (solo paseo; grooming/vet no agrupan).
  const restoItems = agruparSalidas(resto.filter((c) => !esAtendida(c)), sinAgruparIds);
  const atendidasItems = agruparSalidas(resto.filter(esAtendida), sinAgruparIds);
  // S70-B2-v2: la bandeja "Por coordinar" (D-439) del negocio (vista Hoy).
  const porCoordinar = pantalla.estado === 'listo' ? pantalla.porCoordinar : [];

  // ── S71-B1: LA FORMA DEL DÍA — la firma del techo ──
  // Se computa del día SIN filtrar; la línea se OMITE mientras no hay
  // verdad (cargando/error): el techo no espera con esqueleto, aparece
  // cuando tiene algo cierto que decir.
  const forma: FormaDelDia =
    pantalla.estado === 'listo'
      ? formaDelDia({
          citasHoySin,
          citasRango: citas,
          esAtendida,
          porCoordinar: porCoordinar.length,
          esPasado: vistaEsPasado,
        })
      : { clave: 'omitida' };

  const textoJornada: string | undefined =
    forma.clave === 'omitida'
      ? undefined
      : forma.clave === 'quedan'
        ? t('agenda.datoQuedan', { n: forma.n, hora: forma.hora })
        : forma.clave === 'queda1'
          ? t('agenda.datoQueda1', { hora: forma.hora })
          : forma.clave === 'quedanSinHora'
            ? t('agenda.datoQuedanSinHora', { n: forma.n })
            : forma.clave === 'queda1SinHora'
              ? t('agenda.datoQueda1SinHora')
              : forma.clave === 'completa'
                ? t('agenda.datoCompleta')
                : forma.clave === 'porCoordinar'
                  ? t('agenda.datoPorCoordinar', { n: forma.n })
                  : /* S86-C · las dos del pasado */
                    forma.clave === 'pasadoPendientes'
                    ? forma.n === 1
                      ? t('agenda.datoPasadoPendiente1')
                      : t('agenda.datoPasadoPendientes', { n: forma.n })
                    : forma.clave === 'pasadoCerrado'
                      ? forma.n === 1
                        ? t('agenda.datoPasadoCerrado1')
                        : t('agenda.datoPasadoCerradoN', { n: forma.n })
                      : t('agenda.datoLibreConSemana', { n: forma.n });

  /* E5 — la mecánica del Hogar del cliente, VERBATIM: primer nombre; sin
     nombre, el saludo va SOLO (jamás inventado).

     ═══ LA ESTRUCTURA ESTÁ FIRMADA (gate S85) ═══════════════════════════
     Literal del founder: *"debe saludar por el nombre, y abajo pequeño el
     nombre del negocio"* — que es exactamente lo que hace. **No se toca la
     composición.**

     🔴 **LO QUE FALLA ES EL DATO, y su forma es la del día:** el founder vio
     *«Hola, demo-prestador»*. `profiles.nombre` se siembra con el LOCAL-PART
     DEL CORREO cuando la metadata no trae nombre (`handle_new_user`,
     D-637), así que `demo-prestador@…` produce ese saludo.
     **Y no hay nada que pueda cazarlo:** el saludo recibe un `string`, y
     `'demo-prestador'` es tan válido como `'Guillermo'`. *Un dato sembrado
     que dice "sí" — la misma familia del techo que devolvía `1`: un valor
     legal que el consumidor obedece.*
     **A cura el dato.** Y se descartó la salida barata —adivinar si un
     nombre "parece un slug"—: una heurística que se equivoca le quita el
     nombre a alguien que sí se llama así.

     🔴 **DEUDA CON DUEÑO (b), firmada en el gate: LA SUPERFICIE DE EDICIÓN
     DEL NOMBRE PERSONAL VUELVE AL PRESTADOR.** Hoy **nadie puede
     corregirse el nombre desde esta app** — así que limpiar el dato cura
     el presente y deja al prestador sin manera de arreglarlo la próxima
     vez. *Necesaria, no urgente*; es de esta casa (pantalla), no de A. */
  const nombrePerfil = pantalla.estado === 'listo' ? pantalla.nombre : null;
  const saludo = nombrePerfil
    ? t('agenda.saludoNombre', { nombre: nombrePerfil.trim().split(' ')[0] })
    : t('agenda.saludoSinNombre');
  const negocio = pantalla.estado === 'listo' ? pantalla.nombreComercial : '';

  /* S85-C30 · las filas de «Necesita tu atención», en orden de urgencia:
     lo que ya tiene un compromiso con la familia va primero.
     ⚠️ `null` (no se pudo leer) NO produce fila y TAMPOCO produce un cero:
     simplemente no se afirma nada sobre esa fuente. Un 0 pintado sería
     "no hay nada que atender", que es lo contrario de "no pude mirar". */
  const atencionItems: { clave: string; icono: 'mes' | 'presupuesto' | 'familia' | 'caso'; titulo: string; onPress: () => void }[] = [];
  if (pantalla.estado === 'listo') {
    const a = pantalla.atencion;
    if (a.coordinar > 0) {
      atencionItems.push({
        clave: 'coordinar',
        icono: 'mes',
        titulo: a.coordinar === 1 ? t('atencion.coordinar1') : t('atencion.coordinarN', { n: a.coordinar }),
        // La bandeja YA existe y vive más abajo en esta misma portada: el
        // bloque no la duplica, la ANUNCIA. Por eso lleva a la pantalla de
        // coordinar de la primera, que es lo que el prestador va a hacer.
        onPress: () =>
          router.push({ pathname: '/veterinaria/coordinar/[citaId]', params: { citaId: pantalla.porCoordinar[0].citaId } }),
      });
    }
    if (a.presupuestos !== null && a.presupuestos > 0) {
      atencionItems.push({
        clave: 'presupuestos',
        icono: 'presupuesto',
        titulo: a.presupuestos === 1 ? t('atencion.presupuesto1') : t('atencion.presupuestoN', { n: a.presupuestos }),
        onPress: () => router.push('/veterinaria/movimiento'),
      });
    }
    if (a.handshakes !== null && a.handshakes > 0) {
      atencionItems.push({
        clave: 'handshakes',
        icono: 'familia',
        titulo: a.handshakes === 1 ? t('atencion.handshake1') : t('atencion.handshakeN', { n: a.handshakes }),
        onPress: () => router.push('/veterinaria/mostrador'),
      });
    }
    /* LO VIEJO PRIMERO ya viene del lector (ordena por antigüedad): la fila
       no re-ordena nada, solo cuenta. */
    if (a.abiertas !== null && a.abiertas > 0 && a.abiertaCitaId !== null) {
      atencionItems.push({
        clave: 'abiertas',
        icono: 'caso',
        titulo: a.abiertas === 1 ? t('atencion.abierta1') : t('atencion.abiertaN', { n: a.abiertas }),
        /* Lleva a la MÁS VIEJA. Si su cita no viaja (atención suelta sin
           cita), la fila NO se monta: una celda con chevron que no navega
           es un final mudo (Ley 23). */
        onPress: () =>
          router.push({ pathname: '/cita/[citaId]', params: { citaId: a.abiertaCitaId as string } }),
      });
    }
  }

  /* ── ⭐ S85-C23 · LOS TRES NÚMEROS (§2.4bis) ────────────────────────
     Ver la cabecera de `unidadesDelTecho` para la regla de la unidad.

     ⚠️ REGLA DE EXISTENCIA: sin citas hoy, el bloque NO SE MONTA. Un
     techo que dijera "0 · $0 · 0" pintaría el día libre como fracaso, y
     §15b ya lo prohíbe para el prestador (*vacío ≠ negocio muerto*). La
     forma del día YA dice lo que hay que decir cuando no hay nada. */
  const techo = ((): [ColumnaTecho, ColumnaTecho, ColumnaTecho] | null => {
    if (pantalla.estado !== 'listo' || citasHoySin.length === 0) return null;
    const u = unidadesDelTecho(pantalla.oficios);
    const n = citasHoySin.length;

    /* ① CARGA — tiempo si hay paseo; conteo si no. KEYS LITERALES, jamás
       armadas por concatenación: el diccionario está tipado para que una key
       inexistente rompa el typecheck, y un template lo apagaría con un cast. */
    const carga: ColumnaTecho =
      u.carga === 'tiempo'
        ? { valor: duracionCorta(minutosDeJornada(citasHoySin)), rotulo: t('techo.cargaEnRuta') }
        : {
            valor: String(n),
            rotulo:
              u.carga === 'citas'
                ? n === 1 ? t('techo.cargaCita1') : t('techo.cargaCitas')
                : u.carga === 'turnos'
                  ? n === 1 ? t('techo.cargaTurno1') : t('techo.cargaTurnos')
                  : u.carga === 'consultas'
                    ? n === 1 ? t('techo.cargaConsulta1') : t('techo.cargaConsultas')
                    : n === 1 ? t('techo.cargaSesion1') : t('techo.cargaSesiones'),
          };

    /* ② PLATA — TRES estados que NO se colapsan. La forma del contrato de B
       los distingue sola: los que tienen número son `valor+rotulo`; los que
       NO tienen número son `frase`, y el tipo no deja mezclarlos.
       *Antes esa distinción vivía en mi cabeza y en un ternario; ahora vive
       en el tipo.* */
    /* ⭐ S86-C · LA PLATA ES DEL DÍA EN VISTA, y la comparación de día es
       LO PRIMERO. `plata.dia !== diaVista` = todavía no llegó la lectura de
       ESTE día ⇒ el valor que tengo es de OTRO día y **no se muestra**.
       Conservarlo con el rótulo nuevo sería el defecto original con mejor
       letra: un número correcto para un día que nadie está mirando. */
    const p = plata !== null && plata.dia === diaVista ? plata.valor : undefined;
    const plataCol: ColumnaTecho =
      p === undefined
        ? { frase: t('techo.plataCargando'), detalle: t('techo.plataCargandoDetalle') }
        : p === null
          ? // Ley 13: el fallo dice fallo. NO se disfraza de "no te toca" (sería
            // mentirle al titular sobre su permiso) ni de vacío (se leería como 0).
            { frase: t('techo.plataNoSePudo'), detalle: t('techo.plataNoSePudoDetalle') }
          : !p.visible
            ? // EL HUECO HABLA DEL PERMISO, NO DEL DATO (§2.4bis). No falta
              // información: SOBRA AUDIENCIA.
              // ⚠️ Y el permiso NO depende del día: el gate del servidor es
              // `titular OR admin` y jamás mira la fecha (medido en el body).
              { frase: t('techo.plataSoloTitular'), detalle: t('techo.plataSoloTitularDetalle') }
            : {
                valor: montoCorto(p.total ?? 0),
                /* El total dice lo que sabe Y DECLARA LO QUE LE FALTA: con citas
                   sin precio, el rótulo NOMBRA el hueco. Esa defensa GANA sobre
                   el día: un total parcial es más urgente que saber de cuándo es
                   — y el día ya está dicho por la rueda, dos dedos más abajo.
                   ⭐ S86-C: sin hueco, el rótulo dice el DÍA. «del día» a secas
                   se leía como "hoy" pare donde pare la rueda, y en inglés lo
                   decía literal (`plataDelDia: 'today'`). */
                rotulo:
                  (p.sinPrecio ?? 0) > 0
                    ? t('techo.plataParcial', { n: p.sinPrecio ?? 0 })
                    : vistaEsHoy || diaVista === null
                      ? t('techo.plataDelDia')
                      : t('techo.plataDelDiaOtro', {
                          dia: `${diaCorto(diaVista)} ${diaVista.slice(8, 10)}`,
                        }),
              };

    /* ③ VIDAS — DISTINTAS, no filas. Tres perros de la misma casa son UN
       tutor; dos citas de la misma mascota son UNA mascota. Una cita sin
       mascota legible no suma y no inventa un "desconocido". */
    const llaves = new Set(
      citasHoySin
        .map((c) => (u.vidas === 'tutores' ? c.mascota?.familia_id : c.mascota?.id))
        .filter((k): k is string => typeof k === 'string' && k.length > 0),
    );
    const v = llaves.size;
    const vidas: ColumnaTecho = {
      valor: String(v),
      rotulo:
        u.vidas === 'tutores'
          ? v === 1 ? t('techo.vidasTutor1') : t('techo.vidasTutores')
          : u.vidas === 'pacientes'
            ? v === 1 ? t('techo.vidasPaciente1') : t('techo.vidasPacientes')
            : u.vidas === 'alumnos'
              ? v === 1 ? t('techo.vidasAlumno1') : t('techo.vidasAlumnos')
              : v === 1 ? t('techo.vidasMascota1') : t('techo.vidasMascotas'),
    };

    return [carga, plataCol, vidas];
  })();

  // ── La semana: 7 días desde hoy — citas firmes por día + estado del
  // día (bloqueado por vacaciones / libre). Cero métricas, solo verdad.
  const esPrimera = (mascotaId: string) =>
    pantalla.estado === 'listo' && !pantalla.atendidas.has(mascotaId);

  // S78-B: el HOY de recepción ES la Puerta — la composición entera
  // vive en su componente; el techo del oficio no aplica (su jornada no
  // es de oficio: es de la puerta del negocio).
  if (pantalla.estado === 'recepcion') {
    return (
      <AgendaRecepcion
        prestadorId={pantalla.prestadorId}
        cuentaComercialId={pantalla.cuentaComercialId}
        titularId={pantalla.titularId}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
      >
        {/* §15b.2 S61 (re-firma B11/B12): EL TECHO DEL OFICIO — muro
            tealDark, texto papel pleno, y el toggle Hoy/Semana COMPACTO
            integrado (el segmentado gemelo apilado MURIÓ).

            S71-B1 — EL TECHO ORIENTA LA JORNADA (hallazgo 2 del gate
            founder S70: el rótulo genérico "Tu jornada de hoy" reprobaba
            el test anti-genérico de Ley 15). Ahora: la persona · el
            negocio · la forma del día. El COLOR no se toca (§15b.2 v1.9
            re-firmada sobre píxeles) — el desvío era composición y copy.

            CHANEL (Ley 16): MURIÓ la fecha del techo. El sistema
            operativo ya la muestra, y ocupaba el único renglón de dato
            con algo que no ayuda a trabajar; su lugar lo toma la forma
            del día. ☠️ S85-C8: esta nota decía "la vista Semana rotula cada
            día por su nombre — no se pierde orientación en ningún lado", y
            esa vista MURIÓ. Hoy la orientación la da LA RUEDA, que rotula
            cada día con su nombre corto y su número. La nota se corrige en
            vez de dejarse: una prosa que cita una vista retirada manda a
            buscar algo que no existe. */}
        <TechoOficio
          titulo={saludo}
          dato={negocio}
          jornada={textoJornada}
          /* ⭐ S85-C23 — LOS TRES NÚMEROS (§2.4bis), en el slot que el
             techo ya tenía. `null` = sin citas hoy: el bloque NO EXISTE,
             y la forma del día sigue diciendo lo que hay que decir. */
          pie={techo === null ? undefined : <TresNumeros columnas={techo} />}
          /* S85-C27 — CRUDOS: la pieza compone y el techo pone la regla
             del muro. Esta pantalla solo pasa lo que el wrapper trajo. */
          cohorte={pantalla.estado === 'listo' ? pantalla.cohorte : null}
          cohorteAnio={pantalla.estado === 'listo' ? pantalla.cohorteAnio : null}
        />

        <View style={{ padding: spacing[4], gap: spacing[4] }}>

        {pantalla.estado === 'cargando' && (
          <Tarjeta elevacion="plana">
            <EsqueletoGrupo>
              <View style={{ gap: spacing[4] }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    <Esqueleto forma="circulo" alto={40} />
                    <View style={{ flex: 1, gap: spacing[2] }}>
                      <Esqueleto forma="linea" ancho="60%" />
                      <Esqueleto forma="linea" ancho="40%" />
                    </View>
                  </View>
                ))}
              </View>
            </EsqueletoGrupo>
          </Tarjeta>
        )}

        {/* ═══ S85-C30 · «NECESITA TU ATENCIÓN» ══════════════════════════

            El espejo de "Ponte al día" del cliente, del lado del prestador
            (S72-P1b). **OPERACIÓN, JAMÁS MÉTRICAS**: lo que espera una
            respuesta SUYA. El pulso del negocio vive en NEGOCIO —§15b y el
            argumento de privacidad de S72-P1a—, y este bloque no lo toca.

            ⚠️ REGLA DE EXISTENCIA: si no hay nada esperando, **el bloque no
            se monta**. Un "Necesita tu atención: 0" convierte estar al día
            en un renglón vacío que hay que leer para descartar. *La firma
            es la DESAPARICIÓN*, igual que en Ponte al día.

            ⚠️ Y UNA FUENTE QUE NO PUDO LEERSE **NO CUENTA COMO CERO**: su
            fila no se pinta, pero tampoco se afirma que no hay nada. Decir
            "estás al día" por un fallo de red es, acá, esconder trabajo
            pendiente — y sobre presupuestos sin responder eso es plata.

            LAS CUATRO FUENTES, completas: citas por coordinar ·
            presupuestos sin respuesta · autorizaciones esperando ·
            **atenciones sin cerrar**. ⏪ Mientras la cuarta no existió, acá
            vivía su declaración de hueco —*"este bloque no debería viajar
            en un OTA sin ella"*—, y el porqué era real: **una atención
            abierta de un día anterior no aparece en la jornada de hoy**, y
            una atención sin cerrar es PLATA SIN DEVENGAR. Llegó (A46), la
            fila existe, y el texto se mueve con su porqué (L-198). */}
        {pantalla.estado === 'listo' && (atencionItems.length > 0) && (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('atencion.titulo')}</Texto>
            <Tarjeta relleno="ninguno">
              {atencionItems.map((it, i) => (
                <View key={it.clave}>
                  {i > 0 ? <Separador /> : null}
                  <CeldaNavegacion icono={it.icono} titulo={it.titulo} registro="aa" onPress={it.onPress} />
                </View>
              ))}
            </Tarjeta>
          </View>
        )}

        {/* ── S79-B (T2-B1/B3): EL MODO PREPARACIÓN — §2.4 primera y
            tercera presencia. La FIRMA preside (mudanza del bloque de
            Cuenta, materiales de esta superficie) y "Prepara tu espacio"
            da el camino. Regla de existencia: solo mientras el espacio NO
            es reservable (servicios+horarios); preparado el espacio, el
            bloque entero muere solo. ── */}
        {pantalla.estado === 'listo' && pantalla.preparacion !== null && (
          <View style={{ gap: spacing[4] }}>
            <FirmaPrestador
              cohorteAnio={pantalla.estado === 'listo' ? pantalla.cohorteAnio : null}
              nombre={pantalla.nombreComercial}
              vozOficio={vozOficio(pantalla.oficios, t)}
              ciudad={pantalla.ciudad}
              logoUrl={resolverUrlLogoNegocio(pantalla.logoPath)}
            />
            <PreparaEspacio tareas={pantalla.preparacion} />
          </View>
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.status.dangerText,
                }}
              >
                {pantalla.mensaje}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {/* ── Zona 1 — ahora / lo siguiente (PRESIDE: encima de todo
            control e INMUNE al filtro — guard estructural S61-B12) ── */}
        {/* ⭐ S86-C · el gate ya NO es `vistaEsHoy`: es que la Zona 1 TENGA
            habitantes. Lo vivo la puebla desde hoy pare donde pare la rueda;
            «Lo siguiente» solo la puebla en hoy. La condición se mudó al
            cómputo, que es donde vive la regla. */}
        {pantalla.estado === 'listo' && zona1.length > 0 && (
          <View style={{ gap: spacing[2] }}>
            {/* S52-P7: etiqueta humanizada — sentence case, sin eyebrow.
                ⭐ S86-C: mirando otro día, el rótulo DECLARA la pertenencia
                («Ahora · hoy»). El hero se ve; la pantalla no afirma que algo
                corre en el jueves. */}
            <Texto variante="seccion">
              {hayVivo
                ? vistaEsHoy
                  ? t('agenda.ahora')
                  : t('agenda.ahoraHoy')
                : t('agenda.loSiguiente')}
            </Texto>
            {/* S59-B2 (Ley 19.1): el "Antes" a un tap es NAVEGACIÓN al
                expediente — viste CeldaNavegacion DENTRO de la tarjeta del
                hero (el botón ghost de solo texto murió: no decía que se
                toca ni a dónde va). Ícono 'carnet' = el expediente; la
                señal "Primera vez" (solo si es REAL) vive en el detalle. */}
            {/* S80-B14 ① (vigente por B15): UNA TARJETA = UNA CITA — la
                salida ya no comparte Tarjeta (el canto moría en el medio,
                donde no hay curva que lo justifique). Cada cita con su
                canto de punta a punta y su "Conocer" ADENTRO; el vivo
                real envuelve SU tarjeta con CitaEnVivo. */}
            <View style={{ gap: spacing[3] }}>
              {zona1.map((c) => {
                // S86-C (§7.5): CADA viva lleva su CitaEnVivo — no una.
                const viva = esViva(c);
                const mascota = c.mascota;
                const card = (
                  <FilaCita
                    cita={c}
                    enVivo={viva}
                    oficio={oficioDe(c)}
                    fotoUrl={mascota?.foto_url ? urlsFotos.get(mascota.foto_url) : undefined}
                    acciones={
                      mascota ? (
                        <>
                          <Separador />
                          <CeldaNavegacion
                            icono="carnet"
                            registro="aa"
                            titulo={t('agenda.conocerMascota', { nombre: mascota.nombre })}
                            detalle={esPrimera(mascota.id) ? t('agenda.primeraVez') : undefined}
                            onPress={() =>
                              router.push({ pathname: '/mascota/[mascotaId]', params: { mascotaId: mascota.id } })
                            }
                          />
                        </>
                      ) : undefined
                    }
                  />
                );
                return (
                  <View key={c.id}>
                    {viva ? <CitaEnVivo capa="cuidado">{card}</CitaEnVivo> : card}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ⭐ S85-C7 · TU DÍA — la rueda D3 y los chips, juntos.
            LA RUEDA ES DE B (`SelectorDia`, `0b229a6`) y se MONTA, no se
            re-dibuja: su escala, su opacidad y el acento del número viven
            en un WORKLET, así que el color viaja con el dedo. **Si eso se
            atara a estado de React llegaría tarde y la rueda dejaría de
            sentirse rueda** — es comportamiento, no estilo (advertencia de
            B, y por eso acá solo se le pasan datos).

            ⚠️ CERO FETCH NUEVO: el rango `hoy..hoy+6` ya se trae de una
            sola vez desde S57-B1, así que elegir otro día es un FILTRO
            sobre lo que ya está en memoria. La rueda no pide nada.

            SOLO EN LA VISTA HOY: en Semana el rango entero ya está a la
            vista, y montar las dos sería dos controles para el mismo
            trabajo. ⚠️ **Y ahí queda una pregunta que NO resuelvo yo:**
            con la rueda eligiendo día, la vista Semana pasa a solaparse
            con ella. No la retiro —nadie lo decidió— pero es candidata
            declarada para el gate. */}
        {pantalla.estado === 'listo' && desde !== null && (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('agenda.tuDia')}</Texto>
            {diaVistaBloqueado && (
              <View style={{ flexDirection: 'row' }}>
                <Insignia estado="info" etiqueta={t('agenda.diaBloqueado')} tamaño="sm" />
              </View>
            )}
            <SelectorDia
              dias={dias.map((iso) => ({
                iso,
                // el precedente de la casa, copiado del cliente (dos
                // consumidores ya lo hacen así): día corto por Intl según
                // idioma + el número del propio ISO.
                dia: diaCorto(iso),
                numero: iso.slice(8, 10),
              }))}
              // S86-C: el fallback es HOY (el default de la rueda), jamás
              // `desde`, que ahora es tres días atrás.
              elegido={diaVista ?? hoy ?? ''}
              cerrados={isoCerrados}
              etiquetaCerrado={t('agenda.diaCerrado')}
              onElegir={setDiaElegido}
            />
            {pantalla.estado === 'listo' && conFiltro && oficiosActivos !== null && (
              <FiltroOficio activo={filtroOficio} onCambio={setFiltroOficio} oficios={oficiosActivos} />
            )}
          </View>
        )}


        {/* ── M1 (S69-B): la entrada del MOSTRADOR — solo para negocio con
            oficio vet activo. Boton primario = accent.cta teal (cta="oficio"
            en la raíz). El walk-in registra EN EL MOMENTO. Glifo en el CTA:
            diferido (Icono no tiene variante on-cta; iría mal-color sobre
            el relleno teal — declarado). ── */}
        {pantalla.estado === 'listo' && oficiosActivos?.vet && (
          <Boton
            variante="primario"
            bloque
            etiqueta={t('mostrador.registrarAtencion')}
            onPress={() => router.push('/veterinaria/mostrador')}
          />
        )}

        {pantalla.estado === 'listo' && citasHoy.length === 0 && (
          // S52-P7b: registro sereno — el día vacío se dice en el
          // flujo, sin display que grite (dosis baja). S61-B5: el vacío
          // POR FILTRO dice su verdad (hay jornada, no de este servicio).
          hoyVacioPorFiltro ? (
            <EstadoVacio registro="seccion" titulo={t('agenda.filtroVacio')} />
          ) : citasHoySin.length === 0 && pantalla.preparacion === null ? (
            // v2b: voz honesta + camino a la semana (el mostrador vivo y "Por
            // coordinar" siguen abajo — el día vacío no los apaga).
            // S79-B (Chanel del boceto M1): EN MODO PREPARACIÓN esta voz
            // MUERE — prometía un disparo inalcanzable sin oferta; ahí
            // preside la firma + "Prepara tu espacio".
            <View style={{ gap: spacing[3] }}>
              <EstadoVacio registro="seccion" titulo={t('agenda.vacio')} descripcion={t('agenda.vacioDetalle')} />

            </View>
          ) : null
        )}

        {/* ── Zona 2 — el día (B14 ①: una tarjeta = una cita; los
            Separadores entre citas murieron con la Tarjeta compartida) ── */}
        {pantalla.estado === 'listo' && restoItems.length > 0 && (
          <View style={{ gap: spacing[3] }}>
            {restoItems.map((item) => (
              <View key={item.tipo === 'cita' ? item.cita.id : item.clave}>
                {item.tipo === 'cita' ? (
                  <FilaCita cita={item.cita} enVivo={false} oficio={oficioDe(item.cita)} fotoUrl={item.cita.mascota?.foto_url ? urlsFotos.get(item.cita.mascota.foto_url) : undefined} />
                ) : (
                  <FilaSalida
                    citas={item.citas}
                    abierta={salidasAbiertas.has(item.clave)}
                    onToggle={() => toggleSalida(item.clave)}
                    urlsFotos={urlsFotos}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── S70-B2-v2: POR COORDINAR — citas de presupuesto aprobado SIN
            fecha (D-439). NO desaparece con el día vacío (boceto v2b). Techo
            visual 3 + "Ver todas".

            S72-B (cura): el gate era `oficiosActivos?.vet && …`, y `oficios.vet`
            se computa de `servicios` — que EXCLUYE las filas 'otro'
            (veterinaria-oferta: los procedimientos salen por su propia clave).
            Un negocio que SOLO cotiza procedimientos por presupuesto tenía la
            bandeja entera invisible CON CITAS ADENTRO, y es el único camino a
            coordinar la fecha. El gate correcto no es el oficio: es que HAYA
            citas por coordinar — el propio lector ya devuelve vacío cuando no
            corresponde (corre con cuenta comercial, sin mirar oficio). ── */}
        {pantalla.estado === 'listo' && porCoordinar.length > 0 && (
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">
              {t('agenda.porCoordinarTitulo')}
            </Texto>
            <Tarjeta elevacion="sm" relleno="ninguno">
              {(verTodasCoord ? porCoordinar : porCoordinar.slice(0, 3)).map((pc, i) => {
                // S70-B2-v2 (acabado founder): la fila DICE el procedimiento —
                // condición del caso, o el nombre del servicio, o los ítems del
                // presupuesto; jamás el genérico repetido. Dos filas de la
                // misma mascota se distinguen a simple vista.
                const etiqueta =
                  pc.casoCondicion ??
                  pc.servicioNombre ??
                  (pc.items
                    .map((it) => it.descripcionLibre ?? it.tipoServicioCodigo)
                    .filter((s): s is string => !!s)
                    .join(' · ') ||
                    t('agenda.porCoordinarLibre'));
                return (
                <View key={pc.citaId}>
                  {i > 0 && <Separador />}
                  {/* S71 (ley founder del gate): el contorno MUERE como
                      acción de fila — "Fijar fecha" NAVEGA, así que baja a
                      label + chevron y la FILA ENTERA tapea (la vara:
                      cita/[citaId] con CeldaNavegacion). El chevron es el
                      canónico de la casa (path de CeldaNavegacion; ya
                      copiado en cliente/adiestramiento:92 — la primitiva
                      exportada queda como nota a la mesa).
                      S72-B: el total MUERE en esta celda de HOY — superficie
                      multi-actor; D-457 puso la plata en NEGOCIO gateada por
                      rol, y un total en la agenda la filtra a la recepción. El
                      precio congelado se ve en coordinar (dedicada), a la que
                      sigue viajando por param. */}
                  <Celda
                    interactiva
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/veterinaria/coordinar/[citaId]',
                        params: {
                          citaId: pc.citaId,
                          mascotaNombre: pc.mascotaNombre,
                          servicioNombre: pc.servicioNombre ?? '',
                          total: String(pc.totalCongelado),
                        },
                      })
                    }
                    titulo={pc.mascotaNombre}
                    subtitulo={etiqueta}
                    fin={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                        <Text
                          style={{
                            fontFamily: typography.family.sans.medium,
                            fontSize: typography.size.sm,
                            color: theme.text.secondary,
                          }}
                        >
                          {t('agenda.porCoordinarCta')}
                        </Text>
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
                          <Path
                            d="M9 18l6-6-6-6"
                            stroke={theme.text.tertiary}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    }
                  />
                </View>
                );
              })}
            </Tarjeta>
            {/* S71-B1 (E7) — el PIE de revelar: `Boton compacto` con el
                NÚMERO en la etiqueta. Mismo control que "Ya atendidas":
                un solo gesto, una sola voz, dos secciones que se leen
                igual (el ghost mudo murió). Candidato a diccionario 19.6. */}
            {porCoordinar.length > 3 && !verTodasCoord && (
              <Boton
                variante="compacto"
                etiqueta={t('agenda.verLasN', { n: porCoordinar.length })}
                onPress={() => setVerTodasCoord(true)}
              />
            )}
          </View>
        )}

        {/* ── S70-B2-v2: YA ATENDIDAS — lo pasado del día, plegado por
            default (acordeón). Lo que sigue vive arriba. ── */}
        {pantalla.estado === 'listo' && atendidasItems.length > 0 && (
          <View style={{ gap: spacing[2] }}>
            {/* S71-B1 (E7) — MURIÓ la Celda-como-encabezado: una celda
                promete navegar a algún lado, y esto pliega en su lugar.
                El header pasa a `Text` como en "Por coordinar" y en la
                Zona 1 (Ley 18: la estructura informa), y el control de
                revelar baja al PIE, igual que su hermana. */}
            {/* ⭐ S85-C37 — ☠️ MURIÓ EL BOTÓN «Ver las N». Literal del founder:
                *"las atendidas deben estar en filtro o algo, ese botón lo
                odio"*.

                **LA FORMA ELEGIDA, con las dos que descarto y por qué:**

                · **(a) un chip más en la hilera de filtros** (Todos ·
                  Paseos · Estética · Adiestramiento) — que es lo que él
                  nombró primero. **Se descarta porque MEZCLA DOS EJES en
                  un control:** esos chips filtran por OFICIO, y "atendidas"
                  es ESTADO. Un control con dos ejes obliga a preguntarse
                  qué pasa al combinarlos, y la casa ya pagó ese patrón
                  (Ley 6: tabs ≠ filtros).
                · **(b) disolver la sección y marcar el estado en la fila**
                  — más simple, y **rompe §15b**: *lo que sigue preside, lo
                  pasado se pliega*. Una jornada con ocho cerradas
                  enterraría las dos que faltan. *El plegado no era el
                  problema; el botón sí.*
                · **(c) ✅ EL ENCABEZADO ES EL CONTROL** — `SeccionDesplegable`,
                  la pieza que esta casa YA tiene para exactamente esto (la
                  usa el perfil). El bloque deja de tener un botón al pie y
                  pasa a plegarse desde su propio título, que es el gesto
                  que el usuario ya intentó. **Cero pieza nueva y cero
                  patrón nuevo** — el tercer patrón de plegado en la misma
                  app habría sido el verdadero defecto.

                Y el `resumen` de la pieza cobra su sentido acá: con la
                sección cerrada, el conteo ES el dato (§15b.3). */}
            <SeccionDesplegable
              titulo={t('agenda.yaAtendidasTitulo')}
              resumen={t('agenda.yaAtendidasResumen', { n: resto.filter(esAtendida).length })}
              abierta={atendidasAbierto}
              onAlternar={() => setAtendidasAbierto((v) => !v)}
            >
              <View style={{ gap: spacing[3] }}>
                {atendidasItems.map((item) => (
                  <View key={item.tipo === 'cita' ? item.cita.id : item.clave}>
                    {item.tipo === 'cita' ? (
                      <FilaCita cita={item.cita} enVivo={false} oficio={oficioDe(item.cita)} fotoUrl={item.cita.mascota?.foto_url ? urlsFotos.get(item.cita.mascota.foto_url) : undefined} />
                    ) : (
                      <FilaSalida citas={item.citas} abierta={salidasAbiertas.has(item.clave)} onToggle={() => toggleSalida(item.clave)} urlsFotos={urlsFotos} />
                    )}
                  </View>
                ))}
              </View>
            </SeccionDesplegable>
          </View>
        )}

        {/* ── La SEMANA (D-317): día → citas firmes, dosis baja. El día
            bloqueado por vacaciones se dice (dato, no juicio); las citas
            confirmadas de un día bloqueado SIGUEN — el bloqueo jamás las
            toca (P14/P16). El día sin nada es "Libre": verdad de
            planificación, no métrica en cero. ── */}
        {/* ☠️ S85-C8 — ACÁ VIVÍA LA VISTA SEMANA, y muere con su lápida
            (orden de la mesa; Ley 37).

            POR QUÉ: la rueda hace su elección y mejor. Un toggle Hoy/Semana
            MÁS una rueda de días son **dos controles para la misma
            decisión** — la mezcla que este rediseño vino a matar.

            ⚠️ QUÉ MOSTRABA QUE LA RUEDA NO, declarado ANTES de retirarla
            porque eso era la condición de la orden:
             · **el bloqueo por vacaciones**, con su insignia por día. **SE
               CONSERVA**: las vacaciones entran a los apagados de la rueda
               (ver `isoCerrados`) y el día elegido dice POR QUÉ está
               bloqueado (la insignia de arriba). *Nada se pierde acá.*
             · **el barrido de los SIETE días de una sola mirada** — ver la
               semana entera sin tocar nada. **ESO SÍ SE PIERDE, y a
               propósito**: es exactamente lo que la mesa decidió que la
               rueda reemplaza. Se dice para que quede como decisión y no
               como descuido.
             · **la voz "libre" por día vacío** — se pierde como voz DE LA
               SEMANA; el día elegido conserva su propio vacío.

            ☠️ Y con la vista se van: el toggle del techo, el parámetro
            `vista` de `formaDelDia` con su rama 'semana', el arreglo `dias`
            y el botón "ver la semana" del vacío. */}

        {/* ── Zona 3 — novedades: hueco estructural (ver arriba) ── */}
        {novedadesZona3 !== null ? null : null}

        {/* ── Zona 4 — tu trabajo con dignidad: liquidaciones son B2 y
            el motor de hitos de trayectoria (§2.7) no existe → la zona
            NO existe hoy. JAMÁS métricas en cero. ── */}

        {/* ── S79-B (T2-B4) · §2.5 EL MÓDULO ASPIRACIONAL — texto sobrio
            al pie, no banner, sin acción. Los 15 SON la comunidad (decisión
            founder); la sección Comunidad sigue oculta por letra §2.6. ── */}
        {pantalla.estado === 'listo' && (
          <Texto variante="apoyo">{t('agenda.aspiracional')}</Texto>
        )}
        </View>
      </ScrollView>
      {/* S59-B1: el velo de tinta — la zona de la barra de estado JAMÁS
          queda blanca, ni cuando el techo scrollea (regla del pedido). */}
      <VeloBarraEstadoOficio />
    </View>
  );
}
