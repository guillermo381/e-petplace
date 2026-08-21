# S102-B → PISTA A · FICHA NUEVA, **SIN NÚMERO** *(la abre quien la midió; el número lo pone quien deposita — `L-331`)*

> **Medido el 21-ago:** `D-865` y `D-866` dan cero en mi árbol **y** en
> `origin/pista/s101-d`. **`D-864` daba cero en el mío y ya era de A** — tercera
> vez que la ventana del worktree muerde. **Por eso viaja sin número: A lo pone.**

---

## UN PERFIL DE BUILD PROMETE UNA CAPACIDAD QUE LAS DEPENDENCIAS NO DAN — Y NADA LO VERIFICABA

🔴 **ALTA.**

> ### **EL CHEQUEO MÁS BARATO ENCONTRÓ EL DEFECTO MÁS VIEJO.**
>
> **Seis semanas**, y lo cazó **la mitad de un guard que no necesita APK ni
> build**. *Fue invisible todo ese tiempo porque la casa gatea con `preview`,
> que sí trae su bundle: el perfil roto era el que casi nadie usaba.*

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

## ④ EL SEGUNDO FILO SE MUDÓ A FICHA PROPIA *(orden de mesa, 21-ago)*

**Medir este defecto destapó otro, y la mesa dictaminó que son distintos:**
`requireCommit` no está fijado en ninguna de las dos apps ⇒ **EAS archiva el
árbol, no el commit.**

> **Son defectos de clase distinta y por eso van separados:** *el perfil era una
> promesa incumplida EN un archivo; aquello es que **ningún** archivo ata una
> build a un commit.* **El primero se curó con una dependencia; el segundo no se
> cura con ninguna.**

**⇒ `docs/relevamientos/2026-08-21-s102b-FICHA-requirecommit.md`**, con su prueba
medida (la APK del gate trae `expo/modules/devlauncher` ×1.884 y salió de un
commit que no lo tiene) y su disparo bloqueante.

## ⑤ LA FICHA, PARA DEPOSITAR

**Dueño:** la app cliente es de **C** por la tabla del método; **A tiene el
build y la cura en vuelo** ⇒ **A ejecuta y declara**, C se entera.
*(La mesa adjudicó «quien tenga el territorio de la app cliente»; se declara la
tensión con la tabla en vez de resolverla acá.)*

**☠️ DISPARO: la primera build de `development` del cliente** — hoy rebotaría
por el guard de coherencia. *(El disparo del `requireCommit` NO vive acá: es de
su propia ficha. **Dos fichas no reclaman el mismo disparo** — si lo hicieran,
cerrar una parecería cerrar la otra.)*

**☠️ MUERTE:** `verify-apk-contenido.mjs --coherencia` en **VERDE en las dos apps
sobre `main`** — *hoy verde solo en la rama de A, y por eso la ficha sigue
abierta aunque la cura exista.*

**Se cruza con:** `D-574` (los secrets del build local **no fallan, se omiten** —
misma familia: **el build promete y no cumple, en silencio**) · **la ficha del
`requireCommit`**, que este defecto destapó · `L-330` (un cero sin control
positivo no es un cero).

> **La línea que la resume:**
> ***Un perfil de build es una promesa sobre un artefacto que nadie leía.***
