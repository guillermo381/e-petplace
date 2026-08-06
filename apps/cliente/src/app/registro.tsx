/**
 * Registro (S45-B4) — email+password, sin social (decisión B1).
 * Errores del wrapper en voz humana, cada uno en SU campo.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Encabezado, Entrada, spacing, useAviso, useTheme, EvitaTeclado } from '@epetplace/ui';
import { MIN_LARGO_CONTRASENA, registrarse, type CodigoErrorAuth } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { causaNoEnvia } from '@/lib/registro-guard';

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

  // S88-D · EL GUARD LOCAL (Ley 23): la puerta deja de ofrecer la clave
  // corta que el server iba a rebotar. El predicado vive en lib/ para
  // que su par discrimine contra la fuente.
  const causa = causaNoEnvia({ nombre, email, password });
  const puedeEnviar = causa === null;
  // Las DOS capas del apagado (contrato de Boton, S82-B r14 + S63-B
  // «el Confirmar apagado dice QUÉ FALTA, siempre»): la regla del largo
  // ya es VISIBLE en la ayuda del Campo; la razón hace que el toque
  // jamás quede muerto y se anuncia al enfocar. Cada causa su voz —
  // una razón genérica sobre una clave corta sería el mensaje que
  // miente (la familia de D-659 ②).
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
      <EvitaTeclado>
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* §5 firmada (S81): el formulario entra ordenando lectura */}
        <Entrada>
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
          ayuda={t('registro.passwordAyuda', { n: MIN_LARGO_CONTRASENA })}
          value={password}
          onChangeText={setPassword}
          error={errores.password}
          secure
          autoCapitalize="none"
        />
        </Entrada>
        <Entrada orden={1}>
                <Boton
          etiqueta={t('registro.crearMiCuenta')}
          bloque
          cargando={cargando}
          deshabilitado={!puedeEnviar}
          razonDeshabilitado={razon}
          onRazon={() => {
            // La pantalla decide cómo se cuenta (contrato onRazon): la
            // clave corta se señala EN SU CAMPO con la misma voz; los
            // campos vacíos, en aviso — pintarlos de error sin que nadie
            // los haya tocado sería decir «falla» donde hay «todavía no».
            if (causa === 'password_corta') {
              setErrores({ password: t('registro.razonPasswordCorta', { n: MIN_LARGO_CONTRASENA }) });
            } else if (razon !== undefined) {
              aviso.mostrar({ variante: 'neutro', texto: razon });
            }
          }}
          onPress={() => void crearCuenta()}
        />
        </Entrada>
      </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
