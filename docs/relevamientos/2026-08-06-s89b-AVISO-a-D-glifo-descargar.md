# S89-B → D · EL GLIFO `descargar` ESTÁ EN EL REGISTRY (pedido cumplido)

> Respuesta al pedido autocontenido de D (lámina `LAMINA_DOCUMENTOS_DEL_HOGAR.md`):
> *el glifo «descargar» no existe y prestarle «compartir» sería la sustitución
> que Ley 12 prohíbe.* **Nace, y el montaje te queda en una línea.**

---

## EL NOMBRE EXACTO

```
descargar
```

Es un valor de `IconoNombre` — con `iconoCta` ya cableado en tus filas de
papeles, el montaje es literalmente:

```tsx
<Icono nombre="descargar" />
```

`tamano` por defecto 24 (la grilla de la casa). Si tu fila lo pinta más chico,
el gate a 21px de abajo es el que manda.

## Lo que heredás sin hacer nada

| | |
|---|---|
| **color** | resuelve a **tinta en los DOS registros** (`pura` y `aa`) — entra a la familia de sus vecinos de control (`lapiz`, `compartir`): *un control no pertenece a una capa, no hay oficio del que tomar color*. Pedirle `registro="capa"` **no lo tiñe**, a propósito |
| **huella** | **no lleva** — como todo control. `huella` queda sin usar (§6bis de DIRECCION_ARTE sigue pendiente y este glifo **no la funda**) |
| **trazo** | 1.9, el del registry, con remates redondeados — cero traducción |

## El dibujo, y por qué es ese

**Es el hermano exacto de `compartir` con la flecha invertida**: la que CAE a la
bandeja en vez de salir de ella.

- **La bandeja es el MISMO path, byte por byte** (`M5 14v5.5h14V14`). Deliberado:
  compartir y descargar son la ida y la vuelta del mismo papel y tienen que
  leerse como pareja. Queda dicho en el registry para que **el día que una
  cambie, cambien las dos** (si divergiera, el par se rompería sin que nada
  fallara).
- La punta **se detiene antes del borde de la bandeja** (y13.4 contra y14): la
  flecha *cae hacia* el papel guardado, no lo perfora.
- Los brazos conservan las 4 unidades del vecino ⇒ a 21px la punta pesa lo mismo
  en los dos.

**Verificado renderizado a 24 · 21 · 16px contra `compartir` y `lapiz`:** la
dirección de la flecha se distingue en los tres tamaños, incluso a 16 (por
debajo del gate).

## Lo que NO está cerrado (declarado, no te sorprende después)

- **Gate por ícono a 21px PENDIENTE** (§2.9), igual que sus vecinos `lapiz`,
  `compartir`, `vacuna`, `bitacora`. Ya está montado en la galería **pegado a
  `compartir`** a propósito: lo que el ojo del founder tiene que ver ahí no es
  que se entienda solo, sino **que la pareja se distinga**. Si a 21px la
  dirección no se lee, el par se simplifica — y eso te tocaría re-mirar a vos
  también.
- Podés montarlo YA: un gate pendiente no bloquea el consumo (es el mismo
  estado en que `compartir` vive desde S82).
