# S74-B · BOCETO M1-M5 — EL DELTA DE ROLES sobre la ventana de equipo

> **M1, primero lo primero: este boceto se dibuja contra
> `docs/LETRA_ROLES_EQUIPO_S74.md` que está en BORRADOR, SIN FIRMA DEL
> FOUNDER** (su propio encabezado lo declara; L-164/L-165: no se declara
> firmado lo que no lo está). Todo lo de abajo queda condicionado a esa
> firma. **Es un DELTA sobre lo construido hoy** (`fa83e5d` boceto +
> `b20aa1f` construcción, APTO por vara): qué cambia, qué se conserva,
> qué muere. **CERO código hasta que pase la vara de A.**

## 0 · Conserva / cambia / muere

**SE CONSERVA (pasó vara, el modelo no lo toca):** la superficie única
NEGOCIO → Equipo · la FIRMA con `LogoNegocio` · la lista con Celda por
miembro · el aceptado-sin-rol PRESIDIENDO (E1 — con voz nueva, §6 abajo)
· el flujo de dos pasos como camino legítimo (letra §5.2) · desvincular
22c con la verdad del motor · la puerta por ausencia de la celda ·
equipo-de-1 · la derivación es-dueño del wrapper (pasa a ser
es-administrador — mismo mecanismo, el rol que gatea cambia).

**CAMBIA:** la Hoja del miembro (de 2 interruptores → selector de tres +
chips) · la Hoja de invitar (gana rol-de-entrada opcional + la vía link
+ la voz de la verdad del handshake) · la voz del sin-rol (dejó de ser
limbo: es el piso).

**MUERE:** los 2 `Interruptor` por rol (un rol dejó de ser un binario
suelto: es un punto en un modelo de dos ejes — mantener interruptores
sería sincronizar a mano lo que el selector dice solo) · la voz
`equipo.rolesAyuda` actual (describía el modelo viejo
profesional/recepción como pares) · **la mentira de la invitación**: la
voz que sugiere envío — D-508 CONFIRMADA: cero productor de email; la
superficie que afirma enviar es L-139 en la cara del usuario.

**HALLAZGO QUE ME TOCA (cura comprometida en este delta):** mi decisión
v1 "el Json del RPC no se interpreta" (`equipo.ts`, `63dabe7`) hizo que
los 4 rebotes suaves de `crear_empleado_directo` viajen como ÉXITO — el
founder vio éxito de un REBOTE (literal en D-508). En el delta, el
wrapper LEE el `ok:false` del jsonb y lo tipifica; el caso "ya está en
la cuenta" (§5.3 de la letra) sale gratis de ahí: el RPC YA rebota
suave — faltaba escucharlo.

## 1 · La superficie de asignación (Hoja del miembro, v2)

```
[nombre del miembro]
── ¿Qué hace en el negocio? ──
( Recepción )( Profesional )( Administrador )   ← selector de TRES,
                                                  selección única.
                                                  "Administrador" SOLO
                                                  existe para el TITULAR
                                                  (§10, cerrada founder)
── Sus servicios ──                             ← SOLO si profesional
[grooming] [veterinaria] [paseo] [adiestram.]     o administrador
── (administrador) ──
"Va a ver la plata, la gestión y el equipo…"    ← el AVISO §2, ANTES
[ Confirmar administrador ]                        de confirmar
── ─────────── ──
[ Quitar del equipo ]                            ← 22c, se conserva
```

- **Selector de tres:** `SelectorOpcion` radiogroup (elegir un VALOR —
  su trabajo del diccionario; 3 opciones, `acento="oficio"`).
- **Chips de oficio:** `SelectorOpcion multiple` — los chips son LEGALES
  exactamente acá (Ley 19.3: multi-selección donde varios o ninguno es
  legal). Acumulables: grooming + vet a la vez.
- **¿Cómo se VE que administrador puede tener chips y recepción no?**
  Por EXISTENCIA, no por candado (Ley 23 + §5 de la letra: ausencia,
  jamás deshabilitado): con **Recepción** elegida la sección "Sus
  servicios" **NO SE DIBUJA** — recepción es el piso y no hay nada que
  sincronizar; con **Profesional** o **Administrador** la sección
  aparece (en administrador con la voz "opcional" en el header de la
  sección). Cambiar a Recepción con chips puestos: el aviso dice que
  los chips se quitan (el acceso clínico muere de ahí en adelante — lo
  escrito queda), y confirma.
- **Profesional con CERO chips — CERRADA (la mesa votó con el boceto,
  pase S74):** profesional sin servicios ES recepción, y **el Confirmar
  exige ≥1 chip DICIENDO el porqué** ("Sin servicios asignados, es
  recepción."). Fundamento firmado por mesa: es el corolario de la Ley
  23 del founder — **la puerta no acepta un estado que después va a
  renombrar sola**; la auto-degradación muda es magia, y la magia se
  vuelve confusión el día que acierta mal.
- **Titular:** NO aparece en el selector (letra §4: no se quita desde la
  app, nadie se auto-nombra). Su fila muestra `Insignia` "Titular" y la
  Hoja no ofrece controles — como hoy el dueño.

## 2 · El aviso ANTES de confirmar administrador (letra §6)

Al elegir "Administrador" en el selector, el bloque de confirmación
ENUMERA con todas las letras — mismo espíritu que mi Confirmar-que-
enumera de S73 (`276140d`), pero al revés: allá decía qué FALTA, acá
dice qué SE ENTREGA:

> *"{{nombre}} va a poder: ver la plata del negocio · gestionar el
> negocio · invitar y quitar gente del equipo{{y sus chips, si los
> tiene: · atender {{servicios}}}}."*
> `[ Confirmar administrador ]`

Consentimiento informado, no cartel: el rol NO se escribe al tocar el
selector — se escribe al Confirmar, y solo el de administrador lleva
esta pausa (recepción/profesional confirman directo: entregar menos no
exige leer tanto). **El string literal del aviso se firma con su gate
(letra §10.3)** — el de arriba es propuesta.

## 3 · La invitación — rol de entrada + las dos vías (estado por vía, según veredicto de A)

**Hoja de invitar v2:** Nombre + Correo (como hoy) + **el rol, opcional**
— selector de tres con **"Elegir después" como PRIMERA CLASE** (el flujo
de dos pasos NO se tira, letra §5.2: invitar sin saber todavía qué va a
hacer es camino legítimo). **El rol ADMINISTRADOR NO aparece en la
invitación** (candado 4: el poder se da adentro de la app, mirando la
lista — ni en el link NI en el correo viaja; se asigna cuando la persona
ya está en la lista).

**Vía 1 — correo: NO SE DIBUJA COMO SI FUNCIONARA.** D-508 CONFIRMADA
por A (cero productor de email). **ENMIENDA S74-B (verificación por
comportamiento, pedido de mesa): el "handshake al próximo login" TAMPOCO
existe** — cero consumidores de aceptar/rechazar/marcar, cero triggers,
cero edge: la fila queda `activo=false` para siempre. La invitación HOY
solo REGISTRA. La voz vigente dice esa verdad angosta (*"La invitación
queda registrada a ese correo. Todavía no le llega sola…"* — string
final a gate) y **el handshake sube a PEDIDO DE MOTOR BLOQUEANTE
(§9.6)**: sin él la invitación no sirve por NINGUNA vía — ni mail, ni
link. La escalera de voces cuando el motor llegue: registrada → se une
al entrar (handshake) → le enviamos (productor de email).

**Vía 2 — LINK (copiar + compartir nativo):** el share sheet del SO no
requiere Meta ni WABA. **Bloqueada por motor** (D-509: el token con sus
cuatro candados no existe) — en v1-delta la fila del link se dibuja SOLO
cuando el motor llegue (Ley 23: no se ofrece lo que no existe). El
boceto la deja dibujada para la vara: `[ Copiar link ]` +
`[ Compartir ]` (share nativo) bajo el correo, con la voz de los
candados ("El link vence en 72 h y sirve una sola vez.").

## 4 · Los tres casos de la letra §5 (hoy no existen)

| Caso | Qué hace la superficie | Qué exige |
|---|---|---|
| Invitar un mail que YA está en la cuenta | **LO DICE**: *"{{correo}} ya es parte de tu equipo."* — cero invitación fantasma | SOLO el wrapper (leer el `ok:false` del jsonb — el RPC ya rebota suave; mi cura comprometida) |
| Cancelar una invitación | La fila de invitación pendiente gana su acción (19.7: fila tapea → Hoja con "Cancelar invitación", 22c) | **MOTOR (pedido)**: no existe productor de cancelación; con el link es BLOQUEANTE (candado 3) |
| Quitar un rol a alguien que trabaja | La confirmación DICE la verdad del motor: *"Lo que {{nombre}} escribió queda en el expediente. Desde ahora no puede {leer lo clínico / administrar}."* | El motor YA lo soporta (DELETE de la hija no toca lo escrito — procedencia §14.1); es VOZ, no motor |

## 5 · El aceptado-sin-rol — la voz nueva (dejó de ser limbo)

Sigue PRESIDIENDO (E1 intacta). Pero bajo este modelo ya no ve "nada":
**ve el piso de recepción**. La voz de su fila cambia:

- Muere: *"Sin permisos todavía — asigna un rol"* (describía un limbo).
- Nace: *"Ya trabaja como recepción — elige qué más hace"* (es alguien
  útil en el mostrador desde el minuto uno; presidir sigue siendo
  correcto: alguien tiene que decidir qué ES).

## 6 · Las 7 preguntas §1c (sobre el delta)

1. **Trabajo:** elegir un valor (selector de tres → `SelectorOpcion`
   radiogroup) · multi-selección legal (chips → `SelectorOpcion
   multiple`) · comando con consecuencias (Confirmar administrador,
   quitar rol, cancelar invitación → 22c) · estado pasivo (Titular →
   `Insignia`).
2. **¿Ya existe?** Todo — CERO componente nuevo. Los `Interruptor`
   actuales MUEREN (su trabajo desapareció con el modelo).
3. **¿La casa recorrida?** El selector de tres habla el idioma del menú
   vet (revelación por elección); los chips, el de los 7 días del plan
   (multi legal); el aviso, el del Confirmar-que-enumera del Durante.
4. **Tesis (la del delta):** *"el acceso se entrega mirando: qué cargo,
   qué servicios, y qué poder estás firmando."* Firma: **el aviso que
   enumera** — la pausa antes del poder (comportamiento, no color).
5. **Capa/dosis:** prestador, dosis baja, acento oficio. Cero color
   nuevo.
6. **Temas/es-en/estados:** abajo. Memorial no aplica.
7. **Chanel:** no se dibuja "titular" como opción (§4) · no se dibuja
   la vía correo como envío (D-508) · no se dibuja el link sin motor
   (D-509) · recepción sin sección de chips (existencia, no candado) ·
   el aviso SOLO en administrador.

## 7 · Estados declarados

- Selector sin elección (miembro sin rol): nada pre-marcado — la
  elección es del administrador, jamás un default silencioso.
- Confirmar administrador: cargando en el botón (receta S62), error con
  voz que dirige.
- Cambio que QUITA acceso (a recepción, o quitar chip): la confirmación
  dice qué se pierde y qué queda (§4 fila 3).
- Invitación pendiente en la lista: como hoy + su acción de cancelar
  (cuando el motor llegue; hasta entonces la fila dice el estado sin
  acción — Ley 23).
- Error de escritura: voz existente `equipo.errorEscritura`.
- es/en: todas las keys nuevas en par (Espejo).

## 8 · M4 — contrato de datos del delta

**Se renderiza (nuevo):** el rol como UNO-de-tres (derivado de la hija:
administrador > profesional-con-chips > piso) · los chips por miembro
(filas de oficio de la hija) · la vía de la invitación cuando la
auditoría exista · el estado de invitación con su acción.
**Se descarta a propósito:** el jsonb crudo del RPC (se TIPIFICA, jamás
se muestra) · `asignado_por/en` (auditoría de motor, no UI v1 — la
auditoría de INVITACIÓN sí es pedido §9.4, pero su cara es v2) · el
token del link (JAMÁS visible como dato — solo el botón que lo copia).

**Mapping motor→selector (pedido de aclaración a A, L-141):** hoy la
hija tiene `dueño`·`profesional`·`recepcion`. La letra separa TITULAR
(no asignable, §4) de ADMINISTRADOR (asignable). ¿El `dueño` vivo del
backfill ES el titular y `administrador` nace como valor nuevo? ¿O
`dueño` se renombra? El boceto asume lo primero (cero migración de
renombre); la letra de motor decide. Y bajo el modelo del piso,
`recepcion` como FILA de la hija queda en cuestión (el piso es la
AUSENCIA de chips — una fila que dice "recepción" es el rol-que-hay-que-
sincronizar que la letra mata): pregunta de motor declarada.

## 9 · PEDIDOS DE MOTOR → A (76-b, pegados y literales; CERO SQL acá)

1. **Nace el nivel `administrador`** como rol asignable de la hija
   `empleado_roles` (o el valor que la letra de motor decida tras el
   mapping del §8) — con su gate en `empleado_tiene_rol` y las policies
   que gobiernan plata/gestión/equipo re-apuntadas a él (hoy gatean por
   `dueño`).
2. **El CHECK de `empleado_invitaciones.rol` solo acepta `'empleado'`**
   (mi hallazgo S74, ratificado E4 de la vara): para el rol-de-entrada
   necesita aceptar los valores del selector — MENOS administrador
   (candado 4: jamás viaja en invitación, ni por correo ni por link).
3. **El token del link con sus CUATRO candados:** vence 72 h (propuesta
   de mesa, firma pendiente §10.1) · UN SOLO USO (el primero que lo abre
   lo quema) · CANCELABLE (hoy la invitación no tiene cancelación — con
   link es bloqueante) · **el rol administrador JAMÁS viaja en el link**.
4. **El registro de auditoría de la invitación:** quién invitó, cuándo,
   con qué rol, por qué vía (correo/link) — el principio de procedencia
   aplicado al acceso (letra §7.2; D-509 ya lo lleva enmendado).
5. **El productor de CANCELACIÓN de invitación** (caso §4.2 — sin él, la
   fila pendiente no puede ganar su acción).
6. **EL HANDSHAKE DE ACEPTACIÓN — BLOQUEANTE (enmienda S74-B, verificado
   por comportamiento):** los RPCs `aceptar/rechazar_invitacion_
   pendiente_login` existen y NADIE los llama; ninguna otra pieza activa
   al invitado. Sin un camino que consuma la invitación (al login, por
   token de link, o ambos), TODO el subsistema es una mesa sin patas —
   la invitación registra y ahí muere.

*(No es motor, es mío y queda comprometido para la construcción del
delta: el wrapper lee el `ok:false` del jsonb de `crear_empleado_directo`
y lo tipifica — la mentira de éxito-sobre-rebote muere en la frontera.)*

## 10 · LA BIFURCACIÓN — CERRADA POR EL FOUNDER (pase de mesa S74, L-152)

**¿Un administrador puede nombrar a otro administrador? NO — "(b) para
v1: solo el titular."** Decisión de v1 con su porqué, declarado: con el
link circulando y sin cancelación construida, que el poder máximo se
multiplique solo es el peor riesgo; abrirlo después es trivial, cerrarlo
cuando ya se propagó no.

Lo que la decisión fija en la superficie:

1. **El selector de rol, en manos de un ADMINISTRADOR, no ofrece
   "Administrador"** — la opción NO EXISTE para él: AUSENCIA, jamás
   opción deshabilitada (la misma disciplina que la celda de equipo con
   el no-dueño, y que los chips de recepción en §1).
2. **Solo el TITULAR ve esa opción y solo él dispara el aviso de §2.**
3. **El cuarto candado de §7.1 se REFUERZA:** el rol administrador ni
   viaja por link NI lo entrega un administrador. **Un solo camino, una
   sola mano** (la del titular, adentro de la app, mirando la lista).

**Consecuencia al pedido de motor (§9.1, enmendado):** la escritura de
la fila `administrador` en la hija se gatea por TITULAR **en el motor**
(policy/guard), no solo en la UI — una superficie que oculta la opción y
un motor que la aceptaría de cualquier administrador sería puerta de
cortesía sin cerradura (Ley 23: el server sigue siendo la autoridad).

## 11 · M5 — pasada de diccionario

Radiogroup para elegir valor ✓ · chips SOLO multi-selección legal
(19.3) ✓ · 22c en los tres comandos con consecuencias ✓ · Insignia para
Titular (19.4) ✓ · existencia-no-candado ×3 (chips de recepción, la opción
Administrador para quien no es titular — §10 cerrada —, link sin
motor) — Ley 23 ✓ · el aviso
enumera ANTES (espíritu 276140d) ✓ · Ley 3: el jsonb jamás visible ✓ ·
voseo cero, es+en en par ✓ · L-162: la Hoja de invitar sigue con campos
— captura doble en su gate ✓.
