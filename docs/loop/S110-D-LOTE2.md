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
