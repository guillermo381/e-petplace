/**
 * DATO ADMINISTRABLE — la pieza de §3 de la receta de B.
 *
 * ── LA LEY QUE LA HACE EXISTIR ───────────────────────────────────────────
 * > **ADMINISTRAR NO AGREGA UN BLOQUE: ENCIENDE EL CONTROL SOBRE EL DATO.**
 *
 * El hallazgo del founder era *«lo veo y no identifico cómo lo edito»*, y
 * la causa medida **no era que faltara el control: era que no estaba donde
 * está el dato**. El vendedor miraba el precio y el stock abajo, en la
 * ficha, y lo que los cambiaba vivía en otro bloque, arriba.
 *
 * ── POR QUÉ ESTA PIEZA ARREGLA EL ESPEJO EN VEZ DE ROMPERLO ──────────────
 * La regla que rige es *cambiar de modo cambia CÓMO se ve, jamás QUÉ se
 * ve*. **Un bloque nuevo arriba SÍ es «qué se ve»** ⇒ el espejo se estaba
 * rompiendo en la dirección que nadie miró. Envolver el dato es la única
 * forma de que las dos caras tengan **la misma anatomía**: ni una fila de
 * más, ni una de menos. *Si tapás una columna de la comparación, no podés
 * saber en qué modo estás — y eso es lo que un espejo tiene que lograr.*
 *
 * ── LO QUE HACE, Y LO QUE NO ────────────────────────────────────────────
 * · **Modo cliente → transparente.** Devuelve los hijos tal cual: sin caja,
 *   sin chevron, sin blanco de más. *No «se ve deshabilitado»: no está.*
 * · **Modo administrar → el MISMO dato, tocable, con chevron.**
 * · **⚠️ Chevron y no lápiz, medido contra la casa:** el `lapiz` existe en
 *   el registry, pero **la fila que lleva a algún lado usa chevron** en
 *   toda la app (19.7 · `CeldaNavegacion` · la fila del repartidor). *Un
 *   segundo vocabulario para «editar» obligaría a aprender dos señales
 *   para el mismo gesto.*
 * · **⛔ NO convierte el dato en un `Campo`.** Un campo abierto en la ficha
 *   cambia la anatomía —crece, gana borde, gana teclado— y rompería el
 *   espejo por la misma puerta que esta pieza vino a cerrar. **La edición
 *   vive en su Hoja; la ficha solo abre la puerta.**
 * · **Sin `onEditar` es transparente aunque el modo sea administrar** — así
 *   un dato cuyo motor todavía no existe (el precio, hoy) **no promete un
 *   control que no puede cumplir**: *un formulario muerto es peor que su
 *   ausencia.*
 */

import { Pressable, View } from 'react-native';
import { spacing } from '@epetplace/ui';

import type { ModoEspejo } from '@/components/interruptor-espejo';

export interface DatoAdministrableProps {
  modo: ModoEspejo;
  /** Qué abre el control. **`undefined` = no hay control** (el dato se
   *  dibuja igual que en modo cliente). */
  onEditar?: () => void;
  /** Para el lector de pantalla: qué se va a editar. Obligatorio cuando
   *  hay `onEditar` — un tocable sin nombre es un tocable que no se puede
   *  usar sin ver. */
  etiqueta?: string;
  /** 🔴 LA SEÑAL VISIBLE DE QUE SE TOCA — hoy llega VACÍA, y es un hueco
   *  DECLARADO, no un olvido.
   *
   *  La receta pide **chevron** y descarta el `lapiz` con su medición
   *  (*la fila que lleva a algún lado usa chevron en toda la casa; un
   *  segundo vocabulario obligaría a aprender dos señales para el mismo
   *  gesto*). Pero **el chevron es geometría INTERNA de `packages/ui` y
   *  no se exporta**: su propio archivo lo dice —*«una pantalla que
   *  necesite un chevron usa la PIEZA que lo porta, jamás el path
   *  suelto»*— y ninguna pieza exportada envuelve un hijo arbitrario.
   *
   *  ⇒ **no se dibuja acá.** Copiar el path sería la quinta copia que
   *  `chevron.ts` existe para impedir, y R30 lo cazaría con razón; usar
   *  el `lapiz` sería contradecir la medición de la propia receta.
   *  **Pedido a B: el portador del chevron sobre un hijo arbitrario** —
   *  la pieza que su §3 describe («cada dato administrable se envuelve
   *  en la misma pieza»), que por la misma lógica de `FilaCita` vive en
   *  `packages/ui`. El día que llegue, entra por acá: una línea. */
  senal?: React.ReactNode;
  children: React.ReactNode;
}

export function DatoAdministrable({
  modo,
  onEditar,
  etiqueta,
  senal,
  children,
}: DatoAdministrableProps) {
  // Transparente: ni un View de más. Envolver «por si acaso» cambiaría el
  // layout del modo cliente y el espejo dejaría de ser exacto.
  if (modo !== 'administrar' || onEditar === undefined) return <>{children}</>;

  return (
    <Pressable
      onPress={onEditar}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={({ pressed }) => ({
        opacity: pressed ? 0.97 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
      })}
    >
      {/* El dato conserva su ancho: la señal no lo comprime, se pone al
          lado. Si el dato cediera espacio, la línea se leería distinta en
          los dos modos y volveríamos al mismo problema. */}
      <View style={{ flex: 1 }}>{children}</View>
      {senal}
    </Pressable>
  );
}
