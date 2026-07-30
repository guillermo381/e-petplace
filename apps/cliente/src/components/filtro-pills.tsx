/**
 * @override-s82c — EL FILTRO DE PILLS SIN CAJA (r4 defecto 4, corrección
 * de arquitectura del founder: §7bis gobierna el DATO, no el CONTROL —
 * un control SE RELLENA o va SIN CAJA, A6 firmada; NUNCA contorno).
 * Extraído de hogar/index cuando el perfil pidió "los mismos filtros"
 * (r5 ítem 6) — regla 37: cero clones.
 *
 * Anatomía: reposo = glifo en trazo + label tinta2, cero borde, cero
 * fondo · elegido = LA PLACA del glifo se rellena (30 de lado,
 * rectángulo suave — Ley 21) con el glifo claro, y el label pasa a
 * tinta plena. Sin glifo (filtros de tiempo), el elegido es el label
 * pleno solo. 44 de alto, 10 de separación, scroll horizontal.
 * OVERRIDE LOCAL del cliente — la promoción es de B, post-gate (R10).
 */

import { Pressable, ScrollView, View } from 'react-native';
import Svg from 'react-native-svg';
import { Huella, Icono, Texto, radius, spacing, useTheme, type IconoNombre } from '@epetplace/ui';

export type OpcionFiltro<C extends string> = {
  codigo: C;
  etiqueta: string;
  /** Glifo del set b′, 'huella' (la primitiva canónica) o null (solo texto). */
  icono: IconoNombre | 'huella' | null;
};

export function FiltroPills<C extends string>({
  opciones,
  activo,
  onCambio,
}: {
  opciones: OpcionFiltro<C>[];
  activo: C;
  onCambio: (c: C) => void;
}) {
  const { theme } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing[2.5], paddingHorizontal: spacing[4] }}
    >
      {opciones.map((o) => {
        const elegido = o.codigo === activo;
        const tintaGlifo = elegido ? theme.bg.card : theme.text.secondary;
        return (
          <Pressable
            key={o.codigo}
            onPress={() => onCambio(o.codigo)}
            accessibilityRole="radio"
            accessibilityState={{ selected: elegido }}
            accessibilityLabel={o.etiqueta}
            style={{
              height: 44,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[2],
              paddingRight: spacing[2],
            }}
          >
            {o.icono !== null ? (
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radius.suave,
                  backgroundColor: elegido ? theme.text.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {o.icono === 'huella' ? (
                  <Svg width={16} height={16} viewBox="0 0 24 24">
                    <Huella color={tintaGlifo} escala={0.85} x={1.8} y={1.8} />
                  </Svg>
                ) : (
                  <Icono nombre={o.icono} tamano={16} registro="tinta" tinta={tintaGlifo} />
                )}
              </View>
            ) : null}
            <Texto variante="apoyo" color={elegido ? 'primary' : 'secondary'}>
              {o.etiqueta}
            </Texto>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
