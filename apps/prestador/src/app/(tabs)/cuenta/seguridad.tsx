/**
 * Cuenta · SEGURIDAD — cambiar la contraseña (S84-C23 ①).
 *
 * Vive DENTRO de Cuenta porque la usa quien YA está adentro. Su gemela
 * —recuperar— vive en el LOGIN, y esa separación no es de composición:
 * es de estado. Quien puede entrar cambia; quien no puede, recupera.
 *
 * PIDE LA ACTUAL, y no es fricción de formulario: el wrapper
 * RE-AUTENTICA con ella antes de escribir. Un teléfono desbloqueado y
 * abierto no debería alcanzar para cambiarle la clave a alguien.
 *
 * ⚠️ LAS OCHO CUENTAS SOLO-GOOGLE (`sin_contrasena`) SON EL CASO QUE MÁS
 * CUIDADO PIDE, y por eso su voz es la única que no comparte tono con
 * ningún otro rebote: a alguien que NO TIENE contraseña decirle "la
 * contraseña no coincide" es mandarlo a probar variantes de algo que no
 * existe. Se le dice que entra con Google — y se le ofrece el camino de
 * recuperación, que **sí le sirve**: canjear un código deja una clave
 * establecida donde no había ninguna. El rebote termina en una salida,
 * no en una pared.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Encabezado, EvitaTeclado, MarcaDeAgua, Texto, spacing, useAviso, useTheme } from '@epetplace/ui';
import { cambiarContrasena, segundosDeEspera } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function Seguridad() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [guardando, setGuardando] = useState(false);
  /** El rebote se muestra EN LA PANTALLA y no solo en un toast: los de
   *  seguridad hay que poder releerlos, y un toast se va. */
  const [rebote, setRebote] = useState<{ texto: string; salida: 'recuperar' | null } | null>(null);

  async function guardar() {
    if (guardando) return;
    setRebote(null);
    setGuardando(true);
    const r = await cambiarContrasena({ actual, nueva });
    setGuardando(false);
    if (!r.ok) {
      if (r.codigo === 'sin_contrasena') {
        // la única que termina en una SALIDA, no en una pared
        setRebote({ texto: t('seguridad.soloGoogle'), salida: 'recuperar' });
        return;
      }
      if (r.codigo === 'demasiados_intentos') {
        /* EL RATE LIMIT DICE CUÁNTO FALTA CUANDO SE SABE, y cuando no,
           calla el número en vez de inventarlo. Y la voz deja claro que
           ESPERAR ES LA ACCIÓN — si se leyera como falla nuestra, el
           prestador seguiría reintentando y gastaría el cupo que le
           queda. */
        const s = segundosDeEspera(r.mensaje);
        setRebote({
          texto: s === null ? t('seguridad.esperaSinNumero') : t('seguridad.esperaConNumero', { s }),
          salida: null,
        });
        return;
      }
      setRebote({ texto: r.mensaje, salida: null });
      return;
    }
    mostrar({ variante: 'exito', texto: t('seguridad.listo'), });
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('seguridad.titulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[8], gap: spacing[2] }}
          keyboardShouldPersistTaps="handled"
        >
          <Texto variante="apoyo">{t('seguridad.ayuda')}</Texto>

          <Campo
            label={t('seguridad.actual')}
            value={actual}
            onChangeText={setActual}
            secure
            autoCapitalize="none"
          />
          <Campo
            label={t('seguridad.nueva')}
            value={nueva}
            onChangeText={setNueva}
            secure
            autoCapitalize="none"
            ayuda={t('seguridad.largoMinimo')}
          />

          {rebote !== null && (
            <View style={{ gap: spacing[2], paddingTop: spacing[1] }}>
              <Texto variante="apoyo" color="danger">{rebote.texto}</Texto>
              {rebote.salida === 'recuperar' && (
                <View style={{ alignSelf: 'flex-start' }}>
                  <Boton
                    variante="secundario"
                    etiqueta={t('seguridad.irARecuperar')}
                    onPress={() => router.push('/recuperar')}
                  />
                </View>
              )}
            </View>
          )}

          <View style={{ paddingTop: spacing[4] }}>
            <Boton etiqueta={t('seguridad.cambiar')} bloque cargando={guardando} onPress={() => void guardar()} />
          </View>
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
