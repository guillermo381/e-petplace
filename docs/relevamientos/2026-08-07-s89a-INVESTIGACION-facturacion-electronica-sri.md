# INVESTIGACIÓN — Facturación electrónica en Ecuador (SRI) para e-PetPlace

> **Fecha del relevamiento:** 7 de agosto de 2026
> **Alcance:** investigación únicamente. **Cero código escrito, cero migración, cero decisión tomada.**
> **Destino:** insumo para D-419 (SRI integrado en la agenda) y para la mesa del founder.
> **Advertencia de caducidad — leerla antes que nada:** la normativa tributaria ecuatoriana se movió **dos veces en los últimos ocho meses** (transmisión inmediata desde el 1-ene-2026; registro de proveedores desde el 27-jul-2026, hace **once días** al momento de escribir esto). Todo lo que sigue tiene fecha. **Nada de este informe sustituye la lectura del texto vigente ni el criterio de un contador ecuatoriano al momento de ejecutar.**

---

## §0 — Cómo leer este informe (los tres registros de certeza)

Este informe no afirma con la misma fuerza en todos lados, y lo dice en cada línea que importa. Tres marcas:

| Marca | Significa | Qué se puede hacer con eso |
|---|---|---|
| 🟢 **OFICIAL** | Confirmado en `sri.gob.ec` (o `dian.gov.co`) en esta pasada, con la URL citada | Se puede construir contra esto |
| 🟡 **MERCADO** | Fuente secundaria seria (consultoras tributarias, prensa, docs de proveedores) — coherente entre varias fuentes, **no verificado contra el texto legal** | Se puede planificar contra esto; **se verifica antes de ejecutar** |
| ⚪ **INFERENCIA** | Razonamiento de este informe. **No es fuente.** | Sirve para armar la pregunta al contador, **jamás como respuesta** |

**Y una advertencia de método que gobierna el §5:** el caso marketplace es el punto donde este informe es más débil, y lo declara. **No encontré una norma del SRI que resuelva explícitamente el flujo de una plataforma RESIDENTE que cobra comisión sobre servicios prestados por terceros residentes.** Lo que hay es la norma de servicios digitales de **no residentes** (que no es nuestro caso), la regla general de comprobantes, y práctica de mercado observable. Esa distinción se sostiene en todo el §5 — porque *un vacío que se reporta como respuesta es peor que un vacío*.

---

## §1 — Requisitos formales

### 1.1 La obligatoriedad, hoy

🟢 **OFICIAL.** La facturación electrónica en Ecuador opera bajo **esquema OFF-LINE**: el contribuyente genera el comprobante con su propia clave de acceso según especificación técnica, lo firma, y **lo transmite al SRI** para autorización. El SRI **autoriza de oficio** a los contribuyentes obligados — *no hay que pedir permiso previo para empezar*.
Fuente: [sri.gob.ec/facturacion-electronica](https://www.sri.gob.ec/facturacion-electronica)

🟢 **OFICIAL.** El cronograma de obligatoriedad arranca con la **Resolución NAC-DGERCGC13-00236** (Registro Oficial 956, mayo 2013) y se amplió por resoluciones sucesivas hasta cubrir prácticamente el universo de contribuyentes.

🟡 **MERCADO.** La lectura consolidada del mercado es que **desde 2015 la facturación electrónica es obligatoria para todos los contribuyentes, sin excepción práctica relevante**. Para el caso de e-PetPlace esto significa una cosa simple: **no hay una pregunta de "¿nos toca?". Toca.**

### 1.2 El cambio de enero 2026 — el que más afecta a un producto

🟡 **MERCADO (coherente en cuatro fuentes independientes).** Desde el **1 de enero de 2026**:

- **Murió el plazo de gracia de cuatro días hábiles.** La transmisión al SRI debe ser **inmediata**: la fecha de emisión del documento debe corresponder a la fecha en que se realiza la operación.
- **Se prohíbe la anulación de facturas emitidas a consumidor final.**
- Se acortan los plazos de anulación en general.

🟢 **OFICIAL** (el marco): la **Resolución NAC-DGERCGC24-00000035** es la que regula plazos de transmisión de comprobantes electrónicos al SRI (citada en la página oficial del SRI).

⚪ **INFERENCIA — y es la implicación de producto más importante de este párrafo.** "Transmisión inmediata" convierte la emisión en **una operación en línea del camino crítico**, no un batch nocturno. Para e-PetPlace eso quiere decir: el momento del cobro y el momento de la emisión **quedan atados**, y el diseño tiene que contemplar qué pasa cuando el SRI no responde (el esquema off-line lo permite: se emite, se firma, y se reintenta la transmisión; **el comprobante existe antes de la autorización**). *Un producto que asuma "emitir = autorizado sincrónicamente" va a mentir el primer día que el SRI se caiga.*

### 1.3 El cambio de JULIO 2026 — el más nuevo, y el que puede cambiar la arquitectura

🟡 **MERCADO (coherente en siete fuentes: prensa nacional, Lexis, HLB Ecuador, Buró Tributario, estudios jurídicos).** La **Resolución NAC-DGERCGC26-00000027**, emitida el **27 de julio de 2026** (hace once días), establece el **registro obligatorio de proveedores de sistemas informáticos o servicios de facturación electrónica** ante el SRI. Sus piezas:

- Alcanza a dos clases de contribuyentes domiciliados en Ecuador o con establecimiento permanente: **(a)** desarrolladores y dueños del código fuente de sistemas informáticos de facturación; **(b)** dueños de licencias y código fuente de sistemas desarrollados por terceros, **con fines de comercialización**.
- Los proveedores deben registrar en su RUC un **establecimiento y una actividad económica exclusivos** para esta actividad, dentro de **30 días hábiles** desde la publicación en Registro Oficial.
- **Los emisores que usen sistemas de terceros deben incluir el RUC del proveedor en el campo de información adicional de cada comprobante**, dentro de **60 días hábiles** desde la publicación.
- El SRI publicará mensualmente el listado de proveedores registrados (primeros diez días hábiles de cada mes).

⚪ **INFERENCIA — y acá hay una pregunta abierta que no se puede cerrar investigando, es de criterio legal.** El texto apunta a quien **comercializa** software de facturación. e-PetPlace, si construye un facturador **para su propio uso** (emitir sus propias facturas de comisión bajo su propio RUC), **probablemente no cae en el supuesto** — no hay comercialización del sistema. Pero **si e-PetPlace emite comprobantes por cuenta de los prestadores** (el escenario white-label del §5.4), la frontera se vuelve borrosa: estaría prestando un *servicio de facturación electrónica* a terceros, que es exactamente la segunda mitad del título de la resolución.

> **Esto es una pregunta para el contador/abogado tributario, no para más búsqueda.** Y es **bloqueante del escenario white-label**, no del escenario mínimo. Registrado abajo como decisión del founder (§8, D1).

Fuentes: [Vistazo](https://www.vistazo.com/negocios/economia/2026-07-30-proveedores-sistemas-facturacion-electronica-deberan-registrarse-sri-ecuador-NC11138036) · [Buró Tributario](https://burotributario.com.ec/el-sri-mediante-la-resolucion-no-nac-dgercgc26-00000027-establece-normas-para-el-registro-de-proveedores-de-sistemas-informaticos-o-servicios-de-facturacion-electronica-en-el-ruc/) · [HLB Ecuador](https://www.hlbecuador.com/nueva-regulacion-del-sri-fortalece-el-control-sobre-los-proveedores-de-facturacion-electronica/) · [Lexis](https://www.lexis.com.ec/noticias/sri-crea-registro-obligatorio-de-proveedores-de-facturacion-electronica)

### 1.4 RUC y régimen: RIMPE vs. general

🟡 **MERCADO (coherente en seis fuentes).** El **RIMPE** (Régimen Simplificado para Emprendedores y Negocios Populares) tiene dos categorías por ingreso bruto anual:

| Categoría | Ingreso bruto anual | Nota |
|---|---|---|
| **Negocio Popular** | hasta USD 20.000 | |
| **Emprendedor** | USD 20.001 – 300.000 | Debe emitir factura electrónica y llevar registro de compras y ventas |
| **Régimen General** | > USD 300.000 | Salida automática del RIMPE |

🟡 **MERCADO.** Cambio relevante de 2026: **quienes estuvieron en RIMPE durante 2023, 2024 y 2025 pasan al régimen general en 2026** por cumplimiento del plazo. Una cantidad importante de contribuyentes salió del RIMPE este año.

**Qué implica para una plataforma que cobra comisión** — ⚪ **INFERENCIA:**

1. **Para e-PetPlace como emisora de su comisión:** el régimen determina la tarifa de impuesto a la renta y las obligaciones de retención, **no la mecánica de facturación electrónica** (que es la misma). Si e-PetPlace es sociedad, va a régimen general por naturaleza. Si es persona natural, entra al RIMPE mientras esté bajo el techo.
2. **Para los prestadores — y esto sí es de producto:** los prestadores de e-PetPlace van a estar mayoritariamente en **RIMPE Emprendedor o Negocio Popular**, y **una fracción no va a tener RUC en absoluto** (el paseador informal, el groomer que recién arranca). Eso no es un detalle contable: **define tres poblaciones con tres tratamientos distintos**, y el §5.3 las desarrolla. *Un modelo de datos que asuma "todo prestador tiene RUC" va a chocar con la realidad del reclutamiento el primer mes.*

### 1.5 IVA — y una ambigüedad legal viva que conviene no heredar sin mirar

🟡 **MERCADO.** La tarifa general del IVA es **15%** y **se mantiene vigente en 2026** según la **Circular NAC-DGECCGC25-00000006** del SRI (26 de diciembre de 2025). Subió de 12% a 15% en abril de 2024 por la Ley Orgánica para Enfrentar el Conflicto Armado Interno.

⚠️ **AMBIGÜEDAD DECLARADA, no resuelta por este informe.** El art. 65 de la Ley de Régimen Tributario Interno fija la tarifa general en **13%**, y permite subirla hasta 15% **solo mediante decreto ejecutivo** con dictamen favorable del Ministerio de Economía. El Decreto 470 (4-dic-2024) mantuvo el 15% **explícitamente para el año 2025**. Existe discusión pública entre tributaristas ecuatorianos sobre si, **a falta de decreto para 2026**, aplica el 15% o el 13%. El SRI sostiene el 15% por circular.

⚪ **INFERENCIA operativa:** para e-PetPlace la conclusión práctica es que **la tarifa de IVA no se hardcodea**. Debe ser dato de configuración con fecha de vigencia — el mismo criterio que `MODELO_FINANCIERO` §7 ya aplica a la comisión (*"la comisión se lee de `fee_configs`, jamás hardcodeada"*). **La regla existente se extiende al IVA sin inventar nada.**

Fuentes: [Russell Bedford EC](https://russellbedford.com.ec/el-iva-en-ecuador-se-mantiene-en-15-segun-el-sri/) · [El Diario](https://www.eldiario.ec/ecuador/iva-ecuador-15-por-ciento-2026-29122025/)

---

## §2 — Firma electrónica

### 2.1 Qué exige el SRI

🟢 **OFICIAL.** La página del SRI lista cuatro requisitos para emitir comprobantes electrónicos: **(1) firma electrónica** — *"reemplaza la firma manuscrita"* —, **(2) software** generador (propio o la herramienta gratuita del SRI), **(3) conexión a internet**, **(4) clave de acceso a SRI en Línea**.

🟡 **MERCADO.** El certificado debe ser emitido por una **Entidad de Certificación de Información (ECI) acreditada por ARCOTEL** (Agencia de Regulación y Control de las Telecomunicaciones). ARCOTEL publica la lista oficial de acreditadas. **Solo las acreditadas por ARCOTEL emiten certificados con validez legal.**

### 2.2 Quién los emite

🟡 **MERCADO.** Hay **17 o más ECIs acreditadas** en 2026, públicas y privadas. Las que aparecen consistentemente:

| Entidad | Nota |
|---|---|
| **Banco Central del Ecuador (BCE)** | La pionera; entrega vía Registro Civil |
| **Security Data** | La más usada por contadores ecuatorianos |
| **UANATACA** | Ofrece videoidentificación remota (sin ir a oficina) |
| **ANF AC** | También videoidentificación remota |
| **ICERT-EC (Consejo de la Judicatura)** | La opción más económica con tarifa oficial publicada |

### 2.3 Costo y vigencia

🟡 **MERCADO.**

- **Rango general:** USD **16 a 60**, según ECI, vigencia y formato.
- **ICERT-EC:** ~USD 19,80 + IVA por 2 años (tarifa oficial publicada).
- **Privadas (UANATACA, Security Data, ANF):** desde USD 30–35, con trámite 100% remoto.
- **Vía Datil** (dato de su propia página de planes, 7-ago-2026): 1 año **USD 20** · 2 años **USD 35** · 3 años **USD 45**, sin impuestos.
- **Vigencia:** 1, 2 o 3 años según proveedor.

⚪ **INFERENCIA:** el costo del certificado es **irrelevante frente a cualquier otra línea del presupuesto**. No es una variable de decisión. Lo que sí es variable de decisión es **la vigencia**, porque **la renovación es una operación manual con fecha dura**: el día que vence, la emisión se detiene. Eso pide una alerta operativa, no una decisión de compra. *(Registrado abajo como candidato a deuda: el vencimiento de un certificado es exactamente la clase de dato viejo que dice "no se puede" y no se descubre — el patrón que S84 dejó escrito.)*

### 2.4 Formato, y la implicación técnica real

🟡 **MERCADO.** Formatos disponibles: **archivo `.p12` / `.pfx`**, **token USB**, **HSM**, y **certificado en nube**.

⚪ **INFERENCIA — y es el nudo técnico de todo el informe.** Firmar desde un backend exige que el certificado sea **`.p12` en archivo** (o en nube con API). **El token USB es incompatible con un backend headless**: requiere presencia física del dispositivo. Cualquier ruta que pase por token USB mata la automatización.

**Lo que hay que firmar:** el SRI exige **XAdES-BES** (XML Advanced Electronic Signature, Basic Electronic Signature) sobre el XML del comprobante, con envolvente *enveloped*. No es una firma trivial: exige canonicalización XML correcta, referencias con transformaciones específicas, y una estructura de `SignedProperties` que el SRI valida con rigor. **Es notoriamente el punto donde fallan las implementaciones propias** — hay un issue abierto en `xadesjs` (la librería XAdES general de TypeScript más seria) titulado literalmente *"Adjust the xades-bes signature to the SRI Ecuador requirement"*, lo que confirma que la librería genérica **no sale de la caja** para Ecuador.

**Sobre Supabase Edge Functions (Deno) específicamente:**

🟡 **MERCADO.** Supabase Edge Functions corren sobre **Deno** (Supabase Edge Runtime), con soporte de módulos npm y APIs built-in de Node.

⚠️ **NO CONFIRMADO — y es un riesgo técnico que hay que medir, no asumir.** No pude confirmar en esta pasada que el manejo de **PKCS#12 (`.p12`)** funcione sin fricción en Deno bajo el runtime de Supabase. `node:crypto` en Deno tiene cobertura parcial histórica, y la lectura de un `.p12` (desencriptar el keystore, extraer clave privada y cadena de certificados) es justamente la clase de operación que suele quedar en los bordes de la compatibilidad. **Si la ruta elegida fuera firmar en casa, esto es lo PRIMERO que hay que probar — un spike de medio día, contra el runtime real desplegado, jamás contra `deno run` local.** *La medición decide; el supuesto no.*

⚪ **INFERENCIA adicional:** además del runtime, hay un problema de **custodia**. El `.p12` y su clave son material criptográfico que **no puede vivir en el repo** (regla ya establecida en la casa: la lección de S79 sobre credenciales — *navegador → terminal, jamás al chat*). Vivirían como secret de Supabase, con el founder como custodio. **Y si se firmara por cuenta de prestadores, serían N certificados de N terceros bajo custodia de e-PetPlace** — que es un problema de responsabilidad legal, no técnico. Se desarrolla en §5.4.

---

## §3 — Esquema técnico

### 3.1 La especificación

🟢 **OFICIAL.** El documento normativo es la **"Ficha Técnica de Comprobantes Electrónicos Esquema Off-line"**, actualmente en **versión 2.34 (actualizada julio 2026)**, publicada por el SRI. *(Nota: una versión anterior, la 2.26, es la que más circula en foros y tutoriales — **construir contra la 2.34, no contra lo que aparece primero en Google**.)*

🟢 **OFICIAL.** Documentos electrónicos permitidos: **facturas, liquidaciones de compra, notas de crédito, notas de débito, comprobantes de retención y guías de remisión.**

### 3.2 La clave de acceso (49 dígitos)

🟡 **MERCADO** (la estructura está definida en el **Anexo 5 de la Ficha Técnica** — 🟢 la existencia del anexo es oficial; el desglose de abajo es lectura de fuentes secundarias):

Concatenación de campos de longitud fija, 48 dígitos + 1 verificador:

| Campo | Long. | Nota |
|---|---|---|
| Fecha de emisión | 8 | `ddmmaaaa` |
| Tipo de comprobante | 2 | `01` factura, `03` liquidación de compra, `04` NC, `05` ND, `07` retención, `06` guía |
| RUC del emisor | 13 | |
| Tipo de ambiente | 1 | `1` pruebas · `2` producción |
| Serie | 6 | establecimiento (3) + punto de emisión (3) |
| Secuencial | 9 | |
| Código numérico | 8 | a discreción del emisor |
| Tipo de emisión | 1 | `1` normal |
| **Dígito verificador** | **1** | **módulo 11** |

**Algoritmo del verificador (módulo 11):** recorrer los 48 dígitos **de derecha a izquierda**, multiplicando por coeficientes cíclicos **2,3,4,5,6,7** (después del 7 vuelve al 2); sumar los productos; calcular `11 − (suma mod 11)`; **si da 11 → 0**, **si da 10 → 1**.

⚪ **INFERENCIA:** el dígito verificador es la clase de cosa que se implementa mal en silencio — un error acá produce una clave sintácticamente válida que el SRI rechaza. **Si se implementa en casa, se implementa con un fixture de claves reales conocidas** (hay decodificadores públicos que permiten armarlo). *Un cálculo sin contra-caso es una afirmación, no una verificación.*

### 3.3 El flujo recepción → autorización

🟢 **OFICIAL** (el esquema): off-line, dos ambientes — **Pruebas/Certificación** (comprobantes sin validez tributaria) y **Producción** (validez plena).

🟡 **MERCADO** (los endpoints): dos webservices **SOAP/WSDL**:

- `RecepcionComprobantes` → método `validarComprobante`, recibe el XML **firmado**, en `byte[]` (base64). Responde `RECIBIDA` o `DEVUELTA` con mensajes de error.
- `AutorizacionComprobantes` → método `autorizacionComprobante`, recibe la **clave de acceso**. Responde con estado `AUTORIZADO` / `NO AUTORIZADO` / `EN PROCESO`, número de autorización y el XML autorizado.

**Ambiente de pruebas (confirmado en múltiples fuentes técnicas):**
```
https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantes?wsdl
https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantes?wsdl
```

⚠️ **NO CONFIRMADO en esta pasada:** el host de **producción**. El conocimiento común de la comunidad técnica es `cel.sri.gob.ec` (mismo path), pero **no lo verifiqué contra la Ficha Técnica 2.34 ni contra una página oficial del SRI**. Se lee del Anexo correspondiente antes de configurar nada. *Declarado como hueco, no rellenado con lo verosímil.*

🟡 **MERCADO.** El SRI puede tardar **hasta 24 horas** en autorizar bajo esquema off-line, aunque en la práctica la mayoría se autoriza en minutos.

⚪ **INFERENCIA de producto — y es importante para la UI del prestador:** hay **tres estados distintos** que la superficie no puede colapsar: *emitido y firmado* · *recibido por el SRI* · *autorizado*. El comprobante **existe legalmente** desde la emisión bajo esquema off-line, pero el RIDE no es plenamente válido hasta portar el número de autorización. **Una pantalla que muestre "facturado ✓" sin distinguir estos tres miente en el caso exacto en que importa** — el mismo defecto de clase que la casa ya cazó con `gps_estado` en S62 y con los tres eslabones del cierre en S82.

### 3.4 El RIDE

🟡 **MERCADO.** **RIDE = Representación Impresa del Documento Electrónico.** Es la versión legible por humanos del comprobante. Formatos aceptados: **PDF** (el habitual), JPG, PNG, papel.

Elementos obligatorios reportados de forma consistente:
- **Clave de acceso (49 dígitos)**
- **Número de autorización**
- **Código QR** que permite verificar el comprobante contra el portal del SRI (o llegar al XML original)
- Identificación del emisor (razón social, RUC, dirección) y del receptor
- Fecha de emisión y detalle de la transacción

⚪ **INFERENCIA — el punto que suele subestimarse.** **El XML es el documento legal; el RIDE es solo su representación.** Lo que hay que archivar y poder entregar es el **XML autorizado**, no el PDF. Un diseño que guarde solo el PDF pierde el documento. *(Cruza con D-416: existe en la DB una tabla `facturas` huérfana, con shape SRI y cero filas, sin origen en ninguna migración del repo. **Si se toca este arco, esa tabla se documenta o se jubila primero** — un objeto sin historial es drift esperando morder.)*

---

## §4 — Proveedores vs. hacerlo uno mismo

### 4.1 Proveedores ecuatorianos con API

**Dátil** — 🟡 **MERCADO** (datos de su sitio y su doc, leídos el 7-ago-2026):

- **API REST/JSON.** Doc pública en [datil.dev](https://datil.dev/) y [developers.datil.co](http://developers.datil.co/).
- **Dátil firma el XML por vos.** El certificado se sube a Dátil; la clave viaja por header `X-Password`, la API key por `X-Key`.
- Endpoints principales: `POST /invoices/issue`, `POST /invoices/issue/xml`, `GET /invoices/<id>`, `POST /invoices/:id/reissue`.
- Ambientes: `ambiente: 1` (pruebas) / `ambiente: 2` (producción).
- Emite facturas, retenciones, notas de crédito y débito, y guías de remisión. Genera RIDE.

**Planes anuales publicados** (sin impuestos; el sitio anuncia *"12 meses por el precio de 10"*):

| Plan | Precio/año | Documentos | API |
|---|---|---|---|
| Mini | USD 25 | 12 | ✔ |
| Lite | USD 80 | 60 | ✔ |
| Plus | USD 140 | 120 | ✔ |
| Pro | USD 340 | 1.200 | ✔ |

⚠️ **AMBIGÜEDAD DECLARADA:** la lectura del sitio sugiere que las cantidades de documentos son **mensuales** con precio **anual**, pero la página no lo dice de forma inequívoca en el fragmento extraído. **Se confirma con el proveedor antes de dimensionar.** Si fueran anuales, el plan Pro (1.200 documentos/año = 100/mes) sigue siendo holgado para un soft launch. *(No lo relleno con el supuesto que me conviene.)*

⚠️ **NO DOCUMENTADO:** la doc de Dátil **no explicita soporte multi-emisor / multi-RUC** (el caso marketplace, emitir por cuenta de N prestadores). **Es una pregunta directa al proveedor**, y es la que decide si Dátil sirve para el escenario white-label o solo para el escenario mínimo.

**Contífico (Siigo)** — 🟡 **MERCADO:**
- Tiene **API Key** para integración. Software contable en nube con facturación electrónica integrada.
- **No publica precios**: exige contacto comercial para cotización. Se mencionan un "Plan 24" (24 documentos anuales) y uno de 120 documentos anuales.
- ⚪ **INFERENCIA:** su fuerte es *contabilidad integrada*, no *API-first*. Para un producto que quiere emitir programáticamente y nada más, es más pesado que Dátil. **La opacidad de precios es en sí misma un costo de evaluación.**

**Otros mencionados en el mercado ecuatoriano** (🟡, sin evaluar en profundidad): Factuplan, Armonía123, Azur, Ecuafact, FacturaIA, Facturero Móvil. Varios son SaaS de facturación con UI, no necesariamente API-first.

**El facturador gratuito del SRI** — 🟢 **OFICIAL.** El SRI ofrece una **herramienta gratuita** de generación de comprobantes ([sri.gob.ec/facturador-sri](https://www.sri.gob.ec/facturador-sri)).
⚪ **INFERENCIA — y no es un chiste, es una opción real para el día 1:** para emitir **una factura de comisión por prestador por mes** a volúmenes de soft launch (15 prestadores → 15 facturas/mes), la herramienta gratuita del SRI **alcanza, cuesta cero, y no requiere una sola línea de código**. Se descarta cuando el volumen o la fricción operativa lo justifiquen — no antes.

### 4.2 Open source (Node/Deno/JS)

🟡 **MERCADO** (repos verificados como existentes; **no auditados en calidad, mantenimiento ni licencia** — eso exige una pasada aparte):

| Proyecto | Qué es |
|---|---|
| [`jybaro/xades-bes-sri`](https://github.com/jybaro/xades-bes-sri) | Implementación de firma XAdES-BES en JavaScript, **específicamente para ser aceptada por el SRI** |
| [`Jairbal/mora-sri-gateway`](https://github.com/Jairbal/mora-sri-gateway) | API REST open source en **NestJS**: genera XML, firma XAdES-BES, envía al SRI por SOAP, obtiene autorización, genera RIDE (PDF+QR), notifica por webhook. **Multitenant.** El más completo que encontré |
| [`PeculiarVentures/xadesjs`](https://github.com/PeculiarVentures/xadesjs) | XAdES genérico en TypeScript. **Requiere ajuste para el SRI** (issue #100 abierto sobre exactamente eso) |
| [`alfredo138923/xades-bes-sri-ec`](https://github.com/alfredo138923/xades-bes-sri-ec) | Equivalente en Python. Útil como referencia de la estructura correcta aunque no se use |

⚠️ **Advertencia sobre `mora-sri-gateway`:** es **NestJS (Node)**, no Deno. Correrlo implicaría un servicio aparte del stack actual (Supabase Edge Functions), con su propio hosting y su propio ciclo de despliegue. **Eso no es una integración: es un componente nuevo de infraestructura.** El costo real no es el código: es el segundo lugar donde algo se puede caer.

### 4.3 La comparación, con criterio de costo / tiempo / riesgo

| Eje | Proveedor con API (Dátil) | Construirlo en casa |
|---|---|---|
| **Costo directo** | USD 25–340/año + certificado (~USD 20–45) | Certificado (~USD 20–45) + hosting si sale de Edge Functions |
| **Tiempo de integración** | ⚪ **2–5 días** de un dev — es un cliente HTTP contra una API REST documentada | ⚪ **4–8 semanas** realistas: XAdES-BES correcto + clave de acceso + SOAP + certificación en ambiente de pruebas del SRI + RIDE + manejo de estados y reintentos |
| **Riesgo de firma** | **Del proveedor.** Si el SRI cambia la especificación, lo absorbe él | **Nuestro.** Es el punto donde más implementaciones fallan, y el modo de falla es un rechazo del SRI en producción |
| **Riesgo de runtime (Deno/`.p12`)** | **Cero** — no se firma en casa | ⚠️ **Sin medir.** Es el spike que decide la viabilidad de esta columna |
| **Riesgo normativo** | Menor: el proveedor sigue las resoluciones (y **la del 27-jul-2026 lo obliga a registrarse — un proveedor registrado es un proveedor auditado**) | **Nuestro entero**, incluida la pregunta abierta de si nos convierte en "proveedor" registrable |
| **Deuda operativa** | Renovación del certificado, monitoreo del proveedor | Todo lo anterior, más mantener la implementación contra cada versión de la Ficha Técnica (va por 2.34 y se movió en julio) |

### 4.4 Recomendación

⚪ **INFERENCIA, y es la conclusión central de este informe.**

> **Para un equipo chico con soft launch el 1-oct-2026 — a ocho semanas de hoy — construir la facturación electrónica en casa es la decisión equivocada, y no por un poco.**

Las tres razones, en orden de peso:

1. **El calendario no da, y el riesgo no es lineal.** Ocho semanas es el orden de magnitud del *mejor caso* de una implementación propia, y ese mejor caso asume que el spike de `.p12` en Deno sale bien a la primera. **Y esas ocho semanas compiten contra el resto del soft launch**, no se suman a él.
2. **La firma XAdES-BES del SRI es un problema resuelto por otros y mal resuelto por casi todos.** No hay ventaja competitiva alguna en resolverlo de nuevo. *e-PetPlace no vende facturación.*
3. **La resolución del 27-jul-2026 cambió el terreno hace once días.** Cuando la normativa se mueve así de rápido, **el proveedor es también un seguro contra el cambio**: absorbe la próxima resolución sin que nosotros movamos código.

**La forma recomendada — y es más chica de lo que la pregunta sugiere:** ver §7.

---

## §5 — El caso marketplace: quién factura a quién

### 5.1 Lo que NO encontré, dicho primero

⚠️ **HUECO DECLARADO.** **No encontré en `sri.gob.ec` una norma que resuelva explícitamente el flujo de facturación de una plataforma RESIDENTE en Ecuador que intermedia servicios prestados por terceros residentes y cobra comisión.**

Lo que sí existe y **no es nuestro caso**:
- 🟢 **OFICIAL:** el régimen de **IVA para prestadores de servicios digitales NO residentes** ([registro, declaración y pago](https://www.sri.gob.ec/registro-declaracion-y-pago-del-iva-prestadores-de-servicios-digitales-no-residentes)). Es la norma de Netflix, Uber BV, Spotify. **e-PetPlace, siendo ecuatoriana, no cae ahí.**

**Esto significa que el §5 se apoya en la regla general de comprobantes de venta y en práctica observable — no en una norma específica del caso.** Y eso es exactamente por qué el §8 abre con una consulta a un contador ecuatoriano como decisión no delegable.

### 5.2 El modelo estándar: dos facturas

⚪ **INFERENCIA** (respaldada por 🟡 práctica de mercado observable en plataformas que operan en Ecuador):

```
                 paga USD 30 (servicio + IVA)
   FAMILIA  ─────────────────────────────────►  PRESTADOR
      ▲                                             │
      │      FACTURA A (prestador → familia)        │
      │      por el servicio completo, con su RUC   │
      │                                             │
      │                                             │ FACTURA B
      │                                             │ (e-PetPlace → prestador)
      │                                             │ por la COMISIÓN, con IVA
      │                                             ▼
      └───────────  e-PetPlace  ◄───────────────────┘
                (intermediaria)
```

- **Factura A — el prestador factura a la familia** por el **servicio completo** (los USD 30), bajo su propio RUC. *El servicio lo presta él; la plataforma no pasea perros.*
- **Factura B — e-PetPlace factura al prestador** por **su comisión** (los USD 4,50 del 15%), **con IVA sobre la comisión**. Es un servicio de intermediación, y es gravado.

🟡 **MERCADO — el matiz que el propio SRI marcó, y que importa.** El SRI ha señalado públicamente que hay plataformas que **no cobran comisión identificable** sino que **cobran por la gestión completa del servicio** — y que en ese caso el IVA se grava sobre **el valor total** de la operación, no sobre una comisión. El caso citado en prensa es Uber en Ecuador: *"no hay una comisión identificada y, por eso, se cobra el IVA sobre el valor de la carrera"*, mientras que en delivery el IVA se grava sobre la comisión.
Fuentes: [Primicias](https://www.primicias.ec/noticias/economia/normas-cobro-impuesto-plataformas-digitales/) · [El Comercio](https://www.elcomercio.com/actualidad/negocios/clientes-uber-iva-factura-servicio/)

> ⚪ **La lección que se saca de ahí, y es de diseño de producto, no de contabilidad:** **si la comisión es explícita, identificable y contractual, el tratamiento es el de intermediación — y es el más limpio.** e-PetPlace **ya cumple esa condición por construcción**: `MODELO_FINANCIERO` §7 exige que **toda superficie donde el prestador pone precio muestre el neto descontando la comisión, leída de `fee_configs`**. *La transparencia de la comisión, que se diseñó como decisión de producto, resulta ser también la posición fiscal más defendible.* Es un hallazgo, no una coincidencia: **una comisión que el prestador ve es una comisión que existe.**

### 5.3 Las tres poblaciones de prestadores — el problema real

⚪ **INFERENCIA, y es la parte de este informe que más toca el modelo de datos.**

El modelo de dos facturas asume que **el prestador tiene RUC y factura**. En el reclutamiento real de e-PetPlace eso va a ser cierto para una fracción. Hay tres poblaciones:

| Población | Situación | Tratamiento | Qué necesita el producto |
|---|---|---|---|
| **A — Con RUC, régimen general o RIMPE Emprendedor** | Factura electrónicamente ya (obligación que **ya tiene**, independiente de e-PetPlace) | Modelo de dos facturas, limpio | Capturar y **validar el RUC**; recibir su factura o confiar en que la emite |
| **B — RIMPE Negocio Popular** | Tiene RUC pero con obligaciones simplificadas | Igual que A, con matices de retención | Igual que A |
| **C — Sin RUC** | El paseador informal, la persona que recién arranca | 🟡 **La figura aplicable es la LIQUIDACIÓN DE COMPRA** (ver §5.5) | Camino distinto **y letra propia** |

⚪ **Consecuencia de producto, declarada sin adornos:** **`prestadores` no tiene hoy campo de RUC ni de régimen tributario** *(inferencia sobre el estado del schema — **no verificada contra la DB en esta pasada**; se mide antes de planificar)*. Si el modelo de dos facturas se adopta, **capturar el RUC y el régimen del prestador pasa a ser parte del alta**, no un extra. Y el alta del prestador **ya existe y ya está construida** (S79) — sería una enmienda a una superficie viva, con su propia migración y su propio gate.

### 5.4 El escenario white-label: e-PetPlace factura POR el prestador

⚪ **INFERENCIA — se describe para poder descartarlo con conocimiento, no para proponerlo.**

Hay plataformas que emiten los comprobantes **por cuenta de sus prestadores** (el prestador entrega su certificado, la plataforma emite bajo el RUC del prestador). Es lo que hace que la experiencia sea impecable: el prestador no toca el SRI nunca.

**Y es, con mucha diferencia, el camino más caro y más riesgoso.** Sus cuatro costos, que no son técnicos:

1. **Custodia de N certificados de terceros.** e-PetPlace tendría bajo custodia el material criptográfico con el que se firma legalmente en nombre de otros. Eso es responsabilidad civil, no una tabla.
2. **La resolución del 27-jul-2026 muy probablemente aplica.** Prestar servicios de facturación electrónica a terceros es literalmente el objeto de la norma. Registro en RUC con actividad económica exclusiva, y el RUC de e-PetPlace tendría que aparecer en el campo de información adicional de cada comprobante emitido. ⚠️ **Pregunta legal abierta, no resuelta acá.**
3. **Exige soporte multi-emisor del proveedor** — que la doc de Dátil no documenta (§4.1).
4. **Un error de e-PetPlace se convierte en un problema tributario del prestador**, no de e-PetPlace.

> ⚪ **Posición de este informe:** **el white-label no es un camino de soft launch. Es un camino de madurez, si alguna vez.** Y su precondición no es técnica: es la respuesta legal a (2).

### 5.5 La liquidación de compra: la pieza para la población C

🟢 **OFICIAL** (el marco): la liquidación de compra es uno de los comprobantes electrónicos permitidos por el SRI, regulada en el **Reglamento de Comprobantes de Venta, Retención y Documentos Complementarios**.

🟡 **MERCADO** (la mecánica, coherente en cinco fuentes): **la emite el COMPRADOR, no el vendedor.** Procede cuando se adquieren bienes o servicios a personas que **no están obligadas a emitir comprobantes de venta** o **no tienen RUC** — el ejemplo canónico es el servicio ocasional de una persona natural no inscrita. **El comprador retiene el 100% del IVA** cuando el servicio está gravado, y emite el comprobante de retención.

⚪ **INFERENCIA:** esto abre un camino para la población C, **pero cambia el rol de e-PetPlace de intermediaria a compradora del servicio** — con las obligaciones de retención que eso arrastra. **No es una variante menor del modelo de dos facturas: es otro modelo.** Y su viabilidad depende de si e-PetPlace es realmente quien "compra" el servicio o solo lo intermedia, que es precisamente la pregunta de la que depende todo el §5.

### 5.6 El agravante que ya vive en el modelo financiero

⚠️ **HALLAZGO DE ESTE RELEVAMIENTO, cruzando la investigación con el repo.**

`MODELO_FINANCIERO` §2 declara textualmente:

> *"**Fase 1 (actual):** Kushki básico. **La plata entra a la cuenta master de e-PetPlace.** La plataforma transfiere manualmente al actor vía liquidaciones. **Fase 2 (cuando Kushki firme contrato Marketplace):** Kushki hace split automático."*

⚪ **INFERENCIA, y es probablemente la pregunta fiscal más importante de todo este informe:** en Fase 1, **el 100% del dinero de cada transacción entra a una cuenta de e-PetPlace**, y e-PetPlace después transfiere al prestador. Fiscalmente, la pregunta que eso abre es:

> **¿Los USD 30 que entran son ingreso de e-PetPlace, o son USD 4,50 de ingreso propio y USD 25,50 cobrados por cuenta de un tercero?**

La diferencia **no es cosmética**. Si el SRI considerara que el ingreso bruto de e-PetPlace es el total transaccionado y no la comisión, cambia la base imponible, cambia el régimen aplicable (el techo de RIMPE de USD 300.000 se cruzaría con volúmenes de transacción muy modestos), y cambia el impuesto a la renta.

⚪ La figura que normalmente resuelve esto es el **cobro por cuenta de terceros** (mandato / gestión de cobranza), pero **exige respaldo contractual explícito** — el contrato con el prestador tiene que decir que e-PetPlace cobra **en su nombre**, y la contabilidad tiene que reflejar esos fondos como pasivo, no como ingreso.

> **Esto es de contador y de abogado, y es previo a escribir una línea de código de facturación.** Registrado en §8 como decisión D2 — **y es la que puede reordenar el resto**. *(Nota de honestidad: el Fase 2 con split automático de Kushki resuelve el problema de raíz, porque el dinero del prestador nunca toca la cuenta de e-PetPlace. **La solución fiscal más limpia es una decisión de pasarela, no de facturación.**)*

---

## §6 — Colombia (DIAN), anotado para después

> Sección breve y deliberadamente menos profunda: Colombia no es el mercado del 1-oct-2026. Se deposita para que exista cuando se necesite, no para decidir hoy.

🟢 **OFICIAL** (dian.gov.co) / 🟡 **MERCADO** según se indica.

### 6.1 El marco

🟡 La factura electrónica es obligatoria en Colombia. El estándar es **UBL 2.1** (XML), y la norma de referencia vigente es la **Resolución 000165 de 2023** de la DIAN.

### 6.2 Diferencia estructural #1 — validación previa

⚪ **INFERENCIA (la diferencia que más cambia la arquitectura):** Colombia opera con **validación previa** — la DIAN valida el documento **antes** de que sea válido y devuelve el **CUFE** (Código Único de Facturación Electrónica) o **CUDE** para otros documentos. Ecuador opera **off-line**: el comprobante existe firmado y la autorización llega después.

> **No son la misma integración con otro endpoint. Son dos modelos de tiempo distintos.** Un diseño que asuma el modelo ecuatoriano (emitir ahora, autorizar después) **no se porta a Colombia cambiando una URL.** Esto es lo que hay que saber al diseñar hoy: **si Colombia está en el horizonte, la abstracción de "emitir comprobante" tiene que soportar los dos modelos desde el día 1, o se reescribe.**

### 6.3 Diferencia estructural #2 — el proveedor tecnológico está reglado

🟢 **OFICIAL.** La DIAN **habilita formalmente** a los *Proveedores Tecnológicos*. Requisitos del art. 55 de la Resolución 000165 de 2023 (🟢, del ABECÉ oficial de la DIAN): estar constituido como **sociedad en Colombia** o sucursal de sociedad extranjera; inscribirse en el **RUT**; **registrar en el objeto social** las actividades de generación, entrega y transmisión de factura electrónica; y **todo proveedor tecnológico debe ser a su vez facturador electrónico**.

🟡 Hay **más de 80 proveedores habilitados**.

⚪ **INFERENCIA — el paralelo que vale registrar:** Colombia ya tenía en 2023 lo que Ecuador acaba de introducir en julio de 2026 con la resolución NAC-DGERCGC26-00000027. **Ecuador se está pareciendo a Colombia en el control sobre proveedores.** Si la tendencia sigue, el escenario white-label se vuelve más regulado, no menos.

### 6.4 Proveedores colombianos con API

🟡 **MERCADO** (sin evaluar en profundidad; ninguno verificado en precio):

| Proveedor | Nota |
|---|---|
| **Alegra** | Proveedor autorizado por la DIAN, API de alto rendimiento, integración sin costo de implementación |
| **Factus** | API-first; el usuario solicita rangos de numeración a la DIAN y los vincula |
| **Siigo** | El de mayor participación de mercado; también dueño de Contífico en Ecuador |
| **Alanube** | API multi-país (Colombia + otros) |
| World Office, Bsale | Mencionados como habilitados |

⚪ **Nota que puede ahorrar trabajo cuando llegue el momento:** **Siigo opera en los dos países** (Siigo Colombia y Siigo Contífico Ecuador), y **Alanube se posiciona como API multi-país**. Si Colombia entra al plan, **un proveedor que cubra ambos mercados vale más que el mejor proveedor de cada uno por separado** — no por precio, sino porque evita mantener dos abstracciones.

### 6.5 El equivalente del §5.5

🟡 Colombia tiene el **Documento Soporte en Adquisiciones a No Obligados a Facturar** — el análogo funcional de la liquidación de compra ecuatoriana, para la población C. **La estructura del problema marketplace se repite en los dos países.**

---

## §7 — El camino recomendado, con sus costos y sus tiempos

⚪ **Todo este apartado es INFERENCIA de este informe.** Es una propuesta, **no una decisión** — y no rige hasta que el founder la firme (regla 80 de la casa: *lo propuesto sin firma no rige*).

### La tesis

> **Facturar la comisión, y nada más. Con un proveedor, no con código propio. Y lo mínimo posible antes del 1-oct.**

La razón es de secuencia, no de pereza: **la pregunta fiscal del §5.6 puede reordenar todo el diseño**, y construir antes de tenerla contestada es construir contra una premisa no medida — el defecto de mesa que la casa ya registró cinco veces.

### Fase 0 — Antes del soft launch (hoy → 1-oct-2026, ~8 semanas)

**Objetivo: estar en regla, con cero código de facturación.**

| Paso | Qué | Costo | Tiempo |
|---|---|---|---|
| 0.1 | **Consulta con contador ecuatoriano** sobre §5.6 (cobro por cuenta de terceros) y §5.2 (modelo de dos facturas) | ⚪ USD 150–400 estimado, sin verificar | 1–2 semanas de calendario |
| 0.2 | **Certificado de firma electrónica** para e-PetPlace (`.p12`, ECI acreditada por ARCOTEL, vigencia 2–3 años) | USD 20–45 | 1–3 días (remoto con UANATACA/ANF) |
| 0.3 | **Emitir las facturas de comisión a mano**, con el facturador gratuito del SRI o un plan Mini de Dátil (USD 25/año) | USD 0–25 | Cero desarrollo |
| 0.4 | **Enmienda de contrato con el prestador**: la cláusula de cobro por cuenta de terceros, si el contador la valida | Incluido en 0.1 | — |

**Costo total Fase 0: ⚪ USD ~200–470. Desarrollo: CERO.**

> **Por qué cero desarrollo es la respuesta correcta acá:** a volumen de soft launch (15 prestadores), son **~15 facturas al mes**. Automatizar quince operaciones mensuales **antes** de saber si el modelo fiscal es el correcto es construir sobre arena. *El trabajo manual acá no es deuda: es el freno que impide construir contra letra no firmada.*

### Fase 1 — Post-apertura (la que D-419 ya tiene declarada)

**Objetivo: la factura de comisión sale sola desde el ciclo de liquidación.**

| Paso | Qué | Costo | Tiempo |
|---|---|---|---|
| 1.1 | Contratar **Dátil** (o el proveedor que gane la evaluación), plan según volumen real medido | USD 25–340/año | 1 día |
| 1.2 | **Spike**: emitir una factura de prueba contra `ambiente: 1` desde una Edge Function | — | 0,5 día |
| 1.3 | **Wrapper `facturacion.ts`** en `packages/api` — puerta única, el patrón de la casa | — | 1 día |
| 1.4 | Enganche al ciclo de `generar_liquidacion()`: la liquidación aprobada dispara la factura de comisión | — | 1–2 días |
| 1.5 | Persistencia del **XML autorizado** + clave de acceso + los **tres estados** (§3.3). *Resolver antes D-416 (la tabla `facturas` huérfana): documentar o jubilar* | — | 1 día |
| 1.6 | Superficie: el prestador ve su factura de comisión en NEGOCIO → Cobros | — | 1 día |

**Costo total Fase 1: ⚪ USD 25–340/año. Desarrollo: ~5–6 días de un dev.**

### Fase 2 — Solo si el founder lo decide, y solo con la respuesta legal en la mano

Captura de RUC/régimen en el alta del prestador · liquidación de compra para la población C · white-label (§5.4).
**No estimado a propósito: depende de decisiones que no existen todavía.**

### Lo que este camino NO hace, dicho explícito

- **No factura al cliente final.** El prestador factura su servicio, como ya está obligado a hacer. *(Es exactamente lo que D-419 ya declara: "el vet factura por fuera bajo su RUC (obligación legal que YA tiene); e-PetPlace factura solo su comisión". **Este informe no cambia esa posición: la confirma y le pone los números.**)*
- **No resuelve la población C** (prestadores sin RUC). Queda declarada como hueco con nombre, no tapada.
- **No toca Colombia.**

---

## §8 — Las decisiones que necesitan al founder

> Ninguna de estas se resuelve investigando más. Cinco son de criterio profesional externo o de producto; ninguna es técnica.

**D1 — ¿e-PetPlace es "proveedor de sistemas de facturación" bajo la resolución NAC-DGERCGC26-00000027?**
Pregunta legal, no técnica. **Bloquea el escenario white-label (§5.4); no bloquea el camino recomendado.** Si la respuesta es sí, el white-label se encarece de forma sustancial. *Once días de antigüedad tiene la norma: es probable que ni los proveedores la tengan del todo digerida.*

**D2 — 🔴 LA QUE PUEDE REORDENAR TODO. ¿El dinero que entra a la cuenta master es ingreso de e-PetPlace o cobro por cuenta de terceros?**
De contador **y** abogado. Afecta base imponible, régimen tributario aplicable, e impuesto a la renta. **Es previa a escribir código de facturación.** Y tiene una salida de producto que no es fiscal: **el split automático de Kushki (Fase 2 del `MODELO_FINANCIERO`) la disuelve de raíz**, porque el dinero del prestador nunca entra a la cuenta de e-PetPlace. *La pregunta al founder no es solo "¿qué dice el contador?" sino "¿cuánto vale adelantar el contrato Marketplace de Kushki?".*

**D3 — ¿El modelo es dos facturas, o e-PetPlace cobra por gestión completa?**
El SRI distingue los dos casos (§5.2) y el tratamiento de IVA difiere. **e-PetPlace ya está construida para el primero** (la comisión es explícita y visible por regla de `MODELO_FINANCIERO` §7). Ratificarlo o cambiarlo es decisión de founder, con consecuencias de producto.

**D4 — ¿Qué se hace con los prestadores sin RUC?**
Tres caminos, ninguno gratis: **(a)** exigir RUC como condición de alta (achica el reclutamiento, y el reclutamiento es la apuesta del soft launch) · **(b)** liquidación de compra, con e-PetPlace reteniendo el 100% del IVA (cambia el rol de la plataforma) · **(c)** declararlo hueco y operar solo con prestadores con RUC en el soft launch. ⚪ **Voto de este informe: (c) para el soft launch, (a) o (b) con letra propia después.** *No por elegancia: porque (b) es un modelo distinto y merece su propia letra, no un parche.*

**D5 — ¿Colombia entra al horizonte de 2027?**
Solo importa hoy por una razón: **si la respuesta es sí, la abstracción de facturación se diseña para dos modelos de tiempo desde el día 1** (§6.2), y conviene mirar proveedores multi-país (Siigo, Alanube). Si es no, se diseña para Ecuador y se reescribe cuando toque. **Las dos son respuestas legítimas; la que sale cara es no elegir.**

---

## §9 — Deudas candidatas que este relevamiento sugiere

⚪ Propuestas, **sin número asignado y sin firma** — el número lo asigna la sesión que las deposite, por grep (regla 66).

1. **El vencimiento del certificado de firma no se descubre solo.** El día que vence, la emisión se detiene, y **nadie verifica por qué algo NO se hizo** — es exactamente el patrón que S84 dejó escrito. Pide alerta con fecha, no confianza.
2. **D-416 se resuelve antes de tocar este arco.** La tabla `facturas` existe en la DB con shape SRI, cero filas, y **sin origen en ninguna migración del repo**. Documentar o jubilar — *un objeto sin historial es drift esperando morder*.
3. **La tarifa de IVA no se hardcodea.** Configuración con vigencia por fecha, mismo criterio que `fee_configs`. La ambigüedad 13%/15% de §1.5 lo hace concreto, no teórico.
4. **`prestadores` probablemente no tiene RUC ni régimen tributario.** ⚠️ **No verificado contra la DB en esta pasada** — se mide antes de planificar nada.
5. **Los tres estados del comprobante no se colapsan en la UI** (§3.3): *emitido/firmado* ≠ *recibido* ≠ *autorizado*.

---

## §10 — Fuentes

**Oficiales (🟢)**
- SRI — Facturación Electrónica: https://www.sri.gob.ec/facturacion-electronica
- SRI — Facturador gratuito: https://www.sri.gob.ec/facturador-sri
- SRI — IVA de prestadores de servicios digitales no residentes: https://www.sri.gob.ec/registro-declaracion-y-pago-del-iva-prestadores-de-servicios-digitales-no-residentes
- SRI — Ficha Técnica Comprobantes Electrónicos Esquema Off-line (la v2.26 es la que circula públicamente; **la vigente es 2.34, julio 2026**): https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/ed555352-46c7-4917-9f61-011b6a9f4600/FICHA%20TE%CC%81CNICA%20COMPROBANTES%20ELECTRO%CC%81NICOS%20ESQUEMA%20OFFLINE%20Versio%CC%81n%202.26.pdf
- SRI — Reglamento de Comprobantes de Venta, Retención y Documentos Complementarios: https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/c3a2c922-5960-4c08-9a73-bde19fadce42/REGLAMENTO+DE+COMPROBANTES+DE+VENTA,+RETENCI%D3N+Y+DOCUMENTOS+COMPLEMENTARIOS.pdf
- DIAN — ABECÉ requisitos proveedor tecnológico: https://www.dian.gov.co/impuestos/factura-electronica/Documents/Preguntas-y-respuestas-Proveedores-Tecnologicos-FE.pdf
- DIAN — Cómo facturar: https://factura-electronica.dian.gov.co/como-facturar-1.html

**Secundarias serias (🟡)**
- Buró Tributario — Resolución NAC-DGERCGC26-00000027: https://burotributario.com.ec/el-sri-mediante-la-resolucion-no-nac-dgercgc26-00000027-establece-normas-para-el-registro-de-proveedores-de-sistemas-informaticos-o-servicios-de-facturacion-electronica-en-el-ruc/
- HLB Ecuador — Nueva regulación sobre proveedores: https://www.hlbecuador.com/nueva-regulacion-del-sri-fortalece-el-control-sobre-los-proveedores-de-facturacion-electronica/
- Lexis — Registro obligatorio de proveedores: https://www.lexis.com.ec/noticias/sri-crea-registro-obligatorio-de-proveedores-de-facturacion-electronica
- Vistazo — Proveedores deberán registrarse: https://www.vistazo.com/negocios/economia/2026-07-30-proveedores-sistemas-facturacion-electronica-deberan-registrarse-sri-ecuador-NC11138036
- Group SERES — Plazos 2026: https://blog.groupseres.com/latam/plazos-del-sri-para-los-comprobantes-electronicos-en-ecuador
- Group SERES — Liquidación de compras: https://blog.groupseres.com/latam/liquidacion-de-compras-de-bienes-y-prestacion-de-servicios
- Russell Bedford EC — IVA 15% en 2026: https://russellbedford.com.ec/el-iva-en-ecuador-se-mantiene-en-15-segun-el-sri/
- Primicias — IVA en plataformas digitales: https://www.primicias.ec/noticias/economia/normas-cobro-impuesto-plataformas-digitales/
- El Comercio — IVA sobre la carrera de Uber: https://www.elcomercio.com/actualidad/negocios/clientes-uber-iva-factura-servicio/
- firmar.ec — Comparativa de ECIs acreditadas por ARCOTEL: https://firmar.ec/comparativa-emisores-ecuador/
- ARCOTEL / firmadigital.gob.ec: https://www.firmadigital.gob.ec/preguntas-frecuentes/

**Proveedores y técnico**
- Dátil — planes: https://datil.com/planes/anuales · doc API: https://datil.dev/
- Contífico (Siigo) — planes: https://contifico.com/planes/
- `jybaro/xades-bes-sri`: https://github.com/jybaro/xades-bes-sri
- `Jairbal/mora-sri-gateway`: https://github.com/Jairbal/mora-sri-gateway
- `PeculiarVentures/xadesjs` (issue #100, ajuste para SRI): https://github.com/PeculiarVentures/xadesjs/issues/100
- Alegra API Colombia: https://www.alegra.com/colombia/api/facturacion-electronica/
- Factus Colombia: https://www.factus.com.co/
- Alanube (multi-país): https://www.alanube.co/colombia/

---

*Investigación de la sesión S89-A, 7 de agosto de 2026. Sin código, sin migración, sin commit. Todo lo firmado como decisión vive en §8 y espera al founder.*
