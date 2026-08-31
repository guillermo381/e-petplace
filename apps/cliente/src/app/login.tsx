/**
 * Login — LA PUERTA (RITUAL §4, S104-C; el QUÉ vive en MODELO_LOGIN.md).
 *
 * ── LA COMPOSICIÓN (de C) SOBRE LAS PIEZAS (de B) ────────────────────────
 * · Fondo: **tapiz + MarcaDeAgua + la senda heredada** (`PaseoDeHuellas`) —
 *   jamás blanco pelado (§4).
 * · El **isotipo recogido en la esquina** — la continuidad del Acto III: en
 *   la bienvenida preside grande y centrado; acá vive chico arriba a la
 *   derecha. *La casa sigue siendo la casa, cambiaste de habitación.*
 * · Campos N11′ (etiqueta afuera, quieta) con **el foco que respira** y **el
 *   ojo** — los dos viven DENTRO de `Campo` (piezas de B), transparentes acá.
 * · Jerarquía N26: **Entrar** en ocre pleno · «¿Olvidaste…?» en `ghost` · el
 *   aire entre el formulario y las acciones es `spacing[6]` (la cura S81-C
 *   del prestador, que el cliente no tenía — la propuesta S104-B la midió).
 * · Teclado: el formulario sube, las acciones ancladas jamás quedan tapadas.
 * · **La llegada (§5):** al autenticar, la huella se completa una vez y recién
 *   ahí se abre el Hogar — el umbral, no el premio.
 *
 * ── LA CONTINUIDAD ENTRE PANTALLAS, declarada ────────────────────────────
 * «El isotipo VIAJA» y «la senda PERSISTE» (§3) son shared-element entre
 * rutas. Pixel-perfect exige un layout compartido de auth, y esas rutas viven
 * sueltas en `app/` (agruparlas toca deep-links y el guard raíz). C no
 * reestructura la navegación sin firma: la continuidad se monta per-pantalla
 * (isotipo en su posición, senda en las cuatro). El shared-element real queda
 * propuesto aparte.
 *
 * TESIS: "ya vivís acá — pasá." FIRMA: el isotipo recogido + la huella que
 * completa la llegada.
 */

import { useState, useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import {
  Boton,
  Campo,
  Encabezado,
  Entrada,
  EvitaTeclado,
  HuellaDeLlegada,
  Isotipo,
  MarcaDeAgua,
  PaseoDeHuellas,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { iniciarSesion, iniciarSesionConGoogle } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/**
 * ⭐ **S109-C · A DÓNDE VOLVER DESPUÉS DE ENTRAR.**
 *
 * Firma del founder: quien llega desde el correo del link mensual y no tiene
 * sesión **vuelve A ESA MISMA PANTALLA** — *no debe caer en el inicio y tener
 * que buscar de nuevo qué venía a pagar.*
 *
 * 🔴 **LISTA BLANCA, y esto es una ENMIENDA a mi propia primera versión.**
 *
 * ⏪ Validaba la FORMA: «empieza con `/` y no con `//`». Cerraba el redirector
 * abierto —*un correo reenviado con destino ajeno mandaría a la familia fuera de
 * la app justo después de escribir su contraseña*— **y aceptaba cualquier ruta
 * interna inventada**, incluidas las que no existen.
 *
 * ⭐ Ahora se compara contra los destinos que el producto ACEPTA. *Una lista
 * blanca no es «lo mismo pero más estricto»: es la diferencia entre preguntar si
 * algo parece una ruta y preguntar si es una de las nuestras.*
 *
 * ⚠️ **Y por qué el pathname viaja SEPARADO de sus parámetros:** el destino
 * llegaba como `'/pagos/mensualidad?suscripcionId=…'`, una cadena armada a mano.
 * Expo-router **tipa sus rutas**, y una cadena no es una ruta suya ⇒ el
 * typecheck lo rebotaba. *La cura no es un cast — un `as Href` habría compilado
 * dejando intacto justo el agujero que esta función existe para cerrar.* Se
 * manda `{ pathname, params }`, que es la forma que el router entiende **y** la
 * que hace inexpresable un destino que no esté en la lista.
 */
const DESTINOS_PERMITIDOS = ['/pagos/mensualidad'] as const;
type DestinoPermitido = (typeof DESTINOS_PERMITIDOS)[number];

/** `null` = no vino, o vino algo que no está en la lista ⇒ el Hogar. */
function destinoSeguro(crudo: unknown): DestinoPermitido | null {
  if (typeof crudo !== 'string') return null;
  /* `.some` en vez de `.includes` **para no necesitar un cast**: comparar cada
     literal contra la cadena es lo mismo y deja el estrechamiento al predicado. */
  return DESTINOS_PERMITIDOS.some((d) => d === crudo) ? (crudo as DestinoPermitido) : null;
}

// Cierra la ventana de auth al volver (necesario en web y managed; inocuo en
// nativo). Va a nivel módulo, una sola vez.
WebBrowser.maybeCompleteAuthSession();

/** El isotipo recogido: ~0.4 del tamaño de la bienvenida (72 → 28), en la
 *  esquina superior. La continuidad del Acto III, montada per-pantalla. */
const ISOTIPO_ESQUINA = 28;

/** Deep link de vuelta del OAuth. `cliente://**` ya está en el uri_allow_list
 *  del proyecto (medido por A). No necesita ruta: `openAuthSessionAsync` lo
 *  intercepta, no navega la app. */
const REDIRECT_GOOGLE = 'cliente://auth/callback';

export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  /* El destino sobrevive al login: **la intención se declaró antes de la
     contraseña**, y perderla obligaría a rehacer el camino desde el correo. */
  const paramsUrl = useLocalSearchParams();
  const destino = destinoSeguro(paramsUrl.volverA);
  /* El sujeto del destino, **aparte del pathname**: así no hay cadena de query
     armada a mano y el router recibe la forma que sabe tipar. */
  const volverASujeto = typeof paramsUrl.suscripcionId === 'string' ? paramsUrl.suscripcionId : null;
  /**
   * A dónde se va después de entrar. **Se calcula una vez y sirve a los dos
   * caminos** (clave y Google): *que cada uno lo derive por su cuenta es cómo
   * uno de los dos se queda sin la cura.*
   */
  const irADestino = useCallback(() => {
    if (destino === null || volverASujeto === null) { router.replace('/'); return; }
    router.replace({ pathname: destino, params: { suscripcionId: volverASujeto } });
  }, [destino, volverASujeto, router]);
  const insets = useSafeAreaInsets();
  const aviso = useAviso();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  /** §5 — la llegada: entre el «ok» del servidor y el Hogar, la huella se
   *  completa una vez. Cubre la pantalla para que el pase sea el umbral. */
  const [llegando, setLlegando] = useState(false);

  const puedeEnviar = email.trim().length > 0 && password.length > 0;

  async function entrar() {
    if (!puedeEnviar || cargando) return;
    setCargando(true);
    setError(undefined);
    const r = await iniciarSesion({ email: email.trim(), password });

    if (!r.ok) {
      setCargando(false);
      if (r.codigo === 'credenciales_invalidas' || r.codigo === 'email_no_confirmado') {
        setError(r.mensaje);
      } else {
        aviso.mostrar({ variante: 'error', texto: r.mensaje });
      }
      return;
    }
    // §5: la huella de llegada, y recién después el Hogar. El guard del raíz
    // re-decide con la sesión nueva (7.5: estado real).
    setLlegando(true);
    setTimeout(irADestino, 460);
  }

  async function entrarConGoogle() {
    if (cargandoGoogle || cargando) return;
    setCargandoGoogle(true);
    setError(undefined);
    const r = await iniciarSesionConGoogle({
      redirectTo: REDIRECT_GOOGLE,
      // El navegador lo abre la app (el wrapper es agnóstico de Expo).
      abrirNavegador: async (url, redirectTo) => {
        const res = await WebBrowser.openAuthSessionAsync(url, redirectTo);
        return res.type === 'success' ? { tipo: 'exito', url: res.url } : { tipo: 'cancelado' };
      },
      // Si es la primera vez, es un alta y el wrapper registra el
      // consentimiento. La URL de cada documento la resuelve `URL_LEGAL` en
      // packages/api (S104-A) — la pantalla NO la aporta: versión y URL son el
      // mismo dato y viven juntos, para que no puedan divergir (L-166).
    });

    if (!r.ok) {
      setCargandoGoogle(false);
      // Cancelar NO es un error: es una decisión. Sin alerta roja — se vuelve
      // al login y ya (el wrapper manda mensaje vacío a propósito).
      if (r.codigo === 'cancelado_por_usuario') return;
      aviso.mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    // Mismo umbral que el login con clave: la huella y recién ahí el Hogar. El
    // guard del raíz decide onboarding (alta nueva) u Hogar (ya existía).
    setLlegando(true);
    setTimeout(irADestino, 460);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* EL TAPIZ — las dos capas de fondo (pointerEvents none). */}
      <MarcaDeAgua />
      <PaseoDeHuellas />

      <Encabezado variante="navegacion" titulo={t('login.titulo')} atras onAtras={() => router.back()} />
      {/* EL ISOTIPO RECOGIDO — la continuidad, en la esquina. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + spacing[2], right: spacing[5] }}>
        <Isotipo size={ISOTIPO_ESQUINA} variant="gradiente" />
      </View>

      <EvitaTeclado>
        <ScrollView
          style={{ backgroundColor: 'transparent' }}
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[6],
            gap: spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Entrada>
            <View style={{ gap: spacing[2] }}>
              <Campo
                label={t('login.emailLabel')}
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="username"
              />
              <Campo
                label={t('login.passwordLabel')}
                value={password}
                onChangeText={setPassword}
                error={error}
                secure
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
              />
            </View>
          </Entrada>

          {/* el aire que empuja las acciones al pie (spacing[6] entre bloques
              lo da el `gap`; el spacer las ancla abajo cuando el contenido es
              corto y deja scrollear cuando el teclado achica). */}
          <View style={{ flex: 1 }} />

          <Entrada orden={1}>
            <View style={{ gap: spacing[2] }}>
              <Boton
                etiqueta={t('login.entrar')}
                bloque
                cargando={cargando}
                deshabilitado={!puedeEnviar}
                onPress={() => void entrar()}
              />
              {/* Entrar con Google — alternativa de entrada (solo cliente). Puede
                  ser un ALTA: por eso lleva su línea de términos debajo. */}
              <Boton
                variante="secundario"
                etiqueta={t('login.conGoogle')}
                bloque
                cargando={cargandoGoogle}
                onPress={() => void entrarConGoogle()}
              />
              <Boton
                variante="ghost"
                etiqueta={t('login.olvide')}
                bloque
                onPress={() => router.push('/recuperar')}
              />
              {/* Google puede crear cuenta: la línea de términos, como en
                  bienvenida y registro (§4). NO enlaza — los documentos
                  definitivos son otra tanda (D-336). */}
              <Text
                style={{
                  marginTop: spacing[1],
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.xs,
                  lineHeight: Math.round(typography.size.xs * typography.leading.normal),
                  color: theme.text.tertiary,
                  textAlign: 'center',
                }}
              >
                {t('bienvenida.legales')}
              </Text>
            </View>
          </Entrada>
        </ScrollView>
      </EvitaTeclado>

      {/* §5 · LA LLEGADA — la huella se completa una vez, sobre el tapiz.
          R53-DECLARADO: NO es un pie fijo — es un overlay de PANTALLA COMPLETA
          (top:0 Y bottom:0) que cubre todo a propósito durante la celebración,
          y la pantalla se desmonta al navegar (460 ms). No hay contenido
          debajo que este `bottom:0` esté tapando: es el umbral, no una barra. */}
      {llegando && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.bg.base,
          }}
        >
          <HuellaDeLlegada tamano={64} />
        </View>
      )}
    </View>
  );
}
