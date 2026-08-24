# Censo para la Política de Privacidad de la app — qué datos hay y quién los toca

> **Para:** el abogado que redacta la privacidad de las aplicaciones móviles.
> **De:** el equipo técnico de e-PetPlace · **Fecha:** 24-ago-2026.
>
> **Por qué existe este documento.** La privacidad publicada hoy en el sitio
> **se excluye a sí misma de las apps** («no cubre las aplicaciones móviles»).
> Esto es el inventario de lo que las apps efectivamente recogen y de quién lo
> procesa, medido contra el sistema real.
>
> **Son dos aplicaciones distintas** y conviene tratarlas por separado: la de
> las **familias** (dueños de mascotas) y la de los **profesionales**
> (veterinarias, paseadores, peluquerías, adiestradores y sus empleados).

---

## 1. Datos personales, por dato

| dato | de quién | dónde se pide | para qué | quién lo procesa | cuánto se conserva |
|---|---|---|---|---|---|
| **Correo electrónico** | familia y profesional | pantalla de registro | es la **llave de la cuenta**: identifica, permite entrar y recuperar el acceso | Supabase (base) · **Resend** (envío) | mientras la cuenta exista; **tras cerrarla se reemplaza por un identificador sin significado** |
| **Nombre** | familia y profesional | registro / perfil | dirigirse a la persona; identificar quién invitó a quién | Supabase | ídem; se anonimiza al cerrar |
| **Teléfono / WhatsApp** | familia y profesional | perfil | contacto operativo (una visita, un pedido) | Supabase | ídem |
| **Foto de perfil** | familia y profesional | perfil | reconocimiento visual | Supabase (almacenamiento **privado**) | **se borra de verdad** al cerrar la cuenta |
| **Dirección y ubicación en el mapa** | familia (domicilio) · profesional (sede) | alta de dirección / perfil del negocio | llevar un servicio a domicilio; mostrar cobertura | Supabase · **Google Places** (al escribir la dirección) | mientras la cuenta exista |
| **Documento de identidad** | **solo profesional** | verificación del negocio | comprobar que quien ofrece un servicio es quien dice ser | Supabase (almacenamiento **privado**) · **Anthropic** (lectura asistida del documento) | ⚠️ ver §4 |
| **Datos de tarjeta** | familia | pantalla de pago | cobrar | **Nuvei/Paymentez** — ⚠️ **e-PetPlace NO los recibe ni los guarda**: guarda solo un identificador que la pasarela devuelve | los conserva la pasarela |
| **Registro de aceptación de términos** | ambos | registro | poder demostrar qué aceptó cada persona y cuándo | Supabase | **se conserva aunque la cuenta se cierre** (§5) |
| **Ubicación durante un servicio** | profesional en curso | mientras dura un paseo o una entrega | mostrarle a la familia el recorrido | Supabase | queda unido al servicio prestado |
| **Identificador del dispositivo para avisos** | ambos | al conceder permiso de notificaciones | mandar avisos | Supabase · **Google (FCM)** | mientras el dispositivo siga activo |

---

## 2. Datos de salud de las mascotas — el expediente

**Esta es la parte más sensible del producto y conviene tratarla aparte.** El
sistema guarda la vida clínica de cada mascota como una sucesión de hechos
fechados. Incluye, entre otros:

- **Vacunas** aplicadas y sus próximas dosis · **desparasitaciones**
- **Historia clínica** de cada consulta, con signos vitales y diagnóstico
- **Diagnósticos de alergias** y de **condiciones crónicas** · **medicación**
- **Recetas** · **exámenes** solicitados y sus resultados · **casos clínicos**
  abiertos y cerrados, y su transferencia entre profesionales
- **Certificados** emitidos · **emergencias** solicitadas
- **Fotos y videos** de atenciones (peluquería, adiestramiento, entregas)
- Observaciones de **comportamiento** y notas de cuidado

**Dos precisiones que conviene que el texto recoja:**

1. **Son datos de un animal, no de una persona** — pero **están asociados a la
   familia que lo cuida**, y de esa unión sí se puede inferir información sobre
   personas (domicilio, hábitos, capacidad de gasto).
2. **Cada hecho registra quién lo aportó**: si lo declaró la familia o si lo
   registró un profesional. Esa distinción está en el dato mismo.

---

## 3. Terceros que procesan datos

**Todos están fuera de Ecuador. Toda la operación implica transferencia
internacional de datos.**

| tercero | qué procesa | para qué | dónde está |
|---|---|---|---|
| **Supabase** | **todo**: base de datos, archivos, cuentas y contraseñas | es la infraestructura del producto | EE.UU. |
| 🔴 **Anthropic** | **texto de notas clínicas dictadas**, **fotos de carnets de vacunación** y **documentos de identidad de profesionales** | leer un carnet en papel y volcarlo al expediente; estructurar lo que el veterinario dicta; asistente de ayuda | EE.UU. |
| **Nuvei / Paymentez** | datos de tarjeta y monto | cobrar | regional |
| **DeUna (Banco Pichincha)** | datos del cobro | cobrar por billetera | Ecuador |
| **Resend** | correo y nombre del destinatario | mandar correos | EE.UU. |
| **Google (Firebase)** | identificador del dispositivo | mandar notificaciones | EE.UU. |
| **Google (Places)** | el texto de la dirección mientras se escribe | autocompletar direcciones | EE.UU. |
| **Google (Maps)** | ubicación mostrada en pantalla | dibujar el mapa | EE.UU. |
| **Meta (WhatsApp)** | número de teléfono | avisos por WhatsApp | EE.UU. |
| **Expo / EAS** | ninguno personal | distribuir actualizaciones de la app | EE.UU. |

⚠️ **Dos aclaraciones importantes:**
- **Meta/WhatsApp está construido pero APAGADO.** Hoy **no sale ningún mensaje**
  y ningún número se envía a Meta. Conviene decidir si el texto lo menciona
  como uso futuro o lo omite hasta que se encienda.
- 🔴 **Anthropic merece mención propia y explícita**, porque es el único
  tercero que procesa **datos de salud** e **imágenes de documentos de
  identidad**. Un texto de privacidad que liste «proveedores de infraestructura»
  sin nombrarlo estaría siendo impreciso justo en el punto más sensible.

---

## 4. Retención — qué se conserva y por cuánto

**HECHO — lo que se borra de verdad:** las fotos de perfil y los archivos
personales guardados en el almacenamiento privado.

**HECHO — lo que se conserva aunque la persona cierre su cuenta**, por decisión
ya tomada (política P15 y P23): **el registro de qué términos aceptó**, **los
registros de pagos y comprobantes**, y **los hechos del expediente de la
mascota** — porque *la mascota puede cambiar de familia y su historia le
pertenece a ella*. Todo eso queda **desligado de la persona**: sin nombre, sin
teléfono, sin correo utilizable.

**HECHO — cerrar la cuenta no destruye el registro: lo vuelve inalcanzable.**
La persona pierde el acceso, sus identidades externas se retiran y sus sesiones
se cierran. La forma honesta de decirlo es *«ya no es accesible por ningún medio
del producto»*, **nunca «fue destruido»**.

**HECHO — hay 30 días de arrepentimiento** entre el pedido de cierre y la
anonimización.

🔴 **NO RESUELTO — y es lo que más urge para este documento: NO EXISTE UN PLAZO
DE RETENCIÓN ESCRITO.** No hay definido por cuánto tiempo se conservan los
documentos de identidad de los profesionales, ni los archivos de atenciones, ni
los registros de pago. **Sin ese plazo, el sistema conserva indefinidamente**, y
el texto no puede prometer otra cosa. **Es una decisión que el abogado tiene que
fijar y nosotros implementamos.**

---

## 5. Datos de menores de edad

**HECHO — hoy la app NO recoge ningún dato de menores, y no puede.**

El modelo contempla que un menor pueda ser parte de la familia de una mascota
—para que un chico pueda ver a su perro y subir una foto— pero **esa figura no
está habilitada**: el sistema **no tiene dónde guardar una fecha de nacimiento**,
así que **no puede verificar que alguien sea menor** y por lo tanto **no se
permite invitarlo**. La invitación familiar admite **únicamente personas
adultas**.

**Lo que está previsto para cuando se habilite** (y que el texto puede anticipar
como uso futuro): el menor podría ver el perfil de la mascota, escribir
recuerdos y subir fotos; **nunca** autorizar profesionales, hacer pagos ni
cambiar configuraciones de privacidad, y recibiría solo avisos afectivos
(«mañana cumple años»), **no administrativos**.

---

## 6. Biométrico — el dato no sale del teléfono

**HECHO, y verificado en el código:** la huella o el rostro **se usan solamente
como candado local de una sesión que ya está abierta**. La aplicación **le
pregunta al sistema operativo del teléfono si la persona se autenticó y recibe
un sí o un no**. **En ningún momento el dato biométrico se envía, se guarda ni
se procesa fuera del dispositivo**, y e-PetPlace no tiene forma técnica de
acceder a él.

⚠️ La función **todavía no está activa**: el componente existe y el módulo viaja
en la aplicación, pero **la pantalla aún no se puede encender**. Conviene
redactarlo como capacidad presente y describirla con precisión, porque *lo que
importa aquí no es qué hace sino qué garantiza que no hace*.

---

## 7. Lo que este censo NO puede contestar

Se declara para que el texto no prometa lo que el sistema no cumple:

1. **El plazo de retención** de documentos, archivos y registros de pago (§4).
2. **Si hay acuerdos de tratamiento de datos firmados** con Supabase, Anthropic,
   Resend y las pasarelas. Técnicamente están integrados; **si esos contratos
   existen, no viven en el repositorio**.
3. **Quién es el responsable del tratamiento** frente a los datos que un
   profesional carga sobre una mascota que no es suya: ¿e-PetPlace, el
   profesional, o ambos? El sistema registra **quién aportó cada hecho**, así
   que la información para sostener cualquiera de las tres respuestas existe —
   **la decisión, no**.
