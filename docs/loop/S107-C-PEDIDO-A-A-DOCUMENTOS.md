> ☠️ **CUMPLIDO — verificado contra el objeto el 29-ago.** A lo publicó y C lo consume. **Se conserva como registro; NO es un pedido vivo.**

# S107-C → A · PEDIDO AUTOCONTENIDO — dos huecos de ⑤, leídos desde el consumidor

> **Qué es:** el contrato `s107-contrato-documentos-y-actas` leído **como quien va a montar la pantalla**. Está bien y es completo en lo suyo; **estos dos huecos aparecen recién al preguntarse «¿con qué dibujo el formulario?» y «¿por dónde se deshace?»**.
> **Cuándo sirve:** **ahora, antes de que A escriba los wrappers** — después cuesta una migración y un cambio de firma.
> **Lo que NO es:** una objeción al contrato. Ninguno de los dos cambia una decisión: los dos piden que algo ya decidido tenga puerta.

---

## 🔴 ① EL CONTRATO LE ORDENA A C ALGO QUE NO TIENE CÓMO HACERSE

§② dice, literal y dirigido a C:

> *«**Para C:** si el dueño lo apaga después, **se apaga y punto** — no hay diálogo de confirmación que lo desanime. *Un consentimiento que cuesta más retirar que dar no es un consentimiento.*»*

**Estoy de acuerdo, y no puedo cumplirlo:** el único escritor de `guarderia_autorizaciones_familia` es **`aceptarDocumentosGuarderia({ familiaId, aceptaciones[], autorizaciones })`**, y llamarlo para apagar el toggle de redes **vuelve a registrar una aceptación de documentos** — con su fecha nueva, sobre documentos que la familia ya había aceptado.

> ### Retirar un consentimiento no puede exigir volver a dar otro. Y en la prueba, una fila de aceptación con fecha de hoy sobre un documento aceptado en marzo **corrompe la respuesta a la única pregunta que importa: qué aceptó esta familia y cuándo.**

**Lo que se pide — una puerta angosta, no un motor:**

```
actualizarAutorizacionesGuarderia({
  familiaId, urgenciaTopeMonto?, urgenciaTopeMoneda?,
  contactos?, contactoAlternativo?, redesAutorizadas?
})
```
Escribe **sólo** `guarderia_autorizaciones_familia` (y su `actualizado_en`). **No toca `guarderia_aceptaciones`.** Con eso, apagar redes es un toggle y nada más — que es lo que §② manda.

⚠️ **Y sirve para más que redes:** el tope de urgencia y la cadena de contactos **envejecen** — cambia un teléfono, se muda un contacto. Hoy tampoco tienen camino de edición.

---

## 🔴 ② `contactos` ES `jsonb`, Y CON ESO NO SE DIBUJA UN FORMULARIO

§② declara:

```
contactos            jsonb NOT NULL   -- la cadena, en orden
contacto_alternativo jsonb            -- nullable: puede no haber
```

**`jsonb` es el tipo de la columna, no el contrato del dato.** C tiene que pedirle a una familia *nombre y teléfono* de cada contacto, en orden, y **hoy no sabe qué campos escribir ni cómo se llaman.** Si lo invento, A valida contra otra forma y el rebote aparece recién en el aparato.

**Lo que se pide: la forma, en el contrato y en el tipo del wrapper.** Propuesta mínima, para aceptar o corregir:

```ts
type ContactoGuarderia = { nombre: string; telefono: string };
contactos: ContactoGuarderia[];              // en orden, al menos 1
contactoAlternativo: ContactoGuarderia | null;
```

🔴 **Y `contacto_alternativo` merece más cuidado que el resto, porque no es un dato de comodidad:** el propio contrato lo llama *«la prohibición 5 del criterio §3 hecha columna»* — es **quién puede recibir al animal en la puerta**. Si su forma queda difusa, **la pantalla del acta no puede mostrarlo bien**, y ahí es donde se usa.

**Pregunta que va con esto, y es de mesa, no de código:** ¿el contacto alternativo se identifica sólo por nombre y teléfono, o tiene que ser **una persona de la familia ya registrada**? *Lo primero es más simple; lo segundo es lo que hace verificable la prohibición 5.* **No lo decido yo.**

---

## LO QUE C VA A HACER CUANDO ESTO LLEGUE — para que A sepa contra qué se consume

`guarderia/documentos.tsx`: lee `obtenerDocumentosGuarderia()`, monta **`AceptacionDeDocumentos`** (la pieza de la casa, la misma que el prestador usa desde `D-645`) con los seis códigos como **obligatorios** y **redes como el único opcional, apagado**; los datos de urgencia y la cadena de contactos en el mismo paso; y guarda con `aceptarDocumentosGuarderia` **en una sola transacción**, como el contrato pide.

**El tercer estado se respeta tal cual está escrito:** con `documentos_no_disponibles` la pantalla dice *«estamos terminando de preparar este servicio»* y **jamás inventa un texto para poder seguir**.

⚠️ **Un detalle chico de wrapper:** cuando ⑤ agregue su condición a `_guarderia_puede_reservar`, **`reservarDiaGuarderia` va a poder rebotar por documentos y su unión de errores hoy no lo contempla** (`MENSAJES` no tiene `documentos_no_disponibles` ni `documentos_no_aceptados`). **Si el código nuevo no entra a esa lista, cae en `error_desconocido` y la familia lee «ocurrió un error inesperado» donde debería leer qué falta.**

---

## POR QUÉ NO HAY MITAD INERTE ADJUNTA

La mesa ofreció que adelantara la mitad inerte de esta pantalla. **Medido: no hay mitad que valga.** La pantalla es **glue delgado sobre tres wrappers que no existen** —`obtenerDocumentosGuarderia`, `aceptarDocumentosGuarderia`, `evaluarDocumentosGuarderia`—; sin ellos **no compila**, y hacerla compilar exigiría **inventar los tipos**, que es fabricar un contrato paralelo al publicado.

> **Lo que sí valía era leer el contrato como consumidor antes de que A lo construya, y eso es este documento.** *Los dos huecos de arriba cuestan un renglón hoy y una migración con cambio de firma la semana que viene.*
