/**
 * S70-A4 — EL PARTE DEL DUEÑO: la consulta clínica en voz de familia.
 * La FÓRMULA destacada (nombre, presentación, cantidad, posología en
 * palabras llanas); el original clínico del veterinario PRESERVADO detrás
 * de "Ver completo" (Ley 3, dos registros); próximo control visible si
 * existe. Guion de referencia: la diarrea de Thor que Kary entendería.
 *
 * ENTRADA (anotada para la sesión de gate, territorio B en vuelo): el
 * nodo `historia_clinica_registrada` de la LineaDeVida rutea acá con su
 * `evento_id` — una línea en el resolver del timeline.
 *
 * Ley 13: el error jamás se disfraza de vacío. Back siempre.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
  HojaScroll,
  Icono,
  Insignia,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { obtenerParteConsulta, type ItemFormulaParte, type ParteConsulta } from '@epetplace/api';
import { fechaLargaHumana } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

/**
 * S71-A CURA-2(c) 🔴 — el estado del estudio se LEÍA del wrapper y se
 * DESCARTABA: la fila pintaba `t('parte.examenPedido')` fijo, así que un
 * examen `cancelado` o con `resultado_disponible` le decía "Pedido" al
 * dueño. Verosímil y falso (L-139) sobre un dato clínico.
 *
 * El dominio sale del CHECK vivo de `evento_examen_diagnostico` (leído en
 * DB, no de memoria): solicitado · en_proceso · resultado_disponible ·
 * revisado_por_vet · cancelado. Diccionario CERRADO, voz de familia:
 * un estado fuera del dominio degrada digno (sin insignia), jamás
 * inventa etiqueta.
 */
const VOZ_EXAMEN: Record<
  string,
  | {
      clave:
        | 'parte.examenPedido'
        | 'parte.examenEnProceso'
        | 'parte.examenResultado'
        | 'parte.examenRevisado'
        | 'parte.examenCancelado';
      insignia: 'proximo' | 'alDia' | 'info';
    }
  | undefined
> = {
  solicitado: { clave: 'parte.examenPedido', insignia: 'proximo' },
  en_proceso: { clave: 'parte.examenEnProceso', insignia: 'proximo' },
  resultado_disponible: { clave: 'parte.examenResultado', insignia: 'alDia' },
  revisado_por_vet: { clave: 'parte.examenRevisado', insignia: 'alDia' },
  cancelado: { clave: 'parte.examenCancelado', insignia: 'info' },
};

export default function ParteConsultaScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const { eventoId, nombre } = useLocalSearchParams<{ eventoId: string; nombre?: string }>();

  const [estado, setEstado] = useState<ParteConsulta | 'cargando' | 'error'>('cargando');
  const [verNota, setVerNota] = useState(false);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      void (async () => {
        if (typeof eventoId !== 'string' || eventoId.length === 0) return;
        const r = await obtenerParteConsulta(eventoId);
        if (!vivo) return;
        setEstado(r.ok ? r.data : 'error');
      })();
      return () => {
        vivo = false;
      };
    }, [eventoId, intento]),
  );

  const titulo =
    typeof nombre === 'string' && nombre.length > 0
      ? t('parte.titulo', { nombre })
      : t('parte.tituloSinNombre');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top']}>
      <Encabezado variante="navegacion" titulo={titulo} atras onAtras={() => router.back()} />

      {estado === 'cargando' ? (
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto ancho="60%" alto={28} />
            <Esqueleto ancho="100%" alto={120} />
            <Esqueleto ancho="100%" alto={90} />
          </EsqueletoGrupo>
        </View>
      ) : estado === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
          <EstadoVacio
            registro="pantalla"
            titulo={t('parte.error')}
            descripcion={t('parte.errorDetalle')}
            accion={
              <Boton variante="secundario" etiqueta={t('parte.reintentar')} onPress={() => setIntento((n) => n + 1)} />
            }
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[4], gap: spacing[4], paddingBottom: insets.bottom + spacing[8] }}
        >
          {estado.negocioNombre !== null ? (
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                color: theme.text.secondary,
              }}
            >
              {t('parte.enNegocio', { negocio: estado.negocioNombre })} · {fechaLargaHumana(estado.fecha, idioma)}
            </Text>
          ) : null}

          {/* Lo que encontró el veterinario (voz de familia) */}
          <Tarjeta elevacion="reposo">
            <View style={{ gap: spacing[2] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.sm,
                  color: theme.text.secondary,
                }}
              >
                {t('parte.diagnostico')}
              </Text>
              <Text
                style={{
                  fontFamily: typography.family.sans.light,
                  fontSize: typography.size.xl,
                  color: theme.text.primary,
                }}
              >
                {estado.consulta.diagnostico ?? estado.consulta.motivo ?? '—'}
              </Text>
              {estado.consulta.motivo !== null && estado.consulta.diagnostico !== null ? (
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.md,
                    color: theme.text.secondary,
                  }}
                >
                  {estado.consulta.motivo}
                </Text>
              ) : null}
            </View>
          </Tarjeta>

          {/* LA FÓRMULA destacada */}
          <View style={{ gap: spacing[3] }}>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.md,
                color: theme.text.primary,
              }}
            >
              {t('parte.formulaTitulo')}
            </Text>
            {estado.formula.length === 0 ? (
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.sm,
                  color: theme.text.secondary,
                }}
              >
                {t('parte.sinFormula')}
              </Text>
            ) : (
              estado.formula.map((m: ItemFormulaParte, i: number) => (
                <Tarjeta key={i} elevacion="reposo">
                  <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                    <Icono nombre="veterinaria" tamano={24} />
                    <View style={{ flex: 1, gap: spacing[1] }}>
                      <Text
                        style={{
                          fontFamily: typography.family.sans.light,
                          fontSize: typography.size.lg,
                          color: theme.text.primary,
                        }}
                      >
                        {m.nombre}
                      </Text>
                      {/* S71-A CURA-2(b) 🔴 — `principioActivo` viajaba en el
                          wrapper y JAMÁS se renderizaba. Va bajo el nombre
                          comercial, que es donde el dueño lo busca (es como
                          está rotulada la caja). Verbatim del vet: cero
                          etiqueta inventada (muro §8.3). */}
                      {m.principioActivo !== null ? (
                        <Text
                          style={{
                            fontFamily: typography.family.sans.regular,
                            fontSize: typography.size.sm,
                            color: theme.text.secondary,
                          }}
                        >
                          {m.principioActivo}
                        </Text>
                      ) : null}
                      {m.presentacion !== null || m.cantidad !== null ? (
                        <Text
                          style={{
                            fontFamily: typography.family.mono.regular,
                            fontSize: typography.size.sm,
                            color: theme.text.secondary,
                          }}
                        >
                          {[m.presentacion, m.cantidad !== null ? t('parte.cantidad', { n: m.cantidad }) : null]
                            .filter((x) => x !== null)
                            .join(' · ')}
                        </Text>
                      ) : null}
                      {/* S71-A CURA-2(a) 🔴 — la línea exigía dosis Y frecuencia:
                          una fórmula con dosis y sin frecuencia ("1 tableta",
                          frecuencia null porque el vet no la dictó — L-139) NO
                          MOSTRABA LA DOSIS. El dueño veía el remedio sin saber
                          cuánto darle. Cada campo se muestra si existe. */}
                      {m.dosis !== null || m.frecuencia !== null ? (
                        <Text
                          style={{
                            fontFamily: typography.family.sans.regular,
                            fontSize: typography.size.md,
                            color: theme.text.primary,
                          }}
                        >
                          {m.dosis !== null && m.frecuencia !== null
                            ? t('parte.dosisLinea', { dosis: m.dosis, frecuencia: m.frecuencia })
                            : (m.dosis ?? m.frecuencia)}
                        </Text>
                      ) : null}
                      {m.duracionDias !== null ? (
                        <Text
                          style={{
                            fontFamily: typography.family.sans.regular,
                            fontSize: typography.size.sm,
                            color: theme.text.secondary,
                          }}
                        >
                          {t('parte.porDias', { dias: m.duracionDias })}
                          {m.via !== null ? ` · ${t('parte.via', { via: m.via })}` : ''}
                        </Text>
                      ) : m.via !== null ? (
                        <Text
                          style={{
                            fontFamily: typography.family.sans.regular,
                            fontSize: typography.size.sm,
                            color: theme.text.secondary,
                          }}
                        >
                          {t('parte.via', { via: m.via })}
                        </Text>
                      ) : null}
                      {/* S71-A CURA-2(b) 🔴 — `indicaciones` POR MEDICAMENTO
                          viajaba y jamás se renderizaba: "dáselo con comida"
                          moría en el wrapper. Es el campo MÁS accionable del
                          parte — la única instrucción que la familia ejecuta.
                          Va último y en texto primario. (OJO: la
                          `consulta.indicaciones` de la nota entera SÍ se
                          renderiza, pero dentro de "Ver completo" — son
                          campos distintos con el mismo nombre.) */}
                      {m.indicaciones !== null ? (
                        <Text
                          style={{
                            fontFamily: typography.family.sans.regular,
                            fontSize: typography.size.md,
                            color: theme.text.primary,
                          }}
                        >
                          {m.indicaciones}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Tarjeta>
              ))
            )}
          </View>

          {/* Estudios pedidos */}
          {estado.examenes.length > 0 ? (
            <View style={{ gap: spacing[2] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.md,
                  color: theme.text.primary,
                }}
              >
                {t('parte.examenesTitulo')}
              </Text>
              <Tarjeta elevacion="reposo">
                {estado.examenes.map((e, i) => (
                  <View key={i}>
                    {i > 0 ? <Separador /> : null}
                    <Celda
                      titulo={e.tipoExamen}
                      fin={(() => {
                        const v = VOZ_EXAMEN[e.estado];
                        // desconocido degrada DIGNO: sin insignia, jamás una
                        // etiqueta inventada (precedente LineaDeVida, Ley 3).
                        return v === undefined ? undefined : (
                          <Insignia estado={v.insignia} etiqueta={t(v.clave)} tamaño="sm" />
                        );
                      })()}
                    />
                  </View>
                ))}
              </Tarjeta>
            </View>
          ) : null}

          {/* Próximo control */}
          {estado.proximoControl !== null ? (
            <Tarjeta elevacion="reposo">
              <Celda
                titulo={t('parte.proximoControl')}
                subtitulo={t('parte.proximoControlFecha', { fecha: fechaLargaHumana(estado.proximoControl, idioma) })}
              />
            </Tarjeta>
          ) : null}

          {/* Ver la nota completa del veterinario (el original clínico) */}
          <Boton variante="ghost" bloque etiqueta={t('parte.verCompleto')} onPress={() => setVerNota(true)} />
        </ScrollView>
      )}

      {/* El registro clínico preservado (Ley 3) */}
      {estado !== 'cargando' && estado !== 'error' ? (
        <Hoja visible={verNota} onCerrar={() => setVerNota(false)} titulo={t('parte.notaClinica')} altura="completa" conCerrar>
          <HojaScroll contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
            {(
              [
                ['notaMotivo', estado.consulta.motivo],
                ['notaAnamnesis', estado.consulta.anamnesis],
                ['notaExamen', estado.consulta.examen],
                ['diagnostico', estado.consulta.diagnostico],
                ['notaPlan', estado.consulta.planTerapeutico],
                ['notaIndicaciones', estado.consulta.indicaciones],
              ] as const
            )
              .filter(([, valor]) => valor !== null)
              .map(([clave, valor]) => (
                <View key={clave} style={{ gap: spacing[1] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {t(`parte.${clave}` as 'parte.notaMotivo')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.md,
                      color: theme.text.primary,
                    }}
                  >
                    {valor}
                  </Text>
                </View>
              ))}
          </HojaScroll>
        </Hoja>
      ) : null}
    </SafeAreaView>
  );
}
