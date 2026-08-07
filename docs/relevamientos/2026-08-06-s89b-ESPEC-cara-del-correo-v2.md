# S89-B · LA CARA DEL CORREO **v2** — «más cariño» (enmienda firmada sobre ejemplares reales)

> **Enmienda firmada por el founder** sobre los ejemplares reales de su bandeja.
> **Los TEXTOS quedan: la firma es 100% de diseño.** Letra: *«más cariño»* — el
> correo debe verse **inconfundiblemente de e-PetPlace al abrirlo**; registro de
> referencia **Vercel / Airbnb** (marca clara, aire, jerarquía), **jamás
> catálogo/promo**.
>
> **Esto es v2 de `2026-08-06-s89b-ESPEC-cara-del-correo.md` — PUNTERO, NO COPIA.**
> Todo lo que la v1 fijó **SIGUE RIGIENDO** (paleta, fallbacks tipográficos, el
> código copiable, la regla de la inversión de Gmail, el ancho 600). Acá vive
> **solo lo que cambia y lo que nace.** Demos v2:
> `scripts/capturas/s89-b-correo-v2-{confirmada,solicitada,recordatorio}.html`
>
> **Las tres demos se GENERAN desde un chasis único**
> (`scripts/gen-correo-demos-v2.mjs`) y eso es parte de la tesis: *el chasis
> idéntico es lo que hace que el correo se reconozca al abrirlo* — tres
> archivos a mano divergen al primer retoque (19.9). Lo que varía por tipo está
> declarado en un solo objeto; **el generador es también el contrato que A
> lee.**
>
> Matemática autovalidada contra pares firmados antes de medir (papel/tealDark
> 5.51 reproducido).

---

## ⚠️ ANTES DE TODO — DOS LITERALES DEL FOUNDER QUE NO COINCIDEN (se declara, no se resuelve)

| fuente | dice |
|---|---|
| **mi orden 5** (founder → B) | *«Remitente firmado: `hola@epetplace.com`»* |
| **acta del gate del primer envío** (S88-A, founder → A, nota cosmética 1) | *«El remitente `avisos@avisos.epetplace.com` **se elige a propósito** cuando las plantillas nazcan»* |

**Y la medición decide cuál es ejecutable HOY:** lo verificado en Resend es el
subdominio **`avisos.epetplace.com`** (4 registros vivos en Hostinger); el apex
`epetplace.com` es justamente el que estuvo delegado a Vercel **sin zona** y
nunca resolvió. **Un `From: hola@epetplace.com` hoy no pasa SPF/DKIM ⇒ spam o
rechazo.**

**Propuesta (no decisión):** son DOS campos distintos y pueden convivir —
`From: avisos@avisos.epetplace.com` (lo que la infra sostiene y el gate firmó)
+ `Reply-To: hola@epetplace.com` (la cara que contesta, si la mesa la quiere).
**Lo que NO puede seguir: mi v1 imprimió «Este correo salió de
hola@epetplace.com» en el pie** — si el `From` dice otra cosa, **el pie miente**.
En las demos v2 el pie dice **el remitente real del gate**; si la mesa firma el
alias, se cambia en una línea. *Dos letras firmadas que se contradicen son
peores que una equivocada.*

**Y el segundo pedido de esa misma acta, que la espec adopta como REQUISITO:**
`<html lang="{{idioma}}">` **en toda plantilla, siguiendo el idioma del
destinatario** — Gmail leyó «inglés» en el correo del gate y ofreció traducir.

---

## ① EL LOGO ENTRA — «imagen limpia», con su fallback vivo

**La mutación, declarada con su porqué viejo:** la v1 no puso imagen porque
*«los clientes mayoritarios ignoran webfonts; la identidad no se apoya en la
fuente: se apoya en proporción, color y voz»* — un criterio de ROBUSTEZ, no una
prohibición de marca. **La firma lo enmienda: la robustez se conserva Y la
marca entra** — porque la imagen no reemplaza nada, se SUMA sobre un fallback
que ya funcionaba.

| | qué |
|---|---|
| **qué** | el **isotipo** (no el logo completo): `assets/brand/isotipo-gradiente.svg` exportado a **PNG @2x** (64×64 servido a 32×32) |
| **dónde** | imagen estática **hosted en dominio propio** (candidato: `https://avisos.epetplace.com/marca/isotipo-32.png`) — la ruta la fija A |
| **cero tracking** | URL **estática y sin query params**: nada que identifique al destinatario. *Un pixel de tracking disfrazado de logo es exactamente lo que esta decisión no es.* Sin CDN de terceros |
| **alt digno** | `alt="e-PetPlace"` — con imágenes bloqueadas, el alt dice la casa, no `image001.png` |
| **fallback** | **la cabecera de texto de la v1 NO se tira: es el fallback y sigue en el DOM.** El wordmark **«e-PetPlace» va en TEXTO** al lado del isotipo ⇒ con imágenes bloqueadas la cabecera sigue diciendo la casa, con su tipografía y su tinta |

### Por qué el ISOTIPO en gradiente y no un wordmark de imagen — medido

Las imágenes **no se invierten** cuando un cliente fuerza dark (Gmail): un
wordmark de tinta sobre transparente **desaparecería** sobre fondo oscuro. El
isotipo en gradiente de marca sobrevive los tres mundos porque es color
saturado, y **la identidad verbal viaja en texto** (que sí invierte bien):

| stop del gradiente firma | sobre papel | sobre `dark0` | sobre fondo forzado ~`#121212` |
|---|---|---|---|
| `pinkDark #C4008A` | 5.37 | 3.60 | **3.31** |
| `violetDark #7C2DD4` | 6.27 | 3.09 | **2.84** ← el peor punto, declarado |
| `tealDark #0A7268` | 5.51 | 3.51 | **3.23** |

**El peor punto es 2.84 y se acepta con su razón:** el isotipo es **registro
gráfico de MARCA** — la casa ya lo tiene fuera de contabilidad AA (*«el isotipo
es identidad, fuera de contabilidad»*, dosis v4; *«AA gobierna texto, no
gráfica»*, `verify-contrast`). **No porta información**: la porta el wordmark de
texto que va al lado. Opcional para A (barato, dos PNG): swap por
`prefers-color-scheme` a la variante clara del gradiente — **el peor caso sigue
siendo el de arriba**, porque Gmail no honra la query.

---

## ② LA PLANTILLA MADRE v2 — marca, aire y un corazón que respira

**Anatomía (600px, tablas + inline; el `<style>` solo para el dark):**

### a) Cabecera — marca y AIRE
Isotipo 32px + wordmark en texto 18px/600 · **padding 40px arriba, 32 a los
lados** (era 28) · filete `magentaDark` 2px debajo. *La marca ocupa su lugar y
respira; una sola línea de acento en todo el correo.*

### b) Saludo + frase — la voz (SLOT de A)
22px/500 el saludo · 16px/24px el cuerpo. **El texto es de A** (`_voz_notificacion`);
la espec fija el TAMAÑO y el AIRE, jamás las palabras — *los textos quedan.*

### c) 🫀 EL BLOQUE DE DETALLE — el corazón (era «una tabla tímida»)

**La mascota PRESIDE.** No es capricho de diseño: es EL NORTE — *el sujeto del
producto es la MASCOTA, no la transacción.* El bloque deja de ser una grilla de
etiquetas y pasa a tener un sujeto y una jerarquía:

| línea | tamaño | color | contraste |
|---|---|---|---|
| **nombre de la mascota** | **26px / 600** | tinta | **15.05** sobre el tapiz |
| cuándo (día en palabra + hora) | 17px / 500 | tinta | 15.05 |
| con quién / dónde | 14px | tinta .65 | ≈5.0 |

- **Fondo `papelTapiz #FAF2F5`** — pink al 3% sobre papel: **la calidez**. Su
  contraste contra el papel es **1.05**: *no separa, y no tiene que hacerlo* —
  **el fondo da temperatura, el BORDE da estructura** (tinta .35 → 2.23 vs
  papel). **La caja no porta información: el contenido se lee sin ella** (la
  regla de la inversión, aplicada al fondo).
- **Padding 28px, radio 12** — aire adentro, no una celda apretada.

### d) El CTA — y **la casa correcta en el correo correcto**

Los correos no son todos de la misma casa. **`cita_confirmada` y
`cita_recordatorio` van al DUEÑO** (casa cliente) · **`cita_solicitada` va al
NEGOCIO** (casa prestador). El CTA hereda su casa del riel de la app, medido:

| destinatario | fill | label | par que informa | boundary |
|---|---|---|---|---|
| **dueño** (cliente) | `accent.cta` = `ctaOro` | `accent.ctaTexto` = `textLight0` | **9.96** ✓ (el par firmado E1) | el fill da 1.62 vs papel ⇒ **borde tinta .45 = 4.04** |
| **negocio** (prestador) | `tealDark` | papel `light0` | **5.51** ✓ (§15b.2) | el fill **se separa solo: 5.80** vs papel |

> **Y la aparente contradicción con mi v1, resuelta con el número:** la v1 dijo
> «el oro NO rige en papel» y sigue siendo cierto — **como TEXTO o acento**, que
> es donde da 1.62. Acá el oro es **superficie de un botón cuyo texto es tinta
> (9.96)**: el par que porta la información pasa AA de sobra. Es exactamente lo
> que la casa firmó en E1 (*«un solo color para los dos temas, con label en
> tinta»*).

- **Redundancia de canal obligatoria:** debajo del botón, **el mismo destino
  como link de texto subrayado**. Si el fill del botón muere en una inversión
  forzada, el link sobrevive — *nada informativo viaja solo en color* (v1).

### d-bis) 🎯 LA CASA SE HEREDA ENTERA — dos atrapes al generar las demos

Escribir el generador destapó que «la casa» no era solo el CTA. **Si un correo
es del negocio, TODO su vocabulario funcional es del oficio:**

| pieza | cliente | prestador | por qué |
|---|---|---|---|
| CTA | oro + textLight0 (9.96) | tealDark + papel (5.51) | Ley 21 / E1 |
| **fondo del bloque** | `papelTapiz` #FAF2F5 (tinta **15.05**) | **`papelTapizOficio` #F4F8F6** (tinta **15.46**) | es el slot `bg.base` de cada casa (S83-B33/B34). *Un correo al negocio con el tapiz rosa del cliente sería la casa equivocada en el correo correcto* |
| **link de texto** | `magentaDark` (7.84) · dark `violetText` | **`tealDark` (5.51)** · dark `teal` (13.23) | **§15b.1: en el prestador el magenta vive SOLO en la marca** — un link magenta ahí es acento funcional prohibido |
| **el filete de la cabecera** | `magentaDark` | **`magentaDark` también** | **es MARCA, no función** — §15b.1 lo permite explícitamente. *La firma de e-PetPlace es la misma para las dos casas; lo que cambia es el vocabulario con el que cada una TRABAJA* |

Los dos tapices dan ~1.0 contra el papel: **temperatura en las dos casas,
estructura por borde en las dos.** La regla se mantiene entera.

### e) Pie — marca chica
Hairline · remitente real · el porqué de recibirlo · **el wordmark chico en
texto** (13px, tinta .65). *La casa firma abajo sin volver a gritar.*

### f) Dark mode (sigue rigiendo de v1)
`dark0` fondo · `textDark0` texto (**17.73**) · bloque a `#12121A` (**16.23**
para el texto, 1.09 contra el fondo — otra vez: temperatura, no separación) ·
acento `violetText` (5.50). El CTA **no cambia de color**: el oro es uno solo
para los dos temas, y su par sigue en 9.96.

---

## ③ Los tres tipos — mismo chasis, distinta TEMPERATURA

Que se vean hermanos es el punto: **el chasis idéntico es lo que hace que el
correo se reconozca al abrirlo.** Lo que cambia es dónde cae el peso.

| tipo | a quién | qué preside el bloque | temperatura | CTA |
|---|---|---|---|---|
| **`cita_confirmada`** | dueño | **la mascota** (26px) | **cálida — es una buena noticia y se siente**: tapiz + CTA oro + la frase confirma | oro «Ver la cita» |
| **`cita_solicitada`** | **negocio** | la mascota + **qué pide** | **expectante, cero celebración** — hay algo que responder | tealDark «Ver la solicitud» |
| **`cita_recordatorio`** | dueño | **el CUÁNDO** (26px: «Mañana · 10:30») | **útil y serena** — recuerda, no festeja | oro «Ver la cita», secundario |

*La celebración se dosifica: si todo celebra, nada celebra.*

---

## Alcance declarado

- **Los TEXTOS de las demos son SLOT, no propuesta de voz** — la firma dice que
  los textos quedan: **A cablea los suyos** (`_voz_notificacion`) dentro de esta
  estructura. Lo que el ojo juzga acá es diseño.
- **A cablea y dispara la tanda de muestra v2 a la bandeja del founder** — su
  ojo sobre el correo REAL es el gate, como hoy.
- Pendientes de A al cablear: hostear el PNG del isotipo (ruta y export), el
  `lang` por destinatario, y la decisión del remitente de arriba.
- **Candidato NO resuelto (y no lo resuelvo acá):** la FOTO de la mascota en el
  correo sería la calidez máxima — pero las fotos viven en bucket **privado**
  con URL firmada, y meter una URL de foto en un correo es una decisión de
  **privacidad**, no de diseño. Se nombra para la mesa.
