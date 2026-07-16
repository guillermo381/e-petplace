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
// PLACEHOLDER HONESTO: la bitácora de la familia (§7) todavía no es
// pieza — el espacio queda declarado y se conecta cuando nazca.
// Historial de programas: por RLS el prestador ve SOLO los propios
// (pc_prestador_own) — la voz lo dice ("contigo").
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
  obtenerFichaAntesAdiestramiento,
  resolverUrlFoto,
  type FichaAntesAdiestramiento,
} from '@epetplace/api';
import { calcularMomentoVital, edadEnMeses } from '@epetplace/domain';
import { fechaCortaMono, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; ficha: FichaAntesAdiestramiento };

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
      const r = await obtenerFichaAntesAdiestramiento(mascotaId);
      if (!r.ok) {
        setPantalla({ estado: 'error', mensaje: r.mensaje });
        return;
      }
      setPantalla({ estado: 'listo', ficha: r.data });
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

            {/* PLACEHOLDER HONESTO §7: la bitácora aún no es pieza */}
            <Seccion titulo={t('adiestramiento.bitacoraTitulo')}>
              <Text style={vozSecundaria}>{t('adiestramiento.bitacoraPronto')}</Text>
            </Seccion>
          </>
        )}
      </ScrollView>
    </View>
  );
}
