# S113 · pista A — parte final

> **Cierre: `main @ ea6a91b1`** (verificado por SHA contra `git ls-remote origin
> refs/heads/main`, no por código de salida) · **árbol 0** · A trabajó
> directamente sobre `main`, sin rama de pista.
> Todas las mediciones son del **7-sep-2026** contra `zyltipqscdsdsxnjclhp`.

---

## 1 · QUÉ CONSTRUÍ

### El motor de la fase 3

| pieza | qué es |
|---|---|
| `buscar_en_mi_familia` | siete brazos con FTS español · 4 índices GIN · techo que **prioriza antes de cortar** · encuentra un examen **por su analito** · pase sin separadores («proplan» → «Pro Plan») · indexa **por tipo con la clave que cada uno usa**, medido contra `cat_tipos_evento` |
| la bóveda | `papeles_familia` + `papel_valor` + bucket + **dos actos** (`registrar_papel_extraido` · `confirmar_papel`) — el evento del expediente nace **sólo en el segundo** |
| la placa | `estado_de_placa` con `libre` / `activada` / `no_existe` **sólo con sesión** · `crear_lote_placas` · QR en el servidor (cero peso en el bundle) |
| Nexo | `papeles` en `obtener_contexto_coach` |
| tablero y hoy | `obtener_tablero_mascota` · `obtener_citas_de_mascota` · `obtener_hoy_mascota` |
| rasgos | `cat_rasgos` (24 en 4 familias) + `registrarRasgos` |

**8 migraciones**, todas con **reversa escrita ANTES** declarando qué NO deshace.
**Wrappers en `packages/api`**: `tablero.ts` · `boveda.ts` · `series.ts`.

### Ocho gates, todos con línea en `package.json` y control verde

| gate | contra qué mide | hoy |
|---|---|---|
| `verify:papel-sin-valores` | la **función viva** (`pg_proc`), no la migración | ✅ 0 |
| `verify:contador-piezas` | archivos en disco vs. números escritos en el canon | 🔴 1 — **la skill de B** |
| `verify:placas-lote` | filas de `pasaporte_placa` | 🔴 1 — **declarado, `D-1049`** |
| `verify:union-vs-check` | una unión TS contra un CHECK **y** contra literales en funciones | ✅ 0 |
| `verify:lista-voseo` | que los consumidores **LEAN** la lista única, no que coincidan | ✅ 0 |
| `verify:titulo-dice-que` | que un título interpole | ✅ 0 |
| `verify:pasaporte-campos` | los once campos contra la línea base **firmada y fechada** | ✅ 0 |
| `verify:union-vs-check --control` … | los ocho traen `--control` y **los ocho dan verde** | ✅ |

⚠️ **Uno de esos controles estuvo roto y lo encontré cerrando:** el de
`verify:lista-voseo` probaba contra `lib-voseo.json`, la ruta **vieja** — el gate
medía bien y **su control no podía producir su verde**. *Un fixture apunta a
donde el archivo estaba el día que se escribió, y no se entera de la mudanza.*
Curado.

---

## 2 · QUÉ MEDÍ — cada número con su denominador y su objeto

### La costura de los papeles en Nexo · discriminador contra Thor (`d2e31d70`)

| | pregunta | respuesta |
|---|---|---|
| ① | *¿cuál fue el hematocrito y de qué fecha?* | «hemograma del **20/11/2024**, Clínica San Rafael, **41 % (ref. 37-55)**» — cita el anterior en 44 % **sin decir qué significa** |
| ② | *¿cuánto dio la fosfatasa alcalina?* | **no la inventa**: dice que no la encuentra y enumera lo que sí tiene |

**Y la cura no era mía sola:** la RPC devolvía `papeles` y **la edge los tiraba
al piso** (15 campos elegidos a mano). *Desplegar cuatro veces no lo curó:
faltaba una línea del otro lado.*

### La búsqueda de un papel no revela valores · 4 consultas

`Hematocrito` y `Ehrlichia` **encuentran el papel sin revelar el resultado**;
`41` y `negativo` **no traen nada** — el índice tiene los nombres de analito, no
los valores. **6 campos fijos**, ninguno de `papel_valor`.

### La bóveda, tras el REVOKE · 2 consultas por el camino real

lectura → **2 papeles** ✓ · INSERT directo → **HTTP 403** ✓

### El terreno del rediseño (detalle en `S113-CENSO-PARA-EL-REDISENO.md`)

🔴 **NO HAY TELEMETRÍA DE NAVEGACIÓN**: `analytics_events` **0 filas**,
`analytics_aggregated` **0**, y **cero emisores** en el monorepo. *Existen y
nunca corrieron* (L-402). **El orden por impacto no se puede derivar del uso.**

| | número | denominador |
|---|---:|---|
| familias | **87** registradas · **67** con mascota · **20** con login en 90 d · **7** con foto | filas de `familia` |
| mascotas | **100** · 91 con evento · **16 con foto** · 49 en familias activas | filas de `mascotas` |
| prestadores | **12** · 11 activos · 6 con cita · **4 con cita en 90 d** | filas de `prestadores` |
| eventos | **633** vivos · **452 (71 %) SIN procedencia declarada** | `eventos_mascota` |

**El rango honesto de familias reales está entre 7 y 20, no en 87.** *La foto es
el mejor discriminador: nadie le sube una foto a una mascota de prueba.*

### Contadores del canon

**171 piezas** (176 `.tsx` − 4 `.web` − `capturaFoto`) contra **53** publicadas ·
**122 wrappers** contra **26 publicados (S46)**.

---

## 3 · QUÉ **NO** MEDÍ

- **La caminata sobre el OTA publicado.** El binario del emulador es **dev
  build**, no preview: *no puede recibir el update que publiqué*. Lo que sí
  caminé fue **contra Metro** (3015 módulos, Hogar y tablero de Thor) — mide el
  **código**, no el OTA. Son dos cosas y sólo declaro la que hice.
- **Que un lote de placas se cree por el portal.** Bloqueado por credencial (§4).
- **Cuáles tipos de evento tienen voz.** Mi censo midió contra **uno de cinco**
  diccionarios y devolvió «45 sin voz»: creíble y falso. **No lo reporté.** El
  censo bueno es el de C, **desde la pantalla**: 44 filas, 0 genéricas.
- **Si el pase «proplan» rompe algo en producción.** Sólo lo medí en preview.

---

## 4 · LO ABIERTO, POR PISTA

### Mío (A)

| | qué | medición |
|---|---|---|
| 🟡 | **`D-1048`** · el barredor que verifica si el archivo de un papel existe | la columna `archivo_estado` existe; **Postgres no puede preguntarle a Storage**. Los 2 papeles vivos están en `presente` |
| 🔴 | **`D-1049`** · `crear_lote_placas` nunca corrió | **0 lotes, 0 placas**. **ROJO DECLARADO por firma: espera proveedor.** ⚠️ **No se corre con `service_role`** — saltea el gate de admin, que es la única parte sin estrenar, y daría el mismo verde sin probar nada (L-167). Runbook de 3 pasos en `S113-PLACAS-IMPRESION.md` §⑤ |

### Para B

| | qué | medición |
|---|---|---|
| 🟡 | **el contador de la skill** | `.claude/skills/…/SKILL.md:19` y `packages/ui/CLAUDE.md:3` dicen **81**, son **171**. Las dos filas del canon ya declaran el comando; el texto para copiar está ahí. `verify:contador-piezas` da rojo hasta entonces |

✅ **CERRADO — no lo pidas de nuevo:** tu hallazgo del contador (171) **está
confirmado exacto y curado en el canon**, y el censo encontró un segundo peor
(26 wrappers con 122 archivos).

### Para C

✅ **CERRADO:** la ruta real de Documentos, los usos por tipo de evento (61
activos · 21 con eventos · 633 en total · **los 5 primeros son el 96 % de lo que
la familia lee**), y sus cinco pedidos del founder — todo publicado.

### Para D

| | qué | medición |
|---|---|---|
| ✅ | **los papeles en el prompt** | **CERRADO**: `papelesDelExpediente()` cableado, `coach` version 14, verificado con discriminador |

### Para E

| | qué | medición |
|---|---|---|
| 🔁 | **cinco gates nombrados y ausentes en `main`** | cuatro existen en `pista/s113-e-3.0` y **llegan cuando mergees**. 🔴 **`verify:habla-en-presente` no existe en ninguna parte** — medido con `git ls-tree` contra tu propia rama. *Un gate nombrado y ausente no da rojo: no corre, y su silencio se lee como salud* |

✅ **CERRADO — está marcado en tu propio doc:** los resultados `papel` sin
juicio. Con una corrección de encuadre: **el brazo ya salía mudo**; el trabajo
fue volverlo **inexpresable**, porque estaba bien *por cómo estaba escrito*. Tus
otros tres de la bóveda también cerraron (`20260910320000`).

---

## 5 · LO QUE RETIRÉ

**Borrado:** mi Metro (`8098`) · `/tmp/.s113{tok,anon,port,thor}` —**dos tenían
credenciales**— · once temporales de medición · dos capturas · **`sonda-confirmacion.pdf`
del bucket `papeles-familia`** (0 bytes, fabricada hoy para medir los dos actos;
borrada por la Storage API porque el SQL la rebota con `protect_delete`).
**Huérfanos que quedan: 0.**

**Dejado a propósito:** los **2 papeles de Thor** —son el único sujeto vivo de la
bóveda, y sin ellos la costura del muro clínico vuelve a medir un vacío— y las
**14 mascotas fixture** de la familia del founder, marcadas con
`creado_por_sistema` (varias son sujeto de otras pistas; *una mascota de prueba
borrada a destiempo no rompe un test: lo vuelve irreproducible*).

**No toqué:** el Metro de C en `8083` (worktree `e-petplace-s113-c03`).
