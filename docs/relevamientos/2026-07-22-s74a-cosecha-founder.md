# S74-A · LA COSECHA DEL FOUNDER — el lote visual S73 en el teléfono

> **Bundle: group `5d0c68f2` (ancla `771b7b3`) — NO se republicó nada.**
> Todo lo de esta lista YA está en tu teléfono si el update aplicó.
> Cada ítem: QUÉ / DÓNDE (camino en la app) / CÓMO SE RECONOCE QUE ESTÁ BIEN.
> Marcá por ítem: ✅ ok · ❌ falla (con una línea de qué viste) · ⏭️ no alcanzable.

---

## TANDA 0 · Confirmar el bundle (1 min — L-138/L-160)

- **QUÉ:** que corre el bundle S73, no uno viejo.
- **DÓNDE:** cerrá la app del cliente DEL TODO y abrila DOS veces.
- **BIEN:** en el Hogar ves la zona **"Tus servicios" con 4 cuadrados** y
  en el grupo de celdas la nueva **"Adopta a un nuevo miembro"** — las dos
  son superficies S73: si están, el bundle es el correcto. (Forense
  opcional: `[update] id=…` en logcat, NO `embedded=true`.)

## TANDA 1 · El Hogar (3 ítems)

**1.1 El rail "Tus servicios" a mínimo 4 + «Descubre»**
- **DÓNDE:** Hogar, la zona de cuadrados de servicios.
- **BIEN:** SIEMPRE 4 cuadrados mínimo. El ORDEN: primero los servicios
  con próxima cita (la más cercana primero), después los de actividad
  pasada reciente, al final los «Descubre» (voz humana, no botón). Tap en
  uno con actividad → va a su hub; tap en «Descubre» → Explorar. El de
  veterinaria navega a las citas de la mascota (v1 declarado, D-493).

**1.2 La franja "Ver su cita ›" (Ponte al día, anatomía 19.7)**
- **DÓNDE:** Hogar, arriba — sección "Ponte al día" (vive SOLO si hay
  pendientes; tu cita por coordinar de Zeus debería tenerla viva).
- **BIEN:** el pie de la tarjeta ya NO es un botón en caja: es una fila
  "Ver su cita" con chevron `›`, sin glifo, que tapea ENTERA. La vara:
  se ve igual al "ver cita" de las otras celdas de navegación.
- **OJO:** si "Ponte al día" NO aparece y no tenés pendientes reales,
  eso es lo correcto (la firma es la desaparición) — marcá ⏭️.

**1.3 C3 — la adopción**
- **DÓNDE:** Hogar → grupo de celdas → **"Adopta a un nuevo miembro /
  para tu familia"**.
- **BIEN:** la celda lleva el glifo de REFUGIO y la vecina "Agregar
  mascota" cambió a glifo de FAMILIA (ya no comparten glifo — Ley 12).
  Tap → pantalla `/adoptar`: próximamente HONESTO de refugios (ícono
  refugio grande + voz digna, el atrás es el camino) — no promete nada
  que no exista.

## TANDA 2 · Los selectores (4 ítems — el corazón del lote)

**2.1 EL ENTITY CHIP con las fotos reales (el gate que S73 dejó abierto)**
- **DÓNDE:** Explorar → **Paseo** (y repetí en Grooming, Adiestramiento y
  Veterinaria) → el selector "¿Para quién es?" con Thor y Zeus.
- **BIEN (la geometría firme de las capturas, ahora con FOTOS REALES):**
  la FOTO sobresale del borde izquierdo del chip (overhang) · el chip NO
  tiene borde dibujado — se apoya con sombra sutil · las esquinas
  izquierdas siguen la curva del avatar (sin "lengüeta") · **elegido =
  RELLENO magenta oscuro con nombre en blanco** · dos por fila (~50% de
  ancho cada uno), jamás uno estirado a todo el ancho.
- **LO QUE SE CIERRA ACÁ:** la PROPORCIÓN — V2 (52/44) quedó PROVISIONAL
  porque en boceto casi no distinguías; con la foto de Thor en la mano
  decidís si la proporción foto/chip está bien o pide ajuste.
- **CLARO Y OSCURO:** cambiá el tema del sistema del teléfono (la app lo
  sigue, D-305) y mirá el elegido en oscuro — es el mini-gate del token
  del LLENO (registro honesto: el relleno vs fondo mide 2.24–2.47; el
  nombre en blanco 8.25 es quien carga el estado — vos firmás si se lee).

**2.2 MEMORIAL del entity chip (solo por galería — tus mascotas están vivas)**
- **DÓNDE:** mandate por WhatsApp el texto `cliente://gallery` y tocalo
  (o pedile a Code el `adb shell am start -a android.intent.action.VIEW
  -d "cliente://gallery"`). En la galería → sección SelectorOpcion →
  paneles del modo entidad (3 temas lado a lado).
- **BIEN:** en memorial el chip degrada a tonal con elevación (sin
  relleno pleno — memorial no se celebra).
- **Camino declarado por L-161:** el tab "Tokens" NUNCA existió; la
  puerta temporal de Cuenta murió con la lámina — el deep link es EL
  camino, por eso va escrito acá.

**2.3 Los chips del QUÉ vet — dos columnas (variante B firmada)**
- **DÓNDE:** Explorar → Veterinaria → "¿Qué necesita?".
- **BIEN:** los 5 tipos en DOS columnas de ancho UNIFORME; las etiquetas
  largas ENVUELVEN a segunda línea (no truncan, no estiran el chip); el
  impar queda a ancho de columna. Ya no es la tira que se veía fea.

**2.4 El "se dice" del para-quién (firma ③, ahora en superficie real)**
- **DÓNDE:** Explorar → Paseo → elegí a Thor → elegí duración y una
  ventana → en la pantalla de paseadores disponibles, mirá el encabezado
  de la ventana elegida.
- **BIEN:** dice **"Para Thor"** con su avatar chico en línea — la
  elegida se DICE, nunca viaja muda.
- **Nota honesta:** el caso N=1 REAL (una sola elegible) no es alcanzable
  con tu familia (Thor y Zeus son ambos perros elegibles en los 4
  oficios) — quedó verificado por fixture 10/10 en S73
  (`verify-elegibilidad-memorial-s73.mjs`); lo que gateás acá es la misma
  voz en el camino vivo.

## TANDA 3 · El teclado (D-498 — 2 min, es la verificación que S74 necesita)

> Regla de la captura doble (L-162) aplicada a tu mano: el veredicto es
> CON el teclado arriba y el campo enfocado.

**3.1** Hogar → **Agregar mascota** → tocá el campo NOMBRE y con el
teclado ABIERTO: ¿ves el campo mientras escribís? Scrolleá con el teclado
abierto: ¿llegás a los campos de abajo? *(censo estático: 🟠 el más
riesgoso del cliente)*

**3.2** Cuenta → **Tu perfil** → tocá TELÉFONO con el teclado abierto:
¿se ve el campo? *(censo: 🟡)*

**3.3** Cualquier checkout (p. ej. Paseo hasta el pago, sin pagar) → el
campo cupón con teclado abierto. *(censo: cubierto por KAV — confirmarlo
en dispositivo)*

## TANDA 4 · El lote de strings del cliente — POR FAMILIA

> Dos familias: **A** ya está VIVA en tu teléfono (la gateás viéndola);
> **B** es PROPUESTA en papel (la gateás leyéndola acá — nada de esto
> está en la app todavía). Para los "en": Cuenta → Preferencias → Idioma
> → English (y volvé a Español al final).

**FAMILIA A — vivas en el bundle (gate viendo):**
- **A1 · El rail:** las voces de los cuadrados ("Adiestramiento",
  "Veterinaria", «Descubre», y la banda de error con reintento si algo
  falla) — Hogar, es y en.
- **A2 · La adopción:** "Adopta a un nuevo miembro / para tu familia" +
  la pantalla `/adoptar` — es y en.
- **A3 · El vacío que apunta arriba:** Explorar → Vet o Grooming SIN
  elegir mascota → la voz del vacío apunta "arriba" al selector (ya no
  hay botón que scrollea a lo que ya ves).
- **A4 · "Para {nombre}"** en disponibles (ítem 2.4).
- **A5 · `procedimientoConExtras` (viene de S72, sigue pendiente de tu
  gate):** detalle de una cita con presupuesto de N ítems — lee
  "Ecografia +1" (es) / "Ecografia +1" (en), jamás "Procedimiento".

**FAMILIA B — propuestas del censo de voz (gate LEYENDO acá; hoy NO están):**
- **B1 · `servicioVoz.consultaEspecializada`** — es: **"Consulta
  especializada"** · en: **"Specialist visit"**. El bug vivo que cura:
  con la app en English, Explorar → Veterinary muestra hoy "Consulta
  especializada" en castellano (cae al nombre crudo de DB) — podés verlo.
- **B2 · Los 3 voseo del i18n cliente** (solo cambia es): `errorAccion` y
  `error` → **"No pudimos completar la acción. Prueba de nuevo."** ·
  `formulaTitulo` → **"Lo que tienes que darle"** (se ve en el parte del
  vet, sección de la fórmula).
- **B3 · El para-quién se UNIFICA:** nace `explorar.paraQuien` —
  **"¿Para quién es?"** / **"Who is it for?"** — las 4 pantallas la
  consumen; mueren las 3 keys duplicadas (la voz "Para quién" de
  adiestramiento, sin signo de pregunta, se pierde a propósito — una
  acción, un nombre, todo el flujo).
- **B4 · Los ~93 voseo de los wrappers → tuteo** (es-only, mecánico,
  verificable por grep en cero): "Probá de nuevo"→"Prueba de nuevo" ·
  "No tenés acceso"→"No tienes acceso" · "Poné"→"Pon" · "Agregá"→
  "Agrega" · "Elegí"→"Elige" · "Revisá"→"Revisa". (La bilingüización de
  estos mensajes es D-472, otro arco — este lote solo cura la voz.)

**Tu veredicto de strings:** OK por familia (A y B por separado), o
correcciones línea por línea.

---

*Depositada por S74-A (T0). Los pendientes que esta cosecha NO cubre y
siguen en su fila: la vara de B sobre el entity chip v2 · el lote de
strings del PRESTADOR (de B) · los bordes de la ley del ancho (N=3/N≥5,
no alcanzables con 2 mascotas) · los ⚖️ del censo 19.8 (gate de lectura
aparte, `2026-07-22-s73a-censo-relleno-contorno.md`).*
