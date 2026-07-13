/**
 * PASEO — EL CUÁNDO tipo Teams (S55-B4, founder; reescribe el S54-B3.2).
 * Tres movimientos: DURACIÓN primero (bloques del menú canónico
 * realmente ofertados, server-side vía obtener_oferta_paseo — no se
 * oferta quien no puede cobrar, 7.13) → DÍA (tira horizontal hoy+13)
 * → GRILLA de inicios reales (obtener_inicios_paseo_disponibles: la
 * ventana entera cabe con cupo para ALGÚN paseador — motor S55-B2).
 * Slot sin cupo NO se pinta (silencio digno); día sin inicios = voz
 * honesta corta. El QUIÉN y el checkout quedan intactos (S54); el
 * camino de la plata NO se toca. Frecuencia dibujada APAGADA (el
 * paquete tiene candado: financiero v2.5 + P14, MODELO_PASEO §6).
 * CIERRA D-321: murió el rango horario hardcodeado.
 *
 * Piezas del sistema: SelectorOpcion en sus tres disposiciones
 * (enmienda S55-B4 — fila/tira/grilla), Celda para la frecuencia.
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — sin oferta activa: EstadoVacio honesto que educa.
 *  · Peldaño 1 — todo lo que se pinta es REAL: bloques de ofertas
 *    vivas con su precio, inicios de franjas reales menos ocupación.
 *  · Peldaño 2 — datos del expediente: HOY NINGUNO (explícito).
 *    Cuando el expediente sepa rutinas (B4+), la grilla podrá sugerir
 *    "su hora habitual" — por dato, no por versión.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerIniciosPaseo,
  obtenerMisCitasPaseo,
  obtenerMisPaquetesSalidas,
  obtenerMisPlanesPaseo,
  obtenerOfertaPaseo,
  type OfertaPaseo,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';

function fechaLocalISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(d);
}

// '30 min' · '1 h' · '2 h' — el menú habla en tiempo humano corto.
function etiquetaBloque(min: number): string {
  return min < 60 ? `${min} min` : `${min / 60} h`;
}

interface Bloque {
  duracion: number;
  /** Precio mínimo entre prestadores que lo ofertan. */
  desde: number;
  /** true si hay más de un precio distinto (la voz dice "desde"). */
  varia: boolean;
}

export default function PaseoCuando() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();

  const [oferta, setOferta] = useState<OfertaPaseo[] | 'cargando' | 'error'>('cargando');
  const [duracion, setDuracion] = useState<number | null>(null);
  const [dia, setDia] = useState<string>(fechaLocalISO(new Date()));
  const [inicios, setInicios] = useState<string[] | 'cargando' | 'error'>('cargando');
  const [hora, setHora] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);
  // D-338/D-343: la entrada al hub "Mis paseos" vive acá SOLO si hay
  // actividad (planes, paquetes o paseos) — silencio digno sin ella.
  const [hayActividad, setHayActividad] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerOfertaPaseo().then((r) => {
        if (!vigente) return;
        setOferta(r.ok ? r.data : 'error');
        if (r.ok && r.data.length > 0) {
          // DURACIÓN PRIMERO: el bloque más corto ofertado arranca elegido
          const menor = Math.min(...r.data.map((o) => o.duracion_minutos));
          setDuracion((d) => d ?? menor);
        }
      });
      void Promise.all([obtenerMisPlanesPaseo(), obtenerMisPaquetesSalidas(), obtenerMisCitasPaseo()]).then(
        ([planes, paquetes, citas]) => {
          if (!vigente) return;
          setHayActividad(
            (planes.ok && planes.data.length > 0) ||
              (paquetes.ok && paquetes.data.length > 0) ||
              (citas.ok && citas.data.length > 0),
          );
        },
      );
      return () => {
        vigente = false;
      };
    }, []),
  );

  // Bloques del menú REALMENTE ofertados, con su precio mínimo.
  const bloques = useMemo<Bloque[]>(() => {
    if (!Array.isArray(oferta)) return [];
    const porDuracion = new Map<number, number[]>();
    for (const o of oferta) {
      const lista = porDuracion.get(o.duracion_minutos) ?? [];
      lista.push(o.precio);
      porDuracion.set(o.duracion_minutos, lista);
    }
    return [...porDuracion.entries()]
      .map(([d, precios]) => ({
        duracion: d,
        desde: Math.min(...precios),
        varia: new Set(precios).size > 1,
      }))
      .sort((a, b) => a.duracion - b.duracion);
  }, [oferta]);

  // Próximos 14 días (hoy+13) — la tira.
  const dias = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', {
      weekday: 'short',
      day: 'numeric',
    });
    const lista: Array<{ iso: string; etiqueta: string }> = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = fechaLocalISO(d);
      const etiqueta =
        i === 0 ? t('explorar.cuandoHoy') : i === 1 ? t('explorar.cuandoManana') : fmt.format(d).toLowerCase();
      lista.push({ iso, etiqueta });
    }
    return lista;
  }, [idioma, t]);

  // La grilla recalcula VIVA con cada cambio de día o duración.
  useEffect(() => {
    if (duracion === null || !Array.isArray(oferta) || oferta.length === 0) return;
    let vigente = true;
    setInicios('cargando');
    void obtenerIniciosPaseo({ fecha: dia, duracion_minutos: duracion }).then((r) => {
      if (!vigente) return;
      setInicios(r.ok ? r.data : 'error');
      if (r.ok) setHora((h) => (h !== null && r.data.includes(h) ? h : null));
    });
    return () => {
      vigente = false;
    };
  }, [dia, duracion, oferta, reintento]);

  const bloqueElegido = bloques.find((b) => b.duracion === duracion) ?? null;
  const listo = duracion !== null && hora !== null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('explorar.paseoTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[5] }}>
        {/* D-338: Explorar→Paseo es una de las DOS entradas al hub */}
        {hayActividad ? (
          <Tarjeta relleno="ninguno">
            <Celda
              interactiva
              accessibilityRole="button"
              titulo={t('plan.hubTitulo')}
              onPress={() => {
                if (router.canDismiss()) router.dismissAll();
                router.navigate('/hogar/paseos');
              }}
            />
          </Tarjeta>
        ) : null}
        {oferta === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
            </View>
          </EsqueletoGrupo>
        ) : oferta === 'error' ? (
          <EstadoVacio
            titulo={t('explorar.paseadoresError')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setOferta('cargando')} />}
          />
        ) : oferta.length === 0 ? (
          // Peldaño 0 — el vacío honesto que educa.
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('explorar.paseadoresVacio')}
            descripcion={t('explorar.paseadoresVacioDetalle')}
          />
        ) : (
          <>
            {/* 1 · DURACIÓN PRIMERO — solo bloques ofertados de verdad */}
            <View style={{ gap: spacing[2] }}>
              <SelectorOpcion
                etiqueta={t('explorar.cuandoDuracion')}
                disposicion="grilla"
                opciones={bloques.map((b) => ({ codigo: String(b.duracion), etiqueta: etiquetaBloque(b.duracion) }))}
                seleccionada={duracion !== null ? String(duracion) : undefined}
                onSelect={(codigo) => setDuracion(Number(codigo))}
              />
              {bloqueElegido !== null ? (
                <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                  {bloqueElegido.varia
                    ? t('explorar.cuandoDesde', { precio: bloqueElegido.desde.toFixed(2) })
                    : t('explorar.cuandoPrecio', { precio: bloqueElegido.desde.toFixed(2) })}
                  {bloqueElegido.duracion === 30 ? ` · ${t('explorar.cuandoSalidaBano')}` : ''}
                </Text>
              ) : null}
            </View>

            {/* 2 · DÍA — la tira horizontal (hoy+13) */}
            <SelectorOpcion
              etiqueta={t('explorar.cuandoDia')}
              disposicion="tira"
              opciones={dias.map((d) => ({ codigo: d.iso, etiqueta: d.etiqueta }))}
              seleccionada={dia}
              onSelect={setDia}
            />

            {/* 2b · GRILLA de inicios reales para ESA duración */}
            {inicios === 'cargando' ? (
              <EsqueletoGrupo>
                <Esqueleto forma="bloque" ancho="100%" alto={100} />
              </EsqueletoGrupo>
            ) : inicios === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('explorar.paseadoresError')}
                accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
              />
            ) : inicios.length === 0 ? (
              // día sin inicios: voz honesta corta, jamás pantalla de error
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
                {t('explorar.cuandoSinInicios')}
              </Text>
            ) : (
              <SelectorOpcion
                etiqueta={t('explorar.cuandoHora')}
                disposicion="grilla"
                opciones={inicios.map((h) => ({ codigo: h, etiqueta: h }))}
                seleccionada={hora ?? undefined}
                onSelect={setHora}
              />
            )}

            <Boton
              variante="primario"
              etiqueta={t('explorar.verQuienPuede')}
              deshabilitado={!listo}
              onPress={() => {
                if (!listo) return;
                router.push({
                  pathname: '/explorar/paseo/disponibles',
                  params: { fecha: dia, hora, duracion: String(duracion) },
                });
              }}
            />

            {/* 4 · "Hacerlo frecuente" — el candado del plan MURIÓ (D-338,
                S56): el chip enciende el modo plan; la Hoja nace en el
                QUIÉN, con el paseador ELEGIDO (alcance v1 §6.1 v1.2). */}
            <Tarjeta relleno="ninguno">
              {listo ? (
                <Celda
                  interactiva
                  accessibilityRole="button"
                  titulo={t('plan.chip')}
                  subtitulo={t('plan.chipDetalle')}
                  onPress={() => {
                    router.push({
                      pathname: '/explorar/paseo/disponibles',
                      params: { fecha: dia, hora, duracion: String(duracion), plan: '1' },
                    });
                  }}
                />
              ) : (
                <Celda titulo={t('plan.chip')} subtitulo={t('plan.chipElegiPrimero')} />
              )}
              <Separador />
              {/* 5 · el PAQUETE (D-343, §6bis): anclado al paseador que se
                  elige en el QUIÉN — comprar NO es reservar. */}
              {listo ? (
                <Celda
                  interactiva
                  accessibilityRole="button"
                  titulo={t('paquete.chip')}
                  subtitulo={t('paquete.chipDetalle')}
                  onPress={() => {
                    router.push({
                      pathname: '/explorar/paseo/disponibles',
                      params: { fecha: dia, hora, duracion: String(duracion), paquete: '1' },
                    });
                  }}
                />
              ) : (
                <Celda titulo={t('paquete.chip')} subtitulo={t('plan.chipElegiPrimero')} />
              )}
            </Tarjeta>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
