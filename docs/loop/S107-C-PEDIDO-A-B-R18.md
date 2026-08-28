# S107-C → B (juez) · PEDIDO AUTOCONTENIDO — enmendar `R18`

> **Qué se pide:** que `R18` deje de vigilar la casa del CLIENTE y vigile **sólo la del prestador**.
> **Por qué te llega a vos:** `scripts/verify-diseno.mjs` es territorio de B/A. **C no lo toca.**
> **Estado:** 🔴 **C NO retira la entrada del cliente hasta que esto esté hecho** — orden de la mesa: *«no dejes el gate en rojo»*. Cuando el juez esté enmendado, C retira en una línea.

---

## LA FIRMA DE LA MESA, VERBATIM (28-ago-2026)

> **1.** Se retira **SOLO** la entrada del cliente (`cuenta/index.tsx:318`). La del prestador (línea 847, «Láminas de gate») **SE CONSERVA hasta el gate de producción**: es el camino del founder a lo que tiene que firmar, y B acaba de publicar diez piezas que esperan ese ojo.
>
> **2.** `R18` **NO se borra: se ENMIENDA** para vigilar sólo la casa del prestador. **La regla sigue teniendo objeto.**

---

## EL CAMBIO EXACTO

En `scripts/verify-diseno.mjs`, la constante que hoy dice:

```js
const CUENTAS_GALERIA = [
  'apps/cliente/src/app/(tabs)/cuenta/index.tsx',
  'apps/prestador/src/app/(tabs)/cuenta/index.tsx',
];
```

queda con **una sola casa**, la del prestador. Y con ella, el ancla:

```js
fallos.push(...ancla('R18', casas.length, 2, 'Cuenta(s) de galería vigiladas'));
```
**el `2` pasa a `1`** — si no, el ancla se cae sola y el gate queda rojo por el otro lado.

---

## POR QUÉ NO ES «UNA CASA MENOS», Y CONVIENE QUE QUEDE EN EL CUERPO DE LA REGLA

**Las dos entradas no eran la misma cosa con distinto dueño:**

| casa | fila | qué es |
|---|---|---|
| cliente | «Galería de tokens · herramienta de sesión» | **herramienta de desarrollo.** Su sala salió de revisión por firma del founder (S106) |
| **prestador** | **«Láminas de gate · para firmar — lo que espera tu ojo esta sesión»** | 🔴 **el camino del founder a lo que firma.** Es lo que `R18` existe para proteger |

> **Lo que `R18` vigilaba de verdad era la segunda.** *La primera entró al corpus en S84-B8 ② por simetría —«las dos casas»— y la simetría era del guard, no del propósito.* **Enmendarla la deja midiendo exactamente lo que le importa, y por eso la regla no muere: gana precisión.**

---

## NOTA DE PROCEDENCIA — el pedido original estaba incompleto, y no es reproche

El traspaso pedía retirar **una** entrada (la del cliente, medida por B en la línea 318). **Son dos**, y `R18` vigila las dos: C lo midió al ejecutar el retiro y ver el gate ponerse rojo. *El pedido no estaba mal escrito: estaba escrito contra media medición.* **De paso corrigió una nota de C que afirmaba que el prestador no tenía entrada — falsa, y la tenía de un reporte viejo en vez del objeto (L-166).**

---

## PEDIDO HERMANO, YA EN CAMINO POR LA MESA (se nombra para que no se pierda)

**`etiquetaAccesible?: string` en `DocumentoAceptable`**, y en `Linea` usar `doc.etiquetaAccesible ?? doc.texto`.
**Motivo medido:** `AceptacionDeDocumentos` arma el `accessibilityLabel` con `doc.texto` solo, así que tras la migración de `D-645` el lector de pantalla anuncia **«Acepto los»** donde la pieza vieja anunciaba la frase entera. Las claves `tycAccesible` · `privAccesible` · `arbitrajeAccesible` **quedaron vivas y sin consumidor a propósito**, esperando esa prop.
