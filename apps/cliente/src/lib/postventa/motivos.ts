/**
 * LOS MOTIVOS — del catálogo de A a la pieza de B (§2 de `DIRECCION_POSTVENTA`).
 *
 * Este archivo existe porque **las dos piezas están bien por separado y no
 * encajan**, y las dos costuras sólo se ven montándolas:
 *
 * 🔴 ① **`otra_cosa` SE DUPLICA.** El catálogo lo trae como fila real
 *    (`objeto='todos'`, voz «Es otra cosa · contame») y `SelectorMotivo`
 *    **agrega su propia última fila** con `MOTIVO_CONTAME` — la pieza lo hace
 *    a propósito, es lo que vuelve inexpresable un «Otro». Pasado tal cual,
 *    la lista dice lo mismo dos veces. ⇒ acá se saca de la lista y **su voz
 *    se usa como `vozContame`**: la frase sigue saliendo del catálogo, que es
 *    donde el founder la va a leer, y no de un literal que se despega el día
 *    que alguien edite la fila.
 *
 * 🔴 ② **El motivo no tiene glifo.** `SelectorMotivo` lo exige (§2: «cada uno
 *    con su glifo»); `v_motivos_resueltos` no lo devuelve. **Voto de C,
 *    servido a A y a la espera de su palabra:** el glifo es vocabulario de
 *    diseño (`IconoNombre`, Ley 12) y en una fila de catálogo queda fuera del
 *    alcance de `verify:diseno` y del gate por ícono. Vive acá.
 *
 * ⚠️ **Y el mapa es PARCIAL A PROPÓSITO, con su caída declarada.** Un código
 * nuevo en el catálogo que este archivo no conozca cae a `caso` —el glifo
 * neutro del trámite— y `glifosDeMotivoQueFaltan()` lo nombra. *Un mapa que
 * cae en silencio es cómo dos motivos distintos se dibujan igual y nadie se
 * entera; el que cae hablando manda a alguien a elegir el glifo, que es el
 * momento en que hay que elegirlo.*
 */

import { MOTIVO_CONTAME, type IconoNombre, type MotivoDelCaso } from '@epetplace/ui';
import type { MotivoPostventa } from '@epetplace/api';

/** La fila universal del catálogo que la PIEZA ya pone por su cuenta. */
export const CODIGO_CONTAME = 'otra_cosa';

/** El glifo del trámite, para lo que todavía no tiene uno propio. */
const GLIFO_NEUTRO: IconoNombre = 'caso';

/**
 * `codigo → glifo`, sobre los 19 de §4 de la letra.
 *
 * El criterio, escrito para que el próximo no lo adivine: **el glifo nombra
 * el OBJETO del que se habla, jamás el enojo**. Por eso `trato` no lleva una
 * cara triste y `cobro` lleva el glifo de pagos: la lista es una elección
 * serena, no un tablero de quejas (§1: *«no es un botón de alarma»*).
 */
const GLIFO_POR_MOTIVO: Readonly<Record<string, IconoNombre>> = {
  // ── CITA ──
  no_ejecutado: 'atender',
  cancelado_prestador: 'atender',
  no_show_disputado: 'pagos',
  calidad: 'caso',
  duracion: 'hoy',
  trato: 'familia',
  cobro: 'pagos',
  mascota_afectada: 'veterinaria',
  mascota_extraviada: 'ubicacion',
  // ── ESTADÍA ──
  no_recogida_prestador: 'guarderia',
  devolucion_tarde: 'hoy',
  // ── PEDIDO ──
  no_entregado: 'pedido',
  cancelado_vendedor: 'despensa',
  incompleto: 'carrito',
  producto_distinto: 'despensa',
  producto_danado: 'despensa',
  producto_en_mal_estado: 'veterinaria',
};

/**
 * Los códigos del catálogo que este mapa NO conoce. **Se llama y se reporta**
 * — es el rojo de ② y el único motivo por el que el fallback es tolerable.
 */
export function glifosDeMotivoQueFaltan(motivos: readonly MotivoPostventa[]): string[] {
  return motivos
    .filter((m) => m.codigo !== CODIGO_CONTAME && GLIFO_POR_MOTIVO[m.codigo] === undefined)
    .map((m) => m.codigo);
}

export type MotivosParaLaPantalla = {
  /** La lista para `SelectorMotivo`, **sin** la fila de contame. */
  lista: MotivoDelCaso[];
  /** La voz de la última fila, tomada del catálogo (①). */
  vozContame: string;
  /** Códigos sin glifo propio — para que el gate y el parte los nombren. */
  sinGlifo: string[];
};

/**
 * Parte el catálogo en lo que la pieza necesita.
 *
 * ⚠️ **El orden NO se toca:** viene resuelto por el servidor (clase y después
 * código) y el wrapper de A lo declara. Reordenar acá sería fabricarle una
 * prioridad a los motivos que la letra no fijó.
 */
export function motivosParaLaPantalla(
  motivos: readonly MotivoPostventa[],
  vozContameDeRespaldo: string,
): MotivosParaLaPantalla {
  const contame = motivos.find((m) => m.codigo === CODIGO_CONTAME);

  return {
    lista: motivos
      .filter((m) => m.codigo !== CODIGO_CONTAME)
      .map((m) => ({
        clave: m.codigo,
        etiqueta: m.voz,
        glifo: GLIFO_POR_MOTIVO[m.codigo] ?? GLIFO_NEUTRO,
        ...(m.pideFoto ? { pideFoto: true } : null),
      })),
    /* Si la fila universal no viniera, la pantalla NO se queda muda: el
       respaldo es i18n de C. Pero se prefiere la del catálogo siempre. */
    vozContame: contame?.voz ?? vozContameDeRespaldo,
    sinGlifo: glifosDeMotivoQueFaltan(motivos),
  };
}

/**
 * De lo que eligió la pieza al código que entiende el motor.
 *
 * La pieza emite `MOTIVO_CONTAME` (su clave interna) para la última fila;
 * el motor sólo conoce `otra_cosa`. **La traducción vive en un solo lado** —
 * si cada pantalla la hiciera, alcanzaría con que una se olvide para mandarle
 * al motor un código que su catálogo rechaza.
 */
export function codigoParaElMotor(elegido: string): string {
  return elegido === MOTIVO_CONTAME ? CODIGO_CONTAME : elegido;
}

/** ¿Esta elección abre el campo de contar? (§2: la última fila invita.) */
export function pideContar(elegido: string | null): boolean {
  return elegido === MOTIVO_CONTAME;
}
