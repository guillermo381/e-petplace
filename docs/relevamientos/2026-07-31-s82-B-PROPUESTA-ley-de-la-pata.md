# PROPUESTA — LA LEY DE LA PATA (marca de elección)

**S82-B, 31-jul-2026. PROPUESTA SIN FIRMA.** Se escribe DESPUÉS del gate
(regla 80: la ley va detrás del resultado firmado, nunca delante). Su
destino natural es `DIRECCION_ARTE` como entrada nueva, o una cláusula
de la Ley 12 — **eso lo decide la mesa; este documento no lo asume.**

---

## POR QUÉ YA ES UNA LEY Y NO TRES DECISIONES

La pata marca la elección en **tres controles distintos**, firmados en
tres gates sucesivos: `FiltroPills` · `FiltroMascotas` ·
`SelectorSegmentado`. La tercera vez que una decisión se toma igual, ya
no es una decisión: es una regla que nadie escribió. Y una regla sin
escribir se re-discute en el cuarto control, con el riesgo de que salga
distinta — no por desacuerdo, sino porque nadie tenía dónde mirar.

**El disparo de esta propuesta es exactamente ese cuarto control.**

---

## EL TEXTO PROPUESTO

> **LA MARCA DE LA ELECCIÓN ES LA PATA.** Cuando un control ofrece
> alternativas y el usuario elige una, lo elegido se marca con la huella
> de marca apoyada sobre su canto — no con un check, no con un punto, no
> con un borde. La marca es UNA pieza (`MarcaEleccion`) y su anatomía no
> se re-dibuja: **PATA 24 · MONTA = PATA/3 · −14° · absoluta sobre el
> canto.**
>
> **Sus tres condiciones:**
>
> **① Aparece SOLO en la elegida.** Nunca en las demás, nunca "apagada"
> ni en gris. Una marca que existe en todas no marca nada — deja de ser
> señal y pasa a ser decoración repetida.
>
> **② JAMÁS adentro de la placa.** Los glifos b′ ya contienen una huella
> (Ley 12); adentro, la marca es una huella entre huellas y deja de
> señalar. Es **hermana** del contenido, jamás hija de su placa.
> *(Mecanizada en `verify:diseno` R22.)*
>
> **③ Apoyada sobre el CANTO, montando hacia afuera.** De ahí sale la
> obligación de quien la porta: **reservar el aire que la pata invade.**
> Un contenedor que recorta a sus bordes la parte por la mitad.
>
> **El color es del consumidor**, no de la pieza: la marca habla el
> acento del control que la porta. Una pieza que elige su propio color
> decide dosis desde adentro, y eso es de la pantalla (Ley 4).

---

## LOS DOS PORQUÉS QUE NO SE PUEDEN PERDER

Los números parecen arbitrarios y no lo son. Si se copian sin el porqué,
el primero que los toque los "redondea":

- **La MONTA es lo que la hace PISAR.** Una marca que no monta está *al
  lado*, y al lado no marca — señala que ahí hay algo, no que ESO es lo
  elegido. `PATA/3` se expresa como RELACIÓN y no como el número 8 a
  propósito: si la pata cambiara de tamaño, la monta lo acompaña sola.
- **El −14° es lo único que la separa de un símbolo centrado.** Algo que
  se apoya casi nunca cae recto. Sin la inclinación, la huella se lee
  como un ícono de estado; con ella, se lee como una pata que pisó ahí.

---

## LO QUE LA PROPUESTA **NO** DECIDE

- **Si la pata reemplaza al relleno pleno en todos lados.** Hoy convive
  con el relleno de `SelectorOpcion` naturaleza `existe` (7bis). La
  pregunta "¿un control puede tener pata Y relleno?" está ABIERTA y no
  la resuelve este texto. *(Dato para esa decisión: cuando el founder
  firmó la pata en la hilera, el relleno pleno de esa pieza MURIÓ — pero
  murió ahí, no como regla general.)*
- **Si aplica a controles de FILTRO además de los de ELECCIÓN.** Hoy
  `FiltroPills` filtra y `SelectorSegmentado` elige, y los dos la usan.
  Puede ser correcto —marcar "lo que está activo" es el mismo trabajo—
  o puede ser que hayamos unificado dos cosas distintas por parecido de
  forma. **Es exactamente el error que cometí con sin-tarjeta**, así que
  lo dejo abierto en vez de resolverlo de paso.
- **Dónde vive la ley.** DIRECCION_ARTE, la skill, o las dos.

---

## SU MECANIZACIÓN, YA CONSTRUIDA

`verify:diseno` **R25**: un `rotate: '-14deg'` fuera de la primitiva =
ROJO, con su ancla y su baseline con nombre (1: el `MarcaElegido` de
`filtro-pills`, de C — cuando adopte la primitiva, el lint pide bajar el
baseline). La ley no depende de que alguien se acuerde: el cuarto
control no puede reinventarla porque el lint no lo deja.

**R22** (de C) ya mecaniza la condición ②.

Lo que **no** está mecanizado y se declara: la condición ① (aparece solo
en la elegida) y la ③ (el aire reservado) viven en el contrato de la
pieza y en su JSDoc, no en el lint. La ③ está **resuelta por
construcción** en `SelectorSegmentado` —la pieza se cobra su propio
aire— pero **no** en los controles de C, donde el aire lo pone el
consumidor por ser contenido de un scroll.
