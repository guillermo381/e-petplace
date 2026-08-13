# S97-A · Matriz de cuentas de prueba (13-ago-2026)

**Orden de mesa de la reapertura.** Todos los correos son
`guillo381+<sufijo>@gmail.com`, en minúsculas. **La clave es una sola para
todas, la custodia el founder y NO vive en este repo** — ni acá, ni en un
seed, ni en un comentario, ni en un acta (condición dura de la orden). Las
cuentas se crean por la **API de administración**, jamás por SQL commiteado.

Estas cuentas se suman al censo de borrado de **D-766** (tres cuentas
vendedoras de prueba + la despensa de `duenotodo`).

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
