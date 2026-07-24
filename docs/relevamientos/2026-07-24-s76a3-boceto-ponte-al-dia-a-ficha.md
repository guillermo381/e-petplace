# BOCETO M1 (S76-A3) — Ponte al día VUELVE a la ficha de la mascota

> **Estado: BOCETO M1, cero código.** Espera la vara cruzada M2 (la debe B, que
> está cargada — el boceto puede esperar su lectura) y la firma del founder sobre
> píxeles (Ley "las pantallas patrón se firman sobre píxeles", no prosa). Un
> boceto contra una propuesta no construye nada.
>
> **Qué rechazó el founder, y qué NO:** en dispositivo rechazó la COMPOSICIÓN de
> S74 (*"qué feo… no sé de dónde salió ese diseño"*) — la zona "Ponte al día"
> aparte. La **REGLA de colapso por servicio quedó BIEN** (probada con 4 claves
> reales); no se toca. Lo que vuelve a M1 es DÓNDE y CÓMO se despliega.
>
> **La premisa falsa que movió la mesa (L-166):** S74 movió el despliegue a una
> zona aparte "dando por fijo que la ficha muestra UNA cita" — cuando el pedido
> era **que la ficha desplegara las que tiene** (plural). El eje no era el
> tiempo: era que la ficha es el lugar.

---

## 1. La TESIS (Ley 14)

> **La ficha de la mascota comunica que ESA mascota tiene su vida al día — y que
> lo que le espera se abre desde ELLA, no desde un tablero aparte.**

El sujeto es la mascota (EL NORTE). Las citas no viven en una bandeja de
pendientes del hogar; viven colgadas de la mascota a la que le pasan.

## 2. La interacción (la que el founder pidió, restaurada)

- La **`FichaMascotaHogar`** gana una affordance de **despliegue EN LA PROPIA
  FICHA** — sin zona aparte. Con la ficha plegada se ve la mascota + su voz de
  estado (como hoy); el despliegue abre ABAJO, dentro de la ficha, las citas
  **colapsadas por servicio** (la regla validada).
- **EL PLURAL ES LETRA, no concordancia** (lo que vuelve DESCUBRIBLE el
  despliegue): la etiqueta del control dice **"Ver su cita"** con 1 y **"Ver sus
  citas"** con >1. El plural es la señal de que hay varias para abrir.
- **Anatomía del control = 19.7 (contorno transparente, chevron que gira):**
  texto en tinta (cliente, Ley 21) + **chevron `⌄` que REVELA en el lugar** (no
  `›` de navegar — la verdad del contenido: se abre abajo tuyo, Ley 18) → `⌃`
  pliega. Sin caja, target 44, la fila tapea entera. **No es `PieRevelar`** (ese
  es el pie de una LISTA truncada, "Ver {{n}} más"): acá es la acción de una
  FICHA que despliega su propio contenido — 19.7, no 19.6.

## 3. Las 7 preguntas del protocolo (§1c)

1. **¿Qué TRABAJO hace?** Revelar en el lugar el contenido plegado de la ficha
   (las citas de la mascota). Diccionario: **19.7** (acción dentro de la
   fila/ficha que despliega, chevron `⌄`). No es navegación (19.1) ni paginación
   (19.6).
2. **¿Ya existe en la casa?** El despliegue en-lugar con `⌄/⌃` ya es la anatomía
   viva de `PieRevelar` y de la fila "Por coordinar" (`18e0c61`) — se REUSA la
   gramática, no nace componente (Ley 11 intacta). **Y ya existe la pantalla
   `/citas/[mascotaId]`** (el destino histórico de "Ver su cita", S67): el boceto
   declara la decisión de borde — ¿el despliegue en-lugar REEMPLAZA esa
   navegación, o conviven (resumen en la ficha + "ver todas" a la pantalla)? La
   mesa la resuelve; el voto del boceto: **despliegue en-lugar para las activas
   colapsadas; la pantalla `/citas` sobrevive como el detalle profundo** (una
   cita → su detalle), sin zona "Ponte al día".
3. **¿Recorriste la casa?** Vecinas: el Hogar (techo vivo, fichas apiladas 1-3),
   el perfil de la mascota (tap de la ficha), `/citas/[mascotaId]`. La gramática
   `⌄/⌃` y el colapso por servicio ya se hablan en esas superficies → coherente.
4. **¿Sirve la tesis (Ley 14) o le roba a la firma (Ley 15)?** La firma del Hogar
   es el techo vivo + la composición que preside; este despliegue vive DENTRO de
   la ficha y no suma acento (no toca `accent.active`, Ley 5) — sirve, no compite.
5. **¿Qué capa y qué dosis?** Cliente (dosis alta), pero el control es
   ESTRUCTURAL (tinta + chevron), no cromático (Ley 21). Cada cita colapsada
   lleva la capa de SU oficio (paseo=teal, salud=verde, etc.) en su glifo/estado.
6. **¿3 temas y es/en? ¿Estados?** Ver §5 (contrato) y §6 (estados declarados).
7. **La pasada Chanel (Ley 16):** muere la **zona "Ponte al día"** entera del
   Hogar (`hogar.ponteAlDia`, la sección rechazada) + su copy — el despliegue no
   necesita un contenedor con título propio: la ficha ya dice de quién es. Lo que
   quede de código muerto de esa zona se elimina (Ley 37).

## 4. Contrato de datos (M4) — DEFINIDO, el motor YA trae todo

**Cero pedido de motor** (la letra se implementa dejando de descartar, como el
canon ya declaró): `obtenerCitasActivasHogar(mascotaIds)` devuelve
`CitaActivaHogar[]` — todas las activas hogar-wide, ordenadas por fecha/hora
(la primera es "la próxima"), ya con `mascota_id`. Campos que el despliegue
RENDERIZA por cita: `tipo_servicio` (→ capa + voz de servicio por i18n, Ley 3),
`estado` (`firme`·`en_vivo`·`hold`·`por_coordinar`), `fecha`/`hora` (mono; `null`
en `por_coordinar` — se dice "falta coordinar", no se pinta vacío), `prestador_
nombre`/`negocio_nombre` (null honesto), `descripcion_presupuesto` (solo vet, la
Pieza 3 del dueño). **El colapso por servicio** agrupa las del mismo
`tipo_servicio` a la próxima + «+N» (la regla validada). Campos que se DESCARTAN
a propósito en la ficha plegada: todo lo clínico y el detalle profundo (viven en
`/citas/[mascotaId]`).

## 5. Estados declarados (M1)

- **Sin citas activas:** la ficha NO dibuja el control (el CTA "ni se dibuja" —
  contrato del lector: vacía = sin citas). La ficha queda como hoy (mascota +
  voz de estado). Cero final mudo.
- **1 cita:** control "Ver su cita" (singular).
- **N>1, mismo servicio:** colapsan a una + «+N» al desplegar.
- **N>1, servicios distintos:** una fila por servicio, colapsada cada una.
- **`por_coordinar` (sin fecha):** preside dentro del despliegue y NO colapsa
  (acción pendiente > agendada — el eje ACCIÓN vs INFORMACIÓN, §10ter.1); voz
  "Aprobado · falta coordinar la fecha".
- **`en_vivo`:** una sola por pantalla (Ley 7); si hay, el hero EN VIVO del Hogar
  ya la preside — el despliegue de la ficha no duplica el glow.
- **Cargando:** esqueleto estático de la ficha (Ley 13, sin shimmer).
- **Error del lector:** voz honesta, jamás disfrazado de vacío (Ley 13).

## 6. Lo que el boceto NO decide (para la mesa / la lámina)

- El borde exacto de §3.2 (despliegue en-lugar vs conservar navegación a
  `/citas` — voto arriba, decisión de mesa).
- La composición fina sobre píxeles (cómo se ve una fila colapsada dentro de la
  ficha, el aire, la elevación) — se firma sobre la lámina, no acá.
- La **vara cruzada M2 la corre B** leyendo la FUENTE de cada dato de este boceto
  (no la tabla del boceto — L-158): que `obtenerCitasActivasHogar` traiga cada
  campo que digo, que el colapso por servicio sea el validado, que `/citas`
  exista como declaro.

## 7. Depósito de doc que acompaña (pendiente de la firma)

Al construirse (post-firma): `DISEÑO_EXPERIENCIA` §10ter.1 **vuelve a M1** — la
enmienda S74 que la apuntó a "Ponte al día" se apoyó en la premisa falsa; el
corolario (ACCIÓN vs INFORMACIÓN, las `por_coordinar` presiden y no colapsan) se
CONSERVA, pero su superficie es la ficha, no una zona aparte. **No se toca §10ter.1
hasta la firma** (este boceto solo lo declara).
