# CENSO A0 · EL CIRCUITO DE PAGO CONTRA LA LEY VISUAL

> **S101-D** · 21-ago-2026 · Frente A de la **MESA 103** · `PLAN_MESA_103` §2-A0
> *(nació como `S102-A`; renumerada por dictamen de mesa — la pasada es del mismo
> arco que S101-B/C y `S102` queda íntegra para la plata. Ver `docs/loop/S101-D.md`.)*
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
| **1** | Botón ocre en agregar tarjeta | **Ley 21 · enmienda S82 (el ORO `#FCBC1D`, label en tinta)** + `LETRA_PUERTA_DE_PAGO` §8ter | ✅ **YA HECHO — no es trabajo pendiente.** `index.html` L38-39 declara `--cta:#FCBC1D; --cta-letra:#221E19` y **L139 lo consume**: `background:var(--cta);color:var(--cta-letra)`. Lo ejecutó **S101-C** (`a3b5d4f1`). ⇒ **pasa de COLA a GATE**: se mira, no se construye |
| **2** | Assets oficiales de franquicia | Ley 12 + `DIRECCION_ARTE` §6b (gobernanza del set) | 🔒 **BLOQUEADO POR OBJETO AUSENTE.** `logo-franquicia.tsx` L34-40 ya tiene el mapa (VISA·MC·DINERS·AMEX·DISC) y la caja consistente (`ANCHO 56 · ALTO 32`, L50-51); **no hay un solo asset en el repo** y la rama que devolvería `null` **no existe** — todas caen al texto por diseño. **Dueño: FOUNDER — el kit de marcas YA ESTÁ PEDIDO a Nuvei** (relevo 2). 🔴 **El fallback de texto NO SE TOCA mientras tanto**: al llegar los archivos *cambia el interior de la caja y nada más*. *Precedente exacto: las tres referencias de S99 que no estaban en el repo y NO se adivinaron* |
| **3** | La elegida inconfundible | **L-b** (dosis del relleno) + **19.8** (el eje: se rellena lo que existe) | 🟡 **PARCIAL.** S101-C ya ejecutó §8③ («Cambiar ›», ☠️ murió «Elegido») y §8④ (la fila **jamás finge** una elegida). **Lo que la marca ④ del gate ⑤ pedía —que la elegida se DISTINGA— es juicio de píxeles, no de código.** ⇒ **al gate del ojo**; construir a ciegas contra L-b sería inventar la dosis |
| **4** | Columnas del comprobante cuando el valor envuelve | Ley 3 (voz) + Ley 18 (estructura) | ➡️ **REASIGNADA A PISTA B — sale de la cola de A, NO se borra** *(dictamen de mesa, relevo 2)*. **El comprobante no es una pantalla:** vive en `supabase/functions/despachar-correo/index.ts` L154-158 (`<tr>` de dos `<td>`), con `font-size` y `line-height` **inline** (L156-157) porque **una edge function no puede importar tokens**. Es **territorio server**. *Su clase de defecto sí es conocida y viaja con el puntero: es el mismo «DINER / S» que S101-C curó midiendo contra la palabra más larga + `numberOfLines` — acá el equivalente es medir la etiqueta más larga de L137-149 y decidir el ancho de la columna, jamás dejar que envuelva sola* |
| **5** | La voz vieja del éxito | **Ley 17.3** (una acción, un nombre, todo el flujo) + Ley 17.4 | 🔴 **VIVA Y LOCALIZADA: `apps/cliente/src/i18n/es.ts:1858`** — *«Te avisamos cuando el vendedor lo confirme. Puedes seguirlo en Tus pedidos.»* **Describe el mundo anterior al motor**: hoy lo que se confirma es **el PAGO** (webhook/barrido), no el vendedor. Su vecindad ya dice la verdad (`pago.esperaTitulo` = «Estamos confirmando tu pago») ⇒ **la línea quedó sola contra su propio namespace** |
| **6** | Sección bajo el fold · título truncado | §9 composición + Ley 18 | 🟡 **NO MEDIBLE LEYENDO.** §8② puso la sección dentro de `Tarjeta` y §8① el pie fijo — si **hoy** sigue naciendo bajo el fold es cuestión de alto de pantalla y de contenido. ⇒ **exige dispositivo con pedido FRESCO** (`D-851`: toda medición usa compra fresca) |
| **7** | **D-857** — el voseo restante | **regla 27 / L-148** (la app habla en tuteo) | 🔴 **RE-MEDIDO: son 34 cadenas (no 10), y quedaron BARRIDAS.** Detalle y método en §6 |
| **8** | La animación de la espera | — | ⏸️ **CONDICIONADA POR LA PROPIA COLA: «solo si el founder lo pide».** No se toca. La pieza (`EsperaDeTrabajo` L83) cumple hoy su regla firmada: el segmento **viaja, no crece**, sin porcentaje ni `value` en a11y |

### 🔎 Marcas NUEVAS con ley, que la cola no tenía

| # | Hallazgo | Ley | Medida |
|---|---|---|---|
| **N1** | Los **cuatro checkouts de oficio** pintan texto con `<Text style={{fontFamily: typography…}}>` crudo en vez de `<Texto variante>` | **Ley 1** (cero valores crudos donde hay componente) + la razón de existir de `Texto` (S71: *la jerarquía se re-decide a mano en cada pantalla*) | `paseo/checkout.tsx` L82·L102·L120-123 · `grooming` L106·L134·L144·L165-168 · `veterinaria` L103·L111·L139·L156-159 · `adiestramiento` L59-61 |
| **N2** | `checkout-reserva.tsx` — tipografía cruda y **un número mágico fuera de `spacing`** | Ley 1 + Ley 3 | L298 (`fontFamily`+`fontSize` inline) · L317/L320 (mono + `tabular-nums`) · **L316 `gap: 2`** |
| **N3** | **Dos claves huérfanas** y **un encabezado que dejó de ser cierto** | **Ley 37** (lo que sale de la UI sale del código) + honestidad §0 de la letra | `es.ts:1319` `medioElegido: 'Elegido'` — su propio vecino la declara MUERTA (L1484-1486) · `es.ts:1449` `pagosMetodosPronto` («el pago es simulado») · 🔴 **`app/(tabs)/cuenta/pagos.tsx` L1-9 sigue diciendo en su encabezado que el pago es simulado, con el motor real vivo** — *es `D-855` en su forma de comentario: una banda que dejó de ser cierta* |
| **N4** | 🔴 **Una línea en VOSEO dentro de la superficie de pago, fuera del riel i18n** | regla 27 / L-148, **alcanzada por `LETRA_PUERTA_DE_PAGO` §8ter** (*la página del alta también es la casa*) | **`apps/pagos-web/src/index.html:472`** — *«…probá de nuevo en un momento.»* **Es la ÚNICA disidente**: las otras 19 voces de esa página son tuteo (`Prueba`·`Puedes`·`Revisa`·`Escríbelo`·`Ponle`·`Vuelve`). **NO cuenta en D-857**, cuyo territorio declarado es `es.ts` |

---

## §4 · LOS CANDIDATOS — sin ley que los cubra. **NO se marcan; esperan gate**

*Se listan porque callarlos sería peor; se dejan sin ejecutar porque marcarlos sin
ley sería exactamente lo que §0bis de la directiva prohíbe.*

1. ~~**La página del alta tiene 20 literales de voz DUROS, fuera del riel i18n.**~~
   ✅ **RESUELTO — YA NO ES CANDIDATO. FIRMA DEL FOUNDER (21-ago-2026):
   *el circuito de pago habla LOS DOS idiomas de la app (es/en)*.** Pasa a **ley**,
   y la página del alta pasa de candidato a **trabajo de cola**. *La pregunta que
   este candidato hacía —«¿una familia con el teléfono en inglés cruza a una
   pantalla en español para dar su tarjeta?»— la contestó la firma.*
   ⇒ **Su alcance no se supone: lo fija el censo de perímetro de §4bis**, que la
   propia firma ordenó correr ANTES de construir.
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

## §4bis · EL PERÍMETRO DE LA BRECHA i18n — *ordenado por la firma, corrido ANTES de construir*

> **Qué mide:** toda pieza del circuito de pago que vive **FUERA** del sistema de
> tokens es/en de la app. **Y para cada una, la pregunta que decide el trabajo:
> ¿de dónde RECIBE el idioma?** — porque *una pieza que lo adivina es una pieza que
> se va a equivocar en silencio.*

### 🔴 EL HALLAZGO QUE REPARTE EL TRABAJO, y ACHICA la mitad server

**El riel de idioma del correo YA EXISTE y NO SE USA.** `despachar-correo` L390-397
lee `user_preferencias.idioma` del **destinatario** y se lo pasa a
`plantillaHtml(d, tipo, idioma)`. **Medido: dentro de la plantilla `idioma` se usa
en UN solo lugar — el atributo `<html lang>` (L212). El cuerpo entero está en
español duro.**

> *El correo se DECLARA en inglés y escribe en español.* Eso no es una brecha
> pendiente: es una **afirmación falsa en un atributo**, y es peor que no declarar
> nada — un lector de pantalla y un cliente de correo le creen al `lang`.

⇒ **La mitad B no es «construir el riel»: es USAR el que ya llega.** *Motor sin
puerta en su forma de idioma* (`L-318`): la pieza construida, correcta, y
desconectada del único lugar donde su resultado importa.

### El perímetro, pieza por pieza

| # | Pieza fuera del riel | Por qué está fuera | Terr. | **Cómo RECIBE el idioma** | Estado medido |
|---|---|---|---|---|---|
| **P1** | **Página del alta** — 20 literales duros (`apps/pagos-web/src/index.html` L7 · L170-193 · L262-472) | HTML plano servido por Vercel: **no puede importar `@epetplace/i18n`** (mismo motivo por el que copia los hex, declarado en su L33-37) | **A** | 🔴 **HOY NO LO RECIBE.** `app/pagos/alta-tarjeta.tsx:72` arma `${BASE}?alta=<id>` — **sin `lang`**; `lib/pagos/alta-tarjeta.ts:48` tampoco lo pasa. **La app SÍ sabe el idioma** (riel i18n vivo). ⇒ **viaja por la URL, como el `alta`.** ⚠️ **Jamás `navigator.language`**: el WebView reporta el locale del sistema, **no la preferencia elegida en la app**, y `D-316` existe justamente porque son cosas distintas | 🔴 **solo-es** |
| **P2** | **Comprobante** — etiquetas de columna (`despachar-correo` L137-149: *Mascota · Con · Fecha · Concepto · Monto · Transacción · Autorización · Hora*) + `'USD'` por defecto (L146) | edge function Deno: no importa tokens ni el riel | **B** | ✅ **YA LO RECIBE** (L390-397 → parámetro `idioma`) | 🔴 **llega y no se usa** |
| **P3** | **El resto del cuerpo del correo**, todas las plantillas por `tipo` | ídem P2 | **B** | ✅ **YA LO RECIBE** — mismo parámetro | 🔴 misma brecha, **alcance mayor que P2**: el comprobante es una sección de un correo que entero está en español |
| **P4** | **`despachar-push`** L205-206 — fallbacks `'Tienes una novedad en e-PetPlace'` / `'Abre la app para verla.'` | edge function | **B** | ✖️ **no lee idioma** | 🟡 **su voz principal NO es suya**: sale de `datos.titulo`/`datos.mensaje` del **encolador** (L31). ⇒ el idioma del push se decide **donde se encola**, fuera del circuito de pago. **Solo los dos fallbacks son territorio de esta ficha** |

### Lo que el perímetro NO alcanza, declarado

- **La voz encolada del push** (quien escribe `datos.titulo`): es del motor de
  notificaciones, no del circuito de pago. **Se nombra para que la mesa lo reparta,
  no se adopta.**
- **El SDK del proveedor dentro de la página del alta**: sus campos alojados los
  rotula **Nuvei**, no nosotros. *Su idioma es una pregunta para el proveedor —
  posiblemente un parámetro de init— y ninguna medición nuestra lo resuelve.*
  🔴 **Consecuencia honesta: aunque P1 se cure entera, el formulario de la tarjeta
  puede seguir en español.** Que nadie declare la brecha cerrada sin ese dato.
- **Cero verificación de que las traducciones EXISTAN**: este censo mide el
  perímetro y la cañería, **no el inventario de cadenas `en` que habría que escribir**.

---

## §5 · LO QUE EL CENSO LE CORRIGE AL PLAN

*La cláusula de precedencia del plan («si contradice al repo, gana la fuente») se
ejerció **tres veces**, y las tres ACHICAN el trabajo:*

| Ítem de la cola | Lo que decía | Lo que la fuente dice |
|---|---|---|
| **1 · botón ocre** | trabajo pendiente | **ya ejecutado en S101-C** — pasa a gate |
| **2 · assets de franquicia** | *«cambia el interior de la caja y nada más»* | correcto **y bloqueado**: el objeto no existe en el repo. **Dueño founder** |
| **4 · columnas del comprobante** | ítem de la pasada de UI | **el comprobante es un correo server-side** ⇒ **REASIGNADO A PISTA B con puntero** (dictamen de mesa, relevo 2), no borrado |

⇒ **De los ocho ítems, los que quedan como trabajo de pantalla de A son 5, 6, 7 y
las cuatro marcas nuevas N1-N4.** *Tres salieron de la cola al medirlos —uno hecho,
uno bloqueado, uno reasignado—: el mismo reparto que S101 registró con sus siete
frenos.* **Ninguno se «resolvió» achicando el alcance: el ④ tiene dueño nuevo y el
② tiene dueño humano.**

---

## §6 · D-857 RE-MEDIDA Y BARRIDA — **eran 34, no 10**, y el instrumento es la historia

La ficha advierte con todas las letras que su primer censo **dio 5 por culpa del
regex** — *«el número chico no era la deuda: era el instrumento»*. Se re-midió con
instrumento propio, y **la advertencia se cobró TRES VECES MÁS** — la última
**después** de que el número ya estuviera reportado.

### Las CINCO trampas, en orden de aparición

| # | Trampa | Efecto medido |
|---|---|---|
| ① | *(la de la ficha)* el regex exigía **espacio** tras el verbo | `Elegí` a principio de frase no matcheaba → dio **5** |
| ② | **comentarios leídos como voz** (L-170) | 43 falsos en la primera pasada — el archivo comenta su propia historia en voseo |
| ③ | **`vas` y `estás` NO son voseo** | el verbo es **idéntico en tuteo** («tú vas a ver» = «vos vas a ver»). Incluirlos infló el censo **de 5 a 20** con 15 cadenas que no hay que tocar. **Prueba viva: `es.ts:1326` dice «Vas a borrar… pero PUEDES volver» — tuteo puro con un «vas» adentro** |
| ④ | 🔴 **`\b` en JavaScript es ASCII** | después de una vocal acentuada **no hay frontera de palabra** ⇒ `\b(probá)\b` **nunca** matchea «Probá de nuevo». **Todo imperativo voseo —que por definición termina en á/é/í— era INVISIBLE**, y solo pasaban las formas terminadas en `s` (`Tenés`·`seguís`·`Pagás`·`vos`). El censo decía **5** y el archivo tenía **32** |
| ⑤ | 🔴 **«el imperativo voseo SIEMPRE lleva tilde» es FALSO con enclítico** | `contá`+`nos` = **«contanos»**: la tónica deja de ser la última y **la tilde desaparece** (igual `escribila` · `escribinos` · `corregilo` · `fijate`). El instrumento curado por ④ **seguía apoyado en la tilde** ⇒ **ciego a la clase entera**: perdía `«Contanos quién recibe.»` y `«Escribinos al {{numero}}.»`. **32 → 34** · prestador **36 → 37** |

**Cómo se cazó ④, que es lo reutilizable:** un barrido de *recall* independiente
—contar toda palabra terminada en á/é/í dentro de comillas— devolvió `Probá`×7,
`Elegí`×6, `Ingresá`×2… **contra un instrumento que reportaba 0 de esas formas.**
*Dos instrumentos que miden lo mismo y no coinciden: uno está roto, y el que da el
número más chico es el sospechoso.*

🔴 **Cómo se cazó ⑤, que es lo que vale más:** **no la cazó un censo — la cazó ir a
escribir el mapa de reemplazos.** Al conjugar `contá` para el barrido apareció que
con enclítico pierde la tilde, y de ahí que la regla del instrumento tuviera una
excepción gramatical entera. *El número ya estaba reportado al founder: **32 y 36
eran cifras equivocadas que ya habían salido de la casa**.* ⇒ **El barrido es el
último momento barato para descubrir que el censo estaba corto** — y por eso la ley
(`L-327` ④) es leer en voz alta la regla que el instrumento asume, **antes** de
tocar nada.

### El resultado

| Archivo | Cadenas con voseo | Estado |
|---|---|---|
| `apps/cliente/src/i18n/es.ts` | **34** | ✅ **BARRIDAS a tuteo** — censo post-barrido **0**, typecheck verde. *Falta su gate en dispositivo* |
| `apps/prestador/src/i18n/es.ts` | **37** | 🔒 **sin tocar** — `D-858`, dueño la sesión del prestador |
| `packages/ui/src/i18n/es.ts` | **0** ✅ | *el paquete compartido ya habla tuteo* |

**Cómo se barrió, para que se pueda auditar:** mapa **explícito** de formas (jamás
heurística), aplicado **solo al contenido entre comillas** —un comentario en voseo
no es voz—, y **`vos` por FRASE COMPLETA** porque su tuteo depende de la sintaxis:
*«casi como vos»* → **tú**, pero *«te llegó a vos»* → **ti**. *Un mapa
palabra-a-palabra lo habría traducido mal en dos de los tres casos.*

🔴 **Las 37 del prestador NO se tocan y se declaran con dueño.** La ficha acota
`D-857` a `es.ts` del cliente; ensanchar el territorio de paso es exactamente lo que
la ley de la sesión prohíbe (*un vocabulario cerrado no se amplía de paso*).
**Necesitan ficha propia o una enmienda firmada de D-857 — no una decisión de esta
pista.** *La regla 27 alcanza a las dos apps: lo que falta es el dueño, no la ley.*

> **La ficha se enmienda con el número medido, no con el heredado.** Su cuerpo dice
> «las 10 restantes»; el resto real era **34**, hoy barridas. El instrumento vive en el scratchpad
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
| 1 | **El reparto del perímetro i18n de §4bis** — P1 es de **A**, P2/P3/P4 son de **B** · y la pregunta que ninguna medición nuestra contesta: **el idioma del formulario del proveedor** | reparto de mesa |
| 2 | Los **tres candidatos que quedan** en §4 (los hex sin declarar · la URL del isotipo · la caja del logo) | gate: rigen o se cierran |
| 3 | La cola re-ordenada de §5 (⑤ ⑥ ⑦ + N1-N4 + P1), tanda por tanda | autorización |
| 4 | ③ **la elegida inconfundible** y ⑧ **la animación** | juicio de píxeles, en dispositivo |

**Ya resueltos por el relevo 2 — no vuelven a la mesa:** el idioma (**firmado: es/en**) ·
las 37 del prestador (**`D-858`**, dueño la sesión del prestador) · la lección del
instrumento (**`L-327`**) · la marca ④ (**reasignada a Pista B**) · el doble §8
(**curado: `§8bis`/`§8ter`, letra a v1.4**) · los assets (**kit pedido a Nuvei**).

*Nada de lo anterior se ejecutó. Se publica lo incompleto, jamás lo falso.*
