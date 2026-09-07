# Capturas S113-B · 3.1 — el glifo de LUPA

Metro en el puerto propio de B (8092), `Android Bundled … (2999 modules)`.
⚠️ El toast de `initApi()` es del root de la app —este worktree no tiene
`.env.local`— y **no toca la medición del glifo**: la sonda no usa la base.

## 🔴 El censo cambió la geometría, no el concepto

`info`, `checkEnCirculo` y `explorar` son **los tres un círculo de r≈8.5
centrado en (12,12)**. Ésa es la colisión real, y es de FORMA: *un cuarto
círculo del mismo tamaño y en el mismo centro entra a esa familia y a 21 px se
pierde adentro.*

| variante | veredicto |
|---|---|
| **V2 · del tamaño de la familia** (r=8.4, por coherencia con sus tres vecinos) | ✗ **no entra en banda con mango**: 57,8 (**+25 %**) · 59,8 con el diagonal |
| **✅ V1 · lente chica y descentrada** (r=6.0 en (9.8,9.8)) | masa **44,8 (−4 %)** · **2 trazos** · interior **8,8 px** |

*La coherencia con la familia circular es imposible en cuanto le agregás el
mango — y el mango es lo único que la distingue de sus tres vecinos.* **El
número dice lo mismo que el ojo.**

## Lo que prueban las capturas

**🟢 A 21 px la lupa NO se confunde con sus tres vecinos**: la lente es **30 %
más chica** (6.0 contra 8.6) y está **descentrada** — se sale de la familia por
tamaño Y por posición, no sólo por el mango.

**🟢 Sin huella, y es declarado** (§6b.6): *buscar es un acto de la interfaz, no
de la mascota* — y una huella adentro de una lente se leería como un animal
atrapado en un aumento.

⚠️ **Su riesgo declarado sigue siendo el mango**: sin él es un círculo más, y
por eso tiene su rojo en `verify:glifos` — igual que al `papel` lo salva su
marco.
