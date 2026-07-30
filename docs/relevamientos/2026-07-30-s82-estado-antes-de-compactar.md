# S82 — ESTADO DEPOSITADO ANTES DE COMPACTAR

> **Procedencia declarada (L-166), porque este archivo lo escribe C y
> parte del contenido es de B:** lo marcado **[medido acá]** lo verifiqué
> contra el árbol al escribir esto (leyendo el lint y los archivos). Lo
> marcado **[de B]** es trabajo de otra pista que leí del código, no
> conocimiento propio — si B tiene el porqué fino, el suyo gana.
> Lo marcado **[carne propia]** me pasó a mí y por eso lo puedo contar.

---

## 1 · EL CENSO DE LA GALERÍA (R17) [medido acá, trabajo de B]

**8 EXENTOS** (no son piezas visuales: hooks, providers, recursos y un
sub-export):
`usePresionado` · `useTraduccionUi` · `recursosUi` · `useAviso` ·
`AvisoProvider` · `ThemeProvider` · `useTheme` · `EvidenciaFotoCapturar`.
*(La orden hablaba de 7; el Set del lint tiene 8 — dejo el número
MEDIDO, no el recordado. Es exactamente la clase de dato que L-141 pide
contrastar contra la fuente.)*

**9 PENDIENTES** — tienen export y NO tienen entrada en la galería; el
ratchet solo baja, jamás sube:
`BarrasSemana` · `CantoMarca` · `Entrada` · `EvidenciaFoto` ·
`EvidenciaFotoThumbnail` · `EvitaTeclado` · `HojaScroll` · `Huella` ·
`LineaDeVidaNodo`.

**La regla, en una línea:** todo export de `packages/ui` que sea pieza
visual tiene entrada en la galería, o está en una de las dos listas con
su porqué. Una pieza que nace sin entrada y sin lista = rojo.

## 2 · D-580 — LA GALERÍA QUEDA VISIBLE (enmienda founder S82)

**La entrada a `/gallery` vive en Cuenta del cliente y NO se retira ni
se esconde tras `__DEV__` sin ORDEN EXPLÍCITA del founder. El retiro se
DECIDE EN EL GATE DE PRODUCCIÓN, no antes.**

Lo que cambió respecto de la redacción original [de B]: decía que se
retiraba *antes del soft launch* con disparo automático (checklist de
tiendas o primera cohorte). Eso quedó **superseded**: el disparo dejó de
ser un evento del calendario y pasó a ser **una firma**. El argumento de
riesgo sigue vivo (una herramienta de sesión en la superficie real
también la alcanza un usuario) y por eso la deuda **no se cierra** — lo
que cambió es **quién decide y cuándo**.

**El guard R18, con la polaridad que el founder exigió** [medido acá]:
su modo de falla es que la entrada **DESAPAREZCA**, jamás que aparezca.
Vigila dos cosas en positivo: ① la navegación a `/gallery` existe en
Cuenta · ② no está escondida tras `__DEV__` (el gate corre sobre el APK
preview, donde `__DEV__` es false — L-161). **Rojo producido** contra
una Cuenta sin la entrada (exit 1) y verde al restaurar.
**El día que el founder firme el retiro, R18 se borra en el mismo acto.**

## 3 · EL MAPA — QUÉ VIVE LOCAL Y QUÉ VIVE EN `ui` [medido acá]

**Overrides LOCALES del cliente**, todos marcados `@override-s82c` y
atados a su casa por el guard **R10** (que cobró TRES fugas reales en el
día — dos mías al extraer piezas, una al crear una nueva):

| Pieza local | Qué es | Estado |
|---|---|---|
| `components/canto-curva.tsx` | el canto que pinta la curva (color en el portador del radio; el principio de `FilaCita` S80-B15 leído del prestador) | candidata a B |
| `components/filtro-pills.tsx` | los chips de filtro (relleno suave, placa del glifo rellena en el elegido) **+ `FiltroMascotas`** con L-b computada adentro | candidata a B |
| `components/reserva-piezas.tsx` | techo de reserva · rueda D3 con imán · grilla de horas · nulo honesto · pie que desaparece | candidata a B |
| `SERIF_LOCAL` (en el perfil) | la serif del sistema por plataforma, hasta que B dé la pieza | candidata a B |
| `RotuloSeccion` · `FilaIdentidad` (en el perfil) | rótulo con cuenta · fila sin caja por dato | candidatas a B |

**Lo que MURIÓ absorbido por `ui` en el día** (regla 37 — el clon local
se absorbe cuando la primitiva existe): mi wrapper `Pressable` del CTA
deshabilitado, absorbido por **`Boton razonDeshabilitado` + `onRazon`**
[de B]. La división quedó como B la escribió: el componente garantiza
que el toque nunca quede muerto, **la pantalla decide cómo se cuenta**.

**La frontera que respeté todo el día:** cero `packages/ui` desde C. Lo
que necesitaba de ahí se pidió o se esperó; lo que construí local viajó
declarado como candidato.

## 4 · LO QUE APRENDÍ EN CARNE PROPIA HOY

Esto es lo que un yo-nuevo **no va a saber**, y las tres son errores
míos, no teoría:

1. **EL EXIT SE LEE DEL COMANDO, JAMÁS DEL PIPE — y me cobró DOS
   veces el mismo día** (L-191, que ya estaba escrita: no la aprendí,
   la sufrí). `npx tsc … | head` devuelve el exit de `head`, así que un
   typecheck ROJO se lee VERDE. Las dos veces el error estaba ahí y yo
   ya había cantado verde. **La forma correcta: correr el comando solo,
   leer su exit, y recién después mirar la salida.** Corolario que sale
   de esto: en un pipeline, `&& echo "ok"` es decorativo — imprime su
   verde igual (la cura canónica para el árbol limpio es
   `test -z "$(git status --porcelain)"`).

2. **UNA DIRECTIVA NO SE EJECUTA SIN COTEJARLA CONTRA LA FUENTE — y el
   cotejo va en LAS DOS DIRECCIONES.** Porté `text-transform:uppercase`
   de una lámina y resultó ser **el eyebrow que S52 mató** (Ley 3 pide
   el mono en minúsculas; S52/Ley 18 mataron el uppercase trackeado):
   me costó una cura entera. Y la otra cara, más grave: **maté A4 —una
   ley FIRMADA— apoyándome en una medición correcta**. Blanco al 7%
   sobre tinte claro efectivamente no se ve; de ahí a eliminar la ley
   hay un salto que no me correspondía dar. **La medición era mía; la
   conclusión era del founder.** Un choque contra letra firmada SE
   DECLARA (y si hay forma de conservar la intención con otro valor —la
   inversión a tinta— se construye ESA, no la muerte).
   Corolario del mismo día: también verifiqué de más en la otra
   dirección — declaré un hueco ("el relleno de la duración pide una
   prop de B") que **ya estaba resuelto por ley** (`naturaleza="existe"`
   = 19.8). **Una declaración de hueco también se verifica.**

3. **UN TOKEN NO SE ELIGE POR SU NOMBRE NI POR CÓMO LO LLAMÓ UN CENSO**
   [de B, pero la lección es transversal y la anoto para los dos]:
   `bg.overlay` se eligió como fill de un control porque un censo lo
   llamaba "el material intermedio" — **y era un token de HOVER**, con
   19 consumidores y sin presencia de control. El principio que salió:
   *no se toca un token de N consumidores para curar uno*; nace el slot
   propio. Y el hallazgo de diseño que vino con él: **el fill de un
   secundario tonal no puede llegar a 3:1 sin volverse primario, así
   que su canal no es el color: es la superficie apoyada.**

**El hilo que une a las tres:** las tres veces la herramienta o la
fuente tenían la respuesta y yo la pasé por encima — con un pipe, con
una lámina, con un nombre. **La casa ya sabía; yo no pregunté.**

## 5 · LO QUE QUEDA VIVO PARA EL GATE (C)

- **A4 invertida** — la luz en tinta al 7% sobre techo claro. Si tampoco
  se lee, A4 necesita **alcance fino** ("en un techo de MARCA") y eso lo
  firma el founder. **Por eso el techo claro NO PROPAGA** a los otros
  oficios: si la luz muere en cada techo, A4 moriría en veinte pantallas
  sin que nadie lo haya decidido.
- **La rueda D3 con imán** — calibración firmada intacta; el gesto es lo
  nuevo.
- **El CTA apagado** que sube a la hilera y la señala.
- **El paso de mascota en la reserva**: NO debe aparecer viniendo de
  Agendar; **sí aparece y debe** viniendo del log vacío (dos caminos
  reales, no uno — hallazgo al verificar).
- **Declarados sin resolver:** veterinaria no llega al log (¿adopta el
  patrón?) · la ficha del prestador no existe (destino declarado, sin
  construir) · el pago simulado sigue en negro · el canto **estado** vs
  **categoría** (Ley 10) · el `[demo s44]` visible (cura de DATO).
- **Grooming, veterinaria y adiestramiento esperan la firma** antes de
  heredar el patrón del log (regla 83).
