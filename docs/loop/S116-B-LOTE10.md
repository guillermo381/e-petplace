# S116-B · LOTE 10 — la causa raíz: el texto escala con el sistema y mis altos no

**Rama `pista/s116-b-05`.** Gates: `verify:etiqueta-dentro` VERDE · `verify:diseno` VERDE (80) · `verify:contrast` 504/0 · `tsc` 0 en las cuatro.

---

## ⚠️ LO PRIMERO: QUÉ VERIFIQUÉ Y QUÉ NO

**Verificado en píxeles: 05 (registro).** **NO verificado: 03, el alta y el pago** — el aparato dejó de tomar bundles nuevos a mitad de la sesión y **lo detecté con un marcador**, no con una suposición. *Reportar las cuatro como verificadas sería exactamente el error que este lote vino a corregir.* El detalle está en ⑤.

## ① EL INSTRUMENTO ANTERIOR MEDÍA ALGO VERDADERO AL LADO DE LO QUE IMPORTABA

Mi «cero solape» sobre los `bounds` **era cierto**. *Un `bounds` declara la caja que un nodo PIDE; no dice dónde cae la tinta.* Con el instrumento nuevo —contar tinta por fila sobre la imagen— aparece el defecto real, **y no es un solape: es un RECORTE**.

| con la letra del sistema en **1,3** | tinta del valor |
|---|---|
| antes | **6,7 dp** — un renglón de 20 recortado a un tercio |
| después | **23,7 dp** |

*Eso es literalmente «cortado por arriba»: la mitad superior de las letras no se dibuja.* 📷 `lote10-05-recorte-ANTES.png` · `lote10-05-recorte-DESPUES.png` · `lote10-03-recorte-ANTES.png`.

## ② LA CAUSA RAÍZ, Y EXPLICA POR QUÉ MI EMULADOR DECÍA LIMPIO Y SU TELÉFONO NO

🔴 **En React Native `fontSize` escala con la preferencia de tamaño de letra del sistema** (`allowFontScaling`, encendida por defecto). **Los altos de caja que yo fijé, no.**

**Medido en el mismo campo, mismo texto, cambiando SÓLO la preferencia:**
- escala **1,0** → etiqueta 12,3 dp · valor **23,0 dp** · limpio
- escala **1,3** → etiqueta 16,7 dp · valor **6,7 dp** · **recortado**

*Mi verificación anterior no estaba mal hecha: estaba hecha con la escala 1,0, que es la única que un emulador recién creado tiene. El founder mira su teléfono, y su teléfono tiene otra.* **El defecto no era invisible: era invisible DESDE ACÁ.**

⚠️ **La salida fácil está prohibida y se declara:** `allowFontScaling={false}` haría desaparecer el defecto de la pantalla **ignorando la preferencia de accesibilidad de la persona** — que es exactamente lo que esa preferencia existe para que no pase.

## ③ LA CURA — dos cosas, y ninguna sola alcanza

1. **Las medidas se DERIVAN de la escala en cada render** (`medidasCampoV5(PixelRatio.getFontScale())`). Con 1,0 dan los mismos números de siempre (14 · 24 · 38 · 54), así que **nada se mueve donde hoy está bien**. Se leen en el render y no en el módulo: *una constante calculada al importar se congela con la escala de ese momento, que es el mismo defecto un piso más arriba y más difícil de ver.*
2. **El alto pasa de JAULA a PISO** (`minHeight` en vez de `height`), en `Campo` y en `CampoFecha`. 🔴 **Con `height` fijo, si el contenido no entra lo que sobra se CORTA — y lo que sobra es siempre el texto que la persona está escribiendo.** Permiso explícito de la mesa: *la prioridad es que el texto se lea entero; el resto se acomoda.*

## ④ EL INSTRUMENTO NUEVO — `scripts/tinta-campo.mjs`

Mide **tinta, no bounds**, y **mide DOS cosas porque el defecto real resultó ser la segunda**: el hueco entre los renglones **y** que el valor tenga su altura entera.

⏪ **Su primera versión clasificaba por oscuridad** —rótulo en tinta 65 %, valor en tinta plena— **y dio un número sin sentido**: el disco del glifo y el borde de la caja caen en la misma banda que el rótulo. *Una clasificación por color sobre una imagen con más de dos cosas adentro no clasifica: reparte.*

⚠️ **Y su primera versión con hueco daba VERDE sobre el defecto**: el hueco ya existía antes de la cura (12 px); lo que faltaba era altura. *Es la tercera vez en esta ley que un instrumento mide algo verdadero al lado de lo que importa.* Rojo probado: ✗ con 6,7 dp · ✓ con 23,7.

## ⑤ 🔴 LO QUE NO PUDE VERIFICAR, Y CÓMO LO SUPE

Al medir 03 el defecto **persistía tras dos recargas completas**, con el mismo componente que en 05 ya estaba curado. Antes de escribir una segunda causa, **puse un marcador visible** (fondo amarillo en la caja) y conté sus píxeles: **0**.

⇒ **El aparato estaba corriendo un bundle viejo.** Todas las mediciones de 03 de esa tanda eran sobre otro código. **Cuarta vez hoy con esta clase**, y la única que se detectó *antes* de sacar una conclusión, porque esta vez el instrumento tenía su propio control.

**Queda pendiente y es lo primero de la próxima tanda:** verificar en píxeles **03, el alta y el pago**, con la letra del sistema en 1,3 y el marcador confirmado antes de medir.

## ⑥ AL BUZÓN
- **C** — el campo ahora **puede crecer** si la persona tiene la letra del sistema grande. Las pantallas con pie fijo o spacer `flex: 1` tienen que tolerarlo; si alguna no, es composición, no pieza.
- **mesa** — la escala de letra del sistema **no estaba en ningún gate**. Todo lo que fije un alto en dp y contenga texto tiene el mismo defecto latente; esto cura los dos campos, no la clase.
