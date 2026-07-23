# S74-B · CENSO DE SUPUESTOS DE TITULARIDAD — apps/prestador (lectura, cero cura)

> Complemento del censo del resolvedor de A. Método: por COMPORTAMIENTO
> (quién resuelve uid→negocio, quién gatea por serlo, qué voz asume, qué
> alcanza la navegación), contra el código vivo (L-141). "Qué vería un
> empleado activo" = con rol recepción o profesional, HOY, tal cual está.

## H1 · EL HALLAZGO MADRE — la PUERTA RAÍZ no deja entrar a un empleado

**`apps/prestador/src/app/(tabs)/_layout.tsx:63-65`** — el guard raíz de
TODA la app: `obtenerMiPrestador()`; si `sin_prestador` → estado
`sin_rol` con la voz de `sesion.sinRolDetalle` (`es.ts:47`: *"…si es tu
caso y no ves tu negocio, escríbenos"*).

- **Qué asume:** tener sesión válida en esta app ⇔ tener una fila en
  `prestadores` con TU `user_id` ⇔ ser EL titular.
- **Qué vería un empleado activo:** la pantalla de "sin rol prestador".
  **No entra. A nada.** La jornada, el mostrador y la consulta — las
  superficies que recepción y profesional existen para usar — están
  detrás de esta puerta.
- **Consecuencia de censo:** los ~33 supuestos de abajo son hoy
  INALCANZABLES para un empleado — la puerta los tapa. El día que la
  puerta se cure, TODOS quedan expuestos a la vez: el orden de cura es
  puerta ÚLTIMA o arco completo, jamás puerta sola.
- **Cura:** COMPARTIDA — el resolvedor nuevo ("mi negocio O donde
  trabajo", vía `prestador_empleados`) es del censo de A (motor/wrapper);
  la pantalla del guard y su voz son mías. Pedido conjunto.

## H2 · Los callers de los dos resolvedores (34 archivos — el censo por grupo)

Todos comparten la misma anatomía: `obtenerMiPrestador()` /
`obtenerMiCuentaComercial()` (ambos `.eq(user_id, uid)`) y su rama
`!ok` → error de pantalla. Para un empleado (post-cura de H1): **cero
fuga de datos (la RLS protege), todo UX muerta** — cada pantalla caería
a su error. Por grupo, con representante:

| Grupo | Representantes (archivo:línea) | Qué vería el empleado post-H1 | ¿De quién es la cura? |
|---|---|---|---|
| **La jornada (HOY)** — la superficie QUE recepción/profesional necesitan | `(tabs)/index.tsx:504,535` | Error de carga — sin jornada, sin botón de mostrador | Resolvedor (A) + cero cambio mío si el wrapper resuelve por vínculo |
| Mascotas + detalle | `(tabs)/mascotas.tsx:56` · `mascota/[mascotaId].tsx:79` | Error — sin lista, sin recepción v1 (¡la etapa que construimos para ELLA!) | Ídem |
| El path clínico | `veterinaria/consulta/[citaId].tsx:199,209` · `mostrador/atencion.tsx:104` · `mostrador/nueva.tsx:90` · `mostrador/autorizar.tsx:104` · `presupuesto/nuevo.tsx:79,85` · `coordinar/[citaId].tsx:116` · `cita/[citaId].tsx:126` | Error en cada paso | Ídem |
| El Durante/cierre de oficio | `cita/[citaId]/durante.tsx:657` (+ cierres vía sus flujos) | Error | Ídem |
| Los 4 talleres + config | `veterinaria/taller.tsx:241,252` · `paseo/taller.tsx:241,253` · `grooming/taller.tsx:227,236` · `adiestramiento/taller.tsx:248` · `vacaciones.tsx:98` · `veterinaria/procedimientos.tsx:103` · `veterinaria/verificacion.tsx:83` | Error — pero ver H3: NO deberían ser alcanzables para él | Resolvedor (A) **+ gate por rol (mío)** |
| NEGOCIO (plata y gestión) | `(tabs)/negocio.tsx:92,94` · `liquidaciones.tsx:105` · `veterinaria/movimiento.tsx:59` · `cuenta-comercial/index.tsx:56` · `bancarios.tsx:76` | Error — ver H3 | Ídem |
| Cuenta / perfil | `(tabs)/cuenta/index.tsx:87` · `cuenta/perfil.tsx:84,104` | Error en "la sección de la entidad" (que es del NEGOCIO, no de la persona — doble supuesto) | Resolvedor (A) + separar persona/negocio (mío, con letra) |
| Portadas de oficio | `veterinaria/index.tsx:94` · `paseo/index.tsx:95,106` · `grooming/index.tsx:94,104` · `grooming/dia.tsx:71` · `adiestramiento/index.tsx:83,93` · `adiestramiento/clips.tsx:84` | Error | Resolvedor (A) + gate por CHIP del oficio (mío — la regla madre: el acceso viene del chip) |
| **Mi construcción de HOY** | `negocio/equipo.tsx:92` (firma + `prestadorId` para invitar) + la derivación es-dueño del wrapper (`equipo.ts:39-44` — que en rigor es ES-TITULAR) | Voz digna del no-dueño ✓ (ya gateada) pero la FIRMA daría error | Mía — ya declarada en el boceto delta (§0: "la derivación pasa a es-administrador") |

**Descarte declarado:** `mostrador/index.tsx:174` y `nueva.tsx:138` usan
`user_id` DEL CLIENTE buscado — no es supuesto de titularidad.

## H3 · Navegación — lo que un empleado ALCANZARÍA y no debería (y al revés)

- **Los 4 tabs son incondicionales** (`(tabs)/_layout.tsx`): pasada la
  puerta H1, un empleado vería Hoy·Mascotas·**Negocio**·Cuenta. Bajo la
  letra de roles, **NEGOCIO entero es de administrador** (plata, gestión,
  equipo): la celda de cobros, Liquidaciones, El movimiento y la cuenta
  comercial hoy no preguntan rol a nivel pantalla — la RLS del ledger
  protege el DATO, pero la superficie existiría como tab muerta llena de
  errores. **Cura mía (post-letra): el tab o sus celdas gatean por
  `administrador` — por AUSENCIA** (la disciplina de la celda de equipo).
- **Los talleres y vacaciones**: alcanzables por navegación desde las
  portadas de oficio — configurar la oferta es GESTIÓN (administrador),
  no oficio. Mismo tratamiento.
- **Al revés (lo que NO alcanzaría y debería):** NINGUNA superficie de
  la jornada/mostrador/consulta exige hoy algo que un empleado no tenga
  — su bloqueo es solo H1 + los resolvedores. La app "de trabajo" del
  empleado ya existe; está encerrada detrás de la puerta del dueño.
- La celda "Equipo" ya quedó con su decisión declarada (visible a
  operadores, pantalla gateada con voz digna) — compatible con la letra.

## H4 · La voz — dos lecturas, la mesa decide (no curé ninguna)

La tesis de la letra (*"quiero que sientan que es suyo"*) pesa EN CONTRA
de despersonalizar todo — por eso este censo separa:

**(a) Voz posesiva de PLATA/GESTIÓN — riesgo real leída por un
empleado:** `negocio.titulo` "Tu negocio" (`es.ts:352`) · las voces de
liquidaciones/cobros (lo-que-vas-a-cobrar leído por una recepcionista
= dinero que no es suyo) · `cuentaComercial.nuevaDatosVoz` "los datos
con los que factura tu negocio" (`:456`) · `miCuenta.negocioTitulo` "Tu
negocio" + `negocioGuardado` (`:171,187`).

**(b) Voz posesiva de OFICIO — probablemente DESEADA incluso para el
profesional** (la tesis del "es suyo"): "Tu oferta" ×8
(`:354,534,589,590,636,646,753,790`) · "tu consultorio" (`:368`) ·
"Ábrelo y arma tu oferta" (`:357,361`). **Matiz:** para un profesional
que NO configura la oferta, "Editar tu oferta" es (a), no (b) — la
frontera real es QUIÉN puede tocar, no la palabra "tu".

**(c) La voz de la puerta:** `sesion.sinRolDetalle` (`:47`) asume que la
única razón de estar acá es tener negocio — cuando el empleado exista,
esta voz necesita su rama ("tu invitación te espera" / "pedile al dueño
que te invite").

## H5 · El cruce con el veredicto de A

- **Si A responde "es UNA función"** (el resolvedor centralizado): el
  arco mínimo es resolvedor + puerta H1 + los gates por rol de H3 + las
  voces (a)/(c) — los 34 callers se curan gratis si el wrapper resuelve
  por vínculo, PERO los gates de H3 no salen gratis: hoy el gate
  implícito de todo era "la app entera es del titular", y curar el
  resolvedor lo DERRITE. **El resolvedor sin H3 abre NEGOCIO a
  cualquier empleado.**
- **Si A responde "son N copias"**: sumar la tabla H2 grupo por grupo al
  arco — mismo orden (puerta al final).
- En cualquiera de las dos: **la regla madre rige la cura** — las
  portadas/talleres de oficio gatean por CHIP, NEGOCIO por cargo
  administrador, y la jornada/mostrador por el piso. Nada de esto se
  construye sin la firma de la letra de roles.
