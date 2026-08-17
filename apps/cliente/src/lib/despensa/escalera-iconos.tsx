/**
 * LOS ÍCONOS DE LA ESCALERA — el slot de B, llenado en UN solo lugar
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

import { Icono, type PasoEscalera } from '@epetplace/ui';

import { GLIFO_NODO } from './escalera';

/** El tamaño del glifo dentro del nodo. Ver cabecera: es dato del nodo. */
const TAMANO_EN_NODO = 12;

/**
 * Devuelve los mismos pasos con su glifo montado.
 *
 * **El slot se respeta como OPCIONAL:** un paso sin glifo en el mapa viaja
 * sin `icono` y la escalera lo dibuja igual. *Un nodo sin ícono se lee
 * bien; un ícono equivocado enseña mal dos veces* — y por eso acá no hay
 * fallback a un glifo "parecido".
 */
export function conIconos(pasos: PasoEscalera[]): PasoEscalera[] {
  return pasos.map((paso) => {
    const glifo = GLIFO_NODO[paso.clave];
    if (glifo === undefined) return paso;
    return {
      ...paso,
      icono: ({ color }: { color: string }) => (
        <Icono nombre={glifo} tamano={TAMANO_EN_NODO} registro="tinta" tinta={color} />
      ),
    };
  });
}
