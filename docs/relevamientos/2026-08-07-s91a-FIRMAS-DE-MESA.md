# S91 · LAS CUATRO FIRMAS DE MESA DEL 7-AGO-2026 — depósito de A

> **Depositadas por A porque `docs/` es de A** (METODO §2), no porque sean de
> A: son **firmas del founder** llegadas en la apertura de S91. El texto de
> cada una va VERBATIM; lo que está debajo de cada una es su ESTADO MEDIDO al
> cierre del depósito — registro de A, jamás parte de la firma.
>
> Se depositan juntas y en un solo lugar porque **tres de las cuatro cambian
> algo que ya estaba escrito en otra parte** (la lámina, D-685, el código del
> cliente): una firma que solo vive en el chat es una firma que la próxima
> sesión no encuentra.

---

## ① LA CLÁUSULA DEL PEZ — opción A

> «en el alta, especie «Pez» registra el ACUARIO como sujeto. El nombre
> pedido es el del acuario; el campo dos es tipo de agua (dulce/marino) en
> espejo de la raza. Técnica: fila de `mascotas` con marca de sistema;
> bitácora, hitos y papeles cuelgan de ella. NO nace entidad nueva ni
> membresía — eso es arco propio posterior. La cláusula «pez como individuo,
> a propósito» de la lámina queda SUPERADA por addendum (no se re-abren las
> once decisiones); la migración prevista en D-685 muere sin nacer.»

**ESTADO: CONSTRUIDA (motor) — S91-A.**
- `mascotas.sujeto` ('individuo' | 'acuario') + `mascotas.tipo_agua`
  ('dulce' | 'marino'), migración `20260807173000`, con **cinco CHECKs**:
  sujeto válido · acuario ⟹ `especie='pez'` · acuario ⟹ `raza IS NULL` ·
  agua válida · agua solo en acuario.
- **La marca la estampa el MOTOR** (las dos RPCs del dueño, `20260807183000`),
  jamás el cliente. Rojos producidos por camino real: `raza_no_aplica_acuario`
  y `tipo_agua_solo_pez`.
- **Medido al firmar: 0 mascotas `especie='pez'`** ⇒ cero backfill y la
  migración de peces de D-685 **muere sin nacer**.
- Los tres depósitos que la firma ordena, HECHOS: addendum en la lámina ·
  enmienda de D-685 · esta página.
- **PENDIENTE (de C):** la superficie del alta — la pregunta del nombre en voz
  de acuario y el campo dos. El motor la espera, no la bloquea.

---

## ② EL GLIFO DE LA RECETA — firmado

> «GLIFO RECETA FIRMADO — el préstamo receta→'caso' se retira.»

**ESTADO: el dibujo EXISTE, el préstamo SIGUE EN PIE hasta que C lo retire.**
- Medido: `'receta'` **ya está en el registry** de `packages/ui`
  (`Icono.tsx`, construido por B en S90 — la cápsula, con su hoja de contacto
  en `scripts/capturas/s90-b-hoja-contacto-receta.png`).
- Medido: `apps/cliente/src/lib/papeles.ts:61` sigue diciendo
  `receta: { claveVoz: 'Receta', icono: 'caso' }`, con el comentario que
  DECLARA el préstamo (líneas 48-59).
- **Por qué A no lo cambió, teniendo el archivo delante:** `apps/cliente`
  quedó asignada a **C** en la enmienda de territorios de esta misma sesión
  (METODO §1). *Depositar la regla y romperla en el mismo commit es cómo se
  gasta una regla nueva.*

> **PEDIDO LITERAL A C** (autocontenido, 76b — no requiere leer nada más):
> en `apps/cliente/src/lib/papeles.ts`, la fila `receta` pasa de
> `icono: 'caso'` a `icono: 'receta'`, y **el comentario que declara el
> préstamo muere con él** (el bloque de líneas ~48-59 que explica los tres
> dibujos viables y el préstamo declarado: la parte que habla de `receta`
> sale; la que habla del glifo que TODAVÍA falta se conserva). Firma del
> founder, 7-ago-2026: *«GLIFO RECETA FIRMADO — el préstamo receta→'caso' se
> retira.»* El dibujo ya existe en el registry: `Icono` acepta `'receta'` hoy.

**LO QUE ESTA FIRMA NO CIERRA:** el **glifo que falta** — el set ofrece 3
dibujos viables para 4 papeles (medido S90). Retirar este préstamo deja
**uno** vivo, no cero.

---

## ③ LA MATRÍCULA — la receta no espera

> «MATRÍCULA — la receta se construye completa como si la matrícula
> existiera; el fallback del negocio cubre mientras haya 0/16.»

**ESTADO: ya rige, y era lo construido — la firma RATIFICA en vez de cambiar.**
- La receta imprime `«Prescrita por {nombre}, matrícula {n}, en {negocio}»` y,
  sin matrícula, **el fallback que SE DICE IMPRESO**: nombra al profesional y
  declara que su matrícula no está registrada. *El papel dice la verdad de un
  dato que falta — que es distinto de callarlo y distinto de inventarlo.*
- Medido al depositar: **0 de 16 empleados con matrícula**. La captura viaja
  publicada desde el OTA del prestador `019fddbf` (runtime 1.0.4).
- **La frontera única del 15-ago (D-676 enmendada en S90) NO se toca**: la
  exención de los 16 existentes es **de AGENDA, jamás de FIRMA** — el
  certificado sigue exigiendo matrícula literal sin gracia y la receta sigue
  declarando su fallback. Esta firma no abre una gracia nueva: dice que la
  construcción no espera al dato.
- **Espera externa vigente:** las 16 matrículas las carga el founder.

---

## ④ LA VOZ DEL HITO DEL ACUARIO — gate de string, no letra

> «VOZ DEL HITO DEL ACUARIO — gate de string del founder, se firma en el gate
> de pantalla del alta (referencia de mesa, no letra: tenor de «Un mundo nuevo
> empieza»).»

**ESTADO: respetada por construcción — el motor guarda CLAVES, no voces.**
- `cat_hitos_narrativos` (migración `20260807180000`) siembra **dos claves de
  motor**: `vida_nueva_empieza` (alta de individuo) y `mundo_nuevo_empieza`
  (alta de acuario). **La clave no es la voz.**
- El tenor «Un mundo nuevo empieza» viaja en la `descripcion` del catálogo
  **rotulado como referencia de mesa**, para que quien escriba la voz sepa de
  dónde viene — y explícitamente NO como string de producto.
- La voz vive en i18n del cliente y **se firma en el gate de pantalla del
  alta**. Hasta entonces **nadie emite hitos**: la tabla nace SIN EMISOR a
  propósito (si se emitiera hoy, los bundles vivos pintarían «momento sin
  nombre» — el anti-patrón C8 de S72).
