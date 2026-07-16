/**
 * ADIESTRAMIENTO — LA CONFIRMACIÓN DEL PROGRAMA (S63-A Bloque 3, pieza
 * NUEVA del flujo — §12.2 exige que el dueño entienda ANTES de pagar
 * que compromete N fechas de una sola vez). Sin hold: la compra es
 * ATÓMICA en contratar_programa (si una fecha no cabe, nada nace y el
 * error tipado dice por qué). El pago es simulado y DECLARADO (patrón
 * del checkout compartido; Kushki pendiente).
 *
 * TESIS: "Sabés exactamente qué compromete tu compra —N fechas, una
 * por semana, con vigencia— antes de tocar Pagar."
 * FIRMA: la declaración de las N sesiones en voz humana ANTES del CTA
 * (la pantalla existe para eso; el precio no preside — el compromiso sí).
 */

import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  EstadoVacio,
  Icono,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { contratarPrograma, type ProgramaContratado } from '@epetplace/api';
import { useTraduccion } from '@/i18n';

/** 'YYYY-MM-DD' → Date LOCAL (jamás new Date(iso): ancla UTC y corre el
 *  día — hallazgo de harness S55). */
function fechaLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export default function ConfirmarPrograma() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    prestadorId: string;
    servicioId: string;
    programaId: string;
    mascotaId: string;
    mascotaNombre?: string;
    fecha: string;
    hora: string;
    programaNombre: string;
    nivel: string;
    nSesiones: string;
    vigenciaDias: string;
    precio: string;
    duracion: string;
    prestadorNombre: string;
  }>();

  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  const nSesiones = Number(params.nSesiones ?? 0);
  const vigenciaDias = Number(params.vigenciaDias ?? 0);
  const precio = Number(params.precio ?? 0);

  const [fase, setFase] = useState<'resumen' | 'procesando' | 'exito'>('resumen');
  const [compra, setCompra] = useState<ProgramaContratado | null>(null);

  const fmtHumana = useMemo(
    () =>
      new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [idioma],
  );

  // la última sesión estimada (la VERDAD la devuelve el server al
  // comprar; acá solo se anticipa la misma aritmética de cadencia)
  const ultimaEstimada = useMemo(() => {
    if (fecha.length === 0 || nSesiones < 1) return null;
    const d = fechaLocal(fecha);
    d.setDate(d.getDate() + (nSesiones - 1) * 7);
    return fmtHumana.format(d);
  }, [fecha, nSesiones, fmtHumana]);

  const comprar = async () => {
    if (fase !== 'resumen') return;
    setFase('procesando');
    const r = await contratarPrograma({
      prestadorId: typeof params.prestadorId === 'string' ? params.prestadorId : '',
      servicioId: typeof params.servicioId === 'string' ? params.servicioId : '',
      programaId: typeof params.programaId === 'string' ? params.programaId : '',
      mascotaId: typeof params.mascotaId === 'string' ? params.mascotaId : '',
      fechaInicio: fecha,
      hora,
    });
    if (!r.ok) {
      setFase('resumen');
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setCompra(r.data);
    setFase('exito');
  };

  if (fase === 'exito' && compra !== null) {
    const fmt = fmtHumana;
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            icono={<Icono nombre="training" tamano={48} />}
            titulo={t('adiestramiento.programaExitoTitulo')}
            descripcion={t('adiestramiento.programaExitoDetalle', {
              n: String(compra.n_sesiones),
              primera: fmt.format(fechaLocal(compra.primera_sesion)),
              ultima: fmt.format(fechaLocal(compra.ultima_sesion)),
              vigencia: fmt.format(fechaLocal(compra.vigencia_hasta)),
            })}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('adiestramiento.irAlHogar')}
                onPress={() => {
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar');
                }}
              />
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('adiestramiento.resumenProgramaTitulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] }}>
        {/* el QUÉ comprado, con su gente */}
        <Tarjeta relleno="ninguno">
          <Celda
            titulo={typeof params.programaNombre === 'string' ? params.programaNombre : ''}
            subtitulo={typeof params.prestadorNombre === 'string' ? params.prestadorNombre : undefined}
            metadataMono={`$${precio.toFixed(2)} · ${typeof params.duracion === 'string' ? params.duracion : ''} min`}
          />
        </Tarjeta>

        {/* LA FIRMA — el compromiso dicho entero, en voz humana, antes
            del CTA (§12.2: nada se descubre después) */}
        <View style={{ gap: spacing[2] }}>
          <Text
            style={{
              fontFamily: typography.family.sans.light,
              fontSize: typography.size.lg,
              lineHeight: Math.round(typography.size.lg * 1.35),
              color: theme.text.primary,
            }}
          >
            {t('adiestramiento.resumenSesiones', {
              n: String(nSesiones),
              hora,
              fecha: fecha.length > 0 ? fmtHumana.format(fechaLocal(fecha)) : '',
            })}
          </Text>
          {ultimaEstimada !== null ? (
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: Math.round(typography.size.sm * 1.4),
                color: theme.text.secondary,
              }}
            >
              {t('adiestramiento.resumenUltima', { fecha: ultimaEstimada })}
            </Text>
          ) : null}
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: Math.round(typography.size.sm * 1.4),
              color: theme.text.secondary,
            }}
          >
            {t('adiestramiento.resumenVigencia', { dias: String(vigenciaDias) })}
          </Text>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: Math.round(typography.size.sm * 1.4),
              color: theme.text.secondary,
            }}
          >
            {t('adiestramiento.resumenMover')}
          </Text>
        </View>

        <Separador />

        {/* el pago simulado se DECLARA (voz compartida del checkout) */}
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.sm,
            lineHeight: Math.round(typography.size.sm * 1.4),
            color: theme.text.tertiary,
          }}
        >
          {t('checkout.simuladoAviso')}
        </Text>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[3],
          paddingBottom: Math.max(insets.bottom, spacing[4]),
          backgroundColor: theme.bg.base,
          borderTopWidth: 1,
          borderTopColor: theme.border.subtle,
        }}
      >
        <Boton
          variante="primario"
          etiqueta={
            fase === 'procesando'
              ? t('adiestramiento.procesandoPrograma')
              : t('adiestramiento.comprarPrograma')
          }
          deshabilitado={fase === 'procesando'}
          onPress={() => void comprar()}
        />
      </View>
    </SafeAreaView>
  );
}
