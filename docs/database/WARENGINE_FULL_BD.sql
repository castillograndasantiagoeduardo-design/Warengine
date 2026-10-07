-- ============================================================================
-- WARENGINE — ESQUEMA COMPLETO MySQL 8.0 (tablas + CHECK + triggers)
-- ============================================================================
-- Convencion de nombres: PK = id_<tabla singular>; FK = <tabla_referenciada
-- singular>_id (excepciones semanticas: asignado_por, registrado_por, ambas
-- apuntando a usuarios.id_usuario).
--
-- Cambio de diseno respecto a la version anterior: `movimientos_inventario.tipo`
-- pasa de ('entrada','salida','ajuste') a ('entrada','salida','ajuste_entrada',
-- 'ajuste_salida'), para que el signo del ajuste sea explicito y los triggers
-- de stock puedan operar sin ambiguedad.
--
-- Columnas de comparacion EXACTA (hashes, codigos, documentos) se declaran con
-- COLLATE utf8mb4_bin para que MySQL las compare byte a byte, no de forma
-- insensible a mayusculas/acentos como el resto del texto libre.
-- ============================================================================

-- ============================================================================
-- CAMBIOS DE ESTA VERSION (sobre WARENGINE_FULL_BD1.sql, todo lo demas quedo
-- intacto):
--   D1 - productos.precio_corporativo_actualizado_en + trigger que la llena sola
--   D2 - mantenimientos_activos.fecha_fin + triggers que sincronizan activos.estado
--   D3 - trigger que valida credito_corporativo contra tipo_cliente/credito_habilitado
--   D4 - CHECK: direccion y telefono obligatorios para clientes B2B
--   D5 - CHECK: tipo_documento restringido en clientes y en empleados
--   B1 - usuarios.tokens_invalidados_en + triggers que la actualizan (rol,
--        estado, sucursal)
--   B2 - usuarios.totp_secret (columna de esquema, sin trigger)
--   Validacion de devoluciones - trg_devoluciones_check_cantidad ahora tambien
--        valida factura, sucursal, estado de la factura y monto de reembolso
-- ============================================================================

DROP SCHEMA IF EXISTS warengine;
CREATE SCHEMA warengine DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE warengine;

-- ============================================================================
-- 1. SEGURIDAD Y AUTENTICACION (RBAC)
-- ============================================================================

CREATE TABLE sucursales (
    id_sucursal   INT NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(150) NOT NULL,
    direccion     VARCHAR(255) NULL,
    contacto      VARCHAR(100) NULL,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_sucursal)
) ENGINE=InnoDB;

CREATE TABLE roles (
    id_rol        INT NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(50) NOT NULL,
    descripcion   VARCHAR(255) NULL,
    PRIMARY KEY (id_rol),
    UNIQUE INDEX uq_roles_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE permisos (
    id_permiso    INT NOT NULL AUTO_INCREMENT,
    codigo        VARCHAR(100) NOT NULL COLLATE utf8mb4_bin,
    modulo        VARCHAR(50) NOT NULL,
    descripcion   VARCHAR(255) NULL,
    PRIMARY KEY (id_permiso),
    UNIQUE INDEX uq_permisos_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE rol_permisos (
    rol_id        INT NOT NULL,
    permiso_id    INT NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    CONSTRAINT fk_rolpermisos_rol FOREIGN KEY (rol_id) REFERENCES roles(id_rol) ON DELETE CASCADE,
    CONSTRAINT fk_rolpermisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos(id_permiso) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE areas (
    id_area       INT NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(100) NOT NULL,
    sucursal_id   INT NOT NULL,
    PRIMARY KEY (id_area),
    INDEX idx_areas_sucursal_id (sucursal_id),
    CONSTRAINT fk_areas_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================================
-- 2. GESTION DE PERSONAL Y SUELDOS
-- ============================================================================

CREATE TABLE empleados (
    id_empleado       CHAR(36) NOT NULL DEFAULT (UUID()),
    tipo_documento    VARCHAR(10) NOT NULL,
    numero_documento  VARCHAR(30) NOT NULL COLLATE utf8mb4_bin,
    nombre            VARCHAR(150) NOT NULL,
    telefono          VARCHAR(30) NULL,
    direccion         VARCHAR(255) NULL,
    cargo             VARCHAR(100) NULL,
    area_id           INT NULL,
    sucursal_id       INT NOT NULL,
    fecha_ingreso     DATE NOT NULL DEFAULT (CURDATE()),
    sueldo_actual     DECIMAL(14,2) NULL,
    is_active         TINYINT(1) NOT NULL DEFAULT 1,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_empleado),
    UNIQUE INDEX uq_empleados_documento (tipo_documento, numero_documento),
    INDEX idx_empleados_sucursal_id (sucursal_id),
    INDEX idx_empleados_area_id (area_id),
    CONSTRAINT fk_empleados_area FOREIGN KEY (area_id) REFERENCES areas(id_area) ON DELETE SET NULL,
    CONSTRAINT fk_empleados_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    -- CAMBIO (D5): tipo_documento ya no es texto libre. Se asume CC/CE para
    -- personal colombiano; ajustar la lista si el negocio maneja otros tipos.
    CONSTRAINT chk_empleados_tipo_documento CHECK (tipo_documento IN ('CC','CE'))
) ENGINE=InnoDB;

CREATE TABLE usuarios (
    id_usuario      CHAR(36) NOT NULL DEFAULT (UUID()),
    empleado_id     CHAR(36) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL COLLATE utf8mb4_bin,
    rol_id          INT NOT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    requiere_2fa    TINYINT(1) NOT NULL DEFAULT 0,
    -- CAMBIO (B2): secreto TOTP contra el que se valida el codigo de 2FA que
    -- la persona escribe (app tipo Google Authenticator). Sin esto, requiere_2fa
    -- es solo una bandera sin nada contra que comparar.
    totp_secret     VARCHAR(255) COLLATE utf8mb4_bin NULL,
    -- CAMBIO (B1): RF-SA-D11 — al cambiar rol/estado/sucursal, se marca desde
    -- cuando cualquier JWT anterior debe considerarse invalido. El backend debe
    -- rechazar todo token cuyo "iat" sea anterior a esta fecha.
    tokens_invalidados_en DATETIME NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    UNIQUE INDEX uq_usuarios_empleado_id (empleado_id),
    UNIQUE INDEX uq_usuarios_email (email),
    INDEX idx_usuarios_rol_id (rol_id),
    CONSTRAINT fk_usuarios_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id_empleado) ON DELETE RESTRICT,
    CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id_rol) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE historial_salarios (
    id_historial_salario CHAR(36) NOT NULL DEFAULT (UUID()),
    empleado_id          CHAR(36) NOT NULL,
    sueldo                DECIMAL(14,2) NOT NULL,
    fecha_efectiva        DATE NOT NULL DEFAULT (CURDATE()),
    motivo                VARCHAR(255) NULL,
    registrado_por        CHAR(36) NOT NULL,
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at            DATETIME NULL,
    PRIMARY KEY (id_historial_salario),
    INDEX idx_historial_salarios_empleado_id (empleado_id),
    CONSTRAINT fk_historial_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
    CONSTRAINT fk_historial_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE usuario_sucursales (
    usuario_id    CHAR(36) NOT NULL,
    sucursal_id   INT NOT NULL,
    PRIMARY KEY (usuario_id, sucursal_id),
    CONSTRAINT fk_usucursales_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_usucursales_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
    id_refresh_token CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id       CHAR(36) NOT NULL,
    token_hash       VARCHAR(255) NOT NULL COLLATE utf8mb4_bin,
    expira_en        DATETIME NOT NULL,
    revocado         TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id_refresh_token),
    INDEX idx_refresh_tokens_usuario_id (usuario_id),
    CONSTRAINT fk_refresh_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
    id_password_reset_token CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id              CHAR(36) NOT NULL,
    token_hash              VARCHAR(255) NOT NULL COLLATE utf8mb4_bin,
    expira_en               DATETIME NOT NULL,
    usado                   TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id_password_reset_token),
    INDEX idx_password_reset_usuario_id (usuario_id),
    CONSTRAINT fk_pwreset_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sin FK a proposito: si el correo no existe, el intento igual se registra,
-- para no poder inferir por descarte que correos si estan registrados.
CREATE TABLE intentos_login (
    id_intento_login CHAR(36) NOT NULL DEFAULT (UUID()),
    email            VARCHAR(150) NOT NULL,
    ip               VARCHAR(45) NOT NULL,
    exitoso          TINYINT(1) NOT NULL,
    fecha            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_intento_login),
    INDEX idx_intentos_login_email (email),
    INDEX idx_intentos_login_ip (ip)
) ENGINE=InnoDB;

-- ============================================================================
-- 3. CATALOGO E INVENTARIO VENDIBLE
-- ============================================================================

CREATE TABLE categorias (
    id_categoria  INT NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(100) NOT NULL,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_categoria)
) ENGINE=InnoDB;

CREATE TABLE proveedores (
    id_proveedor  INT NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(150) NOT NULL,
    contacto      VARCHAR(100) NULL,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_proveedor)
) ENGINE=InnoDB;

CREATE TABLE productos (
    id_producto         CHAR(36) NOT NULL DEFAULT (UUID()),
    sku                 VARCHAR(50) NOT NULL COLLATE utf8mb4_bin,
    nombre              VARCHAR(200) NOT NULL,
    categoria_id        INT NULL,
    proveedor_id        INT NULL,
    precio_compra       DECIMAL(14,2) NOT NULL,
    precio_venta        DECIMAL(14,2) NOT NULL,
    precio_corporativo  DECIMAL(14,2) NULL,
    -- CAMBIO (D1): RF-FMC-C6 exige mostrar la fecha de ultima actualizacion
    -- del precio corporativo. Se llena sola con el trigger trg_productos_precio_corporativo_fecha.
    precio_corporativo_actualizado_en DATETIME NULL,
    is_active           TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_producto),
    UNIQUE INDEX uq_productos_sku (sku),
    INDEX idx_productos_categoria_id (categoria_id),
    INDEX idx_productos_proveedor_id (proveedor_id),
    CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
    CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id_proveedor) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE inventario_sucursal (
    producto_id   CHAR(36) NOT NULL,
    sucursal_id   INT NOT NULL,
    stock_actual  INT NOT NULL DEFAULT 0,
    stock_minimo  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (producto_id, sucursal_id),
    INDEX idx_inventario_sucursal_id (sucursal_id),
    CONSTRAINT fk_inventario_producto FOREIGN KEY (producto_id) REFERENCES productos(id_producto) ON DELETE CASCADE,
    CONSTRAINT fk_inventario_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT chk_inventario_stock_actual CHECK (stock_actual >= 0),
    CONSTRAINT chk_inventario_stock_minimo CHECK (stock_minimo >= 0)
) ENGINE=InnoDB;

CREATE TABLE movimientos_inventario (
    id_movimiento_inventario CHAR(36) NOT NULL DEFAULT (UUID()),
    producto_id              CHAR(36) NOT NULL,
    sucursal_id              INT NOT NULL,
    tipo                     VARCHAR(20) NOT NULL,
    cantidad                 INT NOT NULL,
    motivo                   VARCHAR(255) NULL,
    factura_id               CHAR(36) NULL,
    proveedor_id             INT NULL,
    devolucion_id            CHAR(36) NULL,
    usuario_id               CHAR(36) NOT NULL,
    fecha                    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_movimiento_inventario),
    INDEX idx_movimientos_producto_id (producto_id),
    INDEX idx_movimientos_sucursal_id (sucursal_id),
    INDEX idx_movimientos_factura_id (factura_id),
    INDEX idx_movimientos_devolucion_id (devolucion_id),
    INDEX idx_movimientos_fecha (fecha),
    CONSTRAINT fk_movimientos_producto FOREIGN KEY (producto_id) REFERENCES productos(id_producto) ON DELETE RESTRICT,
    CONSTRAINT fk_movimientos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT fk_movimientos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL,
    CONSTRAINT fk_movimientos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT chk_movimientos_tipo CHECK (tipo IN ('entrada','salida','ajuste_entrada','ajuste_salida')),
    CONSTRAINT chk_movimientos_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- ============================================================================
-- 4. MODULO DE LOGISTICA (ACTIVOS INTERNOS)
-- ============================================================================

CREATE TABLE categorias_activos (
    id_categoria_activo INT NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_categoria_activo)
) ENGINE=InnoDB;

CREATE TABLE activos (
    id_activo            CHAR(36) NOT NULL DEFAULT (UUID()),
    codigo_activo        VARCHAR(50) NOT NULL COLLATE utf8mb4_bin,
    nombre               VARCHAR(200) NOT NULL,
    categoria_activo_id  INT NULL,
    sucursal_id          INT NOT NULL,
    estado               VARCHAR(20) NOT NULL DEFAULT 'disponible',
    valor_adquisicion    DECIMAL(14,2) NULL,
    fecha_adquisicion    DATE NULL,
    condicion            VARCHAR(50) NULL,
    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_activo),
    UNIQUE INDEX uq_activos_codigo (codigo_activo),
    INDEX idx_activos_categoria_activo_id (categoria_activo_id),
    INDEX idx_activos_sucursal_id (sucursal_id),
    CONSTRAINT fk_activos_categoria FOREIGN KEY (categoria_activo_id) REFERENCES categorias_activos(id_categoria_activo) ON DELETE RESTRICT,
    CONSTRAINT fk_activos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT chk_activos_estado CHECK (estado IN ('disponible','asignado','mantenimiento','baja'))
) ENGINE=InnoDB;

CREATE TABLE asignaciones_activos (
    id_asignacion_activo      CHAR(36) NOT NULL DEFAULT (UUID()),
    activo_id                 CHAR(36) NOT NULL,
    empleado_id               CHAR(36) NULL,
    area_id                   INT NULL,
    sucursal_id               INT NOT NULL,
    asignado_por              CHAR(36) NOT NULL,
    fecha_asignacion          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_esperada DATETIME NULL,
    fecha_devolucion_real     DATETIME NULL,
    estado                    VARCHAR(20) NOT NULL DEFAULT 'activa',
    observaciones             VARCHAR(500) NULL,
    PRIMARY KEY (id_asignacion_activo),
    INDEX idx_asignaciones_activo_id (activo_id),
    INDEX idx_asignaciones_empleado_id (empleado_id),
    INDEX idx_asignaciones_area_id (area_id),
    CONSTRAINT fk_asignaciones_activo FOREIGN KEY (activo_id) REFERENCES activos(id_activo) ON DELETE RESTRICT,
    CONSTRAINT fk_asignaciones_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id_empleado) ON DELETE SET NULL,
    CONSTRAINT fk_asignaciones_area FOREIGN KEY (area_id) REFERENCES areas(id_area) ON DELETE SET NULL,
    CONSTRAINT fk_asignaciones_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT fk_asignaciones_asignado_por FOREIGN KEY (asignado_por) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT chk_asignaciones_estado CHECK (estado IN ('activa','devuelta','vencida'))
    -- La regla "empleado_id XOR area_id" NO puede ir como CHECK en MySQL:
    -- el motor lo rechaza porque ambas columnas tienen ON DELETE SET NULL
    -- (error 3823 — un CHECK no puede depender de una columna que una FK
    -- puede poner en NULL automaticamente). Se aplica via trigger (7.6).
) ENGINE=InnoDB;

CREATE TABLE mantenimientos_activos (
    id_mantenimiento_activo CHAR(36) NOT NULL DEFAULT (UUID()),
    activo_id               CHAR(36) NOT NULL,
    proveedor_id            INT NULL,
    tipo                    VARCHAR(50) NOT NULL,
    fecha                   DATE NOT NULL DEFAULT (CURDATE()),
    -- CAMBIO (D2): RF-LOG-C2 — mientras fecha_fin sea NULL, el mantenimiento
    -- sigue en curso. Al llenarse, el activo vuelve a estar disponible
    -- (triggers trg_mantenimientos_inicia / trg_mantenimientos_finaliza).
    fecha_fin               DATE NULL,
    costo                   DECIMAL(14,2) NULL,
    descripcion             VARCHAR(500) NULL,
    deleted_at              DATETIME NULL,
    PRIMARY KEY (id_mantenimiento_activo),
    INDEX idx_mantenimientos_activo_id (activo_id),
    INDEX idx_mantenimientos_proveedor_id (proveedor_id),
    CONSTRAINT fk_mantenimientos_activo FOREIGN KEY (activo_id) REFERENCES activos(id_activo) ON DELETE RESTRICT,
    CONSTRAINT fk_mantenimientos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- 5. VENTAS Y FACTURACION
-- ============================================================================

CREATE TABLE clientes (
    id_cliente            CHAR(36) NOT NULL DEFAULT (UUID()),
    tipo_documento        VARCHAR(10) NOT NULL,
    numero_documento      VARCHAR(30) NOT NULL COLLATE utf8mb4_bin,
    nombre_razon_social   VARCHAR(200) NOT NULL,
    tipo_cliente          VARCHAR(10) NOT NULL DEFAULT 'B2C',
    email                 VARCHAR(150) NULL,
    telefono              VARCHAR(30) NULL,
    direccion             VARCHAR(255) NULL,
    credito_habilitado    TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at            DATETIME NULL,
    PRIMARY KEY (id_cliente),
    UNIQUE INDEX uq_clientes_documento (tipo_documento, numero_documento),
    CONSTRAINT chk_clientes_tipo CHECK (tipo_cliente IN ('B2C','B2B')),
    -- CAMBIO (D5): tipo_documento restringido a lo que el SRS pide filtrar.
    CONSTRAINT chk_clientes_tipo_documento CHECK (tipo_documento IN ('CC','NIT','RUT')),
    -- CAMBIO (D4): direccion y telefono obligatorios solo para clientes B2B.
    CONSTRAINT chk_clientes_datos_b2b CHECK (
        tipo_cliente <> 'B2B' OR (direccion IS NOT NULL AND telefono IS NOT NULL)
    )
) ENGINE=InnoDB;

CREATE TABLE turnos_caja (
    id_turno_caja  CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id     CHAR(36) NOT NULL,
    sucursal_id    INT NOT NULL,
    fondo_inicial  DECIMAL(14,2) NOT NULL,
    fondo_final    DECIMAL(14,2) NULL,
    diferencia     DECIMAL(14,2) NULL,
    fecha_apertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre   DATETIME NULL,
    deleted_at     DATETIME NULL,
    PRIMARY KEY (id_turno_caja),
    INDEX idx_turnos_caja_usuario_id (usuario_id),
    INDEX idx_turnos_caja_sucursal_id (sucursal_id),
    CONSTRAINT fk_turnos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_turnos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE facturas (
    id_factura     CHAR(36) NOT NULL DEFAULT (UUID()),
    consecutivo    INT NOT NULL,
    cliente_id     CHAR(36) NOT NULL,
    usuario_id     CHAR(36) NOT NULL,
    sucursal_id    INT NOT NULL,
    turno_caja_id  CHAR(36) NULL,
    subtotal       DECIMAL(14,2) NOT NULL,
    iva            DECIMAL(14,2) NOT NULL DEFAULT 0,
    total          DECIMAL(14,2) NOT NULL,
    estado         VARCHAR(20) NOT NULL DEFAULT 'emitida',
    anulada_por    CHAR(36) NULL,
    fecha          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at     DATETIME NULL,
    PRIMARY KEY (id_factura),
    UNIQUE INDEX uq_facturas_consecutivo_sucursal (sucursal_id, consecutivo),
    INDEX idx_facturas_cliente_id (cliente_id),
    INDEX idx_facturas_usuario_id (usuario_id),
    INDEX idx_facturas_fecha (fecha),
    INDEX idx_facturas_anulada_por (anulada_por),
    CONSTRAINT fk_facturas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id_cliente) ON DELETE RESTRICT,
    CONSTRAINT fk_facturas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_facturas_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT fk_facturas_turno FOREIGN KEY (turno_caja_id) REFERENCES turnos_caja(id_turno_caja) ON DELETE RESTRICT,
    CONSTRAINT fk_facturas_anulada_por FOREIGN KEY (anulada_por) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT chk_facturas_estado CHECK (estado IN ('emitida','anulada'))
) ENGINE=InnoDB;

CREATE TABLE factura_items (
    id_factura_item CHAR(36) NOT NULL DEFAULT (UUID()),
    factura_id      CHAR(36) NOT NULL,
    producto_id     CHAR(36) NOT NULL,
    cantidad        INT NOT NULL,
    precio_unitario DECIMAL(14,2) NOT NULL,
    descuento       DECIMAL(14,2) NOT NULL DEFAULT 0,
    subtotal        DECIMAL(14,2) NOT NULL,
    deleted_at      DATETIME NULL,
    PRIMARY KEY (id_factura_item),
    INDEX idx_factura_items_factura_id (factura_id),
    INDEX idx_factura_items_producto_id (producto_id),
    CONSTRAINT fk_facturaitems_factura FOREIGN KEY (factura_id) REFERENCES facturas(id_factura) ON DELETE RESTRICT,
    CONSTRAINT fk_facturaitems_producto FOREIGN KEY (producto_id) REFERENCES productos(id_producto) ON DELETE RESTRICT,
    CONSTRAINT chk_facturaitems_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

CREATE TABLE factura_pagos (
    id_factura_pago         CHAR(36) NOT NULL DEFAULT (UUID()),
    factura_id              CHAR(36) NOT NULL,
    medio_pago              VARCHAR(30) NOT NULL,
    monto                   DECIMAL(14,2) NOT NULL,
    referencia_transaccion  VARCHAR(100) NULL,
    fecha                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_factura_pago),
    INDEX idx_factura_pagos_factura_id (factura_id),
    CONSTRAINT fk_facturapagos_factura FOREIGN KEY (factura_id) REFERENCES facturas(id_factura) ON DELETE RESTRICT,
    CONSTRAINT chk_facturapagos_medio CHECK (medio_pago IN ('efectivo','tarjeta','transferencia','credito_corporativo')),
    CONSTRAINT chk_facturapagos_monto CHECK (monto > 0)
) ENGINE=InnoDB;

CREATE TABLE devoluciones_ventas (
    id_devolucion_venta CHAR(36) NOT NULL DEFAULT (UUID()),
    factura_item_id     CHAR(36) NOT NULL,
    factura_id          CHAR(36) NOT NULL,
    cantidad            INT NOT NULL,
    motivo              VARCHAR(255) NOT NULL,
    monto_reembolso     DECIMAL(14,2) NOT NULL,
    reingresa_stock     TINYINT(1) NOT NULL DEFAULT 1,
    usuario_id          CHAR(36) NOT NULL,
    sucursal_id         INT NOT NULL,
    fecha               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          DATETIME NULL,
    PRIMARY KEY (id_devolucion_venta),
    INDEX idx_devoluciones_factura_item_id (factura_item_id),
    INDEX idx_devoluciones_factura_id (factura_id),
    CONSTRAINT fk_devoluciones_item FOREIGN KEY (factura_item_id) REFERENCES factura_items(id_factura_item) ON DELETE RESTRICT,
    CONSTRAINT fk_devoluciones_factura FOREIGN KEY (factura_id) REFERENCES facturas(id_factura) ON DELETE RESTRICT,
    CONSTRAINT fk_devoluciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_devoluciones_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT chk_devoluciones_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- FK tardias: movimientos_inventario.factura_id y .devolucion_id solo pueden
-- declararse una vez que facturas y devoluciones_ventas ya existen.
ALTER TABLE movimientos_inventario
    ADD CONSTRAINT fk_movimientos_factura
    FOREIGN KEY (factura_id) REFERENCES facturas(id_factura) ON DELETE RESTRICT;

ALTER TABLE movimientos_inventario
    ADD CONSTRAINT fk_movimientos_devolucion
    FOREIGN KEY (devolucion_id) REFERENCES devoluciones_ventas(id_devolucion_venta) ON DELETE SET NULL;

-- ============================================================================
-- 6. AUDITORIA, MCP Y SOPORTE
-- ============================================================================

CREATE TABLE logs_auditoria (
    id_log_auditoria CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id       CHAR(36) NULL,
    accion           VARCHAR(50) NOT NULL,
    entidad          VARCHAR(100) NOT NULL,
    entidad_id       VARCHAR(100) NULL,
    detalles         JSON NULL,
    ip               VARCHAR(45) NULL,
    fecha            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_log_auditoria),
    INDEX idx_logs_auditoria_usuario_id (usuario_id),
    INDEX idx_logs_auditoria_fecha (fecha),
    CONSTRAINT fk_logsauditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE logs_mcp_tools (
    id_log_mcp_tool CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id      CHAR(36) NULL,
    tool_name       VARCHAR(100) NOT NULL,
    parametros      JSON NULL,
    resultado       VARCHAR(20) NOT NULL,
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_log_mcp_tool),
    INDEX idx_logs_mcp_usuario_id (usuario_id),
    CONSTRAINT fk_logsmcp_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_logsmcp_resultado CHECK (resultado IN ('permitido','denegado'))
) ENGINE=InnoDB;

CREATE TABLE alertas_admin (
    id_alerta_admin CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id      CHAR(36) NOT NULL,
    sucursal_id     INT NOT NULL,
    motivo          VARCHAR(100) NOT NULL,
    prioridad       VARCHAR(10) NOT NULL DEFAULT 'normal',
    descripcion     VARCHAR(500) NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_atencion  DATETIME NULL,
    PRIMARY KEY (id_alerta_admin),
    INDEX idx_alertas_usuario_id (usuario_id),
    INDEX idx_alertas_sucursal_id (sucursal_id),
    INDEX idx_alertas_estado (estado),
    CONSTRAINT fk_alertas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_alertas_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT chk_alertas_prioridad CHECK (prioridad IN ('urgente','normal')),
    CONSTRAINT chk_alertas_estado CHECK (estado IN ('pendiente','visto','atendido'))
) ENGINE=InnoDB;

-- ============================================================================
-- 7. TRIGGERS — segunda capa de validacion e integridad
-- ============================================================================
-- Convencion: trg_<tabla>_<que_hace>. Todos usan SIGNAL SQLSTATE '45000' para
-- bloquear con un mensaje legible cuando corresponde.

DELIMITER $$

-- 7.1 movimientos_inventario: no permitir que una salida/ajuste deje stock
-- negativo (repite RF-ADM-B9 a nivel de BD, por si el backend falla).
CREATE TRIGGER trg_movimientos_check_stock
BEFORE INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    DECLARE v_stock_actual INT DEFAULT 0;

    IF NEW.tipo IN ('salida','ajuste_salida') THEN
        SELECT stock_actual INTO v_stock_actual
            FROM inventario_sucursal
            WHERE producto_id = NEW.producto_id AND sucursal_id = NEW.sucursal_id;

        IF v_stock_actual IS NULL THEN
            SET v_stock_actual = 0;
        END IF;

        IF v_stock_actual < NEW.cantidad THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Stock insuficiente: el movimiento dejaria el inventario en negativo';
        END IF;
    END IF;
END$$

-- 7.2 movimientos_inventario: es el kardex quien manda — cada fila que entra
-- aqui actualiza automaticamente inventario_sucursal.stock_actual.
CREATE TRIGGER trg_movimientos_actualiza_stock
AFTER INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    DECLARE v_delta INT;

    IF NEW.tipo IN ('entrada','ajuste_entrada') THEN
        SET v_delta = NEW.cantidad;
    ELSE
        SET v_delta = -NEW.cantidad;
    END IF;

    INSERT INTO inventario_sucursal (producto_id, sucursal_id, stock_actual, stock_minimo)
        VALUES (NEW.producto_id, NEW.sucursal_id, GREATEST(v_delta, 0), 0)
    ON DUPLICATE KEY UPDATE
        stock_actual = stock_actual + v_delta;
END$$

-- 7.3 factura_items: bloquea la venta si no hay existencias suficientes en
-- la sucursal de la factura (RF-02), antes de que la linea se inserte.
CREATE TRIGGER trg_factura_items_check_stock
BEFORE INSERT ON factura_items
FOR EACH ROW
BEGIN
    DECLARE v_sucursal_id INT;
    DECLARE v_stock_actual INT DEFAULT 0;

    SELECT sucursal_id INTO v_sucursal_id FROM facturas WHERE id_factura = NEW.factura_id;

    SELECT stock_actual INTO v_stock_actual
        FROM inventario_sucursal
        WHERE producto_id = NEW.producto_id AND sucursal_id = v_sucursal_id;

    IF v_stock_actual IS NULL THEN
        SET v_stock_actual = 0;
    END IF;

    IF v_stock_actual < NEW.cantidad THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Stock insuficiente para completar la venta de este producto';
    END IF;
END$$

-- 7.4 factura_items: al vender, genera automaticamente la salida en el
-- kardex (que a su vez dispara 7.1 y 7.2). Una sola fuente de verdad.
CREATE TRIGGER trg_factura_items_genera_salida
AFTER INSERT ON factura_items
FOR EACH ROW
BEGIN
    DECLARE v_sucursal_id INT;
    DECLARE v_usuario_id CHAR(36);

    SELECT sucursal_id, usuario_id INTO v_sucursal_id, v_usuario_id
        FROM facturas WHERE id_factura = NEW.factura_id;

    INSERT INTO movimientos_inventario
        (producto_id, sucursal_id, tipo, cantidad, motivo, factura_id, usuario_id)
    VALUES
        (NEW.producto_id, v_sucursal_id, 'salida', NEW.cantidad, 'Venta - factura', NEW.factura_id, v_usuario_id);
END$$

-- 7.5 factura_pagos: la suma de pagos de una factura nunca puede superar su
-- total (soporta pago dividido, pero no sobre-pago).
CREATE TRIGGER trg_factura_pagos_check_total
AFTER INSERT ON factura_pagos
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(14,2);
    DECLARE v_suma_pagos DECIMAL(14,2);

    SELECT total INTO v_total FROM facturas WHERE id_factura = NEW.factura_id;
    SELECT SUM(monto) INTO v_suma_pagos FROM factura_pagos WHERE factura_id = NEW.factura_id;

    IF v_suma_pagos > v_total THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La suma de los pagos supera el total de la factura';
    END IF;
END$$

-- CAMBIO (D3): RF-FMC-E2 — el credito corporativo solo es valido para
-- clientes B2B con credito_habilitado = 1. Va en un trigger BEFORE para
-- bloquear el pago antes de insertarlo.
CREATE TRIGGER trg_factura_pagos_check_credito
BEFORE INSERT ON factura_pagos
FOR EACH ROW
BEGIN
    DECLARE v_tipo_cliente VARCHAR(10);
    DECLARE v_credito_habilitado TINYINT(1);

    IF NEW.medio_pago = 'credito_corporativo' THEN
        SELECT c.tipo_cliente, c.credito_habilitado
            INTO v_tipo_cliente, v_credito_habilitado
            FROM facturas f
            JOIN clientes c ON c.id_cliente = f.cliente_id
            WHERE f.id_factura = NEW.factura_id;

        IF v_tipo_cliente <> 'B2B' OR v_credito_habilitado = 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'El credito corporativo solo esta disponible para clientes B2B con credito habilitado';
        END IF;
    END IF;
END$$

-- 7.6 asignaciones_activos: (a) exactamente un responsable, empleado O area
-- pero no ambos ni ninguno — regla que en MySQL no puede ir como CHECK por
-- las FK con ON DELETE SET NULL de estas columnas (ver comentario en la
-- tabla); y (b) no se puede asignar un activo que ya esta asignado, en
-- mantenimiento o dado de baja.
CREATE TRIGGER trg_asignaciones_check_disponibilidad
BEFORE INSERT ON asignaciones_activos
FOR EACH ROW
BEGIN
    DECLARE v_estado_activo VARCHAR(20);

    IF (NEW.empleado_id IS NOT NULL) = (NEW.area_id IS NOT NULL) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La asignacion debe tener exactamente un responsable: empleado o area, no ambos ni ninguno';
    END IF;

    IF NEW.estado = 'activa' THEN
        SELECT estado INTO v_estado_activo FROM activos WHERE id_activo = NEW.activo_id;
        IF v_estado_activo <> 'disponible' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'El activo no esta disponible para una nueva asignacion';
        END IF;
    END IF;
END$$

-- 7.6b misma regla de responsable unico, tambien al editar una asignacion.
CREATE TRIGGER trg_asignaciones_check_responsable_update
BEFORE UPDATE ON asignaciones_activos
FOR EACH ROW
BEGIN
    IF (NEW.empleado_id IS NOT NULL) = (NEW.area_id IS NOT NULL) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La asignacion debe tener exactamente un responsable: empleado o area, no ambos ni ninguno';
    END IF;
END$$

-- 7.7 asignaciones_activos: al crear una asignacion activa, el activo pasa
-- a 'asignado' automaticamente (mantiene el estado desnormalizado en sync).
CREATE TRIGGER trg_asignaciones_marca_asignado
AFTER INSERT ON asignaciones_activos
FOR EACH ROW
BEGIN
    IF NEW.estado = 'activa' THEN
        UPDATE activos SET estado = 'asignado' WHERE id_activo = NEW.activo_id;
    END IF;
END$$

-- 7.8 asignaciones_activos: si registran fecha_devolucion_real sin cambiar
-- el estado manualmente, lo marca 'devuelta' por ellos.
CREATE TRIGGER trg_asignaciones_autoset_devuelta
BEFORE UPDATE ON asignaciones_activos
FOR EACH ROW
BEGIN
    IF NEW.fecha_devolucion_real IS NOT NULL AND OLD.fecha_devolucion_real IS NULL THEN
        SET NEW.estado = 'devuelta';
    END IF;
END$$

-- 7.9 asignaciones_activos: cuando una asignacion pasa a 'devuelta', el
-- activo vuelve a estar 'disponible' para la siguiente asignacion.
CREATE TRIGGER trg_asignaciones_marca_devuelto
AFTER UPDATE ON asignaciones_activos
FOR EACH ROW
BEGIN
    IF NEW.estado = 'devuelta' AND OLD.estado <> 'devuelta' THEN
        -- Solo libera el activo si su estado actual es 'asignado'; si esta en
        -- 'mantenimiento' o 'baja' por otra via, ese estado no se pisa.
        UPDATE activos
            SET estado = 'disponible'
            WHERE id_activo = NEW.activo_id AND estado = 'asignado';
    END IF;
END$$

-- CAMBIO (D2): RF-LOG-C2 — mientras el mantenimiento no tenga fecha_fin, el
-- activo pasa a 'mantenimiento' automaticamente. Si el activo ya estaba
-- 'baja', se respeta y no se sobreescribe.
CREATE TRIGGER trg_mantenimientos_inicia
AFTER INSERT ON mantenimientos_activos
FOR EACH ROW
BEGIN
    IF NEW.fecha_fin IS NULL THEN
        UPDATE activos SET estado = 'mantenimiento'
            WHERE id_activo = NEW.activo_id AND estado <> 'baja';
    END IF;
END$$

-- CAMBIO (D2): al cerrar el mantenimiento (fecha_fin pasa de NULL a un
-- valor), el activo vuelve a 'disponible' solo si seguia 'mantenimiento'.
CREATE TRIGGER trg_mantenimientos_finaliza
AFTER UPDATE ON mantenimientos_activos
FOR EACH ROW
BEGIN
    IF NEW.fecha_fin IS NOT NULL AND OLD.fecha_fin IS NULL THEN
        UPDATE activos SET estado = 'disponible'
            WHERE id_activo = NEW.activo_id AND estado = 'mantenimiento';
    END IF;
END$$

-- 7.10 historial_salarios: cada cambio de sueldo actualiza el valor vigente
-- en empleados, sin depender de que el backend recuerde tocar dos tablas.
CREATE TRIGGER trg_historial_salarios_sync
AFTER INSERT ON historial_salarios
FOR EACH ROW
BEGIN
    UPDATE empleados SET sueldo_actual = NEW.sueldo WHERE id_empleado = NEW.empleado_id;
END$$

-- 7.11 devoluciones_ventas: no se puede devolver mas de lo que esa linea de
-- factura realmente vendio (contando devoluciones previas de la misma linea).
-- CAMBIO (validacion de devoluciones): ademas de la cantidad, ahora valida
-- que factura_id coincida con la factura real del item, que sucursal_id sea
-- la de esa factura, que la factura no este anulada, y que el monto de
-- reembolso no supere el valor de lo que se esta devolviendo.
CREATE TRIGGER trg_devoluciones_check_cantidad
BEFORE INSERT ON devoluciones_ventas
FOR EACH ROW
BEGIN
    DECLARE v_cantidad_vendida INT;
    DECLARE v_precio_unitario DECIMAL(14,2);
    DECLARE v_factura_id_real CHAR(36);
    DECLARE v_sucursal_id_real INT;
    DECLARE v_estado_factura VARCHAR(20);
    DECLARE v_cantidad_devuelta_previa INT DEFAULT 0;

    SELECT fi.cantidad, fi.precio_unitario, fi.factura_id, f.sucursal_id, f.estado
        INTO v_cantidad_vendida, v_precio_unitario, v_factura_id_real, v_sucursal_id_real, v_estado_factura
        FROM factura_items fi
        JOIN facturas f ON f.id_factura = fi.factura_id
        WHERE fi.id_factura_item = NEW.factura_item_id;

    IF NEW.factura_id <> v_factura_id_real THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La devolucion indica una factura distinta a la de la linea vendida';
    END IF;

    IF NEW.sucursal_id <> v_sucursal_id_real THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La sucursal de la devolucion no coincide con la sucursal de la factura';
    END IF;

    IF v_estado_factura = 'anulada' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se puede registrar una devolucion sobre una factura anulada';
    END IF;

    SELECT COALESCE(SUM(cantidad), 0) INTO v_cantidad_devuelta_previa
        FROM devoluciones_ventas
        WHERE factura_item_id = NEW.factura_item_id AND deleted_at IS NULL;

    IF (v_cantidad_devuelta_previa + NEW.cantidad) > v_cantidad_vendida THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La cantidad devuelta supera la cantidad vendida en esa linea de factura';
    END IF;

    IF NEW.monto_reembolso > (v_precio_unitario * NEW.cantidad) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El monto de reembolso supera el valor de lo que se esta devolviendo';
    END IF;
END$$

-- 7.12 devoluciones_ventas: si el producto reingresa a bodega, genera el
-- movimiento de entrada en el kardex automaticamente (encadena con 7.1/7.2).
CREATE TRIGGER trg_devoluciones_genera_entrada
AFTER INSERT ON devoluciones_ventas
FOR EACH ROW
BEGIN
    DECLARE v_producto_id CHAR(36);

    IF NEW.reingresa_stock = 1 THEN
        SELECT producto_id INTO v_producto_id FROM factura_items WHERE id_factura_item = NEW.factura_item_id;

        INSERT INTO movimientos_inventario
            (producto_id, sucursal_id, tipo, cantidad, motivo, devolucion_id, usuario_id)
        VALUES
            (v_producto_id, NEW.sucursal_id, 'entrada', NEW.cantidad, 'Reingreso por devolucion de venta',
             NEW.id_devolucion_venta, NEW.usuario_id);
    END IF;
END$$

-- 7.13 turnos_caja: al cerrar el turno, calcula la diferencia de caja
-- automaticamente (fondo contado vs. fondo esperado segun lo vendido en
-- efectivo), en vez de confiar en que el frontend haga bien la resta.
CREATE TRIGGER trg_turnos_caja_calcula_diferencia
BEFORE UPDATE ON turnos_caja
FOR EACH ROW
BEGIN
    DECLARE v_efectivo_vendido DECIMAL(14,2) DEFAULT 0;

    IF NEW.fecha_cierre IS NOT NULL AND OLD.fecha_cierre IS NULL THEN
        IF NEW.fondo_final IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'No se puede cerrar el turno sin registrar el fondo_final contado en caja';
        END IF;

        SELECT COALESCE(SUM(fp.monto), 0) INTO v_efectivo_vendido
            FROM factura_pagos fp
            JOIN facturas f ON f.id_factura = fp.factura_id
            WHERE f.turno_caja_id = NEW.id_turno_caja
              AND fp.medio_pago = 'efectivo'
              AND f.estado = 'emitida';

        -- PENDIENTE: descontar del efectivo vendido los reembolsos en efectivo
        -- por devoluciones (devoluciones_ventas); requiere decidir si el
        -- reembolso se registra como un medio de pago negativo, una tabla
        -- propia, o un campo en devoluciones_ventas. No implementado aun.

        SET NEW.diferencia = NEW.fondo_final - (NEW.fondo_inicial + v_efectivo_vendido);
    END IF;
END$$

-- 7.14 facturas: una factura anulada no puede volver a 'emitida', y toda
-- anulacion debe indicar quien la autorizo (anulada_por).
CREATE TRIGGER trg_facturas_bloquea_reversion
BEFORE UPDATE ON facturas
FOR EACH ROW
BEGIN
    IF OLD.estado = 'anulada' AND NEW.estado <> 'anulada' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Una factura anulada no puede volver a quedar como emitida';
    END IF;

    IF NEW.estado = 'anulada' AND OLD.estado = 'emitida' AND NEW.anulada_por IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Para anular una factura debe indicarse el usuario que autoriza (anulada_por)';
    END IF;
END$$

-- 7.15 facturas: al anular (emitida -> anulada), reingresa al kardex lo
-- vendido en cada linea activa de la factura, descontando lo que ya se
-- hubiera devuelto con reingreso de stock (para no reingresar dos veces).
-- Es un INSERT normal en movimientos_inventario, asi que reutiliza la
-- cadena de triggers 7.1/7.2 (una sola fuente de verdad para el stock).
CREATE TRIGGER trg_facturas_anula_reingresa_stock
AFTER UPDATE ON facturas
FOR EACH ROW
BEGIN
    IF NEW.estado = 'anulada' AND OLD.estado = 'emitida' THEN
        INSERT INTO movimientos_inventario
            (producto_id, sucursal_id, tipo, cantidad, motivo, factura_id, usuario_id)
        SELECT
            fi.producto_id,
            NEW.sucursal_id,
            'entrada',
            (fi.cantidad - COALESCE(dv.cantidad_devuelta, 0)) AS cantidad_a_reingresar,
            'Reingreso por anulacion de factura',
            NEW.id_factura,
            NEW.anulada_por
        FROM factura_items fi
        LEFT JOIN (
            SELECT factura_item_id, SUM(cantidad) AS cantidad_devuelta
            FROM devoluciones_ventas
            WHERE reingresa_stock = 1 AND deleted_at IS NULL
            GROUP BY factura_item_id
        ) dv ON dv.factura_item_id = fi.id_factura_item
        WHERE fi.factura_id = NEW.id_factura
          AND fi.deleted_at IS NULL
          AND (fi.cantidad - COALESCE(dv.cantidad_devuelta, 0)) > 0;
    END IF;
END$$

-- 7.16 movimientos_inventario: es un kardex de solo insercion. Cualquier
-- correccion se hace con un movimiento nuevo (ajuste_entrada/ajuste_salida),
-- nunca modificando uno existente.
CREATE TRIGGER trg_movimientos_bloquea_update
BEFORE UPDATE ON movimientos_inventario
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'movimientos_inventario es de solo insercion: no se puede modificar un movimiento existente. Usa un ajuste_entrada o ajuste_salida.';
END$$

-- 7.17 movimientos_inventario: por la misma razon que 7.16, tampoco se
-- pueden eliminar movimientos (romperia el kardex y desincronizaria
-- stock_actual respecto al historial).
CREATE TRIGGER trg_movimientos_bloquea_delete
BEFORE DELETE ON movimientos_inventario
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'movimientos_inventario es de solo insercion: no se puede eliminar un movimiento existente. Usa un ajuste_entrada o ajuste_salida.';
END$$

-- CAMBIO (D1): registra automaticamente cuando cambio el precio corporativo,
-- para cumplir RF-FMC-C6 sin depender de que el backend lo recuerde.
CREATE TRIGGER trg_productos_precio_corporativo_fecha
BEFORE UPDATE ON productos
FOR EACH ROW
BEGIN
    IF NOT (NEW.precio_corporativo <=> OLD.precio_corporativo) THEN
        SET NEW.precio_corporativo_actualizado_en = NOW();
    END IF;
END$$

-- CAMBIO (B1): RF-SA-D11 — si cambia el rol o el estado de la cuenta, se
-- marca la fecha desde la cual cualquier JWT anterior debe considerarse
-- invalido (el backend debe comparar esto contra el "iat" del token).
CREATE TRIGGER trg_usuarios_marca_invalidacion_token
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF NEW.rol_id <> OLD.rol_id OR NEW.is_active <> OLD.is_active THEN
        SET NEW.tokens_invalidados_en = NOW();
    END IF;
END$$

-- CAMBIO (B1): la sucursal asignada a un usuario vive en usuario_sucursales
-- (relacion N:N), no en la propia fila de usuarios, asi que un cambio ahi
-- tambien debe invalidar los tokens vigentes de ese usuario.
CREATE TRIGGER trg_usucursales_marca_invalidacion_insert
AFTER INSERT ON usuario_sucursales
FOR EACH ROW
BEGIN
    UPDATE usuarios SET tokens_invalidados_en = NOW() WHERE id_usuario = NEW.usuario_id;
END$$

CREATE TRIGGER trg_usucursales_marca_invalidacion_delete
AFTER DELETE ON usuario_sucursales
FOR EACH ROW
BEGIN
    UPDATE usuarios SET tokens_invalidados_en = NOW() WHERE id_usuario = OLD.usuario_id;
END$$

-- 7.23 logs_auditoria: es un registro de auditoria inmutable (RNF-ADM-02).
-- No se permite modificar registros historicos.
CREATE TRIGGER trg_logs_auditoria_bloquea_update
BEFORE UPDATE ON logs_auditoria
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'logs_auditoria es de solo insercion: no se puede modificar un registro de auditoria.';
END$$

-- 7.24 logs_auditoria: por la misma razon de inmutabilidad, tampoco se pueden
-- eliminar registros de auditoria.
CREATE TRIGGER trg_logs_auditoria_bloquea_delete
BEFORE DELETE ON logs_auditoria
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'logs_auditoria es de solo insercion: no se puede eliminar un registro de auditoria.';
END$$

DELIMITER ;

