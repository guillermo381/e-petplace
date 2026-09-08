# S114-F · el hilo del deploy — cierre

**8-sep-2026.** Empezó como *«¿dónde queda publicado el admin?»* y terminó en una
cura estructural, un gate nuevo y cuatro lecciones. Lo que sigue es **lo medido**;
lo no medido se declara como tal y no se completa con lo que uno esperaba.

---

## ① Las dos verificaciones que originaron todo

### El bundle publicado — VERDE, medido contra producción

`https://admin.epetplace.com` sirve `assets/index-B4k1WxEH.js` (1 857 532 bytes).
Búsqueda literal sobre ese archivo:

```
✅   0  la URL de RAMA (…-git-main-…vercel.app) — la que devolvía el login de Vercel
✅   0  e-petplace-admin.vercel.app — la canónica anterior, ya superada
✅   1  admin.epetplace.com — CONTROL POSITIVO
✅  25  redirectTo — CONTROL POSITIVO
✅  21  google — CONTROL POSITIVO
```

**Los dos ceros son verdaderos**: el mismo instrumento, sobre el mismo archivo,
encuentra las otras tres cosas. Y la única ocurrencia está donde tiene que estar:

```js
signInWithOAuth({ provider:`google`, options:{ redirectTo:`https://admin.epetplace.com` } })
```

### El clic — PARCIAL, y la parte que falta se declara

Sonda al endpoint de OAuth de Supabase con la URL canónica:

```
HTTP/2 302
location: https://accounts.google.com/o/oauth2/v2/auth?…
          &redirect_to=https%3A%2F%2Fadmin.epetplace.com
          &redirect_uri=https%3A%2F%2Fauth.epetplace.com%2Fauth%2Fv1%2Fcallback
```

🔴 **Pero el discriminador dice que esa sonda NO prueba lo que parece:**

```
① canónica  admin.epetplace.com   → accounts.google.com  ✅
② una URL INVENTADA                → accounts.google.com  ✅  ← acá se cae
③ la URL vieja que rompía           → accounts.google.com  ✅
```

Las tres pasan ⇒ la sonda mide **que el endpoint despacha**, no **que la URL esté
permitida**. La allow-list se evalúa en el *callback*, un eslabón más adelante.
Queda como `L-505`.

**Lo que queda SIN medir, y con quién:**

| pendiente | por qué | dueño |
|---|---|---|
| el clic real en el navegador | la extensión de Chrome no respondió en 4 intentos | reintentar, o el founder en su teléfono |
| la vuelta desde Google | exige credenciales del founder — **no se usan** | founder |

*Lo que sí está probado: el código publicado es correcto y literal, y el endpoint
despacha hacia Google con esa URL intacta.*

---

## ② La causa, y por qué costó tanto

**`Ignored Build Step` en `Automatic`.** Tres pushes a `main` —`f1db76e`,
`8934a30`, `61de31a`— no produjeron deployment, y producción sirvió el bundle
viejo **2 h 20 min** con el login roto adentro.

🔴 **Su modo de falla es el silencio.** El build moría tan temprano que **no dejó
un solo registro**: ni error, ni deployment en *Skipped*, ni línea en el Activity
log — ni siquiera del Deploy Hook disparado a mano. Y un silencio se lee igual
que «todavía no llegó».

**Los cinco candidatos descartados por medición, en orden:**

| candidato | cómo se descartó |
|---|---|
| techo de deployments | el monorepo desplegó 28 min después del push fallido |
| webhook del repo | el repo **no tiene ninguno**: la conexión es GitHub App |
| GitHub App rota | funcionaba: el push siguiente sí construyó |
| force push / amend | reflog limpio; y el force push era mío, en otro repo |
| límites de gasto | el proyecto no estaba pausado ni excedido |

⚠️ **Los tres árboles eran distintos entre sí** — medido. Así que la heurística
compara algo más que el contenido, y **el texto de la pantalla describe el caso
típico, no el contrato** (`L-504`).

---

## ③ La cura, y el ciclo que costó afinarla

**Firmada:** la decisión vive en el repo, no en el dashboard.

```json
{ "rewrites": [ … ], "ignoreCommand": "exit 1" }
```

*(En Vercel el código está invertido: `exit 0` SALTEA, `exit 1` CONSTRUYE.)*

🔴 **Y el primer intento no funcionó — por mi culpa.** Le puse una explicación
adentro del comando; las comillas dobles lo rompen al ejecutarse y un comando roto
puede salir con `0`, o sea *saltear*. **La cura escrita para garantizar el build
fue lo único que lo impidió** (`L-506`).

Se descartó el schema antes de tocar nada: `ignoreCommand` existe, `maxLength 256`,
mi valor 92, `additionalProperties: false` limpio ⇒ **la forma era válida y la
causa era el contenido.**

**Lo que quedó escrito, y dónde se lee sin ejecutarse:**
- `README.md` → sección «Por qué este repo construye siempre», con lo que costó.
- `CLAUDE.md` → la advertencia arriba de todo, con **«no lo saques»**.

---

## ④ El gate que avisa si vuelve a pasar

`.github/workflows/deploy-al-dia.yml` + `scripts/verify-deploy-al-dia.mjs`.
En cada push a `main`: espera 5 min y le pregunta a la **API de Deployments de
GitHub** si la punta tiene deployment.

```
0  al día
1  la punta no se desplegó          → ✗ roja en el commit + mail a quien pusheó
2  no concluyente                    → sin `gh`, o ventana de 100 llena
```

**El margen de 5 min es 5× el peor caso medido** (26 s · 33 s · ~60 s). Si algún
día uno tarda más, **se re-mide, no se sube por costumbre**.

**Cómo se entera el founder, en tres capas y la primera alcanza:**
① ✗ roja al lado del commit, sin entrar a Actions · ② mail automático de GitHub
al autor del push · ③ Job Summary con los tres lugares del dashboard, en orden.

### Su historial real, que es su mejor prueba

| commit | veredicto | por qué |
|---|---|---|
| `bf6bf9b` | ✅ verde | el deploy salió a los 2 min 40 s, dentro de su ventana |
| `f3171cc` | 🔴 **rojo** | **su primer caso real fue un error de su propio autor** |

⚠️ **Honestidad sobre el verde:** `bf6bf9b` **no viró de rojo a verde** — nació
verde, porque el deployment ya existía cuando verificó. *Su capacidad de dar rojo
se probó a mano antes de cablearlo, y después la ejerció sola sobre `f3171cc`.*

---

## Las cuatro lecciones

| | |
|---|---|
| `L-503` | una respuesta de éxito dice que el pedido se **aceptó**, no que el trabajo vaya a ocurrir — y esa brecha es un punto de medición |
| `L-504` | el texto de una interfaz describe el **caso típico**; el contrato son los bordes, y no está escrito |
| `L-505` | una sonda puede ser verdadera y medir el eslabón **anterior** al que importa |
| `L-506` | la prosa **no es inerte** cuando vive adentro de algo que se ejecuta |

**Y una enmienda:** `L-502` afirmaba que *«el webhook nunca llegó a Vercel»* —
falso. El evento llegaba y se descartaba sin rastro. **El hecho verdadero refuerza
la lección**: no eran dos hipótesis indistinguibles sino tres, y *la correcta no
estaba en la lista*.

---

## Lo que queda vivo, con dueño

- **El proyecto Vercel del monorepo falla TODOS sus builds, producción incluida** —
  no es de esta pista. Avisado en `docs/loop/buzon/S114-F-para-TODAS-y-FOUNDER-el-monorepo-no-despliega.md`.
- **El clic real en el navegador** y **la vuelta desde Google** (tabla de ①).
