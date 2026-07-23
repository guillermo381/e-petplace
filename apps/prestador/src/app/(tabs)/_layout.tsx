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
import { Redirect, Tabs, useFocusEffect } from 'expo-router';
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
import {
  cerrarSesion,
  empleadoTieneRol,
  obtenerInvitacionPendiente,
  obtenerMiPrestador,
  obtenerNegocioEmpleadoActivo,
  obtenerSesion,
} from '@epetplace/api';

import { apiLista } from '@/lib/api';
import { BienvenidaPrestador } from '@/components/bienvenida';
import { IconoCuenta, IconoHoy, IconoMascotas, IconoNegocio } from '@/components/iconos-tabs';
import { useTraduccion } from '@/i18n';

type EstadoSesionRaiz =
  | 'verificando'
  // S75-B: 'ok' pasa a portar esGestor — el gate del tab NEGOCIO lee de
  // acá (resuelto UNA vez en el guard, jamás por pantalla). Hoy inerte:
  // el único que llega es el titular, y el titular siempre es gestor.
  | { ok: true; esGestor: boolean }
  // negocioEmpleado: si el user es EMPLEADO ACTIVO esperando la puerta,
  // el nombre de su negocio (voz honesta); null = user sin negocio alguno.
  | { sin_rol: true; email: string; negocioEmpleado: string | null }
  // S75-B1: hay una invitación de equipo SIN aceptar → el handshake vive
  // en el RAÍZ (/invitacion), fuera de las tabs (L-161). El guard redirige.
  | { invitacion_pendiente: true }
  | { sin_sesion: true }
  | { error: true; detalle: string };

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
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
        if (p.ok) {
          // S75-B: el rol de gestión, resuelto UNA vez (gate del tab).
          // Falla de lectura = false (Ley 23: ante la duda, se cierra).
          const rol = await empleadoTieneRol(p.data.id, ['dueño', 'administrador']);
          return { ok: true, esGestor: rol.ok ? rol.data : false };
        }
        if (p.codigo === 'sin_prestador') {
          // S75-B1: ¿handshake pendiente? (invitación INACTIVA) → el raíz
          // lo intercepta ANTES de la voz "sin negocio" (que para el
          // invitado es mentira). La sonda mira solo inactivas; el roce
          // del re-login lo absorbe B3 (confirmado por A y mesa).
          const inv = await obtenerInvitacionPendiente();
          if (inv.ok && inv.data !== null) return { invitacion_pendiente: true };
          // ¿empleado ACTIVO esperando la puerta, o user sin negocio?
          // La sonda distingue la voz (cero motor — policy empleados_self).
          const neg = await obtenerNegocioEmpleadoActivo();
          return {
            sin_rol: true,
            email: s.data.email ?? '',
            negocioEmpleado: neg.ok ? neg.data : null,
          };
        }
        return { error: true, detalle: p.mensaje };
      })().then((r) => {
        // Forense L-138: el resultado del guard raíz queda LITERAL en
        // el log de Metro/logcat — el gate empieza confirmándolo.
        const voz =
          typeof r === 'string' ? r
            : 'ok' in r ? `ok — gestor=${r.esGestor}`
              : 'invitacion_pendiente' in r ? 'invitación pendiente → /invitacion'
                : 'sin_sesion' in r ? 'sin sesión'
                  : 'sin_rol' in r ? `sin rol prestador — ${r.email}${r.negocioEmpleado ? ` (empleado de ${r.negocioEmpleado})` : ''}`
                    : `error — ${r.detalle}`;
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

  if ('invitacion_pendiente' in sesion) {
    // S75-B1: handshake pendiente → la pantalla del raíz (fuera de tabs).
    return <Redirect href="/invitacion" />;
  }

  if ('sin_sesion' in sesion) {
    // sin sesión CONFIRMADO → LA BIENVENIDA (S61-B8, letra founder):
    // el landing con la voz del grupo curado; el EstadoVacio de S51
    // murió — error y sin-rol conservan el suyo.
    return <BienvenidaPrestador />;
  }

  if ('sin_rol' in sesion) {
    // sesión válida pero SIN negocio propio. S75-B: DOS voces —
    //  · EMPLEADO ACTIVO de un negocio NO-'activo' (negocioEmpleado
    //    presente): la puerta abierta (R1) NO lo deja entrar porque
    //    `prestadores_public` exige estado='activo' y no es el titular
    //    → `obtenerMiPrestador` cae en `sin_prestador` (BORDE declarado
    //    por A1). VERIFICADO S75-B: existe 1 caso vivo en DB.
    //    NO SE RETIRA (mesa S75): la rama cambió de caso, no murió.
    //    LÍMITE HONESTO — hoy DEGRADA a la voz `sinRol`: para leer el
    //    nombre de un negocio no-'activo' hace falta un lector que
    //    saltee la RLS (lógica nueva, territorio A) → DEUDA declarada
    //    (candidata, ver doc de circuito). Cuando ese lector exista,
    //    `obtenerNegocioEmpleadoActivo` devolverá el nombre y esta rama
    //    hablará. S76: NO la "limpies" — está esperando su lector.
    //  · user SIN negocio alguno: la voz de siempre.
    const negocio = sesion.negocioEmpleado; // narrowing: null = user sin negocio
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5], gap: spacing[4] }}>
        <EstadoVacio
          titulo={
            negocio !== null
              ? t('sesion.empleadoTitulo', { negocio })
              : t('sesion.sinRol')
          }
          descripcion={
            negocio !== null
              ? t('sesion.empleadoDetalle')
              : t('sesion.sinRolDetalle', { email: sesion.email })
          }
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

  if ('error' in sesion) {
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

  // S75-B: el tab NEGOCIO gatea por AUSENCIA (Ley 23) — la gestión (oferta,
  // plata, equipo) es de quien puede TOCARLA (dueño/administrador). HOY y
  // Mascotas y Cuenta las ve todo el equipo (operan / se identifican).
  // INERTE hoy: solo el titular llega, y el titular es gestor → el tab
  // aparece siempre. Cuando la puerta abra, el profesional/recepción entra
  // sin el tab, sin un candado que explicar.
  const items: BarraTabsItem[] = [
    { key: 'index', etiqueta: t('tabs.hoy'), icono: IconoHoy },
    { key: 'mascotas', etiqueta: t('tabs.mascotas'), icono: IconoMascotas },
    ...(sesion.esGestor
      ? [{ key: 'negocio', etiqueta: t('tabs.negocio'), icono: IconoNegocio } as BarraTabsItem]
      : []),
    { key: 'cuenta', etiqueta: t('tabs.cuenta'), icono: IconoCuenta },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BarraTabs
          items={items}
          activo={state.routes[state.index].name}
          // D-402 (S62): tocar una tab lleva SIEMPRE a su raíz. Re-tocar
          // la activa con stack anidado profundo = POP_TO_TOP dirigido al
          // stack hijo (objeto plano de acción — StackActions.popToTop()
          // es exactamente { type: 'POP_TO_TOP' }); cambiar de tab lo
          // resuelve popToTopOnBlur (abajo). En el prestador el único
          // tab con stack anidado es Cuenta (relevamiento S62-B).
          onCambiar={(key) => {
            const activa = state.routes[state.index];
            if (activa.name === key) {
              const hijo = activa.state;
              if (hijo?.type === 'stack' && (hijo.index ?? 0) > 0 && hijo.key) {
                navigation.dispatch({ type: 'POP_TO_TOP', target: hijo.key });
              }
              return;
            }
            navigation.navigate(key);
          }}
          // S58 (§2.6 + §15b.1): las 4 tabs ya hablan b′ — el pill muere,
          // la tab activa se marca porque su huella APARECE
          estadoPorHuella
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="mascotas" />
      <Tabs.Screen name="negocio" />
      {/* D-402: al salir del tab, su stack vuelve a la raíz — la próxima
          entrada jamás encuentra pegada una pantalla interna. */}
      <Tabs.Screen name="cuenta" options={{ popToTopOnBlur: true }} />
      {/* galería de tokens: fuera de la barra, viva por URL (/gallery) */}
      <Tabs.Screen name="gallery" />
    </Tabs>
  );
}
