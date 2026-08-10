/**
 * EL FLUJO DE RESERVA DE GROOMING — una fuente, dos consumidores.
 *
 * Hermano de `lib/reserva/adiestramiento`: su cabecera tiene el porqué largo
 * (D-730, opción ① firmada) y la propiedad de seguridad que los dos conservan
 * — **la oferta entra como ARGUMENTO, así que este hook no lee estado de
 * ninguna lista y no puede tener una copia vieja de ella**. Esa es la puerta
 * que el P0 de S92-BIS usó tres veces, y acá está cerrada por construcción.
 *
 * Lo propio de este oficio: la `modalidad` (local o domicilio) viaja al hold
 * **y** al checkout, junto con el desglose que resolvió el servidor
 * (`precio_base`, `extra_pelaje`, `recargo_domicilio`) — S61-A6: el checkout
 * los DECLARA, jamás los recalcula.
 */

import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useAviso } from '@epetplace/ui';
import { crearBloqueoAgenda, type GroomerDisponible } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

export interface ContextoGrooming {
  fecha: string;
  hora: string;
  mascotaId: string;
  tipoServicio: string;
  modalidad: 'local' | 'domicilio';
}

export function useReservaGrooming(ctx: ContextoGrooming, alConflicto?: () => void) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [creandoHold, setCreandoHold] = useState(false);

  const crearHold = useCallback(
    async (g: GroomerDisponible) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: g.prestador_id,
        prestador_servicio_id: g.prestador_servicio_id,
        mascota_id: ctx.mascotaId,
        fecha: ctx.fecha,
        hora: ctx.hora,
        modalidad: ctx.modalidad,
      });
      setCreandoHold(false);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') alConflicto?.();
        return;
      }
      router.push({
        pathname: '/explorar/grooming/checkout',
        params: {
          citaId: r.data.cita_id,
          expiraEn: r.data.expira_en,
          precio: String(r.data.precio),
          prestadorNombre: g.prestador_nombre,
          servicioNombre: vozServicio(t, ctx.tipoServicio, g.servicio_nombre) ?? g.servicio_nombre,
          fecha: r.data.fecha,
          hora: r.data.hora,
          duracion: String(r.data.duracion_minutos),
          direccion: g.direccion ?? '',
          ciudad: g.ciudad ?? '',
          // S61-A6: la modalidad y EL DESGLOSE server-side viajan al
          // checkout — se declaran, jamás se calculan allá.
          modalidad: ctx.modalidad,
          precioBase: String(g.precio_base),
          extraPelaje: String(g.extra_pelaje),
          recargoDomicilio: String(g.recargo_domicilio),
        },
      });
    },
    [creandoHold, ctx.fecha, ctx.hora, ctx.mascotaId, ctx.tipoServicio, ctx.modalidad, t, mostrar, alConflicto],
  );

  return { crearHold, creandoHold };
}
