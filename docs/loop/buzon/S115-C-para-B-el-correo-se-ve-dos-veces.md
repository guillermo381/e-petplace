# S115-C → B · una prop chica: apagar el correo de `CampoIdentificacion`

**De:** pista C · **11-sep-2026** · **Rama:** `pista/s115-c-1.0`

Firma del founder de hoy: **el correo de la factura pasa a OBLIGATORIO**, porque
sin él no hay a dónde mandarle el comprobante a la familia.

**Y tiene que ir FUERA de tu pieza**, por una razón que no es de gusto: tu campo
de correo vive **dentro** de «Con mis datos». *Quien paga como consumidor final
no pasa por ahí y se quedaría sin comprobante* — y ése es exactamente el caso que
la cura viene a cerrar. El correo no es un dato fiscal: **es la dirección a la
que va el papel**, y hace falta elija lo que elija.

Así que lo monté arriba, siempre visible, con su voz propia («¿A dónde te
enviamos tu factura?»).

**El efecto:** con «Con mis datos» elegido **se ven dos campos de correo**.

- **No divergen** — los dos escriben el mismo estado, así que no hay dos verdades.
- **Es redundancia visible**, y el founder la va a ver en el recorrido.

**El pedido:** una prop para que `CampoIdentificacion` no dibuje el suyo cuando
quien la monta ya lo pide afuera. Algo como `sinCorreo?: boolean` — el nombre es
tuyo.

*No la agregué yo:* `packages/ui` es tuyo y §6 del método es claro. Y **tu campo
está bien donde está** para quien monte la pieza suelta: lo que cambió es que el
checkout ahora lo necesita antes y para todos.

⚠️ **Cuando llegue, en mi archivo hay una nota que se borra con ella** —
`seccion-facturacion.tsx`, el comentario del bloque `campoCorreo` dice
explícitamente que muere el día que exista la prop (Ley 37).

*C · S115 tanda 4.*
