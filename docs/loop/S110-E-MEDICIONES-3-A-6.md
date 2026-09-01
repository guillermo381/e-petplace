# S110-E · LAS MEDICIONES ③ A ⑥ DEL §12 DE `LETRA_ADOPCION`

> **Pista E** (mediciones ③–⑥; ① y ② son de D). **Sólo lectura: cero DDL, cero
> seeds, cero migraciones.** Depositado en S111 desde `pista/s111-e`, base
> `9443da56`.
>
> **Contra qué midió** — declarado por medición, jamás global: el **OBJETO**
> (DB linkeada `zyltipqscdsdsxnjclhp`, vía `db query --linked`) · el **REPO**
> (`main` en `202ff494`, **re-verificado contra `9443da56`** tras las tres
> migraciones de S110-A) · el **BUNDLE** (`apps/*/dist`) donde se declara.
>
> ⚠️ **Hora de la medición: 31-ago/01-sep-2026.** *Un freno de puerta declara
> contra qué midió **y cuándo** — este documento se cobró las dos formas de
> fallar, y están escritas abajo sin tapar.*

---

## ⚠️ FRENO DE PUERTA — SE DECLARÓ FALSO Y ESTÁ CORREGIDO ACÁ

**Durante la primera mitad de la sesión, esta pista Y la pista D declararon que
`docs/LETRA_ADOPCION.md` v1.0 NO EXISTÍA.** Era falso.

```
ramas donde EXISTE docs/LETRA_ADOPCION.md:  refs/heads/pista/s110-a   (1 hit de 140 refs)
commit: 7d76380f · 2026-09-01 00:41:44 -0500
        "S110-A · registra LETRA_ADOPCION v1.0 y archiva la de padrinazgo, en el mismo acto"
CONTROL + (LETRA_ADOPCION_PADRINAZGO.md en main) -> 1
CONTROL - (LETRA_ZZZ_INEXISTENTE.md)             -> 0
```

**Las dos causas fueron distintas, y por eso la lección es doble:**

- **E (esta pista): cero de INSTRUMENTO.** El `find` de apertura terminaba en
  `| head -20` y la salida se truncó — el archivo estaba abajo del corte.
  **Un cero que era un `head`.**
- **D: cero de RELOJ.** Su medición corrió 00:23:59; el commit es 00:41:44.
  **Su cero era verdadero cuando lo midió y se puso viejo dieciocho minutos
  después** (`L-166`, no `L-459`).

🔴 **Y el modo de falla que importa: los dos ceros coincidieron, y dos ceros que
coinciden se leen como confirmación.** La medición sobrevivió sólo porque los
seis enunciados del §12 viajaban en los mandatos de las pistas — **si hubieran
diferido en una palabra, seis mediciones habrían contestado preguntas que nadie
hizo.** Los seis puntos del §12 real coinciden con los seis enunciados; ninguna
medición se cayó y todas subieron de confianza.

---

# ③ ¿HAY MENSAJERÍA ENTRE DOS CUENTAS HOY?

## VEREDICTO

> **NO existe, y no es «falta construirla»: el diseño declarado la EXCLUYE para
> este caso.** La única tabla de mensajes es de soporte (usuario↔admin), tiene
> cero filas, cero wrappers y cero pantallas. **Y §6.4.7 dice literal que sin
> servicio activo no hay canal — refugio y adoptante no comparten cita.**
> ⇒ La conversación de §5 es superficie nueva **y es letra entera, no media**:
> hay que decidir qué activa el canal cuando no hay servicio.

### a) La única candidata — medido contra el OBJETO

Censo por forma, con control positivo (`^cita`, que dio `cita_desglose`):

```
ticket_mensajes: id | ticket_id | autor_id | es_interno | mensaje | archivos | created_at
FKs: ticket_mensajes.autor_id -> profiles.id | ticket_mensajes.ticket_id -> tickets_soporte.id
     tickets_soporte.user_id  -> profiles.id
filas: ticket_mensajes=0   tickets_soporte=0
```

### b) El predicado que decide — dueño-del-ticket o admin, no hay tercera cuenta

```
tm_owner   [SELECT] USING (((NOT es_interno) AND (ticket_id IN ( SELECT tickets_soporte.id
             FROM tickets_soporte WHERE (tickets_soporte.user_id = auth.uid())))) OR is_admin())
tickets_owner [ALL] USING ((user_id = auth.uid()) OR is_admin())
tm_insert [INSERT] WITH CHECK ((autor_id = auth.uid()) AND ((NOT es_interno) OR is_admin()))
```

**No hay forma de que una segunda cuenta de negocio entre a ese hilo.**

### c) Cero consumidores — medido contra el REPO

```
wrappers de mensajeria en packages/api/src/wrappers:  0 de 110   [CONTROL +: 4 con "cita"]
rutas de conversacion en apps/*/src/app:              0 de 174   [CONTROL +: 91 cliente + 83 prestador]
referencias a ticket_mensajes en codigo:              packages/api/src/database.types.ts  <- generado
```

### d) Lo más cercano que existe NO es un canal

`mensaje_familia` es una **columna del cierre de la atención**
(`p_mensaje_familia` en `paseo.ts`, `grooming-atencion.ts`, `adiestramiento-*`):
unidireccional, dentro del acto, sin hilo ni respuesta.

### e) Y la letra lo excluye — `PORTAL_PRESTADOR.md:1504`

> *«**Activación con servicio.** Solo se activa cuando hay cita / servicio /
> contrato activo entre prestador y familia. **Sin servicio activo, no hay
> canal.**»*

⇒ **Construir §6.4.7 tal como está escrito NO habilita la conversación de §5.**

---

# ④ ¿EL MOTOR DE ENTREGA ADMITE UN DESTINATARIO DISTINTO DEL COMPRADOR?

## VEREDICTO

> **ADMITE, pero NUNCA lo ejerció — y por eso ACOTA a la letra, no la corrige.**
> `pedidos` guarda la entrega como snapshot propio, sin FK al comprador; la RPC
> recibe el destinatario como parámetro libre y **no lo valida contra quien
> paga**; y el checkout ya tiene el campo. **Pero ningún pedido con destinatario
> distinto llegó nunca a despacharse.** ⇒ §8 (*«nunca despachó a un tercero»*)
> es **literalmente correcta**. Lo genuinamente nuevo **no es el campo del
> receptor: es «la coordina el refugio»**, y ahí falta un ACTOR, no una columna.

### a) Columna propia, cero FK al comprador — medido contra el OBJETO

```
entrega_nombre_receptor:text | entrega_telefono:text | entrega_direccion:text | entrega_ciudad:text
| entrega_sector:text | entrega_referencias:text | entrega_lat | entrega_lon | entrega_instrucciones:text

TODAS las FK de pedidos (control): compra_id -> compras | cuenta_comercial_id -> cuentas_comerciales
  | envio_regla_id | envio_servicio | envio_tipo_regla | envio_transportista | estado
FK a direcciones_guardadas en TODA la base: guarderia_suscripciones.direccion_id   <- otro subsistema
```

### b) El body no valida el receptor contra el comprador (regla 40)

Entra como jsonb libre; lo que sí gatea es el **actor** y la **mascota**:

```sql
v_uid uuid := COALESCE(p_user_id, auth.uid());
IF p_user_id IS NOT NULL AND auth.uid() IS NOT NULL AND NOT is_admin() THEN
  RAISE EXCEPTION 'no_podes_pedir_a_nombre_de_otro'
  p_entrega->>'nombre_receptor', p_entrega->>'telefono', p_entrega->>'direccion', ...
```

Y la superficie ya lo pide — `(tabs)/despensa/checkout.tsx` (control + 26 / − 0):
`161: const [receptor, setReceptor]` · `429: if (receptor.trim() === '') return t('despensa.faltaReceptor')`.

### c) 🔴 PERO NUNCA SE EJERCIÓ — la medición que separa capacidad de historia

```
87 pedidos con receptor declarado · 16 avanzaron mas alla del pago
   entregado=3 | hacia_destino=1 | en_reparto=1 | documentado=3 | liberado_preparacion=8
de los 16 que avanzaron, con compra_id:  0 de 16
sus receptores: "Gate S97" · "E2E real" · "Siembra S99 (borrable)" · "Guillermo (gate pura)"
```

**Sin compra no hubo pago, y sin pago no hubo despacho: los que avanzaron son
fixtures de gate.** *(D llegó a lo mismo por otra vía: 26 con receptor distinto,
0 pagados. Dos caminos, misma conclusión.)*

### d) 🔴 LO QUE SÍ ES NUEVO, y es más duro que una columna faltante

§8 dice también *«La coordina el refugio»*. Medido:

```
cols de coordinacion/refugio/tercero en `pedidos`:   NINGUNA
cat_transiciones_pedido.actor:  admin | cliente | repartidor | sistema | vendedor
```

**El refugio no existe como ACTOR capaz de mover un pedido.** No falta un campo:
falta un actor en el catálogo que gobierna quién empuja la máquina de estados.
*La casa ya tiene cicatriz de la variante vecina (S105: «un actor que el catálogo
declara válido y la puerta no acepta es un callejón»); acá es el paso anterior —
ni siquiera está declarado.*

### e) 🔴 Y LA BARRERA DURA DEL BLOQUE — pero es de §7, no de §6

```
chk_destino_excluyente: CHECK ((NOT (es_donacion AND (mascota_id IS NOT NULL))))
body: RAISE EXCEPTION 'destino_contradictorio: un item no puede ser donacion Y de una mascota'
pedido_item_destinos: 38 filas (donaciones: 3)
```

**§7 define la donación con un campo de destino de tres valores, y el primero es
«una mascota en adopción».** Hoy esa combinación es **inexpresable por
constraint**. No se abre agregando una columna: se abre enmendando un CHECK que
declara contradictorio lo que la figura necesita.

⚠️ **NO aplica al padrinazgo** (§6): *«La canasta es del REFUGIO, no de cada
mascota… el saco llega al refugio donde vive Luna, y las fotos que recibís son de
Luna»* — el vínculo con la mascota es para las FOTOS, no para el destino.

Y §7 ya lo había anticipado en prosa; **esta medición le pone el artefacto**:

> *«Quien implemente el padrinazgo o la donación con destino reusando la donación
> de la despensa tal cual va a heredar “sin destino elegible”, que es precisamente
> lo que estas figuras no pueden ser.»*

---

# ⑤ ¿EL COBRO RECURRENTE ADMITE UN SUJETO CUYO DESTINATARIO PUEDE DESAPARECER?

## VEREDICTO

> **SÍ, y el caso exacto ya corre: cuando una mascota muere, un trigger cancela
> sus suscripciones con `motivo_cancelacion='memorial'`, acredita y calla.** La
> puerta de Cuenta existe (`/cuenta/recurrentes`). **Pero faltan DOS piezas, no
> una:** el vocabulario de `tipo_servicio` está cerrado a dos valores y hay que
> abrirlo — **costo de v1, no diferido** — y **sólo 2 de los 6 escritores del
> estado dejan dicho POR QUÉ se apagó**, que es justo lo que §6 exige.

### a) El estado y el motivo existen — medido contra el OBJETO

```
suscripciones_servicio_estado_valido: CHECK (estado = ANY (ARRAY['pendiente','activa','pausada','cancelada','vencida']))
columnas: ... | cancelado_en | motivo_cancelacion:text | auto_renovar:boolean | ...
motivo_cancelacion NO tiene CHECK — texto libre
estados vivos: cancelada=3 | activa=3     motivos vivos: (null) | 'dato de prueba · verify-doble-toque'
```

### b) Los escritores — medido por BODY (regla 40), con el regex validado antes de usar

**Controles del instrumento, corridos ANTES del conteo** (`estado` es prefijo de
`estado_pago`, y ese era el riesgo real):

```
CTRL_1  \mestado\M pega en "set estado ="            -> true
CTRL_2  \mestado\M NO pega en "set estado_pago ="    -> false
CTRL_3  no pega en UPDATE de OTRA tabla              -> false
```

```
escritores del ESTADO de la suscripcion: 6
  _trg_mascotas_memorial_planes    motivo=True     <- motivo EXTERNO: la mascota muere
  mover_sujeto_por_reverso         motivo=True     <- parametrizado (p_motivo)
  cerrar_y_renovar_planes          motivo=False
  confirmar_pago_plan_paseo        motivo=False
  expirar_planes_sin_pago          motivo=False
  vencer_links_mensuales           motivo=False
```

🔴 **`motivo_cancelacion` es columna de primera clase que sólo 2 de 6 escritores
completan.** Cuatro caminos apagan una recurrencia **sin dejar dicho por qué** —
y §6 exige **tres motivos distintos**: *«Si el ahijado es adoptado, fallece o el
refugio se va, el cobro recurrente se detiene solo»*. *El día que el destinatario
desaparezca, «por qué se apagó» es exactamente la pregunta que alguien le va a
hacer a esa fila, y hoy cuatro de seis no la contestan.*

### c) 🔴 EL COSTO QUE NO ESTABA VISTO — y es de v1

```
suscripciones_servicio_tipo_valido: CHECK ((tipo_servicio = ANY (ARRAY['guarderia_mensual'::text, 'paseo_mensual'::text])))
```

**Cerrado a dos valores: un padrinazgo recurrente no entra sin enmendarlo.** Y es
**v1**, medido contra la letra: §1 lo define como *«Compra **RECURRENTE** de
productos, entregada al refugio»*, y §11 excluye *«Padrinazgo en dinero»* — **no
la recurrencia**.

### d) La superficie existe y se anticipó a esto — medido contra el REPO

`apps/cliente/src/app/(tabs)/cuenta/recurrentes.tsx` (22 KB), cuyo encabezado
dice en su línea 46 que *«el padrinazgo aterriza acá agregando un lector y un
caso»*, y que declara su asimetría a la vista: *«El paseo **se puede volver a
encender**… La guardería **NO**»*. **Coincide con §6** (*«Su puerta de
cancelación es la de la casa… El padrinazgo no construye la suya»*).

⚠️ **Con (c), esa frase queda corta: son un lector, un caso Y la enmienda del
CHECK** — algo que la pantalla no podía prever cuando se escribió.

---

# ⑥ ¿LA APP DE NEGOCIOS ADMITE TABS POR TIPO DE CUENTA SIN BIFURCAR LA APP?

## VEREDICTO

> **SÍ, y ya lo hace.** Las `Tabs.Screen` se declaran **todas, siempre**; quién
> las ve lo decide una función **pura** sobre la capacidad de la cuenta, ya
> condicional en dos ejes. **El eje NO es «tipo de cuenta»: es rol + capacidad.**
> Sumar el de refugio son **tres lugares que el compilador obliga**.

### a) Ninguna `Tabs.Screen` es condicional — medido contra el REPO

```
663: <Tabs.Screen name="index" />      671: <Tabs.Screen name="atender" />
664: <Tabs.Screen name="mascotas" />   672: <Tabs.Screen name="negocio" />
condicionales cerca de Tabs.Screen:  NINGUNA
666:  // ...un `Tabs.Screen` condicional deja la ruta inexistente
```

*El freno ya está pagado y escrito en el propio archivo.*

### b) La modulación vive en una función pura, con sus ejes declarados

```ts
export interface CapacidadDeBarra {
  esGestor: boolean;      /** Rol `dueño` o `administrador` — abre NEGOCIO. */
  montaAtender: boolean;  /** El **Y** de §2.1bis: rol de mostrador Y capacidad — abre ATENDER. */
export function ordenTabsPrestador(c: CapacidadDeBarra): ClaveTabPrestador[] {
  return ['index','mascotas', ...(c.montaAtender ? ['atender'] : []), ...(c.esGestor ? ['negocio'] : []), 'cuenta'];
```

### c) Contra el BUNDLE — viaja horneada, y sólo donde corresponde

```
ordenTabsPrestador en apps/prestador/dist:  4     [CONTROL +: "mascotas" 24 · CONTROL -: 0]
ordenTabsPrestador en apps/cliente/dist:    0     <- correcto: es del prestador
```

### d) El costo exacto de sumar el eje de refugio

`ClaveTabPrestador` es un tipo **cerrado a propósito** de cinco claves —
*«la tab nueva tiene que entrar por acá y contestar dónde va»* — y
`KEY_ETIQUETA_TAB` lo ata con `satisfies Record<ClaveTabPrestador, string>`.
**Son tres lugares y ninguno se puede olvidar en silencio.**

⚠️ §9 pide **tres tabs** (Home · Mascotas · Cuenta) para el publicador. Dos de
esas claves ya existen (`index`, `mascotas`, `cuenta`); **lo que la letra llama
«Home de adopción» es contenido distinto en una clave existente, no una clave
nueva.** *Se anota como observación de la medición, no como decisión de diseño.*

---

## LOS CINCO CEROS DE INSTRUMENTO DE ESTA PISTA — declarados, no tapados

**Ninguno lo cazó el `grep`. Los cinco los cazó exigirle al instrumento un
resultado que ya conocía.**

| # | el cero falso | la causa | cómo se cazó |
|---|---|---|---|
| 1 | «0 wrappers de mensajería» | miraba `packages/api/src/` — los wrappers viven en `wrappers/` | control + («cita») dio 0 y debía dar >0 |
| 2 | «0 rutas de conversación» | miraba `apps/*/app` — las rutas viven en `src/app` | el control de rutas totales dio 0 |
| 3 | «el checkout no pide receptor» | miraba `despensa/checkout.tsx` — vive en `(tabs)/despensa/` | control + («entrega») dio 0 |
| 4 | «`LETRA_ADOPCION.md` no existe» | el `find` terminaba en `\| head -20` | ir a verificar lo heredado |
| 5 | «los 16 tenían receptor de tercero» | join a NULL: `IS DISTINCT FROM NULL` es true siempre | comprador salió `(sin nombre)` en las 16 |

🔴 **El quinto es el más peligroso y por eso va con su nombre: un `true` que era
un `NULL`.** *No dio error, no dio cero, dio la respuesta que yo esperaba — y
habría sostenido un veredicto equivocado contra la letra.*

## RE-VERIFICACIÓN AL DEPOSITAR (L-166)

Entre la medición (`202ff494`) y este depósito (`9443da56`), **A aplicó tres
migraciones y tocó `packages/api`**. Re-verificado todo lo que podía moverse:

```
V3 tablas de mensajeria      -> ticket_mensajes                     (sin cambio)
V3 wrappers de mensajeria    -> 0 de 110 (eran 0 de 109)            [CONTROL +: 4 con "cita"]
V4 chk_destino_excluyente    -> CHECK ((NOT (es_donacion AND (mascota_id IS NOT NULL))))
V4 actores de pedido         -> admin | cliente | repartidor | sistema | vendedor
V5 tipo_servicio_valido      -> CHECK (tipo_servicio = ANY (ARRAY['guarderia_mensual','paseo_mensual']))
V5 escritores                -> 6 escriben estado · 2 escriben motivo
V6 ordenTabsPrestador        -> sin cambio
```

**Los cuatro veredictos siguen en pie.**

---

## LO QUE ESTA PISTA NO MIDIÓ — declarado, no omitido

- **① y ②** son de D (`S110-D-LOTE1.md`).
- **El 5 % a la fundación** (§1) — no lo medí: espera al contador y está fuera de
  construcción por la letra de S111.
- **`solicitudes_adopcion`, `adopcion_seguimiento`, `mascotas_adopcion`,
  `refugios`** — aparecieron como control positivo de otro censo. **No medí filas,
  escritores ni RLS.** No es mi lote; se pasa crudo. *(Cruza con `D-991`: las
  tablas legado de adopción no se construyen ni se DROPean.)*
- **La superficie de §5** (estados de la solicitud, el reloj de 5 días) — la
  medición ③ dice que el canal no existe; **no medí qué haría falta para
  construirlo**, que es diseño y no censo.
