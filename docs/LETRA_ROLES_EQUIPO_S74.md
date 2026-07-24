# LETRA — LOS ROLES DEL EQUIPO (S74, dictado del founder) — ✅ **FIRMADA**

> **Estado: ✅ FIRMADA POR EL FOUNDER (S74, 22 Jul 2026).** Los tres puntos
> del §10, contestados: **(1)** el link vence en **48 HORAS** (el founder
> BAJÓ la propuesta de mesa de 72) · **(2)** **el administrador NO nombra
> administradores: solo el TITULAR** · **(3)** el string del aviso de §6 →
> **FIRMADO por el founder, pero su LITERAL NO VIAJÓ al paquete de depósito**
> (freno L-142 declarado abajo, §6) — se deposita en cuanto llegue.
> **Disparo ejecutado con la firma:** `PORTAL_PRESTADOR` §14 → **LETRA_EQUIPO
> v2** (doc a **v1.4**), como esta letra declaraba que haría al firmarse.
>
> *(Estado previo: BORRADOR DE MESA — espera firma founder.)* Dictado en sesión S74
> (22 Jul 2026) sobre la ventana de equipo recién construida, con hallazgo de
> campo del propio founder (la invitación que no llegó).
> **Destino:** enmienda a `PORTAL_PRESTADOR.md` §14 (LETRA_EQUIPO v1 → v2) +
> las deudas D-508 → D-510.
> **Contrastes obligatorios:** `BIO_EXPEDIENTE` A3 (la ley madre acto/rol: el
> ACTO decide qué se MUESTRA, el ROL decide qué se PUEDE mostrar) · el motor
> de equipo aplicado en S73 (`empleado_roles`, `empleado_tiene_rol`, las 14
> policies del gate D-464) · `MODELO_PRESENCIA` §6 (vocabulario preciso y NO
> intercambiable) · `MODELO_NOTIFICACIONES` v0 (por qué el mail no salió) ·
> `MODELO_PRODUCTO` §8 (éticos).
> **Qué es:** el modelo de acceso del equipo, dicho en la lengua del founder y
> traducido al motor que ya vive. No es motor nuevo: es la CARA de lo que S73
> construyó, más los candados que la superficie destapó.

> **NOTA DEL DEPÓSITO (S74-A, 22 Jul 2026) — ACTUALIZADA CON LA FIRMA:**
> depositada VERBATIM del literal de mesa. En el depósito, `PORTAL_PRESTADOR`
> §14 quedó **declarado como pendiente de esta firma**; **la firma llegó el
> mismo día y §14 YA ESTÁ ENMENDADO a LETRA_EQUIPO v2** (doc a v1.4). Lo que
> también se ejecutó en el depósito: **D-510 nace** y **D-509 se ENMIENDA** con la vía en la
> auditoría (ya existía del diagnóstico D-508, mismo día — no se duplicó).
> El §7 de esta letra decía "hipótesis en verificación": **verificada y
> CONFIRMADA** el mismo día (cero productor de email en el stack) — el
> literal vive en D-508.

---

## 1. La tesis (founder, S74)

El dictado, en su forma final:

> *"Un selector de tres usuarios: administrador, recepción y profesional. El de
> administración ve todo; recepción es la base sin chips que seleccionar; y el
> profesional, los chips de los servicios que presta."*

Y sobre el piso, que es la pieza que ordena todo lo demás:

> *"Se nombra pero no se le agregan chips. Es como el usuario por defecto: son
> los permisos base, los de recepción. Cualquier usuario que no tiene acceso a
> ningún servicio ES recepción."*

**La consecuencia que este dictado resuelve sin proponérselo:** recepción deja
de ser un rol con nombre propio que hay que mantener sincronizado, y pasa a ser
**el piso** — lo que ve cualquiera que entró al negocio y todavía no tiene nada
más. Un rol menos que gobernar, y el estado "invitado sin rol" deja de ser un
limbo: ya es alguien útil en el mostrador.

## 2. Los dos ejes (y por qué el selector de tres NO los contradice)

> **ENMIENDA S76 — EL SELECTOR DE TRES MUERE; PASA A DOS TOGGLES (`LETRA_RECEPCION_S76` §1, FIRMADA founder 24 Jul 2026).** El selector de §1 (administrador · recepción · profesional) baja a **dos toggles INDEPENDIENTES: Administrador y Prestador**, y recepción **deja de ser una opción del selector — es la AUSENCIA de los dos toggles**. El porqué es el propio corolario del founder aplicado un piso más arriba (*"la puerta no pregunta lo que ya sabe"*, `LETRA_SELECTOR_ELEGIBILIDAD_S73` §1): esta misma letra ya define recepción por AUSENCIA (§1: *"cualquier usuario que no tiene acceso a ningún servicio ES recepción"*), así que ofrecerla como TERCERA opción es preguntar lo que la puerta ya sabe. **`profesional` deja de ser un valor que se elige y pasa a DERIVADO — tiene ≥1 chip** (elimina el estado imposible "profesional sin ningún chip"). **Lo que NO cambia:** los DOS EJES de abajo (administrativo + oficio/chips) sobreviven intactos — la enmienda toca la CARA (dos toggles en vez de tres botones), no el modelo; la **ley madre "el acceso clínico viene del CHIP, jamás del cargo"** queda en pie, y los dos casos que el selector excluyente rompía (el dueño que además atiende · el administrador que no atiende) los salva la INDEPENDENCIA de los dos toggles, no un tercer botón. **La tabla de §1 y el resto de esta sección se conservan como registro del modelo de S74; su cara vigente es la de dos toggles.** Detalle: `LETRA_RECEPCION_S76` §1.

El modelo tiene **dos ejes independientes**, y el selector de tres es su cara
simplificada — no su reemplazo:

- **Eje administrativo:** ¿ve la plata, la gestión del negocio y el equipo?
- **Eje de oficio (chips, acumulables):** ¿qué servicios presta? Grooming, vet,
  paseo, adiestramiento. Uno puede tener dos o más.

| Selector | Piso | Chips | Plata · gestión · equipo |
|---|---|---|---|
| **Recepción** | ✅ | ✗ por definición | ✗ |
| **Profesional** | ✅ | ✅ los que se le asignen | ✗ |
| **Administrador** | ✅ | ✅ **opcionales** | ✅ |

**LA REGLA MADRE, en piedra: EL ACCESO CLÍNICO VIENE DEL CHIP, JAMÁS DEL CARGO.**

De ahí salen los dos casos que el selector excluyente rompía y este no:

1. **El dueño que además atiende** (el caso más frecuente del mercado: la
   clínica chica donde el dueño ES el veterinario, y el precedente del negocio
   unipersonal que ya vive en A3). Se marca **administrador** y se le tilda el
   chip **vet**. No tiene que elegir entre ser el negocio y ser el profesional.
2. **El administrador que no atiende** (un socio, un gerente, un familiar que
   lleva la caja). Se marca **administrador SIN ningún chip**: administra el
   negocio y **no lee una sola historia clínica**. Si el cargo diera acceso
   clínico, sería exactamente el agujero que D-464 cerró en S73 — reabierto por
   la puerta de la administración.

**Reconciliación con el motor vivo, sin migración de reconciliación:** las 14
policies de S73 gatean por `empleado_tiene_rol`. El chip ES ese rol. Recepción
se nombra en el motor y **no recibe chips** — es el piso, y por eso no lee
expediente clínico. La letra no pelea con la RLS: la describe.

> **VERIFICACIÓN CONTRA EL CÓDIGO (S74-A, pedido de mesa sobre la pregunta de
> mapping de B) — LA CONCLUSIÓN SOBREVIVE, LA PREMISA ERA FALSA (L-158):**
> la lectura de mesa decía *"las 14 policies la nombran explícitamente"*.
> El literal: **`policies_que_nombran 'recepcion'` = CERO**. Las 14 llaman a
> `user_acceso_clinico_a_mascota`, y su body gatea con
> `empleado_tiene_rol(pe.prestador_id, ARRAY['dueño','profesional'])` — **el
> motor clínico habilita por PRESENCIA de dueño/profesional y jamás menciona
> recepción.** Consecuencia: **conceder la fila `recepcion` a todos al entrar
> NO toca las 14** (no la miran) — *la conclusión de mesa es correcta y no
> hay migración de reconciliación*, pero por una razón distinta a la
> declarada.
> **Y hay un argumento VIVO que confirma que la fila debe CONCEDERSE y no
> deducirse:** la única función de todo `public` que nombra `recepcion` es el
> lector de contacto de la visita construido hoy
> (`obtener_contacto_reserva_cita`, gate
> `ARRAY['dueño','profesional','recepcion']`) — **habilita por PRESENCIA**.
> Si recepción fuera un piso implícito (sin fila), ese lector **rebotaría a la
> recepcionista**, que es exactamente el caso para el que nació. El CHECK de
> la hija ya admite el valor (`rol = ANY (dueño, profesional, recepcion)`);
> hoy hay **0 filas `recepcion`** (solo 5 `dueño`), así que conceder el piso
> es alta de filas, cero cambio de policies.
> **El dueño del backfill ES el titular — literal, no inferencia:** en las
> 5 filas `dueño` de la hija, `prestador_empleados.user_id = prestadores.user_id`
> en **5/5**.

## 3. El vocabulario — por qué "profesional" y no "especialista"

**La palabra `especialista` queda PROHIBIDA como nombre de nivel de acceso.**
`MODELO_PRESENCIA` §5 y §6 ya la comprometieron: la plataforma **jamás estira
una credencial** (registro veterinario ≠ especialista en cirugía) y el
vocabulario verificado/certificado/destacado es preciso y no intercambiable. Si
"especialista" nombra un cargo administrativo, la misma palabra dice dos cosas
— un nivel de acceso y una credencial que nadie verificó. Es el error de
una-palabra-dos-significados (precedente `'otro'`, S72).

**`trabajador` también queda fuera:** describe una relación laboral, no lo que
la persona hace, y suena a subordinado en un producto cuya tesis es *"quiero
que sientan que es suyo"*.

**Queda `profesional`** — describe exactamente a quien presta un servicio.
Voz de producto: tuteo neutro (L-148), es+en de nacimiento.

## 4. EL TITULAR — quién es, y por qué no necesita candado técnico

**Decisión founder S74:** el titular es **quien crea la cuenta**, y su alta
**no nace de un formulario**: el onboarding del dueño (o de la persona que él
delegue) se hace **curado inicialmente por alguien del equipo de e-PetPlace**,
con un sistema de validación de identidad más potente a construir después.

Consecuencias, las tres:

1. **El candado "no puede quedar el negocio sin titular" deja de ser urgente en
   la superficie**: nadie se auto-nombra titular desde una pantalla. La mesa
   proponía un irreducible técnico; la curaduría humana lo hace innecesario en
   v1.
2. **El titular no se quita desde la app.** Los administradores son poderosos y
   removibles; el titular no aparece como opción del selector.
3. **El problema del mail NO bloquea el alta de dueños** (el alta es manual) —
   bloquea SOLO las invitaciones a empleados. Que es exactamente el caso que el
   founder ejerció en campo.

**Hueco declarado — D-510: LA SUCESIÓN DEL TITULAR.** Qué pasa cuando el
titular vende la clínica, se retira o muere. Hoy no hay camino. No es de esta
sesión ni de la próxima; se declara para que no aparezca como sorpresa el día
que un negocio real cambie de manos.

## 5. La sección EQUIPO — qué hace, y quién la ve

**Solo el administrador la ve.** La celda vive en NEGOCIO y **se oculta por
AUSENCIA, jamás por candado** (no se muestra deshabilitada a quien no puede: no
existe para él).

Lo que hace, dictado del founder: **abrir · agregar · cambiar rol o permisos ·
eliminar.**

Cuatro reglas de superficie:

1. **El aceptado sin rol PRESIDE la lista**, con su acción al lado (enmienda de
   mesa ya incorporada al boceto). Sin eso, el flujo de dos pasos fabrica gente
   activa en el negocio que no ve nada y de la que nadie se entera. *Nota bajo
   este modelo: ya no ve "nada" — ve el piso de recepción. Pero sigue
   presidiendo hasta que alguien decida qué es.*
2. **El flujo de dos pasos NO se tira.** Sigue siendo el camino legítimo cuando
   se invita a alguien y todavía no se sabe qué va a hacer. Lo que se agrega es
   poder elegir el rol AL invitar, no reemplazar un camino por otro.
3. **Invitar un mail que ya pertenece a la cuenta LO DICE** — no crea una
   invitación fantasma. (Hallazgo de campo: el founder se invitó a sí mismo.)
4. **Quitar un rol a alguien que está trabajando:** lo ya escrito QUEDA (el
   expediente es append-only, jamás se borra ni se desfirma); el acceso se
   pierde de ahí en adelante. Se decide ahora, no el día que pase.

## 6. EL AVISO ANTES DE CONFIRMAR ADMINISTRADOR

Dictado del founder: al asignar el rol de administrador, **un mensaje aclarando
qué gana esa persona** — datos del negocio, asignar y eliminar empleados, etc.

> **✅ FIRMADO (S74) — EL LITERAL, DEPOSITADO (llegó pegado tras el freno):**
>
> **es:**
> ```
> Vas a darle el rol de administrador a {nombre}.
>
> Con este rol va a poder:
> · Ver los ingresos, la facturación y las liquidaciones del negocio
> · Invitar, cambiar de rol y desvincular a otras personas del equipo
> · Editar los datos y la configuración del negocio
>
> No va a poder nombrar a otros administradores: eso solo puedes hacerlo tú.
>
> [Cancelar]  [Sí, dar el rol]
> ```
>
> **en:**
> ```
> You're about to give {nombre} the administrator role.
>
> With this role they'll be able to:
> · See the business's income, billing and payouts
> · Invite, change roles and remove other people from the team
> · Edit the business's details and settings
>
> They won't be able to name other administrators: only you can do that.
>
> [Cancel]  [Yes, give the role]
> ```
>
> **NOTA DE OFICIO QUE VIAJA CON EL STRING:** el botón dice **"dar el rol"**,
> jamás *"hacerla administradora"* — **el género no se resuelve desde un
> nombre** (la voz de producto no lo infiere; misma disciplina de L-148 sobre
> el acento). En inglés, `they` por la misma razón. La enumeración **cierra
> con lo que el rol NO puede** (§10.2: solo el titular nombra administradores)
> — el consentimiento informado se completa diciendo también el límite.

**Va ANTES de confirmar, jamás después.** Es consentimiento informado, no un
cartel: la superficie enumera con todas las letras lo que se está entregando
(la plata, la gestión, el equipo, y los chips si los tiene), y recién entonces
el administrador confirma. Mismo espíritu que la cura de gate de S73 (el
Confirmar apagado que dice QUÉ FALTA): la superficie no deja que alguien
entregue poder sin haber leído qué poder es.

## 7. LA INVITACIÓN — el hallazgo de campo y las dos vías

**Hallazgo del founder, S74:** se auto-invitó desde la pantalla de equipo y **no
llegó nada**.

**Hipótesis de mesa, en verificación (D-508 🔴):** no falló el envío — **nunca
hubo envío**. `MODELO_NOTIFICACIONES` es v0 semilla (capas 1–3 diseñadas, cero
construido), así que es probable que no exista ningún productor de email en el
stack. Si se confirma, el 🔴 **no es por la funcionalidad faltante: es por la
superficie que afirma "invitación enviada" cuando no ocurrió nada** — L-139 en
la cara del usuario, no en un lector.

> **VERIFICADA Y CONFIRMADA el mismo día (S74-A, solo lectura):** cero
> productor de email en todo el stack; `crear_empleado_directo` inserta y
> nada más (handshake al próximo login). **Y un segundo hallazgo que la
> hipótesis no tenía:** el wrapper no lee el `ok:false` del jsonb, así que
> los cuatro rebotes suaves del RPC viajan como ÉXITO — el founder vio
> éxito de un REBOTE (su email ya es prestador activo). Literal completo
> en D-508.

**Las dos vías, dictado del founder:**

1. **Por correo** — cuando exista el productor.
2. **Compartir link** — con **copiar** y con **compartir nativo** (WhatsApp
   incluido). **El share sheet del sistema operativo NO requiere Meta ni WABA**:
   el papeleo pendiente es para mensajería automatizada de la plataforma, que
   es otra cosa. El link está a un botón de distancia y **probablemente es lo
   único que funciona hoy**.

### 7.1 LOS CUATRO CANDADOS DEL LINK (en piedra)

Un link se reenvía; un mail no. Si un link de invitación se reenvía a otro
chat, **entra el que lo abra**.

1. **Vence: 48 HORAS** — ✅ FIRMADO por el founder S74, que **bajó** la
   propuesta de mesa de 72 h. *(Cuanto más corta la ventana, menos vida
   tiene un link reenviado.)*
2. **Un solo uso.** El primero que lo abre lo quema.
3. **Cancelable.** Hoy la invitación NO tiene cancelación (declarado por B en
   S74) — con links, eso pasa de incomodidad a **bloqueante**.
4. **EL ROL ADMINISTRADOR JAMÁS VIAJA EN UN LINK.** Se asigna adentro de la
   app, sobre la lista, mirando a quién. El link invita; **el poder se da
   mirando**. Un chip de grooming filtrado es molesto; un administrador
   filtrado es la contabilidad del negocio en manos de un desconocido.

### 7.2 El registro de auditoría

Cada invitación guarda **quién la mandó, cuándo, con qué rol y por qué vía**.
Sin eso, el día que aparezca en la lista alguien que el dueño no reconoce, no
hay forma de saber cómo entró. Es el mismo principio de procedencia del
Bio-Expediente, aplicado al acceso.

## 7bis. EL MOSTRADOR — decisión FIRMADA del founder (S74, 22 Jul 2026)

**Verbatim del founder: *"por ahora dejémoslo visible."***

**El contexto que la decisión resuelve (relevado con literal, S74-A):** la
entrada del mostrador se gatea **por SERVICIO ACTIVO DE VET**
(`(tabs)/index.tsx:906` con `oficiosActivos?.vet`, computado en `:602` como
*"la oferta vet tiene algún servicio activo"*) — **NO** por `prestadores.tipo`
(el eje muerto D-487 **no** aparece: el mostrador no lo resucita), **NO** por
rol, **NO** siempre. **Hoy, de hecho, solo lo ve el titular**, porque la app no
deja entrar a nadie más (D-512). **El día que D-512 se cure, el mostrador queda
visible para TODOS los roles sin escribir una línea** — incluido el piso
(recepción).

**LA DECISIÓN: eso es lo QUERIDO, y se deja así.** Es coherente con el modelo:
**recibir es el trabajo de recepción**, y el mostrador es su puerta (§5 de la
casa del prestador: *el mostrador vive en HOY porque HOY acciona*). **No hace
falta gate de rol acá.**

> **POR QUÉ ESTO SE ESCRIBE (y no se deja como "se ve solo"):** sin esta línea,
> **S75 leería la ausencia de gate como un descuido y le pondría uno que el
> founder no pidió** — el modo de fallar del JSDoc mentiroso, al revés: no una
> prosa que miente, sino un silencio que se lee como error. **Lo que no está
> escrito se "corrige".**
>
> **Nota de alcance (mesa):** *recibir sin cita NO es exclusivo de vet* — un
> groomer también tiene walk-ins. **v1 es vet** porque el mostrador construido
> desemboca en consulta clínica; el día que se generalice, **el gate correcto
> sigue siendo "tiene el oficio X activo", jamás el tipo de negocio.**

## 8. Lo que este modelo JAMÁS hace

Acceso clínico por cargo administrativo · roles que se auto-asignan desde una
pantalla · links de invitación eternos, reutilizables o irrevocables · el rol
de administrador entregado sin que el que lo entrega lea qué entrega · borrar
lo que un profesional escribió cuando se le quita el rol · una superficie que
afirma haber enviado algo que no se envió.

> **CONTRASTE CONTRA `MODELO_PRODUCTO` §8, CORRIDO AL FIRMAR (regla de la
> casa: toda letra nueva se contrasta antes de proponerse) — CERO ROCE, con
> cuatro puntos que la letra CUMPLE de forma activa:**
> **§8.1** (*la mascota es dueña de su vida documentada; e-PetPlace es
> facilitador y guardián, no propietario*) — la letra reparte **acceso**,
> jamás propiedad: el chip habilita LEER, y **quitar un rol no borra ni
> desfirma nada** (§5.4, append-only) · **§8.6** (*hitos privados del humano,
> inviolables*) — **ningún rol los alcanza**: `BIO_EXPEDIENTE` A3.5 los deja
> fuera de toda vista de prestador, y esta letra no abre esa puerta ·
> **§8.8** (*datos sensibles con consentimiento explícito, sin defaults
> opt-in ocultos*) — es el fundamento del **aviso ANTES de confirmar
> administrador** (§6: consentimiento informado, con la enumeración de lo que
> se entrega **y su límite**) y de que **el handshake no se elimine sino que
> se posponga** (D-514: activar por wrapper es fixture de gate, jamás camino
> de producto — un dueño no mete gente en su negocio sin que acepte) ·
> **§8.3** (*no sponsoreo en recomendaciones*) — la letra no toca
> recomendación ni urgencia. **Sin roce que declarar.**

## 9. Las deudas que esta letra abre o toca

| Deuda | Qué |
|---|---|
| **D-508 🔴** | La invitación no se envía (hallazgo de campo). El rojo es por la superficie que miente, no por la función faltante. En verificación por A. |
| **D-509** | El link de invitación con sus cuatro candados + el registro de auditoría. |
| **D-510** | La sucesión del titular (§4). Sin fecha. |
| D-486 | El DROP del rol legacy congelado — se cruza con este modelo cuando dispare. |
| D-485 | La mitad familia. No la toca: este modelo es del lado NEGOCIO. |

## 10. ✅ LAS TRES, CONTESTADAS POR EL FOUNDER (S74 — la firma)

1. **El vencimiento del link** → **48 HORAS** (bajó la propuesta de mesa de
   72). Rige el candado 1 de §7.1.
2. **¿El administrador puede invitar administradores?** → **NO: SOLO EL
   TITULAR entrega ese nivel.** La mesa proponía que sí; el founder cerró al
   revés. **Consecuencia coherente con §4** (el titular no se quita desde la
   app y no aparece en el selector): *el nivel que gobierna la plata y el
   equipo lo entrega quien es dueño del negocio, y nadie más* — y con §7.1.4
   (el rol administrador jamás viaja en un link), el poder queda entregado
   **mirando y por el titular**.
3. **El contenido literal del aviso de §6** → **FIRMADO y DEPOSITADO en el
   par es+en** (ver §6). **Nota de oficio:** el botón dice **"dar el rol"**,
   jamás *"hacerla administradora"* — el género no se resuelve desde un
   nombre. **Registro del proceso:** el literal **no viajó en el paquete que
   ordenó depositarlo** y el **freno L-142 rigió — correctamente, por QUINTA
   vez en la sesión**; llegó pegado en el paquete siguiente y se depositó sin
   inventar una sola palabra (L-141). *El error fue de la mesa, no del freno.*

## Historial

- **ENMENDADA §1-§2 (S76, 24 Jul 2026 — `LETRA_RECEPCION_S76` FIRMADA):** el
  **selector de tres muere y pasa a dos toggles independientes** (Administrador +
  Prestador); recepción deja de ser opción del selector y pasa a ser la AUSENCIA
  de los dos (*"la puerta no pregunta lo que ya sabe"*). `profesional` se vuelve
  derivado (tiene ≥1 chip). Los dos ejes y la ley madre "el acceso clínico viene
  del CHIP" quedan intactos — cambia la CARA, no el modelo. La enmienda se
  DEPOSITÓ como bloque en §2, sin reescribir el original (registro del modelo
  S74). **PENDIENTE (freno L-142): §6 — el par es+en del aviso de administrador
  gana su segunda pata** (la asimetría S76: no nombra nuevos administradores /
  no toca a los existentes, incluido él); su literal FIRMADO viaja por mano del
  founder y §6 NO se toca hasta entonces. Detalle: `LETRA_RECEPCION_S76` §1/§5.
- **✅ FIRMADA (S74, 22 Jul 2026):** el founder contestó los tres puntos del
  §10 — **link a 48 h** (bajó de 72) · **solo el TITULAR nombra
  administradores** (la mesa proponía que el administrador también) · el
  **string del aviso FIRMADO** con la nota de oficio del botón ("dar el rol",
  no "hacerla administradora"), **cuyo literal no viajó y queda declarado
  como hueco** (L-142). **Disparo ejecutado:** `PORTAL_PRESTADOR` §14 →
  LETRA_EQUIPO **v2** (doc a v1.4).
- **borrador (S74, 22 Jul 2026):** dictado del founder (el selector de tres, el
  piso de recepción sin chips, los chips acumulables por servicio, la sección
  equipo con sus cuatro acciones solo para administrador, el aviso antes de
  confirmar administrador, las dos vías de invitación con link compartible, el
  titular curado por el equipo de e-PetPlace) + mejoras de mesa (administrador
  CON chips opcionales para no romper el dueño-que-atiende ni abrir el
  expediente al gerente, `profesional` en lugar de `especialista` por el
  compromiso de MODELO_PRESENCIA §6, los cuatro candados del link, el registro
  de auditoría, la regla del rol quitado a alguien que está trabajando, y la
  sucesión del titular como hueco declarado). Enmienda PORTAL_PRESTADOR §14
  (LETRA_EQUIPO v1 → v2) al firmarse.
