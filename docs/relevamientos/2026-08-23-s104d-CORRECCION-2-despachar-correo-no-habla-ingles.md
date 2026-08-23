# S104-D · SEGUNDA CORRECCIÓN A MÍ MISMO — `despachar-correo` NO habla dos idiomas

**23-ago-2026 · pista D.** Cero cambios. **Corrige una afirmación mía que ya está
depositada en la ficha de `D-628`.**

---

## ⓪ QUÉ AFIRMÉ SIN VERIFICAR

En mi voto sobre cómo cerrar `D-628` dije, y A lo depositó en la ficha:

> *«a favor del Send Email Hook porque converge con `despachar-correo`, que ya
> existe y **ya habla dos idiomas**».*

**Lo verifiqué recién. La segunda mitad es falsa.**

*Lo miré porque mi voto quedó escrito en un canónico con mi razón adentro, y una
razón que nadie mide se vuelve cita. Es la misma clase de error que acabo de
corregir hace una hora — afirmar sobre un valor no medido.*

---

## ① LO MEDIDO

**Dentro de `plantillaHtml(d, tipo, idioma)` (`despachar-correo/index.ts:172-268`),
el parámetro `idioma` se usa EXACTAMENTE DOS VECES:**

| # | línea | uso |
|---|---|---|
| 1 | `:172` | la firma de la función |
| 2 | `:212` | `<html lang="${idioma === 'en' ? 'en' : 'es'}">` |

**Y nada más.** Frases en inglés en todo el archivo: **cero**.

⇒ **La función resuelve bien QUIÉN habla qué, y después escribe en español
igual.**

---

## ② LO QUE SÍ EXISTE, Y NO ES POCO

**La mitad difícil está construida y probada** (`:390-397`), con su acta citada
en el propio código (S88-A):

```ts
// El idioma del DESTINATARIO gobierna el lang del correo
  .from('user_preferencias')
  .select('idioma')
const idioma = pref?.idioma === 'en' ? 'en' : 'es';
```

**Resolver el idioma del destinatario desde UNA fuente de verdad ya funciona.**
Lo que falta es el texto traducido.

---

## ③ 🟠 Y DE PASO APARECIÓ UN DEFECTO PROPIO, QUE NO ES MÍO PERO ES DE MI TERRITORIO

**Hoy el correo declara `lang="en"` y adentro escribe español.**

*Eso es peor que no declarar nada: `lang` es una afirmación que leen máquinas —
lectores de pantalla, el ofrecimiento de traducir de Gmail, y los filtros de
spam.* **Un documento que se declara en un idioma y está en otro es una
incoherencia legible por máquina, y de las que puntúan mal.**

**Alcance medido, igual que el de `D-628`: hoy CERO.** Las 4 filas de
`user_preferencias` son `es`, así que la rama `'en'` **nunca se toma**. *Daño
presente cero; el defecto está armado esperando al primer usuario en inglés.*

---

## ④ QUÉ LE PASA A MI RECOMENDACIÓN — sobrevive, pero costaba más de lo que dije

**No la retiro: la mantengo, y con un argumento MÁS fuerte que el que di.**

Lo que cambia es el costo. Yo lo vendí como *«converger con algo que ya habla dos
idiomas»* —o sea, casi gratis—. **La verdad es que el mismo hueco existe en los
dos lados:** ni las plantillas de Auth ni `despachar-correo` tienen copy en
inglés. **Traducir hay que traducir igual.**

**Y por eso mismo converger es MÁS correcto, no menos:** si el hueco es el mismo
en las dos, hacerlo **una sola vez en un motor compartido** evita traducirlo dos
veces y evita que las dos traducciones se separen después. *Lo que se comparte no
es la traducción hecha: es el lugar donde hacerla una sola vez.*

**Corrección exacta para la ficha de `D-628`:**

| dice | debe decir |
|---|---|
| «converge con `despachar-correo`, que ya habla dos idiomas» | **«converge con `despachar-correo`, que ya resuelve el idioma del destinatario desde `user_preferencias` — pero cuyo copy también está solo en español. El hueco es el mismo en los dos lados, y por eso conviene cerrarlo UNA vez en un motor compartido.»** |

---

## ⑤ LO QUE ESTO DEJA SERVIDO

| # | Qué | Dueño |
|---|---|---|
| 1 | Corregir la razón de mi voto en la ficha de `D-628` | A |
| 2 | El `lang="en"` sobre texto español — ficha propia o nota dentro de `D-628` | A decide dónde |
| 3 | El copy en inglés de `despachar-correo` (37 tipos de aviso) | sin dueño — **es el mismo trabajo que el del correo de auth** |

**Nada de esto es urgente y lo digo explícito: los tres tienen alcance CERO hoy.**
*Se escriben para que el día que entre el primer usuario en inglés no se
descubran de a uno.*
