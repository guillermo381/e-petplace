# S79-B · TANDA 2 — BOCETOS M1 + PEDIDOS A A (antes de composición)

**Fecha:** 27-jul-2026 · **Sesión:** B · **Territorio:** `apps/prestador` únicamente.
Curas aprobadas por el founder sobre el audit (`2026-07-27-s79b-audit-dia1.md`):
B1 prepará tu espacio · B2 bienvenida §2.3 · B3 firma en el home + voz de oficio ·
B4 aspiracional §2.5 · B5 (si da) los tres mudos. En paralelo: M1 del perfil
recompuesto y M1 de la vitrina (bocetos, cero código).

---

## 0. PEDIDOS A A — emitidos YA, texto autocontenido (regla 76(b)/S54)

> **PEDIDO B→A #1 — LA MARCA DE PRIMER LOGIN (motor de la bienvenida §2.3).**
> La bienvenida digital del Día 1 es pantalla completa que se muestra UNA vez,
> al primer login del prestador, y jamás de nuevo. B la construye en esta tanda
> con un PUENTE local declarado (AsyncStorage por `userId` en el dispositivo:
> clave `s79.bienvenida.vista:<userId>`), que tiene dos límites conocidos:
> reinstalar la app la vuelve a mostrar, y otro dispositivo la muestra otra vez.
> **Lo pedido:** una marca DURABLE de "bienvenida vista" legible y escribible por
> el titular. Forma sugerida (A decide la suya): columna
> `prestadores.bienvenida_vista_en timestamptz NULL` + su lectura dentro de
> `obtenerMiPrestador` + un wrapper de escritura idempotente
> (`marcarBienvenidaVista(): R<null>` — UPDATE de la propia fila; si la RLS de
> `prestadores` no deja al titular escribir esa columna tras D-389, será RPC).
> **Contrato que B ya consume:** cuando `obtenerMiPrestador` exponga
> `bienvenida_vista_en`, B retira el puente y lee eso. Cero backfill (L-176):
> filas viejas en NULL verían la carta una vez — correcto para la cohorte.
>
> **PEDIDO B→A #2 — LA COLUMNA `proposito` (la devolución del propósito §2.3).**
> §2.1 ordena que la aplicación del prestador guarde su respuesta de propósito y
> §2.3 que la bienvenida se la DEVUELVA (*"Vos nos dijiste: '[su respuesta]'"*).
> **Lo pedido:** columna `prestadores.proposito text NULL` (la escribe el
> founder/admin al aceptar la aplicación — cero productor en la app del
> prestador) + su lectura en `obtenerMiPrestador`. **Contrato que B ya consume:**
> la pantalla de bienvenida renderiza el bloque de devolución SOLO si
> `proposito` llega no-nulo y no-vacío; hoy el bloque queda construido y apagado
> (la letra misma lo condiciona: *"Si el prestador respondió la pregunta…"*).

---

## 1. M1 — B1 · "PREPARÁ TU ESPACIO" (el HOY en modo preparación)

**TESIS (Ley 14):** "Tu espacio se prepara acá — cuando esté listo, las familias
te encuentran." (El home del virgen comunica preparación con camino, jamás un
vacío que promete lo inalcanzable.)

**FIRMA (Ley 15):** la COMPOSICIÓN del modo preparación — la invitación a
preparar la casa preside el día vacío. Comportamiento, no color (dosis baja).

**El argumento que ordena el diseño (del gate):** el `EstadoVacio` de hoy
("Hoy no tienes citas / Cuando una familia agende contigo…") promete un disparo
inalcanzable sin oferta. La cura cierra la cadena: mientras el espacio NO está
preparado, esa voz MUERE y preside la preparación.

**Boceto (vista 'hoy', usuario virgen):**

```
┌─ TechoOficio (INTACTO: saludo · negocio · [forma del día omitida]) ─┐
│                                                                     │
│  ┌─ FIRMA (B3) ──────────────────────────────────────────────────┐  │
│  │ [LogoNegocio 56] Nombre comercial                              │  │
│  │                  Veterinaria · Quito                           │  │
│  │                  (Prestador fundador)  ← pill informativa      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Prepará tu espacio            ← Texto seccion                      │
│  Cuando esté listo, las familias te encuentran.  ← Texto apoyo      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ [maletín]  Tus servicios                              (●) ›    │  │
│  │            Di qué haces y cómo — es lo que tus                 │  │
│  │            clientes leen cuando te encuentran.                 │  │
│  │ ────────────────────────────────────────────────────────────── │  │
│  │ [calendario] Tus horarios                                 ›    │  │
│  │            Tu agenda solo ofrece las horas que tú digas.       │  │
│  │ ────────────────────────────────────────────────────────────── │  │
│  │ [billete]  Tus precios                                    ›    │  │
│  │            Cada servicio dice cuánto vale antes de reservarse. │  │
│  │ ────────────────────────────────────────────────────────────── │  │
│  │ [correas]  Tu equipo                                      ›    │  │
│  │            Si trabajas con más gente, acá entran. Si trabajas  │  │
│  │            solo, este paso no es tuyo.                         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Eres parte de un grupo curado de 15 prestadores… (B4, pie)         │
└─────────────────────────────────────────────────────────────────────┘
```

**Las 7 preguntas (§1c):**
1. **Trabajo:** entrar a una sección (4 filas navegan) = anatomía 19.1; el check
   es estado pasivo = 19.4 (`Insignia soloPunto`, jamás interactivo).
2. **¿Existe en la casa?** `CeldaNavegacion` cumple 19.1 pero NO tiene slot
   `fin` para el check → se COMPONE con `Celda` (el ladrillo de fila) montando
   la anatomía 19.1 exacta (Icono b′ + título + subtítulo + chevron) + el punto
   en `fin`. NO se copia el componente (L-175); **queda pedido de ensanche**:
   `CeldaNavegacion` con slot `fin` opcional (nota a A/mesa, no bloquea).
   Divergencia declarada: pressed de `Celda` RESALTA (S43) vs 0.99 de
   `CeldaNavegacion` — se acepta hasta el ensanche.
3. **Vecindad:** las tareas aterrizan en el tab Negocio (mundos/talleres) y en
   `/negocio/equipo` — misma voz que sus destinos ("Configurar tu oficio" vive
   allá; acá la tarea INVITA, allá se ejecuta).
4. **Tesis:** cada elemento la sirve; lo que no la servía (el vacío que promete)
   MUERE en este modo.
5. **Capa/dosis:** prestador baja — cero acento nuevo; check = `soloPunto`
   estado `alDia` (verdeVital existente); glifos del registry: `negocio`
   (maletín, stand-in declarado — mismo precedente que cuenta comercial) ·
   `vacaciones` (calendario, stand-in declarado para horarios) · `pagos`
   (billete) · `equipo` (correas).
6. **Temas/estados:** cargando → el módulo NO aparece (aparece con verdad);
   fallo de lectura de un check (franjas/equipo) → esa tarea se muestra SIN
   check y sin afirmar pendiente (patrón S78-D-521: un fallo no fabrica un
   falso estado; limitación visual declarada — sin check se LEE pendiente, se
   acepta porque navegar sigue siendo correcto); memorial degrada por
   componentes; es/en espejo.
7. **Chanel:** murió el `EstadoVacio` "Hoy no tienes citas" + el botón "Ver tu
   semana" EN MODO PREPARACIÓN (fuera de él siguen intactos — ahí la promesa ya
   es alcanzable).

**Contrato de datos (M4):**
- `serviciosOk` = ≥1 oferta activa en cualquier oficio — **de los fetches que el
  HOY ya hace** (`oficios.paseo|grooming|adiestramiento|vet`), cero query nueva.
- `preciosOk` = ≥1 oferta activa con precio > 0 — derivado de las MISMAS ofertas
  ya fetcheadas. **Declarado:** hoy deriva de la misma data que `serviciosOk`
  (el precio nace en el taller junto al servicio); la tarea existe porque su
  POR QUÉ es distinto (qué haces ≠ cuánto vale).
- `horariosOk` = ≥1 franja activa — `obtenerFranjasHorario(prestadorId)`
  (**+1 viaje en el arranque del HOY**, solo en modo posible-preparación;
  familia D-555/D-497 declarada).
- `equipoOk` = ≥2 miembros activos — `obtenerEquipoNegocio(cuentaComercialId)`
  (**+1 viaje**, SOLO si el módulo va a renderizar y hay cuenta; sin cuenta
  comercial la tarea se muestra sin check).
- **Regla de existencia del módulo:** visible ⟺ `!(serviciosOk && horariosOk)` —
  servicios+horarios son lo que vuelve al negocio reservable (7.13); equipo es
  opcional y precios deriva. Completadas esas dos, el módulo desaparece entero
  (regla de existencia, jamás un checklist perpetuo).
- Descartes a propósito: nada del rango de citas se usa acá.

**La 5ª tarea (condiciones operativas): NO se construye.** Sin superficie en el
producto — queda DECLARADA como deuda candidata (la deposita A en
`DEUDAS_CANONICAS`, territorio 76(a)): *"las políticas de cancelación/anticipo
del prestador no tienen superficie ni motor propio de configuración"*.

---

## 2. M1 — B2 · LA BIENVENIDA DIGITAL (§2.3)

**TESIS:** "Te elegimos — este lugar entiende lo que haces."
**FIRMA:** la devolución del propósito (*"Vos nos dijiste: …"*) cuando el dato
exista; mientras no exista, el reconocimiento del grupo curado de 15.

**Boceto (ruta raíz `/bienvenida-dia1`, fuera de tabs — pantalla completa,
scroll, sin Encabezado, cero íconos):**

```
│  Hola, {nombre}.                        ← Texto titulo (DM Sans light)   │
│                                                                          │
│  Te elegimos para ser uno de los 15 prestadores                          │
│  que dan forma a e-PetPlace en Ecuador.       ← Texto cuerpo             │
│                                                                          │
│  ┊ Tú nos dijiste:                                                       │
│  ┊ "{proposito}"                        ← bloque SOLO con dato (§2.3)    │
│  ┊ Acá te ayudamos a vivirlo todos los días.                             │
│                                                                          │
│  Guillermo                              ← Texto cuerpo                   │
│  founder, e-PetPlace                    ← Texto apoyo                    │
│                                                                          │
│  Los primeros 90 días son tu encuentro con e-PetPlace.                   │
│  Al cumplir el trimestre completamos juntos el momento                   │
│  de graduación.                         ← Texto apoyo (sin énfasis)      │
│                                                                          │
│  [ Entrar a mi espacio ]                ← ÚNICA acción, Boton primario   │
```

**7 preguntas (compacto):** 1· trabajo = carta de una acción (22c: la única
acción viste de botón primario). 2· todo existe: `Texto` + `Boton`; cero
componente nuevo. 3· vecindad: aparece ANTES de las tabs (Redirect del guard
raíz, precedente `/invitacion` S75-B1, L-161 alcanzable); su salida aterriza en
el HOY en modo preparación — la carta invita, el home da el camino. 4· tesis:
cada línea la sirve; cero decoración. 5· dosis: la carta es del PRESTADOR pero
es momento de MARCA-persona → tipografía y aire, sin muro de oficio, sin
gradiente, sin isotipo (Chanel: hasta el isotipo se quitó — es carta, no
splash). 6· estados: sin nombre → "Hola." solo (E5, jamás inventado); sin
propósito → bloque omitido; memorial no aplica (app prestador). 7· Chanel: sin
línea de "saltar" — la única salida es la única acción (la letra lo pide así).

**Gate del primer login:** el guard raíz, tras `ok`, consulta la marca; sin
marca → `Redirect /bienvenida-dia1`; el CTA escribe la marca y `router.replace`
a las tabs. **V1 puente declarado:** AsyncStorage `s79.bienvenida.vista:<userId>`
hasta que llegue el motor del PEDIDO #1 (mismo patrón de puente que D-553).
**Pendiente de founder declarado:** el nombre completo de la firma (hoy
"Guillermo" — el string entra al lote S79 y se corrige en su gate, L-142) y el
literal N=15 (vive en el diccionario, se edita al crecer la cohorte).

**Contrato de datos (M4):** `obtenerMiPerfil().nombre` (primer nombre) ·
`prestadores.proposito` (PEDIDO #2 — hoy siempre ausente) · marca de vista
(PEDIDO #1 — hoy puente local). Nada más entra; nada de lo fetcheado se
descarta.

---

## 3. M1 — B3 · LA FIRMA DE IDENTIDAD EN EL HOME (+ la voz de oficio completa)

**Mudanza, no diseño nuevo:** el bloque de identidad de `cuenta/index.tsx`
(LogoNegocio + nombre + `oficio · ciudad` + pill "Prestador fundador") gana un
segundo consumidor en el HOME. Materiales distintos por superficie (allá muro
del oficio con vidrio; acá papel con `Tarjeta reposo`) — **la anatomía es la
misma**, extraída a componente LOCAL `components/firma-prestador.tsx` (cero
componente en packages/ui: dos consumidores en la MISMA app, superficie propia).

**Dónde:** primera pieza del cuerpo del HOY **en modo preparación** (§1). Con el
espacio preparado, la firma vuelve a vivir solo en Cuenta (el techo del HOY ya
nombra al negocio) — regla de existencia declarada al gate: si el founder la
quiere permanente, es un flag de composición, no rediseño.

**LA VOZ DE OFICIO SE CURA (crítico — la cohorte es de VETS):**
`cuenta/index.tsx:171-203` computa `'ambos'|'paseo'|'grooming'|null` leyendo
SOLO paseo y grooming. Cura: helper local `lib/voz-oficio.ts` — recibe los
CUATRO oficios activos y devuelve la lista unida (`"Paseos · Veterinaria"`);
`oficioAmbos` MUERE (Ley 37, es/en); nacen `oficioVeterinaria` y
`oficioAdiestramiento`. Cuenta suma los 2 fetches de mundo que le faltaban
(vet + adiestramiento) a su carga SECUNDARIA (el header ya pinta antes — D-531
intacta).

---

## 4. M1 — B4 · EL MÓDULO ASPIRACIONAL SOBRIO (§2.5)

**Texto, no banner:** `Texto apoyo` al PIE del HOY (vista 'hoy'), sin Tarjeta,
sin acción, siempre presente (la letra §2.5 lo adapta por Momento, no lo apaga):

> "Eres parte de un grupo curado de 15 prestadores en Ecuador. e-PetPlace no
> busca llenar — busca elegir bien. Gracias por sumarte al comienzo."

(Tuteo neutro L-148 — el "Sos" de la letra era acento de mesa, no de producto.)
**Resolución honesta de "comunidad":** los 15 SON la comunidad (decisión
founder); la sección Comunidad queda oculta por letra §2.6 — cero módulo.

---

## 5. B5 (si la sesión da) · LOS TRES MUDOS — patrón /liquidaciones replicado

El patrón interno que CUMPLE (fila 1 del audit): celda en Negocio cuyo detalle
NOMBRA el disparo + pantalla peldaño 0 que educa. Réplica exacta, cero patrón
nuevo — sección "Se despierta con el uso" al pie de Negocio:

| Celda (Negocio) | detalle (nombra disparo) | Pantalla peldaño 0 |
|---|---|---|
| Casos que te confíen (`caso`) | "Se despierta con el primer caso que un colega te derive." | `/negocio/casos-heredados` — EstadoVacio educativo |
| Estadísticas (`negocio`, stand-in declarado) | "Se despiertan con tus primeras atenciones." | `/negocio/estadisticas` — ídem, "sin compararte con nadie" (§2.7) |
| Reseñas (`refugio`, stand-in declarado) | "Se despierta con tu primera reseña real." | `/negocio/resenas` — ídem |

---

## 6. EN PARALELO — M1 DEL PERFIL RECOMPUESTO (contra el acabado S78)

**TESIS:** "Quién eres para las familias — y desde dónde atiendes."
**FIRMA:** el estado de visibilidad hablando la gramática S78 §15b.0bis:
lo que ESTÁ (visible para las familias) = superficie apoyada con
`elevacion.reposo`; lo que ESPERA (falta dirección / falta oferta) = contorno —
`TarjetaEstado` (local S78; NO se copia: se consume, y si otra superficie la
necesita se coordina su promoción, nota D-535).

**Boceto `/cuenta/perfil` recompuesto:**

```
│ ── Tú ──                                                    │
│  Campo nombre · Campo teléfono · Campo email (read-only)    │
│ ── Tu negocio ──                                            │
│  [LogoNegocio] + acción de logo (intacto S76)               │
│  TarjetaEstado: "Visible para las familias" (apoyada) /     │
│    "Todavía no visible" + POR QUÉ con camino (contorno)     │
│  Campo nombre comercial (read-only) · tipo (read-only)      │
│ ── Dónde atiendes ──            ← NUEVA, glifo 'ubicacion'  │
│  Dirección con Places (contrato lugares.ts VIVO — espejo    │
│    del patrón A4 del cliente: predicciones inline,          │
│    resolver cierra la sesión, la coordenada muere con el    │
│    texto que la parió)                                      │
│  Radio de cobertura: SIN radio declarado → TarjetaEstado    │
│    CONTORNO (qué falta y PARA QUÉ: las familias buscan por  │
│    cercanía) con el 15 como SUGERENCIA RESALTADA en su      │
│    etiqueta ("15 km · sugerido"), NADA preseleccionado —    │
│    solo un toque explícito escribe. Con radio → APOYADA.    │
│    SelectorOpcion 5·10·15·20·30 (TONAL Ley 22);             │
│    NO SliderPrecio (es de plata)                            │
```

Estados: sin dirección → la TarjetaEstado en contorno dice que la dirección
falta Y PARA QUÉ (las familias buscan por cercanía); con dirección → apoyada.
Glifos: `ubicacion` ya existe (pin con huella en la gota) — cero glifo nuevo.
**CORRECCIÓN T3-B1.1 (firma founder):** la versión anterior de este M1 tenía
el radio "default 15 preseleccionado" — así, un prestador que entra a cambiar
su teléfono se llevaba un radio que nunca decidió (el DEFAULT que la letra
mató en el DDL, resucitado en pantalla). El radio ARRANCA SIN DECLARAR;
NULL = "no declaró".
**CORRECCIÓN T3-B1.3:** la nota "Bloqueado por el brief" que vivía acá MURIÓ —
la pregunta está resuelta hace tres tandas: la columna existe, su default vivo
era 5 (no 15), cayó el DEFAULT y cayó el COALESCE.

## 7. EN PARALELO — M1 DE LA VITRINA (contra el acabado S78)

**TESIS:** "Tu negocio decide si la familia elige a la persona — y ve exactamente
qué cambia."
**FIRMA:** la gramática está-adentro/espera aplicada al encendido: vitrina
APAGADA = TarjetaEstado en CONTORNO (espera — con la voz de qué falta si el
gate mecánico está cerrado, vía `puedeEncenderVitrina` ya entregado S78) ·
vitrina ENCENDIDA = superficie APOYADA con las personas ofertables adentro.

**Boceto (sección en `/negocio/equipo`, reemplaza el bloque S78 sin dibujar):**

```
│ ── Tu vitrina ──                                            │
│  [TarjetaEstado contorno]  (apagada)                        │
│    Interruptor (registro oficio) "Mostrar a tu equipo"      │
│    "Las familias reservan con tu negocio; tú asignas."      │
│    (si el gate mecánico cierra: la voz del porqué — el      │
│     aviso a la familia todavía no existe — y el toggle NO   │
│     se dibuja, Ley 23)                                      │
│  [TarjetaEstado apoyada]  (encendida)                       │
│    "Las familias pueden elegir con quién."                  │
│    fila por persona OFERTABLE: avatar/nombre + IconoOficio  │
│    (chips S78) + estado de jornada ("Sin jornada no         │
│     aparece" — la voz de equipo.jornadaSinCuerpo, reusada)  │
```

Estados: <2 ofertables → la sección NO existe (regla S78 intacta) · gate
mecánico cerrado → contorno con voz, sin toggle (Ley 23: no se ofrece lo que
rebota) · fallo de lectura → voz de fallo, jamás "apagada" (Ley 13/D-541).
Glifos: los de `iconos-oficio.tsx` existentes (alerta D-546 vigente y declarada).
**La lámina de píxeles** va con captura al primer gate visual, junto al gate
por ícono del micrófono (montaje ya depositado).

---

## 8. Fuera de S79 (ratificado en el gate): Zeus demo (motor de A; disparo antes
del primer login de la cohorte) · §2.7 hitos · la 5ª tarea (deuda, ver §1).

---

## 9. REPORTE DE CONSTRUCCIÓN (M3/M5 — post-código, mismo doc)

**Construido (typecheck `apps/prestador` VERDE, cero warnings):**
- **B1** `components/prepara-espacio.tsx` + modo preparación en `(tabs)/index.tsx`
  (la voz "Hoy no tienes citas" MUERE en preparación — Chanel del boceto §1;
  checks patrón D-521: fallo de lectura → sin check, jamás falso estado;
  costo declarado: +1 viaje franjas siempre, +1 equipo solo si el módulo
  renderiza).
- **B2** `app/bienvenida-dia1.tsx` + gate en el guard raíz (`bienvenida_pendiente`
  → Redirect; forense `[sesion]` gana la voz "primer login → /bienvenida-dia1")
  + puente `lib/bienvenida.ts` (muere entero cuando A entregue el PEDIDO #1).
  El bloque del propósito construido y APAGADO (PEDIDO #2).
- **B3** `components/firma-prestador.tsx` (2º consumidor del bloque de Cuenta,
  materiales de esta superficie) + `lib/voz-oficio.ts` — **`oficioAmbos` MURIÓ
  (Ley 37, es/en)**; Cuenta suma vet+adiestramiento a su carga secundaria
  (D-531 intacta: el header pinta antes).
- **B4** `agenda.aspiracional` al pie del HOY (texto, no banner).
- **B5** sección "Se despierta con el uso" en Negocio + 3 pantallas peldaño 0
  (`negocio/casos-heredados` · `estadisticas` · `resenas`) — patrón
  /liquidaciones replicado; glifos `negocio` y `refugio` como STAND-IN
  declarados (sin glifo propio en el registry, L-175).

**M3 — capturas (web 420×900, sesión demo, `scripts/captura-s79b-t2.mjs`;
en `scripts/capturas/`):**
- `s79b-t2-bienvenida.png` — **el guard redirigió SOLO** (contexto fresco sin
  marca): la carta con saludo, elección, firma, Día 90 y la única acción.
- `s79b-t2-hoy.png` / `s79b-t2-hoy-pie.png` — el HOY del demo con el
  aspiracional al pie.
- `s79b-t2-negocio-despierta.png` — la sección nueva con sus tres celdas.
- `s79b-t2-cuenta-voz-oficio.png` — la voz curada: **"Paseos · Estética ·
  Adiestramiento · Quito"** (antes: "Paseos y estética" — adiestramiento MUDO).
**LÍMITE DECLARADO de M3:** el modo preparación del HOY NO es capturable con la
cuenta demo (negocio preparado → la regla de existencia lo apaga, comportamiento
correcto). Su captura/gate es EN DISPOSITIVO con una cuenta virgen — o A siembra
una de prueba. No se fabricó el estado (L-139).

**Protocolo del gate de craft (por superficie, para el gate del founder):**
- HOY-preparación — TESIS §1 · FIRMA: la composición que preside el día vacío ·
  CHANEL: murió el vacío que prometía lo inalcanzable · TESTS §15: dosis baja
  (cero acento nuevo), verdad firme intacta, jamás métricas en cero.
- Bienvenida — TESIS §2 · FIRMA: la devolución del propósito (apagada hasta el
  PEDIDO #2; hoy: el reconocimiento del grupo) · CHANEL: sin isotipo, sin
  "saltar" · TESTS: una sola acción, tono carta, cero íconos.
- Cuenta (cura B3) — sin recomposición: solo la voz deja de callar oficios.
- Negocio (B5) — patrón existente replicado, cero patrón nuevo.

**Pendientes de founder declarados (lote de strings S79, L-142):** el nombre
completo de la firma (`dia1.firmaNombre`, hoy "Guillermo") · N=15 en
`dia1.eleccion` y `agenda.aspiracional` · todos los strings nuevos de esta tanda.

**Deudas candidatas (las deposita A, 76(a)):** la 5ª tarea sin superficie ·
el puente AsyncStorage de la bienvenida (muere con PEDIDO #1) · +2 viajes del
modo preparación (familia D-555) · `CeldaNavegacion` sin slot `fin` (el check
se compuso con `Celda`) · glifos faltantes: estadísticas · reseñas · vitrina ·
cuenta comercial (stand-ins declarados).

**WIP de A visto en el árbol y NO tocado (76(f2)):**
`docs/relevamientos/2026-07-27-s79a-REVERSA-remate-documentos.sql` y
`supabase/migrations/20260727160000_s79_remate_documentos.sql` quedan fuera de
los commits de B.
