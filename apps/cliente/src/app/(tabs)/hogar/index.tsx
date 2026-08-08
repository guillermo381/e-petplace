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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  AvatarMascota,
  Badge,
  Boton,
  Celda,
  CeldaNavegacion,
  CitaEnVivo,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
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
  useEtiquetaBadge,
  usePresionado,
  useTheme,
  palette,
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
  hayNovedades,
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
import { InvitacionAvisos } from '@/components/invitacion-avisos';
import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';
import { FAMILIA_DE_TIPO, capaDeHecho, vozHecho } from '@/lib/voz-hecho';
import { contarPendientesDe, type FuentesDePendientes } from '@/lib/pendientes';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import { CantoCurva } from '@/components/canto-curva';
import { FiltroPills } from '@/components/filtro-pills';


type TraductorHogar = ReturnType<typeof useTraduccion>['t'];

/** R12 (guard, r4-defecto 2): EL SOLAPE JAMÁS EXCEDE EL RESPIRO — la
 *  tarjeta de recomendaciones sube sobre la banda SOLO dentro del aire
 *  que el techo deja bajo las mascotas; si alguien agranda el solape
 *  por encima del respiro, tapa el saludo/nombres y el lint lo para.
 *  Verificado por construcción: 56 > 32. */
const RESPIRO_BANDA = spacing[14]; // el aire al pie del degradado
const SOLAPE_RECO = spacing[8]; // cuánto sube la tarjeta sobre la banda

/** r4-defecto 3: la fecha del techo — "jueves 23 de julio", mono
 *  minúsculas (Ley 3). Candidata al RIEL (fechaConDiaMono) declarada:
 *  el formateo por idioma es del riel; nace acá porque el riel no
 *  tiene la forma con día de semana y packages no es territorio de
 *  esta ronda. */
function fechaConDiaMono(d: Date, idioma: 'es' | 'en'): string {
  return new Intl.DateTimeFormat(idioma === 'en' ? 'en-US' : 'es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(d)
    .toLowerCase();
}

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
  detalleMono,
  onPress,
}: {
  capa: 'identidad' | 'cuidado';
  icono: IconoNombre;
  titulo: string;
  detalle: string | null;
  /** r6: el detalle es voz de máquina (fecha·hora) — Ley 3. */
  detalleMono?: boolean;
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
          {detalle !== null ? (
            <Texto variante={detalleMono === true ? 'dato' : 'apoyo'} numberOfLines={1}>{detalle}</Texto>
          ) : null}
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

/**
 * S88-D · LA ESQUINA DE LA CAMPANA (lámina firmada `LAMINA_ESQUINA_CAMPANA`):
 * la campana va INLINE en la fila del techo, jamás absoluta — el layout la
 * cuenta. El `gap: spacing[5]` (20dp) ES el número congelado de la lámina
 * (10+10, los hitSlop de los dos vecinos) y R32 lo lee estáticamente: esta
 * fila vive EXTRAÍDA (precedente de C, `IdentidadDelTecho`) para que el gap
 * sea legible al lado del montaje — el techo del Hogar tiene absolutos (la
 * luz de la esquina, el Coach) que a ±25 líneas pintarían rojo.
 *
 * EL COACH NO SE MUEVE (D-401, letra de la lámina): sigue absoluto en su
 * esquina — acá se le RESERVA el espacio con un hueco de su tamaño (44),
 * separado de la campana por el gap del guard. La campana queda a su
 * IZQUIERDA, como firma la lámina.
 *
 * Sobre el techo saturado la huella del Badge va en PAPEL
 * (`superficie="muro"` — la regla medida de B: el acento del tema puede
 * ser invisible sobre su propio techo; en el cliente el gradiente lleva
 * los íconos CLAROS desde S59). Memorial: techo plano → registro 'clara'
 * (la huella degrada a tinta en el tema) y el trazo a tinta.
 */
function FilaCampanaTecho({
  esMemorial,
  conNovedades,
  onAvisos,
}: {
  esMemorial: boolean;
  /** Semántica S89 (nota de LAMINA_CAMPANA): novedades NO VISTAS —
   *  la huella se apaga al VISITAR /avisos, no al leer cada aviso. */
  conNovedades: boolean;
  onAvisos: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const etiquetaBadge = useEtiquetaBadge();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[5] }}>
      <View style={{ flex: 1 }}>
        <Isotipo size={28} variant="blanco" />
      </View>
      <Pressable
        onPress={onAvisos}
        hitSlop={10}
        accessibilityRole="button"
        /* El estado viaja en el label (contrato del Badge): con huella el
           label dice «sin leer», jamás un número. */
        accessibilityLabel={etiquetaBadge(t('avisos.titulo'), conNovedades ? 1 : 0, 'huella')}
      >
        <Badge n={conNovedades ? 1 : 0} forma="huella" superficie={esMemorial ? 'clara' : 'muro'}>
          {/* Campana EN TRAZO (ley del único relleno: el relleno es de la
              huella del Badge); papel sobre el gradiente, tinta en memorial. */}
          <Icono nombre="campana" tamano={24} tinta={esMemorial ? theme.text.primary : palette.light0} />
        </Badge>
      </Pressable>
      {/* El hueco del Coach — su espacio reservado (lámina); el destello
          mismo no se mueve: sigue absoluto en su esquina (D-401). */}
      <View style={{ width: 44, height: 44 }} />
    </View>
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
  /** S91 · id → nombre, para la voz del hito «{nombre} llegó a la familia».
   *  El timeline del hogar es MULTI-MASCOTA y su ítem trae `mascota_id` pero
   *  no el nombre; acá el nombre ya está cargado, así que no se pide de nuevo
   *  (D-497: el piso de performance no paga un viaje por un sustantivo). */
  const nombrePorMascota = useMemo(
    () => new Map(Array.isArray(mascotas) ? mascotas.map((m) => [m.id, m.nombre]) : []),
    [mascotas],
  );
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
  // r6-2/3: la fila-resumen "citas de la semana" MURIÓ absorbida por las
  // filas POR MASCOTA (la cita de cada una) — un sistema, no dos; Chanel:
  // la de resumen decía lo mismo dos veces. Declarado al gate.
  const [ponteRevelado, setPonteRevelado] = useState(false);
  // S82-C: la Hoja de vacuna del S45 MURIÓ — el detalle se despliega en
  // la carta del hecho (DetalleVacunaVida); queda el visor del carnet.
  const [carnetFirmado, setCarnetFirmado] = useState<string | null>(null);
  const [vidaRevelada, setVidaRevelada] = useState(false);
  // S70-A5: solicitudes de autorización del mostrador pendientes (poll en foco;
  // el badge abre la Hoja SIN depender del push).
  const [solicitudesPend, setSolicitudesPend] = useState<SolicitudPendiente[]>([]);
  // S88-D · la campana: presencia por booleano (jamás la lista acá).
  const [conNovedades, setConNovedades] = useState(false);

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
        // S88-D · la campana: el BOOLEANO, jamás la lista (lámina). Un
        // fallo cae a false — la huella ausente es ausencia, no un claim.
        // S89 · contrato v2: la huella mide NOVEDADES NO VISTAS (posterior
        // a la última visita de ESTA casa) — cada app pasa SU nombre.
        void hayNovedades('cliente').then((h) => {
          if (vigente) setConNovedades(h.ok ? h.data : false);
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
        });
        /**
         * ③ (re-gate del founder) — LA CARA DE GALERÍA LLEGA A LA TILE.
         *
         * Antes este mapa solo tenía FOTOS REALES, y encima solo se poblaba
         * `if (paths.length > 0)`: una familia sin ninguna foto subida no
         * entraba nunca al `then` y la tile se quedaba con la huella, mientras
         * el perfil de la misma mascota ya mostraba su raza. **Dos caras para
         * un animal.**
         *
         * Ahora se siembra PRIMERO la cara de galería —síncrona, sin red— y la
         * foto real se superpone cuando resuelve. El orden importa: la galería
         * es el mientras tanto, la foto propia gana siempre.
         */
        const caras: Record<string, string> = {};
        lista.forEach((m) => {
          const cara = caraDeMascotaPorRuta({ especie: m.especie, rutaImagen: m.raza_ruta_imagen });
          if (cara !== undefined) caras[m.id] = cara;
        });
        setFotos(caras);

        const paths = lista.map((m) => m.foto_url).filter((p): p is string => typeof p === 'string' && p.length > 0);
        if (paths.length > 0) {
          void resolverUrlsFotos(paths).then((urls) => {
            if (!vigente) return;
            const porMascota: Record<string, string> = { ...caras };
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

  // ── r6: LAS FILAS DE PONTE AL DÍA se computan ACÁ porque el punto de
  // estado de cada mascota del techo muestra SU cuenta de pendientes —
  // un sistema, no dos (letra founder r6-3). Las fichas de mascota
  // MURIERON (r6-2): su contenido son estas filas.
  type FilaReco_ = {
    key: string;
    mascotaId: string | null;
    capa: 'identidad' | 'cuidado';
    icono: IconoNombre;
    titulo: string;
    detalle: string | null;
    detalleMono?: boolean;
    onPress: () => void;
  };
  /** A8: vive AFUERA del IIFE porque ahora tiene dos lectores — las filas y el
   *  conteo. Adentro, el conteo habría tenido que re-calcularla. */
  const vozDe = (id: string) => {
    const s = senalesPorMascota.get(id);
    if (!s) return null;
    return calcularVozHogar(
      {
        tieneEmergenciaActiva: s.tiene_emergencia_activa,
        vacunasTotal: s.vacunas_total,
        ultimaVacunaAplicada: s.ultima_vacuna_aplicada,
        proximaVacuna: s.proxima_vacuna,
        ultimaAtencionCerrada: s.ultima_atencion_cerrada,
      },
      hoy,
    );
  };
  const filasReco: FilaReco_[] = (() => {
    if (esMemorial) return [];
    const ahora = Date.now();
    const filas: FilaReco_[] = [
      ...solicitudesPend.map((s): FilaReco_ => {
        const min = Math.max(1, Math.round((Date.parse(s.expiraEn) - ahora) / 60000));
        return {
          key: `sol-${s.solicitudId}`,
          mascotaId: s.mascotaId,
          capa: 'cuidado',
          icono: 'familia',
          titulo:
            s.tipo === 'alta_mascota'
              ? t('autorizacion.tituloAlta', { negocio: s.negocioNombre ?? '', mascota: s.mascotaNombre ?? '' })
              : t('autorizacion.tituloAtencion', { negocio: s.negocioNombre ?? '', mascota: s.mascotaNombre ?? '' }),
          detalle: t('hogar.venceEnMin', { n: min }),
          onPress: () => router.push({ pathname: '/autorizacion/[solicitudId]', params: { solicitudId: s.solicitudId } }),
        };
      }),
      ...presupuestosPend.map(
        (p): FilaReco_ => ({
          key: `pre-${p.id}`,
          mascotaId: p.mascotaId,
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
            router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: p.mascotaId, nombre: p.mascotaNombre ?? '' } }),
        }),
      ),
      ...porCoordinar.map(
        (c): FilaReco_ => ({
          key: `coord-${c.citaId}`,
          mascotaId: c.mascotaId,
          capa: 'identidad',
          icono: 'veterinaria',
          titulo: t('hogar.porCoordinarTitulo', { mascota: c.mascotaNombre }),
          detalle:
            c.negocio !== null
              ? t('citasMascota.coordinaraNegocio', { negocio: c.negocio })
              : t('citasMascota.coordinaranSinNombre'),
          onPress: () =>
            router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: c.mascotaId, nombre: c.mascotaNombre, citaId: c.citaId } }),
        }),
      ),
      // la alerta de vacuna (era la voz pideAtencion de la ficha)
      ...mascotas.flatMap((m): FilaReco_[] => {
        const voz = vozDe(m.id);
        if (voz === null || voz.voz !== 'pideAtencion' || voz.causa === 'emergencia') return [];
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
            mascotaId: m.id,
            capa: 'identidad',
            icono: 'carnet',
            titulo,
            detalle: t('hogar.recoVacunaDetalle'),
            onPress: () => router.push('/explorar/veterinaria'),
          },
        ];
      }),
      // r6-2: LA CITA de cada mascota (era la ficha) — info, navega
      ...mascotas.flatMap((m): FilaReco_[] => {
        const pc = estadoHogar?.proxima_cita_por_mascota[m.id];
        if (!pc) return [];
        return [
          {
            key: `cita-${m.id}`,
            mascotaId: m.id,
            capa: 'cuidado',
            icono: 'hoy',
            titulo: t('hogar.recoCitaDe', { mascota: m.nombre }),
            detalle: `${fechaCortaMono(pc.fecha, idioma)}${pc.hora ? ` · ${pc.hora}` : ''}`,
            detalleMono: true,
            onPress: () => router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: m.id, nombre: m.nombre } }),
          },
        ];
      }),
      // r6-2: el carnet vacío (era la acción de la ficha conociéndolo)
      ...mascotas.flatMap((m): FilaReco_[] => {
        const s = senalesPorMascota.get(m.id);
        if (!s || s.vacunas_total > 0) return [];
        return [
          {
            key: `carnet-${m.id}`,
            mascotaId: m.id,
            capa: 'identidad',
            icono: 'carnet',
            titulo: t('hogar.recoCargarCarnet', { mascota: m.nombre }),
            detalle: null,
            onPress: () => router.push({ pathname: '/carnet', params: { mascotaId: m.id, nombre: m.nombre } }),
          },
        ];
      }),
    ];
    return filas;
  })();
  /**
   * A8 (S91-D) — EL CONTEO SALE DE LA LIB, NO DE LAS FILAS.
   *
   * Antes esto era `filasReco.filter(...).length`, y funcionaba: acá las filas
   * SON los pendientes. Pero el perfil también necesita el número y no tiene
   * estas filas —son de esta pantalla, con su router y sus glifos—, así que
   * derivar del render dejaba una sola salida: que el perfil lo re-escribiera.
   * **La definición sube a `lib/pendientes.ts` y las dos superficies la
   * consumen** (letra de mesa, adoptada antes de que existiera el 2º consumidor).
   */
  const fuentesDe = (id: string): FuentesDePendientes => {
    const s = senalesPorMascota.get(id);
    const voz = vozDe(id);
    return {
      solicitudes: solicitudesPend,
      presupuestos: presupuestosPend,
      porCoordinar,
      tieneAlertaDeVacuna: voz !== null && voz.voz === 'pideAtencion' && voz.causa !== 'emergencia',
      sinNingunaVacuna: s !== undefined && s.vacunas_total === 0,
    };
  };
  /** ⚠️ El apagado de MEMORIAL vive acá y no en la lib, y es a propósito: la
   *  lib es dato puro y memorial es un modo de la casa. Un memorial no tiene
   *  pendientes —no se le agenda, no se le cobra, no se le vacuna— y ése es un
   *  apagado ESTRUCTURAL, no un filtro. (Sin esto mi propio chequeo gritaría:
   *  `filasReco` ya devuelve `[]` en memorial.) */
  const pendientesDe = (id: string) => (esMemorial ? 0 : contarPendientesDe(id, fuentesDe(id)));

  /**
   * ⚠️ EL CHEQUEO QUE VUELVE RUIDOSA LA DIVERGENCIA.
   *
   * El modo de falla de esta extracción es EL SILENCIO (L-192): si mañana nace
   * una séptima clase de fila acá y nadie la agrega a la lib, las dos siguen
   * compilando y las dos siguen mostrando un número creíble — solo que
   * distinto en cada pantalla. Esto lo convierte en un aviso en la consola de
   * dev, con la mascota y los dos números, en vez de en un bug que se descubre
   * cuando un usuario los compara.
   */
  if (__DEV__) {
    for (const m of Array.isArray(mascotas) ? mascotas : []) {
      // ⚠️ `cita-` SE EXCLUYE del cotejo, por firma de mesa: la fila SIGUE
      // existiendo en «Ponte al día» (una cita agendada es información que el
      // dueño quiere ver) pero NO cuenta como pendiente, porque «N por
      // resolver» no puede incluir algo que no se resuelve. La lista y el
      // contador dejan de ser lo mismo, y por eso el cotejo lo dice acá en vez
      // de disparar un falso aviso en cada arranque.
      const porFilas = filasReco.filter(
        (f) => f.mascotaId === m.id && !f.key.startsWith('cita-'),
      ).length;
      const porLib = pendientesDe(m.id);
      if (porFilas !== porLib) {
        console.warn(
          `[pendientes] ${m.nombre}: las filas dicen ${porFilas} y la lib ${porLib}. ` +
            'Nació una clase de fila que lib/pendientes.ts no conoce.',
        );
      }
    }
  }

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
          <Isotipo size={210} variant="tinta" color={theme.text.primary} />
        </View>
      </View>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
    >
      {/* @override-s82c — EL TECHO DEL HOGAR, local (r4: la lámina no
          había llegado completa — las mascotas van ADENTRO del
          degradado, la fecha en mono SOBRE el saludo). HeroMarca no
          tiene slots para fecha-antes-del-saludo ni para la fila de
          mascotas: se compone local COPIANDO NIVEL de la primitiva
          (gradiente firma + curva 44/26 del patrón v2 + safe area
          absorbida + memorial plano) — CANDIDATA a B: HeroMarca gana
          slots fecha/contenido-de-techo. A4 (§9bis.2, FIRMADA): la luz
          de la esquina es el ÚNICO adorno. El respiro del pie
          (RESPIRO_BANDA) es MAYOR que el solape de la tarjeta
          (SOLAPE_RECO) — guard R12: la tarjeta nunca tapa contenido. */}
      <View>
        {(() => {
          const relleno = {
            paddingTop: insets.top + spacing[5],
            paddingBottom: RESPIRO_BANDA,
            paddingHorizontal: spacing[5],
            borderBottomLeftRadius: 44,
            borderBottomRightRadius: 26,
            overflow: 'hidden' as const,
          };
          const textoTecho = esMemorial ? theme.text.primary : theme.text.onGradient;
          const contenido = (
            <>
              {/* A4 — la luz de la esquina (blanco 7% desbordando por la
                  esquina superior derecha; centro fuera del lienzo).
                  Memorial: sin adorno (el color se apaga, Ley 8). */}
              {!esMemorial ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -40,
                    right: -70,
                    width: 290,
                    height: 290,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.075)',
                  }}
                />
              ) : null}
              {/* S88-D · la fila del techo con la campana (extraída — R32;
                  antes acá vivía el Isotipo solo, que se mudó adentro). */}
              <FilaCampanaTecho
                esMemorial={esMemorial}
                conNovedades={conNovedades}
                onAvisos={() => router.push('/avisos')}
              />
              {/* r4-3: la fecha en mono SOBRE el saludo (Ley 3, minúsculas) */}
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.sm,
                  letterSpacing: typography.tracking.mono,
                  color: textoTecho,
                  marginTop: spacing[4],
                }}
              >
                {fechaConDiaMono(hoy, idioma)}
              </Text>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: typography.family.sans.light,
                  fontSize: typography.size.lg,
                  lineHeight: Math.round(typography.size.lg * typography.leading.snug),
                  color: textoTecho,
                  marginTop: spacing[1],
                }}
              >
                {`${saludoPorFranja(hoy.getHours(), t)}${nombrePerfil ? `, ${nombrePerfil.trim().split(' ')[0]}` : ''}`}
              </Text>
              {/* r4-1: LAS MASCOTAS EN EL HEADER — squircle 112/36 (32%,
                  S61-A10), punto de estado 26 con aro de papel 4, nombre
                  debajo; fila horizontal + el "+" de 72 (→ agregar). */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing[4], alignItems: 'flex-start', paddingTop: spacing[5] }}
              >
                {mascotas.map((m) => {
                  const s = senalesPorMascota.get(m.id);
                  const v = s
                    ? calcularVozHogar(
                        {
                          tieneEmergenciaActiva: s.tiene_emergencia_activa,
                          vacunasTotal: s.vacunas_total,
                          ultimaVacunaAplicada: s.ultima_vacuna_aplicada,
                          proximaVacuna: s.proxima_vacuna,
                          ultimaAtencionCerrada: s.ultima_atencion_cerrada,
                        },
                        hoy,
                      ).voz
                    : null;
                  return (
                    <Pressable
                      key={m.id}
                      accessibilityRole="button"
                      accessibilityLabel={m.nombre}
                      onPress={() => router.push({ pathname: '/hogar/mascota/[mascotaId]', params: { mascotaId: m.id } })}
                      style={{ alignItems: 'center', gap: spacing[2] }}
                    >
                      <View>
                        <View
                          style={{
                            width: 112,
                            height: 112,
                            borderRadius: 36,
                            borderCurve: 'continuous',
                            overflow: 'hidden',
                            backgroundColor: esMemorial ? theme.bg.overlay : 'rgba(255,255,255,0.17)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {fotos[m.id] !== undefined ? (
                            <Image
                              source={{ uri: fotos[m.id] }}
                              style={{ width: 112, height: 112 }}
                              contentFit="cover"
                              accessibilityIgnoresInvertColors
                            />
                          ) : (
                            <Svg width={52} height={52} viewBox="0 0 24 24">
                              <Huella color={textoTecho} escala={0.9} x={1.2} y={1.2} />
                            </Svg>
                          )}
                        </View>
                        {/* r6-3 (propuesta al gate): el punto GANA GLIFO —
                            un color sin leyenda no comunica. Check = al
                            día · el NÚMERO = la cuenta de SUS filas en
                            Ponte al día (un sistema, no dos). 26 − aro 4
                            = ~18 de glifo. Solo con señal (L-139). */}
                        {(() => {
                          const n = pendientesDe(m.id);
                          if (v === null && n === 0) return null;
                          const alDia = n === 0 && v === 'alDia';
                          const bg = n > 0 ? theme.status.warning : alDia ? theme.status.success : theme.text.tertiary;
                          return (
                            <View
                              style={{
                                position: 'absolute',
                                right: -2,
                                bottom: -2,
                                width: 26,
                                height: 26,
                                borderRadius: 999,
                                backgroundColor: bg,
                                borderWidth: 4,
                                borderColor: esMemorial ? theme.bg.card : theme.bg.base,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {n > 0 ? (
                                <Text style={{ fontFamily: typography.family.sans.medium, fontSize: 12, color: theme.bg.card }}>
                                  {n > 9 ? '9+' : String(n)}
                                </Text>
                              ) : alDia ? (
                                <Svg width={12} height={12} viewBox="0 0 24 24">
                                  <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={theme.bg.card} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </Svg>
                              ) : null}
                            </View>
                          );
                        })()}
                      </View>
                      <Text
                        style={{
                          fontFamily: typography.family.sans.medium,
                          fontSize: typography.size.sm,
                          color: textoTecho,
                        }}
                      >
                        {m.nombre}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('hogar.agregarMascotaCelda')}
                  onPress={() => router.push('/hogar/agregar')}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    backgroundColor: esMemorial ? theme.bg.overlay : 'rgba(255,255,255,0.17)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: spacing[5],
                  }}
                >
                  <Svg width={28} height={28} viewBox="0 0 24 24">
                    <Path d="M12 5v14M5 12h14" stroke={textoTecho} strokeWidth={1.9} strokeLinecap="round" fill="none" />
                  </Svg>
                </Pressable>
              </ScrollView>
            </>
          );
          return esMemorial ? (
            <View style={[relleno, { backgroundColor: theme.bg.card }]}>{contenido}</View>
          ) : (
            <LinearGradient
              colors={[...theme.accent.gradient.colors] as [string, string, ...string[]]}
              locations={[...theme.accent.gradient.locations] as [number, number, ...number[]]}
              start={{ x: 0.13, y: 0 }}
              end={{ x: 0.87, y: 1 }}
              style={relleno}
            >
              {contenido}
            </LinearGradient>
          );
        })()}
        {/* LA ENTRADA DEL COACH (S53-B2b) — intacta sobre el techo local */}
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
          <Animated.View style={pressedCoach.estiloPresionado}>
            {/* r6-1: el botón de IA se DEMARCA — relleno en degradado de
                la familia del header (violeta→azul: los stops 2-3 del
                gradiente FIRMA, que es la familia del techo; la rampa
                del isotipo NO — A5 la reserva a marca). Memorial: plano. */}
            {esMemorial ? (
              <View style={{ width: 42, height: 42, borderRadius: 999, backgroundColor: theme.bg.overlay, alignItems: 'center', justifyContent: 'center' }}>
                <Icono nombre="ia" tamano={22} registro="tinta" tinta={theme.text.secondary} />
              </View>
            ) : (
              <LinearGradient
                colors={[theme.accent.gradient.colors[1], theme.accent.gradient.colors[2]] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 42, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icono nombre="ia" tamano={22} registro="tinta" tinta={theme.text.onGradient} />
              </LinearGradient>
            )}
          </Animated.View>
        </Pressable>
      </View>

      {/* @override-s82c — RECOMENDACIONES      {/* @override-s82c — RECOMENDACIONES (lámina, ítem 1): LA TARJETA
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
        const filas = filasReco;
        if (filas.length === 0) return null;
        const visibles = ponteRevelado ? filas : filas.slice(0, 3);
        return (
          <View style={{ paddingHorizontal: spacing[4], marginTop: -SOLAPE_RECO, zIndex: 2 }}>
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
                  <FilaReco capa={f.capa} icono={f.icono} titulo={f.titulo} detalle={f.detalle} detalleMono={f.detalleMono === true} onPress={f.onPress} />
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


      {/* r6-2: LAS TARJETAS DE MASCOTA MURIERON — con las mascotas en el
          header eran redundantes; su contenido (la cita, el carnet)
          vive como FILAS de Ponte al día, y el punto de estado del
          techo cuenta ESAS filas (un sistema, no dos). Ley 37: el
          código murió con ellas; las voces de ficha y hogar.voz QUEDAN
          — pares conservados por decisión founder S52 para contextos
          sin sujeto visible. */}

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
            // S82-A r12 (CRUCE DE TERRITORIO declarado, UNA línea):
            // **D-493 QUEDA PAGADA ACÁ.** El destino v1 era prestado —
            // `/citas/[mascotaId]`, la mascota de la próxima cita vet —
            // y su propio defecto estaba escrito en la deuda: en un
            // hogar multi-mascota aterrizaba en UNA y las otras solo se
            // alcanzaban por ficha. Ahora va al LOG, que las trae todas
            // y filtra por mascota.
            onPress: () => router.push('/hogar/veterinaria'),
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
            detalle={t('alta.entradaDetalle')}
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
                    <FiltroPills
                      activo={filtroVida}
                      onCambio={(c) => setFiltroVida(c)}
                      opciones={[
                        { codigo: 'todo', etiqueta: t('hogar.filtroTodo'), icono: 'huella', capa: null },
                        { codigo: 'salud', etiqueta: t('hogar.filtroSalud'), icono: 'veterinaria', capa: 'identidad' },
                        { codigo: 'paseos', etiqueta: t('hogar.filtroPaseos'), icono: 'paseo', capa: 'cuidado' },
                        { codigo: 'estetica', etiqueta: t('hogar.filtroEstetica'), icono: 'grooming', capa: 'cuidado' },
                        { codigo: 'adiestramiento', etiqueta: t('hogar.filtroAdiestramiento'), icono: 'training', capa: 'cuidado' },
                      ]}
                    />
                    {filtrados.length === 0 ? (
                      <View style={{ paddingHorizontal: spacing[4] }}>
                        <EstadoVacio registro="seccion" titulo={t('hogar.filtroSinMomentos')} />
                      </View>
                    ) : (
                      <View style={{ paddingHorizontal: spacing[4], gap: spacing[3] }}>
                        {visibles.map((it) => {
                          // El canto sale del EJE que la fila ya trae, no de
                          // un mapa de tipos que envejece (ver `capaDeHecho`):
                          // siete tipos vivos se dibujaban sin canto.
                          const capa = capaDeHecho(it.eje_jtbd);
                          const color = capa === null ? null : theme.capa[capa];
                          const navega = it.tipo === 'historia_clinica_registrada';
                          const expandible = it.atencion_id !== null || it.tipo === 'vacuna_aplicada';
                          const abierto = hechosAbiertos[it.evento_id] === true;
                          return (
                            <EventoVida
                              key={it.evento_id}
                              color={color}
                              titulo={vozHecho(it, t, nombrePorMascota.get(it.mascota_id) ?? '')}
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

      {/* S89 — LA INVITACIÓN DE LA CASA (lámina firmada). Vive en el Hogar
          porque es la primera pantalla con sesión: el SO da UN SOLO TIRO y
          la casa explica antes de pedirlo. La pieza decide sola si aparece
          (guardas de la lámina adentro); acá solo se monta. */}
      <InvitacionAvisos />

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
