> ⚠️ **ESTADO AL CIERRE DE LA TANDA:** la pieza existe en
> `origin/pista/s91-b` (`packages/ui/src/components/sugerencias.ts`) y
> **NO está en `origin/main`** — medido:
> `git ls-tree -r origin/main --name-only | grep sugerenc` → vacío, con mi HEAD
> conteniendo `origin/main` entero (`merge-base --is-ancestor`, SÍ).
> El render de selección única **ya está construido** (`PasoRaza.tsx`) y
> consume el catálogo de A; lo único que espera el merge es el FILTRO. El
> punto de enganche está marcado con `⬅ EL PUNTO EXACTO DONDE ENTRA EL FILTRO
> DE B` — es una línea.

# S91 · PEDIDO DE LA PISTA D A LA PISTA B — EL TIPEO PREDICTIVO

> 76b: autocontenido. No hace falta leer nada más para construirlo.
> §6: **se declara y se pide, no se clona.** D no lo escribe en `packages/ui`
> —es territorio exclusivo de B— **ni lo clona local**, que es la tentación
> barata: el patrón ya existe probado *inline* en
> `apps/cliente/src/app/(tabs)/hogar/bitacora.tsx` y copiarlo dejaría dos
> implementaciones del mismo matching separándose el día que alguien toque una.

---

## QUÉ LO PIDE

Paso 2 del alta (lámina firmada `docs/laminas/LAMINA_ALTA_MASCOTA_S91.md`):
**«¿De qué raza es {nombre}?»** — tipeo predictivo sobre el catálogo de la
especie elegida, **cada sugerencia con su imagen en círculo de 32**.

La lámina lo declara dependencia dura, con su literal:
> *«NO HAY COMPONENTE DE TIPEO PREDICTIVO en packages/ui. El patrón existe
> probado (Campo + SelectorOpcion + useMemo) pero vive INLINE en bitacora.tsx.
> Se generaliza, no se clona.»*

---

## EL CONTRATO QUE D CONSUME

```tsx
export interface CampoSugeridoOpcion {
  codigo: string          // el slug: 'pastor-aleman'
  etiqueta: string        // el nombre CON su acento: 'Pastor alemán'
  adorno?: ReactNode      // el círculo de 32 — D lo pasa armado
}

export interface CampoSugeridoProps {
  label: string
  placeholder?: string
  /** Controlado: lo que la persona TIPEÓ. Es también lo que se guarda si
   *  no elige ninguna sugerencia — el catálogo sugiere, el dueño confirma. */
  valor: string
  onCambio: (texto: string) => void
  opciones: CampoSugeridoOpcion[]
  /** El código elegido, si eligió uno. `undefined` = escribió libre. */
  elegida?: string
  onElegir: (codigo: string) => void
  /** Voz cuando el filtro no encuentra nada. NO es un error: escribir algo
   *  que el catálogo no tiene es una respuesta legítima. */
  vacio?: string
  ayuda?: string
  maxSugerencias?: number   // D pasa 6
}
```

**Lo único que D necesita que sea cierto del comportamiento:**

1. **El matching ignora acentos y mayúsculas, y busca por PALABRA, no por
   prefijo del string entero.** `«aleman»` tiene que encontrar
   `«Pastor alemán»`. *(Es el mismo `normalizarVoz` de `bitacora.tsx:65-75`
   — NFD + strip de diacríticos —, que es justamente el que hay que subir.)*
2. **Escribir libre NO se pierde.** Si nadie toca una sugerencia, `valor` es
   la respuesta. Un componente que exija elegir mataría «mestizo con nombre
   propio» y la raza que el catálogo no tiene.
3. **Elegir una sugerencia PISA el texto con su `etiqueta`** — la persona ve
   escrito lo que eligió, con su acento. Sin eso, quien tipeó «aleman» y
   eligió termina viendo su propio typo.
4. **Cero sugerencias ≠ error.** Ver punto 2.

---

## LO QUE D CREE QUE B YA TIENE (y por eso el pedido es chico)

Medido en `packages/ui/src/components/SelectorOpcion.tsx`:
- `SelectorOpcionItem.adorno?: ReactNode` ya existe (línea 62) — es
  exactamente el hueco del círculo de 32.
- `disposicion?: 'fila' | 'tira' | 'grilla' | 'columnas'` (línea 88).
- `Campo` con su pie y su focus de la casa.

⇒ **La anatomía la decide B.** D describe el contrato y el comportamiento,
no cómo se arma. Si a B le cierra montarlo sobre `Campo` + `SelectorOpcion`
en `columnas`, perfecto; si prefiere otra cosa, también.

---

## MIENTRAS TANTO — la degradación, declarada

**D no espera bloqueada y tampoco finge.** El paso 2 se construye HOY con
`Campo` a secas (texto libre) + los dos botones de primera clase
(«Mestizo» / «No sé»), **sin lista de sugerencias**.

Y eso no es una decisión de comodidad: **hoy no hay qué sugerir.** El
catálogo (D-379) tampoco existe todavía — es el pedido paralelo a A. La
pantalla en su estado actual **no promete sugerencias y no las da**; cuando
lleguen las dos piezas, entra el componente y la lista se llena.

**Lo que NO se hizo a propósito:** una lista de sugerencias local sobre un
arreglo hardcodeado de razas. Habría dado una demo linda y sería dato
fabricado — exactamente L-139.
