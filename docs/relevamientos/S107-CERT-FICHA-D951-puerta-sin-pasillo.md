# ☠️ FICHA `D-951` — PUERTA SIN PASILLO: la cita cancelada no tiene camino

> Firma del founder, 27-ago-2026. **Dueño: C.**
> Número verificado libre por grep (`D-946`–`D-950` los tomó esta sesión;
> ⚠️ `D-945` sigue tomado y sin depositar, en `docs/loop/S106-C-CIERRE.md:200`).

---

## EL DEFECTO, con sus cuatro literales

| eslabón | qué dice el objeto |
|---|---|
| única puerta a la lista | `hogar/index.tsx:1061·1076·1235` → `/citas/[mascotaId]` |
| lo que la lista lee | `obtenerCitasActivasMascota` → `_citasActivas` → **`.in('estado', ['pendiente','confirmada','en_curso'])`** |
| única puerta al detalle | `citas/[mascotaId].tsx:313` → `/videoconsulta/[citaId]` |
| lo que el detalle lee | **`leerCitaResuelta(citaId)` — por id y SIN filtrar por estado** |

> ### `cancelada` está excluida por construcción de la única lista que lleva a la única pantalla que sabe mostrarla.

Y el comentario de `cita-no-disponible.tsx` lo describe sin saber que describe un
callejón: *«`leerCitaResuelta` resuelve por id **sin filtrar por estado**»*. **Esa
capacidad existe exactamente para este caso y no hay cómo llegar a usarla.**

**Descartados los otros caminos, medidos:**
- **Historial**: existe para adiestramiento, grooming y pedidos. **No para citas.**
- **Deep link desde notificación**: cero `Linking.createURL` / routing por aviso
  en `apps/cliente`. Y hasta hoy **ni siquiera existía el aviso a la familia** —
  lo creó `20260827220000`, en esta misma sesión.

---

## 🔑 LA FORMA, que es lo que hace útil a la ficha

> ## **PUERTA SIN PASILLO.**
> **La capacidad existe, la pantalla existe, y solo se llega desde una lista que
> la excluye por construcción.**

Es una **variante propia de `L-318`** (motor sin puerta) y merece nombre porque
su modo de falla es distinto:

- `L-318` clásico: la pieza está construida y **nadie la llama**. Se encuentra
  buscando consumidores — el grep da cero.
- **Puerta sin pasillo**: la pieza está construida **y su consumidor también**.
  El grep da uno. **Lo que falta es el camino del usuario hasta ese consumidor**,
  y eso ningún censo de código lo ve: se descubre recorriendo, o —como acá—
  cuando el sujeto cambia de estado y desaparece de la única lista que lo llevaba.

*Un censo de consumidores no distingue «lo llama alguien» de «alguien puede
llegar a que lo llame».*

---

## LA CONSECUENCIA DE PRODUCTO, que es peor que el gate

**A la familia se le devolvió la plata, la cita desapareció de sus citas, y no
hay ninguna superficie que se lo explique.** La voz que C escribió para este caso
—`citaCanceladaPorReverso`, con su razón documentada— **existe y nadie puede
leerla.**

⚠️ El aviso nuevo a la familia (`20260827220000`) **alivia pero no cierra**: le
dice qué pasó, y sigue sin haber dónde ir a mirarlo.

---

## 🔴 PREGUNTA ABIERTA — es de producto, no de código. **Dueño: C**

> **¿Desde dónde debe la familia ver una cita cancelada?**

Las tres formas, con lo que cada una implica (**no es una recomendación: es el
mapa de la decisión**):

1. **Ensanchar la lista** — `_citasActivas` deja de excluir `cancelada`.
   *Barato y peligroso: la lista se llama «activas» y pasaría a no serlo; y toda
   cita cancelada de la historia aparecería mezclada con las vivas.*
2. **Un historial de citas**, como el que ya tienen adiestramiento, grooming y
   pedidos. *Es el precedente de la casa y el más coherente — y es una pantalla
   nueva.*
3. **El aviso que lleva** — que la notificación a la familia abra el detalle.
   *Es el camino más corto y el que llega cuando importa; exige routing por
   notificación, que hoy no existe en el cliente.*

---

## CÓMO SE VERIFICA HOY, y qué prueba cada cosa

**Deep link manual** (scheme `cliente`, verificado en `app.json:8`):

```
adb shell am start -a android.intent.action.VIEW \
  -d "cliente://videoconsulta/d41c9dea-867d-4744-b372-e1fe50c554f8"
```

🔴 **Ese comando cierra el gate del LECTOR, no el del CAMINO.** Prueba que
`leerCitaResuelta` resuelve una cita cancelada y que la pantalla la pinta con su
voz. **No prueba que la familia pueda llegar** — la URL se la da alguien a mano.
*Son dos gates y el segundo sigue abierto hasta que exista el pasillo.*
