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

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg from 'react-native-svg';
import {
  AvatarMascota,
  Huella,
  Icono,
  Texto,
  motion,
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

/** ⚠️⚠️ LA MARCA DEL ELEGIDO — Y LA CONDICIÓN QUE PUEDE ROMPERLA SOLA.
 *
 *  Existe como COMPONENTE CON NOMBRE por una razón que no es de estilo:
 *  la ley que la gobierna se ve como una decisión de layout, y por eso
 *  se le puso nombre y se mecanizó (R22). Sin nombre, el guard tendría
 *  que vigilar un `<Svg>` anónimo entre otros.
 *
 *  LA LEY (enmienda de Ley 6, S82, firmada — §5 del documento
 *  `2026-07-30-s82-C-ENMIENDA-ley6-para-A.md`):
 *  **LA HUELLA DE MARCA JAMÁS VA ADENTRO DE LA PLACA DEL GLIFO.**
 *
 *  EL PORQUÉ, que es lo que hace invisible al defecto: los glifos b′
 *  CONTIENEN una huella rellena (Ley 12), así que en un chip con glifo
 *  hay DOS huellas. Lo único que las mantiene distinguibles es ESCALA y
 *  AISLAMIENTO — adentro de la placa, a 16px, la huella es un DETALLE
 *  DEL OBJETO; sola, a 13px, al lado del label y FUERA de la placa, es
 *  una MARCA. Meterla adentro no rompe nada visible ni cambia ninguna
 *  ley: simplemente vuelve al caso que S80 midió —una huella entre
 *  huellas, que no puede señalar a ninguna— y (b) deja de leerse sin
 *  que nadie se entere.
 *
 *  Por eso la marca es HERMANA del label, nunca hija de la placa. */
const PATA = 24;
/** Cuánto MONTA el canto. Sale del tamaño, no se tipea suelto (clase
 *  L-159, precedente `SOBRA_ENTIDAD` de SelectorOpcion). */
const MONTA = PATA / 3;

function MarcaElegido({ color }: { color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -MONTA,
        right: -MONTA / 2,
        width: PATA,
        height: PATA,
        // la pata se APOYA, y algo que se apoya casi nunca cae recto:
        // la inclinación es lo que la separa de un símbolo centrado.
        transform: [{ rotate: '-14deg' }],
      }}
    >
      <Svg width={PATA} height={PATA} viewBox="0 0 24 24">
        <Huella color={color} escala={0.95} x={0.6} y={0.6} />
      </Svg>
    </View>
  );
}

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
      // ⚠️ el aire de ARRIBA no es estético: la pata MONTA el canto y un
      // ScrollView recorta a sus bordes. Con paddingTop 4 (lo que había)
      // la pata se cortaba por la mitad. 12 > MONTA(8), con margen.
      contentContainerStyle={{
        gap: spacing[2.5],
        paddingHorizontal: spacing[4],
        paddingTop: spacing[3],
        paddingBottom: spacing[1],
      }}
    >
      {opciones.map((o) => {
        const elegido = o.codigo === activo;
        const colorPlaca =
          o.capa === 'identidad' ? theme.capa.identidad : o.capa === 'cuidado' ? theme.capa.cuidado : theme.text.primary;
        const tintaGlifo = elegido ? theme.bg.card : theme.text.secondary;
        // ☠️ r18 · EL RELLENO PLENO DEL CHIP MURIÓ CON (a). Nació en
        // r14-2 como SUSTITUTO: la hilera sin glifo no tenía placa que
        // rellenar, así que se rellenaba el chip entero. Ahora existe una
        // marca que no depende del glifo —la huella— y el sustituto
        // sobra: dos marcas para un mismo estado es el tercer peso que
        // no informa (Ley 18 + Chanel). Y es el ARGUMENTO DEL FOUNDER
        // aplicado hasta el final: rellenar el chip en tinta también era
        // pedirle prestado un color a un eje que no tiene categoría.
        // Con esto se va también la cuenta de L-b de esta hilera: sin
        // relleno no hay dosis que acotar. (En FiltroMascotas sigue
        // rigiendo — ahí el pleno está firmado y es de ENTIDADES.)
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
              // ✅ r19 · EL CHIP SE HUNDE BAJO LA PATA, POR SLOT. Lo que
              // se hunde NO PROYECTA: pierde la elevación y baja de
              // superficie. La rama por tema que vivía acá MURIÓ con su
              // condición cumplida — `bg.hundido` llegó (S82-B, d1e0e36)
              // y el tema vuelve a decidir lo que es del tema.
              // COTEJADO CONTRA LO QUE LA RAMA RESOLVÍA, no asumido:
              //   claro    slot #EDEBF5 = IDÉNTICO a lo que daba (1.18)
              //   oscuro   slot #050508 = IDÉNTICO a lo que daba (1.05)
              //   memorial slot #141A14 ≠ lo que daba (#0A0E0A, 1.10)
              // ⚠️ EN MEMORIAL EL SLOT NO DA PASO (1.00 — es el MISMO
              // valor que la tarjeta), y se declara en vez de pisarlo:
              // memorial tiene UNA sola superficie a propósito (card,
              // elevated y overlay son el mismo color), así que un hueco
              // por color ahí no existe. El hundimiento en memorial lo
              // cargan la elevación perdida y la escala — que es
              // exactamente cómo memorial dice las cosas (Ley 8: degrada,
              // no celebra). Pisar el slot localmente sería reconstruir
              // la rama que se acaba de retirar.
              backgroundColor: elegido ? theme.bg.hundido : theme.bg.card,
              boxShadow: elegido ? 'none' : theme.elevacion.reposo,
              transform: [{ scale: elegido ? 0.98 : 1 }],
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
            {/* ⚠️ EL LABEL — la nota del chip invisible en oscuro se
                CONSERVA aunque el relleno haya muerto, porque su lección
                sobrevive al código: NO era un negro hardcodeado (sospecha
                del founder, descartada midiendo). El relleno salía bien de
                `text.primary` (tinta POR TEMA); el que mentía era el label
                con `text.onGradient`, blanco en claro Y en oscuro a
                propósito — es el color para texto sobre el gradiente de
                marca. Medido en los tres: claro 16.94 ✓ · oscuro 1.15 ✗ ·
                memorial 1.31 ✗. Si algún día vuelve un relleno de chip, el
                label va en `bg.base` (15.40 / 17.73 / 14.35), jamás en
                onGradient. */}
            <Texto variante="apoyo" color={elegido ? 'primary' : 'secondary'}>
              {o.etiqueta}
            </Texto>
            {/* (b) LA MARCA DEL ELEGIDO — HERMANA DEL LABEL, JAMÁS HIJA
                DE LA PLACA. Su posición es la ley, no el layout: ver el
                bloque de `MarcaElegido` y R22 en verify-diseno. */}
            {elegido ? <MarcaElegido color={theme.accent.control} /> : null}
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
  marca = 'ley',
}: {
  mascotas: { id: string; nombre: string; fotoUrl?: string }[];
  /** null = NINGUNA elegida (el log entra sin filtro y muestra todo).
   *  Se LEE porque ningún chip queda activo — r12-11: el chip "Todas"
   *  murió, el comportamiento no. */
  elegida: string | null;
  onElegir: (id: string | null) => void;
  /** 🔬 r36 · ANDAMIO DE GATE, muere con la firma. `'ley'` = lo que hay
   *  hoy (los tres canales de L-b). `'huella'` = la propuesta: la huella
   *  marca POR PRESENCIA, como el founder firmó en los filtros de tu
   *  vida. NO rompe L-b — la ley prohíbe el RELLENO PLENO con 4+
   *  hermanos, no marcar por forma. */
  marca?: 'ley' | 'huella' | 'pata';
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
          // con la PATA el chip CEDE: lo que se hunde no proyecta —
          // pierde la elevación y baja al slot `bg.hundido` (el que B
          // construyó en d1e0e36), y se achica en vez de crecer.
          backgroundColor: marca === 'pata' && activo ? theme.bg.hundido : pleno ? theme.accent.control : theme.bg.card,
          boxShadow:
            marca === 'pata' && activo ? 'none' : activo ? theme.elevacion.elevada : theme.elevacion.reposo,
          transform: [
            { scale: marca === 'pata' && activo ? 0.98 : activo && esBarrido ? 1.04 : 1 },
          ],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[2],
          paddingLeft: spacing[1.5],
          paddingRight: spacing[4],
        }}
      >
        {contenido}
        {/* la huella como MARCA DE PRESENCIA: aparece SOLO en la elegida,
            que es lo único que la vuelve señal (el veredicto de S80 midió
            que la huella en TODAS no puede señalar a una). */}
        {marca === 'huella' && activo ? (
          <Svg width={13} height={13} viewBox="0 0 24 24">
            <Huella color={theme.accent.control} escala={0.9} x={1.2} y={1.2} />
          </Svg>
        ) : null}
        {/* (c) LA PATA SOBRE EL CANTO — la MISMA pieza de FiltroPills, no
            una copia: montada arriba-derecha, montando el canto, en
            magenta. R22 la sigue vigilando por nombre. */}
        {marca === 'pata' && activo ? <MarcaElegido color={theme.accent.control} /> : null}
      </Pressable>
    );
  };

  const colorLabel = (activo: boolean) => {
    if (!activo) return theme.text.primary;
    // S82-B r22 — el token POR ROL: el fondo de acá es el magenta de
    // control (accent.control / controlLleno), NO el gradiente de marca.
    // Funcionaba por COINCIDENCIA DE VALOR (onGradient resuelve a blanco
    // y el magenta es oscuro), jamás por contrato. `sobreControlLleno` no
    // vive en memorial a propósito (ahí el chip degrada), de ahí el
    // narrowing con su fallback.
    return esBarrido ? theme.accent.control : ('sobreControlLleno' in theme.accent ? (theme.accent as { sobreControlLleno: string }).sobreControlLleno : theme.text.onGradient);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // ⚠️ el aire de ARRIBA no es estético: la pata MONTA el canto y un
      // ScrollView recorta a sus bordes. Con paddingTop 4 (lo que había)
      // la pata se cortaba por la mitad. 12 > MONTA(8), con margen.
      contentContainerStyle={{
        gap: spacing[2.5],
        paddingHorizontal: spacing[4],
        paddingTop: spacing[3],
        paddingBottom: spacing[1],
      }}
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
