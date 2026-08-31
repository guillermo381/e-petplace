# FICHA LISTA PARA DEPOSITAR · `D-983`

> **Para A:** texto verbatim para `DEUDAS_CANONICAS.md`. Número verificado por
> grep contra el objeto (el más alto era `D-982`, tuyo).
> **Firma del founder, 30-ago-2026:** su casa es Cuenta → Preferencias, y **no
> se construye en esta sesión.**

---

#### D-983 — 🟡 LA AUTORIZACIÓN DE IMAGEN SE QUEDÓ SIN SUPERFICIE, Y SU ESTADO REAL ES *NADIE PUEDE PERMITIRLA*

**Qué pasó.** La pantalla de términos de guardería tenía **dos casillas**: la
aceptación de los seis documentos y, separada y rotulada «Opcional», la
autorización para **publicar fotos de la mascota**. Firma del founder: *«la
pantalla de términos pide dos checks y debe ser uno solo»* ⇒ se retiró la
segunda. **La aceptación quedó en una; la autorización se quedó sin ningún
control en toda la app.**

**Estado real, medido — no «pendiente», sino esto:**
- `aceptar_documentos_guarderia` tiene `p_redes_autorizadas boolean DEFAULT false`.
- La pantalla **ya no lo manda**, así que toda familia queda en `false`.
- ⇒ **fail-closed: nadie publica nada, y no hay dónde permitirlo.**

*No hay riesgo de que se publique una foto por accidente. Lo que no existe es
el sí.*

---

### 🔴 LA DISTINCIÓN QUE SE VA A PERDER, Y ES LA RAZÓN DE ESTA FICHA

> **Las fotos y clips del DURANTE que sube la guardería son PRIVADAS y van al
> hilo de la familia. Eso NO necesita esta autorización y NO está bloqueado.**
>
> **Lo que esta autorización gobierna es publicarlas FUERA.**

⚠️ *Quien retome esto sin la distinción va a leer «la autorización de imagen
está en false para todas las familias» y va a concluir que la media del durante
está trabada.* **No lo está**: el durante funciona, la familia ve las fotos de
su mascota, y el único acto que no tiene camino es el de sacarlas del hilo.

*Es exactamente la clase de dato que se lee bien y se entiende al revés — por
eso la distinción va en la ficha y no en un comentario.*

---

**Dueño:** producto · **Disparo:** cuando Cuenta → Preferencias abra su pasada.
**Dónde va:** con las demás preferencias de la familia, **no** en un flujo de
reserva — *no es un término que se acepta para poder reservar: es una
preferencia que se cambia cuando uno quiere.*

**Lo que NO hay que hacer:** devolverla a la pantalla de términos. Ahí volvería
a ser una segunda casilla, que es de lo que salió.
