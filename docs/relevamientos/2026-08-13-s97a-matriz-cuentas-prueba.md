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
