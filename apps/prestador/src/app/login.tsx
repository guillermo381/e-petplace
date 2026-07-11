/**
 * LOGIN DEL PRESTADOR — S54-B (D-290): email+contraseña por los
 * wrappers de auth EXISTENTES (S45 — se reusan tal cual, cero social).
 * El registro del prestador es otro ciclo — acá solo se entra.
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
import { Boton, Campo, Encabezado, spacing, useAviso, useTheme } from '@epetplace/ui';
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
      <Encabezado variante="navegacion" titulo={t('login.titulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}
        keyboardShouldPersistTaps="handled"
      >
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
        <Boton
          etiqueta={t('login.entrar')}
          bloque
          cargando={cargando}
          deshabilitado={!puedeEnviar}
          onPress={() => void entrar()}
        />
      </ScrollView>
    </View>
  );
}
