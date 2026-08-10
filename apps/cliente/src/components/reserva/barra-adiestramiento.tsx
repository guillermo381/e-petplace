/**
 * LA BARRA DE RESERVA DE LA FICHA — adiestramiento.
 *
 * ── QUÉ CAMBIA HOY (D-730, opción ① firmada) ───────────────────────────────
 * Hasta ahora el botón de la ficha **no reservaba**: dejaba un pedido en
 * `senal-reserva` y volvía a la lista, que reservaba por él. Eso se veía como
 * un parpadeo y costaba, medido, 3 viajes de red por reserva — ninguno de los
 * cuales sobrevivía a la navegación al checkout. **Ahora reserva acá.**
 *
 * ── DE DÓNDE SALE LA OFERTA, Y POR QUÉ NO VIAJA POR PARAMS ─────────────────
 * Reservar necesita el OBJETO de oferta (prestador, servicio, precio, duración,
 * dirección), no solo su id. Mandarlo entero por la URL serían diez params que
 * hay que mantener sincronizados con el lector; y peor, sería un dato
 * **congelado en el momento en que se abrió la ficha**.
 *
 * Se resuelve por el MISMO lector que usa la lista, con los params de la
 * ventana. Eso da tres cosas de una: **una sola fuente de verdad** (si el
 * lector cambia, cambian las dos superficies), **una URL reconstruible** (la
 * ficha funciona si se entra directo, sin la lista detrás), y **la verdad de
 * AHORA** — si el slot se ocupó mientras el usuario miraba fotos, el botón lo
 * sabe antes de que lo toque.
 *
 * ── LA PUERTA NO OFRECE LO QUE VA A RECHAZAR (Ley 23) ──────────────────────
 * Mientras resuelve, el botón espera. Si la oferta ya no está, **queda
 * deshabilitado**: no se inventa un cartel nuevo —eso sería copy sin gate— ni
 * se deja un botón que promete y rebota.
 *
 * *Y no lee estado de ninguna lista: la oferta que entrega es la que él mismo
 * resolvió. Es la propiedad que mantiene lejos el P0 de S92-BIS.*
 */

import { useEffect, useState } from 'react';
import { Boton } from '@epetplace/ui';
import { obtenerAdiestradoresDisponibles, type OfertaAdiestrador } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useReservaAdiestramiento } from '@/lib/reserva/adiestramiento';

export function BarraAdiestramiento({
  ofertaId,
  fecha,
  hora,
  mascotaId,
  mascotaNombre,
  comprable,
}: {
  ofertaId: string;
  fecha: string;
  hora: string;
  mascotaId: string;
  mascotaNombre: string;
  comprable: 'sesion' | 'programa';
}) {
  const { t } = useTraduccion();
  const [oferta, setOferta] = useState<OfertaAdiestrador | null | 'resolviendo'>('resolviendo');

  const resolver = () => {
    setOferta('resolviendo');
    void obtenerAdiestradoresDisponibles(fecha, hora, mascotaId).then((r) => {
      if (!r.ok) return setOferta(null);
      setOferta(
        r.data.find((o) => o.prestador_servicio_id === ofertaId && o.comprable === comprable) ?? null,
      );
    });
  };

  useEffect(resolver, [ofertaId, fecha, hora, mascotaId, comprable]);

  const { reservarSesion, elegirPrograma, creandoHold } = useReservaAdiestramiento(
    { fecha, hora, mascotaId, mascotaNombre },
    // El slot se ocupó al intentar: se vuelve a resolver, y si ya no está el
    // botón se apaga solo. No hay lista a la que volver.
    resolver,
  );

  return (
    <Boton
      variante="primario"
      bloque
      etiqueta={t('perfilPrestador.reservar')}
      cargando={oferta === 'resolviendo' || creandoHold}
      deshabilitado={oferta === null}
      onPress={() => {
        if (oferta === null || oferta === 'resolviendo') return;
        if (comprable === 'programa') elegirPrograma(oferta);
        else void reservarSesion(oferta);
      }}
    />
  );
}
