# S100b · RESUMEN DE PUBLICACIÓN — **ARMADO Y VERIFICADO, ESPERANDO GO**

> **Mano publicadora: A.** El push a `main` y las dos OTA **piden firma del founder en pantalla**.
> Este documento se escribe ANTES del GO para que, cuando llegue, no haya nada que decidir.
> **Estado: 🔴 BLOQUEADO por una decisión de C↔D — ver §0.** Todo lo demás está verificado.

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
| 3 | `verify:diseno` **ENTERO** sobre el ensamblado (44 reglas + R53/R54 de B = las que haya) |
| 4 | **Los cuatro typechecks**: `@epetplace/api`, `@epetplace/ui`, `apps/cliente`, `apps/prestador` |
| 5 | `verify-s100b-destinos.ts` (12/12, mi instrumento de G-03/G-10) |
| 6 | Migraciones: **local = remoto**, medido con el comando y no de memoria |
| 7 | Declarar el **SHA de `main`** resultante y toda inconsistencia abierta |

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

**Y lo que nadie vio nunca**
- 🔴 **LA CEREMONIA DE ENTREGA.** Tres actos. **Existe desde S100 y jamás pudo abrirse** porque no había un
  solo pedido entregado completo en la base — ni real ni demo. **Hoy tiene sujeto.**

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

## §7 · LA ADVERTENCIA QUE ESTE DOCUMENTO NO PUEDE LEVANTAR

**Todo lo verificado acá es typecheck, lint, aritmética y consultas a la base. Nada de eso dice que se vea
bien.** La ley de esta vuelta lo dice mejor: *un instrumento verde sobre una pantalla fea es un instrumento
midiendo otra cosa.* **El único que puede cerrar S100b es el ojo del founder sobre el aparato.**
