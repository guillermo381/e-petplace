# S102-B → PISTA A · FICHA NUEVA, **SIN NÚMERO** *(la abre quien la midió; el número lo pone quien deposita — `L-331`)*

> **Medido el 21-ago:** `D-865` y `D-866` dan cero en mi árbol **y** en
> `origin/pista/s101-d`. **`D-864` daba cero en el mío y ya era de A** — tercera
> vez que la ventana del worktree muerde. **Por eso viaja sin número: A lo pone.**

---

## UN PERFIL DE BUILD PROMETE UNA CAPACIDAD QUE LAS DEPENDENCIAS NO DAN — Y NADA LO VERIFICABA

🔴 **ALTA.**

### ① EL CASO, con su antigüedad medida

`apps/cliente/eas.json` declara en su perfil `development`:

```json
"development": { "developmentClient": true, "distribution": "internal" }
```

**`developmentClient: true` construye una APK SIN bundle, que espera bajar el JS
de Metro.** Quien se lo baja es el launcher de **`expo-dev-client`**.

| medición | resultado |
|---|---|
| `developmentClient: true` en `apps/cliente/eas.json` | nace en **`71364782`, 8-jul-2026 (S45)** |
| commits que agregan `expo-dev-client` a `apps/cliente/package.json` | **CERO**, hasta hoy |
| el mismo par en `apps/prestador` | coherente desde **`6028aa1b` (S44)** |

> ### **El perfil `development` del cliente nació roto el 8-jul y nunca funcionó — seis semanas.**
>
> *Su modo de falla es el peor: la APK **se instala**, **arranca**, y se queda en
> el splash para siempre. No hay crash, no hay log, no hay síntoma que nombre la
> causa.*

**Y por qué nadie lo notó, que es la parte útil:** la casa gatea con el perfil
**`preview`**, que **no declara `developmentClient`** y sí trae su bundle. *El
perfil roto era el que casi nadie usaba — hasta que A lo usó.*

### ② CÓMO SE ENCONTRÓ — y esto es lo que la ficha viene a registrar

**No lo encontró una build ni un gate: lo encontró la mitad de un guard que no
necesita APK ni build** (`verify-apk-contenido.mjs --coherencia`), corrida sobre
las dos apps **antes** de gastar un ciclo de EAS.

> *El chequeo más barato del juez fue el que cazó un defecto de seis semanas.*

### ③ ESTADO — la cura está EN VUELO, y se dice para no fabricar una deuda fantasma

**A ya lo commiteó en `pista/s101-d`:** `"expo-dev-client": "~57.0.14"` en el
cliente. **Lo que queda no es curar: es verificar** con el guard cuando esa rama
llegue a `main`.

> ⚠️ **Y el episodio deja registrada una lección de coordinación que no es de
> código:** mi tabla decía *cliente → AUSENTE* y A lo tenía instalado hace horas.
> **Los dos ciertos: yo medí `origin`, ella su árbol de trabajo.** *La misma
> ventana del worktree que ya mordió tres veces con los números de ficha, ahora
> sobre el estado de una dependencia.*

---

## 🔴 ④ EL SEGUNDO FILO, Y ES MÁS GRANDE QUE EL PRIMERO

**Medido:** **ni `apps/cliente/eas.json` ni `apps/prestador/eas.json` fijan
`requireCommit`.**

⇒ **EAS archiva el ÁRBOL DE TRABAJO, no el commit.** Una build sale de lo que
había en el disco en ese instante — **y de nada que un hash pueda nombrar.**

> ### **Ninguna build de esta casa es reproducible desde un commit, y ningún acta puede probar de qué salió.**

**Por qué esto importa acá y no es una preferencia de configuración:** este canon
**cita hashes para todo** — el ancla de cada OTA, cada acta, cada ficha. La casa
ya pagó por la versión OTA de este mismo problema:

> *«el registro publicado NO expone el estado del árbol ⇒ **un publish sucio es
> inauditable después**»* (S91) — y por eso nació `publicar-ota.mjs`, que **falla
> si el árbol está sucio**.

**Para las BUILDS no existe ese guard.** *El OTA tiene su veda y su acto único;
la build nativa no tiene ninguno de los dos.*

**El episodio de hoy lo muestra en vivo y por eso vale como evidencia:** A tenía
`expo-dev-client` **sin commitear**, la build salió de `76f83f5f` —que no lo
tiene— **y probablemente lleve el paquete igual**, porque el árbol viajó. *Ella
lo dijo con la palabra correcta: «probablemente» no es un veredicto.*

**⇒ Con `requireCommit` sin fijar, la pregunta «¿qué hay adentro de esta APK?»
NO tiene respuesta documental — solo se puede abrir el ZIP.** Que es,
exactamente, la razón por la que `verify-apk-contenido.mjs` tuvo que existir.

---

## ⑤ LA FICHA, PARA DEPOSITAR

**Dueño:** la app cliente es de **C** por la tabla del método; **A tiene el
build y la cura en vuelo** ⇒ **A ejecuta y declara**, C se entera.
*(La mesa adjudicó «quien tenga el territorio de la app cliente»; se declara la
tensión con la tabla en vez de resolverla acá.)*

**☠️ DISPARO — DOS, y el segundo es el que no puede esperar:**
1. **La primera build de `development` del cliente** — hoy rebotaría por el guard.
2. 🔴 **`requireCommit`: antes del próximo build nativo de CUALQUIERA de las dos
   apps.** *Cada build que salga sin él es un artefacto más cuya procedencia no
   se puede reconstruir, y eso no se arregla después.*

**☠️ MUERTE:**
- `verify-apk-contenido.mjs --coherencia` en **VERDE en las dos apps sobre
  `main`** *(hoy verde solo en la rama de A)*.
- **`requireCommit` fijado**, y una build cuyo `gitCommitHash` se pueda cotejar
  contra el ZIP.

**Se cruza con:** `D-574` (los secrets del build local **no fallan, se omiten** —
misma familia: el build promete y no cumple, en silencio) · la enmienda S91 de la
regla 82 (**el asterisco es un destello, no un registro**) · `L-330` (un cero sin
control positivo no es un cero).

> **Y la línea que resume las dos mitades:**
> ***Un perfil de build es una promesa sobre un artefacto que nadie leía, hecha
> en un archivo que nadie ata a un commit.***
