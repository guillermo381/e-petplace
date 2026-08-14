/**
 * e-PetPlace — Design Tokens v4 · MOVIMIENTO
 * Portado de v3.1 sin cambio de valores.
 * Curvas en dos formatos: array [x1,y1,x2,y2] para RN/Reanimated
 * (Easing.bezier(...easing.easeOut.bezier)) y string CSS para RN-web.
 */

export const motion = {
  duration: {
    instant:  80,
    fast:     150,
    normal:   250,
    slow:     400,
    verySlow: 600,

    /* ── N10 · EL VOCABULARIO CERRADO DEL MOVIMIENTO (Norte, mesa
       13-ago-2026) ──────────────────────────────────────────────────
       «Un bezier, tres duraciones: 150 micro · 300 estándar · 520
       grande. Qué se anima es lista cerrada. Nada más se mueve.»

       🔴 POR QUÉ SE AGREGAN EN VEZ DE MAPEARSE A LOS DE ARRIBA: de las
       tres del Norte, **solo 150 existía** (`fast`). El 300 vivía como
       número PRIVADO dentro de `Entrada` —con un comentario que lo
       llama «techo de Ley 6: INTOCABLE», o sea una ley escrita en una
       constante local— y el **520 no existía en ninguna parte**. Un
       vocabulario declarado CERRADO cuyos valores no son tokens no es
       un vocabulario: es una convención que cada pieza vuelve a
       teclear, y la primera que teclee 500 en vez de 520 no rompe
       ningún gate.

       Los cinco de arriba NO se tocan y NO se deprecan en esta tanda:
       `normal` (250) tiene consumidores vivos y re-apuntarlos a 300 es
       un cambio VISIBLE en toda la casa — enmienda con gate, no línea
       de token. Lo que nace acá es el vocabulario del Norte con su
       nombre, para que lo NUEVO tenga de dónde salir. */
    micro:    150,  // chips, crossfade de estado
    estandar: 300,  // entradas, Hojas — el techo de Ley 6
    grande:   520,  // la celebración (el destape). Único registro «grande».

    /** EL CUARTO VALOR, y se rotula así porque N10 dice «TRES
     *  duraciones»: el overshoot de la huella de tab pide **280**, que
     *  no es ninguna de las tres. Se deposita con su nombre en vez de
     *  quedar tecleado en la barra, pero **no se cuela al vocabulario
     *  cerrado**: vive rotulado como excepción de UNA candidata.
     *
     *  ☠️ MUERTE: con el gate de `DIRECCION_ARTE` §5.4, que lista el
     *  overshoot como CANDIDATA SIN FIRMA. Si el founder lo firma, el
     *  280 entra al vocabulario con su registro; si lo rechaza, este
     *  token se retira junto con la prop `overshootHuella` de
     *  `BarraTabs`. Un token de candidata no sobrevive a su gate. */
    overshootTab: 280,
  },

  easing: {
    // Entradas de UI — rápido al inicio, suave al final
    easeOut:   { bezier: [0, 0, 0.2, 1] as const,        css: 'cubic-bezier(0, 0, 0.2, 1)' },
    // Confirmaciones táctiles — rebote spring
    spring:    { bezier: [0.34, 1.56, 0.64, 1] as const, css: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    // Transiciones entre pantallas
    easeInOut: { bezier: [0.4, 0, 0.6, 1] as const,      css: 'cubic-bezier(0.4, 0, 0.6, 1)' },
    // Salidas
    easeIn:    { bezier: [0.4, 0, 1, 1] as const,        css: 'cubic-bezier(0.4, 0, 1, 1)' },
  },

  stagger: {
    fast:   60,
    normal: 80,
    slow:   120,
  },

  // Motion de MARCA (S53, DIRECCION_ARTE §5.2): la física de la
  // apertura del Coach, minada del prototipo. El scrim es EFECTIVO
  // (0.4 en pantalla; la Hoja lo traduce sobre palette.scrim).
  marca: {
    aperturaMs: 340,
    aperturaBezier: [0.32, 0.72, 0, 1] as const,
    scrimEfectivo: 0.4,
  },

  // React Native — useNativeDriver: true cuando sea posible (v3.1)
  rn: {
    springConfig: { tension: 180, friction: 12, useNativeDriver: true },
    fadeConfig:   { duration: 250, useNativeDriver: true },
  },
} as const
