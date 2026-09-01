# S111-B → A · una ficha para numerar: el semáforo de guardería no puede servir a adopción, y es POR TIPO

**Rama:** `pista/s111-b` · **HEAD:** `850ad576c664a6322694a847aa33e11bdd7e4a49`
**Base:** `4e04b2d5` (`merge: S111-A — el estacionamiento y el buzon`)

**ALCANCE (L-463) — tres archivos, todos de `packages/ui`:**
`packages/ui/src/components/Convivencia.tsx` (nuevo) ·
`packages/ui/src/index.ts` (hunk aditivo) ·
`packages/ui/src/gallery/TokenGallery.tsx` (hunk aditivo).
**Cero DDL · cero migraciones · cero `apps/` · cero `docs/` fuera de este buzón.**

---

## LA FICHA, sin número (la numera A — regla 89)

**Título:** `SemaforoSanitario` no puede servir al adoptable, y el bloqueo es del TIPO, no del estilo.

**Qué se midió.** `SemaforoSanitario` (S107-B, guardería) declara
`RequisitoSanitario` como unión discriminada donde la variante `falta` lleva
`onResolver` y `etiquetaResolver` **OBLIGATORIOS**. Su encabezado dice por qué:
*«un pendiente que el dueño no puede resolver es peor que no mostrarlo»*.

**Por qué no transfiere.** En guardería el lector **es** quien resuelve: la
familia carga la vacuna y el animal entra. En adopción el lector es el
**adoptante**, que no puede resolver nada — la vacuna pendiente es del refugio.
Reusar la pieza obligaría a inventar un `onResolver` que no lleva a ningún lado,
que es exactamente el pendiente-sin-camino que la pieza existe para prohibir.

**Por qué esto es ficha y no una nota.** Es el caso limpio de **`D-976`** —
*trasplantar un criterio correcto a otra pregunta, más peligroso que inventarlo
porque viene con la autoridad de haber funcionado en otro lado*. La ley de S107-B
**es correcta** y sigue vigente para guardería; lo que no transfiere es su
audiencia. Y acá el trasplante no lo frena la disciplina: **lo frena el tipo**,
que es la mitad buena de la historia — el que intente reusarla no compila.

**Lo que NO afirmo:** no medí si la pieza tiene otros consumidores fuera de
guardería, ni propongo tocarla. **No se toca.** Adopción necesita una pieza
hermana, y ésa es mi construcción, no un cambio sobre la de S107.

---

## LO CONSTRUIDO EN ESTA TANDA

**`Convivencia`** — `LETRA_ADOPCION` §3, los tres estados con el tercero
llevando su voz. Dos decisiones que la pantalla no puede deshacer:

① **`no_se_sabe` lleva `voz` OBLIGATORIA** (L-222). **Rojo producido y
discriminante**, no afirmado: `{estado:'no_se_sabe'}` sin voz rebota con
`TS2322`, un estado inventado rebota, **y los tres legales compilan** — el
control tiene sus dos colores.
② **No usa la paleta de estado.** Un «no» es un hecho del animal, no un defecto
suyo; pintarlo de rojo es la interfaz editorializando en su contra — el mismo
daño que §3 nombra al prohibir el «no» inventado, por el canal del color. La
distinción es estructural: punto relleno / contorneado / ausente.

`capa.comunidad` por token (ley 10) — cero hex a mano, y resuelve `rose` en
memorial sin rama. Cero diccionario adentro: la voz llega por prop (precedente
`EscaleraEstados`). Galería con **su control**: el caso todo-desconocido, que es
el rescate de seis días de la letra.

**Gates:** `typecheck` 0 · `verify:contrast` **391 pares / 0 fallos** (cero pares
nuevos: sólo tokens existentes) · `verify:diseno` **VERDE, 62 reglas**, mismo
número que el baseline que medí antes de tocar.

**⚠️ Entregada ≠ montada.** La pieza está **publicada y mirable en la galería**;
ninguna pantalla la monta todavía. Su gate en dispositivo (Ley 9) está
PENDIENTE y es del founder.
