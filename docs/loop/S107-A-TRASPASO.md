# S107-A · ACTA DE CIERRE — el flujo de guardería, de punta a punta

> ## ⚠️ ESTA ES LA ÚNICA VIGENTE. Reemplaza a `S107-A-TRASPASO-2.md`.
> El acta de la mañana quedó vencida a las pocas tandas, **y su propia
> advertencia —«la cola que circulaba estaba VENCIDA»— se cobró dos veces.**
> *Un acta que envejece sin decirlo es peor que ninguna: se lee con la
> confianza de un documento y el contenido de un recuerdo.*
>
> **Todo lo de acá está MEDIDO CONTRA EL OBJETO al cerrar, no contra memoria.**

---

## ① EL ESTADO, medido

| | |
|---|---|
| **`main`** | **`0c1fd410`** — local = origin **por SHA** |
| árbol | **limpio** (se borró un `app.json` stub que `eas-cli` deja en la raíz) |
| migraciones | **523 locales** · **49 de S107-A**, todas con reversa escrita ANTES |
| reversas | **54** en `docs/relevamientos/S107-A-REVERSA-*.sql` |
| contratos publicados | **12** en `docs/contratos/s107-*.md` |
| typechecks | **4 en 0** (`api` · `ui` · `cliente` · `prestador`) |
| `verify:diseno` | **VERDE con 62 reglas** (nacen **R70** y **R71**) |

### El último OTA de cada app — leído con `update:list`, no del texto del publish

| app | group | runtime | ancla |
|---|---|---|---|
| **cliente** | `093bf680-c241-4cfc-ad11-2ba17c6c90e6` | 1.0.6 | `6f31e28e` |
| **prestador** | `49b36ea1-16d6-4495-90e1-228a3a96fc4b` | 1.0.7 | `6f31e28e` |

⚠️ **Lo posterior al ancla es SÓLO documentación y SQL** — cero archivos de
`apps/` o `packages/`, así que **no hay OTA pendiente**.

🔑 **Las dos notas de `--binario-local` dicen cosas distintas A PROPÓSITO:**
**prestador = MEDICIÓN** (por USB, 29-ago, con `medir-apk-instalado.mjs`) ·
**cliente = DECLARACIÓN del founder** — el instrumento salió **NO CONCLUYENTE**
por falta de aparato. *Un instrumento que no pudo medir no dice «está bien».*

---

## ② LO QUE QUEDÓ CONSTRUIDO

**El flujo entero, y el founder lo caminó.** Las **tres modalidades vivas**:
día suelto · paquete · mensualidad.

**El motor:** filtro por modalidad · **la tira que dice su estado sin que la
toquen**, en dos formas —por prestador y **agregada sobre todos los lugares**
(un día sirve si algún lugar puede)— · el paquete contra saldo · **un día por
mascota** (índice + guard hablado en las dos puertas) · **la compuerta de
documentos en las CUATRO puertas** · **los seis documentos redactados y
sembrados** (v1 → v2 → v3 del protocolo) · el **acto único** de aceptación ·
**la dirección de recogida elegible** en las tres puertas, y **en el mandato**
para la mensualidad · el **origen de la estadía** (`bonoId`) · el **lector de
espacios** (la capacidad se puede leer) · la **autorización de imagen** con su
lector y su **puerta propia** · **`ya_tienes_plan_activo`** llevando al plan ·
el **lector de planes**.

**Y el motor de pagos ganó una cura que no era de guardería:** el actuador
**nombra y marca** el sujeto que no sabe mover, y **dejó de decir `ok: true`
sobre plata que no se aplicó** (§④).

---

## ③ LO QUE NO SE HIZO, y por qué — sin maquillar

- **EL COBRO REAL: frenado por ALCANCE, no por dudas.** Sigue firmado que va a
  ser real. Su plan espera en **`docs/PLAN_S108_COBRO_REAL_GUARDERIA.md`** con
  **tres decisiones ya firmadas adentro**.
- **El gate sanitario sigue APAGADO** — informativo, por diseño. Se enciende
  **antes de la salida real** (`D-968`, hoy **precondición ⑦** de
  `DEFINICION_SOFTLAUNCH` §3.5).
- **La revisión legal de los seis textos** no ocurrió (`D-979`) — **firmada sin
  apuro**: no hay familias reales.
- **La rama DeUna del actuador quedó NO EJERCIDA y declarada** (exige una
  consulta verificada; fabricarla sería simular el veredicto que esa consulta
  existe para dar).

---

## ④ LAS DEUDAS Y FICHAS DE LA SESIÓN, con dueño y disparo

### De las pistas

| ficha | qué | dueño · disparo |
|---|---|---|
| **`D-967`** ☠️🟠 | `MAPA_NATIVO_DISPONIBLE` afirmaba sobre **un** aparato. **Curada en el prestador; la mitad del cliente sigue abierta** — la sonda se porta **inerte** y se enciende cuando exista binario | quien toque el cliente |
| **`D-968`** 🔴 | **el gate sanitario se ENCIENDE ANTES DE LA SALIDA REAL.** Hoy apagado, informativo | founder · **precondición ⑦ del soft launch**, no ficha suelta |
| **`D-970`** | el `DEFAULT 0` de precio: un cero que se lee como «gratis» y no como «sin declarar» | quien toque la oferta |
| **`D-972`** | — | ver su ficha |
| **`D-973`** ☠️ | cerrada sin cambio, con su razón escrita | — |
| **`D-976`** 🔴 | **trasplantar un criterio correcto a una pregunta que no es la suya** (`min/max` de franjas) | quien reuse una fórmula de otra función |
| **`D-977`** ☠️ | los seis documentos no existían — **cerrada**: redactados y sembrados | — |
| **`D-978`** 🟡 | **42 arneses eligen su clave por el rótulo de la variable.** Curado en la fuente (`claveAnonDeEnv`), **faltan 41** | cada pista al tocar su arnés |
| **`D-979`** 🔴🕐 | **la revisión legal de los seis textos.** **Sin apuro por firma** — no hay familias reales | founder · antes de abrir |
| **`D-980`** ☠️ | el escritor sin lector (`capacidad_por_dia`) — **cerrada**. ⚠️ *la CLASE queda abierta: no se censó fuera de guardería* | al tocar cualquier configurador |
| **`D-981`** 🟡 | **las direcciones son de la PERSONA, no del hogar** — frenado **por firma**, no por olvido. *Si la mamá guardó la dirección y el papá reserva, él agrega la suya* | founder · mesa de privacidad propia |
| **`D-982`** 🟡 | **dos orquestaciones de dirección vivas** — despensa no migró a la pieza que salió de su diseño | **C, en tanda PROPIA** (firma: no de paso) |
| **`D-983`** 🟢 | la autorización de imagen: **dónde vive y por qué no vuelve**. Motor construido; la superficie ya se montó | — |
| **`D-539`** 🟠 | **re-medida:** el alcance estaba bien fichado, **el tamaño no** — **814 entradas en español fijo**, y **guardería sola aporta 79 nacidas en S107** ⇒ pasa de *«cuando alguien abra la app en inglés»* a **«antes del próximo oficio»** | — |
| **`D-867`** 🔒 | **sale de la cola de A** — el founder lo ve con Nuvei. Enmendada con el mecanismo medido: *la causa del rechazo llega y se pierde aplanada a prosa* | founder |
| **`D-886`** | heredada, sin tocar | — |

### Lecciones y reglas

| | |
|---|---|
| **`L-437`** | un censo por regex mide **la forma que mira**, no el motor |
| **`L-438`** | **un arnés que prepara la precondición de una compuerta no puede descubrir que la compuerta no existe** |
| **`L-439`** | **declarar un atajo no lo hace seguro** — con su corolario: *un atajo que puede producir un valor equivocado no se declara, se hace inexpresable* |
| **`R70`** | un path SVG no va en posición de texto |
| **`R71`** | **un wrapper que no se exporta es un motor sin puerta.** Baseline 1, DURA en 1 |

### 🔑 LO QUE ES DEL FOUNDER Y DE NINGUNA PISTA

1. **Las TRES CLAVES de `app_config`** que encienden el cobro recurrente. **Van
   últimas.** El mandato ya tiene todo lo que el reloj necesita: medio de pago,
   monto esperado y **dirección**.
2. **El compromiso de las 48 HORAS de revocación.** El texto firmado promete
   *«escribinos a privacidad@epetplace.com y en menos de 48 horas quedará
   revocada»*. De las cuatro cosas que necesita —la casilla existe · alguien la
   lee · la revocación se ejecuta · el plazo se mide— **la única resuelta es el
   motor, que es la más barata.** 🔴 **Su modo de falla es silencioso:** nadie
   se entera hasta que alguien escribe y no le contestan.
   *(Detalle en `docs/loop/S107-C-COMPROMISO-OPERATIVO-REVOCACION.md`.)*
3. **El candidato a primera guardería real.** Todo corre hoy sobre un lugar de
   prueba.
4. **Las preguntas al CONTADOR**, ahora con una más: **¿el paquete de días
   emite comprobante, y tributa igual que un día suelto?** *No se votó porque
   es criterio fiscal y no estaba medido.*

---

## ⑤ LO QUE ESTA SESIÓN APRENDIÓ

**① EL DATO VENCIDO SE LEE CON LA CONFIANZA DE UN DOCUMENTO.**
El acta de la mañana **advertía que su cola estaba vencida** — y la advertencia
**se cobró dos veces igual**. *Una nota que dice «esto puede estar viejo» no
protege a nadie: el que la lee ya decidió confiar cuando llegó a la nota.*
⇒ Por eso este acta **reemplaza** a la anterior en vez de enmendarla.

**② MEDIR LA PROPIA RAMA Y LLAMARLO «EL ESTADO».**
Tres cobros en una sesión: A midió a C contra `origin/pista/s107-c` y le dio
**cero** porque el trabajo vivía sin pushear · `R66` sacó un baseline de un
worktree sin mergear · y una ficha llegó al canon diciendo *«la pantalla ya no
lo manda»* cuando en `main` **sí lo mandaba**.
> **Una afirmación verdadera para el autor entra al canon como falsa para todos
> los demás. El canon se mide contra `main`, jamás contra el árbol de quien
> escribe.**

**③ UN GUARD QUE VIVE EN UN ÍNDICE SÓLO SABE NEGARSE (`L-424`, tres veces).**
El día por mascota, el plan activo, y el índice del plan que además bloqueaba
dos canceladas. **Cada vez, el costo lo paga alguien leyendo un mensaje de
Postgres.** ⇒ La forma que funciona son **dos capas**: el índice, que **no se
puede saltear**, y el guard tipado, que **explica**.

**④ UN CRITERIO CORRECTO TRASPLANTADO A OTRA PREGUNTA (`D-976`).**
*Y es más peligroso que inventarlo, porque viene con la autoridad de haber
funcionado en otro lado.* Su hermana del mismo día: **el reuso se justifica por
la pregunta, no por el precedente.**

**⑤ UN CENSO POR PATRÓN ACOTA, NO CIERRA (`L-437`).**
Un censo dio **0 con dos códigos vivos**; un cinturón dio **0 legítimas cuando
había 6**; una sonda rebotó por un CHECK que no era el que medía. **Las tres
veces el rojo o el verde era del INSTRUMENTO**, y la única razón por la que se
vieron es que los brazos exigían **un número exacto o un motivo específico**, no
«rebotó».

**⑥ EL ATAJO DECLARADO ROMPE IGUAL (`L-439`).**
La capacidad derivada del cupo del día **tenía su nota diciendo que no era el
modelo final** — y **bajaba la capacidad del negocio dos de cada siete días,
sin error y sin aviso**.
> **Una limitación escrita en el código protege a quien toca el archivo, no a
> quien usa la pantalla.**

**⑦ Y LA QUE ORDENA A TODAS, porque apareció seis veces:**
> ### El censo casi siempre encuentra una SEGUNDA puerta al mismo defecto.
> La compuerta de documentos faltaba en **dos** puertas, no una · el día
> repetido pasaba también por el **día suelto**, que **cobra aparte** · los
> exports faltantes eran **siete**, no dos · el `ok:true` eran **ocho**, no
> siete · el índice del plan bloqueaba también **dos canceladas** · y la
> autorización de imagen, usada como interruptor, **firmaba contratos que la
> familia no leyó**.
>
> **Curar el síntoma reportado y no censar la clase es media cura — y la otra
> mitad se descubre con plata de por medio.**
