# S89-A → B · EL HOSTING DEL LOGO DEL CORREO — LISTO Y ESPERANDO TU ASSET

**Contexto:** el founder firmó la cara v2 del correo CON logo (imagen
estática hosted, sin tracking). **Mi decisión previa de «cabecera sin
imagen» MUTA, con su porqué declarado:** tenía dos razones — (a) cero
tracking involuntario de apertura y (b) nada que morir con el bloqueo de
imágenes. **La firma resuelve (a)** (imagen estática de dominio propio, sin
pixel ni query de tracking: no cuenta aperturas). **(b) sigue viva y la
cableo yo:** el `<img>` va con `alt="e-PetPlace"` y **la cabecera de texto
queda como fallback** — con imágenes bloqueadas, el correo sigue diciendo la
casa.

---

## 1 · EL LUGAR (creado, público, escritura cerrada)

**Bucket `marca-publica`** — público en LECTURA (`anon` + `authenticated`),
**sin policy de escritura**: solo `service_role` (o sea, yo) sube. Límite
2 MB, mimes `png · jpeg · webp · svg+xml`.

**La URL que queda en el correo:**

```
https://zyltipqscdsdsxnjclhp.supabase.co/storage/v1/object/public/marca-publica/<archivo>
```

*Nota de dominio, declarada: es dominio del proyecto (Supabase), no
`epetplace.com`. Un dominio propio para assets exige CDN/proxy y es arco
aparte — no frena esta cara. Si la mesa lo pide, la URL cambia en UNA
constante de la Edge Function.*

## 2 · LO QUE NECESITO DE VOS (el asset)

Depositá el archivo en `scripts/capturas/` o donde prefieras y avisame el
path; **yo lo subo y cableo**. Lo que el correo necesita del asset — y estos
son requisitos del MEDIO, no gusto mío:

1. **PNG con fondo TRANSPARENTE**, a **2× del tamaño de render** (si el
   lockup se ve a 132×32, el archivo va 264×64) — los clientes de correo no
   tienen `srcset`; se sirve grande y se escala por atributo.
2. **Que sobreviva en OSCURO.** El par oscuro de la plantilla ya vive
   (`prefers-color-scheme`): un logo en tinta plena desaparece sobre
   `#050508`. O viene en una versión que funcione en los dos fondos, o me
   das **dos archivos** y sirvo el segundo con la misma media query.
3. **Peso**: bajo 2 MB por el límite del bucket, pero **apuntá a menos de
   40 KB** — un correo pesado tarda en abrirse en móvil.
4. **El alt text**, si querés uno distinto de `e-PetPlace`.

## 3 · LO QUE HAGO YO CUANDO LLEGUE

Subir el asset · cablear el `<img>` con su alt y el fallback de texto ·
cablear la variante oscura si la mandás · **y disparar la tanda de muestra
v2 a la bandeja del founder** (los mismos 14 tipos, rotulados MUESTRA) para
que corrija sobre lo recibido.

**Los textos NO se tocan** — la firma fue de diseño, y la voz de cada tipo
ya está firmada por separado.
