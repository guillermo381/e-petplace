# DIRECTIVA DE CRAFT — LADO CLIENTE

> **DEPÓSITO S80 (28 Jul 2026, orden de mesa A6).** Origen: sesión de
> diseño founder + arquitecto sobre láminas interactivas (26 Jul 2026).
> El header original decía "Sesión: S<n> — asignar número al abrir":
> **la sesión asignada es S80** (nació el 26-jul para una sesión que
> nunca se abrió; el número se asigna acá).
>
> **DOS HUECOS DECLARADOS EN LA PUERTA, no enterrados:**
> 1. **`ACTA_DISENO_CRAFT.md` — el hermano de los porqués — NO EXISTE**
>    (palabra del founder, S80). Consecuencia exigible: **los ítems SIN
>    marca ✅ FIRMADA se RE-ARGUMENTAN en su gate, no se heredan** — el
>    doc que sostenía sus porqués no está para sostenerlos.
> 2. **"Lo medido" de esta directiva es del 26-jul y S79 corrió entera
>    DESPUÉS** (Places, el alta, la reforma del plan, el gate coherente).
>    Su propio §2.6 lo resuelve y por eso se eleva acá: **si la fuente
>    contradice a la directiva, GANA LA FUENTE.** Ningún ítem se ejecuta
>    sin re-verificar contra el código vivo.
>
> **Este depósito NO ejecuta ningún ítem** (§0: la directiva no autoriza
> construir pantalla alguna antes de que el Bloque A esté en la ley).

## §0 QUÉ AUTORIZA ESTA DIRECTIVA

NO autoriza construir pantalla alguna antes de que el Bloque A esté
depositado en DIRECCION_ARTE y en la skill. El Bloque A es ENMIENDA DE
LEY: si las pantallas se construyen antes de enmendarla, se construye
CONTRA la ley vigente y se fabrica deuda que después hay que auditar.

## §0bis LA RECONCILIACIÓN (S80-A6 — el corazón del depósito)

> Entre el 26-jul y este depósito, parte de esta directiva ya entró al
> canon por otras puertas (DIRECCION_ARTE v1.2, S80-A3/A4/A5). Censo
> ítem por ítem con TRES marcas: **MIGRADO** (vive en DIRECCION_ARTE —
> ESA es la fuente única; acá queda la referencia, jamás el texto
> duplicado) · **VIVE ACÁ** (criterio del lado cliente sin equivalente
> de plataforma) · **HUÉRFANO→CASA** (se citaba en el canon sin casa;
> este depósito ES su casa — el motivo del bloque). Verificaciones por
> grep del 28-jul, no de memoria.

**BLOQUE A:**

| Ítem | Marca | Destino/verificación literal |
|---|---|---|
| A1 (huella 0.70/0.50 de la grilla) | **VIVE ACÁ, SIN FIRMA** | las proporciones NO están en DIRECCION_ARTE ni en la skill (grep `0.70`: cero); la regla madre §1 firma que la huella es el relleno, el NÚMERO es nuevo y espera gate |
| A2 (el resto en trazo; la huella único relleno) | **MIGRADO** | es la regla madre de `DIRECCION_ARTE` §1 (S53, firmada) — "objeto del oficio en trazo 1.9 + UNA Huella rellena". Fuente única: §1 |
| A3 (el material del techo: dos paradas ~175°, sombra del mismo color 34-38%, luz interior 1px/16%) | **HUÉRFANO→CASA** | la mesa lo usó en tres láminas y `DIRECCION_ARTE` §4bis lo cita ("el techo tiene dos paradas (A3)"); grep de `34-38`/`luz interior`: cero en el canon. Desde este depósito, A3 vive ACÁ |
| A4 (la luz de la esquina, único adorno del techo) ✅ FIRMADA | **HUÉRFANO→CASA** | `DIRECCION_ARTE` §4bis la cita como "la regla dura de A4" con nota L-142 de sin-casa — esa nota queda RESUELTA: la letra madre es esta fila. La candidata §4bis (la nariz) la enmienda SI su gate pasa; si falla, A4 queda como está |
| A5 (la rampa del isotipo, 6 stops; verdes/amarillo solo-marca; #0F5E56 fuera del cliente) ✅ FIRMADA | **MIGRADO PARCIAL + VIVE ACÁ** | los 6 stops YA viven como `gradients.logo` en `packages/ui/src/tokens/palette.ts` (los mismos hex, fuente única de tokens) y el solo-marca es ley v4 vigente; **lo que vive ACÁ: la EXCLUSIÓN de #0F5E56 y familia del lado cliente** (grep: cero en el canon — es letra nueva). Nota de no-confusión: la rampa de MARCA de `DIRECCION_ARTE` §8.4 (turquesa→magenta) es OTRA regla — dirección de degradados de marca en producto, no los stops del isotipo |
| A6 (SIN CAJA) ✅ FIRMADA | **VIVE ACÁ** | cero equivalente en el canon (grep "SIN CAJA": cero). Firmada el 26-jul; su alcance fino se lee en el gate de cada pantalla (el porqué vivía en el acta hermana que no existe) |
| A7 | **VACÍA — NO SE RECONSTRUYE** | el original dice "ver literal del founder si aparece en el acta hermana" y el acta hermana NO EXISTE: A7 es un número sin letra. Reconstruirla sería L-139. Nace cuando su literal llegue (protocolo D-434/D-435) |

**LAS LEYES L-\*:**

| Ítem | Marca | Destino/verificación literal |
|---|---|---|
| L-b (el relleno pleno se reserva a la ELECCIÓN QUE CIERRA; en fila de barrido la selección va por elevación/escala/color de texto) | **HUÉRFANO→CASA** | la mesa la usó para rechazar la fecha rellena y grep da cero en todo el repo. Desde acá tiene casa. **Cruce declarado, no resuelto:** la ley 19.8 (SE RELLENA LO QUE EXISTE · SE CONTORNEA LO QUE SE FIJA, propuesta S73 sin firma) habla del relleno con OTRO eje (qué ES el dato vs qué CIERRA la elección) — si convergen o chocan lo decide la mesa de D-499, no este depósito |
| L-c (si al quitar la animación dice lo mismo, sobraba) | **VIVE ACÁ, con referencia migrada** | `DIRECCION_ARTE` §9.4 la cita como su espejo ("la forma lleva el dato" es L-c aplicada a la forma estática); la ley del MOVIMIENTO en sí vive acá — la nota "directiva no depositada" de §9.4 queda resuelta por este depósito |
| L-f (el CTA toma el color de la capa; muere tinta/negro como CTA cliente) | **VIVE ACÁ, SIN FIRMA — ⚠️ CHOQUE DECLARADO CONTRA LEY FIRMADA** | contradice de frente la enmienda Ley 21 (S63, FIRMADA en dispositivo): *"cliente en tinta, memorial SIEMPRE tinta"* — el CTA del cliente ES tinta por ley vigente. Por la regla de la casa (S63: un choque contra letra firmada se DECLARA, jamás se difiere en silencio) y por el hueco 1 del header (sin acta de porqués, lo sin-firma se re-argumenta): **L-f NO RIGE hasta gate founder explícito que resuelva el choque.** Hasta ese gate, la Ley 21 manda. **NOTA A7 — el argumento inválido que igual acertó:** la mesa de S80 usó L-f como argumento para rechazar la fecha rellena; **el argumento era INVÁLIDO** (L-f no rige) **y la conclusión SE SOSTIENE por L-b** (la fecha no es la elección que cierra). Registrado para que nadie reabra la fecha creyendo que dependía de L-f |

**BLOQUE F — MOVIMIENTO:**

| Pieza | Marca | Destino literal |
|---|---|---|
| Entrada escalonada 45 ms (+300 ms, bezier de la casa, translateY 15) | **MIGRADO** | `DIRECCION_ARTE` §5 registro S80 (depositado A3, cerrado A5). Fuente única: §5 — la nota de §5 sobre "directiva no depositada" queda resuelta por este depósito |
| Presión 0.972 | **RETIRADA (founder, S80-A6bis)** | el roce que este censo declaró lo resolvió el founder: 0.972 fue transcripción imprecisa de la mesa, no calibración — se retira del Bloque F (nota en el bloque). **Rige `usePresionado` 0.97/0.99 (S62) sin cambio** |
| Empuje de pantalla −16% | **FUERA DEL BLOQUE (mesa A7)** | material de lámina sin depositar como ley — el Bloque F conserva SOLO la entrada |
| Huella de tab con overshoot 280 ms | **FUERA DEL BLOQUE (mesa A7)** | ídem; si algún día se quiere, toca `BarraTabs`/`estadoPorHuella` en packages/ui = enmienda de primitiva con gate propio |
| Foco en fila de barrido (cuatro escalas) | **FUERA DEL BLOQUE (mesa A7)** | sobrevive SOLO como calibración local de D3 (la rueda, su única pantalla); generalizarlo a "fila de barrido" exigiría gate |

**LOS DEMÁS BLOQUES (no exigidos por el censo, reconciliados igual —
"si aparecen más, decilo"):**

- **B3 FilaCita (canto 5 px, degradado a 33% de alfa):** el CONCEPTO del
  canto migró a `DIRECCION_ARTE` §9.1-§9.2 (dos cantos, posición por
  tipo — plataforma); **la CALIBRACIÓN (5 px, 33%) vive acá, lado
  cliente, sin firma.** Vecino directo: el M1 de B7 (el canto del
  prestador) — dos lados, una ley, calibraciones propias.
- **C1-C4 (curas vivas):** VIVEN ACÁ con su propia advertencia (medidas
  pre-S79) — §2.6 obliga re-verificación antes de ejecutar cada una.
- **D2 (los hitos son HECHOS del expediente):** VIVE ACÁ; es la
  aplicación cliente de la frontera ya firmada en `MODELO_LOYALTY` §3
  (la letra madre es esa — acá vive el criterio de lectura).
- **D3 (la rueda de fechas):** VIVE ACÁ, con sus números; consume L-b
  (el elegido no se rellena). **Su ⚠️ es un GATE ABIERTO de dos
  opciones sobre el techo** (el founder rechazó el verde, aceptó el
  petróleo como mejora declarando "aún son colores que no contrastan
  bien") — nadie lo resuelve por él.
- **§10 (alcance):** VIVE ACÁ y es la cláusula que protege al
  prestador: el teal oscuro es suyo, las láminas son CRITERIO no
  evidencia, y las sombras/motion del producto van por los rieles de
  RN (tokens `shadows.ts`/`elevacion.ts` + Reanimated), no por CSS.

**Huérfanas que este censo NO encontró de más:** las cinco conocidas
(A4 · L-c · Bloque F · L-b · A3) quedaron con casa o referencia; A7 es
la única pieza VACÍA (número sin letra, esperando su literal).

## §2.6 LA REGLA DEL LITERAL

Se lee la fuente antes de curar (L-158). Ningún ítem de esta directiva
se da por cierto sin verificarlo contra el código vivo; si la fuente
contradice a la directiva, GANA LA FUENTE.

## BLOQUE A — ENMIENDAS DE LEY (preceden a toda construcción)

A1 · La huella crece y es lo único relleno: 0.70 de la grilla en glifos
     de superficie, 0.50 en tabs.
A2 · El resto del glifo queda en trazo; la huella es el único relleno.
A3 · EL MATERIAL DEL TECHO: dos paradas del mismo tono (claro arriba →
     oscuro abajo, ~175°), sombra proyectada del MISMO color al 34-38%,
     luz interior de 1px al 16% en el borde superior.
A4 · LA LUZ DE LA ESQUINA: círculo de blanco al 7% desbordando por la
     esquina superior derecha del techo, diámetro ~60% del ancho,
     centro fuera del lienzo. Es el ÚNICO adorno permitido en un techo.
     ✅ FIRMADA
A5 · LA RAMPA DEL ISOTIPO: #ff00af · #d32eb7 · #68a2cd · #28e8da ·
     #90ff8b · #fff645. Los verdes de la rampa y el amarillo siguen
     siendo SOLO-MARCA. #0F5E56 y familia quedan fuera del lado
     cliente — es barro, no está en la marca, y colisiona con el
     acento firmado del prestador. ✅ FIRMADA
A6 · SIN CAJA. ✅ FIRMADA
A7 · (ver literal del founder si aparece en el acta hermana)

## LAS LEYES L-*

L-b · El relleno pleno se reserva a la ELECCIÓN QUE CIERRA. En fila de
      barrido (≥4 hermanos comparables de un vistazo) la selección se
      marca con elevación, escala y color del texto.
L-c · EL MOVIMIENTO ES CONSECUENCIA DEL SIGNIFICADO. Prueba de
      admisión: si al quitar la animación la pantalla dice lo mismo,
      la animación sobraba.
L-f · El CTA toma el color de la capa sobre la que actúa. Muere
      tinta/negro como CTA en la app cliente.

## BLOQUE B — COMPONENTES

B3 · FilaCita: canto de capa + columna mono + centro. Canto 5 px, con
     degradado a 33% de alfa.

## BLOQUE C — CURAS VIVAS (lado cliente)

C1-C4 · curas en pantallas de reserva. C3 · voseo.
⚠️ Medidas el 26-jul, ANTES de S79. Re-verificar contra fuente.

## BLOQUE D — PANTALLAS

D2 · Los hitos del expediente: 18 paseos / 6 consultas son HECHOS del
     expediente y por eso pasan. El día que sean "nivel" o "%
     completo", cruzaron a lo que MODELO_LOYALTY §3 prohíbe.
D3 · LA RUEDA DE FECHAS: ítem 66 · separación 10 · paso 76 · el elegido
     SIEMPRE centrado por translateX · escalas 1.16/0.94/0.84/0.78 ·
     opacidades 1/.62/.34/.18 · 520 ms cubic-bezier(.32,.72,0,1) ·
     desvanecido en los bordes. El elegido NO se rellena de color: la
     posición marca la elección (L-b); el acento queda en el número.
     ⚠️ EL TECHO DEL OFICIO NO ESTÁ FIRMADO. El founder rechazó el
     verde y aceptó el petróleo como mejora, declarando que "aún son
     colores que no contrastan bien". Gate de dos opciones: (a) techo
     oscuro con texto blanco, (b) techo en #28e8da con texto en tinta.

## BLOQUE F — MOVIMIENTO

Entrada escalonada 45 ms · 300 ms · cubic-bezier(.32,.72,0,1) ·
desde translateY 15.

> **EL BLOQUE CONSERVA SOLO LA ENTRADA (mesa A7).** El original del
> 26-jul traía además: *presión 0.972* — **RETIRADA** (S80-A6bis:
> transcripción imprecisa de la mesa, no calibración; rige
> `usePresionado` 0.97/0.99, receta única S62 — un tercer valor sería
> enmienda de primitiva con gate propio, y nadie lo pidió) — y *empuje
> de pantalla −16% · overshoot de tab 280 ms · foco en fila de barrido
> con sus cuatro escalas* — **FUERA del bloque de movimiento canónico
> por orden A7**: quedan registrados acá como material de lámina SIN
> DEPOSITAR como ley (el foco de barrido sobrevive como calibración
> local de D3, que es su única pantalla). La fuente única de la
> entrada es `DIRECCION_ARTE` §5 registro S80.

## §10 ALCANCE

La app del prestador queda FUERA: todo esto es lado cliente. La dosis
del prestador (§15b) puede pedir otra calibración, y el teal oscuro
sigue siendo suyo.
Las láminas son web hechas a mano: SON CRITERIO, NO EVIDENCIA — nada
de esto se vio en un teléfono real. El producto es React Native: las
sombras van por elevation + shadowColor/Offset/Opacity/Radius, no por
box-shadow. El motion lo pone Reanimated.
