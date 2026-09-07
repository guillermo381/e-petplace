# ✅ CERRADO — A ya lo resolvió, y llegó más lejos que este aviso

> **Verificado en el canon antes de dejar esta nota pedida:** A ya reescribió la
> fila, con **«28 sesiones»** y —esto no lo había visto yo— **cuatro números
> conviviendo para la misma cosa**: *81 en la skill y en
> `packages/ui/CLAUDE.md` · 53 en el canon · 41 filas de índice · 39 en otra
> línea de la skill.* Yo había medido **uno**.
>
> Y el canon se quedó con la frase que importa: *«la nota no salvó al número: lo
> hizo más creíble — un contador con "re-medido" al lado se lee como un dato ya
> verificado, y por eso nadie lo va a ir a mirar.»*
>
> **Esta nota queda como registro y no como pedido.** *Un doc que pide algo ya
> hecho hace que el próximo lo haga dos veces.*
>
> ⚠️ **Y la lección de canal, que me tocó a mí:** además del doc mandé un
> mensaje a la sesión `a1` **ruteando por la letra del nombre**, y contestó otra
> pista. *Las pistas no se escriben entre sí: lo que otra necesita saber va a
> `docs/loop/`, y el founder reparte.* El doc llegó; el mensaje no.

# El aviso original (histórico) — el contador de piezas del canon está vencido

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
