# S112 · LOOP DE ADOPCIÓN — el vertical entero, bien hecho, seguro y rápido

> **Mesa founder + arquitecto, 2-sep-2026.** Este documento es el único contexto de
> cada pista además del repo. Lo deposita **A** en `docs/loop/S112-LOOP-ADOPCION.md`
> antes de que nadie construya. Cada pista lee ENTERO este documento y después
> SÓLO su sección de §8.
>
> **Objetivo:** que el vertical de adopción quede construido completo, alcanzable,
> ejercido por camino real, seguro para el founder y para todos los que intervienen,
> rápido con número, y diseñado con la letra de la casa. **Nada a medias.** Lo que no
> llegue entero se declara y no viaja.

---

## §0 · DEFINICIÓN DE TERMINADO — el recorrido del founder

El loop termina cuando el founder puede hacer ESTO en su aparato, sin ayuda, sin
SQL, sin que nadie le explique nada, y cada paso se ve, se entiende y funciona:

**Como refugio** (app de negocios, cuenta `guillo381+refugio@gmail.com`):
1. Entra. Lo primero que ve es la pantalla de sus términos (los del refugio, no los del profesional). Acepta.
2. Ve tres tabs: **Home · Mascotas · Cuenta**. Home dice cuántas solicitudes tiene por revisar.
3. En Mascotas ve a Luna, Nube, Tito, Bruno (publicados) y Kira (borrador, con la razón: adulta sin esterilizar).
4. Publica un sexto animal: llena la ficha (especie, sexo, edad estimada, esterilizado, vacunas, convivencia en tres estados, historia del rescate, microchip/REMETFU si tiene, origen, bono opcional), sube fotos, enciende «publicado».
5. Le carga un evento al expediente (una vacuna con lote) **antes de que tenga familia**.
6. Recibe una solicitud, abre el hilo, conversa, acepta.
7. Ve el acta con todos los datos puestos, pide el código, lo recibe en su correo, firma.

**Como familia** (app cliente, cuenta nueva):
8. Sin cuenta, desde el login, toca «Ver mascotas en adopción» y ve la lista: arriba los que más esperan con su porqué, abajo el resto; filtros con convivencia en tres estados; sin raza.
9. Abre la ficha de Luna: fotos, semáforo de salud, convivencia, historia, ubicación aproximada, quién la publica con nombre y cara, «Apadrinar» (que dice «pronto»).
10. Toca «Quiero adoptar a Luna» → crea cuenta → elige «no tengo mascota, quiero adoptar» → vuelve al flujo, no al home.
11. Lee y acepta las condiciones de adopción (una sola vez en la vida de la cuenta).
12. Llena el formulario (hogar por rangos de edad, sin nombres de menores), marca el consentimiento, envía. Ve «Enviada» y la promesa del reloj.
13. Recibe el aviso de que el refugio respondió; conversa en el hilo.
14. Cuando el refugio acepta, ve el acta, pide su código, lo recibe, carga su cédula y domicilio si faltan, firma.
15. Con las dos firmas: hito **«Una vida nueva empieza»**; Luna está en su familia con la vacuna que el refugio cargó; el refugio figura como procedencia.

**Los rojos que el founder también ve:**
16. Kira no se puede publicar y el interruptor dice por qué.
17. Un código vencido o equivocado no firma y lo dice.
18. Desde una segunda cuenta de familia no ve la solicitud de la primera ni su hilo.
19. Sin sesión, la vidriera no muestra teléfono ni dirección de ningún refugio.
20. El botón apagado dice siempre por qué; nunca hay un botón gris mudo.

Y **el performance con número** (§6): la lista abre y scrollea sin trabarse con 1 000 publicaciones sembradas; la ficha abre en un viaje.

---

## §1 · ESTADO MEDIDO (2-sep, 09:00) — de dónde arranca cada pista

Fuentes: los partes de S112 en `docs/loop/buzon/` (censos de E: `S112-E-para-A-CENSO-ACTA.md`, `…-CENSO-FORMULARIO.md`, `…-CENSO-PUERTAS-LEGALES.md`, `…-TRASPASO-ESTADO.md`, `…-ALTA-DE-REFUGIO.md`; contrato de D: `S112-D-para-C-CONTRATO-DEL-HILO.md`; pedidos de C: `PEDIDO-1..4`).

| pieza | estado | dueño |
|---|---|---|
| Textos legales (términos refugio v2 · condiciones v2 · acta v1 plantilla), inmutables, con lector + aceptación con IP/sello/hash + wrapper | ✅ motor · 🟡 pantallas montadas sin publicar | A ✓ · C ✓ |
| Compuerta del acta fail-closed que exige vigencia | ✅ | A ✓ |
| Hilo de la solicitud (7 funciones, RLS probada en rojo) | ✅ motor · 🟡 pantallas en las dos apps | D ✓ · C |
| Job diario: reloj de 5 días + purga a 90 días | ✅ aplicado (D-1004) · ⚪ cron y push no probados | A ✓ · E |
| Adoptable completo (ingresado_en, REMETFU, señas, origen, vacunal, bono, esterilización) + **lector de la ficha** | 🟡 en construcción | A |
| destacado_espera · regla de los seis meses | ❌ esperan al adoptable | A |
| Refugio: otorgar rol · obtener_mi_cuenta_refugio · rama refugio del arranque · registro_refugio → sus términos | ❌ | A |
| Formulario de postulación (esquema cerrado + consentimiento) | ❌ (postular es un toque) | A → C |
| Firma probatoria (tabla, OTP, hash renderizado, versión ida y vuelta) · cédula/domicilio · faltantes con nombre | ❌ | A → C |
| D-485: policies de mascotas no miran familia | 🔴 bloquea el traspaso | A |
| Traspaso (RPC) | ✅ existe · cero consumidores · nunca corrió | E ejerce |
| Vidriera anónima | ✅ motor · 🟡 pantalla apagada (`ADOPCION_ALCANZABLE=false`) | C |
| Puerta sin sesión desde el login · destacados · filtros | ❌ | C (+A lector) |
| TarjetaAdoptable · Convivencia · BloqueConCriterio · FiltroPills varias · SemaforoSanitario · SenalesAdoptable · EstadoSolicitudAdopcion | ✅ entregadas, sin puerta | B → C |
| Portal del prestador (Home + hilo) | 🟡 construido y revertido del lote de guardería; vuelve con el de adopción | C |
| Tab Mascotas del refugio (publicar/editar/pausar/bajar/eventos) | ❌ | B piezas · C pantalla |
| Notificaciones del vertical (avisos con voz) | ❌ (sólo el del silencio) | D |
| Reportar publicación · memorial del adoptable · hito «Una vida nueva empieza» | ❌ | A motor · B pieza · C puerta |
| Adjuntos en el hilo | ⛔ fuera (ficha depositada) | — |
| Padrinazgo · donación · 5 % | ⛔ fuera de S112 | — |

---

## §2 · LAS LEYES QUE RIGEN (resumen; el detalle está en CLAUDE.md y CONTRATO_TRABAJO)

- **MEDIR, NO CONCLUIR.** Toda medición declara CONTRA QUÉ (repo / base / bundle / aparato) y CUÁNDO. El repo no es el objeto. Un cero puede ser del instrumento: mirá el crudo (L-479, L-480 y los cuatro falsos de anoche).
- **ROJO PRIMERO.** Un instrumento que no puede producir su rojo no mide. Cada pieza nombra su rojo antes de reportar verde.
- **ENTREGADA ≠ MONTADA.** Cada pieza declara su PUERTA. Sin puerta se reporta «entregada y no montada», jamás «lista». Cero láminas de galería como gate (L-478).
- **EL CONTRATO INCLUYE SU WRAPPER.** Motor sin wrapper no se entrega. Wrapper que pide un dato que sólo el servidor sabe (versión, id) no se entrega: el dato hace viaje redondo por el servidor.
- **CURAR NO ES CENSAR.** Después de curar, se censan las otras puertas al mismo defecto.
- **UN BOTÓN APAGADO SIN RAZÓN A LA VISTA ES EL DEFECTO.** El Boton dibuja la razón; la razón la pone la pantalla; si no hay condición, falta la razón, no el dibujo.
- **NO SE INVENTA EVIDENCIA NI TEXTO LEGAL.** Lo que no se sabe queda NULL y se dice. Los textos vienen del abogado y son inmutables.
- **NO SE MONTA CONTRA UNA FIRMA ANUNCIADA:** sólo contra un contrato aplicado y con wrapper exportado.
- **TERRITORIO:** A conduce, es la única que escribe `main` y `docs/`, aplica migraciones y asigna números (`pnpm proximo:ficha`). Worktree por pista. Control de ancestría sobre TODAS las ramas antes de cada merge. Se mergea hasta el SHA que la pista DECLARA, no la punta.
- **PUBLICAR:** un solo lote de adopción, al final, con el discriminador (¿nativa nueva? ¿app config? ¿runtime/canal?) y los shas. Sólo el «autorizo» del founder publica. Nadie enciende llaves de `app_config`; `ADOPCION_ALCANZABLE` se enciende en el último commit del lote, no antes.
- **REPORTE** en las seis secciones canónicas: construido y ejercido / construido y no ejercido / entregado y no montado con su puerta / no construido a propósito / fichas y lecciones / estado operativo.

---

## §3 · DECISIONES FIRMADAS QUE GOBIERNAN ESTE LOOP

Del founder, con fecha: expediente empieza en el rescate y se hereda (①, 31-ago) · verificación manual del refugio por administrador (④, 1-sep) · dos puertas, orden y filtros (⑦) · adopción dentro de la solicitud + reloj de 5 días (⑧) · portal de tres tabs (⑬) · ítem 10 la solicitud abre hilo · ítem 11 el adoptante ve lo que falta de salud como información · ítem 12 aviso al padrino si fallece (fuera hoy) · ítem 13 declinado queda en lectura · ítem 14 adjuntos FUERA · ítem 15 «quiero adoptar» crea familia vacía · destacado_espera = 3 por tiempo en rescate + resto por publicación reciente (1-sep) · seis meses en dos puertas (1-sep) · una sola plantilla de formulario v1 (1-sep) · 90 días borran formulario e identidad, hilo anónimo (1-sep) · código de firma por correo (1-sep) · razon-muda a 141 por ocurrencia (1-sep) · sin láminas de galería (2-sep).

**Decisiones de esta noche — rigen con el voto de la mesa salvo que el founder diga lo contrario antes de que la pieza se construya:**

| # | decisión | voto de mesa |
|---|---|---|
| N1 | ¿Cuántas solicitudes activas puede tener una familia? | **Una activa por animal, y hasta 3 activas en total.** Corta el spam sin negarle a nadie postular a dos animales. |
| N2 | ¿Quién recibe «Reportar publicación»? | Tabla `adopcion_reporte` (publicación, motivo, quien reporta) + correo a `hola@epetplace.com`. El refugio NO ve quién reportó. |
| N3 | ¿Qué avisos tiene el vertical en v1? | Cinco, con voz: solicitud recibida (refugio) · el refugio respondió (familia) · aceptada / declinada (familia) · acta lista para firmar (ambos) · «Una vida nueva empieza» (familia). Más el del silencio, ya construido. Nada de push al refugio por cada mensaje: una campana en la app. |
| N4 | ¿Qué escribe `otorgar_rol_refugio`? | Además del rol: `verificado_por`, `verificado_en`, `tipo` (organización / rescatista), y `criterio` (texto libre: qué se revisó). El abogado pidió que la verificación tenga criterio documentado. |
| N5 | ¿La ubicación aproximada es qué? | Ciudad + zona/barrio que el refugio declara al publicar. Jamás dirección, jamás coordenadas exactas. «Cerca de mí» ordena por distancia a la ciudad, no al punto. |
| N6 | ¿El refugio puede cargar eventos al expediente con el módulo de la casa? | Si el módulo actual exige dueño (`mascotas.user_id`), **el refugio es el dueño hasta la entrega** (§0 de la letra, forma «el refugio es la familia hasta la entrega»). A lo mide y lo declara; no se construye un segundo módulo de eventos. |
| N7 | ¿Padrinazgo en la ficha? | Botón «Apadrinar» visible, con la «i»: «pronto». No navega. |

---

## §4 · DISEÑO — la dirección, en voz del founder

Rigen `DIRECCION_ARTE`, `DIRECCION_DISENO_S99` (N11–N28) y `DISEÑO_EXPERIENCIA`. Se citan las que más pesan aquí: **N16** el rendimiento es ley, con número · **N17** el espejo es un interruptor, no otra pantalla · **N19** el orden de la ficha es ley · **N21** lo que agrupa va en carta, lo que ES la pantalla no · **N22** la «i» en círculo explica · **N23** el color marca clase, jamás importancia · **N24** el control no cambia el tamaño de lo que lo contiene · **N15** el movimiento se calla donde hay apuro. **Presentamos vidas, no inventario:** sin swipe, sin corazones, sin puntaje, sin badge de match.

### 4.1 Cliente

**La puerta sin sesión (login).** «Debajo de entrar / crear cuenta, un texto discreto: "Ver mascotas en adopción". Toco y entro a la lista sin que me pidan nada. Arriba de la lista, una línea: "Para postular vas a necesitar una cuenta" con la "i". Nada más.»

**La lista.** «Arriba, una carta "Llevan más tiempo esperando" con tres animales y, en cada uno, su porqué en una línea ("lleva 7 meses esperando"). Debajo, el resto, los más recientes primero. Chips de filtro arriba: especie, tamaño, edad, sexo, convive con perros / gatos / niños, urgentes, esterilizado, pareja vinculada, cerca de mí. Sin raza. "Necesidades especiales" sólo incluye. Con un filtro de convivencia activo, primero los confirmados y abajo, con su título, "todavía no se sabe". La tarjeta: foto grande 1:1, nombre, edad estimada dicha aunque sea estimada, "mestizo" escrito como cualquier raza. Urgente es una etiqueta de clase, no una alarma roja. Scroll sin trabarse.»

**La ficha.** «Fotos grandes arriba, deslizables. Nombre y edad estimada. Semáforo de salud (vacunas, esterilizado, desparasitado) con lo que FALTA dicho como información, no como alerta. Convivencia en tres estados con el mismo peso visual para "todavía no se sabe". La historia del rescate en voz humana. Señales: urgente, pareja vinculada, tiempo en rescate. Ubicación aproximada. Quién lo publica: nombre y cara, con la línea de verificación y su "i". Si hay bono: monto y destino, con la "i" de que se paga al refugio fuera de la app al conocer al animal. Abajo, un solo botón que alcanza el pulgar: "Quiero adoptar a Luna". Junto a las fotos, "Apadrinar" con "pronto". Al final, discreto: "Reportar esta publicación".»

**Crear cuenta y salida.** «Después de crear la cuenta veo una sola pregunta: ¿tenés una mascota o querés adoptar? Dos tarjetas del mismo tamaño con ilustración de la casa. Si toco adoptar, no me pidas nada más: vuelvo exactamente a donde estaba (la ficha de Luna, o la lista). Si después vuelvo al home sin mascota, el home no me muestra un cero: me muestra el bloque de adopción y una invitación a registrar una mascota.»

**Condiciones (una vez).** «Una pantalla con título, el texto entero en la letra de la casa, scroll. "Acepto y continúo" apagado con razón hasta que vi todo — y "vi todo" también es verdad cuando el texto entra sin scroll. Una sola vez por cuenta.»

**El formulario.** «Pocas preguntas, una por bloque (N12): quiénes viven en casa (adultos, y menores por rangos 0-5 · 6-12 · 13-17, cantidades, nunca nombres) · tipo de vivienda · otros animales (cuáles) · cuántas horas al día estaría solo · experiencia con animales · por qué este animal (campo de escritura N11). Abajo, el consentimiento tal cual el abogado, con su casilla; "Enviar" apagado con razón hasta marcarla. Al enviar: "Enviada" y la promesa: "Si el refugio no responde en 5 días, te avisamos."»

**Mis solicitudes y el hilo.** «Una lista con el animal como cabecera y el estado como etiqueta de clase (recibida · en conversación · aceptada · declinada). El hilo se ve como un chat de la casa: foto y nombre del refugio arriba, el animal como cabecera. Declinada: se lee, no se escribe, y lo dice. Sin adjuntos.»

**El acta y la firma.** «Cuando el refugio acepta, el hilo me lleva al acta: el texto entero con mis datos y los del animal ya puestos, scroll. Si falta algo mío (cédula, domicilio), arriba del botón una lista con nombre: "Falta tu cédula" — y un campo para cargarla ahí mismo. "Firmar" me manda un código de 8 dígitos al correo; lo escribo y firmo. Veo "Firmaste · falta la firma del refugio" como estado. Con las dos firmas, el hito "Una vida nueva empieza", con la fecha, y Luna aparece en mi familia con todo su historial y "procedencia: Refugio X".»

### 4.2 Negocios (refugio)

**Entrar.** «Mismo login de siempre. La primera vez, mis términos (los del refugio) con "Acepto" apagado hasta ver todo. Después, tres tabs: Home · Mascotas · Cuenta.»

**Home.** «Una sola cosa cuenta: "3 solicitudes por revisar", con contador. Toco y veo la lista. Debajo, novedades sin contador (hoy vacío, con su carta y su "i": padrinazgos y donaciones, pronto).»

**La solicitud.** «Veo al solicitante: nombre, cara, y sus respuestas del formulario tal cual. Debajo, el hilo. Tres acciones: responder (escribo), aceptar, declinar — las dos últimas con doble confirmación (P1). Aceptada: el hilo me lleva al acta. Declinada: el hilo queda en lectura.»

**Mascotas.** «Mis animales como animales: foto, nombre, estado (en rescate · publicado · en proceso · adoptado). Publicar / pausar es un interruptor en la tarjeta (N17), apagado con razón cuando no puede ("adulto sin esterilizar: se publica esterilizado"). Toco uno y edito su ficha: especie, sexo, edad estimada, tamaño, esterilizado, vacunas, convivencia en tres estados (tres botones del mismo peso), historia del rescate, microchip, REMETFU, origen (rescate / cesión con fecha), ciudad y zona, urgente, pareja vinculada, bono opcional (monto y destino). Fotos: subir, ordenar, la primera es la portada. Y "Cargar al expediente": el mismo módulo de eventos de la casa — vacuna con lote, castración, conducta — desde antes de que exista la familia. "Falleció": memorial con la misma dignidad que cualquier mascota, y la ficha no desaparece en silencio.»

**Firmar.** «La misma pantalla del acta que ve la familia, con mi firma: código al correo de la cuenta. Estado: "Firmaste · falta la firma de la familia".»

**Lo que jamás hay:** un contador en las novedades · un botón mudo · un dato del solicitante fuera de la solicitud · una dirección exacta en la vidriera.

---

## §5 · SEGURIDAD — para el founder y para todos los que intervienen

Requisitos duros, cada uno con su rojo obligatorio antes de que la pieza se reporte verde:

1. **RLS es la puerta.** Toda RPC del vertical es `SECURITY INVOKER` salvo las que necesitan escribir por encima del dueño (traspaso, otorgar rol, firma); ésas son `SECURITY DEFINER` con `search_path` fijo y un guard explícito de rol en la primera línea. Rojo: llamar cada DEFINER con un usuario sin rol.
2. **La vidriera anónima expone SÓLO** lo que la letra permite: datos del animal, ciudad/zona, nombre y foto del publicador. **Nunca** teléfono, correo, dirección, RUC, cédula ni ningún dato de cuenta del refugio. Rojo: `anon` selecciona la vista y se listan las columnas devueltas; si aparece una prohibida, rojo.
3. **Los datos del solicitante los ve sólo el publicador del animal solicitado.** Ya probado por D para el hilo; se repite para las respuestas del formulario y para la lista de solicitudes. Rojo: tercer usuario, otro refugio, y `anon`.
4. **D-485 curado antes del primer traspaso**, con censo de todas las tablas colgadas de la mascota (eventos, vacunas, fotos, archivos): ninguna puede quedar visible al refugio como dueño ni invisible a la familia nueva.
5. **Firma:** código de 8 dígitos, hasheado en reposo, vida 10 minutos, máximo 5 intentos, un código por firma, atado a (solicitud, usuario, versión del acta). Firma inmutable (trigger como `texto_legal_inmutable`). Se guarda: hash del texto renderizado, hash del documento fuente, versión, sello de servidor, IP hasheada, dispositivo. Rojos: código vencido · reintento con el mismo código · sexto intento · firmar sin cédula · firmar un acta jubilada · firmar por otro usuario.
6. **Aceptaciones inmutables** y con evidencia (ya construido); rojo: intentar UPDATE.
7. **Refugio:** el rol lo otorga sólo el administrador; `publicar_adoptable` exige rol Y cuenta activa. Rojo: cuenta `pendiente_validacion` publica → debe rebotar. `registro_refugio` acepta SUS términos, jamás los del profesional.
8. **Anti-abuso:** N1 (una activa por animal, tres en total) en el motor con error tipado; el 90 días borra formulario e identidad (ya aplicado).
9. **Menores:** el esquema del formulario no admite nombres ni edades exactas; el CHECK rebota cualquier clave fuera del esquema. Rojo: enviar `{"nombre_menor": …}`.
10. **Storage:** las fotos del adoptable van al bucket público `adopcion-fotos` (son públicas por diseño). **Nada más** va ahí. Rojo: intentar subir un archivo desde el hilo.
11. **Reportar publicación** no revela al reportante; el refugio no lo ve. Rojo: el refugio lista sus reportes → no puede.
12. **No se inventa texto legal, no se inventa evidencia.** Lo que el servidor no sabe queda NULL y la pantalla no lo suple.
13. **Auditoría de E (§8-E) antes del lote:** todos los rojos de arriba corridos contra la base viva, con control positivo al lado, en un solo documento.

---

## §6 · PERFORMANCE — la ley con número (N16)

- **Siembra de medición:** E siembra 1 000 publicaciones sintéticas (marcadas `prueba_perf=true`, borrables en un DELETE) sobre 20 refugios de prueba, con fotos repetidas del bucket.
- **Vidriera:** `obtener_adoptables` con paginación **keyset** (20 por página) y filtros en el servidor; índices declarados en la migración: `(estado, ingresado_en)`, `(estado, creada_en desc)`, `(especie)`, `(refugio_id)`, y el de convivencia si se filtra. **p95 < 250 ms** en el servidor con 1 000 filas, medido con `EXPLAIN (ANALYZE, BUFFERS)` y con la app (tiempo hasta primera tarjeta). Un solo viaje por página: la lista trae todo lo que la tarjeta dibuja (portada como URL, no como blob).
- **Ficha:** un solo RPC, un solo viaje (`obtener_adoptable`), **p95 < 200 ms**. Fotos con miniatura para la lista y original para la ficha (el patrón de miniaturas de la casa, si existe; si no, A lo declara y no lo inventa a esta hora).
- **Hilo:** paginado 50, un viaje.
- **Aparato:** scroll de la lista a 60 fps sin saltos; ninguna animación en la lista (N15). C mide con el perfilador y reporta el número, no «se siente bien».
- **Imágenes:** subida desde el portal con redimensionado en el cliente (lado largo ≤ 1600 px) antes de ir al bucket.

---

## §7 · LAS RONDAS DEL LOOP — orden y dependencias

```
RONDA 0 (A, en curso, destraba a todos) ─ adoptable completo + lector de la ficha +
   destacado_espera + seis meses + refugio (rol, arranque, mi cuenta, registro) +
   siembra (cuenta refugio + 5 animales por RPC) → contratos a B/C por nombre.
RONDA 1 (paralela) ─ A: formulario · D-485 · acta/firma · reportar · memorial.
   B: piezas de formulario, acta/firma, Mascotas, hito, memorial.
   C: puerta sin sesión · lista con destacados y filtros · ficha · restaurar portal ·
      tab Mascotas · formulario · hilo en las dos apps.
   D: avisos del vertical (N3) como migración + arnés para A · anti-abuso N1.
   E: auditoría de seguridad (§5) + siembra perf (§6) + medición con número.
RONDA 2 ─ C: acta y firma en las dos apps · hito · memorial · reportar.
   E: PRIMER TRASPASO REAL por camino real (guion de §0, pasos 1-20).
   A: cura lo que E encuentre · razon-muda 141 · §5-bis · censo final.
RONDA 3 ─ A: enciende ADOPCION_ALCANZABLE en el último commit · discriminador ·
   lote con shas → founder «autorizo» → recorrido del founder (§0) → lista plana →
   curas → segundo lote si hace falta.
```

**Regla del loop:** cada pista, al cerrar una entrega, deja en `docs/loop/buzon/S112-<pista>-para-<destino>-<QUE>.md` el contrato o la medición, y avisa por su parte. A mergea por SHA declarado. Nadie espera «el paquete»: se entrega pieza por pieza. **Si el contrato que esperás no llegó:** no lo inventes, no lo mockees, no montes contra una firma anunciada — hacé la siguiente pieza de tu lista que no dependa de él y declaralo en el reporte.

**Nombres canónicos** (A los fija contra la base; si ya existe con otro nombre, gana la base y se declara en el contrato):
`obtener_adoptables(filtros, cursor)` · `obtener_adoptable(publicacion_id)` · `publicar_adoptable` · `actualizar_adoptable` · `cambiar_estado_adoptable` · `otorgar_rol_refugio` / `revocar_rol_refugio` · `obtener_mi_cuenta_refugio` · `obtener_documento_vigente` · `aceptar_documento` · `crear_solicitud_adopcion(publicacion_id, respuestas, aceptacion_id)` · `responder_solicitud_adopcion` (las 7 de D) · `obtener_acta_adopcion(solicitud_id)` → `{codigo, version, texto_renderizado, hash, faltantes[]}` · `solicitar_codigo_firma(solicitud_id)` · `firmar_acta_adopcion(solicitud_id, codigo, cedula?, domicilio?)` · `traspasar_mascota_a_familia` (la llama la segunda firma, no la pantalla) · `reportar_publicacion(publicacion_id, motivo)`.

---

## §8 · LOS PROMPTS — uno por pista, listos para pegar

### 8-A · Pista A — conducís y sos el motor

```
Pista A — S112 · LOOP DE ADOPCIÓN. Leé entero docs/loop/S112-LOOP-ADOPCION.md
(depositalo vos primero, tal cual te lo pegó el founder) y después esta sección.
Conducís: única que escribe main y docs/, aplica migraciones y asigna números.
Control de ancestría antes de cada merge; mergeás hasta el SHA declarado.

RONDA 0 — destrabar a todos, en este orden, entregando pieza por pieza:
A1. EL ADOPTABLE COMPLETO. Migración con reversa: ingresado_en (fecha de ingreso
    al rescate, obligatoria) · ciudad y zona (N5) · señas · origen (rescate |
    cesion, fecha_cesion) · estado_vacunal · microchip · remetfu · esterilizado ·
    tamaño · urgente · pareja_id · bono (monto, destino, ambos opcionales) ·
    historia (texto). Convivencia con TRES estados por eje (perros · gatos ·
    niños): si | no | no_se_sabe — jamás boolean. Estados de publicación reales:
    borrador · publicada · pausada · adoptada · no_disponible · memorial (el
    memorial vive en mascotas.estado_vida: declará cómo se refleja).
A2. LOS LECTORES. obtener_adoptables con keyset (20), filtros en servidor, dos
    listas (destacados: 3 por ingresado_en más antiguo con razon redactada;
    resto: por creada_en desc), excluye memorial y no_disponible, y con filtro
    de convivencia activo ordena confirmados antes que no_se_sabe dentro de
    cada lista. obtener_adoptable(publicacion_id) con TODO lo que la ficha dibuja
    (§4.1 «La ficha»), en un viaje, con la edad YA REDACTADA desde el riel y las
    fotos como URLs. Para anon: SÓLO las columnas de §5.2 — la vista que sirve a
    anon se define por lista blanca de columnas, no por exclusión. Índices de §6
    en la migración. Rojo: anon pide la vista y se listan las columnas.
A3. LA REGLA DE LOS SEIS MESES en cambiar_estado_adoptable (→ publicada) y en
    firmar_acta_adopcion: mayor de seis meses sin esterilizar rebota con
    adoptable_no_esterilizado; menor pasa con compromiso. Misma función de
    criterio en las dos puertas. Rojo primero en las dos.
A4. EL REFUGIO: otorgar_rol_refugio(cuenta_id, tipo, criterio) para admin (N4:
    escribe verificado_por, verificado_en, tipo, criterio) y revocar ·
    obtener_mi_cuenta_refugio (nombra el rol; no el CROSS JOIN) · rama refugio
    en obtener_contexto_arranque con contrato para C · registro con contexto
    registro_refugio → terminos_refugio vigente · publicar_adoptable exige rol Y
    cuenta activa (rojo: pendiente_validacion rebota).
A5. N6: medí si el módulo de eventos de la casa acepta al refugio como dueño del
    adoptable (mascotas.user_id = cuenta del refugio hasta la entrega). Si no,
    la forma es «el refugio es la familia hasta la entrega»: declaralo y hacé
    el cambio mínimo para que registrar_evento (vacuna con lote, conducta)
    funcione desde el portal. NO construyas un segundo módulo de eventos.
A6. LA SIEMBRA (prompt del founder de hoy): cuenta guillo381+refugio@gmail.com,
    rol por otorgar_rol_refugio, y los cinco animales por publicar_adoptable —
    Luna, Nube, Tito, Bruno publicados; Kira rebota (es el rojo de A3) y queda
    en borrador. Reportá RPC por animal.
Entregá A1–A6 a C y B por nombre en el buzón, cada uno apenas esté aplicado
con wrapper exportado. C no monta contra promesas.

RONDA 1:
A7. EL FORMULARIO: crear_solicitud_adopcion(publicacion_id, respuestas jsonb,
    aceptacion_id). Esquema cerrado validado por CHECK/función: hogar {adultos:
    int, menores_0_5: int, menores_6_12: int, menores_13_17: int} · vivienda
    (enum) · otros_animales (texto corto) · horas_solo (int) · experiencia
    (texto) · motivo (texto). Cualquier clave fuera del esquema rebota. N1: una
    activa por animal y tres en total, con error tipado. Rojos: clave extra ·
    cuarta solicitud · segunda al mismo animal · sin aceptacion vigente.
A8. 🔴 D-485: user_tiene_acceso_a_mascota_como aprende familia; las tres
    policies de SELECT de mascotas pasan por él; censo de TODAS las tablas
    colgadas de la mascota. Rojos con arnés y ROLLBACK: antes, la familia
    destino no ve; después ve; el refugio ve como procedencia y no como dueño;
    divergencias = 0 en las 32 mascotas con user_id.
A9. EL ACTA Y LA FIRMA: cédula (campo propio, NO identificacion_fiscal) y
    domicilio en profiles, escribibles por el dueño · obtener_acta_adopcion
    devuelve {codigo, version, texto_renderizado, hash, faltantes[]} —
    faltantes con el NOMBRE de cada variable vacía (censo de E) · sólo
    microchip y remetfu tienen «si vacío» · solicitar_codigo_firma (correo, 8
    dígitos, hash en reposo, 10 min, 5 intentos, uno por firma, atado a
    solicitud+usuario+versión) · firmar_acta_adopcion(solicitud_id, codigo,
    cedula?, domicilio?) escribe la firma inmutable con hash renderizado, hash
    fuente, versión, sello, IP hasheada, dispositivo · la SEGUNDA firma válida
    llama a traspasar_mascota_a_familia y escribe el hito «Una vida nueva
    empieza» (evento con aniversario anual) y la procedencia. La letra d) de
    SEXTA se recorre si se suprime. Rojos: los seis de §5.5.
A10. reportar_publicacion (N2) · memorial del adoptable (misma dignidad; el
    padrino se avisa cuando exista padrinazgo — hoy no) · cancelar solicitud
    por la familia («desistir»).
A11. Aplicá las migraciones de D (avisos N3 y anti-abuso si D lo escribió
    primero) con su arnés re-corrido.

RONDA 2: curá lo que E encuentre en la auditoría y en el traspaso real ·
razon-muda a 141 · §5-bis en LETRA_ADOPCION · censo de escritores de ip_hash ·
lecciones con el comando.

RONDA 3: último commit enciende ADOPCION_ALCANZABLE · discriminador con
veredicto escrito · lote de las dos apps con shas · al founder para «autorizo».

Cada entrega: contrato + wrapper + rojo + puerta. Reporte en las seis
secciones. Nada a medias viaja.
```

### 8-B · Pista B — packages/ui

```
Pista B — S112 · LOOP DE ADOPCIÓN. Leé entero docs/loop/S112-LOOP-ADOPCION.md
y después esta sección. Worktree propio; nada de main; sin láminas de galería.
Las piezas se juzgan montadas. Cada pieza con contrato para C y su rojo.

Ya entregaste: Boton con razón · Convivencia · TarjetaAdoptable ·
BloqueConCriterio · FiltroPills varias · SemaforoSanitario · SenalesAdoptable ·
EstadoSolicitudAdopcion. Lo que falta, en orden de montaje de C:

B1. ConvivenciaInput: los tres botones del mismo peso (sí · no · todavía no se
    sabe) por eje, para el portal. Rojo: no admite un cuarto estado ni un
    boolean.
B2. FormularioPostulacion: bloques de N12, un bloque por pregunta; el de hogar
    con contadores por rango (adultos · 0-5 · 6-12 · 13-17), sin campo de
    nombre posible; campo de escritura N11 para «por qué este animal»; la
    casilla de consentimiento con el texto que C le pasa (documento de A), y
    el slot del botón «Enviar» que recibe su razón.
B3. DocumentoLegalLectura: texto largo en la letra de la casa, scroll, y el
    evento «vio todo» que también dispara cuando el texto entra sin scroll
    (caso real: condiciones de 1 711 caracteres). Ya lo usa C para
    aceptaciones; la misma pieza sirve para el acta con un slot de
    «faltantes» arriba del botón y un slot de estado de firmas.
B4. CodigoFirmaInput: 8 casillas, pegado desde el portapapeles, error inline
    (código vencido / equivocado / intentos agotados) sin rojo de alarma:
    N23, es un estado.
B5. HitoUnaVidaNueva: la carta del hito con fecha y «procedencia: <refugio>»,
    ilustración de la casa, sin confeti (N15).
B6. MemorialAdoptable: la ficha del fallecido con la dignidad de la casa (la
    misma que el memorial de cualquier mascota — reusá, no dupliques).
B7. TarjetaMascotaRefugio: la tarjeta de la tab Mascotas con el interruptor
    publicado/pausado (N17) que recibe su razón cuando no puede, y el estado
    como etiqueta de clase.
B8. FichaAdoptable: la composición de §4.1 «La ficha» como pieza de layout
    (galería 1:1 deslizable arriba · identidad · semáforo · convivencia ·
    historia · señales · publicador con línea de verificación y «i» · bono
    con «i» · botón único que alcanza el pulgar · Apadrinar «pronto» ·
    Reportar discreto). Orden es ley (N19). Cada bloque que agrupa en carta
    (N21).

Rojo primero en cada pieza: el caso que no debe dibujarse (boolean en
convivencia, nombre en el hogar, botón sin razón). verify:diseno verde en cada
commit. Reporte con puerta por pieza.
```

### 8-C · Pista C — apps/*

```
Pista C — S112 · LOOP DE ADOPCIÓN. Leé entero docs/loop/S112-LOOP-ADOPCION.md
y después esta sección. Worktree propio. Montás SÓLO contra contratos
aplicados con wrapper exportado. Cada montaje declara su puerta. Si un
contrato no llegó, seguís con la siguiente pieza y lo declarás.

Orden (sigue el orden en que A entrega):
C1. LA PUERTA SIN SESIÓN desde el login (§4.1) y la puerta con sesión en
    Explorar (ya construida; sigue apagada por ADOPCION_ALCANZABLE hasta el
    último commit del lote).
C2. LA LISTA sobre obtener_adoptables: BloqueConCriterio con destacados y su
    razón · resto · FiltroPills varias con los tres estados · TarjetaAdoptable
    · keyset con «cargar más» · sin animaciones · edad redactada del riel.
    Medí el scroll con el perfilador y reportá el número (§6).
C3. LA FICHA sobre obtener_adoptable con FichaAdoptable de B: Convivencia
    (gate del founder en esta pantalla, con Nube), SemaforoSanitario con lo
    que falta como información (ítem 11), señales, publicador, bono, Reportar
    (reportar_publicacion), Apadrinar «pronto». Un viaje.
C4. LA SALIDA «QUIERO ADOPTAR»: vuelve exactamente a donde estaba (ficha o
    lista), no al home. Condiciones una sola vez (ya montada: verificá que
    «vio todo» dispara sin scroll).
C5. EL FORMULARIO con FormularioPostulacion sobre crear_solicitud_adopcion:
    consentimiento con documento de A; «Enviar» con razón; N1 dibujado con la
    razón del motor (una por animal, tres en total); «Enviada» + la promesa
    del reloj (AHORA sí: el job existe).
C6. MIS SOLICITUDES + HILO (cliente) con el contrato de D; desistir.
C7. EL PORTAL: revertí el revert (el gate razon-muda lo resuelve A) · rama
    refugio del arranque · términos al primer ingreso (ya montado) · Home con
    contador y novedades sin contador · solicitud con formulario + hilo +
    aceptar/declinar (P1) · tab MASCOTAS: lista con TarjetaMascotaRefugio,
    ficha de edición con ConvivenciaInput y todos los campos de A1, fotos con
    redimensionado ≤1600 px y portada, interruptor con razón (seis meses),
    «Cargar al expediente» con el módulo de la casa (N6), «Falleció» →
    memorial.
C8. EL ACTA Y LA FIRMA en las dos apps con DocumentoLegalLectura +
    CodigoFirmaInput: faltantes con nombre y campos para cargarlos (cédula,
    domicilio) · estado de firmas · versión del acta ida y vuelta por el
    servidor, nunca escrita en la pantalla · con las dos firmas,
    HitoUnaVidaNueva y el animal en la familia con su historial y procedencia.
C9. Los avisos (N3) llegan a la campana y a la pantalla que corresponde
    (ruta en el data de FCM, como guardería).

Reporte: cada pantalla con su puerta, qué frenó la pantalla vs qué frenó el
código, y los números de §6. Los guards con dos hechos adentro (elegibles
vacío vs carga vs error) se reportan por nombre.
```

### 8-D · Pista D — packages/mensajeria + migraciones para A

```
Pista D — S112 · LOOP DE ADOPCIÓN. Leé entero docs/loop/S112-LOOP-ADOPCION.md
y después esta sección. Worktree propio; no aplicás migraciones ni tomás
números: entregás a A migración + reversa + arnés, como hiciste con el job.

D1. LOS CINCO AVISOS DEL VERTICAL (N3) sobre MODELO_NOTIFICACIONES: solicitud
    recibida (al refugio) · el refugio respondió (a la familia) · aceptada /
    declinada (a la familia) · acta lista para firmar (a ambos) · «Una vida
    nueva empieza» (a la familia). Cada uno: intención + voz + categoría +
    consentimiento (categoría × canal) + ruta en el data. Recordá tu hallazgo:
    con p_mascota_id el GATE 3 descarta al postulante — decidí por aviso si
    va con mascota o sin ella y declaralo. Rojo primero: un aviso no sale para
    un animal en memorial; no sale dos veces (clave_dedup); no sale al tercero.
D2. ANTI-ABUSO N1 como función de guard reutilizable (una activa por animal,
    tres en total) si A no la escribió primero — coordiná por el buzón para
    no escribirla dos veces.
D3. PRUEBA DEL CRON: verificá que el job diario DISPARA (no sólo que está
    agendado) sobre un caso sembrado con fecha vieja; y con E, que una push del
    vertical llega a un teléfono (el de prueba del founder). Lo no probado
    queda declarado.
D4. Entregá a C, por nombre, la actualización del contrato del hilo si A cambió
    algo (desistir, estados nuevos).

Reporte: los rojos con evidencia, lo entregado a A con su arnés, lo no probado.
```

### 8-E · Pista E — medición, seguridad, performance, y el traspaso real

```
Pista E — S112 · LOOP DE ADOPCIÓN. Leé entero docs/loop/S112-LOOP-ADOPCION.md
y después esta sección. Worktree propio; no escribís main ni código de
producto. Sos el instrumento independiente: medís contra la base viva, con
control positivo al lado de cada rojo.

E1. AUDITORÍA DE SEGURIDAD (§5) — un solo documento, una fila por requisito,
    con: la sonda exacta, el rojo esperado, lo que dio, contra qué y cuándo.
    Corrés lo que existe apenas A lo entregue, y re-corrés al final. Incluye:
    columnas que ve anon · tercer usuario/otro refugio/anon sobre solicitudes,
    respuestas e hilo · DEFINERs sin rol · pendiente_validacion publica ·
    OTP vencido/reusado/sexto intento/otro usuario/acta jubilada/sin cédula ·
    UPDATE sobre firmas y aceptaciones · clave extra en respuestas · subida al
    hilo · el refugio lista reportes · D-485 antes y después.
E2. PERFORMANCE (§6): siembra de 1 000 publicaciones sintéticas marcadas
    (prueba_perf=true) sobre 20 refugios de prueba, y su DELETE al final.
    EXPLAIN (ANALYZE, BUFFERS) de obtener_adoptables (con y sin filtros, primera
    y quinta página) y de obtener_adoptable; p95 con 20 corridas. Reportá el
    número y el plan; si no cumple §6, nombrá el índice que falta — A lo
    escribe.
E3. EL PRIMER TRASPASO REAL por camino real (cuando A cierre A9 y C cierre C8):
    el guion de §0 pasos 1-20, con dos cuentas nuevas (refugio de prueba
    separado del del founder + familia nueva por el alta), un animal con vacuna
    con lote y una conducta cargadas por el refugio ANTES de la familia,
    postulación sin sesión, hilo, aceptación, dos firmas con código, traspaso.
    Rojo primero (los de §5.5). Verde: la vacuna y la conducta en la familia,
    procedencia el refugio, hito escrito. Donde muera: capa y evidencia.
E4. EL ESCENARIO DEL FOUNDER: dejá escrito, paso a paso, con qué cuenta y qué
    animal, el recorrido de §0 para que el founder lo siga en su aparato sin
    preguntar nada. Sin proponer curas: nombrá la puerta.
```

---

## §9 · CIERRE — el lote de adopción

1. E3 en verde, E1 sin rojos abiertos, E2 dentro de §6.
2. A enciende `ADOPCION_ALCANZABLE` en el último commit, corre el discriminador (¿nativa nueva? ¿app config/permisos/plugins? ¿runtime/canal? — si el redimensionado de imágenes trae una dependencia nativa, es APK y se dice) y arma UN lote de las dos apps con sus shas.
3. El founder dice «autorizo». A publica y entrega los groups con su ancla leída del objeto.
4. El founder hace el recorrido de §0 con la cuenta de refugio y una cuenta de familia nueva, y entrega su lista plana.
5. Curas → segundo lote si hace falta → «autorizo».

**Fuera de este loop, para que nadie lo tome de paso:** padrinazgo · donación · el 5 % · adjuntos en el hilo · personalización del formulario por refugio · el Pet Parent v1.0 entero (S113) · el protocolo del animal no retirado (guardería) · borrado de las cinco tablas legado.

---

## §10 · AUTORIZACIÓN CONDICIONADA DEL FOUNDER (2-sep) — depositada por A

> **Podés publicar el lote de adopción al canal preview SIN esperar otra palabra
> si y sólo si:** E1 sin rojos abiertos · E2 dentro de §6 · discriminador con los
> tres en NO (OTA).
>
> **Si cualquiera falla, NO publicás:** armás el lote y esperás.
>
> Al publicar, dejá los groups con su ancla en el parte, y **E corre E3/E4 en el
> aparato del founder**.
