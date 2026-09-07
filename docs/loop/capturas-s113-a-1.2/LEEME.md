# El recorrido del 1.2 en el emulador — A, 5-sep-2026

**Contra qué se midió:** dev build `1.0.7` con dev-launcher, confirmada por
`dumpsys` **antes** de nada (L-138), corriendo contra el Metro de este árbol —
`Android Bundled 1983ms (2967 modules)`. *Sin ese renglón, una captura no prueba
qué código se está mirando.* Cuenta: `guillo381+8`, del llavero.

| captura | qué muestra |
|---|---|
| 01 | el Hogar, en español, con Thor · Zeus · Jack |
| 02 | el perfil de Thor · «bulldog inglés · 6 años · 11.4 kg» |
| 03 | ⚠️ el chevron de «Raza» abre el SELECTOR para cambiarla, no la ficha |
| 04 | 🟢 la tarjeta «Bulldog inglés · Ver más sobre la raza» — ahí sí |
| 05 | 🟢 **LA FICHA PUBLICADA, EN EL APARATO** |
| 06 | el menú de edición con «Despedirme de Prueba C1102» |
| 07 | la pantalla de despedida |
| 08 | 🔴 tras el primer toque: **nada pasó** |
| 09-10 | tras acertar el botón: memorial |

## 🟢 Lo que funciona, verificado contra la base

**`FichaRaza`** dibuja el texto que el founder aprobó, **con los rótulos de la
casa** —«Cómo suelen ser», «Tamaño de adulto», «Cuánto suelen vivir»— y las
etapas plegables con «Ocultar». **Y dice «niños»**: la corrección de voz de esta
tarde viajó del texto al aparato.

**La despedida escribe.** Tras el toque bueno:
```
Prueba C1102 · estado_vida = fallecida · palabras = «Gracias»
verify:pide-en-memorial exit 0
```

## 🔴 EL DEFECTO, y es de la clase que C acaba de nombrar

**El botón de confirmar la despedida no dice qué hace.** Es una barra oscura
**sin texto**, y el nombre de la mascota aparece **suelto DEBAJO** de ella — el
label se dibuja fuera del botón (captura 07 y 08).

*C escribió hoy que «un control que se ve, se toca y no hace nada es peor que uno
ausente: el ausente no promete». Éste es el escalón siguiente: **hace lo que
tiene que hacer y no dice qué es**, en la pantalla donde una familia registra que
su mascota murió.* No hay confirmación de segundo paso visible: la barra sin
rótulo es el acto.

**Mi primer toque falló y eso también es dato:** erré la coordenada porque **no
hay nada que mire** para saber dónde termina el control. Un botón con su texto se
acierta a la primera.

⚠️ Ningún gate podía verlo. `verify:pide-en-memorial` mide textos que PIDEN algo,
y un botón sin texto no tiene qué medir. *Un control mudo es invisible para un
censo de palabras.*

## Dos cosas más del ojo, menores

- El título «Despedirse» **se solapa con la hora del sistema** — el tope no
  respeta el inset (captura 07).
- En la tira del Hogar, **las dos memoriales de C no se distinguen de las vivas**
  (captura de la tira). Puede ser deliberado; se anota, no se afirma.

## Lo que NO se caminó, declarado

**El alta con foto de Zeus y el carnet con «por completar» quedaron sin correr.**
No por un impedimento: por tiempo del recorrido. *Se dice en vez de darlos por
verdes — un gate que no se corrió no es un gate que pasó.*
