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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  AIRE_RAIZ,
  AvatarMascota,
  Badge,
  Boton,
  Celda,
  CeldaNavegacion,
  CitaEnVivo,
  Esqueleto,
  EsqueletoGrupo,
  Cabecera,
  Personaje,
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
  HojaContenido,
  Huella,
  Isotipo,
  Texto,
  VisorFoto,
  motion,
  radius,
  spacing,
  Campo,
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
  obtenerMisEstadiasGuarderia,
  type EstadiaDeMiMascota,
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
  listarMisPedidos,
  type PedidoEnLista,
  obtenerMisAvisos,
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

import { fechaCortaHumana, fechaYHoraHumana, formatearPrecio, diaSemanaCorto, fechaCortaMono, fechaLargaHumana } from '@epetplace/i18n';

import { InvitacionAvisos } from '@/components/invitacion-avisos';
import { ventanaVencida } from '@/lib/despensa/ventana';
import { unidadesEnCarrito, useCarrito } from '@/lib/despensa/carrito';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';
import { useTraduccion } from '@/i18n';
import { ADOPCION_ALCANZABLE } from '@/lib/gate-adopcion';
import { vozServicio } from '@/lib/voz-servicio';
import { FAMILIA_DE_TIPO, capaDeHecho, etiquetasDeChips, vozHecho } from '@/lib/voz-hecho';
import { useFotosDeRecuerdos } from '@/lib/recuerdo/fotos';
import { contarPendientesDe, type FuentesDePendientes } from '@/lib/pendientes';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import { composicionDe } from '@/lib/composicion-sujeto';
import { CantoCurva } from '@/components/canto-curva';
import { FiltroPills } from '@/components/filtro-pills';
/* 🔴 ALIAS A PROPÓSITO: este archivo ya tiene un `esMemorial` local que es
   el del TEMA (línea ~775), y son DOS preguntas distintas — «¿el tema está
   en memorial?» y «¿la mascota falleció?». *Importarla con su nombre las
   confundiría en el peor lugar: el compilador avisó, pero un lector no.* */
import { esMemorial as mascotaEnMemorial } from '@/lib/memorial';
import { abrirAjustesDelSistema, useSinAvisos } from '@/lib/sin-avisos';


type TraductorHogar = ReturnType<typeof useTraduccion>['t'];

/** R12 (guard, r4-defecto 2): EL SOLAPE JAMÁS EXCEDE EL RESPIRO — la
 *  tarjeta de recomendaciones sube sobre la banda SOLO dentro del aire
 *  que el techo deja bajo las mascotas; si alguien agranda el solape
 *  por encima del respiro, tapa el saludo/nombres y el lint lo para.
 *  Verificado por construcción: 56 > 32. */
/* ☠️ **`SOLAPE_RECO` y `RESPIRO_BANDA` MURIERON con el techo local
   (S116-C lote 3b).** Eran los dos números del solape: cuánto subía la
   tarjeta de «Ponte al día» para pegarse a la banda, y cuánto aire dejaba
   la banda al pie para que no tapara el saludo. **Hoy el solape es la
   COSTURA y la pone `HojaContenido`.** Con ellos se jubiló `R14`, que era
   la regla que vigilaba que uno fuera menor que el otro — su lápida está
   en `verify-diseno.mjs`. Las menciones `⏪` que quedan abajo son
   historia: explican por qué la tarjeta bajó con su aire. */

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
  FadeInDown.duration(motion.duration.legacy_normal).delay(orden * motion.stagger.fast);

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
            backgroundColor: theme.capaBg[capa],  /* S116-B · memorial ya porta el slot: el fallback era rama muerta. */
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icono nombre={icono} tamano={21} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: spacing[0.5] }}>
          <Texto variante="cuerpo" numberOfLines={2}>{titulo}</Texto>
          {detalle !== null ? (
            <Texto variante={detalleMono === true ? 'dato' : 'apoyo'} numberOfLines={2}>{detalle}</Texto>
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
  foto,
  marca,
  navega,
  expandido,
  onPress,
  children,
}: {
  color: string | null;
  /** 🔴 **`''` = SIN TÍTULO, y la fila lo omite en vez de rellenarlo.** Lo
   *  necesita el recuerdo de sólo foto (S113-A): su voz es el texto de la
   *  familia, y cuando no hay texto *no hay texto* — poner una frase de la
   *  casa sería hablar encima de alguien que eligió no escribir. */
  titulo: string;
  meta: string;
  /** URL YA FIRMADA de la foto del recuerdo, o `null`. Se resuelve arriba por
   *  lote (`useFotosDeRecuerdos`): acá sólo se pinta. */
  foto?: string | null;
  /**
   * S106-C t3 · LA MARCA DE §7 — hoy, la insignia de teleconsulta.
   *
   * Va **debajo del título y en su propia fila**, no dentro de `meta`: esa
   * línea es `numberOfLines={1}` y ya lleva fecha y quién — un tercer
   * segmento la trunca, y *lo que se pierde al truncar es siempre el final,
   * o sea justo la marca*.
   *
   * `LETRA_TELEMEDICINA` §7: *«dentro de tres años alguien va a leer ese
   * expediente para decidir algo, y "evaluado por pantalla" cambia cómo se
   * lee»* — por eso la marca es visible SIN desplegar el hecho.
   */
  marca?: React.ReactNode;
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
          {titulo !== '' ? <Texto variante="cuerpo" numberOfLines={2}>{titulo}</Texto> : null}
          {foto != null ? (
            <Image
              source={{ uri: foto }}
              style={{ width: '100%', height: 160, borderRadius: radius.md }}
              contentFit="cover"
              transition={160}
            />
          ) : null}
          <Texto variante="dato" numberOfLines={1}>{meta}</Texto>
          {marca}
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
            {titulo !== '' ? <Texto variante="cuerpo" numberOfLines={2}>{titulo}</Texto> : null}
            {foto != null ? (
              <Image
                source={{ uri: foto }}
                style={{ width: '100%', height: 160, borderRadius: radius.md }}
                contentFit="cover"
                transition={160}
              />
            ) : null}
            <Texto variante="dato" numberOfLines={1}>{meta}</Texto>
            {marca}
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

/* ☠️ **`FilaCampanaTecho` MURIÓ (S116-C lote 3b · `D-1106`).** Era la fila del
 * techo local: isotipo a la izquierda + carrito + campana, los dos en
 * `DiscoVidrio` con `GlifoConContador`. **Los dos discos son hoy props de
 * `Cabecera`** (`carrito` y `avisos`), que nacieron en el lote 3b para esto
 * exacto — su propia nota lo dice: *«la campana se dibujaba en el techo local
 * del Hogar, y ése es el techo que este lote viene a borrar»*.
 *
 * ⚠️ **Lo que se pierde en el camino y no es un olvido: el isotipo del techo.**
 * El lote 10 firmó que las cabeceras raíz del cliente no lo llevan, y es la
 * misma razón por la que en este mismo lote murió el `isotipo="gradiente"` de
 * la Despensa. *La marca de agua del fondo sigue viva; el isotipo del techo
 * era el segundo, y la Ley 4 pide uno.*
 *
 * ⚠️ **Y con ella se va el guard visible de R32**: el `gap: spacing[5]` (20 dp
 * = los dos hitSlop) que R32 leía acá **ahora lo pone la pieza**
 * (`Cabecera`, `gap: spacing[2]` entre los dos discos, con su propio alto de
 * 44). *No desaparece la regla: cambia quién la sostiene, y pasa a sostenerla
 * el único lugar donde se monta.* Medido al mover: los dos discos siguen
 * siendo `DiscoVidrio` + `GlifoConContador`, la misma combinación que este
 * archivo eligió midiendo las dos que la casa permite. */

export default function Hogar() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  /* El arranque de la hoja = el alto REAL de la banda, medido una vez
     (`lib/alto-de-cabecera`). Arranca en la parte fija de la pieza para que no
     haya un parpadeo en el primer cuadro. */
  const cabecera = useAltoDeCabecera('raiz');
  const carrito = useCarrito();
  const { mostrar } = useAviso();
  /** `D-1057`: el sistema tiene los avisos apagados. Se relee al foco. */
  const sinAvisos = useSinAvisos();

  const [mascotas, setMascotas] = useState<EstadoMascotas>('cargando');
  /* 🪦 `D-1101` · SIN FAMILIA YA NO SE REBOTA — se DIBUJA.
     Hasta hoy el hogar hacía `router.replace('/')` cuando no había familia, y
     el raíz mandaba a `/onboarding`. Con el onboarding enterrado eso sería un
     BUCLE, así que el estado sin familia pasa a ser una pantalla y no un
     rebote. **Es la misma pantalla que «sin mascotas»** —la que el encargo
     llama 06— porque para quien mira son el mismo hecho: *acá todavía no hay
     nadie*. Lo único que cambia es a qué alta lleva el CTA. */
  const [tieneFamilia, setTieneFamilia] = useState(true);
  /* La «i» del hogar sin mascotas (N22). Vive acá arriba y no junto a su
     `return`: **es un hook**, y un hook detrás de un return condicional
     rompe el orden de llamada en el render siguiente. */
  const [hojaPorQueRegistrar, setHojaPorQueRegistrar] = useState(false);
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
  /**
   * ⭐ **G4 · EL DÍA DE GUARDERÍA ENTRA AL «EN VIVO» DEL HOGAR.**
   *
   * 🔴 Medido antes de montarlo: `obtenerTramoVivoDeMiMascota` tenía **UN solo
   * consumidor** —la ficha de la estadía— y **cero puerta acá**. O sea que una
   * familia cuyo animal estaba en la guardería abría su casa y **no veía nada**:
   * el servicio más largo del día era el único invisible desde el Hogar.
   *
   * ⚠️ **La fuente NO es `obtenerTramoVivoDeMiMascota`, y por eso esto entra en
   * UN viaje y no en N.** Ese wrapper es POR MASCOTA: usarlo acá costaría una
   * petición por animal, y `L-223` ya midió que el techo del producto lo pone
   * la cantidad de viajes, no el trabajo del servidor.
   * `obtenerMisEstadiasGuarderia()` sin argumentos trae las de TODAS mis
   * mascotas de una, **con `estadoEstadia` ya resuelto por el servidor** — que
   * es exactamente la etapa que hay que dibujar.
   */
  const [estadiasVivas, setEstadiasVivas] = useState<
    (EstadiaDeMiMascota & { estadiaId: string })[]
  >([]);

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
  /* S113-A · las fotos de los recuerdos, firmadas POR LOTE. El estado del
     timeline es `items` (null = cargando · 'error' = falló); el hook ignora
     los ítems sin `foto_path`. */
  const fotosRecuerdo = useFotosDeRecuerdos(items === null || items === 'error' ? [] : items);
  // S74-A (cura D-497): el cursor del timeline es GLOBAL — una sola
  // query hogar-wide reemplazó a las N páginas por mascota.
  const cursorRef = useRef<string | null>(null);
  const [estadoPie, setEstadoPie] = useState<LineaDeVidaEstadoPie>('nada');
  const cargandoMasRef = useRef(false);

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
  const [noLeidos, setNoLeidos] = useState(0);
  /**
   * 🔴 S100c-D · LOS PEDIDOS EN VUELO — la fila que faltaba en la posición
   * consolidada (firma del founder: *«los pedidos que estén en vuelo o
   * próximos deben llegar a la posición consolidada del Hogar y hoy no
   * están llegando»*).
   *
   * **No es una fila nueva: es una fila DECLARADA SIN MONTAR desde S82-C**,
   * con su condición escrita en el propio render — *«cero motor de despensa
   * (L-139 — no se fabrica el dato); **monta cuando exista**»*. El motor
   * existe desde S95 y la despensa cerró de punta a punta en S96/S100. *Un
   * ítem diferido con su disparo adentro es lo correcto; lo que falta es que
   * alguien barra los disparos ya cumplidos.*
   *
   * Vacío mientras carga o si la lectura falla — best-effort igual que sus
   * vecinas: una franja que no se dibuja no afirma nada, una que dice «no
   * tenés pedidos» sí (L-139).
   */
  const [pedidosEnVuelo, setPedidosEnVuelo] = useState<PedidoEnLista[]>([]);
  /** ¿La familia tiene ALGÚN pedido? Decide la DOSIS de la puerta del local
   *  (§ canal de adquisición). `null` = todavía no sabemos ⇒ **no se dibuja
   *  ninguna de las dos formas**: *elegir la prominente por defecto le
   *  gritaría a quien ya compra, y elegir la discreta le escondería su única
   *  puerta a quien no. Un tercer estado honesto cuesta un `null`.* */
  const [hayPedidos, setHayPedidos] = useState<boolean | null>(null);

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
        /* Un FALLO de lectura no es «no tiene familia» (Ley 13 / `L-178`):
           uno se dibuja como error con reintento, el otro como hogar vacío.
           Confundirlos le diría «todavía no tenés a nadie» a alguien que sí. */
        if (!estado.ok) {
          setMascotas('error');
          return;
        }
        if (!estado.data.tiene_familia || estado.data.familia_id === null) {
          setTieneFamilia(false);
          setMascotas([]);
          return;
        }
        setTieneFamilia(true);
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
        /* G4 · en PARALELO con las demás, jamás encadenado: el prólogo serial
           es lo que S94-PERF midió como el costo real de esta pantalla. */
        void obtenerMisEstadiasGuarderia().then((es) => {
          if (!vigente || !es.ok) return;
          /* Las tres etapas del durante, y **sólo ésas**. `reservada` no está
             en curso —es una promesa para más tarde, y su lugar es la agenda—;
             `entregada`, `cancelada` y `no_recogida` ya pasaron. *Un «en vivo»
             que incluye lo que todavía no empezó deja de significar «ahora».* */
          setEstadiasVivas(
            es.data.filter(
              (e): e is EstadiaDeMiMascota & { estadiaId: string } =>
                e.estadiaId !== null &&
                (e.estadoEstadia === 'recogida_en_curso' ||
                  e.estadoEstadia === 'en_guarderia' ||
                  e.estadoEstadia === 'retorno_en_curso'),
            ),
          );
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
        /* ⭐ **S116-C lote 10 · LA CAMPANA CUENTA.** Recorrido 4: *«campana con
           el número de no leídos»*.

           ⏪ Acá vivía `hayNovedades('cliente')`, **un booleano a propósito**
           — su propio wrapper lo dice: *«existe para que el techo NO tenga que
           traer la lista sólo para decidir si dibuja un punto: la forma del
           dato hace imposible el defecto del contador»*.

           🔴 **Y AHÍ ESTÁ EL COSTO, que declaro en vez de esconder: el motor no
           tiene un contador.** Censé `packages/api/src/wrappers/campana.ts`
           entero — hay `hay_novedades` (booleano), `obtener_mis_avisos`
           (lista) y `marcar_aviso_leido`; **ninguna cuenta**. ⇒ el número sale
           de contar la lista.

           **Es UN viaje por UN viaje** (L-223: el peaje son ~150 ms por
           PETICIÓN, no por fila) — el efecto no gana una vuelta. **Lo que sí
           crece es la carga útil**: antes venía un `boolean`, ahora hasta 100
           avisos con título y mensaje, en cada foco del Hogar. *No es gratis y
           no lo pinto como si lo fuera.* Pedido a A en el buzón
           (`contar_avisos_no_leidos`); el día que exista, esto es una línea.

           **100 y no 50**, porque el disco dice «99+» a partir de ahí: con un
           techo de 50 el número mentiría **callado** justo cuando más importa.

           Un fallo cae a **0** — *un contador que no se pudo leer no inventa
           pendientes*, misma regla que el booleano tenía. */
        void obtenerMisAvisos(100).then((r) => {
          if (vigente) setNoLeidos(r.ok ? r.data.filter((a) => !a.leida).length : 0);
        });
        /* 🔴 PONTE AL DÍA: LOS PEDIDOS EN VUELO (S100c-D).
         *
         * **Se filtra ACÁ y no en el lector, y es decisión medida, no
         * pereza:** L-223 dice que *el costo no está en los datos, está en
         * la PETICIÓN* —un peaje fijo de ~150 ms que no depende de cuánto
         * traiga—, y esta casa lo probó al revés (*traer 105 filas costó
         * MENOS que traer una*). Pedirle a A un lector nuevo para descartar
         * filas en el server habría costado una ronda entre pistas y CERO
         * milisegundos.
         *
         * **`pagando` NO entra, y ése es el filtro que importa.** La promesa
         * de entrega **nace con el pedido, antes del pago** (censo S100b-D:
         * `pagando` = 4 · con promesa = 4 · **con pago confirmado = 0**) ⇒
         * meter un `pagando` acá sería prometerle a la familia una entrega
         * que todavía no está comprada. *Es la mitad exacta del defecto que
         * S100b curó por el otro lado.*
         * Los terminales tampoco: `entregado` y `cancelado` ya no esperan
         * nada — su casa es el historial. */
        void listarMisPedidos().then((ps) => {
          if (!vigente) return;
          // La MISMA lectura sirve a las dos preguntas: cuántos van en vuelo
          // (la fila de Ponte al día) y si existe alguno (la dosis de la
          // puerta del local). *Pedir dos veces lo mismo paga dos peajes.*
          setHayPedidos(ps.ok ? ps.data.length > 0 : null);
          setPedidosEnVuelo(
            ps.ok
              ? ps.data.filter(
                  (p) =>
                    p.narrativa === 'confirmado' ||
                    p.narrativa === 'preparando' ||
                    p.narrativa === 'en_camino',
                )
              : [],
          );
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

  /* ═══ EL HOGAR SIN NADIE — «cuenta sin mascota» es un estado legal ═══════
     Medido por S110-D: **152 de 170 usuarios no tienen ninguna mascota**, y el
     motor los representa como ciudadanos de primera clase (`mascotas_count`
     explícito). Esta pantalla es su casa, no un error.

     🔴 **LO QUE FALTABA ERA EL CAMINO.** El vacío decía «Agrega a tu mascota
     para empezar su historia» **y no tenía con qué**: una instrucción sin
     control es la Ley 17.5 rota — *el vacío invita a ACTUAR, no termina en un
     estado de ánimo.* Ahora el mismo texto tiene su botón.

     ⏪ **S113-C · ESTE PÁRRAFO DECÍA QUE EL COACH CALLABA «POR POSICIÓN» — y
     su mecanismo se mudó, así que se corrige acá y no en otro lado.** Decía
     que este `return` corta antes del destello y de `CoachHoja`, de modo que
     el Coach no podía saludar a quien todavía no tiene de quién hablarle.
     **Las dos piezas se fueron al shell**, donde ningún `return` de esta
     pantalla las alcanza.

     ✅ **La garantía NO se perdió: cambió de mecanismo y ahora es más fuerte.**
     La decide `focoNexo`: un hogar sin mascotas activas devuelve `'ninguna'`
     y `montaPresencia` da `false` ⇒ **queda la burbuja de siempre, en las
     cinco pestañas y no sólo acá**. *Un coach que saluda sin conocer a nadie
     enseña a ignorarlo* — y antes eso lo sostenía la posición de un `return`,
     que es la clase de garantía que se pierde al mover una línea.

     ✅ **EL SEGUNDO CAMINO ENTRÓ (S112-C), Y SU CONDICIÓN LA ESCRIBIÓ ESTE
     MISMO COMENTARIO.** Decía: *«no se dibuja porque no tiene a dónde ir:
     medido, cero motor de adopción (0 funciones, 0 wrappers) — un botón a una
     vidriera vacía es peor que no ofrecerla»*. **S111-A construyó el motor y
     S111-C la vidriera**, así que la condición se cumplió y el botón lleva a
     alguien. *Una deuda con su bloqueante NOMBRADO alguien la destraba; una
     «pendiente» espera para siempre.*

     🔴 **Y CAMBIÓ LA COMPOSICIÓN, no sólo el número de botones.** Voz del
     founder: *«si vuelvo al home sin mascota, el home NO me muestra un cero:
     me muestra el bloque de adopción y una invitación a registrar una mascota,
     con la "i" de por qué»*. Un `EstadoVacio` centrado **es** mostrar un cero
     —dice lo que falta antes que lo que hay—, así que la pantalla pasa a dos
     cartas: **primero los que esperan, después la invitación.** El orden es el
     dictado, y tiene su razón: quien llegó por adopción entró a ver animales,
     no a llenar un formulario. */
  if (mascotas.length === 0) {
    /* ⚠️ **`hoy` se declara ACÁ y no se reusa el de abajo** — el de la
       pantalla poblada vive después de este `return` y leerlo sería un TDZ:
       compila, y revienta en runtime. Es la clase exacta que `D-1009` y
       `verify:ref-antes-de-uso` existen para cazar, y que ya costó un crash
       en S112. *Una constante barata local vale más que un orden frágil.* */
    const hoyVacio = new Date();
    /* 🔴 DOS ALTAS, y elegir mal rompe: la PRIMERA mascota nace por
       `crear_familia_con_primera_mascota` (ruta `/onboarding/datos`) y la
       adicional por `agregar_mascota_a_familia`, que **exige una familia que
       todavía no existe**. Se decide por el DATO, no por la pantalla — y vive
       en UNA constante porque abajo hay dos CTA que llevan al mismo lado, y
       *una regla que hay que aplicar dos veces se aplica una sola.* */
    /* 🔴 **S116-C lote 6 · `/onboarding/foto`, no `/onboarding/datos`.** El
       alta se invirtió y **esta puerta llevaba al paso 2**. Va como LITERAL y
       no como `/onboarding/${PRIMER_PASO}`: las rutas tipadas rechazan una
       plantilla (se ensancha a `string`), que es justo lo que existen para no
       aceptar. *El precio de la ruta tipada es este literal; el control de que
       coincida con `PASOS[0]` es leerlos juntos, y por eso se nombra acá.* */
    const rutaAlta = tieneFamilia ? '/hogar/agregar' : '/onboarding/foto';
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        {/* ⭐ **06 · EL HOGAR SIN MASCOTA — S116-C lote 3.**
            La cabecera raíz de la casa, con su saludo. *Una pantalla vacía
            sin techo se lee como una pantalla que no cargó.* */}
        {/* ⭐ **LA ESTRUCTURA FIRMADA — S116-C lote 3b.** Fondo ciruela
          (`presentacion="fondo"`, sin radio inferior ni sombra) + la hoja de
          lienzo encima, que lleva la curva ARRIBA y desliza al scrollear.
          **Vale también para los estados de carga y error**: son la misma
          pantalla en otro momento, y una cabecera-tarjeta acá sería la curva
          invertida justo donde nadie la mira dos veces. */}
        <HojaContenido
          arranque={cabecera.arranque}
          fondo={
            <View onLayout={cabecera.alMedir}>
              <Cabecera
                variante="raiz"
                /* **El MISMO saludo que el Hogar poblado**, no una voz paralela:
                `saludoPorFranja` + el primer nombre del perfil. *Dos formas de
                saludar en la misma app son dos que envejecen distinto.* */
                antetitulo={fechaLargaHumana(hoyVacio.toISOString().slice(0, 10), idioma)}
                titulo={`${saludoPorFranja(hoyVacio.getHours(), t)}${nombrePerfil ? `, ${nombrePerfil.trim().split(' ')[0]}` : ''}`}
                apoyo={t('hogar.vacioApoyo')}
                presentacion="fondo"
              />
            </View>
          }
        >
        <View style={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: spacing[5],
            gap: spacing[4],
          }}>
          {/* ── ① LOS QUE ESPERAN — PRESIDE ─────────────────────────────
              🔴 **Sin contador, igual que en Explorar:** §4 prohíbe convertir
              la lista en inventario. *Se presentan vidas, no stock.*

              ⏸️ **APAGADA hasta el lote de adopción** (`ADOPCION_ALCANZABLE`):
              construida y verificada, fuera del lote de guardería que el
              founder recorre. Con el gate apagado esta pantalla queda como
              estaba — la invitación a registrar, sola. */}
          {ADOPCION_ALCANZABLE ? (
          <Tarjeta>
            <CeldaNavegacion
              icono="refugio"
              titulo={t('hogar.sinMascotasAdopcion')}
              detalle={t('hogar.sinMascotasAdopcionDetalle')}
              onPress={() => router.push('/adoptar')}
            />
          </Tarjeta>
          ) : null}

          {/* ── ② LA INVITACIÓN, CON SU «i» (N22) ───────────────────────
              **Por qué la «i» y no un párrafo suelto:** N22 corta por FUNCIÓN,
              no por longitud — *lo que se necesita para DECIDIR queda a la
              vista; lo que se necesita para ENTENDER va detrás de una «i»*. El
              control se ve y decide; **por qué conviene registrarla** es
              explicación, y se pliega.

              `chevron={false}`: la celda ABRE el alta, no entra a una sección
              (S58, patrón Hogar v2). */}
          {/* ── ②bis **LA INVITACIÓN, RECOMPUESTA (06)** ─────────────────
              El personaje, el título, la línea y el CTA. **El borde punteado
              lo da `Tarjeta tinte="plana"` con el hairline de la casa** — no
              se pinta un borde a mano: eso sería un valor en la pantalla y lo
              caza `R4`. *Si la mesa quiere el punteado rosa exacto del mock,
              es una prop de `Tarjeta` y se pide.* */}
          <Tarjeta tinte="plana">
            <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[4] }}>
              <Personaje especie="perro" tamano="grande" fondo="rosa" />
              <Texto variante="seccion">{t('hogar.vacioTitulo')}</Texto>
              <Texto variante="cuerpo" color="secondary" centrado>
                {t('hogar.vacioDetalle')}
              </Texto>
              <Boton
                variante="primario"
                bloque
                etiqueta={t('hogar.vacioCta')}
                onPress={() => router.push(rutaAlta)}
              />
            </View>
          </Tarjeta>

          {/* ── ③ **MIENTRAS TANTO** — dos caminos que SÍ llevan a algo.
              *No es relleno: sin mascota el Hogar no tiene estado que contar,
              y dejar la pantalla con una sola tarjeta sería correcto pero
              mudo. Estas dos filas existen porque las dos secciones ya
              funcionan sin mascota.* */}
          <View style={{ gap: spacing[2] }}>
            <Texto variante="antetitulo">{t('hogar.mientrasTanto')}</Texto>
            <Tarjeta>
              <CeldaNavegacion
                icono="explorar"
                titulo={t('hogar.vacioExplorar')}
                detalle={t('hogar.vacioExplorarDetalle')}
                onPress={() => router.push('/explorar')}
              />
              <Separador />
              <CeldaNavegacion
                icono="despensa"
                titulo={t('hogar.vacioTienda')}
                detalle={t('hogar.vacioTiendaDetalle')}
                onPress={() => router.push('/despensa')}
              />
            </Tarjeta>
          </View>

          {/* La «i» del porqué se conserva — N22: lo que se necesita para
              ENTENDER se pliega, y su Hoja sigue viva más abajo. */}
          <Tarjeta>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <View style={{ flex: 1 }}>
                <CeldaNavegacion
                  icono="carnet"
                  titulo={t('hogar.sinMascotasAgregar')}
                  detalle={t('hogar.sinMascotasDetalle')}
                  chevron={false}
                  onPress={() => router.push(rutaAlta)}
                />
              </View>
              {/* La «i» en círculo — el patrón vivo de la casa (`carrito.tsx`,
                  S100b): `Pressable` + glifo `info` + Hoja. **Su etiqueta
                  accesible es el texto que abre**, no la palabra «info»: quien
                  navega con lector oye QUÉ va a leer, no el nombre del control. */}
              <Pressable
                onPress={() => setHojaPorQueRegistrar(true)}
                accessibilityRole="button"
                accessibilityLabel={t('hogar.sinMascotasPorQueTitulo')}
                hitSlop={12}
              >
                <Icono nombre="info" tamano={20} registro="aa" />
              </Pressable>
            </View>
          </Tarjeta>
        </View>

        <Hoja
          visible={hojaPorQueRegistrar}
          onCerrar={() => setHojaPorQueRegistrar(false)}
          titulo={t('hogar.sinMascotasPorQueTitulo')}
        >
          <View style={{ gap: spacing[3] }}>
            <Texto variante="cuerpo">{t('hogar.sinMascotasPorQueCuerpo')}</Texto>
            <Boton
              etiqueta={t('hogar.sinMascotasPorQueCierre')}
              bloque
              onPress={() => setHojaPorQueRegistrar(false)}
            />
          </View>
        </Hoja>
        </HojaContenido>
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
  /** La hora de la ventana prometida. Locale EXPLÍCITO, el mismo par que
   *  usan `pedidos.tsx` y `en-camino` — *dos formas del mismo reloj en
   *  pantallas vecinas divergen el día que alguien toque una sola.* */
  const horaLocal = (iso: string) =>
    new Date(iso).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });

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
    /* 🔴 **UNA MASCOTA EN MEMORIA NO LLEVA LÍNEA DE ESTADO** (D-1021, `A3.9`).
       `calcularVozHogar` mira vacunas y atenciones y **no conoce el estado de
       vida** —vive en `packages/domain` y no es mío—, así que le diría «Está
       al día» o «Necesita tu atención» a quien ya no está. *El dato para
       callarla estaba acá, en la lista de mascotas, y nadie lo miraba.* */
    const m = Array.isArray(mascotas) ? mascotas.find((x) => x.id === id) : undefined;
    if (m !== undefined && mascotaEnMemorial(m.estado_vida)) return null;
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
  /* 🔴 **ARRIBA DE `filasReco`, Y NO DONDE VIVÍA `mascotaDe`.** Puesto abajo
     compila igual y **crashea la pantalla entera**: `filasReco` es un IIFE que
     corre al render, así que lee esto antes de que exista (TDZ). Lo destapó el
     arnés —«Esta pantalla no se pudo mostrar»—, no el typecheck: *un `const`
     usado antes de declararse es un error de TIEMPO, y el compilador mira
     tipos.* `verify:ref-antes-de-uso` tampoco lo ve: su alcance escrito son
     los `useRef`, y esto es una función. */
  const mascotaDe = (id: string) => (Array.isArray(mascotas) ? mascotas.find((m) => m.id === id) : undefined);
  /** El hecho, en UN solo lugar de esta pantalla: lo leen el filtro de las
   *  filas y la lib de pendientes, que antes decían cosas distintas. */
  const enMemoriaDe = (id: string): boolean => {
    const m = mascotaDe(id);
    return m !== undefined && mascotaEnMemorial(m.estado_vida);
  };

  const filasReco: FilaReco_[] = (() => {
    /* ⚠️ Este `esMemorial` es el del TEMA, y **en el Hogar es el instrumento
       equivocado**: acá conviven las vivas y las que ya no están, así que un
       guard de PANTALLA no puede decidir. Se conserva porque la galería sí
       monta el sub-tema, pero el que rige es el filtro por MASCOTA de abajo. */
    if (esMemorial) return [];
    const ahora = Date.now();
    const filas: FilaReco_[] = [
      /* ═══ ⭐ LA SEÑAL DE QUE ESTÁS SIN SEÑAL — `D-1057`, firma del founder ══
         **Va PRIMERA, y eso es la mitad ③ de la firma.** *«No se puede
         descartar, porque cerrarla es apagar la única señal de que estás sin
         señal»* — y quedar detrás del «Ver N más» es descartarla por otra vía:
         con doce pedidos en vuelo, una fila colapsada no existe para nadie.
         Presidir es lo que la vuelve indescartable de verdad.

         🔴 **Y NO APARECE SI NO QUEDA NINGUNA MASCOTA ACTIVA** (④). La ley de
         la casa —*en memorial la app no le pide nada a esa familia*— no tiene
         excepción, ni siquiera para esto.
         ⚠️ **La condición es «ninguna activa», no «alguna en memorial», y lo
         declaro por si la mesa lo lee distinto:** el indicador es del HOGAR y
         no de una mascota, así que apagarlo porque UNA falleció dejaría sin
         señal a una familia que todavía tiene otras vivas y sus citas. *La casa
         ya contestó esta misma pregunta en `focoNexo`, que devuelve `'ninguna'`
         con `activas.length === 0` — se copia al vecino en vez de inventar.*
         ⚠️ Y **no se cuelga de `theme.mode`**: ése es el guard que `D-1021`
         midió apagado. La señal real es `estado_vida`, vía `enMemoriaDe`. */
      ...(sinAvisos && Array.isArray(mascotas) && mascotas.some((m) => !enMemoriaDe(m.id))
        ? [
            {
              key: 'sin-avisos',
              mascotaId: null,
              capa: 'identidad',
              icono: 'campana',
              titulo: t('hogar.sinAvisosTitulo'),
              detalle: t('hogar.sinAvisosDetalle'),
              onPress: abrirAjustesDelSistema,
            } satisfies FilaReco_,
          ]
        : []),
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
            /* 🔴 **ACÁ VIAJABA UN NÚMERO CRUDO A UNA FRASE QUE LE PONÍA EL `$`
               ADELANTE, y `verify:moneda` NO LO VEÍA:** su discriminador busca
               las dos formas de formatear a mano —el redondeo a dos decimales
               y la plantilla con el símbolo pegado— y esto no era ninguna de
               las dos: el símbolo vivía en el DICCIONARIO y el número llegaba
               crudo desde el código. ⇒ un
               presupuesto de 45 se leía **«$45»**, sin decimales y sin miles,
               en la primera fila del Hogar. *La fuga no estaba en el código:
               estaba repartida entre el código y el diccionario, que es
               justamente donde ningún grep de una sola cara la encuentra.*
               Censadas las cuatro llaves con `$` pegado a un placeholder: ésta
               era la única con consumidor. Las otras tres (`cuandoDesde`,
               `cuandoPrecio`, `tamanoEstadiasDesde`) están MUERTAS —cero
               consumidores, medido— y se les saca el `$` igual: *una llave
               muerta con el patrón viejo adentro enseña el patrón viejo al
               primero que la estrene.* */
            total: formatearPrecio(p.total),
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
      /* 🔴 EL PEDIDO EN VUELO — UNA SOLA FILA, Y EL COLAPSO ES LETRA
         FIRMADA, NO ECONOMÍA DE ESPACIO.
         `DISEÑO_EXPERIENCIA` §10ter.1: *«el eje de Ponte al día no es el
         TIEMPO, es ACCIÓN vs INFORMACIÓN — lo que espera acción preside y
         **no colapsa** (colapsar acciones esconde trabajo pendiente); el
         colapso rige sobre lo informativo»*. **Un pedido en vuelo no
         espera nada del dueño: es información** ⇒ colapsa.
         *Y el número dice por qué importa: la cuenta del gate tiene **12
         pedidos en vuelo hoy** (10 preparando + 2 en camino). Sin colapso,
         Ponte al día se convierte en una lista de pedidos y las vacunas y
         las citas quedan detrás del «Ver 12 más».*

         **DÓNDE VA, declarado como reversible:** después de los tres
         grupos que esperan ACCIÓN (autorizaciones, presupuestos, citas por
         coordinar) y antes de la alerta de vacuna. *Una entrega de hoy
         tiene hora; un refuerzo de vacuna tiene semanas.* Es una posición
         en un array — el gate la mueve con una línea. */
      ...(() => {
        if (pedidosEnVuelo.length === 0) return [];
        /* La NARRATIVA MÁS AVANZADA preside — lo que sigue primero (Ley 7).
           El orden es explícito y no alfabético ni de catálogo: si mañana
           nace una narrativa nueva, cae en `0` y **no se cuela adelante**. */
        const rango = (n: PedidoEnLista['narrativa']) =>
          n === 'en_camino' ? 3 : n === 'preparando' ? 2 : n === 'confirmado' ? 1 : 0;
        const preside = [...pedidosEnVuelo].sort((a, b) => {
          const d = rango(b.narrativa) - rango(a.narrativa);
          if (d !== 0) return d;
          // Empate: la promesa más próxima. Sin promesa va al final — un
          // nulo no puede ordenar como si fuera «pronto» (L-139).
          if (a.promesa_desde === null) return 1;
          if (b.promesa_desde === null) return -1;
          return a.promesa_desde < b.promesa_desde ? -1 : 1;
        })[0];
        const varios = pedidosEnVuelo.length > 1;
        return [
          {
            key: 'pedidos-en-vuelo',
            // 🔴 SIN MASCOTA, y es correcto: un pedido es de la FAMILIA y
            // sus ítems pueden ir a varias mascotas o a ninguna. Cae en el
            // precedente ya firmado de la fila `cita-`: **existe en la
            // lista y no cuenta como pendiente**, porque «N por resolver»
            // no puede incluir algo que no se resuelve. El cotejo __DEV__
            // de abajo filtra por `mascotaId === m.id`, así que un `null`
            // queda fuera de todas las cuentas por construcción.
            mascotaId: null,
            capa: 'cuidado',
            icono: 'despensa',
            titulo: varios
              ? t('hogar.recoPedidosVarios', { n: pedidosEnVuelo.length })
              : t(
                  preside.narrativa === 'en_camino'
                    ? 'hogar.recoPedidoEnCamino'
                    : preside.narrativa === 'preparando'
                      ? 'hogar.recoPedidoPreparando'
                      : 'hogar.recoPedidoConfirmado',
                ),
            // La ventana prometida, si la hay. Acá SÍ es honesta —a
            // diferencia de en `pagando`— porque estas tres narrativas ya
            // tienen el pago confirmado.
            /* 🔴 S100d · LA VENTANA QUE YA PASÓ, TAMBIÉN ACÁ — y esta
               superficie casi se queda muda. El encargo nombraba tres
               (lista, detalle y EN CAMINO) y **el Hogar es la CUARTA que
               muestra la ventana**: es la primera fila de «Ponte al día»,
               o sea **la que más se ve de las cuatro**.
               *Un pedido que dice que tarda en tres pantallas y calla en la
               primera es exactamente el defecto que la firma quería evitar
               — y lo encontré mirando el aparato, no leyendo el encargo.* */
            detalle:
              preside.promesa_desde !== null && preside.promesa_hasta !== null
                ? [
                    t('despensa.promesaCorta', {
                      /* 🔴 `D-881` · **DÍA CORTO ACÁ Y SOLO ACÁ.** El detalle
                         de `FilaReco` es `numberOfLines={1}` **por diseño** —
                         una lista donde cada fila crece a su antojo deja de
                         ser lista—, así que la cura no es dejarlo respirar:
                         **es que entre.**

                         *«20 de agosto, 2:00 p.m.–6:00 p.m.»* no entra, y el
                         founder lo vio cortado a *«…6:00 p. …»*. **Y esta fila
                         es la más apretada de las tres que montan
                         `promesaCorta`:** paga una placa de 42, un chevron y
                         un título de hasta dos líneas.

                         ⚠️ **Por eso se cambia el ARGUMENTO y no la voz.**
                         `promesaCorta` la usan también la lista de pedidos y
                         el detalle, **que tienen el ancho entero y no
                         reportaron el defecto** — *acortarles el día a los
                         tres sería curar dos superficies que nadie midió.* */
                      dia: `${diaSemanaCorto(preside.promesa_desde, idioma)} ${Number(preside.promesa_desde.slice(8, 10))}`,
                      desde: horaLocal(preside.promesa_desde),
                      hasta: horaLocal(preside.promesa_hasta),
                    }),
                    ventanaVencida(preside.promesa_hasta, preside.narrativa) ? t('despensa.ventanaTardando') : null,
                  ]
                    .filter((x): x is string => x !== null)
                    .join(' · ')
                : null,
            onPress: () =>
              varios
                ? router.push('/pedidos')
                : preside.narrativa === 'en_camino'
                  ? router.push({
                      pathname: '/pedidos/en-camino/[pedidoId]',
                      params: { pedidoId: preside.pedido_id },
                    })
                  : router.push({
                      pathname: '/pedidos/pedido/[pedidoId]',
                      params: { pedidoId: preside.pedido_id },
                    }),
          } satisfies FilaReco_,
        ];
      })(),
      // la alerta de vacuna (era la voz pideAtencion de la ficha)
      ...mascotas.flatMap((m): FilaReco_[] => {
        // 🔴 LA COMPOSICIÓN TAMBIÉN RIGE ACÁ (reincidencia del gate): un
        // acuario no se vacuna. Antes esta pantalla no miraba `sujeto` ni una
        // vez — medido: cero referencias — y por eso «Ponte al día» le pedía
        // el carnet. La pieza es la MISMA que compone el perfil.
        if (!composicionDe(m.sujeto).vacunas) return [];
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
            /* 🔴 **`D-1096` · LA PRIMERA FILA DEL HOGAR DECÍA «15 sept 2026 ·
               01:00».** Fecha mono con año + la hora cruda de la columna
               `time`, y `detalleMono` encima. La firma pide «sáb 13 sep · 3:00
               p. m.» y **el año sobra**: la cita que la familia tiene enfrente
               es de este año, y el día de semana informa mucho más —decide por
               «es sábado», no por «es el 13»—.
               ⚠️ **`detalleMono` se apaga acá y no se borra la prop**: sigue
               viva para lo que SÍ es voz de máquina (Ley 3). *Lo que cambió no
               es la prop: es que una cita no es metadata.* */
            detalle: fechaYHoraHumana(pc.fecha, pc.hora ?? null, idioma),
            onPress: () => router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: m.id, nombre: m.nombre } }),
          },
        ];
      }),
      // r6-2: el carnet vacío (era la acción de la ficha conociéndolo)
      ...mascotas.flatMap((m): FilaReco_[] => {
        // 🔴 LA FILA QUE EL FOUNDER VIO: «cargá el carnet» de un ACUARIO.
        if (!composicionDe(m.sujeto).vacunas) return [];
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
    /* 🔴 **NINGUNA RECOMENDACIÓN HABLA DE QUIEN YA NO ESTÁ** (`D-1021`). Va acá,
       al final y una sola vez, y no como cinco guards repartidos en las cinco
       fuentes (solicitudes · presupuestos · citas · vacunas · carnet): *un
       filtro que hay que acordarse de repetir se olvida en la sexta.* Cada fila
       ya declara de quién habla en `mascotaId`, así que el dato para callarla
       estaba y nadie lo miraba — el mismo hallazgo que la primera mitad. */
    return filas.filter((f) => f.mascotaId === null || !enMemoriaDe(f.mascotaId));
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
      // Las dos derivadas de vacuna se apagan con la MISMA pieza que apaga sus
      // filas: si la fila no existe, contarla dejaría un pendiente inhallable.
      tieneAlertaDeVacuna:
        composicionDe(mascotaDe(id)?.sujeto).vacunas &&
        voz !== null &&
        voz.voz === 'pideAtencion' &&
        voz.causa !== 'emergencia',
      sinNingunaVacuna:
        composicionDe(mascotaDe(id)?.sujeto).vacunas && s !== undefined && s.vacunas_total === 0,
      enMemoria: enMemoriaDe(id),
    };
  };
  /** 🔴 **`D-1026` · ESTA LETRA SE ENMIENDA, Y LA RAZÓN VIEJA NO ERA MALA.**
   *  Decía: *«el apagado de MEMORIAL vive acá y no en la lib: la lib es dato
   *  puro y memorial es un modo de la casa»*. Correcto mientras memorial fuera
   *  el TEMA — pero ese `esMemorial` es justo el que **nadie enciende**
   *  (`D-1021`), así que el globo de la tira siguió diciendo «1» sobre quien ya
   *  no está. Con `D-1021` memorial dejó de ser un modo de la casa y pasó a ser
   *  **un hecho de la mascota** (`estado_vida`) — y un hecho de la mascota SÍ
   *  es dato puro, así que ahora le corresponde a la lib.
   *  El `esMemorial` del tema se conserva (la galería lo monta) pero ya no es
   *  el que rige: rige `enMemoria`, adentro. */
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
      {/* ⭐ **LA ESTRUCTURA DE LA CASA — S116-C lote 3b · `D-1106`.** El techo
          propio del Hogar MURIÓ. Era el que el censo de B nombraba con su
          propio comentario al lado —*«HeroMarca no tiene slots para
          fecha-antes-del-saludo ni para la fila de mascotas: se compone local
          COPIANDO NIVEL de la primitiva»*— y hoy los slots existen: el ciruela
          es **el fondo** de la pantalla, el contenido vive en una hoja de
          lienzo que desliza encima (`HojaContenido`) y la banda la pinta
          `Cabecera` en `presentacion="fondo"`.

          CÓMO SE REPARTIÓ EL TECHO VIEJO, pieza por pieza:
          · **la fecha** → `antetitulo` · **el saludo** → `titulo` (que trae su
            `accessibilityRole="header"` de fábrica, el que el `<Text>` local
            ponía a mano) · **la fila de mascotas** → el slot `contenido`, que
            nació para ella · **la campana y el carrito** → las props `avisos`
            y `carrito`, que nacieron para estos dos discos exactos.

          ☠️ **Y mueren tres cosas de la copia:**
          · **`FilaCampanaTecho`** entera — los dos discos son props. Con ella
            se va **el isotipo del techo**, y no por descuido: el lote 10 firmó
            que las cabeceras raíz del cliente no llevan isotipo, y es la misma
            razón por la que en este lote murió el `isotipo="gradiente"` de la
            Despensa.
          · **la rama de memorial** — el techo local pintaba `bg.card` con el
            texto en tinta; el degradado del tema ya resuelve memorial plano
            (`#26062E`, ciruela noche), así que la banda es oscura en los tres
            temas y el texto va `onGradient` en los tres. *Una rama por tema
            menos es una rama menos que puede divergir.*
          · **la luz de la esquina** — adorno de una banda propia; la banda de
            la casa tiene el suyo.

          🔴 **LO QUE ESTE MOVIMIENTO CUESTA, MEDIDO Y DECLARADO: la fecha
          cambia de voz.** Vivía en mono minúsculas (Ley 3, *«la fecha en mono
          SOBRE el saludo»*); `antetitulo` es sans **bold 11 en mayúsculas con
          tracking 2** —lo dice su escala en `typography`—, así que va a leerse
          «JUEVES 23 DE JULIO». **Es el único slot que la pieza tiene encima del
          título**, y las dos alternativas eran peores: bajar la fecha a `apoyo`
          invierte el orden que la lámina fijó, y meterla en `contenido` obliga
          a un `titulo=""` —un header vacío para el lector de pantalla— con el
          saludo dibujado a mano abajo. *Uso el slot y reporto lo que cuesta;
          si la mesa quiere el mono de vuelta, es una prop de B —un antetítulo
          con registro de dato— y no un `<Text>` local acá.* Nota en el buzón.

          ⚠️ **`AIRE_RAIZ` SIN `insets.bottom`, a propósito (R53):** la hoja ya
          paga `insets.bottom + spacing[6]` en su propio render. Sumarlo acá lo
          pagaría dos veces. */}
      <HojaContenido
        arranque={cabecera.arranque}
        scroll={{ contentContainerStyle: { paddingBottom: AIRE_RAIZ } }}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="raiz"
              presentacion="fondo"
              antetitulo={fechaConDiaMono(hoy, idioma)}
              titulo={`${saludoPorFranja(hoy.getHours(), t)}${nombrePerfil ? `, ${nombrePerfil.trim().split(' ')[0]}` : ''}`}
              carrito={{
                cantidad: unidadesEnCarrito(carrito),
                onPress: () => router.push('/despensa/carrito'),
                etiqueta: t('despensa.abrirCarrito', { count: unidadesEnCarrito(carrito) }),
              }}
              avisos={{
                cantidad: noLeidos,
                onPress: () => router.push('/avisos'),
                /* Con 0 la voz es sólo «Avisos»: *un «0 sin leer» es ruido con
                   forma de dato* — la misma regla que el disco ya aplica al no
                   dibujar el número. */
                etiqueta: noLeidos > 0 ? t('avisos.abrirConNoLeidos', { count: noLeidos }) : t('avisos.titulo'),
              }}
              contenido={
                  /* r4-1: LAS MASCOTAS EN EL HEADER — squircle 112/36 (32%,
                     S61-A10), punto de estado 26 con aro de papel 4, nombre
                     debajo; fila horizontal + el "+" de 72 (→ agregar). */
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: spacing[4], alignItems: 'flex-start', paddingTop: spacing[5] }}
                  >
                    {mascotas.map((m) => {
                      /* Mismo criterio que `vozDe`: sin punto de estado para quien
                         ya no está. *Dos lugares que dibujan el mismo hecho tienen
                         que callarse por la misma razón.* */
                      const enMemoria = mascotaEnMemorial(m.estado_vida);
                      const s = enMemoria ? undefined : senalesPorMascota.get(m.id);
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
                                  <Huella color={theme.text.onGradient} escala={0.9} x={1.2} y={1.2} />
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
                                    borderRadius: radius.full,
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
                              color: theme.text.onGradient,
                            }}
                          >
                            {m.nombre}
                          </Text>
                          {/* ⭐ **LA VACUNA QUE VENCE ANTES** (1.1 · C7) — bajo el
                              nombre, y **sólo si la hay**: sin próxima registrada
                              no se dibuja nada. *Una línea que dice «sin datos»
                              bajo cada nombre convierte la tira en un tablero de
                              faltantes.* La señal ya trae `proxima_vacuna` con su
                              nombre y su fecha; no hace falta pedir nada.
                              🔴 **La plaga vencida NO ESTÁ**: la señal del Hogar
                              no trae desparasitaciones (medido en
                              `hogar.ts:14-24`), y el perfil —que sí las tiene— es
                              un viaje POR MASCOTA. Pedido a A, con su medición. */}
                          {(() => {
                            if (enMemoriaDe(m.id)) return null;
                            const sen = senalesPorMascota.get(m.id);
                            const pv = sen?.proxima_vacuna ?? null;
                            const pd = sen?.proxima_desparasitacion ?? null;
                            /* 🔴 **`null` NO ES «al día»**: quiere decir que ninguna
                               fila declaró próxima (letra de A). *Dibujar «al día»
                               sobre un silencio es afirmar lo que nadie midió*, así
                               que sin dato no se dibuja la línea. */
                            if (pv === null && pd === null) return null;
                            const partes = [
                              pv !== null
                                ? t('hogar.proximaVacunaCorta', { nombre: pv.nombre, fecha: fechaCortaMono(pv.fecha.slice(0, 10), idioma) })
                                : null,
                              pd !== null
                                ? t('hogar.proximaPlagaCorta', { plaga: pd.plaga, fecha: fechaCortaMono(pd.fecha.slice(0, 10), idioma) })
                                : null,
                            ].filter((x): x is string => x !== null);
                            return (
                              <Text
                                numberOfLines={1}
                                style={{
                                  fontFamily: typography.family.sans.regular,
                                  fontSize: typography.size.xs,
                                  color: theme.text.onGradient,
                                  opacity: 0.75,
                                  maxWidth: 104,
                                  textAlign: 'center',
                                }}
                              >
                                {partes.join(' · ')}
                              </Text>
                            );
                          })()}
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
                        borderRadius: radius.full,
                        backgroundColor: esMemorial ? theme.bg.overlay : 'rgba(255,255,255,0.17)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: spacing[5],
                      }}
                    >
                      <Svg width={28} height={28} viewBox="0 0 24 24">
                        <Path d="M12 5v14M5 12h14" stroke={theme.text.onGradient} strokeWidth={1.9} strokeLinecap="round" fill="none" />
                      </Svg>
                    </Pressable>
                  </ScrollView>
              }
            />
          </View>
        }
      >
      {/* ⭐ **LA BÚSQUEDA VIVE EN EL ORBE** (firma del founder, 2.2.3 · ①).
          Acá había una caja de texto y **no se entendía que era un buscador**:
          un campo sin rótulo en medio del Hogar se lee como cualquier otra
          cosa. *Y su lugar natural es el orbe de Nexo, que ya está en toda la
          app y cuya Hoja ya busca* — dos cajas para lo mismo eran dos.

          Lo que queda es **una entrada discreta que dice qué hace** y lleva
          allá.

          ⭐ **Y ya tiene su glifo.** Esta entrada nació sin uno: la lupa **no
          existía en el registry** —medido: `explorar` es una BRÚJULA (círculo +
          aguja)— y *un glifo que significa otra cosa es peor que ninguno:
          enseña mal el vocabulario y después hay que desenseñarlo.* Se pidió a
          B por §6b y llegó en `cb3e34c9`. **La entrada estuvo una tanda sin
          glifo a propósito**, que es lo que la hizo pedible. */}
      {/* 🔴 **LA ENTRADA TOMA EL SOLAPE** (ojo del founder: *«quedó tapada,
          se ve asomar Buscar en tu famili… detrás de Ponte al día»*).
          Reproducido en el emulador: la entrada quedaba **entre el techo y una
          tarjeta que sube `-SOLAPE_RECO` para pegarse a la banda**, así que la
          tarjeta se le montaba encima. *No era un margen chico: era que otra
          pieza sube a propósito y nadie le avisó que ahora hay algo abajo.*
          ⏪ La primera cura la subió `-SOLAPE_RECO` para que se montara sobre
          la banda, y **quedó a caballo del borde**: mitad sobre el degradado,
          mitad sobre el papel, con su fondo cortado por la curva del techo.
          *Una pieza que cruza el borde no está «entre dos zonas»: está rota en
          las dos.*

          🔴 **DECISIÓN: abajo, sobre el papel, con su aire.** La alternativa
          —adentro del techo, translúcida— exige un tratamiento de color sobre
          un degradado que va de magenta a teal, y **eso es diseño, no
          composición**: su contraste cambia a lo largo del propio techo.
          Acá abajo la celda es la misma que el resto de la casa y se lee igual
          en los dos temas. *Reversible: si el rediseño la quiere adentro, la
          sube con su tratamiento.* */}
      <View style={{ paddingHorizontal: spacing[4], marginTop: spacing[5] }}>
        <CeldaNavegacion
          icono="lupa"
          titulo={t('busqueda.entrada')}
          registro="tinta"
          /* 🔴 **BUSCA, no conversa** (corrección de la mesa). Abría el chat
             de Nexo: *un control que promete un acto y hace otro no es un
             atajo, es una promesa incumplida.* */
          onPress={() => router.push('/buscar')}
        />
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
        /* ⏪ Subía `-SOLAPE_RECO` para pegarse a la banda del techo. **Ese
           lugar es ahora de la entrada de búsqueda**, y esta tarjeta baja con
           su aire: dos piezas no pueden ocupar el mismo solape. */
        return (
          <View style={{ paddingHorizontal: spacing[4], marginTop: spacing[4], zIndex: 2 }}>
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
      {/* ═══ G4 · LA GUARDERÍA, CON SU ETAPA ═══════════════════════════════

          Va ANTES de los paseos y groomings a propósito: **la guardería dura
          todo el día**, así que si hay una viva es lo más vivo que tiene esa
          familia hoy. No compite por el hero — se suma a él (Ley 7 sigue
          intacta: cada celda envuelve algo que está pasando de verdad).

          🔴 **La etapa la dice el SERVIDOR, no una cuenta de esta pantalla.**
          `estadoEstadia` ya trae los tres momentos; deducirlos acá de
          `aBordoEn`/`llegadaEn`/`entregadaEn` sería un espejo de la máquina de
          estados del motor, *y un espejo diverge en silencio* — el día que el
          motor cambie una transición, la casa sigue con la vieja y nada da
          rojo. Es el defecto que el propio wrapper del tramo declara en su
          cabecera. ── */}
      {estadiasVivas.length > 0 ? (
        <Animated.View
          entering={entradaZona(0)}
          style={{ paddingHorizontal: spacing[4], paddingTop: spacing[5], gap: spacing[4] }}
        >
          {estadiasVivas.map((e) => (
            <CitaEnVivo key={e.citaId} capa="cuidado">
              <Celda
                interactiva
                accessibilityRole="button"
                /* Sin `estadiaId` **no hay a dónde llevar**, así que esas filas
                   no entran a esta lista: el filtro lo exige con un predicado
                   de tipo y acá ya está garantizado. *Preferí que el tipo lo
                   sostenga a poner un `as` y confiar en que el filtro de arriba
                   nunca cambie.* (Y es implicación del motor, no una defensa
                   inventada: si hay `estadoEstadia`, hay fila de estadía.) */
                onPress={() =>
                  router.push({
                    pathname: '/guarderia/[estadiaId]',
                    params: { estadiaId: e.estadiaId },
                  })
                }
                titulo={e.mascotaNombre}
                subtitulo={t(
                  e.estadoEstadia === 'recogida_en_curso'
                    ? 'hogar.guarderiaABordo'
                    : e.estadoEstadia === 'en_guarderia'
                      ? 'hogar.guarderiaAdentro'
                      : 'hogar.guarderiaDeVuelta',
                  { lugar: e.prestadorNombre },
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

      {/* ── 🔴 S100d · ¿COMPRASTE EN EL LOCAL? — Y ACÁ NO ES UNA CELDA MÁS:
          ES UN CANAL DE ADQUISICIÓN. ─────────────────────────────────────
          Firma del founder: *«vincula una compra física al expediente, pero
          más allá de eso ES UN MECANISMO PARA TRAER LOS USUARIOS QUE MIS
          PRESTADORES ATIENDEN EN SU LOCAL»*.

          **Por qué se muda al Hogar, medido:** vivía **al fondo del scroll de
          la Despensa, detrás de hasta 50 productos** (medición de C) ⇒ como
          canal **casi no existía**. Y peor: **el cliente nuevo NO TIENE tab
          de Pedidos**, así que su única puerta estaba **detrás de la
          condición que él todavía no cumple**. *Una puerta de entrada que
          exige haber entrado no es una puerta de entrada.*

          🔴 **LA DOSIS ES LA FIRMA, y por eso son dos formas y no una:**
          **sin pedidos preside** —es su única puerta y es descubrimiento—;
          **con pedidos baja a celda discreta** pero **no desaparece**: quien
          compra en el local todos los meses vuelve a vincular. *El error
          sería tratarlo como onboarding —que se muestra una vez y se va— o
          como acceso fijo —que grita para siempre.*

          Y la secuencia que esto habilita es la que el founder quiere:
          **vincula desde el Hogar → eso crea su primer pedido → NACE EL TAB →
          lo descubre.** *El tab aparece como consecuencia de haber hecho
          algo, no como promesa vacía.*

          ⚠️ **Las voces son de C** (`despensa.reclamoEntrada*`) y se
          **importan, no se copian**: dos copias del mismo texto divergen
          siempre. Su puerta de la Despensa **sale por firma del founder** —
          la Despensa es donde se compra ONLINE y el reclamo es para quien
          compró OFFLINE: era el lugar equivocado por concepto, no solo por
          posición. */}
      {hayPedidos === null ? null : hayPedidos ? (
        <View style={{ paddingHorizontal: spacing[4], marginTop: spacing[6] }}>
          <CeldaNavegacion
            icono="despensa"
            titulo={t('despensa.reclamoEntrada')}
            onPress={() => router.push('/despensa/reclamo')}
          />
        </View>
      ) : (
        <View style={{ paddingHorizontal: spacing[4], marginTop: spacing[6] }}>
          <Tarjeta relleno="amplio">
            <View style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{t('despensa.reclamoEntrada')}</Texto>
              <Texto variante="apoyo">{t('despensa.reclamoEntradaDetalle')}</Texto>
              {/* 🔴 ERA `acento` — enmienda a F-OCRE, firma del founder del
                  18-ago-2026 (H-207). **`acento` es LETRA oro sin relleno**, y
                  el oro como tinta no llega en superficie clara:
                  **1,70 sobre esta carta blanca**, contra un piso de 4,5.
                  `primario` es el MISMO oro del otro lado del par —relleno
                  ocre, letra tinta— y da **9,96**.

                  ⚠️ **Pesa doble acá: es la pantalla de ENTRADA**, o sea
                  probablemente el primer ocre que ve una familia. */}
              <Boton
                variante="primario"
                etiqueta={t('despensa.reclamoCta')}
                onPress={() => router.push('/despensa/reclamo')}
              />
            </View>
          </Tarjeta>
        </View>
      )}

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
        const rg = resumenServicios.guarderia;

        const datoPaseo =
          rp.proxima !== null
            /* `D-1096` · el rail decía «14 sept 2026» y **salía cortado**
               —«14 sept 20…»— en un cuadrado de tres por fila. La forma corta
               del riel entra entera Y habla la voz de la familia: el ancho
               dejó de ser un problema porque el año no estaba informando. */
            ? fechaCortaHumana(rp.proxima.fecha, idioma)
            : rp.salidas_saldo > 0
              ? rp.salidas_saldo === 1
                ? t('hogar.railSaldoUna')
                : t('hogar.railSaldo', { n: rp.salidas_saldo })
              : null; // plan-solo: los días no caben en la forma — sin dato

        type Cuadrado = {
          key: string;
          icono: 'paseo' | 'grooming' | 'training' | 'veterinaria' | 'guarderia';
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
                ? fechaCortaHumana(re.proxima.fecha, idioma)
                : esReciente(re.ultima_cerrada) && re.ultima_cerrada !== null
                  ? fechaCortaHumana(re.ultima_cerrada, idioma)
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
                ? fechaCortaHumana(ra.proxima.fecha, idioma)
                : esReciente(ra.ultima_cerrada) && ra.ultima_cerrada !== null
                  ? fechaCortaHumana(ra.ultima_cerrada, idioma)
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
                ? fechaCortaHumana(rv.proxima.fecha, idioma)
                : esReciente(rv.ultima_cerrada) && rv.ultima_cerrada !== null
                  ? fechaCortaHumana(rv.ultima_cerrada, idioma)
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
          {
            /* ⭐ S107-C · LA QUINTA — **A publicó su rama del resumen y no
               tenía consumidor.** Medido con sesión real el 29-ago: el rail
               pintaba CUATRO y guardería no estaba, así que una familia que ya
               la usó **la buscaba donde viven sus hermanas y no la
               encontraba**. *Es «motor sin puerta» del lado de la superficie:
               el dato llegaba y nadie lo leía.* */
            key: 'guarderia',
            icono: 'guarderia',
            nombre: t('hogar.railGuarderia'),
            /* 🔴 `en_curso` NO tiene forma de fecha, y por eso no va en `dato`:
               *un día que ya empezó no se anuncia como «próximo»*. Su lugar es
               la ACTIVIDAD, que es lo que enciende la celda. */
            dato:
              rg.proxima !== null
                ? fechaCortaHumana(rg.proxima.fecha, idioma)
                : esReciente(rg.ultima_cerrada) && rg.ultima_cerrada !== null
                  ? fechaCortaHumana(rg.ultima_cerrada, idioma)
                  : null,
            actividad: rg.proxima !== null || rg.en_curso || esReciente(rg.ultima_cerrada),
            fechaProxima: rg.proxima?.fecha ?? null,
            /* En movimiento AHORA cuenta como hoy: es lo más vivo del rail. */
            recencia: rg.en_curso ? hoyIso : rg.ultima_cerrada,
            onPress: () => router.push('/hogar/guarderia'),
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
                              /* S113-A · sólo el recuerdo trae foto propia: el
                                 resto de los hechos usa `fotos_count`. */
                              foto={it.foto_path !== null ? (fotosRecuerdo.get(it.foto_path) ?? null) : null}
                              meta={metaHecho(it, idioma)}
                              /* §7 · LA MARCA DEL EXPEDIENTE. El wrapper trae
                                 el CÓDIGO DEL MOTOR (`'telemedicina'`) y la
                                 pieza habla su propio vocabulario
                                 (`'teleconsulta'`): la traducción es de la
                                 pantalla (Ley 3), y por eso el mapeo vive acá
                                 y no en el lector.
                                 `null` NO se degrada a «presencial»: una cita
                                 sin modalidad escrita no dice nada — decirlo
                                 sería inventar un hecho clínico. */
                              /* ⭐ **H4 (S112-C) · LAS CONDUCTAS DE LA BITÁCORA
                                 ENTRAN POR ACÁ.** Hasta hoy la anotación se leía
                                 con su voz correcta —«El cuidador anotó cómo
                                 estuvo»— **y sus conductas no se veían**: el dato
                                 llegaba (`ItemTimeline.chips`, A) y no había dónde
                                 ponerlo. *La misma anotación se mostraba COMPLETA
                                 en la ficha del durante e INCOMPLETA acá* — la
                                 clase que esta sesión curó en el chat, donde la
                                 misma conversación se comportaba distinto según
                                 qué punta la mirara.

                                 ⚠️ **B expuso `etiquetas` en `LineaDeVidaItem`, y
                                 esta pantalla NO usa esa ruta**: compone a mano con
                                 `EventoVida`. Así que entran por `marca`, con **su
                                 receta exacta** —`Insignia capa="cuidado"
                                 tamaño="sm"` en fila que envuelve— *para que las
                                 mismas conductas no se vean de dos formas según la
                                 pantalla, que es justo lo que se vino a cerrar.*

                                 Van PRIMERO y son excluyentes con la teleconsulta:
                                 un evento de bitácora no es una cita, así que las
                                 dos ramas nunca compiten por el mismo evento —
                                 el orden lo dice, no lo supone. */
                              marca={
                                it.chips.length > 0 ? (
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      flexWrap: 'wrap',
                                      gap: spacing[2],
                                      marginTop: spacing[1],
                                    }}
                                  >
                                    {etiquetasDeChips(it.chips, idioma).map((e) => (
                                      <Insignia key={e} capa="cuidado" etiqueta={e} tamaño="sm" />
                                    ))}
                                  </View>
                                ) : it.modalidad === 'telemedicina' ? (
                                  <View style={{ alignSelf: 'flex-start', marginTop: spacing[1] }}>
                                    <Insignia modalidad="teleconsulta" tamaño="sm" />
                                  </View>
                                ) : undefined
                              }
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

      </HojaContenido>
      {/* 🔴 **EL AGUA VA DESPUÉS DE LA HOJA, Y ES LA CURA DE HABERLA METIDO
          ADENTRO (S116-C lote 3b).** Su propia lámina la manda **FIJA**
          —*«centrada en pantalla, no scrollea: el agua vive fuera del
          cuerpo»*—, y al mudarla dentro de `HojaContenido` pasó a ser un hijo
          del scroll: **se iba con el contenido**. Tampoco puede ir ANTES, que
          es donde vivía: `HojaContenido` pinta su degradado en absoluto sobre
          todo el alto y la hoja es opaca, así que ahí quedaba tapada entera.
          ⇒ hermana posterior, `pointerEvents="none"`: se queda quieta, no toma
          ningún toque, y sobre el ciruela su tinta al 4-6 % es imperceptible
          —que es lo correcto: el agua es del papel—. */}
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
    </View>
  );
}
