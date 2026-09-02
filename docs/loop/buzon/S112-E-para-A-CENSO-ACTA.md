# BUZÓN · S112-E → A · ① CENSO DE LAS VARIABLES DEL ACTA

> **CONTRA QUÉ Y CUÁNDO.** Contra el **OBJETO** (DB linkeada `zyltipqscdsdsxnjclhp`)
> y contra `main` = **`978666bd`**, el **1-sep-2026, 21:30 -05**.
> **El acta NO se leyó del prompt: se leyó de la base.** `adopcion_documentos`
> `codigo='acta_adopcion' version=1`, 5350 chars, `sha256 f788d88352cc…`,
> cargada por A entre las 21:16 y las 21:26 de hoy.
>
> ⚠️ **Este documento se vence solo.** Entre mi primera medición de
> `adopcion_documentos` (0 filas, 02:05 UTC) y la última (5 filas, 02:30 UTC)
> A cargó los tres textos y versionó dos. Si `sha256` del acta ya no es
> `f788d88352cc…`, esta tabla describe otro documento.

---

## LO QUE SE MIDIÓ, Y CÓMO

Las variables **no las puse yo**: salieron del texto con
`grep -o "{{[^}]*}}"` y `grep -o "\[\[[^]]*\]\]"` sobre el contenido traído de
la base. **22 placeholders `{{}}` y 7 bloques condicionales `[[si …]]`.**
Cada fila de abajo se resolvió consultando `information_schema.columns` sobre
el esquema entero (búsqueda por NOMBRE sobre **299 tablas y 23 vistas**, no por memoria) y,
donde la columna existe, se midió **cuántas filas la tienen llena**.

*Una columna que existe y está vacía en el 100 % de las filas no es «existe»:
por eso la tercera columna trae el número y no un tilde.*

---

## ① LAS 22 VARIABLES

| # | variable del acta | dónde vive HOY | llenado medido |
|---|---|---|---|
| 1 | `{{folio}}` | `documento_token.folio` — lo genera `emitir_token_documento`, formato `F-YYYY-NNNNNN` (secuencia global `documento_folio_seq`) | ⚠️ **la puerta no admite el acta**: `emitir_token_documento` rebota `tipo_documento_invalido` si el código no está en `cat_documentos_mascota`, y ese catálogo tiene **5 filas** (`carnet_vacunas`, `certificado_salud`, `ficha_identidad`, `historia_clinica`, `receta`) — **ninguna es el acta** |
| 2 | `{{ciudad}}` (dónde se celebra el acto) | **NO EXISTE** — ninguna columna dice dónde ocurre la entrega. Lo más cercano son `profiles.ciudad` (adoptante) y `prestadores.ciudad`, que son domicilios, no lugar del acto | — |
| 3 | `{{fecha_hora}}` | `now()` del servidor · queda en `eventos_mascota.fecha_evento` del evento `transferencia_familia` | ✅ lo escribe el motor |
| 4 | `{{refugio_denominacion}}` | `cuentas_comerciales.razon_social` (NOT NULL) · `nombre_comercial` para la vidriera | ✅ columna NOT NULL · **0 cuentas con rol `refugio`** (`cuenta_roles` tiene 14 filas: 9 `prestador_servicios`, 5 `seller_productos`) |
| 5 | `{{refugio_acuerdo}}` (N.º de acuerdo de personalidad jurídica) | **NO EXISTE.** `cuentas_comerciales` tiene `identificacion_fiscal` (RUC) y `metadata jsonb` sin clave declarada para esto. La `refugios` legada tiene `numero_registro` y `permisos_legales` — **0 filas, y S111 declaró que no se construye sobre ella (`D-991`)** | — |
| 6 | `{{refugio_representante_nombre}}` | `profiles.nombre` del `cuentas_comerciales.owner_profile_id` | 163 / 172 |
| 7 | `{{refugio_representante_cedula}}` | `profiles.identificacion_fiscal`, con `profiles.tipo_identificacion` | 🔴 **0 / 172.** `tipo_identificacion` dice `cedula` en las 172 filas (default) y **el valor está vacío en todas**. *Es identidad FISCAL para facturar, no documento verificado para un acto legal — y hoy no hay ni el dato ni la puerta que lo pida* |
| 8 | `{{adoptante_nombre}}` | `profiles.nombre` | 163 / 172 |
| 9 | `{{adoptante_cedula}}` | `profiles.identificacion_fiscal` | 🔴 **0 / 172** (misma columna que ⑦) |
| 10 | `{{adoptante_ciudad}}` | `profiles.direccion_ciudad` · `profiles.ciudad` (dos columnas, texto libre; existe `cat_ciudades` con 9 filas y **ninguna de las dos la referencia**) | `direccion_ciudad` 15 / 172 · `ciudad` 30 / 172 |
| 11 | `{{animal_nombre}}` | `mascotas.nombre` (NOT NULL) | ✅ 83 / 83 |
| 12 | `{{animal_especie}}` | `mascotas.especie` (NOT NULL) | ✅ 83 / 83 |
| 13 | `{{animal_sexo}}` | `mascotas.sexo` — CHECK `macho\|hembra\|desconocido`, nullable | ⚠️ **28 / 83.** 55 mascotas con `sexo` NULL **y cero con `'desconocido'`**: la ausencia hoy es NULL, no el valor que el vocabulario tiene para decirla |
| 14 | `{{animal_edad_estimada}}` | derivada de `mascotas.fecha_nacimiento` + `fecha_nacimiento_precision` (`exacta\|aproximada\|estimada`) | 55 / 83 fecha · 54 / 83 precisión |
| 15 | `{{animal_senas}}` (señas particulares) | 🔴 **NO EXISTE.** `mascotas` no tiene descripción ni señas; `adopcion_publicacion` tampoco. Lo más cercano es `evento_identidad_personal` subtipo **`senal_sutil`**, que por su propio comentario es **carácter** («personalidad, gusto, miedo, mania_ritual, senal_sutil»), no descripción física | — |
| 16 | `{{animal_microchip\|no posee}}` | `mascotas.microchip` · `evento_microchip_asignado.microchip_id` (con fabricante, fecha e implante) · `mascota_perfil_vigente.microchip_activo` | ⚠️ **0 / 83** en `mascotas.microchip` y **0 eventos** `microchip_asignado`. **Único caso, con `{{animal_remetfu}}`, donde el acta trae fallback (`\|no posee`) — degrada honesto** |
| 17 | `{{animal_remetfu\|pendiente}}` | 🔴 **NO EXISTE.** Cero columnas con `remetfu` en el esquema; en el repo la palabra vive en 3 archivos y **ninguno es código** (`CRITERIO_LEGAL_GUARDERIA.md`, `LETRA_ADOPCION.md`, `hoja-acta-guarderia.tsx`) | — |
| 18 | `{{origen_cesion_fecha}}` | 🔴 **NO EXISTE.** `mascotas.origen` es un CHECK de 9 valores (`criadero, refugio, adoptado, comprado_particular, nacido_en_casa, encontrado, transferido, desconocido, alta_asistida`) — **no tiene «rescate» ni «cesión»**, y describe de dónde viene el animal **para la familia**, no cómo lo obtuvo el refugio. `mascotas.fecha_alta` es el alta en la app | — |
| 19 | `{{firma_refugio}}` | 🔴 **NO EXISTE.** Cero columnas de firma. ⚠️ *Nota del instrumento: el patrón `%firma%` devuelve **3 filas** y las tres son coincidencias de substring de **con-FIRMA-do** (`estadias.confirmado_en`, `pagos_intentos.confirmado_por`, `v_pedidos_narrativa.pago_confirmado_en`). Un censo por patrón acota, no cierra (`L-437`): las tres se abrieron una por una antes de decir cero.* `traspasar_mascota_a_familia` tiene 4 parámetros (`mascota`, `familia_destino`, `acta_version`, `acta_codigo`) y **ninguno es una firma, un código ni una re-autenticación** | — |
| 20 | `{{firma_adoptante}}` | 🔴 **NO EXISTE** (ídem ⑲) | — |
| 21 | `{{registro_fecha_hora}}` | `eventos_mascota.fecha_evento` / `created_at` del evento `transferencia_familia` | ✅ lo escribe el motor |
| 22 | `{{hash_documento}}` | `adopcion_documentos.sha256` — **existe desde hoy** (A, `20260907720000`, luego enmendado de GENERATED a trigger) | ⚠️ **es el hash de la PLANTILLA, no del acta emitida.** Hoy `f788d88352cc…` identifica el texto v1 con sus llaves sin resolver. *Si «hash del documento» debe identificar **este** acta con **estos** nombres, es otro hash y no existe — lo nombro, no lo curo* |

---

## ② LOS 7 BLOQUES CONDICIONALES

| bloque | de qué dato depende | estado |
|---|---|---|
| `[[si refugio es organización]]` | `cuentas_comerciales.tipo_fiscal` — enum de 4: `persona_natural`, `persona_natural_obligada`, `persona_juridica`, **`entidad_sin_fines_lucro`** | ✅ el dato existe y el vocabulario alcanza. ⚠️ el texto que el bloque abre pide `{{refugio_acuerdo}}`, que **no existe** (⑤) |
| `[[si refugio es rescatista independiente]]` | ídem (`persona_natural`) | ✅ |
| `[[si origen es rescate]]` | 🔴 **no hay dato.** `mascotas.origen` no distingue rescate de cesión (⑱) | — |
| `[[si origen es cesión]]` | 🔴 ídem, y además pide `{{origen_cesion_fecha}}` | — |
| `[[si ciudad es Quito]]` (obligación REMETFU + microchip, 15 días) | `profiles.direccion_ciudad` / `profiles.ciudad`, **texto libre sin catálogo** (`cat_ciudades` existe con 9 filas y nadie la referencia desde `profiles`) | ⚠️ 15 y 30 de 172. *Una cláusula legal que se activa comparando un texto libre contra la palabra «Quito» se apaga sola con «QUITO», «Quito, Pichincha» o el campo vacío* |
| `[[si animal es menor de seis meses y no está esterilizado]]` | edad ✅ (`fecha_nacimiento`, 55/83) · esterilización 🔴 **no hay dato**: `cat_tipos_evento` tiene el código `esterilizacion` **activo y sin tabla tipada**, y `eventos_mascota` tiene **0 filas** de ese tipo. La única columna `esterilizada` del esquema está en `mascotas_adopcion` (legada, 0 filas, sin consumidor) | ⚠️ **el bloque no puede evaluarse: le falta la mitad, y la mitad que falta es la que decide** |
| `[[si el refugio declaró bono de adopción]]` | 🔴 **no hay dato, y por decisión**: `LETRA_ADOPCION` §11 deja el bono fuera de v1, y `condiciones_adopcion` v1 §5 dice que se acuerda «fuera de la Plataforma» | — |

---

## ③ EL RESUMEN QUE IMPORTA, EN NÚMEROS

- **De 22 variables: 6 las escribe el motor o existen llenas** (folio con reparo, nombre y especie del animal, las dos fechas/horas, la denominación del refugio, el hash de la plantilla).
- **7 existen como columna y están vacías o a medias** (sexo 28/83, edad 55/83, microchip 0/83, las dos cédulas 0/172, ciudad del adoptante 15-30/172, nombre 163/172).
- **7 no existen en ninguna parte del esquema**: ciudad del acto · acuerdo de personalidad jurídica · señas particulares · REMETFU · origen rescate/cesión con su fecha · **las dos firmas**.
- **2 de las 22 declaran fallback** (`|no posee`, `|pendiente`). **Las otras 20 no dicen qué se imprime cuando el dato falta** — y de esas 20, tres están hoy vacías en el 100 % de las filas.

---

## ④ LO QUE MEDÍ Y NO ME PREGUNTASTE, PORQUE TOCA LA MISMA ACTA

**La procedencia del refugio se escribe en UN solo lugar, y no es el que la
mascota lee.** `traspasar_mascota_a_familia` guarda
`datos.refugio_cuenta_comercial_id` en el evento — **y no toca
`mascotas.origen` ni `mascotas.refugio_id`**. Medido: `mascotas.refugio_id`
tiene FK a la tabla **legada** `refugios` (0 filas), y `mascotas.origen` queda
como estaba (hoy: 38 `desconocido`, 21 `adoptado`, 15 `encontrado`, 1
`refugio`). ⇒ **después de una adopción real, la ficha del animal seguirá
diciendo el origen viejo mientras el evento dice el nuevo.** Nombro la puerta:
`traspasar_mascota_a_familia`, bloque ①.
