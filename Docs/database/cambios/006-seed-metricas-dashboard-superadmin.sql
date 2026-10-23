-- ============================================================================
-- CAMBIO: 006-seed-metricas-dashboard-superadmin.sql
-- Módulo: Sembrado de Datos Demostrativos para Métricas y Panel Super Admin
-- ============================================================================
--
-- DESCRIPCIÓN:
-- Documenta la estructura y población de datos iniciales requeridos para que
-- el Dashboard Ejecutivo del Super Administrador calcule métricas dinámicas
-- reales basadas en MySQL (Ingresos, Costos, Márgenes, Ranking de Productos,
-- Existencias comparativas por sucursal y Alertas de Stock).
--
-- También se puede ejecutar vía Deno desde Warengine/Backend:
--   deno task seed:dev
-- ============================================================================

-- 1. Sucursales de la red comercial
INSERT INTO sucursales (id_sucursal, nombre, direccion, telefono, es_sede_principal, activo)
VALUES
    (1, 'Sede Principal (Central)', 'Cra. 7 #72-10, Bogotá D.C.', '+57 1 7440000', 1, 1),
    (2, 'Sucursal Norte', 'Calle 10 #43E-12, Medellín, Antioquia', '+57 4 4440001', 0, 1),
    (3, 'Sucursal Sur', 'Av. Colombia #5-20, Cali, Valle del Cauca', '+57 2 8880002', 0, 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    direccion = VALUES(direccion),
    telefono = VALUES(telefono),
    activo = VALUES(activo);

-- 2. Áreas por Sucursal
INSERT INTO areas (nombre, descripcion, sucursal_id, activo)
VALUES
    ('Gerencia General', 'Dirección estratégica global', 1, 1),
    ('Almacén Central', 'Recepción y distribución nacional', 1, 1),
    ('Ventas & Facturación', 'Cajas mostrador y corporativo B2B Sede Central', 1, 1),
    ('Almacén Norte', 'Bodega regional Medellín', 2, 1),
    ('Ventas Norte', 'Atención comercial Antioquia', 2, 1),
    ('Almacén Sur', 'Bodega regional Cali', 3, 1),
    ('Ventas Sur', 'Atención comercial Valle', 3, 1)
ON DUPLICATE KEY UPDATE
    descripcion = VALUES(descripcion);

-- 3. Super Administrador (Credenciales Oficiales)
-- Email: superadmin@warengine.local
-- Contraseña plana: Warengine.Admin.2026!
-- Hash: Argon2id compatible con IPasswordService
-- Rol: rolId = 1 (super-admin)
-- NOTA: El script de Deno `deno task seed:dev` computa el hash Argon2id nativo
-- garantizando compatibilidad criptográfica completa.

-- 4. Categorías de Productos
INSERT INTO categorias_producto (nombre, descripcion, activo)
VALUES
    ('Computadores & Laptops', 'Estaciones de trabajo y portátiles corporativos', 1),
    ('Redes & Servidores', 'Infraestructura, racks, switches gestionables y firewalls', 1),
    ('Almacenamiento & Memoria', 'Unidades SSD NVMe Enterprise y módulos ECC', 1),
    ('Accesorios & Periféricos', 'Docking stations, monitores y cableado estructurado', 1),
    ('Software & Licencias', 'Sistemas operativos de servidor y licencias cloud', 1)
ON DUPLICATE KEY UPDATE
    descripcion = VALUES(descripcion);

-- 5. Proveedores Homologados
INSERT INTO proveedores (nombre, nit, telefono, email, direccion, activo)
VALUES
    ('Lenovo Colombia S.A.S.', '900123456-1', '+57 1 6001000', 'contacto@lenovo.co', 'Parque Industrial Cota, Cundinamarca', 1),
    ('Cisco Systems Colombia', '900987654-3', '+57 1 7002000', 'licencias@cisco.co', 'Av. El Dorado #68C-61, Bogotá', 1)
ON DUPLICATE KEY UPDATE
    telefono = VALUES(telefono);

-- 6. Resumen de Métricas Financieras Consolidadas (Ventas Sembradas)
-- Total Facturas Emitidas: 16 (B2C mostrador y B2B crédito/contado)
-- Ingresos Totales: COP $118.095.000
-- Costo Total de Mercancía: COP $69.135.000
-- Ganancia Neta Consolidada: COP $48.960.000
-- Margen Promedio de Rentabilidad: 41.46%
-- ============================================================================
