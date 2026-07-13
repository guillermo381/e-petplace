/**
 * ESPEJO DE LA OFERTA DE GROOMING — "Así lo ve el dueño" (S59-B5).
 * La MISMA firma de comportamiento que el espejo del paseo: UNA
 * composición para el taller (vivo, sobre el BORRADOR) y el resumen
 * (verdad de DB). Dice LOS 6 PRECIOS + el extra + las duraciones
 * (mandato FASE 2): una línea por servicio activo con sus tres tallas,
 * su línea de duraciones, el extra si existe y los días.
 *
 * Componente propio (no se fuerza espejo-oferta: sus datos son de otro
 * dominio); presentacional puro sobre Tarjeta + tipografía, dosis baja.
 */

import { Text, View } from 'react-native';
import { Tarjeta, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export interface ServicioEspejoGrooming {
  /** Voz humana del servicio ("Baño" / "Baño y corte"). */
  nombre: string;
  /** Los TRES precios en orden S·M·L, ya formateados con su talla corta. */
  tallas: string;
  /** Las TRES duraciones en orden S·M·L ("45 · 60 · 75"). */
  duraciones: string;
}

export interface DatosEspejoGrooming {
  servicios: ServicioEspejoGrooming[];
  /** El extra por pelaje largo ya formateado ($) — null = sin extra. */
  extra: string | null;
  /** Nombres de los días con franjas activas, en orden de display. */
  dias: string[];
}

// 'a, b y c' — join manual por idioma (Intl.ListFormat no está garantizado
// en Hermes; el conector viaja por el riel).
function juntar(items: string[], y: string): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} ${y} ${items[items.length - 1]}`;
}

export function EspejoGrooming({ datos }: { datos: DatosEspejoGrooming }) {
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const estiloLinea = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.leading.normal,
    color: theme.text.secondary,
  } as const;

  const lineas: string[] = [];
  for (const s of datos.servicios) {
    lineas.push(t('ofertaGrooming.espejoServicio', { nombre: s.nombre, tallas: s.tallas }));
    lineas.push(t('ofertaGrooming.espejoDuraciones', { lista: s.duraciones }));
  }
  if (lineas.length > 0) {
    if (datos.extra !== null) lineas.push(t('ofertaGrooming.espejoExtra', { monto: datos.extra }));
    if (datos.dias.length > 0) {
      lineas.push(t('ofertaPaseo.espejoDias', { lista: juntar(datos.dias, t('ofertaPaseo.espejoY')) }));
    } else {
      lineas.push(t('ofertaPaseo.espejoSinDias'));
    }
  }

  return (
    <View style={{ gap: spacing[3] }}>
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.md,
          color: theme.text.primary,
        }}
      >
        {t('ofertaPaseo.espejoTitulo')}
      </Text>
      <Tarjeta>
        {lineas.length === 0 ? (
          <Text style={estiloLinea}>{t('ofertaPaseo.espejoNada')}</Text>
        ) : (
          <View style={{ gap: spacing[2] }}>
            {lineas.map((linea, i) => (
              <Text key={`${i}-${linea}`} style={estiloLinea}>
                {linea}
              </Text>
            ))}
          </View>
        )}
      </Tarjeta>
    </View>
  );
}
