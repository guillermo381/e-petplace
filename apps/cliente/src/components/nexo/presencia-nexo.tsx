/**
 * ⭐ NEXO — LA PRESENCIA (S113-C · lote 0). *La burbuja de pendientes deja de
 * ser una burbuja: es Nexo.*
 *
 * Vive en el shell, **una sola vez**, encima de la barra de pestañas, en todas
 * las pestañas del cliente. Cerrada no ocupa nada; abierta toma la pantalla
 * —que es la única forma de que un toque afuera la cierre—. La anatomía es
 * **copia declarada de `BurbujaPendientes`**, la pieza que reemplaza: mismo
 * overlay, mismo captador debajo de las opciones, mismo `aireInferior` medido
 * por el shell. *Se copia la receta que ya funciona en vez de inventar otra*
 * (`L-175`).
 *
 * ── POR QUÉ ESTA PIEZA VIVE EN `apps/` Y NO EN `packages/ui` ────────────────
 * Porque **es composición del shell, no una primitiva**: sabe de clases, de
 * destinos y de atajos, que son del cliente. Lo de marca —la `Huella`, el
 * gradiente firma— lo **consume** de `@epetplace/ui` y no lo redibuja: la
 * huella canónica se importa, jamás se copia (`DIRECCION_ARTE` §2.2).
 *
 * ── LA PATA TIENE TRES DEDOS Y ACÁ SE ABANICAN CUATRO ATAJOS ───────────────
 * No es contradicción: **el dibujo no se toca**. Los cuatro atajos son
 * pastillas abanicadas —en orden de pata, de izquierda a derecha— y la
 * almohadilla es la quinta, pegada al disco, que es donde está en una pata de
 * verdad. *La anatomía ordena la composición; no obliga a redibujar la marca.*
 *
 * ── LOS ARCOS ──────────────────────────────────────────────────────────────
 * **Uno por clase VIVA**, cada uno con su tinte. `avisos` es el violeta — y
 * hoy no se dibuja nunca, porque su cuenta es `null` por letra firmada
 * (`MODELO_LOYALTY` §3: los no leídos son PRESENCIA, jamás número). *Un arco
 * que nunca aparece no es código muerto: es la clase esperando su número.*
 *
 * ⚠️ **SIN ANIMACIÓN EN LOS ARCOS, a propósito** (N15): aparecen y se quedan.
 * Lo único que se mueve es la entrada del abanico, `micro`, igual que en la
 * pieza que reemplaza — *un menú que tarda se siente trabado*.
 */

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Entrada,
  Huella,
  HUELLA_BOX,
  radius,
  spacing,
  typography,
  usePresionado,
  useTheme,
} from '@epetplace/ui';

import type { AtajoNexo } from '@/lib/nexo/atajos';
import type { ClaseNexo } from '@/lib/nexo/estado';

/** 56 — el mismo disco de la burbuja. **No es N8 con holgura: es una puerta.** */
const DISCO = 56;
/** La huella adentro del disco. */
const HUELLA = 30;
/** Cuánto separa el anillo de arcos del borde del disco. */
const AIRE_ANILLO = 4;
const GROSOR_ARCO = 2.5;
/** Hueco entre arcos, en grados: sin él, dos arcos se leen como un anillo. */
const HUECO_GRADOS = 14;
/** Arriba de esto el número deja de leerse; la salida es decir «muchos»,
 *  jamás encoger la letra (misma ley que `GlifoConContador`). */
const TOPE = 99;

/** 🔴 LA COLA QUE LA PANTALLA LE DEBE AL SCROLL — derivada, jamás tecleada.
 *  Espejo exacto de `COLA_BURBUJA_PENDIENTES`: Nexo flota encima del
 *  contenido y el último ítem quedaría debajo. */
export const COLA_NEXO = DISCO + spacing[5] + spacing[4];

export interface AtajoDeLaPata {
  clave: AtajoNexo;
  etiqueta: string;
  /** `null` = vivo. Un texto = **apagado con su razón a la vista**, que es la
   *  ley de este lote: *un botón apagado sin razón es el defecto*. */
  razon: string | null;
  onPress: () => void;
}

export interface PastillaPendiente {
  clase: ClaseNexo;
  /** Siempre > 0: la clase en cero no llega hasta acá (`clasesVivasNexo`). */
  n: number;
  titulo: string;
  etiqueta: string;
  onPress: () => void;
}

export interface PresenciaNexoProps {
  /** Las clases vivas, ya filtradas por el shell. Vacío ⇒ **dormida**. */
  pastillas: readonly PastillaPendiente[];
  atajos: readonly AtajoDeLaPata[];
  /** Voz del disco: «Abrir a Nexo». */
  etiquetaDisco: string;
  /** La almohadilla: «Pregúntale a Nexo». */
  etiquetaAlmohadilla: string;
  onAlmohadilla: () => void;
  /** Lo mide el shell con un `onLayout` sobre la barra: la pieza no sabe qué
   *  hay debajo. */
  aireInferior?: number;
}

export function PresenciaNexo({
  pastillas,
  atajos,
  etiquetaDisco,
  etiquetaAlmohadilla,
  onAlmohadilla,
  aireInferior = 0,
}: PresenciaNexoProps) {
  const { theme } = useTheme();
  const { handlers, estiloPresionado } = usePresionado();
  const [abierta, setAbierta] = useState(false);

  const numero = (n: number) => (n > TOPE ? `${TOPE}+` : String(n));

  /* Los dos stops violeta→azul del gradiente FIRMA — **la misma receta que el
     destello del Coach en el Hogar**, que esta pieza retira. El orbe no
     cambia de color al mudarse de esquina. */
  /* 🔴 LOS DOS STOPS SE LEEN CON RESPALDO, y no es paranoia de tipos: el
     índice de un array bajo `noUncheckedIndexedAccess` puede ser `undefined`,
     y un gradiente con un color `undefined` **no falla: pinta transparente**.
     El respaldo es el primer stop, que siempre existe. */
  const stops = theme.accent.gradient.colors;
  const violeta = stops[1] ?? stops[0];
  const azul = stops[2] ?? stops[0];
  const orbe: [string, string] = [violeta, azul];

  const tinteDe: Record<ClaseNexo, string> = {
    chat: theme.accent.control,
    /* ⚠️ **NO es `accent.cta`, y no es un capricho:** ese slot lo resuelve
       `Boton` (Ley 21, R5) y re-resolverlo a mano en una app es exactamente el
       defecto que la regla persigue. Acá el oro tampoco haría falta — el orbe
       ya es la marca; **lo que el arco necesita es distinguir la clase.** */
    carrito: theme.accent.primary,
    avisos: violeta,
  };

  const disco = (
    <Pressable
      onPress={() => setAbierta((x) => !x)}
      {...handlers}
      accessibilityRole="button"
      accessibilityLabel={etiquetaDisco}
      accessibilityState={{ expanded: abierta }}
      style={{ width: DISCO + (AIRE_ANILLO + GROSOR_ARCO) * 2, height: DISCO + (AIRE_ANILLO + GROSOR_ARCO) * 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <ArcosDeClase
        clases={pastillas.map((p) => p.clase)}
        tinteDe={tinteDe}
        lado={DISCO + (AIRE_ANILLO + GROSOR_ARCO) * 2}
      />
      <LinearGradient
        colors={orbe}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: DISCO,
          height: DISCO,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.elevacion.elevada,
        }}
      >
        <Svg width={HUELLA} height={HUELLA} viewBox={`0 0 ${HUELLA_BOX} ${HUELLA_BOX}`}>
          <Huella color={theme.text.onGradient} />
        </Svg>
      </LinearGradient>
    </Pressable>
  );

  /* CERRADA: caja que abraza al disco — no ocupa nada y no intercepta ningún
     toque, ni el de la barra de tabs.

     R53-DECLARADO: esto NO es un pie: es un OVERLAY que flota encima del
     contenido y no lo envuelve, así que no hay scroll propio que reservar —
     `PantallaConPie` mide un pie que ella misma contiene y acá el contenido
     es de otra pantalla. La cola la exporta esta pieza (`COLA_NEXO`) y la
     paga cada scroll, que es la misma receta —y el mismo reparto— de
     `COLA_BURBUJA_PENDIENTES`, la pieza que Nexo reemplaza. */
  /* ⚠️ Sin entrada: el disco **no aparece, está** — animarlo en cada cambio de
     pantalla sería movimiento sin hecho detrás (N15). El `Animated.View` queda
     por el pressed, que sí responde al dedo. */
  if (!abierta) {
    return (
      <Animated.View
        style={[
          { position: 'absolute', right: spacing[5], bottom: spacing[5] + aireInferior },
          estiloPresionado,
        ]}
      >
        {disco}
      </Animated.View>
    );
  }

  const superficie = theme.mode === 'light' ? theme.bg.card : theme.bg.elevated;

  /* ABIERTA: toma la pantalla entera, que es la única forma de que un toque
     afuera la cierre. El captador va DEBAJO de las opciones.

     R53-DECLARADO: tampoco es un pie — es la capa modal del abanico, viva
     sólo mientras está abierto, y su razón de ocupar la pantalla es capturar
     el toque de afuera, no alojar contenido. Nada que reservar: el scroll de
     abajo ni siquiera se puede tocar mientras esta capa existe. */
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Pressable
        onPress={() => setAbierta(false)}
        accessibilityRole="button"
        accessibilityLabel={etiquetaDisco}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        style={{
          position: 'absolute',
          left: spacing[5],
          right: spacing[5],
          bottom: spacing[5] + aireInferior,
          alignItems: 'flex-end',
          gap: spacing[3],
        }}
      >
        {/* ① LO QUE TE ESPERA — arriba de todo: se lee primero al abrir. */}
        {/* §5: la entrada la pone `Entrada`, el portador único de la casa —
            y de paso trae gratis lo que un `FadeIn` a mano no tiene:
            reduce-motion y memorial ya resueltos adentro. El `orden` no es
            decoración: es el orden de LECTURA. */}
        {pastillas.map((p) => (
          <Entrada key={p.clase} orden={0}>
            <Pressable
              onPress={() => {
                setAbierta(false);
                p.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel={p.etiqueta}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[2],
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[3],
                borderRadius: radius.full,
                backgroundColor: superficie,
                boxShadow: theme.elevacion.elevada,
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: tinteDe[p.clase] }} />
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.primary }}>
                {p.titulo}
              </Text>
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.sm,
                  fontVariant: ['tabular-nums'],
                  letterSpacing: typography.tracking.mono,
                  color: theme.text.secondary,
                }}
              >
                {numero(p.n)}
              </Text>
            </Pressable>
          </Entrada>
        ))}

        {/* ② LOS CUATRO DEDOS — en orden de pata, de izquierda a derecha. La
            fila ENVUELVE porque «Antiparasitario» no entra al lado de los
            otros tres en un teléfono común: al envolver, el orden de lectura
            (izq→der, arriba→abajo) sigue siendo el de la pata. */}
        <Entrada orden={1}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing[2] }}>
          {atajos.map((a) => {
            const apagado = a.razon !== null;
            return (
              <Pressable
                key={a.clave}
                onPress={() => {
                  if (apagado) return;
                  setAbierta(false);
                  a.onPress();
                }}
                accessibilityRole="button"
                /* La razón viaja EN la etiqueta: quien no ve la pantalla
                   también tiene que enterarse de por qué no se puede. */
                accessibilityLabel={apagado ? `${a.etiqueta}. ${a.razon}` : a.etiqueta}
                accessibilityState={{ disabled: apagado }}
                style={{
                  paddingVertical: spacing[2],
                  paddingHorizontal: spacing[3],
                  borderRadius: radius.full,
                  backgroundColor: superficie,
                  boxShadow: theme.elevacion.elevada,
                  opacity: apagado ? 0.55 : 1,
                  maxWidth: '100%',
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.base,
                    color: apagado ? theme.text.tertiary : theme.text.primary,
                  }}
                >
                  {a.etiqueta}
                </Text>
                {apagado ? (
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.xs,
                      color: theme.text.tertiary,
                      maxWidth: 220,
                    }}
                  >
                    {a.razon}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
          </View>
        </Entrada>

        {/* ③ LA ALMOHADILLA — pegada al disco, que es donde está en una pata. */}
        <Entrada orden={2}>
          <Pressable
            onPress={() => {
              setAbierta(false);
              onAlmohadilla();
            }}
            accessibilityRole="button"
            accessibilityLabel={etiquetaAlmohadilla}
            style={{
              paddingVertical: spacing[2],
              paddingHorizontal: spacing[4],
              borderRadius: radius.full,
              backgroundColor: superficie,
              boxShadow: theme.elevacion.elevada,
            }}
          >
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
              {etiquetaAlmohadilla}
            </Text>
          </Pressable>
        </Entrada>

        <View style={{ alignItems: 'flex-end' }}>{disco}</View>
      </View>
    </View>
  );
}

/**
 * Un arco por clase viva, repartidos en el anillo. Cero arcos ⇒ **nada se
 * dibuja**: dormida no lleva anillo vacío.
 */
function ArcosDeClase({
  clases,
  tinteDe,
  lado,
}: {
  clases: readonly ClaseNexo[];
  tinteDe: Record<ClaseNexo, string>;
  lado: number;
}) {
  if (clases.length === 0) return null;
  const r = DISCO / 2 + AIRE_ANILLO;
  const circ = 2 * Math.PI * r;
  const sector = circ / clases.length;
  const hueco = (HUECO_GRADOS / 360) * circ;
  const trazo = Math.max(sector - hueco, 1);
  return (
    <Svg width={lado} height={lado} style={{ position: 'absolute' }}>
      {clases.map((c, i) => (
        <Circle
          key={c}
          cx={lado / 2}
          cy={lado / 2}
          r={r}
          stroke={tinteDe[c]}
          strokeWidth={GROSOR_ARCO}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${trazo} ${circ - trazo}`}
          strokeDashoffset={-i * sector}
        />
      ))}
    </Svg>
  );
}
