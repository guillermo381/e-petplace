# S116 · ANÁLISIS DEL REDISEÑO — la versión morada contra la casa

Mesa, 12-sep-2026. Fuentes: mock «Flujo visual de la app · versión morada» (32 pantallas, spec v3.0 del 11-sep) · parte de B `docs/loop/S116-B-RELEVAMIENTO.md` (`pista/s116-b @ 1a1a7fa6`, contra main `ca564994`) · letra vigente (DIRECCION_ARTE v1.7, DIRECCION_DISENO_S99, DISEÑO_EXPERIENCIA, MODELO_LOYALTY, brief S116).

La letra es referencia, no firma. Lo que sigue nombra cada punto donde el mock deroga algo firmado, para que se firme a conciencia y no por arrastre.

---

## 1. Qué cambia, por capa — de lo más profundo a lo más superficial

### 1.1 Identidad: la nariz reemplaza a la huella, y la rampa muere

| | Hoy (letra) | Mock |
|---|---|---|
| Isotipo | huella + rampa de 6 stops turquesa→magenta | nariz-corazón magenta con orejas tinta; wordmark en Baloo 2 |
| Firma de marca | «en cada ícono la mascota está presente» (huella rellena por ícono) | la mascota está en los PERSONAJES (6 ilustraciones) y en la nariz; los glifos son línea pura |
| Colores solo-marca | turquesa, lima, amarillo | no existen |
| Ilustración | guijarros (§4) | personajes ilustrados sobre círculo blanco/rosa |

La casa ya debatió nariz vs huella dos veces (§5b en S53, §4bis en S80). El mock lo resuelve a favor de la nariz. Consecuencia: la primitiva `Huella` deja de ser el corazón semántico del ícono. Sigue existiendo (el mecanismo ① «donde pisa la huella la superficie cede» y la marca de mapa la usan) pero pasa de ley madre a pieza opcional.

### 1.2 Color: de cuatro capas + dos acentos a estructura + acción

| | Hoy | Mock |
|---|---|---|
| Fondo | papel algodón `#FAF9F7` | lienzo `#F8F2F6` (rosado) |
| Estructura | sin caja, sin cabecera | cabecera ciruela con degradado, radio inferior 28, en toda pantalla |
| Acción | OCRE relleno con letra tinta | MAGENTA `#D10788`, pill 58 con sombra magenta |
| Selección | MAGENTA | CIRUELA (chip activo) + radio magenta (opción elegida) |
| Capas por categoría (ley 10: verde SALUD · teal CUIDADO · pink COMUNIDAD · terracotta CONSUMO) | rigen: canto de capa, huella en hex de capa | no existen: todo glifo es magenta o tinta 45 % |
| Estado | color + palabra | verde al día / ámbar pendiente, siempre con palabra (coincide) |

Lo que deroga: N26 (los dos acentos se invierten: magenta acciona, ciruela selecciona), la ley 10 (taxonomía de capas por color), §9.1 (dos cantos), A6 SIN CAJA para la cabecera. Lo que sobrevive sin tocar: N23 (color marca clase, no importancia), N5 (un acento por pantalla), «ningún estado solo con color», Chanel con su condición (el mock lleva borde 9 % + sombra suave en claro: es exactamente la enmienda S86).

**Riesgo medido por B:** R12 tiene 168 pares de contraste y `verify:contrast` 436; una paleta nueva los pone todos a cero y hay que volver a subirlos. Y el gate del par del avatar a 3:1 (huella, no texto) deja de tener sentido si el avatar ya no lleva huella.

### 1.3 Tipografía: la voz liviana muere, nace la voz redonda

| | Hoy | Mock |
|---|---|---|
| Familia | DM Sans 300·400·500·700 | Baloo 2 800 (display, títulos, cifras) + Plus Jakarta Sans 400·600·700 (todo lo demás) |
| Título de pantalla | 28/34 light 300 | Baloo 800 28–30 |
| Escala | 4 pares, máximo 3 tamaños por pantalla | 8 estilos, tamaños en rangos (13,5–14,5) |
| Sección | 700 | Plus Jakarta 700 14–14,5 (la «fila») |

Deroga N1 entera y la firma «la casa no titula en bold». Es el cambio de voz más grande del mock y el que más se va a sentir: pasa de sobrio-bancario a cálido-redondo. Es coherente con la nariz y los personajes; no lo es con la rampa ni con el trazo 1.9 de los glifos viejos, que por eso también mueren.

Costo: S94-PERF bajó 2,37 MB importando la fuente por peso. Baloo 1 peso + Plus Jakarta 3 pesos = 4 archivos, contra los 4 de DM Sans hoy: neutro. Los rangos de tamaño del mock (13,5–14,5) se resuelven en tokens fijos: la casa no escribe números a mano y R39 lo vigila.

### 1.4 Glifos: 52 de línea, sin huella

Hoy: grilla 24, trazo 1.9, huella rellena, sin figuras humanas, glifos de control como excepción. Mock: caja 24, trazo 1.8, sin relleno, 52 glifos, «Cuenta» es una persona (la excepción S85 se vuelve regla).

Lo que hay que ver: los 52 del mock son un set genérico (varios son indistinguibles de Lucide). Sirven como inventario de qué glifos hacen falta; el dibujo de la casa se decide en el lote de glifos, no se copia. §6b (la hoja de contacto) sigue siendo el método.

B midió: registry con 72 glifos vivos (el 73.º era un comentario). El cruce 72 ↔ 52 dice cuántos nacen, cuántos mueren y cuántos se redibujan.

### 1.5 Estructura y navegación

| | Hoy (DISEÑO_EXPERIENCIA §3) | Mock |
|---|---|---|
| Tabs | 3 (Hogar · Explorar · Cuenta) + Despensa en el 4.º slot | 5: Hogar · Explorar · Despensa · Pedidos · Cuenta |
| Activo | huella que aparece | círculo magenta elevado, −14 de margen, con borde del lienzo |
| Asistente (NEXO) | dentro del Hogar (orbe del Coach) | botón flotante 60 en toda raíz |
| Home | 4 zonas (hogar · hoy · en contexto · la vida) | saludo con fecha + mascota + 3 accesos + próxima cita + atajos |
| Perfil | pila de módulos, escalera | pestañas Resumen · Salud · Historia · Documentos |

El choque de fondo: **«Pedidos» como tab.** DISEÑO_EXPERIENCIA §3 (firma S50) dice que la agenda no es tab porque «las citas son estado del hogar, no sección administrativa», y guarda el 4.º slot para Comunidad. El mock mete citas y pedidos de despensa juntos en «Pedidos» (la pantalla 28 lo titula ACTIVIDAD). El mecanismo del Home sobrevive (la próxima cita sigue en el hogar); lo que cambia es que ahora hay además un lugar donde ver todo lo en curso. Con la postventa entera, ocho superficies de cobro y el ledger, ese lugar hace falta. Es decisión de producto, no de estética: va a la firma.

Lo que el mock no muestra y la casa tiene vivo: pasaporte con QR y placa, guardería, adopción, memorial, estado «perdida», saldo e-PetPlace con pago mixto, Tus facturas / Tus datos de facturación, las tres voces de «no cargó». Nada de eso se pierde: se rediseña en el mismo lenguaje cuando le toque su pantalla.

### 1.6 Lo que el mock trae como contenido y NO es diseño

- Colombia: Chapinero, PSE, Nequi, Daviplata, $85.000. La app sale en Quito con USD, Nuvei y DeUna. El formato de la plata es ley de S115: `$45,00 · $1.234,50`, una sola fuente. Se conserva el patrón visual (la cifra grande en Baloo), no el contenido.
- «Bienvenido» tiene género. La voz de la casa es tuteo neutro: «Te damos la bienvenida» o directamente el claim.
- La pantalla de pago (20) no tiene el checkout fiscal de S115: la línea «¿quieres factura?», el correo arriba, el desglose 0 %/15 % con IVA visible, la tarifa de $0,99 tachada. Todo eso entra al patrón del mock. Y B midió que `DesgloseCompra` no la monta nadie: el rediseño es donde se monta.
- Las cinco pantallas de éxito que aún no dicen «la factura llega aparte» son exactamente el patrón «confirmación» del mock (check + trío + dato + dos acciones). Se resuelven juntas.

---

## 2. El flujo de bienvenida — lo más importante

Pantallas 00–10 del mock. Es donde la casa hoy está peor y donde el mock está mejor: un solo CTA por paso, el claim al frente, el expediente como promesa y no como formulario.

**Lo que está bien y se toma tal cual**
- 01 Propuesta: el claim de la casa («Tu mascota no tiene un expediente. Tiene una vida.») como única frase. Dos acciones. Nada más.
- 03/05: Apple y Google solo en cliente (ley de paridad, excepción ①). Consentimiento de términos en el alta (ya vive en `registrarConsentimiento`).
- 06 Hogar sin mascota: «Mientras tanto» con Explorar y la tienda. Es revelación progresiva bien hecha: no te encierra en el alta.
- 07: grilla de especie con los personajes. Tres campos y un CTA. «Con estos datos creamos su expediente. Vacunas y documentos los agregas cuando quieras.»
- 09 Carné: «Leemos las fechas del carné y programamos los recordatorios» — ya existe (`extract-vacuna` v24), y la espera se hace con `EsperaDeMarca` en el nuevo lenguaje.
- 10: confirmación con el dato («Nina · Golden Retriever · 4 años») y dos salidas.

**Lo que hay que corregir del mock antes de encargarlo**
- 00 Bienvenida: la barra «Perros · Cargando» es una barra de carga falsa. Si es el temporizador de los personajes que rotan, que se vea como tal (puntos o nada); si simula progreso, muere: la casa no inventa lo que no sabe.
- 02 Beneficios: cuatro tarjetas de argumento entre el claim y el acceso. Vara del artesano: ante la duda, quitar. Opciones abajo.
- 07 Nacimiento: la ley del founder sobre lo que no se sabe — el campo acepta mes/año o solo año, y la pantalla dice lo que no tiene. Un date picker que exige día está prohibido acá.
- 07 Raza: viene de `cat_razas` con autocompletado (la ficha de raza se pega al founder si la mascota nueva declara una no publicada — regla vigente).
- 08 Foto: el personaje como placeholder es el primer peldaño de la escalera de la cara (§2.11). Se declara.
- Voz: «Bienvenido» → neutro. «Comienza a vivir…» → revisar. Todo tuteo neutro, lo vigila el cinturón de voz.

**El video / las transiciones**
- Video real = `expo-video` = módulo nativo = build. Hoy no entra.
- Transiciones fluidas de los personajes (fundido 500 ms cada 3 s, halo, entrada escalonada) = Reanimated, que ya está en la casa = OTA. Y cumple L-c (si al quitar la animación dice lo mismo, sobraba: acá no, porque la rotación ES «todas las especies caben»).

---

## 3. Lo nativo — lo único que no sale por OTA

Ícono de la app, splash nativo (la imagen que muestra Android antes de que cargue JS), ícono de notificación en Android, nombre en `app.json`. Cambiar el logo los toca todos. B tiene la lista exacta de dónde vive cada uno con su OTA/build.

Hecho relevante: producción sale en octubre con APK/tienda nueva de todas formas (hoy corre 1.0.7). O sea, hay UNA build inevitable antes del 1-oct. Lo nativo del logo entra en esa build, no en una aparte. Se anota, se agenda, no se instala nada hoy.

---

## 4. Lo que B midió y cambia el tamaño del trabajo

- **186 piezas en `packages/ui` + 115 fuera del sistema** (38 %) en `apps/*/src/components`, tres duplicadas byte a byte entre apps. La regla del rediseño («si una pieza se rediseña en la pantalla, se duplica: el rediseño vive en la pieza») obliga a absorber las 115 o declararlas locales a propósito. No las 115 el primer día: las que toque cada lote.
- **Cuatro sistemas visuales.** El admin no importa `@epetplace/ui`. Hoy no entra (arrancamos por cliente), pero se declara: el rediseño del admin es sesión propia.
- **Memorial no es isomorfo** (faltan `capaBg`, `capaText`, `accent.active`; 21 lecturas sin verificar). El nuevo tema nace con los tres temas iguales o no nace. Y memorial en el nuevo lenguaje pide letra: sin trío de personajes, sin magenta, sin cabecera ciruela festiva. Se escribe en el lote de tokens.
- **`HeroMarca` muerta y copiada local en el Hogar.** El Hogar nuevo la jubila con lápida.
- **81 reglas de `verify:diseno`, 23 atadas al VALOR.** Esas 23 se declaran una por una en el lote de tokens: cuál se recalibra, cuál se deroga con firma, cuál pasa a medir la forma. Ninguna se apaga.
- **Cero hex y cero `fontSize` a mano en las dos apps móviles.** El gate funciona: el rediseño se hace corriendo tokens, y 330 sitios ya demostraron en S97 que ese es el camino.
- Lo que B no midió y hace falta antes del primer lote de piezas: regla × pieza (qué gates se encienden al tocar cada componente) y el cruce 72 glifos ↔ 52 del mock.

---

## 5. El plan, de lo general a lo particular (borrador para firmar)

| Etapa | Pista | Qué | Sale a |
|---|---|---|---|
| 0 | mesa | las siete firmas de la sección 6; la letra del memorial nuevo; el nombre de la 4.ª tab | — |
| 1 | B | tokens v5: paleta, tipografía (fuentes nuevas), radios, sombras, motion; tres temas isomorfos; las 23 reglas declaradas; R12 re-medido en cero; assets de marca (logo, personajes) | nada visible aún |
| 2 | B | piezas del shell: `Cabecera` (raíz/empujada), `BarraTabs` con activo elevado, botón flotante del asistente, `Boton` ×3 niveles, `Campo`, `Chip`, `Opcion`, `Tarjeta`, `FilaLista`, `Estado`, `Confirmacion`, `Personaje`, `EsperaDeMarca` | nada visible aún |
| 3 | C | bienvenida + alta (00–10) sobre las piezas; Hogar sin mascota | **primer OTA a preview → recorrido 1** |
| 4 | C | Hogar y expediente (11–15) + perfil por pestañas; jubila `HeroMarca` | OTA → recorrido 2 |
| 5 | C (+A si falta dato) | Explorar, servicio, agendar, pago con checkout fiscal completo, confirmaciones (16–23) | OTA → recorrido 3 |
| 6 | C | Despensa, producto, carrito, pedido, Actividad (24–28) | OTA → recorrido 4 |
| 7 | C | Cuenta y asistente (29–30) + lo vivo que el mock no dibuja (pasaporte, facturas, memorial) | OTA → recorrido 5 |
| 8 | A | lo nativo (ícono, splash, notificación) en la build de octubre | build |
| después | — | prestador, admin, modo oscuro | sesiones propias |

Cada recorrido es tuyo en el teléfono, con el objetivo de la etapa terminado, no a mitad. Las piezas de B se capturan en emulador Android antes de entrar al candidato (ley vigente: dibujo nuevo = captura).

---

## 6. Las decisiones que hay que firmar antes de escribir un token

Formato: opciones · mi voto · una razón.

1. **La huella.** (a) muere como ley madre y sobrevive como pieza opcional · (b) muere entera · (c) sigue en los glifos. **Voto (a).** Razón: la nariz ya es la marca; la huella todavía trabaja en el mecanismo ① y en el mapa, y matarla ahí es rehacer dos leyes que no están rotas.
2. **Las capas de color por categoría.** (a) mueren; magenta/ciruela/tinta para todo, la categoría la dice el glifo y la palabra · (b) sobreviven solo en el prestador · (c) sobreviven como tinte de fondo suave en el cliente. **Voto (a).** Razón: el mock demuestra que a dos tonos se ve producto y no software, y vos ya rechazaste «colores que no contrastan bien» en la rueda de fechas.
3. **Los dos acentos.** (a) magenta acciona, ciruela selecciona (mock) · (b) mantener ocre acciona. **Voto (a).** Razón: el ocre era la respuesta a «magenta miente cuando no hay acción»; con la rampa muerta el magenta queda con un solo empleo y ya no miente.
4. **La tipografía.** (a) Baloo 2 + Plus Jakarta como el mock · (b) Plus Jakarta sola con pesos, sin Baloo. **Voto (a).** Razón: la voz redonda es lo que hace que la nariz y los personajes no se vean pegados encima de un banco.
5. **La cuarta tab.** (a) «Pedidos» · (b) «Actividad» (citas + pedidos + postventa, en curso / historial) · (c) sin cuarta tab, todo en el Hogar. **Voto (b).** Razón: el mock ya la titula Actividad en la pantalla, y así deja de ser una sección administrativa para ser el estado en curso del hogar, que es la tesis.
6. **Pantalla 02 Beneficios.** (a) queda · (b) muere y el claim de 01 gana una línea de apoyo · (c) queda como tres tarjetas deslizables con «Saltar». **Voto (b).** Razón: son cuatro argumentos entre la promesa y la puerta, y la casa quita antes de agregar.
7. **La bienvenida en movimiento.** (a) video (build) · (b) transiciones con Reanimated (OTA). **Voto (b).** Razón: la casa ya tiene el motor y el video pide binario que hoy no entra.
8. **Modo oscuro.** (a) nace en S116 · (b) después del F&F; memorial sí nace ahora. **Voto (b).** Razón: memorial es ley dura y sin él el tema no puede publicarse; el oscuro no bloquea a nadie el 1-oct.

Sin estas ocho, el lote de tokens no se puede escribir sin adivinar.
