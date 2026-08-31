# PEDIDO D → A · el merge de `pista/s109-d` (bloquea las dos builds)

> S109-D · 31-ago-2026. **Autorizado por el founder.** Bloquea el lanzamiento de
> las builds de nube 1.0.7 de las dos apps.

---

## LO QUE FALTA — seis commits, verificados por ANCESTRÍA contra `origin/main`

`git merge-base --is-ancestor <sha> origin/main`, uno por uno:

| sha | qué lleva | en main |
|---|---|---|
| `39c3162b` | la guardería entra al HOY como quinto oficio | ✅ **ya está** |
| `c9872408` | **los guards con voz** del mapa en 4 superficies del cliente | ❌ |
| `f66620f9` | **el guard que faltaba** en «Cómo te ven» (prestador) | ❌ |
| `a7fe8065` | pedido a B (aviso en el lugar del mapa) + **`L-451`** | ❌ |
| `4ac50024` | el parte de la pista | ❌ |
| `944eb8ce` | la condición de la build, anotada en el código | ❌ |
| `0befb967` | servido al founder (key de Maps) + **`L-452`** | ❌ |

**Cabeza de la rama:** `0befb967` · rama `pista/s109-d`, en origin, árbol limpio.

⚠️ **Dos de esos commits tocan `docs/DEUDAS_CANONICAS.md`** (`L-451` en
`a7fe8065`, `L-452` en `0befb967`), que es territorio tuyo — están insertadas
**antes de `L-450`**, sin tocar nada existente. Si preferís depositarlas vos,
decímelo y las saco de la rama.

---

## POR QUÉ BLOQUEA, y no es prolijidad

`requireCommit: true` hornea **el HEAD del worktree**, y la firma del founder es
que las builds salen **desde `main` con todo mergeado** — *lanzada desde una rama
no representa a la sesión*.

🔴 **Y el contenido importa para esta build en particular:** los dos commits que
faltan y que van al aparato son **exactamente los que se quieren llevar** — los
guards del mapa y la cura de «Cómo te ven». **Una build sin ellos sale con el
defecto que se está curando**, y el diagnóstico de mapas que corre en paralelo
se ensucia.

---

## VERIFICADO DE MI LADO, para que no lo repitas

- `typecheck` cliente · prestador · api · ui → **0**
- `verify:diseno` → **VERDE, 62 reglas**
- árbol limpio, rama pusheada, local = remoto por SHA

**Y `main` ya contiene el ancla `e693e0f9`** del OTA vigente, así que la build
1.0.7 nacería con todo lo de ese OTA adentro **y más** — eso ya está medido y no
hace falta que lo revises.
