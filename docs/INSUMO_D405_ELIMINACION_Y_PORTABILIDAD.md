# INSUMO_D405_ELIMINACION_Y_PORTABILIDAD.md — e-PetPlace

> **Nace:** 22-ago-2026, mesa 104 / S103, pista D · **Destino:** D-405 (la
> sesión de LEGALES) y el frente de Cuentas · **Hermano de:**
> `INSUMO_D405_PRIVACIDAD.md`, cuya forma sigue.
>
> **Qué es:** el contraste entre lo que **Apple, Google y la LOPDP exigen** sobre
> eliminación de cuenta y portabilidad, y **lo que la casa puede honrar hoy**,
> medido contra la base y el canon.
> **Qué no es:** una política, una espec, ni una decisión. **No decide nada que
> sea firma del founder ni criterio de abogado.** Donde hay que elegir, la fila
> dice quién elige.
>
> **Regla de precedencia:** si este insumo contradice al repo, a `POLITICAS`, a
> `MODELO_FINANCIERO` o a un relevamiento, **gana la fuente**.
>
> **Todo lo de la columna «hoy» se midió el 22-ago-2026** contra
> `zyltipqscdsdsxnjclhp` y contra el literal de los documentos. Lo que no se
> midió **se dice**.

---

## §0 · 🔴 DOS HALLAZGOS QUE CAMBIAN EL PUNTO DE PARTIDA

### ① El botón no podría ejecutar aunque estuviera cableado

**Medido: 62 claves foráneas apuntan a `auth.users`** — 21 `CASCADE`, 17 `SET
NULL`, 16 `NO ACTION`, **8 `RESTRICT`**.

**Las 8 `RESTRICT`, completas:** `bonos.user_id` · `compras.user_id` ·
`estadias.user_id` · `evento_bitacora_familia.user_id` ·
`prestador_empleados.user_id` · `programas_contratados.user_id` ·
`refugios.user_id` · `suscripciones_servicio.user_id`.

⇒ **Un `DELETE` sobre `auth.users` REBOTA hoy** para cualquier persona que haya
comprado algo, tenga un bono, una estadía, haya escrito en la bitácora de su
mascota o sea empleado de un prestador. *No es que el borrado esté mal
implementado: es que **el borrado duro es inexpresable** para el usuario típico.*

**Esto no es un defecto — es la regla 7.8 defendiéndose.** Pero significa que la
espec de P15 **no puede escribirse como «borrar»**: tiene que escribirse como
anonimizar + desactivar, o chocará contra ocho constraints el día que se
construya. **Es dato para quien redacte P15, no una decisión mía.**

### ② La regla 7.8 **no dice** «se anonimiza» — y esa es la mitad que falta

`INSUMO_D405_PRIVACIDAD` §2 fila 1 la cita así: *«la regla 7.8 (la plata no se
borra: **se anonimiza la referencia personal**)»*.

**El literal de `MODELO_FINANCIERO` §7.8, medido, dice ENTERO:**

> *«**No se borra.** Eventos, liquidaciones, cuentas comerciales, roles: nunca
> DELETE en producción. Usar estados.»*

**No menciona anonimización.** Y `grep -rn "anonimiz" docs/*.md` devuelve **cero
ocurrencias referidas a 7.8** — las que hay son de DaaS agregado, de visibilidad
de familia y de una nota en D-331.

> 🔴 **Por qué importa y no es prolijidad:** *«no se borra» a secas es
> **incompatible** con el derecho de supresión; «no se borra, pero se anonimiza
> la referencia personal» **sí es compatible** y es el argumento que una
> política puede sostener ante la autoridad.* La mitad que vuelve defendible a
> la regla **es la que no está escrita**, y todo el que la cita la da por
> escrita.

⇒ **Fila propia en el contraste (§3.7).** La enmienda de 7.8 es **firma del
founder**, no de esta pista.

---

## §1 · APPLE — Guideline 5.1.1(v)

Vigente desde el 30-jun-2022 y **en vigor hoy**.

| exige | detalle |
|---|---|
| **Iniciar la eliminación DENTRO de la app** | si la app permite crear cuenta, debe permitir iniciar el borrado in-app |
| **Fácil de encontrar** | no enterrado |
| **Borrar ≠ desactivar** | *«es insuficiente ofrecer sólo desactivar o suspender temporalmente: la persona debe poder eliminar la cuenta junto con sus datos personales»* |
| **Si termina en web** | link directo **a la página donde se completa**, no al home |
| **Sign in with Apple** | revocar tokens vía su REST API al borrar |
| **Excepción** | apps en **industrias altamente reguladas** pueden sumar flujos de atención al cliente **para confirmar y facilitar** el borrado |

> ⚠️ **La excepción NO es «no borrar».** Es *confirmar y facilitar* — un paso
> humano adicional, no una negativa. **Si alguien la va a invocar para el dato
> clínico, es criterio de abogado**: la pista sólo señala que la excepción está
> redactada como un «cómo», no como un «si».

## §2 · GOOGLE PLAY

| exige | detalle |
|---|---|
| **Doble vía** | in-app **Y** por un **recurso web** — *«must also allow users to request for their account to be deleted **in the app and through a web resource**»* |
| **URL en la ficha** | la **Data safety form** del Play Console pide un **link web** donde se solicite el borrado de la cuenta y sus datos |
| **Alcance** | cuenta **y datos asociados** |

> 🔴 **La URL web es lo que la casa no tiene, y no es de la app:** hoy **no hay
> sitio público con esa página** (el sitio es frente de la pista B, en esta misma
> mesa). *Sin esa URL, la ficha de Play no se puede completar — y eso bloquea la
> publicación, no la funcionalidad.*

## §3 · EL CONTRASTE — exigencia ↔ lo que la casa honra hoy

| # | exigencia | estado medido hoy | dueño |
|---|---|---|---|
| 1 | Iniciar borrado **in-app** | La UI de Cuenta muestra «Eliminar cuenta» con voz honesta y **NO ejecuta** (letra (a) founder S55). **`D-337` abierta** | **founder** (firma P15) → luego C construye |
| 2 | Borrar, **no sólo desactivar** | 🔴 **Hoy es inexpresable**: 8 FK `RESTRICT` rebotan el `DELETE` (§0.①). La única función de baja viva —`dar_de_baja_empleado`— **desactiva, no borra** (medido en su cuerpo) | **founder** (P15 debe escribirse como anonimizar, no como borrar) |
| 3 | **URL web** de solicitud (Google) | **No existe sitio público con esa página** | **B** (sitio) + D-405 (texto) |
| 4 | URL en la **Data safety form** | No completada | **founder** (Play Console) |
| 5 | Revocar tokens de **Sign in with Apple** | ⚪ **NO MEDIDO**: no verifiqué si la app ofrece Sign in with Apple. *Si lo ofrece, es requisito duro; si no, no aplica.* **Se mide antes de la ficha** | **C** (medir) |
| 6 | Borrar **los datos asociados** | 21 FK `CASCADE` se irían con la cuenta — entre ellas `profiles`, `tarjetas_guardadas`, `familia_miembro` y `mascota_codueño`. 🔴 **`familia_miembro` y `mascota_codueño` en CASCADE es exactamente el arrastre que P15 teme**: borrar al humano desengancha su vínculo con la mascota **sin preguntar por los otros cuidadores** | **founder** (P15 §1: destino de las mascotas) |
| 7 | Poder decir «anonimizamos lo que no podemos borrar» | 🔴 **La regla 7.8 no dice anonimizar** (§0.②). Cero función `anonimiz*` en la base | **founder** (enmienda de 7.8) |
| 8 | Plazo de respuesta | ⚪ **NO MEDIDO** — no encontré plazo declarado en el canon para responder una solicitud. **Es plazo legal: lo fija el abogado**, no esta pista | **D-405 (abogado)** |
| 9 | Portabilidad (§5) | No construida. Propuesta dentro de P15, sin firma | **founder** + D-405 |
| 10 | Qué pasa con lo que el prestador declaró (§6) | **Nadie lo escribió.** Medido: el evento sobrevive y **pierde a su autor** | **founder** (letra nueva) |

## §4 · LA PLATA — 7.8 y la conservación fiscal ecuatoriana

### Lo que la ley ecuatoriana obliga a conservar

**Siete años** para documentos contables y comprobantes, contados desde el 1 de
enero del año siguiente al vencimiento de la declaración — plazo que coincide
con el de caducidad de la facultad determinadora del SRI.

⇒ **Hay una obligación legal de conservar** que es **excepción legítima al
derecho de supresión**, y que la política puede declarar sin pedir permiso.

### Lo que la casa tiene hoy

| pieza | estado |
|---|---|
| Regla 7.8 «no se borra» | ✅ vigente y **coherente con los 7 años** |
| La palabra «anonimiza» | 🔴 **no existe en 7.8** (§0.②) |
| Mención de **SRI o conservación fiscal** en `MODELO_FINANCIERO` | 🔴 **CERO** — `grep` sin resultados |
| Plazo de retención escrito en algún lado | 🔴 **ninguno.** `INSUMO_D405_PRIVACIDAD` §2 fila 2 ya lo midió: cero purga, 14 crons y ninguno purga |

> 🔴 **El hueco no es conservar de más: es no poder decir POR QUÉ ni HASTA
> CUÁNDO.** «No se borra» sin plazo ni causa legal escrita es indefendible ante
> un titular que ejerce supresión; **«se conserva 7 años por obligación
> tributaria y después se anonimiza» es defendible** — y hoy la casa hace lo
> primero y podría decir lo segundo.
>
> **Los 7 años son dato de ley; el plazo que la casa adopte es criterio de
> abogado.** No lo fijo.

### Qué debe conservarse aunque el usuario pida borrado (candidatos medidos)

`eventos_economicos` · `pagos_intentos` · `compras` · `pedidos` ·
`liquidacion_pedidos` · los comprobantes emitidos. **La lista definitiva la fija
el contador con el abogado** — acá va lo que el modelo ya trata como plata.

⚠️ **`pagos_intentos` guarda `holder_name`, email, `bin` y `ultimos4`** (ya
medido por el censo CT de S102). *Ese es el dato personal que la conservación
fiscal arrastra, y el que la anonimización tendría que alcanzar sin romper la
reconciliación.* **Cómo se anonimiza sin perder trazabilidad contable es
decisión técnica + criterio contable, no de esta pista.**

## §5 · PORTABILIDAD — LOPDP

**Lo que exige:** que el titular reciba sus datos personales en un formato
**compatible, actualizado, estructurado, común, interoperable y de lectura
mecánica**, preservando sus características; o que se transmitan a otro
responsable **cuando sea técnicamente posible**, sin que el responsable pueda
aducir impedimento.

**Formato aceptable:** cualquiera que cumpla «estructurado + común + lectura
mecánica». **JSON y CSV lo cumplen; un PDF de texto NO** (no es lectura mecánica
en el sentido de la norma). *No elijo entre JSON y CSV: es decisión de producto.*

**Estado hoy:** ❌ no construida. Propuesta dentro de P15 (que es CANDIDATA).

> **Y una ventaja que conviene ver antes de presupuestarla:** el expediente ya
> vive como **eventos tipados con `datos jsonb`** en `eventos_mascota`. *La
> portabilidad no exige inventar un formato — exige exportar el que ya existe.*
> **Que sea barato es observación técnica; que se construya, decisión del
> founder.**

⚠️ **La norma dice que la Autoridad dictará la normativa para el ejercicio de
este derecho.** Si ya la dictó, **no lo verifiqué** — es verificación de
abogado, y lo declaro en vez de suponer que no existe.

## §6 · 🔴 EL CASO DEL PRESTADOR — nadie lo escribió, y la base ya decidió

**La pregunta del founder:** si el prestador se va, ¿qué pasa con las notas
clínicas que él declaró? *Son del expediente de la mascota, no suyas.*

### Lo que la base hace hoy, medido

| pieza | `ON DELETE` | efecto |
|---|---|---|
| `eventos_mascota.prestador_id` | **SET NULL** | el evento **sobrevive** y **pierde a su autor** |
| `eventos_mascota.empleado_id` | **SET NULL** | ídem con la persona |
| `evento_historia_clinica_registrada.prestador_id` | **RESTRICT** | 🔴 **bloquea el borrado del prestador** |
| `caso_clinico.empleado_tratante_id` (→ `auth.users`) | SET NULL | el caso sobrevive, pierde al tratante |
| `dar_de_baja_empleado` | — | **DESACTIVA, no borra** (medido en el cuerpo) ⇒ hoy la autoría **se conserva** |

**Procedencia viva:** `declarado_por_familia` **89** · `declarado_por_prestador`
**12**. *Doce eventos del expediente tienen hoy a un prestador como autor
declarado.*

### 🔴 La contradicción medida — la misma autoría, atada de dos formas opuestas

**El padre suelta y la hija bloquea:** `eventos_mascota.prestador_id` es **SET
NULL** y `evento_historia_clinica_registrada.prestador_id` es **RESTRICT**.

En la práctica **gana el RESTRICT** (nada se borra, y está bien). Pero:

> *El día que alguien «uniforme» ese RESTRICT a SET NULL por consistencia —que
> es exactamente lo que parece correcto mirando la tabla de al lado— **el
> expediente clínico pierde de quién vino cada dato, en silencio y sin fallar.**
> Y la procedencia es lo que separa `declarado_por_prestador` de
> `declarado_por_familia`: sin autor, un diagnóstico de veterinario y una
> observación de la familia **quedan indistinguibles**.*

⇒ **Es candidato a fila propia con número.** No la abro: **numerar deudas es de
A.**

### Las tres preguntas que la letra tendrá que contestar — servidas, no resueltas

1. **¿La nota clínica es del expediente o del prestador?** El modelo ya
   respondió de hecho: **vive en `eventos_mascota`, colgada de la MASCOTA**, y
   el prestador es un atributo. *La letra tendría que ratificar lo que la base
   ya hace, o corregirlo.*
2. **Si el prestador ejerce supresión, ¿su NOMBRE puede desaparecer de una nota
   clínica que otro profesional va a leer?** Tensión real entre el derecho del
   prestador y la **integridad del expediente** — y hay un tercero, la familia,
   que no es parte del conflicto y sufre el resultado. **Criterio de abogado.**
3. **¿La firma profesional cuenta como dato personal suprimible, o como acto
   profesional con valor probatorio?** *Un certificado de salud sin veterinario
   identificable no vale como certificado.* **Criterio de abogado**, y `P23` ya
   marcó el precedente de que **la respuesta honesta describe lo que el sistema
   hace, no lo que suena mejor.**

> **Nota de alcance:** el prestador es **titular de datos** igual que el dueño.
> Este insumo mide su caso porque nadie lo había escrito — **no propone
> resolverlo aquí.**

## §7 · LO QUE ESTE INSUMO NO HACE

No redacta política ni T&C · **no fija plazos de retención** (los 7 años son ley
citada; el plazo que la casa adopte es del abogado) · no elige formato de
portabilidad · no decide si el nombre del prestador es suprimible · no abre
deudas con número · no promete nada a usuarios · **no se publica**.

**Y lo que declaro no haber medido**, en vez de darlo por resuelto: si la app
ofrece Sign in with Apple (§3.5) · si la Autoridad ecuatoriana ya dictó la
normativa de portabilidad (§5) · el plazo de respuesta a solicitudes (§3.8).

---

## Fuentes

- [Apple · Account deletion within apps required starting January 31](https://developer.apple.com/news/?id=mdkbobfo)
- [Apple · Account deletion requirement starts June 30](https://developer.apple.com/news/?id=12m75xbj)
- [Apple · Account deletion within apps — Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/?id=06302022b)
- [Google Play Console Help · Understanding Google Play's app account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Google Play Developer Community · About the Data Safety Form and Account Deletion](https://support.google.com/googleplay/android-developer/community-guide/246344978/about-the-data-safety-form-and-account-deletion?hl=en)
- [LOPDP Ecuador · texto de la ley (CPCCS)](https://www.cpccs.gob.ec/wp-content/uploads/2025/07/LEY-ORGANICA-DE-PROTECCION-DE-DATOS.pdf)
- [Lexis · Derechos de los titulares de datos personales](https://www.lexis.com.ec/blog/derechos-humanos/derechos-de-los-titulares-de-los-datos-personales-una-guia-rapida-para-su-ejercicio)
- [Código Tributario del Ecuador (texto)](https://www.ces.gob.ec/lotaip/2018/Agosto/Anexos-literal-a2/CODIGO%20TRIBUTARIO.pdf)
- [Conservación de comprobantes: 7 años](https://ciro.com.ec/blog/obligacion-conservacion-comprobantes-7-anos/)
- [Normas para llevar contabilidad y conservación de registros](https://tcaudit.com.ec/normas-para-llevar-contabilidad-y-de-conservacion-de-los-registros/)

> ⚠️ **Las fuentes secundarias (blogs contables) se citan como orientación, no
> como norma.** El plazo de 7 años debe confirmarse contra el articulado por el
> contador o el abogado — *un insumo pre-legal no reemplaza la lectura del
> Código.*
