/**
 * GateBiometrico — EL CANDADO SOBRE LA SESIÓN, cableado (S104-C · §2.5).
 *
 * Envuelve al `<Stack>` del layout raíz y, cuando corresponde, monta
 * `PantallaDeCandado` (packages/ui, B) por ENCIMA de todo. La pieza es
 * presentacional; acá vive el comportamiento: cuándo bloquear, cómo preguntar
 * al SO, y la salida.
 *
 * ── LA HUELLA ES LA PUERTA DE ENTRADA (enmienda founder, 23-ago) ──────────
 * El patrón es el de la banca: al abrir la app con una sesión guardada, se
 * ENTRA CON HUELLA en vez de tipear correo y clave. La huella **desbloquea una
 * sesión que ya existe**; jamás crea una nueva contra Supabase.
 *   · Al ARRANCAR en frío, si el candado está activo y hay sesión guardada →
 *     la cortina baja y **se pide la huella de una** (no una pantalla donde
 *     tocar «Desbloquear» primero). Pasa → adentro.
 *   · Al VOLVER del segundo plano (background → active), mismas condiciones.
 *   · Sin sesión (venció o se cerró a propósito) → login normal, SIN huella:
 *     no hay sesión que desbloquear.
 *   · La salida SIEMPRE visible («Entrar con otra cuenta») lleva al login.
 *
 * ── LOS DOS GUARDAS QUE EVITAN QUE SE ROMPA SOLO ─────────────────────────
 *   ① `enPrompt` — el prompt biométrico del SO puede mandar la app a
 *      `inactive`/`active`; sin este guard, VOLVER del prompt re-dispararía
 *      el bloqueo en un bucle. Por eso el disparo se ARMA solo en
 *      `background` (no en `inactive`) y la vuelta a `active` se ignora
 *      mientras el prompt está abierto.
 *   ② `listoInicial` — hasta que la primera decisión de bloqueo se resuelve,
 *      NO se dibujan los hijos: un flash de contenido privado antes de que
 *      baje la cortina es una fuga, por breve que sea.
 *
 * ── LA SALIDA (§2.5: fallback SIEMPRE a la clave de la cuenta) ─────────────
 * «Entrar con mi contraseña» NO levanta la cortina: **cierra la sesión** y va
 * al login. Si solo la ocultara, cualquiera podría saltar el candado tocando
 * esa salida — la única salida honesta es re-autenticarse de verdad.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PantallaDeCandado, useTheme, type EstadoCandado } from '@epetplace/ui';
import { cerrarSesion, obtenerSesion } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { bloqueoActivado, pedirIdentidad } from '@/lib/bloqueo-biometrico';

export function GateBiometrico({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const [bloqueado, setBloqueado] = useState(false);
  const [estado, setEstado] = useState<EstadoCandado>('bloqueada');
  const [listoInicial, setListoInicial] = useState(false);

  const enPrompt = useRef(false);
  const armado = useRef(false);
  const bloqueadoRef = useRef(false);
  bloqueadoRef.current = bloqueado;

  /** ¿Corresponde bajar la cortina? Solo con el candado activo Y sesión viva. */
  async function debeBloquear(): Promise<boolean> {
    if (bloqueadoRef.current) return true;
    if (!(await bloqueoActivado())) return false;
    const s = await obtenerSesion();
    return s.ok && s.data !== null;
  }

  // Arranque en frío: decidir el bloqueo ANTES de mostrar contenido.
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const bloquear = await debeBloquear();
      if (!vivo) return;
      if (bloquear) {
        setBloqueado(true);
        // BANCA: al abrir con sesión guardada, la huella ES la puerta — se
        // pide de una, no una pantalla donde tocar «Desbloquear» primero. Si
        // falla, el candado queda con su reintento y la salida visible.
        void desbloquear();
      }
      setListoInicial(true);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  // Vuelta del segundo plano.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (siguiente) => {
      if (siguiente === 'background') {
        // El prompt del SO no arma el bloqueo (si armara, volver de él
        // re-bloquearía en bucle).
        if (!enPrompt.current) armado.current = true;
      } else if (siguiente === 'active') {
        if (enPrompt.current) return; // volver del prompt no re-bloquea
        if (!armado.current) return;
        armado.current = false;
        void (async () => {
          if (await debeBloquear()) {
            setBloqueado(true);
            void desbloquear(); // misma puerta: al volver, se pide la huella de una
          }
        })();
      }
    });
    return () => sub.remove();
  }, []);

  async function desbloquear() {
    setEstado('verificando');
    enPrompt.current = true;
    const ok = await pedirIdentidad(t('seguridad.biometricoPrompt'));
    enPrompt.current = false;
    if (ok) {
      setBloqueado(false);
      setEstado('bloqueada'); // deja el estado en reposo para el próximo bloqueo
    } else {
      setEstado('rechazada');
    }
  }

  async function usarClave() {
    // La salida honesta: re-autenticación completa.
    await cerrarSesion();
    setBloqueado(false);
    router.replace('/login');
  }

  // Hasta la primera decisión, un fondo neutro (nada de contenido).
  if (!listoInicial) {
    return <View style={{ flex: 1, backgroundColor: theme.bg.base }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      {bloqueado && (
        <PantallaDeCandado
          estado={estado}
          onDesbloquear={() => void desbloquear()}
          onSalirDeLaSesion={() => void usarClave()}
        />
      )}
    </View>
  );
}
