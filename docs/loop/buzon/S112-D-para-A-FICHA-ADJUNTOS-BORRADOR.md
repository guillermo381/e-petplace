# S112-D · BORRADOR DE FICHA — el adjunto de imagen del hilo de adopción

> **De:** pista D · **Para:** **A**, que deposita.
> 🔴 **SIN NÚMERO, a propósito.** `D-998` se tomó **dos veces el mismo día** en
> S111 con dos pistas midiendo a la vez. **El número se saca con el comando del
> canon, en el momento de depositar**, jamás de un texto que envejeció:
> `grep -o "D-[0-9]\{3\}" docs/DEUDAS_CANONICAS.md | sort -u | tail -1`
>
> **Fuera del alcance de S112.** Esto es el ítem 14 y no se construyó.

---

#### D-XXX — 🟡 EL ADJUNTO DE IMAGEN DEL HILO DE ADOPCIÓN NO EXISTE EN NINGUNO DE LOS TRES LUGARES

**Qué se pidió (ítem 14):** que en el hilo de una solicitud se pueda adjuntar una
imagen, **sólo del lado del publicador**.

**Qué hay hoy — medido contra la base viva el 1-sep-2026, cada cero con su
control positivo** *(sin el control, un 0 no distingue el mundo del
instrumento — y en esta misma sesión un `0` de buckets resultó ser un worktree
sin linkear)*:

| dónde tendría que estar | adopción | control positivo |
|---|---|---|
| columna de adjunto en `adopcion_mensaje` | **0** | **2** en `evento_archivo_adjunto` |
| parámetro en `responder_solicitud_adopcion` | **0** — la firma es `(p_solicitud_id uuid, p_cuerpo text)` | — |
| bucket **privado** de adopción | **0** | **8** buckets privados en la casa |

⇒ **No es un guard que frene al adoptante: es que la puerta no está
construida.** Y así lo decidió A al escribir el motor, con su razón:
*«sin bucket la puerta no existe, en vez de existir abierta»*.

> ### 🔴 NO SE PUDO PRODUCIR EL ROJO «el adoptante no adjunta», y eso ES el hallazgo.
> Una puerta que no existe **no se puede probar cerrada**. Se reporta la
> ausencia; **jamás un verde**. *Un arnés que da verde sobre una compuerta que
> no existe es exactamente el defecto que `L-438` nombra.*

---

### 🔴 LA TRAMPA, Y ES LO QUE MÁS IMPORTA DE ESTA FICHA

**Existe `adopcion-fotos`, y es `public: true`.** Es la vidriera — las fotos del
animal publicado, que tienen que ser públicas para que alguien lo vea y postule.

**Es el único bucket de adopción que hay.** ⇒ Quien construya el adjunto va a
encontrarlo, va a ver que «ya existe el bucket de adopción», y **las imágenes de
una conversación privada entre dos personas van a quedar en un bucket público**.

> ### El error no va a ser descuidado: va a ser razonable. Por eso la ficha existe antes que el trabajo.

**El adjunto va en bucket PRIVADO NUEVO. Jamás en `adopcion-fotos`.**

---

### QUÉ HACE FALTA CUANDO ENTRE — las cinco piezas, en orden

1. **Bucket privado nuevo** (`adopcion-hilo`, o el nombre que la casa elija), con
   límite de tamaño y `mime` acotado a imagen. *La casa ya tiene 8 privados: el
   molde existe, no se inventa.*
2. **Policies de Storage con el MISMO gate que la RLS del hilo** —
   `_user_publico_esta_publicacion` para escribir, y las **dos** partes para
   leer. 🔴 **El gate es la PUBLICACIÓN, no el refugio** (§5: *«sólo lo ve el
   publicador del ANIMAL solicitado»*): gatear por organización ensancha por
   encima de la letra.
3. **Columna en `adopcion_mensaje`** (path, no URL — la casa ya migró a paths en
   S47) **+ parámetro en `responder_solicitud_adopcion`**, con el guard de
   **sólo el publicador** *en el cuerpo de la RPC*, no en la pantalla.
4. **El arnés que hoy no se puede escribir:** el adoptante intenta adjuntar y
   **rebota con código propio**; el publicador adjunta y **entra**. *Ese par es
   el que hoy no existe — y su ausencia es toda esta ficha.*
5. **La purga de los 90 días tiene que alcanzarlo.** Si el hilo se anonimiza y
   **el archivo queda en Storage**, la identidad vuelve por la puerta de atrás:
   una foto es un dato personal. ⚠️ Y la casa ya tiene el precedente exacto —
   `D-731`: *borrar la fila dejaba el objeto vivo en Storage para siempre*, y se
   curó con una **cola de borrado + barredor**, porque **Postgres no puede
   borrar el blob**. **Ese mecanismo ya existe: se reusa, no se reinventa.**

---

### DISPARO

**Cuando el founder pida el adjunto**, o cuando alguien vaya a construirlo.
**No antes:** hoy `C` tiene instrucción explícita de **no montar botón de
adjuntar**, y la letra §5 **no lo nombra** — el adjunto fue propuesta mía en el
diseño de S111, **votada y no firmada**.

⚠️ **Y si entra, entra con su purga (pieza 5) en la misma tanda.** *Un adjunto
que sobrevive a la anonimización deshace en silencio la regla de los 90 días que
el founder acaba de firmar.*
