/**
 * EL CHECKOUT DEL PAQUETE DE SALIDAS — S109-C.
 *
 * ═══ POR QUÉ ES PANTALLA Y NO LA HOJA QUE ERA ═════════════════════════════
 * Firma del founder: **una Hoja se arrastra hacia abajo**, y esto pasó a ser una
 * espera que cambia sola. *La Hoja configura el tamaño; la pantalla cobra.*
 *
 * ═══ LA MÁQUINA ES LA DE LA CASA, NO UNA NUEVA ════════════════════════════
 * `{tipo:'bono'}` y `leerEstadoBono` **ya cubrían el paquete de paseo**: medido,
 * el sujeto no filtra por oficio. *Lo único que le faltaba al paseo era esperar*
 * — y esperar ya sabíamos hacerlo para cuatro sujetos.
 *
 * ⚠️ **DeUna SÍ se ofrece acá**: es una compra SUELTA. La regla de las dos
 * promesas y el «muy pronto» viven en lo recurrente, que es otra cosa.
 */

import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton, Celda, Encabezado, EsperaDeTrabajo, EstadoVacio, Icono,
  PantallaConPie, Separador, Tarjeta, Texto, spacing, useAviso, useTheme,
} from '@epetplace/ui';
import { comprarPaqueteSalidas, PRESETS_PAQUETE, type PresetPaquete } from '@epetplace/api';

import { SeccionMedioDePago, useMedioDePago } from '@/components/seccion-medio-de-pago';
import { cobrar } from '@/lib/pagos/cobro';
import { useEsperaDeConfirmacion } from '@/lib/pagos/espera-confirmacion';
import { EsperaDeUna } from '@/components/espera-deuna';
import { topeDeEspera, useEstadoDeUna } from '@/lib/pagos/deuna-estado';
import { urlWhatsApp } from '@/lib/contacto';
import { Linking } from 'react-native';
import { useTraduccion } from '@/i18n';

export default function CheckoutPaquetePaseo() {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams();
  const texto = (k: string): string => (typeof params[k] === 'string' ? (params[k] as string) : '');

  /* El preset se VALIDA contra el catálogo, no se confía del `Number()`: *un
     `preset=7` entrando por un deep link no existe como paquete, y el motor lo
     rebotaría seis pasos después.* Sin preset válido no hay compra que hacer. */
  const preset: PresetPaquete | null =
    PRESETS_PAQUETE.find((n) => n === Number(texto('preset'))) ?? null;
  const total = Number(texto('precioPaquete')) * (preset ?? 0);

  const medio = useMedioDePago(true);
  const [fase, setFase] = useState<'resumen' | 'confirmando'>('resumen');
  const [enviando, setEnviando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);
  const [exito, setExito] = useState<number | null>(null);
  /** 🔴 El bono ya nacido: **se compra UNA vez aunque el cobro se reintente.**
   *  Sin esto, tres tarjetas probadas dejarían tres paquetes fantasma. */
  const [bonoEnVuelo, setBonoEnVuelo] = useState<string | null>(null);

  /* ═══ 🔴 EL RIEL EN CURSO — se congela AL TOCAR, no se lee del selector ═══
     `medio.elegido` es estado vivo del resumen; **la fase `confirmando` tiene
     que saber por dónde entró la plata, y eso se decidió en el toque.** *Leer el
     selector durante la espera dejaría expresable que el cuerpo cambie de riel a
     mitad de una confirmación — la persona mirando un código de DeUna y la
     pantalla saltando a la rampa de tarjeta.* Copiado del checkout de la cita,
     que ya pagó por aprenderlo. */
  const [riel, setRiel] = useState<'tarjeta' | 'deuna' | null>(null);

  /* 🔴 Activo **sólo en `confirmando` y sólo con riel DeUna**: pedir un código
     **CREA un intento contra el proveedor**, así que sin este freno abrir el
     resumen fabricaría una transacción que nadie pidió. */
  const enDeuna = fase === 'confirmando' && riel === 'deuna' && bonoEnVuelo !== null;
  const deuna = useEstadoDeUna(enDeuna ? { tipo: 'bono', id: bonoEnVuelo } : null);

  /* La MISMA espera para los dos rieles: lee **el SUJETO**, no al proveedor.
     Lo único que cambia es cuánto se mira — con DeUna la plata todavía no se
     movió, así que el tope es margen y no plazo. */
  const espera = useEsperaDeConfirmacion(
    fase === 'confirmando' && bonoEnVuelo !== null ? { tipo: 'bono', id: bonoEnVuelo } : null,
    topeDeEspera(deuna.estado),
  );

  useEffect(() => {
    if (espera.fase !== 'resuelta') return;
    const e = espera.estado;
    if (e === 'pagado') { setExito(preset ?? 0); return; }
    setFase('resumen');
    setRiel(null);
    setBonoEnVuelo(null);
    /* Cada final con su frase: «no llegaste a pagarlo» y «te devolvimos la
       plata» son dos cosas distintas, y el motor las distingue. */
    setRebote(
      e === 'no_pagado_a_tiempo' ? t('paquete.noPagadoATiempoVoz')
      : e === 'vencido' ? t('paquete.vencidoVoz')
      : t('paquete.noEntroVoz'),
    );
  }, [espera, preset, t]);

  const pagar = useCallback(async () => {
    if (enviando) return;
    if (medio.idTarjeta === null && medio.elegido?.tipo !== 'deuna') {
      setRebote(t('pago.cobroElegiMedio'));
      return;
    }
    setEnviando(true);
    setRebote(null);
    if (preset === null) { setEnviando(false); setRebote(t('paquete.presetInvalido')); return; }

    /* El bono nace ANTES de elegir riel: **los dos necesitan el sujeto** — la
       tarjeta para debitarlo y DeUna para pedirle un código a su nombre. */
    let bonoId = bonoEnVuelo;
    if (bonoId === null) {
      const compra = await comprarPaqueteSalidas({
        prestador_id: texto('prestadorId'),
        prestador_servicio_id: texto('prestadorServicioId'),
        unidades: preset,
      });
      if (!compra.ok) { setEnviando(false); setRebote(compra.mensaje); return; }
      bonoId = compra.data.bono_id;
      setBonoEnVuelo(bonoId);
    }

    /* ── 🔴 DEUNA NO PASA POR `cobrar()`, y no es un atajo ──────────────────
       `cobrar()` **debita una tarjeta**: es el riel de Nuvei entero. En DeUna no
       hay nada que debitar desde acá — *lo que hacemos es pedir seis dígitos
       para que la persona pague en OTRA app*, y la plata se mueve allá o no se
       mueve. El toque **sólo cambia de fase**; el código lo pide
       `useEstadoDeUna` al activarse.
       ⚠️ Y **no se prende `enviando`**: no hay viaje que esperar en este hilo.
       *Un botón que gira mientras la pantalla ya cambió promete un trabajo que
       no existe.* */
    if (medio.elegido?.tipo === 'deuna') {
      setEnviando(false);
      setRiel('deuna');
      setFase('confirmando');
      return;
    }

    setRiel('tarjeta');
    const cobro = await cobrar({ tipo: 'bono', id: bonoId }, medio.idTarjeta);
    setEnviando(false);
    if (!cobro.ok) { mostrar({ texto: t(cobro.voz), variante: 'error' }); return; }
    setFase('confirmando');
  }, [enviando, medio.idTarjeta, medio.elegido, bonoEnVuelo, preset, mostrar, t]);

  if (fase === 'confirmando') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4], padding: spacing[6] }}>
          {/* ══ LA MISMA FASE, DOS CUERPOS ═══════════════════════════════════
              *El cliente jamás aprende un circuito distinto por cambiar de
              medio.* Y la asimetría que SÍ existe se respeta: **en tarjeta la
              familia ESPERA; en DeUna la familia TRABAJA** — por eso
              `EsperaDeTrabajo` no se monta ahí: *una rampa que dice «estamos
              trabajando» mientras la persona teclea afirma algo falso.* */}
          {riel === 'deuna' ? (
            <EsperaDeUna
              estado={deuna.estado}
              onGenerarNuevo={deuna.regenerar}
              onSoporte={() => void Linking.openURL(urlWhatsApp(t('cuenta.soporteDesdeCobro')))}
            />
          ) : (
            <>
              <Texto variante="titulo">{t('pago.esperaTitulo')}</Texto>
              <Texto variante="cuerpo">{t('paquete.esperaCuerpo')}</Texto>
              <EsperaDeTrabajo />
            </>
          )}
          {/* 🔴 La vuelta al resumen existe **sólo en DeUna y sólo mientras
              espera**: ahí se llegó SIN cobrar nada —sólo se pidió un código—,
              así que volver es seguro. Con tarjeta se llega DESPUÉS de que el
              débito salió, y ofrecer «cambiar de medio» sería invitar a pagar
              dos veces. */}
          {riel === 'deuna' && deuna.estado.fase === 'esperando' ? (
            <View style={{ gap: spacing[2], alignItems: 'center' }}>
              <Boton
                variante="secundario"
                etiqueta={t('checkout.cambiarMedio')}
                onPress={() => { setFase('resumen'); setRiel(null); }}
              />
              <Texto variante="apoyo">{t('checkout.cambiarMedioNota')}</Texto>
            </View>
          ) : null}
          {/* 🔴 El tope habla y **NO declara desenlace**: la compra sigue viva y
              el barrido la resuelve. */}
          {espera.fase === 'sigue_abierta' ? (
            <>
              <Texto variante="apoyo">{t('pago.esperaSigueAbiertaCita')}</Texto>
              <Boton
                variante="secundario"
                etiqueta={t('checkout.volverHogar')}
                onPress={() => {
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar/paseos');
                }}
              />
            </>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  if (exito !== null) {
    /* ⭐ **LA INVITACIÓN A LA PRIMERA SALIDA VIVE ACÁ**, con sus dos caminos
       parejos y cero presión — es la misma que estaba en la segunda Hoja de
       `paquete.tsx`, mudada al único lugar donde ahora se sabe que la compra
       terminó. *Dejarla allá la habría dejado esperando un evento que ya no
       ocurre.* */
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4], gap: spacing[4] }}>
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('paquete.exito', { n: exito })}
            descripcion={t('paquete.primeraVoz')}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('paquete.primeraReservar')}
                onPress={() => router.dismissTo('/explorar/paseo')}
              />
            }
          />
          <Boton
            variante="secundario"
            bloque
            etiqueta={t('paquete.primeraDespues')}
            onPress={() => {
              if (router.canDismiss()) router.dismissAll();
              router.navigate('/hogar/paseos');
            }}
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
            etiqueta={t('checkout.pagar')}
            cargando={enviando}
            deshabilitado={medio.elegido === null || preset === null}
            razonDeshabilitado={t('pago.cobroElegiMedio')}
            onPress={() => void pagar()}
          />
        }
      >
        <Texto variante="seccion">{t('checkout.resumen')}</Texto>
        <Tarjeta relleno="ninguno">
          <Celda
            titulo={t('paquete.checkoutServicio', { n: preset ?? 0 })}
            subtitulo={t('checkout.conPrestador', { prestador: texto('prestadorNombre') })}
            metadataMono={`${texto('duracion')} min`}
          />
          <Separador />
          <Celda titulo={t('checkout.total')} metadataMono={`$${total.toFixed(2)}`} />
        </Tarjeta>

        {/* Compra suelta ⇒ **sin `recurrente`**: DeUna se puede elegir. */}
        <SeccionMedioDePago medio={medio} />

        <Texto variante="apoyo">{t('paquete.vigenciaVoz')}</Texto>

        {rebote !== null ? <Texto variante="cuerpo">{rebote}</Texto> : null}
      </PantallaConPie>
    </SafeAreaView>
  );
}
