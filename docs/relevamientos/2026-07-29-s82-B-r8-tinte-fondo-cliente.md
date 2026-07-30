# S82-B r8 · EL TINTE DEL FONDO — freno declarado, medición servida

**Sesión B · 29-jul-2026.** Archivos (76h): **este reporte y nada más.**
**CERO token tocado, cero pantalla tocada.** El porqué del freno está en el
punto 1: el valor que la orden manda leer **no existe en la fuente que la orden
nombra**, y el bloque permanente ordena parar y declarar antes que inventar un
hex. El resto de los puntos SÍ se ejecutó — medición, opciones y separación.

## 1. FRENO — las dos premisas de la orden, medidas contra la fuente

**(a) "El valor sale de las láminas en `docs/laminas/` — leelo del CSS".**
Leídas las dos láminas (`posicion-consolidada.html` y `foto-onboarding.html`):
su fondo es **`--fondo:#EEECE8` = H40° S15% L92%** — un gris **CÁLIDO**, familia
amarillo-naranja, **CERO magenta**. El magenta SÍ vive en esas láminas
(`--magenta:#B01D6F`) pero en el **chip elegido** y el **punto de novedad** —
jamás en el fondo. **No hay ningún valor de fondo con tinte magenta en
`docs/laminas/`.** El `.jpeg` del perfil no tiene CSS y el literal transcrito no
menciona tapiz/tinte/agua (grep en cero).

**(b) "Todos [los 178 pares] se midieron contra #EEECE8".** **Falso, y por eso
lo digo:** se miden contra **`palette.light0 = #FAF9F7`** (papel algodón, D-360
FIRMADO S58 — la línea del token lo dice: *"era lavanda #F5F4FA"*). `#EEECE8`
es el fondo de una MAQUETA WEB; nunca fue token de la casa. Los dos comparten
matiz (H40°) y difieren en luminosidad (92% vs 97.5%) — la lámina es más
oscura, como suele ser una maqueta.

**Lo que esto NO invalida:** que el founder haya visto y aprobado un tinte en
dispositivo. Lo que falta es **el valor**: si vino de una lámina, no es ninguna
de las dos que están depositadas (¿llegó otra imagen?); si vino del ojo sobre
la app, entonces el valor **se elige acá** — y para eso está el §2.

## 2. LOS CANDIDATOS, DERIVADOS DE TOKENS FIRMADOS (no un hex inventado)

Propuesta de B: el tinte se **deriva** como mezcla de dos tokens ya firmados —
**pink puro `#FF00AF` compositado sobre papel algodón `#FAF9F7`**. Así el valor
tiene genealogía (la reserva del magenta de marca + el papel de la casa) en vez
de ser un hex nuevo sin padre.

| Mezcla | Valor | HSL | Contra el papel actual |
|---|---|---|---|
| pink **2%** | `#FAF4F6` | H340° S37% L96.9% | 1.032 (casi imperceptible) |
| pink **3%** | `#FAF2F5` | H337° S44% L96.5% | 1.046 — **el candidato de B para "muy leve"** |
| pink **4%** | `#FAEFF4` | H333° S52% L95.9% | 1.066 |
| pink **5%** | `#FAEDF3` | H332° S57% L95.5% | 1.080 (ya se lee como color, no como papel) |

## 3. PUNTO 2 EJECUTADO — la lista de los que se mueven

**Alcance declarado (aritmética, no pereza):** de los 178 pares, **los que se
mueven son exactamente los que tienen `bg.base` en su composición** — un par
que no lo toca no cambia cuando `bg.base` cambia. En `verify-contrast.ts` hay
**12 sitios** que lo usan (3 accent + capaText ×4 + dangerText + los compuestos
`capaBg⊕base` + los informativos exentos). Medidos con el candidato 3%:

| Par | Antes | Con tinte 3% | Δ |
|---|---|---|---|
| text.primary / base | 16.10 | 15.40 | −0.71 |
| accent.cta (tinta) / base | 16.10 | 15.40 | −0.71 |
| text.secondary / base | 7.19 | 6.87 | −0.32 |
| capaText.comunidadAmplia / base | 6.75 | 6.46 | −0.30 |
| capaText.comunidad / base | 6.38 | 6.10 | −0.28 |
| status.warningText / base | 5.63 | 5.39 | −0.25 |
| status.dangerText / base | 5.57 | 5.32 | −0.24 |
| capaText.cuidado / base | 5.51 | 5.27 | −0.24 |
| capaText.identidad · successText / base | 5.13 | 4.91 | −0.23 |
| capa.comunidad · accent.active (cantos) | 3.40 | 3.25 | −0.15 |
| text.tertiary / base (info, exento) | 3.36 | 3.22 | −0.15 |

**Con 2/3/4/5%: CERO pares caen bajo mínimo** (peor movimiento: −0.50 al 2% ·
−0.71 al 3% · −1.00 al 4% · −1.20 al 5%; el techo lo pone `text.primary`, que
tiene 16:1 de sobra). **El costo de contraste no es el criterio limitante acá —
el criterio es el ojo.** Cuando el valor esté firmado, corro `verify:contrast`
completo y actualizo el conteo oficial.

## 4. PUNTO 3 · LA MARCA DE AGUA — servida, NO aplicada (y un hallazgo)

**Por qué no la toqué:** el agua vive como **override LOCAL en dos pantallas de
C** (`hogar/index:952` y `mascota/[mascotaId]:356`), su promoción está VEDADA
por tu orden r5 punto 3, y esta orden dice "cero pantallas tocadas". Ajustarla
es de C (o mío cuando la promuevas).

**HALLAZGO NO PEDIDO:** el agua **ya está descalibrada entre sus dos casas** —
`opacity 0.06` en el Hogar y **`0.04`** en el perfil. Si "el tinte y el agua son
UNA pieza", esa pieza hoy tiene dos versiones. Es exactamente el argumento para
promoverla al fondo compartido: mientras viva copiada, se va a seguir separando.

**El cálculo contra el fondo nuevo (para que C o yo lo apliquemos sin re-medir):**
la tinta al 4-6% sobre el tinte 3% da `#F1E9ED` / `#EFE7EB` / `#EDE5E9` —
y su **Δ contra el fondo es prácticamente idéntico** al de hoy sobre papel
(1.083 vs 1.082 al 4%; 1.124 vs 1.121 al 6%). **Traducción: el alfa del agua NO
necesita cambiar** — el tinte es tan leve que la presencia del isotipo no se
mueve. Lo que sí cambia es su **matiz** (el agua pasa de gris a rosada), y eso
es precisamente lo que hace que se lea como "papel tapiz" y no como dos capas
sueltas. **Recomendación de B: 5% sobre el tinte 3%** — unifica las dos casas en
un solo número y queda en el medio de la ventana que pediste.

## 5. PUNTO 4 · ¿EL OSCURO TAMBIÉN? — las dos opciones, sin decidir

- **(a) Solo claro.** Lo que el founder aprobó es lo que rige (regla 80: la ley
  después del resultado). Costo: los dos temas dejan de ser espejos — el claro
  tiene tapiz y el oscuro no. Precedente A FAVOR: **ya no son espejos** desde
  r5 (los cantos claros bajaron y los oscuros no) y desde D-360 (el papel
  algodón nunca tuvo gemelo oscuro).
- **(b) El oscuro gana su tinte equivalente.** Coherencia de marca en los dos
  temas; el valor sería pink sobre `bg.base` oscuro al mismo porcentaje. Costo:
  **es una decisión sobre algo que nadie miró** — y en OLED un tinte magenta
  sobre negro se comporta distinto (precedente vivo: el gradiente v2 nació de
  que el cyan se disparaba a verde en OLED). Si se toca, exige su propio gate en
  dispositivo, no arrastre.

**Voto de B si lo pedís: (a)** — con el tinte oscuro como candidato encolado con
gate propio, no como espejo automático.

## 6. PUNTO 5 · LA SEPARACIÓN DEL PRESTADOR — medida, y necesita mecanismo

**Confirmado: el token ES compartido.** Las dos apps montan el MISMO
`lightTheme` (`EpetThemeProvider mode="light"`); el prestador solo difiere en
`cta="oficio"`. **Cambiar `bg.base` en `light.ts` se lo da al prestador
también** — la separación no es opcional, es parte del trabajo.

**El mecanismo ya existe en la casa y es el patrón `cta`:** `themes/index.ts`
resuelve el tema del prestador con un spread sobre `lightTheme`
(`accent: { ...lightTheme.accent, cta: palette.tealDark }`). La separación del
fondo es el mismo movimiento: un slot resuelto por el provider (p. ej.
`ThemeProvider fondo="cliente" | "oficio"`, default oficio/neutro para no mover
al prestador). **Es enmienda de primitiva en MI territorio — la construyo con el
valor firmado, no antes** (armar el riel para un tren que no existe es la clase
de letra muerta que L-193 cobra).

**HALLAZGO que cambia el cómo:** `palette.light0` tiene **DOS consumidores** —
`bg.base` **y `accent.ctaTexto`** (el texto sobre el CTA de tinta). **El tinte
NO puede entrar tocando `light0`**: teñiría también el texto del CTA. Entra como
valor propio de `bg.base` (token nuevo, p. ej. `light0Tapiz`), y esa es otra
razón por la que el hex necesita firma antes de existir.

## Verificación

`verify:contrast` con el fondo ACTUAL: **178 pares / 0 fallos** (corrido hoy en
r5) · `verify:diseno`: **VERDE, 16 reglas** · cero cambio en el árbol de mi
parte esta ronda.

## Lo que necesito de vos para ejecutar

1. **El valor.** O confirmás uno de los candidatos del §2 (mi voto: **3%,
   `#FAF2F5`**), o me pasás la lámina/captura de donde salió el que aprobaste.
2. **El nombre del token** si va como `light0Tapiz` (o el que prefieras).
3. **Punto 4:** (a) o (b).
Con eso: token + separación por slot + `verify:contrast` completo + el agua
unificada al 5% en una sola ronda.
