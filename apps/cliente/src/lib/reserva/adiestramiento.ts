/**
 * EL FLUJO DE RESERVA DE ADIESTRAMIENTO — una fuente, dos consumidores.
 *
 * ── POR QUÉ EXISTE (D-730, opción ① firmada por el founder) ─────────────────
 * Hasta hoy, «Reservar» en la ficha del prestador **no reservaba**: dejaba un
 * pedido en `senal-reserva` y volvía a la lista, que era la única que sabía
 * reservar. Eso se veía como un parpadeo —la pantalla que va y viene sin que
 * nadie la pidiera— y costaba, medido, **3 a 5 viajes de red por reserva**, de
 * los cuales ninguno sobrevivía a la navegación al checkout.
 *
 * La salida NO podía ser clonar el flujo en la ficha: la segunda verdad
 * divergiría sola, que es lo que `senal-reserva.ts` rechazó desde el principio
 * y con razón. La salida es ésta: **el flujo vive UNA vez, acá, y lo consumen
 * la lista y la ficha.**
 *
 * ── LA PROPIEDAD DE SEGURIDAD QUE ESTE ARCHIVO TIENE QUE CONSERVAR ──────────
 * El P0 de S92-BIS se cayó tres veces por lo mismo: **un guard que leía estado
 * capturado en el render** en vez del valor de ahora. Su cura fue derivar la
 * fase de los datos y leer un espejo vivo.
 *
 * Acá ese peligro **no existe por construcción, y es a propósito**: la oferta
 * entra como ARGUMENTO de `reservarSesion(o)` / `elegirPrograma(o)`. Este hook
 * **no lee la lista**, no la conoce, no puede tener una copia vieja de ella. Lo
 * único que captura son los params de la URL, que no cambian mientras la
 * pantalla vive.
 *
 * *Si algún día alguien mueve acá adentro el estado de la lista, vuelve a
 * abrirse la puerta que el P0 usó tres veces — y esta nota es el aviso.*
 *
 * ── QUÉ NO HACE ────────────────────────────────────────────────────────────
 * No decide QUÉ oferta se reserva (eso es de quien lo llama: la fila tocada o
 * la ficha abierta) ni recarga listas: para el conflicto de slot avisa por
 * `alConflicto`, y **cada consumidor sabe qué significa recargar en su casa** —
 * la lista vuelve a pedir sus ofertas, la ficha vuelve a resolver la suya.
 */

import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useAviso } from '@epetplace/ui';
import { crearBloqueoAgenda, type OfertaAdiestrador } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

export interface ContextoAdiestramiento {
  fecha: string;
  hora: string;
  mascotaId: string;
  mascotaNombre: string;
}

export function useReservaAdiestramiento(
  ctx: ContextoAdiestramiento,
  /** El slot se ocupó mientras el usuario miraba: quien llama decide qué
   *  volver a pedir. Opcional — sin él, el aviso ya dijo la verdad. */
  alConflicto?: () => void,
) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [creandoHold, setCreandoHold] = useState(false);

  // SESIÓN: el hold del chasis compartido (invisible al prestador hasta
  // que el pago confirme) → checkout compartido con la voz del oficio.
  const reservarSesion = useCallback(
    async (o: OfertaAdiestrador) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: o.prestador_id,
        prestador_servicio_id: o.prestador_servicio_id,
        mascota_id: ctx.mascotaId,
        fecha: ctx.fecha,
        hora: ctx.hora,
      });
      setCreandoHold(false);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') alConflicto?.();
        return;
      }
      router.push({
        pathname: '/explorar/adiestramiento/checkout',
        params: {
          citaId: r.data.cita_id,
          expiraEn: r.data.expira_en,
          precio: String(r.data.precio),
          prestadorNombre: o.prestador_nombre,
          servicioNombre: vozServicio(t, o.tipo_servicio, o.nombre) ?? o.nombre,
          fecha: r.data.fecha,
          hora: r.data.hora,
          duracion: String(r.data.duracion_minutos),
          direccion: o.direccion ?? '',
          ciudad: o.ciudad ?? '',
        },
      });
    },
    [creandoHold, ctx.fecha, ctx.hora, ctx.mascotaId, t, mostrar, alConflicto],
  );

  // PROGRAMA: sin hold — el resumen §12.2 primero, la compra atómica allá.
  const elegirPrograma = useCallback(
    (o: OfertaAdiestrador) => {
      if (o.programa_id === null || o.n_sesiones === null || o.vigencia_dias === null) return;
      router.push({
        pathname: '/explorar/adiestramiento/confirmar-programa',
        params: {
          prestadorId: o.prestador_id,
          servicioId: o.prestador_servicio_id,
          programaId: o.programa_id,
          mascotaId: ctx.mascotaId,
          mascotaNombre: ctx.mascotaNombre,
          fecha: ctx.fecha,
          hora: ctx.hora,
          programaNombre: o.nombre,
          nivel: o.nivel ?? '',
          nSesiones: String(o.n_sesiones),
          vigenciaDias: String(o.vigencia_dias),
          precio: String(o.precio),
          duracion: String(o.duracion_minutos),
          prestadorNombre: o.prestador_nombre,
        },
      });
    },
    [ctx.fecha, ctx.hora, ctx.mascotaId, ctx.mascotaNombre],
  );

  return { reservarSesion, elegirPrograma, creandoHold };
}
