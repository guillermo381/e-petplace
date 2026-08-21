# S102-B · CAPÍTULO DE RETENCIÓN DE DATOS DE PAGO — INSUMO PARA LA v3.0 y para D-405

> **🔴 ESTATUTO: BORRADOR DE INSUMO. NO ES LETRA Y NO RIGE.**
>
> **Y lo más importante de este archivo es lo que NO tiene: CERO PLAZOS.**
> Cada número que haría falta está como **`⟨A FIRMAR⟩`** con su pregunta
> formulada y su dueño. *Un capítulo de retención con plazos inventados por la
> pista sería peor que no tenerlo: le daría a la casa un número que nadie firmó
> y que todos citarían.*
>
> **Destino declarado por la orden:** capítulo de la **letra v3.0** (que escribe
> A — `docs/` es su territorio) **+ insumo a `D-405`**, la sesión de legales.
> *La v3.0 fija la forma; el PLAZO sale de D-405, que es donde vive el abogado.*

---

## ⓪ · POR QUÉ ESTE CAPÍTULO EXISTE, EN UNA LÍNEA MEDIDA

**El dato personal del pago no se borra nunca**, y no por decisión:

```
jobs de cron totales                                     14
… que purgan payloads de pago                             0
funciones con DELETE FROM webhook_events / pagos_eventos  0
```

> **No es una retención larga: es la AUSENCIA de política.** *Una retención
> larga se defiende con un argumento; una ausencia solo se explica.*

**Y no es la primera vez que esta letra falta: `D-732` y `D-733` llevan
BLOQUEADAS desde S92-BIS por exactamente el mismo hueco.** La casa ya midió
entonces que *«la ventana de gracia del barredor no es un número técnico que se
elige: es el plazo de retención con otro nombre»*.

⇒ **Tercer acreedor de la misma letra faltante.** *Una deuda de letra que
acumula acreedores deja de ser una deuda de letra y pasa a ser un cuello de
botella.*

---

## §1 · QUÉ DATO ES — el inventario exacto, medido y no supuesto

**Se midió por NOMBRE DE CLAVE. Cero valores se leyeron, se citaron o se
resumieron.**

| dónde | columna | filas (21-ago) | qué contiene |
|---|---|---|---|
| `pagos_intentos` | `payload_crudo` | 41 | `card.holder_name` · `user.email` · `card.bin` · últimos 4 · `expiry_month` · `expiry_year` · `card.token` |
| `pagos_eventos` | `payload` | 38 | idem |
| `webhook_events` | `payload` | 60 | `card.holder_name` · `user.email` · `card.bin` · últimos 4 · `stoken` |

**Y además, en columnas propias de `pagos_intentos`** (fuera del crudo):
`marca` · `bin` · `ultimos4` · `authorization_code` · `proveedor_transaction_id`.

### ✅ LO QUE **NO** HAY — resultado medido, no supuesto

- **CERO PAN.** `card.number` mide **4 caracteres en las 94 filas**, solo
  dígitos, **cero con forma de PAN (13-19)**. *La clave se llama `number` y eso
  es una trampa de lectura.*
- **CERO CVV/CVC** en ninguna clave de ninguna de las tres tablas.

> **Esto acota el capítulo y hay que decirlo en la puerta: no estamos ante datos
> de tarjeta completos.** El conjunto real es **nombre del titular + correo +
> BIN + últimos 4 + vencimiento**. *Por separado, poco. Juntos, identifican a
> una persona y a su medio de pago.*

---

## §2 · LAS CUATRO PREGUNTAS QUE ESTE CAPÍTULO NO PUEDE CONTESTAR SOLO

**Ninguna es técnica. Las cuatro tienen dueño fuera de las pistas.**

| # | Pregunta | Dueño | Por qué no la contesta una pista |
|---|---|---|---|
| **1** | **¿Cuánto tiempo exige CONSERVAR Nuvei / la certificación?** ⟨A FIRMAR⟩ | **founder + Erick (Nuvei)** | Es un requisito de contraparte. **Un plazo que borre antes de lo que el proveedor exige nos deja sin poder responder una contracargo.** |
| **2** | **¿Cuánto exige conservar el SRI / la ley ecuatoriana** para respaldo de transacción? ⟨A FIRMAR⟩ | **contador + abogado (D-405)** | Materia fiscal. *Es el mismo dueño que ya tiene abierta la pregunta 3 de `LETRA_SALDO` §8.* |
| **3** | **¿Cuánto tiempo se puede conservar sin consentimiento**, bajo la ley de protección de datos de EC? ⟨A FIRMAR⟩ | **abogado (D-405)** | Es el techo. **Las preguntas 1 y 2 dan un piso; ésta da el techo, y si el piso supera al techo hay que resolverlo con el abogado, no con un `DELETE`.** |
| **4** | **¿Qué se borra y qué se ANONIMIZA?** ⟨A FIRMAR⟩ | **founder** | *Borrar la fila entera destruye la trazabilidad contable; anonimizar el `holder_name` y el `email` la conserva.* **Son dos políticas distintas y solo una necesita que exista el evento económico.** |

> **🔴 EL ORDEN IMPORTA Y NO ES OBVIO:** la pregunta **4 se contesta primero**.
> Si la respuesta es *anonimizar*, las preguntas 1 y 2 pierden casi toda su
> tensión —el respaldo contable sobrevive sin el dato personal— y el capítulo se
> vuelve mucho más barato de escribir. *Se dice acá porque la secuencia natural
> (plazo → qué hacer) es la cara.*

### 📌 PRE-CARGA DE LA PREGUNTA 4 — LA REGLA 7.8 YA EMPUJA EN UN SENTIDO

**`MODELO_FINANCIERO` §7.8 «Cómo se borra algo», literal:**

> **No se borra.** Eventos, liquidaciones, cuentas comerciales, roles: nunca
> DELETE en producción. Usar estados.

⇒ **Para el lado financiero la casa ya decidió, y decidió que NO se borra.** Eso
**pre-carga la pregunta 4 hacia ANONIMIZAR**: si la fila del pago no puede
desaparecer, la única forma de honrar un derecho de supresión es **quitarle el
dato personal y conservar el respaldo**.

> ### ⚠️ PERO LA 7.8 NO ALCANZA SOLA, Y HAY QUE DECIR POR QUÉ — medido contra el literal
>
> **① Su alcance NO nombra estas tablas.** Dice *«eventos, liquidaciones,
> cuentas comerciales, roles»*. **`pagos_intentos`, `pagos_eventos` y
> `webhook_events` no están en esa lista.** *Extender una regla por parecido es
> exactamente cómo `cuenta_comercial_id` entró a una lista de veredictos por
> vecindad y rompió ocho policies (S91).* **Si la 7.8 va a cubrirlas, se
> ENSANCHA con firma; no se asume.**
>
> **② La 7.8 dice «usar estados», NO dice «anonimizar».** *Son dos cosas
> distintas: un estado marca la fila como inactiva y **el `holder_name` sigue
> ahí**.* **La anonimización es una operación que la 7.8 no describe** y que
> esta letra tendría que definir: qué campos se vacían, con qué se reemplazan, y
> **cómo se prueba que se hizo**.
>
> 🔴 **Y por eso se anota acá:** el insumo de D-405 (`docs/INSUMO_D405_PRIVACIDAD.md`,
> fila 1) resume la 7.8 como *«la plata no se borra: se anonimiza la referencia
> personal»*. **La segunda mitad de esa frase NO está en el literal de §7.8.**
> *El insumo se depositó VERBATIM por orden de mesa y no se edita; la
> divergencia se declara acá, que es donde se va a construir.* **Y su propia
> regla de precedencia lo resuelve: «si este insumo contradice al repo, gana la
> fuente».**

---

## §3 · LA FORMA QUE EL CAPÍTULO DEBERÍA TENER — esto sí es propuesta de pista

**Nada de acá necesita firma para discutirse; todo necesita firma para regir.**

### 3.1 · La retención se declara POR CLASE DE DATO, no por tabla

*Tres tablas guardan el mismo conjunto. Escribir tres plazos garantiza que
diverjan.* **Una clase: «dato personal de medio de pago». Un plazo. Tres
ejecutores.**

### 3.2 · El borrado es un ACTO REGISTRADO, jamás un `DELETE` silencioso

**Precedente de la casa, ya construido y probado:** la cola de borrado de
`D-731` —trigger que **encola** + `barrer-storage` con cron y secreto
compartido, con **FK a `storage.buckets` que vuelve inexpresable la intención
imposible** (L-222). **La misma forma sirve acá** y evita el modo de falla que
S92-BIS midió: *un barredor que marca `borrado` algo que jamás pudo ejecutar.*

### 3.3 · 🔴 LO QUE SE BORRA TIENE QUE PODER PROBARSE BORRADO

**`P23` de `POLITICAS` ya fijó la voz honesta**, y rige acá igual: ante un
derecho de supresión la respuesta es *«ya no es accesible por ningún medio del
producto»*, **jamás «fue destruido»** — salvo que se construya la prueba.

### 3.4 · El plazo vive en un CATÁLOGO, jamás en el código del barredor

*Un plazo hardcodeado en la función que barre es un plazo que solo cambia con
una migración, y que nadie puede auditar sin leer PL/pgSQL.* **Parámetro con
vigencia, del mismo modo que `fee_configs`** — que además ya tiene su historial
auditado por trigger y es el precedente vivo de la casa.

### 3.5 · La conservación tiene que sobrevivir al borrado de la cuenta

**Hueco declarado, sin resolver:** si una persona ejerce derecho de supresión y
sus payloads de pago están bajo retención obligatoria por las preguntas 1 y 2,
**las dos obligaciones chocan.** *La salida habitual es anonimizar y conservar
el respaldo; la decide el abogado, no la pista.* **Cruza con `D-337`** (eliminar
cuenta, requisito de tiendas).

---

## §4 · LO QUE **NO** VA EN ESTE CAPÍTULO, para que nadie lo meta

- **Un plazo.** *Ninguno. Ni «90 días» ni «7 años» ni «lo que diga el
  proveedor».* **⟨A FIRMAR⟩ es literal.**
- **Los datos de la mascota o del expediente clínico.** Otra clase, otro dueño,
  otro plazo. **Mezclarlos vuelve inauditables a los dos** — es el mismo
  argumento con el que `LETRA_SALDO` §3 prohíbe que el saldo nazca de una
  promoción.
- **Los documentos de identidad de `D-732`/`D-733`.** *Comparten la letra
  faltante y NO comparten el plazo:* un documento de identidad y un respaldo de
  transacción tienen obligaciones distintas. **El capítulo puede nacer del mismo
  acto de mesa; los números son dos.**

---

## §5 · LO QUE ESTE INSUMO **NO** MIDIÓ — declarado

1. **No se leyó ningún log emitido** de las edge functions de pago (se auditó
   qué escriben leyendo el código; en el panel no se entró). **Si los payloads
   quedan además en logs de plataforma, la retención de ESOS logs es una quinta
   pregunta y no está formulada.**
2. **No se midió la retención del lado de Nuvei** — qué conserva el proveedor y
   por cuánto. *Es parte de la pregunta 1 y la contesta Erick.*
3. **No se midió si hay backups con esos payloads adentro.** **Los backups de
   Supabase son FÍSICOS y no cubren Storage** (medido S94-PERF, `D-742`) ⇒
   **un borrado en caliente no alcanza a las copias**, y eso cambia qué se puede
   prometer. *Se nombra porque es el error clásico de un capítulo de retención:
   prometer supresión y tener el dato en una copia.*
