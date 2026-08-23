# S104-D · CORRECCIÓN A MI PROPIO PARTE — «D-628 al idioma del usuario» NO es lo que entregué

**23-ago-2026 · pista D.** Cero cambios. **Esto corrige una afirmación mía que ya
está en manos de A y puede entrar al acta.**

---

## ⓪ LO QUE DIJE Y POR QUÉ ESTABA MAL

Le dije a A, textual: *«del lado del correo, D-628 no tiene nada vivo».*

**Medí contra la vara equivocada.** Medí *«¿está en español?»*. La orden de mesa
pide otra cosa, y está escrita en `ORDEN_ARRANQUE_MESA_105.md:253`:

> **«D-628 al idioma del usuario.»**

**Yo entregué «al español», que no es «al idioma del usuario».** Las apps son
bilingües es/en desde S51 por decisión del founder (*«es TUTEO NEUTRO + en desde
el día 1»*). ⇒ **un usuario en inglés hoy recibe el correo en español**, que es
el mismo defecto de D-628 con el idioma invertido.

*Lo encontré releyendo la orden después de que A corrigiera otra línea de la
misma orden. No lo encontró ningún gate: lo encontró volver a la vara.*

---

## ① ¿SE PUEDE? — SÍ, PERO NO CON LO QUE HAY

**Medición ①, la plataforma** (doc oficial de Supabase): las plantillas exponen
`{{ .Data }}` = `auth.users.user_metadata`, **y aceptan condicionales Go**
(`{{ if eq .Data.X "..." }}`). **No hay soporte multi-idioma nativo: una sola
plantilla por tipo.** ⇒ branchear es la única vía dentro de la plantilla.

**Medición ②, nuestros datos — y es la que cierra la puerta:**

| | |
|---|---|
| Usuarios en `auth.users` | **165** |
| Con `idioma` en `user_meta_data` | **0** |
| Con `locale` o `lang` | **0** |
| Claves que sí hay | `avatar_url · created_by_walkin · email · email_verified · full_name · iss · name · nombre · phone_verified · picture · provider_id · prueba · siembra · sub` |
| Dónde vive el idioma de verdad | **`user_preferencias`** — 4 filas, **todas `es`** |

⇒ **La plantilla puede branchear, pero no tiene por qué dato hacerlo: el idioma
vive en una tabla que la plantilla no puede leer.**

---

## ② EL ALCANCE REAL, PARA QUE ESTO NO SE TRATE COMO URGENCIA

**Hoy el costo medido es CERO:** de las 4 personas con preferencia guardada, las
4 son `es`; las otras 161 no tienen fila y caen al default, que también es
español. **No hay ni un solo usuario medible recibiendo el idioma equivocado.**

⇒ **Es deuda futura, no daño presente.** *Lo digo así para que nadie pare una
tanda por esto — y para que nadie lo archive como cerrado, que es el error que
D-628 ya cometió una vez.*

---

## ③ LAS TRES SALIDAS, CON SU COSTO

**(a) Espejar el idioma en `user_metadata` y branchear las 6 plantillas.**
Barato de config, **caro de mantener**: crea una **segunda verdad** del idioma
que hay que sincronizar con `user_preferencias` en cada cambio. *Esta casa ya
pagó ese patrón — `profiles.email` divergió 17 filas por exactamente eso, y A lo
está curando esta misma sesión con un trigger de espejo.* **Voto en contra.**

**(b) `Send Email Hook` — que el correo de auth lo mande NUESTRA función.**
Supabase delega el envío a una edge function propia, que **lee
`user_preferencias`** y compone. **Una sola verdad del idioma**, y converge con
`despachar-correo`, que ya existe y ya sabe hablar en dos idiomas. Es más
trabajo, y **es la respuesta correcta**. **Voto a favor, sin fecha.**

**(c) Declarar el alcance: español, y decirlo.** Cierra la brecha entre lo que la
orden pide y lo que hay, **sin construir nada**, hasta que exista un usuario en
inglés. *Es lo honesto mientras (b) no tenga fecha.*

---

## ④ QUÉ CAMBIA EN EL ACTA

| Antes decía (yo) | Debe decir |
|---|---|
| «D-628 no tiene nada vivo del lado del correo» | **«D-628 quedó en ESPAÑOL, no al idioma del usuario. La mitad que falta está medida y su costo hoy es cero (0 usuarios en inglés).»** |

**Lo que sí sigue cerrado y no se toca:** el remitente ajeno murió, el destino
del enlace ya no es el portal viejo, el flujo por código funciona de punta a
punta (`satorilatam` lo completó hoy en 34 segundos). **Eso está medido y sigue
siendo cierto.** Lo que no está es el idioma.
