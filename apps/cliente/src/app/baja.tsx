/**
 * DARSE DE BAJA de los correos — en un clic (S104-C, motor de A).
 *
 * Vive en el RAÍZ (fuera de tabs), como `/recuperar`: se abre desde el enlace
 * del pie de un correo, SIN sesión y SIN login. `darDeBajaCorreo` tiene grant a
 * anon a propósito.
 *
 * 🔴 CONTESTA LO MISMO SIEMPRE, exista o no el token (firma A): distinguir
 * "dado de baja" de "token inválido" le confirmaría a un extraño que ese correo
 * tiene una invitación viva — un oráculo de tokens. Por eso el resultado del
 * wrapper se IGNORA: se toca y se dice "listo", en los dos casos.
 *
 * TESIS: "no te volvemos a escribir — un toque y listo."
 */

import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Encabezado, Texto, spacing, useTheme } from '@epetplace/ui';
import { darDeBajaCorreo } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function Baja() {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  // el token viaja en `?t=` — se lee sin desestructurar `t` (colisiona con el
  // traductor). Ausente = string vacío: el wrapper responde igual y la
  // pantalla dice lo mismo (nunca un oráculo).
  const params = useLocalSearchParams<{ t?: string }>();
  const token = typeof params.t === 'string' ? params.t : '';

  const [estado, setEstado] = useState<'pregunta' | 'trabajando' | 'listo'>('pregunta');

  async function darDeBaja() {
    if (estado === 'trabajando' || estado === 'listo') return;
    setEstado('trabajando');
    // El resultado se IGNORA a propósito: la pantalla dice "listo" exista o no
    // el token (ver cabecera). `void` para no ramificar por el ok.
    await darDeBajaCorreo(token);
    setEstado('listo');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('baja.titulo')} />
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: spacing[4],
          paddingHorizontal: spacing[5],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        {estado === 'listo' ? (
          <Texto variante="cuerpo">{t('baja.listo')}</Texto>
        ) : (
          <>
            <Texto variante="cuerpo">{t('baja.cuerpo')}</Texto>
            <Boton
              variante="destructivo"
              etiqueta={t('baja.confirmar')}
              bloque
              cargando={estado === 'trabajando'}
              onPress={() => void darDeBaja()}
            />
          </>
        )}
      </View>
    </View>
  );
}
