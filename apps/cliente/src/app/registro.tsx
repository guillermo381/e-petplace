/**
 * Registro — LA PUERTA, cara «crear cuenta» (RITUAL §4, S104-C).
 *
 * Mismo esqueleto que el login (tapiz + senda + isotipo recogido + acciones
 * ancladas + huella de llegada), con tres cambios que pide el ritual:
 *  · **tres campos** (nombre · email · password) con su autofill.
 *  · **la línea de términos** al pie (la misma de bienvenida, honesta sin
 *    link — D-336).
 *  · **el consentimiento QUEDA REGISTRADO**: `registrarse()` (motor de A)
 *    escribe el consentimiento tipo `registro` — no hay una segunda llamada
 *    acá, viaja con el alta. La URL de cada documento la resuelve `URL_LEGAL`
 *    en packages/api (S104-A); la pantalla NO la aporta —versión y URL son el
 *    mismo dato y viven juntos, para que no puedan divergir (L-166)—.
 *
 * Se conserva entera la lógica del guard local (S88-D): `causaNoEnvia` +
 * `razonDeshabilitado` — la puerta no ofrece la clave corta que el server iba
 * a rebotar, y el toque jamás queda muerto.
 */

import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  BotonMarcaAjena,
  Cabecera,
  Campo,
  Entrada,
  EvitaTeclado,
  HojaContenido,
  EsperaDeMarca,
  LogoV5,
  OndaAcceso,
  ALTO_ONDA_ACCESO,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { correoARuta, correoDeRuta } from '../lib/auth/correo-en-ruta';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';
import { MIN_LARGO_CONTRASENA, registrarse, type CodigoErrorAuth } from '@epetplace/api';

import { entrarConGoogle } from '@/lib/auth/entrar-con-google';
import { useTraduccion } from '@/i18n';
import { causaNoEnvia } from '@/lib/registro-guard';
import { destinoDeVuelta } from '@/lib/volver-a';


export default function Registro() {
  const router = useRouter();
  /* §4.1 — «si toco adoptar, no me pidas nada más: vuelvo exactamente a donde
     estaba». La intención se declaró ANTES de la cuenta, y `replace` borra la
     pila: viaja como dato o se pierde. `null` = el camino de siempre. */
  const params = useLocalSearchParams();
  const volverA = destinoDeVuelta(params.volverA);
  /* ⭐ **EL CORREO VUELVE PUESTO desde 05b** (`¿Correo equivocado?`): quien se
     equivocó en una letra la corrige, en vez de escribirlo entero de nuevo.
     *Mandar a alguien de vuelta a un formulario vacío es cobrarle su propio
     error dos veces.* */
  const emailDeVuelta = correoDeRuta(params.email);
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const cabecera = useAltoDeCabecera('empujada');
  const aviso = useAviso();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(emailDeVuelta);
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [errores, setErrores] = useState<{ email?: string; password?: string }>({});
  const [llegando, setLlegando] = useState(false);

  const causa = causaNoEnvia({ nombre, email, password });
  const puedeEnviar = causa === null;
  const razon =
    causa === 'campos_vacios'
      ? t('registro.razonCampos')
      : causa === 'password_corta'
        ? t('registro.razonPasswordCorta', { n: MIN_LARGO_CONTRASENA })
        : undefined;

  /* ⭐ **GOOGLE TAMBIÉN CREA CUENTA — S116-C lote 3b.**
     Es el MISMO acto que en 03 y por eso llama a la misma lib: *Google no
     distingue entrar de registrarse*, y el wrapper lo dice en su contrato
     (*«si es la primera vez, es un alta y el wrapper registra el
     consentimiento»*). El guard del raíz decide después si va al onboarding
     o al Hogar.
     ⚠️ **APPLE NO SE MONTA**, y sigue siendo la decisión correcta: su motor
     no existe en `packages/api` (medido) — *un botón de marca ajena que no
     entra a ningún lado es peor que su ausencia*. */
  async function conGoogle() {
    if (cargandoGoogle || cargando) return;
    setCargandoGoogle(true);
    const r = await entrarConGoogle();
    if (r.tipo !== 'entro') {
      setCargandoGoogle(false);
      if (r.tipo === 'cancelado') return;
      aviso.mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setLlegando(true);
    setTimeout(
      () =>
        router.replace(
          /* 🪦 `D-1101`: antes iba a `/onboarding`, la bifurcación. Hoy la
             cuenta sin familia ve el HOGAR, que ya ofrece adopción primero y
             la invitación a registrar después. */
          volverA === null ? '/hogar' : { pathname: '/hogar', params: { volverA } },
        ),
      460,
    );
  }

  async function crearCuenta() {
    if (!puedeEnviar || cargando) return;
    setCargando(true);
    setErrores({});
    const r = await registrarse({
      /* S104-A · contexto OBLIGATORIO: sin él, el prestador quedaba registrado
         con el T&C del CLIENTE. El valor lo sabe el binario, no se infiere. */
      contexto: 'registro',
      nombre: nombre.trim(),
      email: email.trim(),
      password,
      // El consentimiento viaja con el alta (motor de A). La URL de cada
      // documento la resuelve `URL_LEGAL` en packages/api (S104-A); la pantalla
      // NO la aporta —versión y URL son el mismo dato y viven juntos (L-166)—.
    });

    if (!r.ok) {
      setCargando(false);
      const enEmail: CodigoErrorAuth[] = ['email_ya_registrado', 'email_invalido'];
      if (enEmail.includes(r.codigo as CodigoErrorAuth)) {
        setErrores({ email: r.mensaje });
      } else if (r.codigo === 'password_debil') {
        setErrores({ password: r.mensaje });
      } else {
        aviso.mostrar({ variante: 'error', texto: r.mensaje });
      }
      return;
    }

    if (!r.data.sesion_activa) {
      // el proyecto exige confirmar el correo: el registro gana un paso —
      // la pantalla de código (S104-C). El consentimiento NO se pudo escribir
      // en el alta (sin sesión) y se persiste al confirmar (D-893); la URL la
      // resuelve `URL_LEGAL` en packages/api, no viaja por la pantalla.
      setCargando(false);
      router.replace({
        pathname: '/verificar-correo',
        /* El destino VIAJA con el correo: la confirmación es un paso más del
           mismo camino, y perder la intención ahí sería perderla igual. */
        params: { email: correoARuta(email.trim()), ...(volverA === null ? {} : { volverA }) },
      });
      return;
    }
    // §5 · la huella de llegada, y recién ahí el hogar.
    setLlegando(true);
    setTimeout(
      () =>
        router.replace(
          /* 🪦 `D-1101`: antes iba a `/onboarding`, la bifurcación. Hoy la
             cuenta sin familia ve el HOGAR, que ya ofrece adopción primero y
             la invitación a registrar después. */
          volverA === null ? '/hogar' : { pathname: '/hogar', params: { volverA } },
        ),
      460,
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* ☠️ **MUEREN `MarcaDeAgua`, `PaseoDeHuellas` Y EL ISOTIPO DE ESQUINA**
          (S116-C lote 3). La revisión de mesa los nombró como ruido en el
          Hogar —*«los círculos decorativos translúcidos y la marca de agua del
          isotipo… el sketch no los tiene»*— y del isotipo fino dijo que *«no
          se reconoce»*. La razón alcanza igual acá: son las mismas piezas
          haciendo lo mismo. La identidad la pone la cabecera. */}
      {/* ⭐ **LA ESTRUCTURA NUEVA — S116-C lote 3g.** Ciruela de FONDO, el
          contenido en una hoja del lienzo que desliza encima.
          🔴 Esta pantalla **deja de pagar `insets.bottom`**: lo paga la hoja
          (`R53`). */}
      <EvitaTeclado>
        <HojaContenido
          arranque={cabecera.arranque}
          fondo={
            <View onLayout={cabecera.alMedir}>
              <Cabecera
                variante="empujada"
                presentacion="fondo"
                titulo={t('registro.saludo')}
                apoyo={t('registro.apoyo')}
                onVolver={() => router.back()}
                etiquetaVolver={t('registro.volver')}
              />
              {/* ⭐ `LogoV5 tamano="portada"`. **Sobre el CIRUELA por medición:**
                  `logo.png` —el de fondo claro— tiene fondo blanco horneado
                  (esquina RGBA 255,255,255,**255**, contra alfa **0** en los
                  dos isotipos) y sobre el lienzo dibuja una caja blanca.
                  Pedido a B. */}
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
              flexGrow: 1,
              padding: spacing[5],
              gap: spacing[6],
              /* ⭐ EL AIRE DE LA ONDA. Va DESPUÉS de `padding` para pisarle
                 el lado de abajo, y sale de `ALTO_ONDA_ACCESO` — la constante
                 que la pieza exporta, jamás un número medido a ojo. Es lo que
                 deja «Crear mi cuenta» y el botón de Google ENTEROS sobre la ola. */
              paddingBottom: ALTO_ONDA_ACCESO,
            }}
          >
          <Entrada>
            <View style={{ gap: spacing[2] }}>
              <Campo
                label={t('registro.nombreLabel')}
                placeholder={t('registro.nombrePlaceholder')}
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
              <Campo
                label={t('registro.emailLabel')}
                placeholder={t('registro.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                error={errores.email}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="username"
              />
              <Campo
                label={t('registro.passwordLabel')}
                ayuda={t('registro.passwordAyuda', { n: MIN_LARGO_CONTRASENA })}
                value={password}
                onChangeText={setPassword}
                error={errores.password}
                secure
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
            </View>
          </Entrada>

          <View style={{ flex: 1 }} />

          <Entrada orden={1}>
            <View style={{ gap: spacing[3] }}>
              <Boton
                etiqueta={t('registro.crearMiCuenta')}
                bloque
                cargando={cargando}
                deshabilitado={!puedeEnviar}
                razonDeshabilitado={razon}
                onRazon={() => {
                  if (causa === 'password_corta') {
                    setErrores({ password: t('registro.razonPasswordCorta', { n: MIN_LARGO_CONTRASENA }) });
                  } else if (razon !== undefined) {
                    aviso.mostrar({ variante: 'neutro', texto: razon });
                  }
                }}
                onPress={() => void crearCuenta()}
              />
              {/* ⭐ **LA FILA SOCIAL — sólo Google, y en texto.**
                  El antetítulo lo separa del camino de arriba (son dos
                  formas de lo mismo, no dos acciones compitiendo).
                  ✅ **Con el asset oficial** (`BotonMarcaAjena`): Google
                  entrega el botón entero —tipografía, caja y padding—, así
                  que no hay nada que componer. Apple se monta igual y **no
                  dibuja nada** hasta que exista su asset. */}
              <Texto variante="antetitulo" centrado>
                {t('registro.oRegistrateCon')}
              </Texto>
              <BotonMarcaAjena
                marca="google"
                etiqueta={t('login.conGoogle')}
                onPress={() => void conGoogle()}
              />
              {/* Apple se monta igual: sin asset la pieza devuelve `null`. */}
              <BotonMarcaAjena
                marca="apple"
                etiqueta={t('login.conApple')}
                onPress={() => void conGoogle()}
              />

              {/* La línea de términos — la misma de 01. **Pasa de `Text` con
                  estilo a mano a la pieza `Texto`**: la casa tiene una sola
                  forma de escribir y esta línea se había quedado afuera.
                  ⚠️ **Sigue SIN enlaces tocables (`D-336`)**: el encargo los
                  pide y las páginas legales existen (`/legales/[codigo]`), pero
                  **partir esta frase en tres nodos tocables es estructura, no
                  copy** — y la fila social de esta misma pantalla ya está
                  esperando pieza. Va al buzón con las otras dos. */}
              <Texto variante="apoyo" color="tertiary">
                {t('bienvenida.legales')}
              </Texto>
              <Boton
                variante="ghost"
                etiqueta={t('bienvenida.yaTengoCuenta')}
                bloque
                onPress={() => router.replace('/login')}
              />
            </View>
          </Entrada>
          </View>
        </HojaContenido>
      </EvitaTeclado>
      {/* ⭐ **S116-C lote 11 · LA ONDA SE MONTA PELADA — mi envoltorio MUERE.**

          ⏪ En el lote 10 la saqué del slot `pie` y la colgué de un `View`
          absoluto propio, con su `R53-DECLARADO` al lado. **B se llevó esa
          geometría ADENTRO de la pieza en su lote 13** — `position:'absolute'`,
          `bottom:0`, ancho de PANTALLA por `useWindowDimensions`, `zIndex: 2`,
          cero margen y cero radio — y con eso mi envoltorio deja de ayudar y
          pasa a estorbar: **un absoluto se ancla al padding box de su padre**,
          así que la onda quedaría anclada a mi `View` (alto 0) en vez de a la
          pantalla, que es justo el defecto que la mudanza vino a matar.

          🔴 **Y muere también mi excepción de `R53`, esta vez de verdad**: ya no
          hay ningún `position:'absolute' + bottom:0` escrito por esta pantalla.
          *Lo escribí dos veces — en el 3i y en el 10 — y las dos fue falso; lo
          que faltaba no era mi declaración: era que la pieza se plantara sola.*

          ⚠️ **Lo que SÍ sigue siendo mío es la RESERVA**, y B la volvió
          obligatoria al no ocupar lugar en el flujo: el `paddingBottom` de
          `ALTO_ONDA_ACCESO` de arriba es lo único que deja «Crear mi cuenta» y el botón
          de Google enteros sobre la ola. */}
      <OndaAcceso frase={[t('registro.ondaA'), t('registro.ondaB')]} lado="izq" />


      {/* R53-DECLARADO: NO es un pie fijo — es el overlay de LLEGADA a pantalla
          completa (top:0 Y bottom:0); cubre todo durante la celebración y la
          pantalla se desmonta al navegar. Nada debajo que reservar. */}
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
          {/* ⭐ **S116-C lote 10 · LA PATA SALE, ENTRA LA NARIZ.** Recorrido 4:
              *«al entrar con correo y contraseña aparece una pata mientras
              carga: es la espera vieja. Que sea `EsperaDeMarca`»*.

              🔴 **Y EL CENSO CONTESTÓ TRES, NO UNA.** `HuellaDeLlegada` vivía en
              `login`, `registro` y `recuperar` — las TRES pantallas de acceso,
              el mismo instante en las tres. *Curar sólo la que el founder vio
              habría dejado dos caminos de entrada con otra espera, y esa es la
              clase de divergencia que nadie descubre hasta que alguien recorre
              el tercero.*

              ⚠️ **`HuellaDeLlegada` queda con CERO consumidores** y no la mato yo:
              es de `packages/ui`. Va al buzón. */}
          <EsperaDeMarca tamano={64} />
        </View>
      )}
    </View>
  );
}
