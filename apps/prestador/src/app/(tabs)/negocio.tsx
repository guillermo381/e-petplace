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
 *     solo estado pendiente_liquidar. La vista completa es B2.4.
 *
 * UNA función viva más: el selector de idioma es/en del riel B1a
 * (mismo patrón que Cuenta del cliente). Y la salida de sesión.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Hoja,
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { cambiarIdioma, type IdiomaSoportado } from '@epetplace/i18n';
import {
  cerrarSesion,
  obtenerMiCuentaComercial,
  obtenerResumenPendienteLiquidar,
  type MiCuentaComercial,
  type ResumenPendienteLiquidar,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

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
  const { mostrar } = useAviso();

  const [cambiando, setCambiando] = useState(false);
  const [salirAbierta, setSalirAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  // el estado real de los cobros — null mientras carga o si falla la
  // lectura: la fila degrada a su detalle por hito, jamás inventa
  const [cuenta, setCuenta] = useState<MiCuentaComercial | null>(null);
  const [cuentaCargada, setCuentaCargada] = useState(false);
  const [pendientes, setPendientes] = useState<ResumenPendienteLiquidar | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const [rCuenta, rPendientes] = await Promise.all([
          obtenerMiCuentaComercial(),
          obtenerResumenPendienteLiquidar(),
        ]);
        if (!vigente) return;
        if (rCuenta.ok) {
          setCuenta(rCuenta.data);
          setCuentaCargada(true);
        }
        if (rPendientes.ok) setPendientes(rPendientes.data);
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  async function alElegirIdioma(codigo: string) {
    if (cambiando || codigo === idioma || (codigo !== 'es' && codigo !== 'en')) return;
    setCambiando(true);
    try {
      await cambiarIdioma(codigo as IdiomaSoportado);
    } catch {
      mostrar({ texto: t('negocio.idiomaError'), variante: 'error' });
    }
    setCambiando(false);
  }

  // los lugares que aún duermen: qué los despierta, en hitos (§2.6)
  // S52-P6b: filas serenas — el estado "en preparación" lo dice la
  // sección UNA vez, no una Insignia por fila.
  const lugares: Array<{ titulo: string }> = [
    { titulo: t('negocio.servicios') },
    { titulo: t('negocio.horarios') },
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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
        <Encabezado variante="portada" saludo={t('negocio.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          {/* cobros — los módulos vivos de S54 */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('negocio.cobros')} />
            <Tarjeta relleno="ninguno">
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('negocio.cuentaComercial')}
                subtitulo={detalleCuenta}
                onPress={() => router.push('/cuenta-comercial')}
              />
              <Separador />
              <Celda titulo={t('negocio.liquidaciones')} subtitulo={detalleLiquidaciones} />
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

          {/* idioma: la función viva del riel B1a */}
          <Tarjeta>
            <SelectorOpcion
              etiqueta={t('negocio.idioma')}
              opciones={[
                { codigo: 'es', etiqueta: t('negocio.idiomaEs') },
                { codigo: 'en', etiqueta: t('negocio.idiomaEn') },
              ]}
              seleccionada={idioma}
              onSelect={(codigo) => void alElegirIdioma(codigo)}
            />
          </Tarjeta>

          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('sesion.titulo')} />
            <Boton variante="secundario" etiqueta={t('sesion.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
          </View>
        </View>
      </ScrollView>

      <Hoja visible={salirAbierta} onCerrar={() => setSalirAbierta(false)} titulo={t('sesion.titulo')}>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary }}>
            {t('sesion.confirmacionCierre')}
          </Text>
          <Boton
            variante="destructivo"
            etiqueta={t('sesion.cerrarSesion')}
            bloque
            cargando={cerrando}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void (async () => {
                await cerrarSesion();
                setCerrando(false);
                setSalirAbierta(false);
                // D-290 (S54-B): auth real — la salida aterriza en el
                // login; el replace desmonta las tabs y el guard del
                // raíz re-decide fresco al volver a entrar.
                router.replace('/login');
              })();
            }}
          />
          <Boton variante="ghost" etiqueta={t('sesion.cancelar')} bloque onPress={() => setSalirAbierta(false)} />
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
