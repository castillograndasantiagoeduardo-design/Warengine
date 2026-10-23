/**
 * demo-metricas.seed.ts — Siembra datos de demostración de alta fidelidad para Warengine.
 * Incluye sucursales, áreas, empleados, catálogo de productos, inventario multi-sede,
 * clientes, turnos de caja y facturación con histórico de ventas para que el Dashboard
 * y las métricas de Super Admin sean 100% dinámicas y dependientes de MySQL.
 */

import * as argon2 from 'argon2';
import { Database } from '../client.ts';
import { sucursales, areas, empleados } from '../schema/administracion.schema.ts';
import { usuarios, roles, alertas_admin } from '../schema/autenticacion.schema.ts';
import { categorias, proveedores, productos, inventario_sucursal } from '../schema/inventario.schema.ts';
import { clientes, facturas, factura_items, factura_pagos } from '../schema/facturacion.schema.ts';
import { turnos_caja } from '../schema/turnos-caja.schema.ts';

export async function sembrarDatosDemo(db: Database): Promise<void> {
  console.log('\n📊 Sembrando datos de negocio y métricas para el Super Admin...');

  // 1. SUCURSALES (Sede 1 ya existe o se actualiza, creamos Sede 2 y Sede 3)
  console.log('  🏢 Asegurando 3 sucursales...');
  await db.insert(sucursales).values([
    {
      id_sucursal: 1,
      nombre: 'Sede Principal (Central #1)',
      direccion: 'Carrera 7 # 72-13, Torre Empresarial',
      contacto: '+57 (1) 745-8900',
      is_active: 1,
    },
    {
      id_sucursal: 2,
      nombre: 'Sucursal Norte - Distribución',
      direccion: 'Calle 170 # 15-42, Parque Industrial',
      contacto: '+57 (1) 682-1144',
      is_active: 1,
    },
    {
      id_sucursal: 3,
      nombre: 'Sucursal Occidente - POS Retail',
      direccion: 'Avenida El Dorado # 68C-20, Local 104',
      contacto: '+57 (1) 410-9080',
      is_active: 1,
    },
  ]).onDuplicateKeyUpdate({
    set: { is_active: 1 },
  });

  // 2. ÁREAS POR SUCURSAL
  console.log('  🏬 Sembrando áreas operativas...');
  await db.insert(areas).values([
    { id_area: 1, sucursal_id: 1, nombre: 'Dirección General' },
    { id_area: 2, sucursal_id: 1, nombre: 'Bodega Principal' },
    { id_area: 3, sucursal_id: 1, nombre: 'Caja Mostrador' },
    { id_area: 4, sucursal_id: 2, nombre: 'Almacén Despachos' },
    { id_area: 5, sucursal_id: 2, nombre: 'Venta Mayorista' },
    { id_area: 6, sucursal_id: 3, nombre: 'Punto de Venta POS' },
    { id_area: 7, sucursal_id: 3, nombre: 'Servicio Técnico' },
  ]).onDuplicateKeyUpdate({
    set: { nombre: 'Área' },
  });

  // 3. EMPLEADOS Y USUARIOS ADICIONALES
  console.log('  👥 Sembrando empleados y usuarios...');
  const passHash = await argon2.hash('Warengine.Admin.2026!');

  // Empleados
  const empDocs = [
    { id: 'emp-admin-norte', doc: 'CC-79845120', nombre: 'Carlos Mendoza', cargo: 'Admin Sucursal', suc: 2, email: 'gerencia.norte@warengine.local', rol: 2 },
    { id: 'emp-cajero-central', doc: 'CC-1014285900', nombre: 'Valentina Gómez', cargo: 'Cajera Principal', suc: 1, email: 'cajero.central@warengine.local', rol: 3 },
    { id: 'emp-vendedor-b2b', doc: 'CC-80123456', nombre: 'Mauricio Duque', cargo: 'Ejecutivo B2B', suc: 1, email: 'ventas.b2b@warengine.local', rol: 4 },
  ];

  for (const e of empDocs) {
    await db.insert(empleados).values({
      id_empleado: e.id,
      tipo_documento: 'CC',
      numero_documento: e.doc,
      nombre: e.nombre,
      cargo: e.cargo,
      sucursal_id: e.suc,
      fecha_ingreso: '2025-01-15',
      sueldo_actual: '2800000.00',
      is_active: 1,
    }).onDuplicateKeyUpdate({
      set: { nombre: e.nombre },
    });

    await db.insert(usuarios).values({
      id_usuario: `usr-${e.id}`,
      empleado_id: e.id,
      email: e.email,
      password_hash: passHash,
      rol_id: e.rol,
      is_active: 1,
      requiere_2fa: 0,
    }).onDuplicateKeyUpdate({
      set: { password_hash: passHash, rol_id: e.rol, is_active: 1 },
    });
  }

  // 4. CATEGORÍAS Y PROVEEDORES
  console.log('  📦 Sembrando categorías y proveedores...');
  await db.insert(categorias).values([
    { id_categoria: 1, nombre: 'Herramientas Eléctricas', is_active: 1 },
    { id_categoria: 2, nombre: 'Seguridad Industrial', is_active: 1 },
    { id_categoria: 3, nombre: 'Material Eléctrico', is_active: 1 },
    { id_categoria: 4, nombre: 'Abrasivos y Corte', is_active: 1 },
    { id_categoria: 5, nombre: 'Maquinaria y Bombas', is_active: 1 },
  ]).onDuplicateKeyUpdate({
    set: { is_active: 1 },
  });

  await db.insert(proveedores).values([
    { id_proveedor: 1, nombre: 'Ferretería Industrial Andina SAS', contacto: '+57 1 450-8800', is_active: 1 },
    { id_proveedor: 2, nombre: 'Distribuidora Eléctrica Nacional', contacto: '+57 1 612-9900', is_active: 1 },
  ]).onDuplicateKeyUpdate({
    set: { is_active: 1 },
  });

  // 5. PRODUCTOS
  console.log('  🔨 Sembrando catálogo maestro de productos...');
  const catalogo = [
    { id: 'prod-001', sku: 'TAL-0941', nombre: 'Taladro Percutor Industrial 850W', cat: 1, prov: 1, compra: '145000.00', venta: '245000.00' },
    { id: 'prod-002', sku: 'DIS-2019', nombre: 'Disco Diamantado 7 Pulgadas Concreto', cat: 4, prov: 1, compra: '32000.00', venta: '55000.00' },
    { id: 'prod-003', sku: 'GEL-1044', nombre: 'Guante de Seguridad Reforzado Nitrilo', cat: 2, prov: 1, compra: '12000.00', venta: '25000.00' },
    { id: 'prod-004', sku: 'CAB-3301', nombre: 'Cable Enchaquetado 3x12 AWG x 100m', cat: 3, prov: 2, compra: '95000.00', venta: '145000.00' },
    { id: 'prod-005', sku: 'MAR-1500', nombre: 'Martillo Neumático 1500W', cat: 5, prov: 1, compra: '890000.00', venta: '1450000.00' },
    { id: 'prod-006', sku: 'SOL-8821', nombre: 'Careta Fotosensible para Soldadura Pro', cat: 2, prov: 1, compra: '180000.00', venta: '320000.00' },
    { id: 'prod-007', sku: 'BOM-0023', nombre: 'Bomba Sumergible Aguas Negras 1.5HP', cat: 5, prov: 1, compra: '920000.00', venta: '1450000.00' },
    { id: 'prod-008', sku: 'CAL-9011', nombre: 'Calibrador Pie de Rey Digital 150mm', cat: 1, prov: 1, compra: '85000.00', venta: '180000.00' },
  ];

  for (const p of catalogo) {
    await db.insert(productos).values({
      id_producto: p.id,
      sku: p.sku,
      nombre: p.nombre,
      categoria_id: p.cat,
      proveedor_id: p.prov,
      precio_compra: p.compra,
      precio_venta: p.venta,
      precio_corporativo: p.venta,
      is_active: 1,
    }).onDuplicateKeyUpdate({
      set: { precio_compra: p.compra, precio_venta: p.venta },
    });
  }

  // 6. INVENTARIO MULTI-SUCURSAL (Stock inicial suficiente para que las ventas se descuenten automáticamente via triggers)
  console.log('  📊 Sembrando niveles de inventario en las 3 sedes...');
  const inventarios = [
    // Sede 1 (Stock inicial = ventas + stock remanente)
    { prod: 'prod-001', suc: 1, actual: 93, min: 15 }, // Venta 75 -> Remanente 18
    { prod: 'prod-002', suc: 1, actual: 180, min: 40 }, // Venta 120 -> Remanente 60
    { prod: 'prod-003', suc: 1, actual: 320, min: 50 }, // Venta 200 -> Remanente 120
    { prod: 'prod-004', suc: 1, actual: 62, min: 20 }, // Venta 50 -> Remanente 12
    { prod: 'prod-005', suc: 1, actual: 0, min: 5 },   // Agotado
    { prod: 'prod-006', suc: 1, actual: 45, min: 10 }, // Venta 20 -> Remanente 25
    { prod: 'prod-007', suc: 1, actual: 18, min: 5 },  // Venta 10 -> Remanente 8
    { prod: 'prod-008', suc: 1, actual: 15, min: 10 }, // Remanente 15
    // Sede 2
    { prod: 'prod-001', suc: 2, actual: 40, min: 10 }, // Venta 30 -> Remanente 10
    { prod: 'prod-002', suc: 2, actual: 155, min: 30 }, // Venta 110 -> Remanente 45
    { prod: 'prod-003', suc: 2, actual: 270, min: 40 }, // Venta 180 -> Remanente 90
    { prod: 'prod-004', suc: 2, actual: 44, min: 15 }, // Venta 40 -> Remanente 4
    { prod: 'prod-005', suc: 2, actual: 0, min: 5 },   // Agotado
    { prod: 'prod-006', suc: 2, actual: 12, min: 8 },  // Remanente 12
    { prod: 'prod-007', suc: 2, actual: 13, min: 5 },  // Venta 10 -> Remanente 3
    { prod: 'prod-008', suc: 2, actual: 8, min: 5 },   // Remanente 8
    // Sede 3
    { prod: 'prod-001', suc: 3, actual: 24, min: 5 },  // Venta 20 -> Remanente 4
    { prod: 'prod-002', suc: 3, actual: 99, min: 20 }, // Venta 90 -> Remanente 9
    { prod: 'prod-003', suc: 3, actual: 190, min: 20 }, // Venta 160 -> Remanente 30
    { prod: 'prod-004', suc: 3, actual: 2, min: 10 },  // Remanente 2
    { prod: 'prod-005', suc: 3, actual: 0, min: 5 },   // Agotado
    { prod: 'prod-006', suc: 3, actual: 5, min: 5 },   // Remanente 5
    { prod: 'prod-007', suc: 3, actual: 1, min: 3 },   // Remanente 1
    { prod: 'prod-008', suc: 3, actual: 48, min: 5 },  // Venta 44 -> Remanente 4
  ];

  for (const inv of inventarios) {
    await db.insert(inventario_sucursal).values({
      producto_id: inv.prod,
      sucursal_id: inv.suc,
      stock_actual: inv.actual,
      stock_minimo: inv.min,
    }).onDuplicateKeyUpdate({
      set: { stock_actual: inv.actual, stock_minimo: inv.min },
    });
  }

  // 7. CLIENTES
  console.log('  🤝 Sembrando clientes B2C y B2B...');
  await db.insert(clientes).values([
    {
      id_cliente: 'cli-001',
      tipo_documento: 'CC',
      numero_documento: '22222222',
      nombre_razon_social: 'Cliente Mostrador General',
      tipo_cliente: 'B2C',
      email: 'mostrador@warengine.local',
      telefono: '3001234567',
      direccion: 'Ciudad',
      credito_habilitado: 0,
    },
    {
      id_cliente: 'cli-002',
      tipo_documento: 'NIT',
      numero_documento: '900123456-1',
      nombre_razon_social: 'Constructora del Valle SAS',
      tipo_cliente: 'B2B',
      email: 'compras@constructoradelvalle.com',
      telefono: '+57 1 333-4455',
      direccion: 'Av. El Dorado # 68C-20 Of. 501',
      credito_habilitado: 1,
    },
  ]).onDuplicateKeyUpdate({
    set: { nombre_razon_social: 'Cliente' },
  });

  // 8. TURNOS DE CAJA
  console.log('  💵 Sembrando turnos de caja...');
  await db.insert(turnos_caja).values([
    {
      id_turno_caja: 'turno-001',
      usuario_id: 'usr-emp-cajero-central',
      sucursal_id: 1,
      fondo_inicial: '300000.00',
      fondo_final: '300000.00',
      diferencia: '0.00',
      fecha_apertura: new Date(Date.now() - 3600 * 1000 * 24 * 7),
      fecha_cierre: new Date(Date.now() - 3600 * 1000 * 24 * 6),
    },
  ]).onDuplicateKeyUpdate({
    set: { fondo_inicial: '300000.00' },
  });

  // 9. FACTURACIÓN HISTÓRICA Y RECIENTE (Para que las consultas calculen métricas reales)
  console.log('  🧾 Sembrando ventas históricas y comprobantes en BD...');
  
  // Obtenemos el usuario super admin o el cajero
  const usuarioVenta = 'usr-emp-cajero-central';

  // Generamos un set de ventas distribuidas en las 3 sedes
  const ventasDemo = [
    // Sede 1 (Total aprox 68.5M)
    { id: 'fac-101', num: 1001, suc: 1, cli: 'cli-002', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 6), prod: 'prod-001', cant: 40, pU: '245000.00', sub: '9800000.00' },
    { id: 'fac-102', num: 1002, suc: 1, cli: 'cli-001', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 5), prod: 'prod-002', cant: 120, pU: '55000.00', sub: '6600000.00' },
    { id: 'fac-103', num: 1003, suc: 1, cli: 'cli-002', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 4), prod: 'prod-004', cant: 50, pU: '145000.00', sub: '7250000.00' },
    { id: 'fac-104', num: 1004, suc: 1, cli: 'cli-001', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 3), prod: 'prod-003', cant: 200, pU: '25000.00', sub: '5000000.00' },
    { id: 'fac-105', num: 1005, suc: 1, cli: 'cli-002', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 2), prod: 'prod-001', cant: 35, pU: '245000.00', sub: '8575000.00' },
    { id: 'fac-106', num: 1006, suc: 1, cli: 'cli-001', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 1), prod: 'prod-006', cant: 20, pU: '320000.00', sub: '6400000.00' },
    { id: 'fac-107', num: 1007, suc: 1, cli: 'cli-002', fecha: new Date(), prod: 'prod-007', cant: 10, pU: '1450000.00', sub: '14500000.00' },

    // Sede 2 (Total aprox 38.2M)
    { id: 'fac-201', num: 2001, suc: 2, cli: 'cli-002', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 5), prod: 'prod-001', cant: 30, pU: '245000.00', sub: '7350000.00' },
    { id: 'fac-202', num: 2002, suc: 2, cli: 'cli-001', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 4), prod: 'prod-003', cant: 180, pU: '25000.00', sub: '4500000.00' },
    { id: 'fac-203', num: 2003, suc: 2, cli: 'cli-002', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 2), prod: 'prod-002', cant: 110, pU: '55000.00', sub: '6050000.00' },
    { id: 'fac-204', num: 2004, suc: 2, cli: 'cli-001', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 1), prod: 'prod-004', cant: 40, pU: '145000.00', sub: '5800000.00' },
    { id: 'fac-205', num: 2005, suc: 2, cli: 'cli-002', fecha: new Date(), prod: 'prod-007', cant: 10, pU: '1450000.00', sub: '14500000.00' },

    // Sede 3 (Total aprox 21.75M)
    { id: 'fac-301', num: 3001, suc: 3, cli: 'cli-001', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 4), prod: 'prod-001', cant: 20, pU: '245000.00', sub: '4900000.00' },
    { id: 'fac-302', num: 3002, suc: 3, cli: 'cli-001', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 3), prod: 'prod-002', cant: 90, pU: '55000.00', sub: '4950000.00' },
    { id: 'fac-303', num: 3003, suc: 3, cli: 'cli-001', fecha: new Date(Date.now() - 3600 * 1000 * 24 * 2), prod: 'prod-003', cant: 160, pU: '25000.00', sub: '4000000.00' },
    { id: 'fac-304', num: 3004, suc: 3, cli: 'cli-001', fecha: new Date(), prod: 'prod-008', cant: 44, pU: '180000.00', sub: '7920000.00' },
  ];

  for (const v of ventasDemo) {
    // 1. Factura
    await db.insert(facturas).values({
      id_factura: v.id,
      consecutivo: v.num,
      cliente_id: v.cli,
      usuario_id: usuarioVenta,
      sucursal_id: v.suc,
      subtotal: v.sub,
      iva: '0.00',
      total: v.sub,
      estado: 'emitida',
      fecha: v.fecha,
    }).onDuplicateKeyUpdate({
      set: { total: v.sub, estado: 'emitida' },
    });

    // 2. Factura Item
    await db.insert(factura_items).values({
      id_factura_item: `item-${v.id}`,
      factura_id: v.id,
      producto_id: v.prod,
      cantidad: v.cant,
      precio_unitario: v.pU,
      descuento: '0.00',
      subtotal: v.sub,
    }).onDuplicateKeyUpdate({
      set: { subtotal: v.sub, cantidad: v.cant },
    });

    // 3. Pago
    await db.insert(factura_pagos).values({
      id_factura_pago: `pago-${v.id}`,
      factura_id: v.id,
      medio_pago: 'transferencia',
      monto: v.sub,
      fecha: v.fecha,
    }).onDuplicateKeyUpdate({
      set: { monto: v.sub },
    });
  }

  // 10. ALERTAS ADMINISTRATIVAS
  console.log('  🚨 Sembrando alertas administrativas de stock...');
  await db.insert(alertas_admin).values([
    {
      id_alerta_admin: 'alr-001',
      usuario_id: usuarioVenta,
      sucursal_id: 2,
      motivo: 'Agotamiento de Stock Crítico',
      prioridad: 'urgente',
      descripcion: 'SKU MAR-1500 (Martillo Neumático 1500W) agotado en Sucursal Norte.',
      estado: 'pendiente',
    },
    {
      id_alerta_admin: 'alr-002',
      usuario_id: usuarioVenta,
      sucursal_id: 3,
      motivo: 'Stock Bajo de Disco Diamantado',
      prioridad: 'urgente',
      descripcion: 'SKU DIS-2019 por debajo del mínimo de seguridad en Sucursal Occidente.',
      estado: 'pendiente',
    },
    {
      id_alerta_admin: 'alr-003',
      usuario_id: usuarioVenta,
      sucursal_id: 1,
      motivo: 'Ajuste de Salario Aprobado',
      prioridad: 'normal',
      descripcion: 'Se registró incremento salarial para personal de almacén.',
      estado: 'pendiente',
    },
  ]).onDuplicateKeyUpdate({
    set: { estado: 'pendiente' },
  });

  console.log('  ✅ Sembrado de datos de demostración completado con éxito.');
}
