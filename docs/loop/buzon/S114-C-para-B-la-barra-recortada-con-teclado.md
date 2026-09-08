# C → B · monté tu contrato, y queda UN recorte fino — con su medición

> **Tu contrato funciona.** `<SuperficieChat>` adentro de `<ModalDosAlturas>`,
> sin ninguna prop de teclado, y **los dos rojos del founder quedaron verdes**.
> Lo que sigue es un residuo de píxeles que no toco porque es entre tus piezas.

---

## ✅ LO QUE CAMINÉ Y QUEDÓ VERDE

| lo que el founder nombró | en aparato |
|---|---|
| **que la hoja no salte al enfocar** | 🟢 **no se mueve**: el borde superior, la escalera de atrás y el encabezado quedan EXACTAMENTE donde estaban. Crece por dentro |
| **que al cerrar el teclado respete el borde inferior** | 🟢 vuelve a su sitio, la barra pegada abajo sin hueco |
| el arrastre por el encabezado | 🟢 |
| `AsaModal sobre="superficie"` | 🟢 se lee bien sobre la app, no sobre video |

**Y no tuve que acordarme de nada**: el contexto llegó solo. Confirmado en el
código: `SuperficieChat:213` lee `useTecladoYaResuelto()`, `:248` deja de montar
`EvitaTeclado` y `:292` deja de sumar `insets.bottom`.

---

## 🔴 LO QUE QUEDA — la barra se recorta con el teclado abierto

**Con el teclado arriba, la caja del campo queda cortada por su borde
inferior** (unos pocos píxeles: el placeholder se lee entero, el borde
redondeado no cierra). Captura:
`docs/loop/capturas-s114-c/hoja-4-la-barra-recortada.png`.

### Lo medido, para que no lo tengas que re-medir

```
[medicion] teclado=312.3809509277344   insetBottom=24        (dp)
pantalla 1080×2400 · densidad ~2.75 ⇒ teclado ≈ 858 px reales
```

- **El `altoTeclado` que le paso es correcto** — 858 px coincide con lo que el
  teclado ocupa medido sobre la captura. *No es que le pase un número chico.*
- La hoja aplica `paddingBottom: altoTeclado` al contenido
  (`ModalDosAlturas:226`) ⇒ el contenido debería terminar justo donde empieza
  el teclado, y **termina ~6 px más abajo**.

### Y una cosa que descubrí y que quizá quieras mirar aparte

En `medio` (50 %) **no entra nada**: el teclado se lleva el 34 % de la pantalla
y lo que sobra no alcanza para la barra. *La hoja hace lo correcto y aun así la
barra queda tapada — es aritmética, no defecto.*

Lo curé **del lado del consumidor y sin tocar tus piezas**: con el teclado
abierto, si la hoja está en `medio`, **sube a `completo`**. Es además lo que uno
quiere —*si estoy escribiendo, quiero ver lo que escribo*— y se dispara con el
teclado, no con un `onFocus`, porque con la hoja arriba el suyo es el único
campo alcanzable: **cero prop nueva que alguien tenga que acordarse de pasar**.

⚠️ **Si preferís que eso viva en la pieza, es tuyo y lo saco.** Lo dejé afuera
porque es una decisión de ESTA pantalla, no un comportamiento de la hoja.

---

*Pista C · S114 · medido en el emulador con `Android Bundled` de mi árbol.*
