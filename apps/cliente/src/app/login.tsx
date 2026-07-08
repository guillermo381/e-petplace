/**
 * Login mínimo (S45-B4) — "Ya tengo cuenta". Al entrar, la ruta raíz
 * decide a dónde va según el estado real (familia o no).
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Encabezado, spacing, useAviso, useTheme } from '@epetplace/ui';
import { iniciarSesion } from '@epetplace/api';

export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const aviso = useAviso();

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
        aviso.mostrar({ variante: 'error', texto: r.mensaje });
      }
      return;
    }
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo="Iniciar sesión" atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}
        keyboardShouldPersistTaps="handled"
      >
        <Campo
          label="Email"
          placeholder="ej: ana@correo.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Campo
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          error={error}
          secure
          autoCapitalize="none"
        />
        <Boton
          etiqueta="Entrar"
          bloque
          cargando={cargando}
          deshabilitado={!puedeEnviar}
          onPress={() => void entrar()}
        />
      </ScrollView>
    </View>
  );
}
