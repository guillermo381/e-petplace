# LETRA_ALTA_S79 — El alta del prestador (v1.0)

**Estado: DEPOSITADA (27 Jul 2026, S79-A Tanda 4).** Transpone decisiones
YA TOMADAS por el founder (mandato T4.3) — esta letra las ordena y las
hace exigibles; no las reabre. Mediciones de base: T4.2 (acta
`2026-07-27-s79a-t4-acta.md`) — el CHECK de estados, las policies de
escritura, y el patrón de invitación minado de
`aceptar_invitacion_pendiente_login`.

---

## §0 El contraste con MODELO_PRODUCTO y PORTAL_PRESTADOR (adentro, no de formalidad)

- **"Grupo curado"** (`PORTAL_PRESTADOR` §2.1/§2.5): el alta NO es un
  formulario abierto — es una elección. *"No hay aprobación automática.
  Hay revisión humana."* El registro por invitación es esa letra hecha
  motor.
- **"Me eligieron"** (§2.8): la vara del Día 1 es que el prestador cierre
  el portal sintiendo que fue elegido. Un self-service con validación
  diferida comunica lo contrario. La invitación ES el producto acá.
- **Revelación progresiva** (§2.6) y **"prepará tu espacio"** (§2.4): el
  portal del Día 1 se configura DESDE ADENTRO. Por eso el checklist de
  activación NO pide lo que se prepara adentro (§3 abajo) — pedir
  servicios y horarios antes del portal sería invertir la coreografía
  que el doc maestro firma.
- **El filtro del amor al oficio** (`MODELO_PRODUCTO` §2): la pregunta
  de propósito se hace EN LA APLICACIÓN (§5) — es el filtro, no un campo
  del perfil.

## §1 Registro por INVITACIÓN, no abierto

La puerta de CONTACTO sigue siendo la que existe (`solicitar-acceso`:
WhatsApp al equipo, D-399). El ALTA la ejecuta el ADMIN con
`invitar_prestador` — no hay camino self-service que cree un negocio.
Precondición mecánica: **el invitado ya tiene cuenta de acceso**
(auth.users por su email; si no existe, la RPC rebota
`usuario_no_registrado` — el aspirante se registra primero, el admin
invita después). Una cuenta comercial por humano
(`uq_cuentas_owner_profile`, medido) y un negocio por humano
(`uq_prestadores_user_id`): los rebotes `ya_tiene_cuenta` /
`ya_es_prestador` son espejo de esos índices.

## §2 Las CUATRO FASES

| Fase | Quién | Qué pasa | Motor |
|---|---|---|---|
| **1 · Aplicación** | admin (tras el contacto) | `invitar_prestador` crea cuenta comercial + prestador **`estado='pendiente'`**, atado al mail invitado. Captura el PROPÓSITO y la dirección de envío del kit (§5) | RPC S79 (migración `20260727180000`) |
| **2 · Sala de espera** | el invitado, autenticado, **FUERA del portal** | Completa su SEDE: dirección por Places + radio (whitelist T4.1). La raíz del prestador gatea por `estado` de R1: no-activo → sala de espera, jamás tabs | Medido T4.2b: `prestador_own_profile` NO condiciona por estado (el pendiente edita lo suyo) y el trigger D-389 le VEDA `estado/aprobado_*` (no puede auto-activarse). La sala funciona de motor HOY |
| **3 · Revisión y activación** | admin | `activar_prestador(id, veredicto, motivo)` — el checklist §3 es MECÁNICO: si falta un ítem, rebota tipado. `activo` escribe `aprobado_por/aprobado_en`; `rechazado` exige motivo | RPC S79; primer escritor de transiciones de `estado` del monorepo (medido: ninguna función viva las escribía — eran del admin legado) |
| **4 · Primer login al portal** | el titular | **La ceremonia §2.3 dispara ACÁ, jamás antes**: `registrar_primer_ingreso` estampa SOLO con `estado='activo'` (condición en la RPC — la sala de espera no quema la bienvenida ni aunque se la llame antes de tiempo) | CONTRATO §9.4 (gated) |

Los estados legales (CHECK medido): `pendiente · en_revision · activo ·
suspendido · rechazado`. `en_revision` queda como estado intermedio legal
de la fase 3 (Carlos vive ahí); `suspendido` es gobierno posterior, fuera
de esta letra.

## §3 EL CHECKLIST DE ACTIVACIÓN (corregido por la mesa)

**Lo que el alta EXIGE** — y `activar_prestador` rebota tipado si falta
(patrón "la DB manda": `mascota_no_elegible`,
`verificacion_profesional_pendiente`):

1. **Dirección CON coordenadas** (`direccion` + `lat` + `lon` NOT NULL)
   → rebote `direccion_sin_coordenadas`.
2. **Radio declarado** (`radio_cobertura_km` NOT NULL) → rebote
   `radio_no_declarado`.
3. **Cuenta comercial** — garantizada POR CONSTRUCCIÓN (`invitar` la
   crea; `cuenta_comercial_id` NOT NULL + FK RESTRICT): cero check
   redundante.
4. **Credencial aprobada SI el negocio es de oficio médico** (`tipo IN
   ('clinica_veterinaria','veterinario_independiente')` sin documento
   `titulo_profesional`/`registro_senescyt` aprobado) → rebote
   `verificacion_profesional_pendiente` — el MISMO nombre del trigger
   vivo de S68, que sigue siendo la autoridad al activar cada oferta
   (este check es la copia del gate en el checklist, no su reemplazo).
   **DECLARADO (pregunta de la mesa, T4-post): la señal es
   `prestadores.tipo` — el eje que D-487 declaró muerto.** No hay
   alternativa en la fase 3: leer `prestador_servicios` sería guarda
   muerta (al activar todavía no hay filas — este checklist las excluye
   a propósito). El apoyo en `tipo` es SEGURO porque no es la última
   línea: si el tipo miente (un invitado como grooming que después suma
   oferta vet), **el trigger de S68 lo caza igual al activar esa
   oferta** — el checklist es cortesía temprana; el gate de registro es
   el trigger. `laboratorio` queda FUERA de la lista médica del
   checklist a propósito (su gate real es el mismo trigger, oferta por
   oferta). Si D-487 alguna vez jubila el eje `tipo`, esta condición se
   re-lee en esa misma tanda — cruce declarado en ambas direcciones.

**El punto de la RPC: que "un prestador activo pero no ofertable por
geografía" sea MECÁNICAMENTE IMPOSIBLE** — no una regla que haya que
recordar. Borde declarado: post-activación, el titular que edita su
dirección a mano mata sus coordenadas (§2.2 de LETRA_PERFIL) y vuelve
invisible por geografía hasta re-resolver — eso es la firma rigiendo, no
un bug; el aviso de superficie es de B.

**Lo que el alta NO exige — declarado con su porqué:** servicios,
precios, horarios y equipo. Esos se configuran DENTRO del portal
("prepará tu espacio", §2.4 del doc maestro) — **un checklist que
pidiera lo que la sala de espera no puede dar sería una puerta que nunca
abre.** Consecuencia declarada y CORRECTA: un prestador recién activado
es invisible hasta configurar su oferta. Ese no es el problema que el
freno de T3.2 detectó — el problema era la invisibilidad SIN CAMINO de
arreglo; la activación garantiza dirección y radio, y el portal da el
camino del resto.

## §4 BANCARIOS: requisito de COBRO, no de activación

Declarado explícito (decisión founder T4): los datos bancarios NO son
requisito de activación del prestador — son requisito de COBRO. El motor
YA dice exactamente esa frase (medido, CHECK
`chk_datos_bancarios_validos`): la cuenta comercial en
`pendiente_validacion` vive con `datos_bancarios = {}`; recién el pase a
`activa` exige las 7 claves — y `activa` es la condición de cobro
(Decisión Q del FINANCIERO: rol activo no basta, cuenta ACTIVA). Se
piden con el primer cobro (arco de pagos). La activación del PRESTADOR
(esta letra) y la activación de la CUENTA (§7.11 del financiero) son dos
actos distintos y así quedan.

## §5 El propósito y la dirección de envío entran por la APLICACIÓN

`PORTAL_PRESTADOR` §2.1 pide la pregunta de propósito EN LA APLICACIÓN —
ahí se captura (hoy: la conversación del founder; mañana: el formulario
de aplicación), junto con la dirección de envío del kit (§2.2). Su
persistencia: las columnas nacen con el CONTRATO de LETRA_PERFIL (§3);
**cuando el contrato aplique (T4.6), `invitar_prestador` gana
`p_proposito` y `p_direccion_envio` en la MISMA tanda** (DROP+CREATE,
L-119 — declarado acá para que no se pierda). La cura de privilegios por
columna (pieza 5 del CONTRATO) los cubre desde el nacimiento: ninguno
viaja por PostgREST; el propósito vuelve al titular por
`registrar_primer_ingreso` (la bienvenida), la dirección de envío es
solo del admin.

## §6 EL PORTAL ADMIN NO NACE

Van **dos RPCs con gate `is_admin()`** (`invitar_prestador` ·
`activar_prestador`), operadas como `revisar_documento_prestador` (A3):
por SQL con el JWT del founder, sin pantalla. **Disparo escrito para el
portal admin (verbatim del founder): la TERCERA operación admin, o el
día que las opere alguien que no sea el founder.** Hasta entonces, cada
RPC nueva con gate admin se registra contra este disparo.

---

## Historial

- **v1.0 (27 Jul 2026, S79-A Tanda 4):** depositada sobre las decisiones
  del founder (mandato T4.3) + las mediciones T4.2. El motor (las dos
  RPCs) nace en la misma tanda, migración `20260727180000`, con fixture
  y reversa.
