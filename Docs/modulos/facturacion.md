# Módulo de Facturación y POS — Warengine

> **Propósito y estado:** **PARCIAL** (Directorio de Clientes, Turnos de Caja,
> Facturas, Pagos y Devoluciones de Ventas implementados; Anulación RF-FMC-F1
> pendiente)\
> **Stack:** Deno · TypeScript · Drizzle ORM · MySQL 8 · Hono · Zod · Decimal\
> **Arquitectura:** Clean Architecture + Ports & Adapters + Transacciones
> gobernadas por BD

---

## Índice

1. [Propósito y estado](#1-propósito-y-estado)
2. [Cobertura del SRS](#2-cobertura-del-srs)
3. [Mapa de archivos](#3-mapa-de-archivos)
4. [Dominio](#4-dominio)
5. [Casos de uso](#5-casos-de-uso)
6. [Persistencia](#6-persistencia)
7. [API REST](#7-api-rest)
8. [Contratos (Shared)](#8-contratos-shared)
9. [Permisos y roles](#9-permisos-y-roles)
10. [Pruebas](#10-pruebas)
11. [Flujos clave](#11-flujos-clave)
12. [Pendientes y deuda técnica](#12-pendientes-y-deuda-técnica)
13. [Cómo probar manualmente](#13-cómo-probar-manualmente)

---

## 1. Propósito y Estado

El módulo de **Facturación y Punto de Venta (POS)** de Warengine gestiona la
interacción comercial con clientes finales y corporativos, el control operativo
de turnos de caja y el ciclo de vida de emisión, cobro, anulación y devolución
de comprobantes de venta.

**Estado actual:** **FASE 1 COMPLETADA CON DEVOLUCIONES DE VENTAS (RF-FMC-G1)**
 
 - **Implementado en código:** Directorio y actualización de clientes con
   validación estricta de régimen B2B y protección de `creditoHabilitado`,
   apertura y cierre de turnos de caja con arqueo y control de concurrencia,
   facturación transaccional de mostrador (requiere turno de caja) y B2B (con
   validación de crédito corporativo sin exigir turno), consulta de facturas con
   alcance de sucursal y ocultamiento de costos, emisión de alertas operativas
   al administrador, y registro de devoluciones de ventas parciales y totales (RF-FMC-G1)
   con reingreso opcional a inventario por trigger.
 - **Pendiente (Fase 2):** Anulación de facturas con reversión de stock (RF-FMC-F1).
 
 ---
 
 ## 2. Cobertura del SRS
 
 | Requisito         | Descripción corta                                                               | Estado       | Dónde está en el código                                                                                                                                                                                                                                                                                                                                                |
 | ----------------- | ------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 | **RF-FMC-B4**     | Identificación de cliente en ventas (B2C o B2B)                                 | IMPLEMENTADO | [cliente.controller.ts](../../Backend/apps/api/src/controllers/facturacion/cliente.controller.ts), [RegistrarClienteUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/RegistrarClienteUseCase.ts)                                                                                                                                  |
 | **RF-FMC-B5**     | Validación estricta de clientes corporativos B2B (NIT/RUT, dirección, teléfono) | IMPLEMENTADO | [Cliente.ts](../../Backend/packages/core/src/modules/facturacion/domain/entities/Cliente.ts), [RegistrarClienteUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/RegistrarClienteUseCase.ts), [ActualizarClienteUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/ActualizarClienteUseCase.ts) |
 | **RF-FMC-B7**     | Reutilización de clientes existentes por documento                              | IMPLEMENTADO | [RegistrarClienteUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/RegistrarClienteUseCase.ts)                                                                                                                                                                                                                                     |
 | **RF-FMC-D1**     | Búsqueda y filtrado de clientes en tiempo real                                  | IMPLEMENTADO | [BuscarClientesUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/BuscarClientesUseCase.ts)                                                                                                                                                                                                                                         |
 | **RF-FMC-A1**     | Apertura de turno de caja con fondo inicial y sucursal                          | IMPLEMENTADO | [AbrirTurnoCajaUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/AbrirTurnoCajaUseCase.ts)                                                                                                                                                                                                                                         |
 | **RF-FMC-A2**     | Un solo turno abierto por operador simultáneamente                              | IMPLEMENTADO | [AbrirTurnoCajaUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/AbrirTurnoCajaUseCase.ts), Trigger SQL `002-turnos-un-abierto-por-usuario.sql`                                                                                                                                                                                    |
 | **RF-FMC-A3**     | Consulta del turno de caja activo del operador                                  | IMPLEMENTADO | [ObtenerTurnoActualUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/ObtenerTurnoActualUseCase.ts)                                                                                                                                                                                                                                 |
 | **RF-FMC-A4**     | Cierre de turno de caja con arqueo y cálculo de diferencia                      | IMPLEMENTADO | [CerrarTurnoCajaUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/CerrarTurnoCajaUseCase.ts), [turno-caja.controller.ts](../../Backend/apps/api/src/controllers/facturacion/turno-caja.controller.ts)                                                                                                                              |
 | **RF-FMC-B1..B3** | Emisión de factura con ítems y verificación de stock                            | IMPLEMENTADO | [CrearFacturaUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/CrearFacturaUseCase.ts), [factura.controller.ts](../../Backend/apps/api/src/controllers/facturacion/factura.controller.ts)                                                                                                                                          |
 | **RF-FMC-C1..C5** | Pagos divididos y medios de pago (efectivo, tarjeta, transferencia)             | IMPLEMENTADO | [FacturaPago.ts](../../Backend/packages/core/src/modules/facturacion/domain/entities/FacturaPago.ts), [drizzle-factura.repository.ts](../../Backend/packages/database/src/repositories/facturacion/drizzle-factura.repository.ts)                                                                                                                                      |
 | **RF-FMC-E1..E2** | Crédito corporativo para clientes B2B habilitados                               | IMPLEMENTADO | [CrearFacturaUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/CrearFacturaUseCase.ts)                                                                                                                                                                                                                                             |
 | **RF-FMC-F1**     | Anulación de facturas con reingreso automático al kardex                        | PENDIENTE    | `trg_facturas_anula_reingresa_stock` en BD; reservado para Fase 2.                                                                                                                                                                                                                                                                                                     |
 | **RF-FMC-G1**     | Devolución de ventas y reingreso opcional de existencias                        | IMPLEMENTADO | [RegistrarDevolucionUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/RegistrarDevolucionUseCase.ts), [devolucion-venta.controller.ts](../../Backend/apps/api/src/controllers/facturacion/devolucion-venta.controller.ts)                                                                                                       |

---

## 3. Mapa de Archivos

```
Backend/
├── apps/api/src/
│   ├── controllers/facturacion/
│   │   ├── alerta-facturacion.controller.ts
│   │   ├── cliente.controller.ts
│   │   ├── devolucion-venta.controller.ts
│   │   ├── factura.controller.ts
│   │   └── turno-caja.controller.ts
│   └── routes/
│       └── facturacion.routes.ts   # Montado bajo el prefijo /ventas en main.ts
├── packages/
│   ├── core/
│   │   ├── src/modules/facturacion/
│   │   │   ├── application/use-cases/
│   │   │   │   ├── AbrirTurnoCajaUseCase.ts
│   │   │   │   ├── ActualizarClienteUseCase.ts
│   │   │   │   ├── AnularFacturaUseCase.ts
│   │   │   │   ├── BuscarClientesUseCase.ts
│   │   │   │   ├── CerrarTurnoCajaUseCase.ts
│   │   │   │   ├── CrearFacturaUseCase.ts
│   │   │   │   ├── EmitirAlertaFacturacionUseCase.ts
│   │   │   │   ├── ListarFacturasUseCase.ts
│   │   │   │   ├── ObtenerClientePorIdUseCase.ts
│   │   │   │   ├── ObtenerFacturaPorIdUseCase.ts
│   │   │   │   ├── ObtenerTurnoActualUseCase.ts
│   │   │   │   ├── RegistrarClienteUseCase.ts
│   │   │   │   └── RegistrarDevolucionUseCase.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── Cliente.ts
│   │   │   │   │   ├── DevolucionVenta.ts
│   │   │   │   │   ├── Factura.ts
│   │   │   │   │   ├── FacturaItem.ts
│   │   │   │   │   ├── FacturaPago.ts
│   │   │   │   │   └── TurnoCaja.ts
│   │   │   │   ├── errors/
│   │   │   │   │   ├── FacturacionErrors.ts
│   │   │   │   │   └── TurnoCajaErrors.ts
│   │   │   │   └── repositories/
│   │   │   │       ├── IClienteRepository.ts
│   │   │   │       ├── IDevolucionVentaRepository.ts
│   │   │   │       ├── IFacturaRepository.ts
│   │   │   │       ├── ISucursalOperadorRepository.ts
│   │   │   │       └── ITurnoCajaRepository.ts
│   │   └── tests/facturacion/
│   │       ├── abrir-turno-caja.use-case.test.ts
│   │       ├── actualizar-cliente.use-case.test.ts
│   │       ├── anular-factura.use-case.test.ts
│   │       ├── apertura-turno-roles.test.ts
│   │       ├── cerrar-turno-caja.use-case.test.ts
│   │       ├── crear-factura.use-case.test.ts
│   │       ├── facturacion-roles-matriz.test.ts
│   │       ├── registrar-cliente.use-case.test.ts
│   │       └── registrar-devolucion.use-case.test.ts
│   ├── database/src/
│   │   ├── schema/
│   │   │   ├── facturacion.schema.ts
│   │   │   └── turnos-caja.schema.ts
│   │   ├── repositories/facturacion/
│   │   │   ├── drizzle-cliente.repository.ts
│   │   │   ├── drizzle-devolucion-venta.repository.ts
│   │   │   ├── drizzle-factura.repository.ts
│   │   │   ├── drizzle-sucursal-operador.repository.ts
│   │   │   └── drizzle-turno-caja.repository.ts
│   │   └── mappers/facturacion/
│   │       ├── cliente.mapper.ts
│   │       ├── devolucion-venta.mapper.ts
│   │       ├── factura.mapper.ts
│   │       └── turno-caja.mapper.ts
│   └── composition/src/
│       └── container.ts
Shared/contracts/src/facturacion/
├── cliente.schema.ts
├── devolucion-venta.schema.ts
├── factura.schema.ts
└── turno-caja.schema.ts
Http/
├── 05-clientes.http
├── 13-facturacion.http
├── 30-anulacion-facturas.http
└── 31-devoluciones-ventas.http
```

---

## 4. Dominio

### 4.1 Entidades

#### `Cliente` ([Cliente.ts](../../Backend/packages/core/src/modules/facturacion/domain/entities/Cliente.ts))

Representa al comprador final o corporativo:

- **Campos:**
  - `id: string` (UUID CHAR(36) generado por BD)
  - `tipoDocumento: 'CC' | 'NIT' | 'RUT'`
  - `numeroDocumento: string`
  - `nombreRazonSocial: string` (nombre o razón social)
  - `tipoCliente: 'B2C' | 'B2B'`
  - `email: string | null`
  - `telefono: string | null`
  - `direccion: string | null`
  - `creditoHabilitado: boolean`
- **Métodos y propiedades de negocio:**
  - `esB2B: boolean`: Retorna si `tipoCliente === 'B2B'`.
  - `puedePagarConCredito: boolean`: Verifica si `esB2B && creditoHabilitado`
    (RF-FMC-E2).

#### `TurnoCaja` ([TurnoCaja.ts](../../Backend/packages/core/src/modules/facturacion/domain/entities/TurnoCaja.ts))

Representa una jornada de facturación de un cajero:

- **Campos:**
  - `id: string` (UUID CHAR(36) generado por BD)
  - `usuarioId: string` (cajero operador)
  - `sucursalId: number` (sede física donde opera la caja)
  - `fondoInicial: number` (saldo base para cambio/vuelto)
  - `fechaApertura: Date`
  - `fechaCierre: Date | null`
- **Métodos y propiedades de negocio:**
  - `estaAbierto: boolean`: Devuelve `fechaCierre === null`. _(Nota: la tabla
    `turnos_caja` en BD incluye `fondo_final` y `diferencia` (DECIMAL 14,2)
    calculada por trigger al cierre; no existe columna `observaciones`)._

### 4.2 Interfaces de Repositorio (Ports)

- **`IClienteRepository`**
  ([IClienteRepository.ts](../../Backend/packages/core/src/modules/facturacion/domain/repositories/IClienteRepository.ts)):
  ```typescript
  buscar(filtros: FiltrosClientes): Promise<Cliente[]>;
  findByDocumento(tipo: TipoDocumentoCliente, numero: string): Promise<Cliente | null>;
  crear(datos: DatosCliente): Promise<Cliente>;
  ```
- **`ITurnoCajaRepository`**
  ([ITurnoCajaRepository.ts](../../Backend/packages/core/src/modules/facturacion/domain/repositories/ITurnoCajaRepository.ts)):
  ```typescript
  buscarAbiertoDeUsuario(usuarioId: string): Promise<TurnoCaja | null>;
  abrir(datos: DatosAperturaTurno): Promise<TurnoCaja | null>;
  ```
- **`ISucursalOperadorRepository`**
  ([ISucursalOperadorRepository.ts](../../Backend/packages/core/src/modules/facturacion/domain/repositories/ISucursalOperadorRepository.ts)):
  ```typescript
  obtenerSucursalId(usuarioId: string): Promise<number | null>;
  ```

### 4.3 Errores de Dominio

#### [FacturacionErrors.ts](../../Backend/packages/core/src/modules/facturacion/domain/errors/FacturacionErrors.ts):

| Clase                               | Code                              | Mensaje                                                    | HTTP Presenter           |
| ----------------------------------- | --------------------------------- | ---------------------------------------------------------- | ------------------------ |
| `DatosClienteB2BIncompletosError`   | `CLIENTE_B2B_DATOS_INCOMPLETOS`   | "Un cliente B2B requiere dirección y teléfono."            | 422 Unprocessable Entity |
| `ClienteNoEncontradoError`          | `CLIENTE_NO_ENCONTRADO`           | "El cliente no existe."                                    | 404 Not Found            |
| `DocumentoClienteYaRegistradoError` | `DOCUMENTO_CLIENTE_YA_REGISTRADO` | "Ya existe un cliente con ese tipo y número de documento." | 400 Bad Request          |
| `CreditoNoHabilitadoError`          | `CREDITO_NO_HABILITADO`           | "Este cliente no tiene crédito corporativo habilitado."    | 400 Bad Request          |
| `FacturaAnuladaError`               | `FACTURA_ANULADA`                 | "No se puede registrar una devolución sobre una factura anulada." | 409 Conflict             |
| `ItemFacturaNoEncontradoError`      | `ITEM_FACTURA_NO_ENCONTRADO`      | "La línea indicada no pertenece a la factura."             | 404 Not Found            |
| `CantidadDevolucionExcedidaError`   | `CANTIDAD_DEVOLUCION_EXCEDIDA`    | "La cantidad devuelta supera la cantidad vendida en esa línea." | 409 Conflict             |
| `DevolucionInvalidaError`           | `DEVOLUCION_INVALIDA`             | "La devolución no es válida."                              | 400 Bad Request          |

#### [TurnoCajaErrors.ts](../../Backend/packages/core/src/modules/facturacion/domain/errors/TurnoCajaErrors.ts):

| Clase                       | Code                     | Mensaje                                                                  | HTTP Presenter           |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------ | ------------------------ |
| `TurnoYaAbiertoError`       | `TURNO_YA_ABIERTO`       | "Ya tienes un turno de caja abierto. Ciérralo antes de abrir uno nuevo." | 409 Conflict             |
| `FondoInicialInvalidoError` | `FONDO_INICIAL_INVALIDO` | "El fondo inicial debe ser un número mayor o igual a cero."              | 400 Bad Request          |
| `OperadorSinSucursalError`  | `OPERADOR_SIN_SUCURSAL`  | "No se pudo determinar la sucursal del operador."                        | 422 Unprocessable Entity |

---

## 5. Casos de Uso

### 5.1 `RegistrarClienteUseCase`

- **Archivo:**
  [RegistrarClienteUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/RegistrarClienteUseCase.ts)
- **Dependencias:** `IClienteRepository`, `IAuditor`
- **Entrada:**
  `{ tipo: 'B2C' | 'B2B'; nombre: string; tipoDocumento: 'CC' | 'NIT' | 'RUT'; numeroDocumento: string; direccion?: string | null; telefono?: string | null; email?: string | null; actor: ActorAuditoria }`
- **Salida:** `Result<{ cliente: Cliente; yaExistia: boolean }, DomainError>`
- **Reglas de negocio:**
  1. Si `tipo === 'B2B'`, valida que `direccion` y `telefono` no sean vacíos ni
     nulos. Si faltan, falla con `DatosClienteB2BIncompletosError`.
  2. Consulta si ya existe un cliente con el mismo `tipoDocumento` y
     `numeroDocumento`.
  3. **Comportamiento idéntico / Reutilización (RF-FMC-B7):** Si el cliente ya
     existía, retorna `{ cliente: existente, yaExistia: true }` con éxito y **NO
     emite auditoría** (evita duplicar registros durante ventas rápidas).
  4. Si es nuevo, lo guarda y emite auditoría
     `{ accion: 'crear', entidad: 'clientes', detalles: { despues: { ... } } }`.
- **Pruebas:**
  [registrar-cliente.use-case.test.ts](../../Backend/packages/core/tests/facturacion/registrar-cliente.use-case.test.ts)
  (3 tests).

### 5.2 `BuscarClientesUseCase`

- **Archivo:**
  [BuscarClientesUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/BuscarClientesUseCase.ts)
- **Dependencias:** `IClienteRepository`
- **Entrada:**
  `{ termino?: string; tipo?: 'B2C' | 'B2B'; limite?: number; offset?: number }`
- **Salida:** `Result<Cliente[], DomainError>`
- **Reglas:** Búsqueda flexible por coincidencia parcial en nombre, número de
  documento, correo o teléfono. No audita.

### 5.3 `AbrirTurnoCajaUseCase`

- **Archivo:**
  [AbrirTurnoCajaUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/AbrirTurnoCajaUseCase.ts)
- **Dependencias:** `ITurnoCajaRepository`, `ISucursalOperadorRepository`,
  `IAuditor`
- **Entrada:** `{ fondoInicial: number; actor: ActorAuditoria }` (el `usuarioId`
  se extrae del actor autenticado)
- **Salida:** `Result<TurnoCaja, DomainError>`
- **Reglas de negocio:**
  1. Valida que `fondoInicial >= 0`. Redondea a 2 decimales. Si es negativo,
     falla con `FondoInicialInvalidoError`.
  2. Determina la sucursal del operador consultando
     `ISucursalOperadorRepository.obtenerSucursalId(actor.usuarioId)`. Si no
     tiene sede asociada, falla con `OperadorSinSucursalError`.
  3. Consulta si el usuario ya tiene un turno abierto
     (`buscarAbiertoDeUsuario`). Si lo tiene, falla con `TurnoYaAbiertoError`.
  4. Inserta el turno en `turnos_caja` (`abrir`).
  5. Maneja carrera concurrente: si la base de datos lanza error o retorna null
     por restricción de unicidad de turno abierto, traduce a
     `TurnoYaAbiertoError`.
  6. Emite auditoría
     `{ accion: 'crear', entidad: 'turnos_caja', detalles: { despues: { turnoId, fondoInicial, sucursalId } } }`.
- **Pruebas:**
  [abrir-turno-caja.use-case.test.ts](../../Backend/packages/core/tests/facturacion/abrir-turno-caja.use-case.test.ts)
  (5 tests) y
  [apertura-turno-roles.test.ts](../../Backend/packages/core/tests/facturacion/apertura-turno-roles.test.ts).

### 5.4 `ObtenerTurnoActualUseCase`

- **Archivo:**
  [ObtenerTurnoActualUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/ObtenerTurnoActualUseCase.ts)
- **Dependencias:** `ITurnoCajaRepository`
- **Entrada:** `{ usuarioId: string }`
- **Salida:** `Result<TurnoCaja | null, DomainError>`
- **Reglas:** Retorna el turno abierto del operador o `null` si no tiene turno
  activo. No audita.

### 5.5 `RegistrarDevolucionUseCase`

- **Archivo:**
  [RegistrarDevolucionUseCase.ts](../../Backend/packages/core/src/modules/facturacion/application/use-cases/RegistrarDevolucionUseCase.ts)
- **Dependencias:** `IFacturaRepository`, `IDevolucionVentaRepository`, `ISucursalOperadorRepository`, `IAuditor`
- **Entrada:**
  ```typescript
  export interface RegistrarDevolucionRequest {
    facturaId: string;
    motivo: string;
    reingresaStock: boolean;
    devolverTodo: boolean;
    items: { facturaItemId: string; cantidad: number }[];
    actor: ActorAuditoria;
  }
  ```
- **Salida:** `Result<DevolucionVenta[], DomainError>`
- **Reglas de negocio:**
  1. **Validación de motivo:** Obligatorio, mínimo 5 caracteres sin espacios en blanco (`DevolucionInvalidaError`).
  2. **Factura y alcance de sucursal:** Consulta la factura; si no existe retorna `FacturaNoEncontradaError`. Si el operador carece de `ADMIN_VER_METRICAS_GLOBALES`, valida que su sucursal (`ISucursalOperadorRepository.obtenerSucursalId`) coincida con `factura.sucursalId`. Si no tiene sucursal asignada, retorna `OperadorSinSucursalError`; si no coincide con la factura, oculta su existencia retornando `FacturaNoEncontradaError`.
  3. **Factura anulada:** Si `factura.estado === 'anulada'`, rechaza la operación con `FacturaAnuladaError` (409 Conflict).
  4. **Remanente por línea y modo de devolución:**
     - Si `devolverTodo: true`, calcula las cantidades no devueltas en cada línea consultando `IDevolucionVentaRepository.resumenDevueltoPorFactura(factura.id)`. Si todas las líneas ya fueron devueltas, falla con `CantidadDevolucionExcedidaError`.
     - Si `devolverTodo: false`, toma las líneas y cantidades solicitadas en `req.items`.
  5. **Validación de cantidades y cálculo proporcional de reembolso:**
     - Verifica que cada `facturaItemId` pertenezca a la factura (`ItemFacturaNoEncontradoError`).
     - Verifica que la cantidad solicitada sea un entero positivo mayor a cero (`DevolucionInvalidaError`).
     - Verifica que la suma de lo previamente devuelto más lo solicitado no supere la cantidad vendida original (`CantidadDevolucionExcedidaError`).
     - **Reembolso proporcional con remanente exacto:** Utiliza `DevolucionVenta.calcularReembolso(item, cantidad, yaDev, yaMonto)`. Si la devolución cubre el restante total de la línea, el reembolso liquida exactamente `item.subtotal - yaMonto` para evitar desajustes por redondeo de centavos.
     - Asigna como `sucursalId` la sucursal original de la factura para cumplir la integridad referencial y las reglas de trigger.
  6. **Persistencia atómica y triggers de BD:**
     - Invoca `devolucionRepository.registrar(devoluciones)` en una sola transacción Drizzle.
     - En base de datos se activan `trg_devoluciones_check_cantidad` (como segunda barrera defensiva de integridad) y `trg_devoluciones_genera_entrada` (que si `reingresa_stock = 1`, inserta un movimiento `entrada` en el kardex con motivo "Reingreso por devolucion de venta").
  7. **Auditoría obligatoria (`IAuditor`):**
     - Registra evento con acción `crear`, entidad `devoluciones_ventas`, `entidadId: factura.id`, y `detalles.despues` conteniendo `facturaId`, `consecutivo`, `tipo` ('total' | 'parcial'), `reingresaStock`, `motivo`, `totalReembolso` y el desglose de líneas con montos.
- **Pruebas:**
  [registrar-devolucion.use-case.test.ts](../../Backend/packages/core/tests/facturacion/registrar-devolucion.use-case.test.ts) (12 tests unitarios pasando).

---

## 6. Persistencia

### 6.1 Tablas Drizzle ([facturacion.schema.ts](../../Backend/packages/database/src/schema/facturacion.schema.ts) y [turnos-caja.schema.ts](../../Backend/packages/database/src/schema/turnos-caja.schema.ts))

- **`clientes`**: `id_cliente` (char 36 PK UUID default UUID()), `tipo_cliente`
  (varchar 10 def 'B2C'), `nombre_razon_social` (varchar 200), `tipo_documento`
  (varchar 10 'CC','NIT','RUT'), `numero_documento` (`varcharBin(30)`),
  `direccion` (varchar 255), `telefono` (varchar 30), `email` (varchar 150),
  `credito_habilitado` (tinyint def 0), `deleted_at`.
  - Índice único: `uq_clientes_documento` (`tipo_documento`,
    `numero_documento`).
- **`turnos_caja`**: `id_turno_caja` (char 36 PK UUID default UUID()),
  `usuario_id` (char 36 FK usuarios), `sucursal_id` (int FK sucursales),
  `fecha_apertura` (datetime def current_timestamp), `fecha_cierre` (datetime
  nullable), `fondo_inicial` (decimal 14,2), `fondo_final` (decimal 14,2
  nullable), `diferencia` (decimal 14,2 nullable), `deleted_at`. _(No existe
  columna `observaciones`)_.
- **Tablas de Facturación en Esquema Drizzle (`facturacion.schema.ts`):**
  - `facturas`: `id_factura` (char 36 PK UUID), `consecutivo` (int),
    `cliente_id` (char 36 FK clientes), `usuario_id` (char 36 FK usuarios),
    `sucursal_id` (int FK sucursales), `turno_caja_id` (char 36 FK turnos_caja),
    `subtotal` (decimal 14,2), `iva` (decimal 14,2), `total` (decimal 14,2),
    `estado` ('emitida', 'anulada'), `anulada_por` (char 36 FK usuarios),
    `fecha` (datetime), `deleted_at`.
  - `factura_items`: `id_factura_item` (char 36 PK UUID), `factura_id` (char 36
    FK facturas), `producto_id` (char 36 FK productos), `cantidad` (int),
    `precio_unitario` (decimal 14,2), `descuento` (decimal 14,2), `subtotal`
    (decimal 14,2), `deleted_at`.
  - `factura_pagos`: `id_factura_pago` (char 36 PK UUID), `factura_id` (char 36
    FK facturas), `medio_pago` ('efectivo', 'tarjeta', 'transferencia',
    'credito_corporativo'), `monto` (decimal 14,2), `referencia_transaccion` (varchar 100 nullable),
    `fecha` (datetime).
  - `devoluciones_ventas`: `id_devolucion_venta` (char 36 PK UUID default UUID()),
    `factura_item_id` (char 36 FK factura_items), `factura_id` (char 36 FK facturas),
    `cantidad` (int), `motivo` (varchar 255), `monto_reembolso` (decimal 14,2),
    `reingresa_stock` (tinyint default 1), `usuario_id` (char 36 FK usuarios),
    `sucursal_id` (int FK sucursales), `fecha` (datetime default CURRENT_TIMESTAMP),
    `deleted_at` (datetime nullable).

### 6.2 Reglas de Base de Datos (Triggers y Constraints)

- **`chk_clientes_datos_b2b`**: En MySQL, restringe que si `tipo = 'B2B'`,
  `direccion` y `telefono` no sean NULL.
- **`trg_turnos_caja_un_abierto_por_usuario`**: Impide que un mismo usuario
  tenga más de una fila con `fecha_cierre IS NULL`.
- **`trg_turnos_caja_calcula_diferencia`**: Al cerrar el turno
  (`BEFORE UPDATE`), exige `fondo_final` y calcula la diferencia matemática
  frente a las ventas en efectivo.
- **`trg_factura_items_genera_salida`**: Al insertar en `factura_items`, la BD
  genera automáticamente el movimiento de `salida` en `movimientos_inventario`.
- **`trg_facturas_anula_reingresa_stock`**: Al pasar una factura a `anulada`,
  reingresa automáticamente las cantidades al kardex.
- **`trg_factura_pagos_check_credito`**: Bloquea pagos con `credito_corporativo`
  si `clientes.credito_habilitado != 1`.
- **`trg_devoluciones_check_cantidad`**: `BEFORE INSERT ON devoluciones_ventas`. Valida que `factura_id` coincida con la factura real de la línea (`factura_item_id`), que `sucursal_id` sea la de la factura, que la factura no esté en estado `anulada`, que la cantidad a devolver no supere la cantidad vendida remanente de esa línea (`v_cantidad_devuelta_previa + NEW.cantidad <= v_cantidad_vendida`), y que `monto_reembolso` no supere el valor de lo devuelto (`v_precio_unitario * NEW.cantidad`).
- **`trg_devoluciones_genera_entrada`**: `AFTER INSERT ON devoluciones_ventas`. Si `reingresa_stock = 1`, inserta automáticamente un movimiento de tipo `entrada` en `movimientos_inventario` (Kardex) con motivo "Reingreso por devolucion de venta", vinculando `devolucion_id`, `sucursal_id`, `producto_id`, `cantidad` y `usuario_id`.

---

## 7. API REST

Prefijo general de montaje en `main.ts`: `/ventas`.

| Método | Ruta completa                        | Permiso requerido                | Controlador                         | Caso de uso                      | Schema Zod                      | Códigos HTTP                      |
| ------ | ------------------------------------ | -------------------------------- | ----------------------------------- | -------------------------------- | ------------------------------- | --------------------------------- |
| `GET`  | `/ventas/clientes`                   | `facturacion:consultar`          | `buscarClientesController`          | `BuscarClientesUseCase`          | `filtrosClientesSchema`         | 200, 401, 403                     |
| `GET`  | `/ventas/clientes/:id`               | `facturacion:consultar`          | `obtenerClientePorIdController`     | `ObtenerClientePorIdUseCase`     | Ninguno (param :id)             | 200, 400, 401, 403, 404           |
| `POST` | `/ventas/clientes`                   | `facturacion:gestionar-clientes` | `registrarClienteController`        | `RegistrarClienteUseCase`        | `crearClienteSchema`            | 200, 201, 400, 401, 403, 422      |
| `PUT`  | `/ventas/clientes/:id`               | `facturacion:gestionar-clientes` | `actualizarClienteController`       | `ActualizarClienteUseCase`       | `actualizarClienteSchema`       | 200, 400, 401, 403, 404, 422      |
| `POST` | `/ventas/turnos`                     | `facturacion:abrir-turno`        | `abrirTurnoCajaController`          | `AbrirTurnoCajaUseCase`          | `abrirTurnoCajaSchema`          | 201, 400, 401, 403, 409, 422      |
| `POST` | `/ventas/turnos/:id/cerrar`          | `facturacion:abrir-turno`        | `cerrarTurnoCajaController`         | `CerrarTurnoCajaUseCase`         | `cerrarTurnoCajaSchema`         | 200, 400, 401, 403, 404           |
| `GET`  | `/ventas/turnos/actual`              | `facturacion:facturar`           | `obtenerTurnoActualController`      | `ObtenerTurnoActualUseCase`      | Ninguno                         | 200, 401, 403                     |
| `POST` | `/ventas/facturas`                   | `facturacion:facturar`           | `crearFacturaController`            | `CrearFacturaUseCase`            | `crearFacturaSchema`            | 201, 400, 401, 403, 409, 422      |
| `POST` | `/ventas/facturas/b2b`               | `facturacion:vender-b2b`         | `crearFacturaController`            | `CrearFacturaUseCase`            | `crearFacturaSchema`            | 201, 400, 401, 403, 409, 422      |
| `GET`  | `/ventas/facturas`                   | `facturacion:consultar`          | `listarFacturasController`          | `ListarFacturasUseCase`          | `listarFacturasQuerySchema`     | 200, 400, 401, 403                |
| `GET`  | `/ventas/facturas/:id`               | `facturacion:consultar`          | `obtenerFacturaPorIdController`     | `ObtenerFacturaPorIdUseCase`     | Ninguno (param :id)             | 200, 400, 401, 403, 404           |
| `POST` | `/ventas/facturas/:id/devoluciones`  | `facturacion:devolucion`         | `registrarDevolucionController`     | `RegistrarDevolucionUseCase`     | `registrarDevolucionSchema`     | 201, 400, 401, 403, 404, 409      |
| `POST` | `/ventas/alertas`                    | `facturacion:alertar-admin`      | `emitirAlertaFacturacionController` | `EmitirAlertaFacturacionUseCase` | `alertarAdminFacturacionSchema` | 201, 400, 401, 403, 422           |

_Nota sobre códigos de respuesta en clientes:_

- Si el cliente es nuevo, responde `201 Created` con
  `{ cliente, yaExistia: false }`.
- Si el cliente ya existía, responde `200 OK` con
  `{ cliente, yaExistia: true }`.

---

## 8. Contratos (Shared)

- **Clientes**
  ([cliente.schema.ts](../../Shared/contracts/src/facturacion/cliente.schema.ts)):
  ```typescript
  export const crearClienteSchema = z.object({
    tipoDocumento: z.enum(TIPOS_DOCUMENTO_CLIENTE),
    numeroDocumento: z.string().trim().min(5).max(30).regex(/^[0-9A-Za-z-]+$/),
    nombreRazonSocial: z.string().trim().min(3).max(200),
    tipoCliente: z.enum(TIPOS_CLIENTE).default("B2C"),
    email: z.preprocess(
      vacioAUndefined,
      z.string().trim().email().max(150).optional(),
    ),
    telefono: z.preprocess(
      vacioAUndefined,
      z.string().trim().min(7).max(30).optional(),
    ),
    direccion: z.preprocess(
      vacioAUndefined,
      z.string().trim().min(5).max(255).optional(),
    ),
  }).superRefine((datos, ctx) => {
    if (datos.tipoCliente === "B2B") {
      if (!datos.direccion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["direccion"],
          message: "La dirección es obligatoria para clientes B2B.",
        });
      }
      if (!datos.telefono) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["telefono"],
          message: "El teléfono es obligatorio para clientes B2B.",
        });
      }
    }
  });

  export const filtrosClientesSchema = z.object({
    texto: z.string().trim().max(100).optional(),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO_CLIENTE).optional(),
    limite: z.coerce.number().int().min(1).max(50).default(20),
  });

  export interface ClienteDto {
    id: string;
    tipoDocumento: "CC" | "NIT" | "RUT";
    numeroDocumento: string;
    nombreRazonSocial: string;
    tipoCliente: "B2C" | "B2B";
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    creditoHabilitado: boolean;
  }
  ```
- **Turnos de Caja**
  ([turno-caja.schema.ts](../../Shared/contracts/src/facturacion/turno-caja.schema.ts)):
  ```typescript
  export const abrirTurnoCajaSchema = z.object({
    fondoInicial: z.number().min(0, "El fondo inicial no puede ser negativo.")
      .max(1_000_000_000),
  });

  export interface TurnoCajaDto {
    id: string;
    usuarioId: string;
    sucursalId: number;
    fondoInicial: number;
    fechaApertura: string;
    fechaCierre: string | null;
    estaAbierto: boolean;
  }
  ```
- **Devolución de Ventas**
  ([devolucion-venta.schema.ts](../../Shared/contracts/src/facturacion/devolucion-venta.schema.ts)):
  ```typescript
  export const itemDevolucionInputSchema = z.object({
    facturaItemId: z.string().uuid({ message: 'El ID de la línea de factura debe ser un UUID válido.' }),
    cantidad: z.number().int().positive({ message: 'La cantidad a devolver debe ser mayor a 0.' }),
  });

  export const registrarDevolucionSchema = z.object({
    motivo: z.string().trim().min(5, 'Indica el motivo (mín. 5 caracteres).').max(255),
    reingresaStock: z.boolean().default(true),
    devolverTodo: z.boolean().default(false),
    items: z.array(itemDevolucionInputSchema).default([]),
  }).superRefine((d, ctx) => {
    if (!d.devolverTodo && d.items.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items'],
        message: 'Indica los ítems a devolver o marca devolución total.' });
    }
  });

  export interface DevolucionVentaDto {
    id: string;
    facturaId: string;
    facturaItemId: string;
    cantidad: number;
    motivo: string;
    montoReembolso: number;
    reingresaStock: boolean;
    usuarioId: string;
    sucursalId: number;
    fecha: string;
  }
  ```

---

## 9. Permisos y Roles

- `facturacion:consultar`: Búsqueda de clientes y consulta de turnos activos.
  - Asignado a: `super-admin`, `admin-sucursal`, `cajero`, `vendedor-b2b`.
- `facturacion:gestionar-clientes`: Crear y actualizar directorio de clientes.
  - Asignado a: `super-admin`, `admin-sucursal`, `cajero`, `vendedor-b2b`.
- `facturacion:facturar`: Emitir facturas y cobrar (ya no incluye abrir turno).
  - Asignado a: `super-admin`, `admin-sucursal`, `cajero`, `vendedor-b2b`.
- `facturacion:abrir-turno`: Apertura de turno de caja y asignación de fondo
  inicial en efectivo.
  - Asignado a: `super-admin`, `admin-sucursal`, `cajero`. Denegado
    estrictamente a: `vendedor-b2b`.
- `facturacion:vender-b2b`: Emitir facturas y cotizaciones dirigidas a clientes
  corporativos B2B.
  - Asignado a: `super-admin`, `admin-sucursal`, `cajero`, `vendedor-b2b`.
- `facturacion:alertar-admin`: Emisión de alertas directas hacia la
  administración.
  - Asignado a: `super-admin`, `admin-sucursal`, `cajero`, `vendedor-b2b`.
- `facturacion:anular`: Reservado en el seed para
  `super-admin` y `admin-sucursal` (cajero y vendedor-b2b reciben 403).
- `facturacion:devolucion`: Permiso activo y en uso para el endpoint `POST /ventas/facturas/:id/devoluciones`
  (RF-FMC-G1). Asignado a `super-admin` y `admin-sucursal`; cajero y vendedor-b2b reciben 403 `PERMISO_DENEGADO`.

---

## 10. Pruebas

### Archivos de Test y Cobertura

1. [registrar-cliente.use-case.test.ts](../../Backend/packages/core/tests/facturacion/registrar-cliente.use-case.test.ts)
   (3 tests):
   - Reutilización de cliente preexistente sin auditar.
   - Creación exitosa de B2C sin dirección/teléfono con auditoría diferencial
     `despues`.
   - Rechazo de B2B sin dirección con `CLIENTE_B2B_DATOS_INCOMPLETOS` y sin
     auditar.
2. [abrir-turno-caja.use-case.test.ts](../../Backend/packages/core/tests/facturacion/abrir-turno-caja.use-case.test.ts)
   (5 tests):
   - Apertura exitosa, redondeo de fondo inicial y auditoría.
   - Rechazo de fondo inicial negativo.
   - Rechazo si el operador ya tiene un turno abierto (`TURNO_YA_ABIERTO`).
   - Manejo de carrera concurrente en BD.
   - Rechazo si el operador no tiene sucursal asignada
     (`OPERADOR_SIN_SUCURSAL`).
3. [registrar-devolucion.use-case.test.ts](../../Backend/packages/core/tests/facturacion/registrar-devolucion.use-case.test.ts)
   (12 tests):
   - Rechazo de motivo vacío o < 5 caracteres (`DEVOLUCION_INVALIDA`).
   - Rechazo de factura inexistente (`FACTURA_NO_ENCONTRADA`).
   - Rechazo si operador local no pertenece a la sucursal de la factura (`FACTURA_NO_ENCONTRADA`).
   - Rechazo si operador local no tiene sucursal asignada (`OPERADOR_SIN_SUCURSAL`).
   - Super Admin con `ADMIN_VER_METRICAS_GLOBALES` autorizado sin restricción de sucursal.
   - Rechazo de devolución sobre factura en estado anulada (`FACTURA_ANULADA`).
   - Rechazo si `facturaItemId` no pertenece a la factura (`ITEM_FACTURA_NO_ENCONTRADO`).
   - Rechazo de cantidad en exceso frente al remanente vendido (`CANTIDAD_DEVOLUCION_EXCEDIDA`).
   - Devolución parcial exitosa con cálculo proporcional de reembolso y auditoría `crear` / `devoluciones_ventas`.
   - Segunda devolución que completa la línea liquidando el remanente exacto de dinero.
   - Devolución total con `devolverTodo: true` que procesa todas las líneas remanentes.
   - Rechazo de `devolverTodo` si la factura ya fue completamente devuelta (`CANTIDAD_DEVOLUCION_EXCEDIDA`).
4. **Pruebas de Integración HTTP:**
   - [05-clientes.http](../../Http/05-clientes.http): Gestión de clientes B2C/B2B.
   - [13-facturacion.http](../../Http/13-facturacion.http): Turnos, inventario, facturación mostrador y B2B.
   - [30-anulacion-facturas.http](../../Http/30-anulacion-facturas.http): Anulación administrativa y reversión de stock.
   - [31-devoluciones-ventas.http](../../Http/31-devoluciones-ventas.http): 13 escenarios completos de devolución parcial, total, excesos, validaciones, rol cajero (403), sin token (401) y verificación de kardex.

### Brechas Conocidas

- `BuscarClientesUseCase` y `ObtenerTurnoActualUseCase` no cuentan con archivo
  de prueba unitaria independiente en `core/tests/` (cubiertos mediante HTTP).

### Cómo ejecutarlas

```bash
deno test --allow-all Backend/packages/core/tests/facturacion/
```

---

## 11. Flujos Clave

### Flujo: Apertura de Turno de Caja con Validación de Sede

```mermaid
sequenceDiagram
    autonumber
    actor Cajero as Cajero
    participant Ctrl as turno-caja.controller
    participant UC as AbrirTurnoCajaUseCase
    participant RepOp as DrizzleSucursalOperadorRepo
    participant RepTurno as DrizzleTurnoCajaRepo
    participant Aud as DrizzleAuditoriaRepo

    Cajero->>Ctrl: POST /ventas/turnos { fondoInicial: 50000 }
    Ctrl->>UC: execute({ fondoInicial, actor })
    UC->>RepOp: obtenerSucursalId(actor.usuarioId)
    alt Operador sin sucursal
        UC-->>Ctrl: Result.fail(OperadorSinSucursalError)
        Ctrl-->>Cajero: 422 Unprocessable Entity
    end
    UC->>RepTurno: obtenerTurnoAbiertoPorUsuario(usuarioId)
    alt Ya tiene turno abierto
        UC-->>Ctrl: Result.fail(TurnoYaAbiertoError)
        Ctrl-->>Cajero: 409 Conflict
    end
    UC->>RepTurno: crear({ usuarioId, sucursalId, fondoInicial })
    RepTurno-->>UC: TurnoCaja
    UC->>Aud: registrar({ accion: 'crear', entidad: 'turnos_caja', detalles })
    UC-->>Ctrl: Result.ok(TurnoCaja)
    Ctrl-->>Cajero: 201 Created
```

---

## 12. Pendientes y Deuda Técnica

1. **Anulación de Facturas (RF-FMC-F1):** Cerrar ciclo integral de reversión de stock cuando existan devoluciones previas en la misma factura.
2. **Reembolsos en efectivo en el cierre de turno:** El trigger `trg_turnos_caja_calcula_diferencia` no descuenta los reembolsos en efectivo del cálculo de diferencia de arqueo (decisión de negocio abierta pendiente de definir si se registran como pago negativo, tabla propia o campo en `devoluciones_ventas`; **NO modificar el trigger**).
3. **Integración con Facturación Electrónica:** Pendiente de desarrollo de adaptadores de plataforma para DIAN u operadores fiscales.

---

## 13. Cómo Probar Manualmente

El archivo [Http/05-clientes.http](../../Http/05-clientes.http) incluye pruebas
para:

1. Registrar cliente B2C básico.
2. Intentar registrar cliente B2B sin dirección o teléfono (esperando HTTP 422).
3. Registrar cliente B2B completo con NIT.
4. Enviar documento duplicado para comprobar la reutilización (HTTP 200
   `{ yaExistia: true }`).
5. Búsqueda y paginación con filtros en `/ventas/clientes`.
