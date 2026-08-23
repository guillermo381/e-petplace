# ACTA DE CIERRE · MESA 104 / S103 · 22-ago-2026

> ## 🔴 LEY DE LECTURA
>
> **Todo número y SHA de este acta se re-mide contra el objeto antes de usarse.**
> Un acta registra lo que era cierto al cerrar; **el objeto sigue moviéndose**.
> Y donde este acta y el código discrepen, **gana el código** — *dos textos
> firmados que se contradicen son peores que uno equivocado: cualquiera cita el
> que le conviene y está «en regla».*
>
> **Lo que esta pista NO midió va marcado como RELATADO, con su fuente.** *Un
> acta que se apropia del trabajo ajeno pierde su valor como registro.*

**Pistas:** A (conductora · main, DB, `packages/api`, `docs/`, merges, push, OTA)
· B (`packages/ui`, jueces, sitio) · C (apps) · D (`supabase/functions/pagos-*`).

**Estado final del repo:** monorepo `main` y sitio `main` == `origin`, verificado
por SHA contra `ls-remote`. **OTA cliente y prestador publicados**, anclas leídas
del OBJETO con `update:view`, `dirty: None`.

---

## §1 · EL OBJETIVO DE LA SESIÓN — CUMPLIDO

### 🟢 EL COBRO RECURRENTE ESTÁ COMPLETO E INERTE

**El circuito entero existe:** *reloj → timbre → puerta → compuertas → débito →
webhook → actuador → **ACTO 2***. **Y el último eslabón lo recorrió el arnés de
verdad**, no en simulación.

| pieza | dónde | estado |
|---|---|---|
| el motor (selectores · desglose congelado · compuertas · `renovar_plan_cobrado`) | `20260822235000` | arnés **17/17** |
| el camino viejo que renovaba **SIN COBRAR**, cortado | `20260822236000` | ✅ |
| **el reloj** `cobrar-recurrencias` · 09:00 Guayaquil | `20260822240000` | ✅ **INERTE** |
| el actuador con **los cuatro sujetos** + el ACTO 2 de despensa | `20260822270000` | arnés VERDE |
| **la hermana `pagos-cobro-recurrente`** | `supabase/functions/` | ✅ desplegada |

**El reloj nace inerte por diseño:** el timbre lee `app_config.recurrente_vivo`
y sin esa clave devuelve `recurrente_apagado`. **El cron es el CABLE; la llave es
del founder.** *Un cable que se tiende bajo presión se tiende mal.*

**La hora, elegida y no heredada:** una hora después del aviso *(el aviso SIEMPRE
precede al cobro)* · con el día hábil por delante *(un cobro que falla a las 9 se
resuelve hoy; a las 3 de la mañana nadie lo ve)* · y sin pisar a nadie.

**Lo que el arnés probó:** evento → autenticación → sujeto reconocido → intento
**aprobado** → **ACTO 2 ejecutado**, con no-regresión del huérfano y del camino
del cliente.

🔴 **Y corrió en SUBTRANSACCIÓN QUE SE DESHACE SOLA**, porque sin eso **habría
renovado de verdad la única suscripción viva** — período movido, citas generadas,
precios reescritos y **un aviso saliendo a una familia**, desde una migración que
nadie autorizó a mover negocio (`L-406`).

**Lo que NO probó, dicho antes de que se suponga:** que se mueva un centavo · **la
rama de DESPENSA del ACTO 2** *(cero recurrencias en la base ⇒ escrita y no
ejercida)* · el aviso fuera de sombra · **la causa fina de un rechazo, que espera
la tabla de `status_detail` de Erick — cajón construido, etiqueta NO adivinada.**

### 🔴 EL ACTUADOR MULTIPROVEEDOR ESTABA MUERTO — el hallazgo más grave del día

`aplicar_evento_de_pago` declaraba `v_e record` y se lo pasaba a
`_evento_autenticado(webhook_events)`. **PostgreSQL no puede castear `record` a
un tipo compuesto nombrado** ⇒ `cannot cast type record to webhook_events`,
**en el PRIMER gate, en TODA llamada, para los dos proveedores.**

**Cómo apareció:** como un **rojo INESPERADO dentro del arnés de otra cura**. *El
arnés no encontró lo que buscaba — encontró algo peor, porque para producir su
rojo tuvo que llamar a la función de verdad.*

**Por qué nadie lo notó, medido:** las 23 huellas del actuador son del 20 y 21;
el multiproveedor nació el 22, y **los dos únicos eventos de ese día murieron
antes, en la edge, por `credencial=CLIENT`** ⇒ **el actuador roto nunca fue
llamado por un evento legítimo. No hubo síntoma porque no hubo tráfico.**

**Daño: CERO, y está medido** — todos los eventos son `sandbox`, 0 llegaron al
actuador, 0 intentos pendientes, 0 compras esperando pago. ⇒ `L-402`.

**Curado junto con la adivinanza del sujeto:** el `else` que asumía «si no es
cita, es compra» —dicotomía correcta con dos sujetos, **adivinanza que compila
con cuatro**— pasa a **verificar y nombrar** lo que encontró.

### 🔴 EL VEREDICTO DE AUTENTICACIÓN SALIÓ DEL CAMPO DE LOG

`_evento_autenticado` decidía leyendo `detalle` con `ILIKE` — **el campo de
diagnóstico donde el buzón escribe `analisis_fallo: ${String(e)}`.**
**Reproducido en SELECT puro y en LOS DOS proveedores:** un mensaje de excepción
**autenticaba** el evento.

**Severidad acotada, medida:** el mensaje solo **NO alcanza** — sin
`stoken_valido` da `false` en los cinco casos ⇒ **quien lo use ya tiene el
secreto.** *Erosión de defensa en profundidad, no puerta abierta.*

**La cura, con una asimetría que salió de medir y no de preferir:** **Nuvei se
cierra HOY sin tocar la edge** (su credencial se compone al INSERTAR y el
diagnóstico llega por UPDATE ⇒ un trigger `BEFORE INSERT` la sella y ningún
UPDATE la cambia) · **DeUna exige la columna** (su veredicto es posterior a la
consulta ⇒ ningún trigger puede sellarlo), **y hacerlo hoy fue gratis: cero
eventos DeUna.** *El requisito quedó MECÁNICO en vez de ser una nota.*

### 🔴 EL SECRETO DE DESPACHO SALIÓ DEL TEXTO DE LOS CRONES

Vivía en claro en el `command` de **cinco** jobs. **Fue al `vault`** — no a
`app_config`, que era el molde nombrado: **medido, ese destino lo leen los ADMIN
y `cron.job` no lo alcanza nadie por API** ⇒ habría **ensanchado** el agujero
(`L-408`).

**El control que lo prueba,** porque *«el comando cambió» no es «el cron
funciona»* y `net.http_post` es asíncrono: **HTTP 200 en cada tick, cero 401.**

🔑 **NO se rotó — es firma del founder, y va DESPUÉS.** *Sacarlo del texto reduce
la superficie futura; sólo la rotación cierra el pasado* (`L-409`).

---

## §2 · LO DEMÁS QUE CERRÓ

**De esta pista, medido:** el retiro de `destacada` **en cinco piezas** (prop,
guard, dos lápidas, `R61` con sus pruebas — la quinta la encontró **medir el
residuo**: una lápida que describía en futuro un acto que era su propio commit) ·
los merges de las tres pistas en la secuencia que B dejó escrita · dos OTA con
**manifiesto medido por ancestría y control negativo** · **dieciséis lecciones al
canon** (`L-394` → `L-409`), casi todas con crédito ajeno · el borrado del fixture
que fabricaba un **caso de soporte falso** en `reverso_fallido`.

**RELATADO por sus pistas, no medido por A:**

- **Las páginas legales corregidas y publicadas** · **los tres borradores
  legales** — S103-B, en el sitio. *A sí midió su gate: ver §4.*
- **El ciclo de cuenta censado con `P15` firmada**, más **cambiar clave** y
  **`/recuperar`** en el cliente — censo de A, construcción de C, con su gate en
  aparato (4 de 5 pasos; el camino feliz no corrió porque la cuenta logueada es
  la que el founder usa para caminar los gates).
- **El riel de DeUna a una llave** — S103-D: actuador multiproveedor, wrapper,
  contrato, pantalla y buzón contra el gate nuevo. **Cero desplegado**, y lo que
  falta no depende de D.

---

## §3 · LO QUE NO SE HIZO, SIN ADORNOS

| | |
|---|---|
| **no se movió un centavo** | el proveedor no participó en ningún arnés |
| **la puerta del recurrente no se corrió con el secreto real** | hoy cobraría cero (0 recurrencias, 0 planes vencidos), pero **es un acto que dispara el camino de pago y necesita firma** — regla ③ de encendido |
| **el aviso sigue en sombra** | y sin monto ni medio: sacarlo anunciaría un cobro que todavía no puede ocurrir |
| **la rama de despensa del ACTO 2 nunca corrió** | cero recurrencias en la base |
| **`saltar` y `mover` no existen** | y el aviso dejó de prometerlos (`D-884`) |
| **el plan de paseos no se puede cobrar** | no registra medio autorizado (`D-886`) |
| **el aplicador del barrido de DeUna** | 🔴 `D-887` |
| **el reverso mismo-día** | 🔴 `D-888` — **sin dueño** |

---

## §4 · 🔑 LAS TRES DEUDAS EXTERNAS — con dueño y fecha

> **Se escriben acá porque ninguna se resuelve escribiendo código, y las tres
> bloquean algo con fecha.**

### ① LOS DOCUMENTOS LEGALES · founder + abogado · **fin de la semana próxima**

**Medido corriendo `verify:borradores` en el sitio:**

```
26 de letra firmada · 10 medidas · 17 esperando (13 al abogado, 4 a una firma del founder)
```

⚠️ **Corrección al número que circulaba: son CUATRO firmas del founder, no una.**
Y **tres de las cuatro son la MISMA decisión** —¿existe un canal dedicado de
contacto y cómo se llama?— apareciendo en `aviso-ia §contacto-ia`,
`privacidad-app §contacto-privacidad` y `terminos-plataforma §contacto`. **La
cuarta es P20 · custodia y responsabilidad durante el servicio, RESERVADA y sin
letra**, y va junto al capítulo de responsabilidad.

**No se publican hasta la firma del abogado.**

### ② LAS PREGUNTAS AL CONTADOR · founder · **una sola sentada**

Las cuatro acumuladas más lo que S103 sumó:

1. **El régimen legal del saldo en Ecuador** — ¿dinero electrónico, custodia,
   prescripción?
2. **Los plazos de retención.**
3. 🔴 **La figura del agente de recaudación y la factura emitida a nombre del
   prestador** — *decide si la plata cobrada es ingreso nuestro o dinero ajeno en
   tránsito.*

> **③ tiene que salir de la MISMA sentada que ①**, o **el documento publicado y
> la contabilidad se contradicen desde el día uno.** *Y una contradicción entre
> lo que un T&C promete y lo que los libros registran no se arregla después: se
> arrastra.*

### ③ LA RESPUESTA DE DEUNA · Erick / soporte · **esperada el lunes**

**`pointOfSale` + logo oficial + manual de marca + el alta del webhook.**
**Es la única llave del riel entero** — sin ella no hay solicitud, no hay buzón
dado de alta y no hay nada que probar contra el proveedor.

---

## §5 · 🔑 LAS LLAVES QUE QUEDAN DEL FOUNDER — en un solo lugar

1. **La rotación del secreto de despacho.** *Va DESPUÉS de la cura, que ya está
   hecha; rotar antes habría reescrito el problema con otro valor.*
2. **Las tres claves de `app_config`** — `recurrente_vivo` ·
   `url_cobro_recurrente` · `secreto_despacho`. **Medidas ausentes las tres.**
3. **Encender el cron del recurrente.** *Es una consecuencia de (2), no un acto
   aparte: el reloj ya existe y está inerte.*
4. **El mapa de remitentes de correo.**
5. **El acceso al dashboard y al DNS** para las mediciones del domingo.

> ⚠️ **El orden de (1)-(3) no es indiferente:** las claves van ÚLTIMAS. *Todo
> sabe aplicar y falta la llave; al revés habría sido cobrar sin saber aplicar.*

---

## §6 · LA NOTA DE MÉTODO, y es lo más útil que deja la jornada

**Los hallazgos graves del día no los encontró ningún gate.** Los encontró
**recorrer el circuito**: un inventario, un censo, un grep con control, un cruce
entre pistas, y **un arnés que buscaba otra cosa**.

De ahí salieron las dos prácticas que quedan escritas:

- **`P-CIRCUITO`** — al cerrar un frente se recorre de punta a punta declarando
  **pieza por pieza si está ALCANZABLE DESDE AFUERA**, no si existe ni si pasa
  sus tests. **Y lo corre OTRA pista** (`L-398`): *la ignorancia del recorredor
  es el instrumento — el que construyó recuerda haber conectado cada cosa, y ese
  recuerdo se lee igual que una medición.*
- **Su corrección, de esta sesión:** *no basta «¿está alcanzable desde afuera?» —
  hace falta **«¿corrió alguna vez?»***. Son dos preguntas, y el actuador muerto
  demostró que una sola no alcanza: estaba **bien escrito, bien leído y
  alcanzable**, y nunca había corrido.

**Y las correcciones propias de la jornada, contadas y no escondidas:** cinco
pistas se corrigieron a sí mismas midiendo, incluida esta conductora —una `🔴`
inflada por no medir su cota, un conteo de cuatro que eran cinco, dos supuestos
de columna falsados por el arnés, y un `cd` que se llevó una medición al repo
equivocado por quinta vez en el día—.

> *Un canon donde sólo se anotan los errores ajenos se vuelve un expediente, y
> ahí nadie frena a nadie.*
