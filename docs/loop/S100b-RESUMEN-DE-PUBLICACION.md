# S100b · RESUMEN DE PUBLICACIÓN — **✅ ARMADO Y VERDE, ESPERANDO GO**

> **Mano publicadora: A.** El push a `main` y las dos OTA **piden firma del founder en pantalla**.
> **NADA SE PUBLICÓ.** El ensamblado vive en la rama local `ensamblado`.

## ⭐ EL ESTADO, EN UNA TABLA

| | |
|---|---|
| **SHA del ensamblado** | **`f2cb91ee75ab`** · 78 commits sobre `main` `22e5fc3e` · árbol en **0** |
| ramas dentro | **las cuatro**, verificado por `merge-base --is-ancestor`: A `8556009b` · B `99debdd0` · C `1d22b176` · D `887943e0` |
| `verify:diseno` | ✅ **VERDE · 46 reglas** *(44 en main + R53 y R54 que entran con B)* |
| typechecks | ✅ **los cuatro en 0**: `@epetplace/api` · `@epetplace/ui` · `apps/cliente` · `apps/prestador` |
| `verify-s100b-destinos` | ✅ **12/12** |
| migraciones | ✅ **349 local = 349 remoto · 0 solo-local · 0 solo-remoto** |
| **inconsistencias abiertas** | **ninguna de motor.** Cero migraciones nuevas en toda la vuelta |

**Conflictos: dos, los dos resueltos.** El de `index.tsx` **lo disolvió C** mergeando a D en su rama y
reaplicando sus dos cortes; el del lint **lo resolví yo combinando** (R53 con su escape + R54 de B, y mi
`BASELINE_R52 = 0`). **Ninguno era visible en las ramas.**

---

## §0 · 🔴 LO ÚNICO QUE FRENA, y no es mecánico

**Corrí el ensamblaje en una rama descartable ANTES del GO**, porque la mesa avisó que *en S100 el único
rojo apareció al ensamblar*. **Apareció otra vez, y otra vez solo al ensamblar: ninguna rama lo muestra.**

| merge sobre `main` | resultado |
|---|---|
| `pista-b` | ✅ limpio |
| `pista-c` | ✅ limpio |
| `pista-d` | 🔴 **conflicto con C** en `apps/cliente/src/app/(tabs)/despensa/index.tsx` — **4 bloques** |
| `pista-a` | 🟡 conflicto con B en `scripts/verify-diseno.mjs` — **mecánico, lo resuelvo yo** |

### 🔴 EL ROJO QUE SOLO APARECIÓ AL ENSAMBLAR — R53 sobre la pantalla de D

**No estaba en ninguna rama.** Al mergear D, el gate de commit frenó:

```
✗ R53: 1 pantalla(s) NUEVA(S) dibujan un pie fijo a mano (baseline 11 por RUTA)
   apps/cliente/src/app/(tabs)/despensa/en-camino/[pedidoId].tsx
```

Es **nueva** porque D rehízo esa pantalla en esta vuelta (mapa a sangre + hoja anclada). B había medido que
`en-camino/` **no** tenía pie fijo — **cierto cuando lo midió, falso después del rebuild**.

**Y era FORMA, no defecto**, verificado leyendo el archivo: la hoja lleva `maxHeight`, **el scroll vive
ADENTRO** y lo que hay debajo es **el mapa, que no scrollea** ⇒ no hay contenido de página que el pie pueda
tapar, y el defecto que R53 persigue *(el consumidor estima el alto del pie)* es **inexpresable** ahí.
Montar `PantallaConPie` sería una **regresión**: devolvería el mapa a ser una banda que scrollea.

**NO SE BYPASSEÓ con `SALTAR_GATE`, y las dos razones quedan escritas:**
① saltar un gate para publicar es lo que el gate existe para impedir · ② **habría metido el pie nuevo de D
DENTRO del baseline de 11 — el intercambio silencioso que el baseline-por-ruta existe para evitar.**

**ADJUDICACIÓN DE MESA: R53 gana el ESCAPE POR DECLARACIÓN** (patrón R45/R46), **y la ruta NO entra al
baseline** — meterla ahí la registraría como *deuda pendiente* y no lo es. **B lo aplicó** (`99debdd0`), y
su mecanismo trae sus propios dientes, verificados en su código antes de confiarle nada:
- la razón se busca en el `src` **crudo** con `/R53-DECLARADO:\s*\S.{15,}/` ⇒ **exige ≥16 caracteres de
  razón real**. Un marcador pelado **no escapa** (fixture `pelada.tsx`).
- **es UNA declaración POR PIE, no por archivo**: con dos pies y una razón, **el que sobra muerde**
  (fixture `dos-pies.tsx`) ⇒ *si mañana alguien mete contenido de página bajo un pie fijo en esa ruta, la
  regla vuelve a morder.*
- los declarados **se informan por nombre** en la salida del lint: si crecen, se ven.

**⚠️ Su límite, escrito para que no se lea de más:** el lint **cuenta**; no puede saber cuál declaración
corresponde a cuál pie. Su verde dice *«hay tantas razones escritas como pies»*, jamás *«cada razón es la
correcta»*. **Esa mitad se lee en revisión.**
**Y la declaración la escribe D**, no B ni yo: *la forma es de B, el motivo es de la pantalla* — una razón
escrita por quien no la compuso es la clase de comentario que envejece mal sin que nadie lo note.

**☠️ ESTO NO ES UN BYPASS Y NO SE LEE COMO TAL:** un bypass suprime el gate; **acá el gate sigue corriendo,
sigue contando y sigue mordiendo** — lo que cambió es que el caso legítimo tiene que pagar una frase que
alguien puede leer y discutir.

### El de A↔B: mecánico, sin decisión
B agregó **R53** y **R54**; yo bajé `BASELINE_R52` de 1 a 0. **Mismo punto de inserción, cero desacuerdo:
sobreviven los dos lados.** Condición que B pidió y que se respeta: **R53 conserva su baseline POR RUTA**
(11 rutas nombradas, no un número — *un baseline numérico esconde un intercambio*) y **R54 DURA EN 0**.
**🔴 Y LA NOTA QUE EVITA QUE SE LEA COMO REGRESIÓN: si al correr el lint sobre el ensamblado R53 BAJA de
11, eso NO es un fallo — es C y A migrando.** *Un baseline solo-baja que baja está haciendo su trabajo; el
número chico es el progreso, no el síntoma.*

### 🔴 El de C↔D: una decisión de producto, y por eso no la toma la mano publicadora
C y D curaron la misma pantalla —**la que ordenó toda la vuelta** (G-04)— con arquitecturas incompatibles:
· **C** montó `PantallaConPie` (cierra `</PantallaConPie>`).
· **D** **mató la barra fija «Ver carrito (N)»** —con la canasta permanente arriba pasó a ser *«una segunda
  puerta al mismo cuarto»*— y cierra `</ScrollView>`, sin pie.

**B lo redujo de «dos arquitecturas» a UNA pregunta, con un dato de su pieza:** `PantallaConPie` **sin
`pie` es un no-op** (`{pie === undefined ? null : …}`, reserva `propioAbajo + altoPie` con `altoPie` en 0).
⇒ **si la barra muere, montarla ahí no reserva nada.**

> **La pregunta: ¿la vitrina conserva un pie fijo, ahora que la canasta vive en el encabezado?**
> **NO** ⇒ manda D y lo de C queda moot ahí · **SÍ** ⇒ manda C y D cede.

**Lo que NO está en disputa** (para que no se resuelva de más): **el buscador de C y la canasta de D van en
la MISMA fila del encabezado y no chocan** — `busqueda` y `accionDer` son slots distintos de `Encabezado`.
Eso **se combina**.
**☠️ RESUELTO EN VUELO — el `paddingBottom` dejó de ser empate:** C tenía razón (el `ScrollView` de una
pantalla de tab termina en **699.0 dp**, el filo de la barra ⇒ sumar `insets.bottom` lo cuenta dos veces), y
**D concedió y lo sacó de sus TRES pantallas** (`763d0951`), no solo de la que chocaba — con tres
`useSafeAreaInsets()` sin consumidor muertos de paso. Sus palabras: *«era una línea vieja, no una
posición»*. **Los dos lados ya tienen el mismo valor.**

**✅ Y LA CURA G-04 DE C NO SE PIERDE — verificado por mí contra el archivo de D, no tomado de su palabra:**
`etiquetaVisible={false}` vive en la **línea 619** de su versión, dentro del slot `busqueda` del
`Encabezado`. **Adoptar el lado de D REUBICA la cura de C, no la borra.** Y la cabecera de D cita la
medición de C como la razón del slot (*«76 dp para una caja de texto de 26»*).

**⇒ QUEDA UNA SOLA COSA EN DISPUTA: el bloque final** —`</PantallaConPie>` contra `</ScrollView>` sin pie—
o sea la pregunta del pie. **D votó por la suya y declaró lo que se pierde:** el ACUSE (pasa al contador,
siempre visible) · **el CTA de avanzar al pie, que D declara NO haber medido en Laika** — *lo único de esta
decisión que es juicio y no medición, y va al gate como reversible* · y `PantallaConPie` sin consumidor en
esa pantalla (sigue viva en la ficha y en el checkout). **La última palabra es de C**, porque el hallazgo
que ordenó la vuelta es suyo, y D se ofreció a tomar lo que C vea que él no ve.

⚠️ **Y un riesgo de orden:** C regeneró capturas *«con el estado vigente»*. **Si gana D, pueden estar
hechas contra la otra versión** — se miran DESPUÉS del merge.

---

## §1 · ORDEN DE MERGE PROPUESTO

**`B → C → D → A`**, y el orden tiene razón:
1. **B primero** — `packages/*` es lo que todas consumen; si algo de pieza no compila, se ve antes de que
   tres apps lo hereden. (Su header ya entró a `main` por merge acotado: `22e5fc3e`.)
2. **C y D en el medio**, en el orden que su propia decisión de §0 defina: **el que cede se mergea
   segundo**, así el conflicto se resuelve una sola vez y contra el estado ya asentado del otro.
3. **A al final** — mi único conflicto es con el lint, que conviene resolver cuando **todas** las reglas
   ya están puestas: así `verify:diseno` corre una vez, entero, sobre el árbol final.

---

## §2 · VERIFICACIÓN — SOBRE EL BUNDLE ARMADO, JAMÁS SOBRE LAS RAMAS

*Es la orden de la mesa y tiene precedente: en S100 el único rojo apareció al ensamblar, y su causa era un
archivo que nadie commitea.*

| paso | qué |
|---|---|
| 1 | `pnpm install` si algún `package.json` se movió |
| 2 | **Metro `--clear`** — obligatorio: las cuatro pistas tocaron `packages/*` |
| 3 | ✅ `verify:diseno` **ENTERO** sobre el ensamblado — **VERDE, 46 reglas** |
| 4 | ✅ **Los cuatro typechecks** en exit 0 |
| 5 | ✅ `verify-s100b-destinos.ts` — **12/12** |
| 6 | ✅ Migraciones **349 = 349**, medido con el comando — cero desalineadas |
| 7 | ✅ SHA declarado arriba · **cero inconsistencias de motor** |
| 8 | ⏳ **Metro `--clear`** al levantar — obligatorio, la vuelta tocó `packages/ui` fuerte |

---

## §3 · LAS DOS OTA — DECLARADAS ANTES DE ELEGIR

**Contra el MISMO commit, con árbol limpio y SIN asterisco.** Se declara acá, antes de publicar, porque
`update:view` **no expone el estado del árbol**: *un publish sucio es inauditable después.*
- `apps/cliente` — runtime **1.0.3**
- `apps/prestador` — runtime **1.0.5**
- **`eas-cli` SIEMPRE desde `apps/<app>/`, nunca desde la raíz** — aunque solo se esté mirando: el scaffold
  del `app.json` stub depende del DIRECTORIO, no de la operación (S85).
- El ancla se lee **del OBJETO** (`update:view --json` → `gitCommitHash`), jamás del texto del mensaje.
- ⚠️ Los dos pies se distinguen **solo en el octavo carácter** (D-785 sigue viva).

---

## §4 · LOS SUJETOS VIVOS DEL GATE — RECONFIRMADOS CONTRA LA BASE

| sujeto | estado | evidencia |
|---|---|---|
| **envío `474e6ff6`** | `hacia_destino` | **6 puntos** de track · destino ✓ · **placa `PBA-0142`** · código `1402` · familia del founder |
| **pedido `21fb1284`** | `entregado` | **2 ítems** · $28.21 · envío entregado · `verificado_en` ✓ · foto ✓ · «Repartidor de Pruebas» · código `7361` |
| └ **el par que decide** | | alimento → **Thor** `entra_al_expediente=true` ⇒ **depositó 1** · higiene → **Jack** `false` ⇒ **depositó 0** |

**Los dos en la familia del founder.** El segundo es la siembra de esta vuelta: *la ceremonia de entrega
que S100 construyó nunca pudo abrirse, y hoy tiene por primera vez un caso donde puede equivocarse.*

⚠️ **Lo que el gate va a ver y NO es defecto nuevo:** el otro envío en reparto (`64f2818a`) **no tiene
placa y tiene 0 puntos de track** — es la deuda de DATO ya registrada en S100 (*5 de 6 fichas de repartidor
salen sin placa*), no una regresión de esta vuelta.

---

## §5 · ③ QUÉ CAMBIA VISUALMENTE — contra qué mirar

*Pedido por la mesa: el founder va a mirar y necesita saber contra qué.*

**La vitrina y la tarjeta**
- **el `+` va NEUTRO** y el acento queda reservado al ESTADO — los `+` eran el **1.17 %** de píxeles de
  marca = **3.1 timbres**, o sea todo el presupuesto de acento de la pantalla; ahora **0**, y el acento
  reaparece en el stepper cuando el producto ya está en el carrito *(cierra además el «control sin estado»:
  96 % de los sitios no destaca lo ya agregado)*
- **la foto pasa a 1:1** (con 4:3 + `cover` un packshot cuadrado perdía 25 % de alto) y el fondo de su caja
  deja de ser el lavanda que se leía como «marco púrpura»
- **el precio baja a peso 500** — no era tamaño, era peso
- **el stepper compacto (116 dp) y AHORA SE PUEDE LLEGAR A 2** — antes el `+` no existía en el árbol a 138
  dp de ancho: no era lógica, era geometría
- **sin foto** deja de ser una caja vacía y pasa a estado propio con glifo

**El encabezado y la barra**
- **el encabezado en UNA fila: `[isotipo][buscador][canasta]`**, y **la canasta con su contador** reemplaza
  al botón de texto
- **el título de pantalla se apaga sin dejar de anunciarse** (el píxel, jamás el nombre: el lector de
  pantalla sigue diciendo lo mismo)

**El carrito y el destino** *(mío)*
- **«¿para quién es?» filtrado por especie** — el caso del gate pasa de **6 destinos a 2**
- **la donación es una pastilla**, no un anuncio: de **343.8 × 144.7 dp (6.9× una pastilla)** a su tamaño,
  con el párrafo detrás de una «i» — **y ahora se puede DESMARCAR**
- **el menos en 1 es papelera** y **el botón «Quitar» murió**
- **la pregunta del destino se hace UNA vez**, no una por producto

**El checkout** *(mío)*
- **la dirección es una línea con chevron**, no un botón
- **«quién recibe» y el teléfono SE MUESTRAN**; el único campo es **«instrucciones de entrega»**
- **cada entrega es una carta** y hay **un solo sólido**: pagar. «Volver a editar» baja a label
- **«que llegue solo»**: los dos párrafos detrás de una «i», y **las frecuencias no existen hasta que el
  interruptor está encendido**
- ☠️ **«PROGRAMAR OTRA FECHA» YA NO ESTÁ** — cuarta vez que se pedía, y ahora `verify:diseno` R52 lo
  vigila **DURA EN 0**

**El seguimiento**
- **la escalera con nodos de 32**
- **EN CAMINO con el mapa a sangre y la placa mandando** — es lo que se verifica en la calle
- **«Tus pedidos» tiene entrada** (antes el único camino era el CTA post-compra)

**La ficha**
- 🔴 **LA FICHA GANÓ PRECIO, y no estaba en los dieciséis:** con 3 presentaciones y ninguna elegida **no
  mostraba NINGÚN importe**. Ahora dice **«desde $24.90 · $8,30/kg»**.
  *Lo encontró C **mirando la captura**, no midiendo — y es la síntesis de la vuelta: **sus cuatro números
  decían que la ficha estaba curada, y la ficha no tenía precio.** Los instrumentos declaran ausencia de
  defecto conocido, jamás presencia de calidad. Es la razón por la que esta vuelta existió.*

**El número de G-04, que es el que ordenó todo**
- **el cromo antes del primer producto: 470 → 317 dp** (70,7 % → 50,2 % del alto útil en la vara de C).
  **En el aparato de B el antes era 84,1 %, y ése es el que vale para el gate.** **−153 dp · −20,5 puntos.**
  *La vara de C está calibrada contra la de B: su tarjeta mide 164,0 dp contra los 163,9 medidos.*

**Y lo que nadie vio nunca**
- 🔴 **LA CEREMONIA DE ENTREGA.** Tres actos. **Existe desde S100 y jamás pudo abrirse** porque no había un
  solo pedido entregado completo en la base — ni real ni demo. **Hoy tiene sujeto.**

---

## §5bis · 🔴 LAS TRES DECISIONES REVERSIBLES — van al OJO, no como defectos

*Ninguna es un rojo oculto: las tres se tomaron con su número y se declaran para que el founder las juzgue
mirando, que es lo único que puede resolverlas.*

**① LA PRIMERA TARJETA NO ENTRA POR 18 dp.** «Tus pedidos» arriba de la grilla cura G-15 —hallazgo firmado
del founder— y **cuesta 77 dp**. Arriba ⇒ cromo 317, faltan 18. Debajo de la grilla ⇒ cromo 240, **entra
con 59 de sobra**. **Se publica ARRIBA** (el founder pidió encontrarla; la tarjeta se completa deslizando
un dedo) y **es reversible moviendo un bloque**.
*C intentó el tercer camino y lo declara: quitarle el renglón de explicación ahorró **2 dp de los 18** —
`CeldaNavegacion` tiene alto mínimo ⇒ **la forma no admite el efecto**, y ahí paró de mover números.*

**② LA VITRINA NO TIENE PIE FIJO** ⇒ **no hay CTA de avanzar a pagar desde la grilla.** Decisión de mesa:
la canasta permanente del encabezado —que **no colapsa al scrollear**— lo cubre, y el alto recuperado es lo
que G-04 pedía. **La pérdida que D declaró y NO midió: el CTA al pie es patrón fuerte en tiendas.** *Es lo
único de esa decisión que es juicio y no medición.* **Si el founder extraña un camino directo a pagar, se
reabre.**

**③ H-204 — DOS MEDICIONES HONESTAS DISCREPAN.** C **no lo reproduce**: en su vara los tres chips están
visibles y el toque **selecciona**. *Y estuvo a punto de reportar que sí lo reproducía: su primer toque
murió por «element is not visible», y no era la app — era su selector agarrando el nodo homónimo de la
vitrina retenida en el DOM, de 0×0.* **Un fallo de selector se lee igual que el defecto que uno vino a
medir.**
**El paso exacto para el founder:** abrir un producto con más de una presentación (`Active Mind 7+`, 3 /
7,5 / 15 kg), **sin deslizar**, tocar **7.5 kg** o **15 kg** — *no el primero*. Debe marcarse, irse la
línea «Elegí una presentación», y el precio pasar de «desde $24.90» al exacto. **Si no se marca, H-204
está vivo.**

---

## §5ter · TRES FIRMAS CHICAS PENDIENTES, y una deuda de catálogo que ninguna pantalla tapa

**Firmas (§2.9 — el gate es POR ÍCONO, sobre píxeles):**
- **glifo `carrito` y glifo `papelera` a 21 px** — nacieron en esta vuelta y no pasaron por el ojo.
- **los puntos de 10 dp** de la escalera del detalle.
- **`PISO_DEL_MAPA` al 40 %** en EN CAMINO.

**🟡 DEUDA DE CATÁLOGO — es DATO, y ninguna cura de layout la tapa:**
- **23 de 50 tarjetas de la vitrina NO tienen foto (46 %)** ⇒ **la primera pantalla tiene cajas grises.**
  **Verificado que no es el aparato:** 33 imágenes cargadas, **0 fallos de red**. Le pone número al H-103.
- **CERO ofertas de `juguete` publicadas**, y ninguna familia `entra_al_expediente = false` aplicable a
  perro — por eso la siembra usó higiene de gato para el lado que no sedimenta.

---

## §6 · LO QUE **NO** ENTRA, declarado

- **G-11 · el selector de indicativo** — `ControlTelefono` sigue en `apps/prestador`. **DIFERIDO POR MESA
  a después del gate**, con su razón: *no cambia si la app se ve premium*. **No es olvido: es orden.**
- **H-113** — medido y no curado: **residuo de un test E2E de S96**, no alcanzable por el camino real
  (0 pasos de historia contra los 11 de un pedido que sí caminó), **y no está en la cuenta del founder**.
- **El corte del detalle de pedido** — **no era la barra de tabs** (eso quedó falsado) y su causa **sigue
  sin medir**. Hipótesis de B rotulada `[IMPRESIÓN]`.
- **Deuda de CATÁLOGO, no de código:** **cero ofertas de `juguete` publicadas** y ninguna familia
  `entra_al_expediente = false` aplicable a perro.
- **Oscuro y memorial**: no medidos en esta vuelta.

---

## §6bis · 🔴 CÓMO ENTRARON LOS CUATRO HANDOFFS A `main` — y por qué la ancestría miente acá

*Se escribe porque **quien audite por ancestría va a concluir que tres pistas no mergearon, estando
enteras**, y eso cuesta una hora y una acusación falsa sobre trabajo ajeno. Hallazgo de C, medido.*

**El de B entró por MERGE DE RAMA** (su rama se mergeó al ensamblado antes de que ella escribiera el
handoff). **Los de A, C y D entraron POR CONTENIDO** — `git checkout origin/pista-X -- docs/loop/S100b-X.md`
— porque **se escribieron DESPUÉS del push del ensamblado**: `main` se pusheó a las **23:04** y los tres
handoffs entre las **23:54 y 23:56**. **Causa de reloj, no de descuido.**

**⇒ `pista-a`, `pista-c` y `pista-d` NO SON ANCESTROS DE `main`. Y eso NO significa que no mergearon:**

| | ancestro de `main` | blob del handoff |
|---|---|---|
| `pista-a` | 🔴 no | ✅ **byte a byte idéntico** |
| `pista-b` | ✅ sí | ✅ idéntico |
| `pista-c` | 🔴 no | ✅ **byte a byte idéntico** |
| `pista-d` | 🔴 no | ✅ **byte a byte idéntico** |

**Su código SÍ entró, en el ensamblado.** Verificado una por una: los commits propios de las tres ramas
posteriores a su merge tocan **exactamente un archivo cada uno — su propio `docs/loop/S100b-X.md`**. Barrido
sobre las tres: **cero archivos fuera de `docs/loop` quedaron afuera de `main`.**

> ### 🔴 LA LEY, y es de C
> **PARA «¿ESTO ESTÁ EN `main`?» EL CRITERIO ES EL CONTENIDO, NO LA ANCESTRÍA.**
> *Un merge por pathspec transporta CONTENIDO y no LINAJE, y pedir las dos cosas a la vez es
> incompatible* — «docs puros, acotado por pathspec» y «que quede como ancestro» no pueden cumplirse
> juntas.

**☠️ Y NO SE REESCRIBE EL HISTORIAL para arreglarlo:** arrastraría los merges de las ramas y cambiaría una
forma ya aprobada, **por prolijidad de log**. *La ancestría rota acá es contable, no material — y desde
esta línea, además, declarada.*

**Es la misma forma que esta vuelta aprendió a desconfiar —dos números que no coinciden— con una vuelta de
tuerca: acá ninguno de los dos miente. Miden cosas distintas.**

---

## §7 · LA ADVERTENCIA QUE ESTE DOCUMENTO NO PUEDE LEVANTAR

**Todo lo verificado acá es typecheck, lint, aritmética y consultas a la base. Nada de eso dice que se vea
bien.** La ley de esta vuelta lo dice mejor: *un instrumento verde sobre una pantalla fea es un instrumento
midiendo otra cosa.* **El único que puede cerrar S100b es el ojo del founder sobre el aparato.**
