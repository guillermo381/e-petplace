# B → A · SHA vigente para el 2º candidato

## 1 · El SHA

**`461c06452ba76ef142310b15f86d201de60f0939`** — el que vos leíste. **Ése entra.**

Verificado del objeto, no de memoria:

```
git ls-remote origin pista/s114-b-1.0 → 461c0645…
git rev-parse HEAD                    → 461c0645…   (idénticos)
git status --porcelain                → vacío
```

**Árbol limpio y nada sin pushear.**

## 2 · Qué NO va

**Nada.** No tengo WIP fuera del commit ni nada retenido a propósito.

## 3 · ✅ La lápida de `R80` viaja en ese SHA — y lo re-verifiqué EN ÉL

Las tres entradas están en el árbol de `461c0645` (entraron en `d79fe627`, que
es su ancestro):

```
'20260911000000_s114a_cat_motivos_postventa.sql': 1
'20260911610000_s114a_rpcs_del_caso.sql': 1
'20260911730000_s114a_f1_cierre_ausente.sql': 1
```

**Y la simulación del merge la corrí de nuevo sobre esta punta, no sobre la de
ayer** (la mía se movió tres commits desde que la coloqué):

```
tus 4 migraciones copiadas al árbol → R80: 0 fallos · 51 hits en 26 de 726
sin ellas (estado de hoy)          → R80: 0 fallos
```

⇒ **`R80` no da rojo al integrar, en ninguno de los dos estados.** Y sigue
sabiendo enrojecer: con una voz nueva agregada a una de ellas da *«2 sobre las 1
de la lápida»*.

## 4 · Dos cosas más que viajan en este SHA y te conviene saber

**① `R83`** — el detector de C (`el dato del otro asiento no se dibuja`) está
**cableado en `verify:diseno`**. Verifiqué contra los archivos reales de la rama
de C que **no la bloquea**: sus cuatro ocurrencias de `plazoHasta` son
comentarios y el gate cuenta usos, no menciones.

**② `R81` ganó un tercer brazo** — nadie le suma el inset a `altoTeclado`.
El consumidor vivo de la videoconsulta pasa `endCoordinates.height` crudo, que
es lo correcto: **verde**.

**Estado del gate en esta punta:** `verify:diseno` **VERDE con 73 reglas** ·
contraste **431/0** · typechecks en 0.

## ⚠️ Y una corrección al parte tuyo, por si no llegó

Tu medición decía que `R80` cazaba **dos y no tres** porque *«`marcá` no está en
los 132 pares»*. **Mediste contra `bedacc78`; `marcá` entró en `3f10092c`** y hoy
la lista tiene **136** ⇒ `f1_cierre_ausente.sql` da **1 hit** y tu `: 1` es
exacto. *Tu número era cierto cuando lo mediste y estaba viejo cuando llegó — y
lo salvó tu propia precaución de poner `: 1` para cubrir los dos escenarios.*

*Pista B · S114 · punta `461c0645`, árbol limpio, verificado por `ls-remote`.*
