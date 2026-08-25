# PLAN_MESA_106.md — e-PetPlace · «cerrar los rieles y escribir tres oficios nuevos»

> **Mesa:** 106 (numeración del founder) · **Escrito:** al cierre de la mesa 105 ·
> **Autor:** la mesa.
> **Precedencia:** el repo y su bitácora ganan SIEMPRE sobre este plan. La sesión
> nueva toma **el número que la bitácora asigne** — la mesa anterior se numeró 105
> y las pistas se llamaron S104; no se renumera nada.
> **Rige entero:** `CLAUDE.md` · `CONTRATO_TRABAJO` · `POLITICAS` · `LETRA_DEUNA` ·
> `LETRA_COBRO_RECURRENTE` · `MODELO_NOTIFICACIONES` · `MODELO_LOGIN` ·
> `RITUAL_DE_ENTRADA` · los traspasos S104-A/B/C/D · y el acta del checkpoint.

---

## §0 · LA LEY QUE GOBIERNA ESTA MESA

La sesión anterior cazó **doce formas del mismo defecto en un día**, y ninguna la
encontró un gate corriendo. La ley que dejaron, y que rige acá desde el primer
turno:

> **No alcanza con mirar el color: hay que preguntar quién lo produjo.**

Sus corolarios, todos pagados con un caso:

- **Un interruptor que no está conectado a nada no falla: se siente encendido.**
- **Una medición que habilita una decisión ajena viaja con su predicado**, no solo
  con su número. Y un literal viaja diciendo si pasó por un coalesce.
- **Un contrato entre pistas se cierra una vez. Si cambia, el cambio se anuncia
  como cambio.**
- **Un cinturón que mide que algo EXISTE no mide que CORRA.** Tres migraciones
  nacieron rotas con apply verde.
- **El instrumento que no puede medir y lo declara sirve; el que en ese caso dice
  verde es el que hace daño.**

## §1 · PRECONDICIONES DE MEDICIÓN — antes de construir nada

Ninguna de estas es una pregunta retórica: cada una ya se contestó mal una vez.

1. 🔴 **¿Qué llegó de DeUna, exactamente?** El founder declara que «ya dieron los
   datos». Se mide qué hay: `pointOfSale` de QA · logo y manual de marca ·
   registro del webhook · y las respuestas a las cuatro consultas técnicas
   (simulación de `REVERSED`/`REVERSED_FAILED` · firma del webhook más fuerte que
   headers estáticos · la contradicción de su doc entre «24 horas» y «solo mismo
   día» · rate limit de producción). **Lo que no llegó no se supone.**
2. 🔴 **El `pointOfSale` NO es el cuello de botella.** Lo midió el inventario de
   circuito de S103: aunque las credenciales estén, el pago no cierra hasta que
   exista **el actuador ciego a DeUna y su wrapper**. Se mide qué se construyó de
   eso y qué no, antes de prometer una fecha.
3. 🔴 **¿En qué estado quedó Nuvei?** Certificación pendiente con Erick. Se mide
   contra el objeto: qué casos exige la certificación, cuáles corren hoy, y el
   comprobante por correo con `id` y código de autorización, que es requisito
   duro y toca el frente de correo que la mesa anterior dejó sano.
4. 🟡 **WhatsApp: plantillas aprobadas ≠ canal vivo.** Medido en S104: el mapeo
   tipo-de-aviso → plantilla **no existe en ninguna parte**; el token cargado no
   es de Meta; el canal está en `vivo=false` y sin cron. Aprobar plantillas
   resolvió **una** de cuatro cosas.

## §2 · LOS FRENTES

### Frente 1 — DEUNA, HASTA QUE COBRE

Lo construido y verificado contra QA: las dos edge functions con su buzón de dos
capas, 40 tests, el alta del webhook preparada, la letra corregida cinco veces
contra la API real. Lo que falta es el **actuador** y el **wrapper**, más lo que
las credenciales destraben.

- **DeUna primera y por defecto** está firmado; el orden está montado y el default
  espera piezas.
- 🔴 **La contradicción de la devolución** (24h vs mismo día) va a los T&C del
  cliente. No se adivina: se pregunta y se cita la respuesta.
- El **logo y el manual de marca** son de B: la pantalla de pago tiene que mostrar
  DeUna como su manual manda, no como nos parezca.

### Frente 2 — NUVEI, LA CERTIFICACIÓN

Es el otro riel y tiene calendario ajeno. Requisito duro conocido: el comprobante
por correo con `id` y código de autorización. El frente de correo quedó sano en
S104 (SMTP propio, DKIM restaurado, DMARC reportando), así que la certificación
arranca con ventaja.

⚠️ **D-897 y D-900 muerden acá**, y hay que decirlo antes de empezar: la figura
del mandato de recaudación **no está expresada en el motor** —mandato y cobro en
nombre propio producen los mismos registros— y hay cuatro frenos de producto
firmados por el abogado que impiden publicar los Títulos IV y V de los T&C del
profesional. Certificar un riel de cobro mientras la figura jurídica del cobro no
está expresada es construir sobre una ambigüedad que después es cara.

### Frente 3 — TRES OFICIOS NUEVOS: TELEMEDICINA · ADOPCIÓN · GUARDERÍA

**Son letras, no código.** Cada una es un servicio con reglas propias, y las tres
tocan cosas ya firmadas. Ninguna se construye en esta mesa: se **escriben**.

- **Telemedicina.** Toca `P11` (los beneficios jamás distorsionan recomendaciones
  clínicas), el aviso de IA (§14: la estructuración de la nota clínica no es
  diagnóstico) y la habilitación profesional de los T&C §7. La pregunta que la
  gobierna: **qué puede y qué no puede resolverse sin ver al animal**, y quién
  responde por esa frontera. Es materia con costado regulatorio: va al abogado
  antes de que llegue a una pantalla.
- **Adopción.** Toca `MODELO_LOYALTY` §7.2 (las donaciones jamás otorgan
  beneficios comerciales) y `MODELO_PRODUCTO` §4.4 (la historia viaja con la
  mascota: una adopción **es** una transferencia entre familias, y el motor ya la
  contempla). La pregunta: **quién es responsable del animal durante el proceso**,
  y qué pasa con el expediente si la adopción se cae.
- **Guardería.** Es **custodia de un animal vivo** — la más pesada de las tres.
  `P20` (custodia) quedó pendiente para el abogado desde S103. La pregunta:
  responsabilidad durante la estadía, qué se documenta al entregar y al retirar,
  y qué pasa si el dueño no vuelve.

**Las tres comparten una pregunta de negocio que es del founder, no de la mesa:**
¿cobran comisión como los demás servicios, o tienen su propia economía? De eso
depende si entran al Título IV de los T&C del profesional o piden su propia letra.

### Frente 4 — WHATSAPP, SI DA EL TIEMPO

Con las plantillas aprobadas, faltan tres piezas y una es del founder:

1. **El productor del mapeo** tipo-de-aviso → plantilla. Hoy no existe: el
   transporte lee `resuelto_como->>'plantilla'` y nadie lo escribe, así que toda
   intención rebotaría con `sin_plantilla_resuelta`. **Falta el productor, no
   cambiar el diseño** — el nombre de plantilla es dato de negocio aprobado por
   Meta, no constante de ingeniería.
2. **El System User token** de Meta, con `whatsapp_business_messaging` y
   `whatsapp_business_management`, y el WABA vivo asignado. Llave del founder.
3. **L-201**: 9 de 165 teléfonos fuera de E.164. P21 prohíbe el backfill sin país
   declarado — **la cura es de captura, no de datos**.

## §3 · LO QUE ESTA MESA HEREDA ABIERTO

| deuda | qué es | dueño |
|---|---|---|
| 🔴 **El worker de exportación** | P15 cl.5 promete la copia antes de irse y no existe. La RPC nace apagada y dice `copia_apagada` — la verdad, pero la promesa sigue incumplida | pista |
| 🔴 **D-904** | cerrar cuenta se lleva las mascotas (firmado, sin construir) + no existe eliminar mascota + el traspaso de titularidad no existe | pista + letra |
| 🔴 **D-900** | el mandato que el sistema no expresa. Disparo: antes de la primera liquidación | pista |
| 🔴 **D-897** | cuatro frenos de producto de los T&C: reembolso real, liquidación probada, leyenda «no es factura», salida de sandbox | pista |
| 🟡 **D-902** | la vía manual del carnet que la Política §14.5 promete y no existe | founder + abogado |
| 🟡 **El cierre del negocio** | borrador escrito, sin firmar. Tres obstáculos × tres caminos | founder |
| 🟡 **Apple / cuenta Play** | esperan el D-U-N-S | Kary |
| 🟡 **El splash del ritual** | espera un asset dibujado, con la spec de B como insumo | diseño |
| 🟡 **La respuesta de Anthropic** | disparo de la evaluación de transferencias, o el 23-sep | founder |

## §4 · LO QUE ESTA MESA NO HACE

No construye telemedicina, adopción ni guardería — **las escribe** · no publica
los Títulos IV y V de los T&C hasta que sus cuatro frenos caigan · no enciende el
canal de WhatsApp sin token real y sin el productor del mapeo · no adivina la
respuesta de DeUna sobre la devolución · no renumera sesiones.

## §5 · CÓMO ABRE

1. El founder sube los canónicos + este plan. **A lo deposita** y abre bitácora
   con el número que la bitácora asigne.
2. **Primer turno, sin escribir código:** las cuatro mediciones de §1, cada una
   declarando contra qué objeto se midió.
3. **Checkpoint 1:** la mesa contrasta, el founder firma, se autoriza la tanda 1.
4. Las tres letras nuevas arrancan **en paralelo y en la mesa**, no en las pistas:
   son conversación con el founder y consulta al abogado, no construcción.

---

*Escrito al cierre de la mesa 105, que dejó la puerta de la casa hecha —entrar,
invitar, salir— y el frente legal publicado. Esta mesa cierra los dos rieles de
cobro y le da oficio a tres servicios que hoy no tienen letra. El founder cierra
cada gate con el ojo, como siempre.*

---
---

# §COTEJO — *(agregado por A al depositar; NO es parte del plan)*

> **Pregunta del founder: ¿es el mismo documento que `PLAN_MESA_105`?**
> ## **NO. Son dos documentos distintos, y están en secuencia.**

**Medido comparando los dos archivos, no de memoria:**

| | `PLAN_MESA_105` | `PLAN_MESA_106` |
|---|---|---|
| **subtítulo** | «la cuenta, la identidad y la voz que sale por correo» | «cerrar los rieles y escribir tres oficios nuevos» |
| **escrito** | 22-ago, **al cierre de la mesa 104** | **al cierre de la mesa 105** |
| **§0** | las cinco leyes de instrumento de S103 | **la ley del color**, con sus cinco corolarios |
| **§1** | **tres** precondiciones: push · dominio de correo · `double_confirm_changes` | **cuatro**: DeUna · `pointOfSale` · Nuvei · WhatsApp |
| **frentes** | copia que miente · identidad · cerrar cuenta · invitar familia · correos | DeUna · Nuvei · **tres oficios nuevos** · WhatsApp |
| **§2 pistas** | tiene tabla de pistas (A/B/C/D + E condicional) | **no la tiene** |

**Cero solapamiento de frentes.** Lo que el 106 nombra del 105 lo nombra como
**herencia** (su §3 lista lo que quedó abierto), que es exactamente cómo se
encadenan dos planes consecutivos.

⚠️ **Y una diferencia que NO es de forma y conviene tener a la vista:** el 105
**declaraba sus pistas y sus territorios**; el 106 **no**. *Con cuatro pistas
vivas y A como única que mergea, el reparto va a hacer falta igual* — o se
declara en la mesa, o cada pista lo va a inferir, que es como nacen los cruces de
territorio que el método existe para evitar.
