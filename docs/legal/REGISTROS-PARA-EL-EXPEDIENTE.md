# Registros para el expediente — retención, borrado y transferencia internacional

> **Para:** el abogado · **De:** el equipo técnico · **24-ago-2026.**
> Los cuatro registros que el expediente pidió. **Todo lo que dice «medido» se
> consultó contra el sistema real**; lo que no se pudo verificar se declara como
> tal en vez de darse por hecho.

---

## 1 · Constancia del borrado de las 64 imágenes

| | |
|---|---|
| **Qué se borró** | 64 imágenes del almacenamiento privado `prestador-documentos` |
| **Naturaleza** | **Material de prueba, no documentos reales.** Confirmado por el founder y corroborado por el contenido: una de las filas asociadas se titula literalmente *«Título de prueba S97 (siembra)»* |
| **Fecha y hora** | **24-ago-2026, 03:35 UTC** (primer borrado ejecutado) |
| **Quién lo ejecutó** | El proceso automático de barrido de la plataforma (`barrer-storage`), **por orden del founder**, encolado por el equipo técnico |
| **Cómo se verificó** | **Encoladas 64 · borradas 64 · pendientes 0 · objetos restantes en el almacenamiento: 0** |

**Nota de método, y es deliberada:** las imágenes **no se borraron a mano**. Se
encolaron en el **mismo mecanismo que va a operar cuando haya documentos
reales**, para que ese camino quedara **ejercido antes** y no estrenado el día
que importe. *Un mecanismo que se prueba por primera vez con datos reales no se
está probando: se está usando y esperando.*

**Estado de las 11 filas de registro asociadas:** **conservadas, sin puntero a
imagen.** Es exactamente el estado que §6.2 describe para un documento ya
verificado, así que no es un residuo: es el resultado correcto.

---

## 2 · El registro de verificación de §6.2 — qué se guarda y qué faltaba

§6.2 obliga a conservar **cinco** datos tras destruir la imagen. **Medido: la
tabla guardaba cuatro.**

| dato que §6.2 exige | estado |
|---|---|
| Tipo de documento | ✅ existía (`tipo`) |
| **Últimos cuatro dígitos** | 🔴 **NO EXISTÍA — agregado el 24-ago** (`documento_ultimos4`, con validación de cuatro dígitos) |
| Fecha de la verificación | ✅ existía (`revisado_en`) |
| Resultado | ✅ existía (`estado`) |
| Quién la realizó | ✅ existía (`revisado_por`) |

⚠️ **Por qué era el defecto que importaba:** sin el identificador parcial,
después de borrar la imagen el sistema podía decir *«se aprobó un título
profesional»* **pero no cuál**. *La idoneidad se sostiene en el registro, no en
la imagen — y un registro que no identifica el documento verificado no sostiene
nada.*

**Advertencia operativa:** la columna **nace vacía**. Los registros ya
existentes **no la tienen y no se puede reconstruir**, porque las imágenes ya
no están. **Rige de aquí en adelante.**

---

## 3 · Los dos mecanismos de retención del documento de identidad

Construidos el 24-ago-2026 según la lectura del abogado: **los 90 días son un
TECHO, no un período de conservación.**

**① El camino normal — la imagen muere al concluir la verificación.**
Un disparador automático encola la imagen para su destrucción **en el mismo acto
en que el documento pasa a aprobado o rechazado**, y limpia el puntero en la
misma operación. *Si el borrado del archivo fallara y el puntero quedara, la
ficha diría que hay una imagen que ya nadie puede garantizar — y §6.2 promete lo
contrario.* **Ejercido y verificado** (el disparador corrió, limpió el puntero y
encoló el objeto).

**② La red — 90 días, para lo que quedó colgado.**
Barre lo que **nunca se resolvió**: verificaciones pendientes, rechazos en
discusión. **Nace apagada**, con una llave que el founder activa: *un mecanismo
que borra documentos no se enciende porque alguien lo desplegó.*

**🔴 La señal que el abogado pidió poder leer, y está construida:** la red
**devuelve la cantidad que borró en cada corrida**. ⇒ **si empieza a borrar la
mayoría, el flujo se desvió**: significa que la verificación no se está
completando y que el camino ① dejó de operar. *La red existe para atrapar
excepciones; el día que atrape la regla, el problema no es la red.*

---

## 4 · Cronograma de los plazos de §18 que **no** bloquean la publicación

**Ninguno de estos tres tiene mecanismo hoy.** Se declara con responsable y sin
fecha inventada: *poner una fecha que nadie se comprometió a cumplir es peor que
declarar que falta.*

| plazo de §18 | mecanismo hoy | responsable | condición para fecharlo |
|---|---|---|---|
| **Identificador de dispositivo — 90 días sin uso** | ❌ no existe | producto | el dato de último uso ya se guarda ⇒ es un barrido periódico, la pieza más chica de las tres |
| **Traza de ubicación de un servicio — 12 meses** | ❌ no existe | producto | requiere distinguir la traza (que se borra) del hecho de que el servicio se prestó (que se conserva) — §10.3 ya lo dice |
| **Registros técnicos — 12 meses** | ❌ no existe | producto + infraestructura | depende de qué cuenta como «registro técnico»: parte vive en la plataforma de infraestructura y no en la base |

**Y los DOS que sí bloquean, por si conviene tenerlos juntos:** la **imagen del
carnet de vacunas** (borrar al cierre de cuenta) y las **fotos y videos de
atenciones** (cierre + 30 días). **Son una sola pieza y cuelgan del mismo
evento** ⇒ van con el motor de cierre de cuenta.

⚠️ **Consecuencia de producto que hay que decir en la pantalla, no solo acá:**
la imagen del carnet **se reproduce en las impresiones que la familia genera**.
Borrarla al cierre **deja esas impresiones sin ella**. Es lo correcto, y quien
cierre su cuenta tiene que enterarse **antes** de confirmar, no después.

---

## 5 · Transferencia internacional — Anthropic PBC

| | |
|---|---|
| **Fecha de aceptación del instrumento** | **27 de abril de 2026** (dato del founder) |
| **Corroboración técnica independiente** | La credencial de acceso al servicio (`ANTHROPIC_API_KEY`) **fue cargada en la plataforma el 27-abr-2026 a las 22:11 UTC**, lo que es consistente con que la relación contractual se haya constituido ese día |
| **Reparto de papeles** | SATORI INOV LATAM S.A.S. **responsable** · Anthropic PBC **encargado** |
| **Qué se transfiere, medido** | **Dos usos, los dos de salud:** el texto que el veterinario dicta en una consulta, y las fotos de carnets de vacunación. **Nada más** |
| **Qué NO se transfiere** | **La imagen del documento de identidad** (la función existe y **ningún flujo la invoca**) y **el audio del dictado** (nunca entra a nuestros sistemas) |

**🔴 LO QUE ESTE REGISTRO NO PUEDE APORTAR, y se declara:** la **verificación
del DPA contra las siete condiciones del Art. 21** no es algo que el equipo
técnico pueda hacer — **exige leer el instrumento y evaluarlo jurídicamente**.
Lo que sí queda aportado es **la fecha, su corroboración independiente y el
inventario exacto de lo transferido**, que es el insumo que esa evaluación
necesita.

*La corroboración vale como evidencia de la fecha, no del contenido: prueba que
ese día se estableció el acceso al servicio, no qué versión del instrumento se
aceptó. **Esa versión hay que archivarla, y es lo único que sigue faltando.***
