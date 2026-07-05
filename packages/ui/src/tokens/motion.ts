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

  // React Native — useNativeDriver: true cuando sea posible (v3.1)
  rn: {
    springConfig: { tension: 180, friction: 12, useNativeDriver: true },
    fadeConfig:   { duration: 250, useNativeDriver: true },
  },
} as const
