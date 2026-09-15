# S116-B · LOTE 3d — el censo del isotipo viejo queda en **cero**, y tres de los cuatro quedan raros

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (81) · `verify:contrast` 479/0 · `verify:catalogo-v5` VERDE · `verify:techos-locales` VERDE · `tsc` 0 en las cuatro.

---

## ① EL CENSO EN CERO

| archivo:línea | era | queda |
|---|---|---|
| `app/(tabs)/hogar/index.tsx:654` | `Isotipo size={28} variant="blanco"` | `IsotipoV5 sobre="oscuro" tamano="cabecera"` |
| `app/(tabs)/hogar/vacunas/[mascotaId].tsx:298` | `Isotipo size={32} variant={esMemorial ? 'blanco' : 'gradiente'}` | `IsotipoV5 sobre="claro" tamano="cabecera"` |
| `app/invitacion.tsx:125` | `Isotipo size={64} variant="gradiente"` | `IsotipoV5 sobre="claro" tamano="cabecera"` |
| `components/reserva-piezas.tsx:172` | `Isotipo size={20} color={colorOficio}` | `IsotipoV5 sobre="claro" tamano="cabecera"` |

**Medido después: `grep "<Isotipo " apps/cliente/src` → 0 montajes.** Los dos hits que quedan de la palabra son **comentarios**, no dibujos.

---

## ② LO QUE QUEDÓ RARO — medido y capturado, **sin resolver**

🔴 **La causa es una sola y vale para los cuatro: la marca del ilustrador NO TIENE TAMAÑOS CHICOS.** Sus cuatro `TamanoMarca` son de marca protagonista:

```
cabecera      120 px FIJOS  ← el más chico que existe
splash        34 % del ancho   (~122 en 360)
portada       46 %            (~166)
protagonista  50 %            (~180)
```

**Y los cuatro montajes que migré eran marcas CHICAS inline: 20 · 28 · 32 · 64.** *El dibujo nuevo nació para presidir una pantalla; estos cuatro lugares lo usaban como un glifo al lado de un texto.*

### ✅ ③ `invitacion.tsx` — **el único que quedó bien**

Medido en pantalla: **105 × 67 dp**, centrado y solo. Era 64 → subió ~1,6×, y **se ve proporcionado porque no compite con nada**.
📷 `lote3d-invitacion-isotipo-v5.png`

### 🔴 ① `hogar/index.tsx` — **el peor, y es el techo de la app**

Medido en pantalla: **104 dp de ancho — el 29 % del ancho del teléfono**, arriba de la fecha, en la misma fila que el carrito y la campana.

> **Era 28 dp. Ahora es 104: casi cuatro veces.** *La fila del techo tenía un lockup chico a la izquierda y dos discos a la derecha; ahora tiene una marca que ocupa un tercio de la banda y dos discos que parecen accesorios.*

📷 `lote3d-hogar-isotipo-enorme.png` — **y en la misma captura se ve que la marca de agua del lote 3c ya no está** (fondo limpio) y que **los dos discos del slot derecho del lote 3b ya están montados por C**, con la campana en 36.

### 🔴 ④ `reserva-piezas.tsx` — **el que no tiene traducción**

Era **20 px teñidos al color del oficio** (`color={colorOficio}`), detrás del glifo del oficio. **`IsotipoV5` es un PNG: no se puede teñir.** *No hay prop que pedir — el `color` no existe porque el dibujo trae los suyos.* Quedó a 120 px y sin teñir, al lado de un `Icono` de 24.

### 🟡 ② `hogar/vacunas` — dos cosas, una de tamaño y otra de contrato

Era **32 px** (→ 120) **y** tenía una rama `esMemorial ? 'blanco' : 'gradiente'` que **no tiene equivalente**: `sobre` declara **el fondo donde se para**, no el tema, y el de esa pantalla es claro en los tres. *La rama no se perdió por descuido: dejó de existir la pregunta que contestaba.*

---

## ③ LO QUE NO HICE, y por qué

**No inventé un tamaño.** Lo que haría falta es que `IsotipoV5` admita **un calibre chico** —o un ancho numérico— y eso es **una decisión de dirección de arte**: *cuánto puede achicarse la marca del ilustrador antes de dejar de leerse es exactamente lo que el gate de `21px` del set b′ decidió para los glifos, y para esta marca nadie lo decidió todavía.*

⚠️ **Y hay una pregunta debajo que tampoco contesto:** en tres de los cuatro lugares la marca no está presidiendo — **está al lado de un texto, como un glifo**. *Puede que el arreglo no sea achicar el isotipo sino que esos tres lugares no lleven marca*, que es una decisión tuya y no mía.

**El censo quedó en cero como pediste, y las tres pantallas quedan con el dibujo grande hasta que decidas.** *Preferí dejarlo visible y medido antes que elegir un tamaño por mi cuenta y que el número saliera de mí.*
