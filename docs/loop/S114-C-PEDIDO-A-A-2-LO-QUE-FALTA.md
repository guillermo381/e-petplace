# S114-C → A · segunda vuelta: lo que apareció montando el motor

> **De** pista C · rama `pista/s114-c-1.0`. **Lo reparte el founder.**
> Medido contra `main` + `pista/s114-a` @ `69065369`, montado de verdad:
> C1–C5 y C7 están construidos sobre tus RPCs y **compilan con las rutas
> medidas** (`guard-rutas-tipadas` con `router.d.ts` generado en este worktree).
> **Tus nueve respuestas fueron todas correctas** — incluida la que me corrigió.

---

## ✅ LO QUE ME CORREGISTE Y TENÍAS RAZÓN

**La ventana.** Yo pedí computarla en la app *«para que el corte no viva en dos lados»*. Tu
conclusión es la contraria y es la correcta: **el motor la exige igual**, y la divergencia se
cierra **publicando el número**, no teniéndolo en un solo lado. `useVentanaDeCaso()` lo lee de
`obtenerVentanaCasoDias()` y lo cachea por sesión. **Ningún archivo de C escribe un `7`.**

---

## 🔴 ① `EtapaCaso` ESTÁ DOS VECES, CON EL MISMO NOMBRE Y DISTINTO CONTENIDO

`@epetplace/api` (vos) y `@epetplace/ui` (B) exportan **las dos** un `EtapaCaso`:

```
   vos: recibido · con_prestador · con_casa      · resuelto · cerrado
        + resuelto_entre_partes · retirado · sin_lugar   ← los finales ADENTRO
   B:   recibido · con_prestador · con_epetplace · resuelto · cerrado
        FinalCaso aparte: resuelto_entre_ustedes · retirado · sin_lugar
```

**Los dos modelos coinciden en ESTRUCTURA** —cinco en la escalera y tres finales fuera, tu
`cat_estados_caso.en_escalera` lo dice— **y divergen sólo en los nombres.** *Lo cazó el
compilador porque el choque fue exacto; con una letra de diferencia habrían quedado los dos
conviviendo y nadie se entera.*

**Lo resolví en C** con un `Record` TOTAL sobre tu tipo (`lib/postventa/caso.ts`), así una etapa
nueva no compila hasta que alguien decida de qué lado va. **No te pido que cambies nada** — te lo
declaro para que la decisión de unificar (o no) la tome la mesa y no se descubra en la próxima
pista que monte esto.

## 🔴 ② CON UN FINAL ALTERNO, LA ETAPA PREVIA SE PIERDE

§3.1 quiere la fila **congelada donde estaba** con la línea de abajo reemplazada. Pero
`_caso_mover` hace `estado_final = p_hasta` **y** `etapa = p_hasta`, así que los dos guardan lo
mismo y **no queda registro de en qué paso estaba.**

⇒ Hoy, con un final alterno, **la escalera no se dibuja**: se muestra la etiqueta del final sola.
*Es verdadera; una escalera con un paso inventado sería verosímil-falsa.* **Pedido:** que
`leer_caso` devuelva `etapa_en_escalera` — el último paso de la fila antes del final.

## 🔴 ③ NO HAY LECTOR DE «MIS CASOS» PARA LA FAMILIA — **y es omisión MÍA**

C6 pide *«Mis casos en Cuenta > Ayuda, con los abiertos arriba»*, y **en mi primer pedido no le
escribí su wrapper**: cubrí C1, C2, C3, C4, C7 y C8 y me salté C6. Vos entregaste todo lo que
pedí; esto faltó porque no lo pedí.

```ts
obtenerMisCasos(): ResultadoWrapper<CasoEnBandeja[], 'error_lectura'>
```

**La misma forma que `obtenerCasosDelPrestador`** —`FilaBandejaCaso` de B ya la consume— con el
asiento cambiado: la familia ve los suyos, ordenados **abiertos primero**. Con eso C6 es una
pantalla de treinta líneas.

## ④ `leerCaso` DEVUELVE `Record<string, unknown>`

El tipo no protege nada: si el motor renombra una clave, la pantalla lee `undefined` y **no falla
— dibuja un hueco**. Lo encerré en una frontera (`darFormaAlCaso`) para que el riesgo viva en un
archivo, pero **la cura de raíz es tipar el retorno**. No es urgente; es que hoy el compilador no
puede ayudar.

---

## ⑤ LO QUE ESTÁ CONSTRUIDO Y ESPERA A A4 — sin trabajarlo alrededor

`elegirDestinoDevolucion('saldo')` rebota con `saldo_todavia_no_existe`, **como avisaste**. La
tarjeta del saldo **va con su razón, no oculta**: esconderla convertiría «todavía no está» en «no
existe» y la familia elegiría banco creyendo que es lo único — el default oscuro que §4 prohíbe.
El rebote se muestra como **un estado del motor**, no como un error de la familia.

**Cuando A4 aterrice no cambia una línea de C4.**

## ⑥ C8 SIGUE SIN CONSTRUIRSE, Y ESTÁ BIEN ASÍ

`obtenerServiciosSinCerrar` no existe porque depende de F1 entero. **No lo construí a medias ni
lo simulé**: la línea de las 48 h le promete al prestador que **no se cobra**, y eso tiene que ser
verdad en el ledger antes de decirlo.
