# LÁMINA — LA ESQUINA DE LA CAMPANA

> **FIRMADA POR EL FOUNDER · 5 de agosto de 2026.**
> Depositada VERBATIM de la mesa por la pista A. **No se edita al transcribir.**
> Se dibujó contra `docs/relevamientos/2026-08-05-s88a-MEDICION-esquina-campana.md`.

---

- La campana es **INLINE en la fila del techo, jamás absoluta** — el layout la
  cuenta en vez de ignorarla (la cuarta opción que trajiste sin proponer: en el
  prestador ya hay precedente vivo con la insignia de cohorte).
- **CLIENTE:** la campana entra en la fila del techo, a la izquierda del Coach,
  con su espacio reservado. **El Coach NO se mueve** (D-401).
- **PRESTADOR:** en la fila superior, junto a la insignia de cohorte. **La regla
  de truncado no cambia.**
- **NÚMERO CONGELADO: separación mínima 20dp entre zonas táctiles, CON GUARD** —
  es la única de todas que produce un defecto silencioso (un toque que abre lo
  que no era; las demás se ven).
- **Verificación en dispositivo con nombre largo y en inglés** (el caso peor del
  texto).

---

## Nota de la pista A — de dónde salió cada número (no es parte de la firma)

**Por qué INLINE mata dos defectos de un saque, medido:**

| defecto | qué lo produce |
|---|---|
| el texto invade la zona del ícono | los tocables son `position: absolute` — **el texto no sabe que están ahí**, y el saludo del cliente no tiene `numberOfLines` |
| dos zonas táctiles se pisan | `hitSlop: 10` a cada lado: con separación 8dp, **12dp de solape ambiguo** |

*Inline los cura juntos: el layout reserva el ancho, y la separación se vuelve
un `gap` que el guard puede leer.*

**Los 20dp, con su aritmética:** el Coach tiene `hitSlop: 10`; una campana con
el mismo hitSlop necesita `10 + 10` de separación para que las dos zonas no se
toquen. **Menos que eso no se ve en ninguna captura** — solo aparece cuando un
dedo real cae en la banda compartida y se abre lo que no era.

**Y el caso peor del texto está nombrado a propósito:** `en` es más largo que
`es` (*"Good morning, Guillermo"* vs *"Buenos días, Guillermo"*), y el título
del prestador ya trunca a una línea compartiendo espacio con la insignia.
