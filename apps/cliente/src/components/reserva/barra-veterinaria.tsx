/**
 * LA BARRA DE RESERVA DE LA FICHA — veterinaria.
 *
 * Hermana de `barra-{adiestramiento,grooming}`, con lo propio del oficio: acá
 * la reserva puede tener que **preguntar con quién** (LETRA_VITRINA, S78-A7), y
 * esa pregunta **también vive en la ficha**. No se recortó: reservar desde la
 * ficha ofrece exactamente lo mismo que reservar desde la lista, porque las dos
 * montan el mismo flujo (`lib/reserva/veterinaria`) y la misma Hoja
 * (`hoja-personas-vet`). *Dejar el selector afuera habría sido más barato y
 * habría convertido una cura de performance en una pérdida de producto.*
 *
 * ── LOS DOS DATOS, EN UNA SOLA OLA ─────────────────────────────────────────
 * La oferta y la vitrina se piden **en paralelo**: son independientes —la
 * segunda solo necesita el id del prestador, que ya está— y encadenarlas
 * pagaría dos idas y vueltas donde alcanza una. Es la lección de esta misma
 * sesión aplicada mientras se escribe: *el paralelismo es gratis; el
 * encadenamiento se paga entero.*
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AvisoTeleconsulta, Boton } from '@epetplace/ui';
import {
  obtenerVeterinariosDisponibles,
  obtenerVitrinaNegocios,
  type VeterinarioDisponible,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useReservaVeterinaria } from '@/lib/reserva/veterinaria';
import { HojaPersonasVet } from '@/components/reserva/hoja-personas-vet';

export function BarraVeterinaria({
  prestadorId,
  ofertaId,
  fecha,
  hora,
  mascotaId,
  tipoServicio,
}: {
  prestadorId: string;
  ofertaId: string;
  fecha: string;
  hora: string;
  mascotaId: string;
  tipoServicio: string;
}) {
  const { t } = useTraduccion();
  const [oferta, setOferta] = useState<VeterinarioDisponible | null | 'resolviendo'>('resolviendo');
  const [vitrina, setVitrina] = useState<Record<string, boolean> | null>(null);
  const esDomicilio = tipoServicio === 'urgencia_domicilio';

  const resolver = () => {
    setOferta('resolviendo');
    void Promise.all([
      obtenerVeterinariosDisponibles({ fecha, hora, tipo_servicio: tipoServicio, mascota_id: mascotaId }),
      obtenerVitrinaNegocios([prestadorId]),
    ]).then(([r, rv]) => {
      setVitrina(rv.ok ? rv.data : null);
      if (!r.ok) return setOferta(null);
      setOferta(r.data.find((v) => v.prestador_servicio_id === ofertaId) ?? null);
    });
  };

  useEffect(resolver, [prestadorId, ofertaId, fecha, hora, mascotaId, tipoServicio]);

  const {
    tocarNegocio,
    crearHold,
    creandoHold,
    abriendoSelector,
    hojaPersonas,
    cerrarHoja,
    personaElegida,
    elegirPersona,
    personaRebotada,
    avisoAbierto,
    consentimientoMarcado,
    marcarConsentimiento,
    cerrarAviso,
    irAUrgencias,
    reservarPresencial,
    continuarTrasAviso,
  } = useReservaVeterinaria({ fecha, hora, mascotaId, tipoServicio, esDomicilio, vitrina }, resolver);

  return (
    <View>
      <Boton
        variante="primario"
        bloque
        etiqueta={t('perfilPrestador.reservar')}
        cargando={oferta === 'resolviendo' || creandoHold || abriendoSelector !== null}
        deshabilitado={oferta === null}
        onPress={() => {
          if (oferta === null || oferta === 'resolviendo') return;
          void tocarNegocio(oferta);
        }}
      />
      <HojaPersonasVet
        estado={hojaPersonas}
        onCerrar={cerrarHoja}
        personaElegida={personaElegida}
        onElegir={elegirPersona}
        personaRebotada={personaRebotada}
        creandoHold={creandoHold}
        onConfirmar={(negocio, persona) => void crearHold(negocio, persona)}
      />
      {/* EL AVISO §3 — bloqueante, antes del hold (LETRA_TELEMEDICINA v1.1) */}
      <AvisoTeleconsulta
        visible={avisoAbierto}
        onCerrar={cerrarAviso}
        texto={{
          titulo: t('veterinaria.avisoTeleTitulo'),
          intro: t('veterinaria.avisoTeleParaQue'),
          advertencia: t('veterinaria.avisoTeleNoReemplaza'),
          signosIntro: t('veterinaria.avisoTeleSignosIntro'),
          /* LOS SEIS. La tupla de B no compila con cinco — es el candado que
             convirtió una discrepancia de prosa en un error de compilación. */
          signos: [
            t('veterinaria.avisoTeleSigno1'),
            t('veterinaria.avisoTeleSigno2'),
            t('veterinaria.avisoTeleSigno3'),
            t('veterinaria.avisoTeleSigno4'),
            t('veterinaria.avisoTeleSigno5'),
            t('veterinaria.avisoTeleSigno6'),
          ],
          signosCierre: t('veterinaria.avisoTeleSignosCierre'),
          transito: t('veterinaria.avisoTeleTransito'),
          consentimiento: t('veterinaria.avisoTeleConsentimiento'),
        }}
        acciones={{
          urgencias: { etiqueta: t('veterinaria.avisoTeleIrUrgencias'), onPress: irAUrgencias },
          presencial: { etiqueta: t('veterinaria.avisoTelePresencial'), onPress: reservarPresencial },
          continuar: { etiqueta: t('veterinaria.avisoTeleContinuar'), onPress: continuarTrasAviso },
        }}
        /* Desmarcada por defecto: habilita SOLO «Continuar». Las dos salidas
           quedan siempre disponibles — *nadie tiene que marcar una casilla
           para irse a urgencias.* */
        consentimiento={{ marcado: consentimientoMarcado, onCambio: marcarConsentimiento }}
      />    </View>
  );
}
