# S73-A · M1 — BOCETO: el rail "Tus servicios" a MÍNIMO 4 + «Descubre» (ítem 1 founder · paga D-462 camino a)

> **Estado: M1 — BOCETO. NO construido.** Viaja a la **vara cruzada de B**
> por mano del founder ANTES de construir (el mecanismo rige en las dos
> direcciones). Letra que lo gobierna: el ítem 1 del brief founder S73
> (*"los servicios salen MÍNIMO 4 por prioridad de uso del cliente +
> etiqueta 'Descubre' si no usó ninguno"*) + D-462 camino (a) (voto del
> arquitecto ya registrado: la completitud ES el valor del rail).

---

## 0 · El censo que funda el boceto (fuente, ruta:línea)

- **El rail hoy** (`hogar/index.tsx:826-900`): DOS cuadrados
  condicionales (paseo, estética) con regla de existencia "cero
  actividad = cero celda", copy corto E4 (UN número o UNA fecha, jamás
  "…"), tira edge-to-edge, `Tarjeta interactiva` 96 de ancho con
  `Icono 24` + nombre + `Texto dato`. El comentario `:835-837` declara
  la deuda: *"nace con LOS 2 REALES … vet/adiestramiento se suman cuando
  el suyo exista"*.
- **El lector hoy** (`serviciosHogar.ts`): client-compuesto sobre
  lectores existentes, CERO RPC nueva — shape
  `{ paseo: {proxima, salidas_saldo}, estetica: {proxima, ultima_cerrada} }`.
  Adiestramiento y vet: CERO (la mentira C5, literal).
- **Hubs destino:** `/hogar/paseos` ✅ · `/hogar/grooming` ✅ ·
  `/hogar/adiestramiento` ✅ (**el hub EXISTE** — lo que falta es su
  resumen en el rail) · **vet: NO EXISTE hub del dueño** (las citas vet
  viven por-mascota en `/citas/[mascotaId]`, la pantalla C4/D-430).
- **Lectores reutilizables:** adiestramiento →
  `obtenerMisAdiestramientos` (`AdiestramientoDelHogar`, ya lo consume el
  hub). Vet → **no hay lector hogar-wide**: `obtenerCitasActivasMascota`
  es por-mascota (`citasMascota.ts:75`, query directa a
  `evento_cita_servicio` por RLS del dueño) — el resumen vet nace como
  UNA query del hogar (`.in('mascota_id', …)` + join a
  `tipos_servicio.es_medico`, canon regla 59: el día clínico se compone
  por `es_medico=true`, jamás por categoría — incluye `procedimiento`),
  JAMÁS N llamadas por mascota (el ítem 7 de lentitud ya cuenta una
  llamada por mascota en el Hogar; este boceto no agrava).
- **Hallazgo al paso (para el censo de voz, ítem 6):**
  `serviciosHogar.ts:16` `MENSAJE_ERROR` en voseo ("Probá de nuevo") —
  clase D-472/D-481. No se toca acá.

## 1 · Las siete preguntas del §1c

1. **¿Qué TRABAJO hace?** Entrar a la posición consolidada de un
   servicio (19.1 — navegación) — y, NUEVO, **invitar al que falta**
   («Descubre»). Son dos trabajos y el boceto los declara distintos: el
   cuadrado usado NAVEGA al hub; el cuadrado sin uso INVITA y navega a
   Explorar (donde el descubrimiento vive por letra — el comentario del
   rail ya lo decía: *"Explorar descubre, el Hogar anticipa"*).
2. **¿Ya existe en la casa?** Todo: `Tarjeta interactiva`, `Icono` (los
   4 glifos del set b′ existen: paseo·grooming·adiestramiento·
   veterinaria), `Texto apoyo/dato`, `Esqueleto`. **Cero componentes
   nuevos.**
3. **¿Recorriste la casa?** Vecinas: arriba el hero/Ponte al día; abajo
   las fichas por mascota. Los hubs destino ya existen (salvo vet). La
   gramática del cuadrado NO cambia — cambia el censo de cuadrados.
4. **Tesis/firma** ↓ §2. **5. Capa/dosis:** dosis dueño; el glifo porta
   su capa por registro (`Icono` default); cero acento nuevo.
   **6. Temas/es-en/estados** ↓ §6. **7. Chanel** ↓ §3.

## 2 · TESIS · FIRMA

**TESIS:** *"Acá está TODO lo que tu hogar usa — y lo que le falta
probar."* El rail deja de mentir por omisión (C5) y pasa a decir la
verdad completa por letra founder.

**FIRMA (de comportamiento):** **el orden ES el uso** — los cuadrados se
ordenan por la vida real del hogar, no por un orden fijo de catálogo. El
founder ve primero lo que su hogar usa más cerca.

## 3 · PASADA CHANEL

- **Muere el comentario-deuda** `:835-837` ("nace con LOS 2 REALES…") —
  el código deja de documentar su propia mentira.
- **Nada más se agrega**: ni badges, ni contadores, ni CTA extra. El
  cuadrado «Descubre» es el MISMO cuadrado con otra voz en el slot del
  dato — cero forma nueva.
- **No se quita** el copy corto E4 ni el edge-to-edge: firmados S71.

## 4 · LA COMPOSICIÓN

```
Tus servicios
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ 🐾   │ │ ✂️    │ │ 🎓   │ │ ⚕   │   ← Icono 24 (b′ real)
│Paseos│ │Estét.│ │Adies.│ │ Vet  │   ← Texto apoyo
│24 jul│ │26 jul│ │Descu-│ │22 jul│   ← Texto dato (mono) · o «Descubre»
└──────┘ └──────┘ │ bre  │ └──────┘     (Texto apoyo secondary — voz, no dato)
                  └──────┘
```

- **MÍNIMO 4, siempre** (paseo · estética · adiestramiento ·
  veterinaria): la regla de existencia del rail S60 ("cero actividad =
  cero celda") queda **REEMPLAZADA por letra founder** para estos cuatro.
  Servicios futuros (refugios, despensa) NO entran — el mínimo es de los
  cuatro oficios vivos.
- **ORDEN = prioridad de uso, computable hoy** (la regla que el gate
  firma): (1º) los que tienen **próxima cita**, por fecha ascendente ·
  (2º) los con **actividad sin próxima** (saldo > 0 o última ≤60 días),
  por recencia · (3º) los **sin uso**, con «Descubre», en el orden
  canónico de apertura (paseo → estética → adiestramiento → vet). Cero
  dato nuevo: todo sale de los resúmenes.
- **El dato por cuadrado** (reglas vivas, sin cambio): próxima fecha >
  saldo > última reciente — en mono. **Sin uso → «Descubre»** en `Texto
  variante="apoyo"` color secondary: es INVITACIÓN (voz humana), no dato
  de máquina — Ley 3 manda sans, no mono.
- **Destinos:** paseo/estética/adiestramiento → su hub. «Descubre» →
  `/explorar/<oficio>` (el hub vacío sería un callejón; Explorar es el
  lugar del descubrimiento por letra). **Vet CON actividad (v1
  honesto):** → `/citas/[mascotaId]` de la mascota de la PRÓXIMA cita
  vet (el dato del cuadrado ES esa cita; las citas de otras mascotas
  siguen alcanzables por su ficha, D-430). **Hueco declarado:** el hub
  vet del dueño no existe; cuando nazca, el destino migra — candidata a
  deuda si la vara lo pide.

## 5 · CONTRATO DE DATOS DE PANTALLA (M4)

`ResumenServiciosHogar` se EXTIENDE (aditivo, mismo patrón
client-compuesto, cero RPC nueva):

| Rama | Fuente | Campos renderizados | Descartes a propósito |
|---|---|---|---|
| `paseo` | vivo (sin cambio) | `proxima.fecha` · `salidas_saldo` | `proxima.hora/mascota_nombre/tipo_servicio` (la frase entera vive en el hub — E4) |
| `estetica` | vivo (sin cambio) | `proxima.fecha` · `ultima_cerrada` (≤60d) | ídem |
| `adiestramiento` **(nace)** | compone sobre `obtenerMisAdiestramientos` | `proxima.fecha` · `ultima_cerrada` (≤60d) | el programa/k-de-N (vive en el hub, no cabe en E4) |
| `veterinaria` **(nace)** | UNA query hogar-wide a `evento_cita_servicio` ⋈ `tipos_servicio.es_medico=true` (incluye `procedimiento`; `por_coordinar` cuenta como actividad SIN fecha) | `proxima.fecha` · `proxima.mascota_id` (solo para el destino) · `ultima_cerrada` (≤60d) | la descripción del presupuesto (D-474 — vive en `/citas/[mascotaId]`, no en el cuadrado) |

**Nota de motor:** la cita `por_coordinar` (fecha null, legal desde
D-439) hace al hogar "usuario vet" — el cuadrado vet se ordena en el
grupo 2 (actividad sin próxima) y su dato queda vacío (los días sin
forma E4 van SIN dato, regla viva del plan-solo). **La invisibilidad no
se repite** (lección S71: la cura que hizo legal el estado barre sus
lectores — este lector NACE contándola).

## 6 · LOS CINCO ESTADOS

1. **CARGANDO:** esqueleto de 4 cuadrados estáticos (Ley 13, sin
   shimmer) — el rail no "aparece de a pedazos".
2. **ERROR:** el rail NO degrada a «Descubre» (**un lector que degrada a
   vacío esconde regresiones — L-139 para errores, disciplina del
   brief**): banda de error `registro="seccion"` con reintento en el
   lugar del rail. Jamás cuadrados mintiendo "sin uso".
3. **VACÍO:** no existe como tal — el mínimo 4 SIEMPRE se monta (el
   "vacío" es los cuatro en «Descubre", hogar recién nacido).
4. **PARCIAL:** si UNA rama del resumen falla y las otras no, el rail se
   monta con las sanas y la fallida muestra su cuadrado SIN dato + la
   banda chica de reintento — no se inventa «Descubre» sobre un error.
5. **MEMORIAL (la frontera de elegibilidad manda):** con
   `mascotasElegibles(mascotas, null).length === 0` (todas en
   memorial/perdida), **los cuadrados «Descubre» NO se montan** — no se
   le hace marketing de servicios a un hogar sin mascota elegible; los
   cuadrados CON historia quedan (la historia se lee, P13). El mínimo 4
   cede ante memorial — y es la primera consumidora de la frontera fuera
   de explorar.

**i18n:** nacen `hogar.railAdiestramiento` · `hogar.railVet` ·
`hogar.railDescubre` (es+en, tuteo, al lote de gate founder).

## 7 · LO QUE ESTE BOCETO PIDE DE LA VARA DE B

1. **La regla de orden de §4** (próxima > actividad > Descubre-canónico)
   — ¿es "prioridad de uso del cliente" como el founder la dijo, o el
   founder quería otra métrica (frecuencia histórica)? Leé la fuente del
   dato: con los resúmenes de §5, la frecuencia NO es computable hoy —
   si la vara pide frecuencia, es motor nuevo y cambia la tanda.
2. **El destino vet v1** (la mascota de la próxima cita) — ¿aceptable, o
   la vara pide que nazca la deuda del hub vet YA?
3. **«Descubre» → Explorar** — ratificar contra la letra del rail
   ("Explorar descubre, el Hogar anticipa") o refutar con fuente.
4. **Memorial cede el mínimo (§6.5)** — ratificar; es la lectura del
   boceto de la letra de elegibilidad, no letra firmada.

## 8 · TERRITORIO (76)

- Nada construido. El lector vet y la extensión del resumen son
  `packages/api` → **A** (yo misma, tras la vara).
- Cero componentes nuevos; cero DB (la query vet es lectura por RLS
  existente del dueño — si la RLS del dueño no alcanza a
  `evento_cita_servicio` hogar-wide, FRENO y reporte, no policy nueva en
  silencio).
- 76(g): no rige (cero migración).
