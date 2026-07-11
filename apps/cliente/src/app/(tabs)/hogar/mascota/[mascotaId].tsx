/**
 * PERFIL DE MASCOTA — pila de módulos, no monolito (S51-B2.3, sobre
 * DISEÑO_EXPERIENCIA §4): header de identidad (AvatarMascota + nombre
 * + momento vital EN VOZ — Ley 3: M1..M7 jamás visibles) y debajo la
 * pila:
 *   1. Su vida — LineaDeVida propia (paginada).
 *   2. Salud — el carnet vivo (vacunas reales de S47-48).
 *   3. Bienestar y actividad — lo que el ecosistema deposita (paseos).
 *      ═══ HUECO M-WEAR ═══ el día del wearable este módulo se expande
 *      al dashboard (actividad, descanso, tendencias) por revelación
 *      progresiva — inserción en una pila que ya existe, cero refactor
 *      (mandato founder S50). Hoy: cero UI de wearable.
 *   4. Identidad — progresiva: SOLO lo cargado; lo que falta es una
 *      invitación digna, jamás un formulario ni datos fake.
 *
 * Módulo sin datos = EstadoVacio con voz (Ley 13: vacío confirmado).
 */

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
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
  obtenerPerfilMascota,
  resolverUrlFoto,
  type ItemTimeline,
  type PerfilMascota,
} from '@epetplace/api';
import { calcularMomentoVital, edadEnMeses, type MomentoVital } from '@epetplace/domain';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';

type TraductorPerfil = ReturnType<typeof useTraduccion>['t'];

// Fecha ISO → voz de máquina "01 may 2026" (formato de la casa).
const MESES_MONO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fechaMono(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso.toLowerCase();
  return `${String(d).padStart(2, '0')} ${MESES_MONO[m - 1]} ${a}`;
}

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
  const { t } = useTraduccion();
  const { mascotaId } = useLocalSearchParams<{ mascotaId: string }>();

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
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

  const { mascota, vacunas, paseos_total, ultimo_paseo_fecha, peso_clinico_kg, tiene_condicion_cronica, umbrales } = perfil;
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
    datosIdentidad.push({ etiqueta: t('perfil.nacimiento'), valor: fechaMono(mascota.fecha_nacimiento), mono: true });
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

        {/* ── 1 · Su vida ── */}
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
                    metadataMono={v.fecha_aplicada !== null ? fechaMono(v.fecha_aplicada) : undefined}
                  />
                </View>
              ))}
            </Tarjeta>
          )}
        </View>

        {/* ── 3 · Bienestar y actividad ──
            ═══ HUECO M-WEAR: acá se inserta el dashboard del wearable
            (actividad/descanso/tendencias) cuando el collar exista —
            revelación progresiva, cero refactor (§4). ═══ */}
        <View style={{ gap: spacing[3] }}>
          <TituloModulo texto={t('perfil.bienestar')} />
          {paseos_total === 0 ? (
            <EstadoVacio titulo={t('perfil.bienestarVacio')} descripcion={t('perfil.bienestarVacioDetalle')} />
          ) : (
            <Tarjeta>
              <Celda
                titulo={paseos_total === 1 ? t('perfil.unPaseoGuardado') : t('perfil.paseosGuardados', { n: paseos_total })}
                metadataMono={ultimo_paseo_fecha !== null ? fechaMono(ultimo_paseo_fecha.slice(0, 10)) : undefined}
              />
            </Tarjeta>
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
    </View>
  );
}
