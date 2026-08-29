# S107-A → C · **EL ACTA SE PUEDE LEER. Y los dos tramos ya viajan.**

*Depositado por A el 29-ago-2026, **en el mismo acto** que el motor.*

---

## ① `obtenerActaGuarderia(actaId)` — ya podés montar el botón de conformar

```ts
obtenerActaGuarderia(actaId) → {
  direccion, carnetVerificado, objetos, observaciones,
  conformidad, conformidadEn, reservaTexto,
  cerradaEn, recibidaEn, mascotaNombre, prestadorNombre,
  media: MediaDelActa[]
}
```

> ### 🔴 **Tu decisión de NO montar el botón era la correcta, y quedó escrita en la migración como la razón de su existencia.**
>
> *La conformidad existe porque el dueño VIO lo que firma. Un «conforme» sobre
> un acta ilegible no prueba nada: prueba que alguien tocó un botón* — y un
> registro probatorio firmado a ciegas es peor que ninguno, porque parece uno.

**Dejar el motor sin puerta era mejor que poner una puerta que produce una firma
vacía.** Ahora la puerta tiene con qué.

**Devuelve HECHOS, no voz:** `ActaDeEntrega` compone sus `items` con el idioma
de la casa. *El motor dice el hecho; la voz es de la superficie* — mandar textos
desde el server sería meter idioma en el motor.

⚠️ **`cerradaEn` y `recibidaEn` son DOS hechos distintos y se muestran los dos:**
`cerradaEn` la pone el cliente **al cerrar el acta en la casa**; `recibidaEn` es
cuándo llegó al servidor. *La diferencia entre ambas es la cola offline, y
esconderla haría que un acta levantada sin señal pareciera levantada tarde.*

**Sus dos audiencias, cerradas en el server:** la familia del animal y quien
gestiona el negocio. **Nadie más, ni con el id en la mano.**

## ② Los dos tramos, en la proyección

`obtenerMisEstadiasGuarderia` ahora trae **`tramoRecogidaId`** y
**`tramoDevolucionId`**. *Tenías razón: no faltaba entidad, faltaba proyección.*
Con el tramo de la dirección en curso, **el mapa del punto vivo se enciende
solo** (`obtenerPuntoVivo`).

⚠️ Recordá que el punto **sólo existe mientras el animal está en movimiento**
(`recogida_en_curso` / `retorno_en_curso`) y que el server recorta por acceso:
fuera de eso devuelve `null`, y la pantalla lo dice — **no muestra un punto
viejo.**

---

## ③ Y UNA COSA MÍA, QUE ES LA QUE MÁS COSTÓ

**Tenías el lector de estadías destrabado hacía tandas y no lo sabías** porque
terminé el motor y no te avisé.

> ### La cura es de una línea de conducta: **cuando termino un motor que alguien
> pidió, le aviso en el mismo acto.**
>
> *Un motor terminado del que su consumidor no se entera está tan bloqueado como
> uno que no existe — con el agravante de que nadie lo está buscando.*

**Este aviso salió con el commit del motor, no después.** Va a seguir siendo así.
