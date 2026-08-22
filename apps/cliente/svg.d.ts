/**
 * Declaración de módulo para los `.svg` que compila `react-native-svg-transformer`
 * (S101-D, tanda 2).
 *
 * Sin esto, TypeScript no sabe qué devuelve `import Logo from './x.svg'` y el
 * typecheck rebota — **el transformer es de Metro, y Metro no le habla a `tsc`**:
 * son dos verdades separadas y hay que declararla de los dos lados.
 */
declare module '*.svg' {
  import type * as React from 'react';
  import type { SvgProps } from 'react-native-svg';

  const contenido: React.FC<SvgProps>;
  export default contenido;
}
