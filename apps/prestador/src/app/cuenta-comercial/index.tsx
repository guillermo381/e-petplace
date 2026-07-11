/**
 * CUENTA COMERCIAL — el estado del módulo (S54-B, wizard B2.3 sobre
 * MODELO_FINANCIERO §6.5). LA ESCALERA declarada (§4b):
 *   peldaño 0 — sin cuenta: invitación que EDUCA por qué existe ("para
 *     cobrar por la app") y termina en la acción de registro. Hoy solo
 *     alcanzable post-auth-real (todo prestador vivo tiene cuenta por
 *     FK NOT NULL) — el lugar queda hecho.
 *   peldaño 1 — pendiente_validacion: el estado honesto ("en revisión —
 *     el equipo la activa", §7.11: el wizard JAMÁS activa) + la
 *     invitación a completar datos bancarios si faltan (§8.13).
 *   peldaño 2 — activa: la ficha serena; el número de cuenta SIEMPRE
 *     enmascarado (el wrapper no entrega el completo).
 * Dosis baja (test 7): un acento, CTA en tinta, sin gradiente.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerMiCuentaComercial,
  type EstadoCuentaComercial,
  type MiCuentaComercial,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

// S52-P4b sistémico: títulos humanizados — sentence case, sin eyebrow.
function TituloModulo({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.md,
        color: theme.text.primary,
      }}
    >
      {texto}
    </Text>
  );
}

export default function CuentaComercial() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const [cuenta, setCuenta] = useState<MiCuentaComercial | null | 'cargando' | 'error'>('cargando');

  const cargar = useCallback(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerMiCuentaComercial();
      if (!vigente) return;
      setCuenta(r.ok ? r.data : 'error');
    })();
    return () => {
      vigente = false;
    };
  }, []);

  // refetch al volver de bancarios/nueva — el estado no puede quedar viejo
  useFocusEffect(cargar);

  if (cuenta === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('cuenta.titulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="35%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={100} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (cuenta === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('cuenta.titulo')} atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.error')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('cuenta.reintentar')}
                onPress={() => {
                  setCuenta('cargando');
                  cargar();
                }}
              />
            }
          />
        </View>
      </View>
    );
  }

  // ── peldaño 0: invitación que educa ──────────────────────────────────
  if (cuenta === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('cuenta.titulo')} atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.invitacionTitulo')}
            descripcion={t('cuenta.invitacionCuerpo')}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('cuenta.invitacionCta')}
                onPress={() => router.push('/cuenta-comercial/nueva')}
              />
            }
          />
        </View>
      </View>
    );
  }

  // ── peldaños 1-2: el estado honesto ──────────────────────────────────
  const insigniaPorEstado: Record<
    EstadoCuentaComercial,
    { estado: 'alDia' | 'atencion' | 'proximo' | 'info'; etiqueta: string; voz: string }
  > = {
    pendiente_validacion: { estado: 'proximo', etiqueta: t('cuenta.estadoEnRevision'), voz: t('cuenta.estadoEnRevisionVoz') },
    activa: { estado: 'alDia', etiqueta: t('cuenta.estadoActiva'), voz: t('cuenta.estadoActivaVoz') },
    suspendida: { estado: 'atencion', etiqueta: t('cuenta.estadoSuspendida'), voz: t('cuenta.estadoSuspendidaVoz') },
    cerrada: { estado: 'info', etiqueta: t('cuenta.estadoCerrada'), voz: t('cuenta.estadoCerradaVoz') },
  };
  const estadoUi = insigniaPorEstado[cuenta.estado];
  const bancarios = cuenta.datosBancarios;
  const puedeEditarBancarios = cuenta.estado === 'pendiente_validacion' || cuenta.estado === 'activa';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.titulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: spacing[8], gap: spacing[6] }}>
        {/* el estado preside */}
        <View style={{ gap: spacing[3] }}>
          <View style={{ flexDirection: 'row' }}>
            <Insignia estado={estadoUi.estado} etiqueta={estadoUi.etiqueta} />
          </View>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.base,
              lineHeight: typography.size.base * typography.leading.normal,
              color: theme.text.secondary,
            }}
          >
            {estadoUi.voz}
          </Text>
        </View>

        {/* datos fiscales */}
        <View style={{ gap: spacing[3] }}>
          <TituloModulo texto={t('cuenta.datosFiscales')} />
          <Tarjeta relleno="ninguno">
            <Celda titulo={t('cuenta.razonSocial')} subtitulo={cuenta.razonSocial} />
            <Separador />
            <Celda titulo={t('cuenta.nombreComercial')} subtitulo={cuenta.nombreComercial} />
            <Separador />
            <Celda titulo={t('cuenta.identificacion')} metadataMono={cuenta.identificacionFiscal} />
          </Tarjeta>
        </View>

        {/* datos bancarios — §8.13: parcial es legal, la invitación lo dice */}
        <View style={{ gap: spacing[3] }}>
          <TituloModulo texto={t('cuenta.datosBancarios')} />
          {bancarios === null ? (
            <Tarjeta>
              <View style={{ gap: spacing[3] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.base,
                    lineHeight: typography.size.base * typography.leading.normal,
                    color: theme.text.secondary,
                  }}
                >
                  {t('cuenta.bancariosFaltan')}
                </Text>
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.sm,
                    lineHeight: typography.size.sm * typography.leading.normal,
                    color: theme.text.tertiary,
                  }}
                >
                  {t('cuenta.bancariosEducacion')}
                </Text>
                {puedeEditarBancarios ? (
                  <Boton
                    variante="primario"
                    etiqueta={t('cuenta.bancariosCta')}
                    bloque
                    onPress={() => router.push('/cuenta-comercial/bancarios')}
                  />
                ) : null}
              </View>
            </Tarjeta>
          ) : (
            <View style={{ gap: spacing[3] }}>
              <Tarjeta relleno="ninguno">
                <Celda
                  titulo={bancarios.bancoNombre}
                  subtitulo={bancarios.tipoCuenta === 'corriente' ? t('cuenta.tipoCorriente') : t('cuenta.tipoAhorros')}
                  metadataMono={bancarios.numeroCuentaMascarado}
                />
                <Separador />
                <Celda titulo={t('cuenta.titular')} subtitulo={bancarios.titularNombre} />
              </Tarjeta>
              {puedeEditarBancarios ? (
                <Boton
                  variante="ghost"
                  etiqueta={t('cuenta.bancariosActualizar')}
                  onPress={() => router.push('/cuenta-comercial/bancarios')}
                />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
