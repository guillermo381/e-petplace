# S102-B → PISTA A · FICHA NUEVA, **SIN NÚMERO** *(la abre quien la midió — `L-331`)*

> **Medido el 21-ago:** `D-865` y `D-866` dan cero en mi árbol **y** en
> `origin/pista/s101-d`. **A pone el número al depositar.**
>
> **Se separa de la ficha del perfil roto por orden de mesa, y con razón: son
> defectos distintos.** *El perfil era una promesa incumplida en un archivo; esto
> es que **ningún** archivo ata una build a un commit.* **El primero se curó con
> una dependencia; éste no se cura con ninguna.**

---

## NINGUNA BUILD NATIVA ES REPRODUCIBLE DESDE UN COMMIT — Y NO HAY GUARD QUE LO MIRE

🔴 **BLOQUEANTE DEL PRÓXIMO BUILD NATIVO.**

### ① LO MEDIDO

```
apps/cliente/eas.json    → requireCommit: NO FIJADO
apps/prestador/eas.json  → requireCommit: NO FIJADO
```

**Sin `requireCommit`, EAS archiva el ÁRBOL DE TRABAJO y lo sube a la nube.** La
build sale de lo que había en el disco en ese instante — **y de nada que un hash
pueda nombrar.**

### 🔴 ② NO ES UNA HIPÓTESIS: HAY PRUEBA, Y ES DE HOY

**Medido por A el 21-ago, sobre la APK del gate:**

| | |
|---|---|
| commit del que salió la build | **`76f83f5f`** |
| ¿ese commit tiene `expo-dev-client`? | **NO** |
| ¿la APK lo trae? | **SÍ — `expo/modules/devlauncher` × 1.884** |

> ### **El árbol viaja. El commit no describe el artefacto.**

**Y la dirección del hallazgo es la que empeora el problema:** *no es que la
build **ignore** lo no commiteado — es que **lo usa**, y después el hash que el
acta cita apunta a un código que nunca se construyó.*

**⇒ Hay un artefacto concreto, instalado en un teléfono, cuya procedencia no se
puede reconstruir.** *La deuda dejó de ser estructural y pasó a tener un caso
vivo.*

### ③ EL PRECEDENTE QUE LA FUNDA — la casa YA curó esto, del otro lado

**S91, sobre los OTA:** *«el registro publicado NO expone el estado del árbol ⇒
**un publish sucio es inauditable después**»*. **De ahí nacieron la veda
(`verify-veda-publish.mjs`, que rechaza el publish con árbol sucio) y el acto
único (`publicar-ota.mjs`).**

> ### **Las builds nativas quedaron sin ninguno de los dos.**

*El OTA no puede publicarse desde un árbol sucio; la build nativa sí, y nadie lo
mira.* **Es la misma clase de defecto, curada en una mitad de la casa y viva en
la otra.**

### ④ POR QUÉ ES BLOQUEANTE Y NO «ALTA»

**Este canon cita hashes para todo** — el ancla de cada OTA, cada acta, cada
ficha, cada gate. **Y `regla 86` lo dice con todas las letras:**

> *«**UN HASH QUE UN ACTA CITA TIENE QUE SEGUIR RESOLVIENDO**»*

**Una build sin `requireCommit` produce actas que citan un hash que resuelve —y
que describe otra cosa.** *Es peor que un hash roto: un hash roto avisa; éste
contesta bien y miente.*

**Consecuencia inmediata, dictaminada por la mesa el 21-ago:**

> **El gate NO se corre sobre un artefacto de procedencia irreconstruible. Un
> veredicto del founder que no se puede atar a un commit no se puede repetir ni
> citar.**

---

## ⑤ LA CURA, Y SU OPORTUNIDAD

**Fijar `requireCommit: true` en el perfil de build de LAS DOS apps.**

> **⚠️ Su costo real, declarado para que no sorprenda:** con `requireCommit`,
> **una build con el árbol sucio REBOTA**. Eso es exactamente lo que se quiere —
> y significa que **hay que commitear antes de buildear, siempre**. *Es el mismo
> costo que la veda del OTA ya cobra, y por las mismas razones.*

**LA OPORTUNIDAD, que la vuelve barata:** el build del gate **hay que relanzarlo
igual** por el defecto de clase del cliente. **⇒ un SOLO relanzamiento cura las
dos**: `expo-dev-client` en el cliente (ya commiteado por A) + `requireCommit` en
las dos apps, **los dos commiteados, y recién ahí el build.**

*Un ciclo de EAS, no dos — y el gate sale con un artefacto atado a un hash.*

---

## ⑥ LA FICHA, PARA DEPOSITAR

**Dueño:** **A ejecuta** (tiene el build y el territorio de cada `eas.json`);
**B abrió la ficha** por haberlo medido.

**☠️ DISPARO: 🔴 ANTES DEL PRÓXIMO BUILD NATIVO DE CUALQUIERA DE LAS DOS APPS.**
*Cada build que salga sin él es un artefacto más cuya procedencia no se puede
reconstruir — y eso no se arregla después.*

**☠️ MUERTE:** `requireCommit` fijado en las dos, **y una build cuyo
`gitCommitHash` se pueda cotejar contra el contenido del ZIP** — *medido, no
declarado.*

**Se cruza con:**
- **`regla 86`** (un hash que un acta cita tiene que seguir resolviendo) — es la
  regla que este defecto vulnera en silencio.
- **enmienda S91 de la `regla 82`** (el asterisco es un destello, no un
  registro) — **misma clase, otra mitad de la casa**.
- **`D-574`** (los secrets del build local **no fallan, se omiten**) — *la
  familia entera es «el build promete y no cumple, sin decirlo»*.
- **la ficha del perfil que promete lo que no tiene** — el defecto que destapó
  éste.

> **La línea que la resume:**
> ***La casa aprendió a no publicar desde un árbol sucio, y sigue construyendo
> desde uno.***
