# S89-B · LA CARA DE LOS DOCUMENTOS — espec de identidad para los tres papeles (foco ④)

> **Orden de apertura S89-B, orden 6.** Mismo patrón que la orden 5: espec +
> demos estáticas como CRITERIO para el ojo del founder, no evidencia. **Los
> documentos vivos y su motor de generación son territorio A.** Matemática de
> contraste autovalidada contra pares firmados (papel/tealDark 5.51
> reproducido) antes de medir nada.
>
> Los tres papeles: **historia clínica · carnet de vacunas · certificado.**
> Demos: `scripts/capturas/s89-b-doc-demo-{historia-clinica,carnet-vacunas,certificado}.html`

---

## ① La espec de identidad — tokens a papel/PDF

**La superficie de un documento es el PAPEL FÍSICO: `#FFFFFF`, cero tinta de
fondo** — no el `light0` de pantalla (ese es el papel de la APP; la impresora
no pinta fondos). Todo se re-midió contra blanco, no se heredó de la orden 5:

| rol | token | hex | contraste sobre BLANCO | veredicto |
|---|---|---|---|---|
| texto (todo el contenido clínico) | `tinta` | `#221E19` | **16.56** | AAA — el documento es tinta, casi entero |
| metadata / rótulos secundarios | tinta al 65% | `#6F6D6A` (compuesto) | **5.16** | AA |
| **acento — el MISMO veredicto que la orden 5, con número propio** | `magentaDark` | `#8E1F68` | **8.25** | AA+ — y en papel se DOSIFICA aún más abajo (ver regla de sobriedad) |
| `ctaOro` | — | `#FCBC1D` | **1.70** | ✗ **no rige** — el documento es superficie papel; el alcance firmado del oro (muro/degradado) no lo alcanza |
| `pink` puro | — | `#FF00AF` | 3.58 | gráfica sí, texto no — y la reserva de marca pesa doble en un papel clínico |
| `tealDark` | — | `#0A7268` | 5.80 | del oficio; el documento habla por el EMISOR, no por la plataforma — no entra |

**LA REGLA DE SOBRIEDAD (es parte del valor):** un papel con valor clínico
se parece a un documento, no a una pieza de marketing. El acento
`magentaDark` aparece en **UN solo lugar**: el filete de la cabecera (y los
links, solo en el PDF digital, subrayados). **Todo el contenido es tinta.**
La marca está presente sin gritar: wordmark chico + filete + la voz.

### Tipografía — con fallback de impresión

- **Sans (contenido):** `'DM Sans', Helvetica, Arial, sans-serif` — si el
  motor de A genera PDF, **puede EMBEBER DM Sans** (decisión de A, la espec
  no la fuerza); el fallback imprime digno.
- **Mono (folio · registros · valores medidos):** `'JetBrains Mono', Consolas, Menlo, monospace` — la voz de máquina de la casa: lo que es DATO exacto (folio, credencial, dosis, lote) va en mono, como en la app.
- **Cuerpos (pt de impresión, A4 con márgenes 20 mm):** título del documento 16pt/600 · rótulo de sección 9pt/600 en versalitas espaciadas, tinta .65 · cuerpo 10.5pt/15pt · tablas 9.5pt · metadata y pie 8.5pt.

### Fondos: JAMÁS portan información

Las impresoras (y el print de los navegadores, por default) **descartan los
fondos**. Toda caja se separa por **BORDE** (hairline `rgba(34,30,25,.25)`),
nunca por fill. Un dato que vive en “la celda sombreada” desaparece impreso
— misma familia que la regla de la inversión de la orden 5.

---

## ② Lo que un papel exige y una pantalla no

Un documento vive FUERA del producto: se imprime, se reenvía, se muestra en
una frontera o en otra clínica. Lo que lo hace confiable:

1. **Identidad del emisor, completa y en la cabecera:** el NEGOCIO (nombre ·
   dirección · teléfono) **y** el PROFESIONAL (nombre · credencial/registro —
   la casa ya captura la credencial médica en el alta S79). Son SLOTS que A
   llena del motor; un documento sin emisor identificable no certifica nada.
2. **Dos fechas, nunca una:** la del HECHO (la consulta, la vacuna) y la de
   EMISIÓN del documento. Imprimir solo una es mentir por omisión cuando se
   reimprime un histórico.
3. **Folio + verificación — CANDIDATO, decisión de mesa (no se resuelve
   acá):** folio único en mono (`F-2026-000123`) + **QR a una URL de
   verificación**. La propuesta con su tenedor de privacidad declarado: la
   página del QR muestra SOLO validez · folio · emisor · fecha — **jamás
   contenido clínico sin autenticación** (un QR que abre la historia es una
   fuga impresa en cada copia). Es la respuesta a la falsificación que M3
   (S72) dejó pedida. **La mesa decide: patrón de URL, qué muestra, y si el
   folio nace con el motor o después.**
4. **El blanco y negro es un destino real (se imprime):** el ratio de
   contraste **sobrevive a la escala de grises por construcción** (se define
   sobre luminancia), pero **el MATIZ muere — medido:** verdeVital → gris
   216 · teal → 222 · oro → 212: tres colores distintos, EL MISMO gris.
   ⇒ **el color jamás porta solo la información** (la misma regla que la
   inversión de Gmail en la orden 5, ahora con su caso de impresora):
   estados y procedencias se dicen con PALABRA, no con tinte.
5. **La procedencia SE IMPRIME (propio del carnet, y es de confianza):** la
   casa distingue `declarado por la familia` · `declarado por el prestador`
   · `verificado` — **el papel lo dice fila por fila.** Un carnet que
   imprime una fila declarada-por-familia con la misma cara que una aplicada
   por el profesional fabrica una certificación que no existe.

---

## ③ Las demos (criterio, no evidencia)

Una por papel, en `scripts/capturas/`, **rotuladas MUESTRA adentro del
papel** (un espécimen de documento que pueda circular como real sería
exactamente el problema de falsificación que ② ataca), datos FICTICIOS
(«Clínica Veterinaria Andina», «Luna», «Dra. María Salas» — nada de la DB),
tuteo neutro donde el papel habla.

Qué mira el ojo: ¿se lee como DOCUMENTO (sobrio, confiable) y aun así se ve
la casa? · ¿el emisor preside la cabecera? · ¿las dos fechas están? · ¿la
procedencia se entiende fila por fila (carnet)? · ¿el folio/QR propuesto
molesta o da confianza? · ¿fotocopiado en B/N pierde algo? (no debería —
por diseño).

---

## ④ FRONTERA DECLARADA — memorial (se propone, no se decide)

**Un certificado puede emitirse para una mascota fallecida — es la realidad
clínica** (historial para un seguro, constancia de causa, cierre de un
tratamiento). La propuesta para la cara, a la mesa:

- **La cara NO cambia de estructura ni gana tema memorial:** el papel ya es
  sobrio por diseño — un "modo memorial" del documento sería teatro.
- **Cero celebración, cero adorno:** rige igual que siempre (la sobriedad de
  ① ya lo garantiza; en papel no hay oro ni brillo que apagar).
- **El estado se dice en voz clínica neutra y SOLO si el documento lo
  requiere** (una constancia de vacunas históricas no necesita declararlo;
  una constancia de defunción es su propio documento y pide su propia letra
  — **no se diseña acá**).
- El gate memorial del MOTOR (qué documentos se OFRECEN emitir desde la app
  para una mascota en memorial) es del producto, no de la cara — frontera
  declarada, decide la mesa con A.

---

## Alcance declarado

- Esto NO construye documentos ni motor de render (M3 S72: server-side en
  Edge/Deno — territorio A). Las tablas son copy-paste para A.
- El QR de las demos es un PLACEHOLDER dibujado y rotulado como propuesta —
  no codifica nada.
- La letra de impresión definitiva y la respuesta completa a la
  falsificación (M3) son arco propio con lámina propia (brief S89 §②) —
  esta espec es su insumo de identidad, no su reemplazo.
