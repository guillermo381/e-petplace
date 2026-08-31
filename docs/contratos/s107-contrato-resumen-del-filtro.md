# CONTRATO · EL RESUMEN DEL FILTRO — cuántos · desde cuánto · **por qué no**

> **Publicado por A el 29-ago-2026 apenas existió** (C tenía la pantalla
> bloqueada sin esto). **Ya está en la base y en `packages/api`.**

## LA FORMA

```ts
obtenerResumenGuarderias({ modalidad, fecha, mascotaId, lat?, lon? })
  → ResultadoWrapper<{
      cuantos: number
      precioDesde: number | null
      causa: CausaSinGuarderias | null
    }>
```

**Una sola llamada con las tres cosas.** *Tres llamadas darían tres verdades de
tres instantes distintos.* Con esto la pantalla pinta **«desde $X»**, habilita o
no el botón, y **dice por qué no puede**.

🔴 **`cuantos > 0` ⟺ `causa === null`.** Nunca vienen los dos.

---

## ① EL PRECIO SE CALCULA **DESPUÉS** DE FILTRAR

`precioDesde` es el mínimo **entre los lugares que de verdad van a aparecer en
la lista** — ya pasados por día, cupo, radio y especie. **Sale del lector
publicado, no de una copia de sus predicados**: *si acá se reimplementaran, el
resumen y la lista podrían discrepar, que es justo lo que este contrato viene a
evitar.*

⚠️ **`null`, jamás `0`.** *Un cero se lee como GRATIS*; acá significa «no hay
ninguno del que sacar un precio».

---

## ② LA CAUSA SALE DE UNA CASCADA MEDIDA, no de una adivinanza

Se **relaja el filtro por etapas y se mira dónde cae a cero**:

| etapa | qué se afloja | si cae acá |
|---|---|---|
| ① | sólo especie | **`especie_sin_oferta`** |
| ② | + modalidad | **`nadie_vende_esa_modalidad`** |
| ③ | + cobertura | **`sin_cobertura`** |
| ④ | + día operativo y cupo | **`sin_cupo_ese_dia`** |

*Un «no hay» que no distingue el día de la especie manda a la familia a probar
combinaciones al azar — y a concluir que el producto no sirve.*

**`causa_indeterminada` existe y se devuelve DECLARADA**, jamás una causa
inventada. Es un estado que no debería alcanzarse; *un lector que miente sobre
el porqué es peor que uno que dice «no sé»* — manda a cambiar lo que no era el
problema.

### ⚠️ Dos bordes que la pantalla tiene que saber

- **`sin_cobertura` sólo aparece si mandaste `lat`/`lon`.** Sin ubicación no hay
  filtro geográfico, así que esa etapa no descarta a nadie y **no puede ser la
  culpable**. *Nombrarla igual sería culpar a un filtro apagado.*
- 🔴 **La víspera NO es una causa: es un REBOTE.** Con `fecha <= hoy` esto lanza
  **`fecha_no_ofertable`**. *«Hoy no se puede reservar» no es «no hay lugares»* —
  disfrazarlo de causa haría que la pantalla ofrezca cambiar de día cuando el
  problema es que pidió hoy.

---

## ③ VERIFICADO — el cinturón discrimina la CAUSA, no el conteo

**Camino feliz:** hay lugares, hay precio, **no hay causa**.
**Y el brazo que lo vuelve una prueba:** se apagó el precio mensual del único
lugar publicado (en subtransacción que se deshace) y el resumen devolvió
`cuantos = 0` · `causa = nadie_vende_esa_modalidad` · `precioDesde = null`.

> *Sin ese segundo brazo, el verde del primero diría «funciona» sobre un lector
> que podría estar devolviendo siempre la misma causa.*

Aurora quedó intacta (`mensual = 75`), residuo 0.

---

## ④ LO QUE **NO** HACE

- **No reserva ni compromete cupo.** Mirar no reserva.
- **No devuelve la lista** — para eso está `obtenerGuarderiasDisponibles`, con
  el mismo criterio y otra forma de salida.
- **No dice qué hacer con la causa**: el texto y el camino son de la pantalla.
  *El motor dice el hecho; la voz es de la casa que lo muestra.*
