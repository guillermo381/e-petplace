# DIRECCIÓN · LA CONVERSACIÓN DE ADOPCIÓN Y SU ESCALERA

> **Mesa founder + arquitecto, 2-sep-2026.** A la deposita en `docs/DIRECCION_CHAT_ADOPCION.md`.
> Rige para el hilo de la solicitud en las DOS apps (familia y refugio). Escrita en voz del
> founder: es lo que él va a juzgar en el aparato. Obedece DIRECCION_ARTE, DIRECCION_DISENO_S99
> (N11 campo de escritura · N15 el movimiento se calla · N16 rendimiento con número · N21
> superficies · N22 la «i» · N23 color marca clase · N24 el control no cambia el tamaño de lo
> que lo contiene) y el precedente del canon sobre colores fuera de paleta (el magenta).

---

## §1 · LA ESCALERA DE LA SOLICITUD — la pieza de despensa, no una nueva

«Los pasos de la adopción se ven **igual que el seguimiento de un pedido de la despensa**: una
fila de etapas, cada una con su glifo, unidas por una línea; la etapa en la que estoy, en el
color primario de la casa; las pasadas, marcadas; las que faltan, atenuadas. Debajo, una sola
línea que dice en qué etapa estoy: "Estás en: En conversación". Nada magenta, nada de bolas
sueltas.»

**Etapas (camino feliz):** Enviada → En conversación → Aceptada → Acta firmada → Una vida nueva.
**Finales alternos:** Declinada · Desistida · No concretada (fallecimiento). No son etapas de la
fila: reemplazan la línea de abajo con una etiqueta de clase («Declinada · 12 sep») y la fila
queda como estaba al momento de cerrarse. **Con animal en memorial no se dibuja la escalera
ni la línea** (decisión ya tomada: no se le dice dos veces la misma noticia).

**Glifos:** los que ya usa despensa para enviar/preparar/en camino/entregado se reemplazan por
los de la casa para: sobre (enviada) · burbujas (en conversación) · check en círculo (aceptada)
· pluma (acta firmada) · casa con huella (una vida nueva). Un glifo por etapa; sin texto dentro.

**Dónde vive:** arriba del hilo, colapsable: abierta muestra la fila y la línea; colapsada
muestra sólo la línea ("Estás en: …") y se abre con un toque. Se colapsa sola cuando empiezo
a escribir. **Misma pieza en las dos apps**, con las voces de cada asiento: la familia lee
«Estás en», el refugio lee «La solicitud está en».

---

## §2 · EL CHAT — cómo se comporta una herramienta de chat de la casa

### 2.1 La cabecera
«Arriba veo **con quién hablo y por qué**: la cara y el nombre del refugio (o del solicitante,
si soy el refugio), y el animal como cabecera con su foto chica y su nombre. Toco el animal y
voy a su ficha; toco el refugio y voy a su vitrina. Como refugio, en la cabecera tengo "Ver
postulación" (las respuestas del formulario, en su pantalla, no dentro del chat) y el menú con
Aceptar / Declinar (doble confirmación, P1). Nada de eso vive en la barra de escribir.»

### 2.2 El teclado nunca tapa lo que escribo
«Cuando toco el campo, el teclado sube y **la barra de escribir sube con él, pegada**; la lista
de mensajes se corre para que el último mensaje siga a la vista, sin salto. Cuando lo cierro,
todo vuelve a su lugar sin animación larga. Si deslizo la lista hacia abajo, el teclado se
guarda solo. Con el teclado cerrado, la barra respeta el borde inferior del teléfono.»
(Técnicamente: inset animado del teclado, lista invertida anclada al final, padding inferior =
alto del teclado; nunca `KeyboardAvoidingView` a ojo con offsets fijos.)

### 2.3 Los mensajes
- «Los míos a la derecha, los del otro a la izquierda; el color marca **de quién es**, no
  importancia (N23). Los mensajes seguidos de la misma persona en pocos minutos van juntos, sin
  repetir cara ni nombre; la hora aparece chica bajo el último del grupo.»
- «Separadores de día: "Hoy", "Ayer", "12 sep". Un mensaje largo se lee entero; no hay
  "ver más".»
- «Los hechos del trámite aparecen **en el hilo, centrados, como una etiqueta**: "El refugio
  aceptó tu solicitud", "El acta está lista para firmar", "Se firmó el acta". Si el hecho pide
  algo mío, debajo hay la carta con su botón ("Firmar el acta"). Así el chat cuenta la historia
  entera y no tengo que buscar el siguiente paso en otro lado.»
- «El primer mensaje del hilo lo escribe la casa cuando postulo: la respuesta automática que
  la letra §5 ya fija. No hay hilo vacío.»
- Estado de mis mensajes: **enviando** (reloj chico) · **enviado** (check) · **no se envió**
  (texto "No se envió · Reintentar", en el color de clase, no rojo de alarma). **No** hay
  "leído" ni doble check: el motor no lo sabe y no se inventa.
- Sin adjuntos (ítem 14). Sin reacciones. Sin "está escribiendo…": no se construye lo que el
  motor no sabe.

### 2.4 Llegar y volver
- «Los mensajes nuevos aparecen solos mientras estoy en el hilo, sin recargar.» (Realtime de
  la casa si existe para esta tabla; si no, sondeo cada 5 s con la pantalla en foco, y se
  declara cuál.)
- «Si estoy leyendo arriba y llega uno, no me arrastran: aparece una pastilla "1 mensaje
  nuevo" abajo; la toco y bajo.» Un botón de bajar al final aparece cuando estoy lejos del
  último.
- «Subo y se cargan los anteriores (50 por página) sin que la lista salte.»
- «En la lista de solicitudes, cada hilo con mensajes sin leer muestra el número; la
  campana también.» Se marca leído al abrir el hilo.
- Borrador: si me voy sin enviar, lo que escribí sigue ahí cuando vuelvo a ese hilo.

### 2.5 La barra de escribir
«Un campo que crece hasta cinco líneas y después se scrollea adentro; el placeholder dice a
quién le escribo: "Escribile a Refugio Aurora". A la derecha, **el glifo de enviar**: apagado
(atenuado) mientras no hay texto, encendido cuando hay. No es un botón con razón: es un glifo
que se enciende con el texto, y tocarlo vacío no hace nada. El teclado tiene "salto de línea",
no "enviar". Al enviar, el mensaje aparece al instante en la lista y el campo se vacía; si
falla, el mensaje queda con "No se envió · Reintentar". Un mensaje sólo de espacios no se
envía. Límite de 1 000 caracteres; el contador aparece recién a partir de 900.»

### 2.6 Cuando ya no se escribe
«Si la solicitud fue declinada, desistida o terminó, **la barra de escribir se reemplaza por
una línea** en el mismo lugar: "Esta conversación quedó en lectura · Declinada". Sigo pudiendo
leer todo.» Con el animal en memorial, no hay línea (decisión tomada): sólo el hilo en lectura.

### 2.7 Lo que se mide (N16)
Escribir no re-dibuja la lista (el estado del campo vive aparte). Lista invertida con filas
memoizadas; abrir un hilo de 200 mensajes en un viaje de 50 y scroll a 60 fps. Enviar: el
mensaje se ve antes de que el servidor conteste.

---

## §3 · PROMPTS

### B — piezas

```
Pista B — CHAT DE ADOPCIÓN. Leé docs/DIRECCION_CHAT_ADOPCION.md entero. Piezas
con contrato para C y rojo primero:
B1. EscaleraSolicitud: REUSÁ la pieza del seguimiento de pedidos de despensa
    (glifo por etapa + línea + estado actual debajo). Etapas y finales de §1.
    Colapsable. Rojo: cualquier color fuera de paleta (el magenta actual) y una
    etapa sin glifo. Retirá la escalera actual con lápida.
B2. CabeceraHilo: animal (foto chica + nombre) + contraparte (cara + nombre) +
    slot de acciones (menú del refugio). Toques a ficha y vitrina.
B3. BurbujaMensaje con agrupado por remitente y tiempo, hora bajo el último del
    grupo, estados enviando/enviado/no-se-envió con "Reintentar". Sin leído.
B4. SeparadorDia y EventoDelHilo (etiqueta centrada + slot de carta de acción).
B5. BarraEscribir: campo N11 que crece hasta 5 líneas, placeholder con el
    nombre, glifo de enviar que se enciende con texto (no es Boton), contador
    desde 900/1000, y su variante «en lectura» (línea con la etiqueta). El
    contenedor no cambia de alto al enfocar (N24).
B6. PastillaNuevoMensaje y BotonBajarAlFinal.
Sin animaciones de entrada (N15). verify:diseno verde.
```

### C — montaje

```
Pista C — CHAT DE ADOPCIÓN, las dos apps. Leé docs/DIRECCION_CHAT_ADOPCION.md
entero; montá sobre las piezas de B y el contrato del hilo de D.
C1. TECLADO (§2.2): inset animado del teclado; lista invertida anclada al
    final; la barra pegada al teclado; cierre al deslizar; borde inferior con
    teclado cerrado. Rojo: captura con el teclado abierto tapando el campo
    (el estado de hoy) → verde: captura con el campo a la vista y el último
    mensaje visible. Medilo en el aparato del founder: es el defecto que él
    ve.
C2. ESCALERA de B arriba del hilo, colapsable, con las voces de cada asiento;
    finales alternos como etiqueta; nada con memorial.
C3. HILO: agrupado, separadores de día, eventos del trámite en el hilo con su
    carta de acción (firmar), primer mensaje automático (§5 de la letra —
    medí que el motor lo escribe; si no, pedíselo a A por nombre, no lo
    escribas desde la pantalla).
C4. LLEGAR Y VOLVER: nuevos sin recargar (realtime si existe, si no sondeo de
    5 s en foco, declarado), pastilla de nuevo mensaje, bajar al final,
    paginado hacia arriba sin salto, no leídos en la lista y en la campana,
    borrador por hilo.
C5. BARRA: envío optimista, vacío/espacios no envía, reintento, 1000 con
    contador desde 900; variante en lectura para declinada/desistida/
    terminada.
C6. REFUGIO: «Ver postulación» y Aceptar/Declinar en la cabecera (P1), no en
    la barra.
Números de §2.7 con el perfilador. Reporte con capturas antes/después de C1.
```
