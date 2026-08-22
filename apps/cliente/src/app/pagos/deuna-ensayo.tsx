/**
 * ☠️ **ANDAMIO DE ENSAYO DE LA PANTALLA DEL CÓDIGO DEUNA** — S103-C.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ MUERE ENTERO CUANDO LLEGUE EL `pointOfSale`. No es una pantalla del  │
 * │ producto y nunca lo va a ser.                                        │
 * │                                                                      │
 * │ **Condición de muerte, escrita para que no sobreviva:** el día que   │
 * │ `useEstadoDeUna` llame a la puerta de D, este archivo y `ENSAYO` se  │
 * │ borran en el mismo commit. *Un andamio sin condición de muerte       │
 * │ escrita es una pieza de producción que nadie se anima a tocar.*      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * **Por qué existe:** D midió que el riel está bloqueado por un dato del
 * comercio (16 sondeos → 404 en los 16) ⇒ **no se puede crear ni una
 * transacción**, y sin esto la pantalla del código no se podría mirar hasta
 * que ese dato llegue. *Mirarla antes es lo que permite corregirla antes.*
 *
 * 🔴 **`__DEV__` — NO VIAJA A PREVIEW NI A PRODUCCIÓN.** Es el precedente de
 * la casa para andamios de ensayo (el camino triste del checkout, S54). *El
 * gate de esta pantalla se corre con Metro, que es donde `__DEV__` es true;
 * embarcarla sin guard sería dejar una puerta de ensayo en la app de una
 * familia.*
 *
 * **Cero escrituras:** todo vive en memoria. Compatible con la veda 76(g).
 */

import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Encabezado, EstadoVacio, Tarjeta, Texto, spacing, useTheme } from '@epetplace/ui';

import { EsperaDeUna } from '@/components/espera-deuna';
import { ENSAYO, useEstadoDeUna, type GuionDeEnsayo } from '@/lib/pagos/deuna-estado';
import { urlWhatsApp } from '@/lib/contacto';
import { useTraduccion } from '@/i18n';

const GUIONES = Object.keys(ENSAYO) as GuionDeEnsayo[];

export default function DeUnaEnsayo() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [guion, setGuion] = useState<GuionDeEnsayo>('esperando');
  const { estado, regenerar } = useEstadoDeUna(guion);

  if (!__DEV__) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="—" atras onAtras={() => router.back()} />
        <EstadoVacio registro="pantalla" titulo="—" descripcion="—" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo="Ensayo · código Deuna"
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
        {/* El selector de guion es del ANDAMIO — sin voz de i18n a propósito:
            *una cadena de ensayo en el diccionario es una cadena que alguien
            va a encontrar después y no va a saber si se usa.* */}
        <Tarjeta>
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">Guion</Texto>
            {GUIONES.map((g) => (
              <Boton
                key={g}
                variante={g === guion ? 'primario' : 'secundario'}
                etiqueta={g}
                bloque
                onPress={() => setGuion(g)}
              />
            ))}
          </View>
        </Tarjeta>

        <Tarjeta>
          <EsperaDeUna
            estado={estado}
            onGenerarNuevo={regenerar}
            onSoporte={() => void Linking.openURL(urlWhatsApp(t('cuenta.soporteDesdeCobro')))}
          />
        </Tarjeta>
      </ScrollView>
    </View>
  );
}
