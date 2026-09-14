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
      {/* ⭐ **S116-C lote 10 · LA ONDA SALE DE LA HOJA — recorrido 4 del
          founder: *«va FUERA de la hoja: montala en la raíz de la pantalla,
          hermana de la hoja, no dentro de su pie ni de ningún contenedor con
          relleno»*.

          🔴 **LO QUE EL SLOT DE PIE LE HACÍA, medido en `PieFijo:135`:** con
          `material='lienzo'` (el default) el pie envuelve a su hijo en
          `paddingHorizontal: spacing[5]` + `paddingTop` + `paddingBottom` **y
          un `backgroundColor: theme.bg.base`**. ⇒ la onda quedaba **metida
          20 dp hacia adentro por cada lado y con una franja de lienzo detrás**:
          *el magenta no llegaba al filo de la pantalla, que es exactamente lo
          que la pieza dice que tiene que hacer* («el magenta tiene que llegar
          al filo… lo que no puede quedar debajo de la barra es el CONTENIDO»,
          `OndaAcceso:185`).

          ⏪ **Y esto REVIERTE mi lote 3i, que la había movido al pie.** Lo
          digo entero porque entonces escribí que con eso *«muere mi excepción
          de R53»*: la excepción vuelve, y vuelve **declarada**. La razón por
          la que R53 existe —*un consumidor que TECLEA el alto de un pie*— **no
          aplica acá**: el número es `ALTO_ONDA_ACCESO`, la constante que la
          propia pieza exporta para esto. *Lo que R53 mató fue un `96`
          tecleado; esto es el alto que la pieza publica.*

          ⚠️ **Va FUERA de `EvitaTeclado` a propósito**: es decoración, no un
          control. Con el teclado arriba se queda en el borde de la pantalla y
          el teclado la tapa — *subirla con el teclado le robaría al formulario
          los 156 dp que la persona necesita justo cuando está escribiendo*.

          R53-DECLARADO: no es un pie de controles sino una banda decorativa
          que TIENE que sangrar hasta el filo, y su reserva no es una
          estimación: es `ALTO_ONDA_ACCESO`, el alto que la propia pieza
          exporta. Nada tocable vive debajo de ella. */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        <OndaAcceso frase={[t('registro.ondaA'), t('registro.ondaB')]} lado="izq" />
      </View>


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
