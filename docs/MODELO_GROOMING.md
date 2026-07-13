# MODELO_GROOMING — El contrato del servicio de grooming

> **Versión: v1.0 — S59 (13 Jul 2026).** Letra FIRMADA por el founder
> (S59), dictada por el arquitecto (escritor único de docs, regla 76).
> **Contrastes obligatorios:** `MODELO_FINANCIERO.md` v2.7 (el camino de
> la plata rige acá sin excepción — Decisiones Q/R y regla 7.13),
> `MODELO_PASEO.md` v1.5 (el chasis de reserva/cobro que este servicio
> HEREDA, §3/§7), `POLITICAS_EPETPLACE.md` (P18 aplica al suelto de
> grooming cuando su cancelación se construya; P19 es el precedente del
> patrón registrar-el-NO), `DISEÑO_EXPERIENCIA.md` (momento-primero,
> verdad firme), `RUTA_F1.md` (A4 EN CURSO desde S59 con este doc como
> contrato).
>
> **Qué es este doc:** el modelo del GROOMING como servicio — qué se
> vende, cómo se cotiza, dónde ocurre y qué pasa antes/durante/después.
> Lo cerrado, cerrado está; los huecos se declaran con su disparo.
> Ninguna feature de grooming nace contradiciendo este contrato.

---

## 1. El MENÚ DE DOS CAPAS (comprable ≠ registrable)

Se COMPRAN **dos servicios**, ya existentes en `tipos_servicio`:

- **Baño** (`grooming`)
- **Baño + corte** (`grooming_completo`)

Los **9 códigos de `cat_servicios_grooming`** (shampoo neutro/medicado,
corte de raza/personalizado, deslanado, corte de uñas, limpieza de
oídos, expresión de glándulas, perfume final) **NO se venden**: son el
VOCABULARIO DEL DURANTE — lo que el groomer registra que aplicó.
**Comprable ≠ registrable** es la regla madre de este menú: el dueño
compra una experiencia de dos nombres; el expediente registra el
detalle fino.

- **Uñas como comprable suelto = deuda declarada con disparo:** los
  groomers reales lo piden (deuda D-381). Hasta entonces, el corte de
  uñas vive solo como registrable.

## 2. El PRECIO: servicio × talla + UN extra (founder S59)

- **La matriz:** cada servicio comprable se cotiza POR TALLA
  (S / M / L) → **6 precios del groomer** (2 servicios × 3 tallas).
- **UN extra fijo por pelaje largo**, del groomer, que SUMA sin tocar
  la base — *"solo plata, la silla no se estira"* (founder S59): el
  pelaje largo no cambia la duración declarada, solo el precio.
- **El precio se CONGELA al reservar** sobre la talla del PERFIL de la
  mascota (patrón snapshot del paseo, S54/S55): el checkout jamás
  re-resuelve, cero precio calculado en el cliente.
- **Discrepancia hallada en el Antes** (el groomer recibe un "M" que es
  L): esa cita **NO se recotiza** — la discrepancia se **REGISTRA**
  (patrón P19: mascota, cita, declarada, observada, fecha) y el perfil
  **se corrige** para las próximas. El registro es el insumo para
  detectar perfiles sistemáticamente mal declarados.

## 3. TALLA y PELAJE viven en el PERFIL de la mascota

- Declarados por el DUEÑO la primera vez (al reservar grooming si aún
  no existen), **editables siempre**; `NULL` honesto hasta declarar.
- El **catálogo de razas** (deuda D-379) los PRE-LLENARÁ como
  sugerencia ("Golden Retriever → L, pelaje largo") — **grooming NO lo
  espera**: v1 pregunta al dueño y listo. El catálogo sugiere, el dueño
  confirma.

## 4. DÓNDE: local / domicilio / ambos

El groomer declara dónde atiende. **LOCAL es el camino feliz y se
construye primero.** Domicilio = **segunda tanda de F1** (deuda D-380):
hereda dirección-en-cita (D-339, el snapshot ya existe) + recargo
opcional del groomer. Hasta esa tanda, la UI solo ofrece local — sin
promesa vacía.

## 5. ESPECIES: techo de plataforma perro + gato

`tipos_servicio.especies_elegibles` de `grooming` y `grooming_completo`
pasa de NULL a **`["perro","gato"]`** — muere el NULL que dejaba a un
pez como elegible. El techo es de PLATAFORMA; el groomer ACOTA en su
oferta (`especies_compatibles`, ya existente — puede atender solo
perros). La UI filtra, la DB manda (guard `mascota_no_elegible` de
§1bis del paseo, ya vivo en las puertas de reserva).

## 6. DURACIÓN: la declara el groomer, por servicio × talla

- El groomer declara la duración de CADA celda de la matriz servicio ×
  talla: **pasos de 15', rango 30-240**, defaults sugeridos **60'
  (Baño) / 90' (Baño+corte)**.
- **El dueño elige SERVICIO y HORA; la duración es CONSECUENCIA** (del
  servicio elegido y la talla de su mascota) — a diferencia del paseo,
  acá la duración no es menú del dueño.
- **El motor de ventana NO se toca:** la cita entra al motor S55-B2 con
  su `duracion_minutos` resuelta (snapshot), y la ocupación por ventana
  completa hace el resto.

## 7. RESERVA Y COBRO: el chasis del paseo ENTERO

Momento-primero (CUÁNDO→QUIÉN→checkout) · hold de 15' con expiración
perezosa · checkout con **pago simulado DECLARADO** · regla 7.13 (no se
oferta quien no puede cobrar) · **devengo al CIERRE, variante (b)**
(`cerrar_grooming_con_calidad` devenga exacto igual que el paseo —
precondición §10) · fee **15% genérico existente** (`fee_configs`, sin
fila nueva). Cero mecanismos nuevos de plata: lo que el paseo probó,
grooming lo hereda.

## 8. ANTES / DURANTE / DESPUÉS v1 (canon S26 destilado)

- **ANTES — la ficha de 30 segundos:** el groomer ve una vista FILTRADA
  de la mascota (talla, pelaje, señales conductuales y clínicas
  pertinentes al oficio) — **jamás la HC completa**. Acá se detecta y
  registra la discrepancia de talla (§2).
- **DURANTE — registrar sin fricción:** Foto / Nota / Incidencia + los
  **servicios aplicados** (los 9 registrables) + el estado
  **recibir/entregar** del pelaje. La captura JAMÁS se exige en caliente
  — el groomer trabaja, no documenta.
- **DESPUÉS — cierre rápido con piso de calidad:** ≥1 servicio aplicado
  + estado recibir Y entregar + ≥1 nota o foto (los guards ya viven en
  `cerrar_grooming_con_calidad`) + **mensaje a la familia** + **próxima
  sesión SUGERIDA, jamás cita** (una sugerencia de fecha, sin tocar la
  agenda) + la vista del día del groomer (RPC existente
  `obtener_resumen_dia_grooming`).
- **DIFERIDOS con disparo** (deuda D-382): catálogos ricos de
  pelaje/productos/plantillas del canon S26, restricciones automáticas
  grooming-2 (D-383), sugerencias grooming-1. **v1 usa selector simple
  + nota libre.**
- **El dueño ve "En vivo"** (la voz única §7.1 del paseo — mismo
  CitaEnVivo, misma pantalla de dos caras) y el parte con fotos al
  cierre. **Sin mapa** (no hay track en una silla de grooming — la cara
  EN VIVO del grooming muestra estado y novedades, no recorrido).

## 9. RECURRENCIA: v2

El plan y el paquete de grooming HEREDAN la letra del paseo
(`MODELO_PASEO.md` §6/§6bis) cuando abran — **v2, sin lugar en UI
hasta entonces**. Nada se dibuja apagado.

## 10. PRECONDICIONES de plata y seguridad (BLOQUEANTES de cobro, no de construcción)

1. **L-140 grooming:** las ~36 funciones de grooming nacieron pre-L-140
   con EXECUTE para `anon` (y PUBLIC en varias) — se curan ANTES de que
   grooming cobre (migración S59-A3, sonda probatoria antes/después).
2. **Devengo en el cierre:** `cerrar_grooming_con_calidad` injerta
   `crear_evento_economico` variante (b) — espejo literal del paseo
   (devengo exacto al cierre, `pago_simulado` en metadata,
   `kushki_fee=0` honesto). Misma migración.
3. **Seeds preliminares:** los catálogos grooming quedan
   `es_seed_preliminar=true`. **La conversación con un groomer REAL
   sigue BLOQUEANTE para desmarcarlos y abrir a prestadores reales
   (tarea del founder) — NO bloquea construir.**

## 11. Los tests de toda feature de grooming

1. ¿Respeta el menú de dos capas (nada registrable se vende; nada
   comprable fuera de los dos servicios)?
2. ¿El precio sale de la matriz servicio × talla + extra, congelado al
   reservar — cero precio calculado en cliente?
3. ¿La duración la declaró el groomer y el motor de ventana quedó
   intacto?
4. ¿El camino de la plata es EL del paseo (hold, 7.13, variante (b),
   fee genérico — cero mecanismos nuevos)?
5. ¿El Antes/Durante/Después respeta el canon v1 (ficha filtrada,
   captura jamás exigida, piso de calidad al cierre)?
6. ¿Los diferidos siguen declarados con su disparo, o su disparo sonó?

## Historial

- **v1.0 (S59, 13 Jul 2026):** redacción inicial con la letra FIRMADA
  del founder (S59): menú de dos capas (comprable ≠ registrable) ·
  precio servicio × talla + UN extra por pelaje largo con congelamiento
  al reservar y discrepancia-que-se-registra (patrón P19) · talla y
  pelaje en el perfil (el catálogo de razas los pre-llenará, D-379) ·
  local primero, domicilio 2ª tanda (D-380) · especies techo
  perro+gato · duración por servicio × talla en pasos de 15' · chasis
  de reserva/cobro del paseo entero · Antes/Durante/Después v1 (canon
  S26 destilado, diferidos D-382/D-383) · recurrencia v2 ·
  precondiciones §10 (L-140 + devengo + seeds preliminares con la
  conversación groomer real como bloqueante de apertura).
