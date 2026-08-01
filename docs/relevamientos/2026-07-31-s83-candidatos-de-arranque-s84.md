# S83 → CANDIDATOS DE ARRANQUE PARA S84

> **Qué es esto y qué NO es.** Es la lista de lo que S83 deja **con dueño y
> sin hacer**, escrita al cierre para que la próxima sesión no la
> re-descubra. **No es un mandato:** el norte lo declara el founder. Los
> ítems de acá se ofrecen ordenados por lo que cuesta descubrirlos de nuevo.
>
> Precedente de forma: **§5 del acta del método de S82** (la checklist de
> arranque del prestador). Ese documento sigue siendo la fuente de la
> checklist; éste solo agrega lo que S83 produjo.

---

## 1 · EL BARRIDO DE FICHAS CON DUEÑO VIEJO — *el candidato principal*

**Origen: límite declarado por A en S83-A7.** Al enmendar **D-576** (que
decía "Territorio B" con el reparto de S80, cuando en S83 `apps/prestador`
es de C) quedó dicho en la propia ficha que **se curó ESA y no se barrieron
las demás**.

**El modo de falla, que no es el obvio:** una ficha con dueño viejo **no
pierde su diagnóstico — pierde su destinatario.** Sigue siendo correcta,
sigue siendo legible, y **no tiene quién la retire**. Por eso no aparece
como error en ninguna corrida: el archivo está sano, el trabajo está
huérfano.

**Por qué es el candidato principal y no una tarea de higiene:** el
territorio **se re-reparte cada sesión** (S80: B tenía prestador · S82: tres
pistas con otro corte · S83: B tooling + `packages/ui`, C prestador). Cada
re-reparto **envejece en silencio todas las fichas que nombran al dueño
anterior**, y el archivo de deudas es el instrumento con el que la casa
decide qué hacer. **Es L-141 aplicada al reparto: la prosa decae, y acá lo
que decae es a quién le toca.**

**Forma sugerida (no ejecutada):** `grep -n "Territorio\|Quién la retira\|
Quién la cierra" docs/DEUDAS_CANONICAS.md` → contrastar cada dueño nombrado
contra el reparto vigente → **las que cambian se enmiendan con fecha**, como
se hizo con D-576. **Costo: no medido.** Nadie corrió el grep todavía, así
que el tamaño del barrido es desconocido — **medirlo es el primer paso, no
presupuestarlo de memoria** (regla que esta sesión cobró tres veces).

**Y la pregunta de fondo que el barrido va a destapar, dicha de antemano:**
si el dueño de una ficha caduca cada vez que cambia el reparto, quizá **las
fichas no deberían nombrar pista sino TERRITORIO** (*"quien toque
`apps/prestador`"* en vez de *"C"*) — eso no caduca nunca. **Es candidata de
ley y no se decide acá.**

---

## 2 · LO QUE ESPERA FIRMA DEL FOUNDER EN GALERÍA — *ya montado, listo para mirar*

Los tres entraron a `main` con B11 (`3b26ac2`) **para que se puedan ver en
la pantalla real**, que es donde la regla 80 dice que se firman:

- **D-597 · la marca de agua** — cuatro existencias, tres anatomías inline
  vivas y una pieza sin consumidores, más un JSDoc que declara muerta una
  variante que el Hogar está pintando. **Firmar la anatomía es lo que
  desbloquea unificar.**
- **D-598 🔴 · el choque de letras firmadas** (la huella del tab: S72 vs
  §15b.1). **Es arbitraje, no criterio de mesa** — y la letra que pierda
  **se enmienda en su documento**, no se deja conviviendo.
- **El glow de la casa verde** — montado en la galería como candidato; hoy
  es el `boxShadow` artesanal de **D-599**.

## 3 · LAS OTRAS FICHAS S83 CON DISPARO PROPIO

| | qué espera |
|---|---|
| **D-589** | el gate del founder sobre el próximo OTA del prestador (¿el halo alcanzó para las seis Tarjetas?) |
| **D-590** | **después de H2** — el guard NO se construye antes: el número depende del fondo |
| **D-592** | confirmación en pantalla; la cura es **repartida** (guarda de B + voz de C) |
| **D-594** | una línea en el hook (`quotePath`), con su rojo producido en **las dos** direcciones |
| **D-595** 🔴 | **el seed de dos paseos simultáneos es parte de la cura**, no un paso previo |
| **D-599** | la decisión (a) zona franca declarada / (b) entra al corpus — **lo ilegítimo es seguir sin decidir** |
| **D-593** | la checklist de la regla 85 (ya tiene sus dos puntos: install propio · `checkout` sobre trabajo sin commitear) |

## 4 · OPERATIVO QUE NO SE RESOLVIÓ EN S83

- **El runtime del prestador sigue sin build alcanzable** (medido en R0): el
  canal sirve **1.0.3** y el build EAS más nuevo es **1.0.2**. El único
  1.0.3 conocido es el **APK local de S78**, que no está en `eas build:list`.
  **Si el teléfono no lo tiene, ningún OTA del prestador le llega** — por
  limpio que salga el publish.
- **Los tres worktrees siguen montados** (`main` · `s83-b` · `s83-c`).
  Retirarlos o conservarlos es decisión de arranque (regla 85).

---

*Origen: S83, cierre de la pista A. Los ítems 2-4 son estado medido; el 1 es
el límite que A declaró en su propio trabajo y el founder pidió anotar.*
