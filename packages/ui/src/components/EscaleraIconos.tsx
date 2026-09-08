/**
 * LOS ÍCONOS DE LA ESCALERA
 *
 * ── 🔴 S112-A · POR QUÉ SUBIÓ ACÁ, Y NO ES PROLIJIDAD (`D-1005`) ────────
 * Vivía en `apps/cliente/src/lib/despensa/`, así que **el prestador no lo
 * tenía disponible aunque quisiera**: su escalera del MISMO pedido se
 * dibujaba sin un solo glifo. *Misma escalera, mismo pedido, dos caras — y
 * una era la versión pobre de la otra*, que es literal lo que la casa
 * prohíbe. **La causa no era un olvido: era dónde vivía el archivo.**
 *
 * Lo midió B buscando otra cosa. `N17` —una fuente, N consumidores— y el
 * precedente de `EvitaTeclado` (`D-498`), que subió al aparecer su segundo
 * consumidor.
 *
 * ⚠️ **Se movió SIN tocar una línea de su craft**: el mapa, el tamaño 12 y
 * la decisión de no inventar fallback son de B y siguen siendo suyas. Lo
 * único que cambió es DÓNDE vive — que era todo el defecto. — el slot de B, llenado en UN solo lugar
 * (S100-D · L1 · `2026-08-18-s99b-RECETA-SEGUIMIENTO-DE-NODOS` §2).
 *
 * ── POR QUÉ ESTA PIEZA EXISTE, Y NO ES UN ARCHIVO DE MÁS ────────────────
 * El slot `icono` de `PasoEscalera` devuelve `ReactNode`, así que no puede
 * vivir en `escalera.ts`, que es `.ts` puro y **conviene que lo siga
 * siendo**: ahí vive la DECISIÓN (qué paso está hecho, cuál es el actual,
 * cuándo el camino se desvió) y esa decisión se lee y se prueba sin montar
 * nada.
 *
 * Y sus consumidores son DOS —la lista y el detalle—, que es exactamente
 * el umbral de la Regla de las Piezas de esta casa: **se promueve en el
 * segundo consumidor.** La alternativa era el mismo bloque de JSX copiado
 * en dos pantallas, que es el clon que la casa caza.
 *
 * ── LO QUE NO DECIDE ────────────────────────────────────────────────────
 * El COLOR no es suyo: llega por el argumento del slot, que la pieza de B
 * resuelve contra su propio `acento` y su estado de relleno. *Si esta
 * función eligiera el color, la ley del acento se rompería de a una
 * pantalla por vez* — el mismo criterio del canto de `FilaCita`.
 *
 * ── EL TAMAÑO ES 12 Y ES DATO, NO GUSTO ─────────────────────────────────
 * El nodo mide 20 y sostiene 12. A esa fineza **el trazo no dibuja:
 * susurra** —de ahí que los cuatro glifos de B vayan en MASA— y por eso el
 * registro es `tinta`: es un glifo de CONTROL, sin huella. *Ley 9 mide a
 * 21 px y ya ahí «sobrevive o es ruido».*
 */

import { Icono, type IconoNombre } from './Icono';
import type { PasoEscalera } from './EscaleraEstados';

/**
 * EL MAPA DEL PEDIDO DE DESPENSA — la ÚNICA fuente para las dos apps.
 *
 * 🔴 Vivía en `apps/cliente/src/lib/despensa/escalera.ts`, y por eso **el
 * prestador dibujaba el MISMO pedido sin un solo glifo**: no podía alcanzarlo.
 * Sube acá porque *un pedido no es vocabulario privado de una app* — las dos
 * miran el mismo objeto. El cliente lo re-exporta con su nombre viejo para no
 * mover a sus consumidores.
 *
 * ⚠️ Esto NO contradice que `conIconos` reciba el mapa: **el mecanismo es
 * genérico y este mapa es UNO de los que puede recibir.** Adopción traerá el
 * suyo, con sus etapas, sin tocar éste.
 *
 * ⚠️ **DEUDA DECLARADA (`D-1006`, hallazgo de B, S112): los cuatro `nodo*`
 * siguen dibujados para 12 px y el nodo mide 24.** Nacieron con la anatomía
 * de silueta rellena porque *«un check de trazo a 12 px se convierte en una
 * mancha»* — **y ese 12 ya no existe**: el nodo creció y `GLIFO_EN_NODO` es
 * `NODO - 8 = 24`. ⇒ *su razón de forma está vencida y ninguno de los dos
 * números lo dice.*
 *
 * **No se tocan acá y es a propósito:** son de despensa, tienen su gate por
 * ícono, y redibujarlos desde un frente de adopción cambiaría lo que el
 * founder ya aprobó en otra pantalla. Los cinco glifos nuevos de adopción SÍ
 * nacen con la anatomía canónica del registry — *así que las dos escaleras
 * van a convivir con dos anatomías hasta que alguien mire ésta.*
 */
export const GLIFOS_PEDIDO: Readonly<Record<string, IconoNombre>> = {
  confirmado: 'nodoConfirmado', // la bolsa — el pedido tomado
  preparando: 'nodoPreparando', // la caja abierta — se está armando
  en_camino: 'nodoEnCamino', // la flecha — el movimiento
  entregado: 'ubicacion', // la gota — TU casa, que es donde termina el camino
};

/**
 * ☠️ EL 12 ES LEGADO, Y ACÁ ESTÁ SU MEDICIÓN (S114-B).
 *
 * 🔴 **`EscaleraEstados` pasa el `tamano` DERIVADO del nodo y esta función lo
 * TIRABA.** Su propio slot lo dice con todas las letras: *«`tamano` lo pasa LA
 * PIEZA, derivado del nodo: el consumidor lo recibe y no lo inventa. Si el
 * nodo crece y el glifo se queda, el defecto sale en la pantalla y no en
 * ningún gate»*. **El único consumidor del slot en toda la casa era
 * exactamente el defecto que ese párrafo existe para prevenir**: el nodo pasó
 * de 20 a 32 (`GLIFO_EN_NODO` = 24) y el glifo se quedó en 12.
 *
 * ⚠️ **NO SE CURA CAMBIANDO EL DEFAULT, y el porqué es una medición ajena:**
 * los cuatro `nodo*` de despensa *«nacieron con la anatomía de silueta
 * rellena porque un check de trazo a 12 px se convierte en una mancha»* —
 * subirlos a 24 de un saque **cambia lo que el founder ya aprobó en dos
 * pantallas de despensa y una de adopción**, desde un frente que no es el
 * suyo. *La cura correcta de una deuda ajena no se aplica de sorpresa.*
 *
 * ⇒ **el legado queda como DEFAULT y el comportamiento correcto entra por
 * opción**, con su nombre. `D-1006` sigue viva y ahora tiene su salida
 * escrita: el día que alguien mire los cuatro glifos, pasa a `'delNodo'` y
 * este número muere.
 */
const TAMANO_LEGADO = 12;

/**
 * `'delNodo'` = el glifo mide lo que la escalera dice que mida (lo correcto).
 * Un número = se fija a mano, y hoy sólo lo usa el legado de arriba.
 */
export type TamanoDelGlifo = number | 'delNodo';

/**
 * Devuelve los mismos pasos con su glifo montado.
 *
 * **El slot se respeta como OPCIONAL:** un paso sin glifo en el mapa viaja
 * sin `icono` y la escalera lo dibuja igual. *Un nodo sin ícono se lee
 * bien; un ícono equivocado enseña mal dos veces* — y por eso acá no hay
 * fallback a un glifo "parecido".
 */
/**
 * 🔴 **EL MAPA ENTRA COMO ARGUMENTO, Y ES LA DECISIÓN DE ESTE MOVIMIENTO.**
 * La versión que vivía en `apps/cliente` tenía el mapa de despensa adentro.
 * Mudarlo así habría metido el vocabulario de UN dominio en el paquete
 * compartido — y **no serviría para adopción**, cuyas etapas no son las de un
 * pedido. *Una pieza compartida con el vocabulario de un dominio adentro no
 * es compartida: es la del primero que llegó.*
 *
 * ⇒ acá sube el MECANISMO —el glifo del tamaño correcto, en el registro
 * correcto, con el color que manda el slot— y **cada dominio trae su mapa**.
 */
export function conIconos(
  pasos: PasoEscalera[],
  mapa: Readonly<Record<string, IconoNombre | undefined>>,
  /**
   * 🔴 **Default LEGADO a propósito** — ver la lápida de `TAMANO_LEGADO`.
   * Los tres mapas vivos (despensa, adopción) lo heredan sin cambiar un
   * píxel; lo nuevo pasa `'delNodo'`, que es lo que la pieza pide.
   */
  tamano: TamanoDelGlifo = TAMANO_LEGADO,
): PasoEscalera[] {
  return pasos.map((paso) => {
    const glifo = mapa[paso.clave];
    if (glifo === undefined) return paso;
    return {
      ...paso,
      icono: ({ color, tamano: delNodo }: { color: string; tamano: number }) => (
        <Icono
          nombre={glifo}
          tamano={tamano === 'delNodo' ? delNodo : tamano}
          registro="tinta"
          tinta={color}
        />
      ),
    };
  });
}
