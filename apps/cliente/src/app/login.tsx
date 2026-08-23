/**
 * Login mínimo (S45-B4) — "Ya tengo cuenta". Al entrar, la ruta raíz
 * decide a dónde va según el estado real (familia o no).
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Encabezado, Entrada, MarcaDeAgua, spacing, useAviso, useTheme, EvitaTeclado } from '@epetplace/ui';
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
      {/* ── S104-B · LA MARCA ENTRA SIN OCUPAR LUGAR ────────────────────
          Medido antes de montarla: `MarcaDeAgua` tenía **70 consumidores en
          el prestador y UNO en el cliente** (`recuperar.tsx`). Ésa —y no el
          color del CTA— es la causa medida de que login y registro "parezcan
          de otro producto": son las dos únicas pantallas del arco de entrada
          **sin una sola marca encima**, entre una bienvenida con isotipo en
          gradiente y un Hogar con techo de marca.
          Es el isotipo al 4 %, quieto, `pointerEvents="none"`: cero frames,
          cero costo, y degrada solo en memorial desde la fuente. */}
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('login.titulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
      {/* ── S104-B · EL AIRE ES LA JERARQUÍA (Ley 18) ───────────────────
          ⏪ Esto era `gap: spacing[2]` uniforme, y los dos botones quedaban
          **pegados sin un píxel entre ellos** (eran hermanos dentro del
          mismo `<Entrada>`, que no aporta gap: el 8 de arriba separaba
          bloques, no botones).

          🔴 **La cura no se inventó acá: se copió del prestador**, que la
          tiene desde S81-C con su porqué escrito — *«antes todo iba a gap
          uniforme [2] y el CTA quedaba pegado al último campo: nada
          mandaba»*. **El cliente era la versión anterior a esa cura**: se
          hizo, se firmó y nunca cruzó el espejo. *Una cura que vive en una
          sola mitad de un espejo es media cura.*

          La forma: `spacing[6]` (24) ENTRE bloques · `spacing[2]` (8)
          DENTRO de cada uno. El formulario y la acción son dos cosas. */}
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[6] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* §5 firmada (S81): el formulario entra ordenando lectura */}
        <Entrada>
        <View style={{ gap: spacing[2] }}>
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
        {/* 🔴 S103-C · LA SALIDA QUE FALTABA, Y ES LA QUE MÁS IMPORTA.
            Medido: este login **no ofrecía ninguna** — solo «Entrar».

            **Y `/recuperar` la usa justamente QUIEN NO PUDO ENTRAR:** sin esta
            línea, su única puerta sería Cuenta, alcanzable solo por quien ya
            está adentro. *Una pantalla de recuperación que exige haber
            entrado no recupera nada.*

            **`apoyada` y no un botón con caja:** por 19.7 la superficie ya
            tiene su sólido —«Entrar»— y el resto baja a label. *Darle la
            misma presencia a «olvidé mi contraseña» que a entrar sugeriría
            que las dos son igual de probables.*

            🔴 **S104-B — EL COMENTARIO DE ARRIBA DECÍA LA LEY Y LA LÍNEA DE
            ABAJO LA DESOBEDECÍA.** Invocaba la 19.7 (*«el resto baja a
            label»*) y montaba `variante="apoyada"`, que **no es un label: es
            una superficie tonal llena con elevación** (`accent.apoyada` +
            `elevacion.reposo`). En pantalla se leía como una segunda caja
            compitiendo con «Entrar» — el founder lo reportó exactamente así.

            La variante correcta ya existía y el prestador ya la usa acá
            mismo: **`ghost`** (`fondo: 'transparent'`). *No hizo falta
            construir nada: hizo falta montar la que la ley pedía.*
            ⚠️ Y el modo de falla vale anotarlo: **un comentario que cita la
            ley correcta no frena a nadie** — la 19.7 estaba escrita cuatro
            líneas arriba del incumplimiento y sobrevivió así desde S103.
            Lo que frena es R63 y sus hermanas, no la prosa (L-396). */}
        <Boton
          variante="ghost"
          etiqueta={t('login.olvide')}
          bloque
          onPress={() => router.push('/recuperar')}
        />
        </View>
        </Entrada>
      </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
