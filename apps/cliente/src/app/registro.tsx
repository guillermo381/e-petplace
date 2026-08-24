/**
 * Registro — LA PUERTA, cara «crear cuenta» (RITUAL §4, S104-C).
 *
 * Mismo esqueleto que el login (tapiz + senda + isotipo recogido + acciones
 * ancladas + huella de llegada), con tres cambios que pide el ritual:
 *  · **tres campos** (nombre · email · password) con su autofill.
 *  · **la línea de términos** al pie (la misma de bienvenida, honesta sin
 *    link — D-336).
 *  · **el consentimiento QUEDA REGISTRADO**: `registrarse()` (motor de A,
 *    tanda 1) escribe el consentimiento tipo `registro` con la URL legal
 *    mostrada — no hay una segunda llamada acá, viaja con el alta. Se le pasa
 *    `urlLegalMostrada` para que quede la traza de QUÉ se mostró.
 *
 * Se conserva entera la lógica del guard local (S88-D): `causaNoEnvia` +
 * `razonDeshabilitado` — la puerta no ofrece la clave corta que el server iba
 * a rebotar, y el toque jamás queda muerto.
 */

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { MIN_LARGO_CONTRASENA, registrarse, type CodigoErrorAuth } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { causaNoEnvia } from '@/lib/registro-guard';

/** La traza del texto legal mostrado. NO es una URL navegable (los
 *  documentos definitivos no existen todavía — D-336): es un marcador
 *  estable de QUÉ vio la persona, para el registro de consentimiento de A. */
const URL_LEGAL = 'terminos-inline-v1';
const ISOTIPO_ESQUINA = 28;

export default function Registro() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const aviso = useAviso();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
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

  async function crearCuenta() {
    if (!puedeEnviar || cargando) return;
    setCargando(true);
    setErrores({});
    const r = await registrarse({
      nombre: nombre.trim(),
      email: email.trim(),
      password,
      // el consentimiento viaja con el alta (motor de A): al crear la cuenta,
      // se registra que se aceptaron los términos, con la traza de qué se vio.
      urlLegalMostrada: URL_LEGAL,
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
      // el proyecto exige confirmar el correo: no hay «llegada» que celebrar
      // porque todavía no se entra — se dice y se vuelve al login.
      setCargando(false);
      aviso.mostrar({ variante: 'neutro', texto: t('registro.correoConfirmacion') });
      router.replace('/login');
      return;
    }
    // §5 · la huella de llegada, y recién ahí el onboarding.
    setLlegando(true);
    setTimeout(() => router.replace('/onboarding'), 460);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <PaseoDeHuellas />

      <Encabezado variante="navegacion" titulo={t('registro.titulo')} atras onAtras={() => router.back()} />
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
              {/* la línea de términos — la misma de bienvenida (§4). */}
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.xs,
                  lineHeight: Math.round(typography.size.xs * typography.leading.normal),
                  color: theme.text.tertiary,
                  textAlign: 'center',
                }}
              >
                {t('bienvenida.legales')}
              </Text>
              <Boton
                variante="ghost"
                etiqueta={t('bienvenida.yaTengoCuenta')}
                bloque
                onPress={() => router.replace('/login')}
              />
            </View>
          </Entrada>
        </ScrollView>
      </EvitaTeclado>

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
          <HuellaDeLlegada tamano={64} />
        </View>
      )}
    </View>
  );
}
