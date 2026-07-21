# LETRA — El selector de mascota por ELEGIBILIDAD (S73, firmada en mesa)

> **Estado: FIRMADA EN MESA (founder, S73) · ENMENDADA S73-A sobre el
> literal del censo** (los §2 y §4 de la versión de mesa traían hipótesis
> que la fuente contradijo — ver §7, el freno). Destino cumplido: corolario
> de la **Ley 23** en `epetplace-design-system` (depositado S73-A) + este
> doc. La regla de plataforma en `DISEÑO_EXPERIENCIA` se deposita CON el
> boceto del selector (el alcance del boceto cambió — ver §6).
> Aplica a LOS CUATRO OFICIOS del lado cliente.

---

## 1. El corolario (agregado a la Ley 23 — INTACTO de la firma)

La Ley 23 dice: *"la puerta no ofrece lo que va a rechazar."*
Nace su espejo, dictado por el founder en S73:

**"LA PUERTA NO PREGUNTA LO QUE YA SABE."**

Prueba: *"si solo hay una respuesta posible, ¿por qué la estoy
preguntando?"* Si la respuesta es "por costumbre del formulario", era un
bug de puerta. Es CERO EXPLICACIÓN literal: la pregunta que no existe es
la que nadie tiene que entender.

## 2. N = elegibles para ESE servicio (ENMENDADO S73-A: la frontera existe)

El cómputo es **DE MOTOR, no de pantalla**: la elegibilidad la modula la
especie por servicio (decisión founder S57: el paseo es SOLO perros; la
vet pasa TODAS por diseño) y el momento vital ANTES que todo. Una familia
con un perro y un gato reservando paseo tiene **N=1**.

**Cómo quedó construido (S73-A, decisión regla 67 declarada):** la
frontera es **PURA** — `mascotasElegibles(mascotas, especiesElegibles)`
en `packages/api/src/wrappers/_mascotas-elegibles.ts` (patrón
`_presupuesto-descripcion`): opera sobre datos que la pantalla YA tiene,
cero roundtrips nuevos (el piso de performance del Hogar no gana otra
llamada). `obtenerMascotasDeFamilia` ganó `estado_vida` en su shape
(angostado honesto: fuera del CHECK = null = NO elegible, falla cerrada).
Las cinco superficies (los 4 `explorar/<oficio>/index` + `disponibles`
del paseo) borraron su filtro artesanal (Ley 37) y consumen la frontera;
**la pantalla jamás re-computa elegibilidad**.

> La versión de mesa decía "el wrapper entrega la lista ya filtrada" como
> estado deseado; el literal S73-A halló que las 4 pantallas re-computaban
> con `useMemo` propio y la vet no filtraba nada. Curado en la misma tanda.

## 3. Los tres estados (los tres exigibles — INTACTOS de la firma)

- **N = 1** → **no se pregunta, pero SE DICE.** La mascota queda
  seleccionada y VISIBLE en la superficie (avatar + nombre en línea).
  Auto-seleccionar y esconder es magia, y la magia se vuelve confusión
  el día que acierta mal. El dueño puede ver para quién es sin haber
  tocado nada.
- **N > 1** → el selector vive: **chips en línea con avatar**
  (`SelectorOpcion`, selección ÚNICA — ojo: el filtro del Hogar es
  `multiple`; este NO), disposición según el ancho ('fila' 2–4,
  'tira' para familias grandes). **El COLOR lo decide el founder en la
  lámina** (control vs `capa.identidad` — hoy los 4 viven en
  `acento="control"` por el barrido Ley 21/22 de S58; ver §7): lo firmado
  es la ANATOMÍA (avatar dentro del chip, elección visible en línea, sin
  Hoja de por medio), no un color.
- **N = 0** → el servicio no se ofrece para esta familia, o lo dice con
  voz honesta. Es la cláusula del conjunto vacío que la Ley 23 ya trae.

## 4. Lo que muere y lo que queda (ENMENDADO S73-A: el literal)

- **Los chips en línea YA EXISTEN en los cuatro oficios desde S61-A3/A4**
  (`5e80a19`: rasgo 1 de la gramática canónica — el para-quién visible
  siempre, con la cara). La superficie del selector NO es construcción
  nueva.
- El "botón de pie" que la versión de mesa mandaba matar **no era un
  disparador de selección**: es un CTA de `EstadoVacio` en grooming/vet
  que SCROLLEA al selector existente (solo alcanzable con N>1 sin
  elección). **Decisión de mesa (c): QUEDA** — cumple 17.5 (el vacío
  termina en camino). Fuera de S73.
- **La Hoja de `disponibles` QUEDA** — decisión de mesa (b): es otro
  trabajo (elección dentro del flujo momento-primero, cinturón de deep
  links). Su violación del N=1 ("auto-elegía en silencio", `:254`) se
  curó en S73-A: la auto-elegida se DICE en el header con avatar+nombre.

## 5. Memorial y momento vital (INTACTO de la firma — motor CUMPLIDO S73-A)

Una mascota en memorial **no es elegible para ningún servicio** — no
aparece en N. El filtro es del motor (momento vital consultado ANTES de
computar elegibilidad, patrón MODELO_LOYALTY §7.1), jamás un if de UI.

**Estado S73-A:** cumplido en la frontera — `estado_vida === 'activa'`
exigido PRIMERO ('fallecida' y 'perdida' no reservan; doble precedente
regla 67: el mostrador vet ya filtraba `activa` y la convención
`es_memorial = estado_vida !== 'activa'`). Verificado con fixture REAL
de mascota en memorial corrido en los 4 oficios con la sesión demo
(`scripts/verify-elegibilidad-memorial-s73.mjs`, 10/10 verde; el fixture
era un PERRO fallecido — que la VET lo excluya prueba el camino del
momento vital, no el de especie). Antes de esta cura, **una mascota en
memorial era reservable en los 4 oficios** — el hallazgo 🔴 del censo.

## 6. Orden de ejecución (S73, frente A — ACTUALIZADO)

1. ~~Censo del disparador en los cuatro oficios~~ ✅ S73-A (reporte 1).
2. ~~Motor de elegibilidad + fixture memorial~~ ✅ S73-A.
3. **Boceto M1 del selector — alcance ENMENDADO por el censo:** ya no es
   composición nueva; es el **contrato de datos del motor (M4)** + los
   detalles (b) N=1-que-dice y (d) el acento — la vara cruzada de B lo
   audita leyendo la fuente ANTES de construir superficie.
4. El acento se firma EN LA LÁMINA 19.7 (hoja nueva: los dos acentos,
   claro y oscuro, junto al estado N=1-que-dice) — gate en dispositivo.

## 7. Historial — el freno S73-A (L-158 en acto)

El censo de A (reporte 1 de S73) contradijo dos hipótesis de la versión
de mesa: los chips ya existían desde S61 y el "botón de pie" no era
disparador. La mesa resolvió con cuatro decisiones: (a) motor con
frontera única — ejecutado; (b) la Hoja de disponibles queda, con la
cura chica del N=1-que-dice — ejecutada; (c) el CTA-scroll queda, fuera
de S73; (d) el acento va a la lámina. Sobre el acento, el literal de
S61/S58: **no hay firma founder específica del color de ESTE selector**
— S61-A3 (`5e80a19`) firmó anatomía ("selector siempre, con la CARA");
`acento="control"` llegó por el barrido general de la Ley 21/22 en S58-A
(`da059ae`: "CUÁNDO migró a acento='control' — sus 3 selectores"), una
LEY firmada aplicada en bloque, no una decisión sobre el selector de
mascota. Nota para la lámina: si el de mascota pasa a `capa.identidad`
mientras duración/día/hora quedan en control, conviven dos acentos de
selección en la misma pantalla — el roce con la Ley 22 se declara en el
gate, no se esconde.
