/**
 * EL DÍA EN VISTA — UN día, DOS ventanas, UNA sola pieza de estado.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 **NACE DE UNA CORRECCIÓN DEL FOUNDER, Y LA CAUSA ES LA QUE IMPORTA.**
 * La primera versión del dual hacía viajar el día **por parámetro de ruta**:
 * la puerta de vuelta usaba `router.navigate({ pathname:'/(tabs)', params:{
 * dia } })` en vez de `router.back()`, porque `back` no lleva params.
 *
 * El día cruzaba —el guard lo probaba en los dos sentidos— **y el gesto
 * estaba mal**: al no ser un POP, la pila animaba la vuelta **como una ida**.
 * Dictado del founder: *«el efecto de transición de pantalla, desde pedidos
 * hacia citas, debe ser del lado contrario — se debe sentir que está
 * regresando»*. Diagnóstico medido: **no era un signo sin invertir; era que
 * no había transición de vuelta en absoluto** — las dos direcciones eran
 * `slide_from_right` porque las dos eran empujes.
 *
 * **La cura no es animar mejor: es que la vuelta VUELVA de verdad.** Con el
 * día acá, la puerta de regreso es `router.back()` a secas — un POP — y la
 * dirección sale **por construcción, no por configuración**. *Una animación
 * que hay que elegir se puede elegir mal; una que se deriva del gesto, no.*
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── Y DE PASO VUELVE LITERAL LA FIRMA ──────────────────────────────────
 * La letra dice *«el selector de fecha compartido: es UN día en DOS
 * ventanas»*. Con el param, el día era **transportado** entre dos estados
 * que podían divergir; acá **es uno solo**. La firma pasa de ser una
 * afirmación sobre el comportamiento a ser una propiedad del tipo.
 *
 * ── POR QUÉ CONTEXTO Y NO MÓDULO SUELTO ────────────────────────────────
 * Un `let` de módulo también sería una sola verdad, pero **no despierta a
 * nadie al cambiar**: las dos ventanas tienen que RE-RENDERIZAR cuando la
 * otra mueve la rueda. Es estado de UI compartido, que es exactamente lo
 * que un contexto es.
 *
 * ── EL `null` SIGNIFICA LO MISMO QUE SIEMPRE ───────────────────────────
 * `null` = **todavía nadie eligió** ⇒ manda el día base de cada ventana (hoy).
 * Se conserva la semántica que el HOY ya tenía en `diaElegido` para que la
 * mudanza no cambie ni un comportamiento (era `useState<string | null>`).
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface DiaEnVista {
  /** `null` = nadie eligió todavía ⇒ manda el día base de la ventana. */
  dia: string | null;
  elegir: (iso: string) => void;
}

const Ctx = createContext<DiaEnVista | null>(null);

export function DiaEnVistaProvider({ children }: { children: ReactNode }) {
  const [dia, setDia] = useState<string | null>(null);
  const valor = useMemo<DiaEnVista>(() => ({ dia, elegir: setDia }), [dia]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/**
 * 🔴 LANZA si no hay proveedor, y es a propósito: un default silencioso
 * daría **dos días en dos ventanas** sin que nada se vea roto — que es
 * justo el defecto que este módulo existe para volver inexpresable.
 * *Un fallback acá no protege: esconde.*
 */
export function useDiaEnVista(): DiaEnVista {
  const v = useContext(Ctx);
  if (v === null) {
    throw new Error('useDiaEnVista fuera de DiaEnVistaProvider — ver la cabecera del módulo');
  }
  return v;
}
