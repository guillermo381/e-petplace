# B → C · quién paga el teclado — **resuelto, y sin nada que te acuerdes de pasar**

**Frenaste bien.** `SuperficieChat` y `ModalDosAlturas` lo resuelven de maneras
**opuestas**, y montar una adentro de la otra pagaba el alto **dos veces**.

| pieza | qué hace con el teclado |
|---|---|
| `SuperficieChat` | se envuelve en `EvitaTeclado` y **se empuja entera** |
| `ModalDosAlturas` | **no se mueve: crece por dentro**, reservando `altoTeclado` |

---

## ① CEDE LA SUPERFICIE — y no es preferencia, son tres hechos

**① La hoja no PUEDE ceder: su comportamiento ES el requisito.** *«El teclado no
la empuja: crece por dentro»* está firmado en §3 y es uno de los dos rojos que
el founder nombró. Si cediera, el panel se movería y lo de arriba saltaría en
cada toque de un campo.

**② `KeyboardAvoidingView` mide contra la VENTANA, no contra su padre.** Adentro
de un panel cuyo alto es un `useSharedValue` animado, su cuenta no es «de más»:
**está midiendo otra caja.**

**③ La hoja ya TIENE el dato.** Vos resolvés el alto una vez y se lo pasás
(`altoTeclado`, que `R81` te exige). *Quien ya tiene el número es el que puede
repartirlo.*

---

## ② NO HAY PROP. No hay nada que pasar, así que no hay nada que olvidar

**Tenías razón en que `SuperficieChatProps` no exponía forma de ceder — y la
cura no fue agregar una prop.** Una `tecladoYaResuelto` sería exactamente lo que
mi propia `R81` condena:

> *Una garantía que la pieza ofrece y el consumidor tiene que acordarse de pedir
> no es una garantía: es una opción con buen nombre.*

Con una prop, olvidarla deja los dos manejadores vivos **y nada falla**: se ve
como un hueco raro debajo de la barra — la clase de defecto que nadie reporta.

**⇒ lo declara `ModalDosAlturas`, en el subárbol donde la afirmación es cierta.**
`SuperficieChat` lo lee y **no monta su `EvitaTeclado`**.

### Lo que eso significa para vos: **montás y ya**

```tsx
<ModalDosAlturas
  altura={altura} onAltura={setAltura} altoPantalla={alto}
  etiquetaAsa={t('…')}
  altoTeclado={altoTeclado}        // 🔴 lo único que tenés que pasar (R81)
  encabezado={<CabeceraCaso … />}
>
  <SuperficieChat … />             {/* cede solo: nada que declarar */}
</ModalDosAlturas>
```

**Y suelto, fuera de la hoja, `SuperficieChat` sigue igual que hoy** — el
default es `false` y resuelve su teclado como siempre. *Cero cambio para
adopción.*

⚠️ **Un detalle que va con esto:** adentro de la hoja, `SuperficieChat` **deja de
sumar `insets.bottom`** a la barra. El borde seguro ya lo paga la hoja con su
`insetBottom` — sumarlo dos veces era el mismo error, un piso más abajo.

---

## ③ El rojo que pediste: **los dos manejadores a la vez**

Nace **`R82`**, con dos brazos y los dos probados en rojo contra los archivos
reales:

| brazo | qué pasa si se rompe |
|---|---|
| **la hoja PROVEE** | si deja de declararlo, lo de adentro vuelve a montar su manejador **y nadie se entera** |
| **ninguna pieza de `ui` monta `EvitaTeclado` sin consultar el hook** | hoy es una sola; la regla existe **para la segunda** |

⚠️ **Y lo que `R82` NO mira, con su razón:** las **57 pantallas de `apps/`** que
montan `EvitaTeclado` quedan **afuera**. Una pantalla raíz **no vive adentro de
una hoja**, así que ahí montarlo es correcto — meterlas enrojecería 57 archivos
de código sano (`L-502`).

---

## Lo que te toca verificar en aparato

El gate dice *«no hay dos manejadores en `ui`»*, **jamás «el teclado se ve
bien»**. Lo que hay que mirar con el dedo: que al enfocar el campo **la hoja no
salte**, que la barra quede **pegada al teclado sin hueco**, y que al cerrar el
teclado la barra vuelva a respetar el borde del teléfono.
