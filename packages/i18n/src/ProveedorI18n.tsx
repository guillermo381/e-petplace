/**
 * Provider del riel para el _layout raíz de cada app. Inicializa la
 * instancia (lee la preferencia persistida + locale del dispositivo)
 * y no dibuja hasta estar lista — misma espera silenciosa que las
 * fuentes en los _layout (la init es una lectura de AsyncStorage).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';

import { inicializarI18n } from './instancia';
import type { RecursosPorIdioma } from './tipos';

export function ProveedorI18n({
  recursos,
  children,
}: {
  recursos: RecursosPorIdioma;
  children: ReactNode;
}) {
  const [inst, setInst] = useState<i18n | null>(null);

  // inicializarI18n es idempotente (devuelve la instancia viva), así que
  // recursos puede ir en deps sin re-inicializar aunque cambie la ref.
  useEffect(() => {
    let vivo = true;
    void inicializarI18n(recursos).then((i) => {
      if (vivo) setInst(i);
    });
    return () => {
      vivo = false;
    };
  }, [recursos]);

  if (!inst) return null;
  return <I18nextProvider i18n={inst}>{children}</I18nextProvider>;
}
