/**
 * HOGAR — la tesis del producto hecha pantalla (S51-B2.2, sobre
 * DISEÑO_EXPERIENCIA §1-§2): el estado del hogar, no una grilla.
 *
 * ORDEN S58 (patrón v2 "techo vivo" FIRMADO), de arriba hacia abajo:
 *   Techo vivo — HeroMarca techoVivo (curva 44/26) + destello Coach.
 *   HERO de hoy — atención en curso (CitaEnVivo, Ley 7) o el próximo
 *     paseo en tarjeta de DOS PISOS (servicio+estado relativo en capa
 *     teal / dirección del snapshot D-339 con pin y chevron → hub).
 *     Sin nada: NO EXISTE (silencio digno).
 *   Tu hogar — las mascotas con su línea de estado Y su próxima cita
 *     (FichaMascotaHogar; voz calculada por calcularVozHogar de
 *     @epetplace/domain sobre el expediente REAL — L-139). Tap → perfil.
 *   GRUPO de celdas (Ley 19.1) — carnet/hub/agregar con subtítulo VIVO.
 *   Zona 3 — en contexto: el motor de revelaciones es B4 — hueco
 *     estructural (ver ZONA 3 abajo), null honesto.
 *   La vida — LineaDeVida del HOGAR (merge multi-mascota por fecha).
 *
 * Herencias vivas de la pantalla S45-S48 que esta reemplaza: Hoja de
 * detalle de vacuna (tap en nodo) y VisorFoto del carnet. La Hoja de
 * Ajustes/sesión MIGRÓ a Cuenta (B2.5).
 *
 * S82-C LAZO 4d (CLARIDAD, pasada ANGOSTA a propósito — el Hogar es LA
 * PANTALLA PATRÓN firmada): migran SOLO las recetas exactas de Texto
 * (acordeón error/sin-detalle → apoyo · la Hoja de vacuna: nombre →
 * seccion, detalle → apoyo). NO SE TOCAN, declarado: los títulos de
 * zona sm/medium/secondary (calibración de la FIRMA hogar-v2 — no se
 * estandarizan a `seccion` sin gate) · el mensaje de familia del
 * acordeón (voz humana con interlineado, fuera de la API) · el
 * verEnVivo en accent (color fuera de la API) · la meta mono xs con
 * tracking (escala fuera de `dato`).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  AvatarMascota,
  Boton,
  Celda,
  CeldaNavegacion,
  CitaEnVivo,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FichaMascotaHogar,
  HeroMarca,
  Hoja,
  Icono,
  HojaScroll,
  Insignia,
  LineaDeVida,
  PieRevelar,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Huella,
  Isotipo,
  Texto,
  VisorFoto,
  motion,
  radius,
  spacing,
  typography,
  useAviso,
  usePresionado,
  useTheme,
  type FichaMascotaHogarAccion,
  type FichaMascotaHogarVoz,
  type IconoNombre,
  type LineaDeVidaEstadoPie,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerMiPerfil,
  leerDetalleAtencion,
  leerTimelineHogar,
  obtenerEstadoHogar,
  obtenerMascotasDeFamilia,
  obtenerMisPlanesPaseo,
  obtenerCitasActivasHogar,
  obtenerPresupuestosFamilia,
  type PresupuestoFamilia,
  mascotasElegibles,
  obtenerResumenServiciosHogar,
  type ResumenServiciosHogar,
  obtenerVacunaPorEvento,
  obtenerSolicitudesPendientesDueno,
  resolverUrlFoto,
  resolverUrlsFotos,
  type DetalleAtencion,
  type EstadoHogar,
  type ItemTimeline,
  type MascotaResumen,
  type PlanPaseo,
  type SolicitudPendiente,
  type VacunaDeEvento,
} from '@epetplace/api';
import { calcularVozHogar, type VozEstadoHogar } from '@epetplace/domain';

import { fechaCortaMono, fechaLargaHumana } from '@epetplace/i18n';

import { CoachHoja } from '@/components/coach';
import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';
import { FAMILIA_DE_TIPO, vozHecho } from '@/lib/voz-hecho';


type TraductorHogar = ReturnType<typeof useTraduccion>['t'];

// Saludo por franja horaria (S52-P2a, voz del lote): la app saluda
// como una persona — mañana/tarde/noche del reloj del dispositivo.
function saludoPorFranja(hora: number, t: TraductorHogar): string {
  if (hora >= 5 && hora < 12) return t('hogar.saludoManana');
  if (hora >= 12 && hora < 19) return t('hogar.saludoTarde');
  return t('hogar.saludoNoche');
}

// Entrada escalonada de zonas (S52-P2f): fade+translate sutil, tokens
// de la casa (<300ms, Ley 6); solo al montar — jamás en re-fetch.
const entradaZona = (orden: number) =>
  FadeInDown.duration(motion.duration.normal).delay(orden * motion.stagger.fast);

// S71-A3: cuandoRelativo y nombreDia MURIERON con las frases largas de
// la zona de servicios (el rail habla en fecha corta mono — regla E4);
// sus keys (enMinutos/enHoras/planDias…) murieron con ellos (Ley 37).


// Código de voz (Ley 3: jamás visible) → texto del riel + semántica.
// S52-P3: la ficha usa las voces SIN sujeto (ficha.*) — el nombre
// preside la card y no se repite. Las variantes con {{nombre}}
// (hogar.voz*) se CONSERVAN para contextos sin sujeto visible
// (notificaciones, Coach, alertas — decisión founder S52).
function vozATexto(voz: VozEstadoHogar, t: TraductorHogar): { texto: string; semantica: FichaMascotaHogarVoz } {
  switch (voz.voz) {
    case 'alDia':
      return { texto: t('ficha.vozAlDia'), semantica: 'alDia' };
    case 'pideAtencion': {
      if (voz.causa === 'emergencia') {
        return { texto: t('ficha.vozEmergencia'), semantica: 'pideAtencion' };
      }
      const { vacuna, dias } = voz;
      if (voz.causa === 'vacunaVence') {
        const texto =
          dias === 0
            ? t('ficha.vozVacunaVenceHoy', { vacuna })
            : dias === 1
              ? t('ficha.vozVacunaVenceUnDia', { vacuna })
              : t('ficha.vozVacunaVence', { vacuna, dias });
        return { texto, semantica: 'pideAtencion' };
      }
      const texto =
        dias === 1
          ? t('ficha.vozVacunaVencidaUnDia', { vacuna })
          : t('ficha.vozVacunaVencida', { vacuna, dias });
      return { texto, semantica: 'pideAtencion' };
    }
    case 'conociendolo':
      return {
        texto: voz.causa === 'expedienteRalo' ? t('ficha.vozConociendolo') : t('ficha.vozQuieto'),
        semantica: 'conociendolo',
      };
  }
}

// ═══════════ ZONA 3 — EN CONTEXTO (hueco estructural) ═══════════
// El motor de revelaciones NO existe (nace en B4 junto al de alertas —
// trenza A0⇄B4). Cuando exista, entregará a esta pantalla un valor de
// este tipo y la zona se renderizará entre Zona 2 y Zona 4. Hasta
// entonces: null honesto ESTRUCTURAL — cero card vacía, cero relleno.
type RevelacionZona3 = { titulo: string; narrativa: string; accion: () => void } | null;
// ═════════════════════════════════════════════════════════════════

type EstadoMascotas = MascotaResumen[] | 'cargando' | 'error';

// S61-A11: el item del HOGAR = el del timeline + su mascota (el merge
// multi-mascota etiqueta; leerTimelineMascota es por mascota).
type ItemHogar = ItemTimeline & { mascota_id: string };


// ═══════════ S82-C RONDA 2 — LA LÁMINA POSICIÓN CONSOLIDADA ═══════════
// (docs/laminas/2026-07-29-s82-posicion-consolidada.html ES el acuerdo;
// §10: criterio no evidencia — sombras por elevacion.ts, motion por los
// rieles de RN. Overrides LOCALES: viajan a B como candidatas tras el
// gate; el guard R10 de verify:diseno vigila que el marcador
// @override-s82c no salga de esta pantalla.)

/** @override-s82c — EL CANTO QUE PINTA LA CURVA (ítem 2). El principio
 *  resuelto del lado prestador (FilaCita S80-B15, leído de ahí): el
 *  color vive en el ELEMENTO PORTADOR DEL RADIO — jamás un View
 *  absoluto recortado (la mordida medida en B13). Anatomía de la
 *  lámina: el color ES el fondo de la tarjeta exterior (radius.lg,
 *  elevacion.reposo) y la superficie entra 6px desde la izquierda con
 *  RADIO MENOR (radius.md) — la curva queda pintada por construcción.
 *  RECONCILIACIÓN DECLARADA: la lámina degrada el color a 40% de alfa
 *  hacia abajo; la FIRMA B15 dice canto SÓLIDO en lista contigua (el
 *  degradado repetido da serrucho) — gana la firma: sólido. */
function CantoCurva({ color, children }: { color: string | null; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: color ?? theme.bg.card,
        borderRadius: radius.lg,
        boxShadow: theme.elevacion.reposo,
      }}
    >
      <View
        style={{
          marginLeft: color !== null ? 6 : 0,
          backgroundColor: theme.bg.card,
          borderRadius: radius.md,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** El chevron de fila (path canónico de CeldaNavegacion): › navega ·
 *  ⌄ revela · ⌃ pliega (la dirección codifica la verdad, Ley 18; el
 *  giro se dice por REEMPLAZO de path — precedente PieRevelar, L-c:
 *  animar la rotación no agrega significado). */
function ChevronFila({ forma }: { forma: 'navega' | 'revela' | 'pliega' }) {
  const { theme } = useTheme();
  const d = forma === 'navega' ? 'M9 5l7 7-7 7' : forma === 'revela' ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6';
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path d={d} stroke={theme.text.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** @override-s82c — LA FILA DE RECOMENDACIÓN (ítem 1): glifo en placa
 *  tintada de su capa + título + detalle + chevron; alto mínimo 44;
 *  la fila ENTERA navega (rol button, precedente 18e0c61). Candidata a
 *  B: es prima de CeldaNavegacion con placa de capa — no se generaliza
 *  desde acá (Ley 11: nace en ui por su puerta, después del gate). */
function FilaReco({
  capa,
  icono,
  titulo,
  detalle,
  onPress,
}: {
  capa: 'identidad' | 'cuidado';
  icono: IconoNombre;
  titulo: string;
  detalle: string | null;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const presion = usePresionado(0.99);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={presion.handlers.onPressIn}
      onPressOut={presion.handlers.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={[titulo, detalle].filter(Boolean).join(', ')}
    >
      <Animated.View
        style={[
          presion.estiloPresionado,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            minHeight: 44,
          },
        ]}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: radius.md,
            // memorial no tiene registro capaBg: la placa degrada a
            // overlay neutro (memorial no se celebra, Ley 8).
            backgroundColor: 'capaBg' in theme ? theme.capaBg[capa] : theme.bg.overlay,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icono nombre={icono} tamano={21} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: spacing[0.5] }}>
          <Texto variante="cuerpo" numberOfLines={2}>{titulo}</Texto>
          {detalle !== null ? <Texto variante="apoyo" numberOfLines={1}>{detalle}</Texto> : null}
        </View>
        <ChevronFila forma="navega" />
      </Animated.View>
    </Pressable>
  );
}

/** Las familias del filtro de la vida (Ley 3: el código del evento
 *  jamás sale de acá). 'salud' junta vacunas y consultas. */
type FamiliaVida = 'salud' | 'paseos' | 'estetica' | 'adiestramiento';
type FiltroVidaCodigo = 'todo' | FamiliaVida;

/** @override-s82c — EL FILTRO DE LA VIDA (ítem 3): pills de 44 con
 *  glifo en TRAZO; el elegido gana LA huella rellena — glifo sobre
 *  fondo tinta (lámina). "Todo" lleva la Huella canónica (la primitiva
 *  — nadie la redibuja, Ley 12). Separación 10, scroll horizontal.
 *  Borde 1.5 de la casa (la lámina traza 1.9: ese grosor es de GLIFO,
 *  no de borde — divergencia declarada). */
function FiltroVida({
  activo,
  onCambio,
  etiquetas,
}: {
  activo: FiltroVidaCodigo;
  onCambio: (c: FiltroVidaCodigo) => void;
  etiquetas: Record<FiltroVidaCodigo, string>;
}) {
  const { theme } = useTheme();
  const OPCIONES: { codigo: FiltroVidaCodigo; icono: IconoNombre | 'huella' }[] = [
    { codigo: 'todo', icono: 'huella' },
    { codigo: 'salud', icono: 'veterinaria' },
    { codigo: 'paseos', icono: 'paseo' },
    { codigo: 'estetica', icono: 'grooming' },
    { codigo: 'adiestramiento', icono: 'training' },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2.5], paddingHorizontal: spacing[4] }}>
      {OPCIONES.map((o) => {
        const elegido = o.codigo === activo;
        const tintaGlifo = elegido ? theme.bg.card : theme.text.secondary;
        return (
          <Pressable
            key={o.codigo}
            onPress={() => onCambio(o.codigo)}
            accessibilityRole="radio"
            accessibilityState={{ selected: elegido }}
            accessibilityLabel={etiquetas[o.codigo]}
            style={{
              height: 44,
              borderRadius: radius.full,
              borderWidth: 1.5,
              borderColor: elegido ? theme.text.primary : theme.border.default,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[2],
              paddingLeft: spacing[1.5],
              paddingRight: spacing[4],
              ...(elegido ? { boxShadow: theme.elevacion.reposo } : null),
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: radius.full,
                backgroundColor: elegido ? theme.text.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {o.icono === 'huella' ? (
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Huella color={tintaGlifo} escala={0.85} x={1.8} y={1.8} />
                </Svg>
              ) : (
                <Icono nombre={o.icono} tamano={16} registro="tinta" tinta={tintaGlifo} />
              )}
            </View>
            <Texto variante="apoyo" color={elegido ? 'primary' : 'secondary'}>
              {etiquetas[o.codigo]}
            </Texto>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** La línea mono del hecho: fecha (fecha_sola = partes UTC, S48-B6.3 —
 *  jamás una hora inventada) · hora local · duración · quién. */
function metaHecho(item: ItemHogar, idioma: 'es' | 'en'): string {
  const fecha = item.fecha_sola
    ? fechaCortaMono(item.fecha_evento.slice(0, 10), idioma)
    : fechaCortaMono(new Intl.DateTimeFormat('en-CA').format(new Date(item.fecha_evento)), idioma);
  const hora = item.fecha_sola ? null : new Date(item.fecha_evento).toTimeString().slice(0, 5);
  const dur = item.duracion_min !== null ? `${item.duracion_min} min` : null;
  const fuente = item.titulo_fuente !== null ? item.titulo_fuente.toLowerCase() : null;
  return [fecha, hora, dur, fuente].filter((x): x is string => x !== null).join(' · ');
}

// ── S61-A11 → S82-C: el detalle de la vida — se despliega DEBAJO al
// tocar (jamás navega de una); fetch perezoso al expandir. Gana FOTOS
// y QUIÉN LO CARGÓ (lámina ítem 3); "Ver completo" para paseo y
// adiestramiento como hasta ahora.
function DetalleNodoHogar({
  atencionId,
  mascota,
  onVerCompleto,
}: {
  atencionId: string;
  mascota: { nombre: string; fotoUrl?: string } | null;
  onVerCompleto: () => void;
}) {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const [detalle, setDetalle] = useState<DetalleAtencion | 'cargando' | 'error'>('cargando');

  useEffect(() => {
    let vigente = true;
    void leerDetalleAtencion(atencionId).then((r) => {
      if (vigente) setDetalle(r.ok ? r.data : 'error');
    });
    return () => {
      vigente = false;
    };
  }, [atencionId]);

  if (detalle === 'cargando') {
    return (
      <EsqueletoGrupo etiqueta={t('hogar.acordeonCargando')}>
        <View style={{ gap: spacing[2] }}>
          <Esqueleto forma="linea" ancho="80%" />
          <Esqueleto forma="linea" ancho="50%" />
        </View>
      </EsqueletoGrupo>
    );
  }
  if (detalle === 'error') {
    return (
      <Texto variante="apoyo" color="danger">{t('hogar.acordeonError')}</Texto>
    );
  }
  const sinNada =
    detalle.mensaje_familia === null && detalle.servicios_aplicados.length === 0 && detalle.fotos.length === 0;
  return (
    <View style={{ gap: spacing[3] }}>
      {detalle.mensaje_familia !== null ? (
        <Text
          style={{
            // voz humana: DM Sans 300 (regla de voz) — el cierre emocional
            fontFamily: typography.family.sans.light,
            fontSize: typography.size.md,
            lineHeight: Math.round(typography.size.md * typography.leading.snug),
            color: theme.text.primary,
          }}
        >
          “{detalle.mensaje_familia}”
        </Text>
      ) : null}
      {detalle.servicios_aplicados.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1.5] }}>
          {detalle.servicios_aplicados.map((sv) => (
            <Insignia key={sv.codigo} estado="info" tamaño="sm" etiqueta={idioma === 'en' ? sv.voz_en : sv.voz} />
          ))}
        </View>
      ) : null}
      {/* Lámina ítem 3: las FOTOS del momento — tiras 78×62 con radio de
          la casa; las URLs ya vienen firmadas del wrapper. Sin tap en v1
          (la lámina no lo pide; el completo vive en "Ver completo"). */}
      {detalle.fotos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
          {detalle.fotos.map((f) => (
            <Image
              key={f.id}
              source={{ uri: f.url }}
              style={{ width: 78, height: 62, borderRadius: radius.md, backgroundColor: theme.bg.overlay }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ))}
        </ScrollView>
      ) : null}
      {sinNada ? (
        <Texto variante="apoyo">{t('hogar.acordeonSinDetalle')}</Texto>
      ) : null}
      {/* Lámina ítem 3: QUIÉN LO CARGÓ — la mascota (chip con su cara) y
          el autor (voz de máquina, minúsculas de la casa — la lámina lo
          escribe en mayúsculas: criterio, no evidencia; manda Ley 3). */}
      {mascota !== null || detalle.titulo_fuente !== null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          {mascota !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}>
              <AvatarMascota nombre={mascota.nombre} fotoUrl={mascota.fotoUrl} tamano="xs" />
              <Texto variante="apoyo">{mascota.nombre}</Texto>
            </View>
          ) : null}
          {detalle.titulo_fuente !== null ? (
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Texto variante="dato" numberOfLines={1}>{detalle.titulo_fuente.toLowerCase()}</Texto>
            </View>
          ) : null}
        </View>
      ) : null}
      {detalle.oficio === 'paseo' ? (
        <View style={{ alignSelf: 'flex-start' }}>
          <Boton variante="compacto" etiqueta={t('hogar.acordeonVerCompleto')} onPress={onVerCompleto} />
        </View>
      ) : detalle.oficio === 'adiestramiento' && detalle.cita_id !== null ? (
        // S65: la sesión tiene SU parte — el acordeón invita a verlo
        // entero (progresión, clips, instrucciones), como el paseo.
        <View style={{ alignSelf: 'flex-start' }}>
          <Boton
            variante="compacto"
            etiqueta={t('hogar.acordeonVerCompleto')}
            onPress={() =>
              router.push({ pathname: '/adiestramiento/[citaId]', params: { citaId: detalle.cita_id as string } })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

/** El detalle INLINE de una vacuna (lámina ítem 3: la vida se despliega
 *  en su lugar — la Hoja de vacuna del S45 murió absorbida, Ley 37).
 *  Reusa las voces vacunaHoja.* y el camino Ver carnet → VisorFoto. */
function DetalleVacunaVida({ eventoId, onVerCarnet }: { eventoId: string; onVerCarnet: (path: string) => void }) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const idioma = useTraduccion().idioma;
  const [vacuna, setVacuna] = useState<VacunaDeEvento | 'cargando' | 'error'>('cargando');

  useEffect(() => {
    let vigente = true;
    void obtenerVacunaPorEvento(eventoId).then((r) => {
      if (vigente) setVacuna(r.ok ? r.data : 'error');
    });
    return () => {
      vigente = false;
    };
  }, [eventoId]);

  if (vacuna === 'cargando') {
    return (
      <EsqueletoGrupo etiqueta={t('vacunaHoja.cargando')}>
        <View style={{ gap: spacing[2] }}>
          <Esqueleto forma="linea" ancho="60%" />
          <Esqueleto forma="linea" ancho="40%" />
        </View>
      </EsqueletoGrupo>
    );
  }
  if (vacuna === 'error') {
    return <Texto variante="apoyo" color="danger">{t('vacunaHoja.error')}</Texto>;
  }
  return (
    <View style={{ gap: spacing[2] }}>
      {(vacuna.tipo_vacuna || vacuna.veterinario_nombre_externo) && (
        <Texto variante="apoyo">
          {[vacuna.tipo_vacuna, vacuna.veterinario_nombre_externo].filter(Boolean).join(' · ')}
        </Texto>
      )}
      {(vacuna.fecha_aplicada || vacuna.fecha_proxima || vacuna.lote) && (
        <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
          {[
            vacuna.fecha_aplicada ? `${t('vacunaHoja.aplicada')} ${fechaCortaMono(vacuna.fecha_aplicada, idioma)}` : null,
            vacuna.fecha_proxima ? `${t('vacunaHoja.proxima')} ${fechaCortaMono(vacuna.fecha_proxima, idioma)}` : null,
            vacuna.lote ? `${t('vacunaHoja.lote')} ${vacuna.lote.toLowerCase()}` : null,
          ].filter(Boolean).join(' · ')}
        </Text>
      )}
      {vacuna.archivo_url !== null && (
        <View style={{ alignSelf: 'flex-start' }}>
          <Boton
            variante="compacto"
            etiqueta={t('vacunaHoja.verCarnet')}
            onPress={() => { if (vacuna.archivo_url !== null) onVerCarnet(vacuna.archivo_url); }}
          />
        </View>
      )}
    </View>
  );
}

/** @override-s82c — LA CARTA DE UN HECHO de "tu vida" (ítem 3, sobre el
 *  canto que pinta la curva): título + fecha SIEMPRE visibles; el tap
 *  despliega el detalle en su lugar (⌄/⌃ por reemplazo de path) o
 *  navega (›) cuando el hecho tiene su propia pantalla MOMENTO (la
 *  consulta → el parte). El despliegue monta directo — el layout de
 *  listas no se anima (Ley 6); la transición de altura de la lámina no
 *  viaja, declarado. */
function EventoVida({
  color,
  titulo,
  meta,
  navega,
  expandido,
  onPress,
  children,
}: {
  color: string | null;
  titulo: string;
  meta: string;
  /** true = el chevron es › y el tap navega (no hay despliegue). */
  navega?: boolean;
  expandido?: boolean;
  /** Sin onPress el hecho es INERTE: sin chevron, sin rol button. */
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const presion = usePresionado(0.99);
  if (onPress === undefined) {
    return (
      <CantoCurva color={color}>
        <View style={{ gap: spacing[1], padding: spacing[4], minHeight: 44, justifyContent: 'center' }}>
          <Texto variante="cuerpo" numberOfLines={2}>{titulo}</Texto>
          <Texto variante="dato" numberOfLines={1}>{meta}</Texto>
        </View>
      </CantoCurva>
    );
  }
  return (
    <CantoCurva color={color}>
      <Pressable
        onPress={onPress}
        onPressIn={presion.handlers.onPressIn}
        onPressOut={presion.handlers.onPressOut}
        accessibilityRole="button"
        accessibilityState={navega ? undefined : { expanded: expandido === true }}
        accessibilityLabel={`${titulo}, ${meta}`}
      >
        <Animated.View
          style={[
            presion.estiloPresionado,
            { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], minHeight: 44 },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
            <Texto variante="cuerpo" numberOfLines={2}>{titulo}</Texto>
            <Texto variante="dato" numberOfLines={1}>{meta}</Texto>
          </View>
          <ChevronFila forma={navega ? 'navega' : expandido ? 'pliega' : 'revela'} />
        </Animated.View>
      </Pressable>
      {expandido === true && children !== undefined ? (
        <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}>{children}</View>
      ) : null}
    </CantoCurva>
  );
}

export default function Hogar() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  // D-401: pressed del destello del Coach (el único tocable artesanal del Hogar)
  const pressedCoach = usePresionado(0.97);

  const [mascotas, setMascotas] = useState<EstadoMascotas>('cargando');
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [estadoHogar, setEstadoHogar] = useState<EstadoHogar | null>(null);

  // Zona 4 — timeline del hogar: merge multi-mascota con cursor por mascota.
  // S61-A11: cada item porta SU mascota (el merge la etiqueta) — el
  // filtro por mascota y el avatar del chip la necesitan.
  const [items, setItems] = useState<ItemHogar[] | null | 'error'>(null);
  // S82-C (lámina, ítem 3): UN filtro por familia con glifo — reemplaza
  // a los dos SelectorOpcion (¿De quién? y ¿Qué momentos?). La dimensión
  // mascota sigue visible: cada hecho lleva su chip en el detalle; la
  // vista por-mascota vive en su perfil. Retiro declarado al gate.
  const [filtroVida, setFiltroVida] = useState<FiltroVidaCodigo>('todo');
  const [hechosAbiertos, setHechosAbiertos] = useState<Record<string, boolean>>({});
  // S74-A (cura D-497): el cursor del timeline es GLOBAL — una sola
  // query hogar-wide reemplazó a las N páginas por mascota.
  const cursorRef = useRef<string | null>(null);
  const [estadoPie, setEstadoPie] = useState<LineaDeVidaEstadoPie>('nada');
  const cargandoMasRef = useRef(false);

  const [coachAbierto, setCoachAbierto] = useState(false);
  // D-338: la celda del Hogar es una de las DOS entradas al hub "Mis
  // paseos" — visible SOLO con planes (silencio digno). S58: se guarda
  // el primer plan ACTIVO para el subtítulo VIVO del grupo.
  const [planActivo, setPlanActivo] = useState<PlanPaseo | null>(null);
  const [hayPlanes, setHayPlanes] = useState(false);
  // S60-A6 (D-366, insumo de Kary): la posición por servicio para la
  // zona de SERVICIOS VIVOS — null mientras carga o si la lectura falló
  // (la zona calla, jamás pinta verosímil-falso — L-139).
  const [resumenServicios, setResumenServicios] = useState<ResumenServiciosHogar | null>(null);
  // S73 ítem 1: con mínimo-4 el fallo del resumen NO puede callar (antes
  // era "zona callada") — pintaría cuatro «Descubre» falsos (L-139).
  const [resumenError, setResumenError] = useState(false);
  // QW1 (S53): el saludo lleva el nombre del miembro (profiles.nombre).
  const [nombrePerfil, setNombrePerfil] = useState<string | null>(null);
  // S71-A3 — PONTE AL DÍA (F2): los habitantes de la sección que preside.
  // El presupuesto deja de ser "UNO contextual de Zona 3" (S69) y las
  // solicitudes dejan de ser un bloque suelto (S70-A5): la sección es la
  // CASA que esos dos huérfanos nunca tuvieron (diagnóstico del boceto).
  const [presupuestosPend, setPresupuestosPend] = useState<PresupuestoFamilia[]>([]);
  // E3 (vara de B): v1 = N llamadas por mascota (93% de familias tienen 1);
  // el lector family-level es deuda declarada con disparo en familias 3+.
  const [porCoordinar, setPorCoordinar] = useState<
    { mascotaId: string; mascotaNombre: string; citaId: string; negocio: string | null }[]
  >([]);
  // S82-C (lámina, ítem 1 — ENMIENDA DE SUPERFICIE a §10ter.1, declarada):
  // las agendadas colapsadas por servicio salen de la lista y entran como
  // UNA fila-resumen "citas de la semana" (el eje acción-vs-información
  // se conserva: la fila es información y va última). El conteo es sobre
  // TODAS las citas firmes/hold de los próximos 7 días (rc.data crudo —
  // el colapso por servicio subcontaría, L-139).
  const [citasSemana, setCitasSemana] = useState<{
    n: number;
    nHoy: number;
    nManana: number;
    primera: { mascotaId: string; mascotaNombre: string; citaId: string };
  } | null>(null);
  const [ponteRevelado, setPonteRevelado] = useState(false);
  // S82-C: la Hoja de vacuna del S45 MURIÓ — el detalle se despliega en
  // la carta del hecho (DetalleVacunaVida); queda el visor del carnet.
  const [carnetFirmado, setCarnetFirmado] = useState<string | null>(null);
  const [vidaRevelada, setVidaRevelada] = useState(false);
  // S70-A5: solicitudes de autorización del mostrador pendientes (poll en foco;
  // el badge abre la Hoja SIN depender del push).
  const [solicitudesPend, setSolicitudesPend] = useState<SolicitudPendiente[]>([]);

  const esMemorial = theme.mode === 'memorial';

  // S59 — barra de estado del techo vivo: el gradiente pinta bajo la
  // barra (HeroMarca absorbe el inset), así que sobre él van íconos
  // CLAROS. Solo cuando el techo se pinta (hay mascotas) y fuera de
  // memorial (bg.card claro pide íconos oscuros). Al perder el foco se
  // restaura la voz del tema — wiring en la pantalla, patrón BarraTabs:
  // packages/ui no conoce el foco de navegación.
  const techoPintado = Array.isArray(mascotas) && mascotas.length > 0;
  useFocusEffect(
    useCallback(() => {
      if (esMemorial || !techoPintado) return;
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle(theme.mode === 'dark' ? 'light-content' : 'dark-content');
    }, [esMemorial, techoPintado, theme.mode]),
  );

  const ordenarPorFecha = (a: ItemTimeline, b: ItemTimeline) => (a.fecha_evento < b.fecha_evento ? 1 : -1);

  const cargarTimelineHogar = useCallback(async (lista: MascotaResumen[]) => {
    // S74-A (cura D-497): UNA query hogar-wide — antes eran N llamadas
    // por mascota (el ítem ya trae mascota_id del wrapper).
    const pagina = await leerTimelineHogar(lista.map((m) => m.id));
    if (!pagina.ok) {
      setItems('error');
      setEstadoPie('nada');
      return;
    }
    cursorRef.current = pagina.data.siguiente_cursor;
    const todos: ItemHogar[] = [...pagina.data.items].sort(ordenarPorFecha);
    setItems(todos);
    setEstadoPie(pagina.data.siguiente_cursor !== null ? 'mas' : 'nada');
  }, []);

  const cargarMas = useCallback(async () => {
    if (cargandoMasRef.current || !Array.isArray(mascotas)) return;
    const cursor = cursorRef.current;
    if (cursor === null) {
      // reintento sin cursor: recargar el timeline del hogar
      setEstadoPie('cargando');
      await cargarTimelineHogar(mascotas);
      return;
    }
    cargandoMasRef.current = true;
    setEstadoPie('cargando');
    const r = await leerTimelineHogar(mascotas.map((m) => m.id), { cursor });
    cargandoMasRef.current = false;
    if (!r.ok) {
      setEstadoPie('error');
      return;
    }
    cursorRef.current = r.data.siguiente_cursor;
    setItems((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      return [...base, ...r.data.items].sort(ordenarPorFecha);
    });
    setEstadoPie(r.data.siguiente_cursor !== null ? 'mas' : 'nada');
  }, [mascotas, cargarTimelineHogar]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.tiene_familia || estado.data.familia_id === null) {
          router.replace('/');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        if (!r.ok) {
          setMascotas('error');
          return;
        }
        const lista = r.data;
        setMascotas(lista);

        // señales + fotos + timeline en paralelo — reemplazo directo (Ley 13)
        void obtenerEstadoHogar(lista.map((m) => m.id)).then((eh) => {
          if (vigente && eh.ok) setEstadoHogar(eh.data);
        });
        void obtenerMisPlanesPaseo().then((pl) => {
          if (vigente && pl.ok) {
            setHayPlanes(pl.data.length > 0);
            setPlanActivo(pl.data.find((p) => p.estado === 'activa') ?? null);
          }
        });
        // S60-A6 → S73: la posición por servicio; el fallo gana banda
        // con reintento (el mínimo-4 no puede degradar a «Descubre»).
        setResumenError(false);
        void obtenerResumenServiciosHogar().then((rs) => {
          if (!vigente) return;
          if (rs.ok) setResumenServicios(rs.data);
          else setResumenError(true);
        });
        void obtenerMiPerfil().then((p) => {
          // sin nombre: el saludo va solo — jamás un nombre inventado
          if (vigente && p.ok) setNombrePerfil(p.data.nombre);
        });
        // S70-A5: solicitudes pendientes del mostrador (poll; badge sin push)
        void obtenerSolicitudesPendientesDueno().then((s) => {
          if (vigente) setSolicitudesPend(s.ok ? s.data : []);
        });
        // PONTE AL DÍA: presupuestos vigentes (E7: SOLO 'enviado' — el
        // vencido perezoso jamás pide acción; lector ya ordenado venceEn ASC).
        void obtenerPresupuestosFamilia().then((pr) => {
          if (!vigente) return;
          setPresupuestosPend(pr.ok ? pr.data.filter((x) => x.estadoEfectivo === 'enviado') : []);
        });
        // PONTE AL DÍA: citas aprobadas que esperan fecha — S74-A (cura
        // D-497): UNA query hogar-wide (antes N por mascota). Borde
        // declarado: muere el aislamiento por-mascota del E3 viejo — el
        // fallo de la query única deja la franja vacía entera (antes,
        // solo callaba la mascota fallida); mismo best-effort, un caso.
        void obtenerCitasActivasHogar(lista.map((m) => m.id)).then((rc) => {
          if (!vigente) return;
          if (!rc.ok) {
            setPorCoordinar([]);
            setCitasSemana(null);
            return;
          }
          const nombrePor = new Map(lista.map((m) => [m.id, m.nombre]));
          setPorCoordinar(
            rc.data
              .filter((c) => c.estado === 'por_coordinar')
              .map((c) => ({
                mascotaId: c.mascota_id,
                mascotaNombre: nombrePor.get(c.mascota_id) ?? '',
                citaId: c.cita_id,
                negocio: c.negocio_nombre,
              })),
          );
          // S82-C (lámina ítem 1): "citas de la semana" — TODAS las
          // firmes/hold de los próximos 7 días (el lector viene ordenado
          // fecha+hora ASC: la [0] es la más próxima). El `en_vivo` es de
          // OTRA zona (el hero) y no entra acá.
          const fmt = (d: Date) => new Intl.DateTimeFormat('en-CA').format(d);
          const hoyIso = fmt(new Date());
          const manana = new Date();
          manana.setDate(manana.getDate() + 1);
          const mananaIso = fmt(manana);
          const en7 = new Date();
          en7.setDate(en7.getDate() + 7);
          const sieteIso = fmt(en7);
          const semana = rc.data.filter(
            (c) => (c.estado === 'firme' || c.estado === 'hold') && c.fecha !== null && c.fecha >= hoyIso && c.fecha <= sieteIso,
          );
          setCitasSemana(
            semana.length === 0
              ? null
              : {
                  n: semana.length,
                  nHoy: semana.filter((c) => c.fecha === hoyIso).length,
                  nManana: semana.filter((c) => c.fecha === mananaIso).length,
                  primera: {
                    mascotaId: semana[0].mascota_id,
                    mascotaNombre: nombrePor.get(semana[0].mascota_id) ?? '',
                    citaId: semana[0].cita_id,
                  },
                },
          );
        });
        const paths = lista.map((m) => m.foto_url).filter((p): p is string => typeof p === 'string' && p.length > 0);
        if (paths.length > 0) {
          void resolverUrlsFotos(paths).then((urls) => {
            if (!vigente) return;
            const porMascota: Record<string, string> = {};
            lista.forEach((m) => {
              const url = m.foto_url ? urls.get(m.foto_url) : undefined;
              if (url) porMascota[m.id] = url;
            });
            setFotos(porMascota);
          });
        }
        void cargarTimelineHogar(lista);
      })();
      return () => {
        vigente = false;
      };
    }, [router, cargarTimelineHogar]),
  );

  async function verCarnet(path: string) {
    const url = await resolverUrlFoto(path);
    if (url === null) {
      mostrar({ texto: t('vacunaHoja.errorAbrirCarnet'), variante: 'error' });
      return;
    }
    setCarnetFirmado(url);
  }

  if (mascotas === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], paddingTop: insets.top + spacing[8] }}>
        <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
          <View style={{ gap: spacing[4] }}>
            <Esqueleto forma="linea" ancho="50%" />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
            <View style={{ height: spacing[4] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
          </View>
        </EsqueletoGrupo>
      </View>
    );
  }

  if (mascotas === 'error') {
    // el error JAMÁS se disfraza de vacío (Ley 13)
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo={t('hogar.errorHistoria')}
          descripcion={t('hogar.errorHistoriaDetalle')}
          accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setMascotas('cargando')} />}
        />
      </View>
    );
  }

  if (mascotas.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio titulo={t('hogar.sinMascotas')} descripcion={t('hogar.sinMascotasDetalle')} />
      </View>
    );
  }

  const hoy = new Date();
  const senalesPorMascota = new Map(estadoHogar?.senales.map((s) => [s.mascota_id, s]) ?? []);
  // S59 §7.5 — multi-mascota primera clase: N paseos vivos = N celdas
  // vivas, cada una a SU en vivo (antes solo viajaba la más reciente).
  const enCurso = estadoHogar?.atenciones_en_curso ?? [];
  // S61-A11: proximaCita (el hero global) MURIÓ — la acción vive en la
  // ficha de cada mascota (proxima_cita_por_mascota); Ley 37 aplicada.
  const nombreDe = (id: string) => (Array.isArray(mascotas) ? (mascotas.find((m) => m.id === id)?.nombre ?? '') : '');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* @override-s82c — LA MARCA DE AGUA (ítem 4 de la lámina
          posición-consolidada): el isotipo en tinta al 6%, CENTRADO EN
          PANTALLA (fijo — no scrollea, como en la lámina: el agua vive
          fuera del cuerpo). OVERRIDE LOCAL de esta pantalla: NO se
          generaliza — la promoción es de B después del gate (guard R10).
          CHOQUE DECLARADO, no resuelto en silencio (regla S63): la Ley 4
          dice isotipo UNO por pantalla y el techo ya lleva el suyo — la
          lámina del founder ordena el agua igual; el gate resuelve.
          Calibración DE LÁMINA: opacidad .06 y ~340 de ancho (size 210 ×
          ratio del viewBox) — números de acuerdo, no tokens. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ opacity: 0.06 }}>
          <Isotipo size={210} variant="tinta" />
        </View>
      </View>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
    >
      {/* ── Zona 1 — el hogar ───────────────────────────────────
          Techo: HeroMarca compacto (enmienda Ley 4 S52, SELLADA
          condicionada al gate visual del founder). PUNTO DE REVERSIÓN
          BARATA: si el gate lo baja, reemplazar este bloque por
          <Encabezado variante="portada" saludo={saludoPorFranja(...)}/>
          — el lockup en tinta de P1; un cambio de componente, cero
          lógica. El isotipo blanco de adentro es el UNO por pantalla.
          Memorial degrada solo (bg.card plano). */}
      <View>
        {/* S58 patrón v2: el TECHO VIVO — la base curva 44/26 (la
            calibración final se sella en el gate en dispositivo).
            S59: la safe area la absorbe HeroMarca (el gradiente pinta
            bajo la barra de estado; el padding externo murió). */}
        <HeroMarca
          titulo={`${saludoPorFranja(hoy.getHours(), t)}${nombrePerfil ? `, ${nombrePerfil.trim().split(' ')[0]}` : ''}`}
          variante="techoVivo"
        />
        {/* LA ENTRADA DEL COACH (S53-B2b, §6 + DIRECCION_ARTE §5.1):
            el destello vive en el techo del Hogar, discreto. Blanco
            sobre el gradiente (misma familia que el isotipo — marca,
            no CTA); memorial degrada solo por el registry del Icono.
            El PUNTO DE NOVEDAD se enciende solo cuando el motor de
            revelaciones (B4) tenga algo nuevo que decir — jamás badge
            permanente; su lugar queda hecho abajo. */}
        <Pressable
          onPress={() => setCoachAbierto(true)}
          {...pressedCoach.handlers}
          accessibilityRole="button"
          accessibilityLabel={t('coach.abrir')}
          hitSlop={10}
          style={{
            position: 'absolute',
            top: insets.top + spacing[3],
            right: spacing[3],
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* D-401: el destello confirma el dedo (0.97, receta única) */}
          <Animated.View style={pressedCoach.estiloPresionado}>
            <Icono nombre="coach" tamano={24} registro="tinta" tinta={esMemorial ? theme.text.secondary : theme.text.onGradient} />
          </Animated.View>
          {/* punto de novedad — motor B4: {hayNovedadCoach ? <View .../> : null} */}
        </Pressable>
      </View>

      {/* @override-s82c — RECOMENDACIONES (lámina, ítem 1): LA TARJETA
          SOBRE LA BANDA. Ponte al día pasa a FILAS compactas — glifo en
          placa de su capa + título + detalle + chevron; cada fila NAVEGA
          a la superficie donde se decide (la decisión se toma con el
          contexto delante, precedente CURA-1). Solapa el techo (margen
          negativo — calibración de lámina, el gate ajusta). Regla de
          existencia intacta: hogar al día = la tarjeta NO EXISTE (la
          firma de la pantalla sigue siendo la desaparición). Memorial:
          no se monta (a un memorial no se le pide acción). La fila
          ALIMENTO del pedido queda DECLARADA SIN MONTAR: cero motor de
          despensa (L-139 — no se fabrica el dato); monta cuando exista. */}
      {(() => {
        if (esMemorial) return null;
        type Fila = {
          key: string;
          capa: 'identidad' | 'cuidado';
          icono: IconoNombre;
          titulo: string;
          detalle: string | null;
          onPress: () => void;
        };
        const ahora = Date.now();
        // vacuna que vence (lámina): sale de las señales REALES del hogar
        // (la misma verdad que la voz de la ficha — acá como acción).
        const vacunasQueVencen: Fila[] = mascotas.flatMap((m): Fila[] => {
          const s = senalesPorMascota.get(m.id);
          if (!s) return [];
          const voz = calcularVozHogar(
            {
              tieneEmergenciaActiva: s.tiene_emergencia_activa,
              vacunasTotal: s.vacunas_total,
              ultimaVacunaAplicada: s.ultima_vacuna_aplicada,
              proximaVacuna: s.proxima_vacuna,
              ultimaAtencionCerrada: s.ultima_atencion_cerrada,
            },
            hoy,
          );
          if (voz.voz !== 'pideAtencion' || voz.causa === 'emergencia') return [];
          const titulo =
            voz.causa === 'vacunaVence'
              ? voz.dias === 0
                ? t('hogar.vozVacunaVenceHoy', { nombre: m.nombre, vacuna: voz.vacuna })
                : voz.dias === 1
                  ? t('hogar.vozVacunaVenceUnDia', { nombre: m.nombre, vacuna: voz.vacuna })
                  : t('hogar.vozVacunaVence', { nombre: m.nombre, vacuna: voz.vacuna, dias: voz.dias })
              : voz.dias === 1
                ? t('hogar.vozVacunaVencidaUnDia', { nombre: m.nombre, vacuna: voz.vacuna })
                : t('hogar.vozVacunaVencida', { nombre: m.nombre, vacuna: voz.vacuna, dias: voz.dias });
          return [
            {
              key: `vac-${m.id}`,
              capa: 'identidad',
              icono: 'carnet',
              titulo,
              detalle: t('hogar.recoVacunaDetalle'),
              onPress: () => router.push('/explorar/veterinaria'),
            },
          ];
        });
        const filas: Fila[] = [
          // acciones primero (el orden acción-vs-información se conserva)
          ...solicitudesPend.map((s): Fila => {
            const min = Math.max(1, Math.round((Date.parse(s.expiraEn) - ahora) / 60000));
            return {
              key: `sol-${s.solicitudId}`,
              capa: 'cuidado',
              icono: 'familia',
              titulo:
                s.tipo === 'alta_mascota'
                  ? t('autorizacion.tituloAlta', { negocio: s.negocioNombre ?? '', mascota: s.mascotaNombre ?? '' })
                  : t('autorizacion.tituloAtencion', { negocio: s.negocioNombre ?? '', mascota: s.mascotaNombre ?? '' }),
              detalle: t('hogar.venceEnMin', { n: min }),
              onPress: () =>
                router.push({ pathname: '/autorizacion/[solicitudId]', params: { solicitudId: s.solicitudId } }),
            };
          }),
          ...presupuestosPend.map(
            (p): Fila => ({
              key: `pre-${p.id}`,
              capa: 'identidad',
              icono: 'presupuesto',
              titulo:
                p.negocioNombre !== null
                  ? t('hogar.presupuestoDe', { negocio: p.negocioNombre })
                  : t('hogar.presupuestoPara', { mascota: p.mascotaNombre ?? '' }),
              detalle: t('hogar.presupuestoDetalle', {
                total: p.total,
                mascota: p.mascotaNombre ?? '',
                fecha: fechaLargaHumana(p.venceEn.slice(0, 10), idioma),
              }),
              onPress: () =>
                router.push({
                  pathname: '/citas/[mascotaId]',
                  params: { mascotaId: p.mascotaId, nombre: p.mascotaNombre ?? '' },
                }),
            }),
          ),
          ...porCoordinar.map(
            (c): Fila => ({
              key: `coord-${c.citaId}`,
              capa: 'identidad',
              icono: 'veterinaria',
              titulo: t('hogar.porCoordinarTitulo', { mascota: c.mascotaNombre }),
              detalle:
                c.negocio !== null
                  ? t('citasMascota.coordinaraNegocio', { negocio: c.negocio })
                  : t('citasMascota.coordinaranSinNombre'),
              onPress: () =>
                router.push({
                  pathname: '/citas/[mascotaId]',
                  params: { mascotaId: c.mascotaId, nombre: c.mascotaNombre, citaId: c.citaId },
                }),
            }),
          ),
          ...vacunasQueVencen,
          // información al final: el resumen de la semana (lámina)
          ...(citasSemana !== null
            ? [
                {
                  key: 'citas-semana',
                  capa: 'cuidado' as const,
                  icono: 'hoy' as const,
                  titulo:
                    citasSemana.n === 1
                      ? t('hogar.recoCitaSemana')
                      : t('hogar.recoCitasSemana', { n: citasSemana.n }),
                  detalle:
                    [
                      citasSemana.nHoy > 0 ? t('hogar.recoHoy', { n: citasSemana.nHoy }) : null,
                      citasSemana.nManana > 0 ? t('hogar.recoManana', { n: citasSemana.nManana }) : null,
                      citasSemana.n - citasSemana.nHoy - citasSemana.nManana > 0
                        ? t('hogar.recoLuego', { n: citasSemana.n - citasSemana.nHoy - citasSemana.nManana })
                        : null,
                    ]
                      .filter((x): x is string => x !== null)
                      .join(' · ') || null,
                  onPress: () =>
                    router.push({
                      pathname: '/citas/[mascotaId]',
                      params: {
                        mascotaId: citasSemana.primera.mascotaId,
                        nombre: citasSemana.primera.mascotaNombre,
                        citaId: citasSemana.primera.citaId,
                      },
                    }),
                },
              ]
            : []),
        ];
        if (filas.length === 0) return null;
        const visibles = ponteRevelado ? filas : filas.slice(0, 3);
        return (
          <View style={{ paddingHorizontal: spacing[4], marginTop: -spacing[8], zIndex: 2 }}>
            <Tarjeta elevacion="elevada" relleno="ninguno">
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  paddingHorizontal: spacing[4],
                  paddingTop: spacing[4],
                  paddingBottom: spacing[2],
                }}
              >
                <Texto variante="seccion">{t('hogar.ponteAlDia')}</Texto>
                <Texto variante="dato">
                  {filas.length === 1 ? t('hogar.recoUnaCosa') : t('hogar.recoCosas', { n: filas.length })}
                </Texto>
              </View>
              {visibles.map((f, i) => (
                <View key={f.key}>
                  {i > 0 ? <Separador /> : null}
                  <FilaReco capa={f.capa} icono={f.icono} titulo={f.titulo} detalle={f.detalle} onPress={f.onPress} />
                </View>
              ))}
              {filas.length > 3 ? (
                <View style={{ paddingBottom: spacing[2] }}>
                  <PieRevelar
                    n={filas.length - 3}
                    revelado={ponteRevelado}
                    onPress={() => setPonteRevelado((v) => !v)}
                  />
                </View>
              ) : null}
            </Tarjeta>
          </View>
        );
      })()}

      {/* ── HERO de hoy (patrón v2: arriba, es lo que viene) ────────
          En curso gana el lugar (Ley 7); si no, el próximo paseo en
          tarjeta de DOS PISOS: servicio+estado relativo en capa teal /
          dirección con pin y chevron (entra al hub). Sin nada: silencio. */}
      {enCurso.length > 0 ? (
        // §7.5: una celda VIVA por atención en curso — cada CitaEnVivo
        // envuelve una cita REAL ejecutándose ahora (el espíritu de la
        // Ley 7 intacto: nada decorativo; la letra firmada §7.5 manda
        // en el multi-paseo simultáneo).
        <Animated.View entering={entradaZona(0)} style={{ paddingHorizontal: spacing[4], paddingTop: spacing[5], gap: spacing[4] }}>
          {enCurso.map((a) => (
            <CitaEnVivo key={a.atencion_id} capa="cuidado">
              <Celda
                interactiva
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: a.atencion_id } })}
                titulo={nombreDe(a.mascota_id)}
                subtitulo={t(
                  a.oficio === 'grooming'
                    ? 'hogar.groomingEnCurso'
                    : a.oficio === 'paseo'
                      ? 'hogar.paseoEnCurso'
                      : 'hogar.atencionEnCurso',
                )}
                fin={
                  <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.accent.primary }}>
                    {t('hogar.verEnVivo')}
                  </Text>
                }
              />
            </CitaEnVivo>
          ))}
        </Animated.View>
      ) : null}
      {/* S61-A11 (nota de Kary): el hero de PRÓXIMA CITA murió — la
          acción migró a la FICHA de cada mascota (una acción por
          precedencia). El EN VIVO queda como único hero (Ley 7). */}


      {/* ── Tu hogar (Zona 1): la mascota preside, su próxima cita visible ── */}
      <Animated.View
        entering={entradaZona(1)}
        style={{ paddingHorizontal: spacing[4], paddingTop: spacing[5], gap: spacing[3] }}
      >
        {mascotas.map((m) => {
          const senales = senalesPorMascota.get(m.id);
          // Sin señales todavía (estado del hogar cargando): la ficha
          // muestra solo el nombre — jamás una voz inventada (L-139).
          const voz = senales
            ? vozATexto(
                calcularVozHogar(
                  {
                    tieneEmergenciaActiva: senales.tiene_emergencia_activa,
                    vacunasTotal: senales.vacunas_total,
                    ultimaVacunaAplicada: senales.ultima_vacuna_aplicada,
                    proximaVacuna: senales.proxima_vacuna,
                    ultimaAtencionCerrada: senales.ultima_atencion_cerrada,
                  },
                  hoy,
                ),
                t,
              )
            : null;
          const pc = estadoHogar?.proxima_cita_por_mascota[m.id];
          // S61-A11 (letra firmada): UNA acción por ficha, la más
          // importante por PRECEDENCIA — en vivo > cita > alerta de
          // cuidado accionable > invitación de expediente > NADA
          // (Thor al día no gana CTA de relleno: silencio digno).
          const vivoDe = estadoHogar?.atenciones_en_curso.find((a) => a.mascota_id === m.id);
          // S61-A12: la acción viste su NATURALEZA (gate A11) — vivo =
          // pill §7.1 · ver cita = navegación (chevron, capa cuidado) ·
          // carnet = ACCIÓN tonal (flujo con consecuencias, Ley 22c).
          const accion: FichaMascotaHogarAccion | undefined = vivoDe
            ? {
                tipo: 'vivo',
                onPress: () =>
                  router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: vivoDe.atencion_id } }),
              }
            : pc
              ? {
                  tipo: 'navegacion',
                  capa: 'cuidado',
                  etiqueta: t('hogar.fichaVerCita'),
                  // D-430 (S67, regla de plataforma founder): contexto de
                  // mascota ⇒ el detalle de SU cita — jamás un hub (el
                  // multi-oficio destapó que TODO caía en "Mis paseos").
                  onPress: () =>
                    router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: m.id, nombre: m.nombre } }),
                }
              : voz?.semantica === 'pideAtencion'
                ? {
                    tipo: 'accion',
                    etiqueta: t('hogar.fichaVerCarnet'),
                    onPress: () => router.push({ pathname: '/carnet', params: { mascotaId: m.id, nombre: m.nombre } }),
                  }
                : senales && senales.vacunas_total === 0
                  ? {
                      tipo: 'accion',
                      etiqueta: t('hogar.fichaCargarCarnet'),
                      onPress: () => router.push({ pathname: '/carnet', params: { mascotaId: m.id, nombre: m.nombre } }),
                    }
                  : undefined;
          return (
            <FichaMascotaHogar
              key={m.id}
              nombre={m.nombre}
              fotoUrl={fotos[m.id]}
              voz={voz?.semantica ?? 'conociendolo'}
              textoEstado={voz?.texto ?? ''}
              proximaCitaMono={pc ? `${fechaCortaMono(pc.fecha, idioma)}${pc.hora ? ` · ${pc.hora}` : ''}` : undefined}
              accion={accion}
              onPress={() => router.push({ pathname: '/hogar/mascota/[mascotaId]', params: { mascotaId: m.id } })}
            />
          );
        })}
      </Animated.View>

      {/* ── TUS SERVICIOS (S60-A6 → S73 ítem 1, letra founder): MÍNIMO 4
          por prioridad de uso + «Descubre» — la regla de existencia S60
          ("cero actividad = cero celda") queda REEMPLAZADA para los
          cuatro oficios (D-462 camino a: el rail dice la verdad
          completa). Copy corto E4 intacto: UN número o UNA fecha; lo que
          no tiene esa forma va SIN dato. Orden = prioridad de uso
          computable (regla simple v1, voto de mesa: próxima > actividad
          reciente > «Descubre» en orden canónico de apertura). ── */}
      {(() => {
        const listaMascotas = Array.isArray(mascotas) ? mascotas : [];
        // Memorial cede el mínimo (letra de elegibilidad §5): sin mascota
        // elegible para NADA, los «Descubre» no se montan. Borde declarado
        // (vara S73-B): estado_vida null y 'perdida' también suprimen —
        // la frontera falla cerrada, y a un hogar con mascota perdida
        // tampoco se le hace marketing.
        const hayElegibles = mascotasElegibles(listaMascotas, null).length > 0;
        const hoyIso = new Intl.DateTimeFormat('en-CA').format(hoy);
        const esReciente = (f: string | null) =>
          f !== null && (Date.parse(hoyIso) - Date.parse(f)) / 86400000 <= 60;

        if (resumenError) {
          // S82-B (cobro del lint R8, Ley 13): la rama de error NO entra
          // animada — el vacío/error aparece CON la pantalla, no después.
          // La entrada escalonada queda para las ramas con contenido.
          return (
            <View style={{ paddingHorizontal: spacing[4], marginTop: spacing[7], gap: spacing[3] }}>
              <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
                {t('hogar.serviciosTitulo')}
              </Text>
              <EstadoVacio
                registro="seccion"
                titulo={t('hogar.railError')}
                accion={
                  <Boton
                    variante="secundario"
                    tamaño="sm"
                    etiqueta={t('hogar.reintentar')}
                    onPress={() => {
                      setResumenError(false);
                      setResumenServicios(null);
                      void obtenerResumenServiciosHogar().then((rs) => {
                        if (rs.ok) setResumenServicios(rs.data);
                        else setResumenError(true);
                      });
                    }}
                  />
                }
              />
            </View>
          );
        }
        if (resumenServicios === null) {
          // cargando: el rail espera entero (Ley 13, estático) — no
          // aparece "de a cuadrados" ni miente «Descubre» a medias.
          return (
            <Animated.View entering={entradaZona(2)} style={{ paddingHorizontal: spacing[4], marginTop: spacing[7], gap: spacing[3] }}>
              <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
                {t('hogar.serviciosTitulo')}
              </Text>
              <EsqueletoGrupo>
                <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                  <Esqueleto forma="bloque" ancho={112} alto={92} />
                  <Esqueleto forma="bloque" ancho={112} alto={92} />
                  <Esqueleto forma="bloque" ancho={112} alto={92} />
                </View>
              </EsqueletoGrupo>
            </Animated.View>
          );
        }

        const rp = resumenServicios.paseo;
        const re = resumenServicios.estetica;
        const ra = resumenServicios.adiestramiento;
        const rv = resumenServicios.veterinaria;

        const datoPaseo =
          rp.proxima !== null
            ? fechaCortaMono(rp.proxima.fecha, idioma)
            : rp.salidas_saldo > 0
              ? rp.salidas_saldo === 1
                ? t('hogar.railSaldoUna')
                : t('hogar.railSaldo', { n: rp.salidas_saldo })
              : null; // plan-solo: los días no caben en la forma — sin dato

        type Cuadrado = {
          key: string;
          icono: 'paseo' | 'grooming' | 'training' | 'veterinaria';
          nombre: string;
          dato: string | null;
          actividad: boolean;
          /** grupo 1: ordena por la fecha de la próxima. */
          fechaProxima: string | null;
          /** grupo 2: ordena por recencia (saldo/plan/por-coordinar
           *  vigentes cuentan como HOY — actividad sin fecha). */
          recencia: string | null;
          onPress: () => void;
        };

        // el orden del array ES el canónico de apertura (grupo 3)
        const base: Cuadrado[] = [
          {
            key: 'paseo',
            icono: 'paseo',
            nombre: t('hogar.railPaseos'),
            dato: datoPaseo,
            actividad: rp.proxima !== null || rp.salidas_saldo > 0 || hayPlanes,
            fechaProxima: rp.proxima?.fecha ?? null,
            recencia: rp.salidas_saldo > 0 || hayPlanes ? hoyIso : null,
            onPress: () => router.push('/hogar/paseos'),
          },
          {
            key: 'estetica',
            icono: 'grooming',
            nombre: t('hogar.railEstetica'),
            dato:
              re.proxima !== null
                ? fechaCortaMono(re.proxima.fecha, idioma)
                : esReciente(re.ultima_cerrada) && re.ultima_cerrada !== null
                  ? fechaCortaMono(re.ultima_cerrada, idioma)
                  : null,
            actividad: re.proxima !== null || esReciente(re.ultima_cerrada),
            fechaProxima: re.proxima?.fecha ?? null,
            recencia: re.ultima_cerrada,
            onPress: () => router.push('/hogar/grooming'),
          },
          {
            key: 'adiestramiento',
            icono: 'training',
            nombre: t('hogar.railAdiestramiento'),
            dato:
              ra.proxima !== null
                ? fechaCortaMono(ra.proxima.fecha, idioma)
                : esReciente(ra.ultima_cerrada) && ra.ultima_cerrada !== null
                  ? fechaCortaMono(ra.ultima_cerrada, idioma)
                  : null,
            actividad: ra.proxima !== null || esReciente(ra.ultima_cerrada),
            fechaProxima: ra.proxima?.fecha ?? null,
            recencia: ra.ultima_cerrada,
            onPress: () => router.push('/hogar/adiestramiento'),
          },
          {
            key: 'veterinaria',
            icono: 'veterinaria',
            nombre: t('hogar.railVet'),
            // por-coordinar no tiene forma E4 (sin fecha) → sin dato
            dato:
              rv.proxima !== null
                ? fechaCortaMono(rv.proxima.fecha, idioma)
                : esReciente(rv.ultima_cerrada) && rv.ultima_cerrada !== null
                  ? fechaCortaMono(rv.ultima_cerrada, idioma)
                  : null,
            actividad: rv.proxima !== null || rv.por_coordinar || esReciente(rv.ultima_cerrada),
            fechaProxima: rv.proxima?.fecha ?? null,
            recencia: rv.por_coordinar ? hoyIso : rv.ultima_cerrada,
            onPress: () => {
              // destino v1 (D-493, hueco del hub vet declarado): la
              // mascota de la próxima/por-coordinar/última cita vet.
              const destinoId = rv.mascota_id_destino;
              const nombre = listaMascotas.find((m) => m.id === destinoId)?.nombre ?? '';
              if (destinoId !== null) {
                router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: destinoId, nombre } });
              } else {
                router.push('/explorar/veterinaria');
              }
            },
          },
        ];

        // comparadores con CERO en igualdad: el sort estable conserva el
        // orden canónico del array base cuando las fechas empatan
        const grupo1 = base
          .filter((c) => c.actividad && c.fechaProxima !== null)
          .sort((a, b) =>
            (a.fechaProxima as string) < (b.fechaProxima as string) ? -1 : (a.fechaProxima as string) > (b.fechaProxima as string) ? 1 : 0,
          );
        const grupo2 = base
          .filter((c) => c.actividad && c.fechaProxima === null)
          .sort((a, b) => ((a.recencia ?? '0000') > (b.recencia ?? '0000') ? -1 : (a.recencia ?? '0000') < (b.recencia ?? '0000') ? 1 : 0));
        const descubre = hayElegibles ? base.filter((c) => !c.actividad) : [];
        const cuadrados = [...grupo1, ...grupo2, ...descubre];
        if (cuadrados.length === 0) return null; // hogar sin elegibles y sin historia

        return (
          <Animated.View entering={entradaZona(2)} style={{ marginTop: spacing[7], gap: spacing[3] }}>
            <Text style={{ paddingHorizontal: spacing[4], fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {t('hogar.serviciosTitulo')}
            </Text>
            {/* el rail sangra edge-to-edge; el aire de cola va en el
                contentContainer (un rail cortado en seco parece bug) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[3] }}
            >
              {cuadrados.map((c) => (
                <Tarjeta
                  key={c.key}
                  interactiva
                  elevacion="reposo"
                  accessibilityRole="button"
                  etiqueta={c.nombre}
                  onPress={c.onPress}
                >
                  <View style={{ width: 96, gap: spacing[2] }}>
                    <Icono nombre={c.icono} tamano={24} />
                    <Texto variante="apoyo" color="primary" numberOfLines={1}>
                      {c.nombre}
                    </Texto>
                    {c.actividad && c.dato !== null ? (
                      <Texto variante="dato" numberOfLines={1}>
                        {c.dato}
                      </Texto>
                    ) : !c.actividad ? (
                      // la invitación es voz humana, no dato de máquina
                      // (Ley 3: sans, no mono)
                      <Texto variante="apoyo" numberOfLines={1}>
                        {t('hogar.railDescubre')}
                      </Texto>
                    ) : null}
                  </View>
                </Tarjeta>
              ))}
            </ScrollView>
          </Animated.View>
        );
      })()}

      {/* ── El GRUPO de celdas (patrón v2, Ley 19.1): entrar a una
          sección con subtítulo VIVO — dato real del expediente, jamás
          descripción estática. Hairline solo interno (Chanel); la
          superficie apoyada no lleva borde. "Agregar mascota" es
          ACCIÓN dentro del grupo (sin chevron). S60-A6: expediente
          PURO — "Mis paseos" migró a la zona de servicios. ── */}
      <Animated.View entering={entradaZona(3)} style={{ paddingHorizontal: spacing[4], marginTop: spacing[7] }}>
        <Tarjeta relleno="ninguno" elevacion="reposo">
          {/* S71-A3 (F2, letra founder): la celda del CARNET se MUDÓ
              adentro de la vista de la mascota — el aporte del carnet es
              por mascota, no del hogar (la sección Salud de
              mascota/[mascotaId] ya era su casa: estado vacío con CTA +
              entrada de agregar). El detalle VIVO del refuerzo más
              próximo muere con la celda; su heredero natural es el
              habitante 5 de "Ponte al día" cuando fecha_proxima tenga
              datos (hoy 1/24 — deuda E5 declarada). La ficha con
              pideAtencion sigue cubriendo la urgencia por mascota. */}
          <CeldaNavegacion
            // S73 C3: el glifo 'refugio' era PRÉSTAMO — con la entrada
            // real de adopción al lado, dos celdas vecinas con el mismo
            // glifo y destinos distintos violan la Ley 12. Se devuelve:
            // agregar-mascota habla de la familia; refugio, de adoptar.
            icono="familia"
            titulo={t('hogar.agregarMascotaCelda')}
            detalle={t('agregarMascota.entradaDetalle')}
            chevron={false}
            onPress={() => router.push('/hogar/agregar')}
          />
          <Separador />
          {/* S73 ítem 2 (C3, letra founder): la ADOPCIÓN — refugios,
              otro actor de EL NORTE; feature nueva en peldaño 0 (el
              próximamente honesto), jamás copy de agregar-mascota. El
              titulo+detalle componen la frase literal del founder. */}
          <CeldaNavegacion
            icono="refugio"
            titulo={t('hogar.adoptarCelda')}
            detalle={t('hogar.adoptarCeldaDetalle')}
            onPress={() => router.push('/adoptar')}
          />
        </Tarjeta>
      </Animated.View>

      {/* S71-A3: los dos bloques huérfanos (solicitud S70-A5 · presupuesto
          S69) MURIERON ABSORBIDOS por PONTE AL DÍA — el diagnóstico de la
          planitud era exactamente que exigían acción sin sección donde
          vivir. Ley 37: el código murió con ellos. */}

      {/* ── Zona 4 — TU VIDA (lámina, ítem 3) ─────────────────────
          El marco-Tarjeta S61 MURIÓ (A6 SIN CAJA + lámina): cada hecho
          es su propia carta sobre el canto que pinta la curva. Título +
          fecha SIEMPRE visibles; el tap despliega cuerpo/fotos/quién en
          su lugar (la consulta navega › a su parte — tiene pantalla
          MOMENTO propia). Filtros con glifo en trazo, el elegido gana la
          huella rellena. El conteo total de la lámina ("41 hechos") NO
          se pinta: el contrato del timeline no lo trae y no se inventa
          (L-139). S82-B/R8: vacío y error aparecen QUIETOS. */}
      {(() => {
        const cabecera = (
          <Text
            accessibilityRole="header"
            style={{
              paddingHorizontal: spacing[4],
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.sm,
              color: theme.text.secondary,
            }}
          >
            {t('hogar.vidaTitulo')}
          </Text>
        );
        const zonaVida = (
          <View style={{ gap: spacing[3] }}>
            {cabecera}
            {items === null ? (
              <View style={{ paddingHorizontal: spacing[4] }}>
                <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
                  <View style={{ gap: spacing[3] }}>
                    <Esqueleto forma="bloque" ancho="100%" alto={64} />
                    <Esqueleto forma="bloque" ancho="100%" alto={64} />
                    <Esqueleto forma="bloque" ancho="100%" alto={64} />
                  </View>
                </EsqueletoGrupo>
              </View>
            ) : items === 'error' ? (
              <View style={{ paddingHorizontal: spacing[4] }}>
                <EstadoVacio
                  titulo={t('hogar.errorHistoria')}
                  descripcion={t('hogar.errorHistoriaDetalle')}
                  accion={
                    <Boton
                      variante="secundario"
                      etiqueta={t('hogar.reintentar')}
                      onPress={() => {
                        setItems(null);
                        if (Array.isArray(mascotas)) void cargarTimelineHogar(mascotas);
                      }}
                    />
                  }
                />
              </View>
            ) : items.length === 0 ? (
              <View style={{ paddingHorizontal: spacing[4] }}>
                <EstadoVacio titulo={t('hogar.historiaEmpieza')} descripcion={t('hogar.historiaEmpiezaDetalle')} />
              </View>
            ) : (
              (() => {
                const filtrados = items.filter(
                  (it) => filtroVida === 'todo' || FAMILIA_DE_TIPO[it.tipo] === filtroVida,
                );
                const visibles = vidaRevelada ? filtrados : filtrados.slice(0, 3);
                return (
                  <View style={{ gap: spacing[3] }}>
                    <FiltroVida
                      activo={filtroVida}
                      onCambio={(c) => setFiltroVida(c)}
                      etiquetas={{
                        todo: t('hogar.filtroTodo'),
                        salud: t('hogar.filtroSalud'),
                        paseos: t('hogar.filtroPaseos'),
                        estetica: t('hogar.filtroEstetica'),
                        adiestramiento: t('hogar.filtroAdiestramiento'),
                      }}
                    />
                    {filtrados.length === 0 ? (
                      <View style={{ paddingHorizontal: spacing[4] }}>
                        <EstadoVacio registro="seccion" titulo={t('hogar.filtroSinMomentos')} />
                      </View>
                    ) : (
                      <View style={{ paddingHorizontal: spacing[4], gap: spacing[3] }}>
                        {visibles.map((it) => {
                          const familia = FAMILIA_DE_TIPO[it.tipo];
                          const color =
                            familia === 'salud'
                              ? theme.capa.identidad
                              : familia !== undefined
                                ? theme.capa.cuidado
                                : null;
                          const navega = it.tipo === 'historia_clinica_registrada';
                          const expandible = it.atencion_id !== null || it.tipo === 'vacuna_aplicada';
                          const abierto = hechosAbiertos[it.evento_id] === true;
                          return (
                            <EventoVida
                              key={it.evento_id}
                              color={color}
                              titulo={vozHecho(it, t)}
                              meta={metaHecho(it, idioma)}
                              navega={navega}
                              expandido={expandible ? abierto : undefined}
                              onPress={
                                navega
                                  ? () =>
                                      router.push({ pathname: '/parte/[eventoId]', params: { eventoId: it.evento_id } })
                                  : expandible
                                    ? () => setHechosAbiertos((s) => ({ ...s, [it.evento_id]: !abierto }))
                                    : undefined
                              }
                            >
                              {expandible && abierto ? (
                                it.atencion_id !== null ? (
                                  <DetalleNodoHogar
                                    atencionId={it.atencion_id}
                                    mascota={{ nombre: nombreDe(it.mascota_id), fotoUrl: fotos[it.mascota_id] }}
                                    onVerCompleto={() =>
                                      router.push({
                                        pathname: '/paseo/[atencionId]',
                                        params: { atencionId: it.atencion_id as string },
                                      })
                                    }
                                  />
                                ) : (
                                  <DetalleVacunaVida eventoId={it.evento_id} onVerCarnet={(path) => void verCarnet(path)} />
                                )
                              ) : null}
                            </EventoVida>
                          );
                        })}
                        <PieRevelar
                          n={filtrados.length - 3}
                          revelado={vidaRevelada}
                          onPress={() => setVidaRevelada((v) => !v)}
                        />
                        {vidaRevelada || filtrados.length <= 3 ? (
                          estadoPie === 'mas' ? (
                            <View style={{ alignSelf: 'center' }}>
                              <Boton variante="compacto" etiqueta={t('hogar.vidaCargarMas')} onPress={() => void cargarMas()} />
                            </View>
                          ) : estadoPie === 'cargando' ? (
                            <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
                              <Esqueleto forma="linea" ancho="40%" />
                            </EsqueletoGrupo>
                          ) : estadoPie === 'error' ? (
                            <View style={{ alignSelf: 'center' }}>
                              <Boton variante="compacto" etiqueta={t('hogar.reintentar')} onPress={() => void cargarMas()} />
                            </View>
                          ) : null
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              })()
            )}
          </View>
        );
        {/* S82-C: la zona monta SIEMPRE quieta — el vacío del filtro
            vive adentro y el vacío jamás entra animado (Ley 13/R8);
            el escalonado S52 de esta zona era pre-§5 y migró al
            tocarse (D-318). */}
        return <View style={{ marginTop: spacing[7] }}>{zonaVida}</View>;
      })()}

      {/* S71-A3: el selector "¿De quién es el carnet?" murió con la celda
          del carnet — el flujo ahora nace DENTRO de cada mascota, donde
          la pregunta no existe (Ley 37). */}


      <CoachHoja visible={coachAbierto} onCerrar={() => setCoachAbierto(false)} mascotas={mascotas} />

      {carnetFirmado !== null && (
        <VisorFoto
          visible
          onCerrar={() => setCarnetFirmado(null)}
          fotos={[carnetFirmado]}
          etiqueta={t('vacunaHoja.titulo')}
        />
      )}

    </ScrollView>
    </View>
  );
}
