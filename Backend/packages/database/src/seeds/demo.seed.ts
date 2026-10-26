/**
 * demo.seed.ts — Datos de demostración realistas e idempotentes (deno task seed:demo).
 *
 * Crea Sede Norte y Sede Centro (además de la principal), áreas, usuarios de prueba,
 * ~10 empleados con historial salarial, 20 productos con categorías, proveedores y stock,
 * clientes, turnos de caja cerrados y facturas de los últimos 21 días, y alertas administrativas.
 *
 * SEGURIDAD:
 *  - La contraseña de los usuarios de prueba sale SOLO de SEED_DEMO_PASSWORD; si falta, aborta.
 *  - Se guarda únicamente el hash Argon2id; jamás se imprime la contraseña.
 *
 * INTEGRIDAD (triggers reales de la BD):
 *  - El stock inicial entra como movimientos 'entrada' (trg_movimientos_actualiza_stock).
 *  - Cada línea de factura descuenta stock y genera su salida en kardex (trg_factura_items_*).
 *  - Cada aumento salarial sincroniza empleados.sueldo_actual (trg_historial_salarios_sync).
 *
 * IDEMPOTENCIA: todo se busca por clave natural (nombre, correo, documento, SKU) antes de crearlo;
 * stock, ventas, historial y alertas solo se siembran si la entidad aún no los tiene.
 */

import * as argon2 from 'argon2';
import { and, eq, sql } from 'drizzle-orm';
import { closeDatabase, Database, getDatabase } from '../client.ts';
import { areas, empleados, sucursales } from '../schema/administracion.schema.ts';
import { alertas_admin, historial_salarios, roles, usuarios } from '../schema/autenticacion.schema.ts';
import { clientes, factura_items, factura_pagos, facturas } from '../schema/facturacion.schema.ts';
import { categorias, inventario_sucursal, movimientos_inventario, productos, proveedores } from '../schema/inventario.schema.ts';
import { turnos_caja } from '../schema/turnos-caja.schema.ts';
import {
  ALERTAS_DEMO,
  AREAS_PRINCIPAL,
  CATEGORIAS_DEMO,
  CLIENTES_DEMO,
  EMPLEADOS_DEMO,
  PRODUCTOS_DEMO,
  PROVEEDORES_DEMO,
  SEDE_PRINCIPAL_ID,
  SKUS_BAJO_MINIMO,
  SUCURSALES_DEMO,
  type SucursalDemo,
} from './demo.data.ts';

const DIAS_DE_VENTAS = 21;
const SUPER_ADMIN_EMAIL = 'superadmin@warengine.local';
/** Misma longitud mínima que exige crearUsuarioSchema para cualquier usuario del sistema. */
const MIN_PASSWORD = 8;

type Sede = SucursalDemo['clave'] | 'principal';

/** PRNG determinista (mulberry32): mismas ventas en cada ejecución sobre una BD limpia. */
function crearAleatorio(semilla: number) {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dinero = (n: number) => n.toFixed(2);

function leerPassword(): string {
  const password = Deno.env.get('SEED_DEMO_PASSWORD');
  if (!password) {
    throw new Error(
      `❌ SEED_DEMO_PASSWORD no está definida. Defínela (mín. ${MIN_PASSWORD} caracteres) antes de ejecutar seed:demo.`,
    );
  }
  if (password.length < MIN_PASSWORD) {
    throw new Error(`❌ SEED_DEMO_PASSWORD debe tener al menos ${MIN_PASSWORD} caracteres.`);
  }
  return password;
}

// ─── Organización ────────────────────────────────────────────────────────────

async function asegurarSucursales(db: Database): Promise<Record<Sede, number>> {
  const ids = { principal: SEDE_PRINCIPAL_ID } as Record<Sede, number>;
  for (const s of SUCURSALES_DEMO) {
    const [existente] = await db
      .select({ id: sucursales.id_sucursal })
      .from(sucursales)
      .where(sql`LOWER(TRIM(${sucursales.nombre})) = ${s.nombre.toLowerCase()}`)
      .limit(1);
    if (existente) {
      ids[s.clave] = existente.id;
      continue;
    }
    const [res] = await db.insert(sucursales).values({ nombre: s.nombre, direccion: s.direccion, contacto: s.contacto });
    ids[s.clave] = res.insertId;
    console.log(`   ✔ Sucursal "${s.nombre}" creada`);
  }
  return ids;
}

async function asegurarAreas(db: Database, sedes: Record<Sede, number>): Promise<Map<string, number>> {
  const mapa = new Map<string, number>(); // clave: `${sucursalId}|${nombre}`
  const plan: [number, string[]][] = [
    [sedes.principal, AREAS_PRINCIPAL],
    ...SUCURSALES_DEMO.map((s) => [sedes[s.clave], s.areas] as [number, string[]]),
  ];
  for (const [sucursalId, nombres] of plan) {
    for (const nombre of nombres) {
      const [existente] = await db
        .select({ id: areas.id_area })
        .from(areas)
        .where(and(eq(areas.sucursal_id, sucursalId), eq(areas.nombre, nombre)))
        .limit(1);
      const id = existente?.id ?? (await db.insert(areas).values({ nombre, sucursal_id: sucursalId }))[0].insertId;
      mapa.set(`${sucursalId}|${nombre}`, id);
    }
  }
  return mapa;
}

async function asegurarPersonal(
  db: Database,
  sedes: Record<Sede, number>,
  areasPorSede: Map<string, number>,
  passwordHash: string,
  superAdminId: string,
): Promise<Map<string, string>> {
  const rolesDb = await db.select({ id: roles.id_rol, nombre: roles.nombre }).from(roles);
  const rolId = (nombre: string) => {
    const rol = rolesDb.find((r) => r.nombre === nombre);
    if (!rol) throw new Error(`❌ Rol "${nombre}" no encontrado. Ejecuta primero deno task seed.`);
    return rol.id;
  };

  const usuariosPorEmail = new Map<string, string>();
  for (const e of EMPLEADOS_DEMO) {
    const sucursalId = sedes[e.sede];
    const [existente] = await db
      .select({ id: empleados.id_empleado })
      .from(empleados)
      .where(and(eq(empleados.tipo_documento, 'CC'), eq(empleados.numero_documento, e.documento)))
      .limit(1);

    const empleadoId = existente?.id ?? crypto.randomUUID();
    if (!existente) {
      await db.insert(empleados).values({
        id_empleado: empleadoId,
        tipo_documento: 'CC',
        numero_documento: e.documento,
        nombre: e.nombre,
        telefono: e.telefono,
        cargo: e.cargo,
        area_id: areasPorSede.get(`${sucursalId}|${e.area}`) ?? null,
        sucursal_id: sucursalId,
        fecha_ingreso: e.fechaIngreso,
      });
      console.log(`   ✔ Empleado ${e.nombre}`);
    }

    // Historial salarial solo si el empleado aún no tiene registros (el trigger sincroniza sueldo_actual)
    const [{ n }] = await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(historial_salarios)
      .where(eq(historial_salarios.empleado_id, empleadoId));
    if (Number(n) === 0) {
      for (const [fechaEfectiva, sueldo, motivo] of e.salarios) {
        await db.insert(historial_salarios).values({
          empleado_id: empleadoId,
          sueldo: dinero(sueldo),
          fecha_efectiva: fechaEfectiva,
          motivo,
          registrado_por: superAdminId,
        });
      }
    }

    if (!e.cuenta) continue;
    const [cuenta] = await db
      .select({ id: usuarios.id_usuario })
      .from(usuarios)
      .where(eq(usuarios.email, e.cuenta.email))
      .limit(1);
    if (cuenta) {
      usuariosPorEmail.set(e.cuenta.email, cuenta.id);
      continue;
    }
    const usuarioId = crypto.randomUUID();
    await db.insert(usuarios).values({
      id_usuario: usuarioId,
      empleado_id: empleadoId,
      email: e.cuenta.email,
      password_hash: passwordHash,
      rol_id: rolId(e.cuenta.rol),
    });
    usuariosPorEmail.set(e.cuenta.email, usuarioId);
    console.log(`   ✔ Usuario ${e.cuenta.email} (${e.cuenta.rol})`);
  }
  return usuariosPorEmail;
}

// ─── Catálogo e inventario ───────────────────────────────────────────────────

async function asegurarCatalogo(db: Database): Promise<{ productoIds: Map<string, string>; proveedorIds: number[] }> {
  const categoriaIds = new Map<string, number>();
  for (const nombre of CATEGORIAS_DEMO) {
    const [c] = await db.select({ id: categorias.id_categoria }).from(categorias).where(eq(categorias.nombre, nombre)).limit(1);
    categoriaIds.set(nombre, c?.id ?? (await db.insert(categorias).values({ nombre }))[0].insertId);
  }

  const proveedorIds: number[] = [];
  for (const p of PROVEEDORES_DEMO) {
    const [prov] = await db.select({ id: proveedores.id_proveedor }).from(proveedores).where(eq(proveedores.nombre, p.nombre)).limit(1);
    proveedorIds.push(prov?.id ?? (await db.insert(proveedores).values({ nombre: p.nombre, contacto: p.contacto }))[0].insertId);
  }

  const productoIds = new Map<string, string>();
  for (const p of PRODUCTOS_DEMO) {
    const [prod] = await db.select({ id: productos.id_producto }).from(productos).where(eq(productos.sku, p.sku)).limit(1);
    const id = prod?.id ?? crypto.randomUUID();
    if (!prod) {
      await db.insert(productos).values({
        id_producto: id,
        sku: p.sku,
        nombre: p.nombre,
        categoria_id: categoriaIds.get(p.categoria) ?? null,
        proveedor_id: proveedorIds[p.proveedor],
        precio_compra: dinero(p.compra),
        precio_venta: dinero(p.venta),
      });
    }
    productoIds.set(p.sku, id);
  }
  console.log(`   ✔ Catálogo: ${CATEGORIAS_DEMO.length} categorías, ${PROVEEDORES_DEMO.length} proveedores, ${PRODUCTOS_DEMO.length} productos`);
  return { productoIds, proveedorIds };
}

/** Stock inicial por movimiento 'entrada' solo donde aún no hay inventario del producto en la sede. */
async function asegurarStockInicial(
  db: Database,
  sucursalId: number,
  productoIds: Map<string, string>,
  proveedorIds: number[],
  usuarioId: string,
  aleatorio: () => number,
) {
  const hace30 = new Date(Date.now() - 30 * 86_400_000);
  let creados = 0;
  for (const p of PRODUCTOS_DEMO) {
    const productoId = productoIds.get(p.sku)!;
    const [inv] = await db
      .select({ stock: inventario_sucursal.stock_actual })
      .from(inventario_sucursal)
      .where(and(eq(inventario_sucursal.producto_id, productoId), eq(inventario_sucursal.sucursal_id, sucursalId)))
      .limit(1);
    if (inv) continue;
    await db.insert(movimientos_inventario).values({
      producto_id: productoId,
      sucursal_id: sucursalId,
      tipo: 'entrada',
      cantidad: 40 + p.rotacion * 9 + Math.floor(aleatorio() * 30),
      motivo: 'Compra inicial (seed demo)',
      proveedor_id: proveedorIds[p.proveedor],
      usuario_id: usuarioId,
      fecha: hace30,
    });
    creados++;
  }
  if (creados > 0) console.log(`   ✔ Stock inicial: ${creados} referencias en sucursal ${sucursalId}`);
}

/** Mínimos por sede: 10 por defecto y, para algunos SKU, por encima del stock actual (alertas). */
async function ajustarMinimos(db: Database, sucursalId: number, clave: SucursalDemo['clave'], productoIds: Map<string, string>) {
  for (const p of PRODUCTOS_DEMO) {
    const productoId = productoIds.get(p.sku)!;
    const bajo = SKUS_BAJO_MINIMO[clave].includes(p.sku);
    await db
      .update(inventario_sucursal)
      .set({ stock_minimo: bajo ? sql`${inventario_sucursal.stock_actual} + 8` : 10 })
      .where(and(eq(inventario_sucursal.producto_id, productoId), eq(inventario_sucursal.sucursal_id, sucursalId)));
  }
}

// ─── Ventas ──────────────────────────────────────────────────────────────────

async function asegurarClientes(db: Database): Promise<string[]> {
  const ids: string[] = [];
  for (const c of CLIENTES_DEMO) {
    const [existente] = await db
      .select({ id: clientes.id_cliente })
      .from(clientes)
      .where(and(eq(clientes.tipo_documento, c.tipoDocumento), eq(clientes.numero_documento, c.numero)))
      .limit(1);
    const id = existente?.id ?? crypto.randomUUID();
    if (!existente) {
      await db.insert(clientes).values({
        id_cliente: id,
        tipo_documento: c.tipoDocumento,
        numero_documento: c.numero,
        nombre_razon_social: c.nombre,
        tipo_cliente: c.tipo,
        email: 'email' in c ? c.email : null,
        telefono: 'telefono' in c ? c.telefono : null,
        direccion: 'direccion' in c ? c.direccion : null,
        credito_habilitado: c.tipo === 'B2B' ? 1 : 0,
      });
    }
    ids.push(id);
  }
  return ids;
}

/**
 * Un turno cerrado por día y 2-6 facturas por turno. Solo si la sede aún no tiene facturas.
 * Cada factura se inserta en transacción: cabecera, líneas (los triggers validan stock y
 * registran la salida en kardex) y pagos que suman exactamente el total.
 */
async function sembrarVentas(
  db: Database,
  sucursalId: number,
  cajeroId: string,
  clienteIds: string[],
  productoIds: Map<string, string>,
  aleatorio: () => number,
  intensidad: number,
) {
  const [{ n }] = await db.select({ n: sql<number>`COUNT(*)` }).from(facturas).where(eq(facturas.sucursal_id, sucursalId));
  if (Number(n) > 0) {
    console.log(`   ↷ Sucursal ${sucursalId}: ya tiene facturas, no se siembran ventas`);
    return;
  }

  const stock = new Map<string, number>();
  for (const r of await db
    .select({ id: inventario_sucursal.producto_id, s: inventario_sucursal.stock_actual })
    .from(inventario_sucursal)
    .where(eq(inventario_sucursal.sucursal_id, sucursalId))) {
    stock.set(r.id, r.s);
  }

  // Bolsa ponderada por rotación para que el ranking tenga más y menos vendidos claros
  const bolsa = PRODUCTOS_DEMO.flatMap((p) => Array<typeof p>(p.rotacion).fill(p));
  const ahora = Date.now();
  let consecutivo = 0;
  let totalFacturas = 0;

  for (let dia = DIAS_DE_VENTAS - 1; dia >= 0; dia--) {
    // Jornada 08:00–18:00 hora Colombia (13:00–23:00 UTC); hoy solo hasta la hora actual
    const base = new Date(ahora - dia * 86_400_000);
    base.setUTCHours(13, 0, 0, 0);
    const finJornada = Math.min(base.getTime() + 10 * 3_600_000, ahora - 60_000);
    if (finJornada <= base.getTime()) continue;

    const turnoId = crypto.randomUUID();
    const cantidadFacturas = 2 + Math.floor(aleatorio() * 4 * intensidad);
    let efectivo = 0;
    const ventasDelDia: { fecha: Date; lineas: { productoId: string; cantidad: number; precio: number }[] }[] = [];

    for (let f = 0; f < cantidadFacturas; f++) {
      const fecha = new Date(base.getTime() + aleatorio() * (finJornada - base.getTime()));
      const lineas: { productoId: string; cantidad: number; precio: number }[] = [];
      const numLineas = 1 + Math.floor(aleatorio() * 3);
      for (let l = 0; l < numLineas; l++) {
        const prod = bolsa[Math.floor(aleatorio() * bolsa.length)];
        const productoId = productoIds.get(prod.sku)!;
        const cantidad = 1 + Math.floor(aleatorio() * 3);
        // Dejar al menos 1 unidad: nunca se intenta vender sin stock (el trigger lo rechazaría)
        if (lineas.some((x) => x.productoId === productoId) || (stock.get(productoId) ?? 0) - cantidad < 1) continue;
        stock.set(productoId, (stock.get(productoId) ?? 0) - cantidad);
        lineas.push({ productoId, cantidad, precio: prod.venta });
      }
      if (lineas.length > 0) ventasDelDia.push({ fecha, lineas });
    }
    ventasDelDia.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    await db.insert(turnos_caja).values({
      id_turno_caja: turnoId,
      usuario_id: cajeroId,
      sucursal_id: sucursalId,
      fondo_inicial: dinero(100000),
      fecha_apertura: new Date(base.getTime() - 15 * 60_000),
    });

    for (const venta of ventasDelDia) {
      const total = venta.lineas.reduce((acc, l) => acc + l.cantidad * l.precio, 0);
      const r = aleatorio();
      const medio = r < 0.6 ? 'efectivo' : r < 0.85 ? 'tarjeta' : 'transferencia';
      if (medio === 'efectivo') efectivo += total;
      const facturaId = crypto.randomUUID();
      consecutivo++;
      totalFacturas++;
      const clienteId = clienteIds[aleatorio() < 0.7 ? 0 : 1 + Math.floor(aleatorio() * (clienteIds.length - 1))];

      await db.transaction(async (tx) => {
        await tx.insert(facturas).values({
          id_factura: facturaId,
          consecutivo,
          cliente_id: clienteId,
          usuario_id: cajeroId,
          sucursal_id: sucursalId,
          turno_caja_id: turnoId,
          subtotal: dinero(total),
          iva: dinero(0),
          total: dinero(total),
          estado: 'emitida',
          fecha: venta.fecha,
        });
        for (const l of venta.lineas) {
          await tx.insert(factura_items).values({
            factura_id: facturaId,
            producto_id: l.productoId,
            cantidad: l.cantidad,
            precio_unitario: dinero(l.precio),
            subtotal: dinero(l.cantidad * l.precio),
          });
        }
        await tx.insert(factura_pagos).values({
          factura_id: facturaId,
          medio_pago: medio,
          monto: dinero(total),
          referencia_transaccion: medio === 'efectivo' ? null : `DEMO-${consecutivo}`,
          fecha: venta.fecha,
        });
      });
    }

    // Cierre del turno con cuadre exacto (fondo inicial + efectivo vendido)
    await db
      .update(turnos_caja)
      .set({ fondo_final: dinero(100000 + efectivo), fecha_cierre: new Date(finJornada) })
      .where(eq(turnos_caja.id_turno_caja, turnoId));
  }
  console.log(`   ✔ Sucursal ${sucursalId}: ${totalFacturas} facturas en ${DIAS_DE_VENTAS} días`);
}

async function asegurarAlertas(db: Database, sucursalId: number, usuarioId: string) {
  for (const a of ALERTAS_DEMO) {
    const [existente] = await db
      .select({ id: alertas_admin.id_alerta_admin })
      .from(alertas_admin)
      .where(and(eq(alertas_admin.sucursal_id, sucursalId), eq(alertas_admin.motivo, a.motivo)))
      .limit(1);
    if (existente) continue;
    await db.insert(alertas_admin).values({
      usuario_id: usuarioId,
      sucursal_id: sucursalId,
      motivo: a.motivo,
      prioridad: a.prioridad,
      descripcion: a.descripcion,
      estado: a.estado,
      fecha_atencion: a.estado === 'atendido' ? new Date() : null,
    });
  }
}

// ─── Orquestación ────────────────────────────────────────────────────────────

export async function seedDemo(db: Database): Promise<void> {
  const password = leerPassword();
  console.log('\n🎬 Sembrando datos de demostración...');

  const [superAdmin] = await db
    .select({ id: usuarios.id_usuario })
    .from(usuarios)
    .where(eq(usuarios.email, SUPER_ADMIN_EMAIL))
    .limit(1);
  if (!superAdmin) {
    throw new Error(`❌ No existe ${SUPER_ADMIN_EMAIL}. Ejecuta primero deno task seed:dev.`);
  }

  const passwordHash = await argon2.hash(password);
  const aleatorio = crearAleatorio(2026);

  const sedes = await asegurarSucursales(db);
  const areasPorSede = await asegurarAreas(db, sedes);
  const cuentas = await asegurarPersonal(db, sedes, areasPorSede, passwordHash, superAdmin.id);
  const { productoIds, proveedorIds } = await asegurarCatalogo(db);
  const clienteIds = await asegurarClientes(db);

  const cajeros: Record<SucursalDemo['clave'], string> = {
    norte: cuentas.get('cajero1@warengine.local')!,
    centro: cuentas.get('cajero2@warengine.local')!,
  };

  for (const s of SUCURSALES_DEMO) {
    const sucursalId = sedes[s.clave];
    await asegurarStockInicial(db, sucursalId, productoIds, proveedorIds, superAdmin.id, aleatorio);
    await sembrarVentas(db, sucursalId, cajeros[s.clave], clienteIds, productoIds, aleatorio, s.clave === 'norte' ? 1.4 : 1);
    await ajustarMinimos(db, sucursalId, s.clave, productoIds);
  }
  await asegurarAlertas(db, sedes.norte, cajeros.norte);

  console.log('\n✅ Datos de demostración listos.');
  console.log('   Usuarios: admin.norte, cajero1, cajero2 y vendedor.b2b (@warengine.local) con SEED_DEMO_PASSWORD.');
}

if (import.meta.main) {
  const db = getDatabase();
  try {
    await seedDemo(db);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    Deno.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}
