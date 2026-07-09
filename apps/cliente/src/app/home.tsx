/**
 * Home del dueño (S45-B4 → B5.3) — la mascota grande arriba y DEBAJO
 * el timeline real: LineaDeVida con leerTimelineMascota (paginación
 * por cursor, refetch en focus). EstadoVacio SOLO cuando el timeline
 * confirmó vacío (Ley 13). Tap en nodo con atención → detalle.
 */

import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  LineaDeVida,
  Tarjeta,
  VisorFoto,
  spacing,
  typography,
  useAviso,
  useTheme,
  type LineaDeVidaEstadoPie,
} from '@epetplace/ui';
import {
  cerrarSesion,
  getEstadoOnboardingDueno,
  leerTimelineMascota,
  obtenerMascotasDeFamilia,
  obtenerVacunaPorEvento,
  resolverUrlFoto,
  type ItemTimeline,
  type MascotaResumen,
  type VacunaDeEvento,
} from '@epetplace/api';

// Engranaje — Ley 12: outline 1.75, remates redondeados, UN color.
function IconoAjustes({ color }: { color: string }) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3.2} {...stroke} />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01A1.7 1.7 0 0 0 10.05 3V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01c.26.63.87 1.04 1.56 1.04H21a2 2 0 1 1 0 4h-.09c-.69 0-1.3.41-1.51 1.04Z"
        {...stroke}
      />
    </Svg>
  );
}

import { esEspecieUi } from '@/lib/params';

// Fecha ISO → voz de máquina "01 may 2026" (mismo formato que FichaVacuna).
const MESES_MONO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fechaMonoVacuna(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso.toLowerCase();
  return `${String(d).padStart(2, '0')} ${MESES_MONO[m - 1]} ${a}`;
}

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [mascota, setMascota] = useState<MascotaResumen | null | 'cargando'>('cargando');
  // foto_url guarda PATH (S47-B0.2): la URL firmada se resuelve acá;
  // sin firma posible → undefined → huella digna de AvatarMascota.
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  // 'error' es un estado PROPIO: un timeline que falló JAMÁS se muestra
  // como vacío ("la historia empieza acá" sería mentira) — Ley 13:
  // vacío solo CONFIRMADO.
  const [items, setItems] = useState<ItemTimeline[] | null | 'error'>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [estadoPie, setEstadoPie] = useState<LineaDeVidaEstadoPie>('nada');
  const cargandoMasRef = useRef(false);
  const { mostrar } = useAviso();
  // Hoja de detalle de vacuna (S47-B1.2 C) + su carnet firmado
  const [vacunaAbierta, setVacunaAbierta] = useState(false);
  const [vacuna, setVacuna] = useState<VacunaDeEvento | 'cargando' | 'error'>('cargando');
  const [carnetFirmado, setCarnetFirmado] = useState<string | null>(null);

  const cargarPrimeraPagina = useCallback(async (mascotaId: string) => {
    const r = await leerTimelineMascota(mascotaId);
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
    if (cargandoMasRef.current || mascota === 'cargando' || mascota === null) return;
    if (cursor === null) {
      // reintento de paginación sin cursor: recargar la primera página
      setEstadoPie('cargando');
      await cargarPrimeraPagina(mascota.id);
      return;
    }
    cargandoMasRef.current = true;
    setEstadoPie('cargando');
    const r = await leerTimelineMascota(mascota.id, { cursor });
    cargandoMasRef.current = false;
    if (!r.ok) {
      setEstadoPie('error');
      return;
    }
    setItems((prev) => [...(Array.isArray(prev) ? prev : []), ...r.data.items]);
    setCursor(r.data.siguiente_cursor);
    setEstadoPie(r.data.siguiente_cursor !== null ? 'mas' : 'nada');
  }, [cursor, mascota, cargarPrimeraPagina]);

  // Refetch en focus — patrón S44-B4 (el estado real manda).
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
        const mascotas = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        const m = mascotas.ok && mascotas.data.length > 0 ? mascotas.data[0] : null;
        setMascota(m);
        if (m?.foto_url) {
          void resolverUrlFoto(m.foto_url).then((url) => {
            if (vigente) setFotoFirmada(url ?? undefined);
          });
        } else {
          setFotoFirmada(undefined);
        }
        if (m !== null) await cargarPrimeraPagina(m.id);
      })();
      return () => {
        vigente = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const alTocarNodo = (item: { atencion_id?: string | null; evento_id: string; tipo?: string }) => {
    if (item.tipo === 'vacuna_aplicada') {
      // detalle de vacuna = HOJA, no pantalla (decisión arquitecto S47-B1.2 C)
      setVacunaAbierta(true);
      setVacuna('cargando');
      void obtenerVacunaPorEvento(item.evento_id).then((r) => {
        setVacuna(r.ok ? r.data : 'error');
      });
      return;
    }
    if (item.atencion_id) {
      router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: item.atencion_id } });
    }
  };

  async function verCarnet(path: string) {
    const url = await resolverUrlFoto(path);
    if (url === null) {
      mostrar({ texto: 'No pudimos abrir el carnet. Probá de nuevo.', variante: 'error' });
      return;
    }
    setCarnetFirmado(url);
  }

  if (mascota === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], paddingTop: insets.top + spacing[8] }}>
        <EsqueletoGrupo etiqueta="Cargando tu mascota">
          <View style={{ alignItems: 'center', gap: spacing[3] }}>
            <Esqueleto forma="circulo" alto={96} />
            <Esqueleto forma="linea" ancho="40%" />
            <View style={{ height: spacing[6] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
          </View>
        </EsqueletoGrupo>
      </View>
    );
  }

  if (mascota === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo="Todavía no hay nadie por acá"
          descripcion="Agregá a tu mascota para empezar su historia."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg.base }}
      contentContainerStyle={{ padding: spacing[5], paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[6] }}
    >
      {/* engranaje — S45: sin logout no hay ensayo S2a */}
      <Pressable
        onPress={() => setAjustesAbiertos(true)}
        accessibilityRole="button"
        accessibilityLabel="Ajustes"
        hitSlop={10}
        style={{
          position: 'absolute',
          top: insets.top + spacing[3],
          right: spacing[4],
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconoAjustes color={theme.text.secondary} />
      </Pressable>

      <View style={{ alignItems: 'center', gap: spacing[3], marginBottom: spacing[8] }}>
        <AvatarMascota
          nombre={mascota.nombre}
          fotoUrl={fotoFirmada}
          especie={esEspecieUi(mascota.especie) ? mascota.especie : undefined}
          tamano="lg"
          capa="vida"
        />
        <Text
          accessibilityRole="header"
          style={{
            // voz humana: es un ser vivo, DM Sans 300 en grande
            fontFamily: typography.family.sans.light,
            fontSize: typography.size['2xl'],
            color: theme.text.primary,
          }}
        >
          {mascota.nombre}
        </Text>
      </View>

      {/* Carnet de vacunas — acción del timeline (S47-B1.2 B1; v1 SIN
          barra de progreso: la completitud llega con loyalty, no de
          contrabando) */}
      <View style={{ marginBottom: spacing[5] }}>
        <Tarjeta
          interactiva
          onPress={() => router.push({ pathname: '/carnet', params: { mascotaId: mascota.id, nombre: mascota.nombre } })}
          accessibilityRole="button"
          etiqueta={`Carnet de vacunas de ${mascota.nombre}: sacale una foto y nosotros leemos las vacunas`}
          relleno="amplio"
        >
          <View style={{ gap: spacing[1] }}>
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
              Carnet de vacunas
            </Text>
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
              Sacale una foto al carnet — nosotros leemos las vacunas y las guardamos en su historia.
            </Text>
          </View>
        </Tarjeta>
      </View>

      {items === null ? (
        <LineaDeVida items={[]} cargando />
      ) : items === 'error' ? (
        // el error JAMÁS se disfraza de vacío (Ley 13)
        <EstadoVacio
          titulo="No pudimos cargar su historia"
          descripcion="Revisá tu conexión y probá de nuevo."
          accion={
            <Boton
              variante="secundario"
              etiqueta="Reintentar"
              onPress={() => {
                setItems(null);
                void cargarPrimeraPagina(mascota.id);
              }}
            />
          }
        />
      ) : items.length === 0 ? (
        // vacío CONFIRMADO (Ley 13)
        <EstadoVacio
          titulo={`La historia de ${mascota.nombre} empieza acá.`}
          descripcion="Cada paseo, cada visita al vet, va a quedar guardada."
        />
      ) : (
        <LineaDeVida
          items={items}
          onPressNodo={alTocarNodo}
          estadoPie={estadoPie}
          onCargarMas={() => void cargarMas()}
        />
      )}

      {/* Detalle de vacuna: Hoja + "Ver carnet" → VisorFoto firmado.
          Sin archivo_url NO hay botón — jamás un botón muerto. */}
      <Hoja visible={vacunaAbierta} onCerrar={() => { setVacunaAbierta(false); setCarnetFirmado(null); }} titulo="Vacuna" conCerrar>
        {vacuna === 'cargando' ? (
          <View style={{ padding: spacing[4] }}>
            <EsqueletoGrupo etiqueta="Cargando la vacuna">
              <View style={{ gap: spacing[2] }}>
                <Esqueleto forma="linea" ancho="60%" />
                <Esqueleto forma="linea" ancho="40%" />
              </View>
            </EsqueletoGrupo>
          </View>
        ) : vacuna === 'error' ? (
          <View style={{ padding: spacing[4] }}>
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.status.dangerText }}>
              No pudimos cargar la vacuna. Cerrá y probá de nuevo.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing[3], padding: spacing[4] }}>
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}>
              {vacuna.nombre_vacuna}
            </Text>
            {(vacuna.tipo_vacuna || vacuna.veterinario_nombre_externo) && (
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                {[vacuna.tipo_vacuna, vacuna.veterinario_nombre_externo].filter(Boolean).join(' · ')}
              </Text>
            )}
            {(vacuna.fecha_aplicada || vacuna.fecha_proxima || vacuna.lote) && (
              <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                {[
                  vacuna.fecha_aplicada ? `aplicada ${fechaMonoVacuna(vacuna.fecha_aplicada)}` : null,
                  vacuna.fecha_proxima ? `próxima ${fechaMonoVacuna(vacuna.fecha_proxima)}` : null,
                  vacuna.lote ? `lote ${vacuna.lote.toLowerCase()}` : null,
                ].filter(Boolean).join(' · ')}
              </Text>
            )}
            {vacuna.archivo_url !== null && (
              <Boton
                variante="secundario"
                bloque
                etiqueta="Ver carnet"
                onPress={() => { if (vacuna.archivo_url !== null) void verCarnet(vacuna.archivo_url); }}
              />
            )}
          </View>
        )}
      </Hoja>

      {carnetFirmado !== null && (
        <VisorFoto
          visible
          onCerrar={() => setCarnetFirmado(null)}
          fotos={[carnetFirmado]}
          etiqueta={`Carnet de ${mascota.nombre}`}
        />
      )}

      <Hoja visible={ajustesAbiertos} onCerrar={() => setAjustesAbiertos(false)} titulo="Ajustes">
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.base,
              color: theme.text.secondary,
            }}
          >
            ¿Cerrás tu sesión? Tus datos quedan guardados.
          </Text>
          <Boton
            variante="destructivo"
            etiqueta="Cerrar sesión"
            bloque
            cargando={cerrando}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void (async () => {
                await cerrarSesion();
                setCerrando(false);
                setAjustesAbiertos(false);
                router.replace('/bienvenida');
              })();
            }}
          />
          <Boton variante="ghost" etiqueta="Cancelar" bloque onPress={() => setAjustesAbiertos(false)} />
        </View>
      </Hoja>
    </ScrollView>
  );
}
