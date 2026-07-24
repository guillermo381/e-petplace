# LETRA — QUÉ PUEDE RECEPCIÓN (S76, dictado del founder) — ✅ **FIRMADA (founder, 24 Jul 2026)**

> **Estado: ✅ FIRMADA POR EL FOUNDER (24 Jul 2026).** Dictada por el
> founder en sesión S76 (24 Jul 2026) sobre el arco *"S75 hizo seguro el arco;
> S76 lo hace honesto"*, y firmada el mismo día. Con la firma entraron TODOS los
> depósitos: `LETRA_ROLES_EQUIPO_S74` §1-§2 enmendada (el selector de tres
> muere) y §6 (el aviso de administrador, literal firmado S76) ·
> `PORTAL_PRESTADOR` §14 → LETRA_EQUIPO v3 · **P22** declarada en
> `POLITICAS_EPETPLACE` (la reagenda clínica — ver la nota de enmienda de
> numeración al pie de este doc).
>
> **LOS DOS FRENOS DE LA TANDA, RESUELTOS (ADDENDUM 3, mismo día):**
> - **La reagenda clínica es P22** (decisión de mesa): custodia CONSERVA P20
>   (reserva de S70 — D-405 es materia legal y su número puede estar citado
>   afuera del repo). Las referencias internas de esta letra fueron corregidas
>   P20 → P22 con nota de enmienda al pie.
> - **El literal del aviso de administrador (§5) LLEGÓ por mano del founder** y
>   está depositado en `LETRA_ROLES_EQUIPO_S74` §6 (el par S74 quedó como
>   histórico plegado; notas de oficio intactas).
>
> **Destino al firmarse:** enmienda a `LETRA_ROLES_EQUIPO_S74` §2 (el selector)
> · `PORTAL_PRESTADOR` §14 → LETRA_EQUIPO **v3** · resuelve D-521, D-522, D-524,
> D-525 · abre **P22** *(dictada "P20"; corregida por colisión — nota al pie)* y
> **D-526**.
>
> **Contrastes obligatorios (corridos, no anunciados):** `MODELO_PRODUCTO`
> §2.5/§6.1/§8 — el contraste vive en §11 de esta letra, como manda la casa ·
> `LETRA_ROLES_EQUIPO_S74` (la letra firmada que esta enmienda) ·
> `MODELO_VETERINARIA` §7/§7bis · `LETRA_CUIDADO_ESPECIAL_S74` §6/§10 ·
> `DISEÑO_EXPERIENCIA` §15b.0 · `BIO_EXPEDIENTE` A3 · `POLITICAS` P18.
>
> **PISO DE LITERAL — de dónde sale cada afirmación de motor de esta letra:**
> los relevamientos **S76-A0** (10 puntos) y **S76-A0bis** (2 puntos), corridos
> contra la DB viva con `pg_get_functiondef`, `pg_policies`, `pg_constraint` e
> `information_schema` + grep del árbol de wrappers. **Ninguna afirmación de
> motor de este documento sale de memoria** (L-141, que rige también para la
> mesa). Lo que NO se relevó está marcado como tal en §13.
>
> **Qué es:** qué puede hacer cada persona del equipo en el día del negocio.
> No es motor nuevo — en su mayor parte es la FOTOGRAFÍA de decisiones que ya
> tomaste en momentos distintos y que nunca se habían escrito juntas.

---

## 1. LA TESIS — el selector es de DOS, y recepción no es una opción

**Dictado del founder (S76), en su forma final:**

> *"Por defecto recepción, toggle para administrador y toggle para prestador.
> Dentro de prestador se ven los chips con los servicios que tiene el negocio
> y se activan según se requiera."*

**ENMIENDA a `LETRA_ROLES_EQUIPO_S74` §1-§2.** La letra firmada en S74 traía un
**selector de tres** (administrador · recepción · profesional). Esta letra lo
baja a **dos toggles**, y el porqué es el propio corolario del founder aplicado
un piso más arriba:

> **"LA PUERTA NO PREGUNTA LO QUE YA SABE"** (`LETRA_SELECTOR_ELEGIBILIDAD_S73`
> §1). Recepción ya estaba definida por AUSENCIA en la letra firmada — verbatim
> S74: *"Cualquier usuario que no tiene acceso a ningún servicio ES
> recepción."* Ofrecerla como tercera opción es preguntar lo que la puerta ya
> sabe.

|  | Recepción | + toggle **Prestador** | + toggle **Administrador** |
|---|---|---|---|
| Cómo se llega | **default — no se elige** | se enciende | se enciende |
| Chips | ninguno | los **oficios** que el negocio tiene | ninguno (§5) |
| Quién lo otorga | nadie (es el piso) | administrador o titular | **solo el TITULAR** |

**Los dos toggles son INDEPENDIENTES, jamás excluyentes** — y esto no es
interpretación de mesa: es lo que exige la propia frase del founder
(*"recepción es la ausencia de LOS DOS"*) y lo que salva el caso §2.1 que él ya
había firmado: **el dueño que además atiende** (administrador + chip vet). Un
selector excluyente lo obligaría a elegir entre ser el negocio y ser el que
atiende.

**Consecuencia de motor, declarada:** `profesional` deja de ser un valor que
alguien elige y pasa a ser **derivado — tiene ≥1 chip**. El toggle existe en la
pantalla; la verdad vive en los chips. Elimina el estado imposible
(`profesional` sin ningún chip = alguien que presta servicios sin prestar
ninguno).

**Nota de motor que se escribe para que NADIE la "corrija" después:** recepción
**sigue teniendo su fila** en `empleado_roles` aunque en la pantalla sea la
ausencia de los dos toggles. La fila se **concede al entrar**, no se elige. La
necesita `obtener_contacto_reserva_cita`, que gatea por PRESENCIA del valor
`recepcion` — sin la fila, el lector de contacto rebotaría a la recepcionista,
que es exactamente el caso para el que nació. *(Literal: `LETRA_ROLES_EQUIPO`
§2, verificación S74-A. Censo hoy: `dueño`×5, `recepcion`×1, `administrador`×0,
`profesional`×0 — A0 punto 1.)*

---

## 2. LA LEY MADRE NUEVA — las dos varas

Esta es la pieza que ordena todo lo demás, y **no la inventó esta sesión**: el
relevamiento A0 la fotografió operando desde hace tres sesiones, en decisiones
que tomaste por separado y que coincidieron sin que nadie las escribiera
juntas.

> ## **LA VENTANILLA GATEA POR MEMBRESÍA. LO CLÍNICO GATEA POR CHIP.**

| | Qué incluye | Quién pasa |
|---|---|---|
| **VENTANILLA** | recibir el walk-in · registrar el cobro presencial · registrar la llegada | **cualquiera activo en el negocio** |
| **CLÍNICO** | escribir el expediente · firmar la vacuna · abrir caso · la nota | **solo quien tiene el chip** |

**Las tres decisiones tuyas que ya la cumplían, cada una por su lado:**

1. **El cobro presencial como DATO** (S69, `MODELO_VETERINARIA` §7 enmienda
   v1.4) — la recepcionista es su operadora natural. *Literal A0 punto 10:
   `registrar_cobro_presencial` gatea por `_user_opera_cuenta_comercial` =
   owner **O** empleado activo, sin mirar rol en ningún punto.*
2. **"Registrar atención es la puerta de la recepcionista"** (S72-P1, ratificado
   S74 §7bis: *"por ahora dejémoslo visible"*). *Literal A0 punto 5:
   `registrar_atencion_mostrador` gatea por `user_puede_acceder_prestador`
   (titular o empleado activo) + servicio activo **del NEGOCIO** — el chip de la
   persona no aparece en ningún guard.*
3. **El gate clínico D-490** (S75, dos fases) — *literal A0 punto 4: los dos
   helpers gatean por `ARRAY['dueño','profesional']`.*

**Consecuencia que esta ley resuelve sin construir nada:** **D-524** (el
mostrador de vacuna pasa a dos personas) no necesita estado nuevo. Recepción
**recibe** el walk-in de vacuna (ventanilla ✓) y **no puede firmarla** (clínico
✗) — así que *"pendiente de firma"* es **derivable** (walk-in médico sin su
evento de vacuna), no un estado que inventar.

---

## 3. QUÉ ESCRIBE RECEPCIÓN — el principio, en piedra

**Dictado del founder (S76), verbatim:**

> *"La recepción puede ver todas las citas, no solo las suyas, pero no las
> puede gestionar, es solo ver qué citas hay y con qué empleados."*

Ese dictado necesita una línea más fina, porque el día real de un mostrador
tiene escrituras. La que rige:

> ## **LA RECEPCIÓN ESCRIBE HECHOS DE LA PUERTA, JAMÁS DECISIONES DE AGENDA.**

**Hecho de la puerta:** ya ocurrió en el mundo físico y la app lo registra —
*llegó* · *entró el walk-in* · *se cobró en el mostrador*.
**Decisión de agenda:** cambiar fecha, profesional o servicio. Eso es
gestionar, y no es suyo.

La línea se explica en una frase (vara §6.1: cero explicación necesaria), y el
mostrador ya la cumplía sin que nadie la hubiera nombrado.

### La tabla de verbos

| Verbo | Recepción | Profesional | Administrador | Titular |
|---|---|---|---|---|
| **Ver** la jornada del negocio con su persona | ✅ | ❌ solo lo suyo | ✅ | ✅ |
| **Registrar llegada** (§7) | ✅ | ✅ | ✅ | ✅ |
| **Recibir walk-in** (mostrador) | ✅ | ✅ | ✅ | ✅ |
| **Registrar cobro presencial** | ✅ | ✅ | ✅ | ✅ |
| **Coordinar** una `por_coordinar` (fijar fecha) | ✅ *(excepción nombrada, §8)* | ✅ | ✅ | ✅ |
| **Reagendar** una cita fijada | ⏳ §8 — espera P22 | ⏳ | ⏳ | ⏳ |
| **Cambiar servicio o profesional** de una cita | ❌ | ❌ | ✅ | ✅ |
| **Escribir clínico** (nota · caso · vacuna) | ❌ | ✅ *(su chip)* | ❌ *(sin chip)* | ✅ |
| **Leer expediente clínico** | ❌ | ✅ *(su chip)* | ❌ *(sin chip)* | ✅ |
| **Plata · equipo · configuración** | ❌ | ❌ | ✅ | ✅ |

---

## 4. LO QUE EL LITERAL DIO VUELTA — D-522 estaba mal leída

**Registro obligatorio, porque tres documentos del canon repiten lo contrario.**

D-522 concluía: *"cualquier empleado activo lee/escribe la agenda entera del
negocio."* **Es falso.** El predicado real de las tres policies de agenda
(`cita_select_prestador` · `cita_insert_prestador_walkin` ·
`cita_update_prestador`), byte-idéntico en las tres (A0 punto 3):

```
( prestador_id IN (SELECT id FROM prestadores WHERE user_id = auth.uid()) )
OR
( empleado_id IN (SELECT id FROM prestador_empleados
                  WHERE user_id = auth.uid() AND activo = true) )
```

**La agenda no está abierta: está CERRADA DE MÁS.** Un empleado ve solo las
citas donde él es el `empleado_id`. La única rama "agenda entera" es la de
titularidad.

**Las tres consecuencias:**

1. **"El profesional ve solo lo suyo" YA ESTÁ CUMPLIDO de motor.** No hay nada
   que cerrar en ese eje — hay que cuidar de no romperlo.
2. **"Recepción ve todo" es CONSTRUCCIÓN PURA.** A0 punto 8 lo confirma en las
   tres capas: ningún RPC, vista ni wrapper devuelve la jornada con su empleado
   asignado. Y A0 punto 7: un no-titular **solo lee su propia fila** de
   `prestador_empleados` (`empleados_self`), así que aunque la cita portara
   `empleado_id`, **no podría resolverlo a un nombre**. Son DOS permisos, no uno.
3. **Bug vivo que esta letra cura:** `registrar_atencion_mostrador` es DEFINER
   (salta la policy al escribir) y en el caso N>1 deja `empleado_id = NULL` →
   **la recepcionista crea un walk-in que después no puede leer.** Hoy invisible
   porque hay una persona por negocio; aparece con la segunda.

---

## 5. EL ADMINISTRADOR — bloque, no chips (decisión founder S76)

**Firmado: (b) — el administrador es el BLOQUE ya firmado en S74**, no un set de
poderes granulares. El porqué: hoy **no existe nada** del motor administrativo
(S75-A3 probó con literal que *toda* la escritura de negocio es titular-only,
D-513), así que chips granulares fabricarían tildes que no gatean nada. Y el
almacenamiento es el mismo — `empleado_roles` es tabla hija, un rol = una fila —
así que **pasar de 1 fila a N después es aditivo, cero refactor**.

**Qué gana:** modificar servicios · ver ingresos y liquidaciones · gestionar
horarios · invitar, dar chips y desvincular personas.

**LA ASIMETRÍA (dictado founder S76, en piedra):**

> *"No puede crear otro administrador ni cambiar permiso sobre él u otro
> administrador. El único que puede hacer cosas sobre administrador es el
> dueño."*

- Sobre **no-administradores**: crea, da y quita chips, desvincula. ✅
- Sobre **cualquier administrador, incluido él mismo**: nada. ❌
- **Consecuencia declarada: un administrador no puede ni renunciar.** Apagarse
  su propio toggle es "cambiar permiso sobre él". Solo el titular lo apaga. Es
  coherente con la regla; se escribe para que no aparezca después como bug.

**GATEAR NO ES CONCEDER — el toggle de administrador NO se ofrece hasta que su
motor exista.** Sin R2, sin las tres familias de policies y sin el nudo de
horarios (`empleado_id NOT NULL`), un administrador pasa el toggle y **rebota al
guardar**. Ley 23 directa: la puerta no ofrece lo que va a rechazar. *(Su motor
es el arco de equipo v2 — D-513 v2 + D-517 CLASE 2.)*

**ENMIENDA PENDIENTE del aviso firmado §6:** el string de consentimiento de S74
cierra con *"No va a poder nombrar a otros administradores: eso solo puedes
hacerlo tú."* Con esta letra tiene que decir también que **no puede cambiar
permisos sobre otros administradores ni sobre sí mismo**. Es un string FIRMADO:
**la mesa propone el literal nuevo y el founder lo vuelve a firmar** — no se
edita solo.

---

## 6. EL CHIP — grano de OFICIO en la pantalla, oferta en el motor

**Decisión founder S76: (b) — el chip es por OFICIO** (vet, grooming, paseo,
adiestramiento), no por oferta puntual. **Su razón, registrada para que nadie
la reabra:** *"no creo que migre, no es un oficio que tenga tanta
granularidad."*

**El motor guarda a grano de OFERTA** — `prestador_empleado_servicios`, PK
`(empleado_id, servicio_id)` → `prestador_servicios` (A0 punto 2). La pantalla
escribe oficio; la tabla guarda las ofertas de ese oficio.

### 6.1 LA TRAMPA DEL GRANO, y su cura (decisión técnica de mesa)

Las 8 funciones que leen esa tabla son **EXCLUYENTES**, no inertes (A0bis punto
1): con 0 filas el `EXISTS` es falso para todos y solo sobrevive la rama
`pe.rol = 'dueño'`. **El filtro ya está prendido y excluyendo.** Escribir chips
no enciende nada: **deja entrar** gente que hoy está vetada.

**Consecuencia peligrosa del grano (b):** si la pantalla expande a las ofertas
de HOY, la clínica agrega *"Ecografía"* el mes que viene → nadie tiene ese chip
→ **todos los veterinarios desaparecen de la disponibilidad de ecografía, en
silencio.** Las 8 son excluyentes: no rebota, simplemente no hay quien atienda.

**Cura, decisión de mesa (estructural, regla 67):** un **trigger sobre INSERT de
`prestador_servicios`** que copie los chips del mismo oficio a la oferta nueva.
Aditivo, una función, **las 8 quedan intactas**. La alternativa —migrar las 8 a
grano de oficio— es el arco que no queremos.

### 6.2 El gate clínico pasa a leer el chip

**El agujero que esta letra cierra:** hoy el gate clínico lee `profesional`
genérico. Una peluquera con toggle Prestador y chip solo-grooming obtendría la
fila `profesional` → **leería y firmaría historias clínicas**. Es la regla madre
al revés (*el acceso clínico viene del CHIP, jamás del cargo*), y es el agujero
que S75 cerró para recepción, abierto por la puerta de al lado para un groomer.

**El gate no pregunta "¿tiene el chip vet?" sino "¿tiene chip en alguna oferta
cuyo `tipos_servicio.es_medico = true`?"** — usa el eje que S70 ya firmó (*el
día clínico se compone por `es_medico`, jamás por categoría*) y queda correcto
con cualquier grano futuro.

**LA VENTANA ES GRATIS HOY, y se cierra sola:** A0 punto 6 —
**cero filas `profesional` en toda la DB**. El flip no le quita acceso a nadie,
y los 5 titulares pasan por el **brazo 2** de `empleado_tiene_rol`
(titularidad), sin fila. **Con el primer veterinario empleado deja de ser
gratis.**

---

## 7. "LLEGÓ" — un timestamp, jamás un estado

**El check-in NO EXISTE en ninguna capa** — ni estado, ni columna, ni tabla, ni
función (A0 punto 9, barrido completo; `lista_espera` inspeccionada y descartada
como falso positivo: es la waitlist del portal legado, 0 filas, 0 lectores).
Los estados vivos: `pendiente · confirmada · en_curso · completada · cancelada ·
no_show · rechazada`. **No hay nada entre "cita firme" y "atención iniciada".**

**Decisión de mesa (estructural, regla 67): `evento_cita_servicio.llegada_en
timestamptz NULL`.** Nulo = todavía no llegó.

**Las dos patas del porqué:**

1. **Radio de estallido.** Meter un estado `'llegada'` en el CHECK obliga a
   censar **todo lector que filtre por estado**, y la casa tiene una ley que lo
   vuelve peligroso: *"la agenda solo contiene verdad firme"* (§13). Si la cita
   cambia de estado al llegar, **la mascota puede desaparecer del HOY del
   veterinario en el instante exacto en que entra por la puerta.** Un timestamp
   aditivo no toca un solo lector. *El argumento fuerte no es que sobreviva al
   censo — es que lo vuelve innecesario.*
2. **La forma del dato copia la forma del permiso.** Un cambio de estado tiene
   forma de decisión; una estampa de tiempo tiene forma de hecho. El schema hace
   evidente el permiso de §3, no solo la policy.

**Dos regalos gratis:** el walk-in nace con `llegada_en = now()` (ya está ahí) ·
`llegada_en IS NULL` al cierre del día **es** el candidato natural a `no_show`,
que hoy es un estado que nadie sabe quién estampa.

**Cómo se escribe:** no por RLS — el predicado de §4 restringe al `empleado_id`
propio, así que recepción no puede hacer UPDATE sobre citas ajenas. Necesita su
RPC DEFINER **`registrar_llegada`, gateada por membresía** — tercer miembro de
la familia ventanilla (§2), no puerta nueva.

**Regalo de producto:** el HOY del profesional puede decir *"llegó tu 10:30"*
**sin push, sin Meta, sin `MODELO_NOTIFICACIONES`** — el estado ES el aviso. Es
la coordinación silenciosa recepción→profesional que hoy se hace caminando
hasta el consultorio.

---

## 8. LA REAGENDA — el pet parent primero, recepción por el teléfono

**Dictado del founder (S76), con su duda declarada:**

> *"No es una respuesta fácil. Para mí sí, pero lo ideal es que el pet parent
> se autogestione."*

**La duda tenía una causa concreta, hallada en el canon: `P18` es SOLO paseo
suelto.** Su propio encabezado: *"Qué cubre: el paseo INDIVIDUAL pagado (ni plan
ni paquete)"*, con sus tres ventanas (≥24 h reagenda o cancela · 24-2 h solo
reagenda · <2 h se pierde), firmada S57 y **construida**.

> **Para VETERINARIA no existe ninguna política de reagenda. Ni para el dueño,
> ni para recepción, ni para nadie.**

**Las dos mitades del founder no compiten:** su ideal **ya es el patrón probado
de la casa** (P18, self-serve contra la agenda viva del prestador), y **para vet
no está construido para ninguno de los dos**.

**La letra:**

> **La reagenda es del pet parent. Recepción tiene la misma puerta, porque el
> teléfono existe** — con la misma huella: **fecha y hora, jamás servicio ni
> profesional**, y queda escrito quién la movió (procedencia, `BIO_EXPEDIENTE`
> §13; misma disciplina que el registro de auditoría de `LETRA_ROLES_EQUIPO`
> §7.2).

**El argumento que cierra la parte de recepción, y es del propio canon:** una
letra que diga *"solo el pet parent"* **no elimina la llamada telefónica** — la
manda afuera de la plataforma (WhatsApp, papel, la agenda de la clínica). Es
exactamente el modo de fallar que `MODELO_VETERINARIA` §7 nombra: *"la clínica
vive en dos sistemas, el reporte de rentabilidad queda incompleto — y un reporte
incompleto no es gancho, es juguete."* **La recepcionista que reagenda por
teléfono es la misma razón por la que existe el mostrador.**

**COORDINAR ≠ REAGENDAR.** Fijar la fecha de una `por_coordinar` (que **no tiene
fecha**) es la excepción nombrada y aprobada en S76: entra ya, acotada a
fijar-fecha. **Reagendar** una cita ya fijada espera su política.

**NACE P22 — reagenda y cancelación de la cita CLÍNICA** *(dictada "P20";
corregida por colisión de numeración — nota al pie)*, hermana de P18, con su
contraste financiero obligatorio. **No se construye en S76.** Se declara para
que el boceto sepa contra qué reserva el lugar. *Lo que P22 tendrá que resolver
y el paseo no tiene: una cita clínica puede arrastrar caso abierto, presupuesto
atado o instrucciones de preparación.*

---

## 9. LA CASA DE RECEPCIÓN — las cuatro zonas

Qué debe traer el boceto M1. Respeta `DISEÑO_EXPERIENCIA` §15b.0 (*HOY acciona ·
lo que sigue preside, lo pasado se pliega*).

**1. LA PUERTA (preside).** Lo vivo, ahora: quién **espera** (llegó, aún no
pasa) · quién está **adentro y con quién** · las **autorizaciones §7bis en
vuelo** con su reloj de 10 minutos — hoy esa solicitud se dispara y nadie ve su
estado envejecer; el lugar natural es este.
**Cada celda:** avatar + nombre + especie + etapa en voz + **el lugar de la
banda de cuidado especial** + profesional + hora. **CERO CLÍNICO** — D-489 es la
letra de esta celda.

**2. EL DÍA.** Todas las citas de hoy del negocio, con su persona asignada. Lo
pasado se pliega. Acción sobre lo por-llegar: **"Llegó"**. Acá vive el *"con qué
empleados"* del dictado: con 2+ profesionales el día se lee **por persona**; con
uno, lista simple. **Qué composición exactamente lo decide M1 sobre la lámina,
no esta letra.**

**3. LA ACCIÓN ÚNICA: Registrar atención.** El mostrador que ya existe, como el
verbo grande de la zona — jamás un chip perdido. El cobro presencial queda donde
el flujo lo trae.

**4. ADELANTE.** El teléfono pregunta por el jueves: días próximos, solo lectura,
misma composición que EL DÍA. Sin esto, la pantalla sirve al que ya vino y no al
que llama.

**LA BANDA DE CUIDADO ESPECIAL — orden literal de `LETRA_CUIDADO_ESPECIAL_S74`
§10, que aplica a esta pantalla:** *"el boceto de la vista de recepción **declara
dónde entrará la banda** sin dibujarla — para que el día que D-469 esté lista se
AGREGUE y no se rehaga la pantalla."* Y §6 confirma que le corresponde: *"viaja
a TODOS los cuidadores, recepción incluida... nunca se destila y nunca se
oculta."* **Segunda aplicación de la misma disciplina en esta letra** (la
primera es la reagenda de §8).

---

## 10. LO QUE ESTA LETRA JAMÁS HACE

Acceso clínico por cargo · una superficie que ofrece lo que el motor va a
rechazar · un toggle de administrador sin su motor · recepción cambiando
servicio o profesional de una cita · un estado nuevo en el CHECK de citas para
resolver un hecho de puerta · chips que desaparecen gente de la reserva en
silencio · una reagenda sin política · el expediente clínico en la pantalla de
recepción.

---

## 11. CONTRASTE CONTRA `MODELO_PRODUCTO` — CORRIDO (regla de la casa)

**§2.5 — *"e-PetPlace NO es un CRM veterinario"*, con su enmienda S66.** Es el
roce candidato de toda esta letra: una pantalla de agenda para recepción **suena
a** operación interna de clínica. **Sobrevive por la segunda pregunta que la
enmienda S66 agregó** (*"¿hace que cobrar adentro sea más fácil que afuera?"*):
la zona 4 y la reagenda existen **para que la llamada telefónica no se resuelva
afuera de la plataforma** — que es la tesis Fresha/Toast de `MODELO_VETERINARIA`
§7. Y la primera pregunta también da verde: **el check-in y el walk-in
sedimentan al expediente**; una atención que la clínica resuelve en papel no
sedimenta nada. **Roce declarado y resuelto, no escondido.**

**§6.1 — *wow = cero explicación necesaria*.** El principio de §3 (hechos de
puerta vs decisiones de agenda) se explica en una frase, y la pantalla se
compone por lo que el rol PUEDE: la recepcionista **nunca ve una acción que le
va a rebotar**. Es el criterio operativo del wow aplicado al lado prestador.

**§8.1 — *la mascota es dueña de su vida documentada*.** Esta letra reparte
**acceso**, jamás propiedad. Ningún verbo nuevo borra ni desfirma nada.

**§8.6 — *hitos privados del humano, inviolables*.** Ningún rol de esta letra
los alcanza; `BIO_EXPEDIENTE` A3.5 los deja fuera de toda vista de prestador y
acá no se abre esa puerta.

**§8.8 — *datos sensibles con consentimiento explícito*.** La celda de recepción
lleva **cero clínico** (D-489), y el handshake §7bis se conserva intacto: la
historia se abre **al autorizar**, jamás antes.

**§8.3 — *no sponsoreo en recomendaciones clínicas*.** Esta letra no toca
recomendación, urgencia ni orden de oferta.

**Sin roce sin declarar.**

---

## 12. LAS DEUDAS QUE ESTA LETRA ABRE, CIERRA O TOCA

| Deuda | Qué le pasa |
|---|---|
| **D-522** | **ENMENDADA — su conclusión era FALSA.** La agenda está cerrada de más, no abierta (§4). Lo que queda es construcción, no cura. |
| **D-525** | El editor clínico gana su gate de ausencia por rol en la ENTRADA (§3, tabla de verbos). |
| **D-521** | El menú de HOY se compone por lo que el rol PUEDE (§3, §9). |
| **D-524** | **Resuelta sin estado nuevo** — "pendiente de firma" es derivable (§2). |
| **D-526 🔴 NACE** | *La fila del vínculo es escribible por su propio dueño en campos de GOBIERNO.* `empleados_self_actualiza` (USING/WITH CHECK = `user_id = auth.uid()`, sin lista de columnas) + grant de `authenticated` sobre las 16 columnas + **cero triggers** ⇒ **T1: un empleado desactivado se reactiva solo** · **T2: se escribe `rol='dueño'` en su propia fila.** Probado en vivo por A0bis con rollback verificado. **Alcance real, medido: NO toca lo clínico** — `empleado_tiene_rol` lee `empleado_roles` y `prestadores.user_id`, y T2 escribe `prestador_empleados.rol`, que no es ninguna de las dos. **La mudanza de roles a la tabla hija (S73) es lo que impide que esto sea catástrofe.** **Cura firmada para S76: trigger espejo de D-389** (rebota si cambia `activo` o `rol` y el actor no es titular/admin). El REVOKE por columna es v2 con censo — el titular **necesita** escribir `activo` para desvincular. *Número propuesto; la sesión confirma que D-526 está libre antes de depositar.* |
| **D-486 ENMENDADA** | El eje legacy no tiene **un** lector vivo: tiene **nueve** — `titular.ts` + los 8 predicados de disponibilidad, que se sostienen sobre la rama `pe.rol = 'dueño'`. **Si el DROP llegara sin migrarlos, muere la disponibilidad del titular en las 8 puertas.** La columna congelada es viga y agujero a la vez. |
| **D-489** | Es la letra de la celda de recepción (§9). No se cierra acá; se cita como su fuente. |
| **P22 NACE** | Reagenda y cancelación de la cita clínica (§8). Sin fecha. *(Dictada "P20"; corregida — nota al pie.)* |
| D-469 / D-500 | La banda de cuidado especial: **lugar declarado, no dibujado** (§9). |
| D-513 v2 / D-517 CLASE 2 | Son el motor del toggle administrador (§5). Sin ellas, el toggle no se ofrece. |

---

## 13. LO QUE QUEDA ABIERTO — sin maquillar

1. **Los chips AL INVITAR: no verificado.** `D-509` dice literal *"el rol
   invitado no viaja — CHECK solo-`'empleado'`"*. Antes de proponer nada hay que
   leer con `pg_get_functiondef` `crear_empleado_directo` y
   `empleado_invitaciones` (su CHECK y su `token`), y si los chips pueden nacer
   como filas en el camino directo sin tocar el CHECK. **La mesa no afirma que
   esté APTO.**
2. **Las 3 filas legacy desactivadas: ¿personas reales o seed?** A0bis corrió su
   test sobre `27f1e55f`. Si alguna es una persona real con credencial usable,
   **D-526 es una puerta abierta HOY**, no un riesgo futuro. Lectura pendiente.
3. **La composición del tablero del día** (columnas por persona vs filtro vs
   lista) — la decide M1 sobre la lámina, no esta letra.
4. **P22 no tiene letra.** La reagenda tiene su lugar reservado (P22 DECLARADA
   en `POLITICAS`) y nada más.
5. **El string del aviso de administrador** (§5) necesita literal nuevo y
   **segunda firma del founder**.

---

## ANEXO — BRIEF M1 PARA FRENTE B (la agenda de recepción)

> **Alcance S76 de esta pantalla: BOCETO SOLAMENTE.** Decisión del founder
> (S76): se construye en S77. El motor tampoco entra — A0 puntos 8 y 9 probaron
> que **todo es construcción**: no existe lector de jornada-con-empleado en
> ninguna capa, ni check-in en ninguna forma.

**Qué trae el boceto:** las **7 preguntas §1c** de la skill
`epetplace-design-system` + **estados declarados** (vacío · cargando · error ·
N=1 profesional · N>1 profesionales · sin citas hoy · con autorización en
vuelo). **M2 vara cruzada de A leyendo la fuente · M3 captura · M4 contrato de
datos · M5 diccionario.**

**Contrato de datos (M4) — DEFINIDO POR AUSENCIA, y eso hay que decirlo en el
boceto:** hoy **ningún** campo de esta pantalla tiene lector. El boceto declara
qué campos pide, sabiendo que **todos** son pedido de motor para S77:
`llegada_en` · el `empleado_id` de la cita **y su nombre** (dos permisos
distintos, §4) · el estado de la solicitud §7bis con su reloj · el lugar de la
banda de cuidado especial.

**Lo que el boceto NO dibuja pero SÍ declara** (para no rehacer la pantalla):
la banda de cuidado especial (`LETRA_CUIDADO_ESPECIAL` §10) · la acción de
reagendar (espera P22, §8).

**Las cuatro zonas: §9 de esta letra.**
**Lo que jamás aparece: §10.**
**La vara: `DISEÑO_EXPERIENCIA` §15b.0 los cuatro puntos + §15b la dosis del
prestador + `DIRECCION_ARTE` §6b si nace algún glifo.**

**Precondición de arranque:** esta letra **FIRMADA**. Un boceto contra una
propuesta es una corazonada con lámina.

---

## Historial

- **FRENOS RESUELTOS (S76, 24 Jul 2026 — ADDENDUM 3, decisión de mesa):**
  (1) **la reagenda clínica es P22** — custodia conserva P20 (reserva S70,
  D-405 es materia legal y su número puede estar citado afuera del repo);
  P22 DECLARADA en `POLITICAS_EPETPLACE` v1.10 y las referencias internas de
  esta letra corregidas P20 → P22 (nota de enmienda al pie); (2) **el literal
  del aviso de administrador llegó por mano del founder** y está depositado en
  `LETRA_ROLES_EQUIPO_S74` §6 (el par S74 plegado como histórico; notas de
  oficio intactas; registrado como criterio de aceptación del motor
  administrativo — D-513).
- **FIRMADA (S76, 24 Jul 2026):** el founder firmó la letra el mismo día en que
  fue propuesta. Con la firma se depositan la **enmienda §1-§2 de
  `LETRA_ROLES_EQUIPO_S74`** (el selector de tres muere) y **`PORTAL_PRESTADOR`
  §14 → LETRA_EQUIPO v3**; y se firman las lecciones **L-166** (todo dato vivo se
  lee al usarlo) y **L-167** (un gate se verifica por el camino de la pantalla).
  Al momento de la firma quedaron DOS FRENOS declarados (el número de la reagenda
  y el literal del aviso) — resueltos el mismo día por ADDENDUM 3 (entrada de
  arriba). **Nota de PROCEDENCIA:** el texto de mesa original decía *"PROPUESTA,
  ESPERA FIRMA"* en el título y el Estado; **el estado lo volteó a FIRMADA la
  sesión S76-A (Code, el escritor único de docs por 76d) al depositar, el
  24-jul-2026, por orden literal del founder en el ADDENDUM 2** — la mesa NO
  propuso la letra ya firmada; el "verbatim" del depósito cubre el CUERPO
  (§1-§13 + anexo), y el encabezado/historial llevan las enmiendas de estado
  declaradas en este historial.
- **PROPUESTA (S76, 24 Jul 2026):** redactada por la mesa sobre el dictado del
  founder en sesión, con piso de literal en los relevamientos S76-A0 y A0bis.
  Enmienda el selector de tres de `LETRA_ROLES_EQUIPO_S74` a **dos toggles** ·
  nombra la ley madre **ventanilla/clínico** que ya operaba sin estar escrita ·
  fija el principio **hechos de puerta vs decisiones de agenda** · da vuelta la
  conclusión de **D-522** contra la fuente · resuelve **D-524** sin estado nuevo
  · abre **D-526** (la fila de gobierno escribible por su propio dueño) y **P20**
  (reagenda clínica) · enmienda **D-486** (nueve lectores vivos, no uno).
  **Decisiones del founder incorporadas:** administrador como bloque (b) · chip
  a grano de oficio, *"no creo que migre"* · "Llegó" es de recepción · recepción
  coordina las `por_coordinar` · la cura de D-526 entra a S76 · la pantalla solo
  se bocetea.
  **Decisiones técnicas de mesa declaradas (regla 67, estructurales):**
  `llegada_en` como timestamp y no estado · el gate clínico por `es_medico` ·
  el trigger de herencia de chips en oferta nueva · `profesional` derivado de
  la presencia de chips.

---

**NOTA DE ENMIENDA DE NUMERACIÓN (S76, 24 Jul 2026 — las referencias "P20" de
esta letra fueron corregidas a P22):** la mesa dictó *"P20"* leyendo el rango
P1-P19 de un resumen de `CLAUDE.md` en vez de `POLITICAS_EPETPLACE` — donde
**P20 estaba RESERVADA a la letra de CUSTODIA (D-405) desde S70** (la nota de
numeración de P21 lo dice con todas las letras; por eso la letra Uber tomó P21).
**Atrapado por el freno de A** contra el literal de `POLITICAS` antes de
depositar. Decisión de mesa (ADDENDUM 3): custodia CONSERVA P20 (materia legal,
su número puede estar citado afuera del repo) y **la reagenda clínica toma
P22**. **Es L-166 aplicada CONTRA LA MESA, en la sesión que la firmó** — una
afirmación de nivel resumen que la fuente no sostiene, la tercera de S76 (las
otras dos: la conclusión de D-522 y el "0 lectores" de
`prestador_empleado_servicios`). La entrada PROPUESTA del historial conserva
"P20" como registro fiel de lo dictado.
