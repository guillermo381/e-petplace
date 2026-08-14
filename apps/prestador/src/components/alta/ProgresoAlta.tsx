/**
 * EL CONTADOR DEL WIZARD (S97-C) — la ley de S91, que rige acá por
 * `MODELO_DESPENSA` §8.6bis:
 *
 *   «Narrativa MÁS UN PASO, jamás checklist, y el número tiene que poder
 *    llegar a CERO. Lo que depende de e-PetPlace NO entra al contador.»
 *
 * De ahí salen las dos VOCES, que son dos y no una:
 *  ① `restantes` — lo que falta DE SU PARTE. Llega a cero.
 *  ② `esperaNuestra` — lo que falta DE LA NUESTRA (documentos en
 *     revisión, naturaleza solicitada). **JAMÁS suma al número.**
 *     A lo confirmó midiendo: `solicitada` no habilita nada, así que
 *     contarlo dejaría un contador que el prestador no puede bajar.
 *
 * CHANEL: cero barra de progreso, cero «paso 3 de 4», cero tildes. La
 * estructura solo informa si codifica una verdad (Ley 18) — y el
 * porcentaje de un wizard de cuatro pasos no codifica ninguna.
 */

import { View } from 'react-native';
import { Texto, spacing } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export interface ProgresoAltaProps {
  /** Pasos que le faltan A ÉL. Cero = terminó su parte. */
  restantes: number;
  /** ¿Hay algo esperando revisión NUESTRA? Voz aparte, jamás número. */
  esperaNuestra?: boolean;
}

export function ProgresoAlta({ restantes, esperaNuestra = false }: ProgresoAltaProps) {
  const { t } = useTraduccion();

  const suParte =
    restantes <= 0
      ? t('alta.contadorCero')
      : restantes === 1
        ? t('alta.contadorUno')
        : t('alta.contadorVarios', { n: restantes });

  return (
    <View style={{ gap: spacing[1] }}>
      <Texto variante="apoyo">{suParte}</Texto>
      {esperaNuestra ? <Texto variante="apoyo">{t('alta.esperaNuestra')}</Texto> : null}
    </View>
  );
}
