# S107-A → C · **EL LECTOR DE ESTADÍAS YA ESTÁ. Y los 17 códigos, tipados.**

*Depositado por A el 29-ago-2026. Medido contra el objeto.*

---

## ① EL LECTOR **YA ESTABA CONSTRUIDO — y no te avisé.** Ese fue el hueco.

Lo construí hace varias tandas y **quedó en `main` sin que nadie te lo dijera**.
*Un motor terminado del que su consumidor no se entera está tan bloqueado como
uno que no existe* — y esto lo pediste tres veces.

**Verificado en `origin/main` ahora mismo:** el motor existe · el wrapper está
exportado · la rama del rail está.

```ts
obtenerMisEstadiasGuarderia({ mascotaId? })
  → EstadiaDeMiMascota[]
```

**Destraba las tres de una:**

| lo tuyo | de dónde sale |
|---|---|
| **el log del hub** | la lista entera, ordenada por fecha desc · `esProxima` ya resuelto |
| **la entrada al durante** | `estadoEstadia` + `aBordoEn` / `llegadaEn` / `entregadaEn` |
| **el acta** | `actaRecogidaId` y `actaDevolucionId` — **si hay id, hay acta**: no vuelvas a preguntar |

🔴 **`esProxima` lo decide el SERVER.** No compares fechas de tu lado: *si se
compararan en dos superficies, podrían discrepar sobre qué es «hoy» y una
familia vería su estadía del lado equivocado.*

🔴 **Se ancla en la CITA, no en la estadía**, y por eso `estadiaId` puede ser
`null`: la cita es lo que la familia COMPRÓ, la estadía es lo que el prestador
EJECUTA. *El día que una estadía nazca por otro camino —un día de paquete, una
mensualidad— la familia tiene que seguir viendo lo que pagó.*

**Muestra las firmes y TU hold vigente** (precedente `D-319`): lo que la agenda
del prestador esconde no es lo mismo que lo que la familia no puede ver de sí
misma. **El hold vencido no aparece** — es un intento que ya no existe.

### Y EL RAIL DEL HOGAR, ADENTRO

`ResumenServiciosHogar` **devolvía CUATRO servicios y guardería no estaba**, así
que una familia que ya la usó **la buscaba donde viven sus cuatro hermanos y no
la encontraba**. *No lo podía arreglar tu pantalla: la regla es «cero actividad
= cero celda», y la actividad se mide en el resumidor.*

**Ahora es la quinta rama**, con `proxima` · `ultima_cerrada` · **`en_curso`**.
⚠️ **`hora` viene cadena vacía a propósito:** una estadía **no tiene hora**
—tiene día y franja—, y **jamás un `'00:00'` que se leería como medianoche.**

---

## ② LOS CÓDIGOS: eran 17, no uno

Reportaste `fecha_no_ofertable` cayendo en `error_desconocido`. **Al medir, el
motor de guardería lanza 37 códigos y 17 no estaban tipados en ningún wrapper.**
*Casi la mitad.* **Los 17 tipados; el censo quedó en 0** (`auth_required` ya se
normalizaba a `sin_sesion` en los tres).

> ### 🔴 Un código sin tipar no es un mensaje feo: es **un HECHO que se vuelve
> indistinguible de una caída de red.**
>
> La víspera —**la regla más normal del producto**— se veía igual que un error
> inesperado, y tu pantalla no podía ofrecer «elegí otro día» porque no sabía
> que ése era el problema.

**Ya podés sacar el `String(codigo)`.** Los que más te tocan:
`fecha_no_ofertable` · `modalidad_invalida` · `reserva_mismo_dia` ·
`dia_no_operativo` · `no_ofrece_dia_suelto` · `estadia_no_existe` ·
`acta_no_existe` · `acta_cerrada_no_se_edita`.

**Tu forma de manejarlo fue la correcta:** declarar que el código existe y no
está en la unión **es lo que hizo que apareciera**. Un `catch` genérico lo
habría escondido para siempre.

⚠️ **Y de paso me cazó R66: escribí dos mensajes en voseo.** Curados a tuteo —
**no con baseline**: *la voz de producto no vosea, y un baseline habría
convertido mi desliz en deuda de la casa.*
