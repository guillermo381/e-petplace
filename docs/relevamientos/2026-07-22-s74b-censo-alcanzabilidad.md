# S74-B · CENSO DE ALCANZABILIDAD — L-161 aplicada de una vez (lectura, cero siembra)

> Verificado contra la DB VIVA (Aurora/Quito, sesiones demo) y contra el
> corte real de OTAs — no contra suposición (L-141). **Dato que ordena
> todo: el teléfono del founder corre el group `dedae916…` (ancla
> `582b3d0`); la cura D-508 (rebotes con voz + voz angostada de invitar)
> y el marcador en Cuenta son POSTERIORES — no están en su pantalla
> hasta el próximo OTA.** Estado del mundo (queries literales, 22-jul):
> 5 citas vet vivas de Aurora — TODAS con reservador y TODAS con
> teléfono · CERO cita walk-in viva · atenciones: 14 cerradas + **1
> `terminada` de PASEO (15-jul, del paseador demo — no Aurora)** · 6
> servicios vet ACTIVOS en Aurora · empleados activos no-dueño: **0** ·
> roles en la hija: solo 5 `dueño` · invitaciones: 3 aceptadas + 2
> `pendiente_aceptacion_login` · Thor y Zeus CON fecha de nacimiento ·
> Aurora ciudad = Quito (no-null).

## PARTE 1 · LA TABLA

⚠PV = PRIMERA VEZ (nunca vista, ni en captura — la mirada estrena).
Sesión: (V) = demo-vet/Aurora · (P) = paseador demo.

| Superficie | Camino literal | ¿Alcanzable HOY? | Bloqueo (literal) |
|---|---|---|---|
| Dictado: autofoco + hint + EvitaTeclado ⚠PV-teclado | (V) HOY → cita vet de hoy (hay 1 confirmada 22-jul) → "Iniciar consulta" | **SÍ** | — |
| Confirmar que enumera | ídem, dictar incompleto y estructurar | **SÍ** | — |
| D-488 (reconstruye) | ídem, salir/volver N veces | **SÍ** | — |
| Mostrador Ley 23 (reconocido/desconocido) | (V) HOY → "Registrar atención" → buscar `guillo381+8` / un correo inventado | **SÍ** | — |
| La cara del animal (atención y cobro) | mostrador → cliente de la clínica → Thor | **SÍ** | — |
| Atención: CARGANDO | al entrar a la anterior | **SÍ** | — |
| Atención: ERROR + Reintentar | ídem con modo avión antes de entrar | **SÍ** | — |
| Atención: VACÍO con CTA al taller | — | **Solo apagando datos propios** | Aurora tiene **6 servicios vet activos** (literal); el vacío exige 0. Producible por el founder: taller → apagar todos → mirar → re-prender (⚠ toca su config; captura web existe) |
| Cierre de PASEO con EvitaTeclado ⚠PV-teclado | (P) la atención `terminada` del 15-jul → su pantalla de cierre → tocar la nota del fondo | **SÍ — para el CHECK de teclado** (entrar y enfocar; NO cerrar) | Cerrarla ⚠ ESCRIBE (devenga). Exige la sesión del paseador (la atención no es de Aurora) |
| Cierre de GROOMING ⚠PV | — | **NO** | Cero atención grooming en curso/terminada (14 cerradas). Ver Parte 2 |
| Cierre de ADIESTRAMIENTO ⚠PV | — | **NO** | Ídem — cero estado cerrable |
| EQUIPO + FIRMA (logo monograma, ciudad, equipo-de-1, Hoja invitar con teclado) ⚠PV | (V) NEGOCIO → celda "Equipo" | **SÍ** | — (ciudad Quito se ve; el caso ciudad-NULL vive en OTRO prestador — solo con esa sesión) |
| Invitar — rebote `email_sin_cuenta` ⚠PV | Hoja invitar → correo inventado | **NO HOY / SÍ próximo OTA** | **La cura D-508 no está en `dedae916`** — hoy el teléfono aún muestra éxito-sobre-rebote |
| Invitar — rebote `es_prestador` ⚠PV | Hoja invitar → su propio email | **NO HOY / SÍ próximo OTA** | Ídem |
| Invitar — rebote `ya_es_empleado` ⚠PV | exige el email de un empleado (activo o no) del MISMO negocio | Parcial, próximo OTA | Ídem + el email exacto no fue relevado (dato de DB, lectura pendiente si la mesa lo quiere) |
| Invitar — rebote `no_es_dueno` | — | **NO** | Exige sesión de empleado no-dueño: hay **0** |
| E1 — el sin-rol PRESIDE ⚠PV | — | **NO** | Exige miembro ACEPTADO sin rol; el handshake de aceptación NO EXISTE (verificado hoy) — hoy es imposible producirlo desde la app |
| La voz digna del no-dueño (deep link a /negocio/equipo) ⚠PV | — | **NO** | 0 empleados no-dueño con sesión |
| Desvincular (⚠ escribe) | — | **NO** | Mismo bloqueo (no hay a quién) |
| Degradación por rol (recepción sin HC) | — | **NO** | 0 empleados con rol `recepcion` (hija: solo 5 `dueño`) — la cadena entera espera el handshake |
| RECEPCIÓN: etapa destilada ⚠PV | (V) Mascotas → Thor o Zeus → bajo el nombre | **SÍ** | Thor y Zeus tienen fecha de nacimiento (verificado) |
| RECEPCIÓN: raza en identidad | ídem, sección Identidad | **SÍ** | — |
| La visita — CON teléfono ⚠PV | (V) HOY → cita vet → tarjeta "La visita" | **SÍ** | Las 5 citas vivas: todas con reservador y teléfono |
| La visita — SIN teléfono ⚠PV | — | **NO** | **Cero cita vet de Aurora con reservador sin teléfono** (verificado ×5 — el "1 de 2 reservadores" de A no está en la ventana vet de Aurora) |
| La visita — WALK-IN ⚠PV | mostrador → registrar atención (⚠ ESCRIBE) → su cita → "La visita" | **Solo produciéndola** | Cero cita sin reservador viva; el founder PUEDE generarla él mismo (escribe una atención real) |
| Las 11 familias de voces vet (modo avión por acción) | mostrador/consulta/presupuesto/taller + avión | **SÍ** | — |
| Marcador renderizado en Cuenta | tab Cuenta → el pie | **NO HOY / SÍ próximo OTA** | La cura es posterior a `dedae916` — hoy vale la verificación de reemplazo (NEGOCIO → Equipo existe) |

## PARTE 2 · QUÉ HARÍA FALTA — declarado, NO ejecutado

| Fila bloqueada | El dato mínimo exacto | ¿Quién lo produce? |
|---|---|---|
| Vacío de atención | 0 servicios vet activos en Aurora (apagar los 6 en el taller, mirar, re-prender) | **El founder, desde la app** (⚠ toca su config, reversible) |
| Cierre grooming | 1 `evento_atencion` de grooming en estado cerrable (cita grooming + iniciar + terminar) | O el founder caminando el flujo entero (⚠ escribe cita+atención reales) o **siembra de motor (A + OK founder)** — decisión de mesa |
| Cierre adiestramiento | Ídem, del oficio adiestramiento (ojo: el motor de programas exige secuencia — siembra más cara) | Ídem — voto: siembra de motor si se quiere gatear ya |
| Visita SIN teléfono | 1 cita vet de Aurora con `user_id` de un profile con `telefono NULL` (o poner NULL el teléfono de un reservador de prueba y reservar) | **Motor (A + OK founder)** — el founder no puede producirla sin tocar otro perfil |
| Visita WALK-IN | 1 cita nacida del mostrador (`user_id` null) | **El founder, desde la app** (⚠ escribe una atención real; alternativa: siembra de A) |
| Rebotes de invitar con voz · marcador en Cuenta | **El PRÓXIMO OTA** (las curas ya están commiteadas: `57a602e` · `02eb7e8` · `0225701`) | La mesa abre ventana de publish |
| `ya_es_empleado` | El email literal de una fila de `prestador_empleados` del negocio de la sesión | Lectura chica de DB (yo, si la mesa la pide) |
| Sin-rol preside · voz no-dueño · desvincular · degradación recepción | 1 `prestador_empleados` ACTIVO no-dueño del negocio (+ para la degradación: su fila `recepcion`… que bajo la letra nueva es EL PISO — ver boceto delta §8) + una SESIÓN de ese user | **Motor (A + OK founder)** — y honestamente: esta familia entera madura mejor CON el handshake (pedido bloqueante §9.6 del delta) que con siembra artesanal |

## PARTE 3 · EL GUION, PARTIDO EN DOS

### ✅ CAMINABLE HOY (group `dedae916…`; verificación de estar en él: NEGOCIO → la celda "Equipo" existe)

1. **EQUIPO + FIRMA** ⚠PV — NEGOCIO → Equipo (monograma, ciudad, equipo-de-1, Hoja de invitar CON teclado arriba; ⚠ NO enviar la invitación: la voz vieja del teléfono aún promete de más).
2. **RECEPCIÓN: etapa + raza** ⚠PV — Mascotas → Thor/Zeus.
3. **La visita CON teléfono** ⚠PV — HOY → cita vet → "La visita".
4. **El dictado completo** (autofoco · hint · teclado que no tapa ⚠PV-teclado · Confirmar que enumera · D-488) — HOY → cita de hoy → Iniciar consulta.
5. **Mostrador**: Ley 23 (reconocido/desconocido) + la cara en atención y cobro.
6. **Atención**: cargando + error con Reintentar (modo avión). El vacío: solo si quiere apagar/prender sus servicios (opcional, captura existe).
7. **Cierre de PASEO con teclado** ⚠PV-teclado — sesión del paseador → la atención terminada del 15-jul → tocar la nota. **Sin cerrar** (cerrar devenga).
8. **Las voces de error vet** — modo avión por acción, familia por familia (tabla del guion consolidado §5).

### ⛔ BLOQUEADO (con su bloqueo en una línea)

- **Rebotes de invitar con voz + voz angostada + marcador en Cuenta** → esperan el PRÓXIMO OTA (curas ya commiteadas).
- **Cierres de grooming y adiestramiento** → cero atención cerrable de esos oficios (siembra o caminata completa, decisión de mesa).
- **La visita SIN teléfono** → cero reservador sin teléfono en las citas vivas de Aurora (motor).
- **La visita WALK-IN** → cero cita de mostrador viva (el founder puede producirla ⚠ escribe, o siembra).
- **Todo lo de miembro no-dueño** (sin-rol preside · voz digna · desvincular · degradación recepción · rebote `no_es_dueno`) → 0 empleados activos no-dueño, y el camino natural para tenerlos (el handshake) NO EXISTE — pedido bloqueante §9.6.
- **El vacío de atención** → semi-bloqueado: solo apagando los 6 servicios vivos (opcional).
- **Firma con ciudad NULL** → el caso vive en otro prestador; solo con esa sesión.

**El corte honesto:** de las ~26 filas del censo, **16 son caminables hoy**
y las 10 bloqueadas comparten TRES raíces — el próximo OTA (curas
listas), el handshake que no existe (pedido bloqueante), y estado de DB
que nadie sembró (decisión de mesa, cero siembra mía).
