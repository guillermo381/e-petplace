# S89-A · PLANTILLAS DE WHATSAPP — LISTAS PARA SOMETER A META

**Firma que lo habilita (founder, 6-ago-2026):** el consentimiento está
firmado (opt-in D-436, la Hoja de C con `waConsentTitulo/Texto` en el lote de
D) y el motor ya rebota sin evidencia (`opt_in_sin_evidencia`). **La adenda de
mesa ordena someterlas YA para que el reloj de Meta corra en paralelo.**

**Qué es este depósito:** el paquete de plantillas *business-initiated*
(categoría **UTILITY**, idiomas `es` y `en_US`) listo para pegar en Meta
Business / WhatsApp Manager. **La sumisión la ejecuta el founder** — exige su
cuenta de Meta Business, que no viaja por acá. La aprobación de Meta NO saca
ningún tipo de sombra: la vara de S89 sigue rigiendo (voz firmada + ojo del
founder en el primer envío real).

**Regla de las variables:** Meta exige texto FIJO con huecos `{{n}}` — las
plantillas espejan la voz de la casa (tuteo neutro firmado) con el dato vivo
en el hueco. La voz definitiva por tipo la firma el founder en el lote; si una
firma cambia un texto, la plantilla se re-somete (por eso el reloj arranca hoy).

---

## 1 · `cita_confirmada` (es / en_US · UTILITY)

> Tu cita quedó confirmada. La cita de {{1}} con {{2}} quedó confirmada para
> el {{3}} a las {{4}}. Puedes ver el detalle en la app de e-PetPlace.

> Your appointment is confirmed. The appointment for {{1}} with {{2}} is
> confirmed for {{3}} at {{4}}. You can see the details in the e-PetPlace app.

Variables: 1 mascota · 2 negocio · 3 fecha DD/MM · 4 hora HH:MM.

## 2 · `cita_recordatorio` (es / en_US · UTILITY)

> Te recordamos la cita de {{1}} con {{2}}: es {{3}} a las {{4}}.

> A reminder: the appointment for {{1}} with {{2}} is {{3}} at {{4}}.

Variables: 1 mascota · 2 negocio · 3 «mañana|hoy» / «tomorrow|today» · 4 hora.

## 3 · `plan_renovacion_proxima` (es / en_US · UTILITY)

> Tu plan de paseos se renueva en 3 días. El plan de paseos de {{1}} se
> renueva el {{2}} y se va a cobrar con tu método habitual. Si no quieres que
> siga, puedes pausarlo desde la app antes de esa fecha.

> Your walk plan renews in 3 days. {{1}}'s walk plan renews on {{2}} and
> we'll charge your usual payment method. If you'd rather stop it, you can
> pause it in the app before then.

## 4 · `plan_renovado` (es / en_US · UTILITY)

> Tu plan de paseos se renovó. Renovamos el plan de paseos de {{1}} por un
> mes más. Ya está activo y el cobro se hizo con tu método habitual. Puedes
> ver el detalle en la app.

> Your walk plan renewed. We renewed {{1}}'s walk plan for another month.
> It's active now and we charged your usual payment method. You can see the
> details in the app.

## 5 · `plan_renovacion_fallida` (es / en_US · UTILITY)

> No pudimos renovar tu plan de paseos. El cobro de la renovación del plan de
> {{1}} no pasó. Vamos a seguir reintentando hasta el {{2}}. Revisa tu método
> de pago para que la agenda no se pierda.

> We couldn't renew your walk plan. {{1}}'s walk plan renewal payment didn't
> go through. We'll keep retrying until {{2}}. Please check your payment
> method so the schedule isn't lost.

## 6 · `paquete_vence` (es / en_US · UTILITY)

> Te quedan {{1}} salidas por usar. El paquete de paseos de {{2}} vence el
> {{3}} y todavía te quedan {{1}} salidas. Puedes reservarlas desde la app.

> You have {{1}} walks left. {{2}}'s walk package expires on {{3}} and you
> still have {{1}} walks. You can book them in the app.

---

**Notas de sumisión:** nombre técnico en snake_case igual al `codigo` del
catálogo · categoría UTILITY en las seis (ninguna es marketing) · sin
botones en v1 (el destino es la app; los deep links de plantilla se diseñan
con el tren de push y el destino-por-tipo del catálogo, adjudicado allá).
