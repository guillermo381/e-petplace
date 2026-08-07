# S90 · PISTA A — REPORTE DE CIERRE: LOS PAPELES

> **Regla 77, dicho primero: el veredicto de la tanda es PARCIAL.** Todo el
> código está construido, aplicado, desplegado y verificado E2E; **el paso
> que falta es el que la orden puso en piedra: los cinco papeles IMPRESOS
> bajo el ojo del founder.** Ese paso no lo da esta pista. Hasta ese momento
> el arco no está cerrado, por más verde que esté lo de abajo.

---

## 1 · LO CONSTRUIDO (las tres órdenes, en su orden)

### Orden 1 — LA RECETA + `cat_documentos_mascota` (una sola migración)

**Migración `20260807100000_s90a_receta_catalogo_documentos.sql` — APLICADA
y REGISTRADA** (local = remoto verificado antes y después; cinturón adentro
pasó: proacl sin anon · una sola firma de la RPC · 4 filas de catálogo · FK
validada sobre las 9 filas históricas · tokens ilegibles por PostgREST ·
catálogo no escribible).

- **Nace `cat_documentos_mascota`** (codigo · voz · funcion_edge ·
  requiere_ref · activo · orden) con los CUATRO papeles de esta pista.
  **Las tres enumeraciones a mano mueren:** el CHECK de `documento_token`
  pasa a **FK contra el catálogo**; el mapa `FUNCION` del wrapper muere (la
  RPC devuelve `funcion` leída del catálogo); la superficie de C ya derivaba
  del union y podrá derivar del catálogo cuando lo pida.
- **`documento_token` gana `ref_id`** (el alcance fino: para la receta, la
  cita de la consulta).
- **`emitir_token_documento` cambia de firma** — `(uuid, text)` →
  `(uuid, text, uuid DEFAULT NULL)` con **DROP explícito de la vieja
  (L-119, cinturón: 1 sola firma viva)**. Valida contra el catálogo; para
  `receta` exige `p_ref` y que esa cita tenga medicación DE ESA mascota
  (`ref_requerida` / `receta_sin_medicacion`, tipados).
- **D-662 declarado:** los bundles vivos llaman con `{p_mascota_id, p_tipo}`
  nombrados — la firma nueva resuelve igual (default en `p_ref`); el retorno
  agrega `funcion` (aditivo), `token` y `tipo` intactos. **Cero contrato
  roto con el teléfono.**
- **Fixture 7/7 VERDE con ROLLBACK, residuo 0** (JWT real del titular de
  Thor): los 4 tipos emiten · receta sin ref rebota `ref_requerida` · ref
  ajeno rebota `receta_sin_medicacion` · tipo no sembrado rebota
  `tipo_documento_invalido`. **El rojo del arnés se produjo aparte** (un
  RAISE deliberado aborta el batch y se ve — el verde no era silencio,
  L-192).
- **Reversa escrita ANTES de aplicar:**
  `docs/relevamientos/2026-08-07-s90a-REVERSA-receta-catalogo.sql` (con su
  nota de datos: los tokens de tipos nuevos no vuelven solos al CHECK viejo).

**`documento-receta` (Edge Function nueva, desplegada `--no-verify-jwt`)** —
mismo molde probado: token quemable de un solo uso → pdf-lib → banda de
emisor → alcance declarado. **Las cuatro decisiones firmadas, cableadas:**

1. «Firmar» = **nombre + matrícula impresos** («Prescrita por {profesional},
   matrícula {n}, en {negocio}», la matrícula en MONO). Sin firma
   criptográfica, sin imagen de firma, y el papel lo dice: *«Sin firma
   manuscrita ni digital: la identidad del prescriptor se declara con su
   registro profesional.»*
2. **Sin folio y sin vigencia, DECLARADO en el papel** («e-PetPlace todavía
   no numera recetas ni les fija plazo») y repetido en el pie.
3. **La descarga el dueño** — la misma puerta (`user_tiene_acceso_a_mascota`
   en la RPC). El papel no ensancha permisos.
4. **Un papel por consulta** — recorte del bloque MEDICACIÓN que la historia
   clínica ya imprimía, con posología completa en mono.

**EL FALLBACK DEL FIRMANTE, cableado y ejercido en el E2E real:** sin
matrícula, el emisor cae al NEGOCIO con nombre, dirección y teléfono, y el
papel declara con todas las letras: *«El profesional que atendió ({nombre})
no tiene matrícula registrada en e-PetPlace.»* **Jamás se inventa firmante.**

### Orden 2 — MARCA DE AGUA (D-677) + PASADA DE DISEÑO (D-681)

**Nace `supabase/functions/_shared/papel.ts` — la plantilla de render de
papeles.** El molde vivía duplicado en las dos funciones; con cuatro papeles
la duplicación era la divergencia esperando. La cara ENTERA vive ahí y los
cuatro papeles la consumen: banda de emisor en tinta en toda página ·
filete magenta único · hairlines sin fills · dos fechas · dato exacto en
mono · **cuerpos de la espec aplicados en la pasada: título 16/600 (era
24) · rótulo 9/600 mayúsculas tinta .65 · cuerpo 10.5/15 · tablas 9.5 ·
metadata y pie 8.5 · márgenes 20 mm.**

**La marca de agua, según la firma del 7-ago:** isotipo GRANDE AL CENTRO,
EN TINTA al 6% de opacidad, en TODA página, y jamás porta información.
**Decisión de motor, medida y declarada:** el asset PNG @2x hosteado que usa
el correo **es el isotipo EN GRADIENTE y mide 128×88 px** (medido por
histograma de píxeles y cabecera PNG) — usarlo tal cual contradecía la firma
(«en tinta, no en color») y pixelaba a tamaño A4. **El MISMO isotipo se
dibuja vectorial del path oficial del Manual de Marca** (la fuente de
`packages/ui/src/brand/Isotipo.tsx`, leída — no tocada). Misma identidad,
el medio correcto para papel.

**Voto del arquitecto conservado para el gate impreso (no ejecutado): el
isotipo adjunto al pie SOBRA** — la cabecera ya lleva la banda y el filete;
un tercer toque de marca empuja el papel hacia pieza de marketing. **No se
agregó nada al pie**; lo decide el founder con el papel en la mano.

### Orden 3 — LA FICHA DE IDENTIDAD (quinto papel)

**`documento-ficha-identidad` (Edge Function nueva, desplegada):** foto real
embebida del bucket privado · nombre · especie y raza (Mestizo se imprime
como cualquier raza) · sexo · nacimiento con marcador «(estimada)» cuando
`fecha_nacimiento_precision = 'estimada'` · peso más reciente CON fecha
(`evento_peso_medicion` primero, el peso de consulta como respaldo) · estado
reproductivo (de `evento_intervencion_permanente`) · microchip
(`evento_microchip_asignado` primero, la columna del alta como respaldo, el
número en MONO) · familia responsable con contacto del titular (nombre ·
teléfono E.164 con su `+` · email) · última atención veterinaria.

- **El alcance del microchip se declara en el encabezado**, como la orden
  manda: *«este papel se entrega en mano, y la familia decide a quién»*.
- **Ningún hueco mudo:** todo dato ausente dice «No registrado en
  e-PetPlace» con todas las letras.
- **Dos honestidades declaradas** (ver §4): «marcas distintivas» no existe
  como dato en el motor, y «vet de cabecera» no existe como concepto — la
  ficha imprime lo que ES un hecho: la última atención registrada.

---

## 2 · E2E — el circuito entero, con papeles reales

Tokens reales para Thor (`d2e31d70`, el de las 4 consultas) → **los cuatro
papeles bajaron 200 como PDF válido** (carnet 4.5 KB · HC 8.5 KB · receta
4.1 KB · ficha 67 KB con la foto) → **el reuso rebota 410** (un solo uso,
vivo) → los cuatro renderizados a imagen y revisados: banda, filete, marca
de agua, jerarquía de la espec, procedencia por fila (carnet) y por consulta
(HC), posología en mono, el fallback del firmante con nombre, la ficha con
foto y ausencias honestas. Un acabado aplicado en el mismo lazo: la foto de
la ficha se dibuja ENCIMA de las hairlines (borde limpio) — redeploy y
re-verificado.

**Hallazgo del arnés, declarado con su corrección:** el primer lote de
tokens de prueba rebotó 410 y esta pista diagnosticó mal («db query
revierte»). **La medición posterior lo falsó:** los tokens habían comiteado
y lo que pasó es que **vencieron a los 10 minutos entre un turno y otro** —
el candado del papel funcionó exactamente como está diseñado, y la query de
verificación usaba una ventana de 15 minutos que ya los excluía (el dato se
lee del objeto, no de una ventana cómoda). Residuo limpiado por id.

## 3 · LOS CONTEOS QUE LA ORDEN PIDE

| conteo | valor medido |
|---|---|
| **recetas emitibles hoy** (consultas con medicación) | **2** (las dos de Thor) |
| **con firmante real** (matrícula de la persona) | **0** |
| **con fallback de negocio** | **2 de 2 — el 100%** |
| matrículas cargadas en `prestador_empleados` | **0 de 16 activos** |
| **tokens de documento usados** (histórico, pre-sesión) | **9** (6 carnet · 3 HC) |
| tokens emitidos y quemados por el E2E de esta tanda | 9 (5 usados + 4 vencidos sin usar) — **limpiados por id, residuo 0** |
| estado final de la tabla | **9 usados — byte-idéntico al pre-sesión** |

**La lectura que la orden pedía hacer:** con 0 matrículas cargadas, **hoy el
papel está diciendo la verdad de un dato que falta, no cumpliendo su función
de receta firmada.** La captura de matrícula en superficie es de B (pedido
vivo, brief S90) y **el corte del 15-ago** ya aprieta: sin matrícula, los
vets pierden visibilidad en la vitrina.

## 4 · LO QUE NO OCURRIÓ, nombrado

1. **El gate impreso NO corrió** — es del founder, con papel real. Regla 77:
   **PARCIAL**.
2. **`certificado_salud` NO está sembrado en el catálogo.** La pista D lo
   entrega como SQL literal (76b); el catálogo nació con capacidad para
   los cinco, no con filas inventadas por otra pista. *Sembrar el tipo es un
   INSERT de una fila — cero DDL.*
3. **`transporte_vivo` NO se tocó** y ningún UPDATE de C llegó. La ley de
   secuencia queda intacta: lector → pieza → gate → recién ahí el flip.
4. **DM Sans NO se embebió** en los PDFs — la espec lo deja explícitamente
   como decisión de A y sanciona el fallback («imprime digno»). Declarado,
   no olvidado: embeberlo exige fontkit + el TTF y es un paso propio.
5. **El adjunto/isotipo al pie NO se agregó** (voto del arquitecto: sobra;
   lo arbitra el gate impreso).
6. **La agrupación por categoría NO se construyó** — D-683 es el papel
   número 8; con cinco, la lista plana sigue correcta.
7. **«Marcas distintivas» no existe como dato en el motor** (medido: ninguna
   columna en `mascotas` ni en el perfil vigente). La ficha lo declara «No
   registradas en e-PetPlace» — honesto. **La captura es candidata natural
   del arco MASCOTA de S90 (prioridad 1, «datos adicionales que nutren el
   perfil»)**; se nombra para esa mesa, no se abre deuda desde acá.
8. **«Vet de cabecera» no existe como concepto en el motor**
   (`prestadores_habituales` del perfil vigente está vacío en todas las
   filas y sin productor). La ficha imprime un HECHO: «Última atención
   registrada: {negocio} · {fecha}» — jamás fabrica una relación de
   cabecera que nadie declaró.
9. **El typecheck del CLIENTE está en ROJO, y es EL TRIPWIRE DE C SONANDO
   COMO C LO DISEÑÓ** — su `apps/cliente/src/lib/papeles.ts` dice verbatim:
   *«El día que A sume `receta` al union, ESTE ARCHIVO ROMPE EL TYPECHECK
   hasta que el papel nuevo tenga su voz y su glifo»*. El union creció a 4 ⇒
   el `Record<TipoDocumento>` exhaustivo exige dos entradas nuevas.
   **PEDIDO A C (con el literal del error):** `receta` y `ficha_identidad`
   necesitan su `claveVoz` (keys i18n `documentos.nombre*`) y su glifo — son
   decisiones de voz y de registry, de C. `@epetplace/api` y el prestador
   typechequean verdes.

## 5 · RIESGO DECLARADO, NO RESUELTO — folio y verificación (a la mesa)

**v1 salió SIN folio, declarado en el papel** («e-PetPlace todavía no numera
recetas»). La espec de B dejó como CANDIDATO: folio único en mono + QR a una
URL de verificación cuya página muestre SOLO validez · folio · emisor ·
fecha — jamás contenido clínico sin autenticación (un QR que abre la
historia es una fuga impresa en cada copia). **Sigue sin decidir y no se
construyó nada de eso.** La mesa lo decide con los papeles impresos en la
mano — que es exactamente el momento en que un folio se extraña o sobra.

## 6 · OPERATIVO

- **Veda 76(g): NO RIGE, declarada** — DDL nuevo + seed estático + FK sobre
  9 filas existentes; ningún ancla sobre datos vivos.
- **Regla 87:** esta pista no fijó `ANDROID_SERIAL` porque no disparó ni un
  intent — ningún comando tocó un aparato.
- **Migraciones:** local = remoto en 203/203 ANTES de la mía; 204/204
  después. `gen:types` corrido (el catálogo y la firma nueva están en los
  tipos); typecheck `@epetplace/api` VERDE; `prestador` VERDE; `cliente`
  ROJO por diseño de C (§4.9).
- **Deploys:** `documento-carnet` y `documento-historia-clinica`
  re-desplegadas sobre la plantilla (v3); `documento-receta` y
  `documento-ficha-identidad` desplegadas nuevas — las cuatro con
  `--no-verify-jwt` (el token es la autorización).
- **Archivos de la pista (76h, declarados antes del primer commit):** la
  migración · la reversa · `_shared/papel.ts` · las 4 Edge Functions ·
  `packages/api/src/wrappers/documentos.ts` · `database.types.ts`
  (regenerado) · este reporte · las dos fichas de deuda (D-677 · D-681)
  en `DEUDAS_CANONICAS.md`. **Nada fuera de territorio: cero archivos de
  `apps/` tocados.**

## 7 · EL ÚLTIMO PASO NO ES DE ESTA PISTA

Los cinco papeles se imprimen y los mira el founder. Cuando el quinto (el
certificado de D) esté servido, **una sola tanda de impresión paga el gate
único** — abrir el PDF dos veces para dos retoques es pagar dos veces el
mismo gate, y esta tanda dejó todo listo para pagarlo una vez.
