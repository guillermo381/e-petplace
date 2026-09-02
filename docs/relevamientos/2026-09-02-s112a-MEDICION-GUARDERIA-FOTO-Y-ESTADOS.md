# S112-A · MEDICIÓN: la foto del durante de guardería y los 0 `en_guarderia`

> **Contra qué y cuándo:** contra la **BASE viva** (`zyltipqscdsdsxnjclhp`) y contra
> `main 23867033`, el **2-sep-2026**. Mitad de MOTOR del documento de C
> (`docs/loop/buzon/S112-C-MEDICION-FOTO-GUARDERIA.md`).
>
> ⚠️ **Este documento se vence solo.** Si el ledger de migraciones ya no está en
> 627, o si `cat_guarderia_transiciones` cambió, esta tabla describe otro estado.

---

## ① EL BUCKET, censado

```
guarderia-media · publico=false · limite=52.428.800 (50 MB)
mime: image/jpeg, image/png, image/webp, video/mp4, video/quicktime, video/webm
policies: INSERT · SELECT · DELETE   (las tres a `authenticated`)
```

**No hay policy de UPDATE** — no se midió si eso rompe algún reemplazo; se declara.

---

## ② 🔴 EL ROJO: la familia LISTA la foto de su animal y NO la puede bajar

**Medido por camino real, con sus DOS controles positivos al lado** — sin ellos el
rojo no prueba nada:

| | |
|---|---|
| ✅ la familia LISTA su media (`obtener_media_de_mi_mascota`) | **1 fila** |
| ✅ la familia VE a su mascota (`user_tiene_acceso_a_mascota`) | **true** |
| 🔴 la familia cumple la policy del BUCKET | **false** |

La policy exigía `user_puede_acceder_prestador(split_part(name,'/',1))`, y **la
primera carpeta es el PRESTADOR**: una familia no la cumple ni puede cumplirla.

**CURADO** en `20260908420000`: la policy gana un segundo brazo —
`_media_guarderia_es_de_mi_mascota(name)`, helper `SECURITY DEFINER` — que
pregunta si el objeto tiene **etiqueta a una mascota que quien pregunta puede
ver**. *Es el único lazo con una familia, porque `guarderia_media` no tiene
`estadia_id`: es del prestador y del DÍA.* Una foto sin etiquetar sigue siendo
sólo del prestador.

**El después, midiendo la POLICY y no uno de sus brazos:**

```
✅ FAMILIA · pasa la policy entera .......... true   (por el brazo nuevo)
     · por el brazo del prestador ........... false
     · por el brazo nuevo (su etiqueta) ..... true
🔴 TERCERO · pasa la policy entera .......... false
```

⚠️ **Mi primer «después» midió UN BRAZO en vez de la policy y dio `false`.** Lo
corregí antes de reportarlo. Es la clase del día: *una respuesta verdadera a una
pregunta parecida.*

### 🔴 Y ESTA CURA ES LA MITAD DE DOS APILADAS

C midió la otra: **`obtener_media_de_mi_mascota` devuelve el PATH CRUDO**, no una
URL firmada, y la pantalla lo pinta como si fuera una URI
(`guarderia/[estadiaId].tsx:517` y `:571` — la única de las siete del cliente que
no firma).

⇒ **con la policy curada sola, la foto SIGUE sin bajar.** *Si sólo se recuerda «la
policy se curó», el recorrido falla igual y va a parecer que la cura no sirvió* —
misma forma que las caras de la vidriera. **La firma es de `apps/` y es de C.**
Precedente de la casa: **`D-308`** (S47) — una foto privada se muestra firmada.

---

## ③ 🟢 POR QUÉ HAY 0 `en_guarderia` — y NO es que el acta no transicione

**El acta SÍ transiciona.** El mapeo vive como DATO en `cat_guarderia_transiciones`
y está completo:

| acto | desde | hasta |
|---|---|---|
| `a_bordo` | reservada | recogida_en_curso |
| **`llegada`** | recogida_en_curso | **en_guarderia** |
| `retorno` | **en_guarderia** | retorno_en_curso |
| `entregada` | retorno_en_curso | entregada |
| `no_recogida` | reservada | no_recogida |

`verificar_coherencia_estados_guarderia()` → **`{"ok": true}`**, catálogo y CHECK
sin divergencias.

**Las dos estadías del founder recorrieron el arco entero el 1-sep:**

```
15:41:48  a_bordo   →  recogida_en_curso
15:45:13  llegada   →  en_guarderia
15:46:21  retorno   →  retorno_en_curso
```

🔴 **Estuvieron en `en_guarderia` SESENTA Y OCHO SEGUNDOS.**

⇒ **`en_guarderia` es un estado de PASO.** Hay cero hoy porque el founder caminó
entrada y salida en 4 min 33 s, no porque la máquina falle.

### La consecuencia de producto, que es el hallazgo

**El botón «Sacar foto» exige `en_guarderia`** ⇒ **la ventana para sacar la foto
es exactamente entre «llegó» y «retornó»**, y **nada en la pantalla lo dice**.

*La pantalla frena BIEN (Ley 23) y frenar bien y no existir se ven igual* — es la
lectura de C, y acá el freno estaba bien y la ventana ya se había cerrado.

**El censo por la CAUSA lo cierra** (`L-437`): de todas las funciones de la casa,
**sólo DOS nombran `en_guarderia` y las dos son LECTORAS**
(`obtener_tramo_vivo_de_mi_mascota`, `obtener_estadias_del_dia`). Ninguna lo
escribe a mano — lo escribe el catálogo, como corresponde.

### Estado de las estadías al medir

```
reservada 91 · no_recogida 3 · retorno_en_curso 2      (96 en total)
actos: llegada 2 · a_bordo 2 · retorno 2 · no_recogida 3
```

---

## ④ LO QUE **NO** SE MIDIÓ, y por qué

- **La RPC que registra la foto y su edge**, del lado del PRESTADOR: exige el JWT
  del prestador de prueba de guardería, **que el founder todavía no nombró**. El
  refugio no sirve: no atiende estadías.
- **Que la foto BAJE de verdad** desde un cliente con la policy nueva: la
  verificación se hizo sobre el **predicado**, no descargando el objeto por HTTP.
- **La policy de UPDATE ausente** en el bucket.
- **Las 3 fotos que existen son del 1-sep 10:40–10:43** (dato de C), **once horas
  antes del ancla del lote de guardería** ⇒ *con ese bundle se sacaron CERO.* Sin
  esa fecha, las 3 filas se leen como «anda» y son de otro binario.
