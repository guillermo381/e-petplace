# MODELO_FISCAL.md — e-PetPlace (Ecuador)

> **v0.4 — 10 de septiembre de 2026 (S115, mesa + founder).** Enmiendas fechadas sobre
> v0.3 tras el relevamiento de A (S115-A), el certificado de RUC de Satori Inov y la
> verificación de fuentes de la mesa. Donde esta nota contradiga a v0.3, manda esta nota;
> el texto de v0.3 queda abajo, íntegro, como historia.
>
> **E1 — El modelo es dato por cuenta, no ley de la plataforma (§1, §1.2, §3 flujo 3).**
> Reventa con margen (B2) es el modelo BASE: default de toda cuenta comercial nueva
> (`modelo_comercial = reventa_pura`). Las cuentas en `marketplace_fachada` operan en
> AGENCIA: el proveedor factura al cliente, la plataforma captura y valida su clave de
> acceso, y Satori le factura la comisión mensual con IVA. Al lanzamiento, en fachada
> quedan las clínicas veterinarias; el resto en reventa. El «flujo 3 — contingencia» deja
> de ser contingencia: es el modo de arranque de veterinaria. **D-419 (S66) queda
> ACOTADA** a las cuentas en fachada, no derogada. Razón: la cohorte fuera de las clínicas
> no va a facturarle a cada familia, y la plata ya entra a nombre de e-PetPlace.
>
> **E2 — Régimen de Satori (§1.3, §5, §9 F4).** El RUC 1793240435001 está en **RIMPE
> Emprendedor** (certificado del 14-ago-2026) con una sola actividad, J631200 (portales
> web), sin actualización desde la constitución. Bajo RIMPE la renta se calcula sobre
> ingresos brutos sin deducir costos; con reventa, el bruto es el GMV. Las actividades de
> comisión, mandato y representación están excluidas del RIMPE, y registrar una actividad
> excluida pasa al contribuyente al régimen general (renta sobre utilidad, arrastre de
> pérdidas). **Acción del founder antes de la primera factura real:** actualizar el RUC
> con las actividades reales — venta por internet, servicios de cuidado de mascotas y
> comisión/mandato — y registrar medios de contacto. F4 se reformula: desde cuándo rige
> la exclusión, y qué obligaciones cambian ese día (IVA mensual, ATS).
>
> **E3 — La tarifa de veterinaria está en disputa, no solo «pendiente» (§4, §9 F1).** El
> 0 % se apoya en el oficio NAC-DNJOGEC22-00000003 (may-2022). Con posterioridad, el
> SRI sostuvo públicamente que los servicios veterinarios gravan la tarifa general y que
> el 0 % en salud alcanza solo a personas, con reclasificación retroactiva denunciada por
> el gremio (2022–2023). **F1 pasa a ser: «¿qué tarifa rige HOY para servicios
> veterinarios, con referencia normativa vigente?»** Hasta respuesta escrita, la tarifa
> vet es dato con `tarifa_estado = pendiente_ratificacion`. Si resulta 15 %, la reventa
> de vet es neutra en IVA y las clínicas siguen en fachada por lo regulatorio y la
> responsabilidad profesional, no por el IVA; si resulta 0 %, rige v0.3 tal como está.
>
> **E4 — La retención del 2 % (§5).** Es la misma plata en todos los modelos: cae sobre
> lo cobrado con tarjeta a nombre de e-PetPlace. Lo que cambia con reventa es la
> coherencia contable, no la caja. Se tacha «el descuadre estructural de v0.1 desaparece».
>
> **E5 — Un solo libro fiscal (§8).** `documentos_fiscales` nace de la tabla `facturas`
> existente, con `direccion` (emitido | recibido) y `rol` (venta_cliente ·
> comision_prestador · comprobante_proveedor · factura_tercero_cliente) como dato.
> `comprobantes_proveedor` no es tabla aparte: es `rol = comprobante_proveedor`. La
> compuerta del payout (§1.3, §2) se sostiene igual. Los datos del emisor (razón social,
> RUC, dirección matriz, establecimiento 001, punto de emisión 002, obligado a
> contabilidad, leyenda de régimen) son DATO, nunca constantes.
>
> **E6 — Nombres.** Donde v0.3 dice «Kushki», léase «la pasarela»: los rieles vivos son
> Nuvei/Paymentez y DeUna, certificados el 1-sep-2026. Donde dice «React + Ionic», léase
> React Native / Expo con OTA. El disparador de la factura es `aplicar_evento_de_pago`
> sobre `pagos_intentos`, punto único de los dos rieles (medido en S115-A).

> **E7 (10-sep-2026, S115-A) — QUÉ PAPEL RESPALDA CADA PAGO AL PRESTADOR.** Firma del
> founder sobre la compuerta de liquidación. *Una liquidación no pasa a `pagado` sin el
> comprobante del período, y cuál es el comprobante DEPENDE DEL MODELO.*
>
> **En REVENTA** —Satori compra y revende— el prestador le factura **a Satori**. El papel
> es su **`recibido · comprobante_proveedor`**, y su total tiene que cuadrar con el neto
> a pagar.
>
> **En AGENCIA** la clínica **no le vende nada a Satori**: le vendió a la familia. Su
> factura a Satori no existe y no va a existir — pedirla bloquearía el pago para siempre.
> Lo que respalda esa plata son **DOS papeles, y su resta**:
> 1. **`recibido · factura_tercero_cliente`** — la factura que la clínica le emitió a la
>    familia, **con su clave de acceso validada contra el SRI** (no basta que alguien la
>    marque autorizada: tiene que traer su número de autorización).
> 2. **`emitido · comision_prestador`** — la comisión que Satori le facturó a la clínica.
>
> ⇒ **`Σ factura_tercero_cliente − Σ comision_prestador = monto_neto_a_pagar`.**
> *No es una convención elegida: es la identidad contable de la agencia — la familia pagó
> el bruto, Satori se quedó con su comisión, y lo que queda es del tercero.* Si los dos
> papeles están y la resta no da, algo se cobró o se facturó mal, y es exactamente el
> momento de verlo: antes de girar.
>
> **No hay override, en ningún modelo.** Si algún día hay que pagar sin papel, que se vea.
>
> Cierra un circuito que ya estaba construido y no se tocaban las puntas: la fila
> `recibido · pendiente_manual` **ya nace** cuando el pago aprueba (outbox fiscal, E1), y
> **`fiscal-validar-clave` ya la valida** contra el web service. Lo que faltaba era que
> alguien exigiera las dos cosas antes de girar la plata.

> **v0.3 — 9 de septiembre de 2026.** v0.2 + Anexo A (credenciales y encendido de la emisión automática, a pedido del founder). v0.2 reescribió el documento tras la decisión del founder (S-fiscal): *"si es la mejor opción, que sea Satori quien facture todo — hay que aceptarlo"*. Esta versión recomienda y desarrolla ese modelo. **Pendiente de ratificación por el contador** — las preguntas abiertas quedaron en cuatro (§9), una de ellas bloqueante para veterinaria.
> Contexto que fija esta versión: **cero compras reales hasta hoy**; la app sale a producción el **1 de octubre de 2026** con **servicios (paseo, grooming, vet) y despensa**; **todo el cobro entra por e-PetPlace**, que captura el importe total del cliente.
> v0.1 (misma fecha) desarrollaba el modelo de intermediación pura; queda superada por decisión expresa, no por error: el founder aclaró que el `MODELO_FINANCIERO.md` se escribió sin esta letra fiscal.

---

## 0. Cómo leer este documento

- **Regla** — normativa ecuatoriana verificada en fuentes públicas. El contador la ratifica; no debería cambiar.
- **Diseño** — cómo e-PetPlace la aplica. Discutible internamente.
- **F1–F4** — las preguntas de estructuración para el contador (§9). Ninguna se resuelve escribiendo código primero.

---

## 1. El modelo elegido: Satori factura todo, en reventa con margen

**Decisión (pendiente de ratificación):** Satori Inov Latam S.A.S. es el **vendedor frente al cliente final** en todos los flujos que cobran por la plataforma. Emite la factura por el total; el proveedor le factura a Satori. Se descarta la intermediación pura (v0.1) y la emisión "en voz del proveedor".

### 1.1 Por qué gana este camino (contra los criterios: ley, cuentas simples, beneficio tributario)

1. **Coherencia con la caja.** Todo el dinero entra a nombre de e-PetPlace y así aparece en la tarjeta del cliente. Facturar como intermediario habría exigido contrato de mandato por actor, contabilidad de fondos de terceros y convivir con retenciones de tarjeta practicadas sobre plata ajena. Facturando como vendedor, caja, factura y contabilidad cuentan la misma historia.
2. **Cuentas que no se enredan.** Dos relaciones y ya: cliente↔Satori (una factura por compra) y proveedor↔Satori (una factura por liquidación). Sin mandatos, sin certificados ajenos en custodia, sin descuadres de retención.
3. **El beneficio tributario en un catálogo mayormente 0%.** Veterinaria y alimento balanceado son tarifa 0%: Satori compra a 0% y vende a 0% — **el margen no paga IVA en ningún punto de la cadena**. En intermediación, la comisión llevaba 15% de IVA que el proveedor de tarifa 0% no podía recuperar: costo puro del ecosistema. Este modelo lo elimina (§1.2).
4. **Viabilidad al 1 de octubre.** No se ha relevado la capacidad de facturar de la cohorte de lanzamiento. El camino de intermediación dependía de que *cada* proveedor facturara al cliente en cada cobro desde el día uno; este modelo solo necesita que el proveedor facture a Satori **una vez por período de liquidación**, y da tres semanas más de aire para formalizar a los rezagados.
5. **Disuelve tres de las preguntas difíciles de v0.1.** Breakage, cupones y retención sobre fondos de terceros dejan de ser problemas de estructura (§3).

### 1.2 La variante que importa: reventa con margen, no comisión facturada

Dos formas de instrumentar "Satori factura todo", y no dan lo mismo:

- **B1 — comisión facturada:** el proveedor factura a Satori el precio completo ($100) y Satori le factura la comisión ($15 + 15% de IVA). Dos documentos por liquidación, y el IVA de la comisión **reaparece como costo** para el proveedor de tarifa 0% (el veterinario no tiene con qué compensarlo).
- **B2 — reventa con margen:** el proveedor factura a Satori **el neto** ($85 — su precio menos la comisión pactada). Un solo documento, ninguna factura de comisión, y para tarifa 0% **cero IVA en toda la cadena**. La comisión existe en `fee_configs` como regla de cálculo del margen, no como documento fiscal.

**Diseño: B2.** El enum `modelo_comercial` de `cuentas_comerciales` ya contempla `reventa_pura` — el schema estaba preparado. La pantalla del prestador ("neto que recibirás", regla 7.15 del modelo financiero) no cambia: ese neto es ahora, literalmente, lo que factura.

Números por una consulta veterinaria de $40 con comisión 15%:

| | Intermediación (v0.1) | B1 comisión | **B2 reventa** |
|---|---|---|---|
| Cliente paga | 40,00 | 40,00 | 40,00 |
| Factura al cliente | del veterinario, 0% | de Satori, 0%* | de Satori, 0%* |
| Veterinario factura | $40 al cliente | $40 a Satori | **$34 a Satori** |
| IVA irrecuperable en la cadena | 0,90 (sobre comisión) | 0,90 (sobre comisión) | **0,00** |
| Documentos por transacción/período | 2 + mandato | 2 | **1** |

\* condicionado a F1 (§9).

### 1.3 Lo que este modelo cuesta, dicho de frente

- **El ingreso fiscal de Satori es todo lo cobrado, no el fee.** Con $500.000 transados, Satori declara $500.000 de ingresos y ~$425.000 de costos. La utilidad —y el impuesto a la renta— es la misma que en intermediación; lo que cambia es la escala de los brutos: salida rápida de cualquier régimen simplificado, probable calificación como contribuyente especial antes (lo que la volvería agente de retención — el motor de retenciones del §6.1 del modelo financiero pasa de TODO a "preparar"), y más obligaciones formales. Aceptado por el founder. **Los tableros de gestión e inversores siguen midiendo el fee** — la contabilidad formal y la métrica de gestión son cosas distintas, y bajo NIIF la presentación del estado de resultados la definirá el contador (principal vs. agente); D-759 sigue vigente como métrica.
- **Satori responde frente al cliente por lo vendido.** En productos es la garantía normal de un comercio. En servicios —veterinaria sobre todo— se acota por contrato con el proveedor (quién ejecuta, indemnidad, seguro de responsabilidad del profesional) y por cómo se describe el servicio en la factura (qué se prestó y quién lo prestó). No desaparece: se administra.
- **Sin factura del proveedor no hay costo deducible.** El pago al proveedor solo es gasto si él factura (o nota de venta válida) a Satori. La regla de negocio es gemela de la Decisión Q: **sin comprobante del período, la liquidación no se paga.**
- **Un punto abierto puede excluir a veterinaria** (F1, §9): si al revender un servicio veterinario Satori no conserva la tarifa 0%, el modelo B le añadiría 15% al precio final de las consultas. Hay plan de contingencia (§3, flujo 3).

### 1.4 Enmiendas que esto dispara en `MODELO_FINANCIERO.md`

Para que el contrato técnico y la letra fiscal no se contradigan:

- **§2.3 (white-label):** "la factura al cliente final la emite el seller original" → pasa a "la emite e-PetPlace; el seller factura a e-PetPlace el neto". La marca del fabricante en la vitrina no cambia; cambia el emisor del documento.
- **§8.10 / Forma B de la despensa:** "el vendedor cobra y factura al cliente" → el cobro ya entra por e-PetPlace (dato real del founder); factura e-PetPlace y el vendedor factura el neto a e-PetPlace.
- **D-750:** la despensa entra al P&L **de gestión** como fee; a la contabilidad formal entra como venta con costo. Ambas frases son ciertas en su plano.
- **Decisión T (breakage) y caso 8.2 (cupones):** la letra fiscal queda resuelta por este documento (§3, flujos 5 y 7) — sin enmienda de fondo, con nota.
- La **fórmula universal** (§3.1) no cambia: GMV = Kushki + plataforma + payout sigue siendo la aritmética del margen; lo que cambia es qué documento respalda cada término.

---

## 2. Los tres relojes — y el que manda para el SRI

El modelo financiero separa devengo (cierre con calidad), cobro (Kushki) y liquidación. Intactos los tres para el ledger. El SRI usa un cuarto reloj:

**Regla — hecho generador del IVA** (el momento en que nace la obligación de facturar): en bienes, la entrega **o el pago, lo primero**; en servicios, la prestación efectiva **o el pago, lo primero**. Como en e-PetPlace el cliente paga por adelantado o al momento, **la factura al cliente nace con el pago aprobado** — no con el cierre de la cita.

**Diseño — la regla arquitectónica:**

> **La factura de venta cuelga del arco de pagos. El costo cuelga de la liquidación. Nada fiscal cuelga de `eventos_economicos`.**

El §8.4bis del modelo financiero lo demuestra solo: en agosto, 91 pagos aprobados por $3.945 contra 17 eventos económicos por $162 — un pipeline fiscal colgado del ledger habría dejado de facturar el 9 de agosto. Como hoy no hay compras reales (pagos simulados, sin Kushki real), **no existe obligación pendiente**; nace con el primer cobro real del 1 de octubre. El pipeline fiscal es prerrequisito del encendido de Kushki, no un módulo posterior.

Los tres documentos y sus disparadores:

| Documento | Disparador | Momento |
|---|---|---|
| Factura de Satori al cliente | Webhook de pago aprobado (real) | Al pago, automática |
| Nota de crédito de Satori | Reembolso declarado sobre el pago (reglas 7.14/7.16) | Al aprobar el reembolso |
| Factura del proveedor a Satori (el neto del período) | Generación de la liquidación | Mensual; **gate del payout** |

**F2** valida el detalle del tercer renglón: que el proveedor facture mensual consolidado (práctica normal en servicios de tracto sucesivo — servicios continuos liquidados por período) y no cita por cita.

---

## 3. Matriz fiscal por flujo

Todos los cobros al cliente los factura Satori. Columna IVA según §4.

| # | Flujo | Factura al cliente | Costo (documento del proveedor) | Notas |
|---|---|---|---|---|
| 1 | Despensa — alimento balanceado | Satori, 0% | Vendedor → Satori, 0% | Cadena sin IVA; margen limpio |
| 2 | Despensa — snacks, accesorios, resto | Satori, 15% | Vendedor → Satori, 15% (crédito) | IVA neutro; margen solo paga renta |
| 3 | Veterinaria (consulta, cirugía, telemedicina) | Satori, 0% **condicionado a F1** | Clínica → Satori, 0% | **Contingencia si F1 sale mal:** la clínica factura al cliente (las clínicas ya facturan electrónico — son el actor más formal) y la plataforma captura la clave de acceso; Satori factura solo su comisión a la clínica. Solo veterinaria volvería al esquema de comisión |
| 4 | Paseo, grooming, adiestramiento, guardería | Satori, 15% | Prestador → Satori, 15% o nota de venta (§6) | Prestador RIMPE negocio popular: ver §6 — su nota de venta no trae IVA, el crédito no existe y el margen absorbe más IVA; decidir si se acepta o se exige RIMPE emprendedor |
| 5 | Paquetes, planes, programas (prepagos) | Satori factura **el total al comprar** (pago = hecho generador) | El proveedor factura el neto de lo **ejecutado** en cada período | El desfase prepago-ejecución vive en la contabilidad (ingreso facturado vs. costo devengado), no en documentos raros. **Breakage (Decisión T): resuelto** — lo vencido ya está facturado por Satori al cliente y el proveedor nunca factura lo que no ejecutó: es ingreso de plataforma sin ningún documento adicional. La letra fiscal de la Decisión T queda cerrada |
| 6 | Reembolsos y cancelaciones | Nota de crédito de Satori (total o parcial) | Si el proveedor ya facturó ese período: nota de crédito del proveedor en la siguiente liquidación | Espejo fiscal obligatorio de 7.14/7.16 |
| 7 | Cupón financiado por plataforma (caso 8.2) | Satori factura **$100 con descuento de $20 → base $80** | Prestador factura $85 | **Resuelto:** el descuento es una rebaja en factura propia (figura estándar); el aporte de la plataforma queda documentado como margen negativo de -$5, deducible sin figura especial. F4 de v0.1 desaparece |
| 8 | Saldo e-PetPlace (wallet) | Al acreditar: nota de crédito (si nace de reembolso). Al canjear: cuenta como pago — factura normal | — | Es **anticipo de cliente** (pasivo) en libros de Satori: figura estándar. Su caducidad = ingreso de Satori (**F3**: cómo documentarla). Sigue apagado hasta letra propia, como manda 7.16 |
| 9 | Donación a refugio | **Nadie factura** — no es venta; recibo/acta del refugio | — | ⚠️ Única excepción al modelo: la donación **no debe entrar como ingreso de Satori** aunque pase por la caja. Aquí sí se necesita el tratamiento de fondos de terceros — acotado a este flujo (F3). Deducibilidad para el donante: depende del estatus del refugio, no prometerla en producto |
| 10 | Criaderos (suscripción, boost), Prime, publicidad | Satori, 15% | — (ingreso 100% plataforma) | Entra post-lanzamiento; sin complejidad |
| 11 | Wearables / venta directa | Satori, 15% | Su cadena de importación/compra normal | Caso 8.8: ya era venta propia |

---

## 4. IVA: cuándo se cobra y cuándo no

**Regla** — tarifa general **15%**; el 0% es lista taxativa. En reventa de **bienes**, la tarifa sigue al bien sea quien sea el vendedor: el 0% del balanceado no se pierde por pasar por Satori. En **servicios**, el 0% depende de la naturaleza del servicio — y si el emisor debe ser quien lo presta es exactamente F1.

| Categoría del catálogo | Tarifa | Base |
|---|---|---|
| Alimento balanceado nutricional perro/gato, seco o húmedo | **0%** | Decreto Ejecutivo 516, vigente 1-feb-2025 |
| Snacks, premios, juguetes comestibles, suplementos | **15%** | Excluidos expresamente del decreto |
| Servicios veterinarios | **0% (F1)** | Criterio SRI que los asimila a salud — pedir referencia normativa vigente |
| Medicamentos y productos veterinarios | **0% (verificar por ítem)** | Régimen de productos veterinarios |
| Paseo, grooming, adiestramiento, guardería, hospedaje | **15%** | No son salud |
| Accesorios, wearables, hardware, suscripciones, publicidad | **15%** | Régimen general |

Reglas de diseño:

1. **La tarifa es dato por ítem** (`codigo_iva`, `tarifa_iva`) con historial de auditoría — mismo patrón que `fee_configs_historial`. Jamás constante: la frontera balanceado/snack la va a discutir alguien.
2. **Carrito mixto** (caso 8.7): una sola factura de Satori con subtotal 0% y subtotal 15% desglosados — en el RIDE y en el resumen de compra, o llegan reclamos.
3. **Consumidor final:** hasta $50 por transacción se puede facturar a "CONSUMIDOR FINAL" (9999999999999); sobre eso, identificación obligatoria. El checkout captura cédula/RUC con validación de dígito verificador. A favor: los gastos de mascotas son deducibles del impuesto a la renta de las personas (confirmar vigencia 2026) — el cliente quiere dar su cédula, y el Bio-Expediente puede archivarle sus facturas. Obligación convertida en funcionalidad.
4. **Crédito tributario:** el IVA pagado en compras 15% (facturas de prestadores, proveedores, Kushki, publicidad) compensa el IVA cobrado en ventas 15%. Las compras a tarifa 0% no generan crédito ni falta que hace. Si el mix vendiera mucho 0% y comprara mucho 15% (improbable aquí), habría crédito acumulándose — vigilar en el cierre mensual, no de antemano.

---

## 5. Retenciones

**Regla** — solo retienen los designados (agentes de retención, contribuyentes especiales, sector público, emisoras de tarjeta, aseguradoras). Una S.A.S. común no retiene.

| Quién | Qué pasa | Efecto en e-PetPlace |
|---|---|---|
| Emisoras de tarjeta (vía Kushki) | **2% de renta** sobre pagos al establecimiento afiliado (Res. NAC-DGERCGC26-00000009, mar-2026) + retención de IVA cuando aplica; Kushki lo descuenta de la liquidación de fondos | Ahora cae sobre ingreso que **sí es de Satori** — ~~el descuadre estructural de v0.1 desaparece~~ **[tachado por v0.4 · E4: es la misma plata en todos los modelos — cae sobre lo cobrado con tarjeta a nombre de e-PetPlace; lo que cambia con reventa es la coherencia contable, no la caja]**. Queda el efecto de margen delgado: 2% del bruto puede superar el impuesto sobre la utilidad → crédito acumulado, recuperable por reclamo de pago en exceso. Presupuestarlo como capital de trabajo (**F4**, dimensionarlo) |
| Satori hoy | No retiene | Payouts sin retención: liquidaciones simples |
| Satori como contribuyente especial (probable a futuro por volumen de brutos) | Deberá retener renta e IVA en sus compras — incluidas las facturas de los proveedores | El motor de retenciones (modelo financiero §6.1, hoy TODO) pasa a "diseñado y apagado": campos listos, se enciende con la designación |
| Proveedores agentes de retención (clínicas grandes) | Retendrían sobre facturas que Satori les emita | En B2 casi no existen facturas de Satori a proveedores (no hay factura de comisión) — efecto mínimo; solo aplicaría en la contingencia veterinaria |

---

## 6. Onboarding fiscal de proveedores

**Regla** — todo el que vende con habitualidad necesita RUC. El régimen define el documento con que le factura a Satori:

- **General / RIMPE emprendedor:** factura electrónica con IVA. El caso limpio.
- **RIMPE negocio popular:** **nota de venta** — sin IVA desglosado. Sustenta costo para Satori si identifica al comprador con su RUC (**confirmar con el contador, parte de F2**). Efecto económico: en servicios 15% (paseo), Satori no recibe crédito de IVA por esa compra y su margen absorbe más IVA. Decisión de producto: aceptarlos con comisión ajustada, o exigir categoría emprendedor para operar.
- **Sin RUC: no opera.** La liquidación de compra no es válvula general (casos tasados: rusticidad, no residentes) — aunque ahora Satori sí es el comprador y podría emitirla en esos casos estrictos, un paseador urbano habitual no califica. Inscribirse en RIMPE negocio popular es trámite corto: hacerlo parte del onboarding, no una excepción.

**Diseño — campos nuevos en `cuentas_comerciales`:**

```
regimen_tributario      enum: general | rimpe_emprendedor | rimpe_negocio_popular
tipo_comprobante_emite  enum: factura_electronica | nota_venta | ninguno
verificado_emisor_en    timestamptz   -- chequeo contra "Validez de emisor" del SRI
```

**Acción previa al 1 de octubre:** relevar la cohorte de lanzamiento (hoy es un "no sé"). El dato decide cuántos proveedores necesitan formalizarse en tres semanas y si la despensa arranca con su vendedor facturando bien a Satori.

---

## 7. La conexión con el SRI

Satori emite **todas** las facturas de venta: el volumen de emisión es el volumen de pedidos. Esto sube la exigencia del pipeline respecto de v0.1 (donde solo emitía comisiones) y simplifica todo lo demás: un solo RUC, un certificado, cero custodia de certificados ajenos, cero dependencia de que el prestador facture al cliente a tiempo.

**Mecánica (Regla, resumen — detalle en `epetplace-facturacion-sri.md`):** esquema offline del SRI, ficha técnica v2.34 (jul-2026). XML por comprobante, firmado con el certificado de firma electrónica de Satori (.p12 de entidad autorizada), clave de acceso de 49 dígitos que es el número de autorización, envío al web service de recepción, consulta de autorización (segundos), RIDE + XML al cliente por correo y descargables en su perfil. Estados: AUTORIZADO / DEVUELTA / NO AUTORIZADO.

**Diseño:**

- **Emisión vía proveedor con API REST** (decisión previa, se mantiene): él pone XML, firma, web services y contingencia; e-PetPlace llama endpoints y recibe webhooks. Verificar que esté en el registro obligatorio de proveedores de facturación (Res. NAC-DGERCGC26-00000027, jul-2026) — su RUC va en el campo adicional de cada XML.
- **Reglas duras del pipeline:** disparo desde el webhook de pago aprobado; idempotencia por `pago_id` (los webhooks se reenvían); secuenciales atómicos por punto de emisión con bloqueo de fila — jamás `MAX+1`; un secuencial rechazado no se reutiliza; una factura autorizada no se edita — nota de crédito; XML y RIDE archivados en Storage propio por el plazo de prescripción (no delegar el archivo al proveedor de facturación); cron de reconciliación para documentos colgados; alerta de vencimiento del certificado a 30 y 7 días (un certificado vencido detiene el 100% de la facturación).
- **Ambiente de pruebas** (ambiente 1) hasta pasar al menos 50 casos: consumidor final, cédula, RUC, carrito mixto 0/15, prepago total, descuento de cupón, nota de crédito, rechazo forzado.
- **Ya no se necesita** emisión multi-RUC ni captura de claves de acceso de facturas de prestadores al cliente — salvo que la contingencia veterinaria (flujo 3) se active: en ese caso, solo para clínicas, la plataforma captura y valida la clave de acceso de la factura de la clínica antes de liberar su payout.

---

## 8. Cambios concretos al schema

```
-- 1. Libro fiscal propio (espejo del SRI, colgado de pagos — no del ledger)
documentos_fiscales (
  id, tipo enum: factura | nota_credito,
  pago_id FK,                        -- el disparador
  tax_profile_id, establecimiento, punto_emision, secuencial,
  clave_acceso UNIQUE, ambiente, estado_sri, autorizado_en,
  subtotal_0, subtotal_15, iva, descuento, total,
  xml_url, ride_url, motivo_rechazo, metadata jsonb
)

-- 2. Identidad tributaria del cliente (checkout + Bio-Expediente)
tax_profiles (user_id nullable, tipo_identificacion, identificacion,
              razon_social, direccion, email)

-- 3. Secuenciales
fiscal_sequences (ruc, establecimiento, punto_emision, tipo_doc, ultimo_secuencial)

-- 4. Comprobantes de COSTO: la factura del proveedor a Satori, gate del payout
comprobantes_proveedor (
  id, cuenta_comercial_id, liquidacion_id FK,
  tipo enum: factura | nota_venta | nota_credito,
  clave_acceso, fecha, subtotal_0, subtotal_15, iva, total,
  estado_validacion, xml_url
)
-- Regla: liquidaciones.estado no pasa a 'pagado' sin comprobante validado
-- que cuadre con el neto del período.

-- 5. cuentas_comerciales: + regimen_tributario, tipo_comprobante_emite,
--    verificado_emisor_en (§6). modelo_comercial de las cuentas de
--    proveedores = 'reventa_pura' (§1.2).

-- 6. Catálogo: + codigo_iva, tarifa_iva por ítem, con tabla de historial.
```

Más una **vista de conciliación** pagos ↔ documentos_fiscales ↔ eventos_economicos ↔ liquidaciones: cuatro relojes, una pantalla. Un mes donde se cobró y no se facturó tiene que gritar solo — es el detector temprano de un 8.4bis fiscal.

---

## 9. Las cuatro preguntas para el contador

1. **F1 — Veterinaria a 0% en reventa (la bloqueante).** ¿Satori conserva la tarifa 0% al facturar al cliente un servicio veterinario ejecutado por una clínica habilitada? Pedirlo **por escrito** (consulta formal si hace falta). Si la respuesta es no, se activa la contingencia del flujo 3 (la clínica factura al cliente; Satori solo comisión) — y hay que revisar si existe objeción regulatoria, no solo tributaria, a revender servicios de salud animal.
2. **F2 — Documentos del proveedor.** ¿Factura mensual consolidada por liquidación es aceptable frente al hecho generador? ¿La nota de venta de un RIMPE negocio popular sustenta el costo de Satori, con qué requisitos? ¿Y confirmación de que la estructura B2 (facturar el neto, sin factura de comisión) no tiene objeción?
3. **F3 — Los dos flujos que no son venta.** Donaciones: cómo registrar el paso por caja sin que sea ingreso de Satori (fondos de terceros acotados a este flujo, contrato con el refugio). Saldo/wallet: tratamiento del anticipo, y cómo documentar la caducidad del saldo como ingreso.
4. **F4 — Proyección del régimen de Satori.** Con brutos = GMV: ¿cuándo sale de cualquier régimen simplificado, cuándo es plausible la calificación de contribuyente especial y qué obligaciones enciende (retener en compras, anexos)? Dimensionar el crédito por la retención del 2% de tarjetas con el volumen proyectado y el mecanismo de recuperación. Y confirmar la vigencia 2026 de la deducibilidad de gastos de mascotas (argumento de producto).

---

## 10. Camino crítico al 1 de octubre

| # | Qué | Cuándo | Nota |
|---|---|---|---|
| 1 | Sesión F1–F4 con el contador | Esta semana | F1 decide el diseño de veterinaria; todo lo demás no depende de ella |
| 2 | Certificado de firma electrónica de Satori Inov | Iniciar ya | El trámite más largo; bloquea toda emisión |
| 3 | Contratar proveedor de facturación (registrado ante el SRI) y abrir ambiente de pruebas | Semana próxima | Emitir la primera factura de prueba en días |
| 4 | Relevar capacidad fiscal de la cohorte de proveedores | Antes del 15-sep | Decide a quién hay que formalizar y el arranque de la despensa |
| 5 | Contratos con proveedores en términos de reventa (precio neto, garantías, indemnidad vet) | Sep | Reemplaza al contrato de mandato de v0.1 |
| 6 | Catálogo con tarifa por ítem + checkout con cédula/consumidor final | Sep | Migraciones §8 |
| 7 | Pipeline de emisión colgado del webhook de pago + notas de crédito + conciliación | Sep, en pruebas | Prerrequisito del encendido de Kushki real |
| 8 | 50+ documentos en ambiente de pruebas, luego producción con tope diario | Última semana de sep | — |

**Kushki Marketplace (fase 2)** deja de ser urgencia fiscal: con Satori como vendedor, el split ya no resuelve un problema tributario — vuelve a ser una decisión operativa/de tesorería, al ritmo que Kushki firme.

---

## 11. Lo que este documento NO resuelve

- La ratificación misma (F1–F4) y cualquier dictamen formal.
- La redacción legal de los contratos de reventa con proveedores (abogado).
- La matriz de Colombia — nace con la cuenta CO, y ojo: allá el modelo de reventa vuelve a discutirse desde cero (IVA, ICA y retefuente colombianos tienen otra aritmética).
- El detalle de implementación del pipeline (vive en `epetplace-facturacion-sri.md` y en las migraciones).

---

## Anexo A — Credenciales y encendido de la emisión automática, paso a paso

**La idea que ordena todo: el SRI no entrega credenciales de API.** Sus web services de recepción y autorización son públicos; la "credencial" real es la **firma electrónica** dentro de cada XML — un documento sin firma válida rebota, venga de donde venga. Las credenciales de API que tu app va a usar son las del **proveedor de facturación**, no las del SRI. En total son tres juegos de llaves, y se consiguen en este orden:

| Llave | Quién la emite | Para qué |
|---|---|---|
| 1. Clave de **SRI en línea** de Satori Inov | SRI | Autorizar los ambientes de emisión y monitorear comprobantes |
| 2. **Certificado de firma electrónica** (.p12) + su contraseña | Entidad certificadora acreditada | Firmar cada XML — es lo que da validez tributaria |
| 3. **API key de pruebas y de producción** + secreto del webhook | El proveedor de facturación | Lo único que tu código toca |

### Paso 1 — Clave de SRI en línea de la empresa

Si Satori Inov aún no tiene su clave de acceso al portal (es la clave del RUC de la empresa, distinta de la tuya personal), se obtiene con el RUC y el nombramiento del representante legal — en línea o en ventanilla del SRI. Sin esta clave no se puede hacer el paso 3.

### Paso 2 — Certificado de firma electrónica de persona jurídica

- **Dónde:** cualquier entidad acreditada — Registro Civil, Security Data, Uanataca, ANF, Lazzate, Sodig, entre otras. El trámite es en línea con validación por videollamada.
- **Documentos:** RUC de Satori Inov, cédula del representante legal, nombramiento vigente, y escritura de constitución si la entidad la pide.
- **Formato:** pedir **archivo .p12** (no token físico) — es el único formato que sirve para firmar automáticamente desde un sistema. Vigencia de 1 a 5 años; el archivo de 1 año cuesta en el orden de $10–30 + IVA.
- **Tiempo:** horas, no semanas — en muchos casos el mismo día.
- **Custodia:** el .p12 y su contraseña son la identidad fiscal de la empresa. Van al gestor de secretos (paso 5) y al proveedor de facturación; **jamás** al repositorio, a un correo o al frontend. Anotar la fecha de vencimiento: la alarma a 30 y 7 días (§7) se configura ese mismo día.

### Paso 3 — Autorizar los ambientes en SRI en línea

Con la clave del paso 1, en `srienlinea.sri.gob.ec`: **Facturación electrónica → Producción → Autorización**. Es un trámite en línea, gratuito e inmediato. El ambiente de **pruebas** (certificación) sirve para todo el desarrollo — sus comprobantes no tienen validez tributaria —; el de **producción** se autoriza cuando el checklist del paso 7 esté en verde. No hay aprobación manual del SRI de por medio: es autoservicio.

### Paso 4 — Cuenta y credenciales del proveedor de facturación

1. Elegir el proveedor con los criterios de §7 (webhooks, pruebas gratis, multi... y sobre todo: **que esté en el registro obligatorio de proveedores del SRI** — su RUC viaja en el campo adicional de cada XML que emitas).
2. Crear la cuenta a nombre de Satori Inov y configurar el **emisor**: RUC, razón social, dirección matriz, establecimiento (001), punto de emisión y secuencial inicial. Recomendación: un **punto de emisión exclusivo para la app** (por ejemplo 002), para que la numeración automática nunca choque con una factura hecha a mano en el portal del proveedor.
3. Subir el certificado .p12 con su contraseña (verificar que el proveedor declare cómo lo custodia — cifrado, no en plano).
4. Obtener del panel del proveedor: **API key de pruebas**, **API key de producción** y el **secreto de firma del webhook** (la clave con la que el proveedor firma sus notificaciones, para que tu Edge Function verifique que el aviso de "AUTORIZADO" es auténtico y no un invento de terceros).

### Paso 5 — Los secretos en la app (Supabase)

- Las tres credenciales viven como **secretos de Edge Functions** (`supabase secrets set`): `FACTURACION_API_KEY`, `FACTURACION_WEBHOOK_SECRET`, y el ambiente activo (`FACTURACION_AMBIENTE=pruebas|produccion`).
- **Nada de esto llega jamás al cliente React/Ionic.** El navegador y la app móvil no conocen ni la API key ni el certificado: toda emisión pasa por Edge Functions server-side — misma disciplina que L-140 ya impone a las funciones del motor financiero.
- El cambio pruebas→producción es un cambio de secreto y de `ambiente`, no un despliegue de código.

### Paso 6 — El circuito de emisión automática (el cableado)

```
Webhook de pago APROBADO (Kushki real)
  → Edge Function emitir_factura
      1. Idempotencia: ¿ya existe documento para este pago_id? → salir
      2. Toma secuencial atómico (fiscal_sequences, FOR UPDATE)
      3. Arma la factura: tax_profile del cliente (o consumidor final ≤$50),
         ítems con su tarifa 0/15 del catálogo, descuentos
      4. POST a la API del proveedor → guarda clave_acceso, estado EMITIENDO
  ← Webhook del proveedor (verificado con FACTURACION_WEBHOOK_SECRET)
      AUTORIZADO → guarda XML + RIDE en Storage, estado AUTORIZADA,
                   correo al cliente con ambos adjuntos
      RECHAZADO  → estado NO_AUTORIZADA + motivo; corrección emite con
                   secuencial NUEVO (el rechazado no se reutiliza)
  + Cron cada 15 min: documentos EMITIENDO > 30 min → re-consulta estado
```

Los reembolsos disparan el mismo circuito con nota de crédito (referenciando la clave de acceso original), desde las reglas 7.14/7.16.

### Paso 7 — Checklist de encendido (pruebas → producción)

1. ≥50 documentos autorizados en ambiente de pruebas cubriendo: consumidor final, cédula, RUC, carrito mixto 0/15, prepago total (paquete), descuento de cupón, nota de crédito total y parcial, y un rechazo forzado (cédula inválida) con reemisión correcta.
2. Webhook verificado con firma; cron de reconciliación corriendo; alarma de certificado activa.
3. Autorizar producción en SRI en línea (paso 3), cambiar secretos (paso 5), y arrancar con **tope diario** de documentos las dos primeras semanas.
4. Verificar la primera factura real de punta a punta: consulta pública en el SRI con la clave de acceso, correo recibido, XML y RIDE descargables desde el perfil del cliente.

**Tiempos totales:** pasos 1–4 caben en una semana (el certificado suele salir en el día); el paso 6 es el trabajo de septiembre del camino crítico (§10, filas 6–8). Ninguna de las llaves cuesta más que el certificado.

### Fuentes principales

- [Facturación electrónica — SRI](https://www.sri.gob.ec/facturacion-electronica) · [Reglamento de Comprobantes de Venta](https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/c3a2c922-5960-4c08-9a73-bde19fadce42/REGLAMENTO+DE+COMPROBANTES+DE+VENTA,+RETENCI%D3N+Y+DOCUMENTOS+COMPLEMENTARIOS.pdf)
- [Boletín SRI: decreto elimina el IVA en alimentos para mascotas](https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/292cfd11-380f-46f6-966e-8341538e087a/BOLETI%CC%81N%20004%20-%20NUEVO%20DECRETO%20ELIMINA%20EL%20IVA%20EN%20ALIMENTOS%20PARA%20MASCOTAS,%20REDUCIENDO%20EL%20GASTO%20DE%20LAS%20FAMILIAS.pdf) · [Exclusión de snacks — El Universo](https://www.eluniverso.com/noticias/economia/iva-mascotas-alimentos-no-incluye-snacks-sri-ecuador-2025-nota/)
- [0% IVA en servicios veterinarios — Russell Bedford EC](https://russellbedford.com.ec/0-iva-para-servicios-veterinarios/)
- [Retenciones en la fuente 2026 (Res. NAC-DGERCGC26-00000009) — HLB Ecuador](https://www.hlbecuador.com/nuevos-porcentajes-de-retencion-en-la-fuente-2026/) · [Retención de IVA — Almeida Guzmán](https://almeidaguzman.com/nuevos-porcentajes-de-retencion-de-iva-2/)
- [Registro de proveedores de facturación electrónica (Res. NAC-DGERCGC26-00000027) — Boletín Contable](https://boletincontable.com/2026/07/29/proveedores-facturacion-electronica-registro-sri/)
- [Autorización de ambientes de producción de comprobantes electrónicos — Gob.ec/SRI](https://www.gob.ec/sri/tramites/autorizacion-ambientes-produccion-comprobantes-electronicos) · [Firma electrónica 2026: requisitos y precio — SolvexSoft](https://solvexsoft.com/blog/firma-electronica-ecuador-requisitos-precio)
- [Liquidación de compra: casos permitidos](https://facturaia.ec/blog/liquidacion-de-compra-ecuador-sri) · [Liquidación de fondos y retenciones — Kushki](https://soporte.kushkipagos.com/hc/en-us/articles/16447201748627-Settlement-process-for-Ecuador)
