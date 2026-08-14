# S98-C · HANDOFF DE CIERRE (segunda ventana)

**Cierra por ventana, no por trabajo pendiente.** Rama `pista/s98-c` en
`origin`, **árbol en 0**, nada en curso sin commitear. Todo lo de acá está
medido contra el objeto; lo que es opinión lo dice.

> Este handoff **no repite** el primero
> (`2026-08-14-s98c-HANDOFF-CIERRE.md`): aquél cubre `ATENDER`, el wizard y
> la frontera §3.1. Acá va lo posterior.

---

## 1 · LO VERDE Y EN `origin`

| # | qué | dónde |
|---|---|---|
| ① | **§3.1bis — el eco de la puerta se mudó a `ATENDER`** (letra depositada) | `(tabs)/index.tsx` · `(tabs)/atender.tsx` · `LA_CASA_DEL_PRESTADOR` |
| ② | **D-819 — el destape COMPONE**, con `lib/barra-prestador` (puro) + `…-lectura` | `verificacion/alta/` · `(tabs)/_layout.tsx` |
| ③ | **El botón fantasma** — el enlace de §4.0bis rutea por naturaleza | `components/alta/PasoOfreces.tsx` |
| ④ | 🔴 **D-821 — el veredicto de «vende» deja de cachearse** | `lib/cuenta-ventas.ts` |
| ⑤ | **El barrido marrón muere** en sus TRES montajes | `(tabs)/index.tsx` · `(tabs)/negocio.tsx` |
| ⑥ | **La facturación a su casa** (Negocio/Cobros) + el puntero fiscal gateado | `(tabs)/negocio.tsx` · `ventas/configuracion.tsx` |
| ⑦ | **Los dos toggles de la solicitud + el aviso de documentación** | `components/alta/PasoOfreces.tsx` |
| ⑧ | La pasada de ojo del **cliente** (solo lectura) | `scripts/mirar-s98c-cliente-entrada.mjs` |

**Verificado:** typecheck verde · `verify:diseno` **VERDE 32 reglas** ·
`verify-s98c-barra-destape` **7 comprobaciones con auto-prueba** ·
`verify-s98c-eco-puerta` y `verify-s98c-d821-veredicto-fresco` **verdes con
sus dos brazos**.

---

## 2 · LA COLA, CON SU ESTADO REAL

### 2.1 ⛔ El formulario del corte — **esperando el ensanche de A**
**Su parte visible no necesita endpoint**, pero **el esquema no tiene días
ni festivos**: `reglas_envio_turnos` es `codigo · corte · entrega_desde ·
entrega_hasta · dia_offset · orden · zona_horaria · activo`. **Hoy todo
corte aplica TODOS los días.**

**Contrato ya pedido a A**, con su detalle caro: *el backfill honesto de las
filas vivas es el set completo **L–D**, no L–V* — poner L–V «porque es el
caso común» le cambia la operación a quien hoy entrega sábados sin que nadie
le pregunte.

**Freno declarado:** no se monta la persistencia del lado de la pantalla. Si
el motor no llega, el formulario nace **sin** los chips de días y eso se
declara como hueco — jamás un estado local que no persiste.

Lo demás de la spec **no está bloqueado**: placeholder nativo en el nombre ·
ⓘ con modal en la hora de corte (patrón general: *los campos que necesiten
explicación llevan su ⓘ, no párrafos permanentes*) · desde/hasta en UNA fila.

### 2.2 ⛔ El repartidor — **esperando el endpoint de visión**
**Contrato pedido a A** (entrada: foto del documento · salida: `nombre ·
numero_documento · tipo_documento`), con la regla del carnet rigiendo:
**campo no legible = `null` honesto, jamás inventado** (L-139). *Un número
de cédula plausible y equivocado es peor que un campo vacío: el vacío se
llena, el equivocado se firma.*

**Fallback declarado, no diseño:** el formulario nace **con la foto ya en su
lugar** y la digitación manual como camino vivo.

Lo demás de la spec: foto del repartidor **obligatoria** · teléfono con
selector de país y **WhatsApp NO opcional** · **el recurso vive DENTRO del
repartidor** (tipo de vehículo + placa, hasta dos).

### 2.3 ⏳ El censo del digesto — **a mitad, y es insumo de las dos ventanas**
**Censado:** las fuentes vivas de «Lo que te espera» tras mi mudanza son
**tres** — `coordinar` (→ `/veterinaria/coordinar/[citaId]`) · `presupuestos`
(→ `/veterinaria/movimiento`) · `abiertas` (→ `/cita/[citaId]`). **Las tres
son del mundo SERVICIOS.** La cuarta, `handshakes`, **murió con §3.1bis**.

**Falta:** el lado del vendedor — si `/ventas` tiene su propio digesto de
pendientes y cómo se reparte. **Mi voto provisional, sin el dato:** el
digesto se parte por mundo y cada ventana lleva el suyo; hoy las tres
fuentes irían enteras a la ventana de citas. *No lo firmo sin medir el otro
lado.*

⚠️ Y va **después de D-820** de todos modos: *la ventana de pedidos del dual
ES la del vendedor puro, construida una vez.*

### 2.4 🔴 D-820 — la línea que escribí y quedó superada
Mi cura de D-819 codifica que **«el vendedor puro no enumera ninguna (su
casa es /ventas)»**. Era correcta contra la premisa de su día y **la firma
de doce horas después la superó**: *todos los dueños ven casi lo mismo*.
**La FORMA sobrevive entera** —componer, no enumerar; una fuente, dos
consumidores—; **cambia su caso del vendedor**. No la toqué, por orden.

---

## 3 · LO QUE ESPERO DE OTROS

| de | qué |
|---|---|
| **A** | el ensanche de días + festivos en `reglas_envio_turnos` (contrato enviado) |
| **A** | el endpoint de visión del documento (contrato enviado) |
| **B** | 🔴 **la tira del destape se DESBORDA con cinco tabs** — `Hoy` y `Cuenta` quedan cortadas contra los bordes. Solo aparece ahora que la lista dejó de ser cuatro fijas. Su contrato dice «3 a 5» |
| **D** | nada pendiente — el HOY quedó con el día |

---

## 4 · EL ENCARGO DE LA LENTITUD, CON SU PUNTA MEDIDA

El founder siente la app lenta. **Dato duro de mi corrida de D-821: TRES
consultas a `cuenta_roles` por visita, en tres momentos SECUENCIALES.** Metí
deduplicación en vuelo y **no bajó el número** — no se superponen.

⇒ **La hipótesis a perfilar no es el caché: son olas encadenadas.** Contar
olas de red y qué las encadena en las pantallas que el founder pisa
(`ATENDER` · `Negocio` · `ventas/configuracion`). Si el patrón se repite, es
latencia estructural y la cura es agrupar, no cachear — *cachear fue
exactamente lo que produjo D-821.*

---

## 5 · FRENOS Y LEYES QUE NACIERON ACÁ

- 🔴 **Lo que otorga un tercero NO se cachea.** El caché se parte por
  **quién puede cambiar el dato**, no por si es caro de leer. (D-821: el
  archivo tenía el razonamiento invertido y `invalidarContextoVentas` nunca
  tuvo un llamador.)
- **El puntero fiscal del vendedor puro muere solo con D-820** — está
  gateado a `sinOtraCasa`. Quien cierre D-820 lo retira.
- **El presupuesto de ancho de la baldosa es 121 px** (viewport 360), no
  151 (420). **La relación NO es lineal**: los paddings son fijos. Se corre
  `ANCHO=360 node scripts/medir-s98c-ancho-baldosa.mjs`, no se extrapola.
- **Motor y bundle van juntos** (aviso de A, sostenido): revertir el trigger
  de `llegada_en` con el «Llegó» muerto deja las llegadas sin escritor.
- **El fallback de D** sobre «Prepará tu espacio» exige que «Tus servicios»
  siga siendo lo primero del Negocio. Si cambia, se le avisa **antes**.

---

## 6 · DISCRIMINADORES Y CREDENCIALES

- **Puertos:** `:8081` mío · `:8082` de D · `:8083` lo usé para el cliente.
- **La clave de las 13 cuentas** sale del keychain:
  `security find-generic-password -a siembra -s epetplace-siembra-s97 -w`.
  ⚠️ **`vendedorpuro` NO entra con ella** — fue renombrada y solo a
  `demo-vet` se le reseteó la clave (matriz de A). Para el caso «vendedor
  puro» sirve **`duenodes`**.
- **Cuentas por caso:** `duenotodo` dual (servicios + tienda activa) ·
  `duenovet` sin tienda · `duenodes` vendedor puro · `demovet` **la del
  handshake vivo** (Clínica Aurora, 5 solicitudes sin responder — es el
  discriminador de §3.1bis).
- **Instrumentos nuevos:** `verify-s98c-barra-destape.ts` (lógica pura, con
  auto-prueba) · `verify-s98c-eco-puerta.mjs` (**aborta sin veredicto** si
  no hay eco que mostrar) · `verify-s98c-d821-veredicto-fresco.mjs` ·
  `medir-s98c-ancho-baldosa.mjs` · `repro-s98c-*` · `captura-s98c-*`.

---

## 7 · MIS ERRORES DE ESTA VENTANA

1. **Un regex cruzó dos bloques de import** y metió `caraDeMascota` en el de
   `@epetplace/ui`. Lo cazó el typecheck.
2. **Un guard de script matcheó un comentario que yo mismo había escrito** y
   dio «ya tenía» sin agregar el import.
3. **Edité JSX con regex y rompí dos archivos.** La cura fue **revertir** y
   rehacerlo con ediciones precisas. ⇒ *una herramienta que no ve el árbol
   sintáctico no debería editar JSX.*
4. **Saqué un elemento del medio de un `Promise.all` posicional** y
   desalineé el destructuring — **con el archivo teniendo ese cobro escrito
   en un comentario tres líneas arriba.**
5. **Extrapolé el ancho útil** de 420 a 412 con una regla lineal falsa;
   habría aprobado tres voces que truncan.
6. **Declaré un costo de «dos peticiones» y eran TRES**; lo corrigió la
   corrida, no el razonamiento.
7. **Dos instrumentos míos se rompieron EN VERDE (o en rojo) por medir la
   forma de la superficie** — uno la etiqueta del enlace, otro el CTA que yo
   mismo había reemplazado.

> **Lo común a las siete: una conclusión que necesitaba una medición más, o
> una herramienta de comodidad metida entre la medición y la conclusión.**

---

## 8 · SI REABRÍS ESTA PISTA, EN ORDEN

1. **El formulario del corte** — en cuanto A entregue días+festivos. Su
   parte no bloqueada se puede adelantar.
2. **El repartidor** — con la foto en su lugar y digitación manual; se
   cablea la visión cuando llegue.
3. **El censo del digesto** (§2.3), que destraba las dos ventanas.
4. **D-820** y con él el puntero fiscal del vendedor puro.

**Nada de esto tiene gate en dispositivo.** Todas mis capturas son web: **el
verde de una plataforma no viaja a la otra** — esta jornada lo demostró dos
veces (la baldosa que colapsaba a 0 en web y se estiraba a 800 en Android; y
el ancho útil que cambia 151 → 121 entre dos viewports).
