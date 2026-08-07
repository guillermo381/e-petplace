# S89 · PISTA A — ACTA DE CIERRE (6-7 de agosto de 2026)

> **Todo lo de abajo está LEÍDO DEL OBJETO al cerrar, no de memoria.** Donde
> un gate no ocurrió, se dice que no ocurrió. Donde algo quedó a medias, se
> dice dónde. **Último hash: `ea798ce5` · árbol en 0 · todo pusheado.**

---

## 0 · LAS TRES LEYES NUEVAS DEL FOUNDER, con su letra

> ### **«PERFECTO ES ENEMIGO DE HECHO — salvo seguridad, performance y funcionalidad.»**
> La excepción es la mitad que importa: la velocidad no compra permiso para
> romper lo que protege, lo que sostiene o lo que funciona. **Lo que se
> relaja es el acabado, jamás el fundamento.**

> ### **«NO DEJES PARA MAÑANA LO QUE PUEDES HACER HOY.»**
> Su consecuencia operativa fue real: el tren nativo arrancó la misma noche
> en que se firmó, y las builds salieron con la identidad adentro en vez de
> esperar una segunda pasada.

> ### **«PUSH» JAMÁS EN SUPERFICIE — las dos apps.**
> Vocabulario de ingeniería. La persona lee «avisos en el teléfono».
> Verificado por grep en los dos diccionarios: **cero ocurrencias en valores
> de cara al usuario** (los hits son comentarios que citan la propia ley).
> Depositada en `MODELO_NOTIFICACIONES` §7.

**Y la vara que mutó con ellas — EL RÉGIMEN DE PRUEBAS:** muere «el primer
envío de cada tipo lleva el ojo del founder»; nace **«todo tipo abierto tiene
voz firmada + productor real + kill switch vivo»**. *La red ya no es la
sombra: es el freno de mano.* Depositada en
`2026-08-06-s89a-NOTA-metodo-regimen-de-pruebas.md`.

---

## 1 · D-673 — EL AVISO QUE UN DUEÑO ESPERA, DE PUNTA A PUNTA

**Entró a la sesión como la deuda que la encabezaba y sale con los tres tipos
produciendo.** El arco entero, en orden:

1. **La medición primero** (orden 1): cero productores confirmado por tres
   lados del objeto — los códigos, el timbre y la tabla de intenciones.
2. **🔴 La bomba antes que el molde (D-674):** el único productor «✅» de la
   familia **jamás había disparado y no podía** — referenciaba un parámetro
   que su firma no tiene. **Rojo producido por la rama real: `42703`.** Sin
   handler alrededor no era «no suena el timbre»: **era la RPC entera
   reventando y la fecha del procedimiento sin fijarse.** Curada y con su
   par (rojo → verde). *Nada se clona de un molde con bomba.*
3. **Los productores** (`20260806160000`): `cita_confirmada` y
   `cita_solicitada` nacen de la MISMA transacción — dos audiencias, un
   instante — en `confirmar_cita_pagada` y `reservar_salida_paquete`.
4. **El recordatorio** (`20260806170000`): scan + job cada 15' con la ventana
   firmada (dos toques, mañanas 08:00 Guayaquil, el borde de <1 día y el
   aviso inmediato de último momento). **Job vivo y midiendo: 0 fallos.**

**Estado del canal al cierre, medido:**

| pieza | estado real |
|---|---|
| correo (`email`) | **`transporte_vivo = true`** · 31 correos entregados hoy |
| campana (`in_app`) | viva, con la huella midiendo lo nuevo |
| **push — token** | **`push_tokens` = 1 fila** — el aparato del founder registró su token por el camino real |
| **push — transporte** | **NO CONSTRUIDO.** Nada envía a FCM todavía |
| **push — flip del canal** | **`transporte_vivo = false`.** No se tocó: el flip es el ÚLTIMO acto y su transporte no existe |

> **🔴 EL GATE DEL PRIMER PUSH REAL NO OCURRIÓ, y se dice entero:** el
> teléfono todavía no vibró. Lo que sí ocurrió: FCM horneado y verificado en
> las dos APKs, la invitación de la casa mostrada y aceptada, y **el token
> del aparato viajando al motor**. **Falta el vagón del transporte** — con él
> y el flip de una fila, el push sale.

---

## 2 · LAS TRES PRE–SOFT LAUNCH, PAGADAS

| deuda | qué era | cómo cerró |
|---|---|---|
| **D-669** 🔴 | el plan **moría al primer fallo de cobro**, y **el crédito de los sobrantes se evaporaba** (hallazgo que no estaba en la ficha) | **la gracia: 7 días FIRMADOS.** El fallo abre ventana y el plan queda ACTIVO — el cron diario ES el reintento; la muerte honesta llega solo al agotarse. Par de 4 brazos, y **el par cazó un defecto de la propia cura antes de vivir**: retener el crédito lo contaba dos veces |
| **D-658** 🔴 | por RPC directa, una mascota **en memorial reservaba en los cuatro oficios** | una línea en el helper único. **Hueco reproducido contra el body viejo** (el hold nació) → par post-cura ×4 oficios. Precisión que cobró el fixture: el CHECK dice `fallecida`; «memorial» es voz de app |
| **D-656** | el wizard quemaba a la persona | pagada por C (la cáscara se retoma) |

---

## 3 · D-676 — LA MATRÍCULA ES DE LA PERSONA (letra founder)

**El hueco lo destapó medir para la receta, no un fallo:**
`prestador_empleados` no tenía **ninguna** columna de credencial (16 medidas)
y la matrícula vivía **en el negocio** — sirve para un consultorio
unipersonal y **miente en cuanto la clínica tiene dos veterinarios**.

Construido: las columnas, el helper único (lo no-médico **jamás** pide
matrícula, con cinturón), el gate en los tres puntos de asignación **y en la
vitrina** — *ofrecer a quien no puede recibir la cita es prometer*.

**La transición, firmada: corte 15-AGO.** El que ya existía tiene gracia; el
que nace desde el 7-ago nace completo. **Medido al cierre: `0` empleados con
matrícula cargada** — la captura en superficie es pedido vivo a C, y sin ella
el 15-ago deja sin visibilidad a los vets de prueba. *Se dice ahora, no el 15.*

---

## 4 · LOS PAPELES — EL PRODUCTO APRENDIÓ A IMPRIMIR

**Dos papeles vivos, los dos probados por camino real (token → PDF →
token quemado: `410`):**

- **Carnet de vacunas** — 8 vacunas de Thor con **la procedencia fila por
  fila EN TEXTO** («Declarada por la familia · aplicada por…»), y **la marca
  distintiva firmada: banda de emisor en TINTA** (no en color — el matiz
  muere impreso; el eje tinta/papel no), presente en toda página. Alcance
  declarado en el encabezado: sin desparasitaciones.
- **Historia clínica** — 4 consultas con prosa cortada por ancho (*el papel
  no trunca lo que el vet dictó*), medicación con posología completa,
  exámenes, **null honesto en los vitales**, y **la firma del médico
  tratante** (nombre + matrícula cuando exista; el negocio como fallback —
  *jamás se inventa un firmante*).

**La puerta: token quemable de un solo uso (10'), el JWT jamás en una URL.**
Medido al cierre: **9 tokens usados**. Decisión de motor declarada: pdf-lib
en vez de HTML→PDF (una Edge Function no corre Chromium); las demos de B
quedan como fuente de diseño.

**Y la receta: MEDIDA, no construida** — su bloqueo era de identidad, no de
contenido clínico (la posología ya se imprime). Cinco decisiones servidas,
**una sola bloquea**, y D-676 la resolvió.

---

## 5 · EL CORREO — DE CERO A CARA PROPIA EN UN DÍA

- **Apex `epetplace.com` VERIFIED** (captura del founder) y **`hola@` firme**:
  el choque del remitente **muerto por el objeto** — 14 entregas reales lo
  prueban.
- **31 correos entregados hoy**, cero fallidos.
- **Los 14 textos FIRMADOS uno a uno por el founder.**
- **Cara v1 → v2 en el día:** el chasis único de B cableado con esos textos —
  isotipo PNG @2x hosted (URL estática, **cero tracking**) con el wordmark de
  texto como fallback vivo, **la casa heredada entera** (tapiz + CTA + link:
  el correo al negocio dejó de llevar el tapiz del cliente), el corazón con
  la mascota presidiendo, y **`lang` según el idioma del destinatario**.
- **Mi decisión de «cabecera sin imagen» MUTÓ con su porqué declarado:** la
  firma resolvió el riesgo de tracking; el de imágenes bloqueadas sigue vivo
  y por eso el fallback de texto se cableó igual.

---

## 6 · LA APERTURA MASIVA — 13 TIPOS FUERA DE SOMBRA

Censo **voz × productor** contra el objeto. **13 abiertos · 24 en sombra, y
los 24 por voz ausente** — incluidos tres CON productor y sin voz
(`alta_asistida_completada_por_cliente` · `alta_asistida_vencida_soporte` ·
`sistema`): **abrirlos es escribir su voz, no un UPDATE.**

Freno de mano medido y armado: kill switch por alcance + techo duro 500/24h.
**Y el techo se ejerció de verdad:** 2 de las 14 muestras v2 quedaron
`diferida` al llegar a 20/20 en `operacion`. *No es un fallo: es la red
funcionando, y prefiero decirlo a subir el techo por conveniencia.*

---

## 7 · LA HUELLA MIDE LO NUEVO — el contrato de la visita

**Letra founder:** la campana registra la última visita; la huella pregunta
por lo POSTERIOR. **El leído por aviso NO cambia** — *leído y visto son cosas
distintas*.

Construido en dos pasos: v1 por usuario y **v2 con el eje APP** (visitar la
campana del cliente no apaga la del prestador; las firmas viejas murieron con
DROP explícito, cero sobrecargas zombis). **Par de 6 brazos con su
discriminador:** marcar leído y la huella SIGUE encendida.

**El freno de C y D murió con el literal**, y las dos pistas consumieron el
contrato el mismo día (pares 3/3 y 4/4). *Dos brazos del par cayeron primero
por L-122a — `now()` constante en la txn hacía «simultáneo» lo posterior.*

---

## 8 · EL FORENSE — CASO MUERTO, CON NOMBRE

**El audit log NUNCA estuvo vacío**: la ventana de S88 no llegaba a los
hechos. Medido: todos los cambios de clave son por flujo; el último lo hizo
**una sesión Android (`okhttp`) en la IP de la casa**, con login→cambio en
**0,67 s** — velocidad de máquina. **Causa nombrada por el founder: su propio
entorno** (celular + emuladores). Sesión zombi **revocada** (cascade
verificado), **sonda canónica depositada** (`scripts/sonda-credenciales.mjs`,
el error se LEE), 8/8 post-revocación.

**Dos correcciones operativas que quedan:** `updated_at` **no** es marcador
de rotación (era un token refresh), y la rotación de «las 13:13» **no
ocurrió** — falla silenciosa de script, no actor fantasma.

---

## 9 · EL TREN NATIVO — lo que salió y lo que no

**La trampa cazada ANTES de compilar:** `GOOGLE_SERVICES_JSON` **no existía
en EAS**. Compilar sin verificarla habría dado dos APKs **sin FCM y sin una
sola señal roja**. Creada en las dos apps, y recién entonces build.

**Cuatro builds en el día** (dos de corte de runtime, dos de identidad), las
últimas verificadas **descargando el APK y abriendo su manifest**:

```
✓ package  ✓ geo.API_KEY  ✓ google_app_id (FCM horneado)
✓ listener MESSAGING_EVENT   ✓ notification_icon + notification_color
```

**Identidad del launcher:** muere la «V» azul del template — isotipo sobre
`#050508` con la zona segura de Android respetada, monocromo para el themed
icon, y los nombres dejan de ser `cliente`/`prestador`.

**La invitación de avisos**, según la lámina firmada: la casa explica antes
del único tiro del SO · «Ahora no» siempre visible · re-invitación **solo por
versión NATIVA** (jamás por OTA: *sería nagging con otro nombre*) · dos noes
= silencio definitivo. **El founder la aceptó y el token llegó al motor.**

---

## 10 · WHATSAPP Y BIMI — las esperas externas

- **6 plantillas EN REVISIÓN de Meta.** ⚠️ **Corrección pendiente:
  Marketing → Utilidad** (las seis son UTILITY; el depósito ya lo declaraba).
  El reloj de Meta corre en paralelo por firma del founder.
- **BIMI:** asset derivado del isotipo vivo + su guard (B). **🔴 El camino
  está bloqueado por calendario, no por trabajo:** SENADI (Ecuador) **no
  sirve** para VMC — la vía sería USPTO/EUIPO (8-18 meses); y el **CMC exige
  12 meses de logo publicado: el isotipo se publicó en jun-2026 ⇒ jun-2027**.
  **Las fases gratis se hacen igual** (valen por entregabilidad), pero **la
  «E» naranja no se va hasta esa fecha.** *Decirlo al revés sería prometer
  algo que el DNS no puede dar.*
- **DNS medido:** DMARC en `p=none` **sin `rua`** (ciego) · sin SPF en el
  apex · sin MX · **nuestros correos alinean por DKIM** (endurecer no los
  toca). Los registros exactos quedaron depositados **para que los publique
  quien tiene el panel** — no viven en el repo.

---

## 11 · LOS CONTADORES, RE-MEDIDOS CONTRA EL OBJETO

| | valor | cómo se midió |
|---|---|---|
| migraciones | **203 local · 203 remoto · cero divergencias** | `ls supabase/migrations/*.sql \| wc -l` + `migration list --linked` |
| deuda más alta | **D-678** | `grep -oh "D-[0-9]\{3\}" \| sort -u \| tail -1` |
| lección más alta | **L-210** | ídem con `L-` |
| CONTRATO_TRABAJO | **v1.30** | del propio archivo |
| tipos fuera de sombra | **13** (24 en sombra) | catálogo vivo |
| correos entregados hoy | **31** | `notificacion_intencion` |
| tokens de push | **1** | `push_tokens` |
| documentos emitidos | **9** tokens usados | `documento_token` |
| jobs de cron activos | **6** (incluye `recordatorios-cita`) | `cron.job` |

> **P3 no vuelve a decaer por este cierre:** el canon **declara el comando**,
> no el número (cura de esta sesión, tras la CUARTA caída: 9 → 77 → 138 →
> 186). El censo de regresión vigila que ningún número congelado resucite.

---

## 12 · LO QUE NO OCURRIÓ — dicho entero

- **El primer push real. El teléfono no vibró.** Falta el transporte y el
  flip del canal.
- **La captura de matrícula en superficie** — sin ella, el 15-ago deja sin
  visibilidad a los vets de prueba.
- **La receta**: medida y desbloqueada, no construida.
- **El endurecimiento de DMARC**: los registros están escritos; el DNS no es
  nuestro.
- **La corrección de categoría en Meta**: pendiente.
- **`ePetPlace Care`** en el launcher: deuda de binario (D-678).

---

*Pista A · S89. `ea798ce5` · árbol en 0 · regla 87: nada conectado por esta
pista (cero emuladores, `ANDROID_SERIAL` sin fijar, el teléfono del founder
solo por bundle).*
