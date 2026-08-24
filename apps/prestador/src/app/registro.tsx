/**
 * REGISTRO DEL PRESTADOR — S80-B1 (D-509 ①, port de registro.tsx del
 * cliente S45). La cuenta nace VACÍA: registrarse no pide permiso a
 * nadie y no abre nada — la curaduría sigue siendo del titular al
 * invitar (crear_empleado_directo) y del handshake (/invitacion).
 * Muere el paso founder-en-Studio para cada empleado de cada negocio.
 *
 * TESIS: "tu cuenta se crea acá, en un paso — y el negocio te suma
 * después."
 * FIRMA (comportamiento, dosis §15b): la cadena de voz que no se corta
 * — el éxito desemboca en la tercera voz del guard ("Tu cuenta está
 * lista", lib/registro-reciente) y el rebote del titular (rebSinCuenta)
 * nombra esta pantalla.
 * CHANEL: los placeholders de nombre/email del cliente murieron (el
 * label ya rotula, Ley 17.6); cero subtítulo; UNA línea de contexto.
 *
 * LAS DOS RUTAS DE SALIDA (lo único que cambia del port — jamás
 * /onboarding/mascota):
 *  · éxito con sesión → marca de recién-registrado + replace('/') — el
 *    guard raíz re-decide y dice "Tu cuenta está lista" (rama sin_rol).
 *  · éxito sin sesión (confirmación de email exigida) → Aviso + /login.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Encabezado,
  Entrada,
  EvitaTeclado,
  Isotipo,
  MarcaDeAgua,
  PaseoDeHuellas,
  spacing,
  Texto,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { MIN_LARGO_CONTRASENA, registrarse, type CodigoErrorAuth } from '@epetplace/api';

import { marcarRegistroReciente } from '@/lib/registro-reciente';
import { useTraduccion } from '@/i18n';

export default function Registro() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<{ email?: string; password?: string }>({});

  const puedeEnviar = nombre.trim().length > 0 && email.trim().length > 0 && password.length > 0;

  async function crearCuenta() {
    if (!puedeEnviar || cargando) return;
    setCargando(true);
    setErrores({});
    const r = await registrarse({
      /* S104-A · contexto OBLIGATORIO: sin él, el prestador quedaba registrado
         con el T&C del CLIENTE. El valor lo sabe el binario, no se infiere. */
      contexto: 'registro_profesional',
      nombre: nombre.trim(),
      email: email.trim(),
      password,
      // El consentimiento viaja con el alta (motor de A). La URL de cada
      // documento la resuelve `URL_LEGAL` en packages/api; la pantalla NO la
      // aporta —versión y URL son el mismo dato y viven juntos (L-166)—.
    });
    setCargando(false);

    if (!r.ok) {
      const enEmail: CodigoErrorAuth[] = ['email_ya_registrado', 'email_invalido'];
      if (enEmail.includes(r.codigo as CodigoErrorAuth)) {
        setErrores({ email: r.mensaje });
      } else if (r.codigo === 'password_debil') {
        setErrores({ password: r.mensaje });
      } else {
        mostrar({ variante: 'error', texto: r.mensaje });
      }
      return;
    }

    if (!r.data.sesion_activa) {
      // el proyecto exige confirmar el correo: el registro gana un paso —
      // la pantalla de código (S104-C, misma mecánica que el cliente). El
      // consentimiento se persiste al confirmar (D-893); la URL la resuelve
      // `URL_LEGAL` en packages/api, no viaja por la pantalla.
      router.replace({ pathname: '/verificar-correo', params: { email: email.trim() } });
      return;
    }
    // la sesión está viva y la cuenta VACÍA: el guard raíz re-decide y
    // la rama sin_rol habla con la tercera voz ("Tu cuenta está lista").
    marcarRegistroReciente(email);
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* El ritual en dosis prestador (§7): senda + isotipo recogido, sin
          respiración ni celebración. */}
      <MarcaDeAgua />
      <PaseoDeHuellas />
      <Encabezado variante="navegacion" titulo={t('registro.titulo')} atras onAtras={() => router.back()} />
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + spacing[2], right: spacing[5] }}>
        <Isotipo size={28} variant="gradiente" />
      </View>
      <EvitaTeclado>
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[6] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* S81-C (composición): tres bloques con aire entre sí —
            contexto · formulario · acción. Antes el gap uniforme [2]
            apelmazaba la línea de contexto contra el primer campo y el
            CTA contra el último: densidad pareja = nada manda. */}
        {/* §5 firmada (S81): los tres bloques de C entran ordenando lectura */}
        <Entrada>
        <Texto variante="apoyo">{t('registro.contexto')}</Texto>
        </Entrada>
        <Entrada orden={1}>
        <View style={{ gap: spacing[2] }}>
          <Campo
            label={t('registro.nombreLabel')}
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />
          <Campo
            label={t('registro.emailLabel')}
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
            /* S88-C (D-659): la regla se importa — acá decía «6» mientras
               recuperar decía «8», cada pantalla con su propia verdad. */
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
        <Entrada orden={2}>
        <View style={{ gap: spacing[3] }}>
          <Boton
            etiqueta={t('registro.crearMiCuenta')}
            bloque
            cargando={cargando}
            deshabilitado={!puedeEnviar}
            onPress={() => void crearCuenta()}
          />
          {/* la línea de términos (§4) — el consentimiento se registra con el
              alta (motor de A). Honesta sin link (D-336). */}
          <Texto variante="apoyo" color="secondary">
            {t('bienvenida.terminos')}
          </Texto>
        </View>
        </Entrada>
      </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
