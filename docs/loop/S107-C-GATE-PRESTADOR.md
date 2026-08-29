# S107-C · GUION DE GATE — el recorrido del prestador en el aparato

> **Para el founder.** Lo que sigue está medido contra la base viva y contra el repo hoy, no escrito de memoria.
> ## ⚠️ §0 ESTÁ VENCIDO — enmienda del 29-ago-2026, medida
> **Cuando escribí este guion, mi trabajo no estaba en `main` y por eso §0 decía «no es caminable». Hoy es falso:** medido, **cero commits fuera de `main`** y la rama en origin al mismo SHA.
> **§0 se conserva y NO se borra** —su lección sobre el binario (`L-432`) sigue siendo cierta y es la parte que vale— **pero su veredicto de «no caminable» ya no rige.**
> 🔴 **Lo que sí hay que re-medir antes de agendar, porque cambia solo:** que exista binario para el runtime que `app.json` declara, y el estado del flag `guarderia`.
>
> *Se marca en vez de borrarse: un guion que dice «no se puede caminar» sobre algo que ya se puede hace perder una sesión, y uno borrado se vuelve a escribir desde cero.*

> 🔴 **Leé §0 antes de agendar nada: hoy el recorrido NO es caminable, y falta un acto que no es mío.** *(← esta línea es la vencida.)*

---

## §0 · LO QUE FALTA ANTES DE QUE ESTO SE PUEDA CAMINAR — dos actos, ninguno de C

| # | qué falta | de quién |
|---|---|---|
| ① | **Mi trabajo NO está en `main`.** Medido: `git merge-base --is-ancestor HEAD origin/main` da **rojo**; tengo **4 commits** fuera. | **A** (mergea y publica) |
| ② | **Un OTA del prestador** con eso adentro. | **A** |

### 🔴 CORRECCIÓN — ACÁ ME EQUIVOQUÉ, Y LA VERSIÓN ANTERIOR DE ESTE GUION DECÍA LO CONTRARIO

**Yo escribí: «build nueva NO hace falta».** Lo medí así: cero cambios en `package.json` y `app.json` **entre `main` y mi rama** ⇒ ningún módulo nativo nuevo ⇒ alcanza el OTA (L-134).

**La medición era correcta y la pregunta estaba mal.** La pregunta no era *«¿mi rama agrega algo nativo?»* sino **«¿existe un binario para el runtime que `app.json` declara?»**. Medido por la mesa: **`app.json` dice `1.0.7` y ese binario nunca se cortó — la última build terminada es `1.0.6`, del 24-ago.** ⇒ **un OTA publicado contra 1.0.7 no le llega a nadie**, y el founder habría cerrado y abierto la app dos veces esperando algo que no podía bajar.

> **Rige: se corta binario nuevo y el gate se camina sobre él.** *Comparar mi rama contra `main` responde qué cambié yo; no responde qué puede recibir el teléfono.* **Queda como `L-432`.**

⚠️ **Y el gate empieza confirmando el binario y el update** (L-138 · L-160/enmienda): **Cuenta → el pie**, que dice `update <8 chars> · <canal>`. Si dice **`bundle embebido`**, el OTA no se aplicó y todo lo que sigue mide otra cosa. *Cerrar y abrir la app DOS veces: la primera descarga, la segunda aplica.*

---

## §1 · CON QUÉ USUARIO — y por qué importa cuál

**App: `e-PetPlace Negocios` (prestador).** Necesitás un **titular de un prestador `activo`** (la pantalla gatea con `useGateGestor`; un empleado sin gestión ve la pantalla de acceso ajeno, y eso también es correcto).

**Medido hoy — los ocho prestadores activos y su estado de guardería:**

| usuario | negocio | espacios | franjas | oferta |
|---|---|---|---|---|
| `guillo381+duenovet@gmail.com` | Clinica S97 (borrable) | 0 | 0 | 0 |
| `demo-prestador@epetplace.dev` | Paseos Andres | 0 | 0 | 0 |
| `guillo381+demovet@gmail.com` | Clínica Aurora | 0 | 0 | 0 |
| `guillo381+duenotodo@gmail.com` | Dueño todos los servicios | **1** | 0 | 0 |
| *(los otros cuatro)* | — | 0 | 0 | 0 |

> **Recomendado: `guillo381+duenovet@gmail.com` (Clinica S97, «borrable»).** Arranca **en cero de las tres cosas**, así ves el camino completo y lo que dejes queda en un negocio marcado como descartable.
> ⚠️ **Evitá `duenotodo`** para este gate: **ya tiene 1 espacio** (lo dejó un cinturón de A), así que su pantalla no arranca virgen.

---

## §2 · POR DÓNDE SE LLEGA

**Tab `Negocio` → la grilla de mundos → baldosa «Guardería».**

Es la **quinta** baldosa, junto a paseo · grooming · adiestramiento · veterinaria. Capa `cuidado` y glifo propio.
⚠️ **No lleva contador debajo** (las otras cuatro sí): es deliberado — cuentan filas de oferta activas, y decir *«sin configurar»* a alguien que ya guardó su cupo sería un número falso. **Un número falso es peor que ninguno.**

---

## §3 · QUÉ DEBERÍAS VER, PASO A PASO

**① Al abrir (negocio virgen).** Esqueleto un instante y después:
- **«¿Cuántos animales recibes por día?»** con un stepper **en 8**.
- **«Tus dos ventanas»**, con la ficha ya armada: **Recoge 07:00–09:00 · Devuelve 16:30–18:30**. Son valores de arranque, no datos guardados.
- Cuatro filas tocables con la hora en mono a la derecha.
- **«Tu precio»** con el slider **en $12,00**, y debajo **el neto** — lo que te queda después de la comisión.
- Paquete y mensualidad, **los dos apagados**.
- Abajo: **«Tu guardería todavía no está visible para reservas»** con el porqué.

**② Tocá una hora.** Se abre una hoja con la grilla de medias horas del día.
🔴 **Lo que hay que mirar:** al elegir el **«termino de recoger»**, la grilla **sólo ofrece horas posteriores** al «empiezo». *La puerta no ofrece lo que el servidor va a rechazar.*

**③ Movés el cupo y el precio.** El **neto se recalcula en vivo** bajo el slider.

**④ Guardar.** Un instante y **«guardado»**. La tarjeta de abajo cambia a:
- **«Tu guardería está visible para reservas»**
- y debajo, **la jornada DERIVADA**: con las ventanas de arranque, **«11.5 horas, de que empiezas a recoger a que terminas de devolver»**.
🔴 **Ese número es el gate de verdad de esta pantalla:** prueba que el motor leyó tus ventanas. **La jornada no se teclea en ningún lado.**

**⑤ Salí y volvé a entrar.** Todo tiene que volver **como lo dejaste** — el cupo desde el motor, las ventanas desde el motor, el precio desde tu oferta.
🔴 **Y guardá dos veces seguidas: no puede aparecer una segunda guardería ni una franja duplicada.** El motor upserta por clave estable; esto lo verifica.

---

## §3bis · TU DÍA — la segunda pantalla del recorrido

**Negocio → Guardería** ahora abre **la portada del mundo**, con dos puertas: **«Tu día»** y **«Configuración»**. El §3 de arriba es la segunda; ésta es la primera.

**Qué deberías ver, con el negocio recomendado (cero reservas hoy):**
- **«Hoy no tienes animales»**, con su porqué. *Un día sin animales no es un negocio muerto, y la pantalla no lo trata así.*

**Con reservas pagadas** (sólo posible después de encender el flag y de que una familia pague): una tarjeta por animal con **su cara, su nombre, la sala si el motor se la asignó, su estado en voz** —«Por recoger» · «Yendo a buscarlo» · «Acá» · «Volviendo a casa» · «Entregado»— y **la dirección de recogida**, en la **misma pieza que usa la cita de paseo**.

🔴 **Dos cosas para mirar con atención:**
1. **La lista sólo trae verdad firme.** Un hold sin pagar **no sale**. *Si saliera, te mandaría a buscar un animal que nadie compró.*
2. **Si el snapshot de dirección viniera ilegible, la pieza lo declara** en vez de pintar una casa en blanco.

⚠️ **Y una tensión que declaro en vez de esconder:** «Tu día» es de **HOY**, no de Negocio (`DISEÑO_EXPERIENCIA` §15b: *HOY acciona / NEGOCIO gestiona*). Está bajo Negocio porque **HOY tiene 2.854 líneas y su propia lógica de merge de citas**, y una estadía-día no es una cita con hora: es un día entre dos ventanas. **Inyectarla ahí es un cambio a la pantalla que usás todos los días y merece su tanda.** *El destino correcto es una entrada en HOY.*

---

## §4 · LOS REBOTES — 🔴 y acá va una respuesta incómoda

Pediste ver **publicar sin franjas** y **sin capacidad**. **Medido: por la pantalla no se llega a ninguno de los dos, y es por diseño.**

La pantalla guarda en este orden — **capacidad → recogida → devolución → oferta** — y **corta en el primer fallo**. Cuando llega a publicar la oferta, **las dos condiciones ya están puestas por ella misma**. ⇒ `franjas_no_configuradas` y `sin_espacios_configurados` **son defensas del servidor que la pantalla está construida para no tocar nunca**.

> **No es un hueco del gate: es la diferencia entre una defensa y un camino.** *Un rebote que el usuario puede alcanzar con la pantalla puesta es un defecto de la pantalla.* **Verificarlos es trabajo de A por su cinturón, no tuyo con el dedo** — y si querés verlos igual, hace falta forzarlos por SQL, no por la app.

**Los rebotes que SÍ podés alcanzar con el dedo, y valen más:**

| cómo | qué tenés que leer |
|---|---|
| Poné **devolución que empiece antes de que termine la recogida** (ej. recoge 07:00–17:00, devuelve 16:30) y guardá | **«La devolución no puede empezar antes de que termine la recogida.»** — dice **cuál** de las dos mover, no «revisá los datos» |
| Encendé **paquete** y dejá el precio **vacío** o en `0`, y guardá | **«El precio del paquete tiene que ser mayor a cero. Déjalo vacío si no ofreces paquete.»** |
| Con **avión encendido**, tocá guardar | Tiene que decir que **no se pudo**, jamás quedarse en silencio ni decir «guardado» |
| 🔴 **El fallo a MEDIAS:** si la devolución rebota, **el cupo y la recogida YA se guardaron** | Tiene que decirlo con esas palabras. *Un «no se pudo guardar» sobre algo guardado a medias te manda a re-hacer lo que ya está.* |

---

## §5 · LO QUE NO ES ALCANZABLE TODAVÍA, DICHO ACÁ Y NO DESCUBIERTO CAMINANDO

| qué | por qué |
|---|---|
| ✅ ~~Tu jornada del día~~ | **YA ESTÁ — `obtenerEstadiasDelDia` se publicó y la pantalla está montada.** Ver §3bis. *(Cuando escribí este guion no existía; entró una hora después.)* |
| 🔴 **Marcar «a bordo» y «entregado»** | Los cuatro wrappers de acción **no existen**, y las transiciones son eventos server que llegan **con el acta (⑤)**. La pantalla del día lo dice en su superficie en vez de dejarte buscando el botón. |
| 🔴 **El día sobrevendido** | La tarjeta existe y **no se puede provocar con el dedo**: hace falta una reserva pagada y después bajar el cupo. **Con cero reservas vivas, no hay cómo.** |
| ⚠️ **Que una familia te reserve** | El camino del dueño **está construido y no es alcanzable**: el flag `guarderia` de `country_config` está en **`false`** (medido, EC y CO). **Encenderlo es acto de mesa** y pide al menos una guardería con oferta publicada — o sea, **este gate primero.** |

---

## §6 · EL ORDEN QUE PROPONGO

1. **A mergea y publica el OTA.**
2. Confirmás el pie de Cuenta (`update …`, no `bundle embebido`).
3. Entrás con `guillo381+duenovet@gmail.com` → Negocio → Guardería.
4. Caminás §3 completo, incluido **salir y volver** y **guardar dos veces**.
5. Provocás los tres rebotes de §4.
6. **Si queda visible: decímelo.** Con una guardería publicada, encender el flag deja de abrir a una lista vacía — y ahí el recorrido del dueño se puede gatear también.
