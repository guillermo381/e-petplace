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
  cohorteAnio,
}: {
  nombre: string;
  /** null = sin oficio activo — la línea se omite (jamás se inventa). */
  vozOficio: string | null;
  ciudad: string | null;
  logoUrl: string | null;
  /** S85-C39 · el año de la cohorte. ⏪ Acá decía «Prestador fundador», y el
   *  founder lo rechazó por el ACTO DE HABLA: la firma del negocio OTORGABA
   *  un reconocimiento en vez de decir un hecho. El eje de tiempo dice lo
   *  mismo sin condecorar.
   *  ⚠️ Llega como PROP y no se lee acá: esta pieza no consulta, compone —
   *  y el año sale del dato (`cohorte_anio`), jamás horneado. `null` = la
   *  placa no se monta (regla de existencia). */
  cohorteAnio: number | null;
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
          {/* ⚠️ SIN AÑO LA PLACA NO SE MONTA. El primer intento puso
              `?? 0` y habría pintado «Desde 0»: un valor legal,
              creíble y falso — el defecto de esta sesión en
              miniatura. Un dato ausente no tiene relleno. */}
          {cohorteAnio !== null && (
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
              {t('miCuenta.desde', { anio: cohorteAnio })}
            </Text>
          </View>
          )}
        </View>
      </View>
    </Tarjeta>
  );
}
