# MESA 104 · PISTA C · TANDA 0 — LAS CUATRO SUPERFICIES

> **Nace:** 21-ago-2026 · **Pista C** (las superficies) · **TANDA 0 = RECETA DE FORMA + CENSO. CERO CONSTRUCCIÓN.**
>
> **Qué es:** el *toque 1* de `DIRECCION_DISENO_S99` §1 — la receta de forma de las cuatro
> superficies del encargo, con lo que HAY medido contra el objeto y lo que FALTA declarado.
> **Qué NO es:** código, ni pantallas aprobadas. La pantalla se aprueba en el gate del founder.
> **Regla de precedencia:** si este documento contradice al repo o a una letra firmada, **gana la fuente**.
>
> **Fuentes leídas:** `LETRA_PUERTA_DE_PAGO_S101B` v1.4 (entera) · `LETRA_DEUNA` §1-§10 ·
> `LETRA_COBRO_RECURRENTE` v1.1 (entera) · `DIRECCION_ARTE` §8-§9bis · `DIRECCION_DISENO_S99`
> N11-N28 · el repo y la base.

---

## §0 · FRENO DE APERTURA — `PLAN_MESA_104.md` NO EXISTE

El encargo ordena leerlo. **Medido: no existe** — ni en `docs/`, ni en ninguna de las 15
worktrees, ni en ninguna rama (`git log --all --diff-filter=A` sobre el nombre: cero).

**Coincide con el freno de la pista B**, que midió lo mismo por su cuenta
(`2026-08-21-mesa104-B-tanda0-CENSO-LEGAL.md` §0). *Dos pistas midieron el mismo hueco por
separado y dieron el mismo resultado: no es un archivo mal buscado.*

Lo que sí acota esta mesa: **`PLAN_MESA_103.md`** declara que **S104** es *«certificación y
corte real»* y que no redacta materia legal. **Se ejecuta la tanda 0 contra las cuatro letras
del encargo**, y se pide a la mesa que **confirme el encuadre antes de abrir tanda 1**.
*No se inventa un plan que no existe.*

⚠️ **Consecuencia declarada:** sin plan no hay reparto de territorios escrito. Esta tanda
**no crea rama ni worktree** y escribe **un solo archivo**, en `docs/relevamientos/` — el
mismo lugar y la misma forma que ya usó B. Cero cruce de territorio.

---

## §1 · EL RESULTADO DEL CENSO, ANTES DE LA RECETA — dos de las cuatro YA EXISTEN

**El encargo nombra cuatro superficies como si fueran cuatro construcciones. Medido, son
otra cosa** — y eso cambia el trabajo de la tanda 1:

| # | Superficie del encargo | Medido | Qué es realmente el trabajo |
|---|---|---|---|
| 1 | Hoja «Cómo quieres pagar» | ✅ **EXISTE** — `seccion-medio-de-pago.tsx`, vigilada por `R57` | **Un delta:** la fila DeUna + la regla de recurrencia |
| 2 | Pantalla de espera con voz | ✅ **EXISTE** — fase `confirmando` en las dos puertas, con `EsperaDeTrabajo`, voz y salida | **Un delta:** la espera de DeUna es de OTRA naturaleza (§3) |
| 3 | «Ayuda y legales» (D-336) | 🟡 **EXISTE con placeholder** — y **su texto afirma hoy algo falso** (§4) | Recomponer + declarar la deuda que venció sola |
| 4 | Pantalla de la serie recurrente | ❌ **NO EXISTE** — y **la app promete que existe** (§5) | Construcción entera, y el motor le falta una columna |

> 🔴 **Lo que esto le ahorra a la tanda 1:** dos de las cuatro no se diseñan de cero — se
> extienden. *Diseñar de nuevo una pieza que `R57` ya vigila habría producido exactamente la
> segunda copia que esa regla existe para impedir.*

---

## §2 · SUPERFICIE 1 — LA HOJA «CÓMO QUIERES PAGAR»

### Lo que hay, medido

`apps/cliente/src/components/seccion-medio-de-pago.tsx` (10.655 b) exporta **el estado
(`useMedioDePago`), la sección, la hoja y `BotonPagar`**. Las dos puertas la montan
(`despensa/checkout.tsx` y `components/checkout-reserva.tsx`) y **`R57` mide que la monten**
— con su límite escrito: *mide que monten la misma pieza, jamás que se vean igual.*

Ya cumplen los siete puntos de `LETRA_PUERTA_DE_PAGO_S101B` §8bis: un solo botón `bloque` ·
la sección dentro de `Tarjeta` · «Cambiar ›» en la elegida · **la fila jamás finge una
elegida** (con su trampa documentada: `medios[0]` es la más reciente) · marca a la izquierda
y «›» a la derecha · el carrito callado · `EsperaDeTrabajo` compartida.

### El delta: DeUna es una fila más — pero no es una tarjeta

`LETRA_DEUNA` §1: *«la fila "Deuna" en "Cómo quieres pagar" no gestiona nada: se elige y se
paga»*, y §6 firma la **ley de experiencia**: *«funciona exactamente igual que si fuera
tarjeta»*.

🔴 **El obstáculo es de tipos, y no lo resuelvo yo:** `FilaMedioDePago` recibe hoy
`tarjeta: TarjetaGuardada` (medido, `fila-medio-de-pago.tsx:59`). **DeUna no tiene token, ni
`bin`, ni últimos 4, ni alias.** Meterla como una `TarjetaGuardada` con campos vacíos sería
fabricar una tarjeta que no existe. ⇒ **contrato pedido a A en §7.**

### La regla que nadie había cruzado: DeUna no puede sostener la serie

`LETRA_COBRO_RECURRENTE` §8 es explícita: *«cobro recurrente en DeUna (ese riel es push: el
cliente confirma en su app — **no hay cobro sin presencia posible**); la recurrencia es solo
con tarjeta tokenizada, **y así se le dice al elegir medio**»*.

**Recomendación de forma, con su ley detrás — la fila se DIBUJA y no se puede elegir:**

- **No se oculta.** `LETRA_PUERTA_DE_PAGO_S101B` §0.4: *ningún estado se dibuja mudo.* Una
  fila ausente manda a la familia a buscar una opción que sí usó la compra anterior.
- **No se ofrece elegible.** Ley 23 de la casa (*«la puerta no ofrece lo que va a rechazar»*,
  S72-B): dejar tocar DeUna y rebotar después es el patrón que esa ley mató.
- ⇒ **fila presente, no elegible, con su razón en UNA línea**, y solo cuando la compra lleva
  «que llegue solo» activo. Cuando no lo lleva, DeUna es una fila normal.

⚠️ **Declarado y NO resuelto por mí:** si en vez de eso la mesa prefiere que activar «que
llegue solo» **apague** la opción antes de llegar al pago, es decisión de producto y no de
forma. **Se sirve medida, sin voto.**

### Receta de forma

**Qué debe sentir:** *«ya sé con qué voy a pagar y no tengo que aprender nada nuevo.»*
**Referencia:** la propia pieza viva — es su mejor vara. **Piezas:** `Tarjeta` · `Hoja` ·
`FilaMedioDePago` (ensanchada por A) · `Chevron` · `Boton secundario`. **Cero componente
nuevo.**

---

## §3 · SUPERFICIE 2 — LA ESPERA

### Lo que hay, medido

**No es una pantalla: es una FASE**, y está en las dos puertas.

| | despensa | reserva (4 oficios) |
|---|---|---|
| fase | `'confirmando'` (`checkout.tsx:115`) | `'confirmando'` (`checkout-reserva.tsx:71`) |
| voz | `pago.esperaTituloCorto` en el header + la frase entera en el cuerpo | `pago.esperaTitulo` + `pago.esperaCuerpoCita` |
| animación | `EsperaDeTrabajo` | `EsperaDeTrabajo` — la MISMA (⑦ cumplido) |
| salida | «Ver tus pedidos», **desde el primer segundo** | «Volver al hogar» al tocar el tope |
| motor | `useEsperaDeConfirmacion`, activo **solo** en `confirmando` | ídem |

Y trae dos cicatrices que valen como ley: el hook **se escucha** (antes se llamaba y nadie
leía su resultado — *motor sin puerta*, medido: la base decía `pagada` a los 34 s y la
pantalla seguía esperando a los 78) y el título del header es corto **porque se truncaba**.

### El delta: la espera de DeUna es de otra naturaleza

En tarjeta la familia **espera**. En DeUna la familia **tiene que hacer algo**: abrir su app
e ingresar un código de 6 dígitos (`LETRA_DEUNA` §5, firma ① del founder).

**Las tres consecuencias de forma, con su fuente:**

1. **Misma pantalla, voz distinta** — §6 firma ②: *«la espera es la misma pantalla con voz»*.
   No nace una ruta nueva.
2. 🔴 **`EsperaDeTrabajo` NO va mientras el código está vivo.** N15: *el movimiento se calla
   donde hay apuro.* Una rampa que dice «estamos trabajando» mientras la persona teclea
   afirma algo falso — el que trabaja es ella. **Lo que ocupa ese lugar es la cuenta
   regresiva, que es información y no adorno.** La rampa vuelve cuando el código se consumió.
3. **Dos relojes, dos voces, jamás confundidos** (§6 DeUna). **Solo el del código se dibuja
   como reloj** (3 minutos fijos, literal del proveedor). **El hold no se dibuja como reloj:
   se dibuja cuando muere**, con la voz del rearme que ya existe. *Dos cuentas regresivas en
   una pantalla de pago es la forma más rápida de que la familia no sepa cuál la apura.*

**El código, con su dosis:** `LETRA_PUERTA_DE_PAGO_S101B` §8ter — *voz de máquina para los
dígitos, voz de la casa para lo que le habla a la persona.* ⇒ los 6 dígitos en la mono
tabular de la casa (precedente medido: `Cronometro`), el resto en la voz normal.
**No es `CampoCodigo`:** esa pieza es para ingresar; acá el código **se muestra**.

**Los estados, tomados de la tabla de §6 de `LETRA_DEUNA` — ninguno inventado:**

| Estado | Qué se dibuja |
|---|---|
| `PENDING`, código vivo | código + cuenta regresiva + voz de acción · **sin rampa** |
| código vencido, hold vivo | la voz del vencimiento + **«Generar un código nuevo»** |
| hold vencido | la voz del rearme existente — no nace ninguna |
| `APPROVED` / webhook verificado | el éxito vigente |
| `REVERSED_FAILED` | 🔴 caso de soporte con nombre — **jamás se resuelve solo** |

### Receta de forma

**Qué debe sentir:** *«sé exactamente qué tengo que hacer y cuánto tiempo tengo.»*
**Referencia:** los códigos de verificación bancarios — dígitos grandes, reloj honesto, cero
adorno. **Piezas:** la fase que ya existe · `Texto` (mono/display) · un contador derivado del
patrón `Cronometro` · `Boton secundario`. **Cero ruta nueva.**

---

## §4 — SUPERFICIE 3 — «AYUDA Y LEGALES» (D-336)

### Lo que hay, medido

`apps/cliente/src/app/(tabs)/cuenta/ayuda.tsx` — 46 líneas, tres `Tarjeta` con texto plano:
Términos · Privacidad · Canal de ayuda. Entrada desde `cuenta/index.tsx:121`.

### 🔴 EL HALLAZGO — la cadena legal afirma hoy algo falso

`apps/cliente/src/i18n/es.ts:1454`, **verbatim y publicado**:

> *«Los textos legales definitivos están en preparación. Esta app está en fase de pruebas:
> **no se cobra dinero real** y tus datos se usan solo para operar el servicio.»*

**S101 conectó el motor de cobro de punta a punta.** Hoy corre contra sandbox, y la apertura
de octubre lo pone en producción. **La frase era cierta cuando se escribió y dejó de serlo
sin que nadie la tocara** — y está en la única pantalla donde la app hace una afirmación
legal sobre el dinero.

*No es una imprecisión de redacción: es la clase de frase que existe para ser citada.* **No
la curo en tanda 0** — es texto legal y el encargo de B lo excluye explícitamente de esta
tanda. **Se declara como ítem de firma**, con el mismo estatuto que B le dio al responsable
vencido de la privacidad del sitio: *la condición de vencimiento existía; lo que faltó fue
ejecutarla.*

⚠️ **Y su gemela cruzada, que ninguna de las dos pistas ve sola:**
`LETRA_PUERTA_DE_PAGO_S101B` §3.1 tiene **tres de ocho códigos** cuya voz manda al cliente a
**soporte** (*«Ya lo estamos viendo»* — `monto_divergente`, `compra_sin_pedidos`,
`desglose_incompleto`). **El destino de esos tres es esta pantalla, y esta pantalla dice
«Pronto — un lugar digno para pedir ayuda.»** ⇒ **la superficie de pago promete un soporte
que la superficie de ayuda declara inexistente.**

### El segundo hallazgo, más chico y mecánico

La pantalla **no usa el design system**: monta `Text` de React Native con `typography` y
`theme` inline, en vez de la pieza `Texto` que existe desde S71. No rompe nada hoy; es
desvío de la skill y se cura al tocarla.

### Receta de forma

**Qué debe sentir:** *«esta gente me dice la verdad de lo que sabe y de lo que todavía no.»*
**La forma depende de un dato que no es mío:** cuando B publique las URLs, un documento legal
**se navega, no se transcribe** ⇒ las dos primeras filas dejan de ser párrafo y pasan a
`CeldaNavegacion` con chevron (N21: lo que agrupa va en carta; lo que es la pantalla, no).
Mientras no exista el documento, el párrafo honesto es la forma correcta.

🔴 **Lo que NO puedo decidir, y lo pido en §7:** B midió que las URLs vivas
*«sirven hoy el documento del sitio, que se excluye a sí mismo de la app»*. **Una fila que
diga «Política de privacidad» y lleve a un documento que declara no cubrir la app es peor que
la ausencia** — la ausencia se nota, esa fila no.

---

## §5 · SUPERFICIE 4 — LA SERIE RECURRENTE

### 🔴 EL HALLAZGO MAYOR DE LA TANDA — motor entero, cero puerta, y una promesa rota

`LETRA_COBRO_RECURRENTE` §10.1 ordena censar la pantalla **antes** de construir, y advierte
que *«si la pantalla promete algo distinto a esta letra, gana lo que ya se le prometió al
cliente o se corrige la pantalla — jamás se deja divergir en silencio»*.

**Lo medido:**

| Pieza | Estado |
|---|---|
| Tabla `pedidos_recurrencias` | ✅ existe (14 columnas) |
| `configurar_recurrencia` · `alternar_recurrencia` | ✅ existen, con wrappers en `@epetplace/api` |
| `avisar_recurrencias_proximas` · `ejecutar_recurrencias_vencidas` | ✅ existen, **con cron** (`20260812180000`) |
| **Lector de las series del cliente** | ❌ **CERO** — ningún `listarRecurrencias`, ningún consumidor de la tabla fuera del alta |
| **Pantalla de la serie** | ❌ **NO EXISTE** — `pedidos/` tiene 4 archivos y **ninguno la menciona** |

**Y la promesa viva, verbatim** (`es.ts:1895`, mostrada al configurar):

> *«Listo: quedó configurado. **Lo manejás desde Tus pedidos**.»*

⇒ **La app le dice a la familia dónde gestionar algo que no se puede gestionar en ningún
lado.** Es `L-318` (*motor sin puerta*) en su forma cara: **acá no falta la puerta en
silencio — está anunciada con su dirección.**

*(De paso: esa cadena es la **única** con voseo visible que queda en el diccionario del
cliente —`manejás`—. `D-857` declaró las 34 barridas en S101-D; ésta sobrevivió. Su cura va
junto con la pantalla, porque cambiarla sola dejaría la promesa igual de falsa, mejor
escrita.)*

### 🔴 Lo que la letra exige y el motor todavía NO puede sostener

`LETRA_COBRO_RECURRENTE` §2: *«la autorización **nombra un medio de pago concreto** (el token
guardado). Si ese medio muere, la serie no salta a otro por su cuenta»*.

**Medido: `pedidos_recurrencias` no tiene ninguna columna de medio de pago.** Sus 14 columnas
son `activo · aviso_dias · aviso_enviado_para · created_at · cuenta_comercial_id ·
dia_del_mes · entrega · frecuencia_dias · id · items · metodo_entrega ·
proximo_pedido_fecha · updated_at · user_id`.

⇒ **§2 y §6 son hoy inexpresables**, y **no es un hueco de pantalla**: ninguna superficie
puede mostrar «a qué medio» si el dato no existe. **Es contrato para A** (§7).

**Lo mismo con la pausa:** §6 firma **tres días de reintento y después pausa, que no es
cancelación**. La tabla tiene un solo `activo boolean` ⇒ **hoy no se puede distinguir
«pausada porque falló el cobro» de «apagada por el cliente»**, y son dos pantallas distintas
con dos salidas distintas.

**Y una buena, medida:** `aviso_dias NOT NULL DEFAULT 2 CHECK BETWEEN 2 AND 3` — el motor ya
cuenta en días y su default **son exactamente las 48 h que la letra §3 firma.** *La letra y
el motor coinciden sin que nadie los haya conciliado.*

### Receta de forma

**Qué debe sentir:** *«sé qué me va a llegar, cuándo, cuánto me van a cobrar y cómo lo corto
— sin pedirle permiso a nadie.»* (§2, literal de la letra.)

**Referencia adaptada:** las suscripciones de Spotify/Amazon — un bloque de estado arriba, el
próximo cargo con su fecha y su monto, y la baja **visible y sin laberinto**. *Lo que se deja
de la referencia: los muros de retención, los descuentos de último minuto y los «¿seguro?»
encadenados — `POLITICAS` no los permite y §2 dice que cortar es un acto del cliente.*

**Los cuatro grupos, cada uno en su carta (N21 — un rótulo que nombra un grupo declara que el
grupo va en carta):**

1. **Qué llega** — los ítems y cada cuánto.
2. **El próximo cobro** — fecha, monto y **a qué medio** (§2 exige los tres; el tercero
   depende del contrato pedido a A). Con la línea del aviso: *te avisamos 48 h antes.*
3. **A dónde llega** — la entrega, que la tabla ya guarda.
4. **Cortar** — `Boton destructivo` (variante que ya existe, tonal danger; **jamás ocre**:
   N26 reserva el ocre para lo que acciona una compra, y cancelar no compra).
   **Confirmación simple, NO doble** — la doble de P1 es para lo destructivo irreversible
   (borrar una tarjeta); una serie se vuelve a activar cuando la familia quiera, y §2 firma
   que cortar no es un trámite.

**Los estados que la pantalla debe saber decir** (de §6 y §7 de la letra, ninguno inventado):
**activa** · **pausada por cobro fallido** (con qué hacer para reanudarla) · **saltada por
falta de stock** (*«este mes no pudimos enviar X»* — la serie **sigue viva**, no se pausa; y
**jamás se ofrece un sustituto**, §7 lo prohíbe por razón clínica) · **cancelada por el
cliente**.

**Dónde vive — y por qué una sola pieza:** la promesa dice «Tus pedidos», y ahí debe estar su
entrada. Pero `LETRA_COBRO_RECURRENTE` §1 declara **dos sujetos, un mecanismo** (plan de
paseos · despensa recurrente). ⇒ **la vista de la serie se construye como UNA pieza montada
en dos casas**, igual que `SeccionMedioDePago`. *Escribirla dos veces es exactamente el
defecto que `R57` nació midiendo, y esta vez lo sabemos antes de escribirlo.*

⚠️ **Lo que no decido:** la ruta concreta y la entrada en `pedidos/index`. `LETRA_PUERTA_DE_PAGO_S101B`
§9 asigna los nombres de pantalla y rutas **al censo**, no a la letra. Van con el contrato de A.

---

## §6 · LAS VOCES NUEVAS — tuteo neutro, es/en

**Candidatas, no depositadas.** Ninguna se escribe en el diccionario hasta la tanda 1, y las
del legal (§4) **no las escribe esta pista**.

| Clave propuesta | es | en |
|---|---|---|
| `pago.deunaFila` | Deuna | Deuna |
| `pago.deunaSubtitulo` | Pagas desde tu app Deuna | Pay from your Deuna app |
| `pago.deunaNoRecurrente` | Para que llegue solo necesitas una tarjeta guardada. | Automatic deliveries need a saved card. |
| `pago.deunaEsperaTitulo` | Ingresa este código en tu app Deuna | Enter this code in your Deuna app |
| `pago.deunaCodigoVence` | El código vence en {{tiempo}} | Code expires in {{tiempo}} |
| `pago.deunaCodigoVencido` | El código venció. | The code expired. |
| `pago.deunaCodigoNuevo` | Generar un código nuevo | Get a new code |
| `serie.proximoCobro` | Próximo cobro: {{fecha}} | Next charge: {{fecha}} |
| `serie.avisoPrevio` | Te avisamos 48 horas antes de cada cobro. | We'll let you know 48 hours before each charge. |
| `serie.pausada` | Quedó en pausa: no pudimos completar el cobro. | Paused — we couldn't complete the charge. |
| `serie.comoReanudar` | Actualiza tu medio de pago para reanudarla. | Update your payment method to resume it. |
| `serie.saltadaSinStock` | Este mes no pudimos enviar {{producto}}. | We couldn't ship {{producto}} this month. |
| `serie.cancelar` | Cancelar envíos | Cancel deliveries |
| `serie.cancelarConfirma` | ¿Cancelas los envíos automáticos? | Cancel automatic deliveries? |
| `serie.cancelarDetalle` | No se cobra nada más. Puedes volver a activarlos cuando quieras. | Nothing else will be charged. You can turn them back on whenever you want. |

**Dos reglas que se respetaron y conviene declarar:** ninguna voz nombra *«fondos
insuficientes»* (§5 de la puerta lo prohíbe) y ninguna promete un plazo que no controlamos
(el aviso son 48 h porque el motor ya los cuenta — `aviso_dias` default 2).

---

## §7 · LOS CONTRATOS QUE PIDO — no invento ninguno

**A la pista A (motor · `@epetplace/api`):**

1. **Un tipo de medio elegible que no sea `TarjetaGuardada`** — DeUna no tiene token, `bin`,
   últimos 4 ni alias. Sin eso, `FilaMedioDePago` no puede pintarla sin inventar una tarjeta.
2. **Lector de las series del cliente** — hoy hay cero. Necesito por serie: ítems ·
   cadencia · `proximo_pedido_fecha` · **monto esperado** · **medio de pago** · estado.
3. 🔴 **El medio de pago en `pedidos_recurrencias`** — `LETRA_COBRO_RECURRENTE` §2 exige que
   la autorización nombre un token concreto y **la tabla no tiene la columna**. §2 y §6 son
   inexpresables sin ella. *No es un pedido de pantalla: es la letra que no se puede cumplir.*
4. 🔴 **Distinguir pausada de apagada** — un solo `activo boolean` no separa «falló el cobro
   tres días» de «el cliente la apagó», y son dos superficies distintas.
5. **La causa del último fallo con su nombre** — §6 de la letra depende de la ficha 🔴 de
   causas que el censo de S102 abrió: *mientras «no aprobado con causa conocida» y «no
   aprobado sin causa» compartan etiqueta, el aviso no puede distinguir «tu tarjeta venció»
   de «escribinos».*
6. **Para DeUna:** el código de 6 dígitos y su instante de vencimiento, expuestos por la
   puerta única — la pantalla **no calcula el reloj del proveedor**, lo muestra.

**A la pista B (legales):** las URLs finales por documento e idioma, **y si cubren la app**.
Hoy las vivas se excluyen a sí mismas del producto (medido por B, §2.3 de su censo). *Una
fila que se llame «Política de privacidad» y lleve a un documento que dice no cubrir la app
es peor que no tener la fila.*

**A la pista D (o a quien tenga el sujeto plan de paseos):** si el plan monta la misma pieza
de serie, su lector con los mismos campos. *La pieza se diseña una vez o no se diseña.*

---

## §8 · LO QUE ESTA TANDA NO HIZO, sin maquillar

- **Cero código.** Ni una línea, en ninguna app ni paquete (el encargo lo prohíbe hasta la
  tanda 1).
- **Cero cadena depositada** en los diccionarios — las de §6 son candidatas.
- **No curé la frase legal falsa de §4** (materia legal, excluida) **ni el voseo de §5**
  (va con su pantalla).
- **No elegí rutas ni nombres de pantalla** — `LETRA_PUERTA_DE_PAGO_S101B` §9 los asigna al
  censo con el contrato de A a la vista.
- **No hay gate en dispositivo:** nada de esto se vio en un aparato. *Es una receta de forma,
  y una receta no es una pantalla.*
- **No verifiqué el ambiente de DeUna:** la letra §10 dice que **nada se construye antes de
  las credenciales QA**, y no las busqué.

## §9 · LO QUE LA TANDA 1 NECESITA ANTES DE ABRIR

1. **Confirmar el encuadre** — `PLAN_MESA_104.md` no existe (§0). Es el mismo pedido que hizo B.
2. **Firma sobre la frase legal vencida** (§4) y sobre el soporte prometido por tres códigos
   de compuerta contra un canal que dice «Pronto».
3. **Los contratos de A** (§7) — sin el 3 y el 4, la pantalla de la serie **no puede decir la
   verdad completa que su letra le exige**, y construirla igual sería publicar una pantalla
   que miente por omisión.
4. **La decisión de producto de §2:** DeUna no elegible con su razón, o «que llegue solo»
   apagando la opción antes del pago.

---

**Método:** todo dato de este parte se midió del objeto —archivos, `grep` sobre el repo,
`database.types.ts`, la migración `20260812180000`— jamás de un resumen ni del canon. Las
citas van entre comillas con su archivo y su línea.
