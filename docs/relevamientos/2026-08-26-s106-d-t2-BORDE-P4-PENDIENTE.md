# EL BORDE DE §4 · NO CONCLUYENTE — y qué falta exactamente

> **Pista D · S106 tanda 2 · 26-ago-2026.**
> **Estado: declarado NO CONCLUYENTE hasta que exista la credencial.**
> Este archivo existe para que el día que aparezca sea **un comando**, no una
> reconstrucción.

---

## §1 · QUÉ ES, Y POR QUÉ ES EL CASO QUE MÁS IMPORTA

`LETRA_TELEMEDICINA` **§4** firma que la consulta **se cobra aunque el dueño
no asista** — *«si el veterinario entra y determina que el caso necesita
atención presencial, eso **es** el servicio prestado»*.

⇒ **El token del PROFESIONAL se emite aunque el dueño nunca entre.**
**La ventana JAMÁS exige que haya dos.**

> ### 🔴 En el arnés es un VERDE QUE PARECE UN ROJO.
> **Si algún día rebota, quiere decir que alguien «arregló» la sala para que
> se abra sólo con ambos, y le sacó al veterinario el derecho a cobrar que la
> letra le acaba de dar.**
>
> *Y no lo va a avisar nadie: la sala simplemente no abriría para el vet que
> llegó puntual a una consulta que el dueño no atendió, que es exactamente el
> caso que §4 existe para proteger.*

**Hoy `video-token` NO lo impide** —no hay ninguna condición sobre el otro
participante— **pero eso está verificado LEYENDO, no CORRIENDO.** Por eso se
declara NO CONCLUYENTE y no verde.

---

## §2 · 🔴 LO QUE FALTA NO ES «LA CREDENCIAL DE AURORA» — medido hoy

**Son TRES cuentas profesionales distintas**, una por grupo de citas:

| cita | hora | profesional | ventana cierra |
|---|---|---|---|
| `6968c6c3` | 12:00 | `guillo381+demovet@gmail.com` | 12:35 ❌ **vencida** |
| `c7a10459` | 12:30 | `guillo381+demovet@gmail.com` | 13:05 ❌ **vencida** |
| **`68cb15a2`** | **13:00** | 🔴 **`guillo381+7@gmail.com`** | **13:35** |
| **`33800148`** | **13:30** | 🔴 **`guillo381+7@gmail.com`** | **14:05** |
| `911c80c3` | 20:00 | `guillo381+demovet@gmail.com` | 20:35 |
| `55e035d8` | 20:30 | `guillo381+9@gmail.com` | 21:05 |

> **La cuenta que hace falta primero es `guillo381+7@gmail.com`** — es el
> profesional de `68cb15a2`, **la misma cita con la que ya salió verde el
> camino feliz del dueño**. Con esa sola credencial el borde queda ejercido.

⚠️ **Y hay una ventana esta noche que no depende de eso:** `911c80c3` (20:00,
`+demovet`) y `55e035d8` (20:30, `+9`). *Si la clave que aparece es cualquiera
de las tres, hay una cita esperándola.*

🔴 **Las citas de las 12:00 y 12:30 YA NO SIRVEN** — sus ventanas cerraron.
*El dato de la semilla envejece: una cita en ventana deja de estarlo mientras
uno busca la credencial.*

---

## §3 · EL COMANDO, LISTO PARA CUANDO LA CREDENCIAL EXISTA

**① Obtener la sesión del profesional** *(reemplazar la clave):*

```bash
cd /Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace
eval "$(grep -E '^[A-Z_]+=' apps/cliente/.env.local | sed 's/^/export /')"

curl -s -X POST "$EXPO_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"guillo381+7@gmail.com","password":"LA_CLAVE"}' \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);
      if(j.access_token){require('fs').writeFileSync('/tmp/jwt_vet.txt',j.access_token);console.log('✅ sesión del vet OK');}
      else console.log('🔴',JSON.stringify(j).slice(0,160));})"
```

⚠️ **`eval "$(grep …)"`, NO `. archivo`.** *`apps/cliente/.env.local` tiene en
su línea 1 un comentario **sin `#`**: `zsh` lo tolera y **`bash` lo rechaza
como error de sintaxis**, dejando las variables sin cargar — y el script sale
con **código 0**. Medido el 26-ago: una corrida programada «terminó bien» sin
haber ejecutado nada.*

**② Correr el arnés completo** *(la cita tiene que estar EN ventana):*

```bash
cd /Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s106-d-t2/supabase/functions/video-token
eval "$(grep -E '^[A-Z_]+=' ../../../../e-petplace/apps/cliente/.env.local | sed 's/^/export /')"

SUPABASE_URL="$EXPO_PUBLIC_SUPABASE_URL" \
ANON_KEY="$EXPO_PUBLIC_SUPABASE_ANON_KEY" \
JWT_DUENO="$(cat /tmp/jwt_demo.txt)" \
JWT_VET="$(cat /tmp/jwt_vet.txt)" \
JWT_AJENO="$(cat /tmp/jwt_demo.txt)" \
CITA_TELE='68cb15a2-a3c3-4a16-a58b-2bae096b7d02' \
CITA_AJENA='c7a10459-3379-4165-8aaf-8de8c7dbaed3' \
CITA_FUERA='55e035d8-8d0f-4ec0-bd26-95cd4c2e4180' \
  node arnes.mjs
```

**Qué tiene que salir:**
```
✅ 🔴 vet solo, el dueño nunca entró (borde §4)  → 200  token(…) rol=profesional
```

🔴 **`rol=profesional` es la mitad del verde.** *Si sale `rol=dueño`, la RPC
está resolviendo mal la identidad; si rebota, la ventana está exigiendo dos.*

---

## §4 · CÓMO SABER SI LA CITA SIGUE SIRVIENDO

```sql
select c.id, c.hora,
       (now() at time zone 'America/Guayaquil'
         between (c.fecha + c.hora) - interval '15 min'
             and (c.fecha + c.hora) + make_interval(mins => c.duracion_minutos) + interval '15 min'
       ) as en_ventana
from evento_cita_servicio c
where c.modalidad='telemedicina' order by c.hora;
```

**Si ninguna está en ventana, no es un fallo: es que pasó la hora.** Hace
falta pedirle a A una cita nueva — *y esa es la diferencia entre «el borde
falla» y «no lo pudimos probar», que este archivo existe para que nadie
confunda.*

---

## §5 · LO QUE **NO** SE HACE PARA DESTRABARLO

- ❌ **No se adivinan claves** ni se prueban las de otras cuentas.
- ❌ **No se fabrica una sesión con `service_role`** — medido: no está en el
  keychain, y aunque estuviera, *un arnés que se auto-otorga la identidad que
  viene a verificar no verifica nada.*
- ❌ **No se marca el caso como verde «porque el código no tiene la
  condición».** Eso es leer, no medir — y es exactamente lo que `L-402`
  prohíbe.
