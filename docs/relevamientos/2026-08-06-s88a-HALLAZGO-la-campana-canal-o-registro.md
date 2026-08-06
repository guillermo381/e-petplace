# S88-A · EL PAR DEL ENCENDIDO — y la pregunta que destapó

> **El `UPDATE` está aplicado** (`20260806020000`). El par NO cerró en verde, y
> lo que encontró es una **decisión de producto**, no un defecto de nadie.

---

## El par, con sus dos caras

```
ANTES  · in_app SIN transporte  →  canal elegido = EMAIL · 0 en la campana   ✅
DESPUÉS· in_app CON transporte  →  canal elegido = EMAIL · 0 en la campana   🔴
```

**El flip no cambió la selección.** Y el literal dice por qué:

```sql
SELECT ch.codigo INTO v_elegido
  FROM cat_notificacion_canales ch
 WHERE ch.codigo = ANY(v_canales)
   AND ch.es_piso = false          -- ⬅ EXCLUYE `in_app` SIEMPRE
   AND ch.transporte_vivo
 ORDER BY ch.orden LIMIT 1;
v_elegido := COALESCE(v_elegido, 'in_app');   -- solo como ÚLTIMO recurso
```

> ### **`in_app` está EXCLUIDO de la selección por ser EL PISO.**
> **⇒ `transporte_vivo` en `in_app` es INERTE para elegir**: gana solo cuando
> ningún otro canal tiene tren. *La ley de secuencia protegió un flip que no
> elige nada — y eso no la invalida: el orden era correcto igual, porque lo que
> protegía era la PANTALLA, no la selección.*

**Y no es un defecto de diseño: era coherente.** Cuando `in_app` no tenía
transporte, el piso era literalmente *«donde caen las cosas cuando no hay otra
vía»*. Ahora que tiene pantalla, la pregunta cambió de forma.

---

## 🔴 LA PREGUNTA QUE EL FOUNDER DESTAPÓ CON SU PROPIO USO

Él programó una cita y **no le llegó nada**. Con `in_app` encendido, **seguiría
sin llegarle** — y por dos razones distintas que conviene no mezclar:

**① El aviso que espera NO TIENE PRODUCTOR.** Medido:

| tipo | sombra | voz | productor |
|---|---|---|---|
| `cita_confirmada` | sí | 🔴 | **— SIN PRODUCTOR** |
| `cita_recordatorio` | sí | 🔴 | **— SIN PRODUCTOR** |
| `cita_solicitada` | sí | 🔴 | **— SIN PRODUCTOR** |
| `procedimiento_agendado` | sí | ✅ | `fijar_fecha_procedimiento` |

> **Sacarlo de sombra no haría nada: nadie lo produce.** *Y por eso no lo saqué
> —L-207 pedía voz firmada, y acá falta algo más grande que la voz: falta el
> hecho.* **Es CONSTRUCCIÓN, y de las que el founder acaba de pedir con su
> propio dedo.**

**② Y aunque existiera, iría por CORREO y la campana no lo mostraría.**

```
entregadas en total ........ 13
visibles en la campana ..... 12
ENTREGADAS E INVISIBLES ..... 1     ← y va a crecer con cada correo
```

*Ese 1 es de hoy. Cada aviso que salga por mail suma otro.*

---

## ⚖️ LA DECISIÓN, QUE ES DE MESA: ¿la campana es un CANAL o es el REGISTRO?

| lectura | qué muestra | consecuencia |
|---|---|---|
| **CANAL** (lo construido) | solo lo entregado **por** `in_app` | fiel al literal de la lámina (*«los avisos entregados por canal in_app»*), **y deja afuera todo lo que viaja por mail** |
| **REGISTRO** | todo lo entregado, **por donde sea** | es lo que una campana normalmente ES, y lo que la expectativa del founder sugiere |

**Yo construí CANAL, y fue la lectura literal de la lámina.** *Declaro que pudo
ser la lectura equivocada: una persona que recibe un correo y después abre la
app espera encontrarlo ahí — el canal es cómo le llegó, no dónde queda.*

**La cura, si la mesa elige REGISTRO, es de una línea en el lector** (sacar el
filtro por `canal_elegido`) **y el fixture ya prueba las dos formas.**

> **Lo que NO hago: elegir.** *La campana como registro cambia qué es la pieza,
> y eso es letra.*
