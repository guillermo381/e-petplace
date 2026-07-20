# S72-B · M1 — BOCETO: el expediente que ve el PROFESIONAL (P3)

> **Estado: M1 — BOCETO. NO construido.** Sale a **vara cruzada (M2)**: la
> Sesión A audita LEYENDO LA FUENTE de cada dato, no la tabla de este
> documento (L-158). Recién después se construye.
>
> Letra que lo gobierna: `BIO_EXPEDIENTE.md` **A3.1–A3.8, A3.10** (firmadas
> mesa S72). **A3.9 memorial: PENDIENTE DE FIRMA** — este boceto declara el
> estado memorial pero **no asume cuánto dura el acceso**.
>
> Ruta objetivo: `apps/prestador/src/app/mascota/[mascotaId].tsx` (existe hoy,
> se re-compone — no nace ruta nueva).

---

## 0 · EL HALLAZGO QUE CAMBIA EL ENCUADRE (corrección de S72-B0)

En el relevamiento B0 declaré: *"D-459 no es 'falta construir', es 'está
construido y desconectado'"*. **Esa afirmación era imprecisa y la corrijo
acá**, antes de que el boceto se apoye en ella.

De los nueve lectores sin importaciones en prestador, **sólo cinco son
reutilizables tal cual**. Los otros cuatro no sirven, y por razones distintas:

| Lector | Veredicto | Por qué |
|---|---|---|
| `obtenerParteConsulta` | ❌ **CERRADO AL PRESTADOR** | RPC `SECURITY DEFINER` con guard `_user_es_familia_de_mascota` (`20260719170000:~72`) → un vet recibe `sin_acceso`. Es cara de DUEÑO. |
| `leerDetalleAtencion` | ❌ **CIEGO AL OFICIO VET** | su `oficio` es `'paseo'\|'grooming'\|'adiestramiento'\|null`. Una atención vet cae en `null` y devuelve cascarón vacío. |
| `registrarVacunasDeCarnet` | ❌ no aplica | es ESCRITOR, `security invoker`, RLS de dueño. El camino prestador es `registrar_vacuna_mostrador`. |
| `extraerVacunasDeCarnet` | ❌ no aplica | Edge Function, no lector de expediente. |

**Reutilizables tal cual** (RLS pura por `user_tiene_acceso_a_mascota`, que el
prestador con acceso vigente satisface): `obtenerPerfilMascota` ·
`leerTimelineMascota` · `obtenerVacunaPorEvento` · `obtenerFotosDeEvento` ·
`obtenerCitasActivasMascota`.

**Encuadre correcto de D-459:** es **mitad y mitad**. Hay chasis reutilizable
real, y hay lectores que **hay que construir**. No es sólo cablear.

---

## 1 · LAS SIETE PREGUNTAS DEL §1c (protocolo obligatorio)

**1. ¿Qué TRABAJO hace?** Es un **briefing de treinta segundos** (A3.7), no
una lista. El trabajo del diccionario que aplica es **19.5 — elemento hero de
posición consolidada** para la franja de seguridad, y **19.6 `PieRevelar`**
para todo lo que se pliega. No es una pantalla de navegación.

**2. ¿Ya existe en la casa?** Sí, y mucho. La ruta existe
(`mascota/[mascotaId].tsx`). Reuso: `AvatarMascota`, `Tarjeta`, `Celda`,
`Insignia`, `Texto` (57–58), `FilaDato` (58), `PieRevelar` (59), `Separador`,
`EstadoVacio`, `Esqueleto`. **Cero componentes nuevos propuestos** — y eso es
deliberado: si el boceto pidiera un componente, sería Ley 11 y `packages/ui`
es territorio de la A esta tanda.

**3. ¿Recorriste la casa?** Vecinas: **antes** → la jornada de HOY
(`(tabs)/index.tsx`) o el catálogo del mostrador; **después** → el Antes de la
consulta (`veterinaria/consulta/[citaId].tsx`, VERDE en el gate S71). El Antes
ya resolvió este problema para el caso de UNA cita, y su gramática manda:
headers con glifo porque **varían entre sí** (Ley 12 enmendada), filas sin
glifo. Este boceto **copia ese nivel**, no lo reinterpreta (L-155).

**4. ¿Tesis, y este elemento la sirve?** ↓ §2.

**5. ¿Capa y dosis?** Capa **salud** (verdeVital) para el eje 3; la alerta de
seguridad usa `status.danger` — **es estado, no capa**. Dosis **PRESTADOR =
BAJA**: un acento por vista, CTA en `accent.cta` (tealDark por `cta="oficio"`).
Memorial degrada (§4).

**6. ¿3 temas y es/en? ¿Estados?** ↓ §5 y §6. El boceto declara los cinco.

**7. Pasada Chanel:** ↓ §3.

---

## 2 · TESIS · FIRMA (Leyes 14 y 15)

**TESIS:** *"En treinta segundos sabés qué de este animal cambia lo que vas a
hacer en los próximos cinco minutos — y ves lo que los otros que lo cuidan ya
saben."*

**FIRMA — y es de COMPORTAMIENTO, no de color** (§2.7: la firma del lado
prestador suele serlo): **la franja de LOS OTROS ACTORES**. El paseador anotó
que cojea. El groomer le vio la piel. Otra clínica aplicó la antirrábica, y
dice cuál.

Es la firma correcta por tres razones, y las declaro para que M2 las pueda
refutar:
1. **A3.7 lo nombra explícitamente** como la vitrina de conversión: *"ningún
   back-office puede mostrar eso, porque ninguno tiene a los otros actores
   adentro"*.
2. Pasa el **test anti-genérico** de la Ley 15: cualquier app de servicios
   puede listar vacunas; **ninguna** puede mostrar lo que otro oficio observó.
3. **No suma acento** — se monta sobre la capa que ya existe. Ley 4 y Ley 5
   intactas.

---

## 3 · LA PASADA CHANEL (Ley 16) — qué se quita

1. **MUERE la tarjeta del carnet como contador** (`:196-207` hoy: *"8
   vacunas"* dentro de una `Tarjeta` no tapeable). Es el callejón D-459: se
   reemplaza por la sección real de vacunas. **No se conserva el contador** —
   con la lista presente, el número es ruido.
2. **MUERE `sinSenales`** (*"sin señales"* como texto de relleno cuando no hay
   alertas). Ley 16 + Ley 18: la ausencia de alerta se dice **con la ausencia
   de la franja**, no con una frase que ocupa el lugar de una. Es la misma
   firma del Hogar v2: *hogar al día = sección ausente*.
3. **MUERE el título de módulo del historial cuando está vacío** — ya curado
   en `072f3a3`; el boceto lo conserva curado, no lo reintroduce.
4. **Se pliega, no se quita:** identidad completa baja a `PieRevelar` — el vet
   no necesita el microchip en los primeros treinta segundos.

**Lo que NO se quitó y por qué:** la lista de atenciones propias. Parece
candidata (es la parte menos clínica), pero es **el único dato de la matriz
A3.3 que el prestador alimenta él mismo** — y A3.3 lectura 3 dice que cada
oficio ve su propio eje COMPLETO.

---

## 4 · LA COMPOSICIÓN (de arriba hacia abajo)

```
┌──────────────────────────────────────────────┐
│ ← (Encabezado navegacion, título vacío)      │
├──────────────────────────────────────────────┤
│           [AvatarMascota lg]                 │
│              Thor                            │  ← DM Sans light 2xl
│        perro · labrador · 4 años             │  ← Texto apoyo, UNA línea
├──────────────────────────────────────────────┤
│ ⚠ LO QUE TENÉS QUE SABER            (danger) │  ← LA FRANJA · §4.1
│   Alérgico a penicilina                      │
│   Toma enalapril 5mg · 2 veces al día        │
│   Cardiopatía crónica                        │
├──────────────────────────────────────────────┤
│ ● Salud                             (header) │  ← EJE 3 COMPLETO · §4.2
│   Vacunas                                    │
│   ┌ Antirrábica      12 mar 2026           │ │
│   │ Clínica Aurora la aplicó               │ │  ← PROCEDENCIA, nombra colega
│   ├ Quíntuple        03 ago 2025           │ │
│   │ La familia la declaró · carnet ▸       │ │
│   ├ Moquillo         (sin fecha)           │ │
│   │ origen no registrado                   │ │  ← los 83 legados
│   └ [Ver 5 más]                            │ │  ← PieRevelar
│                                              │
│   Casos abiertos                             │
│   ┌ Gastroenteritis · desde 18 jul         │ │
│   └ Vos sos el tratante                    │ │
├──────────────────────────────────────────────┤
│ ● Lo que otros ven         ← LA FIRMA · §4.3 │
│   Paseos · «cojea de la pata trasera»        │
│     Andrés · 16 jul                          │
│   Estética · «piel irritada en el lomo»      │
│     Kary · 02 jul                            │
│   [Ver 3 más]                                │
├──────────────────────────────────────────────┤
│ ● Tu historial con Thor                      │
│   3 atenciones · la última 18 jul            │
├──────────────────────────────────────────────┤
│ [Ver identidad completa]        ← PieRevelar │
└──────────────────────────────────────────────┘
```

### 4.1 · LA FRANJA — la única que preside

**Atraviesa la matriz** (A3.3 lectura 2): se muestra **siempre**, a los cuatro
oficios y a la recepción, aunque su eje esté DESTILADO o en NO.

Contenido, en este orden: **alergias** → **medicación vigente** →
**condiciones que limitan el acto** → **alerta de manejo**.

**Regla de existencia:** cero alertas = **la franja no se monta**. No hay
estado vacío de la franja (Chanel §3.2).

**Lo que la franja NO hace:** no diagnostica, no linkea, no se pliega. Es
lectura, y si se pliega deja de proteger.

### 4.2 · EL EJE 3 — COMPLETO, con procedencia SIEMPRE

Cada vacuna se muestra con **nombre · fecha · procedencia**, y la procedencia
**nombra al colega** cuando fue un prestador (A3.6). Tres voces, cerradas:

| `procedencia` | Voz |
|---|---|
| `declarado_por_prestador` | «{negocio} la aplicó» |
| `declarado_por_familia` | «La familia la declaró» + «carnet ▸» si hay `archivo_url` |
| `NULL` (83 legados) | «origen no registrado» |

`verificado_por_prestador` **no tiene voz porque no tiene productor** (§14.2).
La pantalla **no puede sugerir que algo está verificado**. Si algún día nace el
productor, nace su voz — no antes.

### 4.3 · LO DESTILADO — la firma

Ejes 4 · 5 · 6 en nivel DESTILADO (A3.3): **el estado vigente y lo que
cambió**, jamás la fila cruda. Una línea por observación, con **quién** y
**cuándo**. Tope 2 visibles + `PieRevelar`.

**Y acá hay una tensión que el boceto NO resuelve y manda a la mesa:** el
nivel DESTILADO exige *"trabajando reactividad con correa desde mayo"* — o
sea, **prosa resumida**. Hoy no existe quien la produzca: `D-466` (resumen IA
del expediente) está declarada con disparo *"cuando el expediente real tenga
volumen"*. **El boceto propone el peldaño 0 honesto**: mostrar la observación
**literal más reciente por oficio** con su autor y fecha, que es verdad
verificable y no inventa síntesis. Cuando D-466 exista, sube el peldaño.

---

## 5 · CONTRATO DE DATOS DE PANTALLA (M4) — qué se renderiza y qué se descarta

### 5.1 · Lo que sale de `obtenerPerfilMascota` (reutilizable HOY)

| Campo | Destino | Nota |
|---|---|---|
| `mascota.nombre` · `especie` · `raza` · `fecha_nacimiento` | cabecera | edad se deriva en el riel |
| `mascota.foto_url` | `AvatarMascota` | pasa por `resolverUrlFoto` |
| `mascota.estado_vida` | dispara **memorial** (§6.5) | |
| `vacunas[]` | eje 3 | **insuficiente — ver 5.3** |
| `peso_clinico_kg` | identidad plegada | |
| `umbrales` | ❌ **DESCARTADO A PROPÓSITO** | son los cortes de momento vital del DUEÑO; el vet lee la edad cruda |
| `paseos_total` · `ultimo_paseo_fecha` | ❌ **DESCARTADO A PROPÓSITO** | es métrica del hogar, no señal clínica; su lugar es §4.3 y con observación, no con conteo |
| `mascota.talla` · `pelaje` | ❌ **DESCARTADO** | dato del groomer (eje 4), no del acto vet |
| `mascota.paseo_social_ok` | ❌ **DESCARTADO** en vista vet | pertenece a la columna PASEO de la matriz |
| `tiene_condicion_cronica` · `tiene_emergencia_activa` | ⚠️ **INSUFICIENTE** | son booleanos — ver 5.3 |

### 5.2 · Lo que sale de `leerTimelineMascota` + `obtenerCitasActivasMascota`

`ItemTimeline`: se usan `evento_id`, `tipo`, `eje_jtbd`, `fecha_evento`,
`titulo_fuente`, `atencion_id`. **`fotos_count` se descarta** (el vet no
cuenta fotos) y **`duracion_min` se descarta** en la vista clínica.
`obtenerCitasActivasMascota` alimenta «a qué viene» sólo en el rol recepción
(A3.4); en vista profesional **no se monta** — la cita ya es la puerta.

### 5.3 · ⛔ LOS SEIS HUECOS QUE LA LETRA EXIGE Y EL MOTOR NO SIRVE

**Esto es lo que M2 tiene que auditar con más dureza, porque es lo que separa
este boceto de ser dibujable de ser construible.**

| # | Lo que A3 exige | Estado real | Territorio |
|---|---|---|---|
| H1 | **Alergias** (nivel SEGURIDAD, los 4 oficios) | `mascota_perfil_vigente.alergias` (jsonb) **existe y NINGÚN wrapper la selecciona**. `obtenerDetalleMascotaPrestador` la lee y **la degrada a booleano**. | `packages/api` → **A** |
| H2 | **Medicación vigente** (nivel SEGURIDAD) | `medicacion_actual` (jsonb) existe y **jamás se lee**. Cero wrappers. | `packages/api` → **A** |
| H3 | **Condiciones crónicas con nombre** | sólo `tiene_condicion_cronica: boolean`. La lista se lee, se cuenta con `.length > 0` y **se tira**. | `packages/api` → **A** |
| H4 | **Alerta de manejo («muerde»)** | **NO EXISTE EN EL SCHEMA.** Grep de `muerde\|agresiv\|reactiv\|alerta_seguridad` sobre `database.types.ts` → cero. Único candidato: `temperamento: Json`, **sin shape relevado**. | **MOTOR — decisión de mesa** |
| H5 | **Procedencia en la lista** | `eventos_mascota.procedencia` existe y está poblada (CHECK de 3 valores, `20260718170000:24-25`). **Cero lectores la exponen.** | `packages/api` → **A** |
| H6 | **Lista de vacunas para prestador** | la única lista (`obtenerPerfilMascota.vacunas`) omite `lote`, `veterinario_nombre_externo`, `archivo_url`, `via_administracion` y procedencia. Sin eso **un vet no puede auditar una vacuna declarada por la familia**. | `packages/api` → **A** |

**H4 es el más grave y es el único que no es de la A: es de la mesa.** A3.3
firma que la alerta de seguridad *"NUNCA se destila y NUNCA se oculta"* y que
la recepción la ve por **seguridad laboral**. **Hoy ese dato no existe en
ninguna tabla.** No es un lector que falta: es un modelo que no está. Y la
decisión de S69 es precedente vivo de que la casa sabe modelar esto bien:
`nervioso_otros_perros` separó miedo/evitación de reactividad (tensión /
lanzarse) por decisión founder. **Propongo el mismo tratamiento y NO lo
resuelvo acá.**

> **CONSECUENCIA HONESTA:** con H1–H4 abiertos, **la franja de seguridad de
> §4.1 no se puede construir hoy**. Se puede dibujar. Si se construyera con
> lo que hay, diría *"tiene alergias"* sin decir **cuál** — que es
> exactamente el verosímil-inútil que la Ley 17.6 prohíbe (cada elemento hace
> UN trabajo; un semáforo que no dice qué evitar no hace ninguno).

### 5.4 · PRECONDICIONES DE MOTOR (de la propia letra)

- **D-463** — `mascota_acceso_prestador.oficio`. Su disparo literal es *"la
  primera pantalla que module por oficio — es decir, P3"*. **Sin esta columna
  la matriz A3.3 no se puede aplicar**: hoy el otorgamiento no sabe por qué
  oficio entró el prestador, así que la pantalla **no puede elegir columna**.
- **D-464** — gate de rol (recepción vs profesional) en RLS. La letra lo
  califica de *"hueco de privacidad vivo, no mejora"*. El boceto dibuja la
  vista de recepción (§6.6) pero **no la puede sostener sin RLS**.

**Voto del boceto sobre el orden:** construir P3 **primero para el rol
profesional en el oficio vet**, que es el caso donde la columna de la matriz
es conocida sin D-463 (si entra desde una cita vet, el acto es vet). La vista
de recepción y la modulación por oficio **esperan a D-463/D-464**. Es
decisión de mesa, no mía.

---

## 6 · LOS ESTADOS DECLARADOS (los cinco, exigidos por M1)

### 6.1 · CARGANDO
`EsqueletoGrupo` estático (Ley 13, **sin shimmer**): un bloque de avatar +
tres líneas. **La franja de seguridad NO tiene esqueleto** — no se insinúa una
alerta que quizá no exista. Reemplazo directo, cero layout shift.

### 6.2 · ERROR
`EstadoVacio registro="pantalla"` + `Boton secundario` reintentar. **El error
JAMÁS se disfraza de vacío** (Ley 13). Voz que dirige (17.4): qué pasó + qué
hacer. **Sin acceso** es un error distinto de **falló la red** y tiene su
propia voz — `sin_acceso` del wrapper significa que el otorgamiento caducó o
fue revocado (A3.5.6), y eso se dice con dignidad, no como falla.

### 6.3 · VACÍO — y son TRES vacíos distintos, no uno
- **Sin vacunas:** la sección se monta con voz honesta («Todavía no hay
  vacunas registradas»), **no se oculta** — porque para un vet la ausencia de
  carnet **es información clínica**.
- **Sin observaciones de otros oficios:** la sección **no se monta** (regla de
  existencia). Es la única mascota que sólo conoce esta clínica, y eso no es
  un hueco que haya que anunciar.
- **Sin historial propio:** ya curado en `072f3a3` — *«Va a ser tu primera
  atención con {nombre}»*. Se conserva verbatim.

### 6.4 · PARCIAL (el estado que la RLS hace real)
La visibilidad es **parcial por diseño** (cabecera de la pantalla actual):
identidad ✓, perfil/vacunas ✓, historial **sólo con este prestador** ✓,
**familia humana ✗** (policies solo-miembro, hallazgo S51).

**Regla del boceto:** lo que la RLS no da **no se dibuja con un candado ni con
un "no disponible"** — simplemente no está. Un candado le enseña al vet que
hay algo que no ve, y eso es ruido, no transparencia. **Excepción única:** el
acceso REVOCADO sí se dice (§6.2), porque ahí el vet tenía acceso y lo perdió.

### 6.5 · MEMORIAL — declarado, y con su límite declarado
`mascota.estado_vida` dispara el tema memorial: `ThemeProvider` memorial, la
huella a tinta, **sin color de capa**, sólo fades (Leyes 6 y 8).

**LO QUE ESTE BOCETO NO ASUME:** **cuánto dura el acceso**. A3.9 está
**PENDIENTE DE FIRMA** — el voto del arquitecto es (b) *ventana que cae*, pero
no está firmado. El boceto declara **cómo se ve**, no **hasta cuándo se ve**.
Si la firma sale (a), la pantalla no se monta y en su lugar va la voz de
cierre; si sale (b), se monta degradada con su ventana. **Ambas ramas son
baratas desde este boceto** — y ese es el argumento para no forzar la decisión.

### 6.6 · LA VISTA DE RECEPCIÓN (dibujada, bloqueada por D-464)
Identidad COMPLETA · etapa DESTILADA · **la alerta de seguridad del eje 6** ·
«a qué viene». **Todo lo demás: NO.** No es el expediente con menos filas: es
**otra pantalla**. Hoy no se puede sostener (no hay gate de rol) — se dibuja
para que la letra no se pierda, y **no se construye**.

---

## 7 · LO QUE ESTE BOCETO PIDE DE LA VARA CRUZADA (M2)

Puntos donde **quiero que la A me refute leyendo la fuente**, no la tabla:

1. **Los seis huecos de §5.3** — confirmá contra el schema vivo que
   `alergias`, `medicacion_actual` y `condiciones_cronicas` no tienen lector
   con contenido, y que **`temperamento` no tiene shape que sirva de alerta**.
   Si me equivoqué en uno solo, el peso de la franja §4.1 cambia.
2. **El guard de `obtenerParteConsulta`** — verificá con `pg_get_functiondef`
   que `_user_es_familia_de_mascota` está en el body y que **no hay rama de
   prestador**. Si la hay, el eje 3 gana el parte y el boceto mejora.
3. **La procedencia** — confirmá que es un `select` sobre `eventos_mascota` y
   **no una migración**. Yo lo afirmo; si exige migración, esto cambia de
   tanda.
4. **Los 83 eventos con procedencia NULL** — el censo es de S72-A0, no lo
   corrí yo. **Contámelos vos.**
5. **El estado de D-463** — si el otorgamiento sigue sin `oficio`, ratificá el
   voto de §5.4 (construir sólo profesional-vet primero) o refutalo.

---

## 8 · DECLARACIÓN DE TERRITORIO (76)

- **Nada de este boceto se construyó.** Cero código tocado.
- **Los seis huecos de §5.3 viven en `packages/api` o en el motor** →
  territorio de la **A**. No los toqué y no propongo tocarlos: los declaro.
- **Cero componentes nuevos** propuestos — si el gate pidiera uno, es Ley 11 y
  nace en `packages/ui`, que esta tanda tampoco es mío.
- **76(g):** este boceto no escribe DB. La veda no rige.
