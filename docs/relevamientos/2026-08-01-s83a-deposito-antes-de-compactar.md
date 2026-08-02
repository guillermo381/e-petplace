# S83-A · DEPÓSITO ANTES DE COMPACTAR

> **Para quién es esto:** para mí-nuevo, o para la pista que herede el rol de A.
> **Qué NO va acá:** lo que se recupera leyendo el repo — eso está en el acta del
> método, el censo de enmiendas y el estado medido. **Acá va lo que solo se sabe
> por haberlo hecho.**

---

## 1 · EL RÉGIMEN AUTÓNOMO — qué es y cómo funcionó

A mitad de S83 el founder cambió mi rol: dejé de esperar una orden por merge y
pasé a **conducir el flujo**. Cuatro deberes:

### ① Mergeo A DEMANDA
**En cuanto una pista avisa que tiene commit listo, mergeo. Sin esperar orden.**
Solo freno ante **conflicto real de territorio** — y en toda la sesión no hubo
ninguno.

**Lo que hace que esto no sea temerario es el paso fijo:** antes de cada merge,
`git show --name-only --pretty="" <sha>` **por commit**. Con eso ves qué toca
cada uno y decidís en diez segundos. **Nunca me equivoqué mergeando; casi me
equivoco DOS VECES frenando** (ver §2.1).

### ② Abrir veda YO MISMA
Cuando C avisa que va a publicar: **congelo, le pido confirmación fresca a B, y
recién con las dos le paso el ancla a C.** No espero que la mesa lo anuncie.

**Por qué importa que lo haga la pista y no la mesa:** el que paga el costo de un
ancla sucia es quien publica; **el que tiene el árbol es quien puede
confirmarlo**. La mesa está en el medio y se distrae — eso no es un reproche, es
la razón de diseño del paso ⓪.

### ③ Verificar el group ANTES de declarar cerrado
**Éste es el que no tenía dueño, y es el punto del depósito.**

C avisa *"terminé de publicar"*. **Eso NO es el cierre.** El cierre es:

```bash
# desde apps/prestador/
npx eas-cli update:list --branch preview --limit 2 --json --non-interactive
npx eas-cli update:view <group> --json    # ← el gitCommitHash sale SOLO de acá
```

y **cotejar el `gitCommitHash` contra el ancla que entregaste**. `update:list`
**no muestra el hash**: si te quedás con la lista, no verificaste nada.

**POR QUÉ ③ NO TENÍA DUEÑO — y es lo más útil de esta sección.** La regla 82
decía que el anuncio y el cierre son **de la mesa**; el paso ⓪ escribió los
deberes **de quien publica**; y el que está congelado sabe **congelarse**. **El
cierre quedó en tierra de nadie:** quien publica ya terminó y se va, la mesa
está coordinando otra cosa, y **la pista congelada se entera de que la veda
cerró… porque le llega trabajo** — que es el incidente 2 de D-609 disfrazado de
señal. **Por eso lo tomé yo: el que congela es el que descongela.**

### ④ Anunciar el cierre a LAS DOS
No solo a quien publicó. **A las dos, con el group y el ancla verificados.**

### El resultado, medido
**Ocho OTAs en S83, los ocho con `isGitWorkingTreeDirty = None`.** Los dos que
conduje entero (`0992f545`, `19f8b87c`) con **ancla coincidente exacta** con la
que había entregado.

**Nota honesta que dejé en el acta y repito acá para que no se me olvide: el
"asterisco de C17" que se cita como contraste NO aparece en EAS.** Revisé 14
groups y ninguno tiene `dirty=true`. **Lo que está medido es que los ocho
salieron limpios; el contraste viene del reporte de la mesa.**

---

## 2 · LAS CUATRO TRAMPAS QUE ME MORDIERON — y cómo reconocerlas rápido

> **Lo que las une:** las cuatro **producen salidas creíbles**. Ninguna rompe
> nada. **Todas se leen como información correcta.** Por eso ningún gate las caza
> y por eso hay que conocerlas de memoria.

### 2.1 EL DIFF ENTRE PUNTAS *(D-608)*
```bash
git diff --stat main <rama>     # ← MIENTE como preview de merge
```
Compara **las dos puntas**. Si la otra rama no tiene tus commits recientes, **los
muestra como BORRADOS**, con signo menos y conteo de líneas.

**Cómo lo reconocés:** ves `−44` en un archivo **que acabás de escribir vos**.
**Ésa es la señal.** Si tu propio trabajo aparece borrado en el diff de otra
rama, no es que lo borren: **es que no lo tienen**.

**Me pasó DOS VECES y las dos estuve a punto de frenar un merge legítimo.** La
segunda parecía que C borraba el censo de `text.tertiary` que yo había depositado
minutos antes.

**Lo correcto:** `git show --name-only --pretty="" <sha>` **por commit**. *El
diff entre puntas responde "en qué difieren las ramas"; la pregunta real es "qué
hace este commit".*

### 2.2 EL REF SIN FETCH *(enmienda de D-607)*
**`origin/main` NO es el remoto: es una copia local que solo se actualiza con
`fetch`.** Tiene **la forma de un ref remoto y la naturaleza de un dato en
caché**.

**Cómo lo reconocés:** decís *"no está en `origin/main`"* y la otra pista jura
que sí. **Antes de discutir, `git fetch`.**

**Frenó un publish entero.** C reportó que un commit no estaba, yo lo "confirmé",
y **las dos lecturas eran falsas**: el founder ya había pusheado. **Y lo peor: la
cura que yo había escrito en D-607 —"verificá con `merge-base` contra
`origin/main`"— tenía el mismo agujero que la enfermedad.** Le faltaba la
palabra `fetch`.

### 2.3 LA LISTA LOCAL DE PENDIENTES *(D-607)*
Una pista lleva su propia lista de "pendientes de merge" **y nadie la actualiza
cuando vos mergeás**. B declaró **11 commits pendientes estando los 11 en main**.

**Cómo lo reconocés:** una pista te reporta N pendientes y tu `git rev-list
--count main..<rama>` da otro número. **Gana el tuyo, después de `fetch`.**

**No es descuido de la pista: git no notifica hacia atrás.** Su rama sigue
apuntando al mismo sha después de que main la absorbió. **Lo único que cambia es
una relación, y hay que ir a preguntarla.**

**Cómo se contesta sin fricción:** medís vos, se lo decís con el comando, y
seguís. **No pierdas un turno discutiendo quién tiene razón** — pasó tres veces y
las tres el dato estaba a un `--is-ancestor` de distancia.

### 2.4 EL SABOTAJE COMO FORMA DE CERRAR UNA FICHA
**No alcanza leer el commit de quien construyó.** Ni siquiera alcanza que el
lint dé verde: **un guard puede estar apagado y el verde no lo dice**.

**La forma:**
```bash
cp <archivo> $SCRATCHPAD/x.bak          # backup POR COPIA
# ... romper a propósito lo que el guard vigila ...
node scripts/verify-diseno.mjs; echo "exit real = $?"
cp $SCRATCHPAD/x.bak <archivo>          # restaurar POR COPIA
git status --porcelain                  # y VERIFICAR que quedó limpio
```

**Cuatro cosas que aprendí haciéndolo:**
1. **Corré el VERDE DE CONTROL primero.** Si no sabés que daba exit 0 antes, el
   rojo no prueba nada.
2. **Restaurá por COPIA, no con `git checkout <ruta>`** — esa forma está
   prohibida sobre trabajo vivo (D-593) y no vas a estrenar el incumplimiento en
   el commit que cierra una ficha de rigor.
3. **Verificá el árbol limpio DESPUÉS DE CADA restauración**, no al final.
4. **Rompé el CÓDIGO que el guard vigila**, no el guard. Quitar el brazo prueba
   otra cosa.

**Lo que esto me dio, y es la razón de la sección:** la mesa daba por cerradas
tres fichas con el commit de B en la mano. **El sabotaje mostró que solo UNA se
movía** — el `boxShadow` artesanal que inyecté en la galería **salió exit 0: R4
no lo caza**, y D-599 seguía abierta. **Sin sabotear, se cerraban tres huecos en
el papel y quedaban dos abiertos en el código.**

---

## 3 · LAS FICHAS QUE DEJO, en mis palabras

**Cerradas de verdad:** **D-596** (`pnpm lint` era un script que *no podía*
correr — ESLint sin binario) · **D-598** (el choque de acentos, arbitrado por
firma) · **D-611** (la asimetría del tinte, **cerrada por sabotaje, tres mitades
en exit 1**).

**Pagadas a medias, y la mitad importa:** **D-605** — los **2 helpers de
`packages/ui`** salieron de `text.tertiary`; eran **el sitio de máximo alcance**
del censo porque **los hereda cada `Campo` de la casa**. Quedan tres grupos, y
**dos viven en `apps/cliente`, que no tuvo dueño en S83**. · **D-590** — su mitad
de corpus está pagada (nació la clase FILL, 32 pares por enumeración); **el
número sigue vivo** y espera H2.

**Abiertas con disparo claro:**
- **D-599** — la galería fuera del corpus de R4. **Tiene sabotaje documentado**:
  no hace falta re-medirla, hace falta decidir **zona franca declarada o entra al
  corpus**. Lo ilegítimo es seguir sin decidir.
- **D-606** — la gráfica en `tertiary`. **Su cura NO es ensanchar el barrido**:
  está excluida **por letra**, así que depende de D-605 (la exención exime al
  token, no al uso).
- **D-597** — la marca de agua. Espera **firma de anatomía en galería**; el agua
  entera ya se firmó, así que está a un paso.
- **D-601** — los cuatro campos de contacto. **Ganó respaldo documental**: la
  letra de S20 los pide. **Su lector es la vitrina de S84.**
- **D-612** — la página pública. **Su primera decisión no es de diseño: es
  D-173**, y es del founder.
- **D-607 / D-608 / D-609** — las tres de proceso. **D-609 es la única cuyo dueño
  es la mesa**, y sigue siendo la más importante: los cuatro pasos están
  **firmados pero no depositados en la regla 82**.
- **D-595** 🔴 — el GPS mono-paseo. **Su seed es parte de la cura**, no un paso
  previo.
- **D-593** — la checklist de la regla 85, con sus dos puntos ganados.

**Y el hueco que no es ficha: `D-610` NO EXISTE.** Salté de 609 a 611. **Queda
libre. No lo rellenes** para que el rango se vea prolijo — un número reservado
sin texto es lo que L-169 vino a prohibir.

---

## 4 · TRES COSAS QUE HARÍA DISTINTO

1. **Correr el `fetch` como primer comando de cada turno.** Dos de las cuatro
   trampas se desactivan solas con eso.
2. **Medir antes de aceptar una premisa de la mesa, siempre — incluso cuando la
   orden viene con números.** En S83 la mesa se equivocó en el 54/50, en los 31
   commits, en las dos promociones, en "R16 ya no rige" y en "las tres fichas
   cierran". **Cinco de cinco las corrigió la medición**, y ninguna era mala fe:
   **es que la mesa no tiene el árbol delante.**
3. **No dar por cerrado lo que otro construyó sin sabotearlo.** Es barato, tarda
   un minuto, y es la diferencia entre una ficha cerrada y una ficha con etiqueta
   de cerrada.
