/**
 * «OFRECER SERVICIOS» — la mitad que faltaba de una puerta de doble mano
 * (D-829, hallazgo del founder EN EL GATE).
 *
 * ── EL DEFECTO, en una línea ─────────────────────────────────────────────
 * **La puerta existe y vive en un camino que una de las dos poblaciones no
 * pisa jamás.** `solicitarNaturalezaComercial` acepta las DOS naturalezas
 * desde S97, pero su ÚNICO caller es el paso ② del wizard del alta: el
 * groomer lo recorre —y por eso puede pedir ventas—, y **el vendedor puro
 * nunca lo vio**, porque su alta fue por función. *No falta motor: falta
 * la celda.*
 *
 * Letra del founder: *«igual como el groomer puede activar servicio de
 * ventas y entra en revisión, el de despensa también debería poder
 * solicitar la activación de esos servicios»*.
 *
 * ── LO QUE ESTA CELDA NO HACE, y es lo que la vuelve honesta ─────────────
 * · **No activa nada.** Pedir ≠ tener: el estado `solicitada` **no lo mira
 *   ningún lector de permisos** (el cinturón de S97 lo prueba), y la
 *   activación de servicios es la maquinaria del alta de prestador —geo,
 *   radio, credencial si es vet— que **hoy es acto del founder**. La celda
 *   lo DICE en vez de insinuar que con un toque ya vende paseos.
 * · **No se dibuja si ya la tiene.** Con `prestador_servicios` activa esta
 *   celda no tiene nada que ofrecer, y una celda que ofrece lo que ya
 *   tenés enseña a desconfiar de la pantalla.
 * · **No inventa el estado.** Si el lector falla, **no se dibuja** — jamás
 *   un «pedilo» que mande a pedir de nuevo algo ya pedido.
 * · **Granularidad gruesa a propósito** (§4 de la ficha): se pide la
 *   NATURALEZA, no el oficio. Al activarse, los oficios se configuran como
 *   los de cualquier prestador — no nace un eje nuevo por servicio.
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Boton, Tarjeta, Texto, spacing } from '@epetplace/ui';
import {
  obtenerNaturalezasDeCuenta,
  solicitarNaturalezaComercial,
  type EstadoNaturaleza,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export interface CeldaOfrecerServiciosProps {
  cuentaComercialId: string;
}

export function CeldaOfrecerServicios({ cuentaComercialId }: CeldaOfrecerServiciosProps) {
  const { t } = useTraduccion();
  /** `null` = todavía no se sabe (o el lector falló) ⇒ NO se dibuja. */
  const [estado, setEstado] = useState<EstadoNaturaleza | null>(null);
  const [pidiendo, setPidiendo] = useState(false);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerNaturalezasDeCuenta(cuentaComercialId);
        if (!vigente) return;
        if (!r.ok) {
          /* Un fallo NO se degrada a «ninguna»: eso ofrecería pedir algo
             que quizá ya está pedido. Se calla y queda en el log. */
          console.error('[ofrecer-servicios] no se pudo leer:', r.mensaje);
          return;
        }
        const fila = r.data.find((n) => n.naturaleza === 'prestador_servicios');
        setEstado(fila?.estado ?? 'ninguna');
      })();
      return () => {
        vigente = false;
      };
    }, [cuentaComercialId, intento]),
  );

  // Ya la tiene: no hay nada que ofrecer. O no se sabe: no se inventa.
  if (estado === null || estado === 'activa') return null;

  return (
    <Tarjeta relleno="normal" elevacion="reposo">
      <View style={{ gap: spacing[3] }}>
        <Texto variante="seccion">{t('ventas.servicios.titulo')}</Texto>

        {estado === 'solicitada' ? (
          /* PEDIDO ≠ ACTIVO, y la voz lo dice: sin esta frase el vendedor
             cree que ya puede ofrecer paseos y se entera el día que una
             familia no lo encuentra. */
          <Texto variante="cuerpo" color="secondary">
            {t('ventas.servicios.enRevision')}
          </Texto>
        ) : (
          <>
            <Texto variante="cuerpo" color="secondary">
              {t('ventas.servicios.detalle')}
            </Texto>
            <Boton
              variante="secundario"
              bloque
              cargando={pidiendo}
              etiqueta={t('ventas.servicios.cta')}
              onPress={() => {
                if (pidiendo) return;
                setPidiendo(true);
                void solicitarNaturalezaComercial(cuentaComercialId, 'prestador_servicios').then(
                  (r) => {
                    setPidiendo(false);
                    if (!r.ok) {
                      console.error('[ofrecer-servicios] no se pudo pedir:', r.mensaje);
                      return;
                    }
                    /* El wrapper devuelve `yaLaTiene`/`yaEstabaPedida`: en
                       los tres casos la verdad la dice el LECTOR, así que
                       se re-lee en vez de pintar un optimismo local. */
                    setIntento((n) => n + 1);
                  },
                );
              }}
            />
          </>
        )}
      </View>
    </Tarjeta>
  );
}
