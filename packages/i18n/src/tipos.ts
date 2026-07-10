/**
 * Tipos del riel — las keys tipadas son EXIGIBLES: una clave que no
 * existe en el diccionario rompe el typecheck (regla 26 del contrato
 * elevada a bilingüe; se cumple por tooling, no por review).
 */

/** Árbol de textos de un namespace. Los valores admiten interpolación i18next ({{var}}). */
export type Diccionario = { readonly [clave: string]: string | Diccionario };

/**
 * Claves dot-notation de un diccionario: para
 * `{ ajustes: { titulo: '…' } }` produce `'ajustes.titulo'`.
 */
export type ClaveDe<D, Prefijo extends string = ''> = {
  [K in keyof D & string]: D[K] extends string
    ? `${Prefijo}${K}`
    : ClaveDe<D[K], `${Prefijo}${K}.`>;
}[keyof D & string];

/**
 * Espejo estructural: el diccionario en inglés declara EXACTAMENTE las
 * claves del español (ni una menos — traducción faltante rompe el
 * typecheck — ni una más).
 */
export type Espejo<D> = {
  readonly [K in keyof D]: D[K] extends string ? string : Espejo<D[K]>;
};

/**
 * Recursos que un app registra al inicializar el riel: sus namespaces
 * por DUEÑO. El namespace `ui` (la voz de los componentes de
 * @epetplace/ui) es obligatorio por tipo: un app no puede arrancar el
 * riel sin registrar la voz del design system.
 */
export type RecursosPorIdioma = {
  readonly es: { readonly ui: Diccionario } & Record<string, Diccionario>;
  readonly en: { readonly ui: Diccionario } & Record<string, Diccionario>;
};
