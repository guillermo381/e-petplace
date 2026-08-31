/**
 * EL CHECKOUT DEL PLAN MENSUAL DE PASEO — S109-C · ②.
 *
 * ═══ 🔴 POR QUÉ ES UNA PANTALLA Y NO SIGUE SIENDO UNA HOJA ════════════════
 *
 * Firma del founder: **una Hoja se arrastra hacia abajo.** Mientras la plata se
 * mueve, la familia puede cerrarla con el dedo y no hay a dónde volver — *y esto
 * es una espera que cambia sola.* Además el checkout de la casa ya sostiene
 * espera, reintento y reanudación para cuatro sujetos: **ensanchar la Hoja sería
 * reimplementar todo eso en algo más angosto.**
 *
 * ⇒ La Hoja **configura** (días, hora, frecuencia, renovación) y esta pantalla
 * **cobra**. Es el mismo corte que guardería: la pantalla 4 elige, el checkout
 * paga.
 *
 * ═══ ⚠️ LO QUE HOY NO PUEDE HACER, DECLARADO ══════════════════════════════
 *
 * **Todavía no cobra**, y no por falta de pantalla: medido contra el repo en
 * `59816672`, `SujetoDeCobro` **no tiene un valor para `suscripciones_servicio`**
 * y la edge `pagos-cobro` **no lee ese sujeto** (cero menciones de
 * `suscripcion_servicio`). *Construir el `cobrar()` contra un riel que no existe
 * sería escribir una llamada que nadie puede atender.*
 *
 * Por eso la banda de simulación **se queda y dice la verdad**, y la fase de
 * espera existe con la voz de lo que de verdad está pasando hoy —armar el
 * plan—. **El día que el sujeto exista, el cambio es: `cobrar()` antes de la
 * fase, `useEsperaDeConfirmacion` adentro, y la voz pasa a hablar del banco.**
 * La pantalla, sus tres avisos y su éxito no se tocan.
 *
 * ═══ LOS TRES AVISOS, ANTES DE PAGAR ══════════════════════════════════════
 * Firma del founder, y van **en esta misma pantalla sin abrir nada más**:
 * qué día se cobra cada mes · que se avisa 3 días antes por correo · y que
 * **este plan SE PAUSA, NO SE CANCELA.**
 *
 * 🔴 **La asimetría se dice con todas las letras.** El plan de guardería se
 * cancela; éste se pausa y se puede volver a encender. *Un «gestionar» ambiguo
 * que disimule la diferencia es peor que no decir nada: hace creer que las dos
 * cosas son la misma, y la familia descubre cuál tiene el día que quiere irse.*
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton, Celda, Encabezado, EsperaDeTrabajo, EstadoVacio, Icono,
  PantallaConPie, Separador, Tarjeta, Texto, spacing, useAviso, useTheme,
} from '@epetplace/ui';
import { contratarPlanPaseo } from '@epetplace/api';

/* El vocabulario del motor, tal cual (`planes.ts:117`). No se exporta desde el
   paquete, así que se declara acá con su fuente citada — *inventarlo más ancho
   dejaría pasar una frecuencia que el server rebota.* */
type Frecuencia = 'semanal' | 'quincenal' | 'mensual';

import { simula } from '@/lib/pagos/simulado';
import { useTraduccion } from '@/i18n';

export default function CheckoutPlanPaseo() {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams();
  const texto = (k: string): string => (typeof params[k] === 'string' ? (params[k] as string) : '');

  const dias = texto('dias').split(',').filter((x) => x.length > 0).map(Number);
  const precio = Number(texto('precioMensual'));

  /* `procesando` NO es el vuelo de la RPC: es la fase que la familia mira. Hoy
     dice que estamos armando el plan —que es lo que pasa—; el día que haya
     cobro, dice que estamos confirmando con el banco. */
  const [fase, setFase] = useState<'resumen' | 'procesando' | 'exito'>('resumen');
  const [rebote, setRebote] = useState<string | null>(null);

  const contratar = useCallback(async () => {
    if (fase !== 'resumen') return;
    setFase('procesando');
    setRebote(null);
    const r = await contratarPlanPaseo({
      prestador_id: texto('prestadorId'),
      prestador_servicio_id: texto('prestadorServicioId'),
      mascota_id: texto('mascotaId'),
      dias,
      hora: texto('hora'),
      frecuencia: texto('frecuencia') as Frecuencia,
      auto_renovar: texto('renueva') === '1',
    });
    if (!r.ok) {
      /* 🔴 Se queda en el resumen con TODO lo elegido — *lo que la familia
         quiere después de un rebote es corregir, no rehacer.* Y la razón se lee
         en palabras: el wrapper ya trae su mensaje tipado, nunca un código. */
      setFase('resumen');
      setRebote(r.mensaje);
      return;
    }
    setFase('exito');
  }, [fase, dias, t]);

  if (fase === 'procesando') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4], padding: spacing[6] }}>
          {/* El nombre de lo que se está comprando, quieto y centrado. */}
          <Texto variante="titulo">{t('checkoutPlan.esperaTitulo')}</Texto>
          <Texto variante="cuerpo">{t('checkoutPlan.esperaCuerpo')}</Texto>
          {/* La rampa que trabaja — la MISMA de la casa: pulso sobrio, sin
              rebotes ni confeti, y sin botón de reintentar en los primeros
              segundos (no hay ninguno acá: la pantalla cambia sola). */}
          <EsperaDeTrabajo />
        </View>
      </SafeAreaView>
    );
  }

  if (fase === 'exito') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('checkoutPlan.exitoTitulo')}
            /* El comprobante en palabras de familia: qué compró, no un id. */
            descripcion={t('checkoutPlan.exitoDetalle', { precio: precio.toFixed(2) })}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => {
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar/paseos');
                }}
              />
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" atras titulo={t('checkout.titulo')} onAtras={() => router.back()} />
      <PantallaConPie
        contentContainerStyle={{ padding: spacing[4], gap: spacing[4], paddingBottom: insets.bottom + spacing[4] }}
        pie={
          <Boton
            variante="primario"
            bloque
            /* El sufijo «(simulado)» **sale del mismo mapa que la banda**: no
               puede quedar uno sin el otro, que es exactamente lo que me pasó
               con el programa. */
            etiqueta={`${t('plan.contratar')}${simula('plan_paseo') ? t('pago.sufijoSimulado') : ''}`}
            onPress={() => void contratar()}
          />
        }
      >
        <Texto variante="seccion">{t('checkout.resumen')}</Texto>
        <Tarjeta relleno="ninguno">
          <Celda
            titulo={t('checkoutPlan.servicio')}
            subtitulo={t('checkout.conPrestador', { prestador: texto('prestadorNombre') })}
            metadataMono={`${dias.length}×/sem · ${texto('hora').slice(0, 5)}`}
          />
          <Separador />
          <Celda titulo={t('checkout.total')} metadataMono={`$${precio.toFixed(2)}`} />
        </Tarjeta>

        {/* ═══ 🔴 LOS TRES AVISOS — en esta pantalla, sin abrir nada más ═══ */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('checkoutPlan.antesDePagar')}</Texto>
          <Texto variante="cuerpo">{t('checkoutPlan.cuandoSeCobra')}</Texto>
          <Texto variante="cuerpo">{t('checkoutPlan.avisoPrevio')}</Texto>
          {/* La asimetría, con todas las letras. */}
          <Texto variante="cuerpo">{t('checkoutPlan.sePausaNoSeCancela')}</Texto>
        </View>

        {/* ⭐ **YA NO SE ESCRIBE A MANO: SE DERIVA.** El día que el plan cobre,
            `simula('plan_paseo')` pasa a `false` y **esta banda desaparece sola**
            — junto con el sufijo del botón, desde la misma línea. */}
        {simula('plan_paseo') ? <Texto variante="apoyo">{t('checkout.simuladoAviso')}</Texto> : null}

        {rebote !== null ? <Texto variante="cuerpo">{rebote}</Texto> : null}
      </PantallaConPie>
    </SafeAreaView>
  );
}
