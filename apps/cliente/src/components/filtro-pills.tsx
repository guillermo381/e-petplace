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
 *
 * ⚠️ r14-2 — LA HILERA SIN GLIFO, Y POR QUÉ NO LLEVA GLIFO TODAVÍA.
 * La orden fue literal: *"dales glifo y la placa rellena en el
 * elegido, como las otras dos hileras"*. El diagnóstico es exacto y la
 * marca se construyó; lo que NO se pudo ejecutar es la mitad del
 * glifo, por dos cosas medidas, no supuestas:
 *  ① EL SET NO EXISTE. Los tres chips son «todos · semana · mes» y en
 *    el registry no hay glifos de VENTANA TEMPORAL (`hoy` ya rotula
 *    "próximos" en la hilera de al lado; `vacaciones` es del prestador).
 *    Repetir UN mismo glifo en los tres es justamente lo que la Ley 12
 *    enmendada prohíbe —el glifo marca lo que VARÍA dentro de la unidad
 *    de barrido— y su corolario nombra este caso con todas las letras:
 *    *"si un set necesita el MISMO glifo repetido por fila, lo que
 *    falta es un set POR TIPO"*.
 *  ② NO PUEDO AUTORARLO DESDE ACÁ. El registry vive en `packages/ui` y
 *    la pista C tiene esa frontera cerrada; además todo glifo nuevo
 *    pasa por §6b (hoja de contacto, 2-3 variantes, gate POR ÍCONO a
 *    21px). Es un arco, no un renglón de esta ronda.
 * LO QUE SE HIZO: la hilera MARCA — el chip elegido se rellena entero
 * y el label invierte (L-b lo permite con 3 hermanos, y la regla queda
 * computada acá para que no mienta si algún día son 4+).
 * LO QUE QUEDA COMO PEDIDO: un set de ventana temporal para B. El día
 * que exista, esta rama se retira y los tres chips entran por la
 * puerta principal — la placa.
 */

import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import {
  AvatarMascota,
  Huella,
  Icono,
  Texto,
  radius,
  spacing,
  typography,
  useTheme,
  type IconoNombre,
} from '@epetplace/ui';

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
        // r14-2 · LA HILERA SIN GLIFO TAMBIÉN MARCA. El founder lo
        // diagnosticó exacto — "sin glifo no hay placa que rellenar" —
        // y sin placa el elegido solo cambiaba el gris del label por
        // tinta: no marcaba. La marca pasa AL CHIP: se rellena entero
        // con el color y el label invierte.
        // ⚠️ LA REGLA VIVE ACÁ, COMPUTADA, no en la cabeza de cada
        // pantalla (mismo criterio que L-b en FiltroMascotas): el
        // relleno pleno solo entra con 3 hermanos o menos. Una hilera
        // sin glifo de 4+ es barrido y cae a elevación + label pleno.
        const sinGlifo = o.icono === null;
        const pleno = elegido && sinGlifo && opciones.length <= 3;
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
              backgroundColor: pleno ? colorPlaca : theme.bg.card,
              boxShadow: elegido && sinGlifo ? theme.elevacion.elevada : theme.elevacion.reposo,
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
            {pleno ? (
              // el label INVIERTE sobre el relleno — mismo token que el
              // chip pleno de mascota, que es su vecino en la pantalla
              <Text
                style={{
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.sm,
                  color: theme.text.onGradient,
                }}
              >
                {o.etiqueta}
              </Text>
            ) : (
              <Texto variante="apoyo" color={elegido ? 'primary' : 'secondary'}>
                {o.etiqueta}
              </Texto>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ═══════════════ EL FILTRO DE MASCOTAS (r12 · el PRIMER filtro) ═══════

/** @override-s82c — LOS CHIPS DE MASCOTA con el rediseño del founder:
 *  reposo = pastilla CLARA con foto y label en tinta · elegido =
 *  RELLENO MAGENTA PLENO con label blanco.
 *
 *  ⚠️ L-b APLICADA, y por eso el relleno no es incondicional: *"el
 *  relleno pleno se reserva a la ELECCIÓN QUE CIERRA; en fila de
 *  barrido (≥4 hermanos comparables) la selección va por elevación,
 *  escala y color de texto"*. Con 2-3 mascotas el pleno es legal y se
 *  usa; **con 4 o más la fila pasa a barrido y el pleno se cae solo** —
 *  la regla vive ACÁ, computada, no en la cabeza de cada pantalla.
 *  Declarado al gate: el caso de 4+ está construido y es verificable
 *  agregando mascotas, no una promesa. */
export function FiltroMascotas({
  mascotas,
  elegida,
  onElegir,
}: {
  mascotas: { id: string; nombre: string; fotoUrl?: string }[];
  /** null = NINGUNA elegida (el log entra sin filtro y muestra todo).
   *  Se LEE porque ningún chip queda activo — r12-11: el chip "Todas"
   *  murió, el comportamiento no. */
  elegida: string | null;
  onElegir: (id: string | null) => void;
}) {
  const { theme } = useTheme();
  // r12-11: sin el chip "Todas", los hermanos comparables son las
  // mascotas y nada más. L-b sigue rigiendo: 4+ pasa a barrido.
  const esBarrido = mascotas.length >= 4;

  const chip = (
    key: string,
    activo: boolean,
    contenido: React.ReactNode,
    onPress: () => void,
    etiqueta: string,
  ) => {
    // pleno SOLO si la fila es corta (L-b); en barrido, elevación +
    // escala + color de texto, jamás relleno
    const pleno = activo && !esBarrido;
    return (
      <Pressable
        key={key}
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={etiqueta}
        style={{
          height: 44,
          borderRadius: radius.full,
          backgroundColor: pleno ? theme.accent.control : theme.bg.card,
          boxShadow: activo ? theme.elevacion.elevada : theme.elevacion.reposo,
          transform: [{ scale: activo && esBarrido ? 1.04 : 1 }],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[2],
          paddingLeft: spacing[1.5],
          paddingRight: spacing[4],
        }}
      >
        {contenido}
      </Pressable>
    );
  };

  const colorLabel = (activo: boolean) => {
    if (!activo) return theme.text.primary;
    return esBarrido ? theme.accent.control : theme.text.onGradient;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing[2.5], paddingHorizontal: spacing[4], paddingVertical: spacing[1] }}
    >
      {mascotas.map((m) =>
        chip(
          m.id,
          elegida === m.id,
          <>
            <AvatarMascota nombre={m.nombre} fotoUrl={m.fotoUrl} tamano="xs" anidadoEn="chip" />
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: colorLabel(elegida === m.id) }}>
              {m.nombre}
            </Text>
          </>,
          () => onElegir(elegida === m.id ? null : m.id),
          m.nombre,
        ),
      )}
    </ScrollView>
  );
}
