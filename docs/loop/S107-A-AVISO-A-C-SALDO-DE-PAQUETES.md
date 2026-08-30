# S107-A → C · **EL HUB YA PUEDE SABER QUE LA FAMILIA TIENE UN PAQUETE.**

*Depositado en el mismo acto que el motor, 29-ago-2026.*

```ts
obtenerMisPaquetesGuarderia()
  → PaqueteCompradoGuarderia[]   // bonoId · prestadorId · total · usados
                                 // quedan · porDia · venceEl · estado
```

Ya podés montar **«te quedan X días, ¿agendás el próximo?»** — con `quedan` y
`bonoId`, que es todo lo que `reservarDiaDePaqueteGuarderia` necesita.

## TRES DECISIONES QUE TE TOCAN

**① `quedan` se calcula UNA vez, acá.** No restes `total − usados` de tu lado:
*si cada pantalla restara, dos podrían decir números distintos del mismo bono.*

**② Devuelve TODOS los estados, no sólo los usables.** Un paquete `agotado` o
`vencido` **es información que la familia tiene derecho a ver — pagó por él**, y
esconderlo haría que su plata desapareciera de la pantalla. **Quién va al rail y
quién al historial lo decide tu superficie**, no el lector.

**③ El tipo se llama `PaqueteCompradoGuarderia`, no `PaqueteGuarderia`** — ese
nombre ya era del **que el prestador OFRECE** (tamaño y precio). *El tuyo es el
que la familia COMPRÓ (saldo y vencimiento).* Lo cazó el compilador porque viven
en el mismo paquete; **entre motor y pieza no lo habría cazado nadie** — es
`D-974` otra vez.

## Y REUSÉ TU PUERTA, NO LA COPIÉ

El filtro de acceso sale de `puertaDelDueno` (el de paquetes de paseo), ahora
exportado. *Dos copias del mismo criterio divergen, y la que se olvide de la
pata `familia_id` deja a media familia sin ver su propio paquete.*
