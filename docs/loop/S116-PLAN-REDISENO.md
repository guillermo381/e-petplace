# S116 · PLAN DEL REDISEÑO — app cliente

Mesa, 13-sep-2026. Objetivo: que la app se vea notablemente mejor sin dañar una sola función ni nada de lo que la casa ya hizo bien. Complementa `S116-ANALISIS-REDISENO.md`. Firmas recibidas: 1(a) con la pata pisando chips · 3(a) · 4(a) · 5(b) Actividad · 7 transiciones · 8(b). Abiertas: 2 (cómo queda sin capas) y 6 (Beneficios).

---

## 0. Las tres reglas del método

1. **Nada se rediseña en la pantalla.** El rediseño vive en la pieza (B) y la pantalla la consume (C). Si C necesita algo que la pieza no da, lo pide por buzón; no lo dibuja. Es la única forma de que 32 pantallas se vean como una sola app.
2. **Lo intocable tiene dueño y gate ANTES de tocarlo** (sección 2). Un lote no arranca sin haber leído qué protege la pantalla que va a tocar.
3. **Cada lote cierra con el objetivo terminado, no a mitad:** medir → construir → capturar en Android → candidato → OTA a preview → tu recorrido. El recorrido es tuyo y es por objetivo cumplido; nadie te pide mirar tandas.

---

## 1. Cómo se cambia sin romper — la estrategia de convivencia

### Tokens: se cambian EN EL LUGAR, sin llave

Dos opciones, y la que elijo:

- **(a) En el lugar.** Los tokens v4 se corren a v5 en `packages/ui`, en la rama de B. Todo lo que consuma tokens cambia de golpe. **Voto (a).** Razón: dos mundos vivos duplican cada gate, cada captura y cada baseline; la veda de producción ya es el seguro que una llave daría.
- (b) Tema «morado» al lado del claro, conmutado por `app_config`. Rollback = apagar la llave. Costo: fuentes dobles cargadas, dos baselines de `verify:diseno`, dos capturas por pantalla, y un tema muerto que después hay que jubilar con censo.

Lo que (a) implica y hay que saber: **el primer OTA muestra TODAS las pantallas con la paleta y la tipografía nuevas, aunque su estructura sea vieja.** Eso es deseable, no un defecto: la app entera sube un escalón el mismo día, y las pantallas que todavía no tienen su lote se ven «nuevas por dentro, viejas por fuera», no rotas. El ejemplo medido es S97: 330 sitios cambiaron corriendo tres tokens, y B midió que hoy hay cero hex y cero `fontSize` a mano en las apps móviles. El rediseño tiene ese piso limpio.

### Piezas: nacen nuevas, las viejas mueren con lápida

- Las piezas del shell (`Cabecera`, `BarraTabs` de cinco, botón del asistente, `Confirmacion`, `Personaje`) **nacen con nombre propio**. No se «adaptan» las viejas: se escriben las nuevas contra el mock.
- Las piezas base (`Boton`, `Campo`, `Chip`, `Opcion`, `Tarjeta`, `FilaLista`, `Estado`) **se rediseñan en su archivo** conservando su contrato (mismas props, mismos nombres): el consumidor no se toca. Si el contrato tiene que cambiar, es enmienda declarada y C migra en su lote.
- Una pieza vieja muere **cuando su último consumidor migró**, medido por import (el método de B), y muere con lápida: exit 2 y nombre de la que la reemplaza. Nunca conviven dos piezas para lo mismo sin que una tenga fecha de muerte.
- **Las 115 piezas locales** de `apps/*/src/components` no se absorben todas el primer día: cada lote absorbe las que toca, y las que quedan se declaran locales a propósito o entran a la cola. El triage es del lote 0.

### Datos: A entra solo si falta uno

El rediseño no toca la base ni `packages/api` salvo que una pantalla nueva necesite un dato que hoy no llega. Candidatos conocidos: el lector unificado de Actividad (citas + pedidos + postventa, en curso / historial) si no existe; el «quién emite» para las confirmaciones (ya con dueño de S115). Todo lo demás es puerta única como está.

---

## 2. Lo intocable — comportamiento que el rediseño respeta aunque cambie cómo se ve

| Qué | Dónde vive / quién lo vigila |
|---|---|
| El motor de pagos y la superficie de pago como UNA pieza | `R57` · `LETRA_PUERTA_DE_PAGO_S101B` §8 |
| El checkout fiscal S115: pregunta siempre si quiere factura · arriba de $50 se PIDEN los datos y sin ellos no se cobra (el freno está en el acto de cobrar) · correo arriba y siempre · desglose 0 %/15 % con IVA visible aunque sea cero · tarifa $0,99 tachada en F&F | piezas fiscales con cabecera de lección · el gate que nombra el parte de B §6 |
| El formato de la plata: coma decimal, punto de miles, una sola fuente | `moneda.ts` · su gate de fuente única |
| Los tres números del prestador al poner precio | fuera de alcance (prestador), no se toca |
| Las tres voces de «no cargó»; cortada NUNCA ofrece volver a entrar; la familia jamás ve un motivo técnico | piezas de S115 · cinturón de voz |
| Loyalty: sin puntos, niveles, badges, rachas que reprochan; contador que puede llegar a cero | `R11` · `MODELO_LOYALTY` §3, §8 |
| Memorial apaga todo el motor y calla; el tema memorial existe y es isomorfo | tres temas · lote 1 |
| Lo que no se sabe queda NULL, viaja y se dibuja diciendo que es NULL | ley del founder 5-sep · nacimiento con precisión mes |
| Sin dato → sin gráfico, y un punto no es una serie | `serie_dibujable` del motor |
| La escalera de la cara de la mascota | §2.11 · un solo lugar |
| El Home es estado, no catálogo; sin relleno cuando no hay nada; UNA acción principal por vista | DISEÑO_EXPERIENCIA §1-§2 |
| Toda superficie que lista avisos declara su tope | regla 6-sep |
| Puerta única: las apps no tocan la base | `packages/api` · censo por import |
| Paridad de cuenta: lo que Cuenta tiene hoy no se pierde al rediseñarla | ley 23-ago |
| La marca ajena no se redibuja (Apple, Google, DeUna, Nuvei) | §6sexies |
| Contraste WCAG AA de todo texto | `verify:contrast` (se re-mide, no se afloja) |
| Área táctil 44 × 44 | N-reglas · el mock lo dice igual |
| Voz: tuteo neutro en pantalla, jamás voseo | cinturón de voz de D |

Toda pantalla del lote lista, en su prompt, cuáles de estas filas la tocan. Es la mitad del prompt.

---

## 3. La red de seguridad — qué se mide antes, durante y después

**Antes (lote 0):**
- **La línea base visual.** Capturas Android de todas las pantallas del cliente con la familia de prueba (Nina si se crea, Thor y Zeus), commiteadas en `docs/loop/capturas-s116-antes/` con SHA. Es contra lo que se compara cada lote. Sin esto el rediseño se juzga contra el recuerdo.
- **La línea base numérica (E):** `verify:diseno` (81 reglas, exit 0, baseline), `verify:contrast` (436), tamaño del bundle, tiempo de arranque, memoria plana a 120 s (la cura de D-1074 no se puede perder), los smokes y E2E que corren hoy. Con comando y SHA.
- **Las mediciones que faltan (B):** regla × pieza (qué gates se encienden al tocar cada componente) · el cruce 72 glifos vivos ↔ 52 del mock · el triage de las 115 locales · las 21 lecturas de slots que memorial no tiene.

**Durante cada lote:**
- B captura cada pieza con dibujo nuevo en emulador Android, **montada en una pantalla real**, no en galería (enmienda S112). Las capturas van en el parte.
- C monta y captura la pantalla del lote antes y después.
- E re-corre la línea base numérica sobre el candidato: contraste en cero regresiones, bundle sin crecer por fuera de lo declarado (las fuentes nuevas se declaran), memoria plana.
- A arma el candidato con el ritual entero (censo de puntas dos veces, SHA mergeado, gates con exit) y publica a preview cuando decís «autorizo».

**Después de cada OTA:**
- Tu recorrido por objetivo terminado. La lista de lo que se ve mal arma la tanda de corrección del mismo lote antes de abrir el siguiente.

**Lo que no se mide, no se declara:** nada de «se ve bien» sin captura; nada de «no rompe» sin la línea base re-corrida.

---

## 4. Los lotes

| # | Pista | Entra | Sale | Gate de cierre |
|---|---|---|---|---|
| **0 · Medir** | B · E · vos | el parte de B de S116; el material de marca | línea base visual y numérica; regla × pieza; glifos 72↔52; triage de las 115; las 21 de memorial; logo y personajes en fuente | tres partes con comando + SHA; cero capturas faltantes |
| **1 · Tokens v5** | B | los 16 valores, la tipografía y las medidas del mock; la letra del memorial nuevo | paleta, tipografía por peso (Baloo 800 · PJS 400/600/700; DM Sans fuera), escala en tokens fijos (los rangos del mock se cierran a un número), radios, sombras (elevation + shadow, no CSS), motion 180–240 sin rebote + entrada; **tres temas isomorfos**; las 25 reglas (23 filas) atadas al valor declaradas una por una (recalibrada / derogada con firma / pasada a forma); R12 y contrast en cero | `verify:diseno` verde con su baseline nuevo; contrast 0 regresiones; tres pantallas existentes capturadas bajo tokens nuevos |
| **2 · Shell y piezas base** | B | lote 1; el mock §04-§05 | `Cabecera` (raíz / empujada), `BarraTabs` de cinco con activo elevado, botón del asistente, `Boton` ×3 niveles, `Campo` con etiqueta afuera (N11′), `Chip`, `Opcion`, `Tarjeta`, `FilaLista`, `Estado`, `Confirmacion`, `Personaje` (6), `Logo`/`Isotipo` nuevos, `EsperaDeMarca` rehecha; glifos del cruce por tanda con hoja de contacto §6b | cada pieza capturada montada en Android; contratos declarados; ninguna pieza nueva sin consumidor previsto (el lote 3 los nombra) |
| **3 · Bienvenida y alta** | C | lotes 1-2 | 00–10 del mock con las correcciones de la sección 5; tabs nuevas y asistente flotante montados; Hogar sin mascota | **OTA → recorrido 1** |
| **4 · Hogar y expediente** | C | lote 3 | 11–15; perfil por pestañas; `HeroMarca` jubilada con lápida; Línea de Vida y pasaporte QR en el nuevo lenguaje | **OTA → recorrido 2** |
| **5 · Servicios, cita y pago** | C (+A si falta dato) | lote 4 | 16–23; checkout fiscal entero dentro del patrón del mock; `DesgloseCompra` montada; las cinco confirmaciones con «la factura llega aparte» | **OTA → recorrido 3** |
| **6 · Despensa y Actividad** | C (+A: lector unificado) | lote 5 | 24–28; Actividad con en curso / historial | **OTA → recorrido 4** |
| **7 · Cuenta, asistente y lo que el mock no dibuja** | C | lote 6 | 29–30; memorial, perdida, adopción, guardería, facturas, saldo, las tres voces de «no cargó» | **OTA → recorrido 5** |
| **8 · Nativo** | A | logo firmado | ícono, splash nativo, ícono de notificación, `app.json` | entra en la build de octubre, no en una aparte |
| **9 · Cierre** | A · B | todo | censo de piezas sin consumidor (lápidas), baseline de `verify:diseno` cerrado, acta con lo que cambió de letra | acta firmada |

**Sobre el tiempo.** Quedan 18 días al 1 de octubre y trabajás de noche y fines de semana. El orden de los lotes está pensado para que, si el tiempo se acaba, lo hecho sea coherente: bienvenida → hogar → servicios y pago son el camino que un invitado de F&F recorre el primer día; despensa, cuenta y lo raro pueden salir con estructura vieja y piel nueva sin que nadie lo lea como roto. No firmo un cronograma: firmo el orden.

---

## 5. Correcciones al mock que entran al lote 3

- 00: la barra «Perros · Cargando» no simula progreso. Es el paso de los personajes o desaparece.
- 01: «Bienvenido» y todo texto con género → neutro. El claim solo.
- 02: pendiente de tu firma (decisión 6).
- 07: nacimiento acepta día, mes/año o solo año, y la pantalla dice lo que no tiene; raza con autocompletado sobre `cat_razas`; peso opcional.
- 08: el personaje de la especie es el primer peldaño de la escalera de la cara, declarado.
- 09: la lectura del carné usa `extract-vacuna` y espera con `EsperaDeMarca`; si no puede leer algo, lo dice (tres cláusulas).
- 10: confirmación con el patrón único de la casa (check + personajes + dato + dos acciones).

---

## 6. Reglas para los prompts que salen de esta mesa

- **A B:** qué pieza, su contrato, cómo se ve y cómo se siente (dicho desde quien la toca), qué reglas de `verify:diseno` la miden, qué captura tiene que traer. Sin dictarle implementación.
- **A C:** la pantalla descrita desde tu punto de vista (qué ves al entrar, qué pasa al tocar, qué se mueve, qué dice cuando no hay dato o no cargó), las piezas que consume, las filas de la sección 2 que la tocan, la captura antes/después. **La UX se dicta antes de que se construya nada.**
- **A E:** qué medir, contra qué línea base, y qué rojo tiene que poder producir.
- **A A:** qué entra al candidato y qué queda fuera, con SHA.
- Un bloque por pista, nombre arriba, listo para pegar.
