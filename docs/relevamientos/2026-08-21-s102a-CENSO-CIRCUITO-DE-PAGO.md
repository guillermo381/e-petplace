# CENSO A0 · EL CIRCUITO DE PAGO CONTRA LA LEY VISUAL

> **S102-A** · 21-ago-2026 · Frente A de la **MESA 103** · `PLAN_MESA_103` §2-A0
> **Contra qué se midió:** `DIRECCION_ARTE` §9bis · skill `epetplace-design-system`
> (Leyes 1–23 + diccionario 19.x) · `DIRECTIVA_CRAFT_CLIENTE` ·
> `LETRA_PUERTA_DE_PAGO_S101B` v1.3 · las cinco marcas del **gate ⑤** firmadas por
> el founder (`docs/loop/S101-B.md` L2729-2741) · fichas `D-851`→`D-857`.
>
> **Qué es:** el reparto **marca → ley → ficha**, con el estado MEDIDO de cada una.
> **Qué NO es:** una orden de trabajo. Nada de acá se ejecuta sin autorización de
> tanda. **Cero commits de UI en el turno que lo produjo.**
>
> 🔴 **La regla que gobierna este censo, y ya cobró: lo que no tiene ley NO SE
> MARCA.** Se declara como candidato en §4 y espera gate — §0bis de la directiva:
> *lo sin firma se re-argumenta, jamás se hereda.*

---

## §1 · EL BASELINE, fijado ANTES de tocar nada

*Sin baseline no hay «no cambió». Se corrió al abrir, sobre el árbol en `a1f1b231`:*

| Instrumento | Estado al abrir |
|---|---|
| `pnpm verify:diseno` | **VERDE · 49 reglas** encendieron |
| `R57` (la sección de pago es UNA) | **baseline 0** · los 2 checkouts montan `SeccionMedioDePago` + `BotonPagar` · 0 versiones propias |
| `R56` (el oro no es tinta en el cliente) | **DURA EN 0** |
| `R20` (la familia alerta no se rellena) | **0 fills de alerta** |
| `R17` (la galería no envejece) | exportaciones **105** · pendientes **0/0** |
| `pnpm verify:contrast` | **368 pares · 0 fallos** |

---

## §2 · EL MAPA — los siete momentos, con su archivo

**La pieza única que `R57` vigila:**
`apps/cliente/src/components/seccion-medio-de-pago.tsx` — `useMedioDePago` L69 ·
`SeccionMedioDePago` L111 · `BotonPagar` L220. Su hermana:
`components/fila-medio-de-pago.tsx` (`FilaMedioDePago` L82 · `VozVencida` L150).

| # | Momento | Dónde vive |
|---|---|---|
| 1 | **Alta de tarjeta** | app: `app/pagos/alta-tarjeta.tsx` L31 (WebView) · **web: `apps/pagos-web/src/index.html`** (480 líneas, HTML plano + SDK del proveedor; 3DS/OTP en L102-129 y L339) |
| 2 | **Selección de medio** | `seccion-medio-de-pago.tsx` L181-202 (la Hoja) · elegida L134-138 · sin-elegida L158-174 |
| 3 | **Cobro** | despensa `app/(tabs)/despensa/checkout.tsx` L130 · servicios `components/checkout-reserva.tsx` L73, montado por los **cuatro oficios** · motor `lib/pagos/cobro.ts` L60 |
| 4 | **Espera** | pieza `packages/ui/src/brand/EsperaDeTrabajo.tsx` L83 · sondeo `lib/pagos/espera-confirmacion.ts` L73 |
| 5 | **Confirmación** | servicios `checkout-reserva.tsx` L221-275 · despensa `checkout.tsx` L1255+ · **el fracaso NO es pantalla: es aviso** (L183) |
| 6 | **Comprobante** | 🔴 **`supabase/functions/despachar-correo/index.ts` L135-170** — el recibo con columnas concepto/valor **vive en el correo, server-side**. **En la app no existe pantalla «Comprobante»** |
| 7 | **Medios de pago** | `app/(tabs)/cuenta/medios.tsx` L31 · logo `components/logo-franquicia.tsx` L53 |

---

## §3 · LAS MARCAS CON LEY — reparto y estado medido

*Cada fila: la marca, la ley que la arbitra, y **qué encontró el censo**. El orden es
el de la cola A1 del plan; el estado corrige a la cola donde la fuente lo exige.*

| # | Marca (cola A1) | Su ley | Estado MEDIDO |
|---|---|---|---|
| **1** | Botón ocre en agregar tarjeta | **Ley 21 · enmienda S82 (el ORO `#FCBC1D`, label en tinta)** + `LETRA_PUERTA_DE_PAGO` §8bis | ✅ **YA HECHO — no es trabajo pendiente.** `index.html` L38-39 declara `--cta:#FCBC1D; --cta-letra:#221E19` y **L139 lo consume**: `background:var(--cta);color:var(--cta-letra)`. Lo ejecutó **S101-C** (`a3b5d4f1`). ⇒ **pasa de COLA a GATE**: se mira, no se construye |
| **2** | Assets oficiales de franquicia | Ley 12 + `DIRECCION_ARTE` §6b (gobernanza del set) | 🔒 **BLOQUEADO POR OBJETO AUSENTE.** `logo-franquicia.tsx` L34-40 ya tiene el mapa (VISA·MC·DINERS·AMEX·DISC) y la caja consistente (`ANCHO 56 · ALTO 32`, L50-51); **no hay un solo asset en el repo** y la rama que devolvería `null` **no existe** — todas caen al texto por diseño. **Dueño: FOUNDER** (depositar los archivos). *Precedente exacto: las tres referencias de S99 que no estaban en el repo y NO se adivinaron* |
| **3** | La elegida inconfundible | **L-b** (dosis del relleno) + **19.8** (el eje: se rellena lo que existe) | 🟡 **PARCIAL.** S101-C ya ejecutó §8③ («Cambiar ›», ☠️ murió «Elegido») y §8④ (la fila **jamás finge** una elegida). **Lo que la marca ④ del gate ⑤ pedía —que la elegida se DISTINGA— es juicio de píxeles, no de código.** ⇒ **al gate del ojo**; construir a ciegas contra L-b sería inventar la dosis |
| **4** | Columnas del comprobante cuando el valor envuelve | Ley 3 (voz) + Ley 18 (estructura) | 🔄 **CAMBIA DE TERRITORIO, y hay que decirlo: el comprobante NO ES UNA PANTALLA.** Vive en `despachar-correo` L154-158 (`<tr>` de dos `<td>`), con `font-size` y `line-height` **inline** (L156-157) porque **una edge function no puede importar tokens**. ⇒ no es una marca de la pasada de UI: es HTML de correo. *Su clase de defecto sí es conocida: es el mismo «DINER / S» que S101-C curó midiendo contra la palabra más larga* |
| **5** | La voz vieja del éxito | **Ley 17.3** (una acción, un nombre, todo el flujo) + Ley 17.4 | 🔴 **VIVA Y LOCALIZADA: `apps/cliente/src/i18n/es.ts:1858`** — *«Te avisamos cuando el vendedor lo confirme. Puedes seguirlo en Tus pedidos.»* **Describe el mundo anterior al motor**: hoy lo que se confirma es **el PAGO** (webhook/barrido), no el vendedor. Su vecindad ya dice la verdad (`pago.esperaTitulo` = «Estamos confirmando tu pago») ⇒ **la línea quedó sola contra su propio namespace** |
| **6** | Sección bajo el fold · título truncado | §9 composición + Ley 18 | 🟡 **NO MEDIBLE LEYENDO.** §8② puso la sección dentro de `Tarjeta` y §8① el pie fijo — si **hoy** sigue naciendo bajo el fold es cuestión de alto de pantalla y de contenido. ⇒ **exige dispositivo con pedido FRESCO** (`D-851`: toda medición usa compra fresca) |
| **7** | **D-857** — el voseo restante | **regla 27 / L-148** (la app habla en tuteo) | 🔴 **RE-MEDIDO: son 32 cadenas, no 10.** Detalle y método en §6 |
| **8** | La animación de la espera | — | ⏸️ **CONDICIONADA POR LA PROPIA COLA: «solo si el founder lo pide».** No se toca. La pieza (`EsperaDeTrabajo` L83) cumple hoy su regla firmada: el segmento **viaja, no crece**, sin porcentaje ni `value` en a11y |

### 🔎 Marcas NUEVAS con ley, que la cola no tenía

| # | Hallazgo | Ley | Medida |
|---|---|---|---|
| **N1** | Los **cuatro checkouts de oficio** pintan texto con `<Text style={{fontFamily: typography…}}>` crudo en vez de `<Texto variante>` | **Ley 1** (cero valores crudos donde hay componente) + la razón de existir de `Texto` (S71: *la jerarquía se re-decide a mano en cada pantalla*) | `paseo/checkout.tsx` L82·L102·L120-123 · `grooming` L106·L134·L144·L165-168 · `veterinaria` L103·L111·L139·L156-159 · `adiestramiento` L59-61 |
| **N2** | `checkout-reserva.tsx` — tipografía cruda y **un número mágico fuera de `spacing`** | Ley 1 + Ley 3 | L298 (`fontFamily`+`fontSize` inline) · L317/L320 (mono + `tabular-nums`) · **L316 `gap: 2`** |
| **N3** | **Dos claves huérfanas** y **un encabezado que dejó de ser cierto** | **Ley 37** (lo que sale de la UI sale del código) + honestidad §0 de la letra | `es.ts:1319` `medioElegido: 'Elegido'` — su propio vecino la declara MUERTA (L1484-1486) · `es.ts:1449` `pagosMetodosPronto` («el pago es simulado») · 🔴 **`app/(tabs)/cuenta/pagos.tsx` L1-9 sigue diciendo en su encabezado que el pago es simulado, con el motor real vivo** — *es `D-855` en su forma de comentario: una banda que dejó de ser cierta* |
| **N4** | 🔴 **Una línea en VOSEO dentro de la superficie de pago, fuera del riel i18n** | regla 27 / L-148, **alcanzada por `LETRA_PUERTA_DE_PAGO` §8bis** (*la página del alta también es la casa*) | **`apps/pagos-web/src/index.html:472`** — *«…probá de nuevo en un momento.»* **Es la ÚNICA disidente**: las otras 19 voces de esa página son tuteo (`Prueba`·`Puedes`·`Revisa`·`Escríbelo`·`Ponle`·`Vuelve`). **NO cuenta en D-857**, cuyo territorio declarado es `es.ts` |

---

## §4 · LOS CANDIDATOS — sin ley que los cubra. **NO se marcan; esperan gate**

*Se listan porque callarlos sería peor; se dejan sin ejecutar porque marcarlos sin
ley sería exactamente lo que §0bis de la directiva prohíbe.*

1. **La página del alta tiene 20 literales de voz DUROS, fuera del riel i18n**
   (`index.html` L7·L170-193·L262-472). **La app es es/en desde el día 1; esta
   página es solo-es.** No hay ley que obligue a i18n en una superficie web fuera
   del monorepo de apps — y §8bis la declara «la casa» sin decir nada del idioma.
   **La pregunta que el gate tiene que responder: ¿una familia con el teléfono en
   inglés cruza a una pantalla en español para dar su tarjeta?**
2. **Los hex del comprobante no declaran su deuda.** La web SÍ lo hace, y con todas
   las letras (L33-37: *«LOS HEX VAN COPIADOS… deuda declarada, no descuido»*).
   `despachar-correo` L46-56 los copia igual **y no dice nada**. *No es un defecto
   de color: es el mismo dato con y sin su declaración, y solo uno se puede auditar.*
3. **`despachar-correo` L61** tiene la URL del isotipo **apuntando a un proyecto
   Supabase concreto**, hardcodeada.
4. **La caja del logo de franquicia** (`logo-franquicia.tsx` L63-71) se arma con un
   bloque `style` inline completo. Convive con Ley 1; **se juzga junto con la marca
   2**, cuando los assets existan — hoy tocarla es afinar una caja cuyo contenido
   va a cambiar.

**Nota de honestidad del censo:** `despachar-correo` L150-151 repite
`if (filas.length === 0) return '';`. No es diseño y no entra al reparto — se anota
para que quien toque ese archivo lo vea.

---

## §5 · LO QUE EL CENSO LE CORRIGE AL PLAN

*La cláusula de precedencia del plan («si contradice al repo, gana la fuente») se
ejerció **tres veces**, y las tres ACHICAN el trabajo:*

| Ítem de la cola | Lo que decía | Lo que la fuente dice |
|---|---|---|
| **1 · botón ocre** | trabajo pendiente | **ya ejecutado en S101-C** — pasa a gate |
| **2 · assets de franquicia** | *«cambia el interior de la caja y nada más»* | correcto **y bloqueado**: el objeto no existe en el repo. **Dueño founder** |
| **4 · columnas del comprobante** | ítem de la pasada de UI | **el comprobante es un correo server-side** — otro territorio, otras herramientas |

⇒ **De los ocho ítems, los que quedan como trabajo de pantalla son 5, 6, 7 y las
cuatro marcas nuevas N1-N4.** *Tres se disolvieron al medirlos — el mismo reparto
que S101 registró con sus siete frenos.*

---

## §6 · D-857 RE-MEDIDA — **32 cadenas, no 10**, y el instrumento es la historia

La ficha advierte con todas las letras que su primer censo **dio 5 por culpa del
regex** — *«el número chico no era la deuda: era el instrumento»*. Se re-midió con
instrumento propio, y **la advertencia se cobró otra vez, en dos formas nuevas.**

### Las cuatro trampas, en orden de aparición

| # | Trampa | Efecto medido |
|---|---|---|
| ① | *(la de la ficha)* el regex exigía **espacio** tras el verbo | `Elegí` a principio de frase no matcheaba → dio **5** |
| ② | **comentarios leídos como voz** (L-170) | 43 falsos en la primera pasada — el archivo comenta su propia historia en voseo |
| ③ | **`vas` y `estás` NO son voseo** | el verbo es **idéntico en tuteo** («tú vas a ver» = «vos vas a ver»). Incluirlos infló el censo **de 5 a 20** con 15 cadenas que no hay que tocar. **Prueba viva: `es.ts:1326` dice «Vas a borrar… pero PUEDES volver» — tuteo puro con un «vas» adentro** |
| ④ | 🔴 **`\b` en JavaScript es ASCII** | después de una vocal acentuada **no hay frontera de palabra** ⇒ `\b(probá)\b` **nunca** matchea «Probá de nuevo». **Todo imperativo voseo —que por definición termina en á/é/í— era INVISIBLE**, y solo pasaban las formas terminadas en `s` (`Tenés`·`seguís`·`Pagás`·`vos`). El censo decía **5** y el archivo tenía **32** |

**Cómo se cazó ④, que es lo reutilizable:** un barrido de *recall* independiente
—contar toda palabra terminada en á/é/í dentro de comillas— devolvió `Probá`×7,
`Elegí`×6, `Ingresá`×2… **contra un instrumento que reportaba 0 de esas formas.**
*Dos instrumentos que miden lo mismo y no coinciden: uno está roto, y el que da el
número más chico es el sospechoso.*

### El resultado

| Archivo | Cadenas con voseo |
|---|---|
| `apps/cliente/src/i18n/es.ts` | **32** ← territorio de `D-857` |
| `apps/prestador/src/i18n/es.ts` | **36** ← **FUERA del territorio declarado de la ficha** |
| `packages/ui/src/i18n/es.ts` | **0** ✅ *el paquete compartido ya habla tuteo* |

🔴 **Las 36 del prestador NO se tocan y se declaran con dueño.** La ficha acota
`D-857` a `es.ts` del cliente; ensanchar el territorio de paso es exactamente lo que
la ley de la sesión prohíbe (*un vocabulario cerrado no se amplía de paso*).
**Necesitan ficha propia o una enmienda firmada de D-857 — no una decisión de esta
pista.** *La regla 27 alcanza a las dos apps: lo que falta es el dueño, no la ley.*

> **La ficha se enmienda con el número medido, no con el heredado.** Su cuerpo dice
> «las 10 restantes»; el resto real es **32**. El instrumento vive en el scratchpad
> de la sesión y se deposita al ejecutar la marca, para que el próximo barrido no
> vuelva a pagar las cuatro trampas.

---

## §7 · LO QUE ESTE CENSO **NO** MIDIÓ, declarado

- **Nada en dispositivo.** El fold, el truncado del título, la distinción de la
  elegida (L-b) y el juicio de la animación **son del ojo del founder** — un censo
  que los declarara verdes estaría inventando.
- **Ninguna captura.** Se leyó el objeto, no la pantalla.
- **El comprobante no se renderizó**: se leyó su generador. Cómo cae realmente el
  correo en un cliente de correo es otra medición, con otro instrumento.
- **El prestador**, salvo el conteo de voseo de §6, que se declara para su dueño.
- **WCAG de lo nuevo**: no hay pares nuevos porque no se construyó nada.

---

## §8 · PARA LA MESA — lo que necesita firma antes de que la cola arranque

| # | Qué | Tipo |
|---|---|---|
| 1 | Los **cuatro candidatos de §4** — sobre todo **el idioma de la página del alta** | gate: rigen o se cierran |
| 2 | **Las 36 del prestador**: ¿ficha propia, o enmienda de alcance de `D-857`? | adjudicación |
| 3 | **Los assets de franquicia** — depositarlos en el repo | acto del founder |
| 4 | El **doble §8** de `LETRA_PUERTA_DE_PAGO` v1.3 (dos secciones firmadas con el mismo número) | decisión chica de mesa |
| 5 | La cola re-ordenada de §5 (5 ítems + N1-N4), tanda por tanda | autorización |

*Nada de lo anterior se ejecutó. Se publica lo incompleto, jamás lo falso.*
