# MODELO_ECONOMICO.md — e-PetPlace (Ecuador)
**v1.1 · 10 de septiembre de 2026 · mesa + founder.** (v1.0 misma fecha: despensa al 12 % y base de costos incompleta — superada por firma del founder.) Reemplaza las hipótesis económicas del MODELO_FINANCIERO v2.9 (§2.2 mapa de revenue, §3.1 fórmula, 8.1) por lo medido: calculadora de Nuvei, RUC de Satori Inov, normativa verificada. El contrato técnico del ledger no cambia; cambian los NÚMEROS que `fee_configs` guarda y quién paga qué. Calculadora viva: `MODELO_ECONOMICO_EPETPLACE_v1.1.xlsx` (todo lo amarillo es supuesto a reemplazar).

> **➕ ENMIENDA S115-A (10-sep-2026) — EL CARRITO MIXTO Y EL MÍNIMO SOBRE BASE CERO.**
> Dos casos que la v1.1 no decide y que el objeto obligó a resolver. Firmados por el
> founder sobre la medición.
>
> **E-A · El mínimo del carrito mixto: manda la categoría de MAYOR BASE.**
> §2 D-A fija «$2,00 alimento / $1,00 resto» y no dice qué pasa cuando un pedido tiene
> las dos cosas. Medido: de **105 pedidos con ítems, 94 son sólo alimento, 10 sólo resto
> y 1 es MIXTO** — existe, no es teórico.
> ⇒ **Manda el mínimo de la categoría con mayor base imponible del pedido.**
> *Ejemplo firmado: un pedido de $45 de alimento + $3 de accesorio paga el mínimo de
> alimento ($2,00).* Al revés —aplicar el mínimo alto por tener una sola bolsa— castigaría
> un accesorio de $3; aplicar el bajo regalaría el piso en un pedido que es casi todo
> alimento. **El dominante es el único criterio derivable del dato.**
> Vive en `_devengar_pedido`, que manda `categoria_origen` al resolver.
>
> **E-B · El mínimo NO aplica sobre base cero.**
> Medido al cablear el mínimo: hay **110 citas con precio $0,00** —días de guardería
> consumidos de un paquete, ya pagados en el bono— y `comision_efectiva(0, 18, 1.50)`
> devolvía **$1,50**. Hoy no muerde (esas citas no devengan), pero el mínimo creaba la
> posibilidad de **cobrar la comisión dos veces**.
> ⇒ **Base cero ⇒ comisión cero**, con su propio valor de snapshot (`aplico: 'base_cero'`).
> *El mínimo es un piso sobre una transacción real, no un cargo por una no-transacción.*
>
> **E-C · Para una CITA, «la fecha en que el precio rige» es la del SERVICIO.**
> Firma del founder (opción 2). Y la forma que la sostiene no es que las dos puertas
> coincidan: es que **haya una sola** — la confirmación LEE el `fee_config_id` congelado
> y sólo resuelve si no hay; el congelador re-congela al reagendar **mientras la cita no
> esté pagada**. *Dos resoluciones independientes del mismo hecho no pueden «coincidir»:
> pueden, como mucho, no haber divergido todavía.*
> Servicios sin fecha propia (despensa, paquete, plan) caen a la fecha del pago, y está
> escrito en el código, no como default silencioso.


---

## 0. Veredicto

Con comisión del 10 % y cobro con tarjeta de crédito, e-PetPlace no cubre ni el riel. Un paseo de $10 base ($11,50 con IVA) deja $1,00 de comisión; la tarjeta de crédito corriente cuesta $0,78 ($0,68 neto del IVA recuperable) y los mensajes, la factura electrónica y la IA otros $0,18. Quedan **$0,14 por paseo**. Con la mezcla optimista de lanzamiento (45 % crédito, 15 % débito, 40 % DeUna) quedan $0,39: **3,9 % del ticket**. Para cubrir $472 de costos fijos sin sueldo hacen falta ~430 transacciones al mes; con un sueldo de mercado, ~4.000. El miedo está bien fundado: el 10 % «libre» nunca fue libre.

El problema no es la comisión sola: es que un marketplace de servicios de ticket chico vive de **tres fuentes** (comisión al prestador + tarifa de servicio a la familia + riel barato), y hoy tiene una.

## 1. Los seis hechos que cambian el modelo (verificados)

| # | Hecho | Fuente | Efecto |
|---|---|---|---|
| 1 | Tarjeta de crédito corriente cuesta **6,35 % + $0,05** del total cobrado (4,62 % banco incl. IVA + 1,5 % Nuvei + 3DS + IVA sobre Nuvei). Débito 2,9 %. Diferido 7,7 % a 15 %. | Calculadora Nuvei | El riel es el mayor costo variable. El diferido no puede estar encendido. |
| 2 | Las emisoras retienen **2 % de renta** sobre la base y **30 % (bienes) / 70 % (servicios) del IVA** de cada cobro con tarjeta. | Calculadora Nuvei; tablas de retención | No es costo: es caja que sale hoy y vuelve en meses. Hay que tenerla. |
| 3 | Satori Inov está en **RIMPE Emprendedor**: renta sobre el ingreso **bruto**, sin deducir costos. Con reventa el bruto es el GMV. | RUC 14-ago-2026; LRTI 97.6 | Salir del RIMPE antes de la primera venta real registrando la actividad de comisión/mandato. Firmado. |
| 4 | Ley de precios: lo exhibido es el precio **final** con impuestos. | LODC Art. 9 y 19 | El IVA no se suma en el checkout; la tarifa de servicio se muestra antes de pagar como línea propia. Recargar por pagar con tarjeta, no. |
| 5 | Régimen de **mercados en línea** (Res. NAC-DGERCGC21-00000026): las emisoras retienen sobre TODO lo que cobra la plataforma, propio y de terceros; la plataforma retiene a su vez a los terceros al pagarles. | SRI | Para las cuentas en agencia (clínicas), Satori retiene en el payout (2 % renta; IVA si la clínica vende gravado) y emite comprobante de retención. Manual a volumen F&F; motor después. |
| 6 | Los comisionistas están **excluidos del RIMPE**; registrar la actividad expulsa al régimen general. | Res. NAC-DGERCGC24-00000027 | La agencia acotada a clínicas es también lo que saca a Satori del impuesto sobre bruto. |

## 2. El modelo completo — decisiones (opciones · voto · una razón)

**D-A · Take rate por vertical**, sobre la base sin IVA, leído de `fee_configs`, jamás en código.
(a) 15 % servicios + $0,99 · **(b) 18 % servicios + $0,99** · (c) 20 % sin tarifa.
Voto (b). Razón: el porcentaje nunca cubre la parte fija de un ticket de $12 (3DS, mensajes, factura); la tarifa sí, y 18 % queda por debajo del estándar internacional (Rover 20 % + 11 % al dueño; Rappi 20–30 %) — hay aire para después.

| Vertical | Modelo | Comisión | Mínimo | Neto del prestador (ticket típico) | Contribución de Satori |
|---|---|---|---|---|---|
| Paseo, grooming, guardería, adiestramiento | reventa | **18 %** | $1,50 | paseo $10 → $8,20 | $2,01 (20 %) |
| Veterinaria, telemedicina | agencia | **12 % + IVA** | $3,00 / $2,00 | consulta $40 → $34,48 | $3,63 (9 %) |
| Despensa (balanceado y resto) | reventa | **15 %** | $2,00 / $1,00 | bolsa $45 → $38,25 | $5,35 (12 %) |
| Paquetes y prepagos | el de su vertical | — | — | 10 paseos $95 → $77,90 | $13,35 (14 %) |

**D-B · Tarifa de servicio a la familia: $0,99 por reserva o pedido**, con IVA, línea propia visible antes de pagar, igual en todos los medios de pago (no es recargo por tarjeta). En F&F hasta el 31-dic se promociona a $0 como cupón financiado por la plataforma (Decisión H): la mecánica y el asiento existen desde el día uno; lo que se regala se ve en el P&L de gestión.
(a) sin tarifa · **(b) $0,99 fija** · (c) 5 % con tope. Voto (b): fija es honesta con la familia y cubre exactamente lo fijo.

**D-C · El riel lo paga Satori, dentro de su margen.** El MODELO_FINANCIERO decía `payout = bruto − pasarela − plataforma` (el prestador cargaba con la pasarela). Se enmienda: **el prestador recibe base − comisión, punto**; la pasarela es costo de Satori (bajo reventa es su costo, y a la familia no se le puede recargar). Lo que el prestador ve al poner precio: «tu precio sin IVA · lo que ve la familia · lo que recibes».

**D-D · Riel barato por diseño.** DeUna primero en el checkout, débito segundo, crédito tercero; **diferido apagado**. Saldo e-PetPlace recargable por DeUna con bono (+3 % de saldo cargando $50 o más), financiado por el ahorro de riel (el crédito cuesta 6,4 %; el saldo, cero en cada compra siguiente). Paquetes prepagos empujados: un cobro, N servicios. Voto: encender las tres desde el lanzamiento — cada punto de mezcla que pasa de crédito a DeUna vale ~4 % del ticket.

**D-E · Impuestos y caja.** Régimen general (salir del RIMPE). Presupuestar la retención como capital de trabajo: la hoja `Caja_retenciones` la calcula mes a mes; con los supuestos de lanzamiento, ~$1.300 atrapados al mes 12 sin contar recuperación de renta. Pedir devolución de IVA retenido no compensado a los 6 meses (Art. 69 LRTI). Pregunta abierta y decisiva: **¿DeUna retiene renta e IVA como las tarjetas?** Si no, la mezcla decide también la caja.

**D-F · Métricas de gestión** (tableros e inversores): take rate efectivo = ingreso de Satori / GMV, objetivo ≥ 15 %; margen de contribución ≥ 10 % del GMV; break-even sin sueldo ~160 transacciones/mes, con sueldo de mercado ~1.200. La contabilidad formal reporta GMV como venta (reventa); la gestión mide el fee. Ambas ciertas en su plano (D-750).

## 3. Lo que esto cambia en la letra y en la base

- `fee_configs`: comisión por `tipo_actor` y vertical con los valores de D-A, más **`minimo_por_transaccion`** (columna nueva). Historial automático ya existe.
- `MODELO_FINANCIERO` §3.1: `GMV = pasarela + plataforma + payout` sigue como identidad contable, pero **payout = base − comisión** y la pasarela sale de `plataforma`. `monto_kushki_fee` pasa a ser costo de Satori, no descuento al actor. §2.2 y 8.1 se enmiendan con esta tabla.
- Tarifa de servicio: nuevo ítem de catálogo de la plataforma (`tarifa_servicio`, EC_IVA_15, `plataforma_directa`), una línea en el desglose y en la factura de Satori. Su valor y su promoción viven en `app_config` / cupones, nunca en código.
- Checkout: orden de medios de pago como dato; diferido no ofrecido.
- Saldo: regla de bono por recarga en `app_config`; su costo entra al P&L de gestión como marketing.
- `MODELO_FISCAL` v0.4 + E7: para las cuentas en agencia, Satori actúa como retenedor en el payout (régimen de mercados en línea); comprobante de retención manual en F&F.
- Motor de retenciones (§6.1): deja de ser «TODO lejano»; se diseña apagado con la primera liquidación y se enciende para las cuentas en agencia.

## 3.bis La base de costos y el break-even (firmado por el founder, 10-sep)

Sin sueldo del founder — lo asume aparte. Todo esto vive en la calculadora y se reemplaza por facturas reales a medida que aparecen.

| Categoría | F&F (oct–dic 2026) | Operación (desde el paso de fase) |
|---|---|---|
| Infra (Supabase, Vercel, EAS, Resend, Sentry, CDN, dominios) | 280 | 330 |
| IA: API en producción + suscripciones de la metodología dual | 350 | 500 |
| Herramientas (GitHub, Figma, Workspace, dev accounts, mapas, SMS, WhatsApp Business) | 180 | 250 |
| Facturación electrónica + firma | 40 | 60 |
| Contabilidad y cumplimiento (IVA mensual, ATS, retenciones) | 350 | 450 |
| Legal amortizado, Superintendencia, patente, comisiones bancarias de payout | 240 | 280 |
| Seguro de responsabilidad civil | 120 | 150 |
| Soporte y operaciones (una persona, cargada) | — | 900 |
| Comercial de campo (medio tiempo) | — | 600 |
| Adquisición pagada (CAC ~$25 → ~60 familias/mes) | — | 1.500 |
| Promociones, referidos, contenido, eventos | 200 | 800 |
| Contingencia 10 % | 176 | 582 |
| **Total mensual** | **$1.936** | **$6.402** |

**Break-even con el modelo propuesto** (contribución promedio ~$3,17/transacción con la mezcla de lanzamiento): F&F ~610 transacciones/mes (~200 familias a 3 compras/mes); Operación ~2.020/mes (~670 familias). Con 200 Prime y 100 planes de prestador, Operación baja a ~1.400. Caja consumida el primer año: ~$45.000 con este modelo, ~$57.000 con el 10 % de hoy. **Ningún porcentaje de comisión razonable alcanza el break-even de Operación en el primer año** — lo mueven la mezcla de pago (cada punto que sale de tarjeta de crédito vale ~4 % del ticket) y los ingresos no transaccionales.

**Regla de paso de fase (pendiente de firma):** la fase Operación no se enciende por calendario sino por tracción — cuando ~100 familias hayan comprado tres meses seguidos. Pagar CAC antes de tener repetición medida es comprar familias que se van.

## 4. Lo que hay que decirle a la cohorte esta semana

El precio que declaran es **sin IVA** y es su precio; la app le suma el IVA que corresponde y una tarifa de servicio a la familia. Reciben su precio menos la comisión (18 % servicios, 15 % despensa, 12 % clínicas), sin descuentos de tarjeta ni sorpresas, una vez al mes contra su factura. A cambio: la familia paga con la app, e-PetPlace responde, factura y cobra, y el prestador no toca una tarjeta ni un datáfono.

## 5. Preguntas abiertas, con dueño

| Pregunta | Dueño | Cambia |
|---|---|---|
| Costo real de DeUna y si retiene renta/IVA | Carlos Ochoa (DeUna) | La mezcla y la caja |
| Precio por mensaje utility de WhatsApp en Ecuador | Panel de Meta (founder) | $0,05/tx arriba o abajo |
| Devolución de IVA retenido: plazo real, requisitos | Contador | Capital de trabajo |
| Si Satori es «mercado en línea» solo por la parte agencia y cómo se declara | Contador | Retenciones a clínicas |
| Tickets y precios reales de la cohorte | Relevamiento (founder + Karina) | Toda la hoja UE |
| Costo mensual real de Supabase, Anthropic, Resend | Facturas del mes | Fijos |
