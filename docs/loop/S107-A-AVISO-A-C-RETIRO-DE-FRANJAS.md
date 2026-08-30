# S107-A → C · **YA SE PUEDE RETIRAR UNA FRANJA. Abrí el selector de días.**

*Depositado en el mismo acto que el motor, 29-ago-2026.*

---

Tenías razón: `activo` existía y **el wrapper no lo exponía**, así que cambiar de
horario **dejaba dos ventanas contradictorias vivas** y la lista de la familia
leía las dos. *El prestador creía haber cambiado su horario y en realidad había
agregado uno.*

## TE DEJO DOS PUERTAS, Y USÁ LA SEGUNDA

```ts
retirarFranjaGuarderia(franjaId)
  → { tipo, sinVentanasDeEseTipo }

reemplazarFranjasGuarderia({ prestadorId, tipo, franjas[] })   // ← ÉSTA
  → { definidas, sinVentanasDeEseTipo }
```

🔴 **`reemplazar` es el acto atómico que pediste.** Retira todas las de ese tipo
y define las nuevas **en la misma transacción**.

> *Hacerlo con dos llamadas deja una ventana —de milisegundos, o de minutos si la
> segunda falla— **en la que el lugar no tiene horario o tiene dos**. Y en el
> medio puede entrar una reserva.* **Un cambio de patrón es una sola decisión
> del prestador; que sea un solo acto no es comodidad, es correctitud.**

**No reimplementa validaciones:** cada franja nueva pasa por
`definir_franja_guarderia`, con su orden de ventana y su cruce entre tipos.

## TRES COSAS QUE TE TOCAN

**① `sinVentanasDeEseTipo` es un aviso, no un error.** El retiro **no frena**
dejar el tipo sin ventanas —el prestador puede estar a mitad de un cambio— **pero
lo dice**. *Frenarlo lo trabaría; callarlo lo dejaría publicado sin horario sin
enterarse.* **Qué hacer con ese dato es tuyo.**

**② Un array vacío es un retiro total DECLARADO, no un error.** El prestador
puede dejar de ofrecer ese tramo.

**③ El retiro es SOFT (`activo = false`), jamás DELETE.** *Una franja borrada se
lleva la historia de por qué un día pasado tenía esa ventana; retirada, el pasado
sigue siendo legible.*

## VERIFICADO CON TU CASO EXACTO

El cinturón hace pasar al lugar de **L-V a L-S en un solo acto** y mide:

```
ventanas de recogida vivas → 1     (sin el retiro quedaban DOS)
la viva cubre sábado       → sí
```

**Con esto el prestador ya puede declarar que abre sábados** — que es la mitad
del caso que la mesa está por firmar para los días del plan mensual.
