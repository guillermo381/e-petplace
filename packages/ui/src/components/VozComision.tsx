/**
 * VozComision — la comisión visible donde se pone el precio (S68-B,
 * FINANCIERO regla 7.15: el % es DATO leído de fee_configs, jamás
 * hardcode; el neto se dice EN VIVO junto al precio que se está
 * eligiendo).
 *
 * Sube a packages/ui desde sus DOS copias byte-idénticas (taller del
 * paseo y taller del grooming — la tercera copia quedó prohibida en el
 * pedido S68-B; el taller de veterinaria es su tercer consumidor y el
 * del adiestramiento paga D-412 con ella).
 *
 * Presentacional pura:
 *   · pct === null    → "No pudimos leer la comisión vigente." (Ley 13:
 *     el dato que falta se dice, jamás se inventa un 0%).
 *   · precio === null → solo el % retenido (aún no hay precio elegido).
 *   · ambos           → % + neto exacto en vivo.
 * Sin tokens nuevos ni pares WCAG nuevos (text.secondary existente).
 * Memorial no degrada nada: es texto secundario, sin celebración.
 */

import { Text } from 'react-native';

import { typography } from '../tokens/typography';
import { useTheme } from '../ThemeProvider';
import { useTraduccionUi } from '../i18n';

export interface VozComisionProps {
  /** Porcentaje vigente leído de fee_configs — null si no se pudo leer. */
  pct: number | null;
  /** Precio elegido en el borrador — null si todavía no hay precio. */
  precio: number | null;
}

export function VozComision({ pct, precio }: VozComisionProps) {
  const { theme } = useTheme();
  const { t } = useTraduccionUi();
  const texto =
    pct === null
      ? t('vozComision.noDisponible')
      : precio === null
        ? t('vozComision.retiene', { pct })
        : t('vozComision.neto', { pct, neto: `$${(precio * (1 - pct / 100)).toFixed(2)}` });
  return (
    <Text
      style={{
        fontFamily: typography.family.sans.regular,
        fontSize: typography.size.sm,
        lineHeight: typography.size.sm * typography.leading.normal,
        color: theme.text.secondary,
      }}
    >
      {texto}
    </Text>
  );
}
