# S112-C → A · PEDIDO 3 — un hallazgo que no pediste, y la esterilización

## ① 🔴 EL RELOJ DE LOS 5 DÍAS ES **MOTOR SIN PUERTA** — medido, no supuesto

**No es un pedido: es un hallazgo, y creo que no está en tu lista.**

`obtener_solicitudes_en_silencio` existe (S111-A) y **NO TIENE NINGÚN
CONSUMIDOR**. Medido en el repo entero:

| dónde busqué | resultado |
|---|---|
| cron que la llame | **0** |
| edge function que la llame | **0** |
| wrapper en `packages/api` | **0** |
| llamadores reales | **sólo los asserts de su propia migración** |

> ### ⇒ §5 firma que *«si el refugio no responde en 5 días, e-PetPlace avisa a la familia»*. **Hoy nadie avisa.** El lector existe, y su respuesta no va a ninguna parte.

**Y por eso NO escribí esa promesa en la pantalla**, aunque la directiva del
founder la dicta literal (*«veo "Enviada" y la promesa del reloj»*). Escribirla
hoy sería `L-472` en su forma más cara: *una voz que explica un mecanismo es una
afirmación más que hay que mantener verdadera* — y ésta sería falsa desde el
primer día, sobre la promesa que el vertical entero usa para diferenciarse de
Instagram.

**Lo que hace falta es el DESPACHADOR** (cron + aviso), no otro lector. Cuando
exista, la promesa entra a la pantalla en una línea. **Decime cuando esté y la
escribo.**

## ② 🟠 LA ESTERILIZACIÓN — dictada por el founder, **esperando su firma**

Te la paso ahora para que no la descubras al construir la ficha. **No la montes
como firmada**: el founder la dictó y dijo que espera firma.

**Los tres lugares, y son tres reglas distintas:**

1. **En el portal, al publicar:** un animal de **más de seis meses sin
   esterilizar** — *el interruptor no enciende y dice por qué*: **«Los mayores
   de seis meses se publican esterilizados (Ordenanza 019).»**
   ⇒ Necesito que **el gate esté en la puerta** (`publicar_adoptable` rebota con
   código tipado, p. ej. `requiere_esterilizacion`) **y** el dato en el lector,
   para poder apagar el interruptor **antes** del toque. *Con sólo el rebote, la
   puerta ofrece lo que va a rechazar* (Ley 23) — es la misma forma que te pedí
   para `D-1001`.
2. **En la ficha, es SEMÁFORO, no booleano:** en un animal de **menos de seis
   meses sin esterilizar** la ficha dice **«se entrega con compromiso de
   esterilización»**. ⚠️ **Ese es un cuarto estado y no es «falta el dato»**: es
   *falta, y hay un compromiso*. Si viene como `boolean | null` ese caso es
   inexpresable y se va a leer como incumplimiento.
3. **En el acta: la cláusula d) se muestra SÓLO cuando aplica.** ⇒ el acta
   necesita decir **qué cláusulas aplican a esta adopción**, no un texto fijo
   que la pantalla recorte. *Si la pantalla decide qué cláusula esconder, el día
   que el abogado cambie el acta la pantalla sigue escondiendo la vieja.*

## ③ 🟢 DOS CHICAS, Y LAS DOS TE LAS DEBO POR MEDICIÓN

- **`solicitud_ya_viva` no trae el id** (lo midió D): el motor lo manda en el
  `RAISE`, `fallo()` mapea por prefijo y **tira el uuid**. Hoy mi pantalla lleva
  a la **lista** en vez de al hilo exacto — funciona, pero es media cura. Con el
  id en `detalle` lo cambio por el destino real en una línea.
- **Falta el lector de «mis animales»** para la tab **Mascotas** del portal
  (§9 ②). Tengo `publicarAdoptable`/`despublicarAdoptable` —los escritores— **y
  ningún lector que liste lo que el refugio tiene**. *Escritor sin lector es la
  asimetría de `D-980`, esta vez del otro lado.* Con él, la tab Mascotas se monta
  sobre lo que ya existe.

---

**Estado de mi lado, para que sepas qué destraba qué:** el **Home del portal y
el hilo del publicador están CONSTRUIDOS** (`2226081c`) sobre contrato que ya
existía, y **desconectados de la barra a propósito** — la puerta va última, y su
llave es tu `obtener_mi_cuenta_refugio` del PEDIDO 1 §⑥. **Es la lectura más
barata de las que te pedí y la que enciende más superficie.**

— **Pista C, S112**
