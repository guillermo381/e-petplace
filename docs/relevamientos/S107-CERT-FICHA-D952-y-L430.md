# ☠️ FICHA `D-952` + LECCIÓN `L-430` — S107-CERT (27-ago-2026)

> Números verificados libres **por grep** contra `DEUDAS_CANONICAS.md`
> (tope real `D-951` · `L-429`). ⚠️ `D-945` sigue tomado y sin depositar.

---

# `D-952` — «PRÓXIMA» ERA UN DÍA, NO UN INSTANTE ✅ **CURADA**

## El defecto

`obtenerEstadoHogar` —el lector que alimenta **«Ponte al día»**, la única
superficie donde la familia ve sus citas activas— filtraba por
**`.gte('fecha', hoyLocal())`: por DÍA**, y no miraba la hora en ningún lado.

Y como `proxima_cita_por_mascota` guarda **UNA sola cita por mascota** (la
primera del orden `fecha asc, hora asc`), **una cita de hoy que ya terminó
seguía siendo «la próxima» hasta la medianoche, tapando a la siguiente.**

**Medido el 27-ago a las 21:00, con las dos citas de Thor lado a lado:**

| campo | `d0991b76` (12:00 · **sí aparecía**) | `1ef3e69d` (20:00 · **no aparecía**) |
|---|---|---|
| mascota · tipo · estado · reserva · prestador · dir | **idénticos** | **idénticos** |
| hora | 12:00 (dur 20' → **terminó hacía 9 h**) | 20:00 |

> ### No faltaba la de las 20:00: sobraba la de las 12:00.
> **Las dos filas eran idénticas campo por campo. Lo único que difería era la hora — y la hora era justamente lo que el lector no miraba.**

## La regla firmada (founder, 27-ago) — el borde es lo importante

> **Cuenta como próxima si su instante de inicio es futuro O si está EN CURSO.
> Se descarta lo que ya TERMINÓ, jamás lo que ya empezó.**

*Una cita que arrancó es justo cuando más importa que esté ahí.*

## La cura, y lo que se midió antes de escribirla

- `fin = inicio + duracion_minutos`. **Medido: 15 de 15 citas vivas traen
  `duracion_minutos`** ⇒ el derivado usa dato real. Los 60' son **red para el
  NULL que hoy no ocurre**, no un supuesto.
- La consulta **tuvo que ensancharse**: `duracion_minutos` no venía en el
  `select`. *Sin eso el derivado no existía.*
- Aplicada en **los dos consumidores**: `proxima_cita` (hogar) y
  `proxima_cita_por_mascota`.
- **Fail-open en la lectura**: si la fecha/hora no se pudo parsear, **no se
  descarta**. *Perder una cita por un formato raro es peor que mostrar una de
  más.*

### 🔴 Y una corrección de encuadre, mía, antes de escribir una línea

Yo mismo propuse *«huso Guayaquil, reusando el del motor del reverso»*, y el
founder lo firmó así. **Estaba mal**, y se corrigió midiendo el archivo:
`hogar.ts:82` usa deliberadamente **el reloj del dispositivo**
(`hoyLocal` — *«Fecha local del dispositivo»*).

> **La ventana de las 17:00 de Guayaquil es una regla del PROVEEDOR y vive en el
> servidor. «Qué me toca ahora» es del reloj de quien mira.** Clavar Guayaquil
> en el cliente rompería a cualquier familia en otro huso — y choca de frente
> con **P21**: *la cuenta es global; el país es contexto de operación, jamás de
> identidad.*

## ⚠️ EL TAMAÑO, Y POR QUÉ NO ES TRANQUILIZADOR

**Hoy: 1 mascota afectada** —Thor— con 1 cita tapada.

**Pero el número chico no mide la gravedad, mide la novedad del caso.**

> **Estuvo callado porque el producto recién empezó a producir el caso, no
> porque fuera raro.** Hace falta una mascota con **dos citas el mismo día**
> para que se vea, y **telemedicina permite dos consultas en un día de un modo
> que un paseo o un grooming no.**

⇒ **Va a crecer solo.** Cada oficio de sesión corta multiplica la probabilidad.
*Un defecto cuyo caso lo fabrica el roadmap no se prioriza por su tamaño de hoy.*

## 🔴 PREGUNTA ABIERTA que esta cura DEJA (real, y no es de esta cura)

Una cita **`confirmada` que terminó y nadie cerró** ahora deja de aparecer en
«Ponte al día» — correcto para «próxima», **y no hay ninguna superficie que se
la recuerde al dueño**. *La cura no crea el hueco: lo hace visible.* Dueño:
producto.

---

# `L-430` — UN CORTE TEMPORAL REPORTADO POR UN HUMANO MARCA CUÁNDO LO NOTÓ

> ## Un corte temporal reportado por una persona marca **cuándo lo NOTÓ**, no cuándo empezó.

**Corolario operativo, que es lo que se hace con la lección:**

> **La ventana se mide contra el OBJETO** —qué cambió de estado, qué se aplicó,
> qué se instaló— **y recién ahí se cruza con lo que la persona vio.**

## Los dos cobros del mismo día, que es lo que la funda

1. **«dejó de llegar DESDE el cambio del reverso»** (15:46). Medido: el reverso
   no tocó nada de eso. **El corte real fueron las 12:00**, cuando venció la
   cita que tapaba a la otra. *Coincidencia de reloj.*
2. **«hasta las 14:30 las citas funcionaban bien»**. Apuntaba a un install de
   las 14:03 — que **sí existió** y que además resultó ser un APK roto en dos
   ejes, pero **no tenía nada que ver con el defecto**. *Un evento real en la
   ventana, y aun así la causa equivocada.*

**Las dos veces la hora mintió. Y las dos veces mintió de la forma más
convincente: había un evento real cerca.**

## Por qué es peligrosa y no solo curiosa

Un corte horario **se siente como evidencia dura** —tiene número, tiene
precisión— y por eso **dirige la búsqueda antes de que nadie mida**. En esta
sesión mandó a auditar dos migraciones, un trigger y un binario, **ninguno
culpable**. *El costo de una hora equivocada no es no encontrar la causa: es
encontrar tres sospechosos verosímiles primero.*

**Y su lado bueno, que hay que conservar:** el reporte humano **acotó el
espacio** y fue lo que hizo posible pedir el par comparable —una cita de cada
lado del corte—. **La hora sirvió para encontrar los DOS CASOS, no la causa.**
*Se usa para elegir qué comparar, jamás para decidir qué culpar.*
