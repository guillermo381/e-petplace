/**
 * CUÁNTOS MENSAJES AJENOS LLEGARON Y TODAVÍA NO SE VIERON — **derivado en el
 * dispositivo, y por una razón medida: el motor no lo tiene.**
 *
 * 🔴 Censado antes de escribirlo: `caso_mensajes` no guarda leído/no-leído y
 * ni `leerMensajesDeCaso` ni `obtenerMisCasos` traen nada parecido — cero
 * ocurrencias de `leido`/`sin_leer` en el wrapper y en las migraciones del
 * caso. *La barra tiene que decir un número y el número no existe.*
 *
 * ⇒ Se deriva de lo único honesto que hay acá: **la marca de hasta dónde
 * leyó ESTE dispositivo**. Al abrir la hoja se guarda el instante del mensaje
 * más nuevo; los ajenos posteriores a esa marca son los que no vio.
 *
 * ⚠️ **SU LÍMITE, dicho y no escondido: es POR DISPOSITIVO.** En otro teléfono
 * la cuenta arranca de cero y la barra dirá que hay sin leer aunque la familia
 * ya los haya leído en el suyo. *Es la clase de error barato —dice de más, no
 * de menos— pero es un error, y la cura de raíz es del motor.*
 *
 * Mismo molde que el «ahora no» del permiso de WhatsApp: `AsyncStorage` con
 * clave por caso.
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const clave = (casoId: string) => `postventa.leidoHasta.${casoId}`;

export function useSinLeer(
  casoId: string | null,
  /** Los ajenos del hilo, con su instante. La pantalla ya los tiene. */
  ajenos: { creadoEn: string }[],
): { sinLeer: number; marcarLeido: () => void } {
  const [leidoHasta, setLeidoHasta] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (casoId === null) return;
    let vigente = true;
    void AsyncStorage.getItem(clave(casoId)).then((v) => {
      if (!vigente) return;
      setLeidoHasta(v);
      setListo(true);
    });
    return () => {
      vigente = false;
    };
  }, [casoId]);

  const marcarLeido = useCallback(() => {
    if (casoId === null || ajenos.length === 0) return;
    /* El más nuevo de los ajenos: `reduce` y no `[0]`, porque el orden del
       arreglo es cosa de la pantalla y acá no se supone. */
    const tope = ajenos.reduce((a, b) => (a.creadoEn > b.creadoEn ? a : b)).creadoEn;
    setLeidoHasta(tope);
    void AsyncStorage.setItem(clave(casoId), tope);
  }, [casoId, ajenos]);

  /* Mientras no se leyó la marca, **cero** — jamás un número provisional: una
     barra que dice «3 sin leer» y al segundo dice «0» se lee como un defecto. */
  const sinLeer = !listo ? 0 : ajenos.filter((m) => leidoHasta === null || m.creadoEn > leidoHasta).length;

  return { sinLeer, marcarLeido };
}
