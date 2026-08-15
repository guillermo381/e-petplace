# S98-C → B · PROMOVER EL GLIFO ⓘ AL REGISTRY (la condición ya se cumplió)

**No es una idea: es una condición que alguien escribió y que acaba de
dispararse.** El pedido es corto; lo largo es el criterio, porque es lo que
evita que se resuelva mal.

---

## 1 · LA CONDICIÓN, LITERAL

`apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx:237` dibuja un ⓘ
local y su propio comentario declara el disparo:

> *«El glifo ⓘ de la procedencia (trazo local 1.9 — precedente de los motivos
> de guijarro de esta misma pantalla; **candidato al registry por su puerta si
> se repite**).»*

**Se repitió.** `apps/prestador/src/app/ventas/configuracion.tsx` lo necesitó
para la ⓘ de la hora de corte (firma del founder: *los campos que necesiten
explicación llevan su ⓘ con modal, no párrafos permanentes* — o sea que esto
va a repetirse más, no menos).

**Copié la geometría MEDIDA, no dibujé una nueva** — para que cuando la
promuevas no haya dos formas que reconciliar:

```
<Svg width={18} height={18} viewBox="0 0 24 24">
  <Path d="M12 3.4a8.6 8.6 0 110 17.2 8.6 8.6 0 010-17.2Z" stroke={color} strokeWidth={1.9} fill="none" />
  <Path d="M12 11v5M12 7.7v.3" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" />
</Svg>
```

(El cliente lo monta a 15; yo a 18 dentro del slot `iconoDer` de `Campo`. El
tamaño es del consumidor, la forma es la misma.)

---

## 2 · 🔴 EL CRITERIO QUE PIDO QUE NO SE SALTEE: **SON DOS GLIFOS, NO UNO**

El registry YA tiene `ayuda`, y la tentación barata es decir «usá ése». **Medí
qué dibuja antes de descartarlo**, y su propio comentario lo define:

> `// El salvavidas — ayuda que flota, con la huella a salvo adentro.`
> `ayuda: … <Circle r={8.4}/> + los cuatro rayos + Huella`

**Un salvavidas dice «CONTACTÁ SOPORTE». Un ⓘ dice «QUÉ SIGNIFICA ESTE
CAMPO».** Son dos trabajos distintos y en una misma pantalla pueden convivir:
la ayuda del producto vive en Cuenta, y la explicación de un campo vive pegada
al campo. *Un elemento, un trabajo.* Si el ⓘ se resuelve reusando el
salvavidas, el día que las dos cosas estén en la misma pantalla el usuario ve
el mismo dibujo para «pedir auxilio» y para «leer una definición».

Por eso el pedido es **un glifo NUEVO**, no un alias.

---

## 3 · LO QUE LA LEY 9 VA A EXIGIR, Y MI DUDA HONESTA

`DIRECCION_ARTE` Ley 9: *a 21 px la huella SOBREVIVE O ES RUIDO*, y la regla
madre del set b′ es que **en cada ícono la mascota está presente**.

**Acá tengo una duda que no resuelvo yo y por eso la declaro en vez de
decidirla:** el ⓘ es un **glifo de CONTROL**, no de servicio ni de entidad —
como el chevron o el engranaje. La categoría «glifo de control» está nombrada
desde S79 y su gate quedó pendiente. **Si los glifos de control llevan huella,
este ⓘ va a competir consigo mismo:** su punto y su barra ocupan justo el
centro donde iría la huella, y a 18-21 px eso es ruido, no presencia.

**Mi voto, y lo digo como voto:** el ⓘ entra **sin huella**, como control puro,
y con él se firma la categoría que S79 dejó nombrada. **La decisión es tuya y
del gate POR ÍCONO** (§6b: montaje a 21 px junto a cinco del registry).

---

## 4 · MIENTRAS TANTO

El glifo vive **local** en `ventas/configuracion.tsx`, con la cita de su
precedente y de esta promoción escrita al lado. **No lo tomes como mi decisión
de dejarlo local**: es el mismo estado en que el cliente lo tiene desde que se
dibujó. Cuando entre al registry, los dos consumidores migran y no queda copia
— el del cliente también, aunque ese archivo no sea territorio mío.

**Contexto de por qué esto va a crecer:** la firma del founder sobre el
formulario de cortes convirtió el ⓘ en **patrón general** («los campos que
necesiten explicación llevan su ⓘ con modal»). Hoy son dos consumidores; con
esa firma, cada formulario con un campo que se explique es uno más.
