# S91 · LÁMINA FIRMADA — EL ALTA DE MASCOTA

> **Firma del founder, 7-ago-2026: concepto, orden y preguntas APROBADOS.**
> La forma fina se decide en el gate en dispositivo.
>
> *Depositada por A (S90, orden 10 ③) — el texto del founder va VERBATIM;
> el anexo de medición al pie es registro de A, no parte de la firma.*

═══ LA REGLA MADRE ═══
Alta mínima en MENOS DE 2 MINUTOS. La señal práctica de MODELO_PRODUCTO
§3.1.6 es literal: «no diseñes wizard de 8 pasos».
Hoy el alta tiene CUATRO pantallas (medido por C). La lámina mete SEIS
campos en las MISMAS cuatro. No se agrega un solo paso.

Se agrupa por lo que la persona ya tiene en la cabeza, no por campo.

═══ PASO 1/4 — «¿Quién se suma a tu casa?» ═══
· ESPECIE PRIMERO, nombre segundo. La especie cambia el vocabulario y las
  opciones de todo lo que sigue.
· Grilla de SEIS: perro · gato · ave · pez · conejo · roedor.
  REPTIL NO SE OFRECE (cat_especies.reptil sigue activo=false; opción
  silenciosa por firma founder).
· Debajo, el nombre. Único guard del paso: nombre + especie.

═══ PASO 2/4 — «¿De qué raza es {nombre}?» ═══
· EL TÍTULO CAMBIA POR ESPECIE (firma founder): ave/pez preguntan «¿Qué
  tipo de ave es?» — a alguien con un canario no se le pregunta la raza.
· Tipeo predictivo sobre el catálogo de la ESPECIE ELEGIDA (D-379).
· Cada sugerencia lleva SU IMAGEN en círculo de 32 — ver la cara mientras
  elegís confirma que elegiste bien, y es el mismo círculo que después
  ocupa el lugar de la foto. Un elemento, dos trabajos.
· «MESTIZO» y «NO SÉ» son BOTONES A LA VISTA, jamás la última fila de una
  lista. D-379 los declara respuesta legítima de PRIMERA CLASE; esconderlos
  los vuelve premio consuelo.
· Regla de D-379 que rige: el catálogo SUGIERE, el dueño CONFIRMA — jamás
  pisa lo declarado. Talla y pelaje entran como DEFAULT derivado, invisible
  en esta pantalla.

═══ PASO 3/4 — «Contanos de su historia» ═══
Los tres campos hablan del pasado del animal: es UNA conversación, no tres.
· FECHA — bifurcación «¿sabés su fecha de nacimiento?» → Sí, la sé (fecha)
  / Es aproximada (cachorro · joven · adulto · mayor).
  ⚠️ ESTO YA ESTÁ CONSTRUIDO: CampoFecha tiene el botón y las 4 etapas, y
  guarda precision='estimada'. Medido: 0 de 20 lo usaron. NO SE CONSTRUYE,
  SE HACE VISIBLE.
· SEXO — macho · hembra · no sé. Se pregunta, no se exige.
· ORIGEN — adoptado · refugio · nació en casa · lo encontré · criadero.
  ⚠️ Hoy está HARDCODEADO en 'desconocido' dentro de la RPC. La columna ya
  admite los 9 valores y su CHECK de coherencia ya existe.
  Y habilita el hito «Una vida nueva empieza» (tabla nueva:
  evento_hito_narrativo NO EXISTE — firma founder: entra).

═══ PASO 4/4 — «Una foto de {nombre}» ═══
· El círculo muestra LA IMAGEN DE SU RAZA mientras no haya foto —
  <especie>/<slug-raza>.webp, y <especie>/generico.webp si no declaró raza.
  Si no hay ni especie resuelta, la huella genérica de AvatarMascota.
· «AHORA NO» es TEXTO, no botón. Siempre visible pero sin competir: la ley
  dice foto opcional pero MUY sugerida, y ese peso visual ES esa frase.
· Permiso de cámara denegado JAMÁS frena el alta.

═══ EL MODAL, al crear — texto FIRMADO verbatim ═══
  «¿Querés completar el perfil de {nombre}?
   Cuanto más sabemos de él, mejor lo podemos cuidar — y mejor le
   explicamos a quien lo atienda quién es.
   Podés hacerlo ahora o cuando quieras desde su perfil.
   [Completar ahora] [Más tarde]»

⛔ LO QUE HAY DETRÁS DE «COMPLETAR AHORA» NO PUEDE SER UNA CHECKLIST.
MODELO_LOYALTY §2 es literal: «jamás una checklist de tareas: la checklist
es la chorificación del cuidado y el dark pattern que mata el alma del
producto». Tampoco barra de progreso ni «perfil 40% completo».
Lo permitido y ya firmado: progreso en VOZ HUMANA — «Ya conocemos a Zeus
casi como vos».

═══ LO QUE EL ALTA NO PIDE, Y SU MOMENTO ═══
peso y talla → primera consulta o primer servicio · microchip y
esterilización → primera consulta veterinaria · marcas distintivas → al
emitir la ficha de identidad · vet de cabecera → segunda cita con el mismo
· alimentación → primera compra · convivencia → antes del primer paseo u
hospedaje · personalidad y miedos → después del primer servicio, que es
cuando el dueño TIENE algo que contar.

═══ LA SEGUNDA MASCOTA ═══
Hoy son DOS flujos calcados de 4 pantallas, divergiendo 42·27·24·50 líneas.
El rediseño MATA EL CLON: una sola pieza, dos entradas.
No hereda datos del hogar (no hay casi nada que heredar: familia_id ya se
deriva, country_code entra por default, y la especie no se hereda). Sí
ofrece PRIMERO la especie más frecuente del hogar. Es UX, no herencia.

═══ DEPENDENCIAS DURAS — el alta NO se construye sin esto ═══
1. ~~D-379 · el catálogo de razas NO EXISTE (0 tablas). mascotas.raza es text
   libre y solo lo escriben TRES RPCs del PRESTADOR. Las dos RPCs del dueño
   no tienen el parámetro.~~ Insumo listo: _mapeo.json con las 105 razas.
   ✅ **PAGADA EN S91-A** (registro de A): `cat_razas` con las **105 filas y
   sus acentos verbatim**, lector `obtenerRazasDeEspecie(especie)`, y las dos
   RPCs del dueño con `p_raza`. **`mascotas.raza` sigue TEXTO LIBRE sin FK, a
   propósito** — es la letra de D-379: el catálogo sugiere, «Mestizo / No sé»
   son primera clase. *Sigue abierta la mitad ② de esa deuda: talla y pelaje
   DEFAULT por raza no existen, así que el «default derivado invisible» de
   arriba todavía no tiene de dónde derivar.*
2. NO HAY COMPONENTE DE TIPEO PREDICTIVO en packages/ui. El patrón existe
   probado (Campo + SelectorOpcion + useMemo) pero vive INLINE en
   bitacora.tsx. Se generaliza, no se clona.
3. La galería: bucket especies-razas, público, 105 objetos + 6 genéricos.
   URL base:
   https://zyltipqscdsdsxnjclhp.supabase.co/storage/v1/object/public/especies-razas/
4. ~~evento_hito_narrativo no existe: tabla nueva para «Una vida nueva
   empieza».~~ ✅ **EXISTE DESDE S91-A** (registro de A, migración
   `20260807180000`): `evento_hito_narrativo` + `cat_hitos_narrativos` con
   sus dos claves de MOTOR (`vida_nueva_empieza` · `mundo_nuevo_empieza`).
   ⚠️ **NACE SIN EMISOR A PROPÓSITO:** nadie emite hitos hasta que la VOZ
   esté firmada en el gate de pantalla y viva en i18n — emitir antes pintaría
   «momento sin nombre» en los bundles vivos (el anti-patrón C8 de S72).
   *El tipo `hito_narrativo` YA existía en `cat_tipos_evento` con
   `tabla_tipada` NULL: no nació un tipo, se le dio cuerpo al que estaba.*

═══ EL ACUARIO — FUERA DEL CAMINO CRÍTICO ═══
~~No tiene sujeto en el motor (0 tablas, 0 columnas; mascota_id es NOT NULL).
v1 registra peces como mascota individual con etiqueta «especie
específica».~~ ⬅ **SUPERADO POR EL ADDENDUM DE ABAJO (firma founder,
7-ago-2026). Se tacha en vez de borrarse: la lámina firmada no se re-escribe
— se enmienda a la vista.** El acuario sigue siendo ARCO PROPIO de S91 — el
sujeto es el sistema, no el individuo.

═══ ✏️ ADDENDUM FIRMADO — LA CLÁUSULA DEL PEZ (founder, 7-ago-2026, opción A) ═══
> «en el alta, especie «Pez» registra el ACUARIO como sujeto. El nombre
> pedido es el del acuario; el campo dos es tipo de agua (dulce/marino) en
> espejo de la raza. Técnica: fila de `mascotas` con marca de sistema;
> bitácora, hitos y papeles cuelgan de ella. NO nace entidad nueva ni
> membresía — eso es arco propio posterior.»

**LAS ONCE DECISIONES DE LA LÁMINA NO SE RE-ABREN.** Cambia UNA cláusula, y
cambia acá y en D-685 — *en los dos lugares donde alguien la va a leer.*

Qué significa para las cuatro pantallas, sin agregar un paso:
· **PASO 1** — «Pez» sigue en la grilla de seis. Lo que cambia es a QUIÉN se
  le pide el nombre: **el nombre es el del ACUARIO**, no el de un pez.
· **PASO 2** — el título por especie ya cambiaba por firma; para pez la
  pregunta deja de ser de raza y pasa a ser el **tipo de agua: dulce o
  marino**. Es el CAMPO DOS en espejo de la raza — dos opciones, un toque,
  cero tipeo predictivo (el catálogo de razas no participa).
  ⚠️ Un acuario **no lleva raza**: el motor la rechaza tipado
  (`raza_no_aplica_acuario`). No es validación de pantalla, es la fuente.
· **PASO 3** — fecha/sexo/origen: **el sexo no aplica a un sistema**. La
  forma fina la decide el gate; la lámina ya dice que el sexo se pregunta,
  no se exige, así que omitirlo para acuario no contradice nada firmado.
· **PASO 4** — la foto es del acuario. Sin foto, el círculo cae al genérico
  `pez/generico.webp`, que **existe en el bucket** (medido).
· **EL HITO** — el alta de un acuario emite `mundo_nuevo_empieza`, no
  `vida_nueva_empieza`. **La VOZ se firma en el gate de pantalla** (firma ④
  de mesa): el tenor de referencia es «Un mundo nuevo empieza», y referencia
  no es letra.

**Estado del motor al depositar (registro de A, no firma):** construido —
`mascotas.sujeto` + `mascotas.tipo_agua` con sus cinco CHECKs (migración
`20260807173000`) y las dos RPCs del dueño estampando la marca
(`20260807183000`). **La marca la pone el MOTOR: la pantalla no la manda.**
Las firmas de mesa completas, en
`docs/relevamientos/2026-08-07-s91a-FIRMAS-DE-MESA.md`.

═══ ALCANCE ═══
La lámina es CRITERIO, NO EVIDENCIA: está hecha en web y el producto es
React Native. Las sombras van por elevation + shadowColor/Offset/Opacity/
Radius, jamás box-shadow. El motion lo pone Reanimated.
El gate es en DISPOSITIVO, del founder.

---

## ANEXO DE A — el estado MEDIDO al depósito (S90, 7-ago; registro, no firma)

*Todo contra el objeto vivo, para que la apertura de S91 no re-mida:*

- **Dependencia 3 — la galería YA EXISTE Y ESTÁ SEMBRADA:** bucket
  `especies-razas`, público, **111 objetos** (perro 45 · gato 21 · ave 11 ·
  pez 11 · conejo 9 · roedor 9, con `<especie>/generico.webp` en las seis).
  Origen-IA firmado y registrado en la ficha D-288. **Reptil sin genérico,
  verificado (400) — firma, no olvido.** Slugs vivos con la forma
  `perro/akita-inu.webp`.
- **Dependencia 1 — confirmada:** cero tablas `%raza%` en public;
  `_mapeo.json` NO está en el repo (los slugs del bucket son medibles, pero
  el nombre con su acento vive en el mapeo — el insumo tiene que viajar).
- **Dependencia 4 — confirmada:** `evento_hito_narrativo` no existe.
- **Las dos RPCs del dueño, firmas vivas medidas:**
  `crear_familia_con_primera_mascota(p_nombre_familia, p_nombre_mascota,
  p_especie, p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url)` y
  `agregar_mascota_a_familia(p_nombre_mascota, p_especie,
  p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url)` — **ninguna
  recibe raza ni origen** (el origen está hardcodeado).
- **El CHECK de origen ya admite los 9 valores**, medido:
  `criadero · refugio · adoptado · comprado_particular · nacido_en_casa ·
  encontrado · transferido · desconocido · alta_asistida`.
- `cat_especies`: los seis de la grilla activos · reptil/cobaya/huron/
  equino/otro `activo=false`.
