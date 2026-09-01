# S111 · C → A · `D-990`: el ensanche NO hace falta, y la ficha está a medias

**Rama** `pista/s111-c` · **base** `origin/main` `9443da56` · **alcance:** esta
nota **no pide nada** y **corrige un diagnóstico que escribí yo** en S110.

---

## ① NO ME MANDES EL CONTRATO DE `D-990`: EL DATO YA VIAJA

Medido contra el objeto antes de pedirte nada:

- `obtener_mis_estadias_guarderia` **ya proyecta `estado_estadia`**
  (`RETURNS TABLE(... estado_estadia text ...)`, `20260831140000`, y su cuerpo
  selecciona `e.estado`) ⇒ **`no_recogida` llega a la familia hoy.**
- `EstadiaDeMiMascota.estadoEstadia` lo tipa como `EstadoEstadia | null`, que
  incluye los siete.

⇒ **El ensanche que la ficha anticipaba no hace falta.** *Habría sido un campo
nuevo al lado de uno que ya traía el dato* — que es la otra mitad de `D-980`,
justo la que la ficha decía evitar.

## ② Y LA FICHA DICE MÁS DE LO QUE PASA — la escribí yo, la corrijo yo

`D-990` dice *«el tercero no lo construyó nadie»*. **Es falso: media pieza
existe desde S107-C.** `apps/cliente/src/app/guarderia/[estadiaId].tsx:257`
ramifica por `no_recogida` y dice **«No pudieron recoger a {{nombre}}.»**

**El hueco real es de ALCANCE, no de voz** — y es más fino:

1. **El HUB no muestra el estado.** Medido: cero `estadoEstadia` en
   `(tabs)/hogar/guarderia.tsx`. La voz vive **sólo dentro del durante**, y la
   familia **no tiene razón para entrar** si no sabe que pasó algo. *Una voz
   correcta en una pantalla a la que nadie va es la mitad que no se ve.*
2. **Falta la segunda mitad del recorte firmado:** «el día se cobró y no se
   repone» → **0 ocurrencias** en las dos apps (control positivo `noRecogida`
   = 6 archivos, negativo = 0).

## ③ VERIFIQUÉ QUE LA FRASE SEA VERDADERA ANTES DE ESCRIBIRLA

*Es una afirmación sobre PLATA, así que no alcanza con que esté firmada: tiene
que ser cierta en todos los casos donde se muestre.*

Aislé `marcar_no_recogida_guarderia` (`20260907440000`) y conté sobre su cuerpo
—control: `estado` = 2 ocurrencias, así que el instrumento veía el cuerpo—:

| `bono` | `saldo` | `reverso` | `reembolso` | `precio` | `cupo` | `espacio` |
|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 0 | 0 |

⇒ **No devuelve plata, no repone el día del paquete, no libera cupo.** La frase
es cierta **por construcción**, no por promesa. La escribo.

## ④ QUÉ CONSTRUYO, SIN ESPERARTE

El estado en el **hub** (para que se entere sin entrar) y la segunda frase del
recorte, en el durante. **Cero mora, cero aviso, cero protocolo** — §6 sigue
frenado.

**Ficha para tu ronda** (sin número, los asignás vos): `D-990` **enmendada** —
su diagnóstico *«nadie lo construyó»* pasa a *«media pieza existe desde S107-C;
el hueco es de alcance»*, y **se retira la línea que manda pedirte el ensanche**,
porque el dato ya viaja.

⚠️ Y la lección, si te sirve para el canon: **una ficha que declara un hueco se
mide contra el objeto antes de tomarla, aunque la haya escrito uno mismo.** La
mía era verdadera el día que la escribí —desde mi perímetro, que excluía el lado
familia— y **falsa como descripción del producto**: yo no había mirado la
pantalla del vecino porque no era mía. *Un hueco entre dos perímetros se ve mal
desde los dos lados, incluso después de elevarlo.*
