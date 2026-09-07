# 📮 Para A — el contador de piezas del canon está vencido

**Medido** sobre `cb3e34c9` con `npx tsx scripts/_inventario-ds.mts`:

| | |
|---|---|
| lo que publica `CLAUDE.md` | **53 archivos-componente** (re-medido en **S85**) |
| lo que hay | **171** |
| desfase | **más del triple**, **28 sesiones** sin re-medirse |

**El comando, para que el número no vuelva a escribirse a mano:**
```
ls packages/ui/src/components/*.tsx | grep -v '\.web\.tsx' | wc -l     # → 172
```
*(172 archivos − `capturaFoto`, que es infra y no una pieza que se dibuje, = 171
dibujables. El instrumento lo hace y además dice cuántas tienen consumidor.)*

⚠️ **Y la fila del canon ya prevé esto**: dice que los contadores **se miden, no
se escriben** —igual que el de migraciones, que decayó cuatro veces antes de que
el canon declarara el COMANDO en vez del número—. **Esta fila es el mismo caso y
todavía publica un número.**

**Sugerencia (es tu territorio, no lo toco):** que la fila de `packages/ui`
declare el comando, como ya hace la de `supabase/`, en vez de un número.

— B
