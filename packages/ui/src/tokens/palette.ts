/**
 * e-PetPlace — Design Tokens v4 · PALETA PRIMITIVA
 * Evolución de v3.1 (repo prestadores, congelado) con la paleta
 * canonizada desde los SVG de marca reales (Manual de Marca, Abr 2026).
 *
 * REGLA DE ORO (v3.1, intacta):
 *   Ningún componente escribe un color, tamaño o sombra hardcodeado.
 *   Si no está acá, no existe en el producto.
 *
 * CAMBIOS v3.1 → v4:
 *   · pink   #FF2D9B → #FF00AF  (hex real del logo)
 *   · cyan   #00E5FF → teal #28E8DA  (hex real del logo; B1 lo llama "cyan")
 *   · lime   #C5FF3A → ELIMINADO — su rol (capa vida / success) lo toma
 *     verdeVital #2BE86B (B2.1; el menta de marca #90FF8B quedó solo-marca).
 *     Jade #00F5A0 también sigue deprecado.
 *   · yellow #FFE600 → ELIMINADO — amarillo #FFF645 existe SOLO como
 *     color de marca/logo. JAMÁS rol funcional (status, capa, acento).
 *   · Extensiones v3.1 conservadas con los mismos hex.
 *   · Fondos light re-derivados (§7.3 B1): base nunca blanco puro
 *     (S58/D-360: el base es papel algodón #FAF9F7 — ver light0).
 *
 * ALPHAS PRECOMPUTADAS (lección Kaxo):
 *   Nada de interpolar hex+opacidad en runtime. Toda transparencia vive
 *   acá como string rgba lista para usar. Si algún día entra NativeWind,
 *   el patrón twin -rgb (variables por canal) es obligatorio — anotado.
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA DE DOS REGISTROS (S43-B2.1, firmada por el founder):
 *
 *   Cada color de marca/capa vive en DOS registros: el PURO para
 *   rellenos gráficos (puntos, tints de fondo, indicadores, isotipo,
 *   decoración) en cualquier tema; la variante *Dark AA exclusivamente
 *   donde hay texto o elemento funcional. AA gobierna texto, no gráfica.
 * ═══════════════════════════════════════════════════════════════════
 */

export const palette = {

  // ── Marca (canonizada desde SVG del logo) ──
  pink:      '#FF00AF',  // Capa 3 · comunidad — rgb(255,0,175)
  pinkDark:  '#C4008A',  // variante AA para light — rgb(196,0,138)
  pinkVivo:  '#DF00A1',  // B3.1c — el magenta más vivo que pasa 4.5:1 con blanco
                         // (4.514:1; #E000A2 falla). SOLO stop 0 del gradiente firma dark. rgb(223,0,161)
  magentaDark: '#8E1F68', // S58 (firma founder) — el registro FUNCIONAL de la capa
                          // marca/afecto: acento de CONTROLES del cliente en claro
                          // (selección, toggles, slider, píldoras de día). El puro
                          // #FF00AF conserva su reserva INTACTA (destello, huella de
                          // tab, techo) — este es su registro trabajador, jamás su
                          // reemplazo. Blanco encima gatea AA. rgb(142,31,104)
  teal:      '#28E8DA',  // Capa 2 · cuidado (B1 lo llama "cyan") — rgb(40,232,218)
  tealDark:  '#0A7268',  // variante AA para light — rgb(10,114,104)
  tealDarkNoche: '#0A4A44',  // S63 D-407: EL par oscuro del muro del oficio (papel 9.61 · textDark0 8.81 · teal puro 6.57 — mediciones B, candidato a firmado; el gate visual puede ajustar)
  verde:     '#90FF8B',  // menta de marca — SOLO marca/logo/gradientLogo, no funcional
                         // (acotado en B2.1: la capa vida usa verdeVital) — rgb(144,255,139)
                         // verdeDark #2E7A28 eliminado en B3.1 (huérfano — decisión founder)
  amarillo:  '#FFF645',  // SOLO marca/logo. JAMÁS funcional — rgb(255,246,69)

  // ── Capa Vida (B2.1 — semántica, no cambia por tema) ──
  verdeVital:     '#2BE86B',  // capa vida + success en LOS TRES temas (registro gráfico) — rgb(43,232,107)
  /** S82-B r10 — CURA COORDINADA DEL TAPIZ (medida por R12, no supuesta):
   *  era #1E7A33 y con el tinte encendido el par successText/successBg
   *  caía a 4.42 (el tinte se composita SOBRE bg.base, así que mover el
   *  fondo mueve el tinte y con él el par). Un paso más oscuro: 5.18.
   *  Reversa r10: volver a #1E7A33 junto con papelTapiz a light0. */
  verdeVitalDark: '#1B6E2E',  // texto AA de vida/success en claro — rgb(27,110,46)

  // ── Extensiones v3.1 (mismos hex) ──
  violet:         '#9E3AFF',  // Capa 3 · comunidad amplia — rgb(158,58,255)
  violetDark:     '#7C2DD4',  // rgb(124,45,212)
  violetText:     '#AE59FF',  // violet aclarado MÍNIMO para AA como texto en dark
                              // (S44-B2.3: subió de #A64BFF para pasar también
                              // sobre el tint capaBg — 4.63:1 en el peor par)
                              // (#9E3AFF da 4.16:1 sobre card — gate S43-B2). rgb(166,75,255)
  coral:          '#FF5C5C',  // danger · separado del pink de marca — rgb(255,92,92)
  coralDark:      '#BE3535',  // rgb(190,53,53) — oscurecido MÍNIMO en B2.1: #C73A3A
  coralDarkTexto: '#B93333',  // S82-B r5 (orden founder): UN paso más oscuro — dangerText
                              // sobre dangerBg∘papel daba 4.48 (R12); este paso da 4.69.
                              // Consumidor: light.dangerText (coralDark quedó sin consumidores
                              // de texto — se conserva como escalón de la rampa)
                              // daba 4.30:1 sobre el tint danger saturado (gate WCAG)
  ochre:          '#E8B547',  // warning — rgb(232,181,71)
  /** S82-B r15 — EL CTA DEL CLIENTE, FIRMADO EN GALERÍA (el ámbar más
   *  claro de los tres candidatos, con LABEL EN TINTA). El par que manda
   *  es el label sobre el fill: **tinta 8.40** (blanco daba 2.02 — por eso
   *  el label es tinta y no al revés). Fill vs tapiz 1.83: NO llega al 3
   *  no-textual y está DECLARADO — su canal es la elevación, igual que
   *  `sinCaja` (r12): un fill que llegue a 3:1 contra papel ya es marrón
   *  (medido r11: el más claro que pasa es #966708 y se lee marrón).
   *  Distancia del ámbar de ALERTA (#E8B547, L59%): 9 puntos de
   *  luminosidad y +14 de saturación — si compartieran registro, el color
   *  no diría nada. */
  /** S82-B — EL CTA DEL CLIENTE, **FIRMADO POR EL FOUNDER EN GALERÍA**
   *  (oro A). UN SOLO COLOR PARA LOS DOS TEMAS, con label en TINTA: el
   *  par que manda da **9.96 idéntico en claro y en oscuro**, y eso es
   *  justo lo que hace posible un color único. Vive en el hueco de
   *  CUATRO GRADOS entre el ámbar de alerta (H41.0) y la ventana
   *  prohibida del amarillo de marca (H45.2): H43, S97%, L55%.
   *  Fill vs papel 1.55 · vs negro 11.97 — en oscuro el color carga la
   *  separación, en claro NO (ver la nota de elevación en Boton).
   *  Lo que su firma cierra: `#fff645` queda RETIRADO como CTA oscuro y
   *  **el estatuto solo-marca de la rampa del isotipo queda INTACTO, sin
   *  enmienda** — un color para los dos temas lo volvió innecesario.
   *  Reversa: `accent.cta` a `palette.textLight0` (claro) y
   *  `palette.textDark0` (oscuro), con sus ctaTexto. */
  ctaOro:         '#FCBC1D',  // rgb(252,188,29) — H43 S97% L55% · 2º consumidor S89 (firma orden 4): la huella-novedad del Badge SOBRE EL MURO (claro 3.41 · noche 5.95, pares en el gate; sobre papel 1.62 NO rige — ahí la huella sigue en acento por casa, y memorial no se celebra)
  /** S82-B r10 — CURA COORDINADA DEL TAPIZ: era #925F0C y vivía en
   *  **4.50 EXACTO** sobre su tinte SIN tapiz (el más frágil de los tres
   *  status — cualquier tinte lo tumbaba: 4.35 al 3%). Un paso más:
   *  4.90. Historia del token: B2.1 ya lo había oscurecido desde
   *  #97620C porque daba 4.44. Reversa r10: #925F0C. */
  ochreDark:      '#875809',  // rgb(135,88,9) — warning AA en claro
                              // sobre el tint warning saturado (v3.1 #A66E10 ya había fallado en B2)
  terracotta:     '#D97757',  // hogar, familia — rgb(217,119,87)
  terracottaDark: '#AF5433',  // rgb(175,84,51) — oscurecido MÍNIMO en S43-B2: el v3.1
                              // #B85937 daba 4.25:1 sobre bg.base claro (gate WCAG)
  cream:          '#FAF6E8',  // narrativa cálida — rgb(250,246,232)

  // ── Memorial · M6 (v3.1 intacto) ──
  sage:     '#8FA68E',  // memorial · primario — rgb(143,166,142)
  sageDark: '#6B7A6A',  // rgb(107,122,106)
  rose:     '#C9A0A0',  // memorial · acento cálido — rgb(201,160,160)
  roseDark: '#9E6A6A',  // rgb(158,106,106)

  // ── Fondos dark (v3.1 intactos — dark es opt-in) ──
  dark0: '#050508',   // fondo base ORIGINAL — el universo (reversa r26)
  /** S82-B r26 — EL TAPIZ DEL OSCURO (decisión founder: el tinte va en el
   *  FONDO, no en la tarjeta —descartada explícitamente—; el motivo es
   *  IDENTIDAD: los dos temas tienen que sentirse la misma casa).
   *  Vivo: pink 3% sobre el base (mi recomendación; los 3 candidatos van
   *  al switch de galería — el valor lo firma el founder MIRANDO).
   *  ⚠️ EL ARGUMENTO QUE VIAJA CON ÉL, medido: **cuanto más tinte, MENOS
   *  separación** — el tinte sube la luminancia del fondo y la tarjeta no
   *  se mueve, así que el par card/base BAJA (1.050 → 1.037 al 3% → 1.027
   *  al 5% → 1.009 al 8%, donde card y base son casi idénticos).
   *  EL TECHO: el halo direccional rinde 1.53 contra el fondo en negro y
   *  **cae por debajo de 1.50 a partir del 5%** — de ahí para arriba ni
   *  el halo compensa. Reversa r26: `base: palette.dark0`. */
  /** EL TAPIZ DEL PRESTADOR (S82-B r29) — MISMA GRAMÁTICA, OTRA CASA:
   *  un tinte por casa. Derivado de SU identidad —el teal de su oficio
   *  (§15b), no del cliente—, al mismo 8%.
   *  ¿MUERDE A5? MEDIDO: el tapiz cae dentro de la ventana por NÚMERO
   *  (H187 S52% L6.5%; A5 excluye H~174 con S≥30 y L≤35) — **pero A5 es
   *  del LADO CLIENTE por su propia letra**, y acá el teal ES el acento
   *  firmado del prestador. No muerde; se declara para que nadie lo
   *  descubra después. A esa dilución además es papel, no marca: S52% a
   *  L6.5% sobre negro no identifica nada. Reversa: `palette.dark0`. */
  /** S83-B32 — 5%. El 8% duró un gate: en dispositivo el founder lo llamó
   *  "muy pesado". El 5% es el punto medio medido del mismo eje HSL, y su
   *  par card/base (1.055) sigue por encima del 3% original (1.009).
   *  ── historia, porque explica los números que andan dando vuelta ──
   *  S83-B25 — 8%, FIRMADO por el founder tras gatear DOS VECES que el 3%
   *  "no comunica" / "es muy muy leve". Derivado en HSL desde el ancla del
   *  3% (H190 S27%, L escalada) — el mismo eje con el que nació.
   *  ⚠️ EL MIEDO DEL CLIENTE NO APLICA ACÁ, y por eso el 8% no repite su
   *  historia: allá el 8% dio par card/base 1.009 y borró las tarjetas
   *  (revert fa03ce8); acá el par MEJORA al subir — 1.009 al 3% → 1.199 al
   *  8% — porque este verde y aquel magenta parten de luminancias distintas
   *  respecto de la MISMA tarjeta. Medido, no supuesto.
   *  AA sin novedad: los textos secundario y terciario son ALPHA sobre el
   *  fondo, así que suben y bajan CON él (tertiary 3.22 → 3.21, mín 3).
   *  Reversa: `'#080D0E'`. */
  tapizDarkOficio: '#0D1617',
  tapizDark: '#0D050D',  // S82-B r33: 3% — al 8% el par es 1.009 y con tarjetas VIVAS eso las borra en toda la app
  /** S82-B r19 — LA ELEVACIÓN DEL OSCURO SE EXPRESA COMO LUMINOSIDAD,
   *  no como sombra (la convención del tema oscuro). Era #0D0D12 y daba
   *  **1.05 contra el fondo**: las tarjetas de la app entera se separaban
   *  SOLO por sombra, y en oscuro una sombra oscura sobre fondo oscuro es
   *  invisible POR FÍSICA. El founder lo cazó TRES veces con el ojo (los
   *  chips del 2×2, sinCaja, la duración) y las tres se culpó a la pieza:
   *  era este par. Objetivo propuesto y aplicado: **1.25** — perceptible
   *  sin gritar (1.18 es el piso donde empieza a verse; >1.33 ya se lee
   *  gris claro y rompe la sobriedad del oscuro). El texto encima sigue
   *  altísimo: 14.20. Reversa r19: volver a #0D0D12 (y dark2 a #13131A). */
  dark1: '#0D0D12',   // cards nivel 1 — 1.27 vs base (el 1F1F2A quedaba en 1.2496: al filo por redondeo)
  /** S82-B r19 — sube su escalón o COLAPSA con card: si card está en
   *  1.25 y elevated se queda en 1.11, lo elevado queda MÁS OSCURO que
   *  lo que está debajo. Ahora 1.36. */
  dark2: '#13131A',   // cards nivel 2 / hover
  dark3: '#1A1A24',   // elementos elevados
  /** S82-B r12 — el mismo fill en OSCURO, con MÁS presencia (orden
   *  founder): en dark la elevación es contacto mínimo por diseño, así
   *  que el canal tiene que ser el TONO. 1.49 vs base · texto 11.93. */
  sinCajaDark: '#2C2C3C',
  /** S82-B — EL HUNDIDO DEL OSCURO. `overlay` no sirve para hundir acá:
   *  medido, es **2.6× MÁS LUMINOSO que la tarjeta** (#1A1A24 L=0.01086
   *  vs #0D0D12 L=0.00417), así que un riel de overlay se lee ELEVADO —
   *  la inversión exacta de lo que "hundido" significa. En claro el mismo
   *  token sí hunde (#EDEBF5 es más oscuro que el blanco de la card): el
   *  bug existe SOLO en oscuro, y por eso el slot se resuelve por tema.
   *  Valor: el fondo base — un hueco hacia el fondo ES lo que hunde. */
  hundidoDark: '#050508',
  dark4: '#222230',   // bordes visibles / separadores
  /** S86-B · el hermano oscuro de `light5`. ⚠️ NACE SIN CONSUMIDOR Y SE
   *  DECLARA: en oscuro la gramática ESTÁ/ESPERA ya se separa por el
   *  HALO (E11), igual que el hairline de `Tarjeta` — que también se
   *  enmendó SOLO en claro. Existe para que el día que alguien lo
   *  necesite no invente un hex, y su condición de muerte es la de la
   *  casa: si al 1-oct sigue en cero consumidores, muere (precedente
   *  D-583, los tokens `warm`).
   *  ⚠️ Y OJO CON EL EJE: acá "más presente" es más CLARO, no más
   *  oscuro — sobre fondo negro la separación se compra subiendo. El eje
   *  es el CONTRASTE, que es la letra literal de la firma del hairline. */
  dark5: '#33334A',   // borde de lo PRESENTE en oscuro — SIN consumidor hoy

  // ── Fondos light (§7.3 B1 — DEFAULT del producto) ──
  light0: '#FAF9F7',  // fondo base — PAPEL ALGODÓN (D-360 firmado S58; era lavanda #F5F4FA).
  /** PAPEL TAPIZ (S82-B r9, orden founder) — hermano de papel algodón: el
   *  fondo del tema CLARO con un tinte magenta muy leve. **NACE APAGADO:
   *  su valor de hoy ES `light0` — cero cambio visual, cero tinte al
   *  prestador** (patrón preparado-apagado, precedente D-456/D-579).
   *  El porqué del apagado, declarado: la orden pide que `bg.base`
   *  resuelva acá (punto 1) Y que la separación del prestador se
   *  construya recién con el valor firmado (punto 4) — con un valor
   *  encendido hoy, el prestador recibiría el tinte que la orden le
   *  prohíbe. Así el cableado existe y el color espera su firma.
   *  LOS CANDIDATOS van a la lámina de gate (`papelTapizCandidatos`) —
   *  el ojo elige, no el contraste (medido r8: cero pares caen).
   *  AL FIRMARSE: esta línea toma el candidato + nace el slot de fondo
   *  del provider para que el prestador siga en papel. Reversa: volver
   *  a `light0`. */
  /** EL PAPEL DEL PRESTADOR (S83-B33) — la ENMIENDA de la letra de S82.
   *  Aquella decía "el prestador NO recibe tinte, es fondo del cliente"
   *  (r8 §5, r9 §4) y valía cuando el tinte era UNO. Con "un tinte por
   *  casa" (r29) el oscuro ganó el suyo y el CLARO quedó con la letra
   *  vieja — una casa con tinte en un tema y sin tinte en el otro, que
   *  nadie decidió. El founder lo firmó en S83.
   *  MISMO MÉTODO QUE EL DEL CLIENTE, verificado reproduciéndolo: su
   *  #FAF2F5 es EXACTAMENTE pink puro al 3% sobre light0, así que éste es
   *  teal puro al 3% sobre light0. Mismo hex de marca, misma dosis, mismo
   *  orden — no un verde elegido a ojo.
   *  La escala 2/3/4/5% va a galería para su gate: el founder elige el
   *  nivel mirando, como hizo con el oscuro. Reversa: `light0`.
   *
   *  ✅ GATE CORRIDO Y FIRMADO (founder, 3-ago, sobre la lámina): «llevala
   *  al 5». Pasa de 3% (#F4F8F6) a **5% (#F0F8F6)** — el hex EXACTO de la
   *  escala que él miró, no uno recalculado acá. Reversa del gate: #F4F8F6.
   *
   *  ⚠️ LO QUE LA SUBIDA CUESTA, medido ANTES de commitear porque la mesa
   *  puso freno: **ningún par cae** (bajo mínimo 7 → 7, cero pasan a
   *  reprobar) pero **18 pares empeoran** — el tinte se composita sobre
   *  `bg.base`, así que subirlo sube el fondo y el texto de capa pierde.
   *  Los TRES que quedan al filo en `lightOficio`, para que quien toque
   *  esto después sepa contra qué se está apoyando:
   *      text.secondary/bg.overlay ............ 4.66 (margen 0.16)
   *      capaText.comunidad/capaBg.comunidad .. 4.60 (margen 0.10)
   *      status.dangerText/status.dangerBg .... 4.57 (margen 0.07)  ← el filo
   *  A 6% cualquiera de los tres cae. Si algún día se pide más verde, NO
   *  es mover este número: es la tanda de los textos de capa del claro,
   *  con su re-medición. El margen de 0.07 es el techo real de esta
   *  perilla, y está acá escrito para que no se descubra chocando. */
  papelTapizOficio: '#F0F8F6',
  papelTapiz: '#FAF2F5',  // S82-B r10 ENCENDIDO (orden founder): pink 3% sobre papel algodón
  /** Los candidatos del gate (S82-B r9) — pink puro compositado sobre
   *  papel algodón al 2/3/4/5%: mezcla de DOS tokens FIRMADOS, jamás
   *  hexes huérfanos. El de la lámina de Claude Design ("PAPEL TAPIZ ·
   *  Magenta suave · Cálido") entra como QUINTO cuando el zip llegue al
   *  repo — al abrir esta ronda NO estaba (medido: docs/laminas/ sin él).
   *  Recomendación de B anotada, NO valor: el 3%. */
  papelTapizCandidatos: [
    { etiqueta: '2%', valor: '#FAF4F6' },
    { etiqueta: '3%', valor: '#FAF2F5' },
    { etiqueta: '4%', valor: '#FAEFF4' },
    { etiqueta: '5%', valor: '#FAEDF3' },
  ] as const,
                      // La otra mitad del efecto papel es la sombra de tinta cálida
                      // de tokens/elevacion.ts. Nunca blanco puro.
  light1: '#FFFFFF',  // cards
  light2: '#F8F7FC',  // elevated / secciones
  light3: '#EDEBF5',  // hover states
  /** S82-B r12 — EL FILL DEL SECUNDARIO SIN CAJA (Boton `sinCaja`). NO se
   *  reusa `light3`: es un token de HOVER (su propio comentario lo dice) y
   *  lo consumen 19 componentes vía bg.overlay — no se toca un token de N
   *  consumidores para curar uno (el principio que el founder fijó con
   *  light0 en r9). Un paso más de presencia que el hover, medido contra
   *  el TAPIZ (el fondo real del cliente): 1.23 · texto tinta 12.49. */
  sinCajaLight: '#E0DBE9',
  light4: '#E3E0EF',  // bordes visibles / separadores
  /** S86-B · EL BORDE DE LO PRESENTE — un paso MÁS de presencia que
   *  `light4`, para el único caso donde dos bordes tienen que
   *  distinguirse ENTRE SÍ: la gramática ESTÁ/ESPERA de `TarjetaEstado`.
   *  Medido vs los dos fondos claros: **1.693** sobre papel algodón
   *  (#FAF9F7) y **1.663** sobre el tapiz del oficio (#F4F8F6) — contra
   *  el 1.234/1.212 de `light4`, o sea ~1.4×.
   *  Se eligió sobre #B8B2CE (1.938), que separaba más y empezaba a
   *  leerse como MARCO: la Ley 20 mata el marco, y lo que acá hace falta
   *  es jerarquía entre dos límites, no encerrar. */
  light5: '#C4BFD8',  // borde de lo PRESENTE (ver border.presente)

  /** ── S99-B · EL CONTORNO DEL CAMPO DE ESCRITURA (N11) ──────────────
   *  N11 pide **contorno visible ≥3:1 contra el fondo**, y NINGÚN borde
   *  de la casa lo cumple — medido contra `bg.base` de cada tema:
   *  `border.default` **1.18** (claro) / **1.28** (oscuro) ·
   *  `border.presente` **1.62** / **1.64**. *No es que estuvieran mal:
   *  se diseñaron como hairlines que SEPARAN, y N11 pide un contorno que
   *  CONTIENE.* Dos roles distintos ⇒ valor propio, no un token
   *  reciclado — mismo criterio con el que nació `border.presente`
   *  (nombrado por ROL) y `accent.controlBg` en S98.
   *
   *  LOS TRES ATERRIZAN EN ~3.3-3.4 A PROPÓSITO: el campo se lee
   *  igual de contenido en las tres casas. **Y con margen sobre el 3
   *  deliberadamente** — esta casa ya se quemó con un par «al filo por
   *  redondeo» (la nota de `dark1`), y un piso que se aprueba por el
   *  tercer decimal no es un piso. */
  campoBordeL: '#88829A',  // claro    → 3.34:1 sobre papelTapiz #FAF2F5
  campoBordeD: '#62627A',  // oscuro   → 3.40:1 sobre tapizDark  #0D050D
  campoBordeM: '#5A695A',  // memorial → 3.34:1 sobre bosque nocturno #0A0E0A (verde sereno)

  // ── Tinta (S58, depósito prestador) — superficie del TECHO del
  // prestador (dosis baja: el techo es tinta, no gradiente). Pariente
  // de la tinta cálida de las sombras (31,27,22), un paso más arriba. ──
  tinta: '#221E19',

  // ── Fondos memorial (v3.1 intactos) ──
  memorialDark0:  '#0A0E0A',   // bosque nocturno
  memorialDark1:  '#141A14',   // surface
  memorialLight0: '#FAF6E8',   // pergamino (cream sólido)
  memorialLight1: '#FFFFFF',

  // ── Texto dark (v3.1) ──
  textDark0: '#F0EEF8',
  textDark1: 'rgba(240,238,248,.65)',
  textDark2: 'rgba(240,238,248,.38)',

  // ── Texto light (§7.3 B1) ──
  textLight0: '#1D1A2E',  // primario · también es la "tinta" de CTA prestador
  textLight1: '#6B6584',  // secundario
  textLight2: '#A9A4C0',  // terciario / placeholder (NO gatea AA: decorativo)

  // ── Texto memorial (v3.1) ──
  textMemorialDark:  '#E8DCC8',
  textMemorialLight: '#2A2A1F',

  // ── Tints claros B2.1 (construidos sobre el hex PURO — valores aprobados en mockup) ──
  verdeVitalAlpha20: 'rgba(43,232,107,.20)',   // vida/success (light)
  tealAlpha16:       'rgba(40,232,218,.16)',   // cuidado/info (light)
  pinkAlpha08:       'rgba(255,0,175,.08)',    // comunidad (light)
  ochreAlpha24:      'rgba(232,181,71,.24)',   // warning (light)
  coralAlpha16:      'rgba(255,92,92,.16)',    // danger (light)

  // ── Tint dark de vida ──
  verdeVitalAlpha15: 'rgba(43,232,107,.15)',
  verdeVitalBorder:  'rgba(43,232,107,.30)',

  // ── Alphas dark (precomputadas) ──
  // PARIDAD PERCEPTUAL (B3.3): la paridad de tints es perceptual, no
  // numérica — el magenta satura más por alfa (OLED lo agrava); en claro
  // ya era .08 por esto mismo. Por eso comunidad usa .09/.21 en dark
  // mientras vida/cuidado quedan en .15/.25-.30.
  tealAlpha15:       'rgba(40,232,218,.15)',
  tealAlpha10:       'rgba(40,232,218,.10)',
  pinkAlpha15:       'rgba(255,0,175,.15)',
  pinkAlpha10:       'rgba(255,0,175,.10)',
  pinkAlpha09:       'rgba(255,0,175,.09)',   // tint comunidad dark (paridad perceptual)
  pinkBorderSuave:   'rgba(255,0,175,.21)',   // border comunidad dark (paridad perceptual)
  verdeAlpha15:      'rgba(144,255,139,.15)',
  verdeAlpha10:      'rgba(144,255,139,.10)',
  // ⏪ S85-B6 · REVERTIDO A .15 POR FIRMA DEL FOUNDER, y el porqué vale
  // más que el valor: S85-B4 lo bajó a .12 para curar el par
  // `darkOficio · capaText.comunidadAmplia / capaBg.comunidadAmplia`
  // (4.40 → 4.54, mínimo 4.5). En dispositivo el veredicto fue, literal:
  // «el tinte verde no se ve o no se percibe, ni en claro ni en oscuro».
  // UN AJUSTE IMPERCEPTIBLE NO PAGA SU COSTO — y el costo era real: un
  // token menos legible en su nombre, un tinte de capa más débil, y una
  // cura que el ojo no registra. El par vuelve a 4.40 y queda como
  // REGRESIÓN ABIERTA DECLARADA en R12, que es lo honesto: un número bajo
  // mínimo que nadie percibe sigue siendo un número bajo mínimo, y la
  // decisión de qué hacer con él es del founder, no del lint.
  // El rename volvió con el valor: `violetAlpha15` contiene .15 otra vez.
  violetAlpha15:     'rgba(158,58,255,.15)',
  coralAlpha15:      'rgba(255,92,92,.15)',
  ochreAlpha15:      'rgba(232,181,71,.15)',
  creamAlpha06:      'rgba(250,246,232,.06)',
  /** S85-B26 · EL VIDRIO SOBRE EL MURO — la superficie de un bloque que
   *  se apoya en el techo del oficio. Sube a token desde
   *  `apps/prestador/techo-oficio` (donde nació como `VIDRIO_OFICIO`)
   *  porque ahora lo necesita una pieza de `packages/ui`, y dos copias
   *  del mismo valor se separan un día. Su medición viaja con él: papel
   *  pleno encima da **7.37 AA**, y sobre el muro NOCHE el contraste solo
   *  sube. Es vidrio OSCURO y no claro a propósito — sobre el muro
   *  aclarar no separa, oscurecer sí. */
  vidrioOficio:      'rgba(0,0,0,0.18)',
  terracottaAlpha14: 'rgba(217,119,87,.14)',
  sageAlpha14:       'rgba(143,166,142,.14)',
  roseAlpha14:       'rgba(201,160,160,.14)',

  // ── Alphas light (más sutiles, sobre base clara) ──
  tealAlphaL:       'rgba(10,114,104,.08)',
  pinkAlphaL:       'rgba(196,0,138,.08)',
  violetAlphaL:     'rgba(124,45,212,.08)',
  coralAlphaL:      'rgba(190,53,53,.08)',
  ochreAlphaL:      'rgba(146,95,12,.08)',
  terracottaAlphaL: 'rgba(175,84,51,.06)',
  sageAlphaL:       'rgba(107,122,106,.10)',

  // ── Bordes de acento (precomputados) ──
  tealBorder:        'rgba(40,232,218,.25)',
  pinkBorder:        'rgba(255,0,175,.28)',
  verdeBorder:       'rgba(144,255,139,.30)',
  violetBorder:      'rgba(158,58,255,.30)',
  coralBorder:       'rgba(255,92,92,.30)',
  ochreBorder:       'rgba(232,181,71,.30)',
  terracottaBorder:  'rgba(217,119,87,.30)',
  tealBorderL:       'rgba(10,114,104,.25)',
  pinkBorderL:       'rgba(196,0,138,.22)',
  violetBorderL:     'rgba(124,45,212,.22)',
  coralBorderL:      'rgba(190,53,53,.22)',
  ochreBorderL:      'rgba(146,95,12,.22)',
  terracottaBorderL: 'rgba(175,84,51,.22)',

  // ── Neutros puros ──
  white: '#FFFFFF',
  black: '#000000',

  // ── Scrim (B3.8) — backdrop de la Hoja, derivado de dark0 ──
  scrim: 'rgba(5,5,8,.52)',

  /* ══ MARCA DE MAPA (S99-B · `DIRECCION_ARTE` §6ter) ══════════════════
   * **NO son colores de tema, y por eso NO viven en un slot:** una marca
   * de mapa no se apoya sobre una superficie nuestra — se apoya sobre
   * tiles que no elegimos, y **el mapa no tiene tema** (medido: cero
   * `customMapStyle` en la casa). Un slot por casa habría prometido una
   * variación que el terreno no tiene.
   *
   * ── «EL COLOR PERTENECE AL TERRENO», HECHO NÚMERO ─────────────────
   * La ley dice *«color de marca con la saturación del mapa, jamás un
   * color de interfaz que grita»*. **Se midió la saturación del terreno
   * real y salió una BANDA: 0.10 (asfalto) → 0.58 (agua).** Contra esa
   * banda, nuestros colores de marca gritan: `pink` 1.00 · `tealDark`
   * 0.84 · `magentaDark` 0.64. *Los tres quedan fuera del mundo.*
   *
   * ⇒ **`mapaMoto` es nuestro magenta LLEVADO a la banda** (magentaDark
   * + 35 % tinta): **sat 0.54 — adentro— y 6.61 de contraste contra el
   * peor tono.** Sigue siendo nuestro; deja de gritar.
   * *No se eligió un color bonito: se calculó el que entra en el mundo.* */
  /** El texto ATENUADO sobre el techo oscuro de `BarraTabs` (S99-B).
   *  **Sólido y no alpha, a propósito:** un alpha se compone contra lo
   *  que haya detrás, y detrás de esta barra hay contenido que cambia por
   *  pantalla — el mismo argumento por el que su hueco no se pinta.
   *  Medido: **6.44 contra tinta**, holgado sobre el piso de texto. */
  papelAtenuado: '#A4A19E',

  mapaMoto: '#681F4C',
  /** El destino es un EDIFICIO, no un marcador (§6ter) ⇒ sus tonos son
   *  neutros cálidos del terreno (sat ~0.10), no marca. Dos planos
   *  porque un volumen necesita dos: cuerpo 3.68 · techo 6.34 contra el
   *  mapa, y **1.73 entre sí — lo que hace que se lean como dos caras**
   *  en vez de como una mancha. */
  mapaEdificio: '#6B5F56',
  mapaEdificioTecho: '#443D37',
  /** La sombra en el suelo: negra y translúcida, jamás un gris opaco —
   *  una sombra opaca es una mancha pintada; ésta deja pasar el tile y
   *  por eso el objeto parece apoyado EN él. */
  mapaSombra: 'rgba(20,16,14,.28)',

} as const

/**
 * GRADIENTES — datos para expo-linear-gradient (no strings CSS).
 *
 * gradientLogo — los 6 stops EXACTOS del SVG de marca (vertical).
 *   USO CERRADO: splash y logo. Nada más. El amarillo solo existe acá.
 *
 * gradientFirmaUI v2 (B3.1c — hallazgo del gate en OLED real): 2 stops le
 *   daban al cyan media superficie (se dispara a verde) y el texto perdia
 *   contraste en la zona media. Receta de la app vieja formalizada: violeta
 *   DOMINANTE al centro (location .5), cyan solo en la cola, texto BLANCO
 *   en ambos temas. pinkVivo #DF00A1 = el magenta mas vivo que pasa 4.5:1
 *   con blanco (derivado por script; #E000A2 ya falla con 4.476:1).
 *   CONTEXTOS CERRADOS (B1): hero de onboarding, CTA principal del
 *   dueño, momento adopción. Fuera de eso NO se usa (dosis prestador:
 *   jamás). En memorial: transparent — la marca habla bajito ahí.
 */
export const gradients = {
  logo: {
    colors: ['#FF00AF', '#D32EB7', '#68A2CD', '#28E8DA', '#90FF8B', '#FFF645'],
    locations: [0, 0.06, 0.2, 0.28, 0.48, 0.65],
    angle: 180, // vertical, como el SVG (x1=x2)
  },
  firmaUILight: {
    colors: [palette.pinkDark, palette.violetDark, palette.tealDark],
    locations: [0, 0.5, 1],
    angle: 165,
  },
  firmaUIDark: {
    colors: [palette.pinkVivo, palette.violet, palette.teal],
    locations: [0, 0.5, 1],
    angle: 165,
  },
  transparent: {
    colors: ['transparent', 'transparent'],
    locations: [0, 1],
    angle: 165,
  },
} as const

export type GradientToken = {
  colors: readonly string[]
  locations: readonly number[]
  angle: number
}
