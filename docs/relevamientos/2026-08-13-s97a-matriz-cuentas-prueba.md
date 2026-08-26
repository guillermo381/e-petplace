# S97-A · Matriz de cuentas de prueba (13-ago-2026)

**Orden de mesa de la reapertura.** Todos los correos son
`guillo381+<sufijo>@gmail.com`, en minúsculas. ~~**La clave es una sola para
todas**~~ **← FALSO, medido el 26-ago: 17 de 42. Ver la sección de ESTADO REAL, arriba.** La custodia el founder y **NO vive en este repo** — ni acá, ni en un
seed, ni en un comentario, ni en un acta (condición dura de la orden). Las
cuentas se crean por la **API de administración**, jamás por SQL commiteado.

Estas cuentas se suman al censo de borrado de **D-766** (tres cuentas
vendedoras de prueba + la despensa de `duenotodo`).

---

# ☠️ RETRACTADO — la primera versión de esta sección estaba MAL (26-ago-2026)

> **Lo que decía y NO es cierto:** que **17 de 42** cuentas entraban con la
> clave compartida, y que **«el equipo `vet*` ENTERO rebota mientras el `ser*`
> ENTERO entra»**, con la conclusión de que *«esa asimetría no es azar»*.
>
> **Era azar exactamente.**

## Qué pasó, porque el modo de falla vale más que el número

El censo corrió **42 logins seguidos, sin pausa**. Supabase los limitó por
tasa, y **los `429` se leyeron como «esta cuenta no tiene la clave»**. El
instrumento medía `ok / no-ok` y **tiraba el `status`**, así que no podía
distinguir *«no tiene la clave»* de *«no me dejaron preguntar»*.

**La prueba de que era eso, y es concluyente:** dos corridas separadas por
minutos dieron **conjuntos distintos** — `vet2`, `vet4`, `vetadmin` y `vetrece`
pasaron de ❌ a ✅, y `seradmin`, `serrece`, `test2`, `test3` de ✅ a ❌. *Un
estado de claves no se reorganiza solo entre dos corridas.* Con **3,5 s de
espaciado**, el resultado es estable.

> 🔴 **Y esto se cae con ella: la acusación a la cura ① de S97-A.** Se escribió
> que su afirmación *«`vet2` → la compartida ✅»* era falsa hoy. **`vet2` entra.
> La afirmación de S97 estaba bien y la marqué mal.**

**Lo único que sobrevive del hallazgo original**, porque se midió aislado y no
en tanda: **`guillo381+7@gmail.com` rebota de verdad** — es la cuenta que hizo
fallar la primera corrida del borde de §4.

---

# ✅ ESTADO REAL DE LAS CLAVES — medido con espaciado el 26-ago-2026

**Instrumento:** `scripts/unificar-claves-prueba.mjs` (modo medición). Corre el
login real de cada cuenta **con 3,5 s entre intentos**, **guarda el `status` de
cada error** y **aborta si aparece un solo `429`** — porque una medición con un
rate limit adentro no es una medición.

**Antes de unificar: entran 21 · clave distinta 20 · correo sin confirmar 1.**

🔴 **Y el `status` reveló algo que el booleano escondía:** `+test1` no rebota
por la clave sino por **`Email not confirmed`**. *Cambiarle la clave lo habría
dejado «unificado» y sin poder entrar igual, y el reporte habría dicho que se
arregló.*

## El patrón real, y es aburrido — que es lo que lo vuelve creíble

**Las cuentas que S97 creó o reseteó tienen la clave compartida; las que la
preceden y no estaban en su lista, no.** El lado `vet` está **partido**
(`vet2`, `vet4`, `vetadmin`, `vetrece` entran; `vet1`, `vet3` no), igual que
todo lo demás.

*Eso ya lo decía el CUERPO de este documento, caso por caso. Lo que engañaba
era su ENCABEZADO, que prometía un universal.* ⇒ **`D-937` sigue siendo real y
mucho más chica de lo que su primera versión dijo.**

## ✅ UNIFICADAS — 26-ago-2026, firma del founder

Se corrió `scripts/unificar-claves-prueba.mjs --aplicar` sobre **las 21 que
rebotaban**: `+1 +2 +20 +3 +4 +5 +6 +7 +9 +cuatro +nuevotest2 +p1 +s87prof
+s87recep +s88admin +s88rolpuro +vendedorpuro +vet1 +vet3 +wizard +test1`.

**Y la verificación es la parte que importa: se re-corrió EL MISMO instrumento
después.**

> ### **DESPUÉS → entran 42/42.**

*No se reporta «se ejecutó sin errores». Un `updateUser` que devuelve 200 prueba
que la API aceptó la orden, no que la persona pueda entrar* — y el episodio de
esta misma jornada muestra por qué la diferencia importa.

## LAS DOS COLUMNAS, al 26-ago-2026

| conjunto | clave unificada | login verificado |
|---|---|---|
| **las 42 cuentas `guillo381+*` vivas** | ✅ | **26-ago-2026** · login real con 3,5 s de espaciado |

**Cómo se rehace este censo** (no de memoria, no de este documento):

```
node scripts/unificar-claves-prueba.mjs            # mide y reporta, NO toca
node scripts/unificar-claves-prueba.mjs --aplicar  # mide, unifica, re-mide
```

⚠️ **El modo medición aborta si aparece un solo `429`.** *Una medición con un
rate limit adentro no es una medición, y esa lección costó un hallazgo falso en
el canon.*

⚠️ **Esta tabla envejece.** Lo único que vale es correr el instrumento; la fecha
está para que se vea cuánto hace que nadie lo hizo.

---

## Negocios (4 dueños, 4 usuarios distintos — «una persona, una cuenta comercial»)

| sufijo | oficios | reparto |
|---|---|---|
| `duenovet` | médicos | — |
| `duenoser` | paseo · grooming · adiestramiento | — |
| `duenodes` | despensa | a domicilio |
| `duenotodo` | médicos + servicios + despensa | a domicilio |

RUC: inventados con **forma válida** (`^\d{13}$` medido en `cat_paises.EC` —
el alta valida máscara, no dígito verificador), marcados como prueba,
**jamás `9999999999999`** (ya tomado por la Despensa de Pruebas).

## Personas

| sufijo | vínculo | forma |
|---|---|---|
| `vet1` `vet2` | miembros de `duenovet` | chips médicos |
| `vetrece` | miembro de `duenovet` | activo, no titular, cero chips |
| `vetadmin` | miembro de `duenovet` | rol `administrador` **directo en base** |
| `ser1` `ser2` | miembros de `duenoser` | chips no médicos |
| `serrece` `seradmin` | miembros de `duenoser` | ídem que sus gemelos |
| ~~`todovende`~~ | ~~miembro de `duenotodo`~~ | **NO SE SIEMBRA** — freno de la orden ejecutado: el caso empleado-vendedor YA EXISTE medido (`guillo381+nuevotest2@gmail.com`: miembro activo de Satori —5 oficios activos— con `seller_productos` activo vía su cuenta propia, la forma que D-783 midió) |
| `desrepartidor` | miembro de `duenodes` | rol repartidor, con documento y código |

**Nota de los `*admin`:** el flag `administrador` se pone **directo en base a
propósito** — la pantalla de equipo no lo ofrece (`equipo.tsx:1024`; motor
D-660 construido, puerta sin lámina — S74: solo el titular nombra). Sirven
para medir en la caminata qué puede hacer un administrador que un miembro
común no pueda.

## Renombres ejecutados el mismo día (mismo usuario, misma cuenta, mismas siembras)

| viejo | nuevo | verificación |
|---|---|---|
| `vendedor.puro@e-petplace.com` | `guillo381+vendedorpuro@gmail.com` | tres lugares (auth.users · identities · profiles) · Tienda Pura `61a28501` viva y `activa` |
| `nuevo_test2@e-petplace.com` | `guillo381+nuevotest2@gmail.com` | tres lugares · 1 sesión viva y 1 refresh token no revocado DESPUÉS del cambio (la sesión del teléfono del founder sobrevive según la base; la prueba final es el refresh del aparato) |
| `demo-vet@epetplace.dev` | `guillo381+demovet@gmail.com` | tres lugares · Clínica Aurora `activa` intacta · **clave reseteada a la del keychain y LOGIN REAL verificado** (destrabó el censo de D) |

## LA SIEMBRA EJECUTADA (13-ago — Admin API + puertas reales del motor)

**11 usuarios creados por Admin API** (clave unificada del keychain, jamás
en el repo), y los negocios por sus puertas (`invitar_prestador` →
`aceptar_invitacion_pendiente_login` → `activar_prestador` ·
`crear_cuenta_comercial_inicial` · `otorgar_rol_vendedor` · reparto por
`definir_*` · catálogo por `proponer_producto_canonico`/`proponer_sku_vendedor`/
`publicar_oferta_sku` · escalera real `picking → empacar → factura →
despachar`):

- `duenovet` → **Clinica S97 (borrable)**, RUC `1799700001001`, oficios consulta_general + vacunacion, título de prueba aprobado (siembra), ACTIVA.
- `duenoser` → **Servicios S97 (borrable)**, RUC `1799700002001`, oficios paseo + grooming (3 tallas) + adiestramiento, ACTIVA.
- `duenodes` → **Despensa S97 (borrable)**, RUC `1799700004001`, `seller_productos` activo, regla de envío flota propia + recurso + 2 turnos + producto DEMO-CORD-S97 con oferta publicada.
- `duenotodo` → **Todo S97 (borrable)**, RUC `1799700003001`, oficios consulta_general + paseo, `seller_productos` activo + reparto a domicilio configurado.
- `vetrece` / `serrece` → miembros activos, cero chips (recepción = el piso).
- `vetadmin` / `seradmin` → miembros activos + rol `administrador` **directo en base** (la pantalla no lo ofrece — sirven para medir qué puede un administrador que un miembro común no).
- `ser1` → chips paseo + grooming · `ser2` → chips adiestramiento + paseo.
- `desrepartidor` → atado al repartidor `DEMO-REP-S97-001` de Despensa S97, **con un envío `en_reparto` asignado HOY** (pedido real de `+8` con Zeus, escalera completa, marcado `created_by_sistema`). **Ancla verificada por el camino de la app: login real + PostgREST con su JWT → 1 fila.** «Mis entregas de hoy» es caminable.

**SEGUNDA TANDA (orden de mesa, mismo día): `vet3`/`vet4`.** Rebote medido:
los dos correos **ya existían** (28-jul). `+vet3` tiene **vínculo activo en
Clínica Los Shyris** (empleado, recepcion) — sumarlo fabricaría el mismo
borde de R1 ⇒ **FRENADO, misma clase que vet1/vet2**. `+vet4` estaba
**libre** (sin vínculos, sin familias) ⇒ **sembrado como miembro activo de
Clinica S97 con 2 chips médicos** (consulta_general + vacunacion, por las
puertas reales). ~~Su clave NO se tocó — queda a decisión de mesa.~~
**✅ CERRADO (autorización de mesa, mismo día, §6ter ejercida — se frenó y
se pidió): clave unificada con la del keychain por Admin API, login real
verificado.**

**✅ LA TERNA DE vet1/vet2/vet3 SE CIERRA SIN NINGUNA (decisión de mesa,
13-ago):** el borde de un empleado en dos negocios **no se prueba con
cuentas de prueba** — es deuda de producto con ficha propia (**D-787**) y
necesita letra antes que datos. Los tres quedan intactos.

## Agenda sembrada en Clinica S97 (para las sesiones 2 y 3 de D)

Handshake real (`crear_solicitud_autorizacion` tipo `atencion` →
`responder_solicitud_autorizacion 'autorizar'` como `+8`) y mostrador real
(`registrar_atencion_mostrador`), citas de HOY:

| hora | mascota | servicio | estado |
|---|---|---|---|
| 08:00 | Thor | consulta_general $20 | **no_show** (`marcar_no_show_cita`) |
| 09:00 | Thor | consulta_general $20 | **confirmada + llegada registrada** (`registrar_llegada`) |
| 11:30 | Zeus | vacunacion $5 | **confirmada, con cobro presencial $5 efectivo** (`registrar_cobro_presencial`) |

Tres horas distintas, tres estados distintos — la agenda de recepción tiene
cuerpo, y el cobro le da plata del día al titular/admin (sesión 3).

**🔴 FRENO EJECUTADO — `vet1`/`vet2` NO se sembraron.** El literal:
`guillo381+vet1@gmail.com` y `+vet2` ya existen (27-jul) y **son TITULARES
(`rol='dueño'`) de dos negocios ACTIVOS** — «Paseos Shyris» y «Clínica Los
Shyris» (altas de S79). Sumarles membresía en `duenovet` fabricaría el borde
de dos-negocios que R1 dejó abierto (S75). Decisión de mesa pendiente:
renombrar/retirar los Shyris, elegir otros sufijos, o aceptar el doble
vínculo a propósito.

**`+s88admin` — el brazo de plataforma APAGADO (queda admin de negocio, no
se borra).** `admin_users.activo=false` (quedan 2 admins activos); conserva
sus roles `administrador`+`recepcion` en su negocio. **El porqué:** una
cuenta de prueba con `is_admin()` tiene lectura sobre las cuentas
comerciales de TODOS los vendedores — **no sobrevive a la entrada de un
vendedor real en octubre.**

---

## 🔴 CURAS DE LA MATRIZ (S97-A, 14-ago-2026 — pedido del founder)

> ***El nombre de una cuenta de prueba es prosa que no puede mentir sobre su
> contenido.*** Misma ley que rigió todo el día para comentarios, fichas y
> letra: **una etiqueta que describe mal lo que hay adentro no es un detalle
> cosmético — es una afirmación falsa que alguien va a creer.**

### ① `vet2` — se llamaba clínica y solo paseaba

**Medido antes de curar:** `guillo381+vet2@gmail.com` = prestador propio
**«Clínica Los Shyris»**, con **un solo oficio activo: `paseo`**.

> **Literal del founder: «vet no puede ser paseo».**

| | antes | después |
|---|---|---|
| oficios activos | `paseo` | **`consulta_general` · `vacunacion`** |
| clave | **desconocida** (rebotaba el login) | **la compartida** ✅ |

⚠️ **El paseo se DESACTIVÓ, no se borró:** tenía **4 citas y 5 franjas vivas**
— *borrarlo sería destruir historia para arreglar una etiqueta.*

⚠️ **Y una discrepancia que se DECLARA en vez de curarse a ciegas:** esta
matriz dice que `vet1`/`vet2` son *«miembros de `duenovet` con chips
médicos»*, y lo medido es que **`vet2` tiene prestador PROPIO**. *Pueden
convivir las dos cosas (miembro de uno y titular de otro), así que no se toca
sin medir la membresía — se anota para que el próximo no herede la duda.*

### ② Nace `paseo1` — el discriminador paseo-only, con nombre honesto

**`guillo381+paseo1@gmail.com`** · clave compartida · «PASEOS DE PRUEBA S97 -
NO REAL» · `tipo: paseador` · oficio **`paseo`** · **`atiende_local = false`**.

**Reemplaza a `vet2` como el caso paseo-only**, que la **capacidad presencial
usa como discriminador** — el caso sigue haciendo falta; lo que sobraba era
que lo encarnara una cuenta llamada «vet».

**Se creó respetando los cinco guards del modelo, no esquivándolos** — y cada
uno enseñó algo: `prestadores.tipo` sigue NOT NULL (el eje muerto de D-487) ·
`whatsapp` y `cuenta_comercial_id` obligatorios · `chk_estado_consistente`
exige `activado_en` para nacer activa · **`chk_ps_alguna_modalidad`** (guard
propio de S97) exige al menos una modalidad ⇒ el paseo entra
**`atiende_domicilio = true`**, que es su firma.

> **Nota de método:** los cinco aparecieron **de a uno**, por prueba y error,
> hasta que se midió el contrato completo de una sola consulta.
> ***Descubrir un contrato a fuerza de errores es pagarlo en intentos; leerlo
> cuesta una consulta.***
