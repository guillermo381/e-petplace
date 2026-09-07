# Cuentas demo · S113

> 🔴 **ESTADO: NINGUNA CREADA.** Frenado por **dos credenciales**, las dos
> medidas. *No se sembró ninguna por SQL — que es justamente lo que el pedido
> prohíbe: una cuenta sembrada no prueba que alguien pueda crearla.*
> **Verificado: `select count(*) from auth.users where email like 'kcharry1990+%'` → 0.**

---

## LAS OCHO, COMO VAN A QUEDAR

| # | correo | app | oficio |
|---|---|---|---|
| 1 | `kcharry1990+cliente@gmail.com` | cliente | — (familia con **un perro y nada más**) |
| 2 | `kcharry1990+vet@gmail.com` | prestador | veterinaria |
| 3 | `kcharry1990+groomer@gmail.com` | prestador | grooming |
| 4 | `kcharry1990+adiestrador@gmail.com` | prestador | adiestramiento |
| 5 | `kcharry1990+guarderia@gmail.com` | prestador | guardería |
| 6 | `kcharry1990+paseo@gmail.com` | prestador | paseo |
| 7 | `kcharry1990+despensa@gmail.com` | prestador | despensa |
| 8 | `kcharry1990+refugio@gmail.com` | prestador | refugio |

**La contraseña vive en el llavero de la Mac del founder** — cuenta `demo`,
servicio **`epetplace-cuentas-demo`**. Es la misma para las ocho.
**No está escrita acá, ni en ningún archivo, log o parte, ni enmascarada.**

---

## 🔴 FRENO ① · el servidor RECHAZA la clave del llavero

Medido por el camino real (`POST /auth/v1/signup`, el mismo que llama
`registrarse()`):

```
weak_password · "Password is known to be weak and easy to guess,
                 please choose a different one."
```

**No es un problema de formato ni de largo: la clave está en una lista de
contraseñas filtradas** y el proyecto tiene esa protección encendida.

⚠️ **Y esto es una buena noticia disfrazada de freno:** en **S92** se midió que
la puerta aceptaba `password`, `12345678`, `qwerty123` y `aaaaaaaa`, **y que 12
intentos fallidos no producían ni un 429**. *Alguien encendió esa protección
después y nadie lo registró* — este rechazo es la primera evidencia de que está
viva.

**Qué destraba:** una clave que no esté en esa lista, guardada en el mismo
servicio del llavero. **No la invento**: el pedido dice que es la del llavero y
la misma para las ocho — elegir otra por mi cuenta rompe las dos condiciones y
deja al founder con una clave que no sabe cuál es.

## 🔴 FRENO ② · las siete de prestador necesitan un acto de admin

**El camino real, medido en el código y en la base:**

1. `registro.tsx` → `registrarse({ contexto: 'registro_profesional' })` — **la
   cuenta nace VACÍA**, sin vínculo a ningún prestador (lo dice su propia
   cabecera: *«La cuenta nace VACÍA»*)
2. queda en **sala de espera**
3. **alguien del equipo la procesa** con `invitar_prestador` / `activar_prestador`
   — y **ahí** nace el `prestador` con su oficio

⇒ **Por el camino real, una cuenta nueva de prestador NO TIENE OFICIO hasta el
paso 3.** El pedido quiere «sólo el oficio elegido y el ingreso funcionando», y
eso vive del otro lado de ese paso.

**`invitar_prestador` gatea con `is_admin()`** (medido en su cuerpo) y **hay UNA
sola cuenta admin: `guillo381@`**, cuya clave no está en ningún llavero al que
yo llegue (ya frenó el estreno de las placas por lo mismo).

🔴 **No lo salteo con `service_role` ni sembrando el `prestador` por SQL.** Es
literalmente lo que el pedido prohíbe: *una cuenta sembrada no prueba que
alguien pueda crearla* — y saltar el gate de admin con la credencial de servicio
daría ocho cuentas que se ven perfectas **sin haber probado la puerta**.

**Qué destraba:** la clave de `guillo381@`, **o** que el founder corra el paso 3
desde el portal admin una vez que existan las siete cuentas (es un formulario
por cuenta).

---

## ⚠️ LO QUE **NO** ESTÁ MEDIDO (y no lo doy por hecho)

**Si la verificación de correo está encendida.** No lo pude medir sin crear una
cuenta, y no creé ninguna. *Lo único que tengo es una inferencia y la declaro
como tal:* **171 confirmados contra 2 sin confirmar** sobre 173 usuarios sugiere
que está apagada —si estuviera encendida habría muchos más registros a medias—,
**pero una proporción no es una medición**.

🔴 **Si estuviera encendida, hay un tercer freno**: los ocho correos van a
`kcharry1990@gmail.com`, **que es de Karina, no del founder ni mío** — y sin
acceso a esa casilla las ocho cuentas quedan sin confirmar. *Conviene saberlo
antes de crearlas, no después.*

---

## LA MARCA DE FIXTURE, YA DECIDIDA

La misma que Sombra y Bruma: **`mascotas.creado_por_sistema`**, hoy con valor
`'fixture_founder_s113'` en 14 filas.

**Para éstas se usa un identificador propio: `'demo_s113_kcharry'`** — así se
borran todas con una consulta y **ningún censo de «reales» las cuenta**, porque
la regla de la casa ya excluye `creado_por_sistema IS NOT NULL`.

### La consulta para borrarlas

```sql
-- ① qué hay (correr SIEMPRE antes de borrar)
select u.email, u.id, u.created_at::date
  from auth.users u
 where u.email like 'kcharry1990+%'
 order by u.email;

-- ② las mascotas marcadas
select m.id, m.nombre, m.creado_por_sistema
  from mascotas m
 where m.creado_por_sistema = 'demo_s113_kcharry';

-- ③ el borrado (exige service_role; auth.users cascadea a lo suyo)
--    ⚠️ 80 FKs apuntan a `mascotas`, 40 bloqueantes: si alguna cuenta llegó a
--    tener actividad, el DELETE va a rebotar y hay que decidir qué se marca en
--    vez de borrarse — el precedente son las 64 sondas de S92.
delete from auth.users where email like 'kcharry1990+%';
```

---

## LO QUE SÍ SE PUEDE HACER SIN DESTRABAR NADA

**Nada.** *Y se dice así en vez de entregar siete cuentas a medias:* el pedido
es explícito en que el valor está en el **camino real**, y las dos puertas de ese
camino —crear la cuenta y darle su oficio— están cerradas por credencial.

**El día que se destraben, el trabajo es mecánico:** ocho `signUp` por el mismo
endpoint que usa la app, una llamada a `crear_familia_con_primera_mascota` para
la del cliente, y siete pasadas por el portal admin. **Lo que no es mecánico es
la verificación**, y va entrando a cada app: que abra, que muestre su pantalla de
primer día, y que no arrastre datos de nadie.
