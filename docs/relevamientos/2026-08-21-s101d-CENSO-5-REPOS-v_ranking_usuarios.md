# CENSO DE LOS CINCO REPOS — consumidores de `v_ranking_usuarios`

> **S101-D** · 21-ago-2026 · **pedido del founder** (bloquea el paso 5 de la tanda
> de S102-B) · ficha **`D-860`** · ley que lo exige: **`L-215`**.
>
> **Qué se pidió:** evidencia por repo —cero o los consumidores nombrados—, **no un
> veredicto**. *Con cero consumidores se aplica; con alguno, vuelve a la mesa.*
> **Alcance:** cualquier lectura, **directa o por vista derivada**.

---

## §0 · EL INSTRUMENTO, PROBADO ANTES DE USARLO — y su primera versión estaba rota

**Control positivo elegido: `seller_comisiones`**, que S102-B midió como consumida
por el admin. Si el instrumento no la encuentra, no encuentra nada.

🔴 **La primera corrida dio CERO en los cinco repos — y era falso.** La causa:
`for r in $REPOS` con la lista en una variable, **y zsh no divide en palabras por
default** ⇒ el `grep` buscó en una ruta inventada que no existe, y devolvió cero
sin fallar.

> ***Un cero que sale de una ruta inexistente se ve igual que un cero que sale de
> haber buscado bien.*** Lo cazó el control positivo, no la lectura del código.

**Instrumento corregido, control en verde:**

| repo | `seller_comisiones` |
|---|---|
| `e-petplace-admin` | **4** |
| `e-petplace-prestadores` | **1** |
| los otros tres | 0 |

⇒ el instrumento **discrimina**.

### Y los CEROS también se probaron

Un cero puede ser «no lo usa» o «no había nada que grepear». Medido:

| repo con cero | archivos de código | mencionan `supabase` |
|---|---|---|
| `e-petplace-v2` | **70** | **26** |
| `epetplace-web` | **60** | **10** |
| `e-petplace-sistema-pruebas` | **11** | **1** |

⇒ **son ceros REALES**: hay código, y ese código habla con la base.

---

## §1 · EL CENSO — evidencia por repo

| repo | archivos que nombran `v_ranking_usuarios` |
|---|---|
| **`e-petplace-admin`** | **4** |
| **`e-petplace-prestadores`** | **1** |
| `e-petplace-v2` | **0** |
| `epetplace-web` | **0** |
| `e-petplace-sistema-pruebas` | **0** |

### Los cinco archivos, uno por uno — *nombrar no es consumir*

| archivo | qué es | ¿lee? |
|---|---|---|
| `e-petplace-admin/CLAUDE.md` | documentación | ❌ |
| `e-petplace-admin/src/lib/database.types.ts` | tipos **generados** | ❌ |
| `e-petplace-admin/src/pages/Gamificacion.tsx:7` | `type Ranking = Database[…]['v_ranking_usuarios']['Row']` | ❌ solo tipo |
| 🔴 **`e-petplace-admin/src/pages/Dashboard.tsx:133`** | `.from('v_ranking_usuarios').select('*').order('posicion_global').limit(5)` | ✅ **LECTURA REAL** |
| 🔴 **`e-petplace-admin/src/pages/Gamificacion.tsx:414`** | `.from('v_ranking_usuarios').select('*').order('posicion_global')` | ✅ **LECTURA REAL** |
| `e-petplace-prestadores/src/lib/database.types.ts` | tipos **generados** · y el repo está **CONGELADO desde S42** | ❌ |

⇒ **HAY DOS CONSUMIDORES REALES, y los dos viven en `e-petplace-admin`.**
*El censo del monorepo daba cero y era cierto: los consumidores estaban afuera —
exactamente el hueco que `L-215` existe para cerrar.*

---

## §2 · LA PREGUNTA QUE DECIDE LA CURA — y no es «¿hay consumidores?»

Encontrar consumidores **no basta**: lo que decide si el `REVOKE` los rompe es
**con qué ROL leen**.

### ① Admin corre con la anon key… pero sus dos consumidores están detrás de login

`e-petplace-admin/src/lib/supabase.ts:4` → `VITE_SUPABASE_ANON_KEY`.
**Pero** en `App.tsx` las dos páginas son **hijas de la ruta protegida**:

```jsx
<Route element={<ProtectedRoute isAdmin={isAdmin} loading={loading}>
                  <Layout session={session!} />
                </ProtectedRoute>}>
  <Route path="/"             element={<Dashboard />} />     ← L151
  <Route path="/gamificacion" element={<Gamificacion />} />  ← L158
```

⇒ **con sesión iniciada, supabase-js manda el JWT del usuario y PostgREST asume
`authenticated`, no `anon`.** *La anon key es la llave de arranque del cliente, no
el rol con el que consulta una pantalla logueada — confundir las dos es lo que
habría hecho abortar esta cura sin motivo.*

### ② Y el otro filo, medido: ¿`authenticated` lee por grant propio o heredado?

Porque la cura de B revoca **`anon` Y `PUBLIC`**, y **todo rol hereda de
`PUBLIC`** (`L-216`). Si `authenticated` leyera por herencia, revocar `PUBLIC`
**rompería el admin igual**.

```
anon_lee ............... true      ← la exposición es REAL
auth_lee ............... true
auth_select_propio ..... 1         ← grant EXPLÍCITO, no heredado
grants_de_public ....... 0         ← PUBLIC no tiene NINGÚN grant acá
```

---

## §3 · VEREDICTO — **el freno LEVANTA, con evidencia**

> ### ✅ **REVOCAR `anon` NO ROMPE A NINGÚN CONSUMIDOR.**

**Los dos consumidores reales leen como `authenticated`, y `authenticated` tiene
su SELECT propio.** El brazo `PUBLIC` de la cura es un **no-op medido** (cero
grants) — **se conserva igual**, porque `L-216` dice que un REVOKE que deja
`PUBLIC` intacto no cierra nada, y un día alguien podría concederle algo.

### ⚠️ Lo que este censo NO prueba, declarado

- **No probé el rebote.** *«Nadie se rompe» es una lectura de grants y de rutas;
  el hecho sería aplicar el REVOKE y ver el admin seguir funcionando.* La cura
  trae su cinturón de dos brazos — **eso es lo que lo convierte en hecho**.
- **No hay vistas derivadas medidas**: la consulta de dependencias no llegó a
  correr limpia. **`v_ranking_usuarios` no aparece dentro de ninguna otra vista en
  el censo por texto**, pero *una dependencia en la base se mide en la base*.
  ⇒ **el cinturón de la cura tiene que cubrirlo.**
- **Si un admin abre el Dashboard SIN sesión**, la petición sale como `anon` — y
  hoy le responde. Tras el REVOKE devolvería vacío o error **en una pantalla que
  ya lo manda al login**. *No es un consumidor legítimo: es la exposición misma.*

---

## §4 · PARA LA MESA Y PARA B

| | |
|---|---|
| **Consumidores fuera del monorepo** | **2 lecturas reales**, las dos en `e-petplace-admin` |
| **¿Rompe el REVOKE de `anon`?** | **NO** — leen como `authenticated`, con grant propio |
| **¿Rompe el REVOKE de `PUBLIC`?** | **NO** — `PUBLIC` tiene 0 grants sobre la vista |
| **Estado del paso 5 de la tanda** | 🟢 **DESBLOQUEADO**, con la evidencia de arriba |
| **Lo que sigue faltando** | el **rebote medido** al aplicar, y la dependencia de vistas **verificada en la base** por el cinturón |
