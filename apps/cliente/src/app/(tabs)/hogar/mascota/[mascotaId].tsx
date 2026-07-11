/**
 * PERFIL DE MASCOTA — pila de módulos, no monolito (S51-B2.3, sobre
 * DISEÑO_EXPERIENCIA §4): header de identidad (AvatarMascota + nombre
 * + momento vital EN VOZ — Ley 3: M1..M7 jamás visibles) y debajo la
 * pila:
 *   1. Su vida — LineaDeVida propia (paginada).
 *   2. Salud — el carnet vivo (vacunas reales de S47-48).
 *   3. VITALES (S53-B2c) — lo REAL de sus paseos (km/min/salidas de
 *      los tracks) + los índices EDUCATIVOS en despliegue progresivo
 *      (guijarros §4; honestos-vacíos, la Hoja educa y termina en una
 *      acción que alimenta el expediente). ═══ HUECO M-WEAR ═══ el día
 *      del collar, los índices se llenan — cero refactor (founder S50).
 *   4. Identidad — progresiva: SOLO lo cargado; lo que falta es una
 *      invitación digna, jamás un formulario ni datos fake.
 *
 * Módulo sin datos = EstadoVacio con voz (Ley 13: vacío confirmado).
 */

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  AvatarMascota,
  BarrasSemana,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Guijarro,
  Hoja,
  LineaDeVida,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
  type LineaDeVidaEstadoPie,
} from '@epetplace/ui';
import {
  leerTimelineMascota,
  obtenerPaseosConTrack,
  obtenerPerfilMascota,
  resolverUrlFoto,
  type ItemTimeline,
  type PerfilMascota,
} from '@epetplace/api';
import {
  calcularMomentoVital,
  calcularVitales,
  edadEnMeses,
  type MomentoVital,
  type VitalesPaseos,
} from '@epetplace/domain';

import { fechaCortaMono } from '@epetplace/i18n';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';

type TraductorPerfil = ReturnType<typeof useTraduccion>['t'];


function vozMomento(momento: MomentoVital, t: TraductorPerfil): string | null {
  switch (momento) {
    case 'M1': return t('perfil.momentoM1');
    case 'M2': return t('perfil.momentoM2');
    case 'M3': return t('perfil.momentoM3');
    case 'M4': return t('perfil.momentoM4');
    case 'M5': return t('perfil.momentoM5');
    case 'M6': return null; // memorial: el tema habla, el chip calla
  }
}

function vozEdad(meses: number, t: TraductorPerfil): string {
  if (meses < 12) return meses === 1 ? t('perfil.edadUnMes') : t('perfil.edadMeses', { meses });
  const anios = Math.floor(meses / 12);
  return anios === 1 ? t('perfil.edadUnAnio') : t('perfil.edadAnios', { anios });
}

// Motivos en trazo de los guijarros (§4: el motivo va ENCIMA del tinte).
const trazoMotivo = (color: string) => ({
  stroke: color,
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

function MotivoCorazon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M12 19.4C8 16.2 5 13.3 5 10.2c0-2.3 1.9-4 4-4 1.2 0 2.3.5 3 1.5.7-1 1.8-1.5 3-1.5 2.1 0 4 1.7 4 4 0 3.1-3 6-7 9.2Z"
        {...trazoMotivo(color)}
      />
    </Svg>
  );
}

function MotivoLuna({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M14.8 4.6a7.6 7.6 0 1 0 4.6 12.9 8.8 8.8 0 0 1-4.6-12.9Z" {...trazoMotivo(color)} />
    </Svg>
  );
}

// S52-P4b: título de módulo HUMANIZADO — DM Sans medium en sentence
// case (el eyebrow uppercase trackeado murió: leía como formulario).
function TituloModulo({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.md,
        color: theme.text.primary,
      }}
    >
      {texto}
    </Text>
  );
}

export default function PerfilDeMascota() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mascotaId } = useLocalSearchParams<{ mascotaId: string }>();

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  // Vitales (S53-B2c): paseos con track REAL → cálculo puro en domain.
  const [vitales, setVitales] = useState<VitalesPaseos | 'cargando' | 'error'>('cargando');
  const [indiceAbierto, setIndiceAbierto] = useState<'salud' | 'descanso' | null>(null);
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<ItemTimeline[] | null | 'error'>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [estadoPie, setEstadoPie] = useState<LineaDeVidaEstadoPie>('nada');
  const cargandoMasRef = useRef(false);

  const cargarPrimeraPagina = useCallback(async (id: string) => {
    const r = await leerTimelineMascota(id);
    if (!r.ok) {
      setItems('error');
      setEstadoPie('nada');
      return;
    }
    setItems(r.data.items);
    setCursor(r.data.siguiente_cursor);
    setEstadoPie(r.data.siguiente_cursor !== null ? 'mas' : 'nada');
  }, []);

  const cargarMas = useCallback(async () => {
    if (cargandoMasRef.current || typeof mascotaId !== 'string') return;
    if (cursor === null) {
      setEstadoPie('cargando');
      await cargarPrimeraPagina(mascotaId);
      return;
    }
    cargandoMasRef.current = true;
    setEstadoPie('cargando');
    const r = await leerTimelineMascota(mascotaId, { cursor });
    cargandoMasRef.current = false;
    if (!r.ok) {
      setEstadoPie('error');
      return;
    }
    setItems((prev) => [...(Array.isArray(prev) ? prev : []), ...r.data.items]);
    setCursor(r.data.siguiente_cursor);
    setEstadoPie(r.data.siguiente_cursor !== null ? 'mas' : 'nada');
  }, [cursor, mascotaId, cargarPrimeraPagina]);

  useFocusEffect(
    useCallback(() => {
      if (typeof mascotaId !== 'string') {
        router.replace('/hogar');
        return;
      }
      let vigente = true;
      void (async () => {
        const r = await obtenerPerfilMascota(mascotaId);
        if (!vigente) return;
        if (!r.ok) {
          setPerfil('error');
          return;
        }
        setPerfil(r.data);
        void obtenerPaseosConTrack(mascotaId).then((pv) => {
          if (vigente) setVitales(pv.ok ? calcularVitales(pv.data, new Date()) : 'error');
        });
        if (r.data.mascota.foto_url) {
          void resolverUrlFoto(r.data.mascota.foto_url).then((url) => {
            if (vigente) setFotoFirmada(url ?? undefined);
          });
        }
        void cargarPrimeraPagina(mascotaId);
      })();
      return () => {
        vigente = false;
      };
    }, [mascotaId, router, cargarPrimeraPagina]),
  );

  const alTocarNodo = (item: { atencion_id?: string | null; evento_id: string; tipo?: string }) => {
    if (item.atencion_id) {
      router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: item.atencion_id } });
    }
  };

  if (perfil === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
            <View style={{ alignItems: 'center', gap: spacing[3] }}>
              <Esqueleto forma="circulo" alto={96} />
              <Esqueleto forma="linea" ancho="40%" />
              <View style={{ height: spacing[6] }} />
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
            </View>
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (perfil === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('perfil.error')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setPerfil('cargando')} />}
          />
        </View>
      </View>
    );
  }

  const { mascota, vacunas, peso_clinico_kg, tiene_condicion_cronica, umbrales } = perfil;
  const hoy = new Date();
  const meses = mascota.fecha_nacimiento !== null ? edadEnMeses(mascota.fecha_nacimiento, hoy) : null;
  const momento =
    umbrales !== null
      ? calcularMomentoVital({
          edadMeses: meses,
          tieneCondicionCronica: tiene_condicion_cronica,
          esMemorial: mascota.estado_vida !== null && mascota.estado_vida !== 'activa',
          umbrales,
        })
      : null;
  const chipMomento = momento !== null ? vozMomento(momento, t) : null;

  // Identidad progresiva: SOLO lo cargado (L-139 — nada fake).
  const datosIdentidad: Array<{ etiqueta: string; valor: string; mono?: boolean }> = [];
  if (mascota.raza !== null && mascota.raza.length > 0) {
    datosIdentidad.push({ etiqueta: t('perfil.raza'), valor: mascota.raza });
  }
  if (mascota.sexo === 'macho' || mascota.sexo === 'hembra') {
    datosIdentidad.push({
      etiqueta: t('perfil.sexo'),
      valor: mascota.sexo === 'macho' ? t('perfil.sexoMacho') : t('perfil.sexoHembra'),
    });
  }
  if (mascota.fecha_nacimiento !== null) {
    datosIdentidad.push({ etiqueta: t('perfil.nacimiento'), valor: fechaCortaMono(mascota.fecha_nacimiento, idioma), mono: true });
  }
  if (peso_clinico_kg !== null) {
    datosIdentidad.push({ etiqueta: t('perfil.peso'), valor: `${peso_clinico_kg} kg`, mono: true });
  }
  if (mascota.microchip !== null && mascota.microchip.length > 0) {
    datosIdentidad.push({ etiqueta: t('perfil.microchip'), valor: mascota.microchip, mono: true });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: spacing[8], gap: spacing[6] }}>
        {/* ── Header de identidad ── */}
        <View style={{ alignItems: 'center', gap: spacing[2] }}>
          <AvatarMascota
            nombre={mascota.nombre}
            fotoUrl={fotoFirmada}
            especie={esEspecieUi(mascota.especie) ? mascota.especie : undefined}
            tamano="lg"
            capa="vida"
          />
          <Text
            accessibilityRole="header"
            style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['2xl'], color: theme.text.primary }}
          >
            {mascota.nombre}
          </Text>
          {/* S52-P4a: el momento vital es VOZ bajo el nombre, no chip
              de estado — habla como una persona que lo conoce. */}
          {chipMomento !== null || meses !== null ? (
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary }}>
              {[chipMomento, meses !== null ? vozEdad(meses, t) : null].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>

        {/* ── 1 · VITALES (S53-B2c.1: el estado antes que el log — §4 v1.3) ──
            ═══ HUECO M-WEAR: el día que la mascota tenga collar
            conectado, los ÍNDICES de abajo se llenan y el dashboard
            se expande (actividad/descanso/tendencias) — revelación
            progresiva, cero refactor (DISEÑO_EXPERIENCIA §4). ═══ */}
        <View style={{ gap: spacing[3] }}>
          <TituloModulo texto={t('perfil.vitales')} />

          {/* (a) LO REAL — los paseos de ESTA mascota, de sus tracks */}
          {vitales === 'cargando' ? (
            <EsqueletoGrupo>
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
            </EsqueletoGrupo>
          ) : vitales === 'error' || vitales.totalSalidas === 0 ? (
            // sin paseos: invitación serena — JAMÁS ceros (L-139)
            <EstadoVacio
              registro="seccion"
              titulo={t('perfil.bienestarVacio')}
              descripcion={t('perfil.bienestarVacioDetalle')}
            />
          ) : (
            <Tarjeta relleno="amplio">
              <View style={{ gap: spacing[4] }}>
                <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
                  {t('perfil.vitalesUltimos7')}
                </Text>
                {/* fila hero — MATIZ LEY 3 (S53): a escala display el
                    número viste DM Sans; el mono queda para metadata */}
                <View style={{ flexDirection: 'row', gap: spacing[6] }}>
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['3xl'] ?? 34, fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                      {vitales.km7d.toFixed(1)}
                      <Text style={{ fontSize: typography.size.md }}> km</Text>
                    </Text>
                    <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                      {t('perfil.vitalesKm')}
                    </Text>
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['3xl'] ?? 34, fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                      {vitales.min7d}
                      <Text style={{ fontSize: typography.size.md }}> min</Text>
                    </Text>
                    <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                      {t('perfil.vitalesMin')}
                    </Text>
                  </View>
                </View>
                {/* la tira de 7 días — SOLO datos reales: llenas las
                    salidas, base los días quietos (L-139 tal cual) */}
                <BarrasSemana
                  valores={vitales.kmPorDia}
                  capa="cuidado"
                  etiqueta={t('perfil.vitalesBarrasA11y', { n: vitales.kmPorDia.filter((v) => v > 0).length })}
                />
                {/* meta en mono chico — la voz de máquina en su escala */}
                <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                  {(vitales.salidas7d === 1
                    ? t('perfil.vitalesMetaUna', { fecha: vitales.ultimaSalida !== null ? fechaCortaMono(vitales.ultimaSalida, idioma) : '—' })
                    : t('perfil.vitalesMetaVarias', { n: vitales.salidas7d, fecha: vitales.ultimaSalida !== null ? fechaCortaMono(vitales.ultimaSalida, idioma) : '—' })
                  ).toLowerCase()}
                </Text>
                {vitales.caminoMasQueAnterior ? (
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                    {t('perfil.vitalesComparativa')}
                  </Text>
                ) : null}
              </View>
            </Tarjeta>
          )}

          {/* (b) LO EDUCATIVO — índices visibles, honestos-vacíos:
              guijarros (§4, PRIMER uso del lenguaje de ilustración;
              cada uno rotado distinto) + Hoja que educa al tap. */}
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <View style={{ flex: 1 }}>
              <Tarjeta interactiva onPress={() => setIndiceAbierto('salud')} accessibilityRole="button" etiqueta={t('perfil.indiceSalud')}>
                <View style={{ gap: spacing[2], alignItems: 'flex-start' }}>
                  <Guijarro capa="identidad" tamano={56} rotacion={9}>
                    <MotivoCorazon color={theme.text.primary} />
                  </Guijarro>
                  <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.primary }}>
                    {t('perfil.indiceSalud')}
                  </Text>
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
                    {t('perfil.indiceSeConstruye')}
                  </Text>
                </View>
              </Tarjeta>
            </View>
            <View style={{ flex: 1 }}>
              <Tarjeta interactiva onPress={() => setIndiceAbierto('descanso')} accessibilityRole="button" etiqueta={t('perfil.indiceDescanso')}>
                <View style={{ gap: spacing[2], alignItems: 'flex-start' }}>
                  <Guijarro capa="cuidado" tamano={56} rotacion={-16}>
                    <MotivoLuna color={theme.text.primary} />
                  </Guijarro>
                  <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.primary }}>
                    {t('perfil.indiceDescanso')}
                  </Text>
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
                    {t('perfil.indiceSeConstruye')}
                  </Text>
                </View>
              </Tarjeta>
            </View>
          </View>
        </View>

        {/* ── 2 · Salud (el carnet vivo) ── */}
        <View style={{ gap: spacing[3] }}>
          <TituloModulo texto={t('perfil.salud')} />
          {vacunas.length === 0 ? (
            <EstadoVacio
              titulo={t('perfil.carnetVacio')}
              descripcion={t('perfil.carnetVacioDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('perfil.cargarCarnet')}
                  onPress={() => router.push({ pathname: '/carnet', params: { mascotaId: mascota.id, nombre: mascota.nombre } })}
                />
              }
            />
          ) : (
            <Tarjeta relleno="ninguno">
              {vacunas.map((v, i) => (
                <View key={`${v.nombre_vacuna}-${i}`}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={v.nombre_vacuna}
                    subtitulo={v.tipo_vacuna ?? undefined}
                    metadataMono={v.fecha_aplicada !== null ? fechaCortaMono(v.fecha_aplicada, idioma) : undefined}
                  />
                </View>
              ))}
            </Tarjeta>
          )}
        </View>

        {/* ── 3 · Su vida ── */}
        <View style={{ gap: spacing[3] }}>
          <TituloModulo texto={t('perfil.vida')} />
          {items === null ? (
            <LineaDeVida items={[]} cargando />
          ) : items === 'error' ? (
            <EstadoVacio
              titulo={t('hogar.errorHistoria')}
              descripcion={t('hogar.errorHistoriaDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('hogar.reintentar')}
                  onPress={() => {
                    setItems(null);
                    if (typeof mascotaId === 'string') void cargarPrimeraPagina(mascotaId);
                  }}
                />
              }
            />
          ) : items.length === 0 ? (
            <EstadoVacio titulo={t('hogar.historiaEmpieza')} descripcion={t('hogar.historiaEmpiezaDetalle')} />
          ) : (
            <LineaDeVida items={items} onPressNodo={alTocarNodo} estadoPie={estadoPie} onCargarMas={() => void cargarMas()} />
          )}
        </View>

        {/* ── 4 · Identidad (progresiva) ── */}
        <View style={{ gap: spacing[3] }}>
          <TituloModulo texto={t('perfil.identidad')} />
          {datosIdentidad.length > 0 ? (
            <Tarjeta relleno="ninguno">
              {datosIdentidad.map((d, i) => (
                <View key={d.etiqueta}>
                  {i > 0 ? <Separador /> : null}
                  {d.mono ? (
                    <Celda titulo={d.etiqueta} metadataMono={d.valor} />
                  ) : (
                    <Celda titulo={d.etiqueta} fin={
                      <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                        {d.valor}
                      </Text>
                    } />
                  )}
                </View>
              ))}
            </Tarjeta>
          ) : null}
          {/* la invitación digna: texto, jamás formulario muerto */}
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: typography.size.sm * typography.leading.normal,
              color: theme.text.secondary,
            }}
          >
            {t('perfil.identidadInvitacion')}
          </Text>
        </View>
      </ScrollView>

      {/* Hoja EDUCATIVA de los índices (§6.4 educando): QUÉ es, DE QUÉ
          se alimenta, y UNA acción real que alimenta el expediente —
          la ley del ecosistema hablando. Apertura normal (la física de
          marca es del Coach; acá sobriedad). */}
      <Hoja
        visible={indiceAbierto !== null}
        onCerrar={() => setIndiceAbierto(null)}
        titulo={indiceAbierto === 'salud' ? t('perfil.indiceSalud') : t('perfil.indiceDescanso')}
        conCerrar
      >
        <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[2], gap: spacing[4] }}>
          <View style={{ alignItems: 'center' }}>
            <Guijarro capa={indiceAbierto === 'salud' ? 'identidad' : 'cuidado'} tamano={72} rotacion={indiceAbierto === 'salud' ? 9 : -16}>
              {indiceAbierto === 'salud' ? <MotivoCorazon color={theme.text.primary} /> : <MotivoLuna color={theme.text.primary} />}
            </Guijarro>
          </View>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * typography.leading.normal, color: theme.text.primary }}>
            {indiceAbierto === 'salud' ? t('perfil.eduSaludQue') : t('perfil.eduDescansoQue')}
          </Text>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * typography.leading.normal, color: theme.text.secondary }}>
            {indiceAbierto === 'salud' ? t('perfil.eduSaludDeQue') : t('perfil.eduDescansoDeQue')}
          </Text>
          <Boton
            etiqueta={t('perfil.eduAccion')}
            bloque
            onPress={() => {
              setIndiceAbierto(null);
              router.push({ pathname: '/carnet', params: { mascotaId: mascota.id, nombre: mascota.nombre } });
            }}
          />
        </View>
      </Hoja>
    </View>
  );
}
