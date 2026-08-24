# Censo para los Términos «Pet Professional» — qué hace hoy el sistema

> **Para:** el abogado que redacta los T&C del profesional.
> **De:** el equipo técnico de e-PetPlace · **Fecha:** 24-ago-2026.
>
> **Cómo leer este documento.** Todo lo que dice **HECHO** está medido contra el
> sistema en producción, no citado de un documento interno. Todo lo que dice
> **NO RESUELTO** es una decisión de negocio que todavía no se tomó — **no
> conviene redactarla como si existiera**, porque el sistema no la puede
> cumplir hoy.
>
> Donde decimos «medido» queremos decir: se consultó la base de datos real y
> este es el número que devolvió.

---

## 1. La comisión: cuánto, sobre qué y cuándo

**HECHO — las tasas vigentes hoy, por tipo de operación y por país:**

| operación | comisión | país | vigente desde | sobre qué base |
|---|---|---|---|---|
| **Servicios** (una cita: paseo, veterinaria, grooming, adiestramiento) | **15 %** | Ecuador | 1-ene-2026 | 🔴 **no declarada** — ver abajo |
| **Servicios** | **15 %** | Colombia | 1-ene-2026 | 🔴 **no declarada** |
| **Productos** (un pedido de la tienda) | **10 %** | Ecuador | **11-ago-2026** | **total con impuesto incluido** |

**Lo que conviene saber sobre esa tabla:**

- La comisión **no está escrita en el código**: vive en una tabla de
  configuración con fecha de vigencia. **Se puede cambiar sin tocar el
  programa**, y los cambios anteriores quedan registrados. Para productos, la
  tasa fue **14 % hasta el 11-ago-2026** y **10 % desde entonces**; las dos
  quedaron archivadas con sus fechas.
- 🔴 **La comisión de SERVICIOS no declara sobre qué base se calcula.** La de
  productos sí lo dice expresamente («total con impuesto»). **Esto conviene
  cerrarlo en el contrato**, porque «15 % del servicio» admite dos lecturas
  —antes o después de impuestos— y hoy el sistema no tiene escrita cuál es.

**HECHO — cuándo se aplica:** la comisión **no se cobra al reservar ni al
pagar: se registra cuando el servicio se da por prestado** (cuando el
profesional cierra la atención). Antes de eso no existe ningún cargo a su
nombre. **Medido: 36 operaciones registradas**, por un total de **USD 388,25**
cobrado a familias, de los cuales **USD 58,24 corresponden a comisión** y **USD
330,01 al profesional**.

---

## 2. Quién le cobra al cliente final

**HECHO — el dinero NO pasa por una cuenta de e-PetPlace.** El cobro con
tarjeta lo ejecuta **Nuvei (plataforma Paymentez)** y el cobro con billetera lo
ejecuta **DeUna (Banco Pichincha)**. e-PetPlace **ordena el cobro y recibe la
confirmación**; no custodia el dinero de la operación.

**HECHO — el sistema deja registrado, operación por operación:** el monto total
cobrado a la familia, la comisión de la pasarela, la comisión de e-PetPlace y
**el monto que corresponde al profesional**. Los cuatro números se guardan
separados desde el primer día.

🔴 **NO RESUELTO — y es lo primero que el contrato tiene que definir:** **a
nombre de quién se cobra.** El sistema hoy **registra un cobro y un reparto**,
pero **no expresa una figura jurídica**: no distingue entre «e-PetPlace cobra
por cuenta y orden del profesional» (mandato de recaudación) y «e-PetPlace
cobra en nombre propio y luego paga». **Los dos escenarios producen exactamente
los mismos registros hoy.** Esta es una decisión de negocio y fiscal, no
técnica, y **de ella depende quién emite la factura al cliente final** (punto 4).

⚠️ **Un dato que puede importar:** el ambiente de pagos está hoy en modo de
pruebas (*sandbox*), no productivo. **Ninguna de las 36 operaciones registradas
movió dinero real.**

---

## 3. La liquidación al profesional

**HECHO — el modelo de datos existe y está completo.** Cada liquidación
contempla: período (desde–hasta), monto bruto, comisión de pasarela, comisión
de plataforma, **monto a pagar**, ajustes, **retenciones fiscales**, **retención
de garantía** con su fecha de liberación, saldo arrastrado del período
anterior, medio de pago, referencia de la transferencia, y un campo de disputa
con su respuesta.

🔴 **NO RESUELTO — y es la brecha más grande de este censo: NUNCA SE LIQUIDÓ A
NADIE.** Medido: **0 liquidaciones** en la base. **Todo lo que sigue no existe
como decisión, aunque el sistema tenga el campo:**

- **Plazo**: no hay periodicidad definida (¿semanal? ¿quincenal? ¿a pedido?).
- **Medio de pago**: el campo existe y ninguna liquidación lo usó.
- **Retenciones fiscales**: el campo existe; **no hay ninguna regla de
  retención configurada**.
- **Retención de garantía** (*holdback*): el campo existe y su plazo de
  liberación **no está definido**.
- **Mínimo de pago**: no existe.

**Recomendación técnica:** que el contrato defina el plazo como un **período de
corte** («los servicios prestados entre el día X y el día Y se liquidan el día
Z»), porque es lo que el sistema ya modela. Fijar un plazo contado desde cada
servicio individual **exigiría rehacer la pieza.**

---

## 4. La facturación

🔴 **NO RESUELTO, y depende del punto 2.** El sistema **no emite ninguna
factura hoy**, ni al cliente final ni al profesional. Lo que sí hace:

- **HECHO:** emite un **comprobante de pago** a la familia (no es factura
  fiscal), con el concepto y los códigos de la operación.
- **HECHO:** en el frente de productos, la decisión ya tomada es que **el
  vendedor factura directamente al cliente** y e-PetPlace solo cobra su
  comisión. Si esa misma lógica aplica a servicios, **el profesional factura al
  cliente final y e-PetPlace le factura a él su comisión** — pero **eso no está
  decidido para servicios**.
- 🔴 **No existe** emisión de factura electrónica ni integración con el SRI.

---

## 5. Suscripción o SaaS del profesional

**HECHO — no existe. El profesional no paga nada por usar la plataforma.** No
hay cuota mensual, ni plan, ni límite por volumen. El único ingreso de
e-PetPlace frente al profesional es la comisión por operación del punto 1.

*(Existen suscripciones en el sistema, pero son de la **familia** hacia el
profesional —por ejemplo un plan mensual de paseos—, no del profesional hacia
e-PetPlace.)*

🔴 **NO RESUELTO:** por lo tanto **no hay nada que redactar sobre «qué pasa si
no paga»**. Si el contrato va a prever un modelo de suscripción futuro,
conviene que lo deje **habilitado pero no vigente**, en vez de describir algo
que hoy no se puede cobrar.

---

## 6. Cancelaciones y reembolsos — qué hace el motor HOY

**Esta sección describe el comportamiento real del sistema, no lo deseable.**

**HECHO — para una cita suelta:**
- **Reagendar**: permitido hasta **2 horas antes**, y solo a un horario libre
  **del mismo profesional**.
- **Cancelar con reembolso**: permitido hasta **24 horas antes**.
- **Menos de 2 horas antes, o el cliente no se presenta**: la operación **se
  cierra como “no asistió” y el profesional cobra igual**.

**HECHO — para un plan mensual (varias sesiones):** se puede **saltear** una
sesión con más de 24 horas de aviso y reagendarla; con menos, **se pierde**. La
pausa del plan opera como **no renovación**, no como devolución del período en
curso.

**HECHO — la regla de fondo, ya decidida:** *el profesional cobra la capacidad
que comprometió; lo que el cliente no usa, lo pierde el cliente y lo cobra el
profesional; solo el incumplimiento del propio profesional le corta el cobro.*

🔴 **NO RESUELTO — dos cosas concretas:**
1. **Los reembolsos son simulados.** Existe la función que revierte el registro
   contable, pero **no hay devolución real de dinero** a la tarjeta o billetera
   del cliente. Hoy, cancelar con derecho a reembolso **anota el derecho y no
   ejecuta el pago**.
2. **No está definido qué pasa si el profesional cancela.** El sistema
   contempla que su incumplimiento le corta el cobro, pero **no hay penalidad,
   ni compensación al cliente, ni regla de reincidencia**.

---

## 7. Resumen para redactar

| tema | estado |
|---|---|
| Comisión de servicios: **15 %** | **HECHO** — falta declarar la base de cálculo |
| Comisión de productos: **10 % sobre total con impuesto** | **HECHO** |
| Momento del cargo: al **prestarse el servicio** | **HECHO** |
| Quién cobra al cliente final | **HECHO** (Nuvei / DeUna) |
| **Figura jurídica del cobro** (mandato vs. nombre propio) | 🔴 **NO RESUELTO — bloquea el punto 4** |
| Liquidación: **modelo completo, cero ejecuciones** | 🔴 **NO RESUELTO**: plazo, medio, retenciones, garantía |
| Facturación | 🔴 **NO RESUELTO** — no se emite ninguna |
| Suscripción del profesional | **HECHO: no existe** |
| Cancelación del cliente | **HECHO** — 24 h reembolso, 2 h reagenda |
| **Reembolso real de dinero** | 🔴 **NO RESUELTO** — hoy es solo un asiento contable |
| **Cancelación del profesional** | 🔴 **NO RESUELTO** |
| Ambiente de pagos | ⚠️ **pruebas (sandbox)**, sin dinero real |

---

## 8. Verificación de la cláusula §14.4 de los T&C (24-ago-2026)

Los Términos redactados afirman que **las comisiones del Procesador de Pago las
asume la Compañía con cargo a su Comisión, y no se trasladan al Usuario
Profesional ni se descuentan de la Liquidación**.

**Medido contra el motor: la afirmación es consistente.** Sobre las 36
operaciones registradas, `comisión de plataforma + monto del profesional`
suma **exactamente** el bruto cobrado (58,24 + 330,01 = 388,25). ⇒ **la fee de
la pasarela no sale del bolsillo del profesional.**

⚠️ **Pero se cumple POR CONSTRUCCIÓN, no POR EJERCICIO, y la diferencia importa
para un contrato:** el campo que guarda la comisión de la pasarela está en
**0,00 en las 36 operaciones**, porque el ambiente es de pruebas y **nunca se
cobró una comisión real**. *El reparto es correcto en un mundo donde ese número
es cero; el día que deje de serlo, hay que volver a verificar que siga saliendo
de la Comisión y no del pago al profesional.*

**Recomendación:** que esa verificación sea parte de la salida del ambiente de
pruebas, junto con los otros tres frenos ya marcados.
