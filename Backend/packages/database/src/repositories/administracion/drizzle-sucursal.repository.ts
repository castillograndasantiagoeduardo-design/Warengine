import { and, countDistinct, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { empleados, sucursales } from '../../schema/administracion.schema.ts';
import { roles, usuario_sucursales, usuarios } from '../../schema/autenticacion.schema.ts';
import { inventario_sucursal } from '../../schema/inventario.schema.ts';
import { clientes, facturas } from '../../schema/facturacion.schema.ts';
import {
  DatosSucursal,
  ISucursalRepository,
  Sucursal,
  SucursalDetalle,
  UsuarioAsignadoSucursal,
  VentaRecienteSucursal,
} from '@warengine/core';
import { sucursalFromRow } from '../../mappers/administracion/sucursal.mapper.ts';

export class DrizzleSucursalRepository implements ISucursalRepository {
  constructor(private readonly db: Database) {}

  public async listar(): Promise<Sucursal[]> {
    const rows = await this.db.select().from(sucursales).orderBy(sucursales.nombre);
    return rows.map(sucursalFromRow);
  }

  public async findById(id: number): Promise<Sucursal | null> {
    const [row] = await this.db
      .select()
      .from(sucursales)
      .where(eq(sucursales.id_sucursal, id))
      .limit(1);
    return row ? sucursalFromRow(row) : null;
  }

  public async findByNombre(nombre: string): Promise<Sucursal | null> {
    // Búsqueda case-insensitive: "Sucursal Norte" == "sucursal norte"
    const [row] = await this.db
      .select()
      .from(sucursales)
      .where(sql`LOWER(${sucursales.nombre}) = LOWER(${nombre})`)
      .limit(1);
    return row ? sucursalFromRow(row) : null;
  }

  public async crear(datos: DatosSucursal): Promise<Sucursal> {
    const [resultado] = await this.db.insert(sucursales).values({
      nombre: datos.nombre,
      direccion: datos.direccion ?? null,
      contacto: datos.contacto ?? null,
    });
    return (await this.findById(resultado.insertId)) as Sucursal;
  }

  public async actualizar(
    id: number,
    cambios: Partial<DatosSucursal> & { isActive?: boolean },
  ): Promise<Sucursal> {
    const set: Partial<typeof sucursales.$inferInsert> = {};
    if (cambios.nombre !== undefined) set.nombre = cambios.nombre;
    if (cambios.direccion !== undefined) set.direccion = cambios.direccion;
    if (cambios.contacto !== undefined) set.contacto = cambios.contacto;
    if (cambios.isActive !== undefined) set.is_active = cambios.isActive ? 1 : 0;

    await this.db.update(sucursales).set(set).where(eq(sucursales.id_sucursal, id));
    return (await this.findById(id)) as Sucursal;
  }

  public async contarUsuariosActivos(sucursalId: number): Promise<number> {
    const [resultado] = await this.db
      .select({ total: countDistinct(usuarios.id_usuario) })
      .from(usuarios)
      .innerJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .leftJoin(usuario_sucursales, eq(usuarios.id_usuario, usuario_sucursales.usuario_id))
      .where(
        and(
          eq(usuarios.is_active, 1),
          or(
            eq(empleados.sucursal_id, sucursalId),
            eq(usuario_sucursales.sucursal_id, sucursalId),
          ),
        ),
      );
    return Number(resultado?.total ?? 0);
  }

  /**
   * RF-ADM-C18: Consulta consolidada de ficha de detalle de sucursal.
   */
  public async obtenerDetalle(id: number): Promise<SucursalDetalle | null> {
    const [sucursalRow] = await this.db
      .select()
      .from(sucursales)
      .where(eq(sucursales.id_sucursal, id))
      .limit(1);

    if (!sucursalRow) {
      return null;
    }

    // 1. Usuarios asignados (por sede principal o asignación multisede)
    const usuariosRows = await this.db
      .select({
        id: usuarios.id_usuario,
        email: usuarios.email,
        nombre: empleados.nombre,
        cargo: empleados.cargo,
        rolId: roles.id_rol,
        rolNombre: roles.nombre,
        isActive: usuarios.is_active,
        empleadoSucursalId: empleados.sucursal_id,
      })
      .from(usuarios)
      .innerJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .innerJoin(roles, eq(usuarios.rol_id, roles.id_rol))
      .leftJoin(
        usuario_sucursales,
        and(
          eq(usuarios.id_usuario, usuario_sucursales.usuario_id),
          eq(usuario_sucursales.sucursal_id, id),
        ),
      )
      .where(
        or(
          eq(empleados.sucursal_id, id),
          eq(usuario_sucursales.sucursal_id, id),
        ),
      );

    const usuariosMap = new Map<string, UsuarioAsignadoSucursal>();
    for (const u of usuariosRows) {
      if (!usuariosMap.has(u.id)) {
        usuariosMap.set(u.id, {
          id: u.id,
          email: u.email,
          nombre: u.nombre,
          cargo: u.cargo ?? null,
          rolId: u.rolId,
          rolNombre: u.rolNombre,
          isActive: u.isActive === 1,
          esSedePrincipal: u.empleadoSucursalId === id,
        });
      }
    }
    const usuariosAsignados = Array.from(usuariosMap.values());

    // 2. Métricas de inventario con existencias
    const [stockMetrics] = await this.db
      .select({
        productosConStock: countDistinct(inventario_sucursal.producto_id),
        totalUnidadesStock: sql<number>`COALESCE(SUM(${inventario_sucursal.stock_actual}), 0)`,
      })
      .from(inventario_sucursal)
      .where(
        and(
          eq(inventario_sucursal.sucursal_id, id),
          sql`${inventario_sucursal.stock_actual} > 0`,
        ),
      );

    // 3. Métricas agregadas de ventas
    const [ventasMetrics] = await this.db
      .select({
        totalVentas: sql<number>`COUNT(*)`,
        montoTotalVentas: sql<number>`COALESCE(SUM(${facturas.total}), 0)`,
      })
      .from(facturas)
      .where(
        and(
          eq(facturas.sucursal_id, id),
          isNull(facturas.deleted_at),
        ),
      );

    // 4. Últimas 10 ventas recientes
    const facturasRecientesRows = await this.db
      .select({
        id: facturas.id_factura,
        consecutivo: facturas.consecutivo,
        fecha: facturas.fecha,
        total: facturas.total,
        estado: facturas.estado,
        clienteNombre: clientes.nombre_razon_social,
        clienteDocumento: clientes.numero_documento,
      })
      .from(facturas)
      .leftJoin(clientes, eq(facturas.cliente_id, clientes.id_cliente))
      .where(
        and(
          eq(facturas.sucursal_id, id),
          isNull(facturas.deleted_at),
        ),
      )
      .orderBy(desc(facturas.fecha), desc(facturas.consecutivo))
      .limit(10);

    const ventasRecientes: VentaRecienteSucursal[] = facturasRecientesRows.map((f) => ({
      id: f.id,
      consecutivo: f.consecutivo,
      fecha: f.fecha,
      total: Number(f.total),
      estado: f.estado,
      clienteNombre: f.clienteNombre ?? null,
      clienteDocumento: f.clienteDocumento ?? null,
    }));

    return new SucursalDetalle(
      sucursalRow.id_sucursal,
      sucursalRow.nombre,
      sucursalRow.direccion,
      sucursalRow.contacto,
      sucursalRow.is_active === 1,
      usuariosAsignados,
      {
        totalUsuariosAsignados: usuariosAsignados.length,
        productosConStock: Number(stockMetrics?.productosConStock ?? 0),
        totalUnidadesStock: Number(stockMetrics?.totalUnidadesStock ?? 0),
        totalVentas: Number(ventasMetrics?.totalVentas ?? 0),
        montoTotalVentas: Number(ventasMetrics?.montoTotalVentas ?? 0),
      },
      ventasRecientes,
    );
  }
}