# S107-C · DIAGNÓSTICO CONTRA EL FLUJO FIRMADO

> **Medido el 30-ago-2026 contra el código, no contra la memoria.**
> Sin defender lo hecho: donde lo construido difiere, difiere.

---

## P1 · EL HUB `/hogar/guarderia`

| pieza de la vara | estado |
|---|---|
| chips de mascota con foto | ✅ |
| «Todavía no tenemos guarderías para gatos» | ✅ llega como `especie_sin_oferta` del server |
| botón de paquete + «te quedan 4 de 5» debajo | ✅ |
| **ubicado BAJO los chips** | ✅ y por la razón de la vara: con >1 mascota, arriba no tendría sujeto |
| chips Próximas/Historial · lista o vacío · pie | ✅ |

**Sin brecha.**

---

## P2 · MODALIDAD Y DÍA `/explorar/guarderia`

| pieza | estado |
|---|---|
| sin chips de mascota, nombre bajo el título | ✅ |
| selector Día · Paquete · Mensual, **Día preseleccionado** | ✅ **hoy** — la compuerta se abrió a las tres |
| nunca HOY | ✅ la tira arranca mañana |
| Día: nada más | ✅ |
| Paquete: chips de tamaño **sólo los que el catálogo vende** | ✅ **hoy** — antes ofrecía 5·10·15 y el lugar vende 5·10 |
| requisitos con estado real + carnet en fila blanca con chevron | ✅ |
| pie: precio (el del lugar, «desde $X» si hay varios) + botón | ✅ **hoy** — el precio del paquete se mudó del chip al pie |
| causa exacta arriba, visible sin tocar el botón | ✅ |

### 🔴 DOS BRECHAS

**① «Cada día mostrando su estado SIN TOCARLO».** Hoy los 14 días se ven
**iguales**: el que no abre y el ya reservado sólo se distinguen **después** de
tocarlos. Medido tocándolos uno por uno: `sun 30` y `sat 5` apagan el botón con
*«No daycare near you is open that day»*; los cinco hábiles lo habilitan.

*Es candidato serio a por qué el founder nunca pudo reservar: si el primer día
que toca cae en fin de semana, ve un botón apagado y no vuelve.*

⚠️ **A publicó `obtenerDiasGuarderia`, que trae exactamente `reservable` y
`motivo` por día — pero es POR PRESTADOR**, y en P2 todavía no hay lugar
elegido. **Sirve entero para el camino corto** (ahí el lugar lo determina el
bono) y **no alcanza para el caso general**.

**② La mensualidad no dice su letra.** Falta el texto que declara que **el plan
corre de lunes a viernes** y que **se cobra ese mismo día cada mes hasta
cancelar**. *Una recurrencia que no se declara antes de contratar es la clase de
cosa que se descubre en el segundo cobro.*

---

## P3 · QUIÉN PUEDE `/explorar/guarderia/disponibles`

| pieza | estado |
|---|---|
| portada · nombre · línea de confianza | ✅ `PreviewPrestador`, la pieza de las cuatro hermanas |
| **el precio DE ESE prestador para la modalidad elegida** | ✅ `precioModalidad`, resuelto por el server — no un «desde» repetido |
| cupo de ese día · las dos ventanas de ese día | ✅ |

**Sin brecha.**

---

## P4 · EL PRESTADOR `/explorar/guarderia/[prestadorId]`

| pieza | estado |
|---|---|
| 🔴 **SIN CALENDARIO** | ☠️ **BORRADO HOY, entero.** 643 → 546 líneas |
| vitrina completa · mapa de zona (rango, jamás el punto) · dos ventanas | ✅ |
| pie fijo con precio y botón de pagar | ✅ |

### BRECHAS

**① «Lo que incluye» NO EXISTE.** Cero ocurrencias. *Y no tiene fuente medida:
ninguna columna del lugar la trae.*

**② El botón no nombra el acto completo.** Hoy dice «Comprar 5 estadías»; la
vara pide **«Comprar 5 estadías y agendar este día»** y **«Contratar plan
mensual desde el 8 de septiembre»** — *con la fecha adentro*.

**③ El rating queda FUERA, por la regla de la propia vara.** Censado: el único
rating de la casa vive en `FichaRepartidor`, que es de despensa y no es pieza
compartida de prestadores. **No existe ⇒ no se construye.**

---

## P5 · DOCUMENTOS

| pieza | estado |
|---|---|
| UNA sola casilla con enlace a leerlos completos | ✅ **hoy** |
| jamás pre-marcada, con texto accesible completo | ✅ |
| contacto de emergencia OPCIONAL | ✅ **hoy** — medido: `p_contactos` acepta `NULL` |
| sin tope de gasto | ✅ en pantalla · 🔴 **el motor todavía lo exige** |

🔴 `aceptar_documentos_guarderia` rebota `tope_de_urgencia_invalido` **con
`NULL` y con `0`**. *No hay puente honesto: cualquier número que mande la
pantalla sería una autorización que la familia no dio* (P23).
⇒ `S107-C-PEDIDO-A-A-UNA-SOLA-ACEPTACION.md`. **Hasta que A lo afloje, aceptar
rebota.**

---

## P6 · CHECKOUT

| pieza | estado |
|---|---|
| Día → `CheckoutReserva`, «Todo el día» | ✅ |
| **Paquete → checkout** | 🔴 **NO PASA**: compra y agenda con dos llamadas directas y vuelve al hub |
| **Mensual → checkout** | 🔴 no existe (sin wrapper de contratación) |
| el checkout dice QUÉ se cobra: un día · el paquete entero · el primer mes con su recurrencia | 🔴 sólo el día |

⚠️ **Y hay una tensión real que la mesa decide, no yo:** hoy el bono nace
`estado_pago='pagado'` con `pago_simulado: true` y **la pantalla lo dice**.
Meter el paquete en el checkout **exige que el cobro pase por el riel de
pagos** — no es mover una pantalla.

---

## EL CAMINO CORTO

| pieza | estado |
|---|---|
| desde el hub, directo a la tira de días **de esa guardería** | ✅ **hoy** — antes iba a la pantalla del prestador, que ya no tiene calendario |
| sin elegir lugar y sin pagar | ✅ |
| con >1 mascota, pregunta a cuál | ✅ por los chips del hub — el motor rebota `mascota_no_determinada` si no viaja |
| confirmación por toast | ✅ con el saldo restante |
| **la fila aparece marcada «Con tu paquete»** | 🔴 **falta medir**: no verifiqué que la fila del hub lleve esa marca |

---

## RESUMEN — lo que falta, por dueño

| 🔴 | qué | de quién |
|---|---|---|
| el tope que el motor exige | **A** | bloquea aceptar ⇒ bloquea reservar |
| el wrapper de la mensualidad | **A** | el camino mensual llega al lugar y no cobra |
| los días marcados sin tocarlos (caso general) | **A** | necesita un lector por FECHA, no por prestador |
| la letra de la recurrencia en P2 | **C** | |
| «lo que incluye» en P4 | **C**, y sin fuente | necesita decisión: de dónde sale |
| el botón de P4 con la fecha adentro | **C** | |
| paquete y mensual por el checkout | **mesa** | toca el riel de pagos, no una pantalla |
| la marca «Con tu paquete» en la fila | **C** | sin medir |
