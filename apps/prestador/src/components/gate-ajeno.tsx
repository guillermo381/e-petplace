/**
 * S87-C (LÁMINA BARRA DE TRES §3): LA PUERTA QUE HABLA — la superficie que
 * responde cuando un NO-GESTOR llega a una ruta de gestión.
 *
 * ⭐ POR QUÉ EXISTE, y es la mitad que faltaba de la lámina: hasta hoy los
 * cinco consumidores del gate hacían `<Redirect>` MUDO — el no-gestor tocaba
 * un link y aparecía en otra pantalla sin que nadie le dijera por qué.
 * §3 lo prohíbe con letra: «JAMÁS pantalla vacía · JAMÁS error mudo — un
 * rebote silencioso a Hoy deja a la persona creyendo que tocó mal».
 *
 * LA DISTINCIÓN QUE ORDENA ESTO (§3 contra §1, y conviene no perderla):
 * en la PORTADA el candado DESAPARECE, porque ese lugar es de la persona;
 * en una ruta a la que NAVEGÓ el candado HABLA, porque preguntó algo
 * concreto y merece respuesta. *Un candado en un lugar de paso informa; un
 * candado en la portada define.*
 *
 * Es L-178 y su mitad L-182 aplicadas juntas: un dato faltante jamás se
 * disfraza de permiso denegado, **y un permiso denegado jamás se disfraza
 * de dato faltante**.
 *
 * Hermana de `GateRoto`: misma anatomía (peldaño-0, EstadoVacio + camino),
 * distinta causa. GateRoto = «no pudimos decidir» (con reintento, porque
 * reintentar puede curar). GateAjeno = «decidimos, y no es tuyo» — SIN
 * reintento: no hay nada que recargar, y ofrecerlo insinuaría que con
 * suerte abre.
 */

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, EstadoVacio, spacing, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export function GateAjeno() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
      <EstadoVacio
        titulo={t('gateAjeno.titulo')}
        accion={
          <Boton
            variante="secundario"
            etiqueta={t('gateAjeno.volver')}
            /* Cero callejón (patrón GateRoto): si hay pila, se vuelve; si
               llegó por deep link SIN pila, se reemplaza por su casa —
               jamás un back que no existe. */
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          />
        }
      />
    </View>
  );
}
