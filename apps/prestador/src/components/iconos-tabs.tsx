/**
 * Íconos de la BarraTabs del prestador — LENGUAJE b′ COMPLETO (S58,
 * micro-pedido founder: cableado al lote D-361 del registry, ea7e8e4).
 * Geometría COPIADA LITERAL del set FIRMADO en packages/ui/Icono.tsx
 * (precedente S57: IconoCuenta viajó igual desde el cliente) — en tabs
 * el estado lo entrega BarraTabs (§2.6): en reposo SOLO trazo; la tab
 * activa se marca porque su HUELLA APARECE en colorHuella. El rezago
 * pre-b′ de Hoy/Negocio (D-318) MUERE acá; Mascotas ya cumplía (ES la
 * primitiva Huella — revisado contra ley en ea7e8e4).
 *
 * ═══ 🔴 DEUDA DECLARADA (S85-C33): ESTE ARCHIVO ES UN CLON DEL REGISTRY ═══
 *
 * La cabecera lo dice desde S58 como si fuera una técnica —*"geometría
 * COPIADA LITERAL"*— y hoy se le pone nombre: **es un clon, y su costo se
 * midió en esta sesión.** B rehizo los tres glifos de la barra en
 * `packages/ui/Icono.tsx` y **no llegó nada**: hubo que copiarlos a mano,
 * segunda vez. *Un dibujo con dos fuentes diverge en silencio: nada falla
 * cuando una se actualiza y la otra no — simplemente el prestador ve un
 * ícono viejo.*
 *
 * **Por qué existe** (y por qué no se cura de un tirón): `Icono` resuelve
 * su color por tema y expone UN slot; la barra necesita **tres estados**
 * (trazo en reposo · huella que aparece o recolorea al activarse) que la
 * pieza no modela. **La cura es un pedido a B**, no un refactor local:
 * que `Icono` acepte el eje de la barra. Hasta entonces, **quien toque un
 * glifo de acá tiene que ir a mirar el registry**, porque el registry es
 * la fuente y esto es la copia.
 * ☠️ Muere el día que la barra consuma el registry.
 */

import Svg, { Circle, Path } from 'react-native-svg';
import { Huella } from '@epetplace/ui';

const trazo = (color: string) => ({
  stroke: color,
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

type EstadoTab = { color: string; activa: boolean; colorHuella: string };

/**
 * HOY — **la agenda** (registry `hoy`). ⏪ Era el SOL, y el founder firmó la
 * agenda: *el día del prestador no es una hora del reloj, es una lista*.
 *
 * 🔴 **Y ES LA TERCERA VEZ QUE EL CLON COBRA EN UNA SOLA SESIÓN.** El dibujo
 * cambió en `packages/ui/Icono.tsx` y acá siguió el viejo — sin que nada
 * fallara, sin que ningún gate lo viera: **el founder firmó una agenda y su
 * barra le mostraba un sol.** Ver la deuda de la cabecera: *el registry es la
 * fuente y esto es la copia*, y una copia no se entera de que la fuente
 * cambió. Cada cobro refuerza que la cura es el pedido a B —que `Icono`
 * acepte el eje de la barra—, no seguir copiando mejor.
 *
 * La huella APARECE al activarse (marca, no estructura): acá el dibujo se
 * sostiene solo sin ella, a diferencia de DATOS.
 */
export function IconoHoy({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M6 6.4h12a1.6 1.6 0 0 1 1.6 1.6v11.4a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V8A1.6 1.6 0 0 1 6 6.4Z"
        {...trazo(color)}
      />
      <Path d="M4.4 10.8h15.2" {...trazo(color)} />
      <Path d="M8.6 3.4v4M15.4 3.4v4" {...trazo(color)} />
      {activa ? <Huella color={colorHuella} x={8.4} y={12.4} escala={0.36} /> : null}
    </Svg>
  );
}

/**
 * DATOS — la gráfica, y **la huella ES LA BARRA MÁS ALTA** (registry
 * `datos`, S85-B23). No es un adorno al costado: la pantalla responde
 * *"a quiénes cuido"*, así que **lo que la gráfica mide ES la mascota**.
 *
 * ⏪ ERA LA PATA. La soltó porque el founder pidió *"un símbolo con una
 * gráfica"* (*"hoy es paw y no dice lo que la pantalla es"*), y esa
 * mudanza es lo que le deja la pata libre a NEGOCIO — **en aislado
 * hubiera sido colisión; junto es una mudanza** (Ley 12).
 *
 * ⚠️ **RECOLOREA, NO APARECE, y es decisión de esta casa:** el convenio
 * de la barra (§2.6) es *reposo solo trazo · activa la huella aparece*,
 * pero acá **la huella es ESTRUCTURA**: si desapareciera en reposo, la
 * gráfica perdería su barra más alta y el dibujo diría otra cosa.
 * *La regla que se lleva de acá: la huella que es ESTRUCTURA se
 * recolorea; la que es MARCA aparece.* Misma receta que usaba la pata
 * cuando vivía en esta tab.
 */
export function IconoMascotas({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M4.4 20.2h15.2" {...trazo(color)} />
      <Path d="M7.6 20.2v-5.4M12 20.2v-8.6" {...trazo(color)} />
      <Huella color={activa ? colorHuella : color} x={14.4} y={5.2} escala={0.42} />
    </Svg>
  );
}

/**
 * NEGOCIO — **LA PATA ES EL GLIFO** (registry `negocio`, S85-B23).
 * ⏪ Murió el maletín. Literal del founder: ***"el negocio son mascotas"***
 * — un maletín es el objeto de una oficina, y este negocio no lo es.
 *
 * ⚠️ **RECOLOREA, JAMÁS SUPERPONE:** la barra marca lo activo CON UNA
 * HUELLA, y un glifo que YA es huella no puede recibir otra encima —sería
 * huella sobre huella, R22—. Receta de la ex-`IconoMascotas`, que es de
 * donde viene la pata.
 */
export function IconoNegocio({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Huella color={activa ? colorHuella : color} x={2} y={2} escala={0.84} />
    </Svg>
  );
}

/**
 * CUENTA — **cabeza + hombros**, el avatar universal (registry `cuenta`,
 * S85-B23). ⏪ Murió la chapita del collar: eran dos círculos apilados que
 * a 21px **no leían "collar" ni "persona"**, y de paso eran byte-idénticos
 * a `prime` —el registry tenía dos nombres para un dibujo—.
 *
 * ⚠️ **ESTO ENMIENDA UNA FIRMA DEL FOUNDER y B lo declaró en el registry:**
 * §2.4 (S53) dice *"humanos = manos u objetos"* y prohibía la figura
 * humana. Hoy pide una persona. **Gana la firma más nueva**, pero la
 * anterior no se borra en silencio — la enmienda de §2.4 le toca a la
 * mesa. *Dos letras firmadas que se contradicen son peores que una
 * equivocada.*
 *
 * La huella va al costado y CHICA: la cuenta es de una PERSONA, pero la
 * persona está acá por su mascota. **Marca, no estructura ⇒ APARECE al
 * activarse** (ver la nota de DATOS: estructura recolorea, marca aparece).
 */
export function IconoCuenta({ color, activa, colorHuella }: EstadoTab) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={8.2} r={3.4} {...trazo(color)} />
      <Path d="M5.2 20.4a6.8 6.8 0 0 1 13.6 0" {...trazo(color)} />
      {activa ? <Huella color={colorHuella} x={16.4} y={3.2} escala={0.3} /> : null}
    </Svg>
  );
}
