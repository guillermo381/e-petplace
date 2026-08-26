# ENCARGO A B · `R67` tiene que aprender la forma de LISTA

> **A → B · 26-ago-2026 · S106 tanda 2.** Texto autocontenido (76b).
> **Firma del founder: §3 pasa a LISTA.** La letra ya está redactada.
> **No toqué `scripts/verify-diseno.mjs` — es tuyo.**
>
> 🔴 **Esto BLOQUEA el merge conjunto.** El founder ordenó: mi redacción → tu
> ajuste de R67 → merge de los tres → `verify:diseno` verde **después** de C.
> **`main` sigue intacto en `ba4f9562` y no lo toco hasta que esté verde.**

---

## §1 · QUÉ CAMBIÓ EN LA LETRA

**El párrafo de los signos dejó de ser prosa y es una LISTA de seis ítems.**
`LETRA_TELEMEDICINA` §3, con la forma vieja tachada y movida a un anexo.

**El razonamiento del founder, para que no se lea como capricho:** la enmienda
de la coma separó la «o» porque fundía dos motivos. Pero **una coma resuelve
eso a medias** — sigue siendo un párrafo corrido donde **seis peligros se leen
de un tirón**. *Una lista es como lee una persona asustada mirando el teléfono
con su animal raro al lado.* **Y no viola §3:** §3 prohíbe **resumir**,
**acortar** y **letra chica**; pasar a lista **no quita una palabra — las vuelve
más visibles**.

---

## §2 · 🔴 POR QUÉ R67 NO PUEDE ADAPTARSE CON UN PARCHE — medido, tres veces

`scripts/verify-diseno.mjs:5627` extrae la vara así:

```js
const conSignos = prosa.find((p) => /—[^—]+—/.test(p));
const signos = conSignos.match(/—([^—]+)—/)[1].split(',').map(s => s.trim());
```

**La heurística es «el párrafo que tenga un par de em-dashes».** Con la forma de
lista **ese párrafo ya no existe**, y eso rompe la regla de tres maneras que fui
encontrando de a una:

| intento | qué hizo R67 | por qué |
|---|---|---|
| ① dejé la forma vieja **tachada dentro de §3** | extrajo **de la prosa muerta** (los signos salían en minúscula) | *un párrafo tachado sigue siendo un párrafo para un regex: el tachado es tipografía y no existe para un parser* |
| ② moví la forma vieja a un anexo | extrajo **de mi propio comentario**: «falta el signo `las claves avisoTele* de apps/cliente/...`» | cualquier prosa mía con em-dashes se vuelve el señuelo |
| ③ neutralicé **los 11 pares** de em-dash de §3 | **`AUTO-PRUEBA ✗ R67 no salió roja contra su fixture — REGLA DECORATIVA (L-192)`** | sin par que encontrar, el extractor devuelve `null` y la regla **pasa en silencio** |

> **③ es el resultado importante y lo dice tu propia auto-prueba:** no es que R67
> falle — es que **deja de medir**. *Y una regla que no mide da verde, que es la
> forma más cara del rojo.*

⇒ **No hay arreglo del lado de la letra.** Lo intenté tres veces; el tercero
convirtió la regla en decorativa. **El reader es tuyo y hay que reescribirlo.**

---

## §3 · LA FORMA NUEVA, EXACTA — las 16 claves de C

**Verificado clave por clave: `16 claves de C · 16 presentes VERBATIM en la
letra · 0 divergen`.** La letra se redactó **tomando el literal del objeto**
(`apps/cliente/src/i18n/es.ts`), no de una transcripción.

| clave | valor |
|---|---|
| `avisoTeleTitulo` | `Antes de continuar` |
| `avisoTeleParaQue` | `Las consultas por videollamada sirven para orientación, seguimiento y casos que el veterinario pueda evaluar viendo a tu mascota por pantalla.` |
| `avisoTeleNoReemplaza` | `No reemplazan una atención presencial ni sirven para emergencias.` |
| `avisoTeleSignosIntro` | `Si notas que tu mascota está en riesgo:` |
| `avisoTeleSigno1` | `Dificultad para respirar` |
| `avisoTeleSigno2` | `Sangrado` |
| `avisoTeleSigno3` | `Convulsiones` |
| `avisoTeleSigno4` | `Golpe fuerte` |
| `avisoTeleSigno5` | `Dolor intenso` |
| `avisoTeleSigno6` | `Decaimiento repentino` |
| `avisoTeleSignosCierre` | `Llévala a una clínica ahora mismo.` |
| `avisoTeleConsentimiento` | `Entiendo que una videoconsulta no reemplaza una atención presencial.` |
| `avisoTeleTransito` | `La videollamada no se graba y se transmite a través de la infraestructura de nuestro proveedor de video.` |
| `avisoTeleIrUrgencias` | `Ir a urgencias` |
| `avisoTelePresencial` | `Reservar cita presencial` |
| `avisoTeleContinuar` | `Continuar con la videoconsulta` |

⚠️ **Ojo con la capitalización:** en la lista cada signo **empieza en
mayúscula** (`Dificultad`, `Sangrado`…), porque es un ítem y no un inciso de
prosa. En la forma vieja iban en minúscula. **Una comparación
case-insensitive escondería una divergencia real.**

---

## §4 · CÓMO QUEDA LA VARA EN LA LETRA — para que la leas sin heurística

§3 la trae como **lista de markdown dentro del blockquote**:

```
> - Dificultad para respirar
> - Sangrado
> - Convulsiones
> - Golpe fuerte
> - Dolor intenso
> - Decaimiento repentino
```

**Sugerencia, no imposición** (el instrumento es tuyo): extraer los signos por
**`^> - `** en vez de por em-dashes. Es un ancla **estructural** en vez de
tipográfica, y no se la puede robar un comentario. *Con la heurística vieja
cualquier prosa mía competía con la vara; con ésta, no.*

Y dos cosas que la letra ya te dejó preparadas:

1. **Cero pares de em-dash en §3** (eran 11, quedaron 0) — así ningún resto
   puede volver a ganarle a la vara.
2. **La forma vieja está FUERA de §3**, en un anexo al final, y **con guiones
   simples a propósito**. *La letra derogada se saca de la sección que un juez
   lee; conservarla al lado del texto vigente no es archivar, es dejar un
   señuelo.*

---

## §5 · LO QUE TE PIDO, en concreto

1. **El reader de R67 aprende la forma partida**: `avisoTeleNoReemplaza` ·
   `avisoTeleSignosIntro` · `avisoTeleSigno1..6` · `avisoTeleSignosCierre`, cada
   uno contra su línea de la letra.
2. **El brazo ① compara los SEIS por separado**, con su capitalización.
3. **La auto-prueba ampute el SEXTO** — es el que la versión vieja no sabía
   nombrar.
4. **`avisoTeleConsentimiento` entra a la vara**: es la casilla de la Obra 6 y
   la exige la enmienda 1a de §3.
5. **La prosa de R67 dice «cinco»/«cuatro» en cuatro lugares** (~1981, ~1986,
   ~5517 y el texto del fallo ~5750). Ahora son **seis**.

---

## §6 · LO QUE **NO** HICE

- **No toqué `verify-diseno.mjs`**, ni la tupla, ni ninguna auto-prueba.
- **No mergeé nada a `main`.** El conjunto está armado **en mi rama**
  (`pista/s106-a-t2`: mi letra + tu `s106-b2` + `s106-c-t2`) y está **rojo**.
  Cuando tengas R67, lo vuelvo a correr y lo mergeo yo.
- **No decidí cómo leés la lista.** El `^> - ` es sugerencia; lo que la letra
  garantiza es que la vara está ahí y que **no compite con nada**.
