/**
 * LA BARRA DE RESERVA DE LA FICHA — adiestramiento.
 *
 * ── QUÉ CAMBIA HOY (S109-C, firma del founder) ─────────────────────────────
 * **La barra deja de recibir el comprable ya decidido y pasa a OFRECERLOS.**
 *
 * ⏪ Recibía `comprable: 'sesion' | 'programa'` y resolvía con
 * `find(o => o.prestador_servicio_id === ofertaId && o.comprable === comprable)`.
 *
 * 🔴 **Y eso era un desempate accidental, no una elección** — medido en el
 * motor: `prestador_programas.prestador_servicio_id` es una FK a
 * `prestador_servicios`, así que **la sesión suelta y TODOS los programas de un
 * adiestrador comparten la misma `ps.id`**. Con dos programas, ese `find`
 * devolvía **el primero** y el segundo era **inalcanzable desde la vitrina, en
 * silencio**.
 *
 * *No se notaba porque la lista entregaba el programa ya elegido: el `find`
 * acertaba por CÓMO llegaba la llamada, no por lo que preguntaba.* En el momento
 * en que la lista pasó a llevar al PRESTADOR —primero el quién— el acierto por
 * accidente se habría vuelto una oferta que esconde la mitad de sí misma.
 *
 * ── LA FORMA QUE RIGE ──────────────────────────────────────────────────────
 * `comprable` **ausente = ofrecé todo lo que este adiestrador tiene.** Con una
 * sola cosa el botón la toma directo —*una Hoja para elegir entre una opción es
 * una pregunta que ya tiene respuesta*—; con dos o más, abre la elección.
 *
 * ⚠️ Se conserva `comprable` como filtro OPCIONAL: quien entre desde una fila
 * que ya decidió (si algún día vuelve a existir) sigue funcionando igual.
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
 * Mientras resuelve, el botón espera. Si no queda ninguna oferta, **queda
 * deshabilitado**: no se inventa un cartel nuevo —eso sería copy sin gate— ni
 * se deja un botón que promete y rebota.
 *
 * *Y no lee estado de ninguna lista: las ofertas que entrega son las que él
 * mismo resolvió. Es la propiedad que mantiene lejos el P0 de S92-BIS.*
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Boton, Celda, Hoja, HojaScroll, Separador, spacing } from '@epetplace/ui';
import { obtenerAdiestradoresDisponibles, type OfertaAdiestrador } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useReservaAdiestramiento } from '@/lib/reserva/adiestramiento';
import { vozOfertaAdiestramiento } from '@/lib/adiestramiento-voz';

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
  /** Ausente = **ofrecé todo**. Presente = filtrá a ese comprable. */
  comprable?: 'sesion' | 'programa';
}) {
  const { t } = useTraduccion();
  /* `'resolviendo'` y `[]` son estados DISTINTOS y la Ley 13 los separa: el
     primero espera, el segundo apaga el botón. *Colapsarlos en «vacío» haría
     que un bache de red se lea como «este adiestrador no ofrece nada».* */
  const [ofertas, setOfertas] = useState<OfertaAdiestrador[] | 'resolviendo'>('resolviendo');
  const [eligiendo, setEligiendo] = useState(false);

  const resolver = () => {
    setOfertas('resolviendo');
    void obtenerAdiestradoresDisponibles(fecha, hora, mascotaId).then((r) => {
      if (!r.ok) return setOfertas([]);
      setOfertas(
        r.data.filter(
          (o) =>
            o.prestador_servicio_id === ofertaId &&
            (comprable === undefined || o.comprable === comprable),
        ),
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

  /** Una sola verdad para los dos caminos: el toque directo y el de la Hoja. */
  const tomar = (o: OfertaAdiestrador) => {
    setEligiendo(false);
    if (o.comprable === 'programa') elegirPrograma(o);
    else void reservarSesion(o);
  };

  const lista = ofertas === 'resolviendo' ? [] : ofertas;

  return (
    <>
      <Boton
        variante="primario"
        bloque
        etiqueta={t('perfilPrestador.reservar')}
        cargando={ofertas === 'resolviendo' || creandoHold}
        deshabilitado={lista.length === 0}
        onPress={() => {
          if (ofertas === 'resolviendo' || lista.length === 0) return;
          /* 🔴 **Con UNA sola, no se pregunta.** *Una Hoja para elegir entre una
             opción es una pregunta que ya tiene respuesta, y le cobra un toque
             a todos los adiestradores que ofrecen una sola cosa.* */
          if (lista.length === 1) { tomar(lista[0]); return; }
          setEligiendo(true);
        }}
      />
      <Hoja
        visible={eligiendo}
        titulo={t('adiestramiento.elegiQue')}
        onCerrar={() => setEligiendo(false)}
        conCerrar
      >
        <HojaScroll>
          <View style={{ paddingBottom: spacing[2] }}>
            {lista.map((o, i) => (
              <View key={`${o.comprable}-${o.programa_id ?? 'sesion'}`}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  titulo={vozOfertaAdiestramiento(o, t)}
                  subtitulo={t('adiestramiento.duracionMin', { n: String(o.duracion_minutos) })}
                  metadataMono={`$${o.precio.toFixed(2)}`}
                  interactiva
                  accessibilityRole="button"
                  onPress={() => tomar(o)}
                />
              </View>
            ))}
          </View>
        </HojaScroll>
      </Hoja>
    </>
  );
}
