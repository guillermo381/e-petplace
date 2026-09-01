# S111 · C → A · ENTREGA 1: `D-990` cerrada y el hogar sin nadie deja de ser un callejón

**Rama:** `pista/s111-c`
**SHA completo:** `d76510a5f84793614dd466142ec68e7d4e4f4667`
**Base:** `origin/main` `9443da56b43bbcb747d82507041cdacd855631d7`

---

## ALCANCE — código y docs, declarado archivo por archivo

**Código (3):**
- `apps/cliente/src/app/(tabs)/hogar/guarderia.tsx` — la marca de `no_recogida`
  en la fila + el recorte firmado al desplegar.
- `apps/cliente/src/app/(tabs)/hogar/index.tsx` — el vacío del hogar gana su
  camino.
- `apps/cliente/src/i18n/{es,en}.ts` — 5 claves nuevas, espejo completo.

**Docs (3):** `docs/loop/S111-C-RECORRIDOS.md` + dos del buzón.

🔴 **Cero `packages/`, cero `supabase/`, cero `apps/prestador`.** No toqué
territorio ajeno.

## QUÉ ENTRA

**① `D-990` CERRADA.** El hueco no era de voz sino de **alcance**: la voz
existía desde S107-C dentro del durante, y la familia no tiene razón para entrar
ahí si no sabe que pasó algo. Ahora la fila del hub lo marca y al desplegarla
dice el recorte entero: *«No se pudo recoger a Thor. El día se cobró y no se
repone.»* **Cero mora, cero aviso, cero protocolo.**

**② El hogar sin mascotas deja de ser un callejón.** Su vacío decía *«Agrega a
tu mascota»* **sin ningún control** — Ley 17.5 rota. Ahora tiene su botón.

## CÓMO SE VERIFICA — qué tiene que dar verde del otro lado

```
pnpm --filter cliente typecheck     → 0    (incluye guard-rutas-tipadas)
pnpm verify:diseno                  → VERDE, 62 reglas
```

Los corrí acá: los dos verdes, **y el typecheck con control negativo** — una
clave de i18n inexistente rompe sobre mi archivo (`TS2345`) y vuelve a verde al
restaurarla, así que el verde **no es por ausencia** (`L-459`).

⚠️ **Necesitás el generado:** el worktree nuevo no trae
`apps/cliente/.expo/types/router.d.ts` y sin él el guard frena (correctamente).
Se copia de un worktree que lo tenga.

## DOS FICHAS SIN NÚMERO — los números los ponés vos

**① `D-990` — ENMIENDA, no cierre limpio.** Su diagnóstico decía *«el tercero
no lo construyó nadie»* y **era falso: media pieza existía desde S107-C.**
*(La escribí yo: era verdadera desde mi perímetro de S110 —que excluía el lado
familia— y falsa como descripción del producto, porque no había mirado la
pantalla del vecino.)* Y **se retira la línea que manda pedirte el ensanche**:
medido, `obtener_mis_estadias_guarderia` ya proyecta `estado_estadia`.

**② Lección sin número, si te sirve:** *una ficha que declara un hueco se mide
contra el objeto antes de tomarla, **aunque la haya escrito uno mismo**.* Un
hueco entre dos perímetros se ve mal desde los dos lados **incluso después de
elevarlo** — quien lo eleva describe su mitad, no el hueco.
