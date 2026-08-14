# S97-C · M1 — BOCETO: EL WIZARD DE ALTA DEL PRESTADOR

**Estado:** boceto (L-143 — toda pantalla nueva del prestador nace contra uno).
**No construido.** Espera `docs/LA_CASA_DEL_PRESTADOR.md` en origin + las dos
decisiones de mesa del §6.

---

## Declaración de craft (protocolo obligatorio)

- **TESIS:** *«Tu negocio ya existe. Esto es abrirle la casa.»* — el alta no
  es un trámite que hay que aprobar: es la casa que se enciende cuarto por
  cuarto, y el prestador decide cuántos enciende hoy.
- **FIRMA:** **cada paso se puede saltar, y saltarlo no castiga** — la línea
  amable dice dónde vive eso para después. El wizard no retiene a nadie.
- **CHANEL (lo que se quita):** cero barra de progreso porcentual · cero
  «paso 3 de 4» como número desnudo · cero checklist con tildes · cero
  felicitación por paso. **La celebración es UNA y va al final** (el destape).
- **ESTADOS:** cargando · error · listo · **salteado** (estado propio, no un
  vacío).

## La ley que ordena todo: EL CONTADOR (S91, rige acá por §8.6bis)

> Narrativa **más un paso**, jamás checklist. El número **tiene que poder
> llegar a cero**. **Lo que depende de e-PetPlace NO entra al contador.**

⇒ **El wizard cuenta cuatro pasos porque los cuatro los resuelve él.** La
revisión nuestra (`en revisión → activa`) **queda afuera del contador** y se
dice en otra voz: *él llega a cero; después esperamos nosotros.* Son dos
cosas y se dicen distinto.

## Números (medidos, no adjetivados)

| pieza | medida |
|---|---|
| `registro.tsx` | 141 líneas — la cuenta nace vacía, un paso |
| `sala-espera.tsx` | 268 líneas — **ya trae el contador** («qué falta de tu parte, con camino») |
| `bienvenida-dia1.tsx` | 214 líneas — carta de 30-45 s, UNA acción |
| `cuenta-comercial/nueva.tsx` | 319 líneas — el orden es ley: fiscal + país → detección → datos → crear |
| `ventas/configuracion.tsx` | 819 líneas — **la dueña de cortes, capacidad, radio y familias** |
| escala del radio | 5–50 km de a 5, default 15 (`lib/escala-radio.ts`) |

**No se duplica nada: se reorganiza.** Los cuatro huesos existen y quedan;
el wizard es la puerta de primera vez sobre ellos.

---

## La composición — cuatro pasos

### [1] TU NEGOCIO — nombre e identidad
Nombre + logo (o monograma, `LogoNegocio` ya existe). Motor:
`actualizarNombreCuentaComercial` (owner; tercero rebota). **Único paso que
no se saltea**: sin nombre el destape no tiene qué mostrar y la casa no tiene
título.

### [2] QUÉ OFRECÉS — las dos naturalezas
Dos bloques, **«Tu tienda»** y **«Tus servicios»**, y por servicio el toggle
**«atiendo este servicio en mi local»**.

> 🔴 **EL TOGGLE NO ES LIBRE — medido en la fuente.** `atiende_local` y
> `atiende_domicilio` viven en `prestador_servicios` (tabla **común** a los
> cuatro oficios) con **`CHECK (atiende_local OR atiende_domicilio)`**.
> Apagar los dos **rebota en la base**. La pantalla lo honra: el segundo
> toggle no se puede apagar y **dice por qué**, en vez de dejar mandar un
> guardado que la base va a rechazar. *Una puerta no ofrece lo que va a
> rechazar (Ley 23).*

**Cierra con enlace a la configuración** (§3 de la mesa: el wizard ACTIVA, la
configuración CONFIGURA). Cortes, capacidad, radio y familias **no entran acá**.

### [3] TUS DOCUMENTOS
Contra `cuenta_comercial_documentos` (S97-A). Motor completo:
`listarDocumentosCuenta` · `registrarDocumentoCuenta`. Bucket privado
`cuenta-documentos`. **La revisión es nuestra ⇒ fuera del contador**: el paso
se completa al SUBIR, no al aprobarse.

### [4] TU EQUIPO
Invitaciones. **El único rol nuevo hoy es repartidor** — ver freno ⑥.2.

### [CIERRE] EL DESTAPE
Pieza de B (contrato ya enviado:
`2026-08-13-s97c-pedido-a-B-destape-del-wizard.md`). Entradas: nombre, logo,
tabs habilitadas. Banda 520 (N10, celebración).

## El salteo — la línea amable

Al saltar, **una línea que dice dónde vive eso**, capturando la idea y no el
literal. Canónica del paso ②:

> *«La configuración de tus servicios es lo que nos deja traerte los clientes
> que tu negocio necesita — la encontrás cuando quieras en Cuenta › Tu
> negocio.»*

**Regla:** la línea nombra **el beneficio y el lugar**, jamás regaña ni
promete que "podés hacerlo después" sin decir dónde.

## Estados declarados

| estado | qué se ve |
|---|---|
| cargando | esqueleto del paso, cero spinner genérico |
| error | el fallo dice que es fallo (Ley 13) — jamás disfrazado de vacío ni de "falta" |
| listo | el paso con su dato |
| **salteado** | el paso queda **abierto y nombrado** en el resumen, con su línea amable. No es un error ni un pendiente rojo |
| en revisión | chip chico arriba que abre su explicación (§8.6bis ⑥) — **fuera del contador** |

## El Norte, aplicado

N1 tres tamaños por paso · N2 todo múltiplo de 8, 32 entre secciones · N3 cero
separadores (el espacio y el título separan) · N4 radio de token · **N5 un
acento: el CTA del paso** (los toggles van neutros) · N6 entrada 45/300 +
`usePresionado` · N7 logo 48–56 · N8 blancos de 44 · N9 `EstadoVacio` con voz
· N10 solo el destape usa la banda de 520.

---

## ⑥ LOS DOS FRENOS — de mesa, no míos

### ⑥.1 ✅ RESUELTO POR FIRMA (mesa, 13-ago) — **el paso ② PROPONE**
El freno era real y medido: `otorgar_rol_vendedor` es **admin-only por
firma**, con su porqué en el cuerpo: *«si el titular pudiera dárselo,
cualquiera se auto-habilitaría a vender sin que nadie revise — §4.2: el
vendedor PROPONE, e-PetPlace PUBLICA»*.

**Firma de mesa:** el paso ② **propone, no otorga**. El estado se muestra con
**el chip del patrón ⑥** (`en revisión → activa`, tocable, abre su
explicación) y **la propuesta NO entra al contador** — él llega a cero,
después esperamos nosotros.

> ⏳ **«Tu tienda» NO se cablea todavía** (orden de mesa): puede que enrute a
> la solicitud de cuenta comercial que YA existe (`cuenta-comercial/nueva`)
> en vez de a una puerta nueva. **Espera la medición de A.**
>
> ✅ **«Tus servicios» arranca ya** — su motor está completo y medido.

### ⑥.2 🔴 El repartidor: dos firmas de §8.6bis se contradicen entre sí
- **§8.6bis ⑤:** *«entra como chip del EQUIPO QUE YA EXISTE, no como padrón
  propio… Un equipo, un lugar.»*
- **Cabecera de §8.6bis:** *«la configuración cuelga de la CUENTA COMERCIAL,
  no del prestador — fabricarle una fila vacía contamina el motor de
  servicios.»*

**El equipo que ya existe (`prestador_empleados`) cuelga del prestador.** Un
vendedor puro no tiene fila de prestador ⇒ **las dos mitades no pueden
cumplirse a la vez.** S96 construyó `repartidores` (tabla propia: nombre,
documento, teléfono, `user_id`, UNIQUE por cuenta+documento) y declaró
*«NO es una fila de `cuenta_roles`»* — **cierto, pero contesta otra
objeción**: ⑤ no pedía `cuenta_roles`, pedía `prestador_empleados`.

**Lo que sigue vivo es el costo que ⑤ predijo:** una veterinaria que además
reparte carga a la misma persona **dos veces, con dos altas y dos bajas**
(`prestador_empleados` + `repartidores`). Y `RolEquipo` no tiene
`'repartidor'` — medido en `equipo.ts`.

**No lo resuelvo yo.** El paso ④ se cablea cuando la mesa diga cuál de las dos
mitades manda.
