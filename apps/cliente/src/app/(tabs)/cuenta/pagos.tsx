/**
 * Cuenta · Pagos (S55-B3) — el espejo dueño de Cobros: historial de
 * pagos propios (citas pagadas por RLS, SOLO lectura — el ledger no se
 * toca: financiero v2.4, el evento nace al cerrar).
 *
 * 🔴 ENMIENDA S101-D — ESTE ENCABEZADO DECÍA DOS COSAS QUE DEJARON DE SER
 * CIERTAS, y las dos se corrigen por separado porque NO son el mismo caso:
 *
 *  ① Decía *«"Pago simulado" DECLARADO por fila **mientras el pago sea
 *    simulado**»*. **El motor de pagos está VIVO desde S101** (despensa y los
 *    cuatro oficios cobran de verdad). La marca por fila **NO se toca y sigue
 *    siendo correcta**: es condicional al flag de LA FILA (`p.pago_simulado`,
 *    abajo), y las citas históricas con `pago_simulado: true` **quedan como
 *    datos declarados**. *Lo que caducó no es la marca: es la cláusula que
 *    hablaba del producto en presente, como si simular fuera su estado.*
 *
 *  ② Decía *«Métodos de pago = en preparación honesto»*. **Falso**: la sección
 *    apunta a `cuenta/medios`, con su voz `pagosMetodosYaEsta`. *La clave vieja
 *    `pagosMetodosPronto` sigue viva en el diccionario y quedó huérfana* — se
 *    declara y NO se borra acá: barrer claves es Ley 37 y va con su tanda.
 *
 * *Por qué se cura un COMENTARIO: es `D-855` en su forma más barata — una banda
 * que dejó de ser cierta. Ningún typecheck la ve, y quien abra este archivo para
 * tocar pagos hereda la premisa equivocada de que acá no se cobra.*
 *
 * Escalera (historial): peldaño 0 = vacío honesto que dice dónde va a
 * vivir; peldaño 1 = las filas tal cual (poco es poco); la densidad
 * llega con pagos reales, no con versión.
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { obtenerMisPagos, type PagoDelDueno } from '@epetplace/api';
import { fechaCortaMono } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

export default function PagosCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [pagos, setPagos] = useState<PagoDelDueno[] | 'cargando' | 'error'>('cargando');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerMisPagos();
      if (vigente) setPagos(r.ok ? r.data : 'error');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  const vozServicio = (tipo: string | null) => (tipo === 'paseo' ? t('cuenta.servicioPaseo') : (tipo ?? ''));

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.pagos')} atras onAtras={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[5] }}>
        {pagos === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : pagos === 'error' ? (
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={() => { setPagos('cargando'); setIntento((n) => n + 1); }} />}
          />
        ) : pagos.length === 0 ? (
          <EstadoVacio titulo={t('cuenta.pagosVacioTitulo')} descripcion={t('cuenta.pagosVacio')} />
        ) : (
          <Tarjeta relleno="ninguno">
            {pagos.map((p, i) => (
              <View key={p.cita_id}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  titulo={vozServicio(p.tipo_servicio)}
                  subtitulo={p.pago_simulado ? t('cuenta.pagoSimulado') : undefined}
                  metadataMono={`${p.fecha ? fechaCortaMono(p.fecha, idioma) : ''}${p.hora ? ` · ${p.hora}` : ''}`}
                  fin={
                    <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, letterSpacing: typography.tracking.mono, color: theme.text.primary }}>
                      {p.monto !== null ? `$${p.monto.toFixed(2)}` : '—'}
                    </Text>
                  }
                />
              </View>
            ))}
          </Tarjeta>
        )}

        <View style={{ gap: spacing[2] }}>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
          >
            {t('cuenta.pagosMetodos')}
          </Text>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
            {t('cuenta.pagosMetodosYaEsta')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
