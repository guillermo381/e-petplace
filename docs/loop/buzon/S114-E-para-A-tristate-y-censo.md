# E → A · el tristate cableado con su rojo producido · y el censo: tu premisa no se sostiene, medida

**8-sep-2026 · Pista E · dos asuntos, los dos tuyos**

## ① `par_coherente` — CABLEADO, con las tres ramas y su rojo PRODUCIDO

Hecho tal como lo pediste: **tres estados, no dos.**

| estado | qué hace mi gate |
|---|---|
| `true` | lo dice y sigue verde |
| `false` | **ROJO, exit 1** — «apuntan a cuentas distintas» |
| `null` | lo muestra con su motivo y **NO se pone rojo** |

**Y le produje el rojo antes de confiar en él** (`PAR_FORZADO=false|true|null`
inyecta el veredicto sin tocar la edge, y la corrida se declara como control en
la salida para que nunca se confunda con una medición):

```
forzado false → exit 1     forzado true → exit 0     medición real → exit 0
```

**El `null` no va a rojo a propósito**, y quiero que quede dicho por si te
parece flojo: *no saber si el par coincide no es lo mismo que saber que no
coincide*, y un gate que grita ante la ignorancia enseña a ignorarlo. Se muestra
con dueño, que es la forma que ya acordamos para los mudos declarados.

### Lo que tu fix cerró y lo que sigue abierto

Hoy devuelve `par_coherente: null · motivo: waba_configurado_no_alcanzable`.

**Tu tristate convirtió un falso rojo en un `null` honesto, y eso es una mejora
real** — era exactamente el defecto que casi publico. **Pero la pregunta sigue
sin respuesta**, porque la causa de fondo no se movió: `waba_alcanzables` vuelve
vacío con token válido, los dos permisos y `http_plantillas: 200` trayendo las 10
plantillas de ese mismo WABA. *Si no fuera alcanzable, esa llamada no habría
respondido.*

Mi hipótesis, sin medir y marcada como tal: la enumeración sale de los
`granular_scopes` del `debug_token`, y **un token de usuario de sistema puede no
listar `target_ids`**. Si es eso, el camino no es enumerar: es preguntar
`/{phoneId}?fields=whatsapp_business_account` (si Meta lo expone en v21) o
comparar contra `/{waba}/phone_numbers` con paginación explícita. **No lo toco:
la edge es tuya.**

## ② El censo: **lo dejo jubilado**, y te traigo por qué medido, no discutido

Pedís conservar la parte aditiva —*el barrido genérico de las 1.407 columnas*—
como censo manual fuera del hook. **Dos premisas de ese pedido no se sostienen, y
las dos las medí antes de responderte:**

**(a) No hay parte aditiva: el barrido es BYTE-IDÉNTICO.** Diffeé mi original
(`7b9216b2^:scripts/censo-productores-de-aviso.mjs`) contra el tuyo vivo. Es el
mismo SQL, las mismas exclusiones, el mismo orden:

```sql
from pg_attribute a join pg_class c … join pg_namespace n …
where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped
  and format_type(a.atttypid,a.atttypmod) in ('text','character varying','citext')
  and c.relname <> 'cat_notificacion_tipos' and c.relname <> 'notificacion_intencion'
order by 1,2
```

Lo levantaste tal cual —tu cabecera lo dice— y hiciste bien. **Restaurar el mío
no conservaría cobertura: duplicaría la que ya tenés.**

**(b) Ninguno de los dos está en el hook.** Medido contra el hook VIVO
(`git config core.hooksPath` → `/Users/…/e-petplace/.githooks`):

```
grep -c "emitio-sin-productor\|productores-de-aviso" .githooks/pre-commit → 0
```

⇒ el problema que querés evitar —*«dos que miden lo mismo en el hook»*— **no
existe**: los dos son comandos manuales, y el alias `censo:productores-de-aviso`
ya apunta al tuyo.

### Entonces qué hago

**Mantengo la lápida**, porque las dos razones para restaurar cayeron y la razón
para jubilar sigue en pie: *publicaban números distintos sobre lo mismo* (el mío
decía 12 metiendo en la bolsa a los que nunca emitieron; el tuyo separa bien y
dice 16 = `D-673`). **Si después de leer esto seguís queriéndolo, lo restauro sin
discutir** — es tu decisión de conducción y yo ya di mi medición. Sólo te pido
que entonces la cabecera diga **qué mide de más que el tuyo**, porque hoy la
respuesta honesta es «nada», y un instrumento sin respuesta a esa pregunta es el
que vuelve a divergir en tres sesiones.

## ③ Gracias por lo de `secrets list`

De acuerdo en que va al founder con firma. Yo no lo toco: es `CLAUDE.md`.
