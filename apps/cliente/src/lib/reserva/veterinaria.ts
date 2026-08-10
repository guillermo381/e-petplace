/**
 * EL FLUJO DE RESERVA DE VETERINARIA — una fuente, dos consumidores.
 *
 * Hermano de `lib/reserva/{adiestramiento,grooming}`: el porqué largo está en
 * la cabecera del primero (D-730, opción ① firmada por el founder).
 *
 * ── POR QUÉ ESTE ES EL ÚNICO DE LOS TRES SIMPLES QUE TIENE ESTADO ──────────
 * Los otros dos son `oferta → hold → checkout` y nada más. Éste tiene una
 * decisión en el medio: **con quién se atiende**. Si el negocio expone su
 * equipo y hay 2+ personas ofertables, la reserva se detiene y pregunta
 * (LETRA_VITRINA, S78-A7).
 *
 * Por eso el hook posee el estado de esa Hoja y lo DEVUELVE, en vez de
 * dibujarla: **la unidad que se extrae es el FLUJO, no la Hoja** (letra de
 * D-730). Las dos superficies montan `<HojaPersonasVet>` con lo que este hook
 * les da, así que la pregunta se hace igual en las dos y **el rebote
 * `persona_no_disponible` tiene una sola implementación**.
 *
 * ── LA PROPIEDAD DE SEGURIDAD, IGUAL QUE SUS HERMANOS ──────────────────────
 * La oferta entra como ARGUMENTO. El hook **no lee la lista de disponibles**;
 * el único estado que posee es el de su propia Hoja, que él mismo escribe y
 * lee en el mismo render. No hay copia de datos ajenos que pueda quedar vieja
 * — que es la puerta por la que el P0 de S92-BIS entró tres veces.
 *
 * ── LO QUE SÍ NECESITA DE AFUERA, y por qué se pide en vez de leerse ───────
 * `vitrina` (qué negocios exponen su equipo) lo trae quien llama: la lista lo
 * pide junto con la disponibilidad, la ficha junto con su oferta. Pedirlo acá
 * obligaría a este hook a saber CUÁNTOS negocios hay en pantalla, que es
 * justamente lo que no debe saber.
 */

import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useAviso } from '@epetplace/ui';
import {
  crearBloqueoAgenda,
  obtenerPersonasQueAtienden,
  type PersonaQueAtiende,
  type VeterinarioDisponible,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

export interface ContextoVeterinaria {
  fecha: string;
  hora: string;
  mascotaId: string;
  tipoServicio: string;
  esDomicilio: boolean;
  /** Qué negocios exponen su equipo. `null` = no se pudo leer ⇒ se degrada al
   *  camino de siempre (sin preguntar), que es la degradación declarada en M1. */
  vitrina: Record<string, boolean> | null;
}

export interface HojaPersonasEstado {
  negocio: VeterinarioDisponible;
  personas: PersonaQueAtiende[];
}

export function useReservaVeterinaria(ctx: ContextoVeterinaria, alConflicto?: () => void) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [creandoHold, setCreandoHold] = useState(false);
  const [abriendoSelector, setAbriendoSelector] = useState<string | null>(null);
  const [hojaPersonas, setHojaPersonas] = useState<HojaPersonasEstado | null>(null);
  const [personaElegida, setPersonaElegida] = useState('cualquiera');
  const [personaRebotada, setPersonaRebotada] = useState(false);

  // El hold nace acá: invisible al prestador hasta que el pago confirme.
  // S78-A7: si la familia ELIGIÓ persona, viaja al motor — que la FIJA o
  // rebota `persona_no_disponible` (jamás cae en otra en silencio).
  const crearHold = useCallback(
    async (v: VeterinarioDisponible, persona?: PersonaQueAtiende) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: v.prestador_id,
        prestador_servicio_id: v.prestador_servicio_id,
        mascota_id: ctx.mascotaId,
        fecha: ctx.fecha,
        hora: ctx.hora,
        ...(persona !== undefined ? { empleado_id: persona.empleadoId } : null),
      });
      setCreandoHold(false);
      if (!r.ok) {
        // VARA 2 — `persona_no_disponible` tiene SU cara, jamás la de
        // slot_ocupado: son dos verdades ("no hay lugar" vs "quien
        // elegiste no puede, pero el negocio sí"). Vive DENTRO de la
        // Hoja, con sus dos caminos.
        if (r.codigo === 'persona_no_disponible') {
          setPersonaRebotada(true);
          return;
        }
        setHojaPersonas(null);
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') alConflicto?.();
        // urgencia que cruzó la medianoche: el CUÁNDO recalcula HOY
        if (r.codigo === 'urgencia_solo_hoy') router.back();
        return;
      }
      setHojaPersonas(null);
      router.push({
        pathname: '/explorar/veterinaria/checkout',
        params: {
          citaId: r.data.cita_id,
          expiraEn: r.data.expira_en,
          precio: String(r.data.precio),
          prestadorNombre: v.prestador_nombre,
          servicioNombre: vozServicio(t, ctx.tipoServicio, v.servicio_nombre) ?? v.servicio_nombre,
          fecha: r.data.fecha,
          hora: r.data.hora,
          duracion: String(r.data.duracion_minutos),
          direccion: v.direccion ?? '',
          ciudad: v.ciudad ?? '',
          modalidad: ctx.esDomicilio ? 'domicilio' : 'local',
          // §8 LETRA_TURNOS (la mitad "confirmación"): si eligió, se dice.
          ...(persona !== undefined
            ? { personaNombre: persona.nombre ?? t('veterinaria.integranteEquipo') }
            : null),
        },
      });
    },
    [creandoHold, ctx.fecha, ctx.hora, ctx.mascotaId, ctx.tipoServicio, ctx.esDomicilio, t, mostrar, alConflicto],
  );

  // S78-A7 — el tap: la Hoja SOLO si hay elección real.
  // "Ofertable" = chip + JORNADA (vara 1): `obtener_personas_que_atienden`
  // trae a propósito al que tiene chip sin jornada (dato del PRESTADOR,
  // D-540 visible) — la familia jamás lo ve: se filtra acá, y el conteo
  // del colapso N=1 corre sobre lo filtrado (Ley 23: no se ofrece a
  // alguien sin horarios).
  const tocarNegocio = useCallback(
    async (v: VeterinarioDisponible) => {
      if (creandoHold || abriendoSelector !== null) return;
      if (ctx.vitrina?.[v.prestador_id] !== true) {
        void crearHold(v);
        return;
      }
      setAbriendoSelector(v.prestador_servicio_id);
      const r = await obtenerPersonasQueAtienden(v.prestador_id, v.prestador_servicio_id);
      setAbriendoSelector(null);
      const ofertables = r.ok ? r.data.filter((per) => per.tieneJornada) : [];
      if (ofertables.length < 2) {
        // colapso N=1 (o fallo de lectura, degradación declarada en M1):
        // el camino de siempre — la puerta no pregunta lo que ya sabe.
        void crearHold(v);
        return;
      }
      setPersonaElegida('cualquiera');
      setPersonaRebotada(false);
      setHojaPersonas({ negocio: v, personas: ofertables });
    },
    [creandoHold, abriendoSelector, ctx.vitrina, crearHold],
  );

  return {
    tocarNegocio,
    crearHold,
    creandoHold,
    abriendoSelector,
    hojaPersonas,
    cerrarHoja: () => setHojaPersonas(null),
    personaElegida,
    elegirPersona: (codigo: string) => {
      setPersonaElegida(codigo);
      setPersonaRebotada(false);
    },
    personaRebotada,
  };
}
