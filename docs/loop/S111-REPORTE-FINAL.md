# S111 · REPORTE FINAL — lo que te espera cuando vuelvas

> **Para el founder.** Lo compila A con los reportes de las cuatro pistas.
> **Una línea por ítem que te espera, con su evidencia.**
> Cinco pistas corrieron sin vos: **A** (motor + conducción) · **B**
> (`packages/ui`) · **C** (`apps/*`) · **D** (`packages/mensajeria`) · **E**
> (mediciones).
>
> **`main` cerró en `cd81beb6`**, con las cinco ramas adentro, árbol limpio y
> todos los gates en verde.

---

## ⓪ LO PRIMERO — LA PRIMERA PASADA SE CORRIÓ Y **NO SE COMPLETÓ**

> ### ⚠️ ESTA SECCIÓN SE ENMENDÓ A LA VISTA. Decía *«los dos APK están listos y esperando tu dedo»* — y para cuando se escribió, **el founder ya había corrido su pasada**.

**Nueve hallazgos, todos con C.** Y el que corta: **el acta no pudo levantarse
porque la foto no carga** ⇒ **la pasada no llegó al final.**

🔴 **La veda de publish sigue ENTERA**, y ahora por una razón medida y no sólo
por procedimiento: *no hay «autorizo» porque no hubo recorrido completo que
autorizar.*

**Lo que sigue, en orden:** ~~C cierra los nueve~~ ✅ → ~~A corta los dos APK de
nube de nuevo~~ ☠️ **NO HIZO FALTA — el lote entró por OTA** → **una sola pasada
más, completa** → recién ahí la autorización.

> ### 🟢 NO TENÉS QUE DESCARGAR NADA. Abrí los APK que YA tenés instalados.
>
> El discriminador de runtime dio **los tres en NO** (sin dependencia nativa,
> sin cambio de config ni permisos, mismo runtime y canal; **fingerprint de EAS
> idéntico** al del binario que tenés). ⇒ **los builds se cancelaron y el lote
> salió por OTA** — ver **`L-467`**, que es la corrección de método que lo
> ordena.
>
> | app | OTA group **VIGENTE** | ancla | qué hacer |
> |---|---|---|---|
> | **cliente** | `0b885c6a-7543-4362-88f5-e6bf9d09562e` | `df9b1c83` | abrir el APK instalado **dos veces** |
> | **prestador** | `9e34d41a-bcbc-48fc-b142-aa682b2faaa0` | `f86b7e50` | abrir el APK instalado **dos veces** |
>
> ⚠️ **Los del cliente `cab8058f` y `2244c282` quedaron VENCIDOS el mismo día**
> — ver `L-469`. **El pie de Cuenta muestra el `updateId`, no el group**: tiene
> que decir **`01a05eed`**.
>
> Runtime **1.0.7**, canal `preview`, ancla `f3c99216` con árbol limpio,
> `verify-ota` verde en las dos con su rojo producido primero. *La primera
> apertura descarga, la segunda aplica.* **El pie de Cuenta muestra el id: si
> dice `cab8058f` / `6f0ac534`, estás en el lote nuevo.**
>
> 🔴 **Esto NO es publicar.** Es entrega para tu gate; el «autorizo» sigue
> siendo tuyo.

### Los APK instalados (los de la primera tanda — SIGUEN SIENDO LOS BUENOS)

| app | estado | dónde |
|---|---|---|
| **cliente** | ✅ FINISHED | `https://expo.dev/artifacts/eas/wQmllDBDwXCT4ng7dCPk1KuPm3C76eTNJgQmER5cXxA.apk` |
| **prestador** | ✅ FINISHED | `https://expo.dev/artifacts/eas/IReW43nme5mOp1gaq65iQpzjM6AdZEqfMhh9bdzinRA.apk` |

**Son de NUBE**, no locales: llevan mapas y push. *Los binarios de prueba no los
tienen, y una prueba de avisos en ellos da falso negativo.*

🔴 **CERO PUBLISH.** Ningún OTA, ninguna llave de `app_config` encendida, ni una
palabra de texto legal en pantalla.

---

## ① LO QUE SE CONSTRUYÓ, en una línea cada uno

**EL DURANTE DE GUARDERÍA QUEDÓ ENTERO** (venía de S110): los cinco actos del
día, las dos actas, el viaje con su punto vivo, y la familia enterándose de que
no se pudo recoger. **Nada de eso se vio en un aparato todavía** — es lo que tu
recorrido va a decidir.

**NACIÓ EL MOTOR DE ADOPCIÓN, y es lo que destrabó la sesión.** Antes había
**cero funciones y cero wrappers** de adopción: tres bloques de tres pistas
distintas estaban parados por la misma pieza ausente. Hoy existe el adoptable,
su publicación, la vidriera, y **el traspaso que deja rastro** — un acto que
mueve la familia, cierra el acceso viejo, escribe el evento y deja al refugio
como procedencia permanente del animal.

**LA VIDRIERA SE VE SIN CUENTA**, como §4 firmó — incluidas las caras. *Quien
llega de una foto en Instagram puede mirar antes de registrarse.*

**LA CONVERSACIÓN ENTRE REFUGIO Y ADOPTANTE TIENE MOTOR Y PUERTA**: solicitud,
hilo, estados, el reloj de los 5 días, **los dos lectores** —el de la familia y
el del publicador, cada uno con sus mensajes— y **el contador de «por revisar»
que puede llegar a cero**. El diseño lo hizo D; A lo implementó.

**SE ABRIERON TRES PUERTAS QUE LA LETRA PEDÍA Y EL MOTOR DECLARABA
IMPOSIBLES**: la donación con destino (§7), el padrinazgo recurrente (§1) y el
refugio como actor de un pedido (§8).

**SE CERRÓ UN AGUJERO DE SEGURIDAD**: cualquier familiar adulto podía mover una
mascota a **otra familia** desde la app. Hoy el traspaso va por el motor y deja
rastro.

---

## ② LO QUE TE ESPERA A VOS — una línea, con su evidencia

| # | qué esperamos de vos | evidencia |
|---|---|---|
| **1** | 🔴 **Una segunda pasada de guardería, COMPLETA** — y con ella, la autorización de publicar. La primera se detuvo en el acta. | los nueve hallazgos, con C |
| **2** | **El paquete del abogado**: el acta de adopción y los contratos. **Sin ese texto el traspaso NO ocurre** — la puerta está construida y cerrada, y **se abre sola el día que el texto se cargue**. | `adopcion_documentos`, tabla vacía a propósito |
| **3** | **El contador**: el 5 % a la fundación. **No se construyó nada** — modelarlo antes de saber su figura fiscal es fabricar un motor que después hay que desarmar. | §4 del estacionamiento |
| **4** | **Las plantillas de solicitud de adopción** (el contenido que el refugio responde). | §5 de la letra |
| **5** | **¿Quién opera el día de guardería?** Hoy sólo el titular; el cuidador empleado no pasa. **Default (a): queda así.** | `D-986` |
| **6** | **¿Se borran las cinco tablas legado de adopción?** **No las borres todavía**: algo las recorre desde afuera del monorepo. | `D-991` |
| **7** | **La ruta del viaje**: firmada como producto propio, **v1 va sin ruta** (`D-996`). Nada la bloquea. | `D-996` |
| **8** | **Ocho decisiones más**, todas con opciones, voto y **construidas fail-closed** para que nada quede trabado esperándote. | `docs/loop/S111-ESTACIONAMIENTO.md` |

---

## ③ LAS OCHO DECISIONES ESTACIONADAS — el titular y el voto

*El detalle completo, con sus cinco partes cada una, está en el
estacionamiento. Acá va lo que necesitás para decidir en un minuto.*

1. **¿El cuidador empleado opera el día de guardería?** → voto **(a) queda como
   está**, el titular opera. *Ensancharlo no es una línea: hay que mover el gate
   del acta y el del estado a la vez, o la transacción autoriza la mitad.*
2. **¿Se borran las cinco tablas legado?** → voto **(c): que alguien con los
   repos viejos mida primero.** *Ya nos pasó: S95-F encontró dos vistas que
   bloqueaban un borrado sin que nadie las leyera.*
3. **¿Qué activa la conversación cuando no hay servicio contratado?** → voto
   **(a): la solicitud de adopción es un activador**, como una cita. *La regla
   vigente dice «cita / servicio / contrato», y una solicitud es un contrato
   acotado.*
4. **¿El adoptante ve lo que le FALTA de salud al animal?** → voto **(a): sí,
   como información sin acción.** *Un adoptante que se entera después de la
   castración pendiente tiene una sorpresa, no una decisión.*
5. **¿Se avisa al padrino cuando su ahijado fallece?** → voto **(a): sí**, con
   voz de duelo y sin invitación a apadrinar otro. *El silencio del memorial
   protege a la familia; el padrino es un tercero que está pagando, y un cobro
   que se detiene sin explicación es peor que la noticia.*
6. **¿El publicador conserva el hilo después de declinar?** → voto **(a): sí**,
   en lectura. *Un hilo que desaparece deja sin material justo el caso en que
   alguien reclama.*
7. **¿Adjuntos en el hilo?** → voto **imagen, sólo del publicador.** *Un adjunto
   libre abre subida de documentos entre dos personas que no se conocen.*
8. **¿«Quiero adoptar» crea la familia vacía?** → voto **(a) sí.** *Con (b), 24
   pantallas que hoy cuelgan de la familia tendrían que aprender a tolerar que
   no exista, y ninguna lo tolera.*

---

## ④ LOS CUATRO FRENOS QUE SE RESPETARON — y que valen más que lo construido

*Se listan porque cada uno es trabajo que NO se hizo a propósito, y sin esta
lista se lee como trabajo que faltó.*

- **Nadie escribió una palabra de texto legal.** Las puertas se construyeron
  contra documentos versionados que **no existen todavía**, así que están
  cerradas. **Se abren solas el día que el texto se cargue.**
- **El protocolo del animal no retirado no se construyó**: ni conteo, ni aviso,
  ni camino a refugio. Sigue frenado por riesgo penal.
- **Las cinco tablas legado no se tocaron**, ni para construir ni para borrar.
- **Al refugio se le dio existencia como actor de un pedido, pero NO se le
  inventaron movimientos.** *Cuáles puede hacer es una decisión tuya.*

---

## ⑤ LO CONSTRUIDO Y NO EJERCIDO — se dice aparte, a propósito

> *Lo no construido se sabe; lo construido y no ejercido **se lee como hecho**.*

- **La pasada del founder llegó hasta el acta y se detuvo ahí** (la foto no
  carga). ⇒ **de todo lo de guardería, lo que está EJERCIDO en aparato termina
  antes del acta**; lo demás sigue sin verse.
- 🔴 **Y el hallazgo tiene la forma que esta casa ya conoce:** la pieza que
  falló **no es el acta** —su motor está probado y su cinturón verde— **es la
  foto**, que es su precondición. *Un acto único cae entero cuando cae
  cualquiera de sus mitades, y la que cayó no era la que se estaba probando.*
- **El traspaso de adopción nunca corrió de verdad** — no puede, hasta que
  exista el acta. Su camino feliz está probado **sólo** dentro de un arnés que
  cargó un acta de prueba y la deshizo.
- **La mensajería tiene motor, puerta y ninguna pantalla montada todavía**: el
  módulo de lógica, el motor y los siete wrappers existen; el hilo se dibuja
  cuando C lo monte.
- **La pieza de convivencia de B está entregada y no montada**, y va a seguir
  así hasta que se firme el modelo de datos (decisión 4).
- **La vidriera anónima nunca se abrió en un navegador sin sesión.**

---

## ⑥ CÓMO SE TRABAJÓ SIN VOS — dos cosas que conviene que sepas

**① Las pistas se corrigieron entre ellas, y casi siempre midiendo.** C midió
que la vidriera anónima no podía mostrar fotos **antes** de cablear la pantalla
— y no la cableó: *entregar la puerta a medias habría sido peor que no
entregarla.* D se corrigió a sí mismo dos veces. E depositó un censo que llevaba
dos sesiones esperándote.

**②bis Y el defecto que yo mismo cometí, porque es el más instructivo:**
construí el motor de la mensajería **sin sus wrappers y sin el lector del
hilo**. El motor pasaba sus pruebas, el typecheck estaba en verde, y **las dos
superficies que le dan sentido no se podían ni empezar**. Lo midió C con un
control sobre 770 funciones. *Es la lección que el brief de S107 marcó a fuego
—el contrato de una pieza de motor incluye su wrapper— cobrada por séptima vez,
y esta vez por mí.*

**② Y el error de conducción que sí hubo, dicho sin maquillar:** ocho
documentos de una pista estuvieron pusheados, anunciados y **fuera del canon
durante horas**, porque yo mergeé sólo lo que me pidieron mergear. **Nada se veía
roto**: main compilaba, los gates pasaban, y el trabajo simplemente no estaba.
Se curó con un control que ahora corre sobre **todas** las ramas después de cada
merge, incluidas las que no pidieron nada.

---

## ⑦ EL ESTADO OPERATIVO

| qué | valor |
|---|---|
| `main` | `14962cc4`, pusheado y verificado por contenido |
| ramas | las **cinco** contenidas en `origin/main` |
| migraciones | **586** · **8 nuevas de A**, todas con reversa escrita ANTES |
| cinturones | **8 verdes**, todos con su rojo producido primero |
| typechecks | **5 en 0** (`api` · `ui` · `mensajeria` · `cliente` · `prestador`) |
| `verify:diseno` | **VERDE, 62 reglas** |
| `verify:mensajeria` | **53/53** |
| `verify:sin-byte-nul` | **VERDE**, 3515 archivos |
| fichas / lecciones | `D-986` → `D-996` · `L-461` → **`L-467`** |
| publish / OTA | **OTA de gate en los dos canales** (`cab8058f` · `6f0ac534`), `verify-ota` verde. **Publish a producción: CERO — veda sostenida.** |
