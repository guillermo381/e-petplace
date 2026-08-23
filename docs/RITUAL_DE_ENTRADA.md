# RITUAL_DE_ENTRADA.md — e-PetPlace · «la puerta se abre como una casa, no como un formulario»

> **Versión: propuesta v1.0 — Mesa 105 (23-ago-2026), para gate del founder EN
> DISPOSITIVO (método firmado: se construye, se publica, se corrige sobre lo
> real).** Hermano de `MODELO_LOGIN.md` (el QUÉ); éste es el CÓMO SE SIENTE.
> Rige entero el canon: regla madre («en cada ícono, la mascota está
> presente») · motion de marca §5 (300ms · bezier .32,.72,0,1 · escalón 120 ·
> ceremonia 520) · N11′ · N15 (la ceremonia vive en las pantallas del dueño) ·
> N16 (rendimiento con número) · N26/N26.1 · MarcaDeAgua · Entrada · Destape.
> Toda pieza declara reduce-motion al nacer.

---

## 0. El principio del ritual

**Tres actos, una sola respiración.** Splash → bienvenida → puerta no son tres
pantallas: son un travelling. El isotipo que aparece en el splash es EL MISMO
que se asienta en la bienvenida y EL MISMO que se recoge en la esquina del
login. Nada aparece dos veces; todo llega desde donde estaba. Esa continuidad
—no la cantidad de animación— es lo que se recuerda.

**Y la mascota está presente desde el primer segundo**, con el vocabulario
propio de la casa: la huella. No fotos de stock, no ilustraciones ajenas — la
huella rellena que ya es el corazón semántico de cada ícono, ahora caminando
por la puerta.

## 1. ACTO I — El splash (nativo)

- Fondo: el **tapiz de marca** (el token de fondo de la casa — jamás blanco
  puro). Isotipo centrado, wordmark **e-PetPlace** debajo. Estático: el splash
  nativo no anima, y no lo finge.
- Su único trabajo: **coincidir al píxel con el primer frame del Acto II**
  (misma posición, misma escala), para que el pase de nativo a app sea
  invisible. El splash no termina: se convierte.
- ⚠️ Deuda declarada: el splash es binario, no OTA. El nuevo viaja en el
  build de la tanda 2 (con biométrico, Google y el nombre del launcher). Hasta
  entonces, el Acto II arranca desde el splash actual sin salto brusco.

## 2. ACTO II — La bienvenida (la ceremonia, N15 la permite acá)

Coreografía, en orden, sobre el frame heredado del splash:

1. **El isotipo respira** una vez (escala 1.0 → 1.03 → 1.0, 520ms de
   ceremonia, curva de la casa). No un rebote: una inhalación.
2. **El paseo de huellas** — la firma de esta pantalla. Una senda de huellas
   (la huella canónica de la regla madre, tinta al 8–10% de opacidad) se
   TRAZA cruzando el tapiz en diagonal, una por una, escalón 120ms, como si
   una mascota acabara de pasar por acá. Al completarse queda quieta, como
   textura de la familia MarcaDeAgua. Costo: opacity por huella, cero layout,
   hilo de UI.
3. **El manifiesto entra** (Entrada canónica: 300ms, translateY 15, escalón
   120 entre líneas): «Tu mascota no tiene un expediente.» / «Tiene **una
   vida**.» — «una vida» en magenta, como hoy.
4. **Las acciones llegan al pie** (misma Entrada, después del manifiesto):
   **Crear cuenta** en variante `marca` (el degradé, que es la excepción
   legítima de ESTA pantalla) · **Ya tengo cuenta** en `ghost` · términos al
   pie, como hoy.

Duración total percibida: ~1.2s desde el splash. Nada bloquea el toque: quien
toca antes, corta la ceremonia sin castigo (N15).

## 3. ACTO III — La transición a la puerta

- Al tocar cualquiera de las dos acciones: la bienvenida **no desaparece — se
  corre**. El contenido sale con la física de la casa y el **isotipo viaja** a
  la esquina superior del login (escala ~0.4, 300ms): la casa sigue siendo la
  casa, solo cambiaste de habitación.
- El **paseo de huellas persiste** entre pantallas (mismo elemento, opacidad
  bajada un escalón): la continuidad literal de que la mascota está acá.

## 4. La puerta (login y registro)

- Fondo: **tapiz + MarcaDeAgua** (la cura del prestador, S81-C) + la senda de
  huellas heredada. Jamás blanco pelado.
- Campos según N11′ (etiqueta afuera, quieta) con **el foco que respira**: el
  borde del campo activo pasa a tinta plena y gana 1pt, 150ms. El movimiento
  vive en el borde, no en la etiqueta.
- **Ojo** en el campo de clave (el componente nuevo de B, gate por ícono).
- ☠️ **EL FOCO A TINTA PLENA SE RETIRA — enmienda firmada (founder, 23-ago-2026):**
  la v1.0 pedía que el borde del campo enfocado pasara a **tinta plena**. **Vuelve
  a `accent.active`** (Ley 5 + el sexto slot de S83-B13), y **B revierte en
  `Campo`, `CampoFecha` y `CampoCodigo` de LAS DOS APPS**. Literal del founder:
  *«fue orden mía sin ver el choque»*. **Lo que SÍ queda: el borde gana 1pt en
  150ms** — el movimiento vive en el borde, no en la etiqueta (N11′ intacta).
  *Se registra la enmienda en vez de reescribir la letra en silencio: B aplicó lo
  pedido Y declaró el choque en la fuente, y ése es el motivo por el que la mesa
  pudo revisarlo antes de que llegara a un gate.*
- Jerarquía N26: **Entrar** en ocre pleno · «¿Olvidaste tu contraseña?» en
  `ghost` · gap `spacing[6]`.
- Validación al salir del campo (N12.3), `Campo.error + PieDeCampo`.
- Registro: idéntico lenguaje + la línea de términos + consentimiento (motor
  de A, tanda 1).
- Teclado: el formulario sube, las acciones ancladas jamás quedan tapadas.

## 5. El momento que se recuerda: la llegada

Al autenticar bien, **la huella se completa**: una huella central se traza
entera (**300ms**, el motivo de espera de marca usado UNA vez como celebración) y
la app abre al Hogar — que recibe con nombre y mascotas. El enamoramiento no
es la animación del login: es que la puerta se abra a algo vivo. La animación
solo es el umbral.

Recuperar hereda el ritual sin ceremonia extra: CampoCodigo + Pegar +
autofill; al validar el código, la misma huella breve.

## 6. Reduce-motion y rendimiento (N15/N16, exigible)

- `reduceMotion`: todas las entradas colapsan a fades ≤150ms; el paseo de
  huellas aparece ya trazado, quieto; la respiración del isotipo no ocurre.
- Solo `opacity` y `transform` en hilo de UI. Cero gradiente animado. Cero
  canvas. Presupuesto: 60fps en el gama media de referencia; si una pieza no
  llega, la pieza cede, no el presupuesto.
- Memorial y contexto de apuro no aplican acá (la puerta es del dueño), pero
  toda pieza declara sus tres temas al nacer, como manda N15.

## 7. Lo que este ritual NO hace

No fotos de mascotas de stock (la mascota de la marca es la huella; fotos
reales llegan cuando sean LAS del usuario, adentro) · no partículas ni
confetti · no splash animado fingido · no toca prestador en v1 (hereda el
lenguaje en su propia mesa) · no inventa física nueva: cada número de este
documento ya estaba firmado en el canon.

> **⚠️ ENMIENDA FIRMADA (founder, 23-ago-2026) — esta última afirmación era
> FALSA para un número, y se corrige en vez de taparse.** La v1.0 pedía
> «~400ms» en §5, y **400 no está en el vocabulario cerrado de N10**
> (150 · 300 · 520): es un `legacy_` congelado por **R51**, que **rechazó el
> intento de usarlo**. ⇒ **§5 dice 300ms** y **el 400 queda declarado como error
> de esta letra, no como número del canon**.
>
> *Lo encontró el juez, no un lector: B reportó el choque en vez de bajar la
> regla para que su código pasara.* **Ésa es la conducta que la casa quiere** —
> una letra que se contradice con el canon se arbitra en la mesa; un juez que
> estorba no se apaga. *Y la lección de forma: una sección que afirma «todo acá
> ya estaba firmado» es una afirmación medible, y por lo tanto falsable — si se
> escribe, alguien la va a poder contradecir con un grep.*

## Historial
- v1.0 propuesta (Mesa 105): escrita sobre DIRECCION_ARTE §1/§5,
  DIRECCION_DISENO N11′/N15/N16/N26 y la medición S104-B del login.
- **Depositada por A en S104 (23-ago-2026), verbatim.**
- **v1.1 — TRES ENMIENDAS FIRMADAS POR EL FOUNDER (23-ago-2026), aplicadas por A
  el mismo día.** Las dos primeras nacieron de que **B reportó el choque en vez de
  bajar el juez**, y las dos corrigen a la letra, no al código:
  ① **§5: la huella de llegada es 300ms, no ~400** — 400 no está en N10 y R51 lo
  rechazó; **§7 queda corregida: el 400 fue error de esta letra, no un número del
  canon** · ② **☠️ §4: el foco a tinta plena SE RETIRA** y vuelve a
  `accent.active` (Ley 5 / S83-B13), con reversión de B en las tres piezas de las
  dos apps · ③ *(fuera de este documento, se anota por trazabilidad)* **cae el
  punto 4 de la tanda 1** —el `redirectTo` del wrapper de recuperación— porque
  **el flujo usa `verifyOtp` con código, no enlace**: era letra escrita contra un
  flujo que esta casa no usa.
