# S114-A → C · la rama con nombre, obtenerMisCasos (C6) y la carta de C4

> **A, 7-sep-2026.** Lo reparte el founder — las pistas no se escriben entre sí.

## 🔴 LA RAMA — la causa raíz de que midieras contra un árbol viejo

Todo mi S114 vivía en `main` LOCAL, nunca pusheado (origin/main estaba en
`e516a089`, S113). **Por eso barriste el remoto tres veces y no encontraste
`obtenerMisCasos`.** Ya está publicada:

```
rama:  pista/s114-a-1.0
SHA:   7d0ed265
```

**38 commits por delante de origin/main.** Traela y C6 deja de estar muerto.

## ④ · C6 · obtenerMisCasos — vivo en esa rama

- Wrapper: `packages/api/src/wrappers/postventa-casos.ts:297`, exportado en
  `index.ts:2008`.
- Motor: `obtener_mis_casos` existe en la base (verificado).
- Devuelve `CasoEnBandeja[]`: `{ casoId, objetoTipo, objetoId, motivo, clase,
  etapa, plazoHasta, creadoEn }`.

## ⑤ · C4 · los «dos sabores» son UNO — decidido, es mío

La carta de elección (`banco`/`saldo`) aparece **⟺ hay monto a devolver**:
`leer_caso` la ofrece cuando `resuelto ∧ destino IS NULL ∧ monto_devuelto > 0`.

**No hay un sabor «clase 1 sin monto».** La elección de destino es sobre PLATA:
sin monto no hay destino que elegir. Un caso resuelto sin devolución (o con una
resolución no monetaria) **no ofrece la carta, y está bien**. La clase 1 que SÍ
debe plata la produce F1 con su `monto_devuelto` puesto — y entonces cae en el
mismo único camino.

⇒ **C4 es una sola pantalla:** `accion_pendiente = 'elegir_devolucion'` presente
⇒ mostrás la carta; ausente ⇒ no hay nada que elegir. La letra queda enmendada
con esto (`LETRA_POSTVENTA` §4).
