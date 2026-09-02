# S112-C → A · PEDIDO 1 — lo que la app necesita del motor, medido y priorizado

> **Emitido temprano a propósito.** Nueve de los diez ítems de mi directiva
> tocan superficie que hoy no tiene contrato. Lo que sigue está **medido contra
> el objeto**, no supuesto, y **pide ENSANCHES antes que piezas nuevas**
> (`L-175`). Cada bloque dice **qué mido hoy**, **qué pido**, y **qué queda
> bloqueado si no llega** — para que puedas cortar por valor y no por orden.

## ⓪ LO QUE YA MEDÍ Y **NO** TE PIDO — para que no lo construyas dos veces

| pregunta | medición | veredicto |
|---|---|---|
| §12 ⑥ ¿la app de negocios admite tabs por tipo de cuenta sin bifurcar? | `apps/prestador/src/lib/barra-prestador-lectura.ts` — `QuienEntra` es **unión discriminada** y el **vendedor puro entra a la misma casa de tabs SIN tener `prestador_id`** (S99-D · `D-820`) | 🟢 **SÍ, y con precedente vivo.** El refugio es el tercer caso de esa unión. **No necesito nada tuyo para esto.** |
| ¿el guard tras el alta manda a onboarding? | `registro.tsx:111` → `/onboarding` · `verificar-correo.tsx:111` → `/onboarding` · `index.tsx:64` → `/onboarding` si `!tiene_familia` | 🟢 **YA CUMPLE.** No hay defecto que curar. |
| ¿recuperar contraseña deja sesión viva y aterriza bien? | `recuperar.tsx` — flujo **por CÓDIGO, no por link**; `verifyOtp` deja sesión, `cambiar()` → `router.replace('/')` y el raíz decide por estado | 🟢 **YA CUMPLE, por un camino mejor que el link.** ⚠️ **No pido deep link de recovery: sería superficie nueva para un problema que no existe.** Si vos medís que la plantilla del correo manda **link** y no código, avisame — ahí sí cambia. |
| ¿`mascotas_count` distingue familia vacía? | `EstadoOnboardingDueno { tiene_familia, familia_id, mascotas_count }` | 🟢 **El estado ES expresable hoy.** Lo que falta es **crearlo** (ítem ① de abajo). |

---

## ① 🔴 BLOQUEANTE — CREAR FAMILIA **SIN** MASCOTA (§12 ①②, ítem 15 del founder)

**Lo que mido:** el único constructor es `crearFamiliaConPrimeraMascota` — la
familia **no puede nacer vacía**. Y `getEstadoOnboardingDueno` **ya devuelve
`mascotas_count`**, así que el estado existe en el contrato y **no tiene
productor**.

**Lo que pido — ensanche, no pieza nueva:**

```
crear_familia_sin_mascota(p_nombre_familia text DEFAULT NULL)
  → { familia_id uuid, ya_existia boolean }
```

- **Idempotente y hablada** (`L-424`): si el usuario ya tiene familia, devolvé
  la suya con `ya_existia: true` en vez de un `23505` pelado — la pantalla
  lleva ahí en vez de decir que no.
- **El titular queda igual que hoy** (mismo rol, mismo vínculo que deja
  `crear_familia_con_primera_mascota`) — *si el camino de adopción produce un
  titular de segunda, el defecto aparece meses después en otra pantalla.*
- ⚠️ **Antes de escribirla, la medición de §12 ① que la letra ordena:** ¿los
  CHECK/FK de `familias` admiten cero mascotas? Si **no**, decilo y **no la
  fuerces**: la letra ya tiene la salida escrita (*el refugio es la familia
  hasta la entrega*) y eso cambia mi superficie, no la tuya.

**Si no llega:** la tarjeta «no tengo mascota, quiero adoptar» **no se dibuja**.
Construyo la bifurcación con **una sola salida viva** y la segunda **no existe**
—no la pinto apagada—: *un camino que no lleva a ningún lado es peor que no
ofrecerlo* (es la misma decisión que S111-C tomó con los ocho filtros).

---

## ② 🔴 LA FICHA DEL ADOPTABLE — hoy no hay lector de UNO

**Lo que mido:** `obtener_adoptables` devuelve **lista** con 10 campos
(`publicacion_id · mascota_id · nombre · especie · raza · sexo ·
fecha_nacimiento · foto_url · publicador_nombre · creada_en`). **No existe
lector de una publicación**, y la ficha que el founder recorre pide **nueve
datos que ese tipo no tiene**.

**Lo que pido:**

```
obtener_adoptable(p_publicacion_id uuid) → una fila con TODO lo de la lista, más:
  fotos               text[]     -- la ficha es «foto grande», no un thumbnail
  salud_estado        text       -- semáforo (§3). Vocabulario TUYO, cerrado.
  salud_detalle       text|null
  convive_perros      text       -- 🔴 TRES estados: 'si'|'no'|'no_se_sabe'
  convive_gatos       text       --    (§3: «lo no conocido se respeta como no
  convive_ninos       text       --     conocido, jamás como dato faltante»)
  historia_rescate    text|null  -- voz humana
  ubicacion_aprox     text|null  -- 🔴 JAMÁS dirección exacta (§3)
  esterilizado        boolean|null   ─┐ ítem 9 del founder: la ficha los DECLARA
  microchip           text|null       │ y el portal los PIDE al publicar
  remetfu             text|null      ─┘ (null = «no informado», y se dice)
  urgente             boolean
  pareja_vinculada_id uuid|null
  publicador_cuenta_id uuid
```

🔴 **Los tres de convivencia van como TEXTO de tres valores, jamás `boolean`
nullable.** Un `boolean|null` hace que «no se sabe» y «nadie lo cargó» sean el
mismo valor, y §3 los separa a propósito: *volcar «no se sabe» en un «no» le
cuesta el hogar al animal.* **Con tres valores el estado equivocado es
inexpresable** (`L-222`).

**Si no llega:** no hay ficha, y **sin ficha no hay «Quiero adoptar»** — cae el
recorrido entero del founder desde el segundo toque.

---

## ③ 🟠 LOS FILTROS Y EL BLOQUE «LLEVAN MÁS TIEMPO ESPERANDO» (§4)

**Lo que mido:** `obtener_adoptables` acepta **un** filtro (`p_especie`).
S111-C **no dibujó los otros ocho** —y fue la decisión correcta: *un filtro que
no filtra es una promesa rota a un toque de distancia*—. El founder los pide
todos.

**Pido en `obtener_adoptables`:** `p_tamano · p_edad_rango · p_sexo ·
p_convive_con text[] · p_urgentes · p_esterilizado · p_pareja · p_cerca_de_mi`.

🔴 **Dos reglas de §4 que son del SERVIDOR y no mías:**
1. **«Filtrar no borra al que no se midió»:** con un filtro de convivencia
   activo, la respuesta trae **primero los confirmados y después los
   `no_se_sabe`**, marcados. Si eso lo hiciera la pantalla, el día que cambie
   el criterio habría dos verdades. **Devolvelo ordenado y con la marca.**
2. **El bloque «llevan más tiempo esperando» NO es orden por antigüedad** —§4 lo
   prohíbe explícito—. **El criterio es tuyo**, y por eso no lo invento:
   `obtener_adoptables` devuelve un flag `destacado_espera boolean` (o un
   `p_bloque` aparte, como prefieras). *Ordenar por `creadaEn` en la pantalla
   sería exactamente lo que la letra prohíbe.*
3. 🔴 **SIN filtro de raza** (de piedra) y **«necesidades especiales» sólo
   INCLUYE** — no lo agregues como exclusión ni por comodidad de firma.

---

## ④ 🔴 EL FORMULARIO DE POSTULACIÓN (ítem 7) — y su dato sensible

**Lo que pido:** la plantilla del publicador como **dato**, no como pantalla
hardcodeada, y el envío con:

```
composicion_hogar jsonb  -- { "0_5": n, "6_12": n, "13_17": n, "adultos": n }
```

🔴 **RANGOS, jamás nombres ni edades exactas de menores** — P5, y el founder lo
dictó igual. ⚠️ **Si la plantilla de hoy pide nombre o edad de un menor, se
cambia** (mi directiva es literal). Decime si la plantilla vive en tabla: si sí,
el cambio es tuyo; si es texto libre del refugio, es del portal y lo gateo yo.

**Y el consentimiento:** el texto del abogado **servido como DOCUMENTO por vos**
(el molde de `URL_LEGAL` de S104-A), **jamás pegado en mi código** — versión y
URL son el mismo dato y viven juntos (`L-166`). Necesito
`documento(codigo:'consentimiento_adopcion')` → `{ version, url, titulo }` y
que el envío registre la aceptación por `(codigo, version)`, igual que
guardería.

**Sin el documento:** «Enviar» queda **apagado con su razón** («Falta el texto
de consentimiento») — nunca mudo, y nunca enviando sin registrar.

---

## ⑤ 🔴 EL ACTA Y LAS DOS FIRMAS (ítem 8) — es el final de §5

```
obtener_acta_adopcion(p_solicitud_id) → { version, cuerpo, url, datos_ya_puestos }
firmar_acta_adopcion(p_solicitud_id, p_codigo)  -- código al correo
obtener_estado_firmas(p_solicitud_id) → { firmo_adoptante, firmo_publicador }
```

- El acta llega **con los datos del adoptante y del animal ya puestos** (voz del
  founder) — *si la pantalla los interpola, el día que cambie el acta la letra y
  los datos divergen*.
- **Falta cédula ⇒ la pide antes**; ya existe el arco de documentos del cliente
  (`cuenta/documentos.tsx`), **lo reuso, no construyo otro**.
- 🔴 **Con las DOS firmas dispara el traspaso** — `traspasar_mascota_a_familia`
  **ya existe** (S111-A): **no lo duplico ni lo llamo yo desde la pantalla**;
  que lo dispare el motor al completarse la segunda firma. *Si la pantalla
  dispara el traspaso, dos toques rápidos lo disparan dos veces.*
- **Una firma sola es ESTADO, no alarma:** necesito poder decir «Firmaste ·
  falta la firma del refugio» **sin inventar el estado desde el conteo local**.
- **Sin acta cargada:** botón apagado diciendo *«Falta el acta de adopción; el
  refugio la recibirá cuando esté lista»* (voz del founder, literal).

---

## ⑥ 🟠 LA CUENTA REFUGIO Y SUS TÉRMINOS (ítems 5 y 10)

- **`_user_gestiona_cuenta_refugio` ya existe** — necesito su **lector de
  superficie**: `obtener_mi_cuenta_refugio() → { cuentaComercialId, nombre,
  verificada, terminos_aceptados_version }`. Con eso compongo las tres tabs por
  la unión `QuienEntra` que **ya funciona**, sin bifurcar la app.
- §2 dice **verificación manual del founder, sin autoregistro**. Si no hay forma
  de crear la cuenta, **pedila vos o decime el camino**: sin una cuenta refugio
  real **el portal no se puede ejercer ni una vez**, y lo reportaría como *no
  verificado*, jamás como verde.
- **Términos del refugio (ítem 10):** mismo molde de documento —
  `documento(codigo:'terminos_refugio')`. **Sin texto, la cuenta entra en
  LECTURA y el portal dice por qué** (no la bloqueo muda).

---

## ⑦ 🔴 `D-1001` — LA ESPECIE EN LA MENSUALIDAD (mi ítem 3, y es tuyo primero)

**Lo que mido:** `guarderia_mensual.especies_elegibles = ["perro","gato"]`
existe, y **ningún wrapper de `guarderia-reserva.ts` lo expone** (grep: 0
ocurrencias de `especies_elegibles`). La ficha dice que **la puerta no consulta
el recorte**.

**Son dos mitades y las dos son tuyas antes que mías:**
1. **El GATE en la puerta** de contratación — que rebote con código tipado
   (`especie_no_elegible`).
2. **El RECORTE en el lector** — `especiesElegibles: string[]` en el comprable
   que lee `explorar/guarderia/[prestadorId].tsx`.

🔴 **Sin ② no puedo cumplir lo que el founder pidió,** que es lo mejor de su
dictado: *«al elegir mascota, los planes que no aplican ya se ven apagados con
su porqué, ANTES de llegar al botón»*. **Con sólo ① la pantalla sólo puede
reaccionar al rebote — el botón se ofrece y falla.** *La puerta no ofrece lo que
va a rechazar* (Ley 23). **Pido las dos, y ② es la que cambia la experiencia.**

---

## ⑧ 🟢 LO QUE NO TE PIDO Y CIERRO YO HOY

- **`D-1000`** — el espejo del tramo vivo: `obtenerTramoVivoDeMiMascota` ya
  existe, es reemplazar una llamada. **Mío.**
- **El segundo camino del hogar vacío** — S111-C lo dejó declarado con su
  condición de retiro: *«no se dibuja porque no tiene a dónde ir: cero motor de
  adopción»*. **Hoy la vidriera existe ⇒ la condición se cumplió.** **Mío, y es
  una línea.**
- **La puerta sin sesión desde el login** y la **entrada en el mapa de
  navegación** — superficie pura sobre `obtenerAdoptables`, que ya está. **Mío.**
- **La línea pública de verificación (N22, ítem 9)** — es texto de la casa con
  su «i». **Mío**, salvo que quieras que su redacción venga como documento.

---

### CÓMO ME SIRVE MEJOR

**Por valor, no por orden:** ① y ⑦② destraban lo más grande con lo más chico.
② es el corazón del recorrido. ⑤ es el final y puede llegar último.

**Y una condición de forma:** mandame **el contrato** (firma + forma del
retorno + códigos de error), no el aviso de que existe. **Entregada ≠ montada**:
monto contra contrato, y si no tengo códigos tipados el rebote sale mudo, que es
justo lo que `D-999` vino a matar.

— **Pista C, S112**
