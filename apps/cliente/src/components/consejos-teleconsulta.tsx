/**
 * LOS CONSEJOS DE PREPARACIÓN — `LETRA_TELEMEDICINA` §3bis (firma del
 * founder, 26-ago-2026). Obra 3 de la tanda 3.
 *
 * ── 🔴 REGISTRO DE APOYO, JAMÁS DE ALARMA ─────────────────────────────────
 * La letra lo dice con todas las letras y decide la cara de esta pieza:
 * *«no compite con los seis signos de §3, que son la advertencia clínica. Si
 * esto se pintara con la misma cara de urgencia, el dueño no sabría cuál de
 * los dos bloques es el que puede salvarle la vida a su animal.»*
 *
 * ⇒ **`Tarjeta` en reposo, sin `Aviso`, sin color de status, sin ícono de
 * atención.** La diferencia con el aviso de §3 tiene que verse de un
 * vistazo — es información útil, no una advertencia.
 *
 * ── SIN CASILLA Y SIN GATE, POR FIRMA ─────────────────────────────────────
 * *«El consentimiento ya tiene su acto propio (§3 + su casilla, por firma
 * legal): agregar una segunda casilla diluiría la única que importa
 * jurídicamente»* — cuando todo pide confirmación, confirmar deja de
 * significar algo. **Esta pieza no devuelve nada y no frena nada.**
 *
 * ── POR QUÉ ES UNA PIEZA Y NO DOS BLOQUES COPIADOS ────────────────────────
 * Vive en **dos superficies** (§3bis): la confirmación de la reserva —*«un
 * consejo que llega sólo al entrar llega tarde para conseguir wifi»*— y el
 * detalle de la cita antes de entrar —*«uno que llega sólo al reservar se
 * olvida»*—. Copiado dos veces, el día que el founder cambie una palabra
 * habría dos textos distintos diciendo ser el mismo.
 *
 * ── LA TUPLA DE CUATRO ES DELIBERADA ──────────────────────────────────────
 * Precedente de `AvisoTeleconsulta` (B): los signos son una tupla de SEIS
 * para que cinco **no compilen**. Acá igual con los cuatro consejos —
 * *un consejo que se cae en una refactorización no deja síntoma: el bloque
 * se sigue viendo bien con tres.*
 */

import { View } from 'react-native';
import { Tarjeta, Texto, spacing } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** Las cuatro claves de §3bis, en el orden de la letra. */
const CLAVES: readonly [string, string, string, string] = [
  'veterinaria.prepConsejo1',
  'veterinaria.prepConsejo2',
  'veterinaria.prepConsejo3',
  'veterinaria.prepConsejo4',
];

export function ConsejosTeleconsulta() {
  const { t } = useTraduccion();

  return (
    <Tarjeta elevacion="reposo">
      <View style={{ gap: spacing[3] }}>
        <Texto variante="seccion">{t('veterinaria.prepTitulo')}</Texto>
        <View style={{ gap: spacing[2] }}>
          {CLAVES.map((clave) => (
            /* El punto va en su propia columna para que la segunda línea de
               un consejo largo quede alineada con la primera y no debajo del
               punto — con cuatro ítems y frases de dos renglones, sangrar mal
               convierte una lista en un párrafo. */
            <View key={clave} style={{ flexDirection: 'row', gap: spacing[2] }}>
              <Texto variante="apoyo" color="tertiary">
                ·
              </Texto>
              <View style={{ flex: 1 }}>
                <Texto variante="apoyo">{t(clave as never)}</Texto>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Tarjeta>
  );
}
