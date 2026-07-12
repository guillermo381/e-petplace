/**
 * CHECKOUT — B3.3 (S54): mono-ítem con FORMA de carrito (contrato para
 * N, construcción para 1). El hold de 15 min corre a la vista con voz
 * honesta; el pago es SIMULADO y la superficie LO DICE (fase de
 * pruebas — no se cobra nada real). Lugar hecho para cupón (B4),
 * deshabilitado honesto. EsperaDeMarca en el procesamiento (>2s,
 * Ley 13 — la única animación de espera legal).
 *
 * CAMINO TRISTE DIGNO (L-139 aplica a pagos más que a nada): toggle
 * DEV (solo __DEV__) éxito/rechazo/timeout para gatear de verdad las
 * pantallas de rechazo (reintento digno), timeout (voz honesta) y
 * hold vencido ("este horario se liberó — elegí otro"). El rechazo y
 * el timeout simulados NO llaman a la RPC: jamás un ledger a medias.
 *
 * ESCALERA (§4b): el checkout muestra SOLO el ítem del hold (snapshot
 * de precio — jamás re-resuelve) — no muestra datos del expediente y
 * lo dice: peldaño único hasta que exista carrito multi-ítem (B4+).
 */

import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  EsperaDeMarca,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Icono,
  Insignia,
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { confirmarCitaPagada, obtenerDireccionHogar, type DireccionHogar } from '@epetplace/api';
import { DireccionHogarForm } from '@/components/direccion-hogar-form';
import { useTraduccion } from '@/i18n';

type Fase = 'resumen' | 'procesando' | 'exito' | 'rechazado' | 'timeout' | 'holdVencido';
type ModoSimulador = 'exito' | 'rechazo' | 'timeout';

export default function PaseoCheckout() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const params = useLocalSearchParams<{
    citaId: string;
    expiraEn: string;
    precio: string;
    prestadorNombre: string;
    servicioNombre: string;
    fecha: string;
    hora: string;
    duracion: string;
  }>();
  const citaId = typeof params.citaId === 'string' ? params.citaId : '';
  const expiraEn = typeof params.expiraEn === 'string' ? params.expiraEn : '';
  const precio = Number(params.precio ?? 0);

  const [fase, setFase] = useState<Fase>('resumen');
  const [restanteSeg, setRestanteSeg] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(expiraEn).getTime() - Date.now()) / 1000)),
  );
  // Toggle DEV del simulador de pago (solo __DEV__; default éxito).
  const [modoSim, setModoSim] = useState<ModoSimulador>('exito');

  // D-339: la puerta del paseo. Si el hogar aún no tiene dirección, se
  // captura ACÁ una sola vez (jamás en cada reserva); el PAGO la congela
  // en la cita server-side. 'cargando' evita un flash de "sin dirección".
  const [direccion, setDireccion] = useState<DireccionHogar | null>(null);
  const [direccionEstado, setDireccionEstado] = useState<'cargando' | 'lista'>('cargando');
  const [hojaDireccion, setHojaDireccion] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerDireccionHogar();
      if (!vigente) return;
      if (r.ok) setDireccion(r.data);
      // error de red: se queda sin dirección visible — el CTA de agregar
      // reintenta por la misma Hoja (guardar re-escribe la principal).
      setDireccionEstado('lista');
    })();
    return () => {
      vigente = false;
    };
  }, []);

  // El contador del hold — voz honesta; al llegar a 0 el horario se
  // liberó (el server lo garantiza perezoso; esto es la verdad visible).
  useEffect(() => {
    if (fase !== 'resumen') return;
    const timer = setInterval(() => {
      const s = Math.max(0, Math.floor((new Date(expiraEn).getTime() - Date.now()) / 1000));
      setRestanteSeg(s);
      if (s === 0) setFase('holdVencido');
    }, 1000);
    return () => clearInterval(timer);
  }, [fase, expiraEn]);

  const pagar = useCallback(async () => {
    setFase('procesando');
    if (__DEV__ && modoSim === 'rechazo') {
      // rechazo simulado: NO toca la RPC — jamás un ledger a medias
      setTimeout(() => setFase('rechazado'), 1600);
      return;
    }
    if (__DEV__ && modoSim === 'timeout') {
      setTimeout(() => setFase('timeout'), 4000);
      return;
    }
    const r = await confirmarCitaPagada({ cita_id: citaId });
    if (r.ok) {
      setFase('exito');
      return;
    }
    if (r.codigo === 'hold_expirado') {
      setFase('holdVencido');
      return;
    }
    if (r.codigo === 'cita_ya_confirmada') {
      // idempotencia honesta: ya estaba pagada — es un éxito
      setFase('exito');
      return;
    }
    setFase('rechazado');
  }, [citaId, modoSim]);

  const mm = String(Math.floor(restanteSeg / 60)).padStart(2, '0');
  const ss = String(restanteSeg % 60).padStart(2, '0');

  if (fase === 'procesando') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4], padding: spacing[6] }}>
          <EsperaDeMarca />
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary, textAlign: 'center' }}>
            {t('checkout.procesando')}
          </Text>
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
            titulo={t('checkout.exitoTitulo')}
            descripcion={t('checkout.exitoDetalle')}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => {
                  // D-329: dismissTo solo busca en el stack ACTUAL
                  // (Explorar) — /hogar vive en otro tab y el CTA no
                  // navegaba. Se vacía el stack de Explorar (si hay
                  // algo que vaciar — deep link entra directo) y recién
                  // ahí se cambia de tab.
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

  if (fase === 'rechazado' || fase === 'timeout') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            titulo={t(fase === 'rechazado' ? 'checkout.rechazado' : 'checkout.timeout')}
            descripcion={t(fase === 'rechazado' ? 'checkout.rechazadoDetalle' : 'checkout.timeoutDetalle')}
            accion={
              <View style={{ gap: spacing[2] }}>
                <Boton variante="primario" etiqueta={t('checkout.reintentar')} onPress={() => setFase('resumen')} />
                <Boton variante="ghost" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />
              </View>
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fase === 'holdVencido') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            titulo={t('checkout.holdVencido')}
            descripcion={t('checkout.holdVencidoDetalle')}
            accion={<Boton variante="primario" etiqueta={t('checkout.elegirOtro')} onPress={() => router.back()} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('checkout.titulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] }}>
        {/* el ítem (forma de carrito: hoy UNO) */}
        <View style={{ gap: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
            {t('checkout.resumen')}
          </Text>
          <Tarjeta relleno="ninguno">
            <Celda
              titulo={typeof params.prestadorNombre === 'string' ? params.prestadorNombre : ''}
              subtitulo={typeof params.servicioNombre === 'string' ? params.servicioNombre : ''}
              metadataMono={`${params.fecha} · ${String(params.hora).slice(0, 5)} · ${params.duracion} min`}
            />
            <Separador />
            {/* lugar hecho para el cupón (B4) — deshabilitado honesto */}
            <Celda titulo={t('checkout.cupon')} fin={<Insignia estado="info" etiqueta={t('checkout.cuponPronto')} />} />
            <Separador />
            <Celda titulo={t('checkout.total')} metadataMono={`$${precio.toFixed(2)}`} />
          </Tarjeta>
        </View>

        {/* el hold, con voz honesta y el contador en voz de máquina */}
        <View style={{ gap: 2 }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
            {t('checkout.holdVoz')}
          </Text>
          <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: theme.text.tertiary, fontVariant: ['tabular-nums'] }}>
            {mm}:{ss}
          </Text>
        </View>

        {/* D-339 — la puerta del paseo: se muestra si existe; si no, se
            captura UNA vez acá. El pago la congela en la cita (server). */}
        <View style={{ gap: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
            {t('checkout.direccionTitulo')}
          </Text>
          {direccionEstado === 'cargando' ? null : direccion !== null ? (
            <Tarjeta relleno="ninguno">
              <Celda
                titulo={direccion.direccion}
                subtitulo={[direccion.sector, direccion.ciudad].filter(Boolean).join(' · ')}
                fin={
                  <Boton
                    variante="ghost"
                    tamaño="sm"
                    etiqueta={t('checkout.direccionCambiar')}
                    onPress={() => setHojaDireccion(true)}
                  />
                }
              />
            </Tarjeta>
          ) : (
            <View style={{ gap: spacing[2] }}>
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.tertiary }}>
                {t('checkout.direccionVoz')}
              </Text>
              <Boton variante="secundario" etiqueta={t('checkout.direccionAgregar')} bloque onPress={() => setHojaDireccion(true)} />
            </View>
          )}
        </View>

        {/* la superficie DICE que el pago es simulado */}
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.tertiary }}>
          {t('checkout.simuladoAviso')}
        </Text>

        <Boton
          variante="primario"
          etiqueta={t('checkout.pagar')}
          deshabilitado={direccionEstado === 'cargando' || direccion === null}
          onPress={() => void pagar()}
        />

        {__DEV__ ? (
          <View style={{ marginTop: spacing[4] }}>
            {/* herramienta de gate del camino triste — jamás viaja a preview */}
            <SelectorOpcion
              etiqueta="simulador dev (solo __DEV__)"
              opciones={[
                { codigo: 'exito', etiqueta: 'éxito' },
                { codigo: 'rechazo', etiqueta: 'rechazo' },
                { codigo: 'timeout', etiqueta: 'timeout' },
              ]}
              seleccionada={modoSim}
              onSelect={(codigo) => setModoSim(codigo as ModoSimulador)}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* D-339: la captura de la dirección — el MISMO formulario de
          Cuenta·Tu dirección, en Hoja (una vez, jamás en cada reserva) */}
      <Hoja visible={hojaDireccion} onCerrar={() => setHojaDireccion(false)} titulo={t('direccion.titulo')} conCerrar>
        {/* Cura S56 (orden founder): el teclado no tapa el campo activo */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <HojaScroll>
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: typography.size.sm * 1.4,
                color: theme.text.secondary,
              }}
            >
              {t('direccion.voz')}
            </Text>
            <DireccionHogarForm
              inicial={direccion}
              onGuardada={(d) => {
                setDireccion(d);
                setHojaDireccion(false);
              }}
            />
          </View>
        </HojaScroll>
        </KeyboardAvoidingView>
      </Hoja>
    </SafeAreaView>
  );
}
