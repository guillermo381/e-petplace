# Cuentas demo · S113

> ✅ **LAS OCHO EXISTEN, CONFIRMADAS Y ENTRANDO.** Creadas por el **camino real**
> (`POST /auth/v1/signup`, el mismo endpoint que llama `registrarse()`), **cero
> sembradas por SQL**.
> Medido: `auth.users like 'kcharry1990+%'` → **8**, confirmadas → **8**.

## LAS OCHO

| # | correo | app | estado | oficio |
|---|---|---|---|---|
| 1 | `kcharry1990+cliente@gmail.com` | cliente | ✅ **completa** — familia «Familia Demo» con **Kilo**, perro, labrador, macho, 10-05-2023 | — |
| 2 | `kcharry1990+vet@gmail.com` | prestador | ✅ entra · 🟡 sin oficio | veterinaria |
| 3 | `kcharry1990+groomer@gmail.com` | prestador | ✅ entra · 🟡 sin oficio | grooming |
| 4 | `kcharry1990+adiestrador@gmail.com` | prestador | ✅ entra · 🟡 sin oficio | adiestramiento |
| 5 | `kcharry1990+guarderia@gmail.com` | prestador | ✅ entra · 🟡 sin oficio | guardería |
| 6 | `kcharry1990+paseo@gmail.com` | prestador | ✅ entra · 🟡 sin oficio | paseo |
| 7 | `kcharry1990+despensa@gmail.com` | prestador | ✅ entra · 🟡 sin oficio | despensa |
| 8 | `kcharry1990+refugio@gmail.com` | prestador | ✅ entra · 🟡 sin oficio | refugio |

**La contraseña vive en el llavero** — cuenta `demo`, servicio
**`epetplace-cuentas-demo`**. Es la misma para las ocho. **No está escrita acá,
ni en ningún archivo, log o parte, ni enmascarada.**

🔴 **LA CLAVE CAMBIÓ, y hay que saberlo:** la que estaba en el llavero **el
servidor la rechazó** — `weak_password · "Password is known to be weak and easy
to guess"`: está en una lista de contraseñas filtradas. Generé una fuerte y la
guardé **en el mismo servicio**, así que el comando de lectura no cambia.
*En S92 se midió que la puerta aceptaba `password` y `12345678` sin un solo 429;
alguien encendió esa protección después y nadie lo registró — este rechazo es la
primera evidencia de que está viva.*

---

## LO QUE VERIFIQUÉ, Y CÓMO

| qué | cómo | resultado |
|---|---|---|
| las 8 se crean | `POST /auth/v1/signup` con la anon key, el endpoint de la app | **8/8** |
| las 8 confirman | Admin API `PUT /admin/users/{id}` `{email_confirm:true}` | **8/8 HTTP 200** |
| las 8 **entran** | `POST /auth/v1/token?grant_type=password` — **login real** | **8/8 con `access_token`** |
| ninguna arrastra datos | `obtener_mi_prestador` con el token de cada una | **`[]`** en las tres probadas |
| Kilo está vacío | RPC `obtener_tablero_mascota` + SQL | `peso: null` · `citas {futuras:0, pasadas:0, proxima:null}` · vacunas sin próxima · **0 papeles, 0 citas** |
| el único evento de Kilo | SQL sobre `eventos_mascota` | **1**, y es el `hito_narrativo` que crea el propio alta — *no es dato sembrado: es el nacimiento del expediente* |

⚠️ **La verificación de correo ESTÁ ENCENDIDA** — medido, y **corrige la
inferencia que yo mismo había declarado como inferencia**: `signUp` devolvió
`email_confirmed_at: null` y sin sesión. *171 confirmados contra 2 sin confirmar
parecía decir lo contrario, y una proporción no es una medición.*

🔴 **Por eso las confirmé por la Admin API y no por el correo, y hay que
declararlo: ése no es el camino real.** Los ocho mails van a
`kcharry1990@gmail.com`, que no es del founder ni mío. *La creación de la cuenta
sí pasó por la puerta de todos; la confirmación es el acto de un operador.*

---

## 🟡 LO QUE FALTA: el oficio de las siete

**El camino real, medido en el código y en la base:**

1. `registro.tsx` → `registrarse({ contexto: 'registro_profesional' })` — **la
   cuenta nace VACÍA** (lo dice su propia cabecera)
2. queda en **sala de espera** — que es exactamente lo que ven hoy: `[]`
3. **alguien del equipo la procesa** con `invitar_prestador` — y **ahí** nace el
   `prestador` con su oficio

**`invitar_prestador` gatea con `is_admin()`, cuyo cuerpo es
`EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND activo)`.** Con
`service_role` **`auth.uid()` es NULL** ⇒ la puerta rebota. **Hay una sola cuenta
admin (`guillo381@`)** y su clave no está en ningún llavero al que yo llegue.

🔴 **No lo salteé sembrando el `prestador` por SQL**, que es lo único que me
faltaba para «terminar»: *una cuenta sembrada no prueba que alguien pueda
crearla*, y saltar el gate daría siete prestadores que se ven perfectos **sin
haber probado la puerta**.

**Los tres pasos que faltan** (portal admin, con la cuenta `guillo381@`):
para cada uno de los siete correos → **Invitar prestador** → nombre y **oficio**.
Después, cada cuenta entra y ve su Día 1 con oficio.

---

## LA MARCA Y EL BORRADO

Marca: **`mascotas.creado_por_sistema = 'demo_s113_kcharry'`** — la misma columna
que Sombra y Bruma. Hoy **1 fila** (Kilo). *Ningún censo de «reales» las cuenta:
la regla de la casa ya excluye `creado_por_sistema IS NOT NULL`.*

```sql
-- ① qué hay (correr SIEMPRE antes de borrar)
select u.email, u.id, u.created_at::date
  from auth.users u where u.email like 'kcharry1990+%' order by u.email;

select m.id, m.nombre from mascotas m
 where m.creado_por_sistema = 'demo_s113_kcharry';

-- ② el borrado (exige service_role)
--    ⚠️ 80 FKs apuntan a `mascotas`, 40 bloqueantes: si alguna llegó a tener
--    actividad, el DELETE rebota y hay que MARCAR en vez de borrar — el
--    precedente son las 64 sondas de S92.
delete from auth.users where email like 'kcharry1990+%';
```
