# INVESTIGACIÓN — BIMI + VMC/CMC: el logo de e-PetPlace en la bandeja de Gmail

> **Tipo:** relevamiento externo (web). **Fecha de la medición: 6-ago-2026.**
> **Alcance:** SOLO investigación. Nada se compró, se contrató ni se ejecutó. Ninguna decisión firmada.
> **Objeto:** que el isotipo de e-PetPlace reemplace la «E» genérica de Gmail en el correo transaccional de `hola@epetplace.com` (enviado por Resend).
> **Estado del dominio al momento de medir:** ver §0 — se midió con `dig` contra el DNS real, no se asumió.

---

## ⚠️ Nota de método, primero

Esta investigación distingue tres clases de afirmación, y cada una está marcada:

- **[OFICIAL]** — dicho por Google, por el BIMI Group (custodio de la especificación), por una CA emisora, o por Resend sobre su propio producto.
- **[MERCADO]** — práctica de mercado, precios de reseller, o consenso de proveedores de DMARC. Envejece rápido y **puede haber cambiado desde el 6-ago-2026**.
- **[NO CONFIRMADO]** — no pude verificarlo con una fuente que me convenza. Se declara como hueco, no se rellena.

Los precios de certificados **cambian y varían por reseller**: los de acá sirven para decidir un orden de magnitud, no para presupuestar al centavo. Antes de comprar se pide cotización directa.

---

## 0. LO MEDIDO EN EL DNS REAL DE `epetplace.com` (6-ago-2026)

Esto no es teoría: son los registros vivos, consultados con `dig`.

| Consulta | Resultado |
|---|---|
| `TXT epetplace.com` | **vacío — NO hay registro SPF en el apex** |
| `TXT _dmarc.epetplace.com` | `v=DMARC1; p=none;` — **sin `rua`, sin `ruf`, sin `pct`** |
| `TXT default._bimi.epetplace.com` | **vacío — BIMI no existe todavía** |
| `TXT resend._domainkey.epetplace.com` | clave DKIM presente (RSA 1024) |
| `MX epetplace.com` | **vacío — el apex no recibe correo** |
| `TXT send.epetplace.com` | `v=spf1 include:amazonses.com ~all` |
| `MX send.epetplace.com` | `10 feedback-smtp.sa-east-1.amazonses.com.` |

**Lectura de estos siete hechos:**

1. **La autenticación de fondo está bien armada.** Resend usa `send.epetplace.com` como subdominio de MAIL FROM (SPF ahí, apuntando a Amazon SES, que es la infraestructura de envío de Resend). El DKIM vive en el apex (`resend._domainkey.epetplace.com`), así que el `d=` de la firma es `epetplace.com` ⇒ **alineación DKIM estricta y relajada, ambas pasan**. La alineación SPF también pasa en modo relajado (`send.epetplace.com` y `epetplace.com` comparten dominio organizacional). *No hay que reconstruir nada de esto para BIMI.*

2. **🔴 El DMARC está en `p=none` — que es exactamente la política que BIMI NO acepta.** Este es el bloqueo técnico número uno, y es gratis de resolver (§6).

3. **🔴 El DMARC no pide reportes (`rua` ausente).** Consecuencia grave y poco obvia: **hoy no existe ninguna visibilidad sobre quién manda correo como `epetplace.com`**. Endurecer la política sin haber mirado reportes es apagar la luz y caminar. El `rua` hay que ponerlo **antes** que cualquier otra cosa (§6).

4. **⚠️ El apex no tiene MX.** `hola@epetplace.com` **no puede recibir correo** hoy. Esto importa para el `rua`: la dirección que reciba los reportes agregados tiene que ser una que efectivamente reciba (una casilla Gmail del founder, o un servicio de reportes). *Si además se espera que la gente pueda responderle a `hola@`, eso es un hueco de producto aparte de esta investigación — se declara y no se resuelve acá.*

5. **⚠️ El apex no tiene SPF.** No es fatal (el DMARC lo salva el DKIM), pero deja el dominio raíz sin declaración explícita. Ver §6 para el matiz — y para la trampa de creer que agregar `-all` en el apex es gratis.

---

## 1. BIMI: los requisitos técnicos exactos, hoy

### 1.1 Lo que exige Google [OFICIAL]

De la documentación de Google Workspace (`Set up BIMI` y `Add a BIMI TXT record`, consultadas 6-ago-2026):

- **SPF o DKIM configurados** para el dominio, y **los mensajes deben autenticar por DMARC**.
- **DMARC en enforcement:** *«The policy option (p) must be set to quarantine or reject»*. **`p=none` NO sirve.**
- **`pct=100`:** *«The percent option (pct) must be set to 100»* — la política tiene que aplicar al 100% del correo.
  - **Respuesta directa a la pregunta del brief:** **`p=quarantine` ALCANZA.** No hace falta `p=reject` para Gmail. Lo que no alcanza es `p=none`, ni un `pct` menor a 100.
- **Certificado de marca obligatorio para Gmail:** *«To display BIMI logos in Gmail, you must use a TXT record that refers to a Privacy Enhanced Mail (PEM) file»*. Es decir, **en Gmail el SVG solo no muestra nada**: hay que tener VMC o CMC.
- **El logo:** SVG, mínimo 96×96 px declarados en píxeles absolutos, **≤ 32 KB**, sin enlaces externos, sin scripts, sin animaciones.
- **Tiempo de aparición:** *«It can take up to 48 hours for BIMI to start working»*.

### 1.2 El registro DNS

**Nombre:** `default._bimi.epetplace.com` · **Tipo:** TXT · **TTL:** 3600 (1 h, sugerido por Google).

Sintaxis (BIMI Group + Google, [OFICIAL]):

```
v=BIMI1; l=<URL https del SVG>; a=<URL https del PEM>
```

- `v=BIMI1` — versión, obligatorio, primero.
- `l=` — URL **https** del SVG Tiny PS. Google advierte: si se sirve por HTTP plano, no se muestra (Resend lo repite explícitamente).
- `a=` — URL **https** del `.pem` del certificado de marca. **Formalmente opcional en la especificación** (el BIMI Group lo describe como *«currently optional (reserved for VMC/CMC)»*), **pero de facto obligatorio para Gmail y Apple Mail.**

Los dos ejemplos que publica Google:

```
v=BIMI1;l=;a=https://images.solarmora.com/brand/certificate.pem
v=BIMI1;l=https://images.solarmora.com/brand/bimi-logo.svg
```

*(Nótese que el primero deja `l=` vacío porque el SVG viaja embebido dentro del PEM. La forma robusta y recomendada es publicar **ambos**: `l=` con el SVG y `a=` con el PEM, para cubrir a los clientes que aceptan logo sin certificado.)*

Google avisa de una trampa tipográfica real: cuidado con confundir `1`, `I` mayúscula y `l` minúscula al escribir el registro.

### 1.3 Requisitos que Google NO documenta pero existen [MERCADO]

Consenso fuerte entre proveedores de DMARC: **tener todo técnicamente correcto no garantiza que Gmail muestre el logo.** Gmail aplica además reputación de remitente, volumen e historial del dominio. Dominios nuevos o de muy bajo volumen pueden tener BIMI perfecto y no ver el logo durante un tiempo.

**Esto pega directo en el caso e-PetPlace:** dominio joven, volumen bajo, soft launch el 1-oct-2026. *Es el riesgo principal de esta inversión y no lo cubre ningún certificado.*

---

## 2. El SVG: «SVG Tiny 1.2 Portable/Secure» (SVG Tiny PS)

Fuente principal: BIMI Group, *Creating BIMI SVG Logo Files* [OFICIAL], complementada con guías de CAs [MERCADO].

### 2.1 Obligatorio

- Raíz `<svg>` con **`version="1.2"`** y **`baseProfile="tiny-ps"`**. Sin estos dos atributos el archivo **no es** un SVG Tiny PS válido, por más que abra bien en un navegador.
- Un elemento **`<title>`** inmediatamente bajo `<svg>`, con el nombre de la marca. No hay requisito estricto de contenido; se recomienda < 65 caracteres.
- Servido por **HTTPS**.

### 2.2 Prohibido

- `x=` e `y=` **en el elemento raíz `<svg>`** — este es el error más común, porque **Illustrator los exporta solos** y hay que sacarlos a mano.
- Scripts (`<script>`), animación (`<animate>`, SMIL), interactividad.
- Enlaces o referencias externas (salvo los namespaces XML declarados): sin webfonts, sin `<image>` externo, sin `xlink:href` a nada de afuera.
- **Raster embebido:** nada de `<image>` con base64. El BIMI SVG es **vector puro**.

### 2.3 Recomendado / de forma

- **Cuadrado** (relación 1:1) y con el dibujo **centrado**: los clientes recortan a círculo o a cuadrado redondeado.
- **Fondo de color sólido.** Los fondos transparentes pueden no renderizar bien.
- **≤ 32 KB** (Google lo llama recomendación; varias CAs lo tratan como límite duro — asumir que es duro).
- Mínimo 96×96 px declarados en píxeles absolutos.
- `<desc>` recomendado (accesibilidad), no obligatorio.

### 2.4 Herramientas

- **BIMI Group — SVG Assistant** y **BIMI Validator** (`bimigroup.org/bimi-generator/`). ⚠️ **Advertencia literal de esa página:** el validador de registro *«only validates the format of your BIMI record and your DMARC record being at enforcement. It does not validate your SVG or Mark Certificate.»* El SVG se valida con la herramienta separada (SVG Assistant), no con el validador de registro.
- Adobe Illustrator exporta «SVG Tiny 1.2», pero **el BIMI Group dice explícitamente que ninguna herramienta exporta P/S conforme de fábrica**: siempre hay que editar el archivo a mano después (típicamente para sacar `x`/`y` del root y poner `baseProfile="tiny-ps"` y el `<title>`).
- Convertidores y validadores de terceros (CaptainDNS, PowerDMARC, Sequenzy) [MERCADO] — útiles como segunda opinión, no como autoridad.

**Estimación de esfuerzo:** partiendo del isotipo SVG que ya existe en el repo, esto es **trabajo de una tarde**, no de una sesión. Es la parte barata y sin riesgo.

---

## 3. VMC y CMC

### 3.1 Quién los emite [MERCADO, con un hecho duro adentro]

- **Hecho duro:** **Entrust vendió su negocio de certificados públicos a Sectigo en 2025 y dejó de emitir mark certificates en mayo de 2025.** El brief menciona «DigiCert, Entrust» — **Entrust ya no es una opción.**
- CAs autorizadas para **VMC** en 2026: **DigiCert**, **Sectigo**, **GlobalSign**.
- Para **CMC** además aparece **SSL.com**.
- *No pude confirmar contra el registro oficial de MVAs del BIMI Group cuál es la lista exacta y vigente hoy.* **[NO CONFIRMADO]** — la fuente de verdad es la página *MVA details* del BIMI Group, y se debe consultar antes de comprar.

### 3.2 VMC — costo [MERCADO, 6-ago-2026]

| Fuente | Precio |
|---|---|
| DigiCert (lista, 12 meses) | ~**USD 1.416** |
| Rango de lista de CAs autorizadas | ~**USD 1.350 – 1.752 / año** |
| Reseller (GoGetSSL, DigiCert) | ~**USD 1.474 / año** |
| Reseller (vmccerts.com) | desde ~**USD 749** |

**Orden de magnitud a usar: USD 1.000–1.500 por año**, recurrente. Precios plurianuales bajan el promedio anual.

### 3.3 VMC — el requisito duro: marca registrada 🔴

**Este es el punto que decide todo para e-PetPlace.**

- El VMC exige una **marca registrada, activa y en buen estado**, en una oficina de propiedad intelectual **de una lista cerrada**.
- Una solicitud **en trámite no sirve**. Un derecho de *common law* **no sirve**.
- El logo del SVG **debe coincidir exactamente** con el logo registrado. Variaciones ⇒ rechazo.
- Si la marca caduca o se cancela, **la CA puede revocar el VMC**.

**Las oficinas aceptadas** (lista de GlobalSign, ~17 oficinas, consultada 6-ago-2026):

> Australia, Brasil, Benelux (BE/LU/NL), Canadá, Suiza, Alemania, Dinamarca, **Unión Europea (EUIPO)**, España, Francia, **Reino Unido (UKIPO)**, India, Japón, Corea del Sur, Nueva Zelanda, Suecia, **Estados Unidos (USPTO)**.

### 🔴 **Ecuador (SENADI) NO está en la lista. Brasil es la ÚNICA oficina latinoamericana aceptada.**

Consecuencia directa y sin vuelta: **una marca registrada en SENADI no habilita un VMC.** Para tener VMC, e-PetPlace necesitaría registrar la marca en **USPTO o EUIPO** (u otra de la lista). La regla que salva es que **no importa la nacionalidad de la empresa**: una empresa ecuatoriana con marca EUIPO o USPTO **sí califica** — la lista es de *oficinas*, no de países del titular.

**Costo y tiempo de registrar afuera [MERCADO / NO CONFIRMADO en detalle]:** el registro en USPTO o EUIPO es un proceso propio, con sus tasas y su abogado, que **típicamente lleva de 8 a 18 meses** hasta el registro efectivo. *No investigué tasas ni estudios jurídicos: está fuera del alcance de este relevamiento y necesita asesoría de marcas, no de ingeniería.* **Lo único que afirmo con certeza: no llega para el 1-oct-2026.**

### 3.4 CMC — la alternativa sin marca registrada

**Sí existe, y es el camino realista para e-PetPlace.**

- **Qué es:** *Common Mark Certificate*. Nació para dar acceso a BIMI a marcas sin trademark. **Google lo acepta oficialmente en Gmail desde septiembre de 2024** [OFICIAL — BIMI Group].
- **Requisito, en lugar de la marca:** demostrar **uso previo del logo**. La formulación de SSL.com: *«in active, continuous use on a domain you own for at least 12 months»* — **12 meses continuos de uso del logo en un dominio propio**, probados con historial del sitio, páginas archivadas, material de marketing u otra documentación de uso ininterrumpido.
- **Costo [MERCADO, 6-ago-2026]:** SSL.com lista **USD 1.150/año** (2 años: 1.035/año; 3 años: 977,50/año). Resellers desde ~**USD 649–650**. DigiCert lista en rango similar al VMC (~1.416–1.752).
  - **Conclusión honesta sobre precio: el CMC NO es dramáticamente más barato que el VMC.** La diferencia real está en el **requisito** (uso demostrado vs marca registrada), no tanto en la plata. Quien venda «CMC = la opción barata» está simplificando.
- **Validación:** SSL.com declara **3–5 días hábiles**, según lo completa que esté la documentación de uso.
- **Lo que el CMC NO da:** **el tilde azul de verificación de Gmail es exclusivo del VMC.** DigiCert lo dice literal: *«Gmail reserves the verified checkmark for VMCs.»* Con CMC **el logo sí aparece; el tilde azul no.**

### 🔴 **La pregunta que decide el CMC, y que no puedo responder yo**

El requisito de **12 meses de uso continuo del isotipo en `epetplace.com`** hay que medirlo contra la realidad, no contra el deseo:

- ¿Desde cuándo está el isotipo actual publicado en `epetplace.com`?
- ¿Es *este* isotipo, o cambió en el camino? (El requisito es de continuidad: un rediseño reciente puede reiniciar el reloj.)
- ¿Hay evidencia archivable — Wayback Machine, capturas fechadas, material de marketing?

**Si el isotipo actual no lleva 12 meses publicado, el CMC no se puede emitir hoy**, y la fecha de elegibilidad es *(fecha de primera publicación del isotipo) + 12 meses*. **Esto se verifica antes de gastar un dólar.** **[NO CONFIRMADO — requiere dato del founder]**

---

## 4. Qué clientes muestran BIMI hoy, y qué exige cada uno

**Fuentes:** BIMI Group («cada proveedor tiene sus propios criterios»), Google [OFICIAL], y compilaciones de proveedores [MERCADO]. La matriz de abajo es **la parte más volátil de este informe** — cambia varias veces por año.

| Cliente | ¿Muestra BIMI? | ¿Exige certificado? |
|---|---|---|
| **Gmail / Google Workspace** | Sí | **Sí — VMC o CMC.** SVG solo NO alcanza. Tilde azul solo con VMC |
| **Apple Mail** (iOS/iPadOS 16+, macOS Ventura 13+) e iCloud Mail | Sí | **Sí — VMC.** El soporte de CMC se anuncia como «próximamente» pero **no lo pude confirmar como vigente** [NO CONFIRMADO] |
| **Yahoo Mail / AOL** | Sí | **No.** Muestra el logo con BIMI + DMARC en enforcement, **sin certificado** |
| **Fastmail** | Sí | **No** (varias fuentes; SSL.com además dice que honra CMC) |
| **La Poste** (FR) | Sí | Sin certificado exige **revisión manual**: hay que contactarlos |
| **GMX / Web.de, Zoho Mail, Onet, Zone, Zoner, KDDI, NTT docomo** | Sí, en alguna forma | Criterio propio de cada uno [NO CONFIRMADO en detalle] |
| **Outlook / Microsoft 365** | **No** | — (Microsoft sigue sin soportar BIMI; es la ausencia notable del mapa) |

**Lo que esto significa para e-PetPlace (Ecuador, consumidor final):** el público es abrumadoramente **Gmail**, con algo de Outlook/Hotmail. Yahoo y Fastmail son ruido estadístico acá, y Outlook no muestra BIMI de ninguna forma. ⇒ **En este mercado, «BIMI sin certificado» es prácticamente equivalente a «BIMI que nadie ve».**

---

## 5. El camino gratis vs. el camino pago

### 5.1 SIN certificado (costo: USD 0, solo trabajo)

Se publica el registro BIMI con `l=` (SVG) y sin `a=`. Se obtiene:

- **Gmail: NADA.** Sigue la «E» naranja. *Este es el punto duro de todo el informe: en el cliente que le importa al founder, el camino gratis no produce el resultado.*
- **Apple Mail: nada** (exige VMC).
- **Yahoo / AOL / Fastmail: sí, el logo aparece.**
- **Outlook: nada** (no soporta BIMI).
- **Beneficios colaterales que sí son reales y no dependen de BIMI:** llegar a `p=quarantine` con reportes agregados mejora la postura antispoofing del dominio, mejora entregabilidad, y **cumple de antemano los requisitos de remitente de Gmail/Yahoo** que ya rigen. *Esta parte vale la pena aunque BIMI nunca se compre.*

### 5.2 CON CMC (~USD 650–1.400/año) — requiere 12 meses de uso del logo

- **Gmail: el logo aparece. Sin tilde azul.**
- Apple Mail: **no confirmado** — probablemente no todavía.
- Yahoo, Fastmail: sí.

### 5.3 CON VMC (~USD 1.000–1.500/año) — requiere marca registrada en oficina aceptada

- **Gmail: logo + tilde azul de verificación.**
- **Apple Mail: sí** (es el único camino para Apple hoy).
- Yahoo, Fastmail: sí.

### 5.4 Lo que ninguno de los tres garantiza

**Que Gmail efectivamente muestre el logo.** Reputación, volumen e historial del dominio pesan, y un dominio nuevo con bajo volumen puede pagar el certificado y no ver el logo por un tiempo. **[MERCADO, consenso fuerte]** — Gmail no publica el umbral.

---

## 6. Riesgo de endurecer DMARC — y el procedimiento seguro

### 6.1 Qué se rompe

Al pasar de `p=none` a `p=quarantine`/`p=reject`, **todo correo que se presente como `@epetplace.com` y no pase DMARC alineado empieza a caer a spam (quarantine) o a rebotar (reject)**. Los sospechosos habituales:

- **Google Workspace / Gmail** usado para correo del equipo con esa dirección.
- Herramientas de marketing (Mailchimp, Brevo, etc.).
- **Formularios web y notificaciones de la app** que envíen por otra vía que no sea Resend (un backend propio, un webhook, un `mail()` de un hosting).
- Facturación, CRM, agendas, firmas digitales.
- **Reenvíos:** el forwarding rompe SPF por diseño; sobrevive por DKIM si la firma se preserva.

**En el caso concreto de e-PetPlace, el riesgo medido es BAJO** — Resend ya está bien alineado por DKIM y SPF (§0). **Pero el riesgo no es *conocido*, porque no hay `rua`: nadie miró nunca quién más manda.** *Un dato viejo que dice «sí» se descubre al chocar; la ausencia total de dato no se descubre nunca.*

### 6.2 El procedimiento seguro

**Paso 1 — encender la luz (hacer YA, costo 0, riesgo 0).**
```
v=DMARC1; p=none; rua=mailto:<casilla-que-recibe>; fo=1
```
⚠️ **La casilla tiene que poder recibir de verdad.** `epetplace.com` **no tiene MX** (§0): un `rua=mailto:dmarc@epetplace.com` **se perdería en el vacío**. Usar una casilla Gmail del founder, o un servicio de reportes.

*Sobre `ruf` (reportes forenses): la mayoría de los proveedores grandes no los envían, y los que sí pueden incluir contenido de mensajes reales. **Recomendación: no usar `ruf`** — poco valor, complicación de privacidad.*

**Paso 2 — observar.** Mínimo recomendado por la industria: **de 2-3 semanas a 90 días**. Los 90 días existen por una razón concreta: **cazan a los remitentes mensuales y trimestrales** (facturación, reportes, campañas estacionales) que una ventana de dos semanas no ve nunca. Con soft launch el 1-oct, **si esto arranca en agosto hay ventana holgada.**

**Paso 3 — alinear lo que aparezca.** Cada remitente legítimo que salga en los reportes se agrega a SPF o se le configura DKIM. **No se avanza con remitentes legítimos fallando.**

**Paso 4 — endurecer.**

⚠️ **Nota importante sobre `pct` — la práctica estándar está cambiando:**
La receta clásica es escalonar `pct=10 → 25 → 50 → 100` a lo largo de semanas. **Pero en mayo de 2026 el IETF publicó RFC 9989 (DMARCbis), que reemplaza a RFC 7489 y ELIMINA el tag `pct`** por implementación inconsistente entre receptores, sustituyéndolo por un flag binario `t=` (`t=y` ≈ testing, `t=n` ≈ enforcement pleno). **[Publicación del RFC: confirmada. Grado de adopción por los receptores grandes al 6-ago-2026: NO CONFIRMADO.]**

Consecuencias prácticas para este caso:
- **BIMI exige `pct=100` de todas formas** [OFICIAL, Google]. El escalonamiento con `pct` solo puede ser una etapa transitoria; el estado final obligatoriamente es 100%.
- Dado (a) que `pct` está siendo retirado del estándar, (b) que su implementación era inconsistente, y (c) que el perfil de riesgo acá es bajo y bien conocido, **la recomendación es no depender de `pct`: observar bien con `p=none` y saltar a `p=quarantine` con `pct=100`**, mirando reportes de cerca la primera semana.

**Estado final apto para BIMI:**
```
v=DMARC1; p=quarantine; pct=100; rua=mailto:<casilla-que-recibe>
```
`p=quarantine` alcanza. `p=reject` es más fuerte y también sirve; se puede dejar para más adelante.

**Paso 5 — el SPF del apex.** Hoy no existe (§0). Agregar `v=spf1 -all` en el apex declara «nada envía con envelope-from `@epetplace.com`» y es correcto **solo si eso es cierto**. ⚠️ **No hacerlo a ciegas: hacerlo después de los reportes, cuando se sepa.** Es exactamente la clase de cambio que parece higiene y rompe un remitente que nadie sabía que existía.

**Reversión:** volver a `p=none` es un cambio de un registro TXT y propaga en minutos-horas. **La transición DMARC es barata de deshacer** — lo caro es no haberla mirado.

---

## 7. EL CAMINO RECOMENDADO — costos y tiempos

### Fase 1 — Encender la luz · **USD 0 · 10 minutos + 3 semanas de espera**
Agregar `rua` al DMARC existente. Empezar a leer reportes. **Hacer esto ya, sin esperar ninguna decisión de plata**, porque es la precondición de todo lo demás y porque el dominio hoy está ciego.

### Fase 2 — Verificar la elegibilidad de CMC · **USD 0 · 1 hora**
Determinar desde cuándo el isotipo actual está publicado en `epetplace.com` (Wayback Machine, historial del repo, capturas). **Si no llega a 12 meses, el CMC no es comprable hoy** y la fecha de elegibilidad queda fijada. **Este dato cambia toda la planificación y sale gratis.**

### Fase 3 — Preparar el SVG Tiny PS · **USD 0 · una tarde**
Convertir el isotipo, validar con el SVG Assistant del BIMI Group, publicarlo en HTTPS. Se hace en paralelo a la Fase 1 y **no compromete a nada**: es un archivo.

### Fase 4 — Endurecer DMARC a `p=quarantine; pct=100` · **USD 0 · 1 día + monitoreo**
Después de la ventana de observación. Con esto **el dominio ya cumple los requisitos de BIMI** y, de paso, queda bien parado para el soft launch.

### Fase 5 — Publicar BIMI sin certificado · **USD 0 · 10 minutos**
`v=BIMI1; l=<svg>`. **Gmail no mostrará nada** — pero Yahoo/Fastmail sí, la infraestructura queda probada, y agregar el `a=` después es cambiar una línea del TXT.

### Fase 6 — El certificado · **la decisión de plata**
Solo si la Fase 2 dio verde. **CMC** (~USD 650–1.400/año, 3–5 días hábiles de validación) ⇒ logo en Gmail, sin tilde. **VMC** (~USD 1.000–1.500/año) ⇒ requiere marca en USPTO/EUIPO, **8-18 meses de trámite previo: no llega al 1-oct-2026 bajo ningún escenario.**

### Cronograma contra el 1-oct-2026

| | |
|---|---|
| **Agosto 2026** | Fases 1, 2, 3 (todas gratis) |
| **Septiembre 2026** | Fase 4 (endurecer) + Fase 5 |
| **Fase 6** | Solo si la Fase 2 habilita el CMC. **Sin logo en Gmail para el soft launch si no** |
| **VMC** | Fuera de alcance para 2026. Decisión de 2027 en adelante, y arranca por registrar la marca |

**Lo honesto sobre el objetivo del founder:** el logo en Gmail **cuesta plata sí o sí** y **depende de un requisito de antigüedad que puede no estar cumplido**. Las fases 1-5 son gratis, valen la pena por sí solas (entregabilidad y antispoofing) y dejan todo listo para que el certificado sea un cambio de una línea el día que se compre.

---

## 8. LAS DECISIONES QUE NECESITAN AL FOUNDER

**① ¿Desde cuándo está publicado el isotipo actual en `epetplace.com`?** — Dato, no opinión. **Bloquea todo lo demás** y no cuesta nada averiguarlo. Si no llega a 12 meses de uso continuo, el CMC no se puede emitir y el logo en Gmail no existe para el soft launch.

**② ¿Se autoriza el gasto recurrente de ~USD 650–1.400/año por el CMC?** — Es un costo **anual, no único**. Para un equipo chico pre-lanzamiento, es una decisión de marca, no de ingeniería. *Contra-argumento a considerar: el logo en la bandeja no mueve conversión de forma medible en un producto que todavía no tiene usuarios; el mismo dinero puede valer más en otra parte.*

**③ ¿Se va a registrar la marca e-PetPlace en USPTO o EUIPO?** — Es la **única** puerta al VMC y al tilde azul. **SENADI no habilita VMC.** La decisión tiene valor propio más allá de BIMI (protección de marca en mercados de expansión), y por eso no debería tomarse *por* BIMI. **Necesita abogado de marcas — está fuera del alcance de esta investigación.**

**④ ¿Se autoriza endurecer DMARC a `p=quarantine`?** — El riesgo medido es bajo (Resend está bien alineado) pero **no se decide sin haber leído los reportes agregados**. Es reversible en minutos. **Lo que sí se debería autorizar hoy, sin discusión, es el `rua`.**

**⑤ ¿Dónde reciben los reportes DMARC?** — `epetplace.com` no tiene MX; hace falta una casilla real. Decisión de un minuto que si se saltea, silencia toda la Fase 1.

**⑥ (Fuera de alcance, pero apareció midiendo) `hola@epetplace.com` no puede recibir correo** — no hay MX en el apex. Si el producto va a mostrar esa dirección como canal de contacto en el soft launch, **el correo que le manden se pierde**. Se declara acá porque lo encontró esta medición; su cura es de otra sesión.

---

## Fuentes

**Oficiales**
- [Google Workspace — Set up BIMI](https://knowledge.workspace.google.com/admin/security/set-up-bimi)
- [Google Workspace — Add a BIMI TXT record to your domain](https://knowledge.workspace.google.com/admin/security/add-a-bimi-txt-record-to-your-domain-detailed-steps)
- [BIMI Group — Implementation Guide](https://bimigroup.org/implementation-guide/)
- [BIMI Group — Creating BIMI SVG Logo Files](https://bimigroup.org/creating-bimi-svg-logo-files/)
- [BIMI Group — BIMI Generator / Validator](https://bimigroup.org/bimi-generator/)
- [BIMI Group — Announcing Common Mark Certificates](https://bimigroup.org/announcing-common-mark-certificates/)
- [Resend — Implementing BIMI](https://resend.com/docs/dashboard/domains/bimi)
- [DigiCert — BIMI setup guide for VMC and CMC](https://www.digicert.com/blog/bimi-setup-guide-for-vmc-and-cmc)
- [GlobalSign — List of Intellectual Property Office Regions (VMC)](https://support.globalsign.com/mark-certificate/manage-verified-mark-certificates/list-intellectual-property-office-regions)
- [SSL.com — Common Mark Certificate (CMC)](https://www.ssl.com/products/email-brand-trust/brand-trust/cmc/)

**Mercado / secundarias**
- [Red Sift — BIMI in 2026: Verified logos, CMCs, and the fastest path to inbox display](https://redsift.com/guides/bimi-in-2026-verified-logos-cmcs-and-the-fastest-path-to-inbox-display)
- [GoGetSSL — DigiCert VMC Certificates](https://www.gogetssl.com/digicert/vmc-certificates/)
- [Signet — VMC Certificate Cost: What to Expect in 2026](https://withsignet.com/blog/vmc-certificate-cost)
- [Signet — VMC Certificate Providers in 2026](https://withsignet.com/blog/vmc-certificate-providers)
- [Suped — Recommended VMC providers after Entrust's acquisition by Sectigo](https://www.suped.com/learn/bimi/what-are-the-recommended-vmc-providers-for-bimi-setup-after-entrusts-acquisition-by-sectigo)
- [Sendmarc — Email clients that support BIMI](https://sendmarc.com/bimi/email-clients/)
- [BIMI Certifications — Email client support for BIMI](https://bimicertifications.com/insights/email-client-support-for-bimi)
- [SSL.com — VMC logo file requirements: SVG Tiny PS format](https://www.ssl.com/guide/vmc-logo-file-requirements-svg-tiny-ps-format-dimensions-and-common-rejection-reasons/)
- [Suped — Why is my BIMI logo not showing in Gmail?](https://www.suped.com/knowledge/email-deliverability/troubleshooting/why-is-my-bimi-logo-not-showing-in-gmail)
- [dmarcian — DMARCbis vs. DMARC: What's Changing?](https://dmarcian.com/dmarcbis-vs-dmarc/)
- [Proofpoint — DMARC RFC 9989 Part 2: How to Use the New Tags](https://www.proofpoint.com/us/blog/threat-protection/dmarc-rfc-9989-part-2-how-to-use-the-new-tags)
- [DMARC Report — Enforcement timeline: none to reject roadmap](https://dmarcreport.com/blog/dmarc-enforcement-timeline-none-to-reject-roadmap/)
- [SSL2BUY — BIMI Certificate Cost in 2026: CMC & VMC Pricing](https://www.ssl2buy.com/wiki/bimi-certificate-cost-cmc-and-vmc-pricing)
