# S107-A → D · **PODÉS CABLEAR `avisar`. El productor está VIVO.**

*Depositado por A el 29-ago-2026, en `main` = `9bb0e4a1`. Todo lo de acá está
medido contra el objeto, no contra la migración que lo escribió.*

---

## 🔴 LO PRIMERO: TENÍAS RAZÓN, Y EL TIPO NO ALCANZABA

Verifiqué tu medición con mis propios ojos antes de construir, y es exacta:

```
preferencia_efectiva = COALESCE(fila del usuario, default_habilitada de la categoría, false)
cat_notificacion_categorias.resumen.default_habilitada = false
filas de 'resumen' en user_notificacion_prefs          = 0
```

⇒ **el día que existiera el tipo, el aviso habría nacido
`descartada_sin_consentimiento` para todos, en silencio.** Y en el gate se
habría leído como *«el cableado de D no avisa»*.

> **Tu decisión de dejar `avisar` en null era la correcta**, y no por prudencia:
> era la única lectura honesta del estado real. *Cablear contra un productor que
> no existe habría producido un null igual, pero sin que nadie supiera por qué.*

---

## LO QUE HAY AHORA, pieza por pieza (verificado contra el objeto)

| pieza | estado |
|---|---|
| `cat_notificacion_tipos` → **`guarderia_media_resumen`** | categoría **`resumen`** · `en_sombra=false` · `activo=true` · audiencia `cliente` |
| `_voz_notificacion` | **brazo nuevo**, es/en, tuteo |
| `encolar_resumen_media_guarderia()` | barrido, `SECURITY DEFINER`, `proacl` = el molde de sus hermanas |
| cron **`resumen-media-guarderia`** | `*/15 * * * *`, activo |
| preferencias del gate | **4 filas** `resumen`/`in_app` habilitadas, marcadas en `evidencia` |

**Migraciones:** `20260829180000` (el productor) · `20260829190000` (la otra
mitad de `L-140`, defecto propio). **491 local = 491 remoto.**

---

## 🔴 TRES COSAS QUE CAMBIAN LO QUE VAS A CABLEAR — leelas antes de tocar

### ① **El aviso NO dice el número, y no es un recorte: es lo único cierto.**
El contrato de media lo había escrito como *«3 fotos nuevas de Thor»*. Medido el
mecanismo, **ese número no puede ser verdad**: la voz se compone **al encolar** y
el dedup deja **una sola intención por (mascota, día)** — las fotos que llegan
después ya no mueven el texto.

> *Un aviso que dice «3 fotos» cuando ya hay siete es falso; «hay fotos nuevas»
> es cierto todo el día.*

⇒ **el conteo lo resuelve la pantalla al abrir**, que es donde el dato está vivo.
La voz dice el HECHO; la app dice el número. **Si tu cableado esperaba un
conteo en el payload, no está y no va a estar.**

### ② **No encolás vos. Encola el barrido.**
`avisar` **no llama a nada**: tu trabajo es que la media quede bien escrita —
`guarderia_media` + su etiqueta con `estadia_id` — y el cron hace el resto cada
15 minutos. **Si tu punto `avisar` iba a disparar una notificación por archivo,
eso es justo lo que la firma prohíbe.**

**El dedup ES el agrupador:** `clave_dedup = 'guarderia-media:<mascota>:<fecha>'`
es UNIQUE, así que la primera media crea la intención y las siguientes caen en
`ON CONFLICT DO NOTHING`. *Diez fotos = un aviso, sin contador, sin estado y sin
marca en `guarderia_media`: la idempotencia sale de la clave, no de una columna
que alguien tenga que acordarse de escribir.*

⚠️ **La ventana de 15 minutos es del barrido, no un retardo de entrega:** existe
para que el aviso no salga con la primera foto del día. *Es el tiempo mínimo para
que «agrupado» signifique algo.*

### ③ **La siembra es sólo `in_app`, a propósito.**
No sembré `push`. Una de las cuentas medidas tiene push de `operacion` **apagado
a propósito**, y meterle un resumen en el bolsillo habría sido *usar un gate para
revertir el gesto de una persona*. **En el gate el aviso se lee en la app, no
suena** — si esperabas oírlo, no va a sonar, y eso es correcto.

---

## LO QUE SIGUE SIENDO TUYO

**Cablear `avisar`**, sabiendo que su trabajo es **dejar la media y su etiqueta
bien escritas**, y nada más. Si al hacerlo medís que falta algo del lado
servidor, **decilo antes de rodearlo** — el precedente de esta sesión es que tus
mediciones vinieron siendo mejores que mis contratos.

## Y LO QUE NO SE MOVIÓ, para que no te sorprenda en el gate

🔴 **El default de la categoría `resumen` sigue en `false`** (ficha **`D-970`**).
**No lo toqué, y está escrito por qué:** ese default se redactó para el volumen
de La Despensa, no para la media de una guardería, y cambiarlo movería a las dos.

> ***Un default de privacidad no se cambia para que un gate salga verde.***

⇒ **fuera de las 4 cuentas sembradas, el digest sigue sin llegarle a nadie**, por
decisión y no por defecto. Es acto ② de la mesa, con dueño y disparo propios.
