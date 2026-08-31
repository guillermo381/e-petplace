/**
 * PAGAR LA MENSUALIDAD — el destino del LINK MENSUAL (S109-C).
 *
 * ═══ 🔴 QUIÉN LLEGA ACÁ, Y POR QUÉ ESO DECIDE TODO ════════════════════════
 *
 * **Una persona que abrió un correo para pagar.** No alguien navegando la app.
 * Firma del founder: *«le doy al botón y caigo DIRECTO en la pantalla del
 * código — no en el inicio, no en un menú, no en un checkout con pasos»*.
 *
 * ⇒ Tres consecuencias que no son estéticas:
 * · **El código se pide AL ENTRAR**, no detrás de un botón. *Un paso más entre
 *   el correo y los seis dígitos es un paso que no tiene por qué existir: la
 *   intención ya se declaró al tocar el correo.* (Y sí: pedir el código **crea
 *   un intento** contra el proveedor — acá eso es exactamente lo que se vino a
 *   hacer, a diferencia de un checkout, donde abrir la pantalla no es querer
 *   pagar.)
 * · **Qué se paga va ARRIBA DE TODO y en palabras de familia.** Llegó desde un
 *   correo y puede no acordarse de qué se trata: *un código de seis dígitos sin
 *   decir qué se está pagando le pide a alguien que mueva plata a ciegas.*
 * · **Cero navegación.** No hay tabs, no hay volver a un menú. Termina o se
 *   sale.
 *
 * ═══ ⚠️ LO QUE ESTA PANTALLA NO DECIDE, Y ESTÁ ESPERANDO FIRMA ════════════
 *
 * **Si la ruta exige sesión iniciada.** Hoy lee por sesión —como todas las
 * pantallas de la casa— y por eso vive en `pagos/`, junto al alta de tarjeta.
 * *Si la firma dice que se entra sin sesión, lo que cambia es el CAMINO DEL
 * DATO —haría falta leer por un token del link, no por RLS—; la forma, la voz y
 * la espera no se tocan.* **No se resolvió acá a propósito.**
 *
 * ⚠️ Y el link NO se emite desde el cliente: el correo y su ruta son del motor.
 * Esta pantalla es sólo su destino.
 */

import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Boton, Celda, Esqueleto, EstadoVacio, Icono, Tarjeta, Texto, spacing, useTheme,
} from '@epetplace/ui';
import { obtenerMisPlanesGuarderia, type PlanGuarderia } from '@epetplace/api';
import { fechaLargaHumana, obtenerIdiomaActual } from '@epetplace/i18n';

import { EsperaDeUna } from '@/components/espera-deuna';
import { topeDeEspera, useEstadoDeUna } from '@/lib/pagos/deuna-estado';
import { useEsperaDeConfirmacion } from '@/lib/pagos/espera-confirmacion';
import { urlWhatsApp } from '@/lib/contacto';
import { useTraduccion } from '@/i18n';

export default function PagarMensualidad() {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const router = useRouter();
  const idioma = obtenerIdiomaActual();
  const params = useLocalSearchParams();
  const suscripcionId = typeof params.suscripcionId === 'string' ? params.suscripcionId : '';

  const [plan, setPlan] = useState<PlanGuarderia | 'cargando' | 'noPudimos'>('cargando');
  const [pagado, setPagado] = useState(false);

  useEffect(() => {
    let vigente = true;
    void obtenerMisPlanesGuarderia().then((r) => {
      if (!vigente) return;
      if (!r.ok) { setPlan('noPudimos'); return; }
      const mio = r.data.find((x) => x.suscripcionId === suscripcionId);
      /* 🔴 Un plan que no aparece NO se disfraza de fallo de red, y tampoco se
         pinta un código sobre un sujeto que no encontramos. */
      setPlan(mio ?? 'noPudimos');
    });
    return () => { vigente = false; };
  }, [suscripcionId]);

  /* El código se pide **apenas hay sujeto**: quien llegó, llegó a pagar. */
  const listo = plan !== 'cargando' && plan !== 'noPudimos';
  const deuna = useEstadoDeUna(listo && !pagado ? { tipo: 'mensualidad', id: suscripcionId } : null);
  const espera = useEsperaDeConfirmacion(
    listo && !pagado ? { tipo: 'mensualidad', id: suscripcionId } : null,
    topeDeEspera(deuna.estado),
  );

  useEffect(() => {
    if (espera.fase === 'resuelta' && espera.estado === 'activa') setPagado(true);
  }, [espera]);

  if (pagado) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            icono={<Icono nombre="guarderia" tamano={48} />}
            titulo={t('linkMensual.exitoTitulo')}
            descripcion={t('linkMensual.exitoDetalle')}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => router.replace('/hogar/guarderia')}
              />
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <View style={{ flex: 1, padding: spacing[5], gap: spacing[5] }}>
        {/* ⭐ **QUÉ SE PAGA, ARRIBA DE TODO.** No es un encabezado decorativo:
            es lo que le falta a quien viene de un correo. */}
        {plan === 'cargando' ? (
          <Esqueleto alto={72} />
        ) : plan === 'noPudimos' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('linkMensual.noPudimosTitulo')}
            descripcion={t('linkMensual.noPudimosDetalle')}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            <Celda
              titulo={t('linkMensual.concepto')}
              subtitulo={plan.prestadorNombre}
              metadataMono={`$${plan.precioMensual.toFixed(2)}`}
            />
            {/* El período **sólo si el motor lo dice**: sin él no se nombra un
                mes inventado. */}
            {plan.periodoDesde !== null ? (
              <Celda
                titulo={t('linkMensual.periodo')}
                subtitulo={fechaLargaHumana(plan.periodoDesde, idioma)}
              />
            ) : null}
          </Tarjeta>
        )}

        {/* La pantalla del código, **la misma de siempre**: no se rediseña. */}
        {listo ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EsperaDeUna
              estado={deuna.estado}
              /* «Se me venció» se resuelve ACÁ MISMO, sin volver al correo — y
                 sin que parezca que hizo algo mal. */
              onGenerarNuevo={deuna.regenerar}
              onSoporte={() => void Linking.openURL(urlWhatsApp(t('cuenta.soporteDesdeCobro')))}
            />
            {/* El tope habla y **no declara desenlace**: el pago puede estar en
                camino y el barrido lo resuelve. */}
            {espera.fase === 'sigue_abierta' ? (
              <Texto variante="apoyo">{t('pago.esperaSigueAbiertaCita')}</Texto>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
