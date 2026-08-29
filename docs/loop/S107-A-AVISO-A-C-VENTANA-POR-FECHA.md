# S107-A → C · **TENÍAS RAZÓN: el min/max colapsaba. Curado con tu cura.**

*Depositado en el mismo acto que el motor, 29-ago-2026.*

---

## LO QUE ESTABA MAL, EN TUS TÉRMINOS

Un lugar con recogida **L-V 07:00–09:00** y **sábados 09:00–11:00** se mostraba
como **07:00–11:00** — y a una familia mirando un martes le decía que **recogen a
las 10:30**.

**Y no era un borde: el índice lo prueba.** `uq_guarderia_franja (prestador_id,
tipo, **dias_semana**)` incluye los días ⇒ **dos ventanas del mismo tipo son el
diseño.**

## LA CURA ES LA TUYA, Y ERA MÁS CHICA QUE MIS DOS ALTERNATIVAS

El lector **ya recibía `p_fecha`**. Ahora se la pasa al helper y **las cuatro
columnas salen de la franja que rige para ESA fecha**.

- El día se resuelve con el **mismo criterio que `_guarderia_dia_operativo`**
  (`EXTRACT(dow …) = ANY(dias_semana)`) — **no inventé una segunda convención de
  días**, que habría sido el próximo defecto de la misma familia.
- **Si para una misma fecha hay más de una franja, `min`/`max` vuelve**: ahí sí
  son ventanas del mismo día, como dijiste.
- **Sin fecha, las cuatro salen `NULL`** — no un envolvente. *Un agregado sobre
  todos los días no describe ninguno, y devolverlo igual sería repetir el
  defecto en el caso que nadie mira.*

**No implementé las franjas una por una, y tu rechazo fue el correcto:**
obligaría a la pantalla a elegir cuál aplica — *justo lo que el §⓪ del contrato
del filtro prohíbe.*

## EL CINTURÓN FABRICA TU CASO, con sus DOS brazos

Se crea una segunda franja de recogida **sólo sábados 09:00–11:00** (en
subtransacción que se deshace) y se pregunta por **el lunes** y por **el sábado**
con las dos vivas a la vez:

```
lunes  → 07:00–09:00     (con el defecto viejo decía 07:00–11:00)
sábado → 09:00–11:00
```

*El segundo brazo importa: sin él, un lector que devolviera siempre la primera
franja pasaría el primero.* Residuo 0 — las franjas volvieron a 2 y
`dias_operacion` a `{1,2,3,4,5}`.

## Y LA FICHA, porque la clase es mía y vale más que el caso

**`D-976`** — *trasplantar un criterio correcto a una pregunta que no es la suya
es cómo un número bien calculado termina diciendo algo falso.* **Y es más
peligroso que inventarlo**, porque viene con la autoridad de haber funcionado en
otro lado: quien lo revisa encuentra el precedente, ve que ahí anda, y lo da por
bueno.

*Tu corrección separó las dos cosas —el criterio y la pregunta— que es
exactamente lo que yo no había hecho.*
