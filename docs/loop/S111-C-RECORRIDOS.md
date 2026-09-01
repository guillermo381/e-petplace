# S111-C · LOS RECORRIDOS, EN VOZ DE USUARIO — escritos ANTES de construir

> Quedan acá para el recorrido del founder a su vuelta. Cada bloque se construye
> **contra esto**, caminos tristes incluidos.

---

## BLOQUE 2 · «NO TENGO MASCOTA, QUIERO ADOPTAR»

### Lo que hoy pasa, medido (S110-D, LOTE 1)

> **152 de 170 usuarios no tienen ninguna mascota.** El motor los representa
> como ciudadanos de primera clase —`get_estado_onboarding_dueno` devuelve
> `mascotas_count` explícito— **y la app no los deja entrar**: `index.tsx:64`
> ramifica por `tiene_familia`, `hogar` rebota a `/`, y del onboarding sólo se
> sale **creando una mascota**. *Es un lazo cerrado.*
>
> Y `mascotas_count` **viaja del motor al wrapper y ninguna pantalla lo lee**:
> `L-318` en su forma exacta — el número que contesta la pregunta existe, viaja,
> y nadie lo mira.

### EL RECORRIDO, en mi voz

«Vi una foto de un perro en Instagram y llegué acá. Todavía no tengo mascota
—por eso vine—. Me registro con mi correo, y en vez de pedirme la especie de un
animal que no tengo, la app me pregunta **a qué vine**. Toco *«quiero adoptar»*
y entro.

Adentro no me encuentro una pantalla rota ni un formulario a medio llenar: me
encuentro **mi casa vacía, y lo dice sin disculparse** — todavía no hay nadie
acá, y hay un camino claro para conocer a los que esperan. No me apura, no me
felicita, no me cuenta cuántos pasos me faltan.

**El Coach no me habla.** No sabe nada de mí todavía y no tiene de quién
hablarme: prefiero su silencio a un saludo genérico.

El día que adopte, esa casa se llena y el resto de la app —el expediente, los
servicios, las alertas— aparece **porque ya hay de quién.**»

### LOS CAMINOS TRISTES

«**Me registro para adoptar y me arrepiento.** No pasa nada: la cuenta existe,
mi casa sigue vacía y puedo dar de alta a la mascota que ya tenía cuando quiera.
La puerta no se cierra detrás de mí.»

«**Entro sin cuenta a mirar y me gusta uno.** Al postular me pide crear cuenta —
y no pierdo lo que estaba mirando. *Que me devuelvan al principio de la lista
después de registrarme sería castigarme por haberme decidido.*»

«**Tengo cuenta desde antes, sin mascota** (soy uno de los 152). Al abrir la app
entro igual que cualquiera, a mi casa vacía, en vez de quedar dando vueltas en
un alta que no quiero completar.»

### 🔴 LO QUE ESTE BLOQUE **NO** HACE, y no es recorte

**La vidriera de adopción no se construye todavía: no tiene motor.** Medido —
cero funciones de adopción/adoptable/padrinazgo/refugio en las 369 migraciones
con `CREATE FUNCTION`, y cero wrappers en `packages/api`. *Una vidriera sin
lector es un estante vacío con nombre bonito.* Pedido a A por buzón.

**Lo que sí se construye es la mitad que no depende de nadie** — el estado
«cuenta sin mascota» — y es la que desbloquea a los 152. *Construir la vidriera
encima del freno sería fabricar la pantalla que no puede llenarse.*

### LO QUE EXIGE, concreto

1. **El guard cambia de PREGUNTA.** Hoy pregunta *«¿tiene familia?»* y manda al
   onboarding. Tiene que preguntar *«¿terminó de entrar?»* — y una cuenta sin
   mascota **ya entró**.
2. **El alta pregunta A QUÉ VINO** antes de pedir una especie, y una de las
   respuestas crea la cuenta **sin mascota**.
3. **El hogar tiene su vacío honesto**, con camino y sin disculpa (Ley 17.5).
4. **El Coach calla sin mascota** (decidido) — *un coach que saluda sin conocer
   a nadie enseña a ignorarlo.*
