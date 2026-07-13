/**
 * NEGOCIO — stub digno del ciclo B1/B2 (S51-B3.4, DISEÑO_EXPERIENCIA
 * §14 + alma §2.6): cada módulo tiene su LUGAR visible y dice qué lo
 * despierta — en términos de HITOS, jamás "$0" ni formularios muertos.
 * Los flujos del portal web (servicios/precios/horarios/equipo) se
 * portan en A4/B1.
 *
 * S54-B: los módulos de COBROS despertaron —
 *   · Cuenta comercial (wizard B2.3): Celda navegable con el estado
 *     honesto de la cuenta real (en revisión / activa / falta crearla).
 *   · Liquidaciones: peldaños 0/1 — sin eventos se conserva la
 *     invitación por hito; con eventos propios pendiente_liquidar, la
 *     verdad tal cual ("tienes N servicios cobrados esperando
 *     liquidación") leída del ledger por RLS. Verdad firme (test 8):
 *     solo estado pendiente_liquidar. La vista completa (B2.4) vive en
 *     /liquidaciones desde S55-B — la Celda navega.
 *
 * S57-B (letra P17): NEGOCIO QUEDA PURO OFICIO — la oferta y la plata.
 * El idioma y la salida de sesión se MUDARON a la tab Cuenta (mover =
 * mover, Ley 37: acá no queda ni el código).
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CeldaNavegacion,
  Icono,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerOfertasPaseoPropias,
  obtenerResumenPendienteLiquidar,
  type MiCuentaComercial,
  type OfertaPaseoPropia,
  type ResumenPendienteLiquidar,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { TechoTinta, VeloBarraEstadoTinta } from '@/components/techo-tinta';

// hoy en ISO LOCAL (hallazgo harness S55: toISOString corre el día)
function hoyLocalISO(): string {
  const hoy = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${p(hoy.getMonth() + 1)}-${p(hoy.getDate())}`;
}

// S52-P4b sistémico: títulos humanizados — sentence case, sin eyebrow.
function TituloBloque({ texto }: { texto: string }) {
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

export default function Negocio() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();

  // el estado real de los cobros — null mientras carga o si falla la
  // lectura: la fila degrada a su detalle por hito, jamás inventa
  const [cuenta, setCuenta] = useState<MiCuentaComercial | null>(null);
  const [cuentaCargada, setCuentaCargada] = useState(false);
  const [pendientes, setPendientes] = useState<ResumenPendienteLiquidar | null>(null);
  // B1a: el resumen VIVO del mundo Paseo — null mientras carga/falla:
  // la tarjeta degrada a su invitación, jamás inventa
  const [ofertas, setOfertas] = useState<OfertaPaseoPropia[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const [rCuenta, rPendientes, rPrestador] = await Promise.all([
          obtenerMiCuentaComercial(),
          obtenerResumenPendienteLiquidar(),
          obtenerMiPrestador(),
        ]);
        if (!vigente) return;
        if (rCuenta.ok) {
          setCuenta(rCuenta.data);
          setCuentaCargada(true);
        }
        if (rPendientes.ok) setPendientes(rPendientes.data);
        if (rPrestador.ok) {
          const rOfertas = await obtenerOfertasPaseoPropias(rPrestador.data.id);
          if (vigente && rOfertas.ok) setOfertas(rOfertas.data);
        }
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  // los lugares que aún duermen: qué los despierta, en hitos (§2.6)
  // S52-P6b: filas serenas — el estado "en preparación" lo dice la
  // sección UNA vez, no una Insignia por fila.
  // S55-B (B2): Servicios y Horarios DESPERTARON — viven en "Tu oferta".
  const lugares: Array<{ titulo: string }> = [
    { titulo: t('negocio.equipo') },
  ];

  // detalle honesto de la Celda de cuenta: el estado real cuando se
  // pudo leer; el hito de siempre mientras tanto
  const detalleCuenta = !cuentaCargada
    ? t('negocio.cuentaComercialDetalle')
    : cuenta === null
      ? t('negocio.cuentaComercialDetalle')
      : cuenta.estado === 'pendiente_validacion'
        ? t('cuenta.estadoEnRevision')
        : cuenta.estado === 'activa'
          ? t('cuenta.estadoActiva')
          : cuenta.estado === 'suspendida'
            ? t('cuenta.estadoSuspendida')
            : t('cuenta.estadoCerrada');

  // liquidaciones: peldaño 1 SOLO con eventos reales; 0 conserva el hito
  const detalleLiquidaciones =
    pendientes !== null && pendientes.cantidad > 0
      ? pendientes.cantidad === 1
        ? t('negocio.liquidacionesPendientesUno')
        : t('negocio.liquidacionesPendientes', { cantidad: pendientes.cantidad })
      : t('negocio.liquidacionesDetalle');

  // B1a: el detalle vivo del mundo Paseo — verdad de DB o invitación
  const activas = ofertas?.filter((o) => o.activo) ?? [];
  const desde = activas.length > 0 ? Math.min(...activas.map((o) => o.precio)) : null;
  const detalleMundoPaseo =
    ofertas === null || activas.length === 0
      ? t('negocio.mundoPaseoVacio')
      : activas.length === 1
        ? t('ofertaPaseo.duracionesDetalleUna', { precio: `$${(desde as number).toFixed(2)}` })
        : t('ofertaPaseo.duracionesDetalle', { n: activas.length, precio: `$${(desde as number).toFixed(2)}` });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
        {/* B2 §15b.2: el techo de tinta — el dato de trabajo es la plata
            real esperando liquidación; sin eventos, la fecha del día */}
        <TechoTinta
          titulo={t('negocio.titulo')}
          dato={
            pendientes !== null && pendientes.cantidad > 0
              ? detalleLiquidaciones
              : fechaDiaSemanaHumana(hoyLocalISO(), idioma as IdiomaSoportado)
          }
        />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[4] }}>
          {/* B1a — NEGOCIO COMO MUNDOS (§15b.5): cada mundo con sus dos
              caras; el que no está en la app es puerta honesta por hito,
              jamás decoración muerta */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('negocio.oferta')} />
            <Tarjeta
              interactiva
              elevacion="reposo"
              accessibilityRole="button"
              etiqueta={t('negocio.paseo')}
              onPress={() => router.push('/paseo')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <Icono nombre="paseo" registro="aa" tamano={28} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.md,
                      color: theme.text.primary,
                    }}
                  >
                    {t('negocio.paseo')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {detalleMundoPaseo}
                  </Text>
                </View>
              </View>
            </Tarjeta>
            {/* la puerta honesta del mundo que aún no vive en la app.
                PUNTO DE ENCHUFE S59-B5 (FASE 2, con la estructura de la A):
                esta Tarjeta plana se vuelve la GEMELA de la de Paseo de
                arriba — Tarjeta interactiva elevacion="reposo" +
                onPress={() => router.push('/grooming')} + texto primario +
                detalle VIVO (servicios activos · "desde $X" / invitación
                al taller si la oferta está vacía); mueren las keys
                mundoGroomingDetalle del coming-soon (Ley 37). Hasta que
                FASE 2 abra, la puerta dice la verdad de SU servicio. */}
            <Tarjeta elevacion="plana">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <Icono nombre="grooming" registro="aa" tamano={28} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.md,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('negocio.mundoGrooming')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('negocio.mundoGroomingDetalle')}
                  </Text>
                </View>
              </View>
            </Tarjeta>
          </View>

          {/* cobros — los módulos vivos de S54 */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('negocio.cobros')} />
            <Tarjeta relleno="ninguno">
              {/* S59-B2 (Ley 19.1): entrar a una sección viste
                  CeldaNavegacion — la Celda plana navegaba sin chevron.
                  Ícono 'negocio' para la cuenta comercial = STAND-IN
                  declarado (no hay glifo propio en el registry — pedido
                  a la A, precedente L-141 del 'hoy'-como-calendario). */}
              <CeldaNavegacion
                icono="negocio"
                registro="aa"
                titulo={t('negocio.cuentaComercial')}
                detalle={detalleCuenta}
                onPress={() => router.push('/cuenta-comercial')}
              />
              <Separador />
              {/* S55-B (B1): la vista completa existe — la celda navega;
                  el peldaño 0 de la pantalla educa cuando el ledger está vacío */}
              <CeldaNavegacion
                icono="pagos"
                registro="aa"
                titulo={t('negocio.liquidaciones')}
                detalle={detalleLiquidaciones}
                onPress={() => router.push('/liquidaciones')}
              />
            </Tarjeta>
          </View>

          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('negocio.enPreparacion')} />
            <Tarjeta relleno="ninguno">
              {lugares.map((lugar, i) => (
                <View key={lugar.titulo}>
                  {i > 0 ? <Separador /> : null}
                  <View style={{ paddingHorizontal: spacing[3], paddingVertical: spacing[3], gap: 2 }}>
                    <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary }}>
                      {lugar.titulo}
                    </Text>
                  </View>
                </View>
              ))}
            </Tarjeta>
          </View>

        </View>
      </ScrollView>
      {/* S59-B1: el velo de tinta — la zona de la barra de estado JAMÁS
          queda blanca, ni cuando el techo scrollea (regla del pedido). */}
      <VeloBarraEstadoTinta />
    </View>
  );
}
