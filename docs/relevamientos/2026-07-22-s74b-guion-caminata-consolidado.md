# S74-B · GUION DE CAMINATA CONSOLIDADO — prestador (una sola lista)

## PASO 0 — el binario (L-160, antes de evaluar NADA)

**ENMENDADO (hallazgo del gate, L-161):** el marcador `[update]` era SOLO
`console.log` — logcat, inalcanzable sin cable. **La verificación de HOY
es la de reemplazo que te dio la mesa:** doble reinicio de la APK y
después **tab NEGOCIO → si existe la celda "Equipo", estás en el build
nuevo** (esa pantalla no existía antes de este OTA). Si la celda no
aparece tras dos reinicios, seguís en el build viejo — nada de lo de
abajo es evaluable.

*(La cura ya está construida y viaja en el PRÓXIMO OTA: el pie del tab
Cuenta va a decir `update {id} · preview` — camino literal en pantalla,
sin cable. Para este OTA el id esperado, solo si hubiera cable a mano:
android `019f8c99-f8d3-766a…`, group `dedae916…`, `embedded=false`.)*

**Qué carga este OTA (literal):** EQUIPO + FIRMA (`/negocio/equipo`, con
`LogoNegocio`) · RECEPCIÓN v1 (etapa en el detalle de mascota + "La
visita" con sus 3 casos en la cita vet) · EvitaTeclado en los TRES
cierres de oficio · todo lo S73-B del group anterior re-empacado
(dictado con autofoco+hint, Confirmar que enumera, D-488, mostrador Ley
23 + la cara, atención 3 estados, las 11 familias de voces) · las curas
del entity chip de A (E1–E3) y la primitiva LogoNegocio.
**Incidente declarado:** en el bundle viajó WIP sin commitear de A en 3
wrappers del CLIENTE (timeline/citasMascota/onboarding, cura D-497) —
módulos que ninguna pantalla del prestador ejecuta; inerte acá, declarado
para el acta.

---

## ⚠ PRIMERA VEZ — que lo sepas antes de abrirlas

**EQUIPO + FIRMA y RECEPCIÓN v1 (etapa y La visita) NO tienen captura
previa: tu mirada no es confirmación — es LA PRIMERA VEZ que esas
pantallas se ven.** Lo mismo vale para TODO estado con el teclado arriba
(el harness web no tiene teclado) y para los tres cierres con
EvitaTeclado. El resto (dictado, mostrador, atención) tiene capturas web
S73 (`scripts/capturas/s73-b-*.png`) — ahí tu ojo confirma.

---

## 1 · EQUIPO + FIRMA — ⚠ primera vez · el gate de `LogoNegocio` nace acá

**DÓNDE:** tab NEGOCIO → celda **"Equipo"** (glifo equipo) → "Tu negocio".

| QUÉ | CÓMO SE RECONOCE QUE ESTÁ BIEN |
|---|---|
| La FIRMA preside | Arriba: el **monograma** de tu negocio en caja suave (p. ej. "CA" para Clínica Aurora — contenido con aire, NO recortado a círculo), nombre comercial grande, ciudad debajo. Sin logo cargado el monograma ES la cara — no hay "subí tu logo" gritando. |
| Equipo de 1 | Tu fila con "Dueño" como subtítulo + la voz *"Tu equipo es tuyo por ahora. Invita cuando lo necesites."* — jamás un vacío. |
| Invitar (⚠ ESCRIBE) | Botón teal "Invitar a tu equipo" → Hoja con Nombre + Correo. **Con el teclado ARRIBA los campos se ven** (L-162). ⚠ Enviar CREA una invitación real por email y **v1 no tiene cancelarla** — si probás el envío, usá un correo tuyo. |
| Detalle del miembro | Tocar tu fila → Hoja: "Dueño" como insignia, SIN interruptores ni desvincular (el dueño jamás es control). |
| Desvincular (⚠ ESCRIBE) | Solo visible en un miembro no-dueño; la confirmación dice la verdad: *"pierde el acceso; lo que hizo queda en el expediente"*. Hoy no hay miembro no-dueño para ejercitarlo — se declara NO ejercitable sin sembrar datos (no lo preparé). |
| La vista del no-dueño | Exige una cuenta empleado activa — hoy hay CERO (§14.3). NO ejercitable; la voz digna (*"El equipo lo administra quien es dueño del negocio."*) queda a fe del código, declarado. |

## 2 · RECEPCIÓN v1 — ⚠ primera vez (las tres piezas)

**Pieza 1+2 — identidad con raza + ETAPA. DÓNDE:** tab Mascotas → una
mascota.
- Bajo el nombre: la etapa EN VOZ — *Primeros meses / Creciendo / Adulto /
  Con cuidado especial / Años dorados*. Se reconoce: la voz calza con la
  edad real del animal (y "Con cuidado especial" si tiene condición
  crónica, que preside sobre la edad). Sin fecha de nacimiento: no hay
  etapa y no hay hueco. La raza ya vivía en Identidad.

**Pieza 3 — LA VISITA. DÓNDE:** tab HOY → una cita de veterinaria → tarjeta
**"La visita"**. Los TRES casos:

| Caso | Camino para provocarlo | CÓMO SE RECONOCE |
|---|---|---|
| Con teléfono | Una cita vet RESERVADA (p. ej. por tu cuenta `guillo381+8`) | "Reservó" + nombre · "Teléfono" + número **con su código de país tal cual** (P21) en mono |
| Sin teléfono | El reservador vivo SIN teléfono (1 de 2 en la data real — A tiene identificada la cita) | *"No dejó un teléfono al reservar."* en voz de apoyo — NUNCA un renglón "sin teléfono" vestido de dato |
| Walk-in | Una cita nacida del MOSTRADOR (las de gates previos sirven; crear una nueva ⚠ ESCRIBE una atención real) | *"Se registró en el mostrador — sin contacto de reserva."* — ni error, ni blanco: la persona estaba enfrente |

Y la cláusula de todos: con modo avión al entrar, el bloque dice SU error
— jamás se disfraza de "sin contacto".

## 3 · Los tres cierres de oficio con EvitaTeclado — ⚠ primera vez (estado con teclado)

**DÓNDE:** el Cierre de una atención de paseo / grooming / adiestramiento
(la pantalla del "Enviar parte y cerrar").
- **CÓMO:** tocá el campo de nota del FONDO — con el teclado arriba, el
  campo y el texto SE VEN (la anatomía exacta del bug de la dosis).
- **Límite declarado:** llegar a un cierre exige una atención EN CURSO de
  ese oficio — **estado de DB que NO preparé** (escritura fuera de mi
  tanda). Si tenés jornada demo viva, usala; si no, este punto se difiere
  o la mesa siembra. Es PROPAGACIÓN de la receta ya gateada en vet — si
  la firma del patrón de casa sale distinta, estas tres se revisan.

## 4 · Lo de S73-B que sigue esperando tu ojo (capturas web existen; el teclado no)

| QUÉ | DÓNDE | CÓMO SE RECONOCE |
|---|---|---|
| La puerta del dictado | HOY → cita vet → "Iniciar consulta" | El teclado SUBE SOLO con su mic; el hint *"Para dictar, toca el micrófono de tu teclado."* JUNTO al campo; **con teclado arriba el campo se ve** (la cura 🔴) |
| El Confirmar que enumera | Dictá incompleto y estructurá | Junto a "Guardar la consulta" apagado: una línea POR falta (*"Falta el motivo de consulta." · "Falta el diagnóstico." · la de posología…*) — jamás botón mudo |
| D-488 | Salí y volvé a entrar a la consulta N veces | Siempre reconstruye con la mascota correcta, cero pantalla rota |
| Mostrador Ley 23 | HOY → "Registrar atención" → buscá tu cuenta registrada / un desconocido | Reconocido: *"Ya en e-PetPlace…"* y **SIN** botón "Registrar mascota nueva"; desconocido: el botón vuelve |
| La cara del animal | mostrador → cliente de la clínica → mascota | Su FOTO real + nombre en atención Y en cobro |
| Atención: 3 estados | La misma pantalla | Esqueleto al entrar · con modo avión: voz + "Reintentar" · el VACÍO (sin servicios prendidos) **no se reproduce sin apagar tus servicios** — captura `s73-b-atencion-vacio-cta-taller.png`; camino opcional: taller → apagar → mirar → prender |

## 5 · El lote de strings — POR FAMILIA, con su camino de disparo

Todo es+en, tuteo. Cada familia se dispara así (no es pared: es un camino
por fila):

| Familia | Camino de disparo |
|---|---|
| `equipo.*` (20 keys nuevas) | La pantalla de Equipo entera (sección 1) |
| `citaVet.visita*` (6) | La tarjeta "La visita" (sección 2) |
| `detalleMascota.etapa*` (6) | La etapa bajo el nombre (sección 2) |
| `erroresVet.*` búsqueda·alta·atención·cobro·vacuna·solicitud | Mostrador con modo avión en cada acción (buscar / registrar / cobrar / vacunar) |
| estructurar (5) · sedimento (16) | La consulta: modo avión al "Estructurar" y al "Guardar" |
| presupuesto (22) | Armado de presupuesto con modo avión al enviar |
| citaVet (2) · oferta (6) | Detalle de cita vet / taller vet con modo avión |
| `dictadoAyuda` + `dictadoCampoAyuda` | La fase de dictado (sección 4) |
| Los guards del Confirmar (5) | Dictar incompleto (sección 4) |
| `registradoTocar` (tuteo) | Mostrador con cuenta reconocida |
| Máquina de atención (cargando/error/vacío + CTA) | Sección 4, fila 3 estados |

---

**Después de este OTA: CERO publish hasta que vuelvas.** La ventana se
cerró con el group `dedae916…`.
