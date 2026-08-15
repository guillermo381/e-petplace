# S98 · ACTA DE CIERRE — LA CASA DEL PRESTADOR SE ORDENA, Y EL VENDEDOR ENTRA

**Cerrada por orden del founder.** Cuatro pistas (A motor/docs/merges · B `packages/ui`
y los jueces · C prestador y ventas · D HOY y roles).

> **Esta acta NO reemplaza a los volcados de pista.** Lo de `packages/ui`, los
> tokens y los lint vive con su detalle en
> **`2026-08-15-s98b-HANDOFF-CIERRE.md`** y no se duplica acá — se apunta.
> Igual con la matriz de cuentas: **`2026-08-13-s97a-matriz-cuentas-prueba.md`**
> es la fuente, con sus curas del 14-ago adentro.

---

## §1 · LO ENTREGADO, POR ARCO

### ① La reorganización del prestador — **completa**

**ATENDER** nace como tab con sus baldosas y el mostrador sube ahí · el
**wizard** con sus firmas · el **destape** · la **frontera §3.1** · **un nombre,
una puerta** · y **el verbo «Llegó» muere para todos** con su motor: el trigger
`trg_cita_llegada_al_atender` estampa `llegada_en` **en la transición a
`en_curso`**, no en un botón aparte.

> **La corrección de dirección que ordenó todo lo demás (§2.0):** *«todos los
> dueños ven casi lo mismo; lo que determina mostrar más o menos son los
> servicios que presta»*. La barra es UNA:
> `HOY · DATOS · (ATENDER por capacidad) · NEGOCIO · CUENTA`.

> 🔴 **EL COSTO DE MATAR EL VERBO, MEDIDO Y DECLARADO (aviso de D, verificado
> acá):** con «Llegó» muerto para todos, **el trigger es lo único que estampa
> `llegada_en` por el camino real.** El respaldo manual existe como código
> —`registrar_llegada` y su wrapper siguen vivos y exportados— **pero su único
> llamador era la pantalla que murió** (literal en `(tabs)/index.tsx:1355`).
> ⇒ Es **motor sin puerta**, no un respaldo: quien revierta el trigger tiene
> que **re-cablear un escritor primero**, no solo revertir. *La reversa de un
> lado se declara en el otro* — está en §7bis y acá.

**OTAs:** `9935df81` (Lote 2) · `d9987a06` (hotfix D-804) · `536fd59c` (el
mostrador a ATENDER + «Llegó» muerto).

### ② El flujo del vendedor

- **La solicitud de dos caras** y **la facturación en su casa** (Negocio/Cobros,
  heredando el gate del tab — *una mudanza que ensancha la audiencia de una
  pantalla de plata no es una mudanza, es un permiso nuevo sin firma*).
- **El corte gana días y festivos** (`entrega_turnos.dias_semana` + 
  `incluye_festivos`) con la convención **medida y no elegida** —`0=domingo`,
  contra `EXTRACT(DOW)`— y el backfill **L–D y no L–V**: *poner L–V «porque es
  el caso común» le cambiaría la operación a quien hoy entrega sábados.*
- **El alta de repartidor completa**: identidad (`tipo_documento` por FK
  compuesta al país · `whatsapp` E.164 · dos fotos como PATH) ·
  **`repartidor_vehiculos`** con techo de dos **inexpresable**
  (`orden ∈ {1,2}` + UNIQUE) · y el endpoint de visión **`extract-documento`**
  para pre-llenar desde la foto, con L-139 en el prompt.

**OTAs:** `6e99d159` (alta completa) · `43966181` (la pantalla exige) ·
`16908c27` (el refresco + las voces).

### ③ El pipeline de notificaciones — **resucitado y con canal propio**

- **D-816:** todas las notificaciones estaban muertas por **una sola causa** —
  el cron del correo mandaba el secreto pero no `Authorization`, **y ese edge
  es el ORQUESTADOR**. La cola se drenó sola: 34 `nacida` → 0.
- **D-822:** **cinco productores** al negocio, cuatro colgados del ACTO en su
  misma transacción. **El discriminador encontró una segunda capa que la ficha
  no tenía: 16 de 22 tipos de audiencia prestador estaban EN SOMBRA** — o sea
  que aunque los mudos hubieran tenido productor, la mayoría no habría salido.
  Se sacaron de sombra **exactamente los tres firmados**.
- **Push probada por camino real** en `com.epetplace.prestador`.

### ④ Las curas de instrumento (territorio de B, detalle en su volcado)

**R30 poblado · R41 · el barrido de las casas de oficio 192 → 331 pares · el
guard de colisión generalizado.** Y de mi lado: **`verify-codigos-repartidor`**
(11 códigos, con contra-caso) y **`verify-cola-notificaciones`** (mide la EDAD
del más viejo, no el tamaño).

---

## §2 · LAS FIRMAS DEL FOUNDER — la constitución de lo construido

| firma (literal) | dónde quedó |
|---|---|
| *«Todos los dueños ven casi lo mismo; lo que determina mostrar más o menos son los servicios que presta»* | `LA_CASA_DEL_PRESTADOR` §2.0 |
| **El verbo «Llegó» muere para todos** (D-818) | §7bis marcada SUPERADA + motor en `20260814200000` |
| **La recepción DISTRIBUYE, no marca llegadas** | `LA_CASA_DEL_PRESTADOR` §2.3bis |
| Los cinco dictados del gate de ATENDER | §6bis, verbatim |
| **La expiración pasa a ser ACTO** — firma (a), nace el barrido | `20260815130000` ⑤ |
| Los **cinco productores** de la primera ola al negocio | `20260815130000` |
| *«En un glifo de control no hay mascota, hay interfaz; la huella se reserva para donde significa»* | **`DIRECCION_ARTE` v1.7** — Ley 9 gana su alcance + §6b su paso 6 |
| **El ⓘ va sin huella** · **la Hoja funde con reduce-motion** | volcado de B |
| *«El par del avatar se reclasifica a mínimo gráfico (3:1) — es una huella, no texto; la medición de 4.40 queda holgada; es reclasificación, no aflojamiento»* | `verify-contrast.ts` (`66c24746`) + `DIRECCION_ARTE` v1.7 |
| **Obligatorios en el alta de repartidor: foto de la persona y WhatsApp** (los otros dos NO) | `20260816120000` |
| **El repartidor: tabla nueva `repartidor_vehiculos`; `recursos_reparto` NO se toca** | `20260816100000` |

---

## §3 · LO PENDIENTE, CON DUEÑO Y ORDEN FIRMADO

### ① 🔴 D-820 + los dos HOY — **la columna vertebral de S99**

El vendedor entra a la casa de tabs; **después** las ventanas espejadas. Hoy el
vendedor puro no tiene barra propia, y por eso «Datos de facturación» se le
dibuja solo a él como puntero — **muere con D-820**, no antes: retirarlo hoy
para todos lo dejaría sin ningún camino a sus datos fiscales.

### ② 🔴 El barrido de cariño / Acto II — **con su literal**

> ***«El diseño le falta cariño — se siente como un desarrollador que hace por
> hacer sin ningún cuidado por la estética.»***

**Empieza por el componente de foto duplicado:** el alta de repartidor
reinventó lo que la carga de foto de mascota ya hacía bien. *No es una queja de
gusto: es que la misma operación se ve distinta en dos lugares, y eso se lee
como dos productos.*

### ③ Stock — dirección firmada en **§8.6quater**, **cero construido**.

### ④ D-824 — **el mapa está servido**, esperando firmas por tanda.
`2026-08-16-s98a-D824-mapa-del-silencio.md`. **Nada encendido.** Y su
recomendación de orden: **el grupo C primero, que no necesita firma** — cinco
`pedido_*` que ya hablan y dicen el genérico, con 3 avisos ya entregados sin
título.

### ⑤ La lentitud — **con su punta**

Literal del founder: *«La App la estoy sintiendo particularmente lenta.»*
La punta medida en S94-PERF sigue rigiendo: **olas encadenadas — agrupar, no
cachear.** *No hay consultas que optimizar, hay viajes que eliminar.*

### ⑥ D-823 (letra previa) y D-539

**D-823:** 9 columnas prohíben el `+` contra 4 que lo exigen (una fuera de
`public`). **No se cura de paso: P21 prohíbe DERIVAR el país**, así que un
backfill a E.164 estaría inventando el país de cada número. Primero se firma
cuál convención rige y de dónde sale el país.
**D-539:** `packages/api` no tiene capa de idioma — los mensajes salen en
español también en inglés.

---

## §4 · LAS LECCIONES NUEVAS

> Las de `packages/ui`, tokens y lint están en el **volcado de B §3**. Acá van
> las que no están ahí.

1. **`CONTRATO` regla 87 — un `SALTAR_GATE` declara UN rojo con NOMBRE.**
   Nació de un incidente propio: declaré el rojo conocido de `router.d.ts` y
   **pasé al lado de un `verify:diseno ROJO` que el mismo aviso traía.**
   *Escribir un motivo cierto se siente como haber mirado.*
   **Y su corolario, cobrado en esta misma sesión:** usé un `SALTAR_GATE` que
   **no necesitaba** — el rojo ya estaba curado. *Declarar una excepción de más
   la abarata, que es la erosión que la regla existe para impedir.*
2. **Un censo se hace por la RELACIÓN que define el hecho, no por un proxy.**
   Tres métodos, tres respuestas: por nombre del constraint (3) · por texto de
   su definición (6) · **por columna vía `conkey` (9+4)**. *Un CHECK sobre
   `whatsapp` no dice «teléfono» en ninguna parte; pero la columna siempre está
   en `conkey`.*
3. **`entregada` ≠ `se vio`.** El primer push salió `entregada` y el teléfono
   no mostró nada: la app estaba en primer plano. *Antes de diagnosticar un
   silencio, preguntá dónde estaba mirando la persona.*
4. **La carrera del foco (familia D-728).** Un refresco que vive dentro de un
   `useFocusEffect` y se dispara al cerrar un `Modal` nativo **a veces corre y a
   veces no**. *Un refresco que funciona a veces es peor que uno que no
   funciona: el que no funciona se arregla, el intermitente se discute.*
   ⇒ **Contra un defecto intermitente, una corrida verde es una moneda al aire
   con forma de test.** El instrumento corre tres vueltas.
5. **🔴 Lo que tiene que dejar de poder llamar a la forma vieja no es el REPO:
   es el BUNDLE.** Corrección a un artefacto propio a mitad del arco: el
   disparo de un guard no es el merge de la pantalla — entre el merge y el
   publish el aparato sigue con la forma vieja. **El orden es ① la pantalla
   exige · ② merge · ③ OTA publicado Y APLICADO · ④ el guard.**
6. **Una exención se escribe con su condición de muerte adentro.** La de B
   traía dos salidas y se cumplió la segunda; caducó en cuatro días. *Sin
   condición es un permiso permanente; con ella, una medición que caduca.*
7. **Un freno correcto tiene fecha de vencimiento.** Frené por falta de firma y
   estuvo bien; **faltó volver al freno cuando la firma llegó** — el doc quedó
   negando una firma que el gate ya obedecía. *El commit que aplica una firma
   tiene que tocar también el lugar donde se declaró que faltaba.*
8. **El instrumento fue más rápido que leer, y estuvo mal:** un `head -8` sobre
   un censo de 13 líneas con el dato en la 12. *Automatizar la lectura de un
   literal corto puede costar más que leerlo.*
9. **Un código con dos significados es peor que dos códigos** — el primero gana
   la voz y el segundo hereda una frase de otra cosa. Y su gemelo: **un flag
   que nombra una de las dos razones de una regla vuelve a mentir**
   (`large` → `noTextual`).

---

## §5 · EL ESTADO FÍSICO

- **OTA prestador vigente: group `16908c27` · android `01a00373-5155-78e5-a53e-69081b7c7a03` · ancla `d4613ce9` · runtime 1.0.5 · canal `preview`.**
  `verify-ota` VERDE. **Aplicado y leído EN PANTALLA** (Cuenta › pie).
- 🔴 **EL CLIENTE NO SE PUBLICÓ** — sigue en `3743c536` / runtime 1.0.3. Las
  piezas compartidas que cambiaron para el prestador **le entrarían sin gate**.
  **Decisión declarada, no olvido.**
- **Build nativa: `bcf6d7f2` (1.0.5, 12-ago).** Cinco runtimes huérfanos
  (1.0.0–1.0.4) que `verify-ota` avisa y **no frenan** — correcto.
- **Aparato `R5CY201ZDVL`** · sesión **`demovet` / Clínica Aurora** ·
  `animator_duration_scale = 1.0`.
- **Cuentas: la fuente es `2026-08-13-s97a-matriz-cuentas-prueba.md`**, con sus
  dos notas vivas — **`vet2` reformado** (era «clínica que solo paseaba»; el
  caso paseo-only pasó a `paseo1`) y **`vendedorpuro` sin clave compartida**.
  ⚠️ **`+vet2` tiene FRENO DE CREDENCIAL**: existe, no está en la matriz de
  clave compartida, **y no se adivina ni se resetea (§6ter)**.
- **Puertos:** Metro por defecto en 8081 y **lo comparten las pistas** (corolario
  de D-769: *el worktree por pista no alcanza si las dependencias y los puertos
  siguen siendo uno*). Para regenerar tipos arranqué Metro en **8099** a
  propósito, para no pisar a nadie.
- **Keychain** (se lee al momento, **jamás se pega en chat, reporte ni repo**):
  `security find-generic-password -a siembra -s epetplace-siembra-s97 -w` ·
  `security find-generic-password -a pin -s epetplace-dispositivo-s97 -w`
- **`packages/api` y `packages/domain` sin `node_modules`** (symlinks
  autorreferentes retirados). `tsc` corre por el binario raíz.
  Recuperación: `CI=true pnpm install`.
- **321 migraciones · disco = local = remoto · drift CERO.**
