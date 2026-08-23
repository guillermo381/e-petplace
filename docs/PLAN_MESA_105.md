# PLAN_MESA_105.md — e-PetPlace · «la cuenta, la identidad y la voz que sale por correo»

> **Mesa:** 105 (numeración del founder) · **Escrito:** 22-ago-2026, al cierre de
> la mesa 104 · **Autor:** la mesa.
> **Precedencia:** el repo y su bitácora ganan SIEMPRE sobre este plan. La sesión
> nueva toma **el número que la bitácora asigne**; S103 no se renumera.
> **Rige entero:** `CLAUDE.md` · `CONTRATO_TRABAJO` · `METODO_TRES_PISTAS` ·
> `POLITICAS` (P1 · P5 · P15 · P21 · P23) · `MODELO_NOTIFICACIONES` ·
> `DEFINICION_SOFTLAUNCH` §3.5 · los traspasos de las cuatro pistas de S103 ·
> y el cuerpo de leyes L-330 → L-407 que S103 dejó pagado.

---

## §0 · LA REGLA QUE GOBIERNA ESTA MESA

S103 dejó doce leyes de instrumento y una práctica nueva. Se **usan**, no se
re-descubren. Las cinco que más van a morder en este frente:

- **Un traspaso es un mapa de dónde retomar, no una fuente de datos vivos** — y
  toda medición **declara contra qué objeto se midió** (`main` local,
  `origin/main` y `ls-remote` son tres preguntas distintas).
- **El inventario de circuito lo corre OTRA pista**, y lleva **dos** preguntas:
  *«¿quién la llama?»* y *«¿corrió alguna vez?»*. Ninguna sola alcanza.
- **Puerta sin motor**: una prop, una promesa o un campo que se acepta y no
  hace nada **typechequea, pasa el guard, y el llamador cree que pidió algo.**
- **El modo de falla decide la herramienta:** si el que tiene que frenar es el
  compilador → regla; si es un lector → comentario.
- **Lo que dejó de ser cierto no se nota, porque nunca fue falso al escribirse.**

## §1 · TRES PRECONDICIONES DE MEDICIÓN — antes de construir nada

Las tres son afirmaciones en conflicto. Se miden en el primer turno.

1. 🔴 **¿Las push funcionan o no?** El founder declara que **le llegaban en las
   dos apps**; el relevamiento previo declara `expo-notifications` inerte y cero
   tokens. **Los dos no pueden ser ciertos.** Se mide: tokens registrados en la
   base, quién los escribe, qué proyecto de Firebase, y si hay envío vivo.
   *Si llegaban, lo roto es corto y hay que encontrar qué se cortó; si no
   llegaban, es un frente y no una tanda.* **Nada del frente de avisos se
   dimensiona antes de esta medición.**
2. 🔴 **¿El dominio de correo está autenticado?** SPF, DKIM y DMARC en
   `epetplace.com`. **Sin esto no hay plantilla que salve nada** — Gmail manda
   a spam y el trabajo de las plantillas se pierde entero. Se mide primero, no
   al final.
3. 🔴 **¿`double_confirm_changes` está encendido en PRODUCCIÓN?** El
   `config.toml` es del entorno local y **no prueba nada** (el canon ya se cobró
   esa confusión tres veces). Se mira el dashboard, no el archivo.

## §2 · LAS PISTAS — cuántas y por qué

**Recomendación: CUATRO, con una quinta que abre solo si §1.1 dice que las push
son un frente.** El techo real no es el número de pistas: es el **aparato
único** (los gates serializan sin importar cuántas pistas haya) y **A como
único que mergea y publica** — cada pista suma cola sobre ella.

| pista | territorio | frente |
|---|---|---|
| **A** (conductora) | `main` · DB · `packages/api` · `packages/domain` · `docs/` · merge, push y OTA | **El motor de la cuenta**: eliminar cuenta (P15) · invitación familiar · **la copia `profiles.email`** · cambiar correo · exportar datos · wrappers |
| **B** | `packages/ui` · tokens · lint y **todos los jueces** | Las piezas que las pantallas de cuenta necesiten · el juez que vigile que **ninguna promesa de cuenta apunte a una superficie inexistente** |
| **C** | `apps/cliente` · `apps/prestador` | **Las superficies de cuenta en las dos apps**: login y proveedores · eliminar cuenta · invitar familia · sesiones · exportar |
| **D** | edge functions · Resend · plantillas de Auth · infraestructura de envío | **Los correos**: dominio autenticado · inventario de plantillas · idioma · remitentes · **y la medición de push (§1.1)** |
| **E** *(condicional)* | `apps/*` notificaciones + edge de envío | **Solo si §1.1 dice frente.** Si es corto, lo toma D. |

**Por qué D toma correos y no otra:** es infraestructura de envío y edge
functions, que es su territorio natural, **y queda libre hasta el lunes** —
DeUna no la ocupa hasta que llegue el `pointOfSale`.

**Por qué NO se parte C en cliente/prestador:** el lado prestador de este frente
es el más liviano (ya tiene cambiar clave y `/recuperar`), y su pieza grande
—**el prestador que se va**— es **letra de mesa, no código**. Partirla sumaría
cola de contratos sobre A sin ganar paralelismo real.

**El freno del aparato:** con cuatro pistas y **un solo teléfono**, los gates se
piden a A y **no se toman**. Regla vigente de S103, escrita porque ya se rompió
un gate una vez.

## §3 · LOS FRENTES, EN ORDEN

### Frente 1 — LA COPIA QUE MIENTE *(primero, y bloquea al 3)*

🔴 `profiles.email` es una copia que **gana** sobre `auth.users.email`
(`miPerfil.ts:37` lee la tabla primero) **y nadie la escribe desde la app**.
*Hoy no diverge porque nada la puede cambiar.* **Firma del founder ya dada: la
copia se resuelve ANTES que la pantalla de cambiar correo.** Construir la
superficie sobre dos fuentes de verdad produce el defecto que solo aparece
**después** de que alguien real cambió su correo — y para entonces hay una
persona confundida sobre cuál es su cuenta.

### Frente 2 — IDENTIDAD Y ENTRADA

- **Censo de proveedores**: ¿Google está vivo? ¿Apple existe? **Apple es
  requisito duro de la App Store si hay Google** — si falta, es bloqueante de
  publicación, no de piloto.
- El login del cliente ya ganó su salida a `/recuperar` en S103. Verificar la
  simetría en prestador.
- **La familia solo-Google**: ya puede recuperar; verificar que pueda **crearse**
  una clave.
- **Sesiones activas y cerrar sesión en todos lados** — pieza del ciclo que
  suele olvidarse y que la política va a tener que prometer.

### Frente 3 — CERRAR CUENTA *(la pieza grande)*

**P15 rige y ya está firmada:** *la cuenta se vuelve **inalcanzable**, no se
destruye el registro; la identidad se anonimiza donde la ley lo permite; lo que
la ley obliga a conservar se conserva **desligado de la persona**; se le dice
exactamente eso **antes** de confirmar; y **se le ofrece su copia antes de
irse**.*

- **La medición que fija la forma, ya hecha:** 62 FKs a `auth.users`, **24
  bloqueantes** (pagos, pedidos, compras) y 21 en CASCADE (consentimientos,
  citas, bonos). ⇒ **cerrar cuenta no puede ser un borrado**, y pasar las 24 a
  CASCADE se llevaría los consentimientos — *el registro de que alguien aceptó
  algo es justamente el que hay que conservar para demostrar qué se le
  prometió.* Coherente con P23 y la regla 7.8.
- **Exportar datos** entra acá, no después: sin la copia, P15 queda incompleta y
  la política promete algo que el sistema no hace.
- 🔴 **El prestador que se va NO se construye esta mesa hasta tener su letra:**
  17 citas futuras de terceros **que ya pagaron** · 27 empleados con acceso · 36
  eventos sin liquidar. **Tres obstáculos de naturaleza distinta.** La letra la
  escribe la mesa; el censo ya está hecho y solo confirma que se siguen
  debiendo.

### Frente 4 — INVITAR A LA FAMILIA

> 🔴 **PRIMER ACTO DE LA MESA, ANTES DE CUALQUIER OTRA COSA:** el founder
> declara que **el documento completo de familia ya se escribió hace meses**.
> **Se releva antes de decidir nada** — nombre, versión, qué resolvió y qué dejó
> abierto, y qué de eso el sistema ya honra. *Un documento que existe y no se
> lee produce una segunda decisión que contradice a la primera sin que nadie lo
> note.* Contrastar contra **P1** (co-dueños y doble confirmación), **P2**
> (transferencia entre familias), **P5** (menores) y `BIO_EXPEDIENTE`.
> **Nada de este frente se construye antes de ese relevamiento.**

**Firmas del founder ya dadas (22-ago):**

- **La invitación viaja por dos vías: correo y un enlace copiable** que el
  invitado pueda compartir por WhatsApp. La casa no manda el WhatsApp: **da el
  enlace y la persona lo comparte.**
- **El enlace lleva la descarga de la app.** ⚠️ **Deuda declarada mientras la
  app no exista en las tiendas:** hasta entonces el enlace apunta a lo que haya
  (sitio público / instrucciones), **y se dice lo que es** — no se promete una
  descarga que no está. *Se publica lo incompleto, jamás lo falso.*
- **Por ahora, que entre.** El alcance fino del invitado **sale del documento de
  familia**, no de una decisión nueva.
- **El que entra recibe un onboarding corto de lo que existe** — no la app
  entera: qué es esto, qué puede ver, qué puede hacer.

**Lo demás que ya está medido:**

- **El molde existe entero**: `empleado_invitaciones` + seis RPCs vivas
  resuelven el mismo problema (invitar por correo a alguien sin cuenta,
  activarlo al entrar). **Se hereda el molde, JAMÁS el alcance** — invitar a
  trabajar en un negocio no es invitar a ver el expediente de una mascota.
- La app ya promete «Pronto» — **no engaña a nadie hoy**, y por eso la urgencia
  es de producto, no de honestidad.
- 🔴 **El correo de invitación entra al frente 5** y es de los que no existen:
  su plantilla, su idioma y su remitente nacen con este frente.

### Frente 5 — LOS CORREOS Y LOS AVISOS

- **Primero el dominio** (§1.2). Sin SPF/DKIM/DMARC el resto es decorado.
- **Inventario de plantillas**: las de **Supabase Auth vienen por defecto en
  inglés y con marca ajena** (verificación, recuperación, cambio de correo). Las
  de Resend son nuestras (comprobante de pago, avisos).
- **Qué correo falta**: bienvenida · verificación · invitación de familia ·
  aviso de recurrencia · confirmación de eliminación de cuenta.
- **Idioma**: la app es bilingüe; los correos ¿siguen al usuario? Hay al menos
  un aviso en inglés declarado (**D-628**).
- **El mapa de remitentes, decisión del founder**: `hola@` existe ·
  `privacidad@epetplace.com` ya está firmado · soporte es WhatsApp. Definirlo
  entero de una vez.
- 🟡 **El aviso de recurrencia sigue en sombra y sin monto ni medio**, y su texto
  promete **saltar, mover o cancelar** cuando solo existe cancelar (**D-884**):
  el texto se corrige al alcance real; saltar y mover **no se construyen en v1**.
- **Push** según §1.1.

## §4 · LO QUE ESTA MESA NO HACE

No toca el frente de pagos salvo lo que el lunes traiga · no enciende el cron
del recurrente (llave del founder) · no redacta materia legal (D-405, abogado) ·
no construye **saltar** ni **mover** · no construye el cierre de cuenta del
prestador antes de su letra · no decide el alcance de la invitación familiar por
el founder · no renumera sesiones.

## §5 · LAS LLAVES DEL FOUNDER

| llave | qué destraba |
|---|---|
| ~~Alcance de la invitación familiar~~ ✅ **FIRMADO 22-ago** — correo + enlace copiable · el enlace lleva la descarga (deuda declarada mientras no exista) · por ahora que entre · onboarding corto al entrar · **el alcance fino sale del documento de familia** | El frente 4 |
| **El mapa de remitentes de correo** | Las plantillas |
| **Acceso al dashboard de Supabase y al DNS** | §1.2 y §1.3 — nadie más puede medirlo |
| **Rotación del secreto de despacho (D-885)** | Va **después** de sacarlo del texto del cron |
| **Encender el cron del recurrente** | El recurrente pasa de listo a vivo |
| Abogado y contador (fin de semana próxima) | D-405, retención, régimen del saldo |
| `pointOfSale` de DeUna (lunes) | El riel entero |

## §6 · CÓMO ABRE

1. El founder sube los canónicos + este plan. **A lo deposita** en `docs/` y abre
   bitácora con el número que la bitácora asigne.
2. 🔴 **PRIMER ACTO, antes que los censos: el relevamiento del documento de
   familia** (§ frente 4). Lo corre **A**, porque `docs/` es su territorio, y su
   resultado puede cambiar el alcance de dos frentes.
3. **Primer turno, las cuatro en paralelo, sin escribir código:** las tres
   mediciones de §1 (D: push y dominio · A: dashboard y la copia · C: censo de
   proveedores y de las superficies de cuenta · B: qué piezas faltan).
4. **Checkpoint 1:** la mesa contrasta, el founder firma lo que sea de firma, y
   se autoriza la tanda 1.

---

*Escrito por la mesa 104 al cierre. La sesión que este plan abre hereda un cobro
recurrente listo e inerte, un riel de DeUna a una llave, y páginas legales que
por fin dicen la verdad. Su trabajo es que una familia pueda entrar, cambiar sus
datos, invitar a quien cuida con ella, y salir — y que cada correo que sale de
esta casa llegue. El founder cierra cada gate con el ojo, como siempre.*
