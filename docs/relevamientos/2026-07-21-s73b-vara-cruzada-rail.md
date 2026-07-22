# S73-B · VARA CRUZADA (M2) sobre el boceto del rail de A
### (`2026-07-21-s73a-boceto-rail-servicios.md` — método L-158: la FUENTE de cada dato, no la tabla)

> Veredicto global: **APTO CON UNA ENMIENDA DE HECHO** (la justificación
> de la regla de orden afirma algo que la fuente refuta) **y una deuda
> que nace YA** (Q2). La composición, los estados y el contrato M4 están
> fundados en literal verificado — el censo §0 del boceto es exacto.

## Lo verificado contra fuente (todo coincide)

- **El rail y su comentario-deuda:** `hogar/index.tsx:826-836` literal —
  "E4: nace con LOS 2 REALES (paseo, estética…) vet/adiestramiento se
  suman cuando el suyo exista (deuda declarada)". ✓
- **El shape del resumen:** `serviciosHogar.ts:28-37` —
  `paseo:{proxima, salidas_saldo}` · `estetica:{proxima,
  ultima_cerrada}`. ✓ Voseo `:16` ("Probá de nuevo") ✓ — clase
  D-472 **lado CLIENTE**: al lote de A, no de B.
- **Hubs:** `hogar/{paseos,grooming,adiestramiento}.tsx` existen; hub
  vet NO existe; `citas/[mascotaId].tsx` existe. ✓
- **Explorar:** las CUATRO rutas de oficio existen
  (`explorar/{paseo,grooming,adiestramiento,veterinaria}`). ✓
- **Lector adiestramiento:** `obtenerMisAdiestramientos` →
  `AdiestramientoDelHogar[]` (`adiestramiento-reserva.ts:340-368`), el
  hub lo consume (`adiestramiento.tsx:141`). ✓
- **RLS dueño hogar-wide para la query vet:** policies literales
  `cita_select_due (user_id = auth.uid())` + `cita_select_por_acceso
  (mascota_id NOT NULL AND user_tiene_acceso_a_mascota)` — la query
  `.in('mascota_id', …)` pasa por RLS existente, cero policy nueva. ✓
  **Nota de costura con el gate D-464 (B, fase 3): la pata FAMILIA de
  la lectura queda byte-idéntica — esta query del dueño NO se ve
  afectada.** Verificado contra el diseño revisado por mesa.
- **El embed a `tipos_servicio` ya tiene patrón vivo**
  (`tipo:tipos_servicio!inner` en SELECT_CITA). ✓

## Las cuatro preguntas del §7, con literal

**1. La regla de orden — ENMIENDA DE HECHO.** El boceto afirma: *"con
los resúmenes de §5, la frecuencia NO es computable hoy — si la vara
pide frecuencia, es motor nuevo y cambia la tanda."* **La fuente lo
refuta:** el compositor es client-side sobre LISTAS completas
(`serviciosHogar.ts:50-52` → `obtenerMisCitasPaseo()` +
`obtenerMisPaquetesSalidas()` + `obtenerMisGroomings()`; adiestramiento
sería `obtenerMisAdiestramientos()` → lista con `estado`). Contar
cerradas = un `.filter().length` en el MISMO compositor — **cero motor
nuevo, cero roundtrip nuevo**. La regla propuesta (próxima > actividad >
Descubre-canónico) puede seguir siendo la correcta — "prioridad de uso"
del founder se lee natural así — pero la elección debe hacerse SIN el
argumento falso de imposibilidad. **Decisión de producto: al founder,
con ambas opciones ya baratas.**

**2. Destino vet v1 — ACEPTABLE, Y LA DEUDA NACE YA.** El destino
(`/citas/[mascotaId]` de la próxima cita vet) existe y es honesto para
N=1 mascota con actividad vet. El costo declarado es real: en un hogar
multi-mascota con vet activo, el cuadrado aterriza en UNA mascota y las
citas vet de las otras solo se alcanzan por ficha — la clase C4/callejón
que S72 pagó caro. **Voto de la vara: la deuda del HUB VET DEL DUEÑO se
registra YA** (numera A), disparo: la primera vez que el rail muestre
vet con actividad de 2+ mascotas del hogar, o el arco S74 — lo que
llegue primero. El destino v1 no espera esa deuda.

**3. «Descubre» → Explorar — RATIFICADO CON FUENTE.** La letra vive
literal en `hogar/index.tsx:822` ("…descubre, el Hogar anticipa") y las
cuatro rutas destino existen. Cero objeción.

**4. Memorial cede el mínimo — RATIFICADO, con una nota.** La frontera
(`_mascotas-elegibles.ts:27-38`) filtra `estado_vida === 'activa'` y
`especiesElegibles === null` = sin restricción — la llamada
`mascotasElegibles(mascotas, null)` del boceto es el uso correcto para
"¿hay alguna mascota elegible para ALGO?". Coherente con la letra del
selector §5 y LOYALTY (memorial apaga estructural). **Nota de borde
(declarar en la construcción):** `estado_vida null` cae NO-elegible
(falla cerrada, comentario literal de la frontera) y `'perdida'` también
suprime «Descubre» — un hogar con mascota perdida (no memorial) tampoco
ve marketing. Es coherente con la frontera; se declara para que sea
decisión leída, no sorpresa.

## Hallazgo menor fuera de las preguntas

El boceto §5 descarta `proxima.hora/mascota_nombre` en paseo/estética
("la frase entera vive en el hub — E4") pero la rama vet SÍ retiene
`proxima.mascota_id` "solo para el destino" — correcto y declarado;
la vara pide que el campo viaje con ese comentario en el shape (que el
próximo lector no lo pinte por accidente: es dato de RUTA, no de
superficie).
