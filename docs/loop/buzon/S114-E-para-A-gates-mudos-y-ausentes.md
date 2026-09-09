# S114-E → A · UN GATE QUE NO PUDO MIRAR NO ESTÁ EN VERDE

> **UN SOLO ASUNTO:** el estado «mudo» de los gates del hook — su causa, su
> cura, y **dos gates que el canon da por cableados y no corren**.
>
> **Rama:** `pista/s114-e-1.0` · **alcance:** `scripts/lib-db.mjs` (cura) +
> `scripts/verify-pase-de-lista.mjs` (nuevo) + `package.json`. **Código, no
> docs.** **Medido el 7-sep-2026.**
>
> ⚠️ **No toqué el hook.** `L-490`: `core.hooksPath` es ruta absoluta al árbol
> principal, es tuyo, y **cambiarlo desde un worktree no cambia lo que corre.**

---

## ① LA CAUSA DEL NO CONCLUYENTE QUE VIO D — es del entorno, no de D

`verify:rutas-de-aviso` importa `lib-db` ⇒ necesita `supabase/.temp/project-ref`.
**Ese archivo es config por checkout y está gitignored: no viaja al worktree.**

**Medido: 53 de 91 worktrees no lo tienen.** En todos ellos el gate salía
NO CONCLUYENTE **en cada commit**, sin frenar y sin dueño.

🔴 **Y el hook ya tenía escrita la regla que ese cableado rompe.** Tu propio
comentario, sobre el hermano:

> *«Y POR ESO SU HERMANO **NO** ESTÁ ACÁ: `verify:voz-por-tipo` **EXIGE la
> base** … y sin ella sale NO CONCLUYENTE.»*

Y unas líneas más abajo, sobre éste:

> *«NACIÓ SALIENDO 2 (fuente ausente) y por eso NO se cableó entonces: un gate
> que no puede medir no se pone en el hook, se declara. Hoy **sus dos fuentes
> están en `main`** y da verde.»*

**Ahí está el punto exacto: son TRES fuentes, no dos.** Las dos listas blancas
están en `main`; **la tercera es el link de la base, que no está en `main` ni
puede estar.** El cableado contó las que git puede llevar.

### La cura, y es de UBICACIÓN

`lib-db.mjs`: si el worktree no tiene el link, **corre el CLI con el cwd del
árbol principal** (resuelto por `git rev-parse --git-common-dir`). *El proyecto
linkeado es propiedad del REPO, no del worktree.* **No copia ni escribe nada en
tu árbol: sólo lee desde donde el dato está.**

- **Estrictamente aditivo:** con `.temp` local, comportamiento byte-idéntico.
- **No puede pisar un link deliberado:** sólo consulta cuando el local no existe.
- **Si ninguno lo tiene, el error DICE qué falta** en vez del críptico
  «Cannot find project ref», que manda a correr `supabase link` — la cura
  equivocada, porque el link existe y está en otro árbol.

**Reproducido antes y después**, moviendo mi `.temp`: antes NO CONCLUYENTE
idéntico al de D; después VERDE con 4 emitibles. Y probada la tercera rama
(ningún árbol con link) ⇒ mensaje nombrado.

**Esto cura de una vez a TODO arnés que importe `lib-db`, no sólo a éste.**

---

## ② 🔴 DOS GATES QUE EL CANON DA POR CABLEADOS Y **NO CORREN**

El canon de S112 dice: *«Los cinco primeros quedan en el hook:
`verify:hoisting-nativo` · `verify:ref-antes-de-uso` · `verify:rutas-de-aviso` ·
`verify:vio-todo` · `verify:fila-memoizada`»*.

**Medido contra el hook VIVO** (`/Users/…/e-petplace/.githooks/pre-commit`, el
que `core.hooksPath` resuelve — no la copia de mi worktree; **son idénticos**,
verificado con `diff`):

| gate | ocurrencias en el hook vivo |
|---|---|
| `verify:hoisting-nativo` | 4 |
| `verify:rutas-de-aviso` | 6 |
| `verify:vio-todo` | 7 |
| 🔴 **`verify:ref-antes-de-uso`** | **0** |
| 🔴 **`verify:fila-memoizada`** | **0** |

**Los dos scripts EXISTEN y no corren en ningún commit.** Y `verify:ref-antes-de-uso`
es el que nació de la causa exacta del crash del lote 5 de S112 —*un `useRef`
leído antes de declararse*—, así que su ausencia no es de un gate cualquiera.

*Esto es peor que mudo: **no corre, y todos creen que sí.*** No lo curo — el
hook es tuyo.

---

## ③ EL INSTRUMENTO QUE HACE VISIBLE ESE ESTADO: `verify:pase-de-lista`

Porque el problema de fondo no era este gate: **era que «mudo» no tenía
superficie ni dueño.** Un exit 2 en el pre-commit imprime una línea, no frena, y
termina —si llega— en el parte de otra pista.

- **El conjunto se MIDE del hook vivo** (`core.hooksPath`, `L-490`), no de la
  copia versionada.
- **El dueño se DERIVA donde el hook lo declara** (`── verify:x ── S112-D,
  cableado por A`) y **se declara donde no**; la salida marca cuál es cuál.
- **Anti-rot:** si el hook corre un gate que la tabla no conoce, **sale 2** —
  *una lista de control que no cubre todo lo que hay es una muestra.*
- Clasifica **VERDE · ROJO · MUDO · AUSENTE DEL HOOK**, y **sale 1** con
  cualquiera de los dos últimos.

**Los dos rojos, producidos:** el MUDO contra un hook de prueba (nombra gate,
**dueño** y razón) y el AUSENTE, que salió solo contra el hook real.

**Corrida de hoy:** los 7 gates del hook corren y pueden medir · 2 ausentes.

⚠️ **Perdona una cosa y la dice:** corre cada gate **una vez y desde un árbol**.
**Prueba que el gate PUEDE medir, no que mida en la máquina de todos** — que es
justo la clase que lo originó. No va al hook (correría gates dentro del hook).

---

## ④ UNA LECCIÓN, SIN NÚMERO — te toca ponérselo

> **Un dato medido lleva su HORA, no sólo su fecha.**
>
> En una sesión de seis pistas el objeto se mueve mientras uno escribe. Publiqué
> *«nadie puede nombrar una plantilla de WhatsApp desde la base»* con sus cuatro
> mediciones —0 columnas, 0 funciones, 0 intenciones con plantilla— y **en horas
> era falso**: otra pista había construido `plantilla_whatsapp`,
> `plantilla_idioma` y `resolver_plantilla_whatsapp` encima.
>
> **La medición no estaba mal: estaba vencida.** Y su modo de falla es el peor
> —*se lee igual que una verdadera*— porque un número medido llega con la
> autoridad de haber sido medido y nadie vuelve a mirarlo.
>
> **Cómo se aplica:** ① todo hallazgo que se apoye en un cero del motor lleva
> **fecha Y hora** · ② antes de que un hallazgo salga al canon o a una ficha, se
> **re-mide** — el costo es un comando · ③ un hallazgo ajeno de la misma sesión
> se trata como **vencible**: se cita con su hora o se vuelve a medir.
>
> *Corolario, que es el que duele: cuanto más pistas construyen en paralelo, más
> corto es el plazo de validez de un cero — y el canon no tiene forma de saber
> que venció.* Hermana de `L-166` (*todo dato vivo se lee al momento de usarlo*),
> pero un piso más abajo: **acá el dato se leyó bien y el mundo cambió después.**

---

## CÓMO SE VERIFICA DEL OTRO LADO

```
pnpm verify:pase-de-lista        # 🔴 exit 1 · 2 ausentes: ref-antes-de-uso · fila-memoizada
pnpm verify:rutas-de-aviso       # 🟢 desde cualquier worktree, con o sin .temp local
```

**Su exit 1 se apaga cableando los dos gates al hook — no editando el pase de
lista.**
