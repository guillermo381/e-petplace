# S80 · ACTA DE CIERRE (28 Jul 2026) — EL ARCO DE EQUIPO CERRADO Y EL REDISEÑO CON LEY

> Transposición al canon por L-163. Sesiones paralelas regla 76
> (A: DB + packages/api + docs + cliente + EL PUSH regla 79 · B:
> prestador + packages/ui designada). **Precondición del cierre
> CUMPLIDA y medida:** B declaró el crash del durante RESUELTO
> (`e39366c` el guard vivo + `b29cdb2` el flip con build verificada
> POR MANIFEST e instalada sobre el APK roto).

## LA TESIS DE S80, cumplida en dos mitades

**(a) El arco de equipo cerró entero** — la persona se crea la cuenta
sola, el titular la invita, el handshake la activa, entra y opera.
**(b) El rediseño arrancó con vara nombrada y ley depositada**, no con
"no me enamora".

## EL ARCO DE EQUIPO

- **D-509 ① — la pantalla de registro en la app del prestador.
  CONSTRUIDA y GATE PASADO ENTERO en dispositivo** (6 pasos: registro
  desde /login → "tu cuenta está lista" → degradación honesta al matar
  la app → invitación que pasa la defensa (b) → /invitacion → tabs con
  el piso recepcion). El paso 3 cerró en segunda vuelta: la voz llegaba
  cortada por un clamp de 3 líneas en EstadoVacio.
- **D-514 — CERRADA.** Estaba 🔴 diciendo "el handshake NO OCURRE POR
  NINGUNA VÍA" y llevaba construida desde S75. Cerrada por DOS vías
  independientes: **el ledger** (7 invitaciones 'aceptada' con un único
  productor de `activado_en`) y **el literal** (/invitacion llama al
  RPC y lee `data.ok`, con los 3 rebotes tipificados).
- **D-512 — propuesta de CIERRE.** Su premisa ("la app asume una
  persona = su negocio") quedó FALSADA: el founder caminó los CUATRO
  pasos con su dedo en un día. Y su declaración más dura — "la
  degradación por rol es INVERIFICABLE POR CUALQUIERA, INCLUIDO EL
  FOUNDER" — dejó de ser cierta. **NO cierra a sus hijas: D-513, D-570,
  D-571 siguen su camino.**
- **D-570 — CERRADA por palabra del founder en dispositivo.** Con la
  precisión: se verificó el OFERENTE (el módulo ya no ofrece); el
  rebote silencioso por URL forzada no se caminó y viaja con D-571.
- **D-571 — CLASE ABIERTA, curada en 2 sitios.**
- **EL PASO 11 — VERDE.** Con Los Shyris configurada, el módulo no
  aparece. ⇒ **EL GATE DEL ALTA DE S79 SALE DE PARCIAL Y SE DECLARA
  PASADO ENTERO, cuatro sesiones después** (regla 77 honrada: quedó
  PARCIAL hasta que el último paso corrió). Era el último ítem abierto
  del brief S79.
- **Migración `20260728100000`** — REVOKE anon sobre las 2 RPCs de
  invitación (regla 78 contestada con medición contra el bundle vivo;
  reversa antes de aplicar; sonda proacl verde).

## LA PLATA — FIRMA DEL FOUNDER, DIFERIDA AL SOFT LAUNCH

**LA REGLA, verbatim del founder:** *"El prestador cobra la capacidad
que comprometió. Lo que el cliente no usa, lo pierde el cliente y lo
cobra el prestador. Lo único que le corta el cobro al prestador es su
propio incumplimiento."*

- Coincide ya con P14(b), P16(c) y P16(d) — **las generaliza**.
- **ENMIENDA a P16(e) + su porqué + Decisión T + regla 7.15: lo vencido
  pasa de ingreso de plataforma a PAYOUT DEL PRESTADOR. DIFERIDA AL
  SOFT LAUNCH por decisión del founder** (disparo escrito en POLITICAS
  y FINANCIERO).
- **EL PORQUÉ QUE VA AL CANON (el argumento del descuento):** paquete
  de 10 a $80 (suelto $10), la familia usa 6 → el paseador devenga $48,
  MENOS que los $60 que habría cobrado sin paquete, y la plataforma se
  queda $32. **El paseador financió el descuento y la plataforma cobró
  la flexibilidad que él descontó.**
- **EL ACOPLAMIENTO MEDIDO:** `vencer_paquetes_salidas` existe y NADIE
  LA CORRE (4 jobs en `cron.job`, ninguno la llama; cero
  `bono_breakage` en toda la historia; el aviso de P16(e) está codeado
  ADENTRO y nunca se envió). ⇒ **encender el cron ES encender el
  breakage: el reloj y la enmienda son el MISMO ACTO.**
- **EL AVISO, firmado:** periódico y sereno, saldo + fecha, jamás
  countdown. Nombra SIEMPRE la renovación (P16(e) rollover) — un aviso
  que anuncia la pérdida sin ofrecer el camino es una amenaza. **Su
  cadencia es de ESTADO, no de calendario: saldo cero, cero mensajes.**
- **MODELO_NOTIFICACIONES §3 — enmienda a la firma:** nace la categoría
  **`saldo_pagado`** (utility, NO apagable en existencia, sí en canal).
  El porqué de la columna se amplía: *"su ausencia daña a la mascota, a
  la cuenta O AL DINERO YA PAGADO"*. Jamás viaja con `comercial`.
- **LA 5ª TAREA (condiciones operativas: cancelación + anticipo) —
  APROBADA POR EL FOUNDER, LETRA SIN ESCRIBIR.** Catálogo CERRADO de
  2-3 políticas que escribe la casa (jamás números libres) · SNAPSHOT
  de la reserva (precedente LETRA_TURNOS §4: las citas pactadas
  conservan lo que regía) · **la falla del prestador NUNCA
  configurable**. Dependencia declarada: **sin CAUSA-CON-ACTOR (D-567)
  el catálogo es una perilla que el motor no puede honrar.** Cierra
  P22 de paso.
- **LA SEDIMENTACIÓN v0.1 — PROPUESTA, 3 opciones a la firma** ((a)
  registro · (b) audiencia con su frontera anti-métrica · (c) mostrar).
  La medición corrigió a la mesa: el sedimento nace al INICIAR, no al
  cerrar; el cliente lo ve en vivo (mapa, cronómetro, novedades, fotos)
  y el prestador ve "parte enviado" y vuelve a una lista.

## LAS LEYES DE CRAFT (DIRECCION_ARTE v1.1 → v1.3)

§8.1-8.6 dosis de la rampa · §9.1-9.5 composición y forma · §9.6 el
origen y el destino · **Ley 10 la taxonomía y la ley del reparto**
(FIRMADA: SALUD·CUIDADO·COMUNIDAD·CONSUMO + MARCA/AFECTO reservada; el
canto dice categoría —cerrado, tope 5—, el glifo dice servicio
—abierto—) · §4bis la nariz en la luz de la esquina (CANDIDATA, 4
veredictos de gate). **Movimiento:** entrada 45/300 firmada · brillo de
placa 6 s firmado · presión RETIRADA (rige usePresionado) · empuje
−16% y overshoot 280 ms CANDIDATAS con casa (§5.2 y Ley 6).
**DIRECTIVA_CRAFT_CLIENTE depositada con §0bis LA RECONCILIACIÓN** y
sus dos huecos declarados (ACTA_DISENO_CRAFT no existe · lo medido es
pre-S79). A7 vacía sobre número reservado. **D-573 CERRADA por (a) en
el mismo acto que la taxonomía.**

## EL REDISEÑO CONSTRUIDO

Canto sólido por CATEGORÍA en el borde del portador del radio (la
mordida de 7-16px muerta) · una tarjeta = una cita en las 4 listas del
HOY · la línea viajera del filtro con su frontera de Ley 6 (tabs ≠
filtros) · transición direccional de pantalla entera · esqueleto en
sala-espera · detalles en 2 ondas · **FilaCita PROMOVIDA a packages/ui
como primer COMPONENTE DE DOMINIO** (el canto adentro, cero prop de
color: ninguna pantalla puede romper la ley).

**EL ELEMENTO COMPARTIDO, RETIRADO: no por malo — por costo** (26
pantallas, API experimental REA4 con interpolación de transform
declarada incompleta en su fuente) **contra retorno medido CERO. El M2
de B7 se conserva: su medición es lo que fundamenta la decisión.**

## LA VELOCIDAD

`uidActual()` sobre getSession — 29 sitios en 10 wrappers, cero red.
**EL FIXTURE FUE DISCRIMINADOR: 7/7 FALLOS con el código viejo.** Con
`getUser()`, una revocación remota devolvía `sin_sesion` — **D-571/
L-178 VIVAS en 10 wrappers y nadie las había visto. El fixture no
validó la cura: descubrió el bug que la cura arregla de paso.** 14/14
verde post. D-538 muere de raíz en esta capa.

## EL CRASH (el hallazgo más grave del trimestre)

El APK 1.0.3 (build local de S78) salió **SIN
`com.google.android.geo.API_KEY`**. Montar un MapView lo mata.
Confirmado por logcat: *"FATAL EXCEPTION: androidmapsapi-ula-1 ·
IllegalStateException: API key not found"* en `MapView.onCreate`.
**PREEXISTENTE DESDE S78, invisible porque en tres sesiones nadie entró
al durante** — todos los gates fueron vet, perfil, alta, registro,
craft. Dos muertes en el log: FabricUIManager falla al insertar la
vista, y ~2 s después el hilo NATIVO `androidmapsapi-ula-1` lanza el
fatal fuera del alcance de React. **Por eso PantallaCaida no aparece.**
**RESUELTO EN S80-B19** (el guard vivo + build nueva verificada POR
MANIFEST + APK reinstalado): un secret faltante ahora cuesta el mapa,
jamás la app.

**ADDENDUM DEL CIERRE (founder, en dispositivo):**

- **El guard FUNCIONA: la pantalla abre, la app no muere.** ⚠️ **PERO
  SU VOZ MIENTE**: dice "el mapa no está disponible en esa versión de
  Android" y culpa al teléfono del prestador — la causa es el APK sin
  key. **Cura de una línea, y va con el build.**
  *(ENMIENDA S81-A, caso L-166 contra la mesa: la cita entre comillas
  es PARÁFRASIS ERRADA del acta — el string JAMÁS dijo "Android".
  `git log -S'versión de Android'` = cero; el literal de e39366c era
  "El mapa no está disponible en esta versión de la app. El recorrido
  se sigue grabando igual." El founder citó bien; el acta depositó la
  paráfrasis como cita sin releer la fuente. La reescritura igual
  corrió — B `30b806a`, gate pendiente.)*
- **EL CENSO DEL CLIENTE, CONTESTADO EN CAMPO:** el cliente vio el
  paseo completo con sus puntos ⇒ **su APK SÍ tiene la key. El agujero
  es SOLO del prestador** (build local S78). D-575 se acota a eso.
- **ESTADO DE LA CURA: el guard es PUENTE.** La cura es la build nativa
  con la key verificada en el manifest — **pendiente, primer acto de
  S81 o antes si B puede.**
- **DEUDA NUEVA 🔴 RESERVADA SIN LETRA — EL TRACK NO COINCIDE CON EL
  RECORRIDO REAL (D-578):** el addendum de mesa la ordenó "con la letra
  de arriba, entera, y su discriminador de una query" — **y esa letra
  no viajó en el mensaje (corchete vacío, L-142)**. Número reservado
  por el protocolo D-434/D-435; nace cuando su literal llegue.

## LOS ERRORES DE LA MESA — sin maquillar (precedente S79)

1. Citó D-514 desde canon viejo y construyó un diagnóstico entero sobre
   una premisa no medida — el mismo error que le señaló al brief S79.
2. Trató la DIRECTIVA_CRAFT como fuente durante seis mensajes sin estar
   depositada (A lo destapó con grep: A4, L-c, Bloque F, L-b, A3
   huérfanas).
3. Inventó precisión: 0.972 no era calibración, era 0.97 con dos
   decimales. Casi nace una tercera receta de primitiva.
4. Dio una orden demasiado ancha (A7) que barrió tres ítems sanos y
   creó dos huérfanos en el bloque que existía para eliminarlos.
5. Preguntó CUATRO veces al founder algo que era MEDICIÓN, no firma
   (¿la familia ve el paseo en vivo?).
6. Diagnosticó el canto mal dos veces a distancia; lo resolvió una
   captura.
7. Especificó el canto como elemento compartido: semánticamente
   correcto, perceptualmente equivocado. El founder había pedido
   pantallas conectadas y la mesa devolvió otra cosa.
8. Desbalanceó las pistas: siete bloques a A y uno a B mientras el
   norte declarado era rediseñar pantallas. B quedó frenado esperando
   firmas que ya existían en la mesa y nunca llegaron a su terminal.
9. Usó L-f como argumento sin que rija (choca con Ley 21 firmada). La
   conclusión se sostenía por L-b.

**⇒ RAÍZ COMÚN de 1, 2 y 9: tratar como fuente lo que no está
depositado. ⇒ RAÍZ COMÚN de 3, 6, 7 y 9: prescribir craft sin ver el
componente.**

## OPERATIVO

- **1 migración** aplicada y registrada (`20260728100000`, ACL de
  invitaciones; 76(g) declarada NO RIGE — DDL de grants; reversa
  escrita ANTES; sonda proacl verde).
- **Fixture nuevo `verify-uid-revocacion-s80.mjs`**: 3 fases, corrido
  ROJO antes (7/7) y VERDE después (14/14) — el discriminador es su
  razón de ser.
- **CONTRATO v1.14** (regla 79: el push es de la sesión A) ·
  **DIRECCION_ARTE v1.3** · **DIRECTIVA_CRAFT_CLIENTE** depositada ·
  **LETRA_SEDIMENTACION v0.1** propuesta.
- Gate WCAG corrido en vivo: **178 pares / 0 fallos** (terracotta
  verificada antes de firmar la taxonomía).
- Typechecks api/prestador/cliente/ui verdes en cada tanda. Los
  commits de A y B en sus actas; **pushes de rutina regla 79 corridos
  durante toda la sesión** (el primer día de la regla — con la nota de
  que se rompió dos veces ANTES de la enmienda, y eso la parió).
- Deudas nuevas del cierre: **D-574 🔴 · D-575 🟠 · D-576 🟠 · D-577 ⚪**
  (en DEUDAS_CANONICAS). Lecciones **L-181 → L-190** depositadas.
- El brief de S81: `docs/relevamientos/2026-07-28-brief-s81.md`.
