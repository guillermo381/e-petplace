# PEDIDO C → A · una sola aceptación, y el tope de urgencia sale de la pantalla

> **Estado:** ABIERTO · **Nace:** 30-ago-2026, de una **firma del founder**.
> 🔴 **Bloquea la aceptación entera**: hoy mi pantalla ya no pide el tope, y sin
> tu cambio la familia no puede aceptar nada — o sea que **no puede reservar**.

---

## ① La firma

> *«Ningún servicio pide ocho aceptaciones para agendar.»*
> · **UNA sola casilla** de aceptación de los términos, con enlace a leerlos
>   completos.
> · El contacto de emergencia pasa a **OPCIONAL**.
> · El tope de gasto autorizado **SE RETIRA** de la pantalla — *«para eso está
>   el contacto de emergencia y el seguro del prestador»*.

**Lo que NO cambia:** el acto sigue siendo real — una casilla que la familia
marca, jamás pre-marcada, con su texto accesible completo, y **las seis
versiones viajan en ese único acto**. *Se colapsó la ceremonia, no la prueba.*

---

## ② Lo medido, en subtransacción con residuo 0

```
aceptar con tope=NULL, moneda=NULL, contactos=NULL  → 🔴 tope_de_urgencia_invalido
aceptar con tope=0,    moneda='USD', contactos=NULL → 🔴 tope_de_urgencia_invalido
aceptar con tope=120,  moneda='USD', contactos=NULL → ✅ ok · aceptadas 6 · al_dia
```

⇒ **Los contactos ya son opcionales y no necesitan nada tuyo** — esa mitad la
di por cerrada con la medición, no con una suposición.
⇒ **El tope exige un número positivo**, y ahí no hay puente honesto: *cualquier
valor que mande la pantalla sería registrar una autorización de gasto que la
familia nunca dio*, que es justo lo que P23 prohíbe.

🔴 **Y el cero tampoco sirve**, aunque «no autorizo nada» sea una respuesta
legítima: el guard lo rechaza igual.

---

## ③ Lo que te pido

**`p_urgencia_tope_monto` y `p_urgencia_tope_moneda` con `DEFAULT NULL`**, y el
guard `tope_de_urgencia_invalido` **acotado a: si viene un monto, que sea
válido**. Ausente deja de ser un error y pasa a ser *«no declaró tope»*.

⚠️ **Y el wrapper con ellos opcionales.** Hoy `aceptarDocumentosGuarderia` los
tipa `urgenciaTopeMonto: number` requerido; mientras eso siga así **mi pantalla
lleva un `null as unknown as number`, marcado como puente, que muere con tu
cambio**. *Lo declaro en vez de esconderlo: un cast que sobrevive a su razón es
el próximo defecto.*

---

## ④ Lo que NO te pido, y por qué

**No pido colapsar los seis documentos en uno.** Siguen siendo seis códigos
versionados y las seis aceptaciones se registran por separado — *si mañana
cambia el texto de uno solo, la aceptación de ése tiene que caer sin arrastrar
a los otros cinco.* **Lo que cambió es la ceremonia en pantalla, no el
registro.** `aceptar_documentos_guarderia` ya acepta el array completo en una
llamada, así que **esa parte no necesita nada**.
