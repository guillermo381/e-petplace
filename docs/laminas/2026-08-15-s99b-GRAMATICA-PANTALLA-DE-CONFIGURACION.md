# LA GRAMÁTICA DE UNA PANTALLA DE CONFIGURACIÓN — S99-B

**Origen:** firma del founder, verbatim — *«la configuración del negocio
para el vendedor de despensa hoy se ve muy diferente a cómo se estructura
el diseño de cómo se configuran los servicios. Deberíamos tener una
coherencia visual. Diez campos pueden ser muy complejos o relativamente
fáciles si organizamos la pantalla bien. Hoy no está bien organizada.»*

**Estatuto:** receta de forma de la Dirección de Diseño, **servida ANTES
de que C toque la pantalla**. No aprueba pantallas: la pantalla se aprueba
en la app.

> ✅ **N11 PASA y sale de la conversación.** Los campos con teclado se
> caminaron en aparato: la Hoja sube, el CTA queda arriba del teclado,
> nada tapado. **Lo que falla no es el campo: es la pantalla.**

---

## §1 · EL CENSO — las dos configuraciones, medidas

| | **TALLER** (`*/taller.tsx` ×4, 3.602 líneas) | **VENTAS/CONFIG** (1.495 líneas) |
|---|---|---|
| **modelo** | **wizard de 3 pasos** — `PASOS = ['duraciones','horarios','zonas']` | **sin pasos**: una pantalla larga |
| **qué persiste al tocar** | **NADA** hasta el CTA final (su header lo declara: *«nada persiste hasta Guardar tu oferta»*) | **cada ítem al confirmar SU Hoja** |
| **dónde se guarda** | **UN CTA de pantalla** — «Continuar» / «Guardar tu oferta», `bloque`, `deshabilitado={!hayCambios}` | **TRES guardados**, uno por Hoja (`guardarRepartidor` · `guardarRecurso` · `guardarTurno`) |
| **CTA de pantalla** | 1 | **0** |
| **secciones** | duraciones · horarios · zonas | turnos · repartidores · recursos · facturación (ésta **navega afuera**) |
| **material de sección** | `Texto seccion` + `Tarjeta elevacion="reposo"` | `Texto seccion` + `Tarjeta relleno="ninguno"` con filas + `Separador` |

### 🔴 EL HALLAZGO QUE DA VUELTA LA PREGUNTA

**Los diez campos NO están en la pantalla. Los diez viven DENTRO de las
tres Hojas.** Medido: cero `<Campo>` fuera de un `<Hoja>` en
`ventas/configuracion`.

⇒ **La pantalla no tiene diez campos que organizar: tiene TRES LISTAS y
UN ENLACE.** Lo que el founder sintió como complejidad **no es densidad
de campos** — y por eso «organizar mejor los campos» no lo iba a curar.

### 🔴 Y LA INCOHERENCIA REAL NO ES VISUAL: SON DOS CONTRATOS DISTINTOS

Las dos pantallas le prometen cosas **opuestas** a la misma persona sobre
**cuándo su trabajo está a salvo**:

> · En el **taller**, tocar es gratis: nada existe hasta que apretás.
> · En **ventas**, cada confirmación **ya es permanente**.

*Ese es el fondo del «se ve muy diferente»: no son dos estilos, son dos
modelos mentales de «configurar mi negocio», y la persona tiene que
descubrir en cuál está.*

**Y hay una asimetría peor, que es la que de verdad duele:** el taller
**te guía** —te dice qué falta, en qué orden y cuándo terminaste—;
ventas **te deja parado frente a tres listas vacías** sin decirte por
dónde empezar ni cuándo está listo.

---

## §2 · LO QUE **NO** HAY QUE HACER, y por qué

**❌ Convertir ventas en un wizard.** Los dos modelos son **correctos
para lo suyo**, y esto es lo que el reclamo esconde:

- El taller configura **UNA COSA que solo vale completa** — una oferta
  sin precio no se puede publicar. **No existe estado parcial válido** ⇒
  el compromiso al final es lo correcto.
- Ventas configura **COLECCIONES de cosas independientes** — un
  repartidor vale suelto, sin turnos ni recursos. **Cada ítem es válido
  solo** ⇒ el guardado por ítem es lo correcto.

*Forzar un modelo sobre el otro compraría coherencia visual pagando con
una mentira sobre el dominio.*

---

## §3 · LA GRAMÁTICA — tres reglas

### ① LA PANTALLA **DICE** EN QUÉ MODELO ESTÁ (hoy no lo dice ninguna)

**El discriminador es una pregunta, no un gusto: ¿existe un estado
parcial VÁLIDO?**

| respuesta | modelo | el contrato, hecho visible |
|---|---|---|
| **NO** | **ARMAR UNA COSA** — pasos, compromiso al final | **un CTA al pie, `bloque`**, deshabilitado hasta que haya cambios. *El botón apagado ES la promesa de que nada se guardó todavía.* |
| **SÍ** | **ADMINISTRAR COLECCIONES** — guardado por ítem | **CERO CTA de pantalla, Y SE DICE.** Hoy el vendedor busca un «guardar» que no existe y no sabe si perdió algo. |

**La cura barata de ventas es una línea**, no una reestructura: *«Cada
cambio se guarda al confirmarlo.»* bajo el título. **Un contrato
implícito se descubre perdiendo trabajo.**

### ② TODA CONFIGURACIÓN CONTESTA TRES PREGUNTAS, EN ESTE ORDEN

Y **no las invento: salen de N18, que ya está firmada** — *«la
completitud gana ALCANCE… **el vendedor ve exactamente cuál campo lo dejó
afuera**»*. N18 se escribió para productos; **su principio es de la casa**.

1. **¿Qué necesita mi negocio configurado?** — el inventario de lo que
   falta, arriba de todo. *El taller lo contesta siendo un wizard;
   ventas no lo contesta.*
2. **¿Por dónde empiezo?** — el orden **no es alfabético ni de
   implementación**: es el de la operación. **Primero lo que define QUÉ
   vendo, después CUÁNDO, después QUIÉN/DÓNDE.**
   ⚠️ Hoy ventas arranca por **turnos** (el CUÁNDO) y el taller por
   **duraciones** (el QUÉ). **El taller tiene el orden bueno.**
3. **¿Ya está listo?** — con la voz de N18: **narrativa + un paso**, el
   número puede llegar a cero, y **lo que depende de e-PetPlace no entra
   al contador**. *«Te falta un repartidor para poder despachar»*, jamás
   una barra de progreso ni un porcentaje (LOYALTY §2/§3: **la moneda es
   invisible**).

### ③ LO QUE SE UNIFICA SIEMPRE, viva la pantalla en el modelo que viva

- **Anatomía de sección:** `Texto variante="seccion"` + su contenido ·
  aire entre secciones **32** (N2) · **máximo 3 separadores** (N3).
- **Anatomía de una lista de ítems:** `Tarjeta relleno="ninguno"` + filas
  + `Separador` entre filas, y **«agregar» al PIE de su lista** — jamás
  flotando ni al principio. *(Ventas ya lo hace bien; es lo único que hoy
  está unificado y conviene no romperlo.)*
- **Un solo material por jerarquía.** 🔴 Hoy las dos usan `Texto seccion`
  + `Tarjeta` **con `relleno` distinto y sin regla escrita** — misma
  jerarquía visual, dos materiales. **Se elige uno: `relleno="ninguno"`
  cuando el contenido son FILAS, `elevacion="reposo"` cuando es un
  bloque compuesto.** El criterio es el contenido, no la pantalla.
- **El vacío habla** (N9): una lista vacía usa `EstadoVacio` con **qué
  pasa y qué hacer**, jamás una tarjeta hueca.
- **Los campos viven donde se decide.** Que los diez estén en Hojas **no
  es un defecto**: una Hoja por ítem es correcta para colecciones. Lo que
  falta no es sacarlos: es que la pantalla diga qué ítems necesita.

---

## §4 · LA REFERENCIA DE INDUSTRIA, y qué se toma de ella

**Shopify admin · la barra «Unsaved changes».** Es la referencia exacta
porque resuelve **el problema medido acá**, no uno parecido: hace
**VISIBLE el contrato de guardado** en vez de dejarlo implícito. Shopify
tiene las dos clases de pantalla —ajustes que se comprometen al final y
colecciones que guardan por ítem— y **la diferencia se ve sin leer nada**.

**Lo que se toma:** que el contrato se declare en la pantalla.
**Lo que NO se toma:** su barra flotante. **Nuestra casa ya tiene la
pieza** —el CTA al pie, `bloque`— y una barra flotante nueva sería
inventar donde hay (Ley 11). *Se copia el principio, no el widget.*

---

## §5 · LA RECETA PARA C, en orden de retorno

1. **Una línea bajo el título de ventas: el contrato.** *«Cada cambio se
   guarda al confirmarlo.»* Cuesta una key y cura lo que más duele.
2. **Reordenar las secciones a la operación** — QUÉ · CUÁNDO ·
   QUIÉN/DÓNDE. Hoy arranca por el CUÁNDO. Es mover bloques, no
   reescribir.
3. **La zona de completitud arriba** (N18, voz narrativa + un paso). *Es
   lo que convierte «tres listas» en «tu negocio, y esto le falta».*
4. **Unificar el material por jerarquía** con el criterio de §3③.
5. **El vacío de cada lista, con `EstadoVacio`** (N9).

**Lo que NO va en esta receta y lo declaro:** no toco el modelo de
guardado de ninguna de las dos — **los dos son correctos** (§2). Y **no
prescribo un wizard para ventas**: sería coherencia comprada con una
mentira sobre el dominio.

---

## §6 · LO QUE ESTA RECETA NO PUEDE FIRMAR

**El ojo.** Los instrumentos dicen que la anatomía se puede unificar;
**ninguno puede decir si la pantalla reorganizada se siente simple.** El
founder dijo *«diez campos pueden ser fáciles si organizamos bien»* —
**esa evaluación es suya y va al gate**, con la pregunta concreta:
*¿ahora sabés por dónde empezar y cuándo terminaste?*
