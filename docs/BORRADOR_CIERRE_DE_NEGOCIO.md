# Borrador de letra — el cierre de un NEGOCIO

> **Estado: BORRADOR. No rige nada.** · S104-A · 24-ago-2026
> **Para que el founder firme en otra mesa.** *Este documento no decide: mide
> los obstáculos y sirve tres caminos por cada uno.*

---

## 0 · Por qué esto existe, y por qué no es una deuda

**LEY DE PARIDAD DE CUENTA, excepción ② (firma founder, 23-ago-2026):**

> 🔴 **EL CIERRE DEL NEGOCIO NO EXISTE EN LA APP, POR DECISIÓN Y NO POR FALTA.**
> *Un negocio con citas pagadas de terceros, empleados con acceso y eventos sin
> liquidar no se cierra con un botón — es trámite asistido.* La app **lo dice y
> da el camino de contacto**; **no es deuda ni «Pronto»: es la forma correcta.**

**Y lo que sí está construido, para que no se confunda:** el **cierre PERSONAL**
—el de quien se va, dueño o empleado— **existe y funciona** (`solicitar_cierre_cuenta`).
Cuando ese cierre personal **dejaría un negocio acéfalo**, el motor **lo frena
en el servidor** con `requiere_camino_asistido` y la app rutea acá. *El backstop
ya está; lo que falta es la letra de qué pasa del otro lado del contacto.*

---

## 1 · Cómo leer los números de este documento

**Todos se midieron contra producción el 24-ago-2026, y cada uno viaja con su
predicado** — no solo con su cifra (`L-414`). *Un número sin su predicado no se
puede contradecir, y por eso no se puede verificar.*

⚠️ **Los números envejecen y ninguno debe copiarse a la letra firmada.** Esta
misma sesión midió un censo de FKs que había cambiado en dos días **por su
propio trabajo**. **En la letra van los comandos; acá van las cifras del día
para dimensionar la decisión.**

| obstáculo | medido | predicado exacto |
|---|---|---|
| Citas futuras ya pagadas por terceros | **16** | `evento_cita_servicio` con `estado_reserva='pagada'` **y** `fecha >= current_date` |
| Personas con acceso al negocio | **27** | `prestador_empleados` con `activo` |
| Eventos económicos sin liquidar | **36** | `eventos_economicos` con `liquidacion_id is null` |
| *(contexto)* Negocios con equipo real | **6** | los que tienen **más de una** persona activa |

> *El censo previo reportó **17** citas. La diferencia no es un error de nadie:
> **depende de si el corte incluye el día de hoy**. Se declara el predicado para
> que la próxima medición pueda contradecir ésta con precisión.*

---

## 2 · OBSTÁCULO ① — las citas futuras que terceros YA PAGARON

**El hecho:** hay familias que pagaron por un servicio que todavía no ocurrió.
**Su dinero ya salió de su tarjeta.** Cerrar el negocio deja esas citas sin
quién las preste.

⚠️ **Lo que lo vuelve el más urgente de los tres:** los otros dos son problemas
**entre la Compañía y el profesional**. *Éste tiene un tercero adentro que no
participó de la decisión y que ya cumplió su parte.*

**Y una restricción que la letra ya impuso:** los T&C §27.1 dicen que si el
profesional cancela con menos de 24 h **hay reembolso íntegro al cliente**, y
§28.4 que ese valor **se descuenta de lo recaudado por su cuenta y, si no
alcanza, se compensa contra liquidaciones futuras**. *Un cierre no puede ser una
puerta para esquivar eso.*

| camino | qué significa | a favor | en contra |
|---|---|---|---|
| **(a) Honrar o nada** | El cierre **no se procesa** hasta que no queden citas futuras pagadas: se prestan o se cancelan una por una | La familia nunca pierde nada. **Es el único que no necesita una regla nueva: usa la que ya está firmada** | El negocio puede quedar meses sin poder cerrar si vendió planes largos. *Un profesional que quiere irse y no puede es alguien que va a dejar de atender igual* |
| **(b) Reembolso masivo al cerrar** | Al confirmarse el cierre, **todas** las citas futuras se cancelan con reembolso íntegro | Rápido y limpio para la Compañía | 🔴 **El reembolso real no funciona todavía** (`D-897 ①`: hoy solo revierte el asiento). ⇒ **este camino es inejecutable hasta que exista.** Y deja a familias sin el servicio que planificaron |
| **(c) Traspaso a otro profesional** | Se ofrece a cada familia migrar su cita a otro prestador de la plataforma | Es el único que **conserva el servicio** para la familia | Exige consentimiento de la familia **y** aceptación del otro profesional. **Y toca el precio congelado**: el nuevo puede cobrar otra tarifa |

**Pregunta que la mesa tiene que contestar antes de elegir:** *¿el cierre es un
derecho del profesional que la Compañía debe poder ejecutar, o una solicitud que
puede quedar condicionada a sus obligaciones vivas?* **(a) supone lo segundo;
(b) supone lo primero.**

---

## 3 · OBSTÁCULO ② — las 27 personas con acceso

**El hecho:** cerrar el negocio **les quita el acceso a todas**, y ninguna
participó de la decisión. *Para varias, la app es su herramienta de trabajo.*

**Y hay una asimetría que conviene ver:** su **cuenta personal** no muere con el
negocio —es de ellas, y su cierre es otro acto—; lo que muere es **su vínculo
laboral dentro de la plataforma**.

| camino | qué significa | a favor | en contra |
|---|---|---|---|
| **(a) Baja silenciosa** | El vínculo se cierra con motivo `cierre_negocio` y la persona lo descubre al entrar | Cero construcción | *Alguien abre la app un lunes y su trabajo no está.* **Es el peor para la persona y el más barato para nosotros** — conviene decirlo así de crudo |
| **(b) Aviso con antelación** | Se les notifica **antes** de que el cierre se ejecute, con fecha | Digno y barato: el motor de avisos existe | Le da a los empleados información sobre una decisión del dueño **antes de que él se las comunique**. *Puede ser exactamente lo que él no quiere* |
| **(c) El dueño avisa, la plataforma no** | La app le pide al titular **confirmar que ya les avisó**, y ejecuta | Respeta que la relación laboral es suya, no nuestra | **Una casilla no prueba nada.** *Un «ya les avisé» es una declaración, y el que la firma es parte interesada* |

**Y una pregunta que ninguno de los tres contesta:** *¿qué pasa con el
**histórico de trabajo** de esas personas —sus atenciones, sus hitos— cuando el
negocio desaparece?* **Hoy `prestador_atencion_log` está anonimizado por diseño
y no contiene datos del dueño; pero el vínculo de quién atendió qué vive en
`prestador_empleados`.** *Si se borra, esas personas pierden la evidencia de su
propio trabajo.*

---

## 4 · OBSTÁCULO ③ — los 36 eventos sin liquidar

**El hecho:** hay dinero devengado que **nunca se liquidó a nadie**.

🔴 **Y la agravante, medida:** `D-897 ②` dice que **nunca se corrió una
liquidación de punta a punta** — **cero liquidaciones en la base**. ⇒ *el cierre
de un negocio con saldo pendiente exigiría estrenar la liquidación en el peor
caso posible: una final, sobre una relación que termina, con alguien que se va.*

**Restricción de letra ya firmada:** T&C §36.5.b obliga a una **Liquidación
final** dentro de los 30 días, **cualquiera sea su monto** — o sea que el mínimo
de USD 20 de §22.1 **no aplica al cierre**. *Ese camino ya está decidido; lo que
falta es que funcione.*

| camino | qué significa | a favor | en contra |
|---|---|---|---|
| **(a) Liquidación final obligatoria antes de cerrar** | No se cierra hasta pagarle | **Es lo que el contrato ya promete** | Estrena la liquidación en el caso más delicado. **Y si el motor falla, el negocio queda atrapado** |
| **(b) Cerrar y liquidar después** | El acceso muere, el saldo se paga fuera de la app | Desatasca el cierre | *La persona pierde la única superficie donde puede ver qué se le debe.* **Y §36.6 dice que la terminación no lo priva de esos valores** ⇒ habría que darle otra vía de consulta |
| **(c) Cerrar solo si el saldo es cero** | Se le paga primero por la vía que sea, y recién ahí se cierra | Simple y sin construcción nueva | Traslada el problema a un proceso manual **sin trazabilidad en la plataforma** — justo lo contrario de lo que un mandato de recaudación necesita poder demostrar (`D-900`) |

---

## 5 · LO QUE ESTA TANDA DESTAPÓ Y NO ESTABA EN EL CENSO

**El mismo discriminador que se aplicó hoy a los borrados del día 30 aplica acá,
y da vuelta la intuición: *no son suyos por estar en su bucket*.**

### 5.1 · Los expedientes de las mascotas que atendió

**Medido:** `evento_archivo_adjunto` ata **2 mascotas** a atenciones con
`prestador_id`, con **4 archivos**. *Cifras chicas hoy — y por eso es el momento
de decidirlo, no cuando sean miles.*

🔴 **El expediente NO es del negocio.** `POLITICA-PRIVACIDAD-APP §19.4` lo dice
con su razón, y es la frase que cierra la discusión:

> *«Los hechos del expediente de la mascota, **porque la mascota puede cambiar de
> familia y su historia le pertenece a ella**, no a la cuenta desde la que fue
> registrada.»*

⇒ **Si el expediente sobrevive al cierre de la cuenta de la FAMILIA, con más
razón sobrevive al del NEGOCIO.** *El negocio fue un autor de hechos, no su
dueño.* **Y §32.1 del T&C ya lo reparte:** el profesional es responsable del
contenido clínico que produce; **la Compañía es responsable de conservarlo**.

**La pregunta abierta no es si se conserva —eso está resuelto— sino QUÉ DICE
sobre su autor cuando el autor ya no existe.** Tres caminos:

| camino | cómo se lee el expediente después |
|---|---|
| **(a) El nombre del negocio se conserva** | *«Atendió: Clínica Aurora»*, aunque ya no opere. **Es la verdad histórica** — y §6.3 de la Política promete que cada hecho registra quién lo aportó |
| **(b) Se seudonimiza como el de una persona** | *«Un veterinario verificado»*. Protege al profesional; **empobrece el expediente** y choca con §6.3 |
| **(c) Se marca como cerrado** | *«Clínica Aurora (ya no opera en e-PetPlace)»*. Honesto en las dos direcciones; **es el único que evita que una familia intente contactar un negocio que no existe** |

### 5.2 · Las fotos de atención que subió

**Mismo hallazgo, en su forma más concreta.** Están en buckets del prestador
(`cita-archivos`, `grooming-archivos`, `adiestramiento-clips`), **pero pertenecen
al expediente de la mascota** — §18 las conserva *«hasta el cierre de la cuenta
más 30 días»*, y **esa cuenta es la de la FAMILIA, no la del negocio**.

⇒ **Borrarlas al cerrar el negocio le borraría a una familia las fotos de la
atención de su propia mascota.** *Es exactamente el error que el motor del día
30 esquivó midiendo la tabla en vez del prefijo del path.*

**Recomendación técnica —no decisión—:** que la letra diga explícitamente que
**el cierre de un negocio NO dispara ningún borrado de Storage**. *No porque sea
difícil, sino porque es incorrecto* — y porque **el que venga después va a mirar
los buckets del prestador y le va a parecer obvio limpiarlos.*

---

## 6 · Lo que este borrador NO resuelve, declarado

- **Quién ejecuta el trámite asistido.** No hay canal, ni responsable, ni SLA.
  *Hoy la app diría «escribinos» a una dirección que nadie declaró que atiende
  esto.*
- **Si el cierre es reversible.** El personal tiene 30 días firmados; **el del
  negocio no tiene nada escrito.**
- **Qué pasa con las reseñas** que las familias dejaron. *Son de quien las
  escribió, y hablan de alguien que ya no está.*
- **La marca.** §35.3 del T&C dice que la Compañía **retira el perfil público
  dentro de un plazo razonable** al terminar. *«Razonable» no es un plazo.*

---

## 7 · La única recomendación de forma

**Que la letra separe DOS actos que hoy se confunden en una sola palabra:**

1. **DAR DE BAJA LA OPERACIÓN** — deja de recibir reservas, el perfil sale de la
   vitrina, el equipo pierde acceso. **Reversible.** *Es lo que casi todo el que
   pide «cerrar» realmente quiere.*
2. **CERRAR LA CUENTA COMERCIAL** — se liquida el saldo final, termina el
   contrato, se retira el perfil. **Terminal.**

**Por qué importa, y es la lección que esta tanda pagó dos veces hoy:** *el
cierre personal se pudo construir porque se separó lo que quita el acceso —hoy,
reversible— de lo que es irreversible —día 30—.* **El mismo corte hace
construible el del negocio: casi todos los obstáculos de arriba bloquean el acto
② y ninguno bloquea el ①.**
