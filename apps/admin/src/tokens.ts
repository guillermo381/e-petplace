/**
 * LOS TOKENS DE LA CASA, COMO VALORES (letra §3⑤).
 *
 * `packages/ui` es React Native: sus COMPONENTES no se importan acá. Lo que se
 * lee son los **valores** de `packages/ui/src/tokens/` — los mismos hex, la
 * misma escala de 4px, los mismos radios — para que la mesa de operaciones no
 * parezca otro producto.
 *
 * ⚠️ **Están copiados, no importados, y eso es una decisión con costo.**
 * Importar `packages/ui/src/tokens/palette.ts` arrastraría el resto del
 * paquete (que es RN) a un bundle web. El costo declarado: **si la casa cambia
 * un hex, este archivo no se entera.** La cura, si algún día pesa, es que los
 * tokens salgan de `packages/ui` a un paquete propio sin dependencias de RN —
 * y eso es territorio de B, no de F. Queda anotado en el parte.
 *
 * Fuente de cada valor: `packages/ui/src/tokens/{palette,spacing,radius}.ts`
 * leídos el 7-sep-2026.
 */

export const color = {
  // Superficies (light — la mesa de operaciones vive de día)
  base: '#FAF9F7',      // light0 · papel algodón (D-360, firma founder S58)
  carta: '#FFFFFF',     // light1
  seccion: '#F8F7FC',   // light2
  hover: '#EDEBF5',     // light3
  borde: '#E3E0EF',     // light4
  bordeFuerte: '#C4BFD8', // light5

  // Texto
  texto: '#1D1A2E',     // textLight0
  texto2: '#6B6584',    // textLight1
  texto3: '#A9A4C0',    // textLight2 — decorativo, NO gatea AA
  tinta: '#221E19',

  // Roles funcionales (registro AA — la variante *Dark, regla de dos registros)
  acento: '#8E1F68',    // magentaDark · el registro FUNCIONAL de la capa
  acentoSuave: '#AE3785', // magentaSerie
  oficio: '#0A7268',    // tealDark
  exito: '#1B6E2E',     // verdeVitalDark
  peligro: '#B93333',   // coralDarkTexto
  alerta: '#875809',    // ochreDark
} as const;

/** Base 4px, múltiplos estrictos. NUNCA un valor fuera de la escala. */
export const sp = {
  1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 4: 16, 5: 20,
  6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64,
} as const;

/** Ley de geometría (S58): lo que se ELIGE es rectángulo suave; lo que
 *  INFORMA es píldora. */
export const radio = {
  xs: 4, sm: 8, suave: 10, md: 12, lg: 16, full: 9999,
} as const;

export const fuente = {
  cuerpo:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  /* Los NÚMEROS van en mono con cifras tabulares. Es la Ley 3 de la casa: la
     metadata y la plata se leen en mono, y sin tabular las columnas bailan
     cuando cambia un dígito. En una tabla de plata eso no es estética. */
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
} as const;
