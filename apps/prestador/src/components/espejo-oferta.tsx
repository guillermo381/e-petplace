/**
 * ESPEJO DE LA OFERTA — "Así lo ve el dueño" (S58-B B1b, adenda founder).
 * UNA composición para las dos superficies que la usan: el taller (vivo,
 * sobre el BORRADOR — la firma de comportamiento: responde a cada ajuste)
 * y el resumen (sobre la verdad de DB). Recibe DATOS, deriva las voces —
 * así el taller y el resumen jamás riman distinto.
 *
 * Presentacional puro sobre primitivas canónicas (Tarjeta + tipografía).
 * Dosis prestador: cero acento de capa; la voz es el material.
 */

import { Text, View } from 'react-native';
import { Tarjeta, Texto, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export interface DatosEspejoOferta {
  /** Etiquetas cortas de las duraciones que el dueño VE (activas y con precio). */
  duraciones: string[];
  /** El precio más bajo entre ellas — el "desde" del dueño. */
  desde: number | null;
  conPlan: boolean;
  conPaquete: boolean;
  /** Nombres de los días con franjas activas, en orden de display. */
  dias: string[];
}

function monto(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

// 'a, b y c' — join manual por idioma (Intl.ListFormat no está garantizado
// en Hermes; el conector viaja por el riel).
function juntar(items: string[], y: string): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} ${y} ${items[items.length - 1]}`;
}

export function EspejoOferta({ datos }: { datos: DatosEspejoOferta }) {
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const estiloLinea = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.leading.normal,
    color: theme.text.secondary,
  } as const;

  const lineas: string[] = [];
  if (datos.duraciones.length > 0 && datos.desde !== null) {
    lineas.push(
      t('ofertaPaseo.espejoDuraciones', {
        lista: juntar(datos.duraciones, t('ofertaPaseo.espejoY')),
        precio: monto(datos.desde),
      }),
    );
    if (datos.conPlan && datos.conPaquete) lineas.push(t('ofertaPaseo.conPlanYPaquete'));
    else if (datos.conPlan) lineas.push(t('ofertaPaseo.conPlan'));
    else if (datos.conPaquete) lineas.push(t('ofertaPaseo.conPaquete'));
    if (datos.dias.length > 0) {
      lineas.push(t('ofertaPaseo.espejoDias', { lista: juntar(datos.dias, t('ofertaPaseo.espejoY')) }));
    } else {
      lineas.push(t('ofertaPaseo.espejoSinDias'));
    }
  }

  return (
    <View style={{ gap: spacing[3] }}>
      <Texto variante="seccion">
        {t('ofertaPaseo.espejoTitulo')}
      </Texto>
      <Tarjeta>
        {lineas.length === 0 ? (
          <Text style={estiloLinea}>{t('ofertaPaseo.espejoNada')}</Text>
        ) : (
          <View style={{ gap: spacing[2] }}>
            {lineas.map((linea) => (
              <Text key={linea} style={estiloLinea}>
                {linea}
              </Text>
            ))}
          </View>
        )}
      </Tarjeta>
    </View>
  );
}
