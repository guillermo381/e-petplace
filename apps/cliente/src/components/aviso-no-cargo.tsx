/**
 * S115-C · «NO PUDIMOS CARGAR ESTO» — la voz que faltaba cuando algo no vuelve.
 *
 * 🔴 **EL DEFECTO QUE LA PARIÓ, con su literal:** el founder pasó *media hora
 * mirando esqueletos sin saber qué pasaba*. Una consulta salía y no volvía
 * nunca —sin `catch`, sin techo, el `await` colgado— y la pantalla se quedaba
 * cargando para siempre. **A puso los techos** (`D-1070`: ahora el error VUELVE,
 * siempre). *Esto es la otra mitad: que se pueda decir.*
 *
 * **Por qué una pieza y no un texto por pantalla:** son seis superficies de
 * cobro, y la respuesta es la misma en todas. *Seis textos distintos para el
 * mismo hecho es cómo se llega a que una diga «revisá tu conexión» sobre un
 * error del servidor.*
 *
 * 🔴 **UNA SOLA VOZ PARA «no hay red» Y «tardó demasiado», a propósito** (letra
 * de A): desde el lado de la familia son **el mismo hecho** —no cargó, se puede
 * reintentar— y darles dos voces obligaría a cada superficie a manejar dos casos
 * con la misma respuesta.
 *
 * 🔴 **EL REINTENTO ES DEL DEDO, JAMÁS AUTOMÁTICO** (letra de A): *un reintento
 * solo sobre una red mala multiplica las peticiones justo cuando la red no da
 * abasto.*
 *
 * ⚠️ **No dice «sin conexión»** aunque el código sea `sin_red`. No lo sabemos:
 * puede ser el servidor, el túnel o el teléfono. *Afirmar la causa es la clase
 * de precisión que se vuelve mentira en el caso de al lado* — se dice el hecho
 * («no cargó») y la sospecha como sospecha («puede ser la conexión»).
 */
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Texto, spacing } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** Por qué no cargó. 🔴 Son TRES y no uno, porque mandan a mirar lugares
 *  distintos: la red, el refresco de la sesión, o la puerta de entrada.
 *  *Cuatro veces el founder se colgó y el mensaje genérico lo mandó a buscar del
 *  lado equivocado las cuatro.* */
export type MotivoNoCargo = 'red' | 'sesionCortada' | 'sinSesion';

export function AvisoNoCargo({
  onReintentar,
  reintentando = false,
  motivo = 'red',
}: {
  onReintentar: () => void;
  /** 🔴 `sesionCortada` **NO es «te desconectamos»**: es «el refresco no está
   *  volviendo», y **puede revivir sola**. Por eso ese caso ofrece reintentar y
   *  **jamás manda a entrar de nuevo** — *mandar a re-loguear a alguien cuya
   *  sesión va a volver sola le hace perder lo que estaba haciendo por un
   *  problema que se iba a resolver.* `sinSesion` sí manda a entrar: ahí no hay
   *  nada que reconectar. */
  motivo?: MotivoNoCargo;
  /** 🔴 Mientras es true el botón GIRA y el aviso se queda. Sin esto, tocar
   *  reintentar hacía desaparecer todo y dejaba la pantalla vacía hasta el
   *  techo — 8 segundos que se leen como «el botón no hace nada». */
  reintentando?: boolean;
}) {
  const { t } = useTraduccion();
  const router = useRouter();

  /* La voz sale de un mapa EXHAUSTIVO por motivo, no de concatenar: si mañana
     nace un cuarto motivo, el tsc lo exige acá en vez de dejar una key rota en
     pantalla. *(La lección del `identificacion.etiqueta.null`.)* */
  const VOZ: Record<MotivoNoCargo, { titulo: string; detalle: string }> = {
    red: { titulo: t('noCargo.titulo'), detalle: t('noCargo.detalle') },
    sesionCortada: { titulo: t('sesion.cortadaTitulo'), detalle: t('sesion.cortadaDetalle') },
    sinSesion: { titulo: t('sesion.sinSesionTitulo'), detalle: t('sesion.sinSesionDetalle') },
  };
  const voz = VOZ[motivo];

  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ gap: spacing[1] }}>
        <Texto variante="seccion">{voz.titulo}</Texto>
        <Texto variante="apoyo">{voz.detalle}</Texto>
      </View>
      {/* 🔴 Sólo `sinSesion` manda a entrar. Con la sesión CORTADA se ofrece
          reintentar, porque puede volver sola — y el reintento sigue siendo del
          dedo, jamás automático. */}
      {motivo === 'sinSesion' ? (
        <Boton
          variante="secundario"
          etiqueta={t('sesion.entrar')}
          onPress={() => router.replace('/login')}
        />
      ) : (
        <Boton
          variante="secundario"
          etiqueta={t('noCargo.reintentar')}
          cargando={reintentando}
          onPress={onReintentar}
        />
      )}
    </View>
  );
}
