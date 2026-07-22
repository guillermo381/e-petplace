# S74-B · CENSO DEL TECLADO — lado PRESTADOR (D-498)

> **Formato COMPARABLE con el censo del cliente**
> (`2026-07-21-s73a-censo-teclado-cliente.md`): mismas columnas, mismo
> método (censo ESTÁTICO + veredicto; el veredicto final es de
> DISPOSITIVO — L-162: el render web no tiene teclado blando). Diferencia
> con el cliente: acá **8 pantallas YA están curadas** (`EvitaTeclado`,
> commit `01d4a23`, viaja en el group `bc12ed81…`) — su verificación está
> en la cosecha S74-B, pendiente del founder.

## 0 · La config nativa (lo que este lado AGREGA al §0 del cliente)

El censo del cliente asumió que el default `resize` "suele auto-scrollear".
El relevamiento de la cura S73-B lo REFINA con literal: el manifest del
prestador trae `windowSoftInputMode=adjustResize`, **pero SDK 57 fuerza
edge-to-edge en Android y en edge-to-edge el sistema NO achica la
ventana** — adjustResize queda letra muerta y el resize NO ocurre. No es
"resize que no alcanza": es resize que no corre. Por eso el bug del
founder (la dosis dictada a ciegas) existía con la config "correcta".
La receta probada en dispositivo es la de la `Hoja`
(`packages/ui/src/components/Hoja.tsx:274-278`: KeyboardAvoidingView
ios=`padding` / android=`height`, gates S45+) — `EvitaTeclado` es ese
literal como composición local del app.

## 1 · La infraestructura que YA cubre (este lado)

- **`Hoja`/`HojaScroll`** cubren de fábrica (igual que el cliente).
- **`EvitaTeclado`** (`src/components/evita-teclado.tsx`, S73-B): el KAV
  literal de la Hoja como envoltorio de pantalla — las 8 del path vet lo
  portan.

## 2 · El censo por pantalla (20 pantallas con campo de texto real)

Fuente: grep `<Campo|<TextInput` + clasificación del contenedor de CADA
campo (Hoja vs ScrollView pelado), re-medido S74 (enmienda al "8 no-vet"
del commit `01d4a23`: son 12 — grep-vs-juicio).

### Las 8 del path vet — CURADAS (EvitaTeclado), gate en dispositivo pendiente

| Pantalla | Dónde vive el campo | Cobertura | Veredicto estático |
|---|---|---|---|
| `veterinaria/consulta/[citaId]` | 15 campos (nota + revisión campo a campo) | **EvitaTeclado** | ✅ CURADA — el caso índice del bug |
| `veterinaria/mostrador/index` | búsqueda arriba | EvitaTeclado | ✅ CURADA (riesgo previo bajo) |
| `veterinaria/mostrador/nueva` | alta 4 campos | EvitaTeclado | ✅ CURADA |
| `veterinaria/mostrador/autorizar` | 1 campo | EvitaTeclado | ✅ CURADA |
| `veterinaria/mostrador/atencion` | 3 campos | EvitaTeclado | ✅ CURADA |
| `veterinaria/presupuesto/nuevo` | 2 campos | EvitaTeclado | ✅ CURADA |
| `veterinaria/procedimientos` | 1 campo | EvitaTeclado | ✅ CURADA |
| `veterinaria/taller` | 2 campos | EvitaTeclado | ✅ CURADA |

### Las 12 no-vet — SIN curar (esperan el veredicto del founder sobre la receta)

| Pantalla | Dónde vive el campo | Cobertura | Veredicto estático |
|---|---|---|---|
| `(tabs)/cuenta/perfil` | **11 campos** a lo largo del scroll (líneas 201–298 de 312), ScrollView pelado | ninguna | 🟠 ALTO — la densa; campos al fondo |
| `cita/[citaId]/cierre` (paseo) | nota al FONDO (323/404) + CTA al pie, ScrollView pelado | ninguna | 🟠 ALTO — la clase exacta del bug de la dosis |
| `adiestramiento/cita/[citaId]/cierre` | 2 campos al fondo (321·331/368) | ninguna | 🟠 ALTO — ídem |
| `grooming/cita/[citaId]/cierre` | nota al fondo (439/599) | ninguna | 🟠 ALTO — ídem |
| `cuenta-comercial/nueva` | 3 campos a media-fondo (227–269/331), ScrollView | ninguna | 🟠 MEDIO-ALTO |
| `cuenta-comercial/bancarios` | 3 campos (239–266/305), ScrollView | ninguna | 🟠 MEDIO-ALTO |
| `adiestramiento/taller` | 1 campo profundo en ScrollView (698/950); los otros 2 en HojaScroll | parcial | 🟡 MEDIO — el suelto de 698 |
| `cita/[citaId]/durante` (paseo) | nota dentro de **Hoja** | Hoja | ✅ CUBIERTO por componente |
| `adiestramiento/cita/[citaId]/durante` | nota dentro de **Hoja** | Hoja | ✅ CUBIERTO |
| `grooming/cita/[citaId]/durante` | nota dentro de **Hoja** | Hoja | ✅ CUBIERTO |
| `vacaciones` | campo dentro de **HojaScroll** | Hoja | ✅ CUBIERTO |
| `login` | 2 campos en el tercio superior (61·70/88) | ninguna | 🟢 BAJO — el teclado no llega |

(`paseo/taller` matcheó el grep por comentario/import: **0 campos reales** —
excluida del censo, declarado.)

**El patrón emergente del lado prestador:** los TRES cierres de oficio son
la misma anatomía de riesgo (nota al fondo + CTA al pie + ScrollView
pelado) — exactamente la clase del bug que el founder reportó. Si la
receta EvitaTeclado pasa el gate de la cosecha, los tres cierres son la
primera tanda de propagación.

## 3 · El candidato a patrón de casa (coincide con el de A — listo para UNA firma)

**"Todo `Campo` vive en una de DOS casas: (a) dentro de una `Hoja` — que
maneja el teclado en el componente —, o (b) bajo `KeyboardAvoidingView`
con el literal de los checkouts (ios=padding / android=height)."**

Este censo lo RATIFICA con evidencia de ambos lados de la tabla: las 4
pantallas ✅-por-Hoja nunca tuvieron el bug (casa a), y la cura del caso
índice fue exactamente mudarse a la casa (b) (`EvitaTeclado` ES el
literal de los checkouts, extraído de la Hoja). Matiz que el prestador
aporta a la letra final: en (b), el envoltorio va POR PANTALLA
(composición `EvitaTeclado`), no KAV artesanal por campo — un solo lugar
que corregir si la receta cambia. Si el dispositivo prueba que ni (b)
alcanza en algún layout, la decisión sube a config nativa
(`softwareKeyboardLayoutMode`) = tren de build (L-134), decisión de mesa.

## 4 · Qué sigue (mismo riel que el censo de A)

1. El gate de la cosecha S74-B firma la receta (b) en dispositivo (los
   puntos de teclado del guion — captura doble L-162).
2. La mesa compara este censo con el del cliente **por mano del founder**
   → UNA firma de patrón de casa.
3. Propagación por veredicto: primero los 4 🟠 ALTO (perfil + los tres
   cierres), después los 🟠/🟡 restantes; los ✅-por-Hoja no se tocan.
