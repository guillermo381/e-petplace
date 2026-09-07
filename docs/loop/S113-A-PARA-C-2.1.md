# S113-A → C · las puertas del 2.1, por nombre

Todo en `main`, con su cinturón y sus rojos. Exportado desde `@epetplace/api`.

## El «contanos» (pieza 1)

```ts
guardarHechoClasificado({ mascotaId, clase, texto, campos? })
```
`clase`: `'comportamiento' | 'rasgo' | 'medico' | 'recuerdo'`.

**No escribe: despacha** a la puerta de familia de cada clase, con procedencia
y `modo_captura` ya resueltos ahí. `campos` según la clase:
`alergeno`/`severidad`, `condicion`, `fecha`/`foto_url`.

⚠️ **`medico` entra `'sospechada'`, nunca confirmada** — lo fuerza la puerta de
destino. Si lo dibujás, decilo así: la familia observa, confirmar es del vet.

```ts
obtenerSugerenciaConociendolo(mascotaId)  // → SugerenciaConociendolo | null
```
**UNA sola** (LOYALTY §2): `{ clase, texto, porque }`. *Una lista de cinco
huecos es una lista de deberes; uno solo es una invitación.* **Mostrá el
`porque`**: sin él es un formulario. `null` cuando no hay nada que pedir **y
también en memorial**.

🔴 **NO devuelve `por_resolver`, a propósito.** Ese conteo ya existe firmado
por la mesa en `apps/cliente/src/lib/pendientes.ts` (cinco clases, `cita`
afuera). **Seguí usando esa lib**: recalcularlo en SQL serían dos verdades para
el mismo número.

## La ficha de raza (pieza 2)

```ts
obtenerPredisposicionesDeRaza(razaCodigo)  // → Predisposicion[]
```
`{ codigo, nombre, descripcion_familia, chequeo_sugerido, oficio, etapas }`.

La `descripcion_familia` está escrita para usarse **tal cual**: dice «suelen
tener…», nunca «tiene». No le agregues certeza al mostrarla.

⚠️ Hoy devuelve **vacío para todas las razas**: las reglas las carga D con su
Batch sobre las fichas publicadas. *La pieza está viva y el dato todavía no —
la pantalla tiene que verse bien con la lista vacía.*

## La anticipación (pieza 5)

Llega por donde ya lees los avisos: `obtenerAvisosCoach()`, con
`tipo: 'anticipacion'`. Su `detalle` trae `predisposicion`, `nombre`, `etapa`,
`ya_esta_en_la_etapa`, `raza`, `descripcion_familia`, `chequeo_sugerido`.

**Se dice UNA VEZ por (mascota, predisposición, etapa)** — no se repite al día
siguiente como los otros tres. Nunca en memorial, nunca sin opt-in.

## Lo que NO hice y es de otro

- **La clasificación del texto libre** es de D (`clasificarYProponer`): mi
  puerta recibe la clase ya decidida y el sí de la familia.
- **Las reglas raza×predisposición** las carga D; yo dejé el catálogo y el
  motor. Hoy hay **10 códigos y 0 reglas**.
