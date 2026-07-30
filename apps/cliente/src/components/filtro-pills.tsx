/**
 * @override-s82c — EL FILTRO DE PILLS (r6 — CORRECCIÓN del founder
 * sobre la r4, declarada como tal: el chip NO va sin caja — lleva
 * contenedor RELLENO suave con la placa del glifo adentro. "A6 mata el
 * CONTORNO, no el relleno; R13 caza borderWidth, no background").
 * La imagen del acuerdo es el png de los filtros (cotejo al gate; esta
 * anatomía sale del literal r6).
 *
 * Anatomía: chip = píldora RELLENA (papel de tarjeta sobre el fondo de
 * la casa — para separarse en claro lleva la elevación de reposo, y el
 * consumidor la APOYA EN EL FONDO, jamás dentro de una Tarjeta) · placa
 * del glifo 30 rectángulo suave adentro. Reposo: placa TENUE
 * (bg.overlay) + glifo en trazo secundario + label gris. Elegido: la
 * placa se rellena con el color de su CATEGORÍA (Ley 10; sin categoría
 * — todo/tiempo — tinta) + glifo INVERTIDO (papel) + label pleno.
 * NUNCA contorno. 44 de alto, 10 de separación, scroll horizontal.
 * Los dos temas salen de los tokens del tema.
 *
 * Compartido por hogar/tu-vida y perfil/su-historia (regla 37 — cero
 * clones). OVERRIDE LOCAL del cliente: la promoción es de B, post-gate
 * (R10 vigila el marcador).
 */

import { Pressable, ScrollView, View } from 'react-native';
import Svg from 'react-native-svg';
import { Huella, Icono, Texto, radius, spacing, useTheme, type IconoNombre } from '@epetplace/ui';

export type OpcionFiltro<C extends string> = {
  codigo: C;
  etiqueta: string;
  /** Glifo del set b′, 'huella' (la primitiva canónica) o null (solo texto). */
  icono: IconoNombre | 'huella' | null;
  /** La CATEGORÍA del filtro (Ley 10) — pinta la placa del elegido;
   *  null (todo / tiempo) = tinta. */
  capa?: 'identidad' | 'cuidado' | null;
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
      contentContainerStyle={{ gap: spacing[2.5], paddingHorizontal: spacing[4], paddingVertical: spacing[1] }}
    >
      {opciones.map((o) => {
        const elegido = o.codigo === activo;
        const colorPlaca =
          o.capa === 'identidad' ? theme.capa.identidad : o.capa === 'cuidado' ? theme.capa.cuidado : theme.text.primary;
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
              borderRadius: radius.full,
              backgroundColor: theme.bg.card,
              boxShadow: theme.elevacion.reposo,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[2],
              paddingLeft: o.icono !== null ? spacing[1.5] : spacing[4],
              paddingRight: spacing[4],
            }}
          >
            {o.icono !== null ? (
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radius.suave,
                  backgroundColor: elegido ? colorPlaca : theme.bg.overlay,
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
