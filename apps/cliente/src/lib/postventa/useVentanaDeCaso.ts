/**
 * LOS DÍAS DE VENTANA, LEÍDOS DEL MOTOR (§5 · F7).
 *
 * 🔴 **Ninguna pantalla escribe un `7`.** Yo lo tenía hardcodeado y A lo
 * corrigió con el argumento que cierra la discusión: el motor **tiene** que
 * exigir la ventana —un guard que vive sólo en la pantalla no es un guard—, y
 * la divergencia entre los dos lados no se evita teniendo el número en uno
 * solo: **se evita publicándolo**.
 *
 * ⚠️ **Se cachea POR SESIÓN a propósito** (N16): es una constante de negocio
 * que las tres pantallas de la puerta consultarían por separado en cada
 * montaje. *Tres viajes por algo que no cambia entre dos pantallas es
 * exactamente el peaje que S94 midió y nombró.* Si mañana el número se vuelve
 * por país o por objeto, esto deja de servir **y el compilador no lo va a
 * decir** — por eso queda escrito acá.
 */

import { useEffect, useState } from 'react';
import { obtenerVentanaCasoDias } from '@epetplace/api';

/** La respuesta viva de la sesión. `undefined` = todavía no se preguntó. */
let cache: number | undefined;
/** El vuelo en curso, para que tres pantallas montando a la vez pidan UNA. */
let enVuelo: Promise<number | undefined> | null = null;

async function pedir(): Promise<number | undefined> {
  if (cache !== undefined) return cache;
  if (enVuelo === null) {
    enVuelo = obtenerVentanaCasoDias()
      .then((r) => {
        /* Un fallo NO se cachea: se reintenta en el próximo montaje. Cachear
           el fallo dejaría la puerta apagada el resto de la sesión por una
           red mala de un segundo. */
        if (r.ok) cache = r.data;
        return cache;
      })
      .finally(() => {
        enVuelo = null;
      });
  }
  return enVuelo;
}

export function useVentanaDeCaso(): number | undefined {
  const [dias, setDias] = useState<number | undefined>(cache);

  useEffect(() => {
    if (dias !== undefined) return;
    let vigente = true;
    void pedir().then((d) => {
      if (vigente && d !== undefined) setDias(d);
    });
    return () => {
      vigente = false;
    };
  }, [dias]);

  return dias;
}
