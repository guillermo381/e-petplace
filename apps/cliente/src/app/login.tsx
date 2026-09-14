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

import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import {
  ALTO_ONDA_ACCESO,
  Boton,
  BotonMarcaAjena,
  Cabecera,
  Campo,
  Entrada,
  EvitaTeclado,
  HojaContenido,
  HuellaDeLlegada,
  LogoV5,
  OndaAcceso,
  Separador,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { correoARuta } from '../lib/auth/correo-en-ruta';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';
import { iniciarSesion } from '@epetplace/api';
import { entrarConGoogle } from '@/lib/auth/entrar-con-google';

import { useTraduccion } from '@/i18n';
import { ADOPCION_ALCANZABLE } from '@/lib/gate-adopcion';

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

/** Deep link de vuelta del OAuth. `cliente://**` ya está en el uri_allow_list
 *  del proyecto (medido por A). No necesita ruta: `openAuthSessionAsync` lo
 *  intercepta, no navega la app. */

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
  const cabecera = useAltoDeCabecera('empujada');
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
      /* 🔴 **EL CORREO SIN CONFIRMAR TIENE CAMINO — S116-C lote 3e.**
         ⏪ Acá se pintaba el mensaje *«Falta confirmar tu email. Revisa tu
         correo.»* **y nada más**: la persona quedaba en el login, con una
         instrucción y sin ningún lugar a donde ir. Es la Ley 17.5 al revés —
         *un estado que dice qué pasa y no ofrece el acto que lo resuelve*.

         La pantalla del código EXISTE y sabe reenviar; lo único que faltaba
         era llevarla ahí. **Y el correo viaja por la frontera** (`correoARuta`)
         porque uno con `+` llega roto si se pasa crudo. */
      if (r.codigo === 'email_no_confirmado') {
        setCargando(false);
        router.push({
          pathname: '/verificar-correo',
          params: { email: correoARuta(email.trim()) },
        });
        return;
      }
      if (r.codigo === 'credenciales_invalidas') {
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

  /* ⭐ **EL ACTO VIVE EN `lib/auth/entrar-con-google`** (S116-C lote 3b) —
     el mismo para esta puerta y para la de crear cuenta. *Google no
     distingue entrar de registrarse*, así que copiarlo en la otra pantalla
     habría creado dos caminos de alta con dos consentimientos que pueden
     divergir sin que nada falle. */
  async function conGoogle() {
    if (cargandoGoogle || cargando) return;
    setCargandoGoogle(true);
    setError(undefined);
    const r = await entrarConGoogle();
    if (r.tipo !== 'entro') {
      setCargandoGoogle(false);
      /* Cancelar NO es un error: es una decisión, y no lleva alerta roja. */
      if (r.tipo === 'cancelado') return;
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
      {/* ⭐ **LA ESTRUCTURA NUEVA — S116-C lote 3g.** El ciruela deja de ser
          una tarjeta y pasa a ser el FONDO; el contenido vive en una hoja del
          lienzo apoyada encima, que desliza. Lo monta `HojaContenido`.

          ⚠️ **`EvitaTeclado` envuelve a la hoja, no al revés**: la hoja trae
          su propio `ScrollView` y anidar dos rompe el gesto.

          🔴 **Y ESTA PANTALLA DEJA DE PAGAR `insets.bottom`** — lo paga la
          hoja (`paddingBottom: insets.bottom + spacing[6]`, en su render).
          *Sumarlo acá lo pagaría dos veces, y es justo lo que `R53` vigila.* */}
      <EvitaTeclado>
        <HojaContenido
          arranque={cabecera.arranque}
          fondo={
            <View onLayout={cabecera.alMedir}>
              <Cabecera
                variante="empujada"
                presentacion="fondo"
                titulo={t('login.saludo')}
                apoyo={t('login.apoyo')}
                onVolver={() => router.back()}
                etiquetaVolver={t('login.volver')}
              />
              {/* ⭐ **`LogoV5 tamano="portada"` — S116-C lote 3g.**
                  Es identidad, así que queda fuera de la contabilidad de dosis
                  (Ley 4).

                  🔴 **VA SOBRE EL CIRUELA Y NO DENTRO DE LA HOJA, y es una
                  MEDICIÓN, no una preferencia:** el asset `logo.png` —el de
                  fondo claro— tiene **fondo blanco horneado** (su esquina mide
                  RGBA 255,255,255,**255**, contra alfa **0** en los dos
                  isotipos). Puesto sobre el lienzo dibuja **una caja blanca
                  alrededor de la marca**: visto en el emulador. Sobre ciruela
                  rige `logo-sobre-oscuro.png`, que sí es transparente.
                  *Es la misma cura del fondo del logo que ya se hizo para el
                  isotipo y que a este asset no llegó* — pedido a B; el día que
                  entre, esto puede moverse adentro de la hoja si la mesa lo
                  prefiere. */}
              <View style={{ alignItems: 'center', paddingBottom: spacing[5] }}>
                <LogoV5 sobre="oscuro" tamano="portada" />
              </View>
            </View>
          }
          scroll={{
            contentContainerStyle: { flexGrow: 1 },
            keyboardShouldPersistTaps: 'handled',
          }}
        >
          <View
            style={{
              padding: spacing[5],
              gap: spacing[6],
              flexGrow: 1,
              /* 🔴 **EL LUGAR DE LA ONDA, reservado por la pantalla.**
                 `ALTO_ONDA_ACCESO` es lo que la pieza ocupa de punta a punta
                 (banda + ola) y se exporta justo para esto: la onda va
                 ABSOLUTA al pie, así que **no empuja el contenido** — sin este
                 hueco, lo último de la hoja queda debajo de ella. *Y el número
                 no se teclea: se pide.* */
              paddingBottom: ALTO_ONDA_ACCESO,
            }}
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
              {/* 🔴 **EL CTA DE ENTRAR — RESTAURADO. Lo borré yo, y es el peor
                  defecto de este lote.**

                  Vivía acá desde siempre y **desapareció en `5fc07ee4`** (mi
                  lote 3), al montar la fila social: saqué el bloque viejo de
                  botones y traje sólo los de marca ajena. Consecuencia:
                  **nadie podía entrar con correo y contraseña** — la acción
                  principal de la pantalla de entrar.

                  ⚠️ **Y sobrevivió TRES lotes con capturas de 03 en la hoja.**
                  Por qué no se vio: cada verificación en el aparato **creaba
                  una cuenta nueva**, así que el camino que se recorría era
                  05 → 05b, jamás 03 → entrar. *La pantalla se fotografió tres
                  veces y nadie la usó para lo que existe* — el hueco se veía
                  en la captura como un espacio vacío y se leía como aire.

                  Lo encontró el recorrido de HOY, y sólo porque hizo falta
                  entrar con una cuenta que ya existía. *Ningún gate lo podía
                  ver: un botón que falta no rompe el typecheck, no dispara
                  `verify:diseno`, y deja una pantalla que se ve tranquila.* */}
              <Boton
                etiqueta={t('login.entrar')}
                bloque
                cargando={cargando}
                deshabilitado={!puedeEnviar}
                razonDeshabilitado={t('login.faltanDatos')}
                onPress={() => void entrar()}
              />
              {/* ⭐ **`BotonMarcaAjena` — S116-C lote 3d.** El asset oficial de
                  Google trae su tipografía, su caja y su padding: *no hay nada
                  que componer, y componerlo sería redibujar marca ajena*.
                  ⚠️ **Se escala, no se estira**: el contenedor puede ser de
                  ancho completo; el botón va centrado adentro con su relación
                  fija — un `width:'100%'` deformaría la tipografía de Google,
                  que sus guidelines prohíben.
                  🔴 **Apple se monta IGUAL y sin `if`** (firma de la mesa):
                  sin asset la pieza devuelve `null`, así que hoy **no dibuja
                  nada**. *Un `{appleListo && …}` serían dos pantallas donde
                  alguien se olvida de sacarlo el día que exista; montándolo,
                  se enciende solo.* */}
              <BotonMarcaAjena
                marca="google"
                etiqueta={t('login.conGoogle')}
                onPress={() => void conGoogle()}
              />
              <BotonMarcaAjena
                marca="apple"
                etiqueta={t('login.conApple')}
                onPress={() => void conGoogle()}
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

              {/* ═══ LA PUERTA 2 DE §4 · VER SIN CUENTA ════════════════════
                  §4, literal: *«Sin cuenta: desde el login hay una puerta a ver
                  mascotas en adopción.»* Es el camino de quien llegó por una
                  foto y **todavía no quiere una cuenta** — al que ya se
                  registró no hay que convencerlo.

                  🔴 **Va DEBAJO de los legales y separada, no como cuarto
                  botón:** las tres de arriba son acciones de CUENTA (entrar,
                  entrar con Google, recuperar) y ésta no lo es. *Apilada con
                  ellas se leería como una cuarta forma de identificarse, que es
                  lo contrario de lo que ofrece.*

                  ✅ **Y se cableó recién cuando las CARAS cargan.** La función
                  aceptaba `anon` desde antes, pero el bucket seguía cerrado: la
                  vidriera habría compilado y mostrado **una grilla de huellas
                  grises**, que es exactamente el «inventario» que §4 prohíbe.
                  *Entregada y montada son dos hechos distintos, y acá la
                  diferencia era la promesa entera.* La policy de A la resolvió
                  mirando la MASCOTA y no la carpeta. */}
              {/* 🔴 **DETRÁS DEL MISMO INTERRUPTOR QUE TODO EL VERTICAL**, y esto
                  es una cura: la puerta viajaba VIVA con `ADOPCION_ALCANZABLE`
                  en `false`, así que el flag decía «adopción no es alcanzable» y
                  el login la ofrecía igual. Lo midió E con un grep en cero sobre
                  este archivo.
                  *Un flag que apaga tres puertas de cuatro no apaga nada: apaga
                  las que alguien se acordó de atar* — y es exactamente lo que
                  `gate-adopcion` dice de sí mismo («dos interruptores para la
                  misma puerta terminan en distinto estado»). Acá no eran dos
                  interruptores: era una puerta sin ninguno. */}
              {ADOPCION_ALCANZABLE ? (
                <>
                  <Separador />
                  <Boton
                    variante="ghost"
                    etiqueta={t('login.verAdopcion')}
                    bloque
                    onPress={() => router.push('/adoptar')}
                  />
                </>
              ) : null}
            </View>
          </Entrada>
          </View>
        </HojaContenido>
      </EvitaTeclado>

      {/* R53-DECLARADO: el alto NO se estima — `OndaAcceso` exporta
          `ALTO_ONDA_ACCESO` (banda + ola) y es exactamente ese número el que la
          hoja reserva arriba. `PantallaConPie` no aplica acá: trae su PROPIO
          `ScrollView` y `HojaContenido` ya tiene uno, así que son alternativas
          y no se componen. Pedido a B: que `HojaContenido` gane slot de pie con
          medición propia, y esta declaración muere. */}
      {/* ⭐ **`OndaAcceso` — S116-C lote 3h.** Va ABSOLUTA al pie y FUERA de
          `EvitaTeclado`: **la pieza se cuida sola del teclado** (alto fijo para
          no aplastarse + fundido para no verse salir), y meterla adentro la
          haría subir con el contenido, que es lo contrario de lo que la orden
          pide. Su lugar en la hoja lo reserva `paddingBottom`, arriba. */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <OndaAcceso frase={[t('login.ondaA'), t('login.ondaB')]} lado="der" />
      </View>

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
