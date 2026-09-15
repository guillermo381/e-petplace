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
import {
  HojaContenido, Boton, Cabecera, Texto, spacing, useTheme } from '@epetplace/ui';
import { darDeBajaCorreo } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';

export default function Baja() {
  const cabecera = useAltoDeCabecera('empujada');
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
      {/* ⭐ **LA ESTRUCTURA FIRMADA — S116-C lote 3b (precisión del founder).**
          *Migrar no es cambiar `Encabezado` por `Cabecera`.* El ciruela es el
          FONDO —`presentacion="fondo"`: sin radio inferior, sin sombra— y el
          contenido vive en una hoja de lienzo que lo tapa al scrollear. **La
          curva es de la HOJA y mira hacia ARRIBA**; la cabecera-tarjeta con las
          esquinas de abajo redondeadas muere en el cliente.
          ⚠️ **Los `ScrollView` verticales que había adentro se volvieron
          `View`**: la hoja ya scrollea, y dos scrolls verticales anidados
          dejan al de adentro sin alto propio. Su `contentContainerStyle` pasa
          a `style` — *el relleno era del contenido, no del scroll.* El
          `paddingBottom` con `insets.bottom` SE RETIRA: lo paga la hoja
          (`R53`). */}
      <HojaContenido
        arranque={cabecera.arranque}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="empujada" titulo={t('baja.titulo')}
              presentacion="fondo"
            />
          </View>
        }
      >
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
      </HojaContenido>
    </View>
  );
}
