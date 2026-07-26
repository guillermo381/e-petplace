# S77-B · M1 v2 — BOCETO: LA HOJA DEL MIEMBRO, RECOMPUESTA

Contra `LETRA_EDICION_VINCULO_S77` **v2.1 ✅ FIRMADA** (§6 entera, §4/§4bis, §11.3).
Superficie: `apps/prestador/src/app/negocio/equipo.tsx` — Hoja del miembro (hoy L347-403).
NO se construye. El gate del boceto es del founder.

**AUTOCONTENIDO (v2).** La v1 remitía a "ver contrato" y "ver la respuesta del PASO 1.2",
que vivían en el reporte de chat y no acá — por eso M2 no pudo cruzar cuatro pedidos.
Todo lo necesario para cruzarlo está ahora DENTRO de este archivo.

**Estado de fuentes al escribir v2 (verificado, L-166):** la letra está en **v2.1**
(cero ocurrencias de "v2.2" en el archivo) y **no hay reporte M2 depositado** en
`docs/relevamientos/` ni fuera; árbol limpio. Los dos desvíos que corrige esta v2 se
verificaron **contra el repo**, no contra el reporte. Si M2 aporta hallazgos
adicionales, esta v2 vuelve a cruzarse.

---

## Declaración de craft (protocolo obligatorio)

- **TESIS:** *"Lo que esta persona puede hacer en tu negocio se decide acá — y nada
  cambia sin decir antes qué se lleva."*
- **FIRMA:** **la consecuencia visible.** Quitar el último chip médico no se ejecuta y
  se informa: la Hoja dice, en el lugar y ANTES, que esa persona deja de ver la
  historia clínica. Firma de COMPORTAMIENTO — la que la skill pide del lado prestador.
  Test anti-genérico: una app de servicios cualquiera quita un tag en silencio.
- **CHANEL — qué se quita (4 piezas):**
  1. `Interruptor` **profesional** (L361-366) — la letra lo declara DERIVADO de ≥1 chip.
  2. `Interruptor` **recepcion** (L370-375) — membresía, no identidad; su `DELETE` puede
     borrar el piso que la migración A2bis garantiza (§6.2ter).
  3. La clave **`equipo.rolesAyuda`** — describe los dos roles que mueren (Ley 37).
  4. El handler **`toggleRol`** (L147-168) queda sin llamador desde esta Hoja.
- **TESTS (§15 prestador):** dosis baja (un acento, `registro="oficio"`) · NEGOCIO
  gestiona (correcto) · vacío ≠ negocio muerto · verdad firme (el número de citas sale
  de lector real o no se muestra).

## Números (medidos, no adjetivados)

- **Componentes nuevos: 0.** Ley 11 NO se dispara. Se usan:
  `Hoja` · `Texto` · `SelectorOpcion` (multiple) · `Insignia` · `Boton` (destructivo) ·
  `Separador` · `Esqueleto` · `useAviso`.
- **Tokens nuevos: 0** ⇒ **pares WCAG nuevos: 0** ⇒ sigue **178 / 0**.
- **`accent.active` sumados: 0** (Ley 5).
- **Sólidos por superficie: 1** — el `Boton destructivo` de desvincular (Ley 19.7).
- **Interruptores: 2 → 0.**
- **Targets: 44.**
- **VIAJES DE RED AL ABRIR LA HOJA: 4.** *(CORREGIDO — la v1 decía 1, y estaba mal:
  contaba llamadas de WRAPPER, no viajes.)* Desglose leído de la fuente:
  - `obtenerChipsEmpleado` = **3 en serie**, y son dependientes:
    `prestador_empleado_servicios` (saca `servicio_id`) → `prestador_servicios`
    filtrado `.in('id', ids)` → `tipos_servicio` filtrado `.in('codigo', slugs)`.
    Cada uno se filtra con el resultado del anterior: no paralelizan.
  - `obtenerJornadaEmpleado` = **1** (`prestador_horarios` por `empleado_id`).
- **POR QUÉ NO BAJAN A 1, con literal de FKs** (consultado en la DB):
  existe `prestador_empleado_servicios.servicio_id → prestador_servicios.id`, así que
  PostgREST **sí** podría embeber el salto 1→2 (3 ⇒ 2). **NO existe FK de
  `prestador_servicios.tipo_servicio → tipos_servicio.codigo`** (`tipo_servicio` es
  slug de texto), así que el tercer viaje **no es embebible** con el schema de hoy.
  **Piso alcanzable hoy: 2. Llegar a 1 exige una FK ⇒ migración ⇒ motor ⇒ territorio A.**
  Nada de esto es de la Hoja: si A colapsa el wrapper, el boceto no cambia.

---

## La composición

    [A]  estado del vínculo — SOLO si !activo → Insignia "Invitación pendiente"
    [B]  QUÉ ATIENDE  ← Texto seccion
         · SelectorOpcion multiple, acento="oficio", grano OFICIO
         · aviso de disponibilidad (§4bis) — DOS voces, ver [B2]
         · con 0 chips: la voz del piso
    [C]  ⟨LUGAR RESERVADO — Administrador⟩  ·  NO SE DIBUJA
    ───  Separador
    [D]  Desvincular del negocio (heredado, dos toques) + aviso de citas (§11.3)
    [E]  vozError (heredado)

### [B] QUÉ ATIENDE

**Grano OFICIO, no oferta** — copiar-al-vecino: la Hoja de invitar del MISMO archivo ya
escribe a grano de oficio (*"la pantalla escribe oficio, el motor guarda las ofertas"*,
L424-425) con `SelectorOpcion multiple acento="oficio"` (L447-458). Mismo trabajo ⇒
mismo componente ⇒ mismo grano. Un archivo con dos gramáticas para lo mismo es el
pecado que §6.2bis denuncia (*"un archivo, dos caminos, dos leyes"*).

Mapeo (derivable, cero motor nuevo):
- pintar: `chips` agrupados por `oficio`
- encender X: `asignarServiciosEmpleado(id, oficiosNegocio[X].servicioIds)`
- apagar X: `quitarServiciosEmpleado(id, chips.filter(c=>c.oficio===X).map(c=>c.servicioId))`

**EL CATÁLOGO ES LA UNIÓN.** `obtenerOficiosNegocio` filtra `.eq('activo',true)`;
`obtenerChipsEmpleado` NO filtra, y `empleado_tiene_capacidad_clinica` tampoco (S76, a
propósito: *desactivar una oferta no le quita el expediente al vet*). ⇒ un chip sobre
oferta apagada **sigue dando expediente y desaparecería del selector**: invisible e
inquitable — *el lector que degrada a lista vacía y esconde el hueco* (§6.3). El
selector monta `oficios(activos) ∪ oficios(que la persona tiene)`; el oficio que la
persona tiene pero el negocio ya no ofrece se muestra, se puede quitar, y dice por qué
está ahí.

### [B2] EL AVISO DE §4bis — DOS VOCES, NO UNA

**El chip no promete disponibilidad.** Las 8 lectoras entran por `prestador_horarios`,
no por el chip: sin jornada esa persona no aparece en ninguna reserva.

`obtenerJornadaEmpleado` **YA EXISTE** (`equipo.ts:492`, commit `b3bdee5`) y devuelve
`{ franjasActivas, franjasTotales, tieneJornada }`. **El aviso deja de degradarse a
incondicional** (que era el riesgo declarado en v1: un aviso permanente es ruido) y
gana una distinción que la v1 no tenía:

| estado | qué significa | voz |
|---|---|---|
| `franjasActivas > 0` | aparece en reservas | **sin aviso** |
| `franjasTotales === 0` | **nunca cargó** su jornada | falta cargarla |
| `franjasTotales > 0 && franjasActivas === 0` | **la pausó** | está pausada, se reactiva |

Son dos hechos distintos con dos caminos distintos: uno se crea, el otro se reactiva.
Decirlos con la misma frase sería mandar al titular a crear lo que ya existe.
El aviso se monta SOLO con ≥1 chip (sin chips no hay promesa que romper) y su forma
—celda navegable a la jornada vs. línea de apoyo— **la firma el founder**: §6.3 dice
explícitamente que la forma la decide M1 sobre la lámina.

### [B3] EL ÚLTIMO CHIP MÉDICO — LOS DOS MOMENTOS (§4 + §6.3)

**Por qué hacen falta dos, leído del código** *(esto vivía en el reporte de chat; entra
acá para que M2 lo cruce)*: hay **tres** lecturas en juego, no dos.

1. la que hace la **pantalla** al abrir la Hoja — de ahí sale la advertencia;
2. `antes`, adentro de `quitarServiciosEmpleado` (`equipo.ts:397`), justo antes del DELETE;
3. `despues`, re-leído tras el DELETE (`equipo.ts:413`).

La advertencia cuelga de **(1)**, que puede envejecer entre que la Hoja se abre y el
titular confirma (otro titular con la Hoja abierta, otra sesión). Entonces **discrepan
en las dos direcciones**: puede **no avisar y perderse igual** la capacidad clínica, y
puede **avisar y no perderse** (alguien sumó otro chip médico en el medio). Por eso
`perdioCapacidadClinicaPorChip` se computa sobre **(3)** y es **el único dato
autoritativo**. Advertencia antes, reporte honesto después: sin el segundo, el motor
devuelve una verdad que nadie muestra.

- **ANTES:** si apagar el oficio deja `chipsMedicos === 0`, no se ejecuta al toque —
  confirmación EN EL LUGAR, patrón `confirmaDesvincular` que esta Hoja ya usa (dos
  toques, sin Hoja anidada). Voz: qué se lleva, no "¿estás seguro?".
- **DESPUÉS:** `perdioCapacidadClinicaPorChip` se muestra (`useAviso`).
- **Repintado:** `ResultadoQuitarChips` ya devuelve **`chips: ChipEmpleado[]`**
  (S77-A, `b3bdee5`) ⇒ la Hoja repinta con eso, **sin re-lectura extra**.

**AGUJERO DECLARADO (no lo cubre la letra, sale de leer el wrapper):** no hay
transacción — `quitarServiciosEmpleado` es lectura → DELETE → lectura, tres viajes.
Si el DELETE pasa y la re-lectura de `:413` falla, el wrapper devuelve `error_lectura`
**con los chips ya borrados**. La Hoja **no puede** decir ahí *"no pudimos quitar el
chip"*: mentiría. Requisito de voz: estado incierto + re-leer, jamás negar el acto.

### [C] EL LUGAR DEL ADMINISTRADOR — RESERVADO, NO DIBUJADO

La reserva es **de ORDEN, no de píxeles**: la sección va entre [B] y el Separador, así
que cuando el toggle llegue entra sin reordenar nada. **Cero placeholder, cero toggle
deshabilitado, cero "próximamente"** — Ley 23, y el precedente literal de la Hoja
vecina: *"un toggle que rebota al guardar es Ley 23 rota — entra cuando su motor entre"*
(L426-428).

### [D] DESVINCULAR — SE HEREDA, GANA EL AVISO

La baja **no se rehace** (§6.3): el `Boton destructivo` de dos toques queda tal cual.
Gana el aviso de §11.3, **antes** del acto:
- **con número real:** *"tiene N citas en los próximos días; al darla de baja pasan a
  ser citas de la clínica."*
- **sin lector: NO SE DICE NÚMERO** (L-139) — la consecuencia sin cantidad.
- **la asimetría, siempre:** la baja es reversible, **el despegue no**. Si la reactivás,
  las citas no vuelven.
- **la voz NO recicla el aviso de renovación** (§6.3): ese string nombra *cambio de
  agenda del paseador* — una causa falsa acá, y llega semanas tarde.

---

## Estados declarados

| estado | qué muestra |
|---|---|
| cargando | `Esqueleto` en el bloque del selector; el resto de la Hoja ya vive |
| 0 chips | la voz del piso, con camino |
| ≥1 chip | selector con los oficios marcados |
| chip sobre oferta apagada | se muestra, quitable, con su porqué |
| ≥1 chip sin jornada | aviso [B2], en su voz según el caso |
| escribiendo | selector bloqueado (`ocupado`), sin doble disparo |
| error de lectura | voz honesta + reintento — jamás lista vacía (Ley 13) |
| error DESPUÉS del DELETE | estado incierto + re-leer; jamás "no se quitó" |
| miembro titular | rama `roles.includes('dueño')` intacta: solo Insignia |
| no-dueño | la pantalla ya gatea por `esDueno` (Ley 23, §6.3) |

Temas: los tres por tokens. es/en: claves nuevas nacen en par.
**No se dibuja un chip "Recepción"**: sería membresía tratada como identidad (§6.2ter).

---

## CONTRATO DE DATOS — completo, acá adentro

### Existe y alcanza (verificado en `packages/api/src/wrappers/equipo.ts`)

| pieza | estado |
|---|---|
| `obtenerChipsEmpleado(empleadoId)` | ✅ (3 viajes, ver Números) |
| `asignarServiciosEmpleado(empleadoId, servicioIds)` | ✅ — su L13 declara que sirve tal cual para quien ya está adentro |
| `quitarServiciosEmpleado(empleadoId, servicioIds)` | ✅ — devuelve `chips`, conteos y `perdioCapacidadClinicaPorChip` |
| `obtenerOficiosNegocio(prestadorId)` | ✅ — `{oficio, servicioIds}`, solo ofertas `activo=true` |
| `obtenerJornadaEmpleado(empleadoId)` | ✅ **entregado S77-A** (`b3bdee5`) — habilita [B2] |
| `desvincularEmpleado(empleadoId)` | ✅ heredado |
| `MiembroEquipo` | ✅ trae `activo` (para [A]) |

### PEDIDOS — estado al escribir v2

1. **El conteo de citas de §11.3 — ABIERTO.** No existe lector. Sin él la Hoja dice la
   consecuencia **sin número** (L-139). Llega solo si el RPC de baja de §11.2 lo
   devuelve; es el único pedido que sigue bloqueando una parte del boceto.
2. ~~Lector de jornada por empleado~~ — **ENTREGADO** (`b3bdee5`), y mejor de lo pedido:
   trae `franjasTotales` además de `franjasActivas`, que es lo que permite las DOS voces.
3. ~~Chips sobrevivientes en `ResultadoQuitarChips`~~ — **ENTREGADO** (`b3bdee5`).
4. **A decidir por A (no es del boceto):** si `quitarRolEmpleado`/`asignarRolEmpleado`
   quedan sin consumidor al sacar los dos toggles, o si otra superficie los usa.
5. **Opcional, de A:** colapsar `obtenerChipsEmpleado` de 3 a 2 viajes por embed
   (la FK del salto 1→2 existe). Bajar a 1 exigiría FK nueva sobre
   `prestador_servicios.tipo_servicio` ⇒ migración. **El boceto no depende de esto.**
