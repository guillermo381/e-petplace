# Aviso de F a todas las pistas y al founder — **el proyecto Vercel del monorepo falla TODOS sus builds, producción incluida**

**8-sep-2026 · S114-F · no es mi frente, lo encontré midiendo otra cosa.**

No requiere acción de nadie hoy. Se escribe porque **ninguna pista puede verlo desde su
worktree** y **no tiene síntoma**: nadie recibe un error, los sitios que ya estaban
publicados siguen respondiendo, y `git push` sale verde igual.

---

## Lo medido

Contra la **API de Deployments de GitHub** del repo `guillermo381/e-petplace`
(no contra el dashboard de Vercel, al que no tengo acceso).

```
ventana pedida            100 deployments (el máximo por página)
rango que cubre           6-sep 23:42Z  →  8-sep 04:42Z
Production en la ventana  29
muestreados               46, de los cuales 46 en `failure`
verdes encontrados        0   ← la ventana se agotó sin encontrar uno
```

🔴 **No son sólo los previews.** El cierre de S113 en `main` —`e516a08`— tiene su
deployment de **Production** en `failure`:

```
e516a08 · env=Production · 2026-09-07T20:27:16Z · failure
eaf5846 · env=Production · 2026-09-07T20:17:31Z · failure
```

El mensaje del más reciente, literal:

```
Deployment has failed — run this Vercel CLI command:
npx vercel inspect dpl_3sC6jZ2nmZq1FXkKu6vp8nN7vmUu --logs
```

---

## Lo que NO se midió, y por qué

- **Qué proyecto de Vercel es.** El repo `e-petplace` es un monorepo; el proyecto
  conectado podría ser `apps/pagos-web` u otro. **Sin token de Vercel no se puede saber**,
  y de eso depende si esto importa mucho o nada. *Antes de alarmarse conviene contestarlo.*
- **La causa del fallo.** Vive en los logs de build, que exigen el CLI autenticado.
- **Desde cuándo.** La ventana de 100 se agotó **sin un solo verde**, así que
  «al menos desde el 6-sep 23:42» es un piso, **no la fecha de inicio**.
- **Si alguien lo usa.** Si nadie consume ese deployment, esto es ruido; si es
  `pagos-web`, es la página del alta de tarjeta quedándose vieja.

---

## Lo que sí se puede afirmar

**Un push al monorepo no produce hoy un artefacto desplegado por Vercel.** Cualquier
trabajo que dependa de eso —y ninguna pista declaró depender— está corriendo sobre lo
último que sí construyó, que es anterior a la ventana medida.

---

## Cómo verificarlo cualquiera, sin dashboard

```bash
gh api "/repos/guillermo381/e-petplace/deployments?per_page=5" \
  --jq '.[] | "\(.id) \(.sha[0:7]) \(.environment)"'

# y el estado de uno:
gh api "/repos/guillermo381/e-petplace/deployments/<id>/statuses?per_page=3" \
  --jq '.[] | "\(.state) — \(.description)"'
```

⚠️ **`gh` responde con la sesión de GitHub, no con credenciales de Vercel** — este camino
es de sólo lectura y no toca nada.

---

## De dónde salió

Persiguiendo por qué **otro** repo (`e-petplace-admin`) no desplegaba. Ese caso se cerró:
era el `Ignored Build Step` en `Automatic` matando el build sin dejar rastro
(ver `L-504`). **El del monorepo es otro problema y sigue abierto** — el discriminador
que lo separa es que acá **sí hay deployments y están en `failure`**, o sea que el build
arranca y revienta; allá no había deployment ninguno.
