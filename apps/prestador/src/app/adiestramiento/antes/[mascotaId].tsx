// ─────────────────────────────────────────────────────────────────────
// LA FICHA DEL ANTES de adiestramiento — /adiestramiento/antes/[mascotaId]
// (S63-B, Bloque 3 parcial; MODELO_ADIESTRAMIENTO §5). Dosis baja.
//
// TESIS: en 30 segundos sabes CÓMO es este perro — no solo quién es.
// FIRMA: las señales conductuales derivadas de paseos REALES (el
// expediente del ecosistema trabajando para el oficio — acá cierra el
// circuito de nervioso_otros_perros, nacido S46 "para futuros
// adiestradores"). Comportamiento, no color.
//
// Hermana de la ficha del Antes de grooming (mismo espíritu, misma
// altitud: señales como flags, jamás la HC completa). Su consumidor
// real (el Hoy / el flujo de sesión) se conecta cuando el resto del
// arco exista — hoy vive por URL, como la galería.
//
// LA BITÁCORA §7 ES REAL (tanda corta S63-B sobre el motor cd12903 de
// la A): el placeholder murió — el adiestrador lee lo que la familia
// practica antes de cada sesión (el circuito cierra en ambas
// direcciones). Historial de programas: por RLS el prestador ve SOLO
// los propios (pc_prestador_own) — la voz lo dice ("contigo").
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  Insignia,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
  type AvatarMascotaEspecie,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  obtenerBitacora,
  obtenerFichaAntesAdiestramiento,
  resolverUrlFoto,
  type EntradaBitacora,
  type FichaAntesAdiestramiento,
} from '@epetplace/api';
import { calcularMomentoVital, edadEnMeses } from '@epetplace/domain';
import { fechaCortaMono, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; ficha: FichaAntesAdiestramiento; bitacora: EntradaBitacora[] };

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing[2] }}>
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
        }}
      >
        {titulo}
      </Text>
      {children}
    </View>
  );
}

export default function AntesAdiestramiento() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t, idioma } = useTraduccion();
  const { mascotaId = '' } = useLocalSearchParams<{ mascotaId: string }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setPantalla({ estado: 'cargando' });
      const sesion = await verificarSesion();
      if (!sesion.ok) {
        setPantalla({ estado: 'error', mensaje: sesion.mensaje });
        return;
      }
      // S63-B tanda corta: la bitácora §7 dejó de ser placeholder — el
      // dato es real (motor cd12903 de la A; misma puerta RLS).
      const [r, rBitacora] = await Promise.all([
        obtenerFichaAntesAdiestramiento(mascotaId),
        obtenerBitacora(mascotaId, 10),
      ]);
      if (!r.ok) {
        setPantalla({ estado: 'error', mensaje: r.mensaje });
        return;
      }
      // La bitácora que falla NO tumba la ficha (L-139): vacío + la
      // ficha entera vale más que un error total; el vacío legal habla.
      setPantalla({ estado: 'listo', ficha: r.data, bitacora: rBitacora.ok ? rBitacora.data : [] });
      if (r.data.foto_url !== null) {
        const firmada = await resolverUrlFoto(r.data.foto_url);
        setFotoFirmada(firmada ?? undefined);
      }
    },
    [mascotaId],
  );

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;

  const ficha = pantalla.estado === 'listo' ? pantalla.ficha : null;
  const bitacora = pantalla.estado === 'listo' ? pantalla.bitacora : [];

  // Las señales del expediente como FLAGS (misma altitud que la hermana
  // de grooming — el detalle fino vive en "Conocer a {mascota}").
  const flags: { voz: string; insignia: InsigniaEstado }[] = [];
  if (ficha?.tiene_emergencia_activa) flags.push({ voz: t('detalleMascota.emergenciaActiva'), insignia: 'atencion' });
  if (ficha?.tiene_condicion_cronica) flags.push({ voz: t('detalleMascota.condicionCronica'), insignia: 'atencion' });
  // Alergias SON pertinentes al oficio: los premios son herramienta
  // de trabajo del adiestrador.
  if (ficha?.tiene_alergias) flags.push({ voz: t('detalleMascota.alergias'), insignia: 'atencion' });
  const momento =
    ficha !== null && ficha.umbrales !== null
      ? calcularMomentoVital({
          edadMeses: ficha.fecha_nacimiento !== null ? edadEnMeses(ficha.fecha_nacimiento, new Date()) : null,
          tieneCondicionCronica: ficha.tiene_condicion_cronica,
          esMemorial: ficha.es_memorial,
          umbrales: ficha.umbrales,
        })
      : null;
  // Solo perros (§3 del modelo): la voz del momento no bifurca especie.
  if (momento === 'M1') flags.push({ voz: t('adiestramiento.momentoCachorro'), insignia: 'info' });
  else if (momento === 'M5') flags.push({ voz: t('adiestramiento.momentoSenior'), insignia: 'info' });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}>
        <Encabezado
          variante="navegacion"
          titulo={ficha ? t('adiestramiento.tituloDe', { nombre: ficha.nombre }) : t('adiestramiento.titulo')}
          atras
          onAtras={() => router.back()}
        />

        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[4] }}>
                <Esqueleto forma="circulo" alto={96} />
                <Esqueleto forma="linea" ancho="40%" />
              </View>
              <Esqueleto forma="bloque" alto={120} />
              <Esqueleto forma="bloque" alto={96} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.status.dangerText,
                }}
              >
                {pantalla.mensaje}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {ficha && (
          <>
            {/* La mascota preside */}
            <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] }}>
              <AvatarMascota
                nombre={ficha.nombre}
                fotoUrl={fotoFirmada}
                especie={esEspecie(ficha.especie) ? ficha.especie : undefined}
                tamano="lg"
              />
              <View style={{ alignItems: 'center', gap: spacing[1] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.light,
                    fontSize: typography.size.xl,
                    color: theme.text.primary,
                  }}
                >
                  {ficha.nombre}
                </Text>
                {ficha.raza !== null && (
                  <Text
                    style={{
                      fontFamily: typography.family.mono.regular,
                      fontSize: typography.size.sm,
                      letterSpacing: typography.tracking.mono,
                      color: theme.text.secondary,
                    }}
                  >
                    {ficha.raza.toLowerCase()}
                  </Text>
                )}
              </View>
              {flags.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: spacing[1.5],
                  }}
                >
                  {flags.map((s) => (
                    <Insignia key={s.voz} estado={s.insignia} etiqueta={s.voz} tamaño="sm" />
                  ))}
                </View>
              )}
            </View>

            {/* LA FIRMA: señales conductuales de paseos reales */}
            <Seccion titulo={t('adiestramiento.senalesTitulo')}>
              {ficha.senales.length === 0 ? (
                <Text style={vozSecundaria}>{t('adiestramiento.senalesVacio')}</Text>
              ) : (
                <Tarjeta>
                  {ficha.senales.map((s, i) => (
                    <View key={s.codigo}>
                      {i > 0 && <Separador />}
                      <Celda
                        titulo={s.nombre}
                        subtitulo={s.descripcion ?? undefined}
                        metadataMono={`×${s.veces} · ${fechaCortaMono(s.ultima, idioma as IdiomaSoportado)}`}
                      />
                    </View>
                  ))}
                </Tarjeta>
              )}
              {ficha.senales.length > 0 && <Text style={vozSecundaria}>{t('adiestramiento.senalesOrigen')}</Text>}
            </Seccion>

            {/* Programas contigo (verdad de RLS: solo los propios) */}
            <Seccion titulo={t('adiestramiento.programasTitulo')}>
              {ficha.programas_previos.length === 0 ? (
                <Text style={vozSecundaria}>{t('adiestramiento.programasVacio')}</Text>
              ) : (
                <Tarjeta>
                  {ficha.programas_previos.map((p, i) => (
                    <View key={p.id}>
                      {i > 0 && <Separador />}
                      <Celda
                        titulo={p.nombre}
                        subtitulo={t('adiestramiento.programaSesiones', { n: p.n_sesiones })}
                        metadataMono={fechaCortaMono(p.contratado_en, idioma as IdiomaSoportado)}
                      />
                    </View>
                  ))}
                </Tarjeta>
              )}
            </Seccion>

            {/* LA BITÁCORA DE LA FAMILIA (§7 — dato REAL desde cd12903):
                el circuito cierra en ambas direcciones — la familia
                escribe en su hub, el adiestrador lee antes de la sesión.
                Chips en voz de familia POR IDIOMA (jamás el código);
                texto verbatim; aportado_por_menor NO es voz de UI. */}
            <Seccion titulo={t('adiestramiento.bitacoraTitulo')}>
              {bitacora.length === 0 ? (
                <Text style={vozSecundaria}>{t('adiestramiento.bitacoraVacia')}</Text>
              ) : (
                <Tarjeta>
                  {bitacora.map((e, i) => (
                    <View key={e.bitacora_id}>
                      {i > 0 && <Separador />}
                      <View style={{ paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[2] }}>
                        <Text
                          style={{
                            fontFamily: typography.family.mono.regular,
                            fontSize: typography.size.xs,
                            letterSpacing: typography.tracking.mono,
                            color: theme.text.secondary,
                          }}
                        >
                          {fechaCortaMono(e.created_at, idioma as IdiomaSoportado)}
                        </Text>
                        {e.chips.length > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1.5] }}>
                            {e.chips.map((c) => (
                              <Insignia
                                key={`${e.bitacora_id}-${c.codigo}`}
                                estado="info"
                                etiqueta={idioma === 'en' ? c.nombre_familia_en : c.nombre_familia}
                                tamaño="sm"
                              />
                            ))}
                          </View>
                        )}
                        {e.texto !== null && (
                          <Text
                            style={{
                              fontFamily: typography.family.sans.regular,
                              fontSize: typography.size.base,
                              lineHeight: typography.size.base * 1.4,
                              color: theme.text.primary,
                            }}
                          >
                            {e.texto}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </Tarjeta>
              )}
            </Seccion>
          </>
        )}
      </ScrollView>
    </View>
  );
}
