/**
 * LA CAMPANA — la lista de avisos (S88-C, lámina FIRMADA
 * `docs/laminas/LAMINA_CAMPANA.md`, 5-ago-2026).
 *
 * - Más nuevo arriba; cada aviso con su VOZ HUMANA (viaja como DATO — la
 *   misma del correo; la pantalla NO traduce tipos), su momento relativo
 *   y de qué mascota habla (§2).
 * - Tocar un aviso lo marca leído Y lleva AL LUGAR DEL HECHO (§3). El
 *   destino se arma ACÁ con tipo + referentes (el motor no manda rutas —
 *   la misma notificación lleva a pantallas distintas por app). Un tipo
 *   que esta app no sabe mapear se trata como SIN DESTINO: «un aviso sin
 *   destino no se pinta como si lo tuviera».
 * - No leídos distinguidos SIN GRITAR: huella chica en acento + título
 *   pleno. Jamás un número (MODELO_LOYALTY §3).
 * - Vacío honesto (§4, literal firmado). El memorial calla ACÁ TAMBIÉN —
 *   pero eso lo hereda del motor (`registrar_intencion_notificacion`),
 *   esta pantalla no vuelve a decidirlo.
 * - NO hace: marcar todo leído · mostrar descartados · repetir lo
 *   resuelto (letra firmada; el wrapper tampoco lo ofrece).
 *
 * ⚖️ LEY DE SECUENCIA (lámina): mientras `in_app.transporte_vivo=false`,
 * este lector devuelve lo retenido como piso — la pantalla se construye y
 * prueba HOY sin encender nada. El flip es el ÚLTIMO acto, de A, tras el
 * gate del founder. Esta pantalla NO lo toca.
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Huella,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { fechaCortaMono } from '@epetplace/i18n';
import {
  marcarAvisoLeido,
  obtenerMisAvisos,
  type AvisoDeCampana,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Lado de la huella-marcador de no leído: presencia, jamás número. */
const LADO_HUELLA = 10;

export default function Avisos() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [avisos, setAvisos] = useState<AvisoDeCampana[]>([]);
  const [intento, setIntento] = useState(0);

  // Refetch en focus (patrón de la casa): al volver del lugar del hecho,
  // el leído recién marcado se lee de la fuente, no de la memoria local.
  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerMisAvisos();
        if (!vigente) return;
        if (!r.ok) {
          setEstado('error');
          return;
        }
        setAvisos(r.data);
        setEstado('listo');
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  /** El momento relativo — voz corta; lo viejo cae a la fecha del riel. */
  function momento(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return t('avisos.momentoRecien');
    if (min < 60) return t('avisos.momentoMin', { n: min });
    const horas = Math.floor(min / 60);
    if (horas < 24) return t('avisos.momentoHoras', { n: horas });
    if (horas < 48) return t('avisos.momentoAyer');
    return fechaCortaMono(iso, idioma);
  }

  /** EL DESTINO se arma acá con tipo + referentes (jamás ruta del motor).
   *  `null` = esta app no sabe llevarlo — la fila no se pinta tocable,
   *  aunque el server diga que el hecho existe (lámina §3, lado app). */
  function destinoDe(a: AvisoDeCampana): string | null {
    if (!a.tieneDestino) return null;
    if ((a.tipo.startsWith('cita_') || a.tipo === 'procedimiento_agendado') && a.eventoId !== null) {
      return `/cita/${a.eventoId}`;
    }
    if (a.tipo === 'liquidacion_disponible') return '/liquidaciones';
    if (a.mascotaId !== null) return `/mascota/${a.mascotaId}`;
    return null;
  }

  async function alTocar(a: AvisoDeCampana, destino: string) {
    // §3: lo marca leído Y lleva al lugar del hecho. Optimista local; si
    // el marcado falla, el focus-refetch al volver dice la verdad — y el
    // fallo NO le corta el viaje a la persona (el destino es el acto).
    setAvisos((prev) => prev.map((x) => (x.id === a.id ? { ...x, leida: true } : x)));
    void marcarAvisoLeido(a.id).then((r) => {
      if (!r.ok && r.codigo !== 'aviso_no_encontrado') {
        mostrar({ texto: r.mensaje, variante: 'error' });
      }
    });
    router.push(destino as never);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('avisos.titulo')} atras onAtras={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6] }}>
        {estado === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
            </View>
          </EsqueletoGrupo>
        ) : estado === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('avisos.errorCargar')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('agenda.reintentar')}
                onPress={() => {
                  setEstado('cargando');
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        ) : avisos.length === 0 ? (
          // §4: vacío honesto — sin ilustración triste ni celebración.
          <EstadoVacio registro="seccion" titulo={t('avisos.vacio')} />
        ) : (
          <Tarjeta>
            {avisos.map((a, i) => {
              const destino = destinoDe(a);
              const titulo = a.titulo ?? t('avisos.sinVozTitulo');
              const meta = [momento(a.creadoEn), a.mascotaNombre].filter(Boolean).join(' · ');
              const acento = 'active' in theme.accent ? (theme.accent as { active: string }).active : theme.accent.primary;
              return (
                <View key={a.id}>
                  {i > 0 ? <Separador /> : null}
                  <Pressable
                    disabled={destino === null}
                    onPress={destino !== null ? () => void alTocar(a, destino) : undefined}
                    accessibilityRole={destino !== null ? 'button' : undefined}
                    accessibilityLabel={a.leida ? titulo : `${titulo}, ${t('avisos.noLeido')}`}
                    style={{ paddingVertical: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
                  >
                    <View style={{ flex: 1, gap: spacing[1] }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                        {!a.leida ? (
                          // La huella marca PRESENCIA (jamás número) — la
                          // visual se esconde: el estado viaja en el label.
                          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                            <Svg width={LADO_HUELLA} height={LADO_HUELLA} viewBox="0 0 24 24">
                              <Huella color={acento} />
                            </Svg>
                          </View>
                        ) : null}
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: a.leida ? typography.family.sans.regular : typography.family.sans.medium,
                            fontSize: typography.size.base,
                            color: theme.text.primary,
                          }}
                        >
                          {titulo}
                        </Text>
                      </View>
                      {a.mensaje !== null ? <Texto variante="apoyo">{a.mensaje}</Texto> : null}
                      {meta !== '' ? <Texto variante="dato">{meta}</Texto> : null}
                    </View>
                    {destino !== null ? (
                      <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.lg, color: theme.text.secondary }}>
                        {'›'}
                      </Text>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </Tarjeta>
        )}
      </ScrollView>
    </View>
  );
}
