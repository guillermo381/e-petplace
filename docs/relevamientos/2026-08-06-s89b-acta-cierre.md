# S89-B · ACTA DE CIERRE

> **Territorio:** `packages/ui` · tokens · el lint (`verify-diseno.mjs`,
> `verdicto.mjs`) — exclusivo · el censo de regresión · los instrumentos de
> `scripts/`. **Rama:** `pista/s87-b` (S87→S89 en continuidad sobre la misma
> pista, con `origin/main` mergeado adentro al abrir).
> **Worktree:** `e-petplace-s87-B` · árbol limpio · `verdicto.mjs` TODO VERDE.
> **Último hash de construcción: `9d2776b0`** (el glifo + el BIMI); el de este
> acta lo cierra.
> **Regla 87 — el aparato:** no tengo emulador propio; los servidores web de
> captura (8081) quedaron muertos al terminar cada tanda. **Nada mío conectado.**

---

## 1 · LO CONSTRUIDO

**⚖️ EL ORO — medición → firma → pintado** (órdenes 1 y 4)
- **La medición primero, con instrumento autovalidado** (`medir-oro-campana.mjs`
  reproduce dos pares firmados antes de reportar): muro claro **3.41** · muro
  noche **5.95** · **papel 1.62 ✗** · memorial 10.40 · degradado del cliente
  (medición declarada FUERA de la lista pedida, porque ahí vive la campana del
  cliente) peor punto **3.33**.
- **Los dos choques de ley DECLARADOS, no resueltos por mí:** el rojo de papel,
  y que 3.41 cae **debajo del 3.77 que §15b.2 ya prohibía** sobre el muro ⇒ la
  excepción la escribe **A** con el precedente magenta S83.
- **El pintado, por riel:** `Badge forma="huella"` + `superficie="muro"` resuelve
  `ctaOro`; **papel y memorial quedan como hoy** (memorial con guard en la
  PIEZA — no se celebra). **Ningún montaje decide su color.**
- **El instrumento se reforzó, no se ablandó:** pares `oro/MURO` al gate
  (`verify-diseno-pares`, clase fill mín 3) en los cuatro temas — **cero
  excepciones nuevas**.

**⚖️ LA PATA PISA LA CAMPANA** (orden 7, enmienda firmada en dispositivo)
- Huella **12→14dp** (el 3er escalón del estudio ya servido — no un número
  inventado) **superpuesta** al hombro del domo (`top:-1/right:0`, ~62% sobre el
  glifo).
- **R32 medido e INTACTO:** el gap de 20dp siempre midió zonas *táctiles* entre
  hermanos y la huella no lo es ⇒ cero brazos nuevos. **Y el hallazgo lateral:**
  la posición vieja asomaba **5dp al gap sin que R32 pudiera verlo** (el absoluto
  no afecta el layout que el guard lee) — la superposición los devuelve.
- **El oro donde pisa:** 3.41/5.95 alrededor; **1.62 en los 2-3 cruces** del
  trazo con el borde de la pata — borde blando LOCAL, cuantificado, no escondido.

**R33 · la superficie de la huella se declara** (orden 2) — nace del defecto real
que la orden 2 mandó curar: `techo-oficio` montaba `forma="huella"` sin
`superficie` y en claro `accent.active` ES el hex del muro ⇒ **huella invisible
en producción, y el olvido no rompía nada ni se veía**. Cura + regla, con
**discriminador sobre el montaje REAL** (pre-cura ROJO 1/1, curado VERDE 0/1) y
condición de muerte escrita.

**LA CARA DEL CORREO — v1 y v2** (órdenes 5 y 8)
- **v1:** traducción de tokens a correo con el acento **elegido por medición**
  (`magentaDark` 7.84 manda en papel; el oro **no rige ahí**), el código grande
  copiable, y **el par claro/oscuro elegido contra la inversión forzada** (los
  hex que sobreviven se eligen, no se descubren ⇒ *nada informativo viaja solo
  en color*).
- **v2 «más cariño»:** el logo ENTRA (isotipo hosted sin tracking; **el wordmark
  de texto es el fallback vivo** — medido *por qué isotipo y no wordmark-imagen:
  las imágenes no se invierten*), el **bloque de detalle con la MASCOTA
  presidiendo** (26px — EL NORTE, no capricho), CTA con el par firmado 9.96, pie
  con marca chica, y **tres demos generadas desde UN chasis** (que se vean
  hermanos *es* la tesis).
- **Dos choques declarados:** el **remitente** (`hola@` de mi orden 5 vs
  `avisos@avisos.` del acta del gate — **medido: la infra solo sostiene el
  segundo**; mi v1 lo imprimía en el pie ⇒ el pie mentía) y **la casa entera**
  (tapiz + link heredan casa; el filete es MARCA y no).

**LA CARA DE LOS DOCUMENTOS** (orden 6) — espec de los tres papeles con números
**propios sobre papel de impresión** (`#FFFFFF`, no el `light0` de pantalla):
tinta 16.56 · magentaDark 8.25 solo en el filete · oro 1.70 no rige. Lo que un
papel exige y una pantalla no: emisor completo · **dos fechas** · folio+QR como
**decisión de mesa con su tenedor de privacidad** · **el B/N medido** (verdeVital
216 · teal 222 · oro 212: tres colores, el mismo gris) · **la procedencia
impresa fila por fila**. Frontera memorial **propuesta, no decidida**.

**EL GLIFO `descargar` + EL ISOTIPO BIMI** (orden 9)
- Glifo: **hermano exacto de `compartir` invertido**, con **la bandeja byte
  idéntica a propósito y dicho** (el día que una cambie, cambian las dos).
  Verificado a 24/21/16px. Aviso a D depositado con el nombre exacto.
- BIMI: **derivado** del asset vivo (`gen-bimi.mjs`), no dibujado a mano;
  `verify-bimi.mjs` con **8 reglas duras + auto-prueba + contra-caso**, y **la
  garantía del recorte circular por aritmética** (223.6 contra radio 256:
  holgura 32.4). *Su modo de falla es el silencio: un SVG fuera de perfil no
  rompe nada, simplemente no se muestra.*

**EL ÁRBOL DE MONTAJE** (orden 3 — la deuda de instrumento sin dueño desde S87)
`lib-arbol-montaje.mjs`: grafo **por SÍMBOLO**, imports resueltos
transitivamente (288 archivos, 0 sin resolver). **M2** pasa de archivo a
**cadenas ruta→símbolo**; **R32** resuelve hitSlop de vecinos extraídos, con dos
cinturones (auto-prueba rota ⇒ ROJO, no medir de menos; archivo real
desconocido ⇒ rojo hablado). **Y falsó la medición que lo fundó:** el «mixto» de
S86 era artefacto del pareo por archivo — esa ruta importa solo el export SIN
campo. La auto-prueba incluye el **contra-caso anti-verde-vacío**.

## 2 · LO QUE NO CERRÉ, explícito

1. **§6bis de DIRECCION_ARTE — «glifo de control» SIGUE SIN FUNDARSE.** Pendiente
   desde S78. `descargar` entra a la familia (tinta en dos registros, sin huella)
   **sin fundarla**, igual que `campana` en S88. **Cada glifo nuevo que entra por
   el costado hace más caro escribirla** — hoy son cuatro (`lapiz`, `compartir`,
   `campana`, `descargar`). **Dueño: la mesa.**
2. **El gate por ícono a 21px de `descargar`** — montado en galería pegado a
   `compartir`; lo que el ojo juzga es **que la pareja se distinga**. No bloquea
   el consumo de D (mismo estado que `compartir` desde S82).
3. **EL FOSO espera el ojo del founder** — la occlusión v1 deja 2-3 cruces del
   trazo a 1.62. El foso (2dp de recorte) volvería toda frontera ≥3, **pero
   exige integración misma-SVG** (enmienda de `Icono`) porque un foso pintado de
   un sólido remendaría sobre el degradado del cliente. **Se decide viendo, en
   el gate del bundle.**
4. **El gate del bundle entero** — oro, pata-pisa y la huella ya visible viajan
   al ojo del founder por la veda de **A**. Nada de S89-B fue gateado en
   dispositivo por mí (regla 87: sin aparato propio).
5. **La excepción a §15b.2** (el oro 3.41 sobre el muro) — **de A**, con el
   precedente magenta S83: *dos letras firmadas que se contradicen son peores que
   una equivocada*.
6. **El remitente del correo** — decisión de mesa (§ arriba). Y de la misma
   familia: **la foto de la mascota en el correo** sería la calidez máxima, pero
   vive en bucket privado con URL firmada ⇒ **decisión de privacidad, no de
   diseño**. Nombrada, no resuelta.
7. **`verify:bimi` fuera de `verdicto`** a propósito: el asset es estático y
   correrlo en cada commit sería ruido (*un guard que grita donde no pasa nada se
   desactiva solo*). Corre con `gen-bimi.mjs`. El alias en `package.json` es una
   línea de A si lo quiere — no toqué territorio compartido.
8. **`verify:censo` P3 en ROJO por el MUNDO, no por esta pista:** el canon
   declara 186 migraciones y el remoto tiene 187 — el contador de `CLAUDE.md`
   decayó otra vez. **Dueño: A.** El instrumento está haciendo su trabajo.

## 3 · CONTADORES DE MI TERRITORIO, RE-MEDIDOS CONTRA EL OBJETO (L-141)

| contador | valor | método |
|---|---|---|
| **R30** | **49** paths vigilados | del propio lint (era 48). **El +1 cuadra medido:** de mis 3 paths solo la punta (18 chars) supera el umbral `MIN_PATH_R30=18`; el asta (11) no llega y la bandeja (15) tampoco — y además ya existía |
| **glifos del registry** | **41** | **DOS vías que coinciden en el CONJUNTO, no solo en el número**: la union `IconoNombre` despojada de comentarios (L-170) y las claves del objeto de paths. Cero nombres sin path, cero paths sin nombre. **Corregido de 43 en `packages/ui/CLAUDE.md`: el 43 de S88 no es reproducible por ninguna vía** — *un contador que declara DE MÁS es tan falso como uno que declara de menos* |
| **R17 (el exigible)** | `exportaciones=75 · en-galería=66 · exentas=9 · pendientes=0` | leído del lint |
| **componentes** | **52** (sin cambio) | `ls src/components/*.tsx` = 55 − 2 `.web` − 1 infra. **No nació ninguna pieza en S89-B** |
| **R12** | **168** pares | +4 por los `oro/MURO` (uno por tema del corpus); `sobreMuro` pasó de 3 a 4 llamadas |
| **WCAG (`verify:contrast`)** | **178 / 0** | corrido en vivo: el oro entra por `verify-diseno-pares`, no por acá — cero pares nuevos en este gate |
| **assets de marca** | **12 = 8 logos + 4 isotipos** | el 4º es `isotipo-bimi.svg`, **derivado y gateado** (decía «8 logos + 3 isotipos») |
| **R32 · R33** | 2 y 2 montajes | las dos esquinas vivas de C y D |

**Índices al día contra el objeto:** `packages/ui/CLAUDE.md` (glifos 43→41 con su
método · assets 12) y la **skill** (`Badge` con las dos enmiendas firmadas y R33 ·
fila nueva del glifo `descargar`).

## 4 · NOTAS OPERATIVAS (lo que le ahorra un tropiezo al próximo)

- **La galería del prestador vive detrás del login** (auth real, D-290): un script
  de captura que va directo a `/gallery` se cuelga esperando un texto que nunca
  aparece. La receta: login por UI con la clave **por env, jamás hardcodeada**
  (`captura-s89b-gate-campana.mjs`).
- **Un ancla de captura que cita texto de la galería se rompe cuando el texto
  cambia** — me pasó al renombrar la leyenda del oro. Anclar a lo más estable
  que exista, y si el rótulo cambia, el script se actualiza con él.
- **`setContent` + `file://` no carga imágenes locales** en Playwright: para
  previsualizar assets hay que escribir el HTML al disco y `goto` a él.
- **Insertar una fila en una tabla dentro de un blockquote** (`> |`) con
  `replace` sobre el texto sin el prefijo **rompe las dos filas**: la nueva
  queda con `> >` y la vieja pierde su `>`. Se verifica mirando las líneas, no
  el conteo de coincidencias.
- **Los tres correos se GENERAN** (`gen-correo-demos-v2.mjs`): si alguien retoca
  un HTML a mano, el siguiente `node` lo pisa. Se toca el generador.
