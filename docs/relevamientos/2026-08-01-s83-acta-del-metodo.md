# S83 · ACTA DEL MÉTODO

> **Molde: el acta de S82.** Su §5 fue la checklist de arranque de esta sesión y
> funcionó — por eso se repite la forma.
>
> **REGLA DE ESTA ACTA: nada se afirma sin procedencia.** Cada número dice de
> dónde sale — **(A)** medido por esta pista · **(B)/(C)** reportado por la pista
> que lo midió · **(founder)** firma en dispositivo. **Lo que no está medido se
> declara como hueco.** La sesión pagó tres veces por premisas sin medir y ése es
> su aprendizaje central.

---

## 0 · EL RESULTADO

**Tres pistas en tres worktrees** (estreno de la regla 85) · **A como escritora
única de docs y conductora de merges y vedas** · **ocho OTAs publicados**, los
ocho con ancla limpia (A, verificado uno por uno con `update:view`).

**Lo que cambió de fondo, y no es una pantalla: el MÉTODO.** La lámina HTML murió
como instrumento de diseño de pantalla y el ciclo pasó a ser **UI real sin
cablear → gate en dispositivo → cableado**. El Perfil del prestador lo recorrió
entero y **es la primera pantalla de la casa que nace, se gatea y se cablea con
el ciclo nuevo**.

**24 fichas** (D-589 → D-612, con **D-610 libre** — ver §4) · **CONTRATO v1.21 →
v1.24** con tres reglas enmendadas · **§15b.0 ganó su tercer verbo** ·
**candidatas de lección 14 → 17**.

---

## 1 · LO QUE PRODUJO EL RESULTADO — en orden de peso

### 1.1 EL CAMBIO DE MÉTODO: muere la lámina como instrumento de pantalla *(firma founder, 31-jul)*

> ### **UI real sin cablear → gate en dispositivo → cableado.**

**El porqué, con la letra del founder:** *las idas y vueltas de la traducción
HTML→RN cuestan más que el resultado.* Una lámina aprobada hay que traducirla, y
**la traducción reabre todas las decisiones que la lámina creía cerradas**.

**Y el argumento de la casa, que hace que esto SUBA la vara en vez de bajarla:**
`DIRECTIVA_CRAFT_CLIENTE` §10 llama a las láminas *criterio, no evidencia*, con
su razón exacta — *"nada de esto se vio en un teléfono real"*. **Una pantalla
montada con piezas de `packages/ui` SÍ es evidencia**: corre en el dispositivo,
usa los tokens vivos, respeta los tres temas, hereda el comportamiento de las
primitivas. **Se firma lo que existe.**

**El costo del instrumento viejo estaba medido de antes (S82): tres portes
literales desde CSS de lámina** — `#EEECE8` tomado como token de la casa, un
`text-transform:uppercase` que resucitó el eyebrow que S52 había matado, y los 17
hexes de la v7 (el único porte que se frenó a tiempo). **No era indisciplina: era
el instrumento.** Por eso la cura no fue otra advertencia sino cambiarlo.

**LAS TRES CLÁUSULAS, no opcionales** — son lo que la lámina protegía:
1. La UI sin cablear vive en **ruta de verificación**, no suelta en la navegación.
2. **No reemplaza la pantalla viva.** Conviven hasta la firma.
3. **No se cablea hasta la firma en dispositivo.** Cablear antes es el gasto que
   la enmienda evita: trabajo de datos sobre una composición que puede no
   sobrevivir al gate.

**QUÉ SOBREVIVE DEL INSTRUMENTO:** comparar **variantes de un token barato** (el
agua, el glow, la huella). Ahí sigue siendo lo correcto — la pregunta es *"¿cuál
de estos tres?"*, no depende del contexto de una pantalla, y montar tres
variantes en HTML cuesta minutos. **La frontera: variantes de un token → lámina ·
composición de una pantalla → UI real.**

**Última lámina de pantalla:** `docs/laminas/lamina-perfil-prestador.html`
(S83-C8/C9). Se conserva por su criterio; no se hacen más.

*(Letra en `CONTRATO_TRABAJO` regla 80, enmienda S83 — v1.22. El acta de S82
§1.1/§1.2 quedó SUPERSEDED con nota al pie, sin reescribirse.)*

### 1.2 EL LOTE EN VEZ DE LA INSTRUCCIÓN SUELTA *(founder)*

**Sin usuarios y sin lógica tocada, el costo de equivocarse es un OTA.** De ahí:
**se construye todo, se publica una vez, el founder mira una vez.**

**Por qué importa y no es solo velocidad:** la instrucción de a una **gasta
gates**, que es el recurso escaso — el founder tiene un teléfono y una atención,
no infinitas pasadas. Y tiene un efecto de segundo orden que esta sesión sufrió:
**pedir una firma por vez hace que el mismo elemento se le muestre varias veces
sin cerrar**, y eso desgasta la confianza en el instrumento (ver §2.1).

*(Declarado por el founder como corrección a la inercia de S82.)*

### 1.3 LOS SLOTS COMO MECÁNICA DE REUSO

**La vara del founder:** *"reusar lo máximo del cliente, pero acá gobierna el
verde; que se note que somos la misma familia."*

**Ocho slots** hacen que **una pieza compartida se vista sola por casa**: el
componente no sabe en qué app corre, el tema decide. **Eso convierte el reuso de
disciplina en mecánica** — antes reusar exigía acordarse de pasar el color
correcto en cada consumidor, y cada olvido era una divergencia silenciosa.

**El eje es el mismo que ya venía:** `cta`/`ctaTexto`/`ctaElevado` (S82) →
`control` (B6) → `active` (B13, que cerró D-598) → `marcaEleccion` (B19) →
`atmosfera` (B34). **Cada slot nuevo es una divergencia que deja de poder
ocurrir.** *(Enumeración y qué resuelve cada uno: censo de enmiendas §2.4.)*

### 1.4 EL PASO ⓪ DE LA VEDA, con su evidencia

**Nace del incidente C17** (S83): `porcelain` vacío en el paso ①, **árbol sucio
durante el publish**, ancla con asterisco. Lo sucio eran dos `.md`, así que **el
bundle salió limpio de casualidad** — un `.tsx` en esa ventana habría viajado
adentro del OTA sin que nadie lo supiera.

> **⓪ Quien publica PIDE la congelación NOMBRANDO a quiénes espera, y NO bundlea
> hasta recibir la confirmación de CADA UNA, AL MOMENTO.**

**Una congelación declarada hace tres turnos no es una congelación** — es L-166
aplicada a la coordinación: **el estado de congelación de otra pista es un dato
vivo**.

**LA EVIDENCIA MEDIDA (A, `update:view` group por group): los OCHO OTAs de S83
tienen `isGitWorkingTreeDirty = None`.** Anclas: `c52c207` · `6fc4129` ·
`1162153` · `c243047` · `5e0123a` · `52b2a11` · `47a94d3` · `70ffaeb`. **Y en los
seis anteriores (S81–S82) tampoco hay ninguno sucio.**

**🔴 HUECO DECLARADO, y es contra la evidencia que la mesa pidió citar: el
asterisco de C17 NO aparece en el registro de EAS.** Revisé 14 groups y **ninguno
tiene `dirty=true`**. Puede ser que el incidente fuera en el canal del cliente,
que el group quedara superseded, o que el "asterisco" se observara en el reporte
de C y no en `isGitWorkingTreeDirty`. **No lo sé, y por eso no lo afirmo: el
contraste C17-vs-los-ocho está tomado del reporte de la mesa, no de una medición
mía.** Lo que sí está medido es que **los ocho de S83 salieron limpios**.

### 1.5 LA VERIFICACIÓN POR SABOTAJE, aplicada a cerrar fichas

**D-611 y las tres fichas de corpus se cerraron/movieron rompiendo el código a
propósito, no leyendo el commit de quien construyó** (L-153 llevada un paso más:
tampoco la declara quien mergea sin probar). Tres mitades de R16 en `exit 1`; el
`boxShadow` artesanal inyectado en la galería que **R4 no cazó** (`exit 0`), que
es lo que mantuvo D-599 abierta cuando la mesa la daba por cerrada.

---

## 2 · LO QUE COSTÓ — para no repetirlo

### 2.1 LOS ERRORES DE LA MESA, sin maquillar *(declarados por el propio founder)*

1. **Pidió firmas de galería sin cerrar el circuito hasta la pantalla.** El
   founder **firmó el glow TRES veces** y **nunca había llegado a una pantalla**.
   **Un gate que no aterriza no es un gate: es una consulta** — y repetirla
   desgasta la confianza en el instrumento con toda razón.
2. **Mandó a cablear el Perfil sin ordenar el craft de sus campos** → **seis
   defectos** (C33). *El craft no viene con la estructura.*
3. **Ordenó trabajo a una pista congelada** (dos veces).
4. **Resumió una confirmación en vez de reenviarla.** Una confirmación es un dato
   **con hora**: resumida pierde lo que la vuelve válida.
5. **Mandó órdenes a pistas dentro de mensajes dirigidos al founder** (cuatro
   veces).
6. **Afirmó estados del repo que no midió:** los 31 commits de `packages/ui` como
   si todos aplicaran al prestador (falso: varios cliente-only) · el 54/50 como
   divergencia (no lo era: total vs primera-semana) · las dos promociones
   (canceladas por medición).

**LA ASIMETRÍA QUE LO EXPLICA — y es la razón por la que estos seis no son
"descuidos": la mesa es el único actor que no tiene quien lo frene.** Una pista
que se equivoca choca contra un guard, un gate, o contra otra pista que le pide
confirmación. **Cuando la mesa se saltea un paso, el error viaja hacia abajo COMO
ORDEN**, y quien la recibe **tiene el sesgo de obedecer**. Por eso el protocolo
tiene que sobrevivir a una mesa distraída, y por eso los pasos de la mesa hay que
**escribirlos** (D-609).

### 2.2 LAS FALLAS CON NOMBRE de esta sesión

| falla | qué la hace cara |
|---|---|
| **EL RÓTULO QUE MIENTE en un instrumento de gate** (D-602) | En una pantalla produce un DEFECTO; **en una lámina produce una FIRMA FALSA — y una firma falsa se propaga como ley**, porque la casa está hecha para que lo firmado multiplique. Agravante: **la galería es el único lugar donde nadie sospecha** — se mira para decidir, no para auditar |
| **LA INSTRUCCIÓN FALSA** (D-604) | Un comentario que manda a leer un guard **retirado**. No es prosa vieja: **manda a verificar contra algo que no está**, y deja dos lecturas plausibles, ninguna verdadera. **Aparece justo cuando la casa hace lo correcto** (retirar un guard que ya no sirve) |
| **EL DIFF ENTRE PUNTAS** (D-608) | **Usa el vocabulario del daño** (`−44` en un archivo que acabás de escribir) y **aparece en el momento de máxima cautela**. Frenó **dos merges legítimos** |
| **LA LISTA LOCAL** (D-607) | 11 commits declarados pendientes **estando los 11 en main**. La pista **no tiene cómo enterarse**: git no notifica hacia atrás |
| **EL REF SIN FETCH** (enmienda de D-607) | `origin/main` **tiene la forma de un ref remoto y la naturaleza de un dato en caché**. Frenó un publish, y **la cura tenía el mismo agujero que la enfermedad** |
| **RAZONAR UN TOKEN NO ES MEDIRLO** (candidata #17) | Su modo de falla es **un número plausible** que después se cita como medición. **Tres casos en un turno, uno de esta mesa** |

**El hilo que las une, y por eso se listan juntas: las seis producen SALIDAS
CREÍBLES.** Ninguna rompe un build. **Todas se leen como información correcta** —
y por eso ningún gate las caza y sobreviven hasta que alguien mide.

### 2.3 EL HUECO QUE LA SESIÓN NO CERRÓ

**El eje COMPOSICIÓN de la regla 81 sigue sin tabla, por segunda sesión
seguida.** Y **el mapa de familias NO lo reemplaza**: mide **anatomía**, no
composición. Se declara acá para que S84 no lo herede como hecho.

---

## 3 · PRINCIPIOS REUTILIZABLES

### 3.1 LOS DOS REGISTROS: sobre superficie oscura manda el hex puro
Cerró **cuatro slots distintos** y explica por qué **el CTA fue el que cayó
cuando el fondo se movió**: un color elegido contra un fondo claro no sobrevive a
que ese fondo cambie de luminancia. **El registro no es una excepción por tema:
es la regla de que el par manda sobre el hex.**

### 3.2 CAUSA RAÍZ COMPARTIDA NO ES CURA COMPARTIDA *(A, de las tres fichas de corpus)*
D-590, D-599 y D-606 declaraban el mismo síntoma —*nadie mide esto*— y **la causa
era distinta en cada una**: faltaba **la clase de par** · falta **el corpus de
archivos** · hay **una exención que nadie re-visitó**. **Un commit no podía
cerrarlas, y darlas por cerradas juntas habría dejado dos huecos con etiqueta de
resueltos.**

### 3.3 EL EXPERIMENTO DISCRIMINANTE: dos archivos antes de barrer 73
Se mide sobre **dos** lo que decidiría un barrido de **73**. Si sale limpio, el
barrido está justificado; si se ensucia, **se revierte con dos líneas** en vez de
con setenta y tres.

### 3.4 UNA PIEZA NACE DONDE TIENE SU PRIMER CONSUMIDOR *(founder, S83)*
Ver la regla completa y sus casos en **§4** y en el censo de enmiendas.

### 3.5 LA VERIFICACIÓN QUE PUEDE SALIR ROJA
Toda la sesión: **sabotaje para cerrar fichas** · **rojo producido por brazo**
(no por regla) · **el guard que se retira deja su grep**. Es L-192 llevada a sus
consecuencias, y las tres candidatas nuevas son sus variantes.

---

## 4 · ESTADO AL CIERRE Y PENDIENTES

**Publicado:** ocho OTAs, último **group `19f8b87c` (S83-J) · ancla `70ffaeb` ·
runtime 1.0.3 · dirty None** (A, verificado).

**Fichas:** **D-589 → D-612**, con **D-610 LIBRE** — hueco de numeración
verificado por grep (0 ocurrencias en todo el repo). **No se rellena**: la regla
66 pide el siguiente número libre, y un número reservado sin texto es lo que
L-169 vino a prohibir.

**Cerradas:** D-596 ✅ · D-598 ✅ · D-611 ✅ (por sabotaje) · **D-605 prioridad ①
pagada** (los 2 helpers de `packages/ui`) · **D-590 su mitad de corpus**.

**Los tres worktrees siguen montados.** Balance del estreno de la regla 85:
**curó el índice** (tres árboles, tres índices, **cero arrastres en toda la
sesión** contra los tres que D-586 documentaba) **y no curó el árbol de trabajo
de main**, desde donde se publica — su otra mitad cobró el mismo día (C17).

**Sin firma (regla 80):** las tres candidatas nuevas · el refactor genérico de
brazos · las fichas por territorio.

---

## 5 · ARRANQUE DE S84 — ver el prompt de apertura

`docs/relevamientos/2026-08-01-s84-prompt-de-apertura.md`. **Su primer punto no
es de diseño: es el arbitraje de D-173.**
