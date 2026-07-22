# LETRA — EL CUIDADO ESPECIAL (S74, dictado del founder, pendiente de firma)

> **Estado: BORRADOR DE MESA — espera firma founder.** Dictado en sesión S74
> (22 Jul 2026), pensado y bordeado por la mesa. **Destino:** enmienda a
> `BIO_EXPEDIENTE.md` (nivel SEGURIDAD de A3.3) + **enmienda de D-469** (que
> deja de llamarse "alerta de manejo" y pasa a ser EL CUIDADO ESPECIAL) +
> **nace D-500** (el motor de escalada).
> **Contrastes obligatorios:** `MODELO_PRODUCTO` §8.4 (la protección es
> soporte, no sanción) · `BIO_EXPEDIENTE` A3.3/A3.4 (la matriz por actor y
> el nivel SEGURIDAD gateado) · `MODELO_LOYALTY` §7.6 (el patrón del riel:
> la alerta manda sobre el beneficio) · `DISEÑO_EXPERIENCIA` Ley 17.6 (ser
> específico gana a ser ingenioso) · L-139 (el verosímil-falso es peor que
> el null).
> **Precedente de método:** `nervioso_otros_perros` (S69) — la fila que
> separó miedo/evitación de reactiva: información conductual SIN etiqueta
> de carácter.

> **NOTA DEL DEPÓSITO (S74-A, 22 Jul 2026):** depositada VERBATIM del
> literal de mesa. De las tres piezas del destino, HOY se ejecutan dos:
> la enmienda de D-469 y el nacimiento de D-500 (ambas en
> `DEUDAS_CANONICAS.md`, con los ítems del §11 marcados PENDIENTES DE
> FIRMA). **La enmienda de `BIO_EXPEDIENTE` A3.3 NO se toca todavía** —
> espera la firma del §11 (declarado, no olvidado). Cero construcción
> (§10 de esta letra).

---

## 1. La tesis (founder, S74 — verbatim)

Sobre por qué el modelo se abre de "riesgo" a "manejo":

> *"En mascotas que requieren manejo especial, no solo porque puedan tener
> problemas de conducta, ansiedad — tal vez porque necesitan apoyo. Dentro
> del Bio-Expediente debemos crear una opción de manejo especial y marcar
> casuísticas para estas; esto debe viajar a todos sus cuidadores,
> incluyendo la recepcionista."*

Y sobre la escalada por repetición:

> *"Una marca temporal que se repite más de 5 veces es recomendación de
> cuidado profesional, y solo se quita hasta que un profesional dice que se
> va. Esto es por cuidado tanto de la familia como de los profesionales. No
> se trata de estigmatizar, pero tampoco de esconder un problema que hay que
> tratar. Se le dice a su pet parent con honestidad, pero ofreciendo camino
> cuando pase."*

**El eje que este dictado mueve** (y por qué la letra vieja de D-469 queda
corta): el modelo anterior apuntaba a RIESGO — *"necesita bozal para
revisión"*. Este apunta a **CÓMO SE LO ATIENDE**. La diferencia no es de
tono: es de sujeto. *"Ojo con este perro"* protege al profesional del
animal; *"a este perro se lo atiende así"* protege al animal Y al
profesional, y de paso deja de ser una advertencia para volverse una
instrucción de cuidado. Un perro ciego no es un riesgo; es un perro al que
hay que avisarle con la voz antes de tocarlo.

## 2. El objeto: UNO SOLO, con marca

**Un solo `cuidado_especial` por mascota** (lista, no campo único). Cada
entrada:

| Campo | Qué es |
|---|---|
| `codigo` | **Del catálogo, jamás texto libre** (§3). |
| `naturaleza` | `temporal` \| `definitiva` — **default del catálogo**, no del que carga. |
| `procedencia` | Quién la observó (persona + negocio) y cuándo. Siempre visible. |
| `origen` | `observada` (un cuidador la vio) \| `compuesta` (derivada del expediente, §4). |
| `estado` | `vigente` \| `recedida` \| `escalada` (§5, §6). |
| `nota` | Texto libre OPCIONAL del observador, **jamás sustituye al código**. |

**Por qué una sola cosa y no dos:** quien la lee es la recepcionista con la
mascota entrando por la puerta. Necesita UNA lista de cómo se maneja este
animal, no dos pantallas y una regla que entender. La diferencia entre
temporal y definitiva es problema del sistema, no suyo. *(Decisión founder,
S74, sobre las dos opciones que la mesa planteó.)*

## 3. El catálogo — donde se gana o se pierde el anti-estigma

**Regla dura, en piedra: cada entrada del catálogo NACE ESCRITA EN VOZ DE
MANEJO.** La voz no es del que carga el dato: es del catálogo. Si alguien
siembra la tabla con la palabra *"agresivo"*, todo este diseño se cae en una
fila.

- ✅ *"Necesita bozal para la revisión"* — ❌ *"Muerde"*
- ✅ *"Se altera con otros perros en la sala"* — ❌ *"Reactivo"*
- ✅ *"Necesita que su familia esté presente"* — ❌ *"Inseguro"*

**Las cuatro casuísticas v1** (semilla, el founder firma el contenido final):

1. **Manejo físico.** Necesita bozal para la revisión · requiere dos personas
   para la contención · no tolera decúbito · no se lo levanta del abdomen
   (post-quirúrgico).
2. **Sensorial y de capacidad.** No ve · no oye · movilidad reducida:
   necesita rampa o alzada asistida.
3. **Ambiental y emocional.** Necesita esperar fuera de la sala · se altera
   con otros perros · necesita que su familia esté presente · necesita
   sesiones más cortas.
4. **Clínico de manejo.** No puede ayunar · lleva medicación previa indicada
   por su veterinario · alergia de contacto (producto o material).

**Vocabulario, dos lenguas:** el catálogo nace es+en (DEFINICION_SOFTLAUNCH).
Y **las strings de producto van en tuteo neutro** (regla 27 · L-148) — el
acento de la mesa no viaja al producto.

## 4. Las dos marcas

- **TEMPORAL.** Se observa en un momento. **Si nadie la vuelve a observar,
  DEJA DE PRESIDIR — no se borra** (letra ya firmada en D-469: vigencia, no
  permanencia). Pasa a `recedida`: sigue en el historial, sale de la vista.
  *La razón, en piedra: un animal que se asustó una vez no puede quedar
  marcado de por vida por el sistema que dice cuidarlo.*
- **DEFINITIVA.** No caduca. Ciego, sordo, movilidad reducida, secuela
  quirúrgica.

**La regla de composición (Ley 23 + MODELO_PRESENCIA §3 — nace compuesto,
jamás vacío):** cuando una entrada `definitiva` corresponde a una condición
corporal, **su fuente natural es el expediente clínico, no la observación
suelta**. Si el expediente ya trae ceguera bilateral como evento, el cuidado
especial se **deriva** (`origen='compuesta'`) — a nadie se le pregunta lo
que el sistema ya sabe. Un prestador PUEDE agregar una definitiva por
observación, pero nace `origen='observada'` con su procedencia visible, y un
profesional puede confirmarla contra el expediente.

**Corrección:** una definitiva mal cargada no se borra — se corrige por el
camino existente de corrección de dato, porque el expediente es append-only.

## 5. La escalada por repetición (dictado founder + los dos bordes de mesa)

**Una temporal que se repite pasa a RECOMENDACIÓN DE CUIDADO PROFESIONAL.**
Ya no se apaga sola: **solo la saca un profesional.**

**Umbral firmado por el founder:** más de 5 observaciones.

**Los dos bordes que la mesa le pone (y el porqué):** tal como quedó
dictado, un solo cuidador al que ese animal le cae mal puede observarlo 5
veces y escalarlo solo — la marca se vuelve un arma de una persona. Los
bordes:

1. **Al menos DOS profesionales distintos** entre las observaciones.
2. **Ventana móvil de 12 meses.** Cinco veces en cuatro años no es un
   patrón: es una vida larga.

**Solo escalan las temporales.** Una definitiva no escala — ya es
permanente.

**Quién la saca:** un profesional del oficio (no recepción, no el dueño). Al
sacarla declara el porqué, y ese retiro queda con su procedencia — igual que
la observación. *La simetría importa: si poner requiere nombre y fecha,
sacar también.*

## 6. Quién escribe y quién ve

- **Escriben dueño Y prestador** (letra firmada D-469). El dueño ve todo y
  **puede agregar su voz; no puede borrar la observación de un
  profesional.**
- **Viaja a TODOS los cuidadores, recepción incluida** (dictado founder S74).
  Es la excepción que ya existe en `BIO_EXPEDIENTE` A3.3 regla 2: la alerta
  de seguridad **nunca se destila y nunca se oculta**, atraviesa la matriz
  por actor. El cuidado especial hereda esa condición.
- **Por qué la recepción:** lo recibe en el mostrador y el riesgo — y el
  cuidado — es suyo. Decisión de seguridad laboral antes que de privacidad
  (founder S72), ahora ampliada: *la app también cuida al equipo.*

## 7. La voz al pet parent — honestidad con camino

**Se le dice, siempre.** Nada de esto es secreto para la familia: una marca
que el dueño no ve es una ficha oculta, y este producto no las tiene.

**Cuándo se dice:** la observación suelta **no interrumpe** — vive en el
expediente. **La escalada SÍ se comunica**, porque cambió de naturaleza: dejó
de ser un episodio y pasó a ser algo que hay que tratar.

**Cómo se dice** (voz de producto, tuteo neutro — texto de referencia, la
string final pasa por su gate):

> *"A Thor le está costando la sala de espera: tres cuidadores lo
> registraron en los últimos meses. No es un problema de carácter — es algo
> que se trabaja, y hay entrenadores que trabajan justo esto."*

Los tres rasgos exigibles de esa voz: **nombra el hecho** (no el carácter) ·
**muestra la procedencia** (quiénes, cuándo) · **termina en camino, jamás en
etiqueta**.

## 8. EL RIEL ÉTICO — la marca existe por el animal, jamás por la venta

Herencia directa de `MODELO_LOYALTY` §7.6 y P11, y es lo que impide que este
modelo se pudra:

1. **La marca jamás nace de una oportunidad comercial.** Nace de una
   observación de cuidado. Si algún día una marca aparece porque conviene
   vender adiestramiento, el sistema entero deja de ser creíble.
2. **El camino se ofrece AL LADO, jamás DENTRO del momento de cuidado.** La
   recepcionista ve el manejo; no ve una oferta. El dueño ve el camino en su
   superficie, no en la sala de espera.
3. **La marca jamás distorsiona urgencia ni recomendación clínica.**
4. **El cuidado especial no es un peaje.** Ningún servicio se bloquea por
   tener una marca. Un animal con manejo especial se atiende — con su
   manejo.

## 9. Lo que este modelo JAMÁS hace

Etiquetas de carácter · marcas permanentes por un episodio · scores de
riesgo · rankings de mascotas "difíciles" · marca visible para otros dueños
· texto libre como sustituto del código · una marca que el dueño no pueda
ver · una banda vacía en pantalla ("tiene una alerta" sin decir cuál es
exactamente el verosímil-inútil que prohíben Ley 17.6 y L-139).

## 10. El corte de construcción — por qué en dos deudas

**D-469 ENMENDADA — el cuidado especial v1** (deja de llamarse "alerta de
manejo"). Alcance: el catálogo con su voz, el objeto con sus marcas, la
composición desde el expediente, escritura de dueño y prestador con
procedencia, la vigencia que hace receder, y la superficie en los cuatro
oficios + recepción. **Esto es lo que destraba la banda que hoy está gateada
en `BIO_EXPEDIENTE` A3.3.**

**D-500 NACE — el motor de escalada.** Contar repeticiones con sus dos
bordes (2 profesionales, ventana 12 meses), convertir a recomendación
profesional, el candado de que solo un profesional la saca, y la voz al pet
parent con su camino. **Va aparte por dos razones:** (1) necesita el motor de
disparo por eventos que está DISEÑADO y no construido — el mismo que
alimentará alertas y loyalty; es un consumidor más de esa corriente, no
infraestructura nueva (`MODELO_LOYALTY` §8); (2) **la primera mitad puede
shippear sin esta**: catálogo y marcas funcionan solos desde el día uno.

**Lo que S74 hace hoy con esto: NADA de construcción.** Se deposita la letra
y el boceto de la vista de recepción **declara dónde entrará la banda** sin
dibujarla — para que el día que D-469 esté lista se AGREGUE y no se rehaga la
pantalla.

## 11. Preguntas abiertas para la firma del founder

1. **El contenido del catálogo v1** (§3): las cuatro casuísticas son semilla
   de mesa. Se firman entrada por entrada, con su voz y su naturaleza por
   default.
2. **Los dos bordes de la escalada** (§5): 2 profesionales distintos +
   ventana de 12 meses son propuesta de mesa sobre el umbral de 5 que el
   founder firmó. Si los rechaza, la escalada queda como fue dictada.
3. **La comunicación de la escalada** (§7): la mesa propone que la
   observación suelta no interrumpa y la escalada sí se comunique. El
   founder puede querer que TODA marca se comunique al dueño al nacer.

## Historial

- **borrador (S74, 22 Jul 2026):** dictado del founder en mesa (el eje de
  riesgo a manejo, el objeto único con marca de catálogo, la escalada por
  repetición >5 con retiro solo-profesional, viaja a todos los cuidadores
  incluida recepción, honestidad con camino al pet parent) + mejoras de mesa
  (la voz de manejo como propiedad del catálogo, los dos bordes de la
  escalada, la composición desde el expediente para las definitivas, el riel
  ético de §8, el corte D-469/D-500 para que la primera mitad shippee sola).
  Reemplaza el alcance de D-469 v1 (S72), que apuntaba solo a riesgo.
