/**
 * Navegación raíz del prestador (S51-B3.1; letra P17 v1.1, S57-B):
 * CUATRO tabs, Hoy·Mascotas·Negocio·Cuenta. La v1.0 sacaba Mascotas de
 * la barra — era letra mal redactada, no decisión (veredicto founder en
 * el gate): la decisión real de S57 es UNA, separar Cuenta de Negocio.
 *
 * AUTH REAL EN EL RAÍZ (S54-B, D-290 — el bootstrap dev de S44 murió):
 * la misma máquina de estados dignos de S51, con dos estados nuevos.
 * Routing por estado REAL:
 *   verificando → Esqueleto ESTÁTICO (Ley 13)
 *   sin sesión  → invitación a entrar (el login vive en /login)
 *   con sesión SIN negocio de prestador → estado honesto + salida
 *     (la verdad operativa es la fila de `prestadores`, no user_roles
 *     — decisión S54-B: es lo que toda pantalla necesita para operar)
 *   con negocio → las tabs (HOY preside)
 *   error de red/config → detalle específico + reintentar (regla 36)
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Tabs, useFocusEffect, useRouter } from 'expo-router';
import {
  BarraTabs,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  spacing,
  useTheme,
  type BarraTabsItem,
} from '@epetplace/ui';
import { cerrarSesion, obtenerMiPrestador, obtenerSesion } from '@epetplace/api';

import { apiLista } from '@/lib/api';
import { IconoCuenta, IconoHoy, IconoMascotas, IconoNegocio } from '@/components/iconos-tabs';
import { useTraduccion } from '@/i18n';

type EstadoSesionRaiz =
  | 'verificando'
  | 'ok'
  | { sin_sesion: true }
  | { sin_rol: true; email: string }
  | { error: true; detalle: string };

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const router = useRouter();
  const [sesion, setSesion] = useState<EstadoSesionRaiz>('verificando');
  const [intento, setIntento] = useState(0);
  const [saliendo, setSaliendo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async (): Promise<EstadoSesionRaiz> => {
        if (!apiLista) {
          return { error: true, detalle: 'Faltan EXPO_PUBLIC_SUPABASE_URL / ANON_KEY en .env.local.' };
        }
        const s = await obtenerSesion();
        if (!s.ok) return { error: true, detalle: s.mensaje };
        if (s.data === null) return { sin_sesion: true };
        const p = await obtenerMiPrestador();
        if (p.ok) return 'ok';
        if (p.codigo === 'sin_prestador') return { sin_rol: true, email: s.data.email ?? '' };
        return { error: true, detalle: p.mensaje };
      })().then((r) => {
        // Forense L-138: el resultado del guard raíz queda LITERAL en
        // el log de Metro/logcat — el gate empieza confirmándolo.
        const voz =
          r === 'ok' ? 'ok'
            : typeof r === 'object' && 'sin_sesion' in r ? 'sin sesión'
              : typeof r === 'object' && 'sin_rol' in r ? `sin rol prestador — ${r.email}`
                : `error — ${(r as { detalle: string }).detalle}`;
        console.log(`[sesion] raíz prestador: ${voz}`);
        if (vigente) setSesion(r);
      });
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  if (sesion === 'verificando') {
    // Esqueleto estático de la jornada (Ley 13): el vacío jamás es carga.
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], paddingTop: spacing[10] }}>
        <EsqueletoGrupo>
          <View style={{ gap: spacing[4] }}>
            <Esqueleto forma="linea" ancho="55%" />
            <Esqueleto forma="bloque" ancho="100%" alto={88} />
            <Esqueleto forma="bloque" ancho="100%" alto={220} />
          </View>
        </EsqueletoGrupo>
      </View>
    );
  }

  if (sesion !== 'ok' && 'sin_sesion' in sesion) {
    // sin sesión CONFIRMADO → la invitación digna; el login se enchufa acá
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo={t('sesion.sinSesion')}
          descripcion={t('sesion.sinSesionDetalle')}
          accion={
            <Boton
              variante="primario"
              etiqueta={t('sesion.iniciarSesion')}
              onPress={() => router.push('/login')}
            />
          }
        />
      </View>
    );
  }

  if (sesion !== 'ok' && 'sin_rol' in sesion) {
    // sesión válida pero SIN negocio: honesto, con salida — jamás trampa
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5], gap: spacing[4] }}>
        <EstadoVacio
          titulo={t('sesion.sinRol')}
          descripcion={t('sesion.sinRolDetalle', { email: sesion.email })}
          accion={
            <Boton
              variante="secundario"
              etiqueta={t('sesion.cerrarSesion')}
              cargando={saliendo}
              onPress={() => {
                if (saliendo) return;
                setSaliendo(true);
                void cerrarSesion().then(() => {
                  setSaliendo(false);
                  setSesion('verificando');
                  setIntento((n) => n + 1);
                });
              }}
            />
          }
        />
      </View>
    );
  }

  if (sesion !== 'ok') {
    // error de config/red — el detalle específico jamás se traga (regla 36)
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo={t('sesion.sinSesion')}
          descripcion={sesion.detalle}
          accion={
            <Boton
              variante="secundario"
              etiqueta={t('sesion.reintentar')}
              onPress={() => {
                setSesion('verificando');
                setIntento((n) => n + 1);
              }}
            />
          }
        />
      </View>
    );
  }

  const items: BarraTabsItem[] = [
    { key: 'index', etiqueta: t('tabs.hoy'), icono: IconoHoy },
    { key: 'mascotas', etiqueta: t('tabs.mascotas'), icono: IconoMascotas },
    { key: 'negocio', etiqueta: t('tabs.negocio'), icono: IconoNegocio },
    { key: 'cuenta', etiqueta: t('tabs.cuenta'), icono: IconoCuenta },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BarraTabs
          items={items}
          activo={state.routes[state.index].name}
          onCambiar={(key) => navigation.navigate(key)}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="mascotas" />
      <Tabs.Screen name="negocio" />
      <Tabs.Screen name="cuenta" />
      {/* galería de tokens: fuera de la barra, viva por URL (/gallery) */}
      <Tabs.Screen name="gallery" />
    </Tabs>
  );
}
