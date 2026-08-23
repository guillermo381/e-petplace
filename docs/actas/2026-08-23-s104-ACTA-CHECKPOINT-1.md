# S104 · ACTA DEL CHECKPOINT 1 — Mesa 105, «la cuenta, la identidad y la voz que sale por correo»

> **Escrita por A (conductora) el 23-ago-2026**, con las cuatro entregas en la
> mano. **El acta contrasta; no repite los partes** — cada pista tiene el suyo en
> `docs/loop/` y sus mediciones en `docs/relevamientos/`.
> **Ancla de la tanda 1: `bff46617`.** OTAs publicadas y leídas **del objeto**:
> **cliente `a5704c1d` (rt 1.0.4) · prestador `265edbd1` (rt 1.0.5)**, las dos con
> **`dirty: None`** y el **mismo ancla a propósito**.
> **Estado del gate: PENDIENTE.** El founder valida en dispositivo **después** de
> publicar — método firmado en esta mesa.

---

## ① LO QUE ESTA TANDA HIZO, EN UNA LÍNEA POR PISTA

| pista | qué entregó |
|---|---|
| **A** | El espejo de `profiles.email` (backfill + trigger + guard) · el consentimiento como primer escritor del monorepo · `normalizarEmail` en las tres puertas · **D-890 curada** (el guard de gobierno de empleados volvió a frenar) |
| **B** | La cura S81-C al cliente · el par ojo/ojoTachado (glifos 53-54) · las tres piezas del ritual · **R63** y su cura · la reversión del foco |
| **C** | Las 8 pantallas del arco con el ritual · **términos y consentimiento en las TRES puertas** (registro · solicitar-acceso · invitación de empleado) · autofill |
| **D** | 5 asuntos y 4 cuerpos de Auth al español (**config remota, no bundle**) · las mediciones de push, DNS y SMTP |

---

## ② 🔴 LO QUE NO ES OBVIO: **DOS TRENES, NO UNO**

**Lo de D NO viajó en la OTA y el acta lo dice acá para que no se busque donde no
está.** Las plantillas de Auth son **config remota** (Management API): están vivas
en producción **desde las 18:44 UTC, sin merge y sin publish**. Lo que sí entró en
el merge son sus relevamientos y la reversa de las plantillas.

*Precedente idéntico: la página de pagos en Vercel de S101.* **El día que algo del
correo falle, nadie va a encontrar la causa en un commit — porque no hubo commit.**

---

## ③ LAS CUATRO TABLAS, CONTRASTADAS — y lo que el contraste corrigió

### ③.1 · Dos premisas de la orden cayeron al medirse

| la orden decía | lo medido |
|---|---|
| *«se espera 0 divergencia»* en `profiles.email` | **17 divergen — y las 17 SOLO por mayúsculas** (`divergencia_real=0`). El backfill no era «copiar auth»: era **`lower()`** |
| *«`consentimientos` con cero escritores — vos sos el primero»* | **La tabla tiene 59 filas** (del legado, `v1.0`, abr-may). Cierto que el monorepo nunca escribió; **falso que esté vacía** ⇒ se heredó el vocabulario y **NO la versión** |
| *«redirectTo explícito en el wrapper de recuperación»* (§4 tanda 1, punto 4) | **CAE.** El flujo usa `verifyOtp({type:'recovery'})` — **código, no enlace**. Era letra escrita contra un flujo que esta casa no usa. **Firmado por el founder.** |

### ③.2 · Y el relevamiento de familia corrigió a la orden en el otro sentido

§0.3 sospechaba que los escalones de `MODELO_PRODUCTO` §4.3 vivían «solo en el
doc». **Están los cuatro en el CHECK.** Pero *existir en un CHECK no es existir en
el motor*: `adulto_titular` muy vivo (18 funciones) · `adulto_autorizado` con
lector real · `menor` a medias · **`cuidador_externo` en cero absoluto**. Y **de 15
miembros vivos, los 15 son titulares**: los otros tres escalones **nunca tuvieron
una fila**.

---

## ④ LOS CINCO HALLAZGOS DE SEGURIDAD, Y NINGUNO LO ENCONTRÓ UN GATE

| # | qué | cómo apareció |
|---|---|---|
| 1 | **`consentimientos` admitía escritura ANÓNIMA a nombre de terceros** (`with_check=true`) ⇒ **la tabla que existe para ser evidencia aceptaba evidencia falsa** (P23) | al ir a escribir el **primer** consentimiento del monorepo. *La puerta estaba abierta y nadie la había cruzado* |
| 2 | **`_prestador_empleados_protege_gobierno` no frenaba** — 8 de 8 no-gestores cambiaban su propio `activo` | hallazgo colateral, midiendo otra cosa |
| 3 | **El guard de `profiles.email` que A escribió nació roto** (DEFINER) y **el apply salió VERDE** | **producir el rojo**, no el cinturón |
| 4 | **`profiles.email` era escribible desde el cliente** por PostgREST (grant de columna + policy sin restricción) | censo de escritores |
| 5 | **Hostinger borró el DKIM de Resend** al dar de alta los buzones | **una línea que el founder puso en la orden**: *«verificá que no haya pisado a Resend»* |

⇒ **La lección transversal de la jornada:** los cinco salieron de **volver a mirar
algo dado por cerrado** o de **producir el rojo**. **Cero los encontró un gate
corriendo.** *Un gate mide lo que se le pidió medir; la vara dice qué había que
pedir.*

---

## ⑤ EL MÉTODO SE MIRÓ A SÍ MISMO — CINCO autocorrecciones en un día

Se registran **porque son el activo**, no la anécdota:

1. **A se corrigió antes de fichar D-890.** El primer rojo salió de `limit 1` sin
   mirar si esa fila era de un **gestor** — el guard tiene DOS condiciones, y sobre
   un titular habría dado «pasa» **legítimamente**. *Un rojo por la razón
   equivocada está tan roto como un verde por la razón equivocada.*
2. **D se corrigió a sí misma:** entregó el correo **al español**; la orden pide
   **al idioma del usuario**. *Midió bien y la pregunta estaba mal.*
3. **D se corrigió DOS veces:** su voto sobre `despachar-correo` («ya habla dos
   idiomas») **era falso, y A ya lo había depositado en un canónico**. *Una razón
   depositada que nadie vuelve a medir se vuelve cita, y la próxima mesa la usa
   como premisa.*
4. **B reportó dos choques en vez de bajar el juez:** el `400ms` que R51 rechazaba
   y el foco contra Ley 5. **Las dos terminaron en enmienda firmada del founder** —
   y la segunda **corrigió a la orden del propio founder**, que la dio *«sin ver el
   choque»*.

5. **D encontró un verde flojo DENTRO del instrumento escrito para no tenerlos.**
   La auto-prueba de `verify-dns-correo.mjs` daba **5/5 rojo por la razón
   equivocada**: medía contra `example.com` con un NS que **no es autoritativo para
   ese dominio** ⇒ detectaba *«este servidor no contesta»*, no *«el registro no
   está»*. **Color bueno, motivo malo.** *Un instrumento cuya auto-prueba pasa por
   la razón equivocada certifica su propia ceguera.*

**Y una del founder que vale igual:** la línea *«verificá que no haya pisado a
Resend»* es la única razón por la que el DKIM no se descubrió semanas después.
**Ninguna de las cinco autocorrecciones la produjo un gate.**

---

## ⑥ LAS FIRMAS DE ESTA MESA, EJECUTADAS

- **Ley de paridad de cuenta**, con sus **tres excepciones** — y la ② es de fondo:
  **el cierre del NEGOCIO no existe en la app POR DECISIÓN, no por falta.** *Un
  negocio con citas pagadas de terceros, empleados con acceso y eventos sin
  liquidar no se cierra con un botón: es trámite asistido.* **No es deuda ni
  «Pronto»: es la forma correcta.**
- **5.1 a 5.6** firmadas (escalón del invitado · inalcanzable · 30 días · correos
  bilingües · verificación después del gate · sesiones v1).
- **Tres enmiendas a `RITUAL_DE_ENTRADA`**: 300ms · foco retirado · cae el punto 4.
- **Shared-element §3: queda como C lo montó, por pantalla.** Se gatea en
  dispositivo; si el salto se nota, ahí se decide si vale reestructurar las rutas
  de auth. **No se toca ahora.**

---

## ⑦ LO QUE QUEDA ABIERTO, CON DUEÑO

| qué | dueño | nota |
|---|---|---|
| ✅ **D-894 CERRADA el mismo día**: DKIM restaurado y verificado en los 4 resolvers · **daño final CERO medido** (el correo de las 22:53 llegó a bandeja, no a spam) | — | lo salvó una captura de 3 h antes ⇒ **L-413** y `verify-dns-correo.mjs` |
| 🔴 **El DMARC sigue sin cargar** — y **no es freno de D: no tiene la credencial de DNS** (verificado) | **founder** | el valor está listo |
| **D-892** el buzón: `privacidad@` ya reenvía ✅ — falta cerrar la promesa de P15 | founder | el alta de buzones es lo que disparó D-894 |
| **D-893** 💣 `Confirm signup` + apagar `mailer_autoconfirm` = **UN SOLO ACTO** | mesa | si se apaga primero, **el registro se rompe para todos** |
| **D-628** cerrada a medias: falta el **idioma del usuario** | mesa | costo hoy **cero** (0 usuarios en inglés); **no se archiva como cerrada** |
| **El choque de `familia.tsx`** — promete «co-dueño», la firma dice «familiar autorizado» | **founder** | C y B respetaron el freno; nadie tocó el texto |
| **La prop `estatica` de `PaseoDeHuellas`** (pedido de C a B) | B | entra en esta tanda si llega; si no, viaja en la 2 |
| **`fecha_nacimiento` en `familia_miembro`** | tanda 2 | sin ella **no se puede invitar menores** (P5) |
| **`familia_invitaciones` no existe**; el molde heredable tiene 5 RPCs y **ninguna crea la invitación** | tanda 2 | — |

---

## ⑧ OPERATIVO

**396 migraciones locales = 396 remoto** · **4 typechecks VERDE** · **`verify:diseno`
VERDE con 54 reglas** (nace **R63**) · **4 migraciones de A**, las cuatro con
**reversa escrita ANTES** y **76(g) declarada** · **fichas hasta D-894** (D-891 y D-894 nacidas y cerradas el mismo día) ·
**lecciones hasta L-413** · **las cuatro ramas de pista en 0 commits fuera de
`main`**, verificado por conteo.

⚠️ **Nota operativa que costó dos veces (L-411):** una migración cuyo cinturón usa
`SET LOCAL ROLE` queda **aplicada y SIN REGISTRAR** — el CLI pierde permiso sobre
`supabase_migrations` y **el `db push` dice ERROR con el trabajo hecho**. Las tres
primeras se registraron a mano; **la cuarta, sin cambio de rol en su cinturón,
terminó `Finished` y se registró sola.**

---

## ⑨ EL GATE QUE FALTA, Y ES EL ÚNICO QUE VALE

**Nada de esta tanda está firmado hasta que el founder la vea en el aparato.** Las
dos OTAs están publicadas contra los runtimes correctos —**verificados uno por uno
antes de publicar**, porque los dos números estaban cruzados en la lectura rápida y
publicar contra el equivocado no entrega nada— y **su aparato ya está medido como
compatible** (cliente 1.0.4 · prestador 1.0.5, los dos coinciden con `main`): **recibe
sin reinstalar, con doble reinicio.**
