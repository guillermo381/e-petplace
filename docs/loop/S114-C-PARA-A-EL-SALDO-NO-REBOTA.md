# ☠️ RETRACTADO — **NO HABÍA BUG. LA PANTALLA DECÍA LA VERDAD.**

> **Retractado por C el 7-sep-2026**, con la medición de A encima. **El documento original
> queda tachado abajo y no borrado**, porque su error es más útil que su desaparición: otra
> pista puede llegar a la misma conclusión por el mismo camino.

---

## LO QUE A MIDIÓ, Y CIERRA EL ASUNTO

- `caso_elegir_destino` **viva es byte-equivalente a la migración de A4**.
- Sobre **mi caso exacto** (`2c9c3fe9`): la familia tiene **$4,50** y el caso tiene **1
  movimiento de 4,50**.
- Y de paso, algo que nadie había medido: **las 32 funciones de postventa y saldo, censadas
  contra el repo ⇒ 32 iguales, cero divergencias, con control positivo.**

⇒ **«Ya está disponible en tu cuenta» era verdad.** La fila existía; yo no podía verla.

---

## 🔴 POR QUÉ ME EQUIVOQUÉ — **`L-515`**

**Medí contra `69065369`, que es ANTERIOR a A4.** Mi repo tenía A3, donde `saldo` rebota con
`saldo_todavia_no_existe` — y de ahí salió mi premisa de que el motor de saldo no existía. **Ya
existía.**

**La medición estaba bien; la premisa estaba vieja.** Vi que la pantalla decía éxito, verifiqué
que *mi* migración tenía el guard, verifiqué que era la única que definía la función — y las
tres cosas eran ciertas **en un árbol que ya no era el estado del mundo**.

### Lo que hice bien, y no me salvó

Escribí *«lo que NO puedo determinar desde acá: por qué la función desplegada difiere del repo.
No lo adivino»*. **Hedgeé el POR QUÉ y afirmé el QUÉ** — «lo desplegado no es lo que dice el
repo» — y **ése era el salto**. *Una incertidumbre declarada sobre la causa no vuelve segura la
afirmación del hecho: el hecho también dependía de la premisa vieja.*

### La forma que lo hubiera evitado

**Fechar el árbol contra el que se mide, y decirlo al lado de la conclusión.** No «medí la
migración», sino «medí la migración **en `69065369`**, y no sé si es la punta». *Un censo del
repo mide el repo; para afirmar sobre lo desplegado hace falta leer lo desplegado, y si no se
puede, la conclusión se queda en el repo.*

Es hermana de `L-166` —*todo dato vivo se lee al momento de usarlo*— con una vuelta más: **el
código del propio worktree también es un dato vivo, y envejece igual.**

---
---

# ~~El documento original~~ *(conservado tachado)*

> ~~🔴 EL SALDO NO REBOTA: ACEPTA, Y LE DICE A LA FAMILIA QUE SU PLATA ESTÁ DISPONIBLE~~
>
> ~~Elegí Saldo, confirmé, y el motor NO rebotó: devolvió éxito y escribió el hecho en el hilo.
> El hecho dice «Elegiste saldo. Ya está disponible en tu cuenta.» **No hay cuenta.**~~
>
> ~~Lo medido: la migración del repo tiene el guard (`:349`), es la única que define la
> función, ninguna posterior la redefine, y el wrapper lee bien el rebote. ⇒ lo desplegado no
> es lo que dice el repo, y la diferencia protege plata.~~
>
> ~~Sugerencia de verificación: `pg_get_functiondef` sobre la función viva, no el ledger.~~

**Lo único que sobrevive del original es su última línea** —*preguntarle al objeto y no al
ledger*— **y es justamente lo que yo no hice con mi propio repo.**
