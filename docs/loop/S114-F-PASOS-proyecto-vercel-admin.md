# Crear el proyecto de Vercel para `apps/admin` — **los campos exactos, en orden**

> ## 🔴 Antes de tocar nada: las variables van ANTES del primer deploy
>
> Sin ellas **el build aborta con `exit 1`** —es la cura del `vite.config`, y es lo
> correcto—. **Cargalas en el paso ③ y recién después dale a Deploy.**

**8-sep-2026 · S114-F.** Medido del repo, no escrito de memoria. **Una sola pasada.**

---

## ① Import Project

**Add New → Project → Import Git Repository → `guillermo381/e-petplace`**

⚠️ **Es el MONOREPO, no `e-petplace-admin`.** *El legado se apaga; la mesa nueva vive
adentro del monorepo.*

## ② Configure Project — los cinco campos

| campo | qué poner | por qué |
|---|---|---|
| **Project Name** | `epetplace-admin` *(o el que prefieras)* | es el nombre en Vercel, no el dominio |
| **Framework Preset** | **Vite** | Vercel lo detecta; si ofrece «Other», poné **Vite** igual |
| **Root Directory** | 🔴 **`apps/admin`** | el campo que decide todo. Se elige con *Edit* al lado del campo |
| **Build Command** | *dejar el default* → `pnpm run build` | el `package.json` ya dice `tsc -b && vite build` |
| **Output Directory** | *dejar el default* → `dist` | es donde Vite escribe |
| **Install Command** | *dejar el default* | Vercel detecta `pnpm@11.10.0` del `packageManager` de la raíz |

⚠️ **«Include files outside the root directory»: dejalo ENCENDIDO** (viene así por defecto).
*`apps/admin` importa `@epetplace/api`, que vive en `packages/`: si Vercel copia sólo el
subárbol, el build no encuentra el paquete.* **Es la razón por la que declaré la dependencia
del workspace** — con eso resuelve por `node_modules`, pero **necesita el repo entero en
disco igual.**

## ③ 🔴 Environment Variables — ANTES del primer deploy

**Dos, exactas** (medidas del guard del `vite.config`):

```
VITE_SUPABASE_URL        https://zyltipqscdsdsxnjclhp.supabase.co
VITE_SUPABASE_ANON_KEY   la anon key — la MISMA del resto de la casa
```

- Marcá los tres entornos: **Production · Preview · Development**.
- 🔴 **`anon`, NUNCA `service_role`.** *Una `service_role` en un bundle web bypasea toda la
  RLS: es la misma clase de catástrofe que una anon key expuesta, pero al revés.*
  (Letra §3④, y §9.2 de `LETRA_POSTVENTA`.)
- **La anon key es pública por diseño** — viaja en el bundle de las dos apps. No es un
  secreto; el `service_role` sí.

**Si te olvidás de este paso, el build falla así — y eso es lo correcto:**

```
🔴 FALTAN VARIABLES: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.
   Este sitio NO se publica a medias: sin ellas el bundle sale sin la
   aplicación (≈200 kB en vez de ≈480) y sirve una página en blanco.
```

## ④ Deploy

Debería tardar **~1-2 min**. **Cómo saber que salió bien de verdad** — no alcanza con el
✓ verde (`L-521`):

| señal | valor esperado |
|---|---|
| peso del bundle | **≈ 476 kB** *(si dice ~200 kB, salió sin la app)* |
| la URL de Vercel abre | la pantalla de **login** con «e-PetPlace · Operaciones» en la pestaña |
| entrás y ves | **Casos** y **Liquidaciones** en el menú |

## ⑤ 🔴 LA ALLOW-LIST DE SUPABASE — antes del primer login, no después

**Supabase → Authentication → URL Configuration → Redirect URLs → Add:**

```
https://<la-url-del-proyecto-nuevo>.vercel.app/**     ← para probar YA
https://admin.epetplace.com/**                        ← cuando el dominio se mueva
```

⚠️ **Este paso no es opcional y su falla no se parece a una falla:** si la URL no está en la
lista, el login **funciona** —te autenticás— y Supabase, al volver del proveedor, **descarta
el `redirect_to` que no reconoce y te manda al Site URL.** *Terminás en el sitio público,
logueado, sin un solo error.*

**Ya pasó (8-sep-2026, `L-525`):** el `redirectTo` del legado se curó en el código a
`admin.epetplace.com` y **nadie lo agregó acá** — la allow-list seguía con la URL de rama
vieja. El bundle era correcto, el dominio no redirigía, y la sonda de OAuth salía bien:
***ninguna medición del repo podía verlo, porque la mitad que faltaba no vive en el repo.***

## ⑥ El dominio — recién cuando ④ esté verde

**Settings → Domains → Add** → `admin.epetplace.com`

⚠️ **Vercel va a decir que el dominio ya está en uso por otro proyecto** (el legado) y va a
ofrecer moverlo. **Eso es lo que queremos.**

- El destino esperado sigue siendo **`cname.vercel-dns.com`** — *si el CNAME de Hostinger ya
  apunta ahí, **no hay que tocar Hostinger**: el dominio cambia de proyecto adentro de
  Vercel.* **Confirmalo con lo que diga la pantalla.**
- **El legado NO se borra:** se queda sin dominio propio y **sigue vivo en su URL de Vercel**
  (`e-petplace-admin.vercel.app`), disponible para consultar. ***Apagar no es borrar.***

---

## Lo que NO hay que hacer

- ❌ **No crear un subdominio nuevo.** La firma cambió: `admin.epetplace.com` va a la mesa
  nueva. *El dominio que se escribe todos los días apunta a la aplicación buena.*
- ❌ **No borrar el proyecto del legado** — punto ⑤.
- ❌ **No tocar el proyecto Vercel del monorepo** (el que construye todo con turbo y falla
  por `pagos-web`). **Este es un proyecto NUEVO y separado**; ése sigue su camino y la mesa
  ya firmó que se retira.
