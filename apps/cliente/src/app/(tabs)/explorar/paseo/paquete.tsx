/**
 * PAQUETE — ELEGIR PASEADOR Y COMPRAR (S57, enmienda v1.4 §6bis.2bis:
 * COMPRAR NO ES RESERVAR — esta pantalla no sabe de fechas ni horas).
 * Entra desde el chip del CUÁNDO (con la duración elegida) y desde el
 * hub "Mis paseos" (renovación: llega filtrada al ancla del paquete).
 *
 * CAPA DE CRAFT (Leyes 14-16, declaradas):
 *  · TESIS: "Comprás salidas por adelantado con un paseador real —
 *    sin agendar nada todavía."
 *  · FIRMA: la invitación post-compra ("¿Reservás tu primera salida?")
 *    — comportamiento con consecuencia visible: la compra no te suelta
 *    en un vacío, te ofrece el paso natural sin obligarte.
 *  · CHANEL: la pantalla NO repite la ventana del CUÁNDO (no hay
 *    fecha/hora que mostrar — se quitó la Celda de contexto que el
 *    QUIÉN sí lleva) ni muestra el precio suelto en la lista: un dato
 *    por fila, el que importa acá (precio por salida en paquete).
 *
 * ESCALERA (§4b): peldaño 0 = nadie ofrece paquetes para esa duración
 * (voz honesta con camino, §6ter); peldaño 1 = ofertas reales; peldaño
 * 2 = datos del expediente: NINGUNO (compra pura, explícito).
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Icono,
  Separador,
  Tarjeta,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerPaseadoresConPaquete,
  type PaqueteComprado,
  type PaseadorConPaquete,
} from '@epetplace/api';
import { PaqueteHoja } from '@/components/paquete-hoja';
import { useTraduccion } from '@/i18n';

export default function PaqueteComprar() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ duracion?: string; servicio?: string }>();
  const duracion = typeof params.duracion === 'string' ? Number(params.duracion) : undefined;
  const servicioId = typeof params.servicio === 'string' ? params.servicio : undefined;

  const [lista, setLista] = useState<PaseadorConPaquete[] | 'cargando' | 'error'>('cargando');
  const [elegido, setElegido] = useState<PaseadorConPaquete | null>(null);
  const [comprado, setComprado] = useState<PaqueteComprado | null>(null);

  const cargar = useCallback(() => {
    setLista('cargando');
    void obtenerPaseadoresConPaquete({
      duracion_minutos: duracion,
      prestador_servicio_id: servicioId,
    }).then((r) => setLista(r.ok ? r.data : 'error'));
  }, [duracion, servicioId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('paquete.pantallaTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[3] }}>
        {lista === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : lista === 'error' ? (
          <EstadoVacio
            titulo={t('explorar.paseadoresError')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : lista.length === 0 ? (
          // Peldaño 0 (§6ter): jamás final mudo — vuelta al CUÁNDO.
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('paquete.nadieOfrece')}
            descripcion={t('paquete.nadieOfreceDetalle')}
            accion={<Boton variante="primario" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {lista.map((p, i) => (
              <View key={p.prestador_servicio_id}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  titulo={p.prestador_nombre}
                  subtitulo={p.servicio_nombre}
                  metadataMono={`$${p.precio_paquete.toFixed(2)} · ${p.duracion_minutos} min`}
                  interactiva
                  accessibilityRole="button"
                  onPress={() => setElegido(p)}
                />
              </View>
            ))}
          </Tarjeta>
        )}
      </ScrollView>

      {/* La compra — anclada al paseador ELEGIDO, sin mascota ni fecha */}
      <Hoja
        visible={elegido !== null && comprado === null}
        titulo={t('paquete.hojaTitulo')}
        onCerrar={() => setElegido(null)}
        conCerrar
      >
        {elegido !== null && comprado === null ? (
          <PaqueteHoja
            paseador={elegido}
            onComprado={(c) => {
              setComprado(c);
            }}
          />
        ) : null}
      </Hoja>

      {/* LA FIRMA: la invitación opcional a la primera reserva (v1.4) —
          dos caminos parejos, cero presión */}
      <Hoja
        visible={comprado !== null}
        titulo={t('paquete.primeraTitulo')}
        onCerrar={() => {
          setComprado(null);
          if (router.canDismiss()) router.dismissAll();
          router.navigate('/hogar/paseos');
        }}
        conCerrar
      >
        {comprado !== null ? (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Celda
              titulo={t('paquete.exito', { n: comprado.saldo_total })}
              subtitulo={t('paquete.primeraVoz')}
            />
            <Boton
              variante="primario"
              bloque
              etiqueta={t('paquete.primeraReservar')}
              onPress={() => {
                setComprado(null);
                mostrar({ texto: t('paquete.saldoActivo', { n: comprado.saldo_total }), variante: 'exito' });
                router.dismissTo('/explorar/paseo');
              }}
            />
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('paquete.primeraDespues')}
              onPress={() => {
                setComprado(null);
                if (router.canDismiss()) router.dismissAll();
                router.navigate('/hogar/paseos');
              }}
            />
          </View>
        ) : null}
      </Hoja>
    </SafeAreaView>
  );
}
