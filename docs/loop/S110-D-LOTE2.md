# ⚠️ ESTE DOCUMENTO ES INSUMO PARA LA PISTA E, NO UN VEREDICTO DE D

> **Acotación de mesa recibida el 1-sep-2026, DESPUÉS de que estas cuatro
> mediciones ya estuvieran corridas y publicadas:** el censo de D queda en el
> **primer lote (① y ②)**; **las mediciones ③–⑥ son de la pista E**, que corre
> en paralelo.
>
> **No se retira, y se declara por qué:** las cuatro están medidas contra el
> objeto con sus controles, y borrarlas tiraría trabajo que a E le sirve. **Pero
> el dueño de esos cuatro veredictos es E, no D.**
>
> 🔴 **Cómo se lee esto, entonces:** como **insumo verificable**, jamás como
> medición firmada de la sesión. **Si una lectura de E no coincide con una de
> acá, gana E** — y la diferencia se resuelve preguntándole al objeto, no
> discutiendo: *no hace falta desconfiar del otro para medir; alcanza con que
> dos lecturas no coincidan y preguntarle al objeto cuál es cuál.* Cada
> afirmación de abajo lleva su consulta y su control para que E la pueda
> re-correr en vez de heredarla.
>
> **El censo de D, el que la mesa pidió, es `docs/loop/S110-D-LOTE1.md`.**

---

# S110-D · LOTE 2 — LAS OTRAS CUATRO MEDICIONES DEL §12

> **Pista D de S110 · SOLO LECTURA.** Cero DDL, cero backfill, cero seeds, cero
> pantallas, cero propuesta de modelo. No se tocó el motor de pagos.
> **Fecha:** 1-sep-2026 · **Rama:** `pista/s110-d` · **Base:** `main` `202ff494`.
> **Lote 1 (① y ②):** `docs/loop/S110-D-LOTE1.md`, sha `36085163`.
>
> **CONTRA QUÉ SE MIDIÓ, por medición:** ③ objeto + repo · ④ objeto + repo ·
> ⑤ objeto + repo · ⑥ repo. **Ninguna se midió en bundle corriendo** — exige
> sesión con datos que esta pista no puede crear, y se declara en vez de
> redondearse.
>
> ⚠️ **Todo lo del lado repo se midió con el buscador NUL-safe validado en el
> lote 1, NO con `grep`** — ver ahí por qué `grep` devuelve ceros silenciosos
> sobre 2 archivos fuente trackeados de esta casa.

---


## ✅ ENMIENDAS DE LA PISTA E (1-sep) — RE-MEDIDAS POR D, A LA VISTA

E re-corrió las cuatro con controles propios y **coincide en dirección en las
cuatro**. Difiere en tres precisiones. **Las tres se re-midieron acá; dos
CORRIGEN este documento y una lo confirma.**

**① ④ — E ENCUENTRA ALGO MÁS DURO QUE LO QUE YO REPORTÉ, y tiene razón.**
Yo dije que al padrinazgo le falta una columna de refugio en
`pedido_item_destinos`. E midió el constraint:
```
chk_destino_excluyente:  CHECK ((NOT (es_donacion AND (mascota_id IS NOT NULL))))
+ guard gemelo en el body: RAISE EXCEPTION 'destino_contradictorio: un ítem no
  puede ser donación Y de una mascota'
```
✅ **CORREGIDA LA FIGURA (3ª pasada, contra la fuente): el CHECK bloquea la
DONACIÓN de §7, no el padrinazgo — E se corrigió a sí misma y lo verifiqué.**
§6 dice *«La canasta es del **REFUGIO**, no de cada mascota… el saco llega al
refugio donde vive Luna, y **las fotos** que recibís son de Luna»* ⇒ en el
padrinazgo el vínculo con la mascota es **para las fotos, no para el destino del
producto**. La que choca es la **donación de §7**, cuyo campo de destino tiene
tres valores y **el primero es *«una mascota en adopción»***. **El hallazgo se
sostiene entero; la figura estaba mal asignada.**

Y §7 cierra con la advertencia que le pone nombre a lo que medimos:
> *«Quien implemente el padrinazgo o la donación con destino **reusando la
> donación de la despensa tal cual** va a heredar «sin destino elegible», que es
> precisamente lo que estas figuras no pueden ser.»*

**`chk_destino_excluyente` ES el artefacto de esa advertencia.** *El founder la
escribió antes de que midiéramos; la medición le puso el nombre del constraint.*

~~El padrinazgo es exactamente donación CON destino~~ —la mascota apadrinada, y
por eso recibe sus fotos—. ⇒ **no es agregar una columna: es enmendar un CHECK
que hoy declara esa combinación una contradicción**, más su guard. **Mi §④ se
queda corto y se corrige acá.** *El veredicto de ④ no cambia —el motor de
entrega sigue admitiendo destinatario distinto—; lo que cambia es el tamaño del
hueco del padrinazgo, que es mayor que el que reporté.*

**② ⑤ — E DUDA DE MI «SEIS ESCRITORES». LO RE-MEDÍ: EL SEIS SOBREVIVE, Y EL
DATO DE E ES OTRO Y TAMBIÉN ES CIERTO.**
E advirtió que un conteo por substring captura `estado = 'confirmada'` de otras
tablas. Mi regex estaba anclado en la tabla, **pero tenía un riesgo real que E
no nombró y yo tampoco había visto: `estado` es prefijo de `estado_pago`.**
Re-medido con límite de palabra y con dos controles:
```
A) regex original                                   -> 6 funciones
B) PRECISO, \mestado\M (excluye estado_pago)        -> 6 funciones (IDÉNTICAS)
C) CONTROL: escriben SOLO estado_pago y no estado    -> 0   (no había contaminación)
E) CONTROL+: ¿\mestado\M pega en «SET estado_vida»? -> no pegó (distingue) ✅
D) escriben motivo_cancelacion                       -> 2: _trg_mascotas_memorial_planes,
                                                             mover_sujeto_por_reverso
```
⇒ **SEIS escriben `estado`; sólo DOS escriben `motivo_cancelacion`.** Las dos
mediciones son verdaderas y miden cosas distintas. **Pero el dato de E afila
una frase mía que se leía de más:** yo escribí *«el motivo NO es sólo "el
usuario canceló"»*, y lo exacto es que **el motivo es una columna de primera
clase que sólo 2 de 6 escritores completan** — `expirar_planes_sin_pago`,
`vencer_links_mensuales`, `cerrar_y_renovar_planes` y `confirmar_pago_plan_paseo`
mueven el estado **sin dejar motivo**. *Un padrinazgo que se corte por un
motivo externo no tiene hoy quién lo escriba, salvo copiando a esas dos.*

**③ ⑤ — HALLAZGO DE E QUE NO ESTÁ EN ESTE DOCUMENTO Y ES EL COSTO REAL.**
Confirmado contra el objeto:
```
suscripciones_servicio_tipo_valido:
  CHECK ((tipo_servicio = ANY (ARRAY['guarderia_mensual'::text, 'paseo_mensual'::text])))
```
**Cerrado a dos valores.** ⇒ un padrinazgo recurrente **no cabe sin enmendar ese
CHECK**. Mi *«el recurrente ya lo resuelve»* se leía como que sólo falta un
lector, y falta también abrir el vocabulario. **Corregido acá.**

🔴 **ENMIENDA DEL ENCUADRE (2ª pasada de E) — y separo lo medido de lo
relevado, porque no son lo mismo.**

**LO MEDIDO, y no cambió:** el CHECK está cerrado a `guarderia_mensual` y
`paseo_mensual`. Eso lo verificamos los dos contra el objeto.

**LO QUE CAMBIA ES SI ESO ES COSTO DE v1 O DEUDA DIFERIDA — y no es medible
desde el repo.** Yo escribí primero *«coherente con §8, que deja la recurrencia
del aporte fuera de v1»*, **tomando el encuadre de E**, que lo había leído
contra `LETRA_ADOPCION_PADRINAZGO` **del 25-ago — la archivada**. E lo retira y
releva que **`LETRA_ADOPCION` v1.0 del 31-ago define el padrinazgo como compra
recurrente de PRODUCTOS en v1**, y que su §11 excluye el padrinazgo **en
dinero**, no la recurrencia. ⇒ **`suscripciones_servicio_tipo_valido` habría que
abrirlo PARA v1, no después.**

✅ **ACTUALIZADO (3ª pasada, 1-sep): esto YA NO ES RELEVO — es MEDIDO contra la
fuente.** `LETRA_ADOPCION.md` v1.0 apareció en `pista/s110-a` (`7d76380f`) y la
leí. **E tenía razón, y su relevo era exacto:**

> **§1** — *«**Padrinazgo** | **Compra RECURRENTE de productos**, entregada al
> refugio»*
> **§11 · LO QUE NO ENTRA EN v1** — *«**Padrinazgo en dinero** · cualquier
> beneficio comercial al padrino · …»* — **la recurrencia NO figura en la lista.**

⇒ **abrir `suscripciones_servicio_tipo_valido` es COSTO DE v1, no deuda
diferida.** *Mi separación entre medición y relevo era la correcta —el encuadre
no se podía verificar cuando lo escribí— y al poder verificarse, el relevo
resultó exacto. Se sube a medición y se cita la fuente:
`pista/s110-a:docs/LETRA_ADOPCION.md` §1 y §11.*

**Y §6 confirma, sin que nadie lo pidiera, la otra mitad de mi ⑤:**
> *«Su puerta de cancelación es la de la casa: **Pagos recurrentes y
> suscripciones**, en Cuenta. El padrinazgo **no construye la suya**.»*
> *«🔴 **El padrinazgo sabe morir.** Si el ahijado es adoptado, fallece o el
> refugio se va, **el cobro recurrente se detiene solo — jamás sigue por
> inercia.**»*

⇒ **la letra apunta a `/cuenta/recurrentes`, que medí que existe, y pide
exactamente el mecanismo del memorial, que medí que corre.** *Y ahí la frase
que salió de la objeción de E pasa de detalle a requisito: cuatro de los seis
escritores apagan sin dejar motivo, y §6 exige tres motivos distintos —adoptado,
fallecido, refugio que se va— cada uno con su aviso propio.*

**④ ⑥ — E REFUERZA, sin contradecir.** El eje **no es «tipo de cuenta»: es rol +
capacidad** (`esGestor`, `montaAtender`); `ClaveTabPrestador` es un tipo cerrado
de 5 claves atado por `satisfies Record<...>`, así que **el compilador obliga
los tres lugares** — el costo de una tab nueva es exacto y verificable, no
difuso. Y E lo verificó **contra el bundle**, que yo no pude:
`ordenTabsPrestador` viaja horneada en `apps/prestador/dist` (4 ocurrencias) y
**0 en el del cliente**.

**⑤ ③ — E lo confirma entero** con evidencia propia (0 wrappers de 109, 0 rutas
de 174) y coincide en que §6.4.7 excluye el caso por diseño.

*Nota de método, porque es la tercera vez que la casa la cobra: ninguna de estas
tres diferencias se resolvió discutiendo — las tres las resolvió el objeto. No
hizo falta desconfiar de nadie: alcanzó con que dos lecturas no coincidieran y
preguntarle al objeto cuál era cuál.*

---

# ③ ¿HAY MENSAJERÍA ENTRE DOS CUENTAS HOY?

## VEREDICTO

> **NO existe, y es peor que «no construida»: el diseño declarado la EXCLUYE
> para este caso. §6.4.7 dice literal *«Sin servicio activo, no hay canal»*, y
> refugio + adoptante no comparten cita. La conversación de §5 no es media
> letra: es letra entera — hay que decidir qué activa el canal cuando no hay
> servicio.**

### Lo construido — medido contra el OBJETO

**Control del instrumento:** la búsqueda incluyó un control positivo
(`evento_cita_servicio`, que sé que existe) y uno negativo
(`mensajes_admin_seller`, que el canon declara inexistente).
```
TABLAS DE MENSAJERIA (+control): 2
  evento_cita_servicio   kind=r rls=True policies=10 cols=33   <- CONTROL+ presente ✅
  ticket_mensajes        kind=r rls=True policies=2  cols=7
CONTROL- mensajes_admin_seller presente? False ✅
```
**La única tabla de mensajes de `public` es `ticket_mensajes`, y es SOPORTE:**
```
columnas: id · ticket_id · autor_id · es_interno · mensaje · archivos · created_at
FILAS: 0

tm_owner  [SELECT] USING: (((NOT es_interno) AND (ticket_id IN (
             SELECT tickets_soporte.id FROM tickets_soporte
             WHERE (tickets_soporte.user_id = auth.uid())))) OR is_admin())
tm_insert [INSERT] CHECK: ((autor_id = auth.uid()) AND ((NOT es_interno) OR is_admin()))
```
⇒ **usuario ↔ admin, colgado de `tickets_soporte.user_id`. Cero filas. No hay
segunda cuenta: hay un usuario y la casa.** *No sirve, ni con adaptación: su
eje es el ticket, no el par de cuentas.*

### Y el propio doc ya lo declaraba — `PORTAL_PRESTADOR` §6.4.7, literal

> **:1512** *«**Implementación técnica: CN completa.** El canal de mensajería
> in-app entre prestador y familia es feature nueva no trivial. Queda como
> **deuda explícita** para sesión técnica posterior… Mientras no exista, los
> prestadores F1 pueden tener excepción documentada para usar WhatsApp.»*

**La medición coincide con el doc: no hay divergencia que reportar acá.**

### 🔴 LA PREGUNTA QUE DECIDE, Y SU RESPUESTA NO ES «FALTA CONSTRUIRLO»

> **:1504** *«**Activación con servicio.** Solo se activa cuando hay cita /
> servicio / contrato activo entre prestador y familia. **Sin servicio activo,
> no hay canal.**»*
> **:1493** *«El canal se activa solo cuando hay servicio activo entre ellos.»*

**El refugio y el adoptante NO comparten cita, servicio ni contrato.** Una
adopción es exactamente el caso que esa cláusula excluye. ⇒ **construir §6.4.7
tal como está escrito NO habilita la conversación de la adopción.**

*Lo que falta no es sólo la tabla: es la decisión de qué ABRE el canal cuando
no hay servicio que lo abra* — y con ella arrastra las dos razones que §6.4.7
da para existir (*«el prestador no puede llevarse al cliente fuera del
ecosistema»* y *«el cliente no puede saltarse el modelo de cobro»*), **que en
adopción no aplican, porque §1 de `LETRA_ADOPCION_PADRINAZGO` dice que la
adopción no cobra comisión.** *El canal existe para proteger un cobro que acá
no existe.* **Anotado, no resuelto: no es mío.**

---

# ④ ¿EL MOTOR DE ENTREGA ADMITE UN DESTINATARIO DISTINTO DEL COMPRADOR?

## VEREDICTO

> **SÍ, y de punta a punta — esto CORRIGE la letra. `pedidos` no tiene FK a la
> dirección del comprador: tiene columnas propias de snapshot, con
> `entrega_nombre_receptor` y `entrega_telefono`; la RPC recibe la entrega como
> parámetro libre sin validarla contra el comprador; y el checkout del cliente
> YA tiene el campo del receptor, con su validación. No es «la única pieza
> genuinamente nueva del bloque»: es la pieza MÁS construida de las cuatro.**

### a) Columna propia, no FK — medido contra el OBJETO

```
pedidos:  entrega_nombre_receptor  text
          entrega_telefono         text
          entrega_direccion        text
          entrega_ciudad           text
          entrega_sector           text
          entrega_referencias      text
          entrega_lat / entrega_lon   double precision
          entrega_instrucciones    text
```
```
FK de pedidos -> direcciones_guardadas:  (NINGUNA)

todas las FK salientes de pedidos:
  compra_id -> compras            | cuenta_comercial_id -> cuentas_comerciales
  envio_regla_id -> reglas_envio  | envio_servicio -> cat_tipos_servicio_envio
  envio_tipo_regla -> ...         | envio_transportista -> cat_transportistas
  estado -> cat_estados_pedido    | user_id -> auth.users
```
**El único lazo con una persona es `user_id` — quién COMPRA y es dueño del
pedido. La entrega no cuelga de él por ninguna FK.** Es el patrón de snapshot
que la casa ya usa para la dirección de la cita (D-339): *la dirección se
congela en la fila, no se referencia.*

### b) La puerta tampoco lo ata — medido contra el OBJETO

```
crear_pedido_despensa(
  p_cuenta_comercial_id uuid, p_items jsonb, p_entrega jsonb,
  p_clave_idempotencia text, p_bodega_id uuid, p_metodo_entrega text,
  p_fecha_programada date, p_servicio_envio text, p_user_id uuid)

¿valida p_entrega contra direcciones_guardadas del comprador?  ->  False
escriben entrega_direccion  ->  crear_pedido_despensa, despachar_pedido
```
**`p_entrega` es jsonb libre y nada lo confronta con las direcciones del
comprador.** *No hay que abrir nada: ya está abierto.*

### c) Y la superficie ya lo pide — medido contra el REPO

```
apps/cliente/src/app/(tabs)/despensa/checkout.tsx:161   const [receptor, setReceptor] = useState('');
apps/cliente/src/app/(tabs)/despensa/checkout.tsx:429   if (receptor.trim() === '') return t('despensa.faltaReceptor');
apps/cliente/src/app/(tabs)/despensa/checkout.tsx:459   nombre_receptor: receptor.trim(),
apps/cliente/src/app/(tabs)/despensa/checkout.tsx:1663  label={t('despensa.receptorLabel')}
```
**El receptor es un campo editable con validación propia y su propia voz.**

### 🔴 CORRECCIÓN DE MI PROPIA ④ (3ª pasada, contra la fuente y contra el dato)

Escribí que ④ *«corrige la letra»* y que era *«la pieza MÁS construida, no la
única nueva»*. **Leída la fuente, me pasé — y el dato me modera a mí, no a la
letra.** §8 dice, literal:

> *«La compra se entrega **al refugio**, no a quien pagó. **La coordina el
> refugio.** 🔴 **Es la única pieza genuinamente nueva del bloque:** el motor de
> entrega de la despensa **nunca despachó a un tercero**.»*

**«Nunca DESPACHÓ» es una afirmación histórica, y yo medí CAPACIDAD. Las dos
pueden ser ciertas — y lo son.** Medido contra el objeto:
```
pedidos totales                                    87
con entrega_nombre_receptor no nulo                87
CONTROL+ receptor = nombre del comprador           61
MEDICIÓN  receptor DISTINTO del comprador          26
comprador sin nombre (no comparable)                0
de los 26: created_by_sistema = true               11   (= los 11 del total: control ✅)
de los 26: created_by_sistema = false              15
de los 26: PAGADOS (pagado_en no nulo)              0   🔴
de los 26: direcciones distintas entre sí            7
rango                                     12→21 ago 2026
```

⇒ **el campo del tercero existe, está cableado hasta la pantalla y se ejerció 15
veces por caminos no-sistema… y NINGUNO de esos pedidos se pagó.** Como no hubo
pago, no hubo despacho. **La letra es literalmente correcta: el motor nunca
despachó a un tercero.**

**Lo que mi ④ sostiene, acotado a lo que la evidencia aguanta:** el **modelo de
datos y la superficie** ya admiten destinatario distinto —no hay FK al comprador,
`p_entrega` es libre, el checkout pide receptor—, así que **lo nuevo no es el
mecanismo del destinatario**. **Lo que sí es nuevo, y §8 lo nombra y yo no lo
había medido, es *«la coordina el refugio»***: un rol de coordinación de la
entrega por parte de un tercero que no compró — **eso no existe en ninguna
tabla que haya medido**, y E le encontró el artefacto exacto, más duro que
«falta un campo»: `cat_transiciones_pedido.actor` admite
`admin · cliente · repartidor · sistema · vendedor`, **y el refugio no está
entre ellos.** No falta una columna: **falta un ACTOR en el catálogo que
gobierna quién puede empujar la máquina de estados del pedido.** *La casa ya
tiene la cicatriz de al lado —S105: «un actor que el catálogo declara válido y
la puerta no acepta es un callejón»—; ésta es la variante previa: ni siquiera
está declarado.*

*El veredicto de ④ se mantiene en su dirección y se le baja el volumen: no
«corrige» la letra, la **acota**. La pieza nueva es la FIGURA y su coordinación,
no el campo.* **Y la lección es mía: «el motor lo admite» y «el motor lo hizo»
son dos afirmaciones distintas, y yo usé la primera para discutirle a una letra
que hablaba de la segunda.**

---

### Lo que SÍ falta, para que la corrección no se lea como «está todo hecho»

**Nada del DESTINATARIO. Lo que falta es del SUJETO del ítem**, y es otra cosa:
```
pedido_item_destinos:  pedido_item_id · mascota_id (nullable) · es_donacion (NOT NULL) · atado_en · atado_por
FK: pedido_item_destinos.mascota_id -> mascotas  ON DELETE SET NULL
```
**`es_donacion` ya existe como booleano NOT NULL** y la mascota del destino es
nullable ⇒ *el modelo ya distingue «esto es para mi mascota» de «esto es una
donación sin mascota».* **Lo que no medí, y lo declaro:** si `es_donacion=true`
puede hoy apuntar a un refugio concreto — **no hay columna de refugio en esa
tabla**, y `MODELO_DESPENSA` reserva la donación sin destino elegible. *Ese es
el hueco real del padrinazgo, y NO es el motor de entrega.*

---

# ⑤ ¿EL COBRO RECURRENTE ADMITE UN SUJETO CUYO DESTINATARIO PUEDE DESAPARECER?

## VEREDICTO

> **SÍ, y el caso exacto ya está construido, corriendo y firmado: cuando una
> mascota muere, `_trg_mascotas_memorial_planes` cancela sus suscripciones con
> `motivo_cancelacion='memorial'`, cancela las citas futuras del período,
> calcula el crédito y CALLA. La sección de Cuenta existe (`/cuenta/recurrentes`)
> y su propio encabezado dice que fue construida para recibir un sujeto más
> «agregando un lector y un caso en apagar, sin tocar el render».**

### a) Qué detiene una recurrencia — medido contra el OBJETO

```
CHECK estado: (estado = ANY (ARRAY['pendiente','activa','pausada','cancelada','vencida']))
columnas de corte: estado · estado_pago · cancelado_en · motivo_cancelacion · periodo_fin
estados vivos en el dato: cancelada=3, activa=3
```
**`motivo_cancelacion` existe como columna: el motivo NO es sólo «el usuario
canceló», es un dato de primera clase.**

**Quién escribe el estado (control+: 18 funciones mencionan la tabla ⇒ la
búsqueda ve):**
```
mover_sujeto_por_reverso · cerrar_y_renovar_planes · confirmar_pago_plan_paseo
_trg_mascotas_memorial_planes · expirar_planes_sin_pago · vencer_links_mensuales
```
⇒ **seis escritores, y sólo uno es el usuario.** Los otros cinco son motivos
externos: el reverso del pago, la renovación, la falta de pago, el vencimiento
del link, **y la muerte del destinatario.**

### b) 🔑 EL PRECEDENTE EXACTO, con su body (regla 40)

```sql
-- _trg_mascotas_memorial_planes  (AFTER UPDATE OF estado_vida ON mascotas)
IF NEW.estado_vida IS DISTINCT FROM 'activa'
   AND OLD.estado_vida IS NOT DISTINCT FROM 'activa' THEN
  FOR v_s IN SELECT * FROM suscripciones_servicio
     WHERE mascota_id = NEW.id AND estado IN ('pendiente','activa','pausada') FOR UPDATE
  LOOP
    -- lo no consumido del período vigente (espejo de cerrar_y_renovar_planes, no invento)
    SELECT count(*) INTO v_sobrantes FROM evento_cita_servicio c
     WHERE c.suscripcion_servicio_id = v_s.id AND c.estado='confirmada'
       AND c.fecha >= v_s.periodo_inicio AND c.fecha < v_s.periodo_fin;
    v_credito := round(COALESCE(v_s.precio_unitario_efectivo,0) * v_sobrantes, 2);

    UPDATE evento_cita_servicio SET estado='cancelada' WHERE ...;

    UPDATE suscripciones_servicio
       SET estado='cancelada', cancelado_en=now(),
           motivo_cancelacion='memorial', auto_renovar=false, ...
           estado_pago = CASE WHEN v_credito > 0 THEN 'reembolsado' ELSE estado_pago END,
           pago_metadata = ... 'motivo','liberacion_memorial_clausula_s80_no_rige' ...
     WHERE id = v_s.id;

    /* ☠️ S88 — EL MEMORIAL CALLA, TAMBIÉN ACÁ (firma del founder).
       … la liberación por memorial calla, y la familia ve el crédito cuando vuelve.
       ⚠️ LA LIBERACIÓN SIGUE OCURRIENDO. Lo que muere es el AVISO. */
  END LOOP;
END IF;
```

***«Un sujeto cuyo destinatario puede desaparecer» no es un caso nuevo: es el
memorial, y está resuelto con su aritmética de crédito y su decisión de voz
firmada.*** *Lo que un padrinazgo agregaría no es el mecanismo — es un motivo
más (el refugio deja de operar, el apadrinado se adopta) y su voz, que en el
memorial se decidió que fuera silencio.*

### c) La sección de Cuenta EXISTE — medido contra el REPO

```
apps/cliente/src/app/(tabs)/cuenta/index.tsx:137
  { etiqueta: t('cuenta.recurrentes'), ruta: '/cuenta/recurrentes', icono: 'mes' }
apps/cliente/src/app/(tabs)/cuenta/recurrentes.tsx:263
  : await configurarRenovacionPlan({ suscripcion_id: it.id, auto_renovar: false });
```
Y su encabezado, literal — **las tres cosas que le sirven a la mesa**:
> *«El censo halló **TRES sujetos recurrentes vivos** y sólo dos tienen lector:
> las compras que se repiten de la despensa **no tienen ninguno en
> `packages/api`**… **Se declara en la pantalla en vez de omitirse**: una sección
> que promete "todo lo que te cobra solo" y muestra dos de tres miente por
> omisión.»*
> *«El paseo **se puede volver a encender**… La guardería **NO**: medido contra
> `supabase/migrations`, no existe ninguna función que devuelva una suscripción a
> `activa`.»*
> *«**Construida para sostener más de un tipo:** las filas salen de `Item`, un
> modelo normalizado — **el padrinazgo aterriza acá agregando un lector y un caso
> en `apagar`, sin tocar el render**.»*

🔑 **La pantalla ya nombra al padrinazgo y ya declaró dónde entra.** ⚠️ **Y su
asimetría es una advertencia para el vertical:** *un sujeto que se apaga y no se
puede volver a encender no puede ofrecer el mismo gesto que uno que sí.* Si un
padrinazgo se pausa, hay que decidir **antes** si se reactiva.

---

# ⑥ ¿LA APP DE NEGOCIOS ADMITE TABS POR TIPO DE CUENTA SIN BIFURCAR LA APP?

## VEREDICTO

> **SÍ, y ya lo hace: las tabs se DECLARAN todas, siempre; quién las VE lo
> decide una lista derivada de la capacidad de la cuenta. Ya es condicional en
> dos ejes (`negocio` desde S75, `atender` desde S98) y dos rutas viven
> declaradas y ausentes de la barra. Sumar un eje de refugio es agregar un
> booleano y un spread a una función pura.**

### Cómo se arma hoy — medido contra el REPO

```tsx
// apps/prestador/src/app/(tabs)/_layout.tsx:663-690  — TODAS estáticas
<Tabs.Screen name="index" />
<Tabs.Screen name="mascotas" />
{/* S98-C: la pantalla se declara SIEMPRE aunque la barra no la
    monte — un `Tabs.Screen` condicional deja la ruta inexistente y
    un `router.push('/atender')` de cualquier pantalla se caería sin
    decir por qué. Quién la VE lo decide `items`; que EXISTA es del
    navegador. (Mismo trato que `negocio`, que ya era condicional en
    la barra y fijo acá desde S75.) */}
<Tabs.Screen name="atender" />
<Tabs.Screen name="negocio" />
<Tabs.Screen name="cuenta" options={{ popToTopOnBlur: true }} />
<Tabs.Screen name="pedidos" />   {/* declarada y AUSENTE de items */}
<Tabs.Screen name="gallery" />   {/* declarada y AUSENTE de items */}
```

**La ley ya está escrita en el código: *«Quién la VE lo decide `items`; que
EXISTA es del navegador.»*** Y la barra sale de una función **pura**:

```ts
// apps/prestador/src/lib/barra-prestador.ts:64
export function ordenTabsPrestador(c: CapacidadDeBarra): ClaveTabPrestador[] {
  return [
    'index',
    'mascotas',
    ...(c.montaAtender ? (['atender'] as const) : []),
    ...(c.esGestor    ? (['negocio'] as const) : []),
    'cuenta',
  ];
}
```
```tsx
// _layout.tsx:600
const items: BarraTabsItem[] = ordenTabsPrestador({
  esGestor: sesion.esGestor, montaAtender: sesion.montaAtender, escalonAtender: sesion.escalonAtender,
}).map(...)
```
Con su razón de ser escrita al lado:
> *«Es **PURA a propósito**: se puede ejercer con una tabla de casos sin
> levantar una app ni una sesión, que es lo que la vuelve verificable.»*

### Y el freno que la casa ya pagó, para no volver a pagarlo

> **`barra-prestador.ts:46-50`** — *«Con UNA sola capacidad la tentación es que
> la tab monte un `Redirect` — y entonces el atrás del destino vuelve a la tab,
> que redirige otra vez: **el back queda en una ratonera**. …**La tab no rebota:
> la barra apunta.**»*
> **`_layout.tsx:676-687` (D-836)** — una ventana montada como ruta empujada
> **le saca la barra**: *«la persona quedaba en una ventana de la casa sin la
> casa… un cuarto que perdió el pasillo.»*

⇒ **Un vertical de refugio NO necesita bifurcar la app ni empujar rutas: declara
su pantalla como `Tabs.Screen` fija y agrega su condición a `CapacidadDeBarra`.**
*Las dos formas que parecen más simples —`Tabs.Screen` condicional y ruta
empujada— ya se probaron y las dos rompieron el back.*

⚠️ **NO MEDIDO:** de dónde sale `sesion.esGestor` / `montaAtender` (el
resolvedor de capacidad), y si hoy hay una señal que distinga a un refugio de
otro prestador. **Es el único dato que faltaría para dimensionar el eje nuevo, y
no lo abro porque `apps/prestador` no es mi territorio en esta sesión.**

---

## RESUMEN DE LOS SEIS VEREDICTOS

| # | Pregunta | Veredicto en una línea |
|---|---|---|
| ① | ¿Mascota sin familia? | **No** — `familia_id` NOT NULL; **pero «familia» ya admite dueño no-humano y `virtual_refugio` ya es valor legal sin escritores** |
| ② | ¿Usuario sin mascota? | **Sí** — 152 de 170 hoy; **lo que no existe es el camino: el guard ramifica por `tiene_familia` y del onboarding sólo se sale creando una mascota** |
| ③ | ¿Mensajería cuenta↔cuenta? | **No, y el diseño la excluye** — §6.4.7: *«sin servicio activo, no hay canal»*, y adopción no tiene servicio |
| ④ | ¿Destinatario ≠ comprador? | **Sí, de punta a punta** — snapshot propio en `pedidos`, RPC sin validación contra el comprador, campo receptor en el checkout. **Corrige la letra** |
| ⑤ | ¿Recurrente con destinatario que desaparece? | **Sí, ya construido** — el memorial cancela, acredita y calla; `/cuenta/recurrentes` existe y ya nombra al padrinazgo como su próximo caso |
| ⑥ | ¿Tabs por tipo de cuenta sin bifurcar? | **Sí, ya se hace** — declaración estática + `items` derivado de capacidad, condicional en dos ejes |

## LO QUE ESTA PISTA NO MIDIÓ (declarado, no omitido)

1. **Nada en bundle corriendo** — ninguna de las seis. Exige sesiones con datos
   que esta pista no puede crear.
2. **El resolvedor de capacidad del prestador** (⑥) — territorio ajeno.
3. **Si `es_donacion=true` puede apuntar a un refugio concreto** (④) — no hay
   columna de refugio en `pedido_item_destinos`; el hueco del padrinazgo vive
   ahí, no en la entrega.
4. Las dos del lote 1: el `WITH CHECK` de `mascotas_update_familia`, y si un
   `familia_id` ajeno es alcanzable por un no-miembro.

## LO QUE LA LETRA DEJÓ ABIERTO (anotado, no resuelto)

- **Qué ABRE el canal cuando no hay servicio** (③) — y las dos razones de
  §6.4.7 no aplican a una adopción que no cobra.
- **Si un padrinazgo pausado se puede reactivar** (⑤) — el precedente de la
  guardería dice que la asimetría se decide antes, no después.
- **Mutar la familia vs. mover la mascota** (①, lote 1).
