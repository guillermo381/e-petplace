# S110-D · MEDICIÓN ⑧ — LAS CUATRO TABLAS QUE NADIE MIDIÓ

> **SELLO DE LA MEDICIÓN** *(freno con hora, como quedó escrito tras el
> incidente de la letra):*
> **1-sep-2026 01:00:08 -05** · rama `pista/s110-d` sha `aca20b49` · base
> `202ff494` (00:04:25) · `origin/main` al medir: `ae54ab05` · árbol limpio.
> **Objeto:** `zyltipqscdsdsxnjclhp`. **Repo:** archivos trackeados, buscador
> NUL-safe. **Nada medido en bundle.**
>
> **Pista D · SOLO LECTURA.** Cero DDL, cero backfill, cero seeds.

---

## VEREDICTO POR TABLA

| tabla | veredicto |
|---|---|
| `mascotas_adopcion` | **construcción muerta que el plan deroga** — y es la trampa: 11 inserts históricos, 0 filas, 0 escritores |
| `solicitudes_adopcion` | **construcción muerta que el plan deroga** — trae el flujo de §5 ya dibujado (scoring, entrevista), 2 inserts históricos |
| `adopcion_seguimiento` | **construcción muerta, jamás usada** — 0 inserts en toda su vida; es el check-in post-adopción que §11 excluye de v1 |
| `refugios` | **construcción muerta que el plan hereda EN PARTE** — 0 inserts, pero tiene `cuenta_comercial_id` y el mismo ciclo de verificación que `prestadores` |

> **Y EL CRUCE QUE DECIDE: SÍ, `mascotas_adopcion` ES UNA TABLA APARTE DE
> `mascotas`. No comparte una sola columna de identidad ni una sola FK con
> ella. Choca de frente con §0, y la que tiene que sobrevivir es `mascotas` —
> porque `eventos_mascota` sólo sabe colgar de ahí, y sin expediente el §0 no
> existe.**

---

## a) LAS CUATRO, DEL OBJETO

### `mascotas_adopcion` — 29 columnas · **0 filas** · **11 inserts históricos**
```
id · nombre · especie · raza · edad(TEXT) · sexo · tamanio · foto · descripcion
vacunada · esterilizada · urgente · color · activa · costo_vacunas · costo_esteril
nivel_energia · compatible_ninos · compatible_mascotas · requiere_espacio
requiere_jardin · nivel_adiestramiento · historia · necesidades_especiales
vistas · favoritos · estado(NOT NULL) · refugio_id · created_at
```
```
CHECK estado             ∈ disponible · reservada · adoptada · retirada
CHECK nivel_energia      ∈ bajo · medio · alto
CHECK nivel_adiestramiento ∈ ninguno · basico · intermedio · avanzado
FK  refugio_id -> refugios(id) ON DELETE SET NULL      (la ÚNICA saliente)
FK entrantes: donaciones · adopcion_seguimiento
```
🔴 **Sin `familia_id`, sin `mascota_id`, sin `user_id`.** Su `edad` es **texto**.

### `solicitudes_adopcion` — 22 columnas · **0 filas** · **2 inserts históricos**
```
id · user_id · mascota_nombre(TEXT) · nombre_solicitante · email · telefono
tiene_mascotas · espacio_exterior · motivo · score_compatibilidad · score_breakdown(jsonb)
score_calculado_en · entrevista_requerida · entrevista_fecha · entrevista_notas
entrevista_resultado · motivo_rechazo · aprobado_por · aprobado_en · estado · refugio_id
```
```
CHECK estado ∈ pendiente · en_revision · entrevista_programada · aprobada · rechazada · completada
CHECK entrevista_resultado ∈ aprobado · rechazado · pendiente
CHECK telefono !~ '^\+'                      (el teléfono sin '+', patrón viejo de la casa)
FK aprobado_por -> profiles · refugio_id -> refugios · user_id -> auth.users
```
⚠️ **`mascota_nombre` es TEXT: la solicitud referencia al animal POR NOMBRE, no
por id.** *No hay forma de saber a qué ficha apuntaba una solicitud.*

### `adopcion_seguimiento` — 14 columnas · **0 filas** · **0 inserts EN TODA SU VIDA**
```
id · solicitud_id · mascota_id(NOT NULL) · adoptante_id · tipo · estado_mascota
descripcion · fotos(jsonb) · felicidad_adoptante · comentarios · completado
completado_en · recordatorio_enviado · created_at
CHECK tipo ∈ semana_1 · mes_1 · mes_3 · mes_6 · anual
CHECK estado_mascota ∈ bien · adaptandose · problemas · devuelta
CHECK felicidad_adoptante BETWEEN 1 AND 5
```
🔑 **`mascota_id` → FK a `mascotas_adopcion(id)` ON DELETE CASCADE. NO a `mascotas`.**

### `refugios` — 39 columnas · **0 filas** · **0 inserts**, pero **322 idx_scans**
```
id · cuenta_comercial_id · user_id · country_code · ciudad · provincia · direccion
lat · lon · nombre · descripcion · historia · foto_url · fotos_galeria
telefono · whatsapp · email · sitio_web · instagram · facebook
especies_atendidas · capacidad_maxima · numero_registro · certificaciones · permisos_legales
acepta_donaciones · moneda_donaciones · monto_minimo_donacion
visitas_permitidas · horario_visitas
estado · verificado_por · verificado_en · motivo_rechazo
calificacion_promedio · total_resenas · metadata · created_at · updated_at
```
```
CHECK estado ∈ pendiente · aprobado · rechazado · suspendido
CHECK (estado IN (aprobado,rechazado)) ⇒ verificado_en IS NOT NULL
CHECK telefono / whatsapp !~ '^\+'
```
🔑 **Tiene `cuenta_comercial_id`** y **el mismo ciclo de verificación que
`prestadores`** (`estado` + `verificado_por` + `verificado_en` +
`motivo_rechazo`, con el CHECK que exige fecha al aprobar). ⚠️ **Y modela
donación EN DINERO** (`acepta_donaciones`, `moneda_donaciones`,
`monto_minimo_donacion`) — **justo lo que §11 excluye de v1.**

---

## b) RLS — 16 policies literales

```
### mascotas_adopcion
  Lectura pública mascotas adopción   cmd=r  roles=(todos)      USING: true
  public_select_mascotas_adopcion     cmd=r  authenticated/anon USING: (activa = true)
  admins_read_all_mascotas_adopcion   cmd=r  roles=(todos)      USING: is_admin()
  admin_all_mascotas_adopcion         cmd=*  authenticated      USING/CHECK: is_admin()

### solicitudes_adopcion
  solicitudes_select                  cmd=r  USING: (auth.uid() = user_id)
  solicitudes_insert                  cmd=a  CHECK: (auth.uid() = user_id)
  admin_select_solicitudes_adopcion   cmd=r  USING: (is_admin() OR (user_id = auth.uid()))
  admin_update_solicitudes_adopcion   cmd=w  USING/CHECK: is_admin()
  admins_read_all_solicitudes         cmd=r  USING: is_admin()

### adopcion_seguimiento
  as_owner                            cmd=*  USING: ((adoptante_id = auth.uid()) OR is_admin())
  admin_all_adopcion_seguimiento      cmd=*  USING/CHECK: is_admin()

### refugios
  owner_select_own_refugio            cmd=r  USING: (user_id = auth.uid())
  owner_insert_own_refugio            cmd=a  CHECK: ((user_id = auth.uid()) AND (estado = 'pendiente'))
  owner_update_own_refugio            cmd=w  USING/CHECK: (user_id = auth.uid())
  publico_lee_refugios_aprobados      cmd=r  USING: (estado = 'aprobado')
  admin_all_refugios                  cmd=*  USING/CHECK: is_admin()
```

🔴 **`mascotas_adopcion` tiene una policy `USING true` sin rol acotado**, y
`anon` tiene `SELECT` concedido sobre la tabla. **Hoy es inofensiva —0 filas—
pero es la forma que un vertical heredaría si reusa la tabla.** *No es mi lote y
va en una línea; el número que la hace inofensiva es de hoy, no una propiedad.*

⚠️ **`refugios` ya tiene su alta autoservicio**: `owner_insert_own_refugio`
permite que cualquier autenticado se cree un refugio **en estado `pendiente`**,
y sólo un admin lo aprueba. *El camino de §2 (el actor refugio) está cableado en
RLS y nunca se usó.*

---

## c) ESCRITORES Y LECTORES REALES — con sus dos controles

**En el motor (funciones):**
```
funciones que mencionan mascotas_adopcion     -> (NINGUNA)
funciones que mencionan solicitudes_adopcion  -> (NINGUNA)
funciones que mencionan adopcion_seguimiento  -> (NINGUNA)
funciones que mencionan refugios              -> (NINGUNA)
CONTROL+ funciones que mencionan familia_miembro -> 38     ⇒ la búsqueda ve
```

**En el repo (buscador NUL-safe sobre trackeados):**
```
mascotas_adopcion|solicitudes_adopcion|adopcion_seguimiento -> 15 líneas, y son:
   packages/api/src/database.types.ts   (GENERADO — no es consumo)
   apps/prestador/src/lib/paises.ts:101 (un COMENTARIO)
CONTROL+ obtenerMascotasDeFamilia -> 40 líneas             ⇒ el buscador ve
CONTROL- funcionQueNoExisteControlNegativo -> 0
```

⇒ **cero escritores, cero lectores, en motor y en las dos apps.**

🔴 **PERO `refugios` tiene 322 `idx_scan` y 218 `seq_scan`.** *Algo la lee, y no
es el monorepo ni una función.* **Son las webs del legado que comparten esta
base** (portal admin, `e-petplace-v2`; S95-F ya midió que el portal lee tablas
que el monorepo no conoce). **No lo medí: no tengo esos repos acá.**

---

## d) DE DÓNDE NACEN — y acá me corrijo a mí mismo

**Ninguna de las cuatro nace de una migración del monorepo.** Aparecen sólo en
migraciones que las **mencionan en comentarios** (revokes de S74/S92, la galería
de S84, la coherencia de origen de S91) — **nunca en una DDL.**

⚠️ **Y ese dato NO alcanza para separar «legado muerto» de «legado vivo», que es
lo que yo iba a concluir:**
```
CREATE TABLE de las cuatro          -> 0
CONTROL+ CREATE TABLE guarderia_estadias -> 1   (S107)  ⇒ el instrumento ve
CONTROL+ CREATE TABLE familia_miembro    -> 0
CONTROL+ CREATE TABLE mascotas           -> 0
```
**`mascotas` y `familia_miembro` tampoco tienen su `CREATE TABLE` en el
monorepo** ⇒ *«no nace de migración» describe a media casa, no a estas cuatro.*
**El primer instrumento que usé para (d) daba `(NINGUNA)` con el control
positivo también en cero — es decir, estaba roto y lo reporté como resultado
antes de mirar el control.** Lo rehice.

### El discriminador que sí sirve: OID (orden de creación) + actividad histórica

```
tabla                    oid      inserts_hist  seq_scan   idx_scan
mascotas                 17568    348           455.980    758.490
solicitudes_adopcion     17693    2                 996          3
pedidos                  17708    225             7.334     70.809
mascotas_adopcion        25395    11                135         11
donaciones               25412    0                 292          1
adopcion_seguimiento     29034    0                 226          5
refugios                 31351    0                 218        322
eventos_mascota          31733    2.440           2.424     13.857
familia                  32826    266             3.203      6.119
familia_miembro          32859    221            22.681     11.949
guarderia_estadias       48990    573             1.408      9.631
```
**Control del instrumento:** el orden por OID reproduce la historia conocida de
la casa —`mascotas` primero, `guarderia_estadias` último (S107), `familia` y
`familia_miembro` juntas después del expediente— ⇒ **el orden es legible.**

🔑 **LAS CUATRO SON MÁS VIEJAS QUE `eventos_mascota`.** `solicitudes_adopcion`
es de las más antiguas de la base, **anterior incluso a `pedidos`**. ⇒ **este
subsistema se construyó ANTES de que existiera el Bio-Expediente.** No es un
esqueleto sembrado esperando: **es el producto anterior.**

*(Caveat declarado: `n_tup_ins` cuenta desde el último reset de estadísticas, no
desde el origen. Los 11 y los 2 son un **piso**, no un total histórico.)*

### 🔴 Y ACÁ CORRIJO UNA INFERENCIA MÍA DEL LOTE 1

En el lote 1 escribí que `virtual_refugio` y `transferencia_familia` eran *«dos
slots reservados y vacíos: alguien ya vio venir esto»*. **Eso era una inferencia,
no una medición, y la medición la desmiente en parte:**
```
CONTROL+ 'pendiente_completar' en migraciones -> 5
CONTROL+ 'alta_asistida'                      -> 7
CONTROL+ 'virtual_prestador'                  -> 2
MEDICIÓN 'virtual_refugio'                    -> 0
MEDICIÓN 'transferencia_familia'              -> 0
MEDICIÓN 'chk_familia_tipo'                   -> 0
```
**Su hermano `virtual_prestador` sí aparece en dos migraciones; `virtual_refugio`
en ninguna.** ⇒ **el valor vive en el CHECK vivo pero su literal nunca pasó por
el rastro de migraciones del monorepo.** *Que «alguien lo vio venir» sigue siendo
plausible y ahora es explícitamente NO MEDIDO: pudo entrar por Studio, por una
migración del producto viejo, o con la propia tabla. Lo que sé es dónde NO está.*

---

## e) EL CRUCE QUE DECIDE — `mascotas_adopcion` vs `mascotas`

**Son dos tablas sin un solo punto de contacto:**

| | `mascotas` | `mascotas_adopcion` |
|---|---|---|
| dueño | `familia_id` **NOT NULL** | **ninguno** |
| identidad | `pet_hash` UNIQUE, `microchip` UNIQUE | ninguna |
| edad | `fecha_nacimiento` date + `precision` | `edad` **TEXT** |
| expediente | **83 FK entrantes**, `eventos_mascota` 536 filas | **2 FK entrantes**, cero eventos posibles |
| vitrina | no tiene | `urgente`·`vistas`·`favoritos`·`compatible_ninos`… |
| vivo | 83 filas · 348 inserts | **0 filas · 0 escritores** |

**FK entre los dos mundos: NINGUNA, en ninguna dirección.**

🔴 **El choque con §0 es directo y no admite convivencia.** §0 firma que *«la
adopción no crea la mascota: le cambia la familia»* y que el refugio carga
eventos **antes** de que exista la familia. Pero **`eventos_mascota` tiene FK a
`mascotas`** ⇒ **una `mascotas_adopcion` no puede tener un solo evento de
expediente, nunca, por construcción.** Un adoptable que viva ahí llega a su
familia **sin historia**, y la adopción tendría que **crear** la mascota — que
es exactamente lo que §0 deroga.

> **Cuál sobrevive: `mascotas`.** No por preferencia — **porque es la única que
> el expediente sabe referenciar**, y el expediente es la tesis del vertical.
> `mascotas_adopcion` no se puede «adaptar»: lo que le falta no es una columna,
> es **ser el sujeto que las 83 tablas del expediente ya apuntan.**

**Lo que sí conviene NO tirar, y es de la mesa decidirlo:** las 29 columnas de
`mascotas_adopcion` son **el vocabulario de vitrina que §4 va a pedir**
(`urgente`, `compatible_ninos`, `compatible_mascotas`, `requiere_jardin`,
`nivel_energia`, `necesidades_especiales`, `vistas`, `favoritos`), y las 22 de
`solicitudes_adopcion` son **el flujo de §5 ya pensado** (scoring con su
breakdown, entrevista con fecha/notas/resultado, motivo de rechazo). *Eso es
diseño heredado que se puede leer; la tabla es la que no sirve.* **Y `refugios`
es la más rescatable de las cuatro:** ya tiene `cuenta_comercial_id`, el ciclo
de verificación de `prestadores` y su alta autoservicio en RLS.

⚠️ **Advertencia de alcance sobre `refugios`, medida:** modela **donación en
DINERO** (`acepta_donaciones`, `moneda_donaciones`, `monto_minimo_donacion`) —
que §11 excluye de v1 y §1 prohíbe por figura (*«el padrino aporta productos,
jamás plata»*, por el mandato de recaudación de `D-900`). **Heredar la tabla sin
podar esas tres columnas es heredar una promesa que la letra prohíbe.**

---

## LO QUE NO SE MIDIÓ (declarado)

1. **Si las webs del legado leen o escriben estas cuatro** — `refugios` tiene
   322 `idx_scan` que no salen del monorepo. **No tengo esos repos acá**, y
   S95-F ya probó que el portal admin lee tablas que el monorepo no conoce.
   **Es la pregunta que decide si «muerta» significa «borrable».**
2. **De dónde salió `virtual_refugio`** — sé que no está en las migraciones del
   monorepo; no sé por dónde entró.
3. **Nada en bundle corriendo.**
