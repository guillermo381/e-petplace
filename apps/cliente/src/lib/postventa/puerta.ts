/**
 * LA PUERTA — «¿Algo salió distinto?» (§1 de `DIRECCION_POSTVENTA`).
 *
 * Vive acá y no en cada pantalla porque **son tres objetos y una sola ley**
 * (regla 37: el helper vive UNA vez). La cita, la estadía y el pedido llegan
 * con datos de forma distinta y salen con el mismo veredicto.
 *
 * 🔴 **EL PISO DE MEMORIAL NO PUEDE VIVIR EN LA PIEZA, Y ESTO ES UN HALLAZGO
 * MEDIDO, NO UNA PREFERENCIA.** `LineaAlgoSalioDistinto` (B8) se protege con
 * `theme.mode === 'memorial'` — y **ese guard no se enciende nunca en esta
 * app**: `D-1021` lo midió y lo dejó escrito en el perfil de la mascota
 * (*«NADIE monta `<ThemeProvider memorial>` en ninguna de las dos apps — el
 * único provider vivo es el raíz, con `mode={light|dark}`»*), y por eso los
 * cuatro guards que colgaban de esa condición eran letra muerta.
 *
 * ⇒ El guard de B **se conserva y es correcto** (la galería sí monta el
 * sub-tema), pero **no alcanza**: la señal verdadera es la mascota, y viaja
 * en `estado_vida`. *Un piso que no puede producir su rojo no está midiendo.*
 *
 * La ventana de 7 días (§1) se computa ACÁ y no en el servidor: el corte
 * viviendo en dos lados es un día divergiendo. Está declarado en el pedido a A.
 */

import type { EstadoDeLaPuerta } from '@epetplace/ui';

import { esMemorial } from '@/lib/memorial';

/**
 * ⏪ **ACÁ VIVÍA UN `7` HARDCODEADO, Y A TENÍA RAZÓN EN CORREGIRLO.**
 *
 * Yo pedí computar la ventana en la app *«para que el corte no viva en dos
 * lados»*. A aceptó el riesgo y sacó la conclusión contraria, que es la
 * correcta: **el motor la exige igual** —un guard que vive sólo en la pantalla
 * no es un guard, y éste decide si una familia puede reclamar plata—. La
 * divergencia no se cierra teniendo el número en un solo lado: **se cierra
 * publicándolo**.
 *
 * ⇒ el número lo LEE `useVentanaDeCaso()` de `obtenerVentanaCasoDias()`, y
 * esta pantalla lo recibe. **Ningún archivo de C escribe un 7.**
 */

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export type EntradaDeLaPuerta = {
  /**
   * El cierre del objeto: fin de la cita, entrega de la estadía, entrega del
   * pedido. **`null` = todavía no cerró** ⇒ no hay puerta: no se reclama un
   * servicio que está ocurriendo.
   */
  cerradaEn: string | null;
  /**
   * 🔴 `estado_vida` de la mascota del objeto. `'activa'` o `null` = está.
   * Cualquier otro valor = memorial ⇒ **no hay línea, y no hay caso**.
   *
   * El pedido de despensa **no tiene mascota** y pasa `undefined`: ahí la
   * regla no aplica y decirlo así es más honesto que mandarle `'activa'`.
   */
  estadoVida?: string | null;
  /**
   * El caso abierto sobre este objeto, si lo hay (§1).
   *
   * ⚠️ **Hoy es siempre `null` y está declarado:** el motor del caso no
   * existe (`abrirCaso` no está construido), así que **no puede haber ningún
   * caso abierto** y esta rama es inalcanzable por ausencia de sujeto — un
   * verde que no prueba nada, y por eso se dice en vez de celebrarse. El día
   * que A entregue `obtenerCasoDeObjeto`, entra por acá y nada más cambia.
   */
  casoAbierto?: { casoId: string; vozEstado: string } | null;
  /** Las tres frases ya redactadas (Ley 3: la voz la trae quien lee). */
  voces: { disponible: string; fueraDeVentana: string; casoAbierto: string };
  /**
   * 🔴 Los días de ventana, **leídos del motor** (`obtenerVentanaCasoDias`).
   * `undefined` = todavía no llegó ⇒ **la puerta no se dibuja**: sin saber el
   * corte no se puede decir si está dentro, y la salida serena es callarse en
   * vez de ofrecer un reclamo que el motor va a rebotar.
   */
  diasDeVentana?: number;
  /** Para poder fijar el reloj en una prueba. Por defecto, ahora. */
  ahora?: Date;
};

export type VeredictoDeLaPuerta =
  | { hay: false; porque: 'memorial' | 'sin_cerrar' }
  | { hay: true; estado: EstadoDeLaPuerta; casoId: string | null };

/**
 * ¿Va la línea, y con qué voz?
 *
 * Devuelve `hay: false` con su **porqué** en vez de un `null` pelado, porque
 * los dos silencios no son el mismo silencio: en memorial la app decidió
 * callarse, y sin cerrar todavía no hay nada que reclamar. *Un `null` que
 * mezcla dos razones distintas es un dato que nadie puede auditar después.*
 */
export function veredictoDeLaPuerta(e: EntradaDeLaPuerta): VeredictoDeLaPuerta {
  /* ── EL PISO, ANTES QUE TODO (§1: «Con la mascota en memorial no hay
        línea. Nada.»). Va primero a propósito: en memorial no se evalúa
        ventana ni caso — no hay nada que decidir.

     ⏪ **Acá decía `!== null && !== 'activa'`, y eso metía a `perdida`
     adentro de memorial: a una familia que está buscando a su animal le
     apagaba el reclamo del último paseo.** Lo escribí copiando la forma
     dominante del repo sin preguntarme qué decía — *que es exactamente cómo
     una regla equivocada se propaga: pareciendo la convención*. Hoy delega
     en la definición única, con la firma del founder adentro. */
  if (esMemorial(e.estadoVida)) return { hay: false, porque: 'memorial' };

  if (e.cerradaEn === null) return { hay: false, porque: 'sin_cerrar' };

  /* Un caso abierto MANDA sobre la ventana: si el caso existe, la línea
     lleva a él aunque los 7 días hayan pasado — la ventana gobierna abrir,
     jamás volver a lo que ya está abierto. */
  if (e.casoAbierto !== undefined && e.casoAbierto !== null) {
    return {
      hay: true,
      casoId: e.casoAbierto.casoId,
      estado: {
        tipo: 'casoAbierto',
        voz: e.voces.casoAbierto,
        estado: e.casoAbierto.vozEstado,
      },
    };
  }

  const cierre = new Date(e.cerradaEn).getTime();
  /* Fecha ilegible ⇒ se trata como fuera de ventana: la salida conservadora
     es la que NO abre un caso sobre algo que no pudimos fechar. */
  if (Number.isNaN(cierre)) {
    return { hay: true, casoId: null, estado: { tipo: 'fueraDeVentana', voz: e.voces.fueraDeVentana } };
  }

  /* Sin el número del motor no se decide: ver `diasDeVentana`. */
  if (e.diasDeVentana === undefined) return { hay: false, porque: 'sin_cerrar' };

  const ahora = (e.ahora ?? new Date()).getTime();
  const dentro = ahora - cierre <= e.diasDeVentana * MS_POR_DIA;

  return {
    hay: true,
    casoId: null,
    estado: dentro
      ? { tipo: 'disponible', voz: e.voces.disponible }
      : { tipo: 'fueraDeVentana', voz: e.voces.fueraDeVentana },
  };
}

/**
 * A DÓNDE LLEVA LA PUERTA.
 *
 * Vive acá y no en cada pantalla porque **los tres destinos son los mismos
 * para los tres objetos**, y porque el día que exista la pantalla del caso
 * hay que tocar UN lugar. *Tres copias de una decisión de navegación es cómo
 * dos objetos terminan llevando a lados distintos sin que nadie lo decida.*
 *
 * 🔴 **EL DESTINO DEL CASO ABIERTO NO ESTÁ, Y NO SE FINGE.** La pantalla del
 * caso (C3) no existe todavía porque su motor no existe. **Tenía escrito un
 * `router.push('/postventa/caso/...')` en las tres pantallas y las tres
 * compilaban**: `tsc` corrido a mano no mide rutas de expo-router, y sólo
 * `guard-rutas-tipadas.mjs` —con `router.d.ts` generado en ESTE worktree—
 * las encontró. *Un verde que no puede producir su rojo no es una medición*
 * (`L-450`). Se retira el puente en vez de dejarlo apuntando al vacío
 * (`L-395`): vuelve con C3, en esta función y en ninguna otra.
 *
 * Devuelve `null` cuando no hay a dónde ir — el llamador no navega.
 */
export function destinoDeLaPuerta(
  v: VeredictoDeLaPuerta,
  objeto: 'cita' | 'estadia' | 'pedido',
  objetoId: string | null,
): '/(tabs)/cuenta/ayuda' | `/postventa/motivo?objeto=${string}&objetoId=${string}` | null {
  if (!v.hay) return null;
  /* Fuera de ventana no hay caso: hay conversación con la casa (§1). */
  if (v.estado.tipo === 'fueraDeVentana') return '/(tabs)/cuenta/ayuda';
  /* `casoAbierto` es inalcanzable hoy —ninguna pantalla lo pasa, porque no
     puede haber casos— y por eso cae acá sin destino en vez de a una ruta
     que no existe. */
  if (v.estado.tipo === 'casoAbierto') return null;
  if (objetoId === null) return null;
  return `/postventa/motivo?objeto=${objeto}&objetoId=${objetoId}`;
}
