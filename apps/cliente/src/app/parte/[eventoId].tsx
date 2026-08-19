/**
 * S70-A4 — EL PARTE DEL DUEÑO: la consulta clínica en voz de familia.
 * La FÓRMULA destacada (nombre, presentación, cantidad, posología en
 * palabras llanas); el original clínico del veterinario PRESERVADO detrás
 * de la celda "La nota del veterinario" (Ley 3, dos registros); próximo
 * control visible si existe.
 *
 * S82-C LAZO 1 (MOMENTO del triage C7) — la vara:
 *   TESIS: el vet te dejó dicho qué tiene tu mascota y qué darle — acá,
 *   en tu idioma.
 *   FIRMA: el diagnóstico PRESIDE en voz humana y la Entrada escalonada
 *   ordena la lectura (qué encontró → qué darle → el resto). L-c: el
 *   orden de lectura ES el contenido del parte.
 *   CHANEL: murió el glifo `veterinaria` repetido en CADA tarjeta de la
 *   fórmula (Ley 12: un glifo repetido por fila de su propia sección no
 *   informa — el header ya dijo de qué son todas) · murió el '—' del
 *   diagnóstico ausente (Ley 13: el hueco no se disfraza de dato — la
 *   tarjeta se omite y la fórmula preside) · murió el ghost mudo "Ver
 *   completo" (19.1: el botón blanco de solo texto no dice a dónde va —
 *   ahora es CeldaNavegacion sin glifo, anatomía S73: acción-label sin
 *   hermanos que varíen).
 *
 * Ley 13: el error jamás se disfraza de vacío. Back siempre.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Entrada,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaDato,
  Hoja,
  HojaScroll,
  Insignia,
  Separador,
  Tarjeta,
  Texto,
  spacing,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={[]}>
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
          {/* 0 — QUÉ ENCONTRÓ: el diagnóstico preside (la firma). */}
          <Entrada>
            <View style={{ gap: spacing[4] }}>
              {estado.negocioNombre !== null ? (
                <Texto variante="apoyo">
                  {t('parte.enNegocio', { negocio: estado.negocioNombre })} · {fechaLargaHumana(estado.fecha, idioma)}
                </Texto>
              ) : null}

              {estado.consulta.diagnostico !== null || estado.consulta.motivo !== null ? (
                <Tarjeta elevacion="reposo">
                  <View style={{ gap: spacing[2] }}>
                    <Texto variante="apoyo">{t('parte.diagnostico')}</Texto>
                    <Texto variante="titulo">{estado.consulta.diagnostico ?? estado.consulta.motivo}</Texto>
                    {estado.consulta.motivo !== null && estado.consulta.diagnostico !== null ? (
                      <Texto variante="cuerpo" color="secondary">
                        {estado.consulta.motivo}
                      </Texto>
                    ) : null}
                  </View>
                </Tarjeta>
              ) : null}
            </View>
          </Entrada>

          {/* 1 — QUÉ DARLE: la fórmula destacada. */}
          <Entrada orden={1}>
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{t('parte.formulaTitulo')}</Texto>
              {estado.formula.length === 0 ? (
                <Texto variante="apoyo">{t('parte.sinFormula')}</Texto>
              ) : (
                estado.formula.map((m: ItemFormulaParte, i: number) => (
                  <Tarjeta key={i} elevacion="reposo">
                    <View style={{ gap: spacing[1] }}>
                      <Texto variante="titulo">{m.nombre}</Texto>
                      {/* S71-A CURA-2(b): principioActivo bajo el nombre
                          comercial — es como está rotulada la caja. */}
                      {m.principioActivo !== null ? <Texto variante="apoyo">{m.principioActivo}</Texto> : null}
                      {m.presentacion !== null || m.cantidad !== null ? (
                        <Texto variante="dato">
                          {[m.presentacion, m.cantidad !== null ? t('parte.cantidad', { n: m.cantidad }) : null]
                            .filter((x) => x !== null)
                            .join(' · ')}
                        </Texto>
                      ) : null}
                      {/* S71-A CURA-2(a): cada campo se muestra si existe —
                          una dosis sin frecuencia NO se calla. */}
                      {m.dosis !== null || m.frecuencia !== null ? (
                        <Texto variante="cuerpo">
                          {m.dosis !== null && m.frecuencia !== null
                            ? t('parte.dosisLinea', { dosis: m.dosis, frecuencia: m.frecuencia })
                            : (m.dosis ?? m.frecuencia)}
                        </Texto>
                      ) : null}
                      {m.duracionDias !== null ? (
                        <Texto variante="apoyo">
                          {t('parte.porDias', { dias: m.duracionDias })}
                          {m.via !== null ? ` · ${t('parte.via', { via: m.via })}` : ''}
                        </Texto>
                      ) : m.via !== null ? (
                        <Texto variante="apoyo">{t('parte.via', { via: m.via })}</Texto>
                      ) : null}
                      {/* S71-A CURA-2(b): `indicaciones` por medicamento es
                          lo MÁS accionable del parte — último y primario. */}
                      {m.indicaciones !== null ? <Texto variante="cuerpo">{m.indicaciones}</Texto> : null}
                    </View>
                  </Tarjeta>
                ))
              )}
            </View>
          </Entrada>

          {/* 2 — EL RESTO: estudios, control, el registro original. */}
          <Entrada orden={2}>
            <View style={{ gap: spacing[4] }}>
              {estado.examenes.length > 0 ? (
                <View style={{ gap: spacing[2] }}>
                  <Texto variante="seccion">{t('parte.examenesTitulo')}</Texto>
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

              {estado.proximoControl !== null ? (
                <Tarjeta elevacion="reposo">
                  <FilaDato
                    etiqueta={t('parte.proximoControl')}
                    valor={fechaLargaHumana(estado.proximoControl, idioma)}
                    mono
                  />
                </Tarjeta>
              ) : null}

              {/* El original clínico (Ley 3): celda que dice a dónde va —
                  sin glifo (acción-label sin hermanos que varíen, S73). */}
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <CeldaNavegacion
                  titulo={t('parte.notaDelVet')}
                  detalle={t('parte.notaDelVetDetalle')}
                  onPress={() => setVerNota(true)}
                />
              </Tarjeta>
            </View>
          </Entrada>
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
                <FilaDato key={clave} etiqueta={t(`parte.${clave}` as 'parte.notaMotivo')} valor={valor ?? ''} />
              ))}
          </HojaScroll>
        </Hoja>
      ) : null}
    </SafeAreaView>
  );
}
