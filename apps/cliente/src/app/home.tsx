/**
 * Home del dueño (S45-B4 → B5.3) — la mascota grande arriba y DEBAJO
 * el timeline real: LineaDeVida con leerTimelineMascota (paginación
 * por cursor, refetch en focus). EstadoVacio SOLO cuando el timeline
 * confirmó vacío (Ley 13). Tap en nodo con atención → detalle.
 */

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  LineaDeVida,
  spacing,
  typography,
  useTheme,
  type LineaDeVidaEstadoPie,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  leerTimelineMascota,
  obtenerMascotasDeFamilia,
  type ItemTimeline,
  type MascotaResumen,
} from '@epetplace/api';

import { esEspecieUi } from '@/lib/params';

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [mascota, setMascota] = useState<MascotaResumen | null | 'cargando'>('cargando');
  // 'error' es un estado PROPIO: un timeline que falló JAMÁS se muestra
  // como vacío ("la historia empieza acá" sería mentira) — Ley 13:
  // vacío solo CONFIRMADO.
  const [items, setItems] = useState<ItemTimeline[] | null | 'error'>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [estadoPie, setEstadoPie] = useState<LineaDeVidaEstadoPie>('nada');
  const cargandoMasRef = useRef(false);

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
        if (m !== null) await cargarPrimeraPagina(m.id);
      })();
      return () => {
        vigente = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const alTocarNodo = (item: { atencion_id?: string | null; evento_id: string }) => {
    if (item.atencion_id) {
      router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: item.atencion_id } });
    }
  };

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
      <View style={{ alignItems: 'center', gap: spacing[3], marginBottom: spacing[8] }}>
        <AvatarMascota
          nombre={mascota.nombre}
          fotoUrl={mascota.foto_url ?? undefined}
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
    </ScrollView>
  );
}
