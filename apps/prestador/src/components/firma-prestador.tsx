/**
 * S79-B (T2-B3): LA FIRMA DE IDENTIDAD — el bloque de §2.4 primera presencia,
 * como componente LOCAL con dos consumidores en esta app (el HOME en modo
 * preparación y, por anatomía, el header de Cuenta que ya existía).
 *
 * Mudanza, no diseño nuevo (cura aprobada por el founder sobre el audit
 * s79b-audit-dia1 §1.3): LogoNegocio + nombre + `oficio · ciudad` + la pill
 * "Prestador fundador". Materiales de ESTA superficie (papel + Tarjeta reposo;
 * el header de Cuenta conserva su muro con vidrio — la anatomía es la misma,
 * el material es de cada casa).
 *
 * La pill informa (Ley 21: píldora) y NO es Insignia: "fundador" no es un
 * estado del expediente — es membresía. bg.overlay + texto secundario, sobria.
 */

import { Text, View } from 'react-native';
import { LogoNegocio, Tarjeta, Texto, radius, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export function FirmaPrestador({
  nombre,
  vozOficio,
  ciudad,
  logoUrl,
}: {
  nombre: string;
  /** null = sin oficio activo — la línea se omite (jamás se inventa). */
  vozOficio: string | null;
  ciudad: string | null;
  logoUrl: string | null;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const sub = [vozOficio, ciudad].filter((x): x is string => x !== null && x.length > 0).join(' · ');

  return (
    <Tarjeta elevacion="reposo">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
        <LogoNegocio nombre={nombre} logoUrl={logoUrl} tamano={56} />
        <View style={{ flex: 1, gap: spacing[1.5] }}>
          <Texto variante="titulo">{nombre}</Texto>
          {sub.length > 0 ? <Texto variante="apoyo">{sub}</Texto> : null}
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: theme.bg.overlay,
              borderRadius: radius.full,
              paddingVertical: spacing[1],
              paddingHorizontal: spacing[3],
            }}
          >
            <Text
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.xs,
                color: theme.text.secondary,
              }}
            >
              {t('miCuenta.fundador')}
            </Text>
          </View>
        </View>
      </View>
    </Tarjeta>
  );
}
