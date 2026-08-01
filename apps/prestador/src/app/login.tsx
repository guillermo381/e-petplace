/**
 * LOGIN DEL PRESTADOR — S54-B (D-290): email+contraseña por los
 * wrappers de auth EXISTENTES (S45 — se reusan tal cual, cero social).
 * S80-B1 (D-509 ①): el registro dejó de ser otro ciclo — /registro
 * existe y la entrada vive acá (ghost bajo "Entrar").
 *
 * Patrón heredado del cliente S45: errores de credenciales/confirmación
 * inline en el campo; el resto por Aviso. Al entrar, replace('/') y el
 * guard del raíz decide por estado REAL (negocio → HOY; sin negocio →
 * estado honesto). Dosis baja (test 7): CTA en tinta, cero gradiente.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Encabezado, Entrada, EvitaTeclado, MarcaDeAgua, spacing, useAviso, useTheme } from '@epetplace/ui';
import { iniciarSesion } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const puedeEnviar = email.trim().length > 0 && password.length > 0;

  async function entrar() {
    if (!puedeEnviar || cargando) return;
    setCargando(true);
    setError(undefined);
    const r = await iniciarSesion({ email: email.trim(), password });
    setCargando(false);

    if (!r.ok) {
      if (r.codigo === 'credenciales_invalidas' || r.codigo === 'email_no_confirmado') {
        setError(r.mensaje);
      } else {
        mostrar({ variante: 'error', texto: r.mensaje });
      }
      return;
    }
    // el guard del raíz re-decide con la sesión nueva (7.5: estado real)
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('login.titulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[6] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* S81-C (composición): el FORMULARIO y la ACCIÓN son dos
            bloques — antes todo iba a gap uniforme [2] y el CTA quedaba
            pegado al último campo: nada mandaba. El aire entre bloques
            es la jerarquía (Ley 18: tipografía y aire, no más cajas). */}
        {/* §5 firmada (S81): los dos bloques de C entran ordenando lectura */}
        <Entrada>
        <View style={{ gap: spacing[2] }}>
          <Campo
            label={t('login.email')}
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Campo
            label={t('login.password')}
            value={password}
            onChangeText={setPassword}
            error={error}
            secure
            autoCapitalize="none"
          />
        </View>
        </Entrada>
        <Entrada orden={1}>
        <View style={{ gap: spacing[2] }}>
          <Boton
            etiqueta={t('login.entrar')}
            bloque
            cargando={cargando}
            deshabilitado={!puedeEnviar}
            onPress={() => void entrar()}
          />
          {/* S80-B1 (D-509 ①): la entrada al registro — espejo del par
              primario+ghost de la bienvenida. El empleado al que le
              dijeron "registrate" llega acá por "Ingresar" y encuentra
              el camino a un toque. */}
          <Boton
            variante="ghost"
            etiqueta={t('login.crearCuenta')}
            bloque
            onPress={() => router.push('/registro')}
          />
        </View>
        </Entrada>
      </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
