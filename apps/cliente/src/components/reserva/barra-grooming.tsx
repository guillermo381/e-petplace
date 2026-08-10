/**
 * LA BARRA DE RESERVA DE LA FICHA — grooming.
 *
 * Hermana de `barra-adiestramiento`: su cabecera tiene el porqué largo (D-730,
 * opción ① firmada), por qué la oferta se resuelve por el MISMO lector que la
 * lista en vez de viajar por params, y por qué mientras resuelve el botón
 * espera y si la oferta ya no está queda deshabilitado (Ley 23, sin inventar
 * copy que nadie gateó).
 */

import { useEffect, useState } from 'react';
import { Boton } from '@epetplace/ui';
import { obtenerGroomersDisponibles, type GroomerDisponible } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useReservaGrooming } from '@/lib/reserva/grooming';

export function BarraGrooming({
  ofertaId,
  fecha,
  hora,
  mascotaId,
  tipoServicio,
  modalidad,
}: {
  ofertaId: string;
  fecha: string;
  hora: string;
  mascotaId: string;
  tipoServicio: string;
  modalidad: 'local' | 'domicilio';
}) {
  const { t } = useTraduccion();
  const [oferta, setOferta] = useState<GroomerDisponible | null | 'resolviendo'>('resolviendo');

  const resolver = () => {
    setOferta('resolviendo');
    void obtenerGroomersDisponibles({
      fecha,
      hora,
      tipo_servicio: tipoServicio,
      mascota_id: mascotaId,
      modalidad,
    }).then((r) => {
      if (!r.ok) return setOferta(null);
      setOferta(r.data.find((g) => g.prestador_servicio_id === ofertaId) ?? null);
    });
  };

  useEffect(resolver, [ofertaId, fecha, hora, mascotaId, tipoServicio, modalidad]);

  const { crearHold, creandoHold } = useReservaGrooming(
    { fecha, hora, mascotaId, tipoServicio, modalidad },
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
        void crearHold(oferta);
      }}
    />
  );
}
