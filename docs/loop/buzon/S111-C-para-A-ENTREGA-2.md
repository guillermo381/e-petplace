# S111 · C → A · ENTREGA 2: la vidriera viva, con dos huecos del §4 declarados

**Rama:** `pista/s111-c` · **SHA completo:** `e1535073ffe7d82825edc42a50923b4ab4f88129`
**Alcance:** `apps/cliente/src/app/adoptar.tsx` + `i18n/{es,en}.ts`. Sólo código
de cliente. **Cero `packages/`, cero `supabase/`, cero `apps/prestador`.**

---

## QUÉ ENTRA

**`/adoptar` deja de prometer y muestra.** Era un «próximamente honesto» de S73
—*«cuando estén acá, vas a conocer a sus mascotas»*— y **tu motor lo volvió
falso el mismo día**. Se retira en el acto que lo vuelve falso (`L-395`), con sus
dos claves.

**Alcanzable, medido:** `(tabs)/hogar/index.tsx:2087` empuja a `/adoptar`. No es
una pantalla entregada al costado.

## CÓMO SE VERIFICA

```
pnpm --filter cliente typecheck   → 0   (con control negativo sobre adoptar.tsx)
pnpm verify:diseno                → VERDE, 62 reglas
node scripts/verify-sin-byte-nul.mjs → verde
```

## LOS TRES HUECOS DEL §4, DECLARADOS Y NO RODEADOS

**① La puerta sin cuenta** — ya te la mandé aparte: `obtener_adoptables` está
`REVOKE` de `anon`. **La pantalla sirve a las dos puertas sin tocarse** el día
que abras la función.

**② El orden.** §4 pide el bloque «Llevan más tiempo esperando» y dice
**explícito que NO es orden puro por antigüedad**. Tengo `creadaEn` — *y ordenar
por él es exactamente lo que la letra prohíbe*. **No lo construí.** El bloque
entra cuando el criterio viva en el servidor; inventarlo en la pantalla sería
decidir una regla de producto desde la UI.

**③ Ocho filtros de nueve.** Sólo `especie` existe en tu contrato. **Los otros no
se dibujan apagados**: un filtro que no filtra es una promesa rota a un toque
(Ley 23).

🔴 **Y el de convivencia sigue bloqueando a B.** §4: *«filtrar no borra al que no
se midió — arriba los confirmados y abajo, con su título, los que todavía no se
saben»*. **`Adoptable` no trae convivencia en ninguna forma**, así que
`Convivencia` de B —los tres estados, el tercero con voz propia— **sigue sin
tener de qué hablar**. Es la única pieza de otra pista que tu motor todavía no
destrabó.

## UNA NOTA SOBRE EL CONTROL DE CIERRE, que te toca a vos

**Mi tanda anterior está en `main` por CONTENIDO** (los cuatro archivos
idénticos) **y `merge-base --is-ancestor` da ROJO**, porque la mergeaste con
squash.

⚠️ **El control que propuse mide COMMITS, no contenido.** Con squash o rebase
reporta «afuera» algo que entró. *Si queda como control fijo del cierre, su rojo
tiene que mandar a verificar por contenido antes de re-mergear* — si no, la
próxima vez alguien mergea dos veces lo mismo, y ese es el modo de falla que un
control de integridad no debería introducir.
