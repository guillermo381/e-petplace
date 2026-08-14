# S97-B · VOLCADO DE CIERRE — packages/ui, los tokens, el lint y los jueces

**Fecha:** 13-ago-2026 · **Territorio:** `packages/ui` · tokens · el lint y los
jueces (criterio, no lista de archivos — enmienda de mesa depositada por A tras
el caso de D-760).

> **El teléfono no fue mío.** Nada de lo de abajo tiene gate en dispositivo
> salvo lo que C haya gateado en su pantalla. Lo que sigue está **medido**, no
> visto.

---

## §1 · LO ENTREGADO — cuatro commits

| Commit | Qué |
|---|---|
| `49adb65a` | **D-760** — el rojo del juez deja de ser prosa y pasa a medirse. El rojo SE QUEDA |
| `fd1b8efb` | **Censo de piezas** de la caminata (`scripts/s97/censo-piezas-caminata.mjs`) |
| `6f4b95b1` | **Censo token-vs-mano** de las diez piezas (`scripts/s97/censo-token-vs-mano.mjs`) |
| `16057411` | **`Insignia` · `onPress` en `estado`** — pedido de C, contrato (a) |

**Los dos bloqueos de C murieron el mismo día.** C consumió la pieza en
`e4e29530` («el interim del estado MUERE») y construyó `lib/escala-radio.ts`
sobre la guía de B para el slider.

---

## §2 · LOS TRES INSTRUMENTOS VIVOS — cuándo se vuelven a correr

Se depositaron **instrumentos y no tablas**: una tabla decae en cuanto alguien
toca una pantalla; esto se re-corre (L-141).

| Instrumento | Disparo |
|---|---|
| `scripts/s97/censo-piezas-caminata.mjs` | **cada vez que C o D toquen una de las cuatro pantallas** de la caminata |
| `scripts/s97/censo-token-vs-mano.mjs` | cuando cambie una de las diez piezas, o antes de contestar un «se ve mal» |
| `scripts/s96/juez-s96.mjs` (inv. 10 curado) | como siempre; su rojo ahora dice POR QUÉ y contra qué fuente |

### Lo que contesta el censo token-vs-mano, en una línea

De **144 propiedades visuales** en las diez piezas que montan en las cuatro
pantallas: **91 de token · 27 del consumidor · 7 semánticas · 7 derivadas ·
4 estructurales · 1 de plataforma · y SOLO 7 A MANO.** Las siete son
geometría: **cero color, cero tipografía escritos a mano.**

⇒ **Todo hallazgo del founder sobre color o tipografía se cura desde el tema o
es del consumidor. Nunca exige abrir una primitiva.**

Las siete, con su costo: `Celda:67` y `CeldaNavegacion:106` (`gap: 2`, y
**`spacing[0.5]` ES 2** — cambio de token exacto, cero cambio visual) ·
`Insignia:311/333` (el diámetro del punto) · `Tarjeta:162`
(`borderTopWidth: 1` del halo, cuyo **color sí es token**).

---

## §3 · LO QUE QUEDA ABIERTO, con dueño

| Qué | Estado medido hoy | Dueño |
|---|---|---|
| **D-789** — `SliderPrecio` miente su nombre | **depositada** con el costo de B: 13 montajes / 14 archivos, 7 en `apps/`. Mesa: **no se renombra ahora**, va a ventana limpia | mesa + B |
| **`DIRECCION_ARTE` §11.3** dice que los glifos «viajan sin consumidor» | 🔴 **sigue diciéndolo** (líneas 895-897) y es **falso**: los cuatro están cableados, y los tres de S84 se montaron ANTES del depósito de §11 (`merge-base`, no fecha) | A (su doc) |
| **La nota de D-781** dice «R35 sigue en baseline 1 y no en 0» | 🔴 **sigue diciéndolo** (línea 13951). **R35 mide DURA EN 0 con baseline vacío.** La nota midió la PRESENCIA del archivo, no su contenido: `animated-icon.tsx` existe en `origin/main` pero fue curado en su lugar (sus dos hex viven en el JSDoc) | A (su doc) |
| **`CeldaNavegacion` importada y no montada** en `cuenta/perfil.tsx:57` | import muerto | C/D |

---

## §4 · LOS DEFECTOS PROPIOS DE LA SESIÓN — cinco, todos cazados antes de reportar

Se escriben porque **tres de los cinco habrían entregado un número creíble y
falso**, que es la clase que esta casa persigue.

1. **El censo de piezas subcontaba en silencio.** El extractor exigía un
   carácter después del nombre y se comía todo `<Pieza` a fin de línea — la
   forma más común de la casa. Totales **17/15/11/11** contra los
   **22/18/13/15** reales. Cazado por cotejo independiente (24 pares
   censo-vs-grep, 24 coincidencias tras la cura).
2. **El censo token-vs-mano daba la respuesta INVERTIDA en `Texto`.** Anclaba
   el valor a fin de línea y perdía las tablas con varias props por línea:
   reportaba `Texto` con TOKEN 0 / CONSUMIDOR 7 —«lo decide quien la monta»—
   cuando tiene su RECETA cableada a `typography.*` adentro. Real: **TOKEN 14**.
   Era la pieza por la que el founder pregunta primero.
3. **Los siete `color: 'primary'|'secondary'` de esa receta caían en A MANO.**
   No son colores: son llaves semánticas que resuelven contra `theme.text[c]`.
   De ahí nace la cubeta SEMÁNTICO — **la respuesta binaria token/mano quedó
   descartada: mintió dos veces.**
4. **`hitSlop` contaba como geometría visual.** Es blanco de TOQUE. Cuatro
   falsos positivos en `Insignia`.
5. **El cierre de `Insignia` quedó en `</View>`** tras cambiar el contenedor.
   Lo habría cazado el `tsc`; se cazó antes.

> Sin las cuatro primeras correcciones el reporte habría dicho **22 valores a
> mano en vez de 7**, con `Texto` marcado como no-tokenizado.

---

## §5 · LOS DOS HUECOS DECLARADOS Y NO CERRADOS

- **El censo token-vs-mano NO ve los mapas semánticos.** Cuando una pieza
  resuelve color por una tabla cuyas llaves no son props de estilo
  (`porConcepto: { paseo: { pura: theme.capa.cuidado } }`), no la alcanza. Por
  eso cada pieza reporta además sus **referencias a token del archivo entero**:
  `Icono` aparece con 3 propiedades y tiene **23 referencias**. *Una pieza con 3
  props y 23 referencias no es una pieza sin diseño — es una que lo resuelve
  por mapa.*
- **El censo de piezas es ESTÁTICO.** Una pieza detrás de un `if` cuenta igual:
  contesta **quién la monta**, jamás si está en pantalla en un instante dado. Y
  no abre las piezas de `ui` — el `Boton` que `Hoja` monta adentro es de B y no
  aparece, porque nadie lo eligió.

---

## §6 · LA LETRA QUE SE CURÓ EN SU LUGAR

Dos filas decían que `Insignia` era *«JAMÁS interactiva»* / *«jamás Pressable,
dos familias»* — **falsas desde S85**, no desde hoy: son TRES familias y una ya
era tocable desde S85-B24. Curadas en la skill y en `packages/ui/CLAUDE.md` con
su línea vieja citada y el «jamás» conservado donde sigue rigiendo: **las
acciones son de `Boton`**.

*Dos letras firmadas que se contradicen son peores que una equivocada:
cualquiera cita la que le conviene y está «en regla».*

**Y la ley que queda escrita, porque es la que evita la próxima discusión:** el
criterio de `Insignia` **nunca fue la familia — es QUÉ HACE EL TOQUE.** Abrir su
propia explicación es legal; filtrar, navegar, reintentar o cambiar el estado
es `Boton`. Está escrito en la prop, que es donde alguien va a venir a buscarlo.

---

## §7 · PARA LA PRÓXIMA B

1. **Disponible para C y D es el trabajo principal**, no el relleno. Los dos
   pedidos de esta sesión se resolvieron distinto y conviene no perder el
   patrón: **uno no había que construirlo** (`SliderPrecio` ya servía para
   kilómetros sin tocar una línea) y **el otro no se podía construir sin un
   solo dato** (qué hace el toque). *Medir el pedido antes de aceptarlo ahorró
   una pieza nueva y evitó abrir una puerta prohibida.*
2. **Un pedido sin contrato se devuelve** — pero se devuelve **con la pregunta
   exacta que lo desbloquea**, no con un «falta el contrato».
3. **Los frenos siguen vigentes:** `BarraTabs/estadoPorHuella` y `usePresionado`
   son enmienda con gate propio; se elevan con costo medido.
4. **`DIRECCION_ARTE` §9bis** siguió fuera de alcance toda la sesión y sus
   candidatas (A1, A3) **no rigen**. Construir contra ellas es fabricar deuda
   auditable.

---

**Medido al cierre:** `tsc` ×3 en 0 · `verify:diseno` VERDE (R35 duro en 0) ·
**WCAG 178 / 0** corrido en vivo, sin pares nuevos (cero color tocado) ·
**cero push** — el push es del founder.
