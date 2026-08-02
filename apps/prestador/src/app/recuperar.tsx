/**
 * RECUPERAR LA CONTRASEÑA (S84-C23 ②).
 *
 * VIVE FUERA DE LOS TABS, colgada del login — y esa ubicación es la
 * decisión: la usa quien NO PUDO ENTRAR. Una pantalla de recuperación
 * adentro de Cuenta sería alcanzable solo por quien ya no la necesita.
 *
 * ═══ LAS REGLAS QUE NO SE ROMPEN, Y DÓNDE VIVEN ═══
 * · NUNCA se declara si un correo existe. El mismo mensaje exista o no.
 *   Y **no se valida contra la base antes de pedir**: el wrapper no lo
 *   hace a propósito, y si esta pantalla lo hiciera por su cuenta
 *   reintroduciría por la puerta de atrás la fuga que el motor cierra.
 * · `codigo_invalido` cubre "no existe" y "venció" con UNA voz.
 *   Distinguirlas le diría a quien prueba códigos si acertó el formato —
 *   y el remedio del usuario es el mismo en los dos casos: pedir otro.
 * · El rate limit dice CUÁNTO FALTA cuando el servidor lo dice, y calla
 *   el número cuando no. Jamás se inventa.
 *
 * ⚠️ D-628 — EL CORREO LLEGA EN INGLÉS Y DESDE EL REMITENTE DE SUPABASE
 * hasta S86. **Se dice en la pantalla**, y no es cortesía: el silencio
 * acá hace que la persona crea que no llegó, pida otro código y gaste su
 * cupo de 2-3 por hora. Decirlo cuesta una línea; callarlo cuesta el
 * intento siguiente.
 * ☠️ MUERTE: cuando S86 ponga plantilla y remitente propios, esta línea
 * se retira — y su condición está atada a D-628, no suelta.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Encabezado, EvitaTeclado, MarcaDeAgua, Texto, spacing, useAviso, useTheme } from '@epetplace/ui';
import { canjearCodigoRecuperacion, pedirCodigoRecuperacion, segundosDeEspera } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function Recuperar() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();

  /** Dos pasos y no dos pantallas: el correo tiene que seguir visible
   *  cuando se tipea el código — es el dato que dice a dónde mirar. */
  const [paso, setPaso] = useState<'pedir' | 'canjear'>('pedir');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);

  /** El rate limit es el ÚNICO rebote que puede salir al pedir, y NO
   *  habla del correo: habla de quien pide. Por eso su voz nunca puede
   *  leerse como "ese correo tiene algo raro". */
  function vozEspera(mensaje: string): string {
    const s = segundosDeEspera(mensaje);
    return s === null ? t('recuperar.esperaSinNumero') : t('recuperar.esperaConNumero', { s });
  }

  async function pedir() {
    if (trabajando) return;
    setRebote(null);
    setTrabajando(true);
    const r = await pedirCodigoRecuperacion({ email });
    setTrabajando(false);
    if (!r.ok) {
      setRebote(r.codigo === 'demasiados_intentos' ? vozEspera(r.mensaje) : r.mensaje);
      return;
    }
    /* SE PASA AL SEGUNDO PASO EXISTA LA CUENTA O NO — y ése es el punto
       entero. Si la pantalla se quedara acá cuando el correo no existe,
       el propio FLUJO delataría lo que el mensaje calla. La ambigüedad
       tiene que estar en el comportamiento, no solo en las palabras. */
    setPaso('canjear');
  }

  async function canjear() {
    if (trabajando) return;
    setRebote(null);
    setTrabajando(true);
    const r = await canjearCodigoRecuperacion({ email, codigo, nueva });
    setTrabajando(false);
    if (!r.ok) {
      setRebote(r.codigo === 'demasiados_intentos' ? vozEspera(r.mensaje) : r.mensaje);
      return;
    }
    mostrar({ variante: 'exito', texto: t('recuperar.listo') });
    // el canje deja sesión: se entra derecho, sin pedirle que vuelva a
    // escribir la clave que acaba de elegir.
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('recuperar.titulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[8], gap: spacing[2] }}
          keyboardShouldPersistTaps="handled"
        >
          {paso === 'pedir' ? (
            <>
              <Texto variante="apoyo">{t('recuperar.ayudaPedir')}</Texto>
              <Campo
                label={t('recuperar.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {rebote !== null && <Texto variante="apoyo" color="danger">{rebote}</Texto>}
              <View style={{ paddingTop: spacing[4] }}>
                <Boton etiqueta={t('recuperar.pedir')} bloque cargando={trabajando} onPress={() => void pedir()} />
              </View>
            </>
          ) : (
            <>
              {/* LA MISMA FRASE EXISTA O NO LA CUENTA. El condicional está
                  en el "si", no en nuestro conocimiento. */}
              <Texto variante="cuerpo">{t('recuperar.siTieneCuenta', { email })}</Texto>
              {/* D-628 — se dice ANTES de que lo busque, no después de que
                  crea que no llegó. */}
              <Texto variante="apoyo">{t('recuperar.avisoCorreo')}</Texto>

              <Campo
                label={t('recuperar.codigo')}
                value={codigo}
                onChangeText={setCodigo}
                keyboardType="number-pad"
                autoCapitalize="none"
              />
              <Campo
                label={t('recuperar.nueva')}
                value={nueva}
                onChangeText={setNueva}
                secure
                autoCapitalize="none"
                ayuda={t('recuperar.largoMinimo')}
              />
              {rebote !== null && <Texto variante="apoyo" color="danger">{rebote}</Texto>}
              <View style={{ paddingTop: spacing[4], gap: spacing[2] }}>
                <Boton etiqueta={t('recuperar.cambiar')} bloque cargando={trabajando} onPress={() => void canjear()} />
                {/* Pedir otro NO vuelve al paso anterior: el correo ya
                    está bien y volver le haría re-tipearlo. */}
                <Boton
                  variante="secundario"
                  etiqueta={t('recuperar.otroCodigo')}
                  bloque
                  cargando={trabajando}
                  onPress={() => void pedir()}
                />
              </View>
            </>
          )}
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
