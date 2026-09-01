# S111-D · REPORTE FINAL — la mensajería

> **De:** pista D · territorio `packages/mensajeria` (nuevo)
> **Rama:** `pista/s111-d` · **sha** `90359608` · **base** `main` `9443da56`
> **Cierre:** backlog de los cuatro ítems **agotado**; lo que resta está
> **estacionado**, no pendiente. **Cero publish, cero OTA, cero llave de
> `app_config`, cero texto legal, cero DB escrita por mí.**

---

## ① CONSTRUIDO, y dónde

**`packages/mensajeria`** — paquete nuevo, **dominio PURO**: sin Supabase, sin
React, sin i18n. Devuelve **códigos**, jamás frases. Se ejerce **sin levantar
app, sin sesión y sin red**, que es lo que lo vuelve verificable.

| archivo | qué es | fuente firmada |
|---|---|---|
| `solicitud.ts` | los 4 estados y sus transiciones **como dato**; los rechazos hablan (`estado_terminal` · `rol_no_puede` · …) | `LETRA_ADOPCION` §5 |
| `silencio.ts` | el reloj de 5 días, **derivable** de tres datos que el motor ya tiene | §5 |
| `privacidad.ts` | quién ve qué; el gate es la **publicación**, no el refugio | §5 |
| `padrinazgo.ts` | las 3 causas de fin; todas detienen el cobro | §6 |
| `cola.ts` | la cola de envío: doble toque, fallo, reintento | mecánica |
| `avisos.ts` | hecho del vertical → intención de notificación | `MODELO_NOTIFICACIONES` §3 + S87 |

**`scripts/verify-mensajeria.mjs`** + `npm run verify:mensajeria` — **53/53**.
🔴 **Corre su AUTO-PRUEBA antes de contar un verde:** siembra un rojo conocido y
**si no lo detecta sale con código 2**, porque *«no pude medir» no es «no
encontré nada»*. Los tres colores verificados **sin pipe** (`L-191`):
rojo sembrado → 1 · sano → 0 · auto-prueba rota → 2.

**Documentos** (buzón, para que A los ubique):
- `S111-D-para-todos-DISENO-MENSAJERIA.md` — el diseño, **publicado antes de
  construir**.
- `S111-D-para-A-CONTRATO-DB.md` — tablas, RLS, 4 RPC con firmas y errores
  tipados, el barrido del reloj, 6 tipos de notificación. **Autocontenido.**

### La decisión de diseño que conviene que quede en el canon

**El canal cuelga de la SOLICITUD, y eso disuelve la contradicción que S110-D
dejó abierta** en vez de pelearla. `PORTAL_PRESTADOR` §6.4.7 dice *«sin servicio
activo, no hay canal»* y refugio↔adoptante no comparten servicio. **Con el ancla
en la solicitud, la solicitud ES el vínculo.** ⇒ **son DOS canales, no uno con
dos motivos**: el de servicio (§6.4.7, no es de esta sesión) y el de la
solicitud. *Meterlos en una tabla con un campo `tipo` obligaría a toda policy
futura a preguntar «¿cuál de los dos sos?».*

---

## ② ESTACIONADO — 3, todas con voto y **construidas fail-closed**

Ninguna frenó nada: por eso el backlog se agotó igual.

| # | qué falta | voto de D | qué construí alrededor |
|---|---|---|---|
| ① | **¿avisa al padrino si el ahijado FALLECE?** §6 lo firma; S88 firmó que el memorial calla | **(a) avisar**, con voz de duelo y sin invitación a apadrinar otro | la causa existe con `avisa:false` y su `motivoSinAviso`; **no pedí el tipo de notificación**. El cobro se detiene igual |
| ② | **¿el publicador ve el hilo tras `declinada`?** | **(a) sí, en lectura** (trazabilidad de disputa) | parámetro explícito **sin default**: nadie hereda una respuesta que nadie dio |
| ③ | **adjuntos en el hilo** (§5 no los nombra) | **imagen, sólo publicador** | **no pedí bucket**: sin bucket la puerta no existe en vez de existir abierta |

---

## ③ ESPERA FIRMA O AUTORIZACIÓN — en lenguaje de negocio

1. **Si al padrino se le avisa cuando su ahijado muere.** Hoy no se le avisa: se
   le detiene el cobro en silencio. *Mi voto es avisarle — el silencio que se
   firmó era para no hablarle de plata a una familia en duelo, y el padrino no
   es esa familia.*
2. **Si el refugio sigue viendo la conversación después de decir que no.**
3. **Si se pueden mandar fotos en la conversación, y quién.**

## ④ ESPERA A OTRA PISTA (no es firma, es secuencia)

- **A**: el contrato de DB. Hasta que exista, el módulo es **ley sin motor** —
  correcta y ejercida, y sin nada que gobernar todavía.
- **B / C**: los tipos ya están publicados y son estables; pueden vestir y montar.

---

## ⑤ LO QUE NO HICE, y por qué

- **No escribí DB** (es de A) ni UI (B) ni pantallas (C).
- **No cablée el acta de §5 ni la transferencia del expediente.** §5 los pone
  como final natural de `aceptada`, **pero su forma no está medida** y S110-D
  midió que el `WITH CHECK` de `mascotas_update_familia` es **puerta abierta**
  (`D-989`). *Cablear la transferencia hoy sería construir encima de una puerta
  que se sabe abierta.*
- **No toqué las cinco tablas legado**, y el contrato a A **arranca frenando su
  reuso** (`D-991`).
- **No pedí digest**: §8 lo justifica por volumen y acá el volumen es una
  conversación entre dos personas.

---

## ⑥ TRES CORRECCIONES DE INSTRUMENTO, mías, para el acta

1. **El total del arnés estaba ESCRITO a mano (42) y el real era 43.** Ahora se
   **deriva**. *Un total a mano miente el día que agrego un caso.*
2. **Leí un exit code por el pipe** y me dio `0` con un rojo sembrado — **`L-191`
   exactamente**, cometida por mí. Re-medido sin pipe.
3. **Un backtick en un `git commit -m "…"` se comió una palabra del mensaje.**
   El shell sustituye dentro de comillas dobles. **Práctica adoptada: los
   mensajes van por `-F` con heredoc citado.** Curado con `--amend` +
   `--force-with-lease` **antes** de que estuviera en `main` (verificado que no
   lo estaba).

⚠️ **Y un freno operativo que se repitió en cada commit:** `verify-sin-byte-nul`
da **rojo falso** en este worktree —sale de `main 9443da56`, anterior al gate—.
Cada salto va **declarado en su mensaje**, con verificación a mano: los archivos
nuevos dan NUL en offset `-1` y el detector sí ve el conocido de
`PasoCierre.tsx` en `3942`. *A ya lo curó en `main` para que diga NO
CONCLUYENTE; mi árbol no tiene ese `main`.*
