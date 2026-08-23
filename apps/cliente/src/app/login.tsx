/**
 * Login mínimo (S45-B4) — "Ya tengo cuenta". Al entrar, la ruta raíz
 * decide a dónde va según el estado real (familia o no).
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Encabezado, Entrada, spacing, useAviso, useTheme, EvitaTeclado } from '@epetplace/ui';
import { iniciarSesion } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
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
      <Encabezado variante="navegacion" titulo={t('login.titulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* §5 firmada (S81): el formulario entra ordenando lectura */}
        <Entrada>
        <Campo
          label={t('login.emailLabel')}
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Campo
          label={t('login.passwordLabel')}
          value={password}
          onChangeText={setPassword}
          error={error}
          secure
          autoCapitalize="none"
        />
        </Entrada>
        <Entrada orden={1}>
        <Boton
          etiqueta={t('login.entrar')}
          bloque
          cargando={cargando}
          deshabilitado={!puedeEnviar}
          onPress={() => void entrar()}
        />
        {/* 🔴 S103-C · LA SALIDA QUE FALTABA, Y ES LA QUE MÁS IMPORTA.
            Medido: este login **no ofrecía ninguna** — solo «Entrar».

            **Y `/recuperar` la usa justamente QUIEN NO PUDO ENTRAR:** sin esta
            línea, su única puerta sería Cuenta, alcanzable solo por quien ya
            está adentro. *Una pantalla de recuperación que exige haber
            entrado no recupera nada.*

            **`apoyada` y no un botón con caja:** por 19.7 la superficie ya
            tiene su sólido —«Entrar»— y el resto baja a label. *Darle la
            misma presencia a «olvidé mi contraseña» que a entrar sugeriría
            que las dos son igual de probables.* */}
        <Boton
          variante="apoyada"
          etiqueta={t('login.olvide')}
          bloque
          onPress={() => router.push('/recuperar')}
        />
        </Entrada>
      </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
