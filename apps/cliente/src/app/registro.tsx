/**
 * Registro (S45-B4) — email+password, sin social (decisión B1).
 * Errores del wrapper en voz humana, cada uno en SU campo.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Encabezado, spacing, useAviso, useTheme } from '@epetplace/ui';
import { registrarse, type CodigoErrorAuth } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

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

  const puedeEnviar = nombre.trim().length > 0 && email.trim().length > 0 && password.length > 0;

  async function crearCuenta() {
    if (!puedeEnviar || cargando) return;
    setCargando(true);
    setErrores({});
    const r = await registrarse({ nombre: nombre.trim(), email: email.trim(), password });
    setCargando(false);

    if (!r.ok) {
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
      aviso.mostrar({ variante: 'neutro', texto: t('registro.correoConfirmacion') });
      router.replace('/login');
      return;
    }
    router.replace('/onboarding/mascota');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('registro.titulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}
        keyboardShouldPersistTaps="handled"
      >
        <Campo
          label={t('registro.nombreLabel')}
          placeholder={t('registro.nombrePlaceholder')}
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
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
        />
        <Campo
          label={t('registro.passwordLabel')}
          ayuda={t('registro.passwordAyuda')}
          value={password}
          onChangeText={setPassword}
          error={errores.password}
          secure
          autoCapitalize="none"
        />
        <Boton
          etiqueta={t('registro.crearMiCuenta')}
          bloque
          cargando={cargando}
          deshabilitado={!puedeEnviar}
          onPress={() => void crearCuenta()}
        />
      </ScrollView>
    </View>
  );
}
