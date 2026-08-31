/**
 * LA BARRA DE RESERVA DE LA FICHA — paseo.
 *
 * La más grande de las cuatro, y por la razón que D-730 midió: **el paseo es el
 * único oficio donde la mascota se elige en el último paso**, así que reservar
 * puede tener que elegir mascota, preguntar la norma social, ofrecer el saldo
 * del paquete o abrir el plan. Las seis Hojas se montan acá, con el mismo flujo
 * que usaba la lista — porque es literalmente el mismo (`lib/reserva/paseo`).
 *
 * ── LO QUE ESTA BARRA NO RECORTÓ, y podría haberlo hecho ───────────────────
 * Habría sido más rápido dejar que la ficha reservara «derecho» y mandar los
 * casos raros de vuelta a la lista. Eso habría convertido una cura de
 * performance en una pérdida de producto, y habría dejado dos verdades sobre
 * cómo se reserva un paseo. **Se monta el flujo entero o no se monta nada.**
 *
 * ── DE DÓNDE SALE LA OFERTA ────────────────────────────────────────────────
 * Del MISMO lector que usa la lista, con los params de la ventana — igual que
 * sus tres hermanas, y por las mismas tres razones: una sola fuente de verdad,
 * URL reconstruible, y la verdad de AHORA (si el slot se ocupó mientras el
 * usuario miraba fotos, el botón lo sabe antes de que lo toque).
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Boton, useAviso } from '@epetplace/ui';
import { obtenerPaseadoresDisponibles, type PaseadorDisponible } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useReservaPaseo } from '@/lib/reserva/paseo';
import { HojasPaseo } from '@/components/reserva/hojas-paseo';

export function BarraPaseo({
  ofertaId,
  fecha,
  hora,
  duracion,
  modoPlan,
  mascotaIdParam,
}: {
  ofertaId: string;
  fecha: string;
  hora: string;
  duracion: number;
  modoPlan: boolean;
  mascotaIdParam: string | null;
}) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [oferta, setOferta] = useState<PaseadorDisponible | null | 'resolviendo'>('resolviendo');

  const resolver = () => {
    setOferta('resolviendo');
    void obtenerPaseadoresDisponibles({ fecha, hora, duracion_minutos: duracion }).then((r) => {
      if (!r.ok) return setOferta(null);
      setOferta(r.data.find((p) => p.prestador_servicio_id === ofertaId) ?? null);
    });
  };

  useEffect(resolver, [ofertaId, fecha, hora, duracion]);

  const flujo = useReservaPaseo({ fecha, hora, duracion, modoPlan, mascotaIdParam }, resolver);

  return (
    <View>
      <Boton
        variante="primario"
        bloque
        etiqueta={t('perfilPrestador.reservar')}
        cargando={oferta === 'resolviendo' || flujo.creandoHold || flujo.reservando}
        deshabilitado={oferta === null}
        onPress={() => {
          if (oferta === null || oferta === 'resolviendo') return;
          flujo.alElegir(oferta);
        }}
      />
      <HojasPaseo
        /* ☠️ S109-C · Acá se pasaba `onContratadoPlan`: el toast de éxito y el
           Go home del plan. **Murió con el acto** — hoy el plan se contrata en
           `/explorar/paseo/checkout-plan`, que tiene su propio éxito y su propio
           camino de vuelta. *Un callback de éxito que sobrevive al acto que lo
           disparaba queda esperando un evento que ya no ocurre.* */
        flujo={flujo}
        fecha={fecha}
        hora={hora}
        duracion={duracion}
      />
    </View>
  );
}
