# S111-B → A · ⑤ curado en la pieza — y ⚠️ NO cortés los APK todavía

**Rama:** `pista/s111-b` · **HEAD:** `7b1ec509aeb2d23afc61ae265ab44d9fb0f4901f`
**ALCANCE (L-463):** `packages/ui/src/components/ActaDeEntrega.tsx` ·
`packages/ui/src/gallery/TokenGallery.tsx` · este buzón.
**Cero DDL · cero `apps/` · cero migraciones.**

## LO CURADO

Murió `if (items.length === 0) return null`. **El checklist es una SECCIÓN del
acta, no su condición de existencia** — sacado el carnet de la devolución (§4 +
hallazgo ⑤), la pieza entera desaparecía llevándose media y observaciones,
**sin error y sin aviso**.

No lo reemplacé por un guard más fino, deliberadamente: **el acta no se
auto-oculta nunca.** Montarla es de la pantalla. Cada sección se omite sola.

Medido antes de tocar: **los dos consumidores vivos pasan hoy al menos un ítem**
⇒ no aparece un acta vacía donde antes no había nada.

## 🔴 POR QUÉ ⑤ NO ESTÁ CERRADO, Y POR QUÉ RETENDRÍA LOS APK

Midiendo el consumidor encontré **la segunda puerta al mismo defecto**:
`apps/cliente/src/app/guarderia/[estadiaId].tsx:384-390` compone el ítem
`carnet` **sin condicionar por dirección** — el único `direccion` de ese bloque
es la prop, no una condición.

⇒ **Ese lector nunca produce un checklist vacío**, así que mi cura no lo alcanza:
**en devolución va a seguir dibujando la casilla del carnet**, que es
exactamente lo que el founder rechazó. **Mi cambio es necesario y no
suficiente.** La cura es de una línea y es de C (`apps/*`): que el ítem entre
sólo si `direccion === 'recogida'`.

**Se lo mandé a C.** Lo levanto acá porque **vos sos quien corta los APK** y el
modo de falla es silencioso: no rompe nada, dibuja de más, y se ve como si
funcionara. *Un APK cortado con ⑤ a medias se lee como ⑤ cerrado.*

## LO QUE EL ROJO PRUEBA Y LO QUE NO

Fue **estático y ejecutado**: la regla vieja existía literal en `:163` y ya no
existe como código. **Que ahora SE DIBUJE es visual** y vive en la galería
(caso `devolucion` + `items={[]}`) — ningún compilador lo ve.

⚠️ Y una para el registro, porque me pasó a mí: mi primer instrumento dio **rojo
falso contra mi propia lápida** — el `grep` leyó el comentario que cita la línea
vieja como si fuera código (**L-170**). Curé el instrumento, no el archivo.

**Gates:** typecheck 0 · `verify:contrast` 391/0 · `verify:diseno` VERDE 62.
